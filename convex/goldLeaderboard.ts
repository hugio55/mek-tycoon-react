import { v } from "convex/values";
import { query } from "./_generated/server";
import mekRarityMaster from './mekRarityMaster.json';

// Build lookup: Mek assetId -> sourceKey code
const mekNumberToSourceKey = new Map<string, string>();
mekRarityMaster.forEach((mek: any) => {
  if (mek.assetId && mek.sourceKey) {
    // Remove trailing letter suffix from sourceKey if present and convert to lowercase
    const cleanSourceKey = mek.sourceKey.replace(/-[A-Z]$/i, '').toLowerCase();
    // Store with leading zeros removed (assetId might be "0118" or "118")
    const normalizedId = parseInt(mek.assetId, 10).toString();
    mekNumberToSourceKey.set(normalizedId, cleanSourceKey);
  }
});

// Get top 3 miners with real-time cumulative gold calculations
// Each wallet = individual corporation (1 wallet = 1 corp)
export const getTopGoldMiners = query({
  args: {
    currentWallet: v.optional(v.string()),
    currentDiscordUserId: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet, currentDiscordUserId, guildId }) => {
    const now = Date.now();

    // Get all verified miners
    const allMiners = await ctx.db.query("goldMining").collect();

    const calculateGold = (miner: typeof allMiners[0]) => {
      let currentGold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return baseCumulativeGold + goldEarnedSinceLastUpdate;
    };

    const allEntries = [];

    // Show each wallet individually (1 wallet = 1 corp)
    for (const miner of allMiners) {
      // Skip non-verified wallets
      if (miner.isBlockchainVerified !== true) continue;

      const totalGold = calculateGold(miner);
      allEntries.push({
        walletAddress: miner.walletAddress,
        displayWallet: miner.companyName || (miner.walletAddress ?
          `${miner.walletAddress.slice(0, 8)}...${miner.walletAddress.slice(-6)}` :
          'Unknown'),
        currentGold: Math.floor(totalGold),
        hourlyRate: miner.totalGoldPerHour || 0,
        mekCount: miner.ownedMeks?.length || 0,
        isCurrentUser: currentWallet === miner.walletAddress,
        lastActive: miner.lastActiveTime || miner.lastLogin,
      });
    }

    // Sort by current gold (highest first) and take top 3
    const topMiners = allEntries
      .sort((a, b) => b.currentGold - a.currentGold)
      .slice(0, 3)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return topMiners;
  },
});

