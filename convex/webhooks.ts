import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Webhook Processing Tracking System
 *
 * Prevents duplicate webhook processing by maintaining a record of all processed transactions.
 * This provides idempotency - the same webhook can be sent multiple times without side effects.
 */

// Check if a webhook has already been processed
export const checkProcessedWebhook = query({
  args: {
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    return existing;
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
    const now = Date.now();

    console.log('[🛡️WEBHOOK-SECURITY] Recording processed webhook:', args.transactionHash);

    // Check if already recorded (defensive)
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (existing) {
      console.log('[🛡️WEBHOOK-SECURITY] Webhook already recorded:', args.transactionHash);
      return { success: true, alreadyRecorded: true, webhookId: existing._id };
    }

    // Record the processed webhook
    const webhookId = await ctx.db.insert("processedWebhooks", {
      transactionHash: args.transactionHash,
      stakeAddress: args.stakeAddress,
      nftUid: args.nftUid,
      reservationId: args.reservationId,
      processedAt: now,
      eventType: args.eventType,
    });

    console.log('[🛡️WEBHOOK-SECURITY] ✓ Webhook recorded:', args.transactionHash);

    return { success: true, alreadyRecorded: false, webhookId };
  },
});

// Cleanup old webhook records (older than 30 days)
export const cleanupOldWebhooks = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const oldWebhooks = await ctx.db
      .query("processedWebhooks")
      .withIndex("", (q: any) => q.lt("processedAt", thirtyDaysAgo))
      .collect();

    for (const webhook of oldWebhooks) {
      await ctx.db.delete(webhook._id);
    }

    console.log('[🛡️WEBHOOK-SECURITY] Cleaned up', oldWebhooks.length, 'old webhook records');

    return { success: true, deletedCount: oldWebhooks.length };
  },
});

// Get webhook processing stats (for admin dashboard)
export const getWebhookStats = query({
  handler: async (ctx) => {
    const allWebhooks = await ctx.db.query("processedWebhooks").collect();

    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: allWebhooks.length,
      last24Hours: allWebhooks.filter(w => w.processedAt > last24Hours).length,
      last7Days: allWebhooks.filter(w => w.processedAt > last7Days).length,
    };

    return stats;
  },
});
