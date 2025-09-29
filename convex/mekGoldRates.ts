import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get current gold rate configuration (legacy name)
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    // Look for the active configuration
    const activeConfig = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (activeConfig) {
      return {
        curveType: activeConfig.curveType,
        minGold: activeConfig.minGold,
        maxGold: activeConfig.maxGold,
        steepness: activeConfig.steepness,
        midPoint: activeConfig.midPoint,
        totalMeks: activeConfig.totalMeks,
      };
    }

    // Return default configuration if no active config exists
    return {
      curveType: 'exponential' as const,
      minGold: 1.0, // 1 gold/hour for rarest
      maxGold: 100.0, // 100 gold/hour for most common
      steepness: 1.5,
      midPoint: 2000,
      totalMeks: 4000,
    };
  },
});

// Get current configuration (used by MekRateAdmin)
export const getCurrentConfig = query({
  args: {},
  handler: async (ctx) => {
    const activeConfig = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (activeConfig) {
      return {
        _id: activeConfig._id,
        curveType: activeConfig.curveType,
        minGold: activeConfig.minGold,
        maxGold: activeConfig.maxGold,
        steepness: activeConfig.steepness,
        midPoint: activeConfig.midPoint,
        totalMeks: activeConfig.totalMeks,
        rounding: activeConfig.rounding || '2decimal',
      };
    }

    // Return default if none exists
    return null;
  },
});

// Get gold rate for a specific rank
export const getGoldRateForRank = query({
  args: { rank: v.number() },
  handler: async (ctx, args) => {
    // Look for the active configuration directly
    const activeConfig = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    const config = activeConfig ? {
      curveType: activeConfig.curveType,
      minGold: activeConfig.minGold,
      maxGold: activeConfig.maxGold,
      steepness: activeConfig.steepness,
      midPoint: activeConfig.midPoint,
      totalMeks: activeConfig.totalMeks,
    } : {
      curveType: 'exponential' as const,
      minGold: 1.0,
      maxGold: 100.0,
      steepness: 1.5,
      midPoint: 2000,
      totalMeks: 4000,
    };

    const { curveType, minGold, maxGold, steepness, midPoint, totalMeks } = config;
    const normalizedRank = args.rank / totalMeks;
    let normalizedValue: number;

    switch (curveType) {
      case 'linear':
        // Linear: rank 1 gets max, rank 4000 gets min
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        // Exponential: favors top ranks more
        normalizedValue = Math.pow(1 - normalizedRank, steepness);
        break;
      case 'logarithmic':
        // Logarithmic: more even distribution
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        // S-curve with configurable midpoint
        const x = (args.rank - midPoint) / (totalMeks / 4);
        normalizedValue = 1 / (1 + Math.exp(steepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    // Scale to min-max range
    const goldRate = minGold + (normalizedValue * (maxGold - minGold));
    return { rank: args.rank, goldRate: parseFloat(goldRate.toFixed(2)) };
  },
});

// Create new save configuration
export const createSave = mutation({
  args: {
    saveName: v.string(),
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minGold: v.number(),
    maxGold: v.number(),
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
    rounding: v.optional(v.union(
      v.literal('whole'),
      v.literal('1decimal'),
      v.literal('2decimal'),
      v.literal('none')
    )),
  },
  handler: async (ctx, args) => {
    // Check if a save with this name already exists
    const existingSave = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_name", q => q.eq("saveName", args.saveName))
      .first();

    if (existingSave) {
      throw new Error(`A save with the name "${args.saveName}" already exists`);
    }

    // Clear any existing active configuration
    const currentActive = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isCurrentConfig: false });
    }

    // Create the new save and mark it as active
    const saveId = await ctx.db.insert("mekGoldRateSaves", {
      saveName: args.saveName,
      timestamp: Date.now(),
      curveType: args.curveType,
      minGold: args.minGold,
      maxGold: args.maxGold,
      steepness: args.steepness,
      midPoint: args.midPoint,
      totalMeks: args.totalMeks,
      rounding: args.rounding || '2decimal',
      isCurrentConfig: true,
    });

    return saveId;
  },
});

// Update existing save
export const updateSave = mutation({
  args: {
    saveId: v.id("mekGoldRateSaves"),
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minGold: v.number(),
    maxGold: v.number(),
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
    rounding: v.optional(v.union(
      v.literal('whole'),
      v.literal('1decimal'),
      v.literal('2decimal'),
      v.literal('none')
    )),
  },
  handler: async (ctx, args) => {
    const { saveId, ...configData } = args;

    await ctx.db.patch(saveId, {
      ...configData,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Load a saved configuration
export const loadSave = mutation({
  args: {
    saveId: v.id("mekGoldRateSaves"),
  },
  handler: async (ctx, args) => {
    // Clear any existing active configuration
    const currentActive = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (currentActive && currentActive._id !== args.saveId) {
      await ctx.db.patch(currentActive._id, { isCurrentConfig: false });
    }

    // Mark the loaded save as active
    await ctx.db.patch(args.saveId, { isCurrentConfig: true });

    const save = await ctx.db.get(args.saveId);
    return save;
  },
});

// Get all saved configurations
export const getAllSaves = query({
  args: {},
  handler: async (ctx) => {
    const saves = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    return saves;
  },
});

// Get the current active save
export const getCurrentSave = query({
  args: {},
  handler: async (ctx) => {
    const activeSave = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    return activeSave;
  },
});

// Delete a saved configuration
export const deleteSave = mutation({
  args: {
    saveId: v.id("mekGoldRateSaves"),
  },
  handler: async (ctx, args) => {
    const save = await ctx.db.get(args.saveId);

    if (!save) {
      throw new Error("Save not found");
    }

    // If this was the active config, we don't set another as active
    // Let the user explicitly choose a new active config
    await ctx.db.delete(args.saveId);

    return { success: true };
  },
});

// Save a new configuration (used by MekRateAdmin)
export const saveConfig = mutation({
  args: {
    name: v.string(),
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minGold: v.number(),
    maxGold: v.number(),
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
    rounding: v.union(
      v.literal('whole'),
      v.literal('1decimal'),
      v.literal('2decimal')
    ),
  },
  handler: async (ctx, args) => {
    // Create new save configuration
    const saveId = await ctx.db.insert("mekGoldRateSaves", {
      saveName: args.name,
      curveType: args.curveType,
      minGold: args.minGold,
      maxGold: args.maxGold,
      steepness: args.steepness,
      midPoint: args.midPoint,
      totalMeks: args.totalMeks,
      rounding: args.rounding,
      isCurrentConfig: false,
      timestamp: Date.now()
    });

    return { success: true, saveId };
  },
});

// Deploy a configuration (make it active)
export const deployConfig = mutation({
  args: {
    configId: v.optional(v.id("mekGoldRateSaves")),
  },
  handler: async (ctx, args) => {
    if (!args.configId) {
      return { success: false, error: "No configuration ID provided" };
    }

    // First, set all configs to not current
    const allConfigs = await ctx.db.query("mekGoldRateSaves").collect();
    for (const config of allConfigs) {
      if (config.isCurrentConfig) {
        await ctx.db.patch(config._id, {
          isCurrentConfig: false,
        });
      }
    }

    // Then set the selected one as current
    await ctx.db.patch(args.configId, {
      isCurrentConfig: true,
    });

    return { success: true };
  },
});