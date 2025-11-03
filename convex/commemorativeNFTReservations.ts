import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Commemorative NFT Reservation System
 *
 * This system manages the reservation flow for Lab Rat NFTs:
 * 1. User clicks "Claim NFT" → reserve next available NFT for 10 minutes
 * 2. Timer pauses when NMKR payment window is open
 * 3. Timer resumes if window closes without payment
 * 4. 30-second grace period after expiry for slow payments
 * 5. Auto-release expired reservations
 */

const RESERVATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const GRACE_PERIOD = 30 * 1000; // 30 seconds

// Create a new reservation for the next available NFT
export const createReservation = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    console.log('[RESERVATION] Creating reservation for:', args.walletAddress);

    // First, clean up any expired reservations
    await cleanupExpiredReservations(ctx, now);

    // Find the lowest available NFT (not reserved or sold)
    const availableNFT = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_status_and_number", (q) => q.eq("status", "available"))
      .order("asc") // Get lowest number first
      .first();

    if (!availableNFT) {
      console.log('[RESERVATION] No available NFTs');
      return {
        success: false,
        error: "All NFTs have been claimed",
      };
    }

    console.log('[RESERVATION] Found available NFT:', availableNFT.nftNumber, availableNFT.name);

    // Check if this user already has an active reservation
    const existingReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingReservation) {
      console.log('[RESERVATION] User already has active reservation:', existingReservation.nftNumber);

      // Return the existing reservation info
      const existingNFT = await ctx.db.get(existingReservation.nftInventoryId);
      return {
        success: true,
        reservation: existingReservation,
        nft: existingNFT,
      };
    }

    // Create the reservation
    const expiresAt = now + RESERVATION_TIMEOUT;
    const reservationId = await ctx.db.insert("commemorativeNFTReservations", {
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

    console.log('[RESERVATION] Created reservation:', reservationId, 'for NFT:', availableNFT.nftNumber);

    return {
      success: true,
      reservation: {
        _id: reservationId,
        nftInventoryId: availableNFT._id,
        nftUid: availableNFT.nftUid,
        nftNumber: availableNFT.nftNumber,
        reservedBy: args.walletAddress,
        reservedAt: now,
        expiresAt,
        status: "active" as const,
      },
      nft: availableNFT,
    };
  },
});

// Mark that payment window was opened (pause timer)
export const markPaymentWindowOpened = mutation({
  args: {
    reservationId: v.id("commemorativeNFTReservations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      console.log('[RESERVATION] Reservation not found:', args.reservationId);
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.status !== "active") {
      console.log('[RESERVATION] Reservation not active:', reservation.status);
      return { success: false, error: "Reservation not active" };
    }

    // Mark when payment window opened (for timer pause logic)
    await ctx.db.patch(args.reservationId, {
      paymentWindowOpenedAt: now,
    });

    console.log('[RESERVATION] Payment window opened for reservation:', args.reservationId);

    return { success: true };
  },
});

// Mark that payment window was closed (resume timer)
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

    // Mark when payment window closed
    await ctx.db.patch(args.reservationId, {
      paymentWindowClosedAt: now,
    });

    console.log('[RESERVATION] Payment window closed for reservation:', args.reservationId);

    return { success: true };
  },
});

// Complete a reservation (user successfully paid)
export const completeReservation = mutation({
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

    console.log('[RESERVATION] Completed reservation:', args.reservationId, 'for NFT:', reservation.nftNumber);

    return { success: true };
  },
});

// Complete reservation by wallet address (called by webhook)
export const completeReservationByWallet = mutation({
  args: {
    walletAddress: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[RESERVATION] Webhook attempting to complete reservation for wallet:', args.walletAddress);

    // Find active reservation for this wallet
    const reservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!reservation) {
      console.log('[RESERVATION] No active reservation found for wallet:', args.walletAddress);
      return { success: false, error: "No active reservation found" };
    }

    console.log('[RESERVATION] Found reservation:', reservation._id, 'NFT:', reservation.nftNumber);

    // Update reservation status
    await ctx.db.patch(reservation._id, {
      status: "completed",
    });

    // Update NFT inventory to sold
    await ctx.db.patch(reservation.nftInventoryId, {
      status: "sold",
    });

    console.log('[RESERVATION] Completed reservation from webhook:', reservation._id, 'for NFT:', reservation.nftNumber);

    return { success: true, reservationId: reservation._id, nftNumber: reservation.nftNumber };
  },
});

// Release a reservation (user cancelled or expired)
export const releaseReservation = mutation({
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
      console.log('[RESERVATION] Released NFT back to pool:', reservation.nftNumber);
    }

    console.log('[RESERVATION] Released reservation:', args.reservationId, 'reason:', newStatus);

    return { success: true };
  },
});

// Get active reservation for a user
export const getActiveReservation = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find active reservation for this user
    const reservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!reservation) {
      return null;
    }

    // Check if expired
    if (reservation.expiresAt < now) {
      console.log('[RESERVATION] Reservation expired:', reservation._id);
      return {
        ...reservation,
        isExpired: true,
      };
    }

    // Get the NFT details
    const nft = await ctx.db.get(reservation.nftInventoryId);

    // Calculate remaining time (ALWAYS based on absolute deadline)
    // The payment window state is tracked but does NOT extend the deadline
    const remainingMs = Math.max(0, reservation.expiresAt - now);
    const isPaymentWindowOpen = !!reservation.paymentWindowOpenedAt && !reservation.paymentWindowClosedAt;

    return {
      ...reservation,
      nft,
      isExpired: false,
      remainingMs,
      isPaymentWindowOpen, // Track this for UI display only
    };
  },
});

// Cleanup expired reservations (called periodically or before creating new reservations)
async function cleanupExpiredReservations(ctx: any, now: number) {
  const expiredReservations = await ctx.db
    .query("commemorativeNFTReservations")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .filter((q: any) => q.lt(q.field("expiresAt"), now - GRACE_PERIOD)) // 30 seconds grace
    .collect();

  for (const reservation of expiredReservations) {
    console.log('[RESERVATION] Auto-expiring reservation:', reservation._id, 'NFT:', reservation.nftNumber);

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
    }
  }

  if (expiredReservations.length > 0) {
    console.log('[RESERVATION] Cleaned up', expiredReservations.length, 'expired reservations');
  }
}

// Manual cleanup mutation (can be called from admin panel or cron job)
export const cleanupExpiredReservationsMutation = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    await cleanupExpiredReservations(ctx, now);
    return { success: true };
  },
});
