import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// =============================================================================
// PHASE II: User Mining State (Clean Architecture)
// =============================================================================
// This file provides gold mining queries using the new normalized architecture:
// - User data from `users` table
// - Gold mining state from `goldMiningState` table
// - Meks from `meks` table (queried by ownerStakeAddress)
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

const MINING_CONSTANTS = {
  GOLD_CAP: 50000, // Maximum gold that can accumulate
  MAX_OFFLINE_HOURS: 24, // Maximum hours of offline earnings
  MIN_UPDATE_INTERVAL_MS: 30 * 1000, // 30 seconds debounce
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate current gold including time-based accumulation
 */
function calculateCurrentGold(params: {
  accumulatedGold: number;
  goldPerHour: number;
  lastSnapshotTime: number;
  isVerified: boolean;
}): number {
  const { accumulatedGold, goldPerHour, lastSnapshotTime, isVerified } = params;

  // If not verified, no gold accumulation
  if (!isVerified) {
    return accumulatedGold;
  }

  const now = Date.now();
  const hoursSinceSnapshot = (now - lastSnapshotTime) / (1000 * 60 * 60);

  // Cap offline earnings to max hours
  const cappedHours = Math.min(hoursSinceSnapshot, MINING_CONSTANTS.MAX_OFFLINE_HOURS);
  const earnedGold = cappedHours * goldPerHour;

  // Apply gold cap
  return Math.min(accumulatedGold + earnedGold, MINING_CONSTANTS.GOLD_CAP);
}

/**
 * Validates stake address format
 */
function isValidStakeAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const mainnetRegex = /^stake1[a-z0-9]{53}$/;
  const testnetRegex = /^stake_test1[a-z0-9]{49}$/;
  return mainnetRegex.test(address) || testnetRegex.test(address);
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get user's gold mining data (Phase II - clean architecture)
 *
 * Returns data in format compatible with existing frontend:
 * - currentGold, totalGoldPerHour, baseGoldPerHour, boostGoldPerHour
 * - ownedMeks array (now fetched from meks table)
 * - companyName (now from users.corporationName)
 */
export const getUserMiningData = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    // Get user data
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      return null;
    }

    // Get gold mining state
    const miningState = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    // Get owned meks
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    // Calculate current gold
    const baseRate = miningState?.baseGoldPerHour || 0;
    const boostRate = miningState?.boostGoldPerHour || 0;
    const totalRate = miningState?.totalGoldPerHour || 0;

    const currentGold = miningState ? calculateCurrentGold({
      accumulatedGold: miningState.accumulatedGold || 0,
      goldPerHour: totalRate,
      lastSnapshotTime: miningState.lastSnapshotTime || miningState.updatedAt || miningState.createdAt,
      isVerified: miningState.isBlockchainVerified === true,
    }) : 0;

    // Format meks for frontend compatibility
    const formattedMeks = ownedMeks.map((mek: any) => ({
      assetId: mek.assetId,
      policyId: mek.policyId || '',
      assetName: mek.assetName,
      imageUrl: mek.iconUrl,
      goldPerHour: mek.goldRate || 0,
      rarityRank: mek.rarityRank,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
      sourceKey: mek.sourceKey,
      sourceKeyBase: mek.sourceKeyBase,
      // Level boost data (stored on mek in Phase II)
      baseGoldPerHour: mek.goldRate || 0,
      currentLevel: mek.level || 1,
      levelBoostPercent: mek.levelBoostPercent || 0,
      levelBoostAmount: mek.levelBoostAmount || 0,
      effectiveGoldPerHour: mek.goldRate || 0,
      customName: mek.customName,
    }));

    // Return in format compatible with existing frontend
    return {
      // Identity
      walletAddress: args.stakeAddress, // For backwards compat
      stakeAddress: args.stakeAddress,
      companyName: user.corporationName,

      // Gold data
      currentGold,
      accumulatedGold: miningState?.accumulatedGold || 0,
      totalCumulativeGold: miningState?.totalCumulativeGold || 0,

      // Gold rates
      baseGoldPerHour: baseRate,
      boostGoldPerHour: boostRate,
      totalGoldPerHour: totalRate,

      // Meks
      ownedMeks: formattedMeks,

      // Verification
      isBlockchainVerified: miningState?.isBlockchainVerified || false,
      isVerified: miningState?.isBlockchainVerified || false,
      lastVerificationTime: miningState?.lastVerificationTime,

      // Timestamps
      createdAt: miningState?.createdAt || user.createdAt,
      updatedAt: miningState?.updatedAt || user.updatedAt,
      lastActiveTime: miningState?.lastActiveTime,
    };
  },
});

/**
 * Get user's owned meks
 */
