import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { VARIATIONS_BY_TYPE } from "../src/lib/completeVariationRarity";

// Note: VARIATIONS_BY_TYPE data comes from lib/completeVariationRarity.ts
// This is the single source of truth for all variation data (291 total variations)

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
      ...VARIATIONS_BY_TYPE.heads,
      ...VARIATIONS_BY_TYPE.bodies,
      ...VARIATIONS_BY_TYPE.traits
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
      heads: VARIATIONS_BY_TYPE.heads.length,
      bodies: VARIATIONS_BY_TYPE.bodies.length,
      items: VARIATIONS_BY_TYPE.traits.length,
    };
  },
});

// Query to get variation by ID
export const getVariationById = query({
  args: { variationId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variationsReference")
      .filter((q: any) => q.eq(q.field("variationId"), args.variationId))
      .first();
  },
});

// Query to get all variations by type
export const getVariationsByType = query({
  args: { type: v.union(v.literal("head"), v.literal("body"), v.literal("item")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variationsReference")
      .filter((q: any) => q.eq(q.field("type"), args.type))
      .collect();
  },
});