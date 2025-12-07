import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { addEssenceToBalance } from "./lib/essenceHelpers";
import { internal } from "./_generated/api";

// Get all active marketplace listings (alias for shop page) - OPTIMIZED
export const getActiveListings = query({
  args: {
    itemType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100; // Default 100 items max
    const offset = args.offset || 0;
    
    let q = ctx.db
      .query("marketListings")
      .withIndex("by_status", (q: any) => q.eq("status", "active"));

    const listings = await q.collect();

    // Filter by item type if specified
    let filtered = listings;
    if (args.itemType && args.itemType !== "all") {
      filtered = filtered.filter((l: any) => l.itemType === args.itemType);
    }

    // Filter by search term if specified
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      filtered = filtered.filter((l: any) => 
        l.itemVariation?.toLowerCase().includes(searchLower) ||
        l.itemType.toLowerCase().includes(searchLower) ||
        l.essenceType?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    // Get seller info and variation type for each listing
    const listingsWithSellers = await Promise.all(
      paginated.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);

        // For essence listings, try to get the variation type from seller's essence balances
        let variationType: string | undefined;
        if (listing.itemType === "essence" && listing.itemVariation && seller?.walletAddress) {
          const essenceBalance = await ctx.db
            .query("essenceBalances")
            .withIndex("by_wallet", (q: any) => q.eq("walletAddress", seller.walletAddress))
            .filter((q) => q.eq(q.field("variationName"), listing.itemVariation))
            .first();

          variationType = essenceBalance?.variationType;
        }

        return {
          ...listing,
          sellerCompanyName: seller?.companyName || seller?.username || seller?.walletAddress?.slice(0, 8) || "Unknown Corp",
          variationType, // Add variation type (head, body, or item/trait)
        };
      })
    );

    return {
      listings: listingsWithSellers,
      total: filtered.length,
      hasMore: filtered.length > offset + limit,
    };
  },
});

// Get user's own listings (alias for shop page)
export const getUserListings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("marketListings")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return listings;
  },
});

