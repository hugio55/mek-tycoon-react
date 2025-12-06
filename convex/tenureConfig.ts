/**
 * TENURE CONFIGURATION - Admin Management
 *
 * Provides admin interface for configuring the tenure system,
 * including base rates and buff categories.
 *
 * USAGE:
 * - Query: getBaseRate() - Get current base rate with fallback
 * - Update: setBaseRate({ baseRate: 1.5 }) - Update base rate with validation
 * - Initialize: initializeDefaultConfig() - Seed default base rate
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
  baseRate: {
    type: "number",
    min: 0.1,
    max: 10.0,
    description: "Base tenure accumulation rate per second (0.1 to 10.0)",
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
      .query("tenureConfig")
      .withIndex("", (q: any) => q.eq("key", args.key))
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
      .withIndex("", (q: any) => q.eq("key", "baseRate"))
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
      .query("tenureConfig")
      .withIndex("", (q: any) => q.eq("key", args.key))
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
      const configId = await ctx.db.insert("tenureConfig", {
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
 * Set tenure base rate (helper with enhanced validation)
 */
export const setBaseRate = mutation({
  args: {
    baseRate: v.number(),
  },
  handler: async (ctx, args) => {
    // Validation is handled by setConfig via validateConfigValue
    const result = await ctx.runMutation((api as any).tenureConfig.setConfig, {
      key: "baseRate",
      value: args.baseRate,
      description: `Base tenure accumulation rate: ${args.baseRate} tenure per second`,
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
      .query("tenureConfig")
      .withIndex("", (q: any) => q.eq("key", args.key))
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
 * Initialize default config values (run once to seed database)
 * Safely creates default configs without overwriting existing values
 */
export const initializeDefaultConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = [];

    // Initialize baseRate config if it doesn't exist
    const existing = await ctx.db
      .query("tenureConfig")
      .withIndex("", (q: any) => q.eq("key", "baseRate"))
      .first();

    if (existing) {
      results.push({
        key: "baseRate",
        action: "already_exists",
        value: existing.value
      });
    } else {
      // Create default baseRate config
      await ctx.db.insert("tenureConfig", {
        key: "baseRate",
        value: 1.0, // Default: 1 tenure per second
        description: VALIDATION_RULES["baseRate"].description,
        createdAt: now,
        updatedAt: now,
      });

      results.push({
        key: "baseRate",
        action: "created",
        value: 1.0
      });
    }

    return {
      success: true,
      message: `Initialized ${results.filter((r) => r.action === "created").length} tenure configs`,
      results,
    };
  },
});
