import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * FINAL cleanup to remove all duplicate wallets
 * This ensures ONLY stake addresses remain
 */
export const removeAllNonStakeWallets = mutation({
  args: {},
  handler: async (ctx) => {
    const allWallets = await ctx.db.query("goldMining").collect();

    let deletedCount = 0;
    let preservedCount = 0;

    for (const wallet of allWallets) {
      // Delete ANY wallet that's not a stake address
      if (!wallet.walletAddress.startsWith('stake1')) {
        console.log(`Deleting non-stake wallet: ${wallet.walletAddress.substring(0, 30)}...`);
        await ctx.db.delete(wallet._id);
        deletedCount++;
      } else {
        preservedCount++;
      }
    }

    return {
      success: true,
      message: `Cleaned up ${deletedCount} non-stake wallets, preserved ${preservedCount} stake wallets`,
      deletedCount,
      preservedCount
    };
  }
});

/**
 * Merge specific duplicate for a user
 */
export const mergeUserDuplicates = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.stakeAddress.startsWith('stake1')) {
      return {
        success: false,
        error: "Please provide a stake address"
      };
    }

    // Find the stake address wallet
    const stakeWallet = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.stakeAddress))
      .first();

    // Find ALL other wallets that might be duplicates
    const allWallets = await ctx.db.query("goldMining").collect();
    const duplicates = allWallets.filter(w => {
      if (w.walletAddress === args.stakeAddress) return false; // Skip the stake wallet itself

      // Check if it's a duplicate by various patterns
      const stakeSuffix = args.stakeAddress.slice(-8);
      return (
        w.walletAddress.includes(stakeSuffix) ||
        w.walletAddress.includes('fe6012f1') || // Your hex suffix
        w.walletAddress.includes('ughgq076') || // Your stake suffix
        w.walletAddress.startsWith('01d9d9cf8225') || // Your hex prefix
        // Check if same MEK count (likely duplicate)
        (w.ownedMeks?.length === 45 && stakeWallet?.ownedMeks?.length === 45)
      );
    });

    if (duplicates.length === 0) {
      return {
        success: true,
        message: "No duplicates found",
        deletedCount: 0
      };
    }

    // If stake wallet exists, merge data from duplicates
    if (stakeWallet) {
      let totalAccumulatedGold = stakeWallet.accumulatedGold || 0;
      let bestGoldRate = stakeWallet.totalGoldPerHour || 0;
      let bestMeks = stakeWallet.ownedMeks || [];

      for (const dup of duplicates) {
        // Accumulate gold from duplicates
        totalAccumulatedGold += dup.accumulatedGold || 0;
        totalAccumulatedGold += dup.currentGold || 0;

        // Keep best gold rate
        if (dup.totalGoldPerHour > bestGoldRate) {
          bestGoldRate = dup.totalGoldPerHour;
        }

        // Keep MEKs if stake wallet has none
        if (bestMeks.length === 0 && dup.ownedMeks?.length > 0) {
          bestMeks = dup.ownedMeks;
        }
      }

      // Update stake wallet with merged data
      await ctx.db.patch(stakeWallet._id, {
        accumulatedGold: totalAccumulatedGold,
        totalGoldPerHour: bestGoldRate,
        ownedMeks: bestMeks,
        updatedAt: Date.now()
      });
    }

    // Delete all duplicates
    for (const dup of duplicates) {
      console.log(`Deleting duplicate: ${dup.walletAddress.substring(0, 30)}...`);
      await ctx.db.delete(dup._id);
    }

    return {
      success: true,
      message: `Deleted ${duplicates.length} duplicate wallets`,
      deletedCount: duplicates.length,
      deletedWallets: duplicates.map(d => d.walletAddress.substring(0, 30) + "...")
    };
  }
});