// Purchase an item from the marketplace (alias for shop page)
export const purchaseItem = mutation({
  args: {
    buyerId: v.id("users"),
    listingId: v.id("marketListings"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Call the helper function
    return await processPurchase(ctx, {
      listingId: args.listingId,
      buyerId: args.buyerId,
      quantity: args.quantity,
    });
  },
});

// Helper function for purchaseItem
async function processPurchase(ctx: any, args: {
  listingId: Id<"marketListings">,
  buyerId: Id<"users">,
  quantity?: number,
}) {
  const listing = await ctx.db.get(args.listingId);
  const buyer = await ctx.db.get(args.buyerId);
  
  if (!listing || !buyer) {
    throw new Error("Listing or buyer not found");
  }
  
  if (listing.status !== "active") {
    throw new Error("Listing not active");
  }
  
  if (listing.sellerId === args.buyerId) {
    throw new Error("Cannot buy your own listing");
  }
  
  const purchaseQuantity = args.quantity || listing.quantity;
  if (purchaseQuantity > listing.quantity) {
    throw new Error("Not enough quantity available");
  }
  
  const totalCost = purchaseQuantity * listing.pricePerUnit;
  
  if (buyer.gold < totalCost) {
    throw new Error("Not enough gold");
  }
  
  // Process the purchase
  const seller = await ctx.db.get(listing.sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }
  
  // Transfer gold
  await ctx.db.patch(args.buyerId, {
    gold: buyer.gold - totalCost,
  });
  
  await ctx.db.patch(listing.sellerId, {
    gold: seller.gold + totalCost,
  });
  
  // Transfer items
  if (listing.itemType === "essence" && listing.itemVariation) {
    // Transfer essence using essenceBalances table
    const variationName = listing.itemVariation;

    // Use helper to safely add essence (prevents duplicates)
    await addEssenceToBalance(ctx, {
      walletAddress: buyer.walletAddress,
      variationId: 0, // Placeholder - marketplace doesn't track IDs
      variationName: variationName,
      variationType: "item" as const,
      amountToAdd: purchaseQuantity,
    });

  } else if (listing.itemType === "mek" && listing.mekId) {
    // Transfer Mek ownership
    await ctx.db.patch(listing.mekId, {
      owner: buyer.walletAddress,
    });
    
  } else if (listing.itemVariation) {
    // Add to buyer's inventory
    const existingItem = await ctx.db
      .query("inventory")
      .withIndex("by_user", (q: any) => q.eq("userId", args.buyerId))
      .filter((q: any) => 
        q.and(
          q.eq(q.field("itemType"), listing.itemType),
          q.eq(q.field("itemVariation"), listing.itemVariation)
        )
      )
      .first();
    
    if (existingItem) {
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + purchaseQuantity,
      });
    } else {
      await ctx.db.insert("inventory", {
        userId: args.buyerId,
        itemType: listing.itemType as "head" | "body" | "trait",
        itemVariation: listing.itemVariation,
        quantity: purchaseQuantity,
        craftedAt: Date.now(),
      });
    }
  }
  
  // Update or close listing
  if (purchaseQuantity === listing.quantity) {
    await ctx.db.patch(args.listingId, {
      status: "sold",
      quantity: 0,
    });
  } else {
    await ctx.db.patch(args.listingId, {
      quantity: listing.quantity - purchaseQuantity,
    });
  }

  // Log transactions
  const now = Date.now();

  await ctx.db.insert("transactions", {
    type: "purchase",
    userId: args.buyerId,
    amount: totalCost,
    itemType: listing.itemType,
    itemVariation: listing.itemVariation || listing.essenceType,
    details: `Purchased ${purchaseQuantity}x for ${totalCost}g`,
    timestamp: now,
  });

  await ctx.db.insert("transactions", {
    type: "sale",
    userId: listing.sellerId,
    amount: totalCost,
    itemType: listing.itemType,
    itemVariation: listing.itemVariation || listing.essenceType,
    details: `Sold ${purchaseQuantity}x for ${totalCost}g`,
    timestamp: now,
  });

  // Record purchase in history for marketplace analytics
  const purchaseId = await ctx.db.insert("marketListingPurchases", {
    listingId: args.listingId,
    buyerId: args.buyerId,
    sellerId: listing.sellerId,
    itemType: listing.itemType,
    itemVariation: listing.itemVariation,
    essenceType: listing.essenceType,
    quantityPurchased: purchaseQuantity,
    pricePerUnit: listing.pricePerUnit,
    totalCost: totalCost,
    timestamp: now,
  });

  // Run trade abuse detection (async, non-blocking)
  try {
    await ctx.scheduler.runAfter(0, internal.tradeAbuse.analyzeTradeForAbuse, {
      purchaseId: purchaseId,
      listingId: args.listingId,
      buyerId: args.buyerId,
      sellerId: listing.sellerId,
      itemType: listing.itemType,
      itemVariation: listing.itemVariation,
      purchasePrice: listing.pricePerUnit,
      quantity: purchaseQuantity,
      listingTimestamp: listing.listedAt,
      purchaseTimestamp: now,
    });
  } catch (e) {
    // Don't fail the purchase if abuse detection fails
    console.error("[TRADE_ABUSE] Error scheduling abuse detection:", e);
  }

  return { success: true, totalCost };
}

// Get active marketplace listings
export const getListings = query({
  args: {
    itemType: v.optional(v.union(
      v.literal("essence"),
      v.literal("head"),
      v.literal("body"),
      v.literal("trait"),
      v.literal("mek")
    )),
    sortBy: v.optional(v.union(
      v.literal("price_asc"),
      v.literal("price_desc"),
      v.literal("newest"),
      v.literal("oldest")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("marketListings")
      .withIndex("by_status", (q: any) => q.eq("status", "active"));
    
    // Filter by item type if specified
    if (args.itemType) {
      query = query.filter((q) => q.eq(q.field("itemType"), args.itemType));
    }
    
    let listings = await query.collect();
    
    // Sort listings
    switch (args.sortBy) {
      case "price_asc":
        listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case "price_desc":
        listings.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      case "newest":
        listings.sort((a, b) => b.listedAt - a.listedAt);
        break;
      case "oldest":
        listings.sort((a, b) => a.listedAt - b.listedAt);
        break;
      default:
        listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    }
    
    // Apply limit
    if (args.limit) {
      listings = listings.slice(0, args.limit);
    }
    
    // Get seller info for each listing
    const listingsWithSellers = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return {
          ...listing,
          sellerName: seller?.username || seller?.walletAddress || "Unknown",
        };
      })
    );
    
    return listingsWithSellers;
  },
});

