import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all difficulty configurations
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("difficultyConfigs").collect();
  },
});

// Get a specific difficulty configuration
export const getByDifficulty = query({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("difficultyConfigs")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .first();
  },
});

// Create or update difficulty configuration
export const upsert = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    successGreenLine: v.number(),
    goldMultiplier: v.number(),
    xpMultiplier: v.number(),
    essenceAmountMultiplier: v.number(),
    minSlots: v.number(),
    maxSlots: v.number(),
    singleSlotChance: v.number(),
    deploymentFeeMultiplier: v.number(),
    commonEssenceBoost: v.number(),
    rareEssencePenalty: v.number(),
    overshootBonusRate: v.number(),
    maxOvershootBonus: v.number(),
    colorTheme: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if configuration already exists
    const existing = await ctx.db
      .query("difficultyConfigs")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .first();

    const data = {
      ...args,
      isActive: args.isActive !== false,
      updatedAt: Date.now(),
    };

    if (existing) {
      // Update existing configuration
      return await ctx.db.patch(existing._id, data);
    } else {
      // Create new configuration
      return await ctx.db.insert("difficultyConfigs", {
        ...data,
        createdAt: Date.now(),
      });
    }
  },
});

// Initialize default difficulty configurations
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const defaults = [
      {
        difficulty: "easy" as const,
        successGreenLine: 5,
        goldMultiplier: 0.6,
        xpMultiplier: 0.5,
        essenceAmountMultiplier: 1.0,
        minSlots: 1,
        maxSlots: 2,
        singleSlotChance: 75,
        deploymentFeeMultiplier: 0.5,
        commonEssenceBoost: 15,
        rareEssencePenalty: -66,
        overshootBonusRate: 0.5,
        maxOvershootBonus: 50,
        colorTheme: "green",
        displayName: "EASY",
        description: "Lower risk, guaranteed success at 5%, fewer slots, reduced rewards",
        isActive: true,
      },
      {
        difficulty: "medium" as const,
        successGreenLine: 30,
        goldMultiplier: 1.0,
        xpMultiplier: 1.0,
        essenceAmountMultiplier: 1.2,
        minSlots: 3,
        maxSlots: 6,
        singleSlotChance: 0,
        deploymentFeeMultiplier: 1.0,
        commonEssenceBoost: 0,
        rareEssencePenalty: 0,
        overshootBonusRate: 1.0,
        maxOvershootBonus: 100,
        colorTheme: "yellow",
        displayName: "MEDIUM",
        description: "Balanced risk and reward, success at 30%, standard slot count",
        isActive: true,
      },
      {
        difficulty: "hard" as const,
        successGreenLine: 75,
        goldMultiplier: 2.5,
        xpMultiplier: 3.0,
        essenceAmountMultiplier: 1.5,
        minSlots: 7,
        maxSlots: 8,
        singleSlotChance: 0,
        deploymentFeeMultiplier: 2.0,
        commonEssenceBoost: -20,
        rareEssencePenalty: 100,
        overshootBonusRate: 2.0,
        maxOvershootBonus: 200,
        colorTheme: "red",
        displayName: "HARD",
        description: "High risk, massive rewards, success at 75%, maximum slots",
        isActive: true,
      },
    ];

    let created = 0;

    for (const config of defaults) {
      // Check if this difficulty already exists
      const existing = await ctx.db
        .query("difficultyConfigs")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", config.difficulty))
        .first();

      if (!existing) {
        await ctx.db.insert("difficultyConfigs", {
          ...config,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return {
      success: true,
      message: `Initialized ${created} difficulty configurations`,
      created,
    };
  },
});

// Update a specific field for a difficulty
export const updateField = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("difficultyConfigs")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .first();

    if (!config) {
      throw new Error(`Difficulty configuration for ${args.difficulty} not found`);
    }

    return await ctx.db.patch(config._id, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    });
  },
});

// Delete a difficulty configuration
export const remove = mutation({
  args: {
    id: v.id("difficultyConfigs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Reset to default configurations
export const resetToDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing configurations
    const existing = await ctx.db.query("difficultyConfigs").collect();
    for (const config of existing) {
      await ctx.db.delete(config._id);
    }

    // Re-initialize defaults by inserting them directly
    const defaults = [
      {
        difficulty: "easy" as const,
        successGreenLine: 5,
        goldMultiplier: 0.6,
        xpMultiplier: 0.5,
        essenceAmountMultiplier: 1.0,
        minSlots: 1,
        maxSlots: 2,
        singleSlotChance: 75,
        deploymentFeeMultiplier: 0.5,
        commonEssenceBoost: 15,
        rareEssencePenalty: -66,
        overshootBonusRate: 0.5,
        maxOvershootBonus: 50,
        colorTheme: "green",
        displayName: "EASY",
        description: "Lower risk, guaranteed success at 5%, fewer slots, reduced rewards",
        isActive: true,
      },
      {
        difficulty: "medium" as const,
        successGreenLine: 30,
        goldMultiplier: 1.0,
        xpMultiplier: 1.0,
        essenceAmountMultiplier: 1.2,
        minSlots: 3,
        maxSlots: 6,
        singleSlotChance: 0,
        deploymentFeeMultiplier: 1.0,
        commonEssenceBoost: 0,
        rareEssencePenalty: 0,
        overshootBonusRate: 1.0,
        maxOvershootBonus: 100,
        colorTheme: "yellow",
        displayName: "MEDIUM",
        description: "Balanced risk and reward, success at 30%, standard slot count",
        isActive: true,
      },
      {
        difficulty: "hard" as const,
        successGreenLine: 75,
        goldMultiplier: 2.5,
        xpMultiplier: 3.0,
        essenceAmountMultiplier: 1.5,
        minSlots: 7,
        maxSlots: 8,
        singleSlotChance: 0,
        deploymentFeeMultiplier: 2.0,
        commonEssenceBoost: -20,
        rareEssencePenalty: 100,
        overshootBonusRate: 2.0,
        maxOvershootBonus: 200,
        colorTheme: "red",
        displayName: "HARD",
        description: "High risk, massive rewards, success at 75%, maximum slots",
        isActive: true,
      },
    ];

    for (const config of defaults) {
      await ctx.db.insert("difficultyConfigs", {
        ...config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: "Reset all difficulty configurations to defaults",
    };
  },
});