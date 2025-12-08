import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all slot configurations ordered by creation date (newest first)
 */
export const listSlotConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("slotConfigurations")
      .withIndex("by_created")
      .order("desc")
      .collect();

    return configs;
  },
});

/**
 * Get the currently active slot configuration
 * Used by the website to determine which slot costs to use
 */
export const getActiveSlotConfiguration = query({
  args: {},
  handler: async (ctx) => {
    const activeConfig = await ctx.db
      .query("slotConfigurations")
      .withIndex("", (q: any) => q.eq("isActive", true))
      .first();

    return activeConfig || null;
  },
});

/**
 * Get a specific slot configuration by ID
 */
export const getSlotConfiguration = query({
  args: {
    configId: v.id("slotConfigurations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Save a new slot configuration
 * Validates data and creates new configuration with isActive=false by default
 */
export const saveSlotConfiguration = mutation({
  args: {
    name: v.string(),
    basicSlot: v.array(v.number()),
    advancedSlot: v.array(v.number()),
    masterSlot: v.array(v.number()),
    curveFactor: v.number(),
    roundingOption: v.number(),
  },
  handler: async (ctx, args) => {
    // Validation: Array lengths must be exactly 9
    if (args.basicSlot.length !== 9) {
      throw new Error(`basicSlot must have exactly 9 values, got ${args.basicSlot.length}`);
    }
    if (args.advancedSlot.length !== 9) {
      throw new Error(`advancedSlot must have exactly 9 values, got ${args.advancedSlot.length}`);
    }
    if (args.masterSlot.length !== 9) {
      throw new Error(`masterSlot must have exactly 9 values, got ${args.masterSlot.length}`);
    }

    // Validation: Curve factor must be in range 0.5-3.0
    if (args.curveFactor < 0.5 || args.curveFactor > 3.0) {
      throw new Error(`curveFactor must be between 0.5 and 3.0, got ${args.curveFactor}`);
    }

    // Validation: Rounding option must be 10, 100, or 1000
    if (![10, 100, 1000].includes(args.roundingOption)) {
      throw new Error(`roundingOption must be 10, 100, or 1000, got ${args.roundingOption}`);
    }

    // Validation: All tenure values must be non-negative
    const allValues = [...args.basicSlot, ...args.advancedSlot, ...args.masterSlot];
    if (allValues.some((val: any) => val < 0)) {
      throw new Error("All tenure values must be non-negative");
    }

    // Validation: Name must not be empty
    if (!args.name.trim()) {
      throw new Error("Configuration name cannot be empty");
    }

    const now = Date.now();

    // Create new configuration (isActive defaults to false)
    const configId = await ctx.db.insert("slotConfigurations", {
      name: args.name.trim(),
      basicSlot: args.basicSlot,
      advancedSlot: args.advancedSlot,
      masterSlot: args.masterSlot,
      curveFactor: args.curveFactor,
      roundingOption: args.roundingOption,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      configId,
      message: `Configuration "${args.name}" saved successfully`,
    };
  },
});

/**
 * Load a slot configuration (set as active)
 * Sets specified config as active and all others to inactive
 */
export const loadSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
  },
  handler: async (ctx, args) => {
    // Verify the configuration exists
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Set all other configurations to inactive
    const allConfigs = await ctx.db.query("slotConfigurations").collect();
    for (const otherConfig of allConfigs) {
      if (otherConfig._id !== args.configId && otherConfig.isActive) {
        await ctx.db.patch(otherConfig._id, {
          isActive: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Set this configuration as active
    await ctx.db.patch(args.configId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      config: await ctx.db.get(args.configId),
      message: `Configuration "${config.name}" is now active`,
    };
  },
});

/**
 * Delete a slot configuration
 * If deleted config was active, optionally sets another as active
 */
export const deleteSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
    setOtherActive: v.optional(v.boolean()), // If true, sets the most recent other config as active
  },
  handler: async (ctx, args) => {
    // Verify the configuration exists
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Configuration not found");
    }

    const wasActive = config.isActive;
    const configName = config.name;

    // Delete the configuration
    await ctx.db.delete(args.configId);

    // If it was active and user requested, set another as active
    if (wasActive && args.setOtherActive) {
      const remainingConfigs = await ctx.db
        .query("slotConfigurations")
        .withIndex("by_created")
        .order("desc")
        .first();

      if (remainingConfigs) {
        await ctx.db.patch(remainingConfigs._id, {
          isActive: true,
          updatedAt: Date.now(),
        });

        return {
          success: true,
          message: `Configuration "${configName}" deleted. "${remainingConfigs.name}" is now active.`,
          newActiveConfig: remainingConfigs,
        };
      }
    }

    return {
      success: true,
      message: `Configuration "${configName}" deleted successfully`,
      newActiveConfig: null,
    };
  },
});

/**
 * Update an existing slot configuration
 * Can update name and/or values
 */
export const updateSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
    name: v.optional(v.string()),
    basicSlot: v.optional(v.array(v.number())),
    advancedSlot: v.optional(v.array(v.number())),
    masterSlot: v.optional(v.array(v.number())),
    curveFactor: v.optional(v.number()),
    roundingOption: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify the configuration exists
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Build update object with validations
    const updates: any = {
      updatedAt: Date.now(),
    };

    // Validate and add name if provided
    if (args.name !== undefined) {
      if (!args.name.trim()) {
        throw new Error("Configuration name cannot be empty");
      }
      updates.name = args.name.trim();
    }

    // Validate and add basicSlot if provided
    if (args.basicSlot !== undefined) {
      if (args.basicSlot.length !== 9) {
        throw new Error(`basicSlot must have exactly 9 values, got ${args.basicSlot.length}`);
      }
      if (args.basicSlot.some((val: any) => val < 0)) {
        throw new Error("All basicSlot values must be non-negative");
      }
      updates.basicSlot = args.basicSlot;
    }

    // Validate and add advancedSlot if provided
    if (args.advancedSlot !== undefined) {
      if (args.advancedSlot.length !== 9) {
        throw new Error(`advancedSlot must have exactly 9 values, got ${args.advancedSlot.length}`);
      }
      if (args.advancedSlot.some((val: any) => val < 0)) {
        throw new Error("All advancedSlot values must be non-negative");
      }
      updates.advancedSlot = args.advancedSlot;
    }

    // Validate and add masterSlot if provided
    if (args.masterSlot !== undefined) {
      if (args.masterSlot.length !== 9) {
        throw new Error(`masterSlot must have exactly 9 values, got ${args.masterSlot.length}`);
      }
      if (args.masterSlot.some((val: any) => val < 0)) {
        throw new Error("All masterSlot values must be non-negative");
      }
      updates.masterSlot = args.masterSlot;
    }

    // Validate and add curveFactor if provided
    if (args.curveFactor !== undefined) {
      if (args.curveFactor < 0.5 || args.curveFactor > 3.0) {
        throw new Error(`curveFactor must be between 0.5 and 3.0, got ${args.curveFactor}`);
      }
      updates.curveFactor = args.curveFactor;
    }

    // Validate and add roundingOption if provided
    if (args.roundingOption !== undefined) {
      if (![10, 100, 1000].includes(args.roundingOption)) {
        throw new Error(`roundingOption must be 10, 100, or 1000, got ${args.roundingOption}`);
      }
      updates.roundingOption = args.roundingOption;
    }

    // Apply the update
    await ctx.db.patch(args.configId, updates);

    return {
      success: true,
      config: await ctx.db.get(args.configId),
      message: `Configuration updated successfully`,
    };
  },
});

/**
 * Utility: Count total configurations
 */
export const countSlotConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("slotConfigurations").collect();
    const activeCount = configs.filter((c: any) => c.isActive).length;

    return {
      total: configs.length,
      active: activeCount,
    };
  },
});
