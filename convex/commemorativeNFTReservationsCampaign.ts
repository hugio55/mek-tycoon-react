import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
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

const RESERVATION_TIMEOUT = 25 * 60 * 1000; // 25 minutes in milliseconds (5-min buffer beyond NMKR's 20-min window)
const GRACE_PERIOD = 5 * 1000; // 5 seconds (minimal grace for network delays)

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

    // PHASE 2: Check inventory table for active reservation (NEW - single source of truth)
    const existingInventoryReservation = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "reserved"))
      .first();

    if (existingInventoryReservation) {
      console.log('[CAMPAIGN RESERVATION] User already has active reservation in this campaign:', existingInventoryReservation.nftNumber);

      return {
        success: true,
        reservation: {
          _id: existingInventoryReservation._id,
          campaignId: args.campaignId,
          nftInventoryId: existingInventoryReservation._id, // Same as reservation ID in new system
          nftUid: existingInventoryReservation.nftUid,
          nftNumber: existingInventoryReservation.nftNumber,
          reservedBy: existingInventoryReservation.reservedBy!,
          reservedAt: existingInventoryReservation.reservedAt!,
          expiresAt: existingInventoryReservation.expiresAt!,
          status: "active" as const,
          paymentWindowOpenedAt: existingInventoryReservation.paymentWindowOpenedAt,
          paymentWindowClosedAt: existingInventoryReservation.paymentWindowClosedAt,
        },
        nft: existingInventoryReservation,
        isExisting: true,
      };
    }

    // PHASE 2: Check if user has already completed (sold NFT in inventory)
    // In new system, completed reservations show as status="sold" in inventory
    const hasCompleted = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "sold"))
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

    // PHASE 2: Single atomic operation - update inventory with reservation data
    const expiresAt = now + RESERVATION_TIMEOUT;
    await ctx.db.patch(availableNFT._id, {
      status: "reserved",
      reservedBy: args.walletAddress,
      reservedAt: now,
      expiresAt,
      paymentWindowOpenedAt: undefined, // Reset payment window fields
      paymentWindowClosedAt: undefined,
    });

    // PHASE 2: Dual-write to old table for safety (remove in Phase 3)
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

    // Update campaign counters
    await ctx.db.patch(args.campaignId, {
      availableNFTs: campaign.availableNFTs - 1,
      reservedNFTs: campaign.reservedNFTs + 1,
      updatedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Created reservation:', availableNFT._id, 'for NFT:', availableNFT.nftNumber, 'in campaign:', campaign.name);
    console.log('[CAMPAIGN RESERVATION] (Phase 2: Dual-write legacy ID:', reservationId, ')');

    // PHASE 2: Return inventory ID as primary reservation ID
    // The inventory row IS the reservation now
    return {
      success: true,
      reservation: {
        _id: availableNFT._id, // Inventory ID is now the reservation ID
        campaignId: args.campaignId,
        nftInventoryId: availableNFT._id,
        nftUid: availableNFT.nftUid,
        nftNumber: availableNFT.nftNumber,
        reservedBy: args.walletAddress,
        reservedAt: now,
        expiresAt,
        status: "active" as const,
        legacyReservationId: reservationId, // Keep old ID for dual-write compatibility
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
 * PHASE 2: Now accepts inventory IDs (new system) or legacy reservation IDs
 * Tries inventory table first, falls back to old table for compatibility
 */
export const completeCampaignReservation = mutation({
  args: {
    reservationId: v.union(
      v.id("commemorativeNFTInventory"),
      v.id("commemorativeNFTReservations")
    ),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    // PHASE 2: Try inventory table first (new system)
    const inventoryRow = await ctx.db.get(args.reservationId as Id<"commemorativeNFTInventory">);

    if (inventoryRow && inventoryRow.status === "reserved") {
      // New system: Inventory row IS the reservation
      await ctx.db.patch(inventoryRow._id, {
        status: "sold",
        // Keep reservation fields for record-keeping
      });

      // Update campaign counters
      if (inventoryRow.campaignId) {
        const campaign = await ctx.db.get(inventoryRow.campaignId);
        if (campaign) {
          await ctx.db.patch(inventoryRow.campaignId, {
            reservedNFTs: Math.max(0, campaign.reservedNFTs - 1),
            soldNFTs: campaign.soldNFTs + 1,
            updatedAt: Date.now(),
          });
        }
      }

      // PHASE 2: Dual-write to old table if exists
      const legacyReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_inventory_id", (q) => q.eq("nftInventoryId", inventoryRow._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (legacyReservation) {
        await ctx.db.patch(legacyReservation._id, {
          status: "completed",
        });
      }

      console.log('[CAMPAIGN RESERVATION] Completed reservation (inventory ID):', inventoryRow._id, 'for NFT:', inventoryRow.nftNumber);
      return { success: true };
    }

    // Fallback: Legacy reservation system
    const reservation = await ctx.db.get(args.reservationId as Id<"commemorativeNFTReservations">);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    // Update reservation status
    await ctx.db.patch(args.reservationId as Id<"commemorativeNFTReservations">, {
      status: "completed",
    });

    // Update NFT inventory to sold
    await ctx.db.patch(reservation.nftInventoryId, {
      status: "sold",
    });

    // Update campaign counters
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

    console.log('[CAMPAIGN RESERVATION] Completed reservation (legacy ID):', args.reservationId, 'for NFT:', reservation.nftNumber);
    return { success: true };
  },
});

/**
 * Complete reservation by wallet address (called by webhook)
 *
 * PHASE 2: Reads from inventory table (new system)
 */
export const completeCampaignReservationByWallet = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[CAMPAIGN RESERVATION] Webhook attempting to complete reservation for wallet:', args.walletAddress, 'in campaign:', args.campaignId);

    // PHASE 2: Find active reservation in inventory table
    const inventoryRow = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "reserved"))
      .first();

    if (!inventoryRow) {
      console.log('[CAMPAIGN RESERVATION] No active reservation found for wallet:', args.walletAddress, 'in campaign:', args.campaignId);
      return { success: false, error: "No active reservation found" };
    }

    console.log('[CAMPAIGN RESERVATION] Found reservation:', inventoryRow._id, 'NFT:', inventoryRow.nftNumber);

    // Update inventory to sold (keeping reservation fields for record)
    await ctx.db.patch(inventoryRow._id, {
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

    // PHASE 2: Dual-write to old table if exists
    const legacyReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (legacyReservation) {
      await ctx.db.patch(legacyReservation._id, {
        status: "completed",
      });
    }

    console.log('[CAMPAIGN RESERVATION] Completed reservation from webhook:', inventoryRow._id, 'for NFT:', inventoryRow.nftNumber);

    return { success: true, reservationId: inventoryRow._id, nftNumber: inventoryRow.nftNumber };
  },
});

