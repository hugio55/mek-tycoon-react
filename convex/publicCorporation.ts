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

// Phase II: Public query to get corporation data by wallet address or company name
// Uses users table for identity + meks table for owned Meks (no goldMining)
export const getCorporationData = query({
  args: {
    identifier: v.string(), // Can be wallet address or company name
  },
  handler: async (ctx, { identifier }) => {
    const now = Date.now();

    // Phase II: Find in users table by stake address
    let userData = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", identifier))
      .first();

    // If not found by wallet, try by corporation name (case insensitive)
    if (!userData) {
      const allUsers = await ctx.db.query("users").collect();
      userData = allUsers.find(
        user => user.corporationName?.toLowerCase() === identifier.toLowerCase()
      ) || null;
    }

    if (!userData || !userData.stakeAddress) {
      return null;
    }

    const walletAddress = userData.stakeAddress;

    // Phase II: Get owned Meks from meks table
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", walletAddress))
      .collect();

    // Get level data for the Meks
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
      .collect();

    const levelMap = new Map(
      mekLevels.map((level: any) => [level.assetId, level.currentLevel])
    );

    // Format Meks with their levels
    const meksWithLevels = ownedMeks.map((mek: any) => {
      const mekNumberMatch = mek.assetName?.match(/#(\d+)/);
      const mekNumber = mekNumberMatch ? parseInt(mekNumberMatch[1], 10) : null;
      const sourceKeyCode = mekNumber ? mekNumberToSourceKey.get(mekNumber.toString()) : null;

      return {
        assetId: mek.assetId,
        assetName: mek.assetName,
        level: levelMap.get(mek.assetId) || 1,
        // Phase II: Gold rate fields REMOVED - income comes from Job Slots
        rarityRank: mek.rarityRank,
        imageUrl: sourceKeyCode ?
          `/mek-images/500px/${sourceKeyCode}.webp` :
          null,
        sourceKey: sourceKeyCode,
        mekNumber: mekNumber,
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        itemVariation: mek.itemVariation,
      };
    });

    // Sort by level, then by rarity rank (lower rank = rarer)
    meksWithLevels.sort((a: any, b: any) => {
      if (b.level !== a.level) return b.level - a.level;
      return (a.rarityRank || 9999) - (b.rarityRank || 9999);
    });

    // Calculate average employee level
    const avgLevel = meksWithLevels.length > 0
      ? meksWithLevels.reduce((sum: number, mek: any) => sum + mek.level, 0) / meksWithLevels.length
      : 0;

    // Calculate corporation age
    const createdAt = userData._creationTime || now;
    const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Phase II: totalGoldPerHour calculation REMOVED - income comes from Job Slots

    // Calculate corporation rank using cached leaderboard
    const cachedLeaderboard = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    const rank = cachedLeaderboard.find((entry: any) => entry.walletAddress === walletAddress)?.rank ||
                 cachedLeaderboard.length + 1;
    const totalCorporations = cachedLeaderboard.length;

    // Phase II: Corporation name from users table
    const companyName = userData.corporationName || `Corporation ${walletAddress.slice(0, 6)}`;

    return {
      walletAddress,
      companyName,
      displayWallet: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
      totalCumulativeGold: Math.floor(userData.gold || 0),
      goldPerHour: 0, // Phase II: Passive gold income removed - income comes from Job Slots
      mekCount: meksWithLevels.length,
      rank,
      totalCorporations,
      meks: meksWithLevels,
      averageLevel: avgLevel,
      corporationAge: ageInDays,
      isBlockchainVerified: userData.walletVerified === true,
    };
  },
});
