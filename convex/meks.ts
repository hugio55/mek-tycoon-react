import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all meks for a specific owner
export const getMeksByOwner = query({
  args: { owner: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .collect();
  },
});

// Get a single mek by asset ID
export const getMekByAssetId = query({
  args: { assetId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
  },
});

// Get meks by rarity tier
export const getMeksByRarity = query({
  args: { rarityTier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_rarity", (q) => q.eq("rarityTier", args.rarityTier))
      .collect();
  },
});

// Get top meks by power score
export const getTopMeksByPower = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("meks")
      .withIndex("by_power")
      .order("desc")
      .take(limit);
  },
});

// Get meks by specific head variation
export const getMeksByHead = query({
  args: { headVariation: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_head", (q) => q.eq("headVariation", args.headVariation))
      .collect();
  },
});

// Get meks by specific body variation
export const getMeksByBody = query({
  args: { bodyVariation: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_body", (q) => q.eq("bodyVariation", args.bodyVariation))
      .collect();
  },
});

// Update mek stats (after battle, level up, etc.)
export const updateMekStats = mutation({
  args: {
    assetId: v.string(),
    stats: v.object({
      level: v.optional(v.number()),
      experience: v.optional(v.number()),
      health: v.optional(v.number()),
      maxHealth: v.optional(v.number()),
      attack: v.optional(v.number()),
      defense: v.optional(v.number()),
      speed: v.optional(v.number()),
      energy: v.optional(v.number()),
      maxEnergy: v.optional(v.number()),
      powerScore: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
    
    if (!mek) {
      throw new Error("Mek not found");
    }
    
    await ctx.db.patch(mek._id, {
      ...args.stats,
      lastUpdated: Date.now(),
    });
    
    return mek._id;
  },
});

// Update battle record
export const updateBattleRecord = mutation({
  args: {
    assetId: v.string(),
    result: v.union(v.literal("win"), v.literal("loss"), v.literal("draw")),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
    
    if (!mek) {
      throw new Error("Mek not found");
    }
    
    const updates: any = {
      lastUpdated: Date.now(),
    };
    
    if (args.result === "win") {
      updates.wins = (mek.wins || 0) + 1;
      updates.winStreak = (mek.winStreak || 0) + 1;
    } else if (args.result === "loss") {
      updates.losses = (mek.losses || 0) + 1;
      updates.winStreak = 0;
    } else {
      updates.draws = (mek.draws || 0) + 1;
    }
    
    await ctx.db.patch(mek._id, updates);
    
    return mek._id;
  },
});

// Add or update a mek (for importing from blockchain data)
export const upsertMek = mutation({
  args: {
    assetId: v.string(),
    assetName: v.string(),
    owner: v.string(),
    iconUrl: v.optional(v.string()),
    verified: v.boolean(),
    headGroup: v.optional(v.string()),
    headVariation: v.string(),
    bodyGroup: v.optional(v.string()),
    bodyVariation: v.string(),
    armsGroup: v.optional(v.string()),
    armsVariation: v.optional(v.string()),
    legsGroup: v.optional(v.string()),
    legsVariation: v.optional(v.string()),
    boosterGroup: v.optional(v.string()),
    boosterVariation: v.optional(v.string()),
    itemGroup: v.optional(v.string()),
    itemVariation: v.optional(v.string()),
    rarityRank: v.optional(v.number()),
    rarityTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingMek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
    
    if (existingMek) {
      // Update existing mek
      await ctx.db.patch(existingMek._id, {
        ...args,
        lastUpdated: Date.now(),
      });
      return existingMek._id;
    } else {
      // Create new mek with default stats
      const newMek = {
        ...args,
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 10,
        speed: 10,
        energy: 100,
        maxEnergy: 100,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        powerScore: 100,
        scrapValue: 50,
        inBattle: false,
        isStaked: false,
        lastUpdated: Date.now(),
      };
      
      return await ctx.db.insert("meks", newMek);
    }
  },
});

// Get battle-ready meks (not in battle, has energy)
export const getBattleReadyMeks = query({
  args: { owner: v.string() },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .collect();
    
    return meks.filter(mek => 
      !mek.inBattle && 
      (mek.energy || 0) > 20 &&
      !mek.isStaked
    );
  },
});