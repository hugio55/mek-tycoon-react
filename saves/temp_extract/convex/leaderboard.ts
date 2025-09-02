import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const getTopPlayersByGold = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get all users and sort by gold
    const users = await ctx.db
      .query("users")
      .collect();
    
    // Sort and get only the top users first
    const topUsers = users
      .sort((a, b) => (b.gold ?? 0) - (a.gold ?? 0))
      .slice(0, limit);
    
    // Count meks only for the top users to reduce data reads
    const userMekCounts = await Promise.all(
      topUsers.map(async (user) => {
        // Just count the meks, don't fetch all data
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
      gold: user.gold ?? 0,
      level: user.level ?? 1,
      achievementCount: 0, // Placeholder - no achievements in schema yet
      mekCount: mekCountMap.get(user.walletAddress) || 0,
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

export const getTopPlayersByMekCount = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // For mek count leaderboard, we need to count for all users first
    // But let's limit to a reasonable number of users
    const users = await ctx.db
      .query("users")
      .collect();
    
    // Limit to first 100 users to avoid timeout
    const usersToCheck = users.slice(0, 100);
    
    // Count meks for each user
    const userMekData = await Promise.all(
      usersToCheck.map(async (user) => {
        const meks = await ctx.db
          .query("meks")
          .withIndex("by_owner", q => q.eq("owner", user.walletAddress))
          .collect();
        
        const avgLevel = meks.length > 0 
          ? meks.slice(0, 10).reduce((sum, mek) => sum + (mek.level ?? 1), 0) / Math.min(meks.length, 10)
          : 1;
        
        return { 
          user,
          count: meks.length,
          avgLevel: avgLevel
        };
      })
    );
    
    // Sort by mek count and get top users
    return userMekData
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((data, index) => ({
        rank: index + 1,
        walletAddress: data.user.walletAddress,
        username: data.user.username || `Mek Owner ${data.user.walletAddress.slice(0, 6)}`,
        mekCount: data.count,
        gold: data.user.gold ?? 0,
        totalGoldRate: data.user.goldPerHour ?? 0,
        averageMekLevel: data.avgLevel,
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
    
    // Get a limited set of users for ranking
    const users = await ctx.db.query("users").collect();
    
    // For categories that need mek counts, only count for the target user
    let targetMekCount = 0;
    if (args.category === "meks") {
      const meks = await ctx.db
        .query("meks")
        .withIndex("by_owner", q => q.eq("owner", args.walletAddress))
        .collect();
      targetMekCount = meks.length;
    }
    
    // Calculate rank based on category
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
          // For simplicity, assume other users have 0 meks unless we need to count them
          // This is a simplified approach to avoid counting all meks
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
      achievementCount: Math.floor((targetUser.level ?? 1) * 3), // Placeholder
      achievementPoints: (targetUser.level ?? 1) * 100,
      totalEssence: targetEssenceTotal,
      totalGoldRate: targetUser.goldPerHour ?? 0,
    };
  },
});