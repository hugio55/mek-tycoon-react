import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Item type validator matching schema
const itemTypeValidator = v.union(
  v.literal("essence"),
  v.literal("head"),
  v.literal("body"),
  v.literal("trait"),
  v.literal("overexposed"),
  v.literal("consumable"),
  v.literal("boost"),
  v.literal("special"),
  v.literal("mek"),
  v.literal("enclosure"),
  v.literal("oem"),
  v.literal("universal-chips")
);

// Get active marketplace listings with optional filters
export const getActiveListings = query({
  args: {
    itemType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    limit: v.number(),
    offset: v.number(),
  },
  handler: async (ctx, args) => {
    const { itemType, searchTerm, limit, offset } = args;

    // Get all active listings
    let listingsQuery = ctx.db
      .query("marketListings")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    let allListings = await listingsQuery.collect();

    // Filter by item type if specified
    if (itemType) {
      allListings = allListings.filter((l) => l.itemType === itemType);
    }

    // Filter by search term if specified (search in itemVariation)
    if (searchTerm && searchTerm.length >= 2) {
      const searchLower = searchTerm.toLowerCase();
      allListings = allListings.filter((l) =>
        l.itemVariation?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by listedAt descending (newest first)
    allListings.sort((a, b) => b.listedAt - a.listedAt);

    // Apply pagination
    const paginatedListings = allListings.slice(offset, offset + limit);

    // Enrich with seller info
    const enrichedListings = await Promise.all(
      paginatedListings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return {
          ...listing,
          sellerName: seller?.corporationName || "Unknown Seller",
        };
      })
    );

    return {
      listings: enrichedListings,
      totalCount: allListings.length,
      hasMore: offset + limit < allListings.length,
    };
  },
});

// Get user's own listings
export const getUserListings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("marketListings")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .collect();

    // Filter to active listings only
    return listings.filter((l) => l.status === "active");
  },
});

// Create a new listing
export const createListing = mutation({
  args: {
    sellerId: v.id("users"),
    itemType: itemTypeValidator,
    itemVariation: v.optional(v.string()),
    itemDescription: v.optional(v.string()),
    essenceType: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    duration: v.optional(v.number()), // Duration in hours
    durationFee: v.optional(v.number()), // Fee for listing duration
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      sellerId,
      itemType,
      itemVariation,
      itemDescription,
      essenceType,
      quantity,
      pricePerUnit,
      duration,
      durationFee,
      imageUrl,
    } = args;

    // Validate seller exists
    const seller = await ctx.db.get(sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }

    if (!seller.stakeAddress) {
      throw new Error("Seller wallet not configured");
    }

    const sellerWallet = seller.stakeAddress;

    // Calculate fees (2% market fee + duration fee)
    const totalValue = quantity * pricePerUnit;
    const marketFee = Math.ceil(totalValue * 0.02);
    const totalFee = marketFee + (durationFee || 0);

    // Check if seller has enough gold
    const sellerGold = seller.gold || 0;
    if (sellerGold < totalFee) {
      throw new Error(`Insufficient gold. You need ${totalFee}g to list this item.`);
    }

    // For essence listings, verify seller has enough essence
    if (itemType === "essence" && itemVariation) {
      const essenceBalance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_name", (q) =>
          q.eq("walletAddress", sellerWallet).eq("variationName", itemVariation)
        )
        .first();

      const available = essenceBalance?.accumulatedAmount || 0;
      if (available < quantity) {
        throw new Error(`Insufficient essence. You have ${available} but need ${quantity}.`);
      }

      // Deduct essence from seller
      if (essenceBalance) {
        await ctx.db.patch(essenceBalance._id, {
          accumulatedAmount: available - quantity,
        });
      }
    }

    // Deduct listing fee from seller
    await ctx.db.patch(sellerId, {
      gold: sellerGold - totalFee,
    });

    // Calculate expiration
    const listedAt = Date.now();
    const expiresAt = duration ? listedAt + duration * 60 * 60 * 1000 : undefined;

    // Create the listing
    const listingId = await ctx.db.insert("marketListings", {
      sellerId,
      itemType,
      itemVariation,
      itemDescription,
      essenceType: itemType === "essence" ? itemVariation : essenceType,
      quantity,
      pricePerUnit,
      imageUrl,
      listedAt,
      expiresAt,
      status: "active",
      isAdminListing: false,
    });

    return { success: true, listingId };
  },
});