export const getUserMeks = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return [];
    }

    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    return meks;
  },
});

/**
 * Get gold mining state only
 */
export const getGoldMiningState = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    const state = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!state) {
      return null;
    }

    const currentGold = calculateCurrentGold({
      accumulatedGold: state.accumulatedGold || 0,
      goldPerHour: state.totalGoldPerHour,
      lastSnapshotTime: state.lastSnapshotTime || state.updatedAt || state.createdAt,
      isVerified: state.isBlockchainVerified === true,
    });

    return {
      ...state,
      currentGold,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Update last active time (debounced checkpoint)
 */
export const updateLastActive = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return { success: false, error: "Invalid stake address" };
    }

    const now = Date.now();

    const state = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!state) {
      return { success: false, error: "Mining state not found" };
    }

    // Debounce - skip if recent update
    const timeSinceLastUpdate = now - (state.updatedAt || 0);
    if (timeSinceLastUpdate < MINING_CONSTANTS.MIN_UPDATE_INTERVAL_MS) {
      return { success: true, skipped: true };
    }

    // Calculate accumulated gold up to now
    let newAccumulatedGold = state.accumulatedGold || 0;
    let newTotalCumulative = state.totalCumulativeGold || 0;

    if (state.isBlockchainVerified) {
      const currentGold = calculateCurrentGold({
        accumulatedGold: state.accumulatedGold || 0,
        goldPerHour: state.totalGoldPerHour,
        lastSnapshotTime: state.lastSnapshotTime || state.updatedAt || state.createdAt,
        isVerified: true,
      });

      const goldEarned = currentGold - (state.accumulatedGold || 0);
      newAccumulatedGold = currentGold;
      newTotalCumulative = (state.totalCumulativeGold || 0) + goldEarned;
    }

    await ctx.db.patch(state._id, {
      lastActiveTime: now,
      lastSnapshotTime: now,
      accumulatedGold: newAccumulatedGold,
      totalCumulativeGold: newTotalCumulative,
      updatedAt: now,
    });

    return { success: true, accumulatedGold: newAccumulatedGold };
  },
});

/**
 * Store meks for a user (called after Blockfrost verification)
 */
export const storeMeksForUser = mutation({
  args: {
    stakeAddress: v.string(),
    meks: v.array(v.object({
      assetId: v.string(),
      policyId: v.string(),
      assetName: v.string(),
      imageUrl: v.optional(v.string()),
      goldPerHour: v.number(),
      rarityRank: v.optional(v.number()),
      headVariation: v.optional(v.string()),
      bodyVariation: v.optional(v.string()),
      itemVariation: v.optional(v.string()),
      sourceKey: v.optional(v.string()),
      sourceKeyBase: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      throw new Error("Invalid stake address");
    }

    const now = Date.now();
    let totalGoldPerHour = 0;

    // Process each mek
    for (const mekData of args.meks) {
      totalGoldPerHour += mekData.goldPerHour;

      // Check if mek already exists
      const existing = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekData.assetId))
        .first();

      if (existing) {
        // Update ownership
        await ctx.db.patch(existing._id, {
          ownerStakeAddress: args.stakeAddress,
          owner: args.stakeAddress, // LEGACY
          goldRate: mekData.goldPerHour,
          iconUrl: mekData.imageUrl,
          verified: true,
          lastUpdated: now,
        });
      } else {
        // Create new mek record
        await ctx.db.insert("meks", {
          assetId: mekData.assetId,
          assetName: mekData.assetName,
          owner: args.stakeAddress, // LEGACY
          ownerStakeAddress: args.stakeAddress,
          iconUrl: mekData.imageUrl,
          verified: true,
          sourceKey: mekData.sourceKey,
          sourceKeyBase: mekData.sourceKeyBase,
          headVariation: mekData.headVariation || '',
          bodyVariation: mekData.bodyVariation || '',
          itemVariation: mekData.itemVariation,
          rarityRank: mekData.rarityRank,
          goldRate: mekData.goldPerHour,
          lastUpdated: now,
        });
      }
    }

    // Update gold mining state
    const miningState = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (miningState) {
      await ctx.db.patch(miningState._id, {
        totalGoldPerHour,
        baseGoldPerHour: totalGoldPerHour, // Will be adjusted for boosts later
        isBlockchainVerified: true,
        lastVerificationTime: now,
        updatedAt: now,
      });
    } else {
      // Create mining state if it doesn't exist
      await ctx.db.insert("goldMiningState", {
        stakeAddress: args.stakeAddress,
        totalGoldPerHour,
        baseGoldPerHour: totalGoldPerHour,
        boostGoldPerHour: 0,
        accumulatedGold: 0,
        lastActiveTime: now,
        lastSnapshotTime: now,
        totalCumulativeGold: 0,
        isBlockchainVerified: true,
        lastVerificationTime: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      mekCount: args.meks.length,
      totalGoldPerHour,
    };
  },
});

/**
 * Collect gold (move accumulated gold to user's balance)
 */
export const collectGold = mutation({
  args: {
    stakeAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      throw new Error("Invalid stake address");
    }

    const now = Date.now();

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get mining state
    const miningState = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!miningState) {
      throw new Error("Mining state not found");
    }

    // Calculate available gold
    const availableGold = calculateCurrentGold({
      accumulatedGold: miningState.accumulatedGold || 0,
      goldPerHour: miningState.totalGoldPerHour,
      lastSnapshotTime: miningState.lastSnapshotTime || miningState.updatedAt || miningState.createdAt,
      isVerified: miningState.isBlockchainVerified === true,
    });

    const collectAmount = Math.min(args.amount, availableGold);

    if (collectAmount <= 0) {
      return { success: false, error: "No gold to collect" };
    }

    // Update user's gold balance
    await ctx.db.patch(user._id, {
      gold: (user.gold || 0) + collectAmount,
      updatedAt: now,
    });

    // Reset accumulated gold
    await ctx.db.patch(miningState._id, {
      accumulatedGold: 0,
      lastSnapshotTime: now,
      updatedAt: now,
    });

    return {
      success: true,
      collected: collectAmount,
      newBalance: (user.gold || 0) + collectAmount,
    };
  },
});

