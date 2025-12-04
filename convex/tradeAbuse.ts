import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Configuration constants
const FAST_PURCHASE_THRESHOLD_SECONDS = 60; // Flag if purchase within 60 seconds of listing
const PRICE_GAP_MULTIPLIER_THRESHOLD = 10; // Flag if resale price is 10x+ purchase price
const NEW_CORP_AGE_DAYS = 7; // Flag if buyer corp is less than 7 days old
const REPEATED_PAIR_THRESHOLD = 2; // Flag if same buyer-seller have traded 2+ times

// Risk score weights for each flag type
const RISK_SCORES: Record<string, number> = {
  repeated_pair: 20,
  fast_purchase: 25,
  price_gap: 30,
  new_corp_buyer: 15,
  same_ip: 40,
  same_fingerprint: 40,
  same_wallet: 50,
  session_overlap: 35,
  manual_flag: 25,
};

type FlagReason =
  | "repeated_pair"
  | "fast_purchase"
  | "price_gap"
  | "new_corp_buyer"
  | "same_ip"
  | "same_fingerprint"
  | "same_wallet"
  | "session_overlap"
  | "manual_flag";

// ============================================
// CORE DETECTION FUNCTION
// ============================================

// Main function to analyze a trade for potential abuse
// Called after each marketplace purchase
export const analyzeTradeForAbuse = internalMutation({
  args: {
    purchaseId: v.id("marketListingPurchases"),
    listingId: v.id("marketListings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    itemType: v.string(),
    itemVariation: v.optional(v.string()),
    purchasePrice: v.number(),
    quantity: v.number(),
    listingTimestamp: v.number(),
    purchaseTimestamp: v.number(),
    // Optional session data for IP/fingerprint checks
    buyerIp: v.optional(v.string()),
    buyerFingerprint: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flagReasons: FlagReason[] = [];
    let riskScore = 0;

    // Get buyer and seller info
    const buyer = await ctx.db.get(args.buyerId);
    const seller = await ctx.db.get(args.sellerId);

    if (!buyer || !seller) {
      console.log("[TRADE_ABUSE] Buyer or seller not found, skipping analysis");
      return null;
    }

    const buyerCorpName = buyer.companyName || buyer.username || "Unknown";
    const sellerCorpName = seller.companyName || seller.username || "Unknown";

    // ---- CHECK 1: Repeated buyer-seller pair ----
    const previousTradeCount = await getTradeCountBetweenCorps(ctx, args.buyerId, args.sellerId);
    if (previousTradeCount >= REPEATED_PAIR_THRESHOLD) {
      flagReasons.push("repeated_pair");
      riskScore += RISK_SCORES.repeated_pair;
    }

    // ---- CHECK 2: Fast purchase (within 60 seconds of listing) ----
    const timeSinceListing = Math.floor((args.purchaseTimestamp - args.listingTimestamp) / 1000);
    if (timeSinceListing <= FAST_PURCHASE_THRESHOLD_SECONDS) {
      flagReasons.push("fast_purchase");
      riskScore += RISK_SCORES.fast_purchase;
    }

    // ---- CHECK 3: New corp buyer (less than 7 days old) ----
    const buyerAgeMs = Date.now() - (buyer._creationTime || Date.now());
    const buyerAgeDays = buyerAgeMs / (1000 * 60 * 60 * 24);
    if (buyerAgeDays < NEW_CORP_AGE_DAYS) {
      flagReasons.push("new_corp_buyer");
      riskScore += RISK_SCORES.new_corp_buyer;
    }

    // ---- CHECK 4: Same wallet address ----
    if (buyer.walletAddress && seller.walletAddress &&
        buyer.walletAddress === seller.walletAddress) {
      flagReasons.push("same_wallet");
      riskScore += RISK_SCORES.same_wallet;
    }

    // ---- CHECK 5: Same IP (if provided) ----
    // Note: IP checking requires session data to be passed in
    // This will be enhanced when we add fingerprint tracking

    // ---- CHECK 6: Same fingerprint (if provided) ----
    // Note: Fingerprint checking requires session data to be passed in
    // This will be enhanced when we add fingerprint tracking

    // Update the corp trade pair tracking
    await updateCorpTradePair(ctx, {
      buyerId: args.buyerId,
      sellerId: args.sellerId,
      buyerCorpName,
      sellerCorpName,
      totalCost: args.purchasePrice * args.quantity,
    });

    // Only create a flag if we detected something suspicious
    if (flagReasons.length > 0) {
      const flagId = await ctx.db.insert("tradeAbuseFlags", {
        purchaseId: args.purchaseId,
        listingId: args.listingId,
        buyerId: args.buyerId,
        sellerId: args.sellerId,
        buyerCorpName,
        sellerCorpName,
        itemType: args.itemType,
        itemVariation: args.itemVariation,
        purchasePrice: args.purchasePrice,
        quantity: args.quantity,
        flagReasons,
        riskScore,
        timeSinceListing: timeSinceListing > 0 ? timeSinceListing : undefined,
        previousTradeCount: previousTradeCount > 0 ? previousTradeCount : undefined,
        status: "pending",
        createdAt: Date.now(),
      });

      console.log(`[TRADE_ABUSE] Flagged transaction ${args.purchaseId} with reasons: ${flagReasons.join(", ")}, risk score: ${riskScore}`);

      // Also update the corp trade pair as flagged
      await markCorpPairAsFlagged(ctx, args.buyerId, args.sellerId);

      return flagId;
    }

    return null;
  },
});

// Helper to get trade count between two corps
async function getTradeCountBetweenCorps(
  ctx: any,
  corp1Id: Id<"users">,
  corp2Id: Id<"users">
): Promise<number> {
  // Check purchases where corp1 bought from corp2
  const purchases1 = await ctx.db
    .query("marketListingPurchases")
    .withIndex("by_buyer", (q: any) => q.eq("buyerId", corp1Id))
    .filter((q: any) => q.eq(q.field("sellerId"), corp2Id))
    .collect();

  // Check purchases where corp2 bought from corp1
  const purchases2 = await ctx.db
    .query("marketListingPurchases")
    .withIndex("by_buyer", (q: any) => q.eq("buyerId", corp2Id))
    .filter((q: any) => q.eq(q.field("sellerId"), corp1Id))
    .collect();

  return purchases1.length + purchases2.length;
}

// Helper to update or create corp trade pair record
async function updateCorpTradePair(
  ctx: any,
  args: {
    buyerId: Id<"users">;
    sellerId: Id<"users">;
    buyerCorpName: string;
    sellerCorpName: string;
    totalCost: number;
  }
) {
  // Order IDs consistently (alphabetically) so we always find the same record
  const [corp1Id, corp2Id] = [args.buyerId, args.sellerId].sort();
  const [corp1Name, corp2Name] = args.buyerId < args.sellerId
    ? [args.buyerCorpName, args.sellerCorpName]
    : [args.sellerCorpName, args.buyerCorpName];

  // Try to find existing pair
  const existingPair = await ctx.db
    .query("corpTradePairs")
    .withIndex("by_corp1", (q: any) => q.eq("corp1Id", corp1Id))
    .filter((q: any) => q.eq(q.field("corp2Id"), corp2Id))
    .first();

  const now = Date.now();

  if (existingPair) {
    await ctx.db.patch(existingPair._id, {
      tradeCount: existingPair.tradeCount + 1,
      totalVolumeGold: existingPair.totalVolumeGold + args.totalCost,
      lastTradeAt: now,
    });
  } else {
    await ctx.db.insert("corpTradePairs", {
      corp1Id,
      corp2Id,
      corp1Name,
      corp2Name,
      tradeCount: 1,
      totalVolumeGold: args.totalCost,
      firstTradeAt: now,
      lastTradeAt: now,
      flagged: false,
    });
  }
}

// Helper to mark a corp pair as flagged
async function markCorpPairAsFlagged(
  ctx: any,
  corp1Id: Id<"users">,
  corp2Id: Id<"users">
) {
  const [sortedCorp1, sortedCorp2] = [corp1Id, corp2Id].sort();

  const pair = await ctx.db
    .query("corpTradePairs")
    .withIndex("by_corp1", (q: any) => q.eq("corp1Id", sortedCorp1))
    .filter((q: any) => q.eq(q.field("corp2Id"), sortedCorp2))
    .first();

  if (pair && !pair.flagged) {
    await ctx.db.patch(pair._id, { flagged: true });
  }
}

// ============================================
// RESALE GAP DETECTION
// ============================================

// Called when someone creates a new listing - checks if they're reselling
// something they bought cheap for a much higher price
export const detectResaleGap = internalMutation({
  args: {
    sellerId: v.id("users"),
    itemType: v.string(),
    itemVariation: v.string(),
    newListingPrice: v.number(),
    newListingId: v.id("marketListings"),
  },
  handler: async (ctx, args) => {
    // Look for recent purchases of this item by this seller
    const recentPurchases = await ctx.db
      .query("marketListingPurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.sellerId))
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), args.itemType),
          q.eq(q.field("itemVariation"), args.itemVariation)
        )
      )
      .order("desc")
      .take(10);

    for (const purchase of recentPurchases) {
      const priceGapMultiplier = args.newListingPrice / purchase.pricePerUnit;

      if (priceGapMultiplier >= PRICE_GAP_MULTIPLIER_THRESHOLD) {
        // Check if there's already a flag for this purchase
        const existingFlag = await ctx.db
          .query("tradeAbuseFlags")
          .withIndex("by_purchase", (q) => q.eq("purchaseId", purchase._id))
          .first();

        if (existingFlag) {
          // Update existing flag with resale info
          const newReasons = existingFlag.flagReasons.includes("price_gap")
            ? existingFlag.flagReasons
            : [...existingFlag.flagReasons, "price_gap" as const];

          await ctx.db.patch(existingFlag._id, {
            flagReasons: newReasons,
            riskScore: existingFlag.riskScore + (existingFlag.flagReasons.includes("price_gap") ? 0 : RISK_SCORES.price_gap),
            resalePrice: args.newListingPrice,
            resaleListingId: args.newListingId,
            priceGapMultiplier: Math.round(priceGapMultiplier * 10) / 10,
          });

          console.log(`[TRADE_ABUSE] Updated flag with price gap: ${priceGapMultiplier.toFixed(1)}x (bought at ${purchase.pricePerUnit}, listed at ${args.newListingPrice})`);
        } else {
          // Create new flag just for price gap
          const seller = await ctx.db.get(args.sellerId);
          const originalSeller = await ctx.db.get(purchase.sellerId);

          if (seller && originalSeller) {
            await ctx.db.insert("tradeAbuseFlags", {
              purchaseId: purchase._id,
              listingId: purchase.listingId,
              buyerId: args.sellerId,
              sellerId: purchase.sellerId,
              buyerCorpName: seller.companyName || seller.username || "Unknown",
              sellerCorpName: originalSeller.companyName || originalSeller.username || "Unknown",
              itemType: args.itemType,
              itemVariation: args.itemVariation,
              purchasePrice: purchase.pricePerUnit,
              quantity: purchase.quantityPurchased,
              flagReasons: ["price_gap"],
              riskScore: RISK_SCORES.price_gap,
              resalePrice: args.newListingPrice,
              resaleListingId: args.newListingId,
              priceGapMultiplier: Math.round(priceGapMultiplier * 10) / 10,
              status: "pending",
              createdAt: Date.now(),
            });

            console.log(`[TRADE_ABUSE] New price gap flag: ${priceGapMultiplier.toFixed(1)}x (bought at ${purchase.pricePerUnit}, listed at ${args.newListingPrice})`);
          }
        }

        // Only flag the most recent relevant purchase
        break;
      }
    }
  },
});

