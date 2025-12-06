import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

// Get all purchases with comprehensive filters
export const getPurchases = query({
  args: {
    eventId: v.optional(v.id("nftEvents")),
    variationId: v.optional(v.id("nftVariations")),
    walletAddress: v.optional(v.string()),
    companyName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    )),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftPurchases");

    // Apply index-based filters
    if (args.eventId) {
      query = query.withIndex("", (q: any) => q.eq("eventId", args.eventId));
    } else if (args.variationId) {
      query = query.withIndex("", (q: any) => q.eq("variationId", args.variationId));
    } else if (args.walletAddress) {
      query = query.withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress));
    } else if (args.companyName) {
      query = query.withIndex("", (q: any) => q.eq("companyName", args.companyName));
    } else if (args.status) {
      query = query.withIndex("", (q: any) => q.eq("status", args.status));
    }

    let purchases = await query.collect();

    // Apply non-indexed filters
    if (args.dateStart) {
      purchases = purchases.filter(p => p.purchasedAt >= args.dateStart!);
    }
    if (args.dateEnd) {
      purchases = purchases.filter(p => p.purchasedAt <= args.dateEnd!);
    }

    // Sort by purchase date descending (newest first)
    purchases.sort((a, b) => b.purchasedAt - a.purchasedAt);

    // Apply pagination
    if (args.offset !== undefined && args.limit !== undefined) {
      purchases = purchases.slice(args.offset, args.offset + args.limit);
    } else if (args.limit !== undefined) {
      purchases = purchases.slice(0, args.limit);
    }

    // Enrich with event and variation data
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const event = await ctx.db.get(purchase.eventId);
        const variation = await ctx.db.get(purchase.variationId);

        return {
          ...purchase,
          eventName: event?.eventName,
          eventNumber: event?.eventNumber,
          variationName: variation?.nftName,
          difficulty: variation?.difficulty,
        };
      })
    );

    return enrichedPurchases;
  },
});

// Get purchase by transaction hash
export const getPurchaseByTxHash = query({
  args: { transactionHash: v.string() },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (!purchase) return null;

    // Enrich with event and variation data
    const event = await ctx.db.get(purchase.eventId);
    const variation = await ctx.db.get(purchase.variationId);

    return {
      ...purchase,
      eventName: event?.eventName,
      eventNumber: event?.eventNumber,
      variationName: variation?.nftName,
      difficulty: variation?.difficulty,
    };
  },
});

// Get purchases by user
export const getPurchasesByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("userId", args.userId));

    let purchases = await query.collect();

    purchases.sort((a, b) => b.purchasedAt - a.purchasedAt);

    if (args.limit) {
      purchases = purchases.slice(0, args.limit);
    }

    return purchases;
  },
});

// Get purchases by wallet
export const getPurchasesByWallet = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress));

    let purchases = await query.collect();

    purchases.sort((a, b) => b.purchasedAt - a.purchasedAt);

    if (args.limit) {
      purchases = purchases.slice(0, args.limit);
    }

    return purchases;
  },
});

// Get purchase statistics
export const getPurchaseStats = query({
  args: {
    eventId: v.optional(v.id("nftEvents")),
    variationId: v.optional(v.id("nftVariations")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftPurchases");

    if (args.eventId) {
      query = query.withIndex("", (q: any) => q.eq("eventId", args.eventId));
    } else if (args.variationId) {
      query = query.withIndex("", (q: any) => q.eq("variationId", args.variationId));
    }

    const purchases = await query.collect();

    const stats = {
      total: purchases.length,
      pending: purchases.filter(p => p.status === "pending").length,
      confirmed: purchases.filter(p => p.status === "confirmed").length,
      completed: purchases.filter(p => p.status === "completed").length,
      failed: purchases.filter(p => p.status === "failed").length,
      refunded: purchases.filter(p => p.status === "refunded").length,
      totalRevenueAda: purchases
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.priceAda, 0),
      uniqueBuyers: new Set(purchases.map(p => p.walletAddress)).size,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
    };

    // Count by difficulty
    for (const purchase of purchases) {
      const variation = await ctx.db.get(purchase.variationId);
      if (variation) {
        stats.byDifficulty[variation.difficulty]++;
      }
    }

    return stats;
  },
});

// Get revenue analytics
export const getRevenueAnalytics = query({
  args: {
    eventId: v.optional(v.id("nftEvents")),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftPurchases");

    if (args.eventId) {
      query = query.withIndex("", (q: any) => q.eq("eventId", args.eventId));
    }

    let purchases = await query.collect();

    // Filter by date range
    if (args.dateStart) {
      purchases = purchases.filter(p => p.purchasedAt >= args.dateStart!);
    }
    if (args.dateEnd) {
      purchases = purchases.filter(p => p.purchasedAt <= args.dateEnd!);
    }

    // Only completed purchases
    purchases = purchases.filter(p => p.status === "completed");

    const totalRevenue = purchases.reduce((sum, p) => sum + p.priceAda, 0);
    const averagePrice = purchases.length > 0 ? totalRevenue / purchases.length : 0;

    // Group by date (daily)
    const revenueByDate: Record<string, number> = {};
    for (const purchase of purchases) {
      const date = new Date(purchase.purchasedAt).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + purchase.priceAda;
    }

    return {
      totalRevenue,
      averagePrice,
      totalSales: purchases.length,
      revenueByDate,
      highestSale: Math.max(...purchases.map(p => p.priceAda), 0),
      lowestSale: purchases.length > 0 ? Math.min(...purchases.map(p => p.priceAda)) : 0,
    };
  },
});

