import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { addEssenceToBalance } from "./lib/essenceHelpers";

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

    // Use helper to safely add essence (prevents duplicates)
    await addEssenceToBalance(ctx, {
      walletAddress,
      variationId: 0, // Admin doesn't need specific variation IDs
      variationName,
      variationType: "item" as const,
      amountToAdd: amount,
    });

    // Get updated balance to show in response
    const updatedBalance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_name", (q) =>
        q.eq("walletAddress", walletAddress).eq("variationName", variationName)
      )
      .first();

    const newAmount = updatedBalance?.accumulatedAmount || amount;

    return {
      success: true,
      newAmount,
      message: `Added ${amount} ${variationName} essence. New balance: ${newAmount.toFixed(2)}`
    };
  },
});

// Admin action to run migration: delete all test essence balances
// This calls the internal migration function for clean slate
// Safe to run - balances will recreate when players slot Meks with proper lastSnapshotTime
export const runEssenceBalanceMigration = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; deleted: number; message: string }> => {
    console.log('[Admin] Running essence balance migration (delete all test data)...');

    const result = await ctx.runMutation(internal.essence.deleteTestEssenceBalances);

    console.log('[Admin] Migration complete:', result);

    return result;
  }
});
