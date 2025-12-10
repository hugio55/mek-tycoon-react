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
import { checkProfanity } from "./profanityFilter";

// ═══════════════════════════════════════════════════════════════════════════
// MEK NAME FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mek name validation helper
 * Includes profanity filtering
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

  // Only allow letters, numbers, and spaces (blocks Unicode homoglyphs)
  const allowedCharsRegex = /^[a-zA-Z0-9\s]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return { valid: false, error: "Mek name can only contain letters, numbers, and spaces" };
  }

  // Profanity check
  const profanityResult = checkProfanity(trimmed);
  if (!profanityResult.isClean) {
    return { valid: false, error: profanityResult.reason || "Name contains inappropriate language" };
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
 * Get ALL Meks (admin only - for support/admin use)
 * Returns all 4000+ Meks for admin to select from
 */
export const getAllMeksForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db
      .query("meks")
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
// Phase II: BOOST_PER_LEVEL removed - gold rate boosts are obsolete
// Mek levels now used for talent tree skill points (mekLevel * 100 = skill points)

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
      // Phase II: boostGain removed - gold rate boosts obsolete
      skillPointsGain: 100, // Each level grants 100 talent tree skill points
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
    // Phase II: Gold rate boost calculations REMOVED
    // Leveling now grants talent tree skill points (100 per level)

    console.log('[⬆️LEVEL] Leveling up:', {
      currentLevel,
      newLevel,
      cost,
      skillPointsGained: 100,
    });

    // Deduct gold from user
    await ctx.db.patch(user._id, {
      gold: userGold - cost,
    });

    // Update the Mek - only mekLevel (gold rate fields removed)
    await ctx.db.patch(mek._id, {
      mekLevel: newLevel,
    });

    console.log('[⬆️LEVEL] ✅ Level up successful!');
    console.log('[⬆️LEVEL] ========== levelUpMek MUTATION END ==========');

    return {
      success: true,
      newLevel,
      skillPointsTotal: newLevel * 100, // Talent tree skill points
      goldSpent: cost,
      remainingGold: userGold - cost
    };
  },
});

/**
 * Get level info for a Mek (for UI display)
 * Phase II: Gold rate fields removed - leveling now grants talent tree skill points
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
    const isMaxLevel = currentLevel >= MAX_MEK_LEVEL;
    const nextLevelCost = isMaxLevel ? 0 : (LEVEL_COSTS[currentLevel] || 0);

    return {
      currentLevel,
      maxLevel: MAX_MEK_LEVEL,
      isMaxLevel,
      skillPoints: currentLevel * 100, // Talent tree skill points
      nextLevelCost,
      nextSkillPointsGain: isMaxLevel ? 0 : 100,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// DIAGNOSTICS: Check owner field consistency
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Diagnostic query to check if we can safely migrate from by_owner to by_owner_stake index.
 *
 * This checks for MEKs that have `owner` set but `ownerStakeAddress` missing,
 * which would cause them to disappear from queries if we switch indexes.
 */
export const checkOwnerFieldConsistency = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    let totalMeks = 0;
    let unownedMeks = 0;
    let hasOwnerOnly = 0;      // owner set, ownerStakeAddress missing (PROBLEM)
    let hasStakeOnly = 0;      // ownerStakeAddress set, owner missing (unlikely)
    let hasBoth = 0;           // both set (GOOD)
    let bothMatch = 0;         // both set and equal (IDEAL)
    let bothMismatch = 0;      // both set but different (PROBLEM)

    const problemMeks: Array<{
      assetId: string;
      owner: string | undefined;
      ownerStakeAddress: string | undefined;
      issue: string;
    }> = [];

    for (const mek of allMeks) {
      totalMeks++;
      const hasOwner = mek.owner !== undefined && mek.owner !== null && mek.owner !== "";
      const hasStake = mek.ownerStakeAddress !== undefined && mek.ownerStakeAddress !== null && mek.ownerStakeAddress !== "";

      if (!hasOwner && !hasStake) {
        unownedMeks++;
      } else if (hasOwner && !hasStake) {
        hasOwnerOnly++;
        problemMeks.push({
          assetId: mek.assetId,
          owner: mek.owner,
          ownerStakeAddress: mek.ownerStakeAddress,
          issue: "owner set but ownerStakeAddress missing"
        });
      } else if (!hasOwner && hasStake) {
        hasStakeOnly++;
        problemMeks.push({
          assetId: mek.assetId,
          owner: mek.owner,
          ownerStakeAddress: mek.ownerStakeAddress,
          issue: "ownerStakeAddress set but owner missing"
        });
      } else {
        hasBoth++;
        if (mek.owner === mek.ownerStakeAddress) {
          bothMatch++;
        } else {
          bothMismatch++;
          problemMeks.push({
            assetId: mek.assetId,
            owner: mek.owner,
            ownerStakeAddress: mek.ownerStakeAddress,
            issue: "owner and ownerStakeAddress don't match"
          });
        }
      }
    }

    const safeToMigrate = hasOwnerOnly === 0 && bothMismatch === 0;

    return {
      summary: {
        totalMeks,
        unownedMeks,
        ownedMeks: totalMeks - unownedMeks,
      },
      consistency: {
        hasOwnerOnly,      // These would disappear if we migrate!
        hasStakeOnly,
        hasBoth,
        bothMatch,
        bothMismatch,      // These would return wrong results!
      },
      safeToMigrate,
      migrationRisk: safeToMigrate
        ? "LOW - All owned MEKs have matching owner fields"
        : `HIGH - ${hasOwnerOnly + bothMismatch} MEKs would be affected`,
      problemMeks: problemMeks.slice(0, 20), // Limit to first 20 for readability
      totalProblems: problemMeks.length,
    };
  },
});
