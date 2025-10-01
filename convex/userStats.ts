import { v } from "convex/values";
import { query } from "./_generated/server";
import { calculateCurrentGold } from "./lib/goldCalculations";

export const getUserStats = query({
  args: {
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If no wallet address provided, return default stats
    if (!args.walletAddress) {
      return {
        mekCount: 0,
        totalCumulativeGold: 0,
        currentGold: 0,
        goldPerHour: 0,
      };
    }

    // Get the goldMining record for this wallet
    const goldMiner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiner) {
      return {
        mekCount: 0,
        totalCumulativeGold: 0,
        currentGold: 0,
        goldPerHour: 0,
      };
    }

    // Calculate current gold (respecting verification status and snapshot failures)
    const currentGold = calculateCurrentGold({
      accumulatedGold: goldMiner.accumulatedGold || 0,
      goldPerHour: goldMiner.totalGoldPerHour,
      lastSnapshotTime: goldMiner.lastSnapshotTime || goldMiner.updatedAt || goldMiner.createdAt,
      isVerified: goldMiner.isBlockchainVerified === true,
      consecutiveSnapshotFailures: goldMiner.consecutiveSnapshotFailures || 0
    });

    const goldEarnedSinceLastUpdate = currentGold - (goldMiner.accumulatedGold || 0);

    // Calculate cumulative gold in real-time
    // Start with the stored cumulative gold
    let baseCumulativeGold = goldMiner.totalCumulativeGold || 0;

    // If totalCumulativeGold isn't set yet, estimate from current accumulated gold
    if (!goldMiner.totalCumulativeGold) {
      baseCumulativeGold = (goldMiner.accumulatedGold || 0) + (goldMiner.totalGoldSpentOnUpgrades || 0);
    }

    // Add the gold earned since last update (this makes it real-time)
    // Only add if verified (same as current gold calculation)
    const totalCumulativeGold = baseCumulativeGold + goldEarnedSinceLastUpdate;

    return {
      mekCount: goldMiner.ownedMeks.length,
      totalCumulativeGold: Math.floor(totalCumulativeGold),
      currentGold: Math.floor(currentGold),
      goldPerHour: goldMiner.totalGoldPerHour,
    };
  },
});