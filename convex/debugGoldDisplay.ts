import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check what's in the database for your wallet
export const debugWalletGold = query({
  args: {
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress }) => {
    // Get all wallets if no specific wallet provided
    const miners = walletAddress
      ? await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
          .collect()
      : await ctx.db.query("goldMining").collect();

    const now = Date.now();

    const debug = miners.map(miner => {
      const lastCheckpoint = miner.lastSnapshotTime || miner.lastActiveTime || miner.createdAt || now;
      const timeDiff = Math.max(0, now - lastCheckpoint);
      const hoursElapsed = timeDiff / (1000 * 60 * 60);
      const goldEarnedSinceLastUpdate = miner.isBlockchainVerified
        ? (miner.totalGoldPerHour || 0) * hoursElapsed
        : 0;

      return {
        walletAddress: miner.walletAddress,
        companyName: miner.companyName || null,
        isBlockchainVerified: miner.isBlockchainVerified || false,

        // Raw database fields
        totalCumulativeGold: miner.totalCumulativeGold || 0,
        accumulatedGold: miner.accumulatedGold || 0,
        totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
        totalGoldPerHour: miner.totalGoldPerHour || 0,

        // Calculated values
        baseCumulativeGold: miner.totalCumulativeGold || ((miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0)),
        goldEarnedSinceLastUpdate: goldEarnedSinceLastUpdate,
        currentGoldCalculated: (miner.totalCumulativeGold || ((miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0))) + goldEarnedSinceLastUpdate,

        // Time info
        lastSnapshotTime: miner.lastSnapshotTime || null,
        lastActiveTime: miner.lastActiveTime || null,
        createdAt: miner.createdAt,
        hoursElapsedSinceCheckpoint: hoursElapsed,

        // Mek info
        mekCount: miner.ownedMeks?.length || 0,
      };
    });

    return {
      count: miners.length,
      wallets: debug,
    };
  },
});
