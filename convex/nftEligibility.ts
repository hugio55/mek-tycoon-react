import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// TESTING WHITELIST: These stake addresses can mint multiple times for testing
// REMOVE THIS AFTER TESTING IS COMPLETE
const TESTING_MULTI_MINT_WHITELIST = [
  "stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076", // Corporation testing account
];

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

    // TESTING BYPASS: Allow whitelisted addresses to mint multiple times
    // This skips the "already claimed" checks but still requires being in snapshot
    const isTestingWhitelisted = TESTING_MULTI_MINT_WHITELIST.includes(args.walletAddress);
    if (isTestingWhitelisted) {
      console.log('[🧪TEST] Whitelisted address detected, skipping claim checks:', args.walletAddress);

      // Still check if in snapshot
      const isInSnapshot = snapshot.eligibleUsers?.some((user: any) => {
        return user.stakeAddress === args.walletAddress || user.walletAddress === args.walletAddress;
      });

      if (!isInSnapshot) {
        return {
          eligible: false,
          reason: "Stake address not in active snapshot (testing whitelist still requires snapshot membership)",
        };
      }

      // Phase II: Get corporation name from users table
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      return {
        eligible: true,
        reason: "Testing whitelist - multiple mints allowed",
        snapshotName: snapshot.snapshotName,
        corporationName: user?.corporationName || null,
        testingMode: true,
      };
    }

    // FIRST: Check if this wallet already has an ACTIVE reservation in progress
    // This handles the case where user closes lightbox and tries to claim again
    const activeReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q: any) => q.eq("reservedBy", args.walletAddress))
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
    // Check BOTH legacy reservations table AND inventory soldTo field
    const completedReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q: any) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (completedReservation) {
      // Try to find the NFT details from inventory using the reservation's nftInventoryId
      let claimedNFT = null;
      if (completedReservation.nftInventoryId) {
        claimedNFT = await ctx.db.get(completedReservation.nftInventoryId);
      }

      return {
        eligible: false,
        reason: "You have already claimed your commemorative NFT",
        alreadyClaimed: true,
        claimedNFTDetails: claimedNFT ? {
          name: claimedNFT.name,
          nftNumber: claimedNFT.nftNumber,
          imageUrl: claimedNFT.imageUrl,
          soldAt: claimedNFT.soldAt,
        } : null,
      };
    }

    // ALSO check inventory for sold NFTs with this wallet as soldTo
    // This catches cases where sale was completed but reservation status wasn't updated
    const soldNFT = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "sold"),
          q.eq(q.field("soldTo"), args.walletAddress)
        )
      )
      .first();

    if (soldNFT) {
      return {
        eligible: false,
        reason: "You have already claimed your commemorative NFT",
        alreadyClaimed: true,
        claimedNFTDetails: {
          name: soldNFT.name,
          nftNumber: soldNFT.nftNumber,
          imageUrl: soldNFT.imageUrl,
          soldAt: soldNFT.soldAt,
        },
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
    // Phase II: Look up corporation name from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    const corporationName = user?.corporationName || null;

    return {
      eligible: true,
      reason: "Stake address is in active snapshot and has not yet claimed",
      snapshotName: snapshot.snapshotName,
      corporationName: corporationName,
    };
  },
});

/**
 * Check if a stake address is eligible to claim from a SPECIFIC CAMPAIGN
 * This is the new per-campaign eligibility system that replaces the global snapshot approach.
 * Each campaign can have its own eligibility snapshot assigned.
 *
 * CRITICAL SAFETY: If no snapshot is assigned, ALL wallets are rejected.
 * This is a security measure to prevent accidental claims when the campaign isn't configured.
 */
