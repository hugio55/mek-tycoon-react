import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get current success rate configuration
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    // Look for the active configuration
    const activeConfig = await ctx.db
      .query("mekSuccessRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (activeConfig) {
      return {
        curveType: activeConfig.curveType,
        minSuccess: activeConfig.minSuccess,
        maxSuccess: activeConfig.maxSuccess,
        steepness: activeConfig.steepness,
        midPoint: activeConfig.midPoint,
        totalMeks: activeConfig.totalMeks,
      };
    }

    // Return default configuration if no active config exists
    return {
      curveType: 'exponential' as const,
      minSuccess: 5,
      maxSuccess: 95,
      steepness: 1.5,
      midPoint: 2000,
      totalMeks: 4000,
    };
  },
});

// Save success rate configuration
export const saveConfig = mutation({
  args: {
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minSuccess: v.number(),
    maxSuccess: v.number(),
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
  },
  handler: async (ctx, args) => {
    // In production, this would save to a database table
    // For now, just return success
    return { success: true, ...args };
  },
});

// Get success rate for a specific rank
export const getSuccessRateForRank = query({
  args: { rank: v.number() },
  handler: async (ctx, args) => {
    // Look for the active configuration directly
    const activeConfig = await ctx.db
      .query("mekSuccessRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    const config = activeConfig ? {
      curveType: activeConfig.curveType,
      minSuccess: activeConfig.minSuccess,
      maxSuccess: activeConfig.maxSuccess,
      steepness: activeConfig.steepness,
      midPoint: activeConfig.midPoint,
      totalMeks: activeConfig.totalMeks,
    } : {
      curveType: 'exponential' as const,
      minSuccess: 5,
      maxSuccess: 95,
      steepness: 1.5,
      midPoint: 2000,
      totalMeks: 4000,
    };

    const { curveType, minSuccess, maxSuccess, steepness, midPoint, totalMeks } = config;
    const normalizedRank = args.rank / totalMeks;
    let normalizedValue: number;

    switch (curveType) {
      case 'linear':
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        normalizedValue = Math.pow(1 - normalizedRank, steepness);
        break;
      case 'logarithmic':
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        const x = (args.rank - midPoint) / (totalMeks / 4);
        normalizedValue = 1 / (1 + Math.exp(steepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    const successRate = Math.round(minSuccess + (normalizedValue * (maxSuccess - minSuccess)));
    return { rank: args.rank, successRate };
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
    minSuccess: v.number(),
    maxSuccess: v.number(),
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
      .query("mekSuccessRateSaves")
      .withIndex("by_name", q => q.eq("saveName", args.saveName))
      .first();

    if (existingSave) {
      throw new Error(`A save with the name "${args.saveName}" already exists`);
    }

    // Clear any existing active configuration
    const currentActive = await ctx.db
      .query("mekSuccessRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isCurrentConfig: false });
    }

    // Create the new save and mark it as active
    const saveId = await ctx.db.insert("mekSuccessRateSaves", {
      saveName: args.saveName,
      timestamp: Date.now(),
      curveType: args.curveType,
      minSuccess: args.minSuccess,
      maxSuccess: args.maxSuccess,
      steepness: args.steepness,
      midPoint: args.midPoint,
      totalMeks: args.totalMeks,
      rounding: args.rounding || 'whole',
      isCurrentConfig: true,
    });

    return saveId;
  },
});

// Update existing save
export const updateSave = mutation({
  args: {
    saveId: v.id("mekSuccessRateSaves"),
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minSuccess: v.number(),
    maxSuccess: v.number(),
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
    saveId: v.id("mekSuccessRateSaves"),
  },
  handler: async (ctx, args) => {
    // Clear any existing active configuration
    const currentActive = await ctx.db
      .query("mekSuccessRateSaves")
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
      .query("mekSuccessRateSaves")
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
      .query("mekSuccessRateSaves")
      .withIndex("by_current", q => q.eq("isCurrentConfig", true))
      .first();

    return activeSave;
  },
});

// Delete a saved configuration
export const deleteSave = mutation({
  args: {
    saveId: v.id("mekSuccessRateSaves"),
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