// Get top buyers
export const getTopBuyers = query({
  args: {
    limit: v.optional(v.number()),
    byCompany: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("nftPurchases")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const groupKey = args.byCompany ? "companyName" : "walletAddress";

    // Group by wallet or company
    const buyerStats: Record<string, {
      key: string;
      totalSpent: number;
      totalPurchases: number;
      walletAddress?: string;
      companyName?: string;
    }> = {};

    for (const purchase of purchases) {
      const key = args.byCompany
        ? (purchase.companyName || "Unknown")
        : purchase.walletAddress;

      if (!buyerStats[key]) {
        buyerStats[key] = {
          key,
          totalSpent: 0,
          totalPurchases: 0,
          walletAddress: purchase.walletAddress,
          companyName: purchase.companyName || undefined,
        };
      }

      buyerStats[key].totalSpent += purchase.priceAda;
      buyerStats[key].totalPurchases++;
    }

    // Convert to array and sort by total spent
    let topBuyers = Object.values(buyerStats).sort((a, b) => b.totalSpent - a.totalSpent);

    if (args.limit) {
      topBuyers = topBuyers.slice(0, args.limit);
    }

    return topBuyers;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Record new purchase (called by webhook)
export const recordPurchase = mutation({
  args: {
    variationId: v.id("nftVariations"),
    eventId: v.id("nftEvents"),
    userId: v.optional(v.id("users")),
    walletAddress: v.string(),
    paymentAddress: v.string(),
    companyName: v.optional(v.string()),
    transactionHash: v.string(),
    transactionUrl: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    priceAda: v.number(),
    priceLovelace: v.number(),
    currency: v.union(v.literal("ADA"), v.literal("tADA")),
    tokenName: v.string(),
    assetId: v.string(),
    mintingSlot: v.optional(v.number()),
    nmkrSaleId: v.optional(v.string()),
    nmkrOrderId: v.optional(v.string()),
    nmkrPaymentMethod: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    )),
    webhookData: v.optional(v.any()),
    webhookReceivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if purchase already exists (prevent duplicates)
    const existing = await ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (existing) {
      // Update existing purchase
      await ctx.db.patch(existing._id, {
        status: args.status || existing.status,
        confirmedAt: args.status === "completed" ? now : existing.confirmedAt,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new purchase
    const purchaseId = await ctx.db.insert("nftPurchases", {
      variationId: args.variationId,
      eventId: args.eventId,
      userId: args.userId,
      walletAddress: args.walletAddress,
      paymentAddress: args.paymentAddress,
      companyName: args.companyName,
      transactionHash: args.transactionHash,
      transactionUrl: args.transactionUrl,
      blockNumber: args.blockNumber,
      priceAda: args.priceAda,
      priceLovelace: args.priceLovelace,
      currency: args.currency,
      tokenName: args.tokenName,
      assetId: args.assetId,
      mintingSlot: args.mintingSlot,
      nmkrSaleId: args.nmkrSaleId,
      nmkrOrderId: args.nmkrOrderId,
      nmkrPaymentMethod: args.nmkrPaymentMethod,
      status: args.status || "pending",
      webhookData: args.webhookData,
      purchasedAt: now,
      confirmedAt: args.status === "completed" ? now : undefined,
      webhookReceivedAt: args.webhookReceivedAt,
      createdAt: now,
      updatedAt: now,
    });

    return purchaseId;
  },
});

// Update purchase status
export const updatePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("nftPurchases"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    statusMessage: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.purchaseId, {
      status: args.status,
      statusMessage: args.statusMessage,
      blockNumber: args.blockNumber,
      confirmedAt: args.status === "completed" ? now : purchase.confirmedAt,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Add admin notes to purchase
export const addPurchaseNotes = mutation({
  args: {
    purchaseId: v.id("nftPurchases"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    await ctx.db.patch(args.purchaseId, {
      adminNotes: args.notes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Process refund
export const processRefund = mutation({
  args: {
    purchaseId: v.id("nftPurchases"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "refunded") {
      throw new Error("Purchase already refunded");
    }

    // Update purchase status
    await ctx.db.patch(args.purchaseId, {
      status: "refunded",
      statusMessage: `Refunded: ${args.reason}`,
      updatedAt: Date.now(),
    });

    // Increment supply back (return NFT to pool)
    const variation = await ctx.db.get(purchase.variationId);
    if (variation) {
      await ctx.db.patch(purchase.variationId, {
        supplyMinted: Math.max(0, variation.supplyMinted - 1),
        supplyRemaining: Math.min(variation.supplyTotal, variation.supplyRemaining + 1),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
