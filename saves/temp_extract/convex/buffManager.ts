import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper function to calculate total buff value for a specific type
const calculateBuffValue = (
  buffs: Array<Doc<"activeBuffs"> & { buffType: Doc<"buffTypes"> }>,
  buffType: string
): { flat: number; percentage: number } => {
  const relevantBuffs = buffs.filter(b => b.buffType.buffType === buffType && b.isActive);
  
  let totalFlat = 0;
  let totalPercentage = 1;
  
  for (const buff of relevantBuffs) {
    if (buff.buffType.valueType === "flat") {
      totalFlat += buff.value * buff.stacks;
    } else {
      // Percentage buffs multiply (1.1 * 1.1 = 1.21 for two 10% buffs)
      const percentageBoost = 1 + (buff.value / 100) * buff.stacks;
      totalPercentage *= percentageBoost;
    }
  }
  
  return { flat: totalFlat, percentage: totalPercentage };
};

// Get all active buffs for a user
export const getUserBuffs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get all active buffs for the user
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", q => q.eq("userId", args.userId).eq("isActive", true))
      .collect();
    
    // Filter out expired buffs and join with buff types
    const validBuffs = [];
    for (const buff of activeBuffs) {
      // Check if buff has expired
      if (buff.expiresAt && buff.expiresAt < now) {
        continue; // Skip expired buffs
      }
      
      const buffType = await ctx.db.get(buff.buffTypeId);
      if (buffType) {
        validBuffs.push({
          ...buff,
          buffType
        });
      }
    }
    
    return validBuffs;
  },
});

// Apply buffs to a base value
export const applyBuffs = query({
  args: {
    userId: v.id("users"),
    baseValue: v.number(),
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
  },
  handler: async (ctx, args) => {
    const buffs = await ctx.runQuery(api.buffManager.getUserBuffs, { userId: args.userId });
    const buffValues = calculateBuffValue(buffs, args.buffType);
    
    // Apply flat bonuses first, then percentage
    let finalValue = args.baseValue + buffValues.flat;
    finalValue = finalValue * buffValues.percentage;
    
    return Math.floor(finalValue); // Round down to nearest integer
  },
});

// Add a buff to a user
export const addBuff = mutation({
  args: {
    userId: v.id("users"),
    buffTypeId: v.id("buffTypes"),
    source: v.string(),
    sourceId: v.optional(v.string()),
    duration: v.optional(v.number()), // Duration in milliseconds
  },
  handler: async (ctx, args) => {
    const buffType = await ctx.db.get(args.buffTypeId);
    if (!buffType) {
      throw new Error("Buff type not found");
    }
    
    // Check if user already has this buff from the same source
    const existingBuff = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", q => q.eq("userId", args.userId).eq("isActive", true))
      .filter(q => 
        q.and(
          q.eq(q.field("buffTypeId"), args.buffTypeId),
          q.eq(q.field("source"), args.source),
          q.eq(q.field("sourceId"), args.sourceId)
        )
      )
      .first();
    
    const now = Date.now();
    
    if (existingBuff) {
      // If buff exists and is stackable, increase stacks
      if (existingBuff.stacks < buffType.maxStacks) {
        await ctx.db.patch(existingBuff._id, {
          stacks: existingBuff.stacks + 1,
          value: buffType.baseValue * (existingBuff.stacks + 1),
        });
        return { success: true, message: "Buff stacked successfully" };
      } else {
        return { success: false, message: "Maximum stacks reached" };
      }
    } else {
      // Create new buff
      const expiresAt = args.duration ? now + args.duration : undefined;
      
      await ctx.db.insert("activeBuffs", {
        userId: args.userId,
        buffTypeId: args.buffTypeId,
        source: args.source,
        sourceId: args.sourceId,
        value: buffType.baseValue,
        stacks: 1,
        startedAt: now,
        expiresAt,
        isActive: true,
      });
      
      return { success: true, message: "Buff added successfully" };
    }
  },
});