// ============================================
// ADMIN QUERIES
// ============================================

// Get all flagged transactions with optional filters
export const getFlaggedTransactions = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("investigating"),
      v.literal("confirmed_abuse"),
      v.literal("cleared"),
      v.literal("auto_cleared")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("tradeAbuseFlags");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      query = query.withIndex("by_created");
    }

    const flags = await query.order("desc").collect();

    // Apply pagination
    const limit = args.limit || 50;
    const offset = args.offset || 0;
    const paginated = flags.slice(offset, offset + limit);

    return {
      flags: paginated,
      total: flags.length,
      hasMore: flags.length > offset + limit,
    };
  },
});

// Get abuse detection statistics
export const getAbuseStats = query({
  args: {},
  handler: async (ctx) => {
    const allFlags = await ctx.db.query("tradeAbuseFlags").collect();

    const pendingCount = allFlags.filter(f => f.status === "pending").length;
    const investigatingCount = allFlags.filter(f => f.status === "investigating").length;
    const confirmedCount = allFlags.filter(f => f.status === "confirmed_abuse").length;
    const clearedCount = allFlags.filter(f => f.status === "cleared" || f.status === "auto_cleared").length;

    // Count by flag reason
    const reasonCounts: Record<string, number> = {};
    for (const flag of allFlags) {
      for (const reason of flag.flagReasons) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }

    // Get flagged corp pairs
    const flaggedPairs = await ctx.db
      .query("corpTradePairs")
      .withIndex("by_flagged", (q) => q.eq("flagged", true))
      .collect();

    // Most flagged corps (by appearance in flags)
    const corpFlagCounts: Record<string, { id: string; name: string; count: number }> = {};
    for (const flag of allFlags) {
      const buyerKey = flag.buyerId;
      const sellerKey = flag.sellerId;

      if (!corpFlagCounts[buyerKey]) {
        corpFlagCounts[buyerKey] = { id: buyerKey, name: flag.buyerCorpName, count: 0 };
      }
      corpFlagCounts[buyerKey].count++;

      if (!corpFlagCounts[sellerKey]) {
        corpFlagCounts[sellerKey] = { id: sellerKey, name: flag.sellerCorpName, count: 0 };
      }
      corpFlagCounts[sellerKey].count++;
    }

    const mostFlaggedCorps = Object.values(corpFlagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent flags (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentFlags = allFlags.filter(f => f.createdAt > oneDayAgo).length;

    // Highest risk scores
    const highRiskFlags = allFlags
      .filter(f => f.status === "pending")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    return {
      totalFlags: allFlags.length,
      pendingCount,
      investigatingCount,
      confirmedCount,
      clearedCount,
      recentFlags24h: recentFlags,
      flaggedCorpPairs: flaggedPairs.length,
      reasonCounts,
      mostFlaggedCorps,
      highRiskFlags,
    };
  },
});

// Get trade history between two specific corps
export const getCorpTradeHistory = query({
  args: {
    corp1Id: v.id("users"),
    corp2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all purchases where corp1 bought from corp2
    const purchases1to2 = await ctx.db
      .query("marketListingPurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.corp1Id))
      .filter((q) => q.eq(q.field("sellerId"), args.corp2Id))
      .collect();

    // Get all purchases where corp2 bought from corp1
    const purchases2to1 = await ctx.db
      .query("marketListingPurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.corp2Id))
      .filter((q) => q.eq(q.field("sellerId"), args.corp1Id))
      .collect();

    // Combine and sort by timestamp
    const allTrades = [...purchases1to2, ...purchases2to1]
      .sort((a, b) => b.timestamp - a.timestamp);

    // Get corp names
    const corp1 = await ctx.db.get(args.corp1Id);
    const corp2 = await ctx.db.get(args.corp2Id);

    // Get any flags involving these corps
    const flags = await ctx.db
      .query("tradeAbuseFlags")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.corp1Id))
      .filter((q) => q.eq(q.field("sellerId"), args.corp2Id))
      .collect();

    const flags2 = await ctx.db
      .query("tradeAbuseFlags")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.corp2Id))
      .filter((q) => q.eq(q.field("sellerId"), args.corp1Id))
      .collect();

    return {
      corp1Name: corp1?.companyName || corp1?.username || "Unknown",
      corp2Name: corp2?.companyName || corp2?.username || "Unknown",
      totalTrades: allTrades.length,
      totalVolume: allTrades.reduce((sum, t) => sum + t.totalCost, 0),
      trades: allTrades.slice(0, 50), // Limit to 50 most recent
      flags: [...flags, ...flags2],
    };
  },
});

