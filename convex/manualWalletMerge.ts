import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { calculateCurrentGold } from "./lib/goldCalculations";

export const manualMergeWalletsBySuffix = mutation({
  args: {
    suffix: v.string(),
  },
  handler: async (ctx, args) => {
    const allRecords = await ctx.db.query("goldMining").collect();

    const matchingRecords = allRecords.filter((record: any) =>
      record.walletAddress.endsWith(args.suffix)
    );

    if (matchingRecords.length < 2) {
      return {
        success: false,
        message: `Only found ${matchingRecords.length} wallet(s) ending with ${args.suffix}`,
        wallets: matchingRecords.map((r: any) => r.walletAddress)
      };
    }

    const sorted = matchingRecords.sort((a, b) => a.createdAt - b.createdAt);
    const primary = sorted[0];
    const duplicates = sorted.slice(1);

    const now = Date.now();

    let totalAccumulatedGold = 0;
    for (const record of matchingRecords) {
      totalAccumulatedGold += calculateCurrentGold({
        accumulatedGold: record.accumulatedGold || 0,
        goldPerHour: record.totalGoldPerHour,
        lastSnapshotTime: record.lastSnapshotTime || record.updatedAt || record.createdAt,
        isVerified: true
      });
    }

    const highestGoldRate = Math.max(...matchingRecords.map((r: any) => r.totalGoldPerHour));
    const mostMeks = matchingRecords.reduce((max, r) =>
      (r.ownedMeks?.length || 0) > (max.ownedMeks?.length || 0) ? r : max
    , primary);

    await ctx.db.patch(primary._id, {
      ownedMeks: mostMeks.ownedMeks || primary.ownedMeks,
      totalGoldPerHour: highestGoldRate,
      accumulatedGold: totalAccumulatedGold, // CRITICAL FIX: Removed 50k cap during wallet merge
      isBlockchainVerified: matchingRecords.some((r: any) => r.isBlockchainVerified),
      lastSnapshotTime: now,
      updatedAt: now,
    });

    for (const dup of duplicates) {
      await ctx.db.delete(dup._id);
    }

    return {
      success: true,
      message: `Merged ${duplicates.length} duplicate(s) into wallet ${primary.walletAddress}`,
      primaryWallet: primary.walletAddress,
      deletedWallets: duplicates.map((d: any) => d.walletAddress),
      totalGold: totalAccumulatedGold, // FIXED: Removed cap for accurate display
      goldPerHour: highestGoldRate
    };
  }
});