import { mutation } from "./_generated/server";

// Delete all accounts with 0 Meks (test/mock accounts)
export const deleteZeroMekAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedCount = 0;

    // Delete from goldMining table - any account with no Meks
    const goldMiningEntries = await ctx.db.query("goldMining").collect();
    for (const entry of goldMiningEntries) {
      const mekCount = entry.ownedMeks?.length || 0;

      if (mekCount === 0) {
        await ctx.db.delete(entry._id);
        deletedCount++;
        console.log(`Deleted goldMining entry (0 Meks): ${entry.companyName || entry.walletAddress}`);
      }
    }

    // Delete from leaderboardCache table - any entry with 0 Meks
    const cacheEntries = await ctx.db.query("leaderboardCache").collect();
    for (const entry of cacheEntries) {
      const mekCount = entry.metadata?.mekDetails?.total || 0;

      if (mekCount === 0) {
        await ctx.db.delete(entry._id);
        deletedCount++;
        console.log(`Deleted leaderboardCache entry (0 Meks): ${entry.username || entry.walletAddress}`);
      }
    }

    console.log(`Total 0-Mek accounts deleted: ${deletedCount}`);

    return {
      success: true,
      deletedCount,
    };
  },
});
