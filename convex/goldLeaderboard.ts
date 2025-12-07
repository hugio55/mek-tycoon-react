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

    // PHASE II: Collect miners from BOTH new tables and legacy table, then merge
    const allMiners: any[] = [];
    const seenWallets = new Set<string>();

    // First: Get miners from new normalized tables
    const allMiningStates = await ctx.db.query("goldMiningState").collect();
    const allUsers = await ctx.db.query("users").collect();

    // Build user lookup by stakeAddress
    const userByStake = new Map<string, any>();
    for (const user of allUsers) {
      if (user.stakeAddress) {
        userByStake.set(user.stakeAddress, user);
      }
    }

    // Build mek counts by stakeAddress
    const allMeks = await ctx.db.query("meks").collect();
    const mekCountByStake = new Map<string, number>();
    for (const mek of allMeks) {
      if (mek.ownerStakeAddress) {
        mekCountByStake.set(mek.ownerStakeAddress, (mekCountByStake.get(mek.ownerStakeAddress) || 0) + 1);
      }
    }

    // Add miners from new tables
    for (const miningState of allMiningStates) {
      const stakeAddr = miningState.stakeAddress;
      if (!stakeAddr) continue;

      const user = userByStake.get(stakeAddr);
      const walletAddress = stakeAddr; // Use stakeAddress as primary identifier

      seenWallets.add(walletAddress);

      allMiners.push({
        walletAddress,
        companyName: user?.companyName,
        accumulatedGold: miningState.accumulatedGold || 0,
        isBlockchainVerified: miningState.isBlockchainVerified,
        lastSnapshotTime: miningState.lastSnapshotTime,
        updatedAt: miningState.updatedAt,
        createdAt: miningState.createdAt,
        totalGoldPerHour: miningState.totalGoldPerHour || 0,
        totalCumulativeGold: miningState.totalCumulativeGold || 0,
        totalGoldSpentOnUpgrades: miningState.totalGoldSpentOnUpgrades || 0,
        mekCount: mekCountByStake.get(stakeAddr) || 0,
        lastActiveTime: miningState.lastActiveTime,
        _source: "newTables",
      });
    }

    // Second: Get miners from legacy goldMining table (avoid duplicates)
    const legacyMiners = await ctx.db.query("goldMining").collect();
    for (const miner of legacyMiners) {
      if (!miner.walletAddress || seenWallets.has(miner.walletAddress)) continue;
      seenWallets.add(miner.walletAddress);

      allMiners.push({
        walletAddress: miner.walletAddress,
        companyName: miner.companyName,
        accumulatedGold: miner.accumulatedGold || 0,
        isBlockchainVerified: miner.isBlockchainVerified,
        lastSnapshotTime: miner.lastSnapshotTime,
        updatedAt: miner.updatedAt,
        createdAt: miner.createdAt,
        totalGoldPerHour: miner.totalGoldPerHour || 0,
        totalCumulativeGold: miner.totalCumulativeGold || 0,
        totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
        mekCount: miner.ownedMeks?.length || 0,
        lastActiveTime: miner.lastActiveTime || miner.lastLogin,
        _source: "legacyTable",
      });
    }

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
        mekCount: miner.mekCount || 0,
        isCurrentUser: currentWallet === miner.walletAddress,
        lastActive: miner.lastActiveTime,
      });
    }

    // Sort by current gold (highest first) and take top 3
    const topMiners = allEntries
      .sort((a: any, b: any) => b.currentGold - a.currentGold)
      .slice(0, 3)
      .map((entry: any, index: number) => ({
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
    // PHASE II: Try new normalized tables first
    let user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress))
      .first();

    // Fallback: try legacy walletAddress field on users table
    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("walletAddress"), walletAddress))
        .first();
    }

    if (user) {
      const stakeAddr = user.stakeAddress || walletAddress;

      // Get meks from new table
      const ownedMeks = await ctx.db
        .query("meks")
        .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", stakeAddr))
        .collect();

      // Get company name from users table
      const companyName = user.companyName;

      // Get mining state for totalGoldPerHour
      const miningState = await ctx.db
        .query("goldMiningState")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddr))
        .first();

      if (ownedMeks.length > 0) {
        // Get level data for the Meks
        const mekLevels = await ctx.db
          .query("mekLevels")
          .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
          .collect();

        const levelMap = new Map(
          mekLevels.map((level: any) => [level.assetId, level.currentLevel])
        );

        const meksWithLevels = ownedMeks.map((mek: any) => {
          const mekNumberMatch = mek.assetName?.match(/#(\d+)/);
          const mekNumber = mekNumberMatch ? parseInt(mekNumberMatch[1], 10) : null;
          const sourceKeyCode = mekNumber ? mekNumberToSourceKey.get(mekNumber.toString()) : null;

          return {
            assetId: mek.assetId,
            assetName: mek.assetName,
            level: levelMap.get(mek.assetId) || mek.currentLevel || 1,
            goldPerHour: mek.goldPerHour || 0,
            baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
            rarityRank: mek.rarityRank,
            imageUrl: sourceKeyCode ? `/mek-images/500px/${sourceKeyCode}.webp` : mek.imageUrl || null,
            sourceKey: sourceKeyCode,
            mekNumber: mekNumber,
            headVariation: mek.headVariation,
            bodyVariation: mek.bodyVariation,
            itemVariation: mek.itemVariation,
          };
        });

        meksWithLevels.sort((a: any, b: any) => {
          if (b.level !== a.level) return b.level - a.level;
          return b.goldPerHour - a.goldPerHour;
        });

        return {
          walletAddress,
          displayWallet: companyName || `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
          meks: meksWithLevels,
          totalMeks: meksWithLevels.length,
          totalGoldPerHour: miningState?.totalGoldPerHour || 0,
          _source: "newTables",
        };
      }
    }

    // LEGACY FALLBACK: Try old goldMining table
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
      mekLevels.map((level: any) => [level.assetId, level.currentLevel])
    );

    // Format Meks with their levels
    const meksWithLevels = goldMiningData.ownedMeks.map((mek: any, index: number) => {
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
    meksWithLevels.sort((a: any, b: any) => {
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

    // PHASE II: Collect miners from BOTH new tables and legacy table, then merge
    const allMiners: any[] = [];
    const seenWallets = new Set<string>();

    // First: Get miners from new normalized tables
    const allMiningStates = await ctx.db.query("goldMiningState").collect();
    const allUsers = await ctx.db.query("users").collect();

    // Build user lookup by stakeAddress
    const userByStake = new Map<string, any>();
    for (const user of allUsers) {
      if (user.stakeAddress) {
        userByStake.set(user.stakeAddress, user);
      }
    }

    // Build mek counts by stakeAddress
    const allMeks = await ctx.db.query("meks").collect();
    const mekCountByStake = new Map<string, number>();
    for (const mek of allMeks) {
      if (mek.ownerStakeAddress) {
        mekCountByStake.set(mek.ownerStakeAddress, (mekCountByStake.get(mek.ownerStakeAddress) || 0) + 1);
      }
    }

    // Add miners from new tables
    for (const miningState of allMiningStates) {
      const stakeAddr = miningState.stakeAddress;
      if (!stakeAddr) continue;

      const user = userByStake.get(stakeAddr);
      const walletAddress = stakeAddr;

      seenWallets.add(walletAddress);

      allMiners.push({
        walletAddress,
        companyName: user?.companyName,
        accumulatedGold: miningState.accumulatedGold || 0,
        isBlockchainVerified: miningState.isBlockchainVerified,
        lastSnapshotTime: miningState.lastSnapshotTime,
        updatedAt: miningState.updatedAt,
        createdAt: miningState.createdAt,
        totalGoldPerHour: miningState.totalGoldPerHour || 0,
        totalCumulativeGold: miningState.totalCumulativeGold || 0,
        totalGoldSpentOnUpgrades: miningState.totalGoldSpentOnUpgrades || 0,
        mekCount: mekCountByStake.get(stakeAddr) || 0,
        lastActiveTime: miningState.lastActiveTime,
        _source: "newTables",
      });
    }

    // Second: Get miners from legacy goldMining table (avoid duplicates)
    const legacyMiners = await ctx.db.query("goldMining").collect();
    for (const miner of legacyMiners) {
      if (!miner.walletAddress || seenWallets.has(miner.walletAddress)) continue;
      seenWallets.add(miner.walletAddress);

      allMiners.push({
        walletAddress: miner.walletAddress,
        companyName: miner.companyName,
        accumulatedGold: miner.accumulatedGold || 0,
        isBlockchainVerified: miner.isBlockchainVerified,
        lastSnapshotTime: miner.lastSnapshotTime,
        updatedAt: miner.updatedAt,
        createdAt: miner.createdAt,
        totalGoldPerHour: miner.totalGoldPerHour || 0,
        totalCumulativeGold: miner.totalCumulativeGold || 0,
        totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
        mekCount: miner.ownedMeks?.length || 0,
        lastActiveTime: miner.lastActiveTime || miner.lastLogin,
        _source: "legacyTable",
      });
    }

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
        mekCount: miner.mekCount || 0,
        isCurrentUser: currentWallet === miner.walletAddress,
        lastActive: miner.lastActiveTime,
      });
    }

    // Sort by current gold (highest first) and add rank
    const allCorporations = allEntries
      .sort((a: any, b: any) => b.currentGold - a.currentGold)
      .map((entry: any, index: number) => ({
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

    // PHASE II: Try new normalized tables first
    let user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", primaryWallet))
      .first();

    // Fallback: try legacy walletAddress field on users table
    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("walletAddress"), primaryWallet))
        .first();
    }

    if (user) {
      const stakeAddr = user.stakeAddress || primaryWallet;

      // Get mining state
      const miningState = await ctx.db
        .query("goldMiningState")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddr))
        .first();

      // Get meks count
      const ownedMeks = await ctx.db
        .query("meks")
        .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", stakeAddr))
        .collect();

      if (miningState || ownedMeks.length > 0) {
        const calculateGoldFromNewTables = () => {
          let currentGold = miningState?.accumulatedGold || 0;
          if (miningState?.isBlockchainVerified === true) {
            const lastUpdateTime = miningState.lastSnapshotTime || miningState.updatedAt || miningState.createdAt;
            const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
            const goldSinceLastUpdate = (miningState.totalGoldPerHour || 0) * hoursSinceLastUpdate;
            currentGold = (miningState.accumulatedGold || 0) + goldSinceLastUpdate;
          }
          const goldEarnedSinceLastUpdate = currentGold - (miningState?.accumulatedGold || 0);
          let baseCumulativeGold = miningState?.totalCumulativeGold || 0;
          if (!miningState?.totalCumulativeGold || baseCumulativeGold === 0) {
            baseCumulativeGold = (miningState?.accumulatedGold || 0) + (miningState?.totalGoldSpentOnUpgrades || 0);
          }
          return baseCumulativeGold + goldEarnedSinceLastUpdate;
        };

        return [{
          walletAddress: primaryWallet,
          displayWallet: user.companyName || `${primaryWallet.slice(0, 8)}...${primaryWallet.slice(-6)}`,
          currentGold: Math.floor(calculateGoldFromNewTables()),
          hourlyRate: miningState?.totalGoldPerHour || 0,
          mekCount: ownedMeks.length,
          nickname: null,
          _source: "newTables",
        }];
      }
    }

    // LEGACY FALLBACK: Try old goldMining table
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
      .sort((a: any, b: any) => a.rank - b.rank)
      .slice(0, 3)
      .map((entry: any) => ({
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
      .sort((a: any, b: any) => a.rank - b.rank)
      .filter((entry: any) => {
        // Skip if 0 gold
        if (entry.value <= 0) return false;

        // Skip if duplicate wallet address (keep first occurrence)
        if (seenWallets.has(entry.walletAddress)) return false;
        seenWallets.add(entry.walletAddress);

        return true;
      });

    // Return filtered entries with full display info
    return filteredEntries.map((entry: any) => ({
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
      .sort((a: any, b: any) => a.rank - b.rank)
      .slice(0, 3)
      .map((entry: any) => ({
        walletAddress: entry.walletAddress,
        currentGold: Math.floor(entry.value),
        hourlyRate: entry.metadata?.goldPerHour || 0,
      }));
  },
});