// Get wallet's Meks for the lightbox display
export const getWalletMeksForDisplay = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, { walletAddress }) => {
    // Get gold mining data (using index for better performance)
    const goldMiningData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMiningData || !goldMiningData.ownedMeks) {
      return {
        walletAddress,
        displayWallet: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
        meks: [],
        totalMeks: 0,
      };
    }

    // Get level data for the Meks (using index for better performance)
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
      .collect();

    // Create level map
    const levelMap = new Map(
      mekLevels.map(level => [level.assetId, level.currentLevel])
    );

    // Format Meks with their levels
    const meksWithLevels = goldMiningData.ownedMeks.map((mek, index) => {
      // Extract Mek number from assetName (e.g., "Mek #2922" -> 2922)
      const mekNumberMatch = mek.assetName.match(/#(\d+)/);
      const mekNumber = mekNumberMatch ? parseInt(mekNumberMatch[1], 10) : null;

      // Look up sourceKey code by Mek number
      const sourceKeyCode = mekNumber ? mekNumberToSourceKey.get(mekNumber.toString()) : null;

      return {
        assetId: mek.assetId,
        assetName: mek.assetName,
        level: levelMap.get(mek.assetId) || 1,
        goldPerHour: mek.goldPerHour,
        baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour, // Fallback to goldPerHour if base not available
        rarityRank: mek.rarityRank,
        imageUrl: sourceKeyCode ?
          `/mek-images/500px/${sourceKeyCode}.webp` :
          mek.imageUrl || null,
        sourceKey: sourceKeyCode, // SourceKey code from mekRarityMaster
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

    return {
      walletAddress,
      displayWallet: goldMiningData.companyName || `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
      meks: meksWithLevels,
      totalMeks: meksWithLevels.length,
      totalGoldPerHour: goldMiningData.totalGoldPerHour || 0,
    };
  },
});

// Get ALL corporations with real-time cumulative gold calculations
// Each wallet = individual corporation (1 wallet = 1 corp)
export const getAllCorporations = query({
  args: {
    currentWallet: v.optional(v.string()),
    currentDiscordUserId: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet, currentDiscordUserId, guildId }) => {
    const now = Date.now();

    // Get all verified miners
    const allMiners = await ctx.db.query("goldMining").collect();

    const calculateGold = (miner: typeof allMiners[0]) => {
      let currentGold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return baseCumulativeGold + goldEarnedSinceLastUpdate;
    };

    const allEntries = [];

    // Show each wallet individually (1 wallet = 1 corp)
    for (const miner of allMiners) {
      // Skip non-verified wallets
      if (miner.isBlockchainVerified !== true) continue;

      const totalGold = calculateGold(miner);
      allEntries.push({
        walletAddress: miner.walletAddress,
        displayWallet: miner.companyName || (miner.walletAddress ?
          `${miner.walletAddress.slice(0, 8)}...${miner.walletAddress.slice(-6)}` :
          'Unknown'),
        currentGold: Math.floor(totalGold),
        hourlyRate: miner.totalGoldPerHour || 0,
        mekCount: miner.ownedMeks?.length || 0,
        isCurrentUser: currentWallet === miner.walletAddress,
        lastActive: miner.lastActiveTime || miner.lastLogin,
      });
    }

    // Sort by current gold (highest first) and add rank
    const allCorporations = allEntries
      .sort((a, b) => b.currentGold - a.currentGold)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return allCorporations;
  },
});

// Get wallet details for a corporation (1 wallet = 1 corp)
export const getCorporationWalletDetails = query({
  args: {
    primaryWallet: v.string(),
  },
  handler: async (ctx, { primaryWallet }) => {
    const now = Date.now();

    // In the new model, each wallet is its own corporation
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", q => q.eq("walletAddress", primaryWallet))
      .first();

    if (!miner) return [];

    const calculateGold = (miner: typeof miner) => {
      let currentGold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return baseCumulativeGold + goldEarnedSinceLastUpdate;
    };

    return [{
      walletAddress: miner.walletAddress,
      displayWallet: miner.companyName || `${miner.walletAddress.slice(0, 8)}...${miner.walletAddress.slice(-6)}`,
      currentGold: Math.floor(calculateGold(miner)),
      hourlyRate: miner.totalGoldPerHour || 0,
      mekCount: miner.ownedMeks?.length || 0,
      nickname: null,
    }];
  },
});

// OPTIMIZED: Get top 3 from cache (uses ~0.001 GB instead of 1.03 GB)
export const getTopGoldMinersCached = query({
  args: {
    currentWallet: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet }) => {
    const cachedLeaderboard = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    // Return top 3 sorted by rank with full display info
    return cachedLeaderboard
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map(entry => ({
        walletAddress: entry.walletAddress,
        displayWallet: entry.username || (entry.walletAddress ?
          `${entry.walletAddress.slice(0, 8)}...${entry.walletAddress.slice(-6)}` :
          'Unknown'),
        currentGold: Math.floor(entry.value),
        hourlyRate: entry.metadata?.goldPerHour || 0,
        mekCount: entry.metadata?.mekDetails?.total || 0,
        isCurrentUser: currentWallet === entry.walletAddress,
        lastActive: entry.lastUpdated,
        rank: entry.rank,
      }));
  },
});

// OPTIMIZED: Get ALL from cache (uses ~0.001 GB instead of 1.33 GB)
export const getAllCorporationsCached = query({
  args: {
    currentWallet: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet }) => {
    const cachedLeaderboard = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    // Filter out entries with 0 gold and deduplicate by wallet address
    const seenWallets = new Set<string>();
    const filteredEntries = cachedLeaderboard
      .sort((a, b) => a.rank - b.rank)
      .filter(entry => {
        // Skip if 0 gold
        if (entry.value <= 0) return false;

        // Skip if duplicate wallet address (keep first occurrence)
        if (seenWallets.has(entry.walletAddress)) return false;
        seenWallets.add(entry.walletAddress);

        return true;
      });

    // Return filtered entries with full display info
    return filteredEntries.map(entry => ({
      walletAddress: entry.walletAddress,
      displayWallet: entry.username || (entry.walletAddress ?
        `${entry.walletAddress.slice(0, 8)}...${entry.walletAddress.slice(-6)}` :
        'Unknown'),
      currentGold: Math.floor(entry.value),
      hourlyRate: entry.metadata?.goldPerHour || 0,
      mekCount: entry.metadata?.mekDetails?.total || 0,
      isCurrentUser: currentWallet === entry.walletAddress,
      lastActive: entry.lastUpdated,
      rank: entry.rank,
    }));
  },
});

// Subscribe to real-time updates for the top 3 (from cache)
export const subscribeToTopMiners = query({
  args: {},
  handler: async (ctx) => {
    // This query will automatically re-run when leaderboardCache changes
    const cachedLeaderboard = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    // Return top 3 sorted by rank
    return cachedLeaderboard
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map(entry => ({
        walletAddress: entry.walletAddress,
        currentGold: Math.floor(entry.value),
        hourlyRate: entry.metadata?.goldPerHour || 0,
      }));
  },
});