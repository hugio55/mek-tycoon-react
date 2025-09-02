import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Get cached leaderboard data - FAST query from pre-computed cache
export const getCachedLeaderboard = query({
  args: { 
    category: v.string(),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()), // for topMeks sorting
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // For gold with custom sorting
    if (args.category === 'gold' && args.sortBy === 'perHour') {
      const allEntries = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_category_rank", (q) => q.eq("category", args.category))
        .collect();
      
      // Re-sort by gold per hour
      const sorted = allEntries.sort((a, b) => {
        return (b.metadata?.goldPerHour || 0) - (a.metadata?.goldPerHour || 0);
      });
      
      // Re-assign ranks based on new sort
      return sorted.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        value: args.sortBy === 'perHour' ? entry.metadata?.goldPerHour || 0 : entry.value
      }));
    }
    
    // For topMeks with custom sorting, we need to fetch and re-sort
    if (args.category === 'topMeks' && args.sortBy && args.sortBy !== 'goldPerHour') {
      const allEntries = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_category_rank", (q) => q.eq("category", args.category))
        .collect();
      
      // Re-sort based on the requested field
      const sorted = allEntries.sort((a, b) => {
        switch (args.sortBy) {
          case 'goldTotal':
            return (b.metadata?.topMek?.totalGold || 0) - (a.metadata?.topMek?.totalGold || 0);
          case 'essenceTotal':
            return (b.metadata?.topMek?.totalEssence || 0) - (a.metadata?.topMek?.totalEssence || 0);
          case 'essencePerHour':
            return (b.metadata?.topMek?.essenceRate || 0) - (a.metadata?.topMek?.essenceRate || 0);
          default: // goldPerHour
            return (b.metadata?.topMek?.goldRate || 0) - (a.metadata?.topMek?.goldRate || 0);
        }
      });
      
      // Re-assign ranks based on new sort
      return sorted.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    }
    
    // Default: Get from cache, already sorted by rank
    const cachedEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", (q) => q.eq("category", args.category))
      .take(limit);
    
    return cachedEntries;
  },
});

// Get user's rank from cache - FAST query
export const getUserRank = query({
  args: {
    userId: v.optional(v.id("users")),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    
    const userEntry = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_user_category", (q) => 
        q.eq("userId", args.userId!).eq("category", args.category)
      )
      .first();
    
    return userEntry?.rank || null;
  },
});

