import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import mekRarityMaster from "./mekRarityMaster.json";

// Type for mek data from JSON
interface MekData {
  rank: number;
  assetId: string;
  sourceKey: string;
  head: string;
  body: string;
  trait: string;
}

// Save a normal mek reward configuration
export const saveConfiguration = mutation({
  args: {
    name: v.string(),
    data: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if configuration with same name exists
    const existing = await ctx.db
      .query("normalMekRewardConfigs")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      // Update existing configuration
      await ctx.db.patch(existing._id, {
        data: args.data,
        timestamp: args.timestamp,
      });
      return { success: true, updated: true, id: existing._id };
    } else {
      // Create new configuration
      const id = await ctx.db.insert("normalMekRewardConfigs", {
        name: args.name,
        data: args.data,
        timestamp: args.timestamp,
      });
      return { success: true, updated: false, id };
    }
  },
});

// Update an existing configuration by ID
export const updateConfiguration = mutation({
  args: {
    configId: v.id("normalMekRewardConfigs"),
    data: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      data: args.data,
      timestamp: args.timestamp,
    });
    return { success: true };
  },
});

// Get all saved configurations
export const getConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("normalMekRewardConfigs")
      .order("desc")
      .collect();
    return configs;
  },
});

// Load a specific configuration
export const loadConfiguration = query({
  args: {
    configId: v.id("normalMekRewardConfigs"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    return config;
  },
});

// Delete a configuration
export const deleteConfiguration = mutation({
  args: {
    configId: v.id("normalMekRewardConfigs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
    return { success: true };
  },
});

// Get mek variation counts and data for a specific rank
export const getMekVariationData = query({
  args: {
    rank: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the mek at the specified rank
    const selectedMek = (mekRarityMaster as MekData[]).find(m => m.rank === args.rank);

    if (!selectedMek) {
      return null;
    }

    // Count all variations from ranks 1-4000
    const headCounts: Record<string, number> = {};
    const bodyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    (mekRarityMaster as MekData[]).forEach(mek => {
      if (mek.rank >= 1 && mek.rank <= 4000) {
        headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
        bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
        traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
      }
    });

    // Calculate probabilities for the selected mek's parts
    const parts = [
      {
        name: selectedMek.head,
        count: headCounts[selectedMek.head] || 1,
        type: 'Head'
      },
      {
        name: selectedMek.body,
        count: bodyCounts[selectedMek.body] || 1,
        type: 'Body'
      },
      {
        name: selectedMek.trait,
        count: traitCounts[selectedMek.trait] || 1,
        type: 'Trait'
      }
    ];

    const totalCount = parts.reduce((sum, p) => sum + p.count, 0);

    return {
      mek: selectedMek,
      probabilities: parts.map(p => ({
        name: p.name,
        type: p.type,
        count: p.count,
        probability: (p.count / totalCount) * 100
      })).sort((a, b) => b.probability - a.probability)
    };
  },
});

// Get mek variation data by either rank or asset ID
export const getMekByRankOrId = query({
  args: {
    value: v.string(), // Can be either rank or asset ID
    searchType: v.union(v.literal("rank"), v.literal("assetId")),
  },
  handler: async (ctx, args) => {
    let selectedMek: MekData | undefined;

    if (args.searchType === "rank") {
      selectedMek = (mekRarityMaster as MekData[]).find(m => m.rank === parseInt(args.value));
    } else {
      // Search by asset ID
      selectedMek = (mekRarityMaster as MekData[]).find(m => m.assetId === args.value);
    }

    if (!selectedMek) {
      return null;
    }

    // Count all variations from ranks 1-4000
    const headCounts: Record<string, number> = {};
    const bodyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    (mekRarityMaster as MekData[]).forEach(mek => {
      if (mek.rank >= 1 && mek.rank <= 4000) {
        headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
        bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
        traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
      }
    });

    // Calculate probabilities for the selected mek's parts
    const parts = [
      {
        name: selectedMek.head,
        count: headCounts[selectedMek.head] || 1,
        type: 'Head'
      },
      {
        name: selectedMek.body,
        count: bodyCounts[selectedMek.body] || 1,
        type: 'Body'
      },
      {
        name: selectedMek.trait,
        count: traitCounts[selectedMek.trait] || 1,
        type: 'Trait'
      }
    ];

    const totalCount = parts.reduce((sum, p) => sum + p.count, 0);

    return {
      mek: selectedMek,
      probabilities: parts.map(p => ({
        name: p.name,
        type: p.type,
        count: p.count,
        probability: (p.count / totalCount) * 100
      })).sort((a, b) => b.probability - a.probability)
    };
  },
});

// Get all unique variations and their counts
export const getAllVariationCounts = query({
  args: {},
  handler: async (ctx) => {
    const headCounts: Record<string, number> = {};
    const bodyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    // Count all variations from ranks 1-4000
    (mekRarityMaster as MekData[]).forEach(mek => {
      if (mek.rank >= 1 && mek.rank <= 4000) {
        headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
        bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
        traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
      }
    });

    return {
      totalMeks: (mekRarityMaster as MekData[]).filter(m => m.rank >= 1 && m.rank <= 4000).length,
      uniqueHeads: Object.keys(headCounts).length,
      uniqueBodies: Object.keys(bodyCounts).length,
      uniqueTraits: Object.keys(traitCounts).length,
      headCounts,
      bodyCounts,
      traitCounts
    };
  },
});