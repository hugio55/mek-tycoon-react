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
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("buffCategories", {
      name: args.name,
      description: args.description || "",
      category: args.category,
      unitType: args.unitType,
      applicationType: args.applicationType || "universal",
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
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
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