export const checkCampaignEligibility = query({
  args: {
    walletAddress: v.string(),
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    // 1. Get the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      console.log('[🛡️ELIGIBILITY] Campaign not found:', args.campaignId);
      return {
        eligible: false,
        reason: "Campaign not found",
      };
    }

    // 2. CRITICAL SAFETY CHECK: No snapshot = NO ONE can claim
    // This check happens BEFORE any whitelist checks to ensure maximum security
    console.log('[🛡️ELIGIBILITY] Campaign:', campaign.name, 'eligibilitySnapshotId:', campaign.eligibilitySnapshotId || 'NONE');

    if (!campaign.eligibilitySnapshotId) {
      console.log('[🛡️ELIGIBILITY] REJECTED - No eligibility snapshot assigned to campaign:', campaign.name);
      return {
        eligible: false,
        reason: "No eligibility snapshot assigned to this campaign. Claims are disabled.",
        campaignName: campaign.name,
        noSnapshotConfigured: true,
      };
    }

    // 3. Get the campaign's assigned snapshot
    const snapshot = await ctx.db.get(campaign.eligibilitySnapshotId);
    if (!snapshot) {
      console.log('[🛡️ELIGIBILITY] REJECTED - Snapshot ID exists but snapshot not found:', campaign.eligibilitySnapshotId);
      return {
        eligible: false,
        reason: "Campaign's eligibility snapshot not found. Claims are disabled.",
        campaignName: campaign.name,
        snapshotMissing: true,
      };
    }

    // 4. ADDITIONAL SAFETY: Check if snapshot has any eligible users
    const eligibleUserCount = snapshot.eligibleUsers?.length || 0;
    console.log('[🛡️ELIGIBILITY] Snapshot:', snapshot.snapshotName, 'has', eligibleUserCount, 'eligible users');

    if (eligibleUserCount === 0) {
      console.log('[🛡️ELIGIBILITY] REJECTED - Snapshot has no eligible users:', snapshot.snapshotName);
      return {
        eligible: false,
        reason: "No users are eligible for this campaign. The eligibility snapshot is empty.",
        campaignName: campaign.name,
        snapshotName: snapshot.snapshotName,
        emptySnapshot: true,
      };
    }

    // TESTING BYPASS: Allow whitelisted addresses to mint multiple times
    // NOTE: This ONLY bypasses the "already claimed" check, NOT the snapshot membership check
    const isTestingWhitelisted = TESTING_MULTI_MINT_WHITELIST.includes(args.walletAddress);
    if (isTestingWhitelisted) {
      console.log('[🧪TEST] Whitelisted address detected for campaign:', campaign.name, args.walletAddress);

      // Still MUST check if in snapshot - testing whitelist doesn't bypass this
      const isInSnapshot = snapshot.eligibleUsers?.some((user: any) => {
        return user.stakeAddress === args.walletAddress || user.walletAddress === args.walletAddress;
      });

      if (!isInSnapshot) {
        console.log('[🧪TEST] REJECTED - Whitelisted address not in snapshot');
        return {
          eligible: false,
          reason: "Stake address not in campaign's eligibility snapshot (testing whitelist still requires snapshot membership)",
          campaignName: campaign.name,
        };
      }

      // Phase II: Get corporation name from users table
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      console.log('[🧪TEST] APPROVED - Testing whitelist user in snapshot');
      return {
        eligible: true,
        reason: "Testing whitelist - multiple mints allowed for this campaign",
        campaignName: campaign.name,
        snapshotName: snapshot.snapshotName,
        corporationName: user?.corporationName || null,
        testingMode: true,
      };
    }

    // 5. Check if wallet is in the campaign's snapshot
    const isInSnapshot = snapshot.eligibleUsers?.some((user: any) => {
      return user.stakeAddress === args.walletAddress || user.walletAddress === args.walletAddress;
    });

    if (!isInSnapshot) {
      console.log('[🛡️ELIGIBILITY] REJECTED - Wallet not in snapshot:', args.walletAddress.substring(0, 20) + '...');
      return {
        eligible: false,
        reason: "Not eligible for this campaign",
        campaignName: campaign.name,
      };
    }

    // 5. Check if already has an ACTIVE reservation for THIS CAMPAIGN
    const activeReservation = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) =>
        q.and(
          q.eq(q.field("campaignId"), args.campaignId),
          q.eq(q.field("reservedBy"), args.walletAddress),
          q.eq(q.field("status"), "reserved")
        )
      )
      .first();

    if (activeReservation) {
      return {
        eligible: false,
        reason: "You already have an NFT reservation in progress for this campaign. Please complete your payment or wait for it to expire.",
        hasActiveReservation: true,
        campaignName: campaign.name,
      };
    }

    // 6. Check if already claimed FROM THIS CAMPAIGN (unless campaign allows multiple mints)
    if (!campaign.allowMultipleMints) {
      const soldNFT = await ctx.db
        .query("commemorativeNFTInventory")
        .filter((q) =>
          q.and(
            q.eq(q.field("campaignId"), args.campaignId),
            q.eq(q.field("soldTo"), args.walletAddress),
            q.eq(q.field("status"), "sold")
          )
        )
        .first();

      if (soldNFT) {
        return {
          eligible: false,
          reason: "You have already claimed from this campaign",
          alreadyClaimed: true,
          campaignName: campaign.name,
          claimedNFTDetails: {
            name: soldNFT.name,
            nftNumber: soldNFT.nftNumber,
            imageUrl: soldNFT.imageUrl,
            soldAt: soldNFT.soldAt,
          },
        };
      }
    } else {
      console.log('[CAMPAIGN] Multiple mints allowed for campaign:', campaign.name, '- skipping already claimed check');
    }

    // 7. All checks passed - user is eligible
    // Phase II: Get corporation name from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    console.log('[🛡️ELIGIBILITY] APPROVED - Wallet passed all checks:', {
      wallet: args.walletAddress.substring(0, 20) + '...',
      campaign: campaign.name,
      snapshot: snapshot.snapshotName,
      corporation: user?.corporationName || 'unknown',
    });

    return {
      eligible: true,
      reason: "Eligible for this campaign",
      campaignName: campaign.name,
      snapshotName: snapshot.snapshotName,
      corporationName: user?.corporationName || null,
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
        .withIndex("by_reserved_by", (q: any) => q.eq("reservedBy", stakeAddress))
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
 * Batch check claim status for multiple stake addresses for a specific campaign
 * Used by admin Player Management to show who has claimed from each campaign
 */
export const batchCheckClaimStatusForCampaign = query({
  args: {
    stakeAddresses: v.array(v.string()),
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const claimStatusMap: Record<string, { claimed: boolean; claimedAt?: number }> = {};

    // Check each stake address for completed reservations in this specific campaign
    for (const stakeAddress of args.stakeAddresses) {
      const completedReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_campaign_and_wallet", (q: any) =>
          q.eq("campaignId", args.campaignId).eq("reservedBy", stakeAddress)
        )
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (completedReservation) {
        claimStatusMap[stakeAddress] = {
          claimed: true,
          claimedAt: completedReservation.completedAt || completedReservation.reservedAt,
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
