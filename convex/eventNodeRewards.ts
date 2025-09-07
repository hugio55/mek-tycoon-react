import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save event node configuration
export const saveConfiguration = mutation({
  args: {
    name: v.string(),
    data: v.string(), // JSON string of the configuration
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "anonymous";

    const configId = await ctx.db.insert("eventNodeConfigs", {
      userId,
      name: args.name,
      data: args.data,
      timestamp: args.timestamp,
      createdAt: Date.now(),
    });

    return configId;
  },
});

// Get all saved configurations for the current user
export const getConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "anonymous";

    const configs = await ctx.db
      .query("eventNodeConfigs")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    return configs;
  },
});

// Load a specific configuration
export const loadConfiguration = query({
  args: {
    configId: v.id("eventNodeConfigs"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    return config;
  },
});

// Delete a configuration
export const deleteConfiguration = mutation({
  args: {
    configId: v.id("eventNodeConfigs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
    return { success: true };
  },
});