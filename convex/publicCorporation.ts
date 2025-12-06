import { v } from "convex/values";
import { query } from "./_generated/server";
import mekRarityMaster from './mekRarityMaster.json';

// Build lookup: Mek assetId -> sourceKey code
const mekNumberToSourceKey = new Map<string, string>();
mekRarityMaster.forEach((mek: any) => {
  if (mek.assetId && mek.sourceKey) {
    const cleanSourceKey = mek.sourceKey.replace(/-[A-Z]$/i, '').toLowerCase();
    const normalizedId = parseInt(mek.assetId, 10).toString();
    mekNumberToSourceKey.set(normalizedId, cleanSourceKey);
  }
});

// Public query to get corporation data by wallet address or company name
export const getCorporationData = query({
  args: {
    identifier: v.string(), // Can be wallet address or company name
  },
  handler: async (ctx, { identifier }) => {
    const now = Date.now();

    // Try to find by wallet address first
    let goldMiningData = await ctx.db
      .query("goldMining")
      .filter((q: any) => q.eq(q.field("walletAddress"), identifier))
      .first();

    // If not found, try to find by company name (case insensitive)
    if (!goldMiningData) {
      const allMiners = await ctx.db.query("goldMining").collect();
      goldMiningData = allMiners.find(
        miner => miner.companyName?.toLowerCase() === identifier.toLowerCase()
      ) || null;
    }

    if (!goldMiningData) {
      return null;
    }

    // Calculate current cumulative gold
    let currentGold = goldMiningData.accumulatedGold || 0;

    if (goldMiningData.isBlockchainVerified === true) {
      const lastUpdateTime = goldMiningData.lastSnapshotTime || goldMiningData._creationTime;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = (goldMiningData.totalGoldPerHour || 0) * hoursSinceLastUpdate;
      // CRITICAL FIX: NO CAP - show true uncapped gold balance
      currentGold = (goldMiningData.accumulatedGold || 0) + goldSinceLastUpdate;
    }

    const goldEarnedSinceLastUpdate = currentGold - (goldMiningData.accumulatedGold || 0);
    let baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;

    if (!goldMiningData.totalCumulativeGold || baseCumulativeGold === 0) {
      baseCumulativeGold = (goldMiningData.accumulatedGold || 0) + (goldMiningData.totalGoldSpentOnUpgrades || 0);
    }

    const totalCumulativeGold = baseCumulativeGold + goldEarnedSinceLastUpdate;

    // Calculate corporation rank using cached leaderboard (much faster)
    const cachedLeaderboard = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    const rank = cachedLeaderboard.find((entry: any) => entry.walletAddress === goldMiningData.walletAddress)?.rank ||
                 cachedLeaderboard.length + 1; // If not in cache, they're below all cached entries
    const totalCorporations = cachedLeaderboard.length;

    // Get level data for the Meks (using index for better performance)
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", q => q.eq("walletAddress", goldMiningData!.walletAddress))
      .collect();

    const levelMap = new Map(
      mekLevels.map((level: any) => [level.assetId, level.currentLevel])
    );

    // Format Meks with their levels
    const meksWithLevels = (goldMiningData.ownedMeks || []).map((mek: any) => {
      const mekNumberMatch = mek.assetName.match(/#(\d+)/);
      const mekNumber = mekNumberMatch ? parseInt(mekNumberMatch[1], 10) : null;
      const sourceKeyCode = mekNumber ? mekNumberToSourceKey.get(mekNumber.toString()) : null;

      return {
        assetId: mek.assetId,
        assetName: mek.assetName,
        level: levelMap.get(mek.assetId) || 1,
        goldPerHour: mek.effectiveGoldPerHour || mek.goldPerHour,
        baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour,
        rarityRank: mek.rarityRank,
        imageUrl: sourceKeyCode ?
          `/mek-images/500px/${sourceKeyCode}.webp` :
          mek.imageUrl || null,
        sourceKey: sourceKeyCode,
        mekNumber: mekNumber,
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        itemVariation: mek.itemVariation,
      };
    });

    // Sort by level, then by gold rate
    meksWithLevels.sort((a: any, b: any) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.goldPerHour - a.goldPerHour;
    });

    // Calculate average employee level
    const avgLevel = meksWithLevels.length > 0
      ? meksWithLevels.reduce((sum: any, mek: any) => sum + mek.level, 0) / meksWithLevels.length
      : 0;

    // Calculate corporation age
    const createdAt = goldMiningData._creationTime;
    const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    return {
      walletAddress: goldMiningData.walletAddress,
      companyName: goldMiningData.companyName || `Corporation ${goldMiningData.walletAddress.slice(0, 6)}`,
      displayWallet: `${goldMiningData.walletAddress.slice(0, 8)}...${goldMiningData.walletAddress.slice(-6)}`,
      totalCumulativeGold: Math.floor(totalCumulativeGold),
      goldPerHour: goldMiningData.totalGoldPerHour || 0,
      mekCount: meksWithLevels.length,
      rank,
      totalCorporations,
      meks: meksWithLevels,
      averageLevel: avgLevel,
      corporationAge: ageInDays,
      isBlockchainVerified: goldMiningData.isBlockchainVerified === true,
    };
  },
});
