/**
 * MEKS TABLE OPERATIONS
 * =====================
 *
 * This file manages Mek NFT data stored in the `meks` table.
 * The meks table contains exactly 4000 NFTs - this is FIXED and IMMUTABLE.
 *
 * INCLUDES:
 * - Mek name functions (setMekName, getMekName, checkMekNameAvailability)
 * - Mek queries by owner
 * - Mek data lookups
 *
 * NOTE: For insert/delete protection, see meksProtection.ts
 * For mek restoration from backup, see restoreMeksFromBackup.ts
 * For deduplication, see deduplicateMeks.ts
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════════════
// MEK NAME FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mek name validation helper
 */
function validateMekName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Mek name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "Mek name cannot be empty" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Mek name must be 20 characters or less" };
  }

  // Allow letters, numbers, spaces, and basic punctuation (-, ', .)
  const allowedCharsRegex = /^[a-zA-Z0-9\s\-'.]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return { valid: false, error: "Mek name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods" };
  }

  return { valid: true };
}

/**
 * Set custom name for a Mek
 * Phase II: Works directly with meks table
 */
export const setMekName = mutation({
  args: {
    stakeAddress: v.string(),
    mekAssetId: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[🔍MEKNAME] ========== setMekName MUTATION START ==========');
    console.log('[🔍MEKNAME] Input:', {
      stakeAddress: args.stakeAddress.substring(0, 20) + '...',
      mekAssetId: args.mekAssetId,
      newName: args.newName,
      timestamp: new Date().toISOString()
    });

    // Validate the name
    const validation = validateMekName(args.newName);
    if (!validation.valid) {
      console.log('[🔍MEKNAME] Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    const trimmedName = args.newName.trim();

    // Find the Mek in the meks table
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      console.log('[🔍MEKNAME] ERROR: Mek not found');
      return {
        success: false,
        error: "Mek not found"
      };
    }

    // Verify ownership
    if (mek.ownerStakeAddress !== args.stakeAddress && mek.owner !== args.stakeAddress) {
      console.log('[🔍MEKNAME] ERROR: Not owner of this Mek');
      return {
        success: false,
        error: "You do not own this Mek"
      };
    }

    // Check if name is unique GLOBALLY (across all meks)
    const existingMekWithName = await ctx.db
      .query("meks")
      .filter((q: any) =>
        q.and(
          q.neq(q.field("assetId"), args.mekAssetId),
          q.eq(q.field("customName"), trimmedName)
        )
      )
      .first();

    if (existingMekWithName) {
      // Also check case-insensitive
      const allMeks = await ctx.db.query("meks").collect();
      const nameTakenCaseInsensitive = allMeks.some(
        m => m.customName?.toLowerCase() === trimmedName.toLowerCase() && m.assetId !== args.mekAssetId
      );

      if (nameTakenCaseInsensitive) {
        console.log('[🔍MEKNAME] Name already taken by another Mek');
        return {
          success: false,
          error: "This name is already taken by another player. Please choose a unique name."
        };
      }
    }

    // Update the Mek's custom name
    console.log('[🔍MEKNAME] Updating Mek name in database...');
    await ctx.db.patch(mek._id, {
      customName: trimmedName,
    });

    console.log('[🔍MEKNAME] ✅ DATABASE UPDATED SUCCESSFULLY');
    console.log('[🔍MEKNAME] ========== setMekName MUTATION END ==========');

    return {
      success: true,
      customName: trimmedName
    };
  },
});

/**
 * Check if a Mek name is available (for real-time validation)
 */
export const checkMekNameAvailability = query({
  args: {
    mekName: v.string(),
    currentMekAssetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First validate the name format
    const validation = validateMekName(args.mekName);
    if (!validation.valid) {
      return {
        available: false,
        error: validation.error
      };
    }

    const trimmedName = args.mekName.trim();

    // Check if name is unique GLOBALLY (case-insensitive)
    const allMeks = await ctx.db.query("meks").collect();
    const nameTaken = allMeks.some(
      mek => mek.customName?.toLowerCase() === trimmedName.toLowerCase() &&
             mek.assetId !== args.currentMekAssetId
    );

    if (nameTaken) {
      return {
        available: false,
        error: "This name is already taken. Please choose a unique name."
      };
    }

    return {
      available: true
    };
  },
});

/**
 * Get custom name for a Mek
 */
export const getMekName = query({
  args: {
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      return {
        customName: null,
        hasName: false
      };
    }

    return {
      customName: mek.customName || null,
      hasName: !!mek.customName
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MEK QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all Meks owned by a stake address
 */
export const getMeksByOwner = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    return meks;
  },
});

/**
 * Get Mek count for a stake address
 */
export const getMekCount = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    return meks.length;
  },
});

/**
 * Get a single Mek by assetId
 */
export const getMekByAssetId = query({
  args: {
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.assetId))
      .first();

    return mek;
  },
});

/**
 * Get multiple Meks by asset IDs
 */
