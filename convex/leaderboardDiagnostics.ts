import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Diagnostic query to check leaderboard cache and goldMining data
 */
export const diagnoseLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    // Get top 10 from leaderboardCache
    const cachedEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .order("asc")
      .take(10);

    // Get top 10 from goldMining (by MEK count as proxy)
    const allMiners = await ctx.db.query("goldMining").collect();
    const topMiners = allMiners
      .sort((a, b) => (b.ownedMeks?.length || 0) - (a.ownedMeks?.length || 0))
      .slice(0, 10);

    return {
      cache: cachedEntries.map(entry => ({
        rank: entry.rank,
        walletAddress: entry.walletAddress,
        username: entry.username,
        value: entry.value,
        goldPerHour: entry.metadata?.goldPerHour,
        mekCount: entry.metadata?.mekDetails?.total,
        lastUpdated: new Date(entry.lastUpdated).toISOString(),
      })),
      goldMining: topMiners.map(miner => ({
        walletAddress: miner.walletAddress,
        companyName: miner.companyName,
        companyNameType: typeof miner.companyName,
        mekCount: miner.ownedMeks?.length || 0,
        goldPerHour: miner.totalGoldPerHour || 0,
        accumulatedGold: miner.accumulatedGold || 0,
        cumulativeGold: miner.totalCumulativeGold || 0,
        isVerified: miner.isBlockchainVerified,
      })),
    };
  },
});

/**
 * Force rebuild the leaderboard cache immediately
 */
export const forceRebuildLeaderboard = mutation({
  args: {},
  handler: async (ctx) => {
    // Trigger the leaderboard update job
    await ctx.scheduler.runAfter(0, internal.leaderboardUpdater.updateGoldLeaderboard, {});

    return {
      success: true,
      message: "Leaderboard rebuild scheduled",
    };
  },
});

/**
 * Check for corrupted company names (numbers-only names)
 */
export const findCorruptedCompanyNames = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    const corrupted = allMiners
      .filter(miner => {
        if (!miner.companyName) return false;
        // Check if companyName is just a number
        return /^\d+$/.test(miner.companyName);
      })
      .map(miner => ({
        walletAddress: miner.walletAddress,
        companyName: miner.companyName,
        mekCount: miner.ownedMeks?.length || 0,
        goldPerHour: miner.totalGoldPerHour || 0,
      }));

    return {
      count: corrupted.length,
      corrupted,
    };
  },
});

/**
 * Clear corrupted numeric company names
 */
export const clearCorruptedCompanyNames = mutation({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, { confirm }) => {
    if (!confirm) {
      return {
        success: false,
        error: "Must pass confirm: true to execute",
      };
    }

    const allMiners = await ctx.db.query("goldMining").collect();

    let cleared = 0;
    for (const miner of allMiners) {
      // Clear company names that are just numbers
      if (miner.companyName && /^\d+$/.test(miner.companyName)) {
        await ctx.db.patch(miner._id, {
          companyName: undefined,
        });
        cleared++;
      }
    }

    // Trigger leaderboard rebuild
    await ctx.scheduler.runAfter(0, internal.leaderboardUpdater.updateGoldLeaderboard, {});

    return {
      success: true,
      cleared,
      message: `Cleared ${cleared} corrupted company names and triggered leaderboard rebuild`,
    };
  },
});
