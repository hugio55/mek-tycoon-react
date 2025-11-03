import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Campaign-Aware Commemorative NFT Reservation System
 *
 * This is the updated reservation system that supports multiple campaigns.
 * It replaces the original commemorativeNFTReservations.ts for new campaigns.
 *
 * Key differences from original:
 * - Requires campaignId parameter for all operations
 * - Enforces campaign-scoped reservations (one per user per campaign)
 * - Verifies campaign is active before allowing reservations
 * - Uses campaign-scoped inventory queries
 */

const RESERVATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const GRACE_PERIOD = 30 * 1000; // 30 seconds

// ============================================================================
// CAMPAIGN-SCOPED RESERVATION MUTATIONS
// ============================================================================

/**
 * Create a new reservation for the next available NFT in a specific campaign
 *
 * This enforces:
 * - Campaign must be active
 * - User can only have ONE active reservation per campaign
 * - Reserves lowest available number in that campaign
 */
export const createCampaignReservation = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    console.log('[CAMPAIGN RESERVATION] Creating reservation for:', args.walletAddress, 'in campaign:', args.campaignId);

    // Verify campaign exists and is active
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return {
        success: false,
        error: "Campaign not found",
      };
    }

    if (campaign.status !== "active") {
      return {
        success: false,
        error: `Campaign "${campaign.name}" is not currently active`,
      };
    }

    // Check if campaign has ended
    if (campaign.endDate && now > campaign.endDate) {
      return {
        success: false,
        error: `Campaign "${campaign.name}" has ended`,
      };
    }

    // Check if campaign hasn't started yet
    if (campaign.startDate && now < campaign.startDate) {
      return {
        success: false,
        error: `Campaign "${campaign.name}" hasn't started yet`,
      };
    }

    // First, clean up any expired reservations for this campaign
    await cleanupExpiredCampaignReservations(ctx, args.campaignId, now);

    // Check if user already has an active reservation in THIS campaign
    const existingReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingReservation) {
      console.log('[CAMPAIGN RESERVATION] User already has active reservation in this campaign:', existingReservation.nftNumber);

      // Return the existing reservation info
      const existingNFT = await ctx.db.get(existingReservation.nftInventoryId);
      return {
        success: true,
        reservation: existingReservation,
        nft: existingNFT,
        isExisting: true,
      };
    }

    // Check if user has already completed a reservation in this campaign (one per user per campaign)
    const hasCompleted = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (hasCompleted) {
      return {
        success: false,
        error: `You have already claimed an NFT from the "${campaign.name}" campaign`,
      };
    }

    // Find the lowest available NFT in this campaign
    const availableNFT = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_status", (q) =>
        q.eq("campaignId", args.campaignId).eq("status", "available")
      )
      .order("asc") // Get lowest number first
      .first();

    if (!availableNFT) {
      console.log('[CAMPAIGN RESERVATION] No available NFTs in campaign:', campaign.name);
      return {
        success: false,
        error: `All NFTs have been claimed from the "${campaign.name}" campaign`,
      };
    }

    console.log('[CAMPAIGN RESERVATION] Found available NFT:', availableNFT.nftNumber, availableNFT.name);

    // Create the reservation
    const expiresAt = now + RESERVATION_TIMEOUT;
    const reservationId = await ctx.db.insert("commemorativeNFTReservations", {
      campaignId: args.campaignId,
      nftInventoryId: availableNFT._id,
      nftUid: availableNFT.nftUid,
      nftNumber: availableNFT.nftNumber,
      reservedBy: args.walletAddress,
      reservedAt: now,
      expiresAt,
      status: "active",
    });

    // Update NFT inventory status to reserved
    await ctx.db.patch(availableNFT._id, {
      status: "reserved",
    });

    // Update campaign counters
    await ctx.db.patch(args.campaignId, {
      availableNFTs: campaign.availableNFTs - 1,
      reservedNFTs: campaign.reservedNFTs + 1,
      updatedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Created reservation:', reservationId, 'for NFT:', availableNFT.nftNumber, 'in campaign:', campaign.name);

    return {
      success: true,
      reservation: {
        _id: reservationId,
        campaignId: args.campaignId,
        nftInventoryId: availableNFT._id,
        nftUid: availableNFT.nftUid,
        nftNumber: availableNFT.nftNumber,
        reservedBy: args.walletAddress,
        reservedAt: now,
        expiresAt,
        status: "active" as const,
      },
      nft: availableNFT,
      campaign: {
        name: campaign.name,
        description: campaign.description,
      },
      isExisting: false,
    };
  },
});

