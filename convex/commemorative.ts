import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

/**
 * Check if user is eligible to purchase commemorative NFT
 * TESTNET MODE: Auto-qualifies connected wallets
 * MAINNET MODE: Requires verified wallet + gold > 0
 */
export const checkEligibility = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        eligible: false,
        reason: "User not found",
        goldAmount: 0,
        mekCount: 0,
        testMode: false,
      };
    }

    // TESTNET MODE: Auto-qualify if wallet connected
    const isTestnet = process.env.NEXT_PUBLIC_TESTNET_MODE === "true";
    if (isTestnet && user.walletAddress) {
      console.log(`[TESTNET] Auto-qualifying wallet: ${user.walletAddress}`);
      return {
        eligible: true,
        reason: "Testnet auto-qualified",
        goldAmount: 9999, // Fake gold for display
        mekCount: 42, // Fake Mek count
        testMode: true,
      };
    }

    // MAINNET: Real eligibility checks
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", user.walletAddress))
      .first();

    if (!goldMining) {
      return {
        eligible: false,
        reason: "No gold mining record found",
        goldAmount: 0,
        mekCount: 0,
        testMode: false,
      };
    }

    // Calculate current gold (including ongoing accumulation if verified)
    const now = Date.now();
    let currentGold = goldMining.accumulatedGold || 0;

    if (goldMining.isBlockchainVerified === true) {
      const lastUpdateTime = goldMining.lastSnapshotTime || goldMining.updatedAt || goldMining.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = goldMining.totalGoldPerHour * hoursSinceLastUpdate;
      currentGold = (goldMining.accumulatedGold || 0) + goldSinceLastUpdate;
    }

    const isVerified = goldMining.isBlockchainVerified === true;
    const hasGold = currentGold > 0;

    return {
      eligible: isVerified && hasGold,
      reason: !isVerified
        ? "Wallet not blockchain verified"
        : !hasGold
        ? "No gold accumulated"
        : "Qualified",
      goldAmount: currentGold,
      mekCount: goldMining.mekCount || 0,
      testMode: false,
    };
  },
});

/**
 * Check if user has already purchased this commemorative NFT
 */
export const getPurchase = query({
  args: {
    userId: v.id("users"),
    campaignName: v.string(),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();

    return purchase;
  },
});

/**
 * Get all purchases for a campaign (admin view)
 */
export const getAllPurchases = query({
  args: {
    campaignName: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    let purchases;

    if (args.campaignName) {
      purchases = await ctx.db
        .query("commemorativePurchases")
        .withIndex("by_campaign", (q) => q.eq("campaignName", args.campaignName))
        .collect();
    } else {
      purchases = await ctx.db
        .query("commemorativePurchases")
        .collect();
    }

    // Filter by status if provided
    if (args.status) {
      purchases = purchases.filter((p) => p.status === args.status);
    }

    return purchases;
  },
});

/**
 * Get purchase statistics for admin dashboard
 */
export const getPurchaseStats = query({
  args: { campaignName: v.string() },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_campaign", (q) => q.eq("campaignName", args.campaignName))
      .collect();

    const stats = {
      total: purchases.length,
      pending: purchases.filter((p) => p.status === "pending").length,
      paid: purchases.filter((p) => p.status === "paid").length,
      completed: purchases.filter((p) => p.status === "completed").length,
      failed: purchases.filter((p) => p.status === "failed").length,
    };

    return stats;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a pending purchase record when user clicks purchase button
 */
export const createPurchase = mutation({
  args: {
    userId: v.id("users"),
    walletAddress: v.string(),
    paymentAddress: v.string(),
    campaignName: v.string(),
    goldAtPurchase: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if already purchased
    const existing = await ctx.db
      .query("commemorativePurchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();

    if (existing) {
      throw new Error("Already purchased this commemorative NFT");
    }

    // Create pending purchase
    const purchaseId = await ctx.db.insert("commemorativePurchases", {
      userId: args.userId,
      walletAddress: args.walletAddress,
      paymentAddress: args.paymentAddress,
      campaignName: args.campaignName,
      goldAtPurchase: args.goldAtPurchase,
      purchasedAt: Date.now(),
      status: "pending",
    });

    console.log(
      `[Commemorative] Created pending purchase ${purchaseId} for user ${args.userId}`
    );

    return purchaseId;
  },
});

/**
 * Update purchase status (called by NMKR webhook)
 */
export const updatePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("commemorativePurchases"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("completed"),
      v.literal("failed")
    ),
    nmkrTransactionId: v.optional(v.string()),
    nmkrPaymentId: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
    policyId: v.optional(v.string()),
    assetName: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { purchaseId, status, ...updates } = args;

    await ctx.db.patch(purchaseId, {
      status,
      ...updates,
    });

    console.log(
      `[Commemorative] Updated purchase ${purchaseId} to status: ${status}`
    );

    return { success: true };
  },
});
