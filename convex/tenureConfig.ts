import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the base rate config
export const getBaseRate = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseRate"))
      .first();

    return config;
  },
});

// Set the base rate config
export const setBaseRate = mutation({
  args: {
    value: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { value, description } = args;
    const now = Date.now();

    // Check if config exists
    const existing = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseRate"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        description: description ?? existing.description,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      const id = await ctx.db.insert("tenureConfig", {
        key: "baseRate",
        value,
        description: description ?? "Base tenure rate",
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

// Generic getter for any config key
export const getConfig = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return config;
  },
});

// Generic setter for any config key
export const setConfig = mutation({
  args: {
    key: v.string(),
    value: v.union(v.number(), v.string(), v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { key, value, description } = args;
    const now = Date.now();

    const existing = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        description: description ?? existing.description,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      const id = await ctx.db.insert("tenureConfig", {
        key,
        value,
        description,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

// List all config values
export const listConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tenureConfig").collect();
  },
});