/**
 * Complete a reservation (user successfully paid)
 *
 * Campaign-aware version that updates campaign counters
 */
export const completeCampaignReservation = mutation({
  args: {
    reservationId: v.id("commemorativeNFTReservations"),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    // Update reservation status
    await ctx.db.patch(args.reservationId, {
      status: "completed",
    });

    // Update NFT inventory to sold
    await ctx.db.patch(reservation.nftInventoryId, {
      status: "sold",
    });

    // Update campaign counters if this is a campaign-scoped reservation
    if (reservation.campaignId) {
      const campaign = await ctx.db.get(reservation.campaignId);
      if (campaign) {
        await ctx.db.patch(reservation.campaignId, {
          reservedNFTs: Math.max(0, campaign.reservedNFTs - 1),
          soldNFTs: campaign.soldNFTs + 1,
          updatedAt: Date.now(),
        });
      }
    }

    console.log('[CAMPAIGN RESERVATION] Completed reservation:', args.reservationId, 'for NFT:', reservation.nftNumber);

    return { success: true };
  },
});

/**
 * Complete reservation by wallet address (called by webhook)
 *
 * Campaign-aware version that finds reservation within specific campaign
 */
export const completeCampaignReservationByWallet = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[CAMPAIGN RESERVATION] Webhook attempting to complete reservation for wallet:', args.walletAddress, 'in campaign:', args.campaignId);

    // Find active reservation for this wallet in this campaign
    const reservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!reservation) {
      console.log('[CAMPAIGN RESERVATION] No active reservation found for wallet:', args.walletAddress, 'in campaign:', args.campaignId);
      return { success: false, error: "No active reservation found" };
    }

    console.log('[CAMPAIGN RESERVATION] Found reservation:', reservation._id, 'NFT:', reservation.nftNumber);

    // Update reservation status
    await ctx.db.patch(reservation._id, {
      status: "completed",
    });

    // Update NFT inventory to sold
    await ctx.db.patch(reservation.nftInventoryId, {
      status: "sold",
    });

    // Update campaign counters
    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        reservedNFTs: Math.max(0, campaign.reservedNFTs - 1),
        soldNFTs: campaign.soldNFTs + 1,
        updatedAt: Date.now(),
      });
    }

    console.log('[CAMPAIGN RESERVATION] Completed reservation from webhook:', reservation._id, 'for NFT:', reservation.nftNumber);

    return { success: true, reservationId: reservation._id, nftNumber: reservation.nftNumber };
  },
});

/**
 * Release a reservation (user cancelled or expired)
 *
 * Campaign-aware version that updates campaign counters
 */
export const releaseCampaignReservation = mutation({
  args: {
    reservationId: v.id("commemorativeNFTReservations"),
    reason: v.optional(v.union(v.literal("cancelled"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    const newStatus = args.reason === "expired" ? "expired" : "cancelled";

    // Update reservation status
    await ctx.db.patch(args.reservationId, {
      status: newStatus,
    });

    // Return NFT to available pool (unless it's already sold somehow)
    const nft = await ctx.db.get(reservation.nftInventoryId);
    if (nft && nft.status === "reserved") {
      await ctx.db.patch(reservation.nftInventoryId, {
        status: "available",
      });

      // Update campaign counters if this is a campaign-scoped reservation
      if (reservation.campaignId) {
        const campaign = await ctx.db.get(reservation.campaignId);
        if (campaign) {
          await ctx.db.patch(reservation.campaignId, {
            availableNFTs: campaign.availableNFTs + 1,
            reservedNFTs: Math.max(0, campaign.reservedNFTs - 1),
            updatedAt: Date.now(),
          });
        }
      }

      console.log('[CAMPAIGN RESERVATION] Released NFT back to pool:', reservation.nftNumber);
    }

    console.log('[CAMPAIGN RESERVATION] Released reservation:', args.reservationId, 'reason:', newStatus);

    return { success: true };
  },
});

// ============================================================================
// CAMPAIGN-SCOPED QUERIES
// ============================================================================

/**
 * Get active reservation for a user in a specific campaign
 */
export const getActiveCampaignReservation = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find active reservation for this user in this campaign
    const reservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!reservation) {
      return null;
    }

    // Check if expired
    if (reservation.expiresAt < now) {
      console.log('[CAMPAIGN RESERVATION] Reservation expired:', reservation._id);
      return {
        ...reservation,
        isExpired: true,
      };
    }

    // Get the NFT details
    const nft = await ctx.db.get(reservation.nftInventoryId);

    // Get campaign details
    const campaign = await ctx.db.get(args.campaignId);

    // Calculate remaining time
    const remainingMs = Math.max(0, reservation.expiresAt - now);
    const isPaymentWindowOpen = !!reservation.paymentWindowOpenedAt && !reservation.paymentWindowClosedAt;

    return {
      ...reservation,
      nft,
      campaign: campaign ? {
        name: campaign.name,
        description: campaign.description,
      } : null,
      isExpired: false,
      remainingMs,
      isPaymentWindowOpen,
    };
  },
});

