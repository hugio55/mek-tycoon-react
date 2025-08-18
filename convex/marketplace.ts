import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      v.literal("mek")
    ),
    itemVariation: v.optional(v.string()),
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
    
    // Validate the listing based on type
    if (args.itemType === "essence") {
      if (!args.essenceType) {
        throw new Error("Essence type required");
      }
      
      // Check if user has enough essence
      const essenceKey = args.essenceType as keyof typeof seller.totalEssence;
      if (seller.totalEssence[essenceKey] < args.quantity) {
        throw new Error("Not enough essence to list");
      }
      
      // Deduct essence from user (held in escrow)
      const updatedEssence = { ...seller.totalEssence };
      updatedEssence[essenceKey] -= args.quantity;
      await ctx.db.patch(args.sellerId, { totalEssence: updatedEssence });
      
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
      essenceType: args.essenceType,
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
      itemVariation: args.itemVariation || args.essenceType,
      details: `Listed ${args.quantity}x for ${args.pricePerUnit}g each`,
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
    if (listing.itemType === "essence" && listing.essenceType) {
      // Transfer essence
      const buyerEssence = { ...buyer.totalEssence };
      const essenceKey = listing.essenceType as keyof typeof buyerEssence;
      buyerEssence[essenceKey] += purchaseQuantity;
      await ctx.db.patch(args.buyerId, { totalEssence: buyerEssence });
      
    } else if (listing.itemType === "mek" && listing.mekId) {
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
    
    return { success: true, totalCost };
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
    if (listing.itemType === "essence" && listing.essenceType) {
      // Return essence
      const sellerEssence = { ...seller.totalEssence };
      const essenceKey = listing.essenceType as keyof typeof sellerEssence;
      sellerEssence[essenceKey] += listing.quantity;
      await ctx.db.patch(listing.sellerId, { totalEssence: sellerEssence });
      
    } else if (listing.itemType !== "mek" && listing.itemVariation) {
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