// =============================================================================
// ACTIONS (for Blockfrost integration)
// =============================================================================

/**
 * Initialize user mining with Blockfrost verification
 * Phase II: Stores meks in meks table, state in goldMiningState
 */
export const initializeWithBlockfrost = action({
  args: {
    stakeAddress: v.string(),
    walletType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[UserMining] Fetching NFTs from Blockfrost for ${args.stakeAddress}`);

      // Fetch NFTs from Blockfrost
      const nftResult = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.stakeAddress,
        useCache: true
      });

      if (!nftResult.success) {
        throw new Error(nftResult.error || "Failed to fetch NFTs from blockchain");
      }

      console.log(`[UserMining] Found ${nftResult.meks.length} Meks on-chain`);

      // Import getMekDataByNumber function
      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      // Map Blockfrost Meks to our format with gold rates
      const meksWithRates = [];
      for (const mek of nftResult.meks) {
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          console.warn(`[UserMining] No data found for Mek #${mek.mekNumber}, skipping`);
          continue;
        }

        const imageUrl = getMekImageUrl(mek.mekNumber);

        meksWithRates.push({
          assetId: mek.assetId,
          policyId: mek.policyId,
          assetName: mek.assetName,
          imageUrl: imageUrl,
          goldPerHour: Math.round(mekData.goldPerHour * 100) / 100,
          rarityRank: mekData.finalRank,
          headVariation: mekData.headGroup,
          bodyVariation: mekData.bodyGroup,
          itemVariation: mekData.itemGroup,
          sourceKey: mekData.sourceKey,
          sourceKeyBase: mekData.sourceKey ? mekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase() : undefined,
        });
      }

      // Store meks using the new mutation
      const storeResult = await ctx.runMutation(api.userMiningState.storeMeksForUser, {
        stakeAddress: args.stakeAddress,
        meks: meksWithRates,
      });

      return {
        success: true,
        mekCount: storeResult.mekCount,
        totalGoldPerHour: storeResult.totalGoldPerHour,
        meks: meksWithRates,
      };

    } catch (error: any) {
      console.error("[UserMining] initializeWithBlockfrost error:", error);
      return {
        success: false,
        error: error.message || "Failed to initialize mining",
        mekCount: 0,
        totalGoldPerHour: 0,
        meks: [],
      };
    }
  },
});

// =============================================================================
// LEADERBOARD QUERIES
// =============================================================================

/**
 * Get top miners by gold per hour
 */
export const getTopMiners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 500);

    const topMiners = await ctx.db
      .query("goldMiningState")
      .withIndex("by_total_rate")
      .order("desc")
      .take(limit);

    // Get user info for each miner
    const results = [];
    for (const miner of topMiners) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", miner.stakeAddress))
        .first();

      if (user) {
        const mekCount = await ctx.db
          .query("meks")
          .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", miner.stakeAddress))
          .collect()
          .then(meks => meks.length);

        results.push({
          stakeAddress: miner.stakeAddress,
          corporationName: user.corporationName,
          totalGoldPerHour: miner.totalGoldPerHour,
          totalCumulativeGold: miner.totalCumulativeGold || 0,
          mekCount,
          isVerified: miner.isBlockchainVerified || false,
        });
      }
    }

    return results;
  },
});
