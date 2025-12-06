/**
 * Phase 1: Gold Migration Diagnostic Functions
 *
 * CRITICAL: These are READ-ONLY diagnostic functions for Phase 1
 * They do NOT modify any data - they only analyze and report
 *
 * Purpose: Identify corrupted gold records before migration
 * Created: 2025-11-02
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { validateGoldInvariant } from "./lib/goldCalculations";

/**
 * Counts how many gold mining records need repair
 * Categorizes records into: healthy, corrupted, uninitialized
 *
 * Returns diagnostic summary with samples for review
 */
export const countCorruptedRecords = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    let corruptedCount = 0;
    let healthyCount = 0;
    let uninitializedCount = 0;
    const corruptedSamples = [];

    for (const miner of allMiners) {
      const isValid = validateGoldInvariant(miner);
      const cumulative = miner.totalCumulativeGold || 0;
      const accumulated = miner.accumulatedGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;

      // Uninitialized: cumulative is 0 but there's accumulated or spent gold
      if (cumulative === 0 && (accumulated > 0 || spent > 0)) {
        uninitializedCount++;
      }
      // Corrupted: fails invariant validation
      else if (!isValid) {
        corruptedCount++;
        if (corruptedSamples.length < 10) {
          corruptedSamples.push({
            wallet: miner.walletAddress.slice(0, 20) + '...',
            accumulated,
            cumulative,
            spent,
            deficit: (accumulated + spent) - cumulative
          });
        }
      }
      // Healthy: passes all checks
      else {
        healthyCount++;
      }
    }

    return {
      total: allMiners.length,
      healthy: healthyCount,
      corrupted: corruptedCount,
      uninitialized: uninitializedCount,
      needsRepair: corruptedCount + uninitializedCount,
      samples: corruptedSamples,
      estimatedTime: Math.ceil((corruptedCount + uninitializedCount) / 100) + ' minutes',
      recommendation:
        (corruptedCount + uninitializedCount) / allMiners.length > 0.5
          ? "⚠️ WARNING: Over 50% of records need repair. Investigate root cause before proceeding."
          : "✅ Safe to proceed with migration"
    };
  }
});

/**
 * Detailed diagnosis of a specific wallet's gold state
 * Shows exactly what's wrong and what repair action would be taken
 *
 * @param walletAddress - The wallet address to diagnose
 * @returns Detailed diagnostic report
 */
export const diagnoseWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return {
        error: "Wallet not found",
        walletAddress: args.walletAddress
      };
    }

    const accumulated = miner.accumulatedGold || 0;
    const cumulative = miner.totalCumulativeGold || 0;
    const spent = miner.totalGoldSpentOnUpgrades || 0;
    const requiredMinimum = accumulated + spent;
    const deficit = requiredMinimum - cumulative;

    return {
      wallet: args.walletAddress,
      companyName: miner.companyName || "N/A",
      currentState: {
        accumulated,
        cumulative,
        spent,
        requiredMinimum
      },
      isValid: validateGoldInvariant(miner),
      needsRepair: deficit > 0,
      repairAction: deficit > 0
        ? `Add ${deficit.toFixed(2)} to cumulative (${cumulative} → ${requiredMinimum})`
        : "No repair needed",
      wouldChange: deficit !== 0,
      diagnosis: cumulative === 0 && (accumulated > 0 || spent > 0)
        ? "UNINITIALIZED: Cumulative never set (old record before Oct 13, 2025)"
        : deficit > 0
        ? "CORRUPTED: Invariant violation (cumulative < accumulated + spent)"
        : "HEALTHY: All gold values are correct"
    };
  }
});

/**
 * Get a list of all wallets that need repair
 * Useful for batch processing and progress tracking
 *
 * @returns List of wallet addresses that need repair
 */
export const listWalletsNeedingRepair = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    const walletsNeedingRepair = [];

    for (const miner of allMiners) {
      const isValid = validateGoldInvariant(miner);
      const cumulative = miner.totalCumulativeGold || 0;
      const accumulated = miner.accumulatedGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;

      // Check if needs repair (either uninitialized or corrupted)
      if (cumulative === 0 && (accumulated > 0 || spent > 0)) {
        walletsNeedingRepair.push({
          wallet: miner.walletAddress,
          companyName: miner.companyName || "N/A",
          type: "uninitialized",
          deficit: (accumulated + spent)
        });
      } else if (!isValid) {
        walletsNeedingRepair.push({
          wallet: miner.walletAddress,
          companyName: miner.companyName || "N/A",
          type: "corrupted",
          deficit: (accumulated + spent) - cumulative
        });
      }
    }

    return {
      count: walletsNeedingRepair.length,
      wallets: walletsNeedingRepair
    };
  }
});
