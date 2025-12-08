/**
 * USER DATA FUNCTIONS (Phase II)
 *
 * This file contains Phase II user data functions that replace goldMining.ts queries.
 * All functions use the `users` and `meks` tables instead of legacy goldMining.
 *
 * Key differences from goldMining.ts:
 * - User identity comes from `users` table
 * - Meks come from `meks` table (not goldMining.ownedMeks array)
 * - No migration fallbacks - Phase II is a fresh start
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user data for wallet connection and display
 * Replaces: goldMining.getGoldMiningData
 *
 * Returns user profile + owned Meks
 */
export const getUserData = query({
  args: {
    walletAddress: v.string(), // Stake address
  },
  handler: async (ctx, args) => {
    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    if (!user) {
      return null;
    }

    // Get owned Meks from meks table
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q: any) => q.eq("owner", args.walletAddress))
      .collect();

    return {
      // User identity
      walletAddress: user.stakeAddress,
      companyName: user.corporationName,

      // User stats
      gold: user.gold || 0,
      level: user.level || 1,
      experience: user.experience || 0,

      // Verification status
      isBlockchainVerified: user.walletVerified === true,
      lastVerificationTime: user.lastVerificationTime,

      // Activity
      lastActiveTime: user.lastLogin,
      createdAt: user.createdAt,

      // Owned Meks (formatted for frontend compatibility)
      ownedMeks: ownedMeks.map(mek => ({
        assetId: mek.assetId,
        assetName: mek.assetName,
        policyId: mek.policyId,
        sourceKey: mek.sourceKey,
        sourceKeyBase: mek.sourceKeyBase,
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        itemVariation: mek.itemVariation,
        rarityRank: mek.rarityRank,
        customName: mek.customName,
        // Phase II: Gold tracking on meks table
        accumulatedGoldForCorp: mek.accumulatedGoldForCorp || 0,
        accumulatedGoldAllTime: mek.accumulatedGoldAllTime || 0,
      })),

      // Mek count for quick access
      mekCount: ownedMeks.length,
    };
  },
});

/**
 * Update user's last active timestamp
 * Replaces: goldMining.updateLastActive
 */
export const updateLastActive = mutation({
  args: {
    walletAddress: v.string(), // Stake address
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(user._id, {
      lastLogin: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Check if wallet is verified
 * Replaces: goldMining.isWalletVerified
 */
export const isWalletVerified = query({
  args: {
    walletAddress: v.string(), // Stake address
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        exists: false,
        isVerified: false,
        lastVerificationTime: null,
      };
    }

    return {
      exists: true,
      isVerified: user.walletVerified === true,
      lastVerificationTime: user.lastVerificationTime || null,
    };
  },
});

/**
 * Set custom name for a Mek
 * Replaces: goldMining.setMekName
 *
 * Mek names must be unique across all Meks (not just within a wallet)
 */
export const setMekName = mutation({
  args: {
    walletAddress: v.string(), // Stake address (owner)
    mekAssetId: v.string(),
    mekName: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.mekName.trim();

    // Validation
    if (trimmedName.length > 20) {
      return { success: false, error: "Name must be 20 characters or less" };
    }

    // Find the Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      return { success: false, error: "Mek not found" };
    }

    // Verify ownership
    if (mek.owner !== args.walletAddress) {
      return { success: false, error: "You don't own this Mek" };
    }

    // Check if name is taken (if not empty)
    if (trimmedName.length > 0) {
      const existingWithName = await ctx.db
        .query("meks")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("customName"), trimmedName),
            q.neq(q.field("assetId"), args.mekAssetId)
          )
        )
        .first();

      if (existingWithName) {
        return { success: false, error: "This name is already taken" };
      }
    }

    // Update the Mek's name
    await ctx.db.patch(mek._id, {
      customName: trimmedName || null,
    });

    return { success: true, newName: trimmedName || null };
  },
});

/**
 * Check if a Mek name is available
 * Replaces: goldMining.checkMekNameAvailability
 */
export const checkMekNameAvailability = query({
  args: {
    mekName: v.string(),
    currentMekAssetId: v.optional(v.string()), // Exclude this Mek from check
  },
  handler: async (ctx, args) => {
    const trimmedName = args.mekName.trim();

    if (trimmedName.length === 0) {
      return { available: true, reason: "Empty name is allowed (clears the name)" };
    }

    if (trimmedName.length > 20) {
      return { available: false, reason: "Name must be 20 characters or less" };
    }

    // Check if name is taken
    const existingMeks = await ctx.db
      .query("meks")
      .filter((q: any) => q.eq(q.field("customName"), trimmedName))
      .collect();

    // Filter out the current Mek if provided
    const conflictingMeks = args.currentMekAssetId
      ? existingMeks.filter(m => m.assetId !== args.currentMekAssetId)
      : existingMeks;

    if (conflictingMeks.length > 0) {
      return { available: false, reason: "This name is already taken" };
    }

    return { available: true, reason: null };
  },
});

/**
 * Get company name for a user
 * Replaces: goldMining.getCompanyName
 * Note: corporationAuth.ts also has this, but keeping here for API compatibility
 */
export const getCompanyName = query({
  args: {
    walletAddress: v.string(), // Stake address
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    if (!user) {
      return { hasCompanyName: false, companyName: null };
    }

    return {
      hasCompanyName: !!user.corporationName,
      companyName: user.corporationName || null,
    };
  },
});

/**
 * Get all users for admin display (like getAllGoldMiningData)
 * Replaces: goldMining.getAllGoldMiningData
 */
export const getAllUsersData = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const allMeks = await ctx.db.query("meks").collect();

    // Create a map of owner -> mek count
    const mekCountByOwner = new Map<string, number>();
    for (const mek of allMeks) {
      if (mek.owner) {
        mekCountByOwner.set(mek.owner, (mekCountByOwner.get(mek.owner) || 0) + 1);
      }
    }

    const now = Date.now();

    return allUsers.map(user => {
      const lastActiveTime = user.lastLogin || user.createdAt || now;
      const minutesSinceActive = Math.floor((now - lastActiveTime) / (1000 * 60));
      const hoursSinceActive = Math.floor(minutesSinceActive / 60);
      const daysSinceActive = Math.floor(hoursSinceActive / 24);

      let lastActiveDisplay = "Just now";
      if (daysSinceActive > 0) {
        lastActiveDisplay = `${daysSinceActive}d ago`;
      } else if (hoursSinceActive > 0) {
        lastActiveDisplay = `${hoursSinceActive}h ago`;
      } else if (minutesSinceActive > 0) {
        lastActiveDisplay = `${minutesSinceActive}m ago`;
      }

      return {
        _id: user._id,
        walletAddress: user.stakeAddress,
        walletType: user.lastWalletType || "Unknown",
        companyName: user.corporationName || null,
        mekCount: mekCountByOwner.get(user.stakeAddress) || 0,
        currentGold: user.gold || 0,
        level: user.level || 1,
        isVerified: user.walletVerified === true,
        lastActiveTime,
        lastActiveDisplay,
        createdAt: user.createdAt,
      };
    });
  },
});
