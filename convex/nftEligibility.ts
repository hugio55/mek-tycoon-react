import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * NFT ELIGIBILITY SYSTEM - CAMPAIGN-BASED
 *
 * This file contains eligibility checking functions for the campaign-based NFT system.
 * Each campaign can have its own eligibility snapshot assigned.
 *
 * LEGACY GLOBAL ELIGIBILITY SYSTEM REMOVED (December 2025):
 * - getActiveSnapshot, setActiveSnapshot, checkClaimEligibility, clearActiveSnapshot,
 *   getConfig, debugEligibilityState, debugStakeAddressMatch - all removed
 * - nftEligibilityConfig table no longer used
 * - CommemorativeToken1Admin tab removed from admin UI
 *
 * The campaign-based system (checkCampaignEligibility) is now the only eligibility system.
 * Each campaign uses its own eligibilitySnapshotId field for whitelist control.
 */

/**
 * Check if a stake address is eligible to claim from a SPECIFIC CAMPAIGN
 * This is the per-campaign eligibility system.
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

    // 6. Check if already has an ACTIVE reservation for THIS CAMPAIGN
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

    // 7. Check if already claimed FROM THIS CAMPAIGN (unless campaign allows multiple mints)
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

    // 8. All checks passed - user is eligible
    // Phase II: Get corporation name from users table using stake address
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    // Fallback: Try to get displayName from the snapshot if user table lookup fails
    // This handles cases where user exists in snapshot but not in users table
    let corporationName = user?.corporationName || null;
    if (!corporationName) {
      const snapshotUser = snapshot.eligibleUsers?.find((u: any) =>
        u.stakeAddress === args.walletAddress || u.walletAddress === args.walletAddress
      );
      corporationName = snapshotUser?.displayName || null;
      if (snapshotUser?.displayName) {
        console.log('[🛡️ELIGIBILITY] Using displayName from snapshot as fallback:', snapshotUser.displayName);
      }
    }

    console.log('[🛡️ELIGIBILITY] APPROVED - Wallet passed all checks:', {
      wallet: args.walletAddress.substring(0, 20) + '...',
      campaign: campaign.name,
      snapshot: snapshot.snapshotName,
      corporation: corporationName || 'unknown',
      source: user?.corporationName ? 'users_table' : 'snapshot_displayName',
    });

    return {
      eligible: true,
      reason: "Eligible for this campaign",
      campaignName: campaign.name,
      snapshotName: snapshot.snapshotName,
      corporationName: corporationName,
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
