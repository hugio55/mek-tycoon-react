import { mutation } from "./_generated/server";
import { devLog } from "./lib/devLog";

/**
 * ADMIN: Fix corrupted cumulative gold values
 *
 * This repairs records where totalCumulativeGold < accumulatedGold + totalSpent
 * which violates the gold invariant and causes errors.
 *
 * The fix sets: totalCumulativeGold = accumulatedGold + totalSpent
 * This is the minimum valid value that satisfies the invariant.
 */
export const fixCorruptedCumulativeGold = mutation({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    let fixedCount = 0;
    const fixedWallets = [];

    for (const miner of allMiners) {
      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;

      // Calculate what cumulative SHOULD be
      const requiredCumulative = accumulated + spent;

      // If cumulative is less than required, fix it
      if (cumulative < requiredCumulative) {
        devLog.log(`[FIX GOLD] Repairing ${miner.walletAddress.substring(0, 20)}...`, {
          oldCumulative: cumulative,
          newCumulative: requiredCumulative,
          accumulated,
          spent,
          deficit: requiredCumulative - cumulative
        });

        await ctx.db.patch(miner._id, {
          totalCumulativeGold: requiredCumulative,
          updatedAt: Date.now()
        });

        fixedCount++;
        fixedWallets.push({
          wallet: miner.walletAddress.substring(0, 20) + '...',
          oldCumulative: cumulative,
          newCumulative: requiredCumulative,
          deficit: requiredCumulative - cumulative
        });
      }
    }

    devLog.log(`[FIX GOLD] Repair complete: ${fixedCount} records fixed out of ${allMiners.length} total`);

    return {
      success: true,
      totalRecords: allMiners.length,
      fixedCount,
      fixedWallets
    };
  }
});
