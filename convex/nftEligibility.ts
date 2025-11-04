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
 * Check if a wallet is eligible to see the claim button
 * This is called by AirdropClaimBanner.tsx on the homepage
 */
export const checkClaimEligibility = query({
  args: {
    walletAddress: v.string(),
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

    // Check if wallet is in snapshot
    const isInSnapshot = snapshot.eligibleUsers?.some(
      (user: any) => user.walletAddress === args.walletAddress
    );

    if (isInSnapshot) {
      return {
        eligible: true,
        reason: "Wallet is in active snapshot",
        snapshotName: snapshot.snapshotName,
      };
    }

    return {
      eligible: false,
      reason: "Wallet not in active snapshot",
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
