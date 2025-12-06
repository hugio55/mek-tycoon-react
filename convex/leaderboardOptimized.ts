import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Get cached leaderboard data - OPTIMIZED with pagination
export const getCachedLeaderboard = query({
  args: { 
    category: v.string(),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()), // for topMeks sorting
    offset: v.optional(v.number()), // for pagination
    includeCurrentUser: v.optional(v.boolean()), // Include current user's position at end
    currentUserId: v.optional(v.id("users")), // User requesting the leaderboard
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 50); // Cap at 50 to reduce bandwidth
    const offset = args.offset || 0;
    
    // For custom sorting, only fetch what we need
    if (args.category === 'gold' && args.sortBy === 'perHour') {
      // OPTIMIZATION: Only fetch entries we'll display
      const entries = await ctx.db
        .query("leaderboardCache")
        .withIndex("", (q: any) => q.eq("category", args.category))
        .take(Math.min(offset + limit + 10, 200)); // Fetch a bit extra for sorting
      
      // Re-sort by gold per hour
      const sorted = entries.sort((a, b) => {
        return (b.metadata?.goldPerHour || 0) - (a.metadata?.goldPerHour || 0);
      });
      
      // Return paginated results
      return sorted.slice(offset, offset + limit).map((entry, index) => ({
        ...entry,
        rank: offset + index + 1,
        value: args.sortBy === 'perHour' ? entry.metadata?.goldPerHour || 0 : entry.value
      }));
    }
    
    // For topMeks with custom sorting
    if (args.category === 'topMeks' && args.sortBy && args.sortBy !== 'goldPerHour') {
      const entries = await ctx.db
        .query("leaderboardCache")
        .withIndex("", (q: any) => q.eq("category", args.category))
        .take(Math.min(offset + limit + 10, 200));
      
      // Re-sort based on the requested field
      const sorted = entries.sort((a, b) => {
        switch (args.sortBy) {
          case 'goldTotal':
            return (b.metadata?.topMek?.totalGold || 0) - (a.metadata?.topMek?.totalGold || 0);
          case 'essenceTotal':
            return (b.metadata?.topMek?.totalEssence || 0) - (a.metadata?.topMek?.totalEssence || 0);
          case 'essencePerHour':
            return (b.metadata?.topMek?.essenceRate || 0) - (a.metadata?.topMek?.essenceRate || 0);
          default:
            return (b.metadata?.topMek?.goldRate || 0) - (a.metadata?.topMek?.goldRate || 0);
        }
      });
      
      return sorted.slice(offset, offset + limit).map((entry, index) => ({
        ...entry,
        rank: offset + index + 1
      }));
    }
    
    // Default: Get from cache with pagination
    const cachedEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("", (q: any) => q.eq("category", args.category))
      .take(offset + limit)
      .then(entries => entries.slice(offset)); // Skip first 'offset' entries
    
    // If requested, append current user's position as 51st entry
    if (args.includeCurrentUser && args.currentUserId) {
      const userEntry = await ctx.db
        .query("leaderboardCache")
        .withIndex("", (q: any) => 
          q.eq("userId", args.currentUserId!).eq("category", args.category)
        )
        .first();
      
      // Only add if user exists and is not already in the top 50
      if (userEntry && userEntry.rank > limit) {
        return [
          ...cachedEntries,
          {
            ...userEntry,
            isCurrentUser: true, // Flag for special styling
          }
        ];
      }
    }
    
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
      .withIndex("", (q: any) => 
        q.eq("userId", args.userId!).eq("category", args.category)
      )
      .first();
    
    return userEntry?.rank || null;
  },
});

