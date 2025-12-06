import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

// Get all variations for an event
export const getVariationsByEvent = query({
  args: { eventId: v.id("nftEvents") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    // Sort by display order (easy, medium, hard)
    return variations.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// Get variation by ID
export const getVariationById = query({
  args: { variationId: v.id("nftVariations") },
  handler: async (ctx, args) => {
    const variation = await ctx.db.get(args.variationId);
    return variation;
  },
});

// Get variation by NMKR asset ID
export const getVariationByNMKRAssetId = query({
  args: { nmkrAssetId: v.string() },
  handler: async (ctx, args) => {
    const variation = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("nmkrAssetId", args.nmkrAssetId))
      .first();

    return variation;
  },
});

// Get supply statistics for an event
export const getSupplyStats = query({
  args: { eventId: v.id("nftEvents") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    const stats = {
      easy: variations.find((v: any) => v.difficulty === "easy"),
      medium: variations.find((v: any) => v.difficulty === "medium"),
      hard: variations.find((v: any) => v.difficulty === "hard"),
      total: {
        supplyTotal: variations.reduce((sum, v) => sum + v.supplyTotal, 0),
        supplyMinted: variations.reduce((sum, v) => sum + v.supplyMinted, 0),
        supplyRemaining: variations.reduce((sum, v) => sum + v.supplyRemaining, 0),
      },
    };

    return stats;
  },
});

// Get available variations (supply > 0)
export const getAvailableVariations = query({
  args: { eventId: v.optional(v.id("nftEvents")) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftVariations");

    if (args.eventId) {
      query = query.withIndex("", (q: any) => q.eq("eventId", args.eventId));
    }

    const allVariations = await query.collect();

    // Filter to only variations with remaining supply
    const availableVariations = allVariations.filter((v: any) => v.supplyRemaining > 0);

    return availableVariations.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Create variation
export const createVariation = mutation({
  args: {
    eventId: v.id("nftEvents"),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    nftName: v.string(),
    displayOrder: v.number(),
    supplyTotal: v.number(),
    priceAda: v.optional(v.number()),
    mainArtUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    nmkrAssetId: v.optional(v.string()),
    policyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if variation already exists for this event and difficulty
    const existing = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) =>
        q.eq("eventId", args.eventId).eq("difficulty", args.difficulty)
      )
      .first();

    if (existing) {
      throw new Error(`${args.difficulty} variation already exists for this event`);
    }

    const now = Date.now();
    const priceLovelace = args.priceAda ? args.priceAda * 1_000_000 : undefined;

    const variationId = await ctx.db.insert("nftVariations", {
      eventId: args.eventId,
      difficulty: args.difficulty,
      nftName: args.nftName,
      displayOrder: args.displayOrder,
      supplyTotal: args.supplyTotal,
      supplyMinted: 0,
      supplyRemaining: args.supplyTotal,
      supplyReserved: 0,
      priceAda: args.priceAda,
      priceLovelace,
      mainArtUrl: args.mainArtUrl,
      thumbnailUrl: args.thumbnailUrl,
      nmkrAssetId: args.nmkrAssetId,
      policyId: args.policyId,
      createdAt: now,
      updatedAt: now,
    });

    return variationId;
  },
});

// Update variation
export const updateVariation = mutation({
  args: {
    variationId: v.id("nftVariations"),
    nftName: v.optional(v.string()),
    supplyTotal: v.optional(v.number()),
    supplyReserved: v.optional(v.number()),
    priceAda: v.optional(v.number()),
    mainArtUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailSmallUrl: v.optional(v.string()),
    mainArtFormat: v.optional(v.union(
      v.literal("gif"),
      v.literal("png"),
      v.literal("jpg"),
      v.literal("webp"),
      v.literal("mp4")
    )),
    mainArtFileSize: v.optional(v.number()),
    mainArtDimensions: v.optional(v.string()),
    nmkrAssetId: v.optional(v.string()),
    nmkrTokenName: v.optional(v.string()),
    policyId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { variationId, ...updates } = args;

    const variation = await ctx.db.get(variationId);
    if (!variation) {
      throw new Error("Variation not found");
    }

    // Calculate price in lovelace if ADA price is provided
    const priceLovelace = updates.priceAda ? updates.priceAda * 1_000_000 : undefined;

    // Recalculate supply remaining if total changed
    let supplyRemaining = variation.supplyRemaining;
    if (updates.supplyTotal !== undefined) {
      supplyRemaining = updates.supplyTotal - variation.supplyMinted;
    }

    await ctx.db.patch(variationId, {
      ...updates,
      priceLovelace,
      supplyRemaining,
      updatedAt: Date.now(),
    });

    return variationId;
  },
});

// Decrement supply (called when NFT is minted)
export const decrementSupply = mutation({
  args: {
    variationId: v.id("nftVariations"),
    amount: v.optional(v.number()), // Default 1
  },
  handler: async (ctx, args) => {
    const variation = await ctx.db.get(args.variationId);
    if (!variation) {
      throw new Error("Variation not found");
    }

    const decrementAmount = args.amount ?? 1;

    if (variation.supplyRemaining < decrementAmount) {
      throw new Error("Insufficient supply remaining");
    }

    const newMinted = variation.supplyMinted + decrementAmount;
    const newRemaining = variation.supplyRemaining - decrementAmount;

    await ctx.db.patch(args.variationId, {
      supplyMinted: newMinted,
      supplyRemaining: newRemaining,
      updatedAt: Date.now(),
    });

    return { success: true, newMinted, newRemaining };
  },
});

// Increment supply (called on refund/reversal)
export const incrementSupply = mutation({
  args: {
    variationId: v.id("nftVariations"),
    amount: v.optional(v.number()), // Default 1
  },
  handler: async (ctx, args) => {
    const variation = await ctx.db.get(args.variationId);
    if (!variation) {
      throw new Error("Variation not found");
    }

    const incrementAmount = args.amount ?? 1;

    const newMinted = Math.max(0, variation.supplyMinted - incrementAmount);
    const newRemaining = Math.min(
      variation.supplyTotal,
      variation.supplyRemaining + incrementAmount
    );

    await ctx.db.patch(args.variationId, {
      supplyMinted: newMinted,
      supplyRemaining: newRemaining,
      updatedAt: Date.now(),
    });

    return { success: true, newMinted, newRemaining };
  },
});

// Bulk update all 3 variations for an event
export const updateEventVariations = mutation({
  args: {
    eventId: v.id("nftEvents"),
    variations: v.array(v.object({
      difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      nftName: v.string(),
      supplyTotal: v.number(),
      priceAda: v.optional(v.number()),
      mainArtUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const varData of args.variations) {
      // Find existing variation
      const existing = await ctx.db
        .query("nftVariations")
        .withIndex("", (q: any) =>
          q.eq("eventId", args.eventId).eq("difficulty", varData.difficulty)
        )
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          nftName: varData.nftName,
          supplyTotal: varData.supplyTotal,
          supplyRemaining: varData.supplyTotal - existing.supplyMinted,
          priceAda: varData.priceAda,
          priceLovelace: varData.priceAda ? varData.priceAda * 1_000_000 : undefined,
          mainArtUrl: varData.mainArtUrl,
          thumbnailUrl: varData.thumbnailUrl,
          updatedAt: Date.now(),
        });
        results.push({ difficulty: varData.difficulty, variationId: existing._id });
      } else {
        // Create new
        const displayOrder =
          varData.difficulty === "easy" ? 1 :
          varData.difficulty === "medium" ? 2 : 3;

        const variationId = await ctx.db.insert("nftVariations", {
          eventId: args.eventId,
          difficulty: varData.difficulty,
          nftName: varData.nftName,
          displayOrder,
          supplyTotal: varData.supplyTotal,
          supplyMinted: 0,
          supplyRemaining: varData.supplyTotal,
          supplyReserved: 0,
          priceAda: varData.priceAda,
          priceLovelace: varData.priceAda ? varData.priceAda * 1_000_000 : undefined,
          mainArtUrl: varData.mainArtUrl,
          thumbnailUrl: varData.thumbnailUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push({ difficulty: varData.difficulty, variationId });
      }
    }

    return results;
  },
});

// Delete variation
export const deleteVariation = mutation({
  args: {
    variationId: v.id("nftVariations"),
  },
  handler: async (ctx, args) => {
    const variation = await ctx.db.get(args.variationId);
    if (!variation) {
      throw new Error("Variation not found");
    }

    // Check if there are any purchases
    const purchases = await ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("variationId", args.variationId))
      .first();

    if (purchases) {
      throw new Error("Cannot delete variation with existing purchases");
    }

    await ctx.db.delete(args.variationId);

    return { success: true };
  },
});
