import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * SIMPLE NFT ELIGIBILITY SYSTEM FOR NMKR
 *
 * This is a minimal system that just stores which snapshot controls
 * who can see the "Claim NFT" button on the homepage.
 *
 * NMKR handles all the actual minting, payment, and NFT delivery.
 * We just need to control eligibility for the claim button.
 */

/**
 * Get the currently active snapshot
 */
export const getActiveSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (!config || !config.activeSnapshotId) {
      return null;
    }

    const snapshot = await ctx.db.get(config.activeSnapshotId);
    return snapshot;
  },
});

/**
 * Set which snapshot controls eligibility
 */
export const setActiveSnapshot = mutation({
  args: {
    snapshotId: v.id("whitelistSnapshots"),
  },
  handler: async (ctx, args) => {
    // Verify snapshot exists
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }

    // Get or create config
    const existing = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        activeSnapshotId: args.snapshotId,
        updatedAt: Date.now(),
      });
    } else {
      // Create new config
      await ctx.db.insert("nftEligibilityConfig", {
        activeSnapshotId: args.snapshotId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      snapshotName: snapshot.snapshotName,
      eligibleWallets: snapshot.eligibleUsers?.length || 0,
    };
  },
});

/**
 * Check if a stake address is eligible to see the claim button
 * This is called by AirdropClaimBanner.tsx on the homepage
 *
 * IMPORTANT: Matches ONLY on stake addresses (stake1... or stake_test1...)
 * Snapshots contain stake addresses for eligibility checking
 * NMKR collects payment addresses during checkout for NFT delivery
 */
export const checkClaimEligibility = query({
  args: {
    walletAddress: v.string(), // Actually a stake address (keeping param name for backward compatibility)
  },
  handler: async (ctx, args) => {
    // Get active snapshot
    const config = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (!config || !config.activeSnapshotId) {
      return {
        eligible: false,
        reason: "No active snapshot configured",
      };
    }

    const snapshot = await ctx.db.get(config.activeSnapshotId);
    if (!snapshot) {
      return {
        eligible: false,
        reason: "Active snapshot not found",
      };
    }

    // FIRST: Check if this wallet already has an ACTIVE reservation in progress
    // This handles the case where user closes lightbox and tries to claim again
    const activeReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (activeReservation) {
      return {
        eligible: false,
        reason: "You already have an NFT reservation in progress. Please complete your payment in the NMKR window. If you cannot find it, please wait 20 minutes and try again.",
        hasActiveReservation: true,
      };
    }

    // SECOND: Check if they already completed a claim
    const completedReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (completedReservation) {
      return {
        eligible: false,
        reason: "You have already claimed your commemorative NFT",
        alreadyClaimed: true,
      };
    }

    // THIRD: Check if stake address is in whitelist snapshot
    // Snapshots only contain stake addresses (no payment addresses)
    // Check both stakeAddress (new) and walletAddress (legacy) fields
    const isInSnapshot = snapshot.eligibleUsers?.some((user: any) => {
      return user.stakeAddress === args.walletAddress || user.walletAddress === args.walletAddress;
    });

    if (!isInSnapshot) {
      return {
        eligible: false,
        reason: "Stake address not in active snapshot",
      };
    }

    // All checks passed - user is eligible and has no active reservation
    return {
      eligible: true,
      reason: "Stake address is in active snapshot and has not yet claimed",
      snapshotName: snapshot.snapshotName,
    };
  },
});

/**
 * Clear the active snapshot (deactivate eligibility)
 */
export const clearActiveSnapshot = mutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (!config) {
      return {
        success: false,
        message: "No config found",
      };
    }

    // Clear the active snapshot
    await ctx.db.patch(config._id, {
      activeSnapshotId: undefined,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Active snapshot cleared. No wallets are now eligible.",
    };
  },
});

/**
 * Get current config info (for admin UI)
 */
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (!config || !config.activeSnapshotId) {
      return {
        hasActiveSnapshot: false,
        snapshotName: null,
        eligibleWallets: 0,
      };
    }

    const snapshot = await ctx.db.get(config.activeSnapshotId);
    if (!snapshot) {
      return {
        hasActiveSnapshot: false,
        snapshotName: null,
        eligibleWallets: 0,
      };
    }

    return {
      hasActiveSnapshot: true,
      snapshotName: snapshot.snapshotName,
      eligibleWallets: snapshot.eligibleUsers?.length || 0,
      lastUpdated: config.updatedAt,
    };
  },
});

/**
 * Debug function to inspect the raw database state
 */
export const debugEligibilityState = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("nftEligibilityConfig")
      .first();

    if (!config) {
      return {
        status: "No config record found in database",
        config: null,
        snapshot: null,
      };
    }

    let snapshot = null;
    if (config.activeSnapshotId) {
      snapshot = await ctx.db.get(config.activeSnapshotId);
    }

    return {
      status: "Config found",
      config: {
        id: config._id,
        activeSnapshotId: config.activeSnapshotId,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
      snapshot: snapshot ? {
        id: snapshot._id,
        snapshotName: snapshot.snapshotName,
        eligibleUsersCount: snapshot.eligibleUsers?.length || 0,
        takenAt: snapshot.takenAt,
      } : null,
    };
  },
});

/**
 * Batch check claim status for multiple stake addresses
 * Used by admin whitelist view to show who has claimed
 */
export const batchCheckClaimStatus = query({
  args: {
    stakeAddresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const claimStatusMap: Record<string, { claimed: boolean; claimedAt?: number }> = {};

    // Check each stake address for completed reservations
    for (const stakeAddress of args.stakeAddresses) {
      const completedReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_reserved_by", (q) => q.eq("reservedBy", stakeAddress))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (completedReservation) {
        // User has claimed - get the timestamp when reservation was completed
        // Use reservedAt as proxy for claim time (when they started the claim process)
        claimStatusMap[stakeAddress] = {
          claimed: true,
          claimedAt: completedReservation.reservedAt,
        };
      } else {
        claimStatusMap[stakeAddress] = {
          claimed: false,
        };
      }
    }

    return claimStatusMap;
  },
});

/**
 * Debug function to check why a specific stake address isn't matching
 */
export const debugStakeAddressMatch = query({
  args: {
    testStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("nftEligibilityConfig").first();
    if (!config || !config.activeSnapshotId) {
      return { error: "No active snapshot" };
    }

    const snapshot = await ctx.db.get(config.activeSnapshotId);
    if (!snapshot) {
      return { error: "Snapshot not found" };
    }

    // Get all stake addresses from snapshot
    const snapshotAddresses = snapshot.eligibleUsers?.map((user: any) => ({
      stakeAddress: user.stakeAddress,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
    })) || [];

    // Check for exact match
    const exactMatch = snapshot.eligibleUsers?.some((user: any) =>
      user.stakeAddress === args.testStakeAddress
    );

    // Check for match with walletAddress field (legacy)
    const legacyMatch = snapshot.eligibleUsers?.some((user: any) =>
      user.walletAddress === args.testStakeAddress
    );

    return {
      testAddress: args.testStakeAddress,
      snapshotName: snapshot.snapshotName,
      totalUsers: snapshot.eligibleUsers?.length || 0,
      exactMatch,
      legacyMatch,
      sampleAddresses: snapshotAddresses.slice(0, 5), // First 5 for inspection
    };
  },
});
