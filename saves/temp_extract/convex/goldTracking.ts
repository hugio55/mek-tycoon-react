import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Calculate user's total gold per hour from all sources
export const calculateGoldRate = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    // Get all user's meks
    const userMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
      .collect();
    
    // Calculate base gold rate from meks
    let baseRate = 0;
    for (const mek of userMeks) {
      // Base rate = level * 3.5 gold/hr per mek
      const mekRate = (mek.level || 1) * 3.5;
      baseRate += mekRate;
    }
    
    // Get active buffs that affect gold rate
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
    
    let buffMultiplier = 1;
    let buffFlat = 0;
    
    for (const buff of activeBuffs) {
      const buffType = await ctx.db.get(buff.buffTypeId);
      if (buffType?.buffType === "gold_rate") {
        if (buffType.valueType === "percentage") {
          buffMultiplier += (buff.value / 100);
        } else if (buffType.valueType === "flat") {
          buffFlat += buff.value;
        }
      }
    }
    
    // Calculate final gold rate
    const finalRate = (baseRate * buffMultiplier) + buffFlat;
    
    return {
      baseRate,
      buffMultiplier,
      buffFlat,
      finalRate,
      mekCount: userMeks.length,
    };
  },
});

// Get pending gold (accumulated but not collected)
export const getPendingGold = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const now = Date.now();
    const lastCollection = user.lastGoldCollection || now;
    const goldPerHour = user.goldPerHour || 0;
    
    // Calculate time elapsed in hours (with millisecond precision)
    const hoursElapsed = (now - lastCollection) / (1000 * 60 * 60);
    
    // Calculate pending gold with decimal precision
    const pendingGold = hoursElapsed * goldPerHour;
    
    return {
      pendingGold,
      hoursElapsed,
      goldPerHour,
      lastCollection,
      currentTime: now,
    };
  },
});

// Update user's gold rate when meks or buffs change
export const updateGoldRate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    // First collect any pending gold before updating rate
    const now = Date.now();
    const lastCollection = user.lastGoldCollection || now;
    const oldGoldPerHour = user.goldPerHour || 0;
    
    // Calculate pending gold with old rate
    const hoursElapsed = (now - lastCollection) / (1000 * 60 * 60);
    const pendingGold = hoursElapsed * oldGoldPerHour;
    
    // Get all user's meks
    const userMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
      .collect();
    
    // Calculate new base gold rate from meks
    let baseRate = 0;
    for (const mek of userMeks) {
      const mekRate = (mek.level || 1) * 3.5;
      baseRate += mekRate;
    }
    
    // Get active buffs
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
    
    let buffMultiplier = 1;
    let buffFlat = 0;
    
    for (const buff of activeBuffs) {
      const buffType = await ctx.db.get(buff.buffTypeId);
      if (buffType?.buffType === "gold_rate") {
        if (buffType.valueType === "percentage") {
          buffMultiplier += (buff.value / 100);
        } else if (buffType.valueType === "flat") {
          buffFlat += buff.value;
        }
      }
    }
    
    // Calculate new gold rate
    const newGoldPerHour = (baseRate * buffMultiplier) + buffFlat;
    
    // Update user with new rate and add pending gold
    await ctx.db.patch(args.userId, {
      goldPerHour: newGoldPerHour,
      gold: user.gold + pendingGold,
      lastGoldCollection: now,
    });
    
    return {
      oldRate: oldGoldPerHour,
      newRate: newGoldPerHour,
      collectedGold: pendingGold,
      totalGold: user.gold + pendingGold,
    };
  },
});

// Collect accumulated gold
export const collectGold = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const now = Date.now();
    const lastCollection = user.lastGoldCollection || now;
    const goldPerHour = user.goldPerHour || 0;
    
    // Calculate time elapsed in hours
    const hoursElapsed = (now - lastCollection) / (1000 * 60 * 60);
    
    // Calculate gold to collect (with 72 hour cap)
    const maxHours = 72; // 3 day cap
    const cappedHours = Math.min(hoursElapsed, maxHours);
    const goldToCollect = cappedHours * goldPerHour;
    
    // Calculate XP based on gold collected (base: 1 XP per 10 gold)
    const baseXP = Math.floor(goldToCollect / 10);
    
    // Apply XP buffs
    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
    
    let xpMultiplier = 1;
    for (const buff of activeBuffs) {
      const buffType = await ctx.db.get(buff.buffTypeId);
      if (buffType?.buffType === "xp_gain") {
        if (buffType.valueType === "percentage") {
          xpMultiplier += (buff.value / 100);
        }
      }
    }
    
    const xpGained = Math.floor(baseXP * xpMultiplier);
    const currentXP = (user.experience || 0) + xpGained;
    const currentLevel = user.level || 1;
    
    // Simple level calculation: level up every 100 * level XP
    const xpForNextLevel = currentLevel * 100;
    let newLevel = currentLevel;
    let remainingXP = currentXP;
    
    while (remainingXP >= xpForNextLevel * newLevel) {
      remainingXP -= xpForNextLevel * newLevel;
      newLevel++;
    }
    
    // Update user with gold and XP
    await ctx.db.patch(args.userId, {
      gold: user.gold + goldToCollect,
      lastGoldCollection: now,
      pendingGold: 0,
      experience: currentXP,
      level: newLevel,
    });
    
    // Check for level up achievement
    const leveledUp = newLevel > currentLevel;
    if (leveledUp) {
      // Log level up transaction
      await ctx.db.insert("goldTransactions", {
        userId: args.userId,
        amount: newLevel - currentLevel,
        type: "level_up",
        description: `Reached level ${newLevel}!`,
        timestamp: now,
      });
    }
    
    return {
      collected: goldToCollect,
      xpGained,
      currentLevel: newLevel,
      currentXP,
      leveledUp,
      hoursElapsed: cappedHours,
      wasCapped: hoursElapsed > maxHours,
      totalGold: user.gold + goldToCollect,
      goldPerHour,
    };
  },
});

// Get live gold counter (for display)
export const getLiveGoldCounter = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const now = Date.now();
    const lastCollection = user.lastGoldCollection || now;
    const goldPerHour = user.goldPerHour || 0;
    
    // Calculate current accumulated gold
    const secondsElapsed = (now - lastCollection) / 1000;
    const goldPerSecond = goldPerHour / 3600;
    const currentPendingGold = secondsElapsed * goldPerSecond;
    
    // Cap at 72 hours
    const maxGold = goldPerHour * 72;
    const cappedPendingGold = Math.min(currentPendingGold, maxGold);
    
    return {
      totalGold: user.gold,
      pendingGold: cappedPendingGold,
      goldPerSecond,
      goldPerHour,
      secondsSinceCollection: secondsElapsed,
      isCapped: currentPendingGold >= maxGold,
    };
  },
});