// Get all flags involving a specific corporation
export const getCorporationRiskProfile = query({
  args: {
    corpId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const corp = await ctx.db.get(args.corpId);
    if (!corp) return null;

    // Flags where this corp was the buyer
    const flagsAsBuyer = await ctx.db
      .query("tradeAbuseFlags")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.corpId))
      .collect();

    // Flags where this corp was the seller
    const flagsAsSeller = await ctx.db
      .query("tradeAbuseFlags")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.corpId))
      .collect();

    // Trade pairs involving this corp
    const tradePairs1 = await ctx.db
      .query("corpTradePairs")
      .withIndex("by_corp1", (q) => q.eq("corp1Id", args.corpId))
      .collect();

    const tradePairs2 = await ctx.db
      .query("corpTradePairs")
      .withIndex("by_corp2", (q) => q.eq("corp2Id", args.corpId))
      .collect();

    const allTradePairs = [...tradePairs1, ...tradePairs2];
    const flaggedPairs = allTradePairs.filter(p => p.flagged);

    // Calculate total risk score
    const allFlags = [...flagsAsBuyer, ...flagsAsSeller];
    const totalRiskScore = allFlags.reduce((sum, f) => sum + f.riskScore, 0);

    // Corp age
    const corpAgeMs = Date.now() - (corp._creationTime || Date.now());
    const corpAgeDays = Math.floor(corpAgeMs / (1000 * 60 * 60 * 24));

    return {
      corpId: args.corpId,
      corpName: corp.companyName || corp.username || "Unknown",
      walletAddress: corp.walletAddress,
      corpAgeDays,
      totalFlags: allFlags.length,
      flagsAsBuyer: flagsAsBuyer.length,
      flagsAsSeller: flagsAsSeller.length,
      totalRiskScore,
      confirmedAbuse: allFlags.filter(f => f.status === "confirmed_abuse").length,
      tradingPartners: allTradePairs.length,
      flaggedPartners: flaggedPairs.length,
      recentFlags: allFlags
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
      tradePairs: allTradePairs
        .sort((a, b) => b.tradeCount - a.tradeCount)
        .slice(0, 10),
    };
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

