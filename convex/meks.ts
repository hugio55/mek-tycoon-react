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