// Remove expired buffs
export const cleanupExpiredBuffs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all expired buffs
    const expiredBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_expiration")
      .filter(q => 
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();
    
    // Mark them as inactive
    for (const buff of expiredBuffs) {
      await ctx.db.patch(buff._id, {
        isActive: false,
      });
    }
    
    return { cleaned: expiredBuffs.length };
  },
});

// Seed initial buff types
export const seedBuffTypes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if buff types already exist
    const existingBuffs = await ctx.db.query("buffTypes").collect();
    if (existingBuffs.length > 0) {
      return { message: "Buff types already exist", existing: existingBuffs.map(b => b.name) };
    }
    
    // Create the 3 basic buff types
    const buffTypes = [
      {
        name: "Gold Boost",
        description: "Increases gold earning rate by 10%",
        buffType: "gold_rate" as const,
        valueType: "percentage" as const,
        baseValue: 10, // 10% boost
        maxStacks: 5,
        icon: "💰",
        rarity: "common" as const,
      },
      {
        name: "Speed Boost",
        description: "Reduces crafting time by 15%",
        buffType: "crafting_speed" as const,
        valueType: "percentage" as const,
        baseValue: 15, // 15% faster
        maxStacks: 3,
        icon: "⚡",
        rarity: "uncommon" as const,
      },
      {
        name: "XP Amplifier",
        description: "Increases XP gains by 20%",
        buffType: "xp_gain" as const,
        valueType: "percentage" as const,
        baseValue: 20, // 20% more XP
        maxStacks: 3,
        icon: "⭐",
        rarity: "rare" as const,
      },
      // Add a few more useful buffs
      {
        name: "Essence Finder",
        description: "Increases essence drop rate by 25%",
        buffType: "essence_rate" as const,
        valueType: "percentage" as const,
        baseValue: 25,
        maxStacks: 2,
        icon: "🔮",
        rarity: "rare" as const,
      },
      {
        name: "Lucky Crafter",
        description: "Increases crafting success rate by 5%",
        buffType: "crafting_success" as const,
        valueType: "flat" as const,
        baseValue: 5, // +5% flat success rate
        maxStacks: 4,
        icon: "🍀",
        rarity: "uncommon" as const,
      },
      {
        name: "Gold Rush",
        description: "Adds 100 gold per hour",
        buffType: "gold_rate" as const,
        valueType: "flat" as const,
        baseValue: 100, // +100 gold/hr
        maxStacks: 10,
        icon: "🏆",
        rarity: "common" as const,
      },
    ];
    
    // Insert all buff types
    for (const buffType of buffTypes) {
      const id = await ctx.db.insert("buffTypes", buffType);
    }
    
    // Verify they were inserted
    const afterInsert = await ctx.db.query("buffTypes").collect();
    
    return { 
      message: "Buff types created successfully",
      count: buffTypes.length,
      created: afterInsert.map(b => b.name)
    };
  },
});

// Give a user a temporary buff (for testing)
export const giveTemporaryBuff = mutation({
  args: {
    userId: v.id("users"),
    buffName: v.string(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Find the buff type by name
    const buffType = await ctx.db
      .query("buffTypes")
      .filter((q) => q.eq(q.field("name"), args.buffName))
      .first();
    
    if (!buffType) {
      // Try to list all available buff types for debugging
      const allBuffTypes = await ctx.db.query("buffTypes").collect();
      throw new Error(`Buff type "${args.buffName}" not found. Available: ${allBuffTypes.map(b => b.name).join(", ")}`);
    }
    
    // Add the buff with the specified duration
    return await ctx.runMutation(api.buffManager.addBuff, {
      userId: args.userId,
      buffTypeId: buffType._id,
      source: "temporary",
      sourceId: `temp_${Date.now()}`,
      duration: args.durationMinutes * 60 * 1000,
    });
  },
});