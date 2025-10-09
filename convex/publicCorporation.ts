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
      .filter(q => q.eq(q.field("walletAddress"), identifier))
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
      currentGold = Math.min(50000, (goldMiningData.accumulatedGold || 0) + goldSinceLastUpdate);
    }

    const goldEarnedSinceLastUpdate = currentGold - (goldMiningData.accumulatedGold || 0);
    let baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;

    if (!goldMiningData.totalCumulativeGold || baseCumulativeGold === 0) {
      baseCumulativeGold = (goldMiningData.accumulatedGold || 0) + (goldMiningData.totalGoldSpentOnUpgrades || 0);
    }

    const totalCumulativeGold = baseCumulativeGold + goldEarnedSinceLastUpdate;

    // Calculate corporation rank
    const allMiners = await ctx.db.query("goldMining").collect();
    const minersWithGold = allMiners.map(miner => {
      let gold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner._creationTime;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        gold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }
      const earnedSinceUpdate = gold - (miner.accumulatedGold || 0);
      let baseCumulative = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulative === 0) {
        baseCumulative = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return {
        walletAddress: miner.walletAddress,
        totalCumulativeGold: baseCumulative + earnedSinceUpdate,
      };
    });

    const sortedMiners = minersWithGold.sort((a, b) => b.totalCumulativeGold - a.totalCumulativeGold);
    const rank = sortedMiners.findIndex(m => m.walletAddress === goldMiningData!.walletAddress) + 1;
    const totalCorporations = sortedMiners.length;

    // Get level data for the Meks
    const mekLevels = await ctx.db
      .query("mekLevels")
      .filter(q => q.eq(q.field("walletAddress"), goldMiningData!.walletAddress))
      .collect();

    const levelMap = new Map(
      mekLevels.map(level => [level.assetId, level.currentLevel])
    );

    // Format Meks with their levels
    const meksWithLevels = (goldMiningData.ownedMeks || []).map(mek => {
      const mekNumberMatch = mek.assetName.match(/#(\d+)/);
      const mekNumber = mekNumberMatch ? parseInt(mekNumberMatch[1], 10) : null;
      const sourceKeyCode = mekNumber ? mekNumberToSourceKey.get(mekNumber.toString()) : null;

      return {
        assetId: mek.assetId,
        assetName: mek.assetName,
        level: levelMap.get(mek.assetId) || 1,
        goldPerHour: mek.goldPerHour,
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
    meksWithLevels.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.goldPerHour - a.goldPerHour;
    });

    // Calculate average employee level
    const avgLevel = meksWithLevels.length > 0
      ? meksWithLevels.reduce((sum, mek) => sum + mek.level, 0) / meksWithLevels.length
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
