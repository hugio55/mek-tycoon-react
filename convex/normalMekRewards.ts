import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a normal mek reward configuration
export const saveConfiguration = mutation({
  args: {
    name: v.string(),
    data: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if configuration with same name exists
    const existing = await ctx.db
      .query("normalMekRewardConfigs")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      // Update existing configuration
      await ctx.db.patch(existing._id, {
        data: args.data,
        timestamp: args.timestamp,
      });
      return { success: true, updated: true };
    } else {
      // Create new configuration
      await ctx.db.insert("normalMekRewardConfigs", {
        name: args.name,
        data: args.data,
        timestamp: args.timestamp,
      });
      return { success: true, updated: false };
    }
  },
});

// Get all saved configurations
export const getConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("normalMekRewardConfigs")
      .order("desc")
      .collect();
    return configs;
  },
});

// Load a specific configuration
export const loadConfiguration = query({
  args: {
    configId: v.id("normalMekRewardConfigs"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    return config;
  },
});

// Delete a configuration
export const deleteConfiguration = mutation({
  args: {
    configId: v.id("normalMekRewardConfigs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
    return { success: true };
  },
});