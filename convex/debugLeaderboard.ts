import { v } from "convex/values";
import { query } from "./_generated/server";

// Debug query to check wallet's leaderboard visibility
export const checkWalletStatus = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, { walletAddress }) => {
    // Get the goldMining record
    const goldMiner = await ctx.db
      .query("goldMining")
      .filter(q => q.eq(q.field("walletAddress"), walletAddress))
      .first();

    if (!goldMiner) {
      return {
        found: false,
        message: "Wallet not found in goldMining table"
      };
    }

    // Get all verified wallets
    const verifiedWallets = await ctx.db
      .query("goldMining")
      .filter(q => q.eq(q.field("isBlockchainVerified"), true))
      .collect();

    return {
      found: true,
      walletAddress: goldMiner.walletAddress,
      isBlockchainVerified: goldMiner.isBlockchainVerified,
      totalCumulativeGold: goldMiner.totalCumulativeGold,
      accumulatedGold: goldMiner.accumulatedGold,
      totalGoldSpentOnUpgrades: goldMiner.totalGoldSpentOnUpgrades,
      totalGoldPerHour: goldMiner.totalGoldPerHour,
      companyName: goldMiner.companyName,
      mekCount: goldMiner.ownedMeks?.length || 0,
      totalVerifiedWallets: verifiedWallets.length,
      isInLeaderboard: verifiedWallets.some(w => w.walletAddress === walletAddress),
    };
  },
});
