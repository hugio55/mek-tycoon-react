import { mutation } from "./_generated/server";

// Delete mock/test accounts from the database
export const deleteMockAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    const mockCompanyNames = [
      "PartsMaster",
      "ChromeLord",
      "MekTrader42",
      "EssenceKing",
      "RareCollector",
    ];

    let deletedCount = 0;

    // Delete from goldMining table
    const goldMiningEntries = await ctx.db.query("goldMining").collect();
    for (const entry of goldMiningEntries) {
      // Check if wallet contains "demo_wal" OR company name matches mock names
      const isDemoWallet = entry.walletAddress && entry.walletAddress.toLowerCase().includes("demo_wal");
      const isMockCompany = entry.companyName && mockCompanyNames.includes(entry.companyName);

      if (isDemoWallet || isMockCompany) {
        await ctx.db.delete(entry._id);
        deletedCount++;
        console.log(`Deleted goldMining entry: ${entry.companyName || entry.walletAddress}`);
      }
    }

    // Delete from leaderboardCache table
    const cacheEntries = await ctx.db.query("leaderboardCache").collect();
    for (const entry of cacheEntries) {
      const isDemoWallet = entry.walletAddress && entry.walletAddress.toLowerCase().includes("demo_wal");
      const isMockCompany = entry.username && mockCompanyNames.includes(entry.username);

      if (isDemoWallet || isMockCompany) {
        await ctx.db.delete(entry._id);
        deletedCount++;
        console.log(`Deleted leaderboardCache entry: ${entry.username || entry.walletAddress}`);
      }
    }

    console.log(`Total mock accounts deleted: ${deletedCount}`);

    return {
      success: true,
      deletedCount,
    };
  },
});
