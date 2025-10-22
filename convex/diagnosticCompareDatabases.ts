import { query } from "./_generated/server";

// Compare key metrics between databases
export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    const [goldMiners, leaderboard, meks, users] = await Promise.all([
      ctx.db.query("goldMining").collect(),
      ctx.db.query("leaderboardCache").collect(),
      ctx.db.query("meks").collect(),
      ctx.db.query("users").collect(),
    ]);

    // Get top 5 gold miners
    const topMiners = goldMiners
      .sort((a, b) => (b.totalCumulativeGold || 0) - (a.totalCumulativeGold || 0))
      .slice(0, 5)
      .map(m => ({
        wallet: m.walletAddress.slice(0, 12) + "...",
        company: m.companyName,
        gold: m.totalCumulativeGold || m.accumulatedGold || 0,
        meks: m.ownedMeks?.length || 0,
      }));

    return {
      totalGoldMiners: goldMiners.length,
      totalUsers: users.length,
      totalMeks: meks.length,
      leaderboardEntries: leaderboard.length,
      topMiners,
      timestamp: Date.now(),
    };
  },
});
