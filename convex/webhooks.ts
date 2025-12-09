import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Webhook Processing Functions
 *
 * Handles idempotency checks and recording for NMKR webhooks.
 * Prevents duplicate processing of the same transaction.
 */

// Check if a webhook has already been processed (idempotency check)
export const checkProcessedWebhook = query({
  args: {
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_tx_hash", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (existing) {
      console.log('[WEBHOOK] Already processed transaction:', args.transactionHash);
      return existing;
    }

    return null;
  },
});

// Record that a webhook has been processed
export const recordProcessedWebhook = mutation({
  args: {
    transactionHash: v.string(),
    stakeAddress: v.string(),
    nftUid: v.string(),
    reservationId: v.optional(v.id("commemorativeNFTReservations")),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[WEBHOOK] Recording processed webhook:', {
      tx: args.transactionHash,
      wallet: args.stakeAddress.substring(0, 20) + '...',
      nft: args.nftUid,
      event: args.eventType,
    });

    // Check for existing record first (extra safety)
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_tx_hash", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (existing) {
      console.log('[WEBHOOK] Webhook already recorded, skipping:', args.transactionHash);
      return existing._id;
    }

    const webhookId = await ctx.db.insert("processedWebhooks", {
      transactionHash: args.transactionHash,
      stakeAddress: args.stakeAddress,
      nftUid: args.nftUid,
      reservationId: args.reservationId,
      processedAt: Date.now(),
      eventType: args.eventType,
    });

    console.log('[WEBHOOK] Successfully recorded webhook:', webhookId);
    return webhookId;
  },
});

// Get recent processed webhooks (for admin/debugging)
export const getRecentWebhooks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const webhooks = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_processed_at")
      .order("desc")
      .take(limit);

    return webhooks;
  },
});

// Check if a specific wallet has any processed webhooks
export const getWebhooksByWallet = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    return webhooks;
  },
});
