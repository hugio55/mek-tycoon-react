import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { addEssenceToBalance } from "./lib/essenceHelpers";

// Get aggregated summary of all essence in the marketplace
export const getEssenceMarketSummary = query({
  args: {},
  handler: async (ctx) => {
    // Get all active essence listings
    const listings = await ctx.db
      .query("marketListings")
      .withIndex("", (q: any) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("itemType"), "essence"))
      .collect();

    // Aggregate by variation
    const aggregated = new Map<string, {
      variationName: string;
      totalQuantity: number;
      listingCount: number;
      lowestPrice: number;
      highestPrice: number;
      listings: any[];
    }>();

    for (const listing of listings) {
      const varName = listing.itemVariation || "Unknown";

      if (!aggregated.has(varName)) {
        aggregated.set(varName, {
          variationName: varName,
          totalQuantity: 0,
          listingCount: 0,
          lowestPrice: listing.pricePerUnit,
          highestPrice: listing.pricePerUnit,
          listings: [],
        });
      }

      const agg = aggregated.get(varName)!;
      agg.totalQuantity += listing.quantity;
      agg.listingCount += 1;
      agg.lowestPrice = Math.min(agg.lowestPrice, listing.pricePerUnit);
      agg.highestPrice = Math.max(agg.highestPrice, listing.pricePerUnit);
      agg.listings.push(listing);
    }

    // Convert to array and sort by variation name
    const summary = Array.from(aggregated.values()).sort((a, b) =>
      a.variationName.localeCompare(b.variationName)
    );

    return summary;
  },
});

// Get detailed list of all essence listings with seller info
export const getEssenceListingsDetailed = query({
  args: {
    variationFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all active essence listings
    let listings = await ctx.db
      .query("marketListings")
      .withIndex("", (q: any) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("itemType"), "essence"))
      .collect();

    // Filter by variation if specified
    if (args.variationFilter) {
      listings = listings.filter((l: any) => l.itemVariation === args.variationFilter);
    }

    // Get seller info for each listing
    const detailed = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return {
          ...listing,
          sellerUsername: seller?.username || "Unknown",
          sellerWallet: seller?.walletAddress || "Unknown",
          sellerDisplayName: seller?.displayName || seller?.username || "Unknown",
        };
      })
    );

    // Sort by listed date (newest first)
    detailed.sort((a, b) => b.listedAt - a.listedAt);

    return detailed;
  },
});

// Add essence to a player's balance (admin only)
export const adminAddEssenceToPlayer = mutation({
  args: {
    walletAddress: v.string(),
    variationName: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, variationName, amount } = args;

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Use helper to safely add essence (prevents duplicates)
    await addEssenceToBalance(ctx, {
      walletAddress,
      variationId: 0,
      variationName: variationName,
      variationType: "item" as const,
      amountToAdd: amount,
    });

    // Get updated balance for response
    const updatedBalance = await ctx.db
      .query("essenceBalances")
      .withIndex("", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("variationName", variationName)
      )
      .first();

    const newAmount = updatedBalance?.accumulatedAmount || amount;

    return {
      success: true,
      newAmount,
      message: `Added ${amount} ${variationName} to ${walletAddress}. New total: ${newAmount}`,
    };
  },
});

// Delete any listing (admin only)
export const adminDeleteListing = mutation({
  args: {
    listingId: v.id("marketListings"),
    returnEssence: v.optional(v.boolean()), // Whether to return essence to seller
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Optionally return essence to seller before deletion
    if (args.returnEssence && listing.itemType === "essence" && listing.itemVariation) {
      const seller = await ctx.db.get(listing.sellerId);

      if (seller) {
        const variationName = listing.itemVariation;

        // Use helper to safely add essence (prevents duplicates)
        await addEssenceToBalance(ctx, {
          walletAddress: seller.walletAddress,
          variationId: 0,
          variationName: variationName,
          variationType: "item" as const,
          amountToAdd: listing.quantity,
        });
      }
    }

    // Delete the listing
    await ctx.db.delete(args.listingId);

    return {
      success: true,
      message: `Deleted listing ${args.listingId}${args.returnEssence ? " (essence returned to seller)" : ""}`,
    };
  },
});

