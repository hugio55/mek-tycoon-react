import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Get all buff tables
export const getAllBuffTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mekTreeBuffTables").collect();
  },
});

// Get a specific buff table by category
export const getBuffTable = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekTreeBuffTables")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .first();
  },
});

// Get all active buff tables for procedural generation
export const getActiveBuffTables = query({
  args: {},
  handler: async (ctx) => {
    const tables = await ctx.db.query("mekTreeBuffTables").collect();
    return tables.filter(t => t.isActive);
  },
});

// Save or update a buff table
export const saveBuffTable = mutation({
  args: {
    category: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    unit: v.optional(v.string()),
    values: v.array(v.array(v.number())), // 7x10 array
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate the values array is 7x10
    if (args.values.length !== 7) {
      throw new Error("Values must have exactly 7 rows (rarity tiers)");
    }
    
    for (const row of args.values) {
      if (row.length !== 10) {
        throw new Error("Each row must have exactly 10 columns (tree tiers)");
      }
    }
    
    // Check if this category already exists
    const existing = await ctx.db
      .query("mekTreeBuffTables")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        description: args.description,
        unit: args.unit,
        values: args.values,
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("mekTreeBuffTables", {
        category: args.category,
        displayName: args.displayName,
        description: args.description,
        unit: args.unit,
        values: args.values,
        isActive: args.isActive,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a buff table
export const deleteBuffTable = mutation({
  args: {
    id: v.id("mekTreeBuffTables"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get buff value for a specific mek and tree tier
export const getBuffValue = query({
  args: {
    category: v.string(),
    mekRank: v.number(),
    treeTier: v.number(), // 1-10
  },
  handler: async (ctx, args) => {
    const table = await ctx.db
      .query("mekTreeBuffTables")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .first();
    
    if (!table || !table.isActive) {
      return null;
    }
    
    // Determine rarity tier based on mek rank
    let rarityTier = 0;
    if (args.mekRank >= 3001 && args.mekRank <= 4000) rarityTier = 0;
    else if (args.mekRank >= 2001 && args.mekRank <= 3000) rarityTier = 1;
    else if (args.mekRank >= 1001 && args.mekRank <= 2000) rarityTier = 2;
    else if (args.mekRank >= 501 && args.mekRank <= 1000) rarityTier = 3;
    else if (args.mekRank >= 101 && args.mekRank <= 500) rarityTier = 4;
    else if (args.mekRank >= 26 && args.mekRank <= 100) rarityTier = 5;
    else if (args.mekRank >= 1 && args.mekRank <= 25) rarityTier = 6;
    else return null; // Invalid rank
    
    // Tree tier is 1-indexed, convert to 0-indexed
    const tierIndex = args.treeTier - 1;
    
    if (tierIndex < 0 || tierIndex >= 10) {
      return null; // Invalid tier
    }
    
    return {
      value: table.values[rarityTier][tierIndex],
      unit: table.unit,
      displayName: table.displayName,
    };
  },
});

// Generate random buffs for a mek's talent tree
export const generateRandomBuffsForMek = query({
  args: {
    mekRank: v.number(),
    numberOfBuffs: v.number(),
    seed: v.optional(v.string()), // For consistent randomization
  },
  handler: async (ctx, args) => {
    const activeTables = await ctx.db
      .query("mekTreeBuffTables")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    if (activeTables.length === 0) {
      return [];
    }
    
    // Simple seeded random if seed provided
    const random = args.seed 
      ? seedRandom(args.seed)
      : Math.random;
    
    const buffs = [];
    const usedCategories = new Set<string>();
    
    for (let i = 0; i < args.numberOfBuffs; i++) {
      // Pick a random category that hasn't been used
      const availableCategories = activeTables.filter(t => !usedCategories.has(t.category));
      if (availableCategories.length === 0) break;
      
      const categoryIndex = Math.floor(random() * availableCategories.length);
      const selectedTable = availableCategories[categoryIndex];
      usedCategories.add(selectedTable.category);
      
      // Pick a random tree tier (1-10)
      const treeTier = Math.floor(random() * 10) + 1;
      
      // Get the buff value
      const buffValue = await ctx.runQuery(api.mekTreeBuffTables.getBuffValue, {
        category: selectedTable.category,
        mekRank: args.mekRank,
        treeTier: treeTier,
      });
      
      if (buffValue) {
        buffs.push({
          category: selectedTable.category,
          displayName: buffValue.displayName,
          treeTier: treeTier,
          value: buffValue.value,
          unit: buffValue.unit,
        });
      }
    }
    
    return buffs;
  },
});

// Simple seeded random number generator
function seedRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return function() {
    hash = ((hash + 0x6D2B79F5) | 0);
    let t = hash;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}