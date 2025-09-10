import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Store master ranges for each buff category
export const getMasterRanges = query({
  args: {},
  handler: async (ctx) => {
    const ranges = await ctx.db.query("chipMasterRanges").collect();
    
    // If no ranges exist, return empty object to trigger initialization
    if (ranges.length === 0) {
      return {};
    }
    
    // Convert to object keyed by buffCategoryId
    const rangeMap: Record<string, any> = {};
    for (const range of ranges) {
      rangeMap[range.buffCategoryId] = range;
    }
    return rangeMap;
  },
});

// Set master range for a buff category
export const setMasterRange = mutation({
  args: {
    buffCategoryId: v.id("buffCategories"),
    min: v.number(),
    max: v.number(),
    curvePower: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate that the buff category exists
    const buffCategory = await ctx.db.get(args.buffCategoryId);
    if (!buffCategory) {
      throw new Error("Buff category not found");
    }
    
    // Check if a master range already exists for this category
    const existing = await ctx.db
      .query("chipMasterRanges")
      .filter((q) => q.eq(q.field("buffCategoryId"), args.buffCategoryId))
      .first();
    
    if (existing) {
      // Update existing range
      await ctx.db.patch(existing._id, {
        min: args.min,
        max: args.max,
        curvePower: args.curvePower || 1,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new range
      return await ctx.db.insert("chipMasterRanges", {
        buffCategoryId: args.buffCategoryId,
        min: args.min,
        max: args.max,
        curvePower: args.curvePower || 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Set all master ranges at once
export const setAllMasterRanges = mutation({
  args: {
    ranges: v.array(v.object({
      buffCategoryId: v.id("buffCategories"),
      min: v.number(),
      max: v.number(),
      curvePower: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const range of args.ranges) {
      // Check if a master range already exists for this category
      const existing = await ctx.db
        .query("chipMasterRanges")
        .filter((q) => q.eq(q.field("buffCategoryId"), range.buffCategoryId))
        .first();
      
      if (existing) {
        // Update existing range
        await ctx.db.patch(existing._id, {
          min: range.min,
          max: range.max,
          curvePower: range.curvePower || 1,
          updatedAt: Date.now(),
        });
        results.push({ id: existing._id, action: "updated" });
      } else {
        // Create new range
        const id = await ctx.db.insert("chipMasterRanges", {
          buffCategoryId: range.buffCategoryId,
          min: range.min,
          max: range.max,
          curvePower: range.curvePower || 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push({ id, action: "created" });
      }
    }
    
    return results;
  },
});

// Initialize master ranges from buff categories
export const initializeMasterRanges = mutation({
  args: {},
  handler: async (ctx) => {
    const buffCategories = await ctx.db.query("buffCategories").collect();
    const existingRanges = await ctx.db.query("chipMasterRanges").collect();
    
    // Create a set of existing buff category IDs
    const existingCategoryIds = new Set(existingRanges.map(r => r.buffCategoryId));
    
    const created = [];
    
    for (const category of buffCategories) {
      if (!existingCategoryIds.has(category._id)) {
        // Set default ranges based on category type and unit type
        let min = 1;
        let max = 100;
        
        // Customize defaults based on category and unit type
        if (category.category === "gold") {
          if (category.unitType === "flat_number") {
            min = 1;
            max = 10000;
          } else if (category.unitType === "rate_change") {
            min = 0.1;
            max = 100;
          } else if (category.unitType === "flat_percentage" || category.unitType === "rate_percentage") {
            min = 1;
            max = 500;
          }
        } else if (category.category === "essence") {
          if (category.unitType === "flat_number") {
            min = 1;
            max = 1000;
          } else if (category.unitType === "rate_change") {
            min = 0.1;
            max = 50;
          } else if (category.unitType === "flat_percentage" || category.unitType === "rate_percentage") {
            min = 1;
            max = 300;
          }
        } else if (category.category === "xp") {
          min = 1;
          max = 300;
        } else if (category.category === "market") {
          min = 1;
          max = 75;
        } else if (category.category === "reward_chance" || category.category === "rarity_bias") {
          min = 1;
          max = 150;
        } else if (category.category === "mek_slot") {
          min = 1;
          max = 10;
        }
        
        const id = await ctx.db.insert("chipMasterRanges", {
          buffCategoryId: category._id,
          min,
          max,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        created.push({
          id,
          categoryName: category.name,
          min,
          max,
        });
      }
    }
    
    return {
      message: `Initialized ${created.length} master ranges`,
      created,
    };
  },
});

// Get all chip configurations (100 chips = 10 tiers x 10 ranks)
export const getAllChipConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chipConfigurations").collect();
  },
});

// Save all chip configurations at once
export const saveAllChipConfigs = mutation({
  args: {
    configs: v.array(v.object({
      tier: v.number(),
      rank: v.string(),
      buffs: v.array(v.object({
        buffCategoryId: v.id("buffCategories"),
        procChance: v.number(),
        minValue: v.number(),
        maxValue: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    // Delete all existing configurations
    const existing = await ctx.db.query("chipConfigurations").collect();
    for (const config of existing) {
      await ctx.db.delete(config._id);
    }
    
    // Insert new configurations
    const created = [];
    for (const config of args.configs) {
      const id = await ctx.db.insert("chipConfigurations", {
        tier: config.tier,
        rank: config.rank,
        buffs: config.buffs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created.push(id);
    }
    
    return {
      message: `Saved ${created.length} chip configurations`,
      count: created.length,
    };
  },
});

// Check if deleting a buff category would affect chip configs
export const checkCategoryDependencies = query({
  args: {
    buffCategoryId: v.id("buffCategories"),
  },
  handler: async (ctx, args) => {
    // Check master ranges
    const masterRange = await ctx.db
      .query("chipMasterRanges")
      .filter((q) => q.eq(q.field("buffCategoryId"), args.buffCategoryId))
      .first();
    
    // Check chip configurations
    const configs = await ctx.db.query("chipConfigurations").collect();
    let affectedConfigs = 0;
    
    for (const config of configs) {
      if (config.buffs && config.buffs.some((b: any) => b.buffCategoryId === args.buffCategoryId)) {
        affectedConfigs++;
      }
    }
    
    return {
      hasMasterRange: !!masterRange,
      affectedChipConfigs: affectedConfigs,
      totalChipConfigs: configs.length,
    };
  },
});

// Sync master ranges when a buff category is deleted
export const removeCategoryFromConfigs = mutation({
  args: {
    buffCategoryId: v.id("buffCategories"),
  },
  handler: async (ctx, args) => {
    // Remove master range
    const masterRange = await ctx.db
      .query("chipMasterRanges")
      .filter((q) => q.eq(q.field("buffCategoryId"), args.buffCategoryId))
      .first();
    
    if (masterRange) {
      await ctx.db.delete(masterRange._id);
    }
    
    // Remove from chip configurations
    const configs = await ctx.db.query("chipConfigurations").collect();
    let updated = 0;
    
    for (const config of configs) {
      if (config.buffs && config.buffs.some((b: any) => b.buffCategoryId === args.buffCategoryId)) {
        const newBuffs = config.buffs.filter((b: any) => b.buffCategoryId !== args.buffCategoryId);
        await ctx.db.patch(config._id, {
          buffs: newBuffs,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }
    
    return {
      masterRangeDeleted: !!masterRange,
      configurationsUpdated: updated,
    };
  },
});