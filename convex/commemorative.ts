import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Commemorative NFT Purchase System
 *
 * Handles eligibility checks, purchase recording, and status updates
 * for the limited edition commemorative NFT (5 ADA via NMKR)
 */

// Check if a user is eligible to purchase the commemorative NFT
export const checkEligibility = query({
  args: {
    walletAddress: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Phase II: Get user data from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    // Check if wallet is verified
    const isVerified = user?.walletVerified || false;

    // Phase II: Get gold from users table
    const totalGold = user?.gold || 0;

    // Phase II: Get Mek count from meks table
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q: any) => q.eq("owner", args.walletAddress))
      .collect();
    const mekCount = ownedMeks.length;

    // Eligibility requirements:
    // 1. Wallet must be blockchain verified
    // 2. User must have either:
    //    - At least 1 Mek, OR
    //    - Have earned any amount of gold
    const eligible = isVerified && (mekCount > 0 || totalGold > 0);

    // Check if user already purchased
    const existingPurchase = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    return {
      eligible: eligible && !existingPurchase,
      isVerified,
      goldAmount: totalGold,
      mekCount,
      alreadyPurchased: !!existingPurchase,
      reason: !eligible
        ? !isVerified
          ? "Wallet not verified"
          : "Need at least 1 Mek or some gold earned"
        : existingPurchase
          ? "Already purchased"
          : "Eligible"
    };
  },
});

// Record a new purchase intent
export const recordPurchase = mutation({
  args: {
    userId: v.id("users"),
    walletAddress: v.string(),
    paymentAddress: v.string(),
    campaignName: v.string(),
    nmkrProjectId: v.string(),
    goldSnapshot: v.number(),
    mekCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for existing pending purchase
    const existingPurchase = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPurchase) {
      // Update existing pending purchase
      await ctx.db.patch(existingPurchase._id, {
        paymentAddress: args.paymentAddress,
        updatedAt: Date.now(),
      });
      return existingPurchase;
    }

    // Create new purchase record
    const purchaseId = await ctx.db.insert("commemorativePurchases", {
      userId: args.userId,
      walletAddress: args.walletAddress,
      paymentAddress: args.paymentAddress,
      campaignName: args.campaignName,
      nmkrProjectId: args.nmkrProjectId,
      nmkrProjectUid: args.nmkrProjectId, // Use projectId as UID for compatibility
      purchaseDate: Date.now(),
      status: "pending",
      goldSnapshot: args.goldSnapshot,
      mekCountSnapshot: args.mekCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const purchase = await ctx.db.get(purchaseId);
    return purchase;
  },
});

// Update purchase status (called by webhook)
export const updatePurchaseStatus = mutation({
  args: {
    transactionHash: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    nftTokenId: v.optional(v.string()),
    paymentAmount: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Find purchase by transaction hash
    const purchase = await ctx.db
      .query("commemorativePurchases")
      .filter((q) => q.eq(q.field("transactionHash"), args.transactionHash))
      .first();

    if (!purchase) {
      // Try to find by pending status and metadata (fallback)
      console.error(`No purchase found for tx hash: ${args.transactionHash}`);

      // If metadata contains purchaseId, try to find by that
      if (args.metadata?.purchaseId) {
        const purchaseById = await ctx.db.get(args.metadata.purchaseId as Id<"commemorativePurchases">);
        if (purchaseById) {
          await ctx.db.patch(purchaseById._id, {
            transactionHash: args.transactionHash,
            status: args.status,
            nftTokenId: args.nftTokenId,
            paymentAmount: args.paymentAmount,
            completedAt: args.status === "completed" ? Date.now() : undefined,
            updatedAt: Date.now(),
          });
          return purchaseById;
        }
      }

      throw new Error(`Purchase not found for transaction: ${args.transactionHash}`);
    }

    // Update purchase status
    await ctx.db.patch(purchase._id, {
      status: args.status,
      nftTokenId: args.nftTokenId,
      paymentAmount: args.paymentAmount,
      completedAt: args.status === "completed" ? Date.now() : undefined,
      failedAt: args.status === "failed" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    return purchase;
  },
});

// Get user's purchase history
export const getUserPurchases = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    return purchases;
  },
});

// Get all purchases for a campaign (admin)
export const getCampaignPurchases = query({
  args: {
    campaignName: v.string(),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .collect();

    return purchases;
  },
});

// Get purchase statistics (admin)
export const getPurchaseStats = query({
  args: {
    campaignName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let purchases;

    if (args.campaignName) {
      purchases = await ctx.db
        .query("commemorativePurchases")
        .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
        .collect();
    } else {
      purchases = await ctx.db
        .query("commemorativePurchases")
        .collect();
    }

    const stats = {
      total: purchases.length,
      pending: purchases.filter((p: any) => p.status === "pending").length,
      completed: purchases.filter((p: any) => p.status === "completed").length,
      failed: purchases.filter((p: any) => p.status === "failed").length,
      refunded: purchases.filter((p: any) => p.status === "refunded").length,
      totalRevenue: purchases
        .filter((p: any) => p.status === "completed" && p.paymentAmount)
        .reduce((sum, p) => sum + (parseFloat(p.paymentAmount!) / 1000000), 0), // Convert lovelace to ADA
    };

    return stats;
  },
});

// Check for recent purchase completion (for polling)
// Returns the most recent completed purchase within the last 5 minutes
export const checkRecentPurchase = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    const recentPurchase = await ctx.db
      .query("commemorativePurchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("walletAddress"), args.walletAddress),
          q.eq(q.field("status"), "completed"),
          q.gte(q.field("completedAt"), fiveMinutesAgo)
        )
      )
      .order("desc")
      .first();

    if (!recentPurchase) {
      return null;
    }

    return {
      transactionHash: recentPurchase.transactionHash,
      nftTokenId: recentPurchase.nftTokenId,
      completedAt: recentPurchase.completedAt,
      paymentAmount: recentPurchase.paymentAmount,
    };
  },
});
