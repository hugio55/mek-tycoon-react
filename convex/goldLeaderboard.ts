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
// BACKWARDS COMPATIBLE: Aggregates by wallet groups, shows ungrouped wallets individually
export const getTopGoldMiners = query({
  args: {
    currentWallet: v.optional(v.string()),
    currentDiscordUserId: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet, currentDiscordUserId, guildId }) => {
    const now = Date.now();

    // Get all miners
    const allMiners = await ctx.db.query("goldMining").collect();

    // Get all wallet group memberships
    const allMemberships = await ctx.db.query("walletGroupMemberships").collect();

    // Create map of wallet -> groupId
    const walletToGroupMap = new Map<string, string>();
    for (const membership of allMemberships) {
      walletToGroupMap.set(membership.walletAddress, membership.groupId);
    }

    // Get wallet groups
    const groups = await ctx.db.query("walletGroups").collect();
    const groupMap = new Map(groups.map(g => [g.groupId, g]));

    // Group miners by groupId OR keep separate if no group
    // ONLY include verified wallets
    const groupedMiners = new Map<string, typeof allMiners>();
    const ungroupedMiners: typeof allMiners = [];

    for (const miner of allMiners) {
      // Skip non-verified wallets
      if (miner.isBlockchainVerified !== true) continue;

      const groupId = walletToGroupMap.get(miner.walletAddress);
      if (groupId) {
        const existing = groupedMiners.get(groupId) || [];
        existing.push(miner);
        groupedMiners.set(groupId, existing);
      } else {
        ungroupedMiners.push(miner);
      }
    }

    const calculateGold = (miner: typeof allMiners[0]) => {
      let currentGold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return baseCumulativeGold + goldEarnedSinceLastUpdate;
    };

    const allEntries = [];

    // Add grouped wallets (corporations with multiple wallets)
    for (const [groupId, miners] of groupedMiners.entries()) {
      let totalGold = 0;
      let totalGoldPerHour = 0;
      let totalMeks = 0;
      let lastActive = 0;
      let companyName = '';

      for (const miner of miners) {
        totalGold += calculateGold(miner);
        totalGoldPerHour += miner.totalGoldPerHour || 0;
        totalMeks += miner.ownedMeks?.length || 0;
        if (miner.companyName) companyName = miner.companyName;
        const miningLastActive = miner.lastActiveTime || miner.lastLogin || 0;
        if (miningLastActive > lastActive) lastActive = miningLastActive;
      }

      const group = groupMap.get(groupId);
      const isCurrentUserGroup = miners.some(m => m.walletAddress === currentWallet);

      allEntries.push({
        walletAddress: group?.primaryWallet || miners[0].walletAddress,
        displayWallet: companyName || (group?.primaryWallet ?
          `${group.primaryWallet.slice(0, 8)}...${group.primaryWallet.slice(-6)}` :
          'Corporation'),
        currentGold: Math.floor(totalGold),
        hourlyRate: totalGoldPerHour,
        mekCount: totalMeks,
        isCurrentUser: isCurrentUserGroup,
        lastActive,
      });
    }

    // Add ungrouped wallets (backwards compatible - single wallets)
    for (const miner of ungroupedMiners) {
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
// BACKWARDS COMPATIBLE: Aggregates by wallet groups, shows ungrouped wallets individually
export const getAllCorporations = query({
  args: {
    currentWallet: v.optional(v.string()),
    currentDiscordUserId: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { currentWallet, currentDiscordUserId, guildId }) => {
    const now = Date.now();

    // Get all miners
    const allMiners = await ctx.db.query("goldMining").collect();

    // Get all wallet group memberships
    const allMemberships = await ctx.db.query("walletGroupMemberships").collect();

    // Create map of wallet -> groupId
    const walletToGroupMap = new Map<string, string>();
    for (const membership of allMemberships) {
      walletToGroupMap.set(membership.walletAddress, membership.groupId);
    }

    // Get wallet groups
    const groups = await ctx.db.query("walletGroups").collect();
    const groupMap = new Map(groups.map(g => [g.groupId, g]));

    // Group miners by groupId OR keep separate if no group
    // ONLY include verified wallets
    const groupedMiners = new Map<string, typeof allMiners>();
    const ungroupedMiners: typeof allMiners = [];

    for (const miner of allMiners) {
      // Skip non-verified wallets
      if (miner.isBlockchainVerified !== true) continue;

      const groupId = walletToGroupMap.get(miner.walletAddress);
      if (groupId) {
        const existing = groupedMiners.get(groupId) || [];
        existing.push(miner);
        groupedMiners.set(groupId, existing);
      } else {
        ungroupedMiners.push(miner);
      }
    }

    const calculateGold = (miner: typeof allMiners[0]) => {
      let currentGold = miner.accumulatedGold || 0;
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }
      return baseCumulativeGold + goldEarnedSinceLastUpdate;
    };

    const allEntries = [];

    // Add grouped wallets (corporations with multiple wallets)
    for (const [groupId, miners] of groupedMiners.entries()) {
      let totalGold = 0;
      let totalGoldPerHour = 0;
      let totalMeks = 0;
      let lastActive = 0;
      let companyName = '';

      for (const miner of miners) {
        totalGold += calculateGold(miner);
        totalGoldPerHour += miner.totalGoldPerHour || 0;
        totalMeks += miner.ownedMeks?.length || 0;
        if (miner.companyName) companyName = miner.companyName;
        const miningLastActive = miner.lastActiveTime || miner.lastLogin || 0;
        if (miningLastActive > lastActive) lastActive = miningLastActive;
      }

      const group = groupMap.get(groupId);
      const isCurrentUserGroup = miners.some(m => m.walletAddress === currentWallet);

      allEntries.push({
        walletAddress: group?.primaryWallet || miners[0].walletAddress,
        displayWallet: companyName || (group?.primaryWallet ?
          `${group.primaryWallet.slice(0, 8)}...${group.primaryWallet.slice(-6)}` :
          'Corporation'),
        currentGold: Math.floor(totalGold),
        hourlyRate: totalGoldPerHour,
        mekCount: totalMeks,
        isCurrentUser: isCurrentUserGroup,
        lastActive,
      });
    }

    // Add ungrouped wallets (backwards compatible - single wallets)
    for (const miner of ungroupedMiners) {
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

// Get individual wallet details for a corporation (by primary wallet address)
export const getCorporationWalletDetails = query({
  args: {
    primaryWallet: v.string(),
  },
  handler: async (ctx, { primaryWallet }) => {
    const now = Date.now();

    // Find the group by primary wallet
    const group = await ctx.db
      .query("walletGroups")
      .filter(q => q.eq(q.field("primaryWallet"), primaryWallet))
      .first();

    if (!group) {
      // Not a corporation, return single wallet (using index for better performance)
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
          currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
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
    }

    // Get all wallets in the group
    const memberships = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_group", q => q.eq("groupId", group.groupId))
      .collect();

    const walletDetails = [];

    for (const membership of memberships) {
      const miner = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", q => q.eq("walletAddress", membership.walletAddress))
        .first();

      if (!miner) continue;

      const calculateGold = (miner: typeof miner) => {
        let currentGold = miner.accumulatedGold || 0;
        if (miner.isBlockchainVerified === true) {
          const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
          const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
          const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
          currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
        }
        const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
        let baseCumulativeGold = miner.totalCumulativeGold || 0;
        if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
          baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
        }
        return baseCumulativeGold + goldEarnedSinceLastUpdate;
      };

      walletDetails.push({
        walletAddress: membership.walletAddress,
        displayWallet: membership.nickname || `stake${membership.walletAddress.slice(5, 9)}...${membership.walletAddress.slice(-4)}`,
        currentGold: Math.floor(calculateGold(miner)),
        hourlyRate: miner.totalGoldPerHour || 0,
        mekCount: miner.ownedMeks?.length || 0,
        nickname: membership.nickname || null,
      });
    }

    // Sort by current gold (highest first)
    return walletDetails.sort((a, b) => b.currentGold - a.currentGold);
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

    // Return all cached entries with full display info
    return cachedLeaderboard
      .sort((a, b) => a.rank - b.rank)
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