import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default mechanism tier configuration
// Tier 10 is the best/rarest, Tier 1 is the most common
const DEFAULT_TIERS = [
  { tier: 1, startRank: 3601, endRank: 4000 },  // Tier 1: Most Common (Bottom 10%)
  { tier: 2, startRank: 3201, endRank: 3600 },  // Tier 2: Common (80-90%)
  { tier: 3, startRank: 2801, endRank: 3200 },  // Tier 3: Common+ (70-80%)
  { tier: 4, startRank: 2401, endRank: 2800 },  // Tier 4: Uncommon (60-70%)
  { tier: 5, startRank: 2001, endRank: 2400 },  // Tier 5: Uncommon+ (50-60%)
  { tier: 6, startRank: 1601, endRank: 2000 },  // Tier 6: Rare (40-50%)
  { tier: 7, startRank: 1201, endRank: 1600 },  // Tier 7: Rare+ (30-40%)
  { tier: 8, startRank: 801, endRank: 1200 },   // Tier 8: Epic (20-30%)
  { tier: 9, startRank: 401, endRank: 800 },    // Tier 9: Legendary (10-20%)
  { tier: 10, startRank: 1, endRank: 400 },     // Tier 10: Mythic - Best/Rarest (Top 10%)
];

// Initialize default tiers
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if tiers already exist
    const existing = await ctx.db.query("mechanismTiers").collect();
    if (existing.length > 0) {
      return { message: "Tiers already initialized", count: existing.length };
    }

    // Insert default tiers
    const results = [];
    for (const tier of DEFAULT_TIERS) {
      const id = await ctx.db.insert("mechanismTiers", {
        tier: tier.tier,
        startRank: tier.startRank,
        endRank: tier.endRank,
        description: `Tier ${tier.tier}: Mechanisms ranked ${tier.startRank}-${tier.endRank}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.push(id);
    }

    return { 
      message: "Successfully initialized mechanism tiers", 
      count: results.length 
    };
  },
});

// Get all mechanism tiers
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const tiers = await ctx.db.query("mechanismTiers").collect();
    return tiers.sort((a, b) => a.tier - b.tier);
  },
});

// Update a tier's rank range
export const updateTier = mutation({
  args: {
    id: v.id("mechanismTiers"),
    startRank: v.optional(v.number()),
    endRank: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate rank ranges if provided
    if (updates.startRank !== undefined && updates.endRank !== undefined) {
      if (updates.startRank >= updates.endRank) {
        throw new Error("Start rank must be less than end rank");
      }
      if (updates.startRank < 1 || updates.endRank > 4000) {
        throw new Error("Ranks must be between 1 and 4000");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reset to default tiers
export const resetToDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing tiers
    const existing = await ctx.db.query("mechanismTiers").collect();
    for (const tier of existing) {
      await ctx.db.delete(tier._id);
    }

    // Insert default tiers
    const results = [];
    for (const tier of DEFAULT_TIERS) {
      const id = await ctx.db.insert("mechanismTiers", {
        tier: tier.tier,
        startRank: tier.startRank,
        endRank: tier.endRank,
        description: `Tier ${tier.tier}: Mechanisms ranked ${tier.startRank}-${tier.endRank}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.push(id);
    }

    return { 
      message: "Successfully reset to default tiers", 
      count: results.length 
    };
  },
});