// Purchase item from listing
export const purchaseItem = mutation({
  args: {
    buyerId: v.id("users"),
    listingId: v.id("marketListings"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const { buyerId, listingId, quantity } = args;

    // Get listing
    const listing = await ctx.db.get(listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.status !== "active") {
      throw new Error("This listing is no longer active");
    }

    if (quantity > listing.quantity) {
      throw new Error(`Only ${listing.quantity} available`);
    }

    // Get buyer
    const buyer = await ctx.db.get(buyerId);
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    if (!buyer.stakeAddress) {
      throw new Error("Buyer wallet not configured");
    }

    const buyerWallet = buyer.stakeAddress;

    // Calculate total cost
    const totalCost = quantity * listing.pricePerUnit;

    // Check buyer has enough gold
    const buyerGold = buyer.gold || 0;
    if (buyerGold < totalCost) {
      throw new Error(`Insufficient gold. You need ${totalCost}g but only have ${buyerGold}g.`);
    }

    // Get seller
    const seller = await ctx.db.get(listing.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Transfer gold from buyer to seller
    await ctx.db.patch(buyerId, {
      gold: buyerGold - totalCost,
    });
    await ctx.db.patch(listing.sellerId, {
      gold: (seller.gold || 0) + totalCost,
    });

    // If essence purchase, transfer essence to buyer
    if (listing.itemType === "essence" && listing.itemVariation) {
      // Find or create buyer's essence balance
      const buyerEssence = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_name", (q) =>
          q.eq("walletAddress", buyerWallet).eq("variationName", listing.itemVariation!)
        )
        .first();

      if (buyerEssence) {
        await ctx.db.patch(buyerEssence._id, {
          accumulatedAmount: (buyerEssence.accumulatedAmount || 0) + quantity,
        });
      } else {
        // Need to look up variation data to insert properly
        // For now, we'll create a minimal record - full data can be populated by the essence system
        await ctx.db.insert("essenceBalances", {
          walletAddress: buyerWallet,
          variationId: 0, // Will be populated when essence system runs
          variationName: listing.itemVariation,
          variationType: "head", // Default, will be corrected by essence system
          accumulatedAmount: quantity,
          lastUpdated: Date.now(),
        });
      }
    }

    // Update listing quantity or mark as sold
    const newQuantity = listing.quantity - quantity;
    if (newQuantity <= 0) {
      await ctx.db.patch(listingId, {
        quantity: 0,
        status: "sold",
      });
    } else {
      await ctx.db.patch(listingId, {
        quantity: newQuantity,
      });
    }

    // Record purchase history
    await ctx.db.insert("marketListingPurchases", {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      itemType: listing.itemType,
      itemVariation: listing.itemVariation,
      essenceType: listing.essenceType,
      quantityPurchased: quantity,
      pricePerUnit: listing.pricePerUnit,
      totalCost: totalCost,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Cancel/recall a listing
export const cancelListing = mutation({
  args: {
    userId: v.id("users"),
    listingId: v.id("marketListings"),
  },
  handler: async (ctx, args) => {
    const { userId, listingId } = args;

    // Get listing
    const listing = await ctx.db.get(listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Verify ownership
    if (listing.sellerId !== userId) {
      throw new Error("You can only cancel your own listings");
    }

    if (listing.status !== "active") {
      throw new Error("This listing is no longer active");
    }

    // Return essence to seller if applicable
    if (listing.itemType === "essence" && listing.itemVariation && listing.quantity > 0) {
      const seller = await ctx.db.get(userId);
      if (seller && seller.stakeAddress) {
        const sellerWallet = seller.stakeAddress;
        const essenceBalance = await ctx.db
          .query("essenceBalances")
          .withIndex("by_wallet_and_name", (q) =>
            q.eq("walletAddress", sellerWallet).eq("variationName", listing.itemVariation!)
          )
          .first();

        if (essenceBalance) {
          await ctx.db.patch(essenceBalance._id, {
            accumulatedAmount: (essenceBalance.accumulatedAmount || 0) + listing.quantity,
          });
        } else {
          await ctx.db.insert("essenceBalances", {
            walletAddress: sellerWallet,
            variationId: 0,
            variationName: listing.itemVariation,
            variationType: "head",
            accumulatedAmount: listing.quantity,
            lastUpdated: Date.now(),
          });
        }
      }
    }

    // Mark as cancelled
    await ctx.db.patch(listingId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

// Create admin listing (for shop admin)
export const createAdminListing = mutation({
  args: {
    sellerId: v.id("users"),
    itemType: itemTypeValidator,
    itemVariation: v.optional(v.string()),
    itemDescription: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    expiresAt: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      sellerId,
      itemType,
      itemVariation,
      itemDescription,
      quantity,
      pricePerUnit,
      expiresAt,
      imageUrl,
    } = args;

    const listingId = await ctx.db.insert("marketListings", {
      sellerId,
      itemType,
      itemVariation,
      itemDescription,
      quantity,
      pricePerUnit,
      imageUrl,
      listedAt: Date.now(),
      expiresAt,
      status: "active",
      isAdminListing: true,
    });

    return { success: true, listingId };
  },
});
