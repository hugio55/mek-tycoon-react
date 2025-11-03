/**
 * GLOBAL CONFIGURATION SYSTEM
 *
 * Centralized key-value store for system-wide settings.
 * Uses singleton pattern - each config key has exactly one record.
 *
 * USAGE:
 * - Query: getConfigValue({ key: "tenure_base_rate" })
 * - Update: updateConfigValue({ key: "tenure_base_rate", value: 1.5 })
 * - Initialize: initializeDefaultConfigs() - run once to seed defaults
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single config value by key
 */
export const getConfigValue = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("globalConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!config) {
      return null;
    }

    return {
      key: config.key,
      value: config.value,
      valueType: config.valueType,
      description: config.description,
      defaultValue: config.defaultValue,
      minValue: config.minValue,
      maxValue: config.maxValue,
      updatedAt: config.updatedAt,
    };
  },
});

/**
 * Get all configs (optionally filtered by category)
 */
export const getAllConfigs = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let configs;

    if (args.category) {
      configs = await ctx.db
        .query("globalConfig")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else {
      configs = await ctx.db.query("globalConfig").collect();
    }

    return configs.map((c) => ({
      key: c.key,
      value: c.value,
      valueType: c.valueType,
      description: c.description,
      defaultValue: c.defaultValue,
      minValue: c.minValue,
      maxValue: c.maxValue,
      category: c.category,
      isEditable: c.isEditable,
      updatedAt: c.updatedAt,
    }));
  },
});

/**
 * Get configs by category
 */
export const getConfigsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("globalConfig")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();

    return configs.map((c) => ({
      key: c.key,
      value: c.value,
      valueType: c.valueType,
      description: c.description,
      defaultValue: c.defaultValue,
      minValue: c.minValue,
      maxValue: c.maxValue,
      isEditable: c.isEditable,
      updatedAt: c.updatedAt,
    }));
  },
});

/**
 * Get tenure base rate (convenience helper)
 */
export const getTenureBaseRate = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("globalConfig")
      .withIndex("by_key", (q) => q.eq("key", "tenure_base_rate"))
      .first();

    // Return value or default fallback
    return config ? (config.value as number) : 1.0;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update a config value (with validation)
 */
export const updateConfigValue = mutation({
  args: {
    key: v.string(),
    value: v.union(v.number(), v.string(), v.boolean()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("globalConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!config) {
      throw new Error(`Config key '${args.key}' not found`);
    }

    if (!config.isEditable) {
      throw new Error(`Config key '${args.key}' is not editable`);
    }

    // Type validation
    if (typeof args.value !== config.valueType) {
      throw new Error(
        `Invalid type for '${args.key}': expected ${config.valueType}, got ${typeof args.value}`
      );
    }

    // Range validation for numbers
    if (config.valueType === "number" && typeof args.value === "number") {
      if (config.minValue !== undefined && args.value < config.minValue) {
        throw new Error(
          `Value ${args.value} is below minimum ${config.minValue} for '${args.key}'`
        );
      }
      if (config.maxValue !== undefined && args.value > config.maxValue) {
        throw new Error(
          `Value ${args.value} exceeds maximum ${config.maxValue} for '${args.key}'`
        );
      }
    }

    // Update config
    await ctx.db.patch(config._id, {
      value: args.value,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Config '${args.key}' updated to ${args.value}`,
      key: args.key,
      newValue: args.value,
    };
  },
});

/**
 * Update tenure base rate (convenience helper)
 */
export const updateTenureBaseRate = mutation({
  args: {
    ratePerSecond: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      (api as any).globalConfig.updateConfigValue,
      {
        key: "tenure_base_rate",
        value: args.ratePerSecond,
      }
    );

    return result;
  },
});

/**
 * Reset a config to its default value
 */
export const resetConfigToDefault = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("globalConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!config) {
      throw new Error(`Config key '${args.key}' not found`);
    }

    if (!config.isEditable) {
      throw new Error(`Config key '${args.key}' is not editable`);
    }

    await ctx.db.patch(config._id, {
      value: config.defaultValue,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Config '${args.key}' reset to default value ${config.defaultValue}`,
      key: args.key,
      defaultValue: config.defaultValue,
    };
  },
});

/**
 * Initialize default config values (run once during setup)
 */
export const initializeDefaultConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Define all default configs
    const defaultConfigs = [
      {
        key: "tenure_base_rate",
        value: 1.0,
        valueType: "number" as const,
        description: "Base tenure accumulation rate per second for all Meks",
        defaultValue: 1.0,
        minValue: 0.1,
        maxValue: 10.0,
        category: "tenure",
        isEditable: true,
      },
      // Add more configs here as needed
      // Example:
      // {
      //   key: "gold_base_rate",
      //   value: 1.0,
      //   valueType: "number" as const,
      //   description: "Base gold generation rate per second",
      //   defaultValue: 1.0,
      //   minValue: 0.1,
      //   maxValue: 100.0,
      //   category: "economy",
      //   isEditable: true,
      // },
    ];

    const results = [];

    for (const config of defaultConfigs) {
      // Check if config already exists
      const existing = await ctx.db
        .query("globalConfig")
        .withIndex("by_key", (q) => q.eq("key", config.key))
        .first();

      if (existing) {
        results.push({ key: config.key, action: "already_exists" });
        continue;
      }

      // Create new config
      await ctx.db.insert("globalConfig", {
        ...config,
        createdAt: now,
        updatedAt: now,
      });

      results.push({ key: config.key, action: "created" });
    }

    return {
      success: true,
      message: `Initialized ${results.filter((r) => r.action === "created").length} configs`,
      results,
    };
  },
});

/**
 * Delete a config (admin only, dangerous!)
 */
export const deleteConfig = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("globalConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!config) {
      throw new Error(`Config key '${args.key}' not found`);
    }

    await ctx.db.delete(config._id);

    return {
      success: true,
      message: `Config '${args.key}' deleted`,
    };
  },
});
