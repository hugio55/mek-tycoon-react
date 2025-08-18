import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all buff types available in the game
export const getAllBuffTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buffTypes").collect();
  },
});

// Get a user's active buffs
export const getUserBuffs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Join with buff types to get full buff information
    const buffsWithDetails = await Promise.all(
      activeBuffs.map(async (buff) => {
        const buffType = await ctx.db.get(buff.buffTypeId);
        return {
          ...buff,
          buffType: buffType,
        };
      })
    );

    return buffsWithDetails;
  },
});

// Calculate total buff values for a user (aggregated by buff type)
export const calculateUserBuffTotals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Group buffs by type and calculate totals
    const buffTotals: Record<string, { flat: number; percentage: number }> = {};

    for (const buff of activeBuffs) {
      const buffType = await ctx.db.get(buff.buffTypeId);
      if (!buffType) continue;

      if (!buffTotals[buffType.buffType]) {
        buffTotals[buffType.buffType] = { flat: 0, percentage: 0 };
      }

      if (buffType.valueType === "flat") {
        buffTotals[buffType.buffType].flat += buff.value * buff.stacks;
      } else {
        buffTotals[buffType.buffType].percentage += buff.value * buff.stacks;
      }
    }

    return buffTotals;
  },
});

// Add a buff type to the game (admin function)
export const createBuffType = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    buffType: v.union(
      v.literal("gold_rate"),
      v.literal("xp_gain"),
      v.literal("auction_fee_reduction"),
      v.literal("essence_rate"),
      v.literal("crafting_speed"),
      v.literal("crafting_success"),
      v.literal("slot_bonus"),
      v.literal("market_discount"),
      v.literal("essence_efficiency"),
      v.literal("gold_capacity")
    ),
    valueType: v.union(v.literal("flat"), v.literal("percentage")),
    baseValue: v.number(),
    maxStacks: v.number(),
    icon: v.optional(v.string()),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("buffTypes", {
      name: args.name,
      description: args.description,
      buffType: args.buffType,
      valueType: args.valueType,
      baseValue: args.baseValue,
      maxStacks: args.maxStacks,
      icon: args.icon,
      rarity: args.rarity,
    });
  },
});

// Grant a buff to a user
export const grantBuff = mutation({
  args: {
    userId: v.id("users"),
    buffTypeId: v.id("buffTypes"),
    source: v.string(),
    sourceId: v.optional(v.string()),
    multiplier: v.optional(v.number()), // Multiplier for the base value
    duration: v.optional(v.number()), // Duration in milliseconds (null = permanent)
  },
  handler: async (ctx, args) => {
    const buffType = await ctx.db.get(args.buffTypeId);
    if (!buffType) throw new Error("Buff type not found");

    // Check if user already has this buff from the same source
    const existingBuff = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isActive"), true),
          q.eq(q.field("buffTypeId"), args.buffTypeId),
          q.eq(q.field("source"), args.source)
        )
      )
      .first();

    if (existingBuff) {
      // Check if we can stack
      if (existingBuff.stacks < buffType.maxStacks) {
        // Add another stack
        await ctx.db.patch(existingBuff._id, {
          stacks: existingBuff.stacks + 1,
        });
        return { success: true, message: "Buff stacked successfully" };
      } else {
        return { success: false, message: "Buff already at max stacks" };
      }
    }

    // Create new buff
    const now = Date.now();
    const value = buffType.baseValue * (args.multiplier || 1);
    
    await ctx.db.insert("activeBuffs", {
      userId: args.userId,
      buffTypeId: args.buffTypeId,
      source: args.source,
      sourceId: args.sourceId,
      value: value,
      stacks: 1,
      startedAt: now,
      expiresAt: args.duration ? now + args.duration : undefined,
      isActive: true,
    });

    return { success: true, message: "Buff granted successfully" };
  },
});

// Remove a buff from a user
export const removeBuff = mutation({
  args: {
    buffId: v.id("activeBuffs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.buffId, { isActive: false });
    return { success: true };
  },
});

// Check and expire old buffs
export const expireOldBuffs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_expiration")
      .filter((q) =>
        q.and(
          q.lte(q.field("expiresAt"), now),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    for (const buff of expiredBuffs) {
      await ctx.db.patch(buff._id, { isActive: false });
    }

    return { expired: expiredBuffs.length };
  },
});

// Seed some initial buff types
export const seedBuffTypes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have buff types
    const existing = await ctx.db.query("buffTypes").take(1);
    if (existing.length > 0) {
      return { message: "Buff types already exist" };
    }

    const buffTypes = [
      {
        name: "Gold Rush",
        description: "Increases gold earning rate",
        buffType: "gold_rate" as const,
        valueType: "flat" as const,
        baseValue: 50,
        maxStacks: 5,
        icon: "💰",
        rarity: "common" as const,
      },
      {
        name: "XP Boost",
        description: "Increases XP gain from all sources",
        buffType: "xp_gain" as const,
        valueType: "percentage" as const,
        baseValue: 10,
        maxStacks: 3,
        icon: "⭐",
        rarity: "uncommon" as const,
      },
      {
        name: "Market Savvy",
        description: "Reduces auction house fees",
        buffType: "auction_fee_reduction" as const,
        valueType: "percentage" as const,
        baseValue: 5,
        maxStacks: 4,
        icon: "🏪",
        rarity: "uncommon" as const,
      },
      {
        name: "Essence Magnet",
        description: "Increases essence generation rate",
        buffType: "essence_rate" as const,
        valueType: "percentage" as const,
        baseValue: 15,
        maxStacks: 3,
        icon: "✨",
        rarity: "rare" as const,
      },
      {
        name: "Swift Crafter",
        description: "Reduces crafting time",
        buffType: "crafting_speed" as const,
        valueType: "percentage" as const,
        baseValue: 20,
        maxStacks: 2,
        icon: "⚡",
        rarity: "rare" as const,
      },
      {
        name: "Lucky Hands",
        description: "Increases crafting success rate",
        buffType: "crafting_success" as const,
        valueType: "percentage" as const,
        baseValue: 5,
        maxStacks: 10,
        icon: "🍀",
        rarity: "epic" as const,
      },
      {
        name: "Workshop Expansion",
        description: "Grants additional crafting slots",
        buffType: "slot_bonus" as const,
        valueType: "flat" as const,
        baseValue: 1,
        maxStacks: 2,
        icon: "🏭",
        rarity: "legendary" as const,
      },
    ];

    // Insert all buff types
    for (const buffType of buffTypes) {
      await ctx.db.insert("buffTypes", buffType);
    }

    return { 
      message: "Buff types seeded successfully", 
      count: buffTypes.length 
    };
  },
});