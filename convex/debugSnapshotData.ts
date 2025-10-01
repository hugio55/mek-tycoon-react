import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check what's in goldMining vs snapshots
export const debugWalletData = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get goldMining record
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // Get all snapshots
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return {
      goldMiningRecord: miner ? {
        totalGoldPerHour: miner.totalGoldPerHour,
        mekCount: miner.ownedMeks?.length || 0,
        lastSnapshotTime: miner.lastSnapshotTime,
        snapshotMekCount: miner.snapshotMekCount,
        createdAt: miner.createdAt,
      } : null,
      snapshotCount: snapshots.length,
      snapshots: snapshots.map(s => ({
        time: new Date(s.snapshotTime).toISOString(),
        mekCount: s.totalMekCount,
        goldPerHour: s.totalGoldPerHour,
        actualMeks: s.meks.length,
      })),
    };
  },
});

// Query to find all snapshots with suspicious 0s
export const findBadSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();

    const badSnapshots = [];

    for (const snapshot of allSnapshots) {
      // Get corresponding goldMining record
      const miner = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", snapshot.walletAddress))
        .first();

      // Flag if snapshot has 0 MEKs but goldMining has MEKs
      if (snapshot.totalMekCount === 0 && miner && miner.ownedMeks && miner.ownedMeks.length > 0) {
        badSnapshots.push({
          snapshotId: snapshot._id,
          walletAddress: snapshot.walletAddress,
          snapshotTime: new Date(snapshot.snapshotTime).toISOString(),
          snapshotMekCount: snapshot.totalMekCount,
          actualMekCount: miner.ownedMeks.length,
          goldPerHour: miner.totalGoldPerHour,
        });
      }
    }

    return {
      totalSnapshots: allSnapshots.length,
      badSnapshots: badSnapshots.length,
      details: badSnapshots,
    };
  },
});