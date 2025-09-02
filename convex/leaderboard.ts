import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// OPTIMIZED: Use cached leaderboard data
export const getTopPlayersByGold = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get from cache instead of querying all users
    const cachedEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .take(limit);
    
    if (cachedEntries.length > 0) {
      return cachedEntries.map((entry) => ({
        rank: entry.rank,
        walletAddress: entry.walletAddress,
        username: entry.username || `Mek Owner ${entry.walletAddress.slice(0, 6)}`,
        gold: entry.value,
        level: entry.metadata?.level ?? 1,
        achievementCount: 0,
        mekCount: entry.metadata?.mekDetails?.total || 0,
        totalGoldRate: entry.metadata?.goldPerHour ?? 0,
      }));
    }
    
    // Fallback: Query limited users if cache is empty
    const users = await ctx.db
      .query("users")
      .take(limit * 2); // Get more than needed for sorting
    
    const topUsers = users
      .sort((a, b) => (b.gold ?? 0) - (a.gold ?? 0))
      .slice(0, limit);
    
    return topUsers.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      username: user.username || `Mek Owner ${user.walletAddress.slice(0, 6)}`,
      gold: user.gold ?? 0,
      level: user.level ?? 1,
      achievementCount: 0,
      mekCount: 0, // Don't count meks in fallback to save bandwidth
      totalGoldRate: user.goldPerHour ?? 0,
    }));
  },
});

export const getTopPlayersByEssence = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    const users = await ctx.db
      .query("users")
      .collect();
    
    // Calculate total essence and sort to get top users
    const topUsers = users
      .map(user => {
        const essenceTotal = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);
        return { ...user, calculatedTotalEssence: essenceTotal };
      })
      .sort((a, b) => b.calculatedTotalEssence - a.calculatedTotalEssence)
      .slice(0, limit);
    
    // Count meks only for the top users
    const userMekCounts = await Promise.all(
      topUsers.map(async (user) => {
        const mekCount = await ctx.db
          .query("meks")
          .withIndex("by_owner", q => q.eq("owner", user.walletAddress))
          .collect()
          .then(meks => meks.length);
        return { walletAddress: user.walletAddress, count: mekCount };
      })
    );
    
    const mekCountMap = new Map(userMekCounts.map(item => [item.walletAddress, item.count]));
    
    return topUsers.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      username: user.username || `Mek Owner ${user.walletAddress.slice(0, 6)}`,
      totalEssence: user.calculatedTotalEssence,
      gold: user.gold ?? 0,
      level: user.level ?? 1,
      mekCount: mekCountMap.get(user.walletAddress) || 0,
    }));
  },
});

// OPTIMIZED: Use cached leaderboard data for mek counts
export const getTopPlayersByMekCount = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get from cache instead of counting all meks
    const cachedEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "meks"))
      .take(limit);
    
    if (cachedEntries.length > 0) {
      return cachedEntries.map((entry) => ({
        rank: entry.rank,
        walletAddress: entry.walletAddress,
        username: entry.username || `Mek Owner ${entry.walletAddress.slice(0, 6)}`,
        mekCount: entry.value,
        gold: 0, // Don't fetch gold to save bandwidth
        totalGoldRate: entry.metadata?.goldPerHour ?? 0,
        averageMekLevel: entry.metadata?.mekDetails?.topMekLevel ?? 1,
      }));
    }
    
    // Fallback: Very limited query if cache is empty
    const users = await ctx.db
      .query("users")
      .take(limit);
    
    return users.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      username: user.username || `Mek Owner ${user.walletAddress.slice(0, 6)}`,
      mekCount: 0, // Don't count in fallback
      gold: user.gold ?? 0,
      totalGoldRate: user.goldPerHour ?? 0,
      averageMekLevel: 1,
    }));
  },
});

export const getTopPlayersByAchievements = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    const users = await ctx.db
      .query("users")
      .collect();
    
    // For now, use level * 100 as achievement points placeholder
    return users
      .sort((a, b) => ((b.level ?? 1) * 100) - ((a.level ?? 1) * 100))
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        walletAddress: user.walletAddress,
        username: user.username || `Mek Owner ${user.walletAddress.slice(0, 6)}`,
        achievementCount: Math.floor((user.level ?? 1) * 3), // Placeholder
        achievementPoints: (user.level ?? 1) * 100, // Placeholder
        level: user.level ?? 1,
        gold: user.gold ?? 0,
      }));
  },
});

