import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all players for admin dropdown
export const getAllPlayers = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    return allMiners.map(miner => ({
      walletAddress: miner.walletAddress,
      corporationName: miner.companyName || "Unnamed Corporation",
      stakeAddress: null, // goldMining doesn't have stake address stored
    }));
  },
});

// Admin mutation to add essence directly to a player
export const adminAddEssenceToPlayer = mutation({
  args: {
    walletAddress: v.string(),
    variationName: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, variationName, amount } = args;

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Find the variation by name to get its ID
    const now = Date.now();

    // Try to find existing balance
    const existingBalance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    const balance = existingBalance.find(b => b.variationName === variationName);

    if (balance) {
      // Update existing balance
      await ctx.db.patch(balance._id, {
        accumulatedAmount: balance.accumulatedAmount + amount,
        lastUpdated: now,
      });

      return {
        success: true,
        newAmount: balance.accumulatedAmount + amount,
        message: `Added ${amount} ${variationName} essence. New balance: ${(balance.accumulatedAmount + amount).toFixed(2)}`
      };
    } else {
      // Create new balance
      await ctx.db.insert("essenceBalances", {
        walletAddress,
        variationId: 0, // Placeholder - doesn't matter for admin addition
        variationName,
        variationType: "item" as const,
        accumulatedAmount: amount,
        lastUpdated: now,
      });

      return {
        success: true,
        newAmount: amount,
        message: `Created new ${variationName} essence balance: ${amount.toFixed(2)}`
      };
    }
  },
});