// Background job to update leaderboard cache
export const updateLeaderboardCache = internalMutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    
    let leaderboardData: any[] = [];
    
    for (const user of users) {
      let value = 0;
      let metadata: any = {};
      
      switch (args.category) {
        case "gold":
          value = user.gold;
          metadata.goldPerHour = user.goldPerHour || 0;
          metadata.level = user.level || 1;
          break;
          
        case "meks":
          // Count user's meks
          const userMeks = await ctx.db
            .query("meks")
            .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
            .collect();
          
          value = userMeks.length;
          
          // Count by rarity and find highest level mek
          const rarityCount = {
            total: userMeks.length,
            legendary: 0,
            epic: 0,
            rare: 0,
            uncommon: 0,
            common: 0,
            topMekAssetId: undefined as string | undefined,
            topMekLevel: 0,
          };
          
          let topMek = null;
          for (const mek of userMeks) {
            const tier = mek.rarityTier?.toLowerCase() || "common";
            if (tier in rarityCount) {
              rarityCount[tier as keyof typeof rarityCount]++;
            }
            // Track highest level mek
            if ((mek.level || 1) > rarityCount.topMekLevel) {
              rarityCount.topMekLevel = mek.level || 1;
              rarityCount.topMekAssetId = mek.assetId;
            }
          }
          
          metadata.mekDetails = rarityCount;
          metadata.level = user.level || 1;
          break;
          
        case "essence":
          // Sum all essence types
          const essences = user.totalEssence;
          value = Object.values(essences).reduce((sum, val) => sum + val, 0);
          metadata.essenceBreakdown = essences;
          metadata.essencePerHour = value * 0.1; // Example calculation
          metadata.level = user.level || 1;
          break;
          
        case "topMeks":
          // Get top meks by gold/essence production
          const allMeks = await ctx.db
            .query("meks")
            .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
            .collect();
          
          if (allMeks.length > 0) {
            // Find the mek with highest gold rate
            const topMek = allMeks.reduce((best, mek) => {
              const mekGoldRate = (mek.goldRate || 0) + ((mek.level || 1) * 10);
              const bestGoldRate = (best.goldRate || 0) + ((best.level || 1) * 10);
              return mekGoldRate > bestGoldRate ? mek : best;
            });
            
            const goldRate = (topMek.goldRate || 0) + ((topMek.level || 1) * 10);
            const essenceRate = (topMek.level || 1) * 0.5;
            const totalGold = goldRate * (topMek.level || 1) * 100; // Example calculation
            const totalEssence = essenceRate * (topMek.level || 1) * 50; // Example calculation
            
            value = goldRate; // Default sort by gold rate
            metadata.topMek = {
              assetId: topMek.assetId,
              assetName: topMek.assetName,
              level: topMek.level || 1,
              goldRate,
              essenceRate,
              totalGold,
              totalEssence,
            };
          }
          break;
          
        case "achievements":
          // Calculate achievement score
          const achievements = await ctx.db
            .query("achievements")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
          
          value = achievements.length * 100; // 100 points per achievement
          metadata.achievementScore = value;
          metadata.level = user.level || 1;
          
          // Also get mek count for display
          const meksForAchievement = await ctx.db
            .query("meks")
            .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
            .collect();
          metadata.mekDetails = { total: meksForAchievement.length };
          break;
      }
      
      leaderboardData.push({
        userId: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        value,
        metadata,
      });
    }
    
    // Sort by value descending
    leaderboardData.sort((a, b) => b.value - a.value);
    
    // Clear existing cache for this category
    const existingCache = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", (q) => q.eq("category", args.category))
      .collect();
    
    for (const entry of existingCache) {
      await ctx.db.delete(entry._id);
    }
    
    // Insert new cache entries with ranks
    const timestamp = Date.now();
    for (let i = 0; i < leaderboardData.length; i++) {
      const data = leaderboardData[i];
      await ctx.db.insert("leaderboardCache", {
        category: args.category,
        userId: data.userId,
        walletAddress: data.walletAddress,
        username: data.username,
        value: data.value,
        rank: i + 1,
        lastUpdated: timestamp,
        metadata: data.metadata,
      });
    }
  },
});

// Update all leaderboard categories
export const updateAllLeaderboards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = ["gold", "meks", "essence", "topMeks", "achievements"];
    
    for (const category of categories) {
      await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateLeaderboardCache, {
        category
      });
    }
  },
});

// Update user stats cache
export const updateUserStatsCache = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    
    // Count meks
    const userMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
      .collect();
    const mekCount = userMeks.length;
    
    // Calculate total essence
    const totalEssence = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);
    
    // Get bank balance
    const bankAccount = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    const bankBalance = bankAccount?.balance || 0;
    
    // Get stock value
    const stockHoldings = await ctx.db
      .query("stockHoldings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const stockValue = stockHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    // Calculate net worth
    const netWorth = user.gold + totalEssence + bankBalance + stockValue;
    
    // Check if cache exists
    const existingCache = await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const cacheData = {
      userId: args.userId,
      mekCount,
      totalEssence,
      netWorth,
      goldPerHour: user.goldPerHour || 0,
      bankBalance,
      stockValue,
      lastUpdated: Date.now(),
    };
    
    if (existingCache) {
      await ctx.db.patch(existingCache._id, cacheData);
    } else {
      await ctx.db.insert("userStatsCache", cacheData);
    }
  },
});

// Get user stats from cache
export const getCachedUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return cached;
  },
});

// Manual trigger to refresh cache (for testing)
export const refreshLeaderboardCache = mutation({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateLeaderboardCache, {
        category: args.category
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateAllLeaderboards, {});
    }
    
    return { success: true, message: "Leaderboard cache refresh scheduled" };
  },
});