import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Schema for node fee configuration
const nodeFeeSchema = v.object({
  nodeType: v.union(
    v.literal('normal'),
    v.literal('challenger'),
    v.literal('event'),
    v.literal('miniboss'),
    v.literal('finalboss')
  ),
  gold: v.optional(v.object({
    min: v.number(),
    max: v.number(),
    curve: v.number()
  })),
  essence: v.optional(v.object({
    spawnConfigs: v.array(v.object({
      startPercent: v.number(),
      endPercent: v.number(),
      frequency: v.number()
    })),
    rarityRanges: v.array(v.object({
      startPercent: v.number(),
      endPercent: v.number(),
      minRank: v.number(),
      maxRank: v.number()
    })),
    quantity: v.object({
      min: v.number(),
      max: v.number(),
      curve: v.number()
    })
  })),
  chip: v.optional(v.object({
    type: v.union(v.literal('uni'), v.literal('mek')),
    tier: v.string()
  })),
  special: v.optional(v.string())
});

// Get the current fee configuration
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("nodeFeeConfig").first();
    return config || { fees: {} };
  }
});

// Save fee configuration
export const saveConfig = mutation({
  args: {
    fees: v.any() // Using any for now since nested object validation is complex
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("nodeFeeConfig").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fees: args.fees,
        updatedAt: Date.now()
      });
    } else {
      await ctx.db.insert("nodeFeeConfig", {
        fees: args.fees,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    return { success: true };
  }
});

// Get fee for specific node type
export const getNodeFee = query({
  args: {
    nodeType: v.union(
      v.literal('normal'),
      v.literal('challenger'),
      v.literal('event'),
      v.literal('miniboss'),
      v.literal('finalboss')
    )
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("nodeFeeConfig").first();
    if (!config || !config.fees) return null;

    return config.fees[args.nodeType] || null;
  }
});

// Calculate actual fee for a node based on its position in the tree
export const calculateNodeFee = query({
  args: {
    nodeType: v.union(
      v.literal('normal'),
      v.literal('challenger'),
      v.literal('event'),
      v.literal('miniboss'),
      v.literal('finalboss')
    ),
    treeProgress: v.number(), // 0-100 percentage of how far through the tree this node is
    nodeIndex: v.number() // The sequential index of this node in the tree
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("nodeFeeConfig").first();
    if (!config || !config.fees) return null;

    const nodeFees = config.fees[args.nodeType];
    if (!nodeFees) return null;

    const result: any = {
      nodeType: args.nodeType,
      gold: null,
      essence: null,
      chip: nodeFees.chip || null
    };

    // Calculate gold cost
    if (nodeFees.gold) {
      const { min, max, curve } = nodeFees.gold;
      const progress = args.treeProgress / 100;

      if (curve === 0) {
        // Linear interpolation
        result.gold = Math.round(min + (max - min) * progress);
      } else {
        // Exponential curve
        const exponentialProgress = Math.pow(progress, curve);
        result.gold = Math.round(min + (max - min) * exponentialProgress);
      }
    }

    // Calculate essence
    if (nodeFees.essence) {
      const { spawnConfigs, rarityRanges, quantity } = nodeFees.essence;

      // Check if essence should spawn at this progress point
      let shouldSpawn = false;
      for (const config of spawnConfigs || []) {
        if (args.treeProgress >= config.startPercent && args.treeProgress <= config.endPercent) {
          // Check frequency (every Nth node)
          if (args.nodeIndex % config.frequency === 0) {
            shouldSpawn = true;
            break;
          }
        }
      }

      if (shouldSpawn) {
        // Determine rarity range
        let minRank = 1;
        let maxRank = 307;
        for (const range of rarityRanges || []) {
          if (args.treeProgress >= range.startPercent && args.treeProgress <= range.endPercent) {
            minRank = range.minRank;
            maxRank = range.maxRank;
            break;
          }
        }

        // Calculate quantity
        const progress = args.treeProgress / 100;
        let essenceAmount = quantity.min;

        if (quantity.curve === 0) {
          // Linear interpolation
          essenceAmount = quantity.min + (quantity.max - quantity.min) * progress;
        } else {
          // Exponential curve
          const exponentialProgress = Math.pow(progress, quantity.curve);
          essenceAmount = quantity.min + (quantity.max - quantity.min) * exponentialProgress;
        }

        result.essence = {
          shouldSpawn: true,
          minRank,
          maxRank,
          quantity: Math.round(essenceAmount * 10) / 10 // Round to 1 decimal
        };
      }
    }

    return result;
  }
});

// Clear all fees
export const clearAllFees = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("nodeFeeConfig").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fees: {},
        updatedAt: Date.now()
      });
    }

    return { success: true };
  }
});