// Create a new listing
export const createListing = mutation({
  args: {
    sellerId: v.id("users"),
    itemType: v.union(
      v.literal("essence"),
      v.literal("head"),
      v.literal("body"),
      v.literal("trait"),
      v.literal("overexposed"),
      v.literal("mek")
    ),
    itemVariation: v.string(),
    mekId: v.optional(v.id("meks")),
    essenceType: v.optional(v.string()),
    quantity: v.float64(),
    pricePerUnit: v.float64(),
    duration: v.optional(v.float64()), // hours
    durationFee: v.optional(v.float64()), // gold cost for duration
  },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Calculate total listing fee
    const totalValue = args.quantity * args.pricePerUnit;
    const marketFee = Math.ceil(totalValue * 0.02); // 2% market fee
    const durationFee = args.durationFee || 0; // Duration fee passed from frontend
    const totalFee = marketFee + durationFee;

    // Get seller's REAL gold from goldMining table (not users.gold)
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", seller.walletAddress))
      .first();

    if (!goldMining) {
      throw new Error("Gold mining record not found");
    }

    const currentGold = goldMining.accumulatedGold || 0;

    if (currentGold < totalFee) {
      throw new Error(`Insufficient gold. Total fee: ${totalFee}g (Duration: ${durationFee}g + Market: ${marketFee}g)`);
    }

    // Deduct total fee from goldMining.accumulatedGold
    await ctx.db.patch(goldMining._id, {
      accumulatedGold: currentGold - totalFee
    });
    
    // Validate the listing based on type
    if (args.itemType === "essence") {
      // For essence, itemVariation is the variation name
      const variationName = args.itemVariation;
      if (!variationName) {
        throw new Error("Essence variation required");
      }

      // Check if user has enough essence using essenceBalances
      const existingBalances = await ctx.db
        .query("essenceBalances")
        .withIndex("", (q: any) => q.eq("walletAddress", seller.walletAddress))
        .collect();

      const balance = existingBalances.find((b: any) => b.variationName === variationName);
      const currentAmount = balance?.accumulatedAmount || 0;

      if (currentAmount < args.quantity) {
        throw new Error(`Not enough ${variationName} essence to list. Have ${currentAmount}, need ${args.quantity}`);
      }

      // Deduct essence from user (held in escrow)
      if (balance) {
        const now = Date.now();
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount - args.quantity,
          lastSnapshotTime: now, // Update snapshot when listing essence
          lastUpdated: now,
        });
      }

    } else if (args.itemType === "mek") {
      if (!args.mekId) {
        throw new Error("Mek ID required");
      }
      
      // Verify ownership
      const mek = await ctx.db.get(args.mekId);
      if (!mek || mek.owner !== seller.walletAddress) {
        throw new Error("Mek not owned by seller");
      }
      
    } else {
      // Head, body, or trait from inventory
      if (!args.itemVariation) {
        throw new Error("Item variation required");
      }
      
      // Check inventory
      const inventoryItem = await ctx.db
        .query("inventory")
        .withIndex("", (q: any) => q.eq("userId", args.sellerId))
        .filter((q) => 
          q.and(
            q.eq(q.field("itemType"), args.itemType),
            q.eq(q.field("itemVariation"), args.itemVariation)
          )
        )
        .first();
      
      if (!inventoryItem || inventoryItem.quantity < args.quantity) {
        throw new Error("Not enough items in inventory");
      }
      
      // Deduct from inventory
      if (inventoryItem.quantity === args.quantity) {
        await ctx.db.delete(inventoryItem._id);
      } else {
        await ctx.db.patch(inventoryItem._id, {
          quantity: inventoryItem.quantity - args.quantity,
        });
      }
    }
    
    // Create the listing
    const now = Date.now();
    const duration = args.duration || 24; // Default 24 hours
    const expiresAt = now + duration * 60 * 60 * 1000;
    
    const listingId = await ctx.db.insert("marketListings", {
      sellerId: args.sellerId,
      itemType: args.itemType,
      itemVariation: args.itemVariation,
      mekId: args.mekId,
      essenceType: args.itemType === "essence" ? args.itemVariation : undefined,
      quantity: args.quantity,
      pricePerUnit: args.pricePerUnit,
      listedAt: now,
      expiresAt,
      status: "active",
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      type: "sale",
      userId: args.sellerId,
      itemType: args.itemType,
      itemVariation: args.itemVariation,
      details: `Listed ${args.quantity}x for ${args.pricePerUnit}g each (Total Fee: ${totalFee}g - Duration: ${durationFee}g + Market: ${marketFee}g)`,
      timestamp: now,
    });

    // Check for price gap abuse (buying cheap, reselling high)
    if (args.itemVariation) {
      try {
        await ctx.scheduler.runAfter(0, internal.tradeAbuse.detectResaleGap, {
          sellerId: args.sellerId,
          itemType: args.itemType,
          itemVariation: args.itemVariation,
          newListingPrice: args.pricePerUnit,
          newListingId: listingId,
        });
      } catch (e) {
        // Don't fail the listing if abuse detection fails
        console.error("[TRADE_ABUSE] Error scheduling resale gap detection:", e);
      }
    }

    return listingId;
  },
});