/**
 * Get all reservations for a campaign (admin use)
 */
export const getCampaignReservations = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let reservationsQuery = ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId));

    const reservations = await reservationsQuery.collect();

    // Filter by status if specified
    const filtered = args.status
      ? reservations.filter((r) => r.status === args.status)
      : reservations;

    return filtered;
  },
});

// ============================================================================
// PAYMENT WINDOW TRACKING (Same as original)
// ============================================================================

export const markPaymentWindowOpened = mutation({
  args: {
    reservationId: v.id("commemorativeNFTReservations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      console.log('[CAMPAIGN RESERVATION] Reservation not found:', args.reservationId);
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.status !== "active") {
      console.log('[CAMPAIGN RESERVATION] Reservation not active:', reservation.status);
      return { success: false, error: "Reservation not active" };
    }

    await ctx.db.patch(args.reservationId, {
      paymentWindowOpenedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Payment window opened for reservation:', args.reservationId);

    return { success: true };
  },
});

export const markPaymentWindowClosed = mutation({
  args: {
    reservationId: v.id("commemorativeNFTReservations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.status !== "active") {
      return { success: false, error: "Reservation not active" };
    }

    await ctx.db.patch(args.reservationId, {
      paymentWindowClosedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Payment window closed for reservation:', args.reservationId);

    return { success: true };
  },
});

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Cleanup expired reservations for a specific campaign
 */
async function cleanupExpiredCampaignReservations(ctx: any, campaignId: Id<"commemorativeCampaigns">, now: number) {
  const expiredReservations = await ctx.db
    .query("commemorativeNFTReservations")
    .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("status"), "active"),
        q.lt(q.field("expiresAt"), now - GRACE_PERIOD)
      )
    )
    .collect();

  const campaign = await ctx.db.get(campaignId);
  let releasedCount = 0;

  for (const reservation of expiredReservations) {
    console.log('[CAMPAIGN RESERVATION] Auto-expiring reservation:', reservation._id, 'NFT:', reservation.nftNumber);

    // Mark as expired
    await ctx.db.patch(reservation._id, {
      status: "expired",
    });

    // Return NFT to available pool
    const nft = await ctx.db.get(reservation.nftInventoryId);
    if (nft && nft.status === "reserved") {
      await ctx.db.patch(reservation.nftInventoryId, {
        status: "available",
      });
      releasedCount++;
    }
  }

  // Update campaign counters if any were released
  if (releasedCount > 0 && campaign) {
    await ctx.db.patch(campaignId, {
      availableNFTs: campaign.availableNFTs + releasedCount,
      reservedNFTs: Math.max(0, campaign.reservedNFTs - releasedCount),
      updatedAt: now,
    });
  }

  if (expiredReservations.length > 0) {
    console.log('[CAMPAIGN RESERVATION] Cleaned up', expiredReservations.length, 'expired reservations for campaign:', campaignId);
  }
}

/**
 * Manual cleanup mutation for a specific campaign
 */
export const cleanupExpiredCampaignReservationsMutation = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await cleanupExpiredCampaignReservations(ctx, args.campaignId, now);
    return { success: true };
  },
});

/**
 * Cleanup ALL expired reservations across ALL campaigns
 */
export const cleanupAllExpiredReservations = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Get all campaigns
    const campaigns = await ctx.db.query("commemorativeCampaigns").collect();

    let totalCleaned = 0;
    for (const campaign of campaigns) {
      await cleanupExpiredCampaignReservations(ctx, campaign._id, now);
      totalCleaned++;
    }

    console.log('[CAMPAIGN RESERVATION] Cleaned up expired reservations for', totalCleaned, 'campaigns');

    return { success: true, campaignsProcessed: totalCleaned };
  },
});
