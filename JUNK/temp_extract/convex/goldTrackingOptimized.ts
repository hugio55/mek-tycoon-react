import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Lightweight gold status - minimal data transfer
export const getGoldStatus = query({
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
    
    // Return only essential data
    return {
      gold: user.gold,
      pending: cappedPendingGold,
      rate: goldPerHour,
      lastCollection,
    };
  },
});

// One-time fetch for initial load (not reactive)
export const getInitialGoldData = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const now = Date.now();
    const lastCollection = user.lastGoldCollection || now;
    const goldPerHour = user.goldPerHour || 0;
    
    // Calculate pending gold
    const hoursElapsed = (now - lastCollection) / (1000 * 60 * 60);
    const cappedHours = Math.min(hoursElapsed, 72);
    const pendingGold = cappedHours * goldPerHour;
    
    return {
      totalGold: user.gold,
      pendingGold,
      goldPerHour,
      goldPerSecond: goldPerHour / 3600,
      lastCollection,
      currentTime: now,
    };
  },
});