export const getTopMeksByLevel = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    const meks = await ctx.db
      .query("meks")
      .collect();
    
    return meks
      .sort((a, b) => {
        const levelDiff = (b.level ?? 1) - (a.level ?? 1);
        if (levelDiff !== 0) return levelDiff;
        return (b.experience ?? 0) - (a.experience ?? 0);
      })
      .slice(0, limit)
      .map((mek, index) => ({
        rank: index + 1,
        assetId: mek.assetId,
        assetName: mek.assetName,
        owner: mek.owner,
        level: mek.level ?? 1,
        xp: mek.experience ?? 0,
        goldRate: (mek.level ?? 1) * 3.5,
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        sourceKeyBase: mek.sourceKeyBase,
      }));
  },
});

// OPTIMIZED: Use cached leaderboard data instead of querying all users
export const getPlayerRank = query({
  args: {
    walletAddress: v.string(),
    category: v.union(v.literal("gold"), v.literal("essence"), v.literal("meks"), v.literal("achievements")),
  },
  handler: async (ctx, args) => {
    // First check if the user exists
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (!targetUser) return null;
    
    // Try to get rank from cache first
    const cachedEntry = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_user_category", q => 
        q.eq("userId", targetUser._id).eq("category", args.category)
      )
      .first();
    
    if (cachedEntry) {
      // Get total players count from cache
      const totalEntries = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_category_rank", q => q.eq("category", args.category))
        .collect();
      
      const targetEssenceTotal = Object.values(targetUser.totalEssence).reduce((sum, val) => sum + val, 0);
      
      return {
        rank: cachedEntry.rank,
        totalPlayers: totalEntries.length,
        percentile: Math.round(((totalEntries.length - cachedEntry.rank + 1) / totalEntries.length) * 100),
        walletAddress: targetUser.walletAddress,
        username: targetUser.username || `Mek Owner ${targetUser.walletAddress.slice(0, 6)}`,
        gold: targetUser.gold ?? 0,
        level: targetUser.level ?? 1,
        mekCount: cachedEntry.metadata?.mekDetails?.total || 0,
        achievementCount: Math.floor((targetUser.level ?? 1) * 3), // Placeholder
        achievementPoints: (targetUser.level ?? 1) * 100,
        totalEssence: targetEssenceTotal,
        totalGoldRate: targetUser.goldPerHour ?? 0,
      };
    }
    
    // If not in cache, calculate rank (but this should be rare)
    // Only query top 100 users to limit bandwidth
    const users = await ctx.db
      .query("users")
      .take(100);
    
    let targetMekCount = 0;
    if (args.category === "meks") {
      const meks = await ctx.db
        .query("meks")
        .withIndex("by_owner", q => q.eq("owner", args.walletAddress))
        .take(100); // Limit mek count
      targetMekCount = meks.length;
    }
    
    let rank = 1;
    let betterCount = 0;
    
    for (const user of users) {
      if (user.walletAddress === args.walletAddress) continue;
      
      let isBetter = false;
      switch (args.category) {
        case "gold":
          isBetter = (user.gold ?? 0) > (targetUser.gold ?? 0);
          break;
        case "essence":
          const userEssence = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);
          const targetEssence = Object.values(targetUser.totalEssence).reduce((sum, val) => sum + val, 0);
          isBetter = userEssence > targetEssence;
          break;
        case "meks":
          // Simplified - don't count other users' meks
          isBetter = false;
          break;
        case "achievements":
          isBetter = (user.level ?? 1) > (targetUser.level ?? 1);
          break;
      }
      
      if (isBetter) betterCount++;
    }
    
    rank = betterCount + 1;
    const targetEssenceTotal = Object.values(targetUser.totalEssence).reduce((sum, val) => sum + val, 0);
    
    return {
      rank: rank,
      totalPlayers: users.length,
      percentile: Math.round(((users.length - rank + 1) / users.length) * 100),
      walletAddress: targetUser.walletAddress,
      username: targetUser.username || `Mek Owner ${targetUser.walletAddress.slice(0, 6)}`,
      gold: targetUser.gold ?? 0,
      level: targetUser.level ?? 1,
      mekCount: targetMekCount,
      achievementCount: Math.floor((targetUser.level ?? 1) * 3),
      achievementPoints: (targetUser.level ?? 1) * 100,
      totalEssence: targetEssenceTotal,
      totalGoldRate: targetUser.goldPerHour ?? 0,
    };
  },
});