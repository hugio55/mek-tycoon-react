import { mutation } from "./_generated/server";
import { devLog } from "./lib/devLog";

/**
 * Diagnostic: Find wallets with corrupted cumulative gold values
 */
export const findCorruptedGoldRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    const corrupted = [];

    for (const miner of allMiners) {
      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;

      // Check if cumulative is less than accumulated + spent
      if (cumulative > 0 && cumulative < accumulated + spent) {
        corrupted.push({
          wallet: miner.walletAddress.substring(0, 20) + '...',
          fullWallet: miner.walletAddress,
          accumulated,
          cumulative,
          spent,
          deficit: (accumulated + spent) - cumulative,
          mekCount: miner.ownedMeks.length,
          isVerified: miner.isBlockchainVerified
        });
      }
    }

    devLog.log(`[GOLD DIAGNOSTIC] Found ${corrupted.length} corrupted records out of ${allMiners.length} total`);

    return {
      totalRecords: allMiners.length,
      corruptedCount: corrupted.length,
      corruptedRecords: corrupted
    };
  }
});
