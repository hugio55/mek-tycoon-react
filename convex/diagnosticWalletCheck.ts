import { query } from "./_generated/server";
import { v } from "convex/values";

// Diagnostic query to check if a wallet has goldMining data
export const checkWalletData = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, { walletAddress }) => {
    console.log('[DIAGNOSTIC] Checking wallet:', walletAddress);

    // Check goldMining record
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMining) {
      console.log('[DIAGNOSTIC] ❌ No goldMining record found');
      return {
        exists: false,
        message: "No goldMining record exists for this wallet. You need to connect on the website first.",
      };
    }

    console.log('[DIAGNOSTIC] ✅ goldMining record found:', {
      companyName: goldMining.companyName,
      mekCount: goldMining.ownedMeks?.length || 0,
      goldPerHour: goldMining.totalGoldPerHour,
      isVerified: goldMining.isBlockchainVerified,
    });

    return {
      exists: true,
      companyName: goldMining.companyName,
      mekCount: goldMining.ownedMeks?.length || 0,
      goldPerHour: goldMining.totalGoldPerHour,
      accumulatedGold: goldMining.accumulatedGold,
      isVerified: goldMining.isBlockchainVerified,
      message: "goldMining record exists!",
    };
  },
});