// Purchase from a listing
export const purchaseListing = mutation({
  args: {
    listingId: v.id("marketListings"),
    buyerId: v.id("users"),
    quantity: v.optional(v.number()), // For partial purchases
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    const buyer = await ctx.db.get(args.buyerId);
    
    if (!listing || !buyer) {
      throw new Error("Listing or buyer not found");
    }
    
    if (listing.status !== "active") {
      throw new Error("Listing not active");
    }
    
    if (listing.sellerId === args.buyerId) {
      throw new Error("Cannot buy your own listing");
    }
    
    const purchaseQuantity = args.quantity || listing.quantity;
    if (purchaseQuantity > listing.quantity) {
      throw new Error("Not enough quantity available");
    }
    
    const totalCost = purchaseQuantity * listing.pricePerUnit;
    
    if (buyer.gold < totalCost) {
      throw new Error("Not enough gold");
    }
    
    // Process the purchase
    const seller = await ctx.db.get(listing.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    
    // Transfer gold
    await ctx.db.patch(args.buyerId, {
      gold: buyer.gold - totalCost,
    });
    
    await ctx.db.patch(listing.sellerId, {
      gold: seller.gold + totalCost,
    });
    
    // Transfer items
    if (listing.itemType === "essence" && listing.itemVariation) {
      // Transfer essence using essenceBalances table
      const variationName = listing.itemVariation;

      // Use helper to safely add essence (prevents duplicates)
      await addEssenceToBalance(ctx, {
        walletAddress: buyer.walletAddress,
        variationId: 0,
        variationName: variationName,
        variationType: "item" as const,
        amountToAdd: purchaseQuantity,
      });

    } else if ((listing.itemType as string) === "mek" && listing.mekId) {
      // Transfer Mek ownership
      await ctx.db.patch(listing.mekId, {
        owner: buyer.walletAddress,
      });
      
    } else if (listing.itemVariation) {
      // Add to buyer's inventory
      const existingItem = await ctx.db
        .query("inventory")
        .withIndex("", (q: any) => q.eq("userId", args.buyerId))
        .filter((q) => 
          q.and(
            q.eq(q.field("itemType"), listing.itemType),
            q.eq(q.field("itemVariation"), listing.itemVariation)
          )
        )
        .first();
      
      if (existingItem) {
        await ctx.db.patch(existingItem._id, {
          quantity: existingItem.quantity + purchaseQuantity,
        });
      } else {
        await ctx.db.insert("inventory", {
          userId: args.buyerId,
          itemType: listing.itemType as "head" | "body" | "trait",
          itemVariation: listing.itemVariation,
          quantity: purchaseQuantity,
          craftedAt: Date.now(),
        });
      }
    }
    
    // Update or close listing
    if (purchaseQuantity === listing.quantity) {
      await ctx.db.patch(args.listingId, {
        status: "sold",
        quantity: 0,
      });
    } else {
      await ctx.db.patch(args.listingId, {
        quantity: listing.quantity - purchaseQuantity,
      });
    }

    // Log transactions
    const now = Date.now();

    await ctx.db.insert("transactions", {
      type: "purchase",
      userId: args.buyerId,
      amount: totalCost,
      itemType: listing.itemType,
      itemVariation: listing.itemVariation || listing.essenceType,
      details: `Purchased ${purchaseQuantity}x for ${totalCost}g`,
      timestamp: now,
    });

    await ctx.db.insert("transactions", {
      type: "sale",
      userId: listing.sellerId,
      amount: totalCost,
      itemType: listing.itemType,
      itemVariation: listing.itemVariation || listing.essenceType,
      details: `Sold ${purchaseQuantity}x for ${totalCost}g`,
      timestamp: now,
    });

    // Record purchase in history for marketplace analytics
    const purchaseId = await ctx.db.insert("marketListingPurchases", {
      listingId: args.listingId,
      buyerId: args.buyerId,
      sellerId: listing.sellerId,
      itemType: listing.itemType,
      itemVariation: listing.itemVariation,
      essenceType: listing.essenceType,
      quantityPurchased: purchaseQuantity,
      pricePerUnit: listing.pricePerUnit,
      totalCost: totalCost,
      timestamp: now,
    });

    // Run trade abuse detection (async, non-blocking)
    try {
      await ctx.scheduler.runAfter(0, internal.tradeAbuse.analyzeTradeForAbuse, {
        purchaseId: purchaseId,
        listingId: args.listingId,
        buyerId: args.buyerId,
        sellerId: listing.sellerId,
        itemType: listing.itemType,
        itemVariation: listing.itemVariation,
        purchasePrice: listing.pricePerUnit,
        quantity: purchaseQuantity,
        listingTimestamp: listing.listedAt,
        purchaseTimestamp: now,
      });
    } catch (e) {
      // Don't fail the purchase if abuse detection fails
      console.error("[TRADE_ABUSE] Error scheduling abuse detection:", e);
    }

    return { success: true, totalCost };
  },
});

// Create admin listing (no fees, no inventory checks)
export const createAdminListing = mutation({
  args: {
    sellerId: v.id("users"),
    itemType: v.string(),
    itemVariation: v.string(),
    itemDescription: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    imageUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    essenceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    
    // Create the listing directly without checks or fees
    const now = Date.now();
    
    const listingId = await ctx.db.insert("marketListings", {
      sellerId: args.sellerId,
      itemType: args.itemType as any,
      itemVariation: args.itemVariation,
      itemDescription: args.itemDescription,
      mekId: undefined,
      essenceType: args.essenceType,
      quantity: args.quantity,
      pricePerUnit: args.pricePerUnit,
      imageUrl: args.imageUrl,
      listedAt: now,
      expiresAt: args.expiresAt,
      status: "active",
      isAdminListing: true,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      type: "sale",
      userId: args.sellerId,
      itemType: args.itemType as any,
      itemVariation: args.itemVariation,
      details: `Admin listed ${args.quantity}x for ${args.pricePerUnit}g each`,
      timestamp: now,
    });
    
    return listingId;
  },
});

// Get purchase history for a listing
export const getListingPurchaseHistory = query({
  args: {
    listingId: v.id("marketListings"),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("marketListingPurchases")
      .withIndex("", (q: any) => q.eq("listingId", args.listingId))
      .order("desc")
      .collect();

    // Get buyer info for each purchase
    const purchasesWithBuyers = await Promise.all(
      purchases.map(async (purchase) => {
        const buyer = await ctx.db.get(purchase.buyerId);
        return {
          ...purchase,
          buyerName: buyer?.username || buyer?.walletAddress || "Unknown",
        };
      })
    );

    return purchasesWithBuyers;
  },
});

// Cancel a listing
export const cancelListing = mutation({
  args: {
    listingId: v.id("marketListings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    
    if (!listing || listing.sellerId !== args.userId) {
      throw new Error("Listing not found or unauthorized");
    }
    
    if (listing.status !== "active") {
      throw new Error("Listing not active");
    }
    
    const seller = await ctx.db.get(listing.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    
    // Return items to seller
    if (listing.itemType === "essence" && listing.itemVariation) {
      // Return essence using essenceBalances
      const variationName = listing.itemVariation;

      // Use helper to safely add essence (prevents duplicates)
      await addEssenceToBalance(ctx, {
        walletAddress: seller.walletAddress,
        variationId: 0,
        variationName: variationName,
        variationType: "item" as const,
        amountToAdd: listing.quantity,
      });

    } else if ((listing.itemType as string) !== "mek" && listing.itemVariation) {
      // Return to inventory
      const existingItem = await ctx.db
        .query("inventory")
        .withIndex("", (q: any) => q.eq("userId", listing.sellerId))
        .filter((q) => 
          q.and(
            q.eq(q.field("itemType"), listing.itemType),
            q.eq(q.field("itemVariation"), listing.itemVariation)
          )
        )
        .first();
      
      if (existingItem) {
        await ctx.db.patch(existingItem._id, {
          quantity: existingItem.quantity + listing.quantity,
        });
      } else {
        await ctx.db.insert("inventory", {
          userId: listing.sellerId,
          itemType: listing.itemType as "head" | "body" | "trait",
          itemVariation: listing.itemVariation,
          quantity: listing.quantity,
          craftedAt: Date.now(),
        });
      }
    }
    
    // Cancel the listing
    await ctx.db.patch(args.listingId, {
      status: "cancelled",
    });
    
    return { success: true };
  },
});