/**
 * Release a reservation (user cancelled or expired)
 *
 * PHASE 2: Now accepts inventory IDs (new system) or legacy reservation IDs
 * Clears reservation fields and returns NFT to available pool
 */
export const releaseCampaignReservation = mutation({
  args: {
    reservationId: v.union(
      v.id("commemorativeNFTInventory"),
      v.id("commemorativeNFTReservations")
    ),
    reason: v.optional(v.union(v.literal("cancelled"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    // PHASE 2: Try inventory table first (new system)
    const inventoryRow = await ctx.db.get(args.reservationId as Id<"commemorativeNFTInventory">);

    if (inventoryRow && inventoryRow.status === "reserved") {
      // New system: Clear reservation fields and set status to available
      await ctx.db.patch(inventoryRow._id, {
        status: "available",
        reservedBy: undefined,
        reservedAt: undefined,
        expiresAt: undefined,
        paymentWindowOpenedAt: undefined,
        paymentWindowClosedAt: undefined,
      });

      // Update campaign counters
      if (inventoryRow.campaignId) {
        const campaign = await ctx.db.get(inventoryRow.campaignId);
        if (campaign) {
          await ctx.db.patch(inventoryRow.campaignId, {
            availableNFTs: campaign.availableNFTs + 1,
            reservedNFTs: Math.max(0, campaign.reservedNFTs - 1),
            updatedAt: Date.now(),
          });
        }
      }

      // PHASE 2: Dual-write to old table if exists
      const legacyReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_inventory_id", (q) => q.eq("nftInventoryId", inventoryRow._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (legacyReservation) {
        const newStatus = args.reason === "expired" ? "expired" : "cancelled";
        await ctx.db.patch(legacyReservation._id, {
          status: newStatus,
        });
      }

      console.log('[CAMPAIGN RESERVATION] Released reservation (inventory ID):', inventoryRow._id, 'NFT:', inventoryRow.nftNumber, 'reason:', args.reason);
      return { success: true };
    }

    // Fallback: Legacy reservation system
    const reservation = await ctx.db.get(args.reservationId as Id<"commemorativeNFTReservations">);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    const newStatus = args.reason === "expired" ? "expired" : "cancelled";

    // Update reservation status
    await ctx.db.patch(args.reservationId as Id<"commemorativeNFTReservations">, {
      status: newStatus,
    });

    // Return NFT to available pool
    const nft = await ctx.db.get(reservation.nftInventoryId);
    if (nft && nft.status === "reserved") {
      await ctx.db.patch(reservation.nftInventoryId, {
        status: "available",
      });

      // Update campaign counters
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

      console.log('[CAMPAIGN RESERVATION] Released NFT back to pool (legacy):', reservation.nftNumber);
    }

    console.log('[CAMPAIGN RESERVATION] Released reservation (legacy ID):', args.reservationId, 'reason:', newStatus);
    return { success: true };
  },
});

// ============================================================================
// CAMPAIGN-SCOPED QUERIES
// ============================================================================

/**
 * Get active reservation for a user in a specific campaign
 *
 * PHASE 2: Reads from inventory table (new system)
 */
export const getActiveCampaignReservation = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // PHASE 2: Find active reservation in inventory table
    const inventoryRow = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "reserved"))
      .first();

    if (!inventoryRow || !inventoryRow.expiresAt) {
      return null;
    }

    // Check if expired
    if (inventoryRow.expiresAt < now) {
      console.log('[CAMPAIGN RESERVATION] Reservation expired:', inventoryRow._id);
      return {
        _id: inventoryRow._id,
        campaignId: args.campaignId,
        nftInventoryId: inventoryRow._id,
        nftUid: inventoryRow.nftUid,
        nftNumber: inventoryRow.nftNumber,
        reservedBy: inventoryRow.reservedBy!,
        reservedAt: inventoryRow.reservedAt!,
        expiresAt: inventoryRow.expiresAt,
        status: "active" as const,
        paymentWindowOpenedAt: inventoryRow.paymentWindowOpenedAt,
        paymentWindowClosedAt: inventoryRow.paymentWindowClosedAt,
        nft: inventoryRow,
        campaign: null,
        isExpired: true,
        remainingMs: 0,
        isPaymentWindowOpen: false,
      };
    }

    // Get campaign details
    const campaign = await ctx.db.get(args.campaignId);

    // Calculate remaining time
    const remainingMs = Math.max(0, inventoryRow.expiresAt - now);
    const isPaymentWindowOpen = !!inventoryRow.paymentWindowOpenedAt && !inventoryRow.paymentWindowClosedAt;

    return {
      _id: inventoryRow._id,
      campaignId: args.campaignId,
      nftInventoryId: inventoryRow._id,
      nftUid: inventoryRow.nftUid,
      nftNumber: inventoryRow.nftNumber,
      reservedBy: inventoryRow.reservedBy!,
      reservedAt: inventoryRow.reservedAt!,
      expiresAt: inventoryRow.expiresAt,
      status: "active" as const,
      paymentWindowOpenedAt: inventoryRow.paymentWindowOpenedAt,
      paymentWindowClosedAt: inventoryRow.paymentWindowClosedAt,
      nft: inventoryRow,
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

/**
 * Mark payment window opened
 *
 * PHASE 2: Accepts inventory IDs (new system) or legacy reservation IDs
 */
export const markPaymentWindowOpened = mutation({
  args: {
    reservationId: v.union(
      v.id("commemorativeNFTInventory"),
      v.id("commemorativeNFTReservations")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // PHASE 2: Try inventory table first (new system)
    const inventoryRow = await ctx.db.get(args.reservationId as Id<"commemorativeNFTInventory">);

    if (inventoryRow && inventoryRow.status === "reserved") {
      // Update inventory row
      await ctx.db.patch(inventoryRow._id, {
        paymentWindowOpenedAt: now,
      });

      // PHASE 2: Dual-write to old table if exists
      const legacyReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_inventory_id", (q) => q.eq("nftInventoryId", inventoryRow._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (legacyReservation) {
        await ctx.db.patch(legacyReservation._id, {
          paymentWindowOpenedAt: now,
        });
      }

      console.log('[CAMPAIGN RESERVATION] Payment window opened (inventory ID):', inventoryRow._id);
      return { success: true };
    }

    // Fallback: Legacy reservation system
    const reservation = await ctx.db.get(args.reservationId as Id<"commemorativeNFTReservations">);
    if (!reservation) {
      console.log('[CAMPAIGN RESERVATION] Reservation not found:', args.reservationId);
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.status !== "active") {
      console.log('[CAMPAIGN RESERVATION] Reservation not active:', reservation.status);
      return { success: false, error: "Reservation not active" };
    }

    await ctx.db.patch(args.reservationId as Id<"commemorativeNFTReservations">, {
      paymentWindowOpenedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Payment window opened (legacy ID):', args.reservationId);
    return { success: true };
  },
});

/**
 * Mark payment window closed
 *
 * PHASE 2: Accepts inventory IDs (new system) or legacy reservation IDs
 */
export const markPaymentWindowClosed = mutation({
  args: {
    reservationId: v.union(
      v.id("commemorativeNFTInventory"),
      v.id("commemorativeNFTReservations")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // PHASE 2: Try inventory table first (new system)
    const inventoryRow = await ctx.db.get(args.reservationId as Id<"commemorativeNFTInventory">);

    if (inventoryRow && inventoryRow.status === "reserved") {
      // Update inventory row
      await ctx.db.patch(inventoryRow._id, {
        paymentWindowClosedAt: now,
      });

      // PHASE 2: Dual-write to old table if exists
      const legacyReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_inventory_id", (q) => q.eq("nftInventoryId", inventoryRow._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (legacyReservation) {
        await ctx.db.patch(legacyReservation._id, {
          paymentWindowClosedAt: now,
        });
      }

      console.log('[CAMPAIGN RESERVATION] Payment window closed (inventory ID):', inventoryRow._id);
      return { success: true };
    }

    // Fallback: Legacy reservation system
    const reservation = await ctx.db.get(args.reservationId as Id<"commemorativeNFTReservations">);
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.status !== "active") {
      return { success: false, error: "Reservation not active" };
    }

    await ctx.db.patch(args.reservationId as Id<"commemorativeNFTReservations">, {
      paymentWindowClosedAt: now,
    });

    console.log('[CAMPAIGN RESERVATION] Payment window closed (legacy ID):', args.reservationId);
    return { success: true };
  },
});

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Cleanup expired reservations for a specific campaign
 * Returns the number of expired reservations actually cleaned up
 *
 * PHASE 2: Reads from inventory table (new system)
 */
async function cleanupExpiredCampaignReservations(ctx: any, campaignId: Id<"commemorativeCampaigns">, now: number): Promise<number> {
  // PHASE 2: Find expired reservations in inventory table
  const expiredInventoryRows = await ctx.db
    .query("commemorativeNFTInventory")
    .withIndex("by_campaign_and_status", (q) =>
      q.eq("campaignId", campaignId).eq("status", "reserved")
    )
    .filter((q: any) =>
      q.and(
        q.neq(q.field("expiresAt"), undefined),
        q.lt(q.field("expiresAt"), now - GRACE_PERIOD)
      )
    )
    .collect();

  const campaign = await ctx.db.get(campaignId);
  let releasedCount = 0;

  for (const inventoryRow of expiredInventoryRows) {
    console.log('[CAMPAIGN RESERVATION] Auto-expiring reservation:', inventoryRow._id, 'NFT:', inventoryRow.nftNumber);

    // Clear reservation fields and return to available
    await ctx.db.patch(inventoryRow._id, {
      status: "available",
      reservedBy: undefined,
      reservedAt: undefined,
      expiresAt: undefined,
      paymentWindowOpenedAt: undefined,
      paymentWindowClosedAt: undefined,
    });

    releasedCount++;

    // PHASE 2: Dual-write to old table if exists
    const legacyReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_inventory_id", (q) => q.eq("nftInventoryId", inventoryRow._id))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .first();

    if (legacyReservation) {
      await ctx.db.patch(legacyReservation._id, {
        status: "expired",
      });
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

  if (expiredInventoryRows.length > 0) {
    console.log('[CAMPAIGN RESERVATION] Cleaned up', expiredInventoryRows.length, 'expired reservations for campaign:', campaignId);
  }

  return expiredInventoryRows.length;
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

    let totalExpiredReservations = 0;
    for (const campaign of campaigns) {
      const cleanedCount = await cleanupExpiredCampaignReservations(ctx, campaign._id, now);
      totalExpiredReservations += cleanedCount;
    }

    // Only log if we actually cleaned up expired reservations
    if (totalExpiredReservations > 0) {
      console.log('[CAMPAIGN RESERVATION] Cleaned up', totalExpiredReservations, 'expired reservations across', campaigns.length, 'campaigns');
    }

    return { success: true, campaignsProcessed: campaigns.length, expiredReservationsCleaned: totalExpiredReservations };
  },
});

/**
 * INTERNAL: Cleanup ALL expired reservations (called by cron job)
 *
 * Runs every minute via cron to automatically expire reservations
 * that have passed their 10-minute timeout window
 *
 * Only logs when actual cleanup work is performed (silent when no expired reservations exist)
 */
export const internalCleanupExpiredReservations = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Get all campaigns
    const campaigns = await ctx.db.query("commemorativeCampaigns").collect();

    let totalExpiredReservations = 0;
    for (const campaign of campaigns) {
      const cleanedCount = await cleanupExpiredCampaignReservations(ctx, campaign._id, now);
      totalExpiredReservations += cleanedCount;
    }

    // Only log when we actually found and cleaned up expired reservations
    if (totalExpiredReservations > 0) {
      console.log('[CRON CLEANUP] Cleaned up', totalExpiredReservations, 'expired reservations across', campaigns.length, 'campaigns');
    }

    return { success: true, campaignsProcessed: campaigns.length, expiredReservationsCleaned: totalExpiredReservations };
  },
});