// Get all essence listings for a specific variation
export const getMarketEssenceByVariation = query({
  args: {
    variationName: v.string(),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("marketListings")
      .withIndex("", (q: any) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), "essence"),
          q.eq(q.field("itemVariation"), args.variationName)
        )
      )
      .collect();

    // Get seller info
    const detailed = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return {
          ...listing,
          sellerUsername: seller?.username || "Unknown",
          sellerWallet: seller?.walletAddress || "Unknown",
          sellerDisplayName: seller?.displayName || seller?.username || "Unknown",
        };
      })
    );

    // Sort by price (lowest first)
    detailed.sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    return detailed;
  },
});

// Get player's essence balances
export const getPlayerEssenceBalances = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const balances = await ctx.db
      .query("essenceBalances")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    // Sort by variation name
    balances.sort((a, b) => a.variationName.localeCompare(b.variationName));

    return balances;
  },
});

// Search for players by wallet address or username
export const searchPlayers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const term = args.searchTerm.toLowerCase();

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter by wallet or username
    const matches = allUsers.filter((user: any) =>
      user.walletAddress.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.displayName?.toLowerCase().includes(term)
    );

    // Return top 10 matches
    return matches.slice(0, 10).map((user: any) => ({
      _id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
    }));
  },
});

// Get total market stats
export const getMarketStats = query({
  args: {},
  handler: async (ctx) => {
    const allListings = await ctx.db
      .query("marketListings")
      .withIndex("", (q: any) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("itemType"), "essence"))
      .collect();

    const totalListings = allListings.length;
    const totalEssenceQuantity = allListings.reduce((sum, l) => sum + l.quantity, 0);
    const uniqueVariations = new Set(allListings.map((l: any) => l.itemVariation)).size;
    const totalValue = allListings.reduce((sum, l) => sum + (l.quantity * l.pricePerUnit), 0);

    return {
      totalListings,
      totalEssenceQuantity,
      uniqueVariations,
      totalValue,
    };
  },
});

// Create marketplace listing as company (admin only)
export const adminCreateCompanyListing = mutation({
  args: {
    variationName: v.string(),
    quantity: v.number(),
    pricePerUnit: v.number(),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const { variationName, quantity, pricePerUnit, durationDays } = args;

    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    if (pricePerUnit <= 0) {
      throw new Error("Price must be positive");
    }

    if (durationDays <= 0) {
      throw new Error("Duration must be positive");
    }

    // Ensure company account exists
    let companySeller = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", "company_overexposed"))
      .first();

    if (!companySeller) {
      const sellerId = await ctx.db.insert("users", {
        walletAddress: "company_overexposed",
        username: "Over Exposed",
        displayName: "Over Exposed (Company)",
        gold: 999999999,
        totalEssence: {
          stone: 0, disco: 0, paul: 0, cartoon: 0, candy: 0, tiles: 0,
          moss: 0, bullish: 0, journalist: 0, laser: 0, flashbulb: 0,
          accordion: 0, turret: 0, drill: 0, security: 0,
        },
        craftingSlots: 3,
        lastLogin: Date.now(),
      });
      companySeller = await ctx.db.get(sellerId);
    }

    if (!companySeller) {
      throw new Error("Failed to create company seller");
    }

    const now = Date.now();
    const expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);

    // Create listing (no balance check for company - infinite source)
    const listingId = await ctx.db.insert("marketListings", {
      sellerId: companySeller._id,
      itemType: "essence",
      itemVariation: variationName,
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      status: "active",
      listedAt: now,
      expiresAt: expiresAt,
    });

    // Save to persistent listing history
    await ctx.db.insert("marketplaceListingHistory", {
      timestamp: now,
      variationName: variationName,
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      durationDays: durationDays,
      totalValue: quantity * pricePerUnit,
      createdBy: "admin",
    });

    return {
      success: true,
      listingId: listingId,
      message: `Created listing: ${quantity} ${variationName} at ${pricePerUnit}G/unit (expires in ${durationDays} days)`,
    };
  },
});

// Get all marketplace listing history (persistent, never deleted)
export const getMarketplaceListingHistory = query({
  args: {},
  handler: async (ctx) => {
    const history = await ctx.db
      .query("marketplaceListingHistory")
      .withIndex("by_timestamp")
      .order("desc") // Newest first
      .collect();

    return history.map((item: any) => ({
      _id: item._id,
      timestamp: item.timestamp,
      variation: item.variationName,
      quantity: item.quantity,
      price: item.pricePerUnit,
      duration: item.durationDays,
      totalValue: item.totalValue,
      createdBy: item.createdBy,
    }));
  },
});
