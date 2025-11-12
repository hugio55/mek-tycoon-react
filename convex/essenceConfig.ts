/**
 * ESSENCE CONFIGURATION - Admin Management
 *
 * Provides admin interface for configuring the essence system,
 * including base rates and buff categories.
 *
 * USAGE:
 * - Query: getBaseEssenceRate() - Get current base essence per hour rate
 * - Update: setBaseEssenceRate({ baseRate: 10 }) - Update base rate
 * - Initialize: initializeDefaultEssenceConfig() - Seed defaults
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES: Record<
  string,
  {
    type: "number" | "string" | "boolean";
    min?: number;
    max?: number;
    description: string;
  }
> = {
  baseEssencePerHour: {
    type: "number",
    min: 1,
    max: 10000,
    description: "Base essence generation rate per hour (1 to 10000)",
  },
  // Add more config keys here as system grows
};

function validateConfigValue(key: string, value: number | string | boolean): void {
  const rules = VALIDATION_RULES[key];
  if (!rules) {
    // Unknown keys are allowed but not validated
    return;
  }

  // Type check
  if (typeof value !== rules.type) {
    throw new Error(
      `Invalid type for '${key}': expected ${rules.type}, got ${typeof value}`
    );
  }

  // Range validation for numbers
  if (rules.type === "number" && typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      throw new Error(
        `Value ${value} is below minimum ${rules.min} for '${key}'`
      );
    }
    if (rules.max !== undefined && value > rules.max) {
      throw new Error(
        `Value ${value} exceeds maximum ${rules.max} for '${key}'`
      );
    }
  }
}

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
      .query("essenceConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return config;
  },
});

/**
 * Get all essence config values
 */
export const getAllConfigs = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("essenceConfig").collect();
    return configs;
  },
});

/**
 * Get base essence per hour rate (defaults to 10 if not set)
 */
export const getBaseEssenceRate = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseEssencePerHour"))
      .first();

    if (!config) {
      return {
        baseEssencePerHour: 10,
        description: "Default base rate: 10 essence/hour"
      };
    }

    return {
      baseEssencePerHour: typeof config.value === "number" ? config.value : 10,
      description: config.description || "Base essence generation rate per hour",
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set or update a config value (with validation)
 */
export const setConfig = mutation({
  args: {
    key: v.string(),
    value: v.union(v.number(), v.string(), v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate value against rules
    validateConfigValue(args.key, args.value);

    const now = Date.now();

    // Check if config exists
    const existing = await ctx.db
      .query("essenceConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description || existing.description,
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
      const configId = await ctx.db.insert("essenceConfig", {
        key: args.key,
        value: args.value,
        description: args.description || VALIDATION_RULES[args.key]?.description || `Config for ${args.key}`,
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
 * Set base essence per hour rate (helper with enhanced validation)
 */
export const setBaseEssenceRate = mutation({
  args: {
    baseEssencePerHour: v.number(),
  },
  handler: async (ctx, args) => {
    // Validation is handled by setConfig via validateConfigValue
    const result = await ctx.runMutation((api as any).essenceConfig.setConfig, {
      key: "baseEssencePerHour",
      value: args.baseEssencePerHour,
      description: `Base essence generation rate: ${args.baseEssencePerHour} essence per hour`,
    });

    return result;
  },
});

/**
 * Delete a config value (admin only - use with caution)
 */
export const deleteConfig = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("essenceConfig")
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

/**
 * Initialize default essence config values (run once to seed database)
 * Safely creates default configs without overwriting existing values
 */
export const initializeDefaultEssenceConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = [];

    // Initialize baseEssencePerHour config if it doesn't exist
    const existing = await ctx.db
      .query("essenceConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseEssencePerHour"))
      .first();

    if (existing) {
      results.push({
        key: "baseEssencePerHour",
        action: "already_exists",
        value: existing.value
      });
    } else {
      // Create default baseEssencePerHour config
      await ctx.db.insert("essenceConfig", {
        key: "baseEssencePerHour",
        value: 10, // Default: 10 essence per hour
        description: VALIDATION_RULES["baseEssencePerHour"].description,
        createdAt: now,
        updatedAt: now,
      });

      results.push({
        key: "baseEssencePerHour",
        action: "created",
        value: 10
      });
    }

    return {
      success: true,
      message: `Initialized ${results.filter((r) => r.action === "created").length} essence configs`,
      results,
    };
  },
});
