import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ALL_VARIATIONS } from "../src/lib/variationsReferenceData";

// Note: ALL_VARIATIONS data has been moved to lib/variationsReferenceData.ts
// This keeps the data separate from Convex backend functions to prevent import errors

// Mutation to seed variations reference table
export const seedVariationsReference = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("variationsReference").first();
    if (existing) {
      return { message: "Variations reference already exists" };
    }

    // Insert all variations
    const allVariations = [
      ...ALL_VARIATIONS.heads,
      ...ALL_VARIATIONS.bodies,
      ...ALL_VARIATIONS.items
    ];

    for (const variation of allVariations) {
      await ctx.db.insert("variationsReference", {
        variationId: variation.id,
        name: variation.name,
        type: variation.type as "head" | "body" | "item",
        baseXp: 100, // Default XP value
      });
    }

    return {
      message: `Seeded ${allVariations.length} variations`,
      heads: ALL_VARIATIONS.heads.length,
      bodies: ALL_VARIATIONS.bodies.length,
      items: ALL_VARIATIONS.items.length,
    };
  },
});

// Query to get variation by ID
export const getVariationById = query({
  args: { variationId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variationsReference")
      .filter(q => q.eq(q.field("variationId"), args.variationId))
      .first();
  },
});

// Query to get all variations by type
export const getVariationsByType = query({
  args: { type: v.union(v.literal("head"), v.literal("body"), v.literal("item")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variationsReference")
      .filter(q => q.eq(q.field("type"), args.type))
      .collect();
  },
});