// Background job to update leaderboard cache - OPTIMIZED
export const updateLeaderboardCache = internalMutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    // Process ALL users for accurate rankings, but optimize data fetching
    const batchSize = 100; // Larger batches for efficiency
    
    // Get all users - we need complete rankings
    const users = await ctx.db.query("users").collect();
    
    // Skip processing for users with no meaningful data based on category
    const relevantUsers = users.filter((user: any) => {
      switch (args.category) {
        case "gold":
          return user.gold > 0;
        case "meks":
          return user.walletAddress !== "";
        case "essence":
          return Object.values(user.totalEssence || {}).some((v: any) => v > 0);
        case "achievements":
          return true; // Everyone can have achievements
        case "topMeks":
          return user.walletAddress !== "";
        default:
          return true;
      }
    });
    
    let leaderboardData: any[] = [];
    
    // Process users in batches
    for (let i = 0; i < relevantUsers.length; i += batchSize) {
      const batch = relevantUsers.slice(i, Math.min(i + batchSize, relevantUsers.length));
      
      const batchData = await Promise.all(
        batch.map(async (user) => {
          let value = 0;
          let metadata: any = {};
          
          switch (args.category) {
            case "gold":
              value = user.gold;
              metadata.goldPerHour = user.goldPerHour || 0;
              metadata.level = user.level || 1;
              break;
              
            case "meks":
              // OPTIMIZATION: Use cached mek count if available
              const userStats = await ctx.db
                .query("userStatsCache")
                .withIndex("", (q: any) => q.eq("userId", user._id))
                .first();
              
              const mekCount = userStats?.mekCount || 0;
              
              value = mekCount;
              
              // Simple metadata without fetching all meks
              metadata.mekDetails = {
                total: mekCount,
                topMekLevel: 0, // Will be updated separately if needed
              };
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
              // OPTIMIZATION: Only get top mek, not all meks
              const topMek = await ctx.db
                .query("meks")
                .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
                .take(10) // Only check first 10 meks
                .then(meks => {
                  if (meks.length === 0) return null;
                  // Find best mek from limited set
                  return meks.reduce((best, mek) => {
                    const mekGoldRate = (mek.goldRate || 0) + ((mek.level || 1) * 10);
                    const bestGoldRate = (best.goldRate || 0) + ((best.level || 1) * 10);
                    return mekGoldRate > bestGoldRate ? mek : best;
                  });
                });
              
              if (topMek) {
                const goldRate = (topMek.goldRate || 0) + ((topMek.level || 1) * 10);
                const essenceRate = (topMek.level || 1) * 0.5;
                
                value = goldRate;
                metadata.topMek = {
                  assetId: topMek.assetId,
                  assetName: topMek.assetName,
                  level: topMek.level || 1,
                  goldRate,
                  essenceRate,
                  totalGold: goldRate * (topMek.level || 1) * 100,
                  totalEssence: essenceRate * (topMek.level || 1) * 50,
                };
              }
              break;
          
            case "achievements":
              // OPTIMIZATION: Count achievements without fetching all data
              const achievementCount = await ctx.db
                .query("achievements")
                .withIndex("", (q: any) => q.eq("userId", user._id))
                .take(100) // Limit achievements
                .then(achievements => achievements.length);
              
              value = achievementCount * 100;
              metadata.achievementScore = value;
              metadata.level = user.level || 1;
              metadata.mekDetails = { total: 0 }; // Don't count meks here
              break;
          }
          
          return {
            userId: user._id,
            walletAddress: user.walletAddress,
            username: user.username,
            value,
            metadata,
          };
        })
      );
      
      leaderboardData.push(...batchData);
    }
    
    // Sort by value descending
    leaderboardData.sort((a, b) => b.value - a.value);
    
    // OPTIMIZATION: Batch delete existing cache entries
    const existingCache = await ctx.db
      .query("leaderboardCache")
      .withIndex("", (q: any) => q.eq("category", args.category))
      .take(1000); // Limit to prevent timeout
    
    // Delete in batches
    const deletePromises = existingCache.map((entry: any) => ctx.db.delete(entry._id));
    await Promise.all(deletePromises);
    
    // OPTIMIZATION: Cache top 50 for display, but keep all data for accurate rankings
    // We'll store everyone's rank but only show top 50 + user's position
    const topEntries = leaderboardData.slice(0, 100); // Keep 100 for buffer
    const timestamp = Date.now();
    
    // Insert top entries for display
    const insertPromises = topEntries.map((data, i) => 
      ctx.db.insert("leaderboardCache", {
        category: args.category,
        userId: data.userId,
        walletAddress: data.walletAddress,
        username: data.username,
        value: data.value,
        rank: i + 1,
        lastUpdated: timestamp,
        metadata: data.metadata,
      })
    );
    
    // Also cache entries for users outside top 100 so they can see their rank
    // Only store minimal data for these to save space
    const additionalUsers = leaderboardData.slice(100, Math.min(leaderboardData.length, 1000));
    const additionalInserts = additionalUsers.map((data, i) => 
      ctx.db.insert("leaderboardCache", {
        category: args.category,
        userId: data.userId,
        walletAddress: data.walletAddress,
        username: data.username,
        value: data.value,
        rank: 101 + i,
        lastUpdated: timestamp,
        metadata: undefined, // Minimal metadata to save space
      })
    );
    
    await Promise.all([...insertPromises, ...additionalInserts]);
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

// Update user stats cache - OPTIMIZED
export const updateUserStatsCache = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    
    // OPTIMIZATION: Count meks without fetching all data
    const mekCount = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
      .take(500) // Limit to 500 meks
      .then(meks => meks.length);
    
    // Calculate total essence
    const totalEssence = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);
    
    // Get bank balance
    const bankAccount = await ctx.db
      .query("bankAccounts")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .first();
    const bankBalance = bankAccount?.balance || 0;
    
    // OPTIMIZATION: Limit stock holdings query
    const stockHoldings = await ctx.db
      .query("stockHoldings")
      .withIndex("", (q: any) => q.eq("userId", user._id))
      .take(50) // Limit to 50 holdings
      .then(holdings => holdings.reduce((sum, holding) => sum + holding.currentValue, 0));
    
    // Calculate net worth
    const netWorth = user.gold + totalEssence + bankBalance + stockHoldings;
    
    // Check if cache exists
    const existingCache = await ctx.db
      .query("userStatsCache")
      .withIndex("", (q: any) => q.eq("userId", args.userId))
      .first();
    
    const cacheData = {
      userId: args.userId,
      mekCount,
      totalEssence,
      netWorth,
      goldPerHour: user.goldPerHour || 0,
      bankBalance,
      stockValue: stockHoldings,
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
      .withIndex("", (q: any) => q.eq("userId", args.userId))
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