import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
      .withIndex("by_status", (q) => q.eq("status", "active"));

    const listings = await q.collect();

    // Filter by item type if specified
    let filtered = listings;
    if (args.itemType && args.itemType !== "all") {
      filtered = filtered.filter(l => l.itemType === args.itemType);
    }

    // Filter by search term if specified
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.itemVariation?.toLowerCase().includes(searchLower) ||
        l.itemType.toLowerCase().includes(searchLower) ||
        l.essenceType?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    // Get seller info for each listing
    const listingsWithSellers = await Promise.all(
      paginated.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return {
          ...listing,
          sellerCompanyName: seller?.companyName || seller?.username || seller?.walletAddress?.slice(0, 8) || "Unknown Corp",
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
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
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

    // Find existing balance
    const existingBalance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", buyer.walletAddress))
      .collect();

    const balance = existingBalance.find(b => b.variationName === variationName);
    const now = Date.now();

    if (balance) {
      // Update existing balance
      await ctx.db.patch(balance._id, {
        accumulatedAmount: balance.accumulatedAmount + purchaseQuantity,
        lastUpdated: now,
      });
    } else {
      // Create new balance (sparse storage - only when they have essence)
      await ctx.db.insert("essenceBalances", {
        walletAddress: buyer.walletAddress,
        variationId: 0, // Placeholder - marketplace doesn't need this
        variationName: variationName,
        variationType: "item" as const, // Placeholder - marketplace doesn't need accurate type
        accumulatedAmount: purchaseQuantity,
        lastUpdated: now,
      });
    }

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
  await ctx.db.insert("marketListingPurchases", {
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
      .withIndex("by_status", (q) => q.eq("status", "active"));
    
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
    quantity: v.number(),
    pricePerUnit: v.number(),
    duration: v.optional(v.number()), // hours
  },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    
    // Calculate and deduct listing fee (2% of total value)
    const totalValue = args.quantity * args.pricePerUnit;
    const listingFee = Math.ceil(totalValue * 0.02);
    
    if (seller.gold < listingFee) {
      throw new Error(`Insufficient gold for listing fee. Need ${listingFee}g, have ${seller.gold}g`);
    }
    
    // Deduct listing fee
    await ctx.db.patch(args.sellerId, {
      gold: seller.gold - listingFee
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
        .withIndex("by_wallet", (q) => q.eq("walletAddress", seller.walletAddress))
        .collect();

      const balance = existingBalances.find(b => b.variationName === variationName);
      const currentAmount = balance?.accumulatedAmount || 0;

      if (currentAmount < args.quantity) {
        throw new Error(`Not enough ${variationName} essence to list. Have ${currentAmount}, need ${args.quantity}`);
      }

      // Deduct essence from user (held in escrow)
      if (balance) {
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount - args.quantity,
          lastUpdated: Date.now(),
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
        .withIndex("by_user", (q) => q.eq("userId", args.sellerId))
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
      details: `Listed ${args.quantity}x for ${args.pricePerUnit}g each (Fee: ${listingFee}g)`,
      timestamp: now,
    });
    
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

      // Find existing balance
      const existingBalance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", buyer.walletAddress))
        .collect();

      const balance = existingBalance.find(b => b.variationName === variationName);
      const now = Date.now();

      if (balance) {
        // Update existing balance
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount + purchaseQuantity,
          lastUpdated: now,
        });
      } else {
        // Create new balance (sparse storage)
        await ctx.db.insert("essenceBalances", {
          walletAddress: buyer.walletAddress,
          variationId: 0,
          variationName: variationName,
          variationType: "item" as const,
          accumulatedAmount: purchaseQuantity,
          lastUpdated: now,
        });
      }

    } else if ((listing.itemType as string) === "mek" && listing.mekId) {
      // Transfer Mek ownership
      await ctx.db.patch(listing.mekId, {
        owner: buyer.walletAddress,
      });
      
    } else if (listing.itemVariation) {
      // Add to buyer's inventory
      const existingItem = await ctx.db
        .query("inventory")
        .withIndex("by_user", (q) => q.eq("userId", args.buyerId))
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
    await ctx.db.insert("marketListingPurchases", {
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
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
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

      // Find existing balance
      const existingBalances = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", seller.walletAddress))
        .collect();

      const balance = existingBalances.find(b => b.variationName === variationName);
      const now = Date.now();

      if (balance) {
        // Update existing balance
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount + listing.quantity,
          lastUpdated: now,
        });
      } else {
        // Create new balance (sparse storage)
        await ctx.db.insert("essenceBalances", {
          walletAddress: seller.walletAddress,
          variationId: 0,
          variationName: variationName,
          variationType: "item" as const,
          accumulatedAmount: listing.quantity,
          lastUpdated: now,
        });
      }

    } else if ((listing.itemType as string) !== "mek" && listing.itemVariation) {
      // Return to inventory
      const existingItem = await ctx.db
        .query("inventory")
        .withIndex("by_user", (q) => q.eq("userId", listing.sellerId))
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