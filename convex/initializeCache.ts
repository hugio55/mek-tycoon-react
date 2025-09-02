import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Initialize all cache tables - run this once to populate initial data
export const initializeAllCaches = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting cache initialization...");
    
    // Initialize leaderboard cache for all categories
    const categories = ["gold", "meks", "essence", "topMeks", "achievements"];
    
    for (const category of categories) {
      console.log(`Initializing ${category} leaderboard...`);
      await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateLeaderboardCache, {
        category
      });
    }
    
    // Initialize user stats cache for all users
    console.log("Initializing user stats cache...");
    const users = await ctx.db.query("users").take(100); // Process first 100 users
    
    for (const user of users) {
      await ctx.scheduler.runAfter(0, internal.leaderboardOptimized.updateUserStatsCache, {
        userId: user._id
      });
    }
    
    return {
      success: true,
      message: "Cache initialization scheduled. Check logs for progress."
    };
  },
});