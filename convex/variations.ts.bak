import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all variations from variationsReference
export const getAllVariations = query({
  handler: async (ctx) => {
    const variations = await ctx.db
      .query("variationsReference")
      .collect();

    return variations;
  },
});

// Get variations by type
export const getVariationsByType = query({
  args: { type: v.union(v.literal("head"), v.literal("body"), v.literal("item")) },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("variationsReference")
      .withIndex("", (q: any) => q.eq("type", args.type))
      .collect();

    return variations;
  },
});

// Get variation by ID
export const getVariationById = query({
  args: { variationId: v.number() },
  handler: async (ctx, args) => {
    const variation = await ctx.db
      .query("variationsReference")
      .withIndex("", (q: any) => q.eq("variationId", args.variationId))
      .first();

    return variation;
  },
});
