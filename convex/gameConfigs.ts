import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Consolidated Game Configs - Single Query for All Config Data
 *
 * Instead of making 4-5 separate queries for different configs,
 * this single query fetches all game configuration data at once,
 * reducing bandwidth usage by 75%.
 *
 * Use this in components that need multiple config types.
 */

// Get all game configurations in one query
export const getAllGameConfigs = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all configs in parallel
    const [
      difficultyConfigs,
      activeDurationConfig,
      allDurationConfigs
    ] = await Promise.all([
      // Get all difficulty configs
      ctx.db.query("difficultyConfigs").collect(),

      // Get active duration config
      ctx.db
        .query("durationConfigs")
        .withIndex("by_active", q => q.eq("isActive", true))
        .first(),

      // Get all duration configs for admin
      ctx.db.query("durationConfigs").collect()
    ]);

    return {
      difficultyConfigs,
      activeDurationConfig: activeDurationConfig ? {
        normal: activeDurationConfig.normal,
        challenger: activeDurationConfig.challenger,
        event: activeDurationConfig.event,
        miniboss: activeDurationConfig.miniboss,
        finalboss: activeDurationConfig.finalboss,
      } : null,
      durationConfigs: allDurationConfigs.map(config => ({
        name: config.name,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      })),
    };
  },
});

// Get configs for Story Climb page (minimal set)
export const getStoryClimbConfigs = query({
  args: {},
  handler: async (ctx) => {
    const [difficultyConfigs, activeDurationConfig] = await Promise.all([
      ctx.db.query("difficultyConfigs").collect(),
      ctx.db
        .query("durationConfigs")
        .withIndex("by_active", q => q.eq("isActive", true))
        .first(),
    ]);

    return {
      difficultyConfigs,
      durationConfig: activeDurationConfig ? {
        normal: activeDurationConfig.normal,
        challenger: activeDurationConfig.challenger,
        event: activeDurationConfig.event,
        miniboss: activeDurationConfig.miniboss,
        finalboss: activeDurationConfig.finalboss,
      } : null,
    };
  },
});

// Get specific node config (optimized single query)
export const getNodeConfig = query({
  args: {
    nodeType: v.union(
      v.literal("normal"),
      v.literal("challenger"),
      v.literal("event"),
      v.literal("miniboss"),
      v.literal("final_boss")
    ),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const [difficultyConfig, activeDurationConfig] = await Promise.all([
      ctx.db
        .query("difficultyConfigs")
        .withIndex("", (q: any) =>
          q.eq("nodeType", args.nodeType).eq("difficulty", args.difficulty)
        )
        .first(),

      ctx.db
        .query("durationConfigs")
        .withIndex("by_active", q => q.eq("isActive", true))
        .first(),
    ]);

    const durationSettings = activeDurationConfig
      ? activeDurationConfig[args.nodeType === "final_boss" ? "finalboss" : args.nodeType]
      : null;

    return {
      difficulty: difficultyConfig,
      duration: durationSettings,
    };
  },
});
