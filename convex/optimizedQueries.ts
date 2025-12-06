import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Optimized query to get user's mek count without fetching all meks
export const getUserMekCount = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) return 0;
    
    const userId = args.userId || identity?.subject;
    if (!userId) return 0;
    
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return 0;
    
    // Use cached stats if available and recent (less than 5 mins old)
    const cachedStats = await ctx.db
      .query("userStatsCache")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .first();
    
    if (cachedStats && Date.now() - cachedStats.lastUpdated < 5 * 60 * 1000) {
      return cachedStats.mekCount;
    }
    
    // Otherwise count directly (but this should be rare)
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
      .collect();
    
    return meks.length;
  },
});

// Get user's meks with pagination (instead of fetching all)
export const getUserMeksPaginated = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) return { meks: [], nextCursor: null };
    
    const userId = args.userId || identity?.subject;
    if (!userId) return { meks: [], nextCursor: null };
    
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return { meks: [], nextCursor: null };
    
    const limit = args.limit || 20;
    
    // Get meks with pagination
    let query = ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress));
    
    // Apply cursor if provided
    if (args.cursor) {
      const cursorId = args.cursor as Id<"meks">;
      const cursorDoc = await ctx.db.get(cursorId);
      if (cursorDoc) {
        query = query.filter((q) => q.gt(q.field("_creationTime"), cursorDoc._creationTime));
      }
    }
    
    const meks = await query.take(limit + 1);
    
    let nextCursor = null;
    if (meks.length > limit) {
      nextCursor = meks[limit - 1]._id;
      meks.pop(); // Remove the extra item
    }
    
    return { meks, nextCursor };
  },
});

// Get aggregated user statistics (optimized)
export const getUserStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) return null;
    
    const userId = args.userId || identity?.subject;
    if (!userId) return null;
    
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return null;
    
    // Try to get from cache first
    const cachedStats = await ctx.db
      .query("userStatsCache")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .first();
    
    // If cache is recent (< 5 mins), use it
    if (cachedStats && Date.now() - cachedStats.lastUpdated < 5 * 60 * 1000) {
      return {
        gold: user.gold,
        mekCount: cachedStats.mekCount,
        totalEssence: cachedStats.totalEssence,
        netWorth: cachedStats.netWorth,
        goldPerHour: cachedStats.goldPerHour,
        bankBalance: cachedStats.bankBalance,
        stockValue: cachedStats.stockValue,
        level: user.level || 1,
        experience: user.experience || 0,
      };
    }
    
    // Otherwise calculate (this should be rare)
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
      .collect();
    
    const totalEssence = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);
    
    const bankAccount = await ctx.db
      .query("bankAccounts")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .first();
    
    const stockHoldings = await ctx.db
      .query("stockHoldings")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .collect();
    
    const stockValue = stockHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    return {
      gold: user.gold,
      mekCount: meks.length,
      totalEssence,
      netWorth: user.gold + totalEssence + (bankAccount?.balance || 0) + stockValue,
      goldPerHour: user.goldPerHour || 0,
      bankBalance: bankAccount?.balance || 0,
      stockValue,
      level: user.level || 1,
      experience: user.experience || 0,
    };
  },
});

// Get top meks by rarity (optimized with limit)
export const getTopMeksByRarity = query({
  args: { 
    rarityTier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("rarityTier", args.rarityTier))
      .take(limit);
    
    return meks;
  },
});

// Get user's mek count by rarity (server-side aggregation)
export const getUserMeksByRarity = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) return null;
    
    const userId = args.userId || identity?.subject;
    if (!userId) return null;
    
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return null;
    
    // Try cache first
    const cachedStats = await ctx.db
      .query("userStatsCache")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .first();
    
    if (cachedStats && Date.now() - cachedStats.lastUpdated < 5 * 60 * 1000) {
      // Get from leaderboard cache which has mek details
      const leaderboardEntry = await ctx.db
        .query("leaderboardCache")
        .withIndex("", (q: any) => 
          q.eq("userId", user._id).eq("category", "meks")
        )
        .first();
      
      if (leaderboardEntry?.metadata?.mekDetails) {
        return leaderboardEntry.metadata.mekDetails;
      }
    }
    
    // Fallback to counting (should be rare)
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
      .collect();
    
    const rarityCount = {
      total: meks.length,
      legendary: 0,
      epic: 0,
      rare: 0,
      uncommon: 0,
      common: 0,
    };
    
    for (const mek of meks) {
      const tier = mek.rarityTier?.toLowerCase() || "common";
      if (tier in rarityCount) {
        rarityCount[tier as keyof typeof rarityCount]++;
      }
    }
    
    return rarityCount;
  },
});

// Batch update user stats after important actions
export const triggerUserStatsUpdate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Schedule an internal mutation to update cache
    await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateUserStatsCache, {
      userId: args.userId,
    });
    
    return { success: true };
  },
});

// Get multiple users' basic stats in one query
export const getBatchUserStats = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user) continue;
      
      // Get cached stats
      const cachedStats = await ctx.db
        .query("userStatsCache")
        .withIndex("", (q: any) => q.eq("userId", userId))
        .first();
      
      results.push({
        userId,
        username: user.username,
        walletAddress: user.walletAddress,
        gold: user.gold,
        mekCount: cachedStats?.mekCount || 0,
        level: user.level || 1,
      });
    }
    
    return results;
  },
});