export const getMeksByAssetIds = query({
  args: {
    assetIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const meks = [];
    for (const assetId of args.assetIds) {
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", assetId))
        .first();
      if (mek) {
        meks.push(mek);
      }
    }
    return meks;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MEK LEVELING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Level up cost formula (same as Phase I):
 * Level 1→2: 500 gold
 * Level 2→3: 1000 gold
 * Level 3→4: 2000 gold
 * ...doubles each level
 * Max level: 10
 */
const LEVEL_COSTS = [
  0,      // Level 1 (base, no cost)
  500,    // Level 2
  1000,   // Level 3
  2000,   // Level 4
  4000,   // Level 5
  8000,   // Level 6
  16000,  // Level 7
  32000,  // Level 8
  64000,  // Level 9
  128000, // Level 10
];

const MAX_MEK_LEVEL = 10;
const BOOST_PER_LEVEL = 10; // 10% boost per level

/**
 * Get the cost to level up a Mek
 */
export const getMekLevelCost = query({
  args: {
    currentLevel: v.number(),
  },
  handler: async (_ctx, args) => {
    if (args.currentLevel >= MAX_MEK_LEVEL) {
      return {
        canLevelUp: false,
        cost: 0,
        nextLevel: MAX_MEK_LEVEL,
        error: "Mek is already at max level"
      };
    }

    const cost = LEVEL_COSTS[args.currentLevel] || 0;
    return {
      canLevelUp: true,
      cost,
      nextLevel: args.currentLevel + 1,
      boostGain: BOOST_PER_LEVEL
    };
  },
});

/**
 * Level up a Mek by spending gold
 */
export const levelUpMek = mutation({
  args: {
    stakeAddress: v.string(),
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[⬆️LEVEL] ========== levelUpMek MUTATION START ==========');
    console.log('[⬆️LEVEL] Input:', {
      stakeAddress: args.stakeAddress.substring(0, 20) + '...',
      mekAssetId: args.mekAssetId,
    });

    // Get the user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      console.log('[⬆️LEVEL] ERROR: User not found');
      return {
        success: false,
        error: "User not found"
      };
    }

    // Get the Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      console.log('[⬆️LEVEL] ERROR: Mek not found');
      return {
        success: false,
        error: "Mek not found"
      };
    }

    // Verify ownership
    if (mek.ownerStakeAddress !== args.stakeAddress && mek.owner !== args.stakeAddress) {
      console.log('[⬆️LEVEL] ERROR: Not owner of this Mek');
      return {
        success: false,
        error: "You do not own this Mek"
      };
    }

    // Get current level (default to 1 if not set)
    const currentLevel = mek.mekLevel || 1;

    if (currentLevel >= MAX_MEK_LEVEL) {
      console.log('[⬆️LEVEL] ERROR: Already at max level');
      return {
        success: false,
        error: "Mek is already at max level (10)"
      };
    }

    // Calculate cost
    const cost = LEVEL_COSTS[currentLevel] || 0;
    const userGold = user.gold || 0;

    if (userGold < cost) {
      console.log('[⬆️LEVEL] ERROR: Not enough gold');
      return {
        success: false,
        error: `Not enough gold. Need ${cost}, have ${userGold}`
      };
    }

    // Calculate new values
    const newLevel = currentLevel + 1;
    const newBoostPercent = (newLevel - 1) * BOOST_PER_LEVEL; // Level 1 = 0%, Level 10 = 90%
    const baseRate = mek.baseGoldRate || mek.goldRate || 0;
    const newBoostAmount = Math.floor(baseRate * (newBoostPercent / 100));
    const newEffectiveRate = baseRate + newBoostAmount;

    console.log('[⬆️LEVEL] Leveling up:', {
      currentLevel,
      newLevel,
      cost,
      baseRate,
      newBoostPercent,
      newBoostAmount,
      newEffectiveRate
    });

    // Deduct gold from user
    await ctx.db.patch(user._id, {
      gold: userGold - cost,
    });

    // Update the Mek
    await ctx.db.patch(mek._id, {
      mekLevel: newLevel,
      levelBoostPercent: newBoostPercent,
      levelBoostAmount: newBoostAmount,
      effectiveGoldRate: newEffectiveRate,
      // Initialize baseGoldRate if not set
      baseGoldRate: baseRate,
    });

    console.log('[⬆️LEVEL] ✅ Level up successful!');
    console.log('[⬆️LEVEL] ========== levelUpMek MUTATION END ==========');

    return {
      success: true,
      newLevel,
      boostPercent: newBoostPercent,
      effectiveGoldRate: newEffectiveRate,
      goldSpent: cost,
      remainingGold: userGold - cost
    };
  },
});

/**
 * Get level info for a Mek (for UI display)
 */
export const getMekLevelInfo = query({
  args: {
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      return null;
    }

    const currentLevel = mek.mekLevel || 1;
    const baseRate = mek.baseGoldRate || mek.goldRate || 0;
    const boostPercent = mek.levelBoostPercent || 0;
    const boostAmount = mek.levelBoostAmount || 0;
    const effectiveRate = mek.effectiveGoldRate || baseRate;

    const isMaxLevel = currentLevel >= MAX_MEK_LEVEL;
    const nextLevelCost = isMaxLevel ? 0 : (LEVEL_COSTS[currentLevel] || 0);
    const nextBoostGain = isMaxLevel ? 0 : BOOST_PER_LEVEL;

    return {
      currentLevel,
      maxLevel: MAX_MEK_LEVEL,
      isMaxLevel,
      baseRate,
      boostPercent,
      boostAmount,
      effectiveRate,
      nextLevelCost,
      nextBoostGain,
    };
  },
});
