import { query } from "./_generated/server";

// List all gold mining accounts for debugging
export const listAllGoldMiningAccounts = query({
  args: {},
  handler: async (ctx) => {
    const allAccounts = await ctx.db.query("goldMining").collect();

    return allAccounts.map((account: any) => ({
      _id: account._id,
      walletAddress: account.walletAddress,
      companyName: account.companyName,
      currentGold: account.totalCumulativeGold || account.accumulatedGold || 0,
      totalGoldPerHour: account.totalGoldPerHour || 0,
      mekCount: account.ownedMeks?.length || 0,
      isBlockchainVerified: account.isBlockchainVerified,
    }));
  },
});
