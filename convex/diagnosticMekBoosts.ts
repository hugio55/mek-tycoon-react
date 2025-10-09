import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic query to compare ownedMeks data vs mekLevels table
 * Helps debug why green boost text isn't showing for all upgraded Meks
 */
export const compareMekDataSources = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get gold mining data (with ownedMeks array)
    const goldMiningData = await ctx.db
      .query("goldMining")
      .filter(q => q.eq(q.field("walletAddress"), args.walletAddress))
      .first();

    if (!goldMiningData) {
      return { error: "Wallet not found in goldMining table" };
    }

    // Get mekLevels data (source of truth for upgrades)
    const mekLevelsData = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    // Build comparison
    const comparison = goldMiningData.ownedMeks.map(ownedMek => {
      const mekLevel = mekLevelsData.find(level => level.assetId === ownedMek.assetId);

      return {
        assetName: ownedMek.assetName,
        assetId: ownedMek.assetId.substring(0, 20) + "...", // Shortened for readability

        // Data from ownedMeks (what the UI reads)
        ownedMeks_goldPerHour: ownedMek.goldPerHour, // ← CRITICAL: Should be base + boost
        ownedMeks_baseGoldPerHour: ownedMek.baseGoldPerHour,
        ownedMeks_levelBoostAmount: ownedMek.levelBoostAmount,
        ownedMeks_currentLevel: ownedMek.currentLevel,
        ownedMeks_effectiveGoldPerHour: ownedMek.effectiveGoldPerHour, // New field to check

        // Data from mekLevels table (source of truth)
        mekLevels_exists: !!mekLevel,
        mekLevels_currentLevel: mekLevel?.currentLevel,
        mekLevels_baseGoldPerHour: mekLevel?.baseGoldPerHour,
        mekLevels_currentBoostAmount: mekLevel?.currentBoostAmount,
        mekLevels_totalGoldSpent: mekLevel?.totalGoldSpent,

        // Calculated boost (what GoldLeaderboard uses)
        calculatedBoost: (ownedMek.goldPerHour || 0) - (ownedMek.baseGoldPerHour || ownedMek.goldPerHour),

        // Status
        hasBoost: !!mekLevel && (mekLevel.currentLevel > 1),
        boostShowsInUI: ((ownedMek.goldPerHour || 0) - (ownedMek.baseGoldPerHour || ownedMek.goldPerHour)) > 0,

        // Sync status
        inSync: !mekLevel || (
          ownedMek.currentLevel === mekLevel.currentLevel &&
          ownedMek.baseGoldPerHour === mekLevel.baseGoldPerHour &&
          ownedMek.levelBoostAmount === mekLevel.currentBoostAmount
        ),
      };
    });

    return {
      walletAddress: args.walletAddress,
      totalMeks: goldMiningData.ownedMeks.length,
      mekLevelsRecords: mekLevelsData.length,
      upgradedMeks: comparison.filter(m => m.hasBoost).length,
      boostsShowingInUI: comparison.filter(m => m.boostShowsInUI).length,
      outOfSync: comparison.filter(m => !m.inSync).length,
      comparison: comparison,
    };
  },
});

/**
 * Quick check to see if a wallet's data is in sync
 */
export const checkWalletSync = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await compareMekDataSources(ctx, args);

    if ('error' in result) {
      return result;
    }

    const outOfSyncMeks = result.comparison.filter(m => !m.inSync);

    return {
      walletAddress: args.walletAddress,
      isInSync: outOfSyncMeks.length === 0,
      summary: {
        totalMeks: result.totalMeks,
        upgradedMeks: result.upgradedMeks,
        boostsShowingInUI: result.boostsShowingInUI,
        outOfSync: result.outOfSync,
      },
      outOfSyncMeks: outOfSyncMeks.map(m => ({
        assetName: m.assetName,
        ownedLevel: m.ownedMeks_currentLevel,
        actualLevel: m.mekLevels_currentLevel,
        ownedBoost: m.ownedMeks_levelBoostAmount,
        actualBoost: m.mekLevels_currentBoostAmount,
      })),
    };
  },
});
