import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all buff categories
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buffCategories").collect();
  },
});

// Create a new buff category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("gold"),
      v.literal("essence"),
      v.literal("rarity_bias"),
      v.literal("xp"),
      v.literal("mek_slot"),
      v.literal("market"),
      v.literal("reward_chance")
    ),
    unitType: v.union(
      v.literal("flat_number"),
      v.literal("rate_change"),
      v.literal("rate_percentage"),
      v.literal("flat_percentage")
    ),
    applicationType: v.optional(v.union(
      v.literal("universal"),
      v.literal("attachable")
    )),
    tierStart: v.optional(v.number()),
    tierEnd: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate tier range if provided
    if (args.tierStart !== undefined && args.tierEnd !== undefined) {
      if (args.tierStart < 1 || args.tierStart > 10 || args.tierEnd < 1 || args.tierEnd > 10) {
        throw new Error("Tier values must be between 1 and 10");
      }
      if (args.tierStart > args.tierEnd) {
        throw new Error("Tier start must be less than or equal to tier end");
      }
    }

    return await ctx.db.insert("buffCategories", {
      name: args.name,
      description: args.description || "",
      category: args.category,
      unitType: args.unitType,
      applicationType: args.applicationType || "universal",
      tierStart: args.tierStart,
      tierEnd: args.tierEnd,
      isActive: args.isActive !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a buff category
export const update = mutation({
  args: {
    id: v.id("buffCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("gold"),
      v.literal("essence"),
      v.literal("rarity_bias"),
      v.literal("xp"),
      v.literal("mek_slot"),
      v.literal("market"),
      v.literal("reward_chance")
    )),
    unitType: v.optional(v.union(
      v.literal("flat_number"),
      v.literal("rate_change"),
      v.literal("rate_percentage"),
      v.literal("flat_percentage")
    )),
    applicationType: v.optional(v.union(
      v.literal("universal"),
      v.literal("attachable")
    )),
    tierStart: v.optional(v.number()),
    tierEnd: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate tier range if provided
    if (updates.tierStart !== undefined && updates.tierEnd !== undefined) {
      if (updates.tierStart < 1 || updates.tierStart > 10 || updates.tierEnd < 1 || updates.tierEnd > 10) {
        throw new Error("Tier values must be between 1 and 10");
      }
      if (updates.tierStart > updates.tierEnd) {
        throw new Error("Tier start must be less than or equal to tier end");
      }
    }
    
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a buff category
export const remove = mutation({
  args: {
    id: v.id("buffCategories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Clear all buff categories
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allCategories = await ctx.db.query("buffCategories").collect();
    for (const category of allCategories) {
      await ctx.db.delete(category._id);
    }
    return { deleted: allCategories.length };
  },
});