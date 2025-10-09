import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to see what's actually stored in the database
export const checkWalletMekData = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { error: "Wallet not found" };
    }

    // Get first 3 MEKs to inspect
    const sample = miner.ownedMeks.slice(0, 3).map(mek => ({
      assetId: mek.assetId.substring(0, 20) + "...",
      assetName: mek.assetName,
      policyId: mek.policyId.substring(0, 20) + "...",
      rarityRank: mek.rarityRank,
      imageUrl: mek.imageUrl,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
    }));

    return {
      walletAddress: args.walletAddress,
      totalMeks: miner.ownedMeks.length,
      sampleMeks: sample,
    };
  },
});
