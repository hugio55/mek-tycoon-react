import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Commemorative NFT Payment Tracking
 *
 * Provides granular status tracking for NMKR payment → minting → confirmation flow.
 * Used by frontend to show accurate progress instead of fake setTimeout logic.
 *
 * Status Flow:
 * 1. payment_initiated → User clicked "Claim NFT", NMKR window opened
 * 2. payment_received → NMKR webhook sent "transactionconfirmed" event
 * 3. minting → NFT minting process started (same as payment_received)
 * 4. confirming → Transaction exists on blockchain, waiting for confirmations
 * 5. completed → NFT delivered, transaction confirmed on-chain
 * 6. failed → Payment or minting failed
 */

export type PaymentStatus =
  | "payment_initiated"
  | "payment_received"
  | "minting"
  | "confirming"
  | "completed"
  | "failed"
  | "cancelled";

// Initialize payment tracking when user clicks "Claim NFT"
export const initializePayment = mutation({
  args: {
    walletAddress: v.string(),
    nmkrProjectId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[💰TRACK] Initializing payment for wallet:', args.walletAddress);

    // Check for existing pending payment
    const existingPayment = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPayment) {
      console.log('[💰TRACK] Existing pending payment found, returning it');
      return existingPayment._id;
    }

    // Create new payment tracking record
    const paymentId = await ctx.db.insert("commemorativePurchases", {
      walletAddress: args.walletAddress,
      nmkrProjectUid: args.nmkrProjectId,
      status: "pending", // Maps to "payment_initiated"
      purchaseDate: Date.now(),
    });

    console.log('[💰TRACK] Payment initialized:', paymentId);
    return paymentId;
  },
});

// Update payment status (called by webhook)
export const updatePaymentStatus = mutation({
  args: {
    walletAddress: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
    status: v.union(
      v.literal("payment_received"),
      v.literal("minting"),
      v.literal("confirming"),
      v.literal("completed"),
      v.literal("failed")
    ),
    nftAssetId: v.optional(v.string()),
    nftName: v.optional(v.string()),
    eventData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    console.log('[💰TRACK] Updating payment status:', {
      wallet: args.walletAddress,
      tx: args.transactionHash,
      status: args.status,
    });

    // Find payment record by wallet or transaction hash
    let payment;

    if (args.transactionHash) {
      // Try to find by transaction hash first (most reliable)
      payment = await ctx.db
        .query("commemorativePurchases")
        .filter((q) => q.eq(q.field("transactionHash"), args.transactionHash))
        .first();
    }

    if (!payment && args.walletAddress) {
      // Fallback: find most recent pending/confirmed payment for this wallet
      payment = await ctx.db
        .query("commemorativePurchases")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
        .order("desc")
        .first();
    }

    if (!payment) {
      console.error('[💰TRACK] No payment found to update');
      throw new Error(`No payment found for ${args.walletAddress || args.transactionHash}`);
    }

    // Map our detailed status to database status enum
    const dbStatus = args.status === "completed" ? "confirmed" :
                     args.status === "failed" ? "failed" :
                     "pending"; // payment_received, minting, confirming all map to "pending"

    // Update payment record
    await ctx.db.patch(payment._id, {
      status: dbStatus,
      transactionHash: args.transactionHash || payment.transactionHash,
      nftTokenId: args.nftAssetId || payment.nftTokenId,
    });

    console.log('[💰TRACK] Payment status updated successfully');
    return payment._id;
  },
});

// Get payment status for frontend polling
export const getPaymentStatus = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get most recent payment for this wallet
    const payment = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .first();

    if (!payment) {
      return {
        found: false,
        status: null,
        transactionHash: null,
        nftAssetId: null,
        createdAt: null,
      };
    }

    // Also check if claim was recorded (means it's fully complete)
    const claim = payment.transactionHash
      ? await ctx.db
          .query("commemorativeNFTClaims")
          .withIndex("by_transaction", (q) => q.eq("transactionHash", payment.transactionHash!))
          .first()
      : null;

    // Determine detailed status from database status
    let detailedStatus: PaymentStatus;
    if (claim) {
      detailedStatus = "completed";
    } else if (payment.status === "confirmed") {
      detailedStatus = "completed";
    } else if (payment.status === "failed") {
      detailedStatus = "failed";
    } else if (payment.transactionHash) {
      // Has transaction hash, must be at least payment_received
      detailedStatus = "minting"; // Assume minting if we have tx but not complete
    } else {
      detailedStatus = "payment_initiated";
    }

    return {
      found: true,
      status: detailedStatus,
      transactionHash: payment.transactionHash || null,
      nftAssetId: payment.nftTokenId || null,
      nftName: claim?.nftName || null,
      createdAt: payment.purchaseDate,
      claim: claim || null,
    };
  },
});

// Get detailed payment info for a specific transaction (for success screen)
export const getPaymentByTransaction = query({
  args: {
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("commemorativePurchases")
      .filter((q) => q.eq(q.field("transactionHash"), args.transactionHash))
      .first();

    if (!payment) {
      return null;
    }

    // Get associated claim if it exists
    const claim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_transaction", (q) => q.eq("transactionHash", args.transactionHash))
      .first();

    return {
      payment,
      claim,
    };
  },
});

// Cancel payment (if user closes window quickly)
export const cancelPayment = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[💰TRACK] Cancelling payment for wallet:', args.walletAddress);

    const payment = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (payment && !payment.transactionHash) {
      // Only cancel if no transaction hash (payment never went through)
      await ctx.db.patch(payment._id, {
        status: "failed",
      });
      console.log('[💰TRACK] Payment cancelled');
    }
  },
});
