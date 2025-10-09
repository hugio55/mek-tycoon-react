import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check mekLevels for a wallet
export const getMekLevelsForWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return mekLevels.map(level => ({
      assetId: level.assetId,
      mekNumber: level.mekNumber,
      currentLevel: level.currentLevel,
      baseGoldPerHour: level.baseGoldPerHour,
      currentBoostPercent: level.currentBoostPercent,
      currentBoostAmount: level.currentBoostAmount,
      totalGoldSpent: level.totalGoldSpent,
    }));
  },
});
