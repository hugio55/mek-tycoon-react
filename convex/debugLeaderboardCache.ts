import { query } from "./_generated/server";

export const getLeaderboardCache = query({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_category_rank", q => q.eq("category", "gold"))
      .collect();

    return cache.sort((a, b) => a.rank - b.rank);
  },
});