// Update the status of a flag
export const updateFlagStatus = mutation({
  args: {
    flagId: v.id("tradeAbuseFlags"),
    status: v.union(
      v.literal("pending"),
      v.literal("investigating"),
      v.literal("confirmed_abuse"),
      v.literal("cleared"),
      v.literal("auto_cleared")
    ),
    adminNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db.get(args.flagId);
    if (!flag) {
      throw new Error("Flag not found");
    }

    const updates: any = {
      status: args.status,
      reviewedAt: Date.now(),
    };

    if (args.adminNotes !== undefined) {
      updates.adminNotes = args.adminNotes;
    }

    if (args.reviewedBy !== undefined) {
      updates.reviewedBy = args.reviewedBy;
    }

    await ctx.db.patch(args.flagId, updates);

    console.log(`[TRADE_ABUSE] Flag ${args.flagId} status updated to ${args.status}`);

    return { success: true };
  },
});

// Add or update admin notes on a flag
export const addAdminNote = mutation({
  args: {
    flagId: v.id("tradeAbuseFlags"),
    note: v.string(),
    appendToExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db.get(args.flagId);
    if (!flag) {
      throw new Error("Flag not found");
    }

    let newNote = args.note;
    if (args.appendToExisting && flag.adminNotes) {
      newNote = `${flag.adminNotes}\n---\n${new Date().toISOString()}: ${args.note}`;
    }

    await ctx.db.patch(args.flagId, {
      adminNotes: newNote,
    });

    return { success: true };
  },
});

// Manually flag a transaction
export const manualFlagTransaction = mutation({
  args: {
    purchaseId: v.id("marketListingPurchases"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already flagged
    const existingFlag = await ctx.db
      .query("tradeAbuseFlags")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .first();

    if (existingFlag) {
      // Add manual_flag to reasons if not already there
      if (!existingFlag.flagReasons.includes("manual_flag")) {
        await ctx.db.patch(existingFlag._id, {
          flagReasons: [...existingFlag.flagReasons, "manual_flag"],
          riskScore: existingFlag.riskScore + RISK_SCORES.manual_flag,
          adminNotes: args.reason
            ? `${existingFlag.adminNotes || ""}\n---\nManual flag: ${args.reason}`
            : existingFlag.adminNotes,
        });
      }
      return { flagId: existingFlag._id, isNew: false };
    }

    // Get the purchase details
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    const buyer = await ctx.db.get(purchase.buyerId);
    const seller = await ctx.db.get(purchase.sellerId);

    if (!buyer || !seller) {
      throw new Error("Buyer or seller not found");
    }

    // Create new flag
    const flagId = await ctx.db.insert("tradeAbuseFlags", {
      purchaseId: args.purchaseId,
      listingId: purchase.listingId,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      buyerCorpName: buyer.companyName || buyer.username || "Unknown",
      sellerCorpName: seller.companyName || seller.username || "Unknown",
      itemType: purchase.itemType,
      itemVariation: purchase.itemVariation,
      purchasePrice: purchase.pricePerUnit,
      quantity: purchase.quantityPurchased,
      flagReasons: ["manual_flag"],
      riskScore: RISK_SCORES.manual_flag,
      status: "pending",
      adminNotes: args.reason || "Manually flagged by admin",
      createdAt: Date.now(),
    });

    // Mark the corp pair as flagged
    await markCorpPairAsFlagged(ctx, purchase.buyerId, purchase.sellerId);

    return { flagId, isNew: true };
  },
});

// Get flagged corp trading pairs
export const getFlaggedCorpPairs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pairs = await ctx.db
      .query("corpTradePairs")
      .withIndex("by_flagged", (q) => q.eq("flagged", true))
      .collect();

    // Sort by trade count (most suspicious first)
    const sorted = pairs.sort((a, b) => b.tradeCount - a.tradeCount);

    return sorted.slice(0, args.limit || 50);
  },
});

// Search for corporations by name
export const searchCorporations = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();
    const limit = args.limit || 20;

    // Search users by company name or username
    const allUsers = await ctx.db.query("users").collect();

    const matches = allUsers
      .filter(u =>
        (u.companyName?.toLowerCase().includes(searchLower)) ||
        (u.username?.toLowerCase().includes(searchLower)) ||
        (u.walletAddress?.toLowerCase().includes(searchLower))
      )
      .slice(0, limit)
      .map(u => ({
        id: u._id,
        name: u.companyName || u.username || "Unknown",
        walletAddress: u.walletAddress,
      }));

    return matches;
  },
});
