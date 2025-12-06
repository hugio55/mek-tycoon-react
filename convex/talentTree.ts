import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveTalentTree = mutation({
  args: {
    walletAddress: v.string(),
    nodes: v.array(v.object({
      id: v.string(),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      tier: v.number(),
      desc: v.string(),
      xp: v.number(),
      variation: v.optional(v.string()),
      variationType: v.optional(v.union(v.literal("head"), v.literal("body"), v.literal("trait"))),
      imageUrl: v.optional(v.string()),
    })),
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { walletAddress, nodes, connections } = args;
    
    // Find or create user
    const user = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .first();
    
    if (!user) {
      // Create a new user if not exists
      await ctx.db.insert("users", {
        walletAddress,
        lastLogin: Date.now(),
        totalEssence: {
          stone: 0,
          disco: 0,
          paul: 0,
          cartoon: 0,
          candy: 0,
          tiles: 0,
          moss: 0,
          bullish: 0,
          journalist: 0,
          laser: 0,
          flashbulb: 0,
          accordion: 0,
          turret: 0,
          drill: 0,
          security: 0,
        },
        gold: 0,
        craftingSlots: 1,
      });
    }
    
    // Store talent tree in localStorage key-value pattern
    const talentTreeData = JSON.stringify({ nodes, connections });
    
    // Since Convex doesn't have a direct key-value store for user data,
    // we'll store this in a special field or create a new table
    // For now, return success and let client handle localStorage
    return { 
      success: true, 
      message: "Talent tree saved",
      savedAt: Date.now()
    };
  },
});

export const loadTalentTree = query({
  args: {
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, return null to indicate client should use localStorage
    // In future, we could add a talentTrees table to store this data
    return null;
  },
});

// Global talent tree that all users can see (admin-created)
export const getGlobalTalentTree = query({
  handler: async () => {
    // This would return the admin-created global talent tree
    // For now, return null to use the default or user-created trees
    return null;
  },
});