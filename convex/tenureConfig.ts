/**
 * TENURE CONFIGURATION - Admin Management
 *
 * Provides admin interface for configuring the tenure system,
 * including base rates and buff categories.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a specific config value by key
 */
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

/**
 * Get all config values
 */
export const getAllConfigs = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("tenureConfig").collect();
    return configs;
  },
});

/**
 * Get tenure base rate (defaults to 1 if not set)
 */
export const getBaseRate = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseRate"))
      .first();

    if (!config) {
      return { baseRate: 1, description: "Default base rate: 1 tenure/second" };
    }

    return {
      baseRate: typeof config.value === "number" ? config.value : 1,
      description: config.description || "Base tenure accumulation rate per second",
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set or update a config value
 */
export const setConfig = mutation({
  args: {
    key: v.string(),
    value: v.union(v.number(), v.string(), v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if config exists
    const existing = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Config "${args.key}" updated successfully`,
        configId: existing._id,
        previousValue: existing.value,
        newValue: args.value,
      };
    } else {
      // Create new
      const configId = await ctx.db.insert("tenureConfig", {
        key: args.key,
        value: args.value,
        description: args.description,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Config "${args.key}" created successfully`,
        configId,
        newValue: args.value,
      };
    }
  },
});

/**
 * Set tenure base rate (helper for common operation)
 */
export const setBaseRate = mutation({
  args: {
    baseRate: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate base rate
    if (args.baseRate <= 0) {
      return {
        success: false,
        message: "Base rate must be greater than 0",
      };
    }

    const result = await setConfig(ctx, {
      key: "baseRate",
      value: args.baseRate,
      description: `Base tenure accumulation rate: ${args.baseRate} tenure per second`,
    });

    return result;
  },
});

/**
 * Delete a config value
 */
export const deleteConfig = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("tenureConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!config) {
      return {
        success: false,
        message: `Config "${args.key}" not found`,
      };
    }

    await ctx.db.delete(config._id);

    return {
      success: true,
      message: `Config "${args.key}" deleted successfully`,
    };
  },
});
