/**
 * Gold Migration System - Phase 2 (Zero-Downtime Repair)
 *
 * Repairs corrupted totalCumulativeGold values while players continue playing.
 * Uses batch processing and version checking for safety.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateGoldInvariant } from "./lib/goldCalculations";

/**
 * Test repair on a single wallet (Step 2.2)
 * Use this to verify repair logic before running full migration
 */
export const testSingleWalletRepair = mutation({
  args: {
    walletAddress: v.string(),
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun !== false; // Default to dry run for safety

    // Find the wallet
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      throw new Error(`Wallet not found: ${args.walletAddress}`);
    }

    // Check current state
    const accumulated = miner.accumulatedGold || 0;
    const cumulative = miner.totalCumulativeGold || 0;
    const spent = miner.totalGoldSpentOnUpgrades || 0;
    const requiredMinimum = accumulated + spent;
    const deficit = requiredMinimum - cumulative;
    const needsRepair = deficit > 0;

    // Calculate what repair would do
    const beforeState = {
      accumulated,
      cumulative,
      spent,
      isValid: validateGoldInvariant(miner),
      deficit: deficit.toFixed(2)
    };

    if (!needsRepair) {
      return {
        success: true,
        needsRepair: false,
        message: "✅ Wallet is already healthy - no repair needed",
        wallet: args.walletAddress.slice(0, 20) + '...',
        beforeState,
        wouldChange: false
      };
    }

    const afterState = {
      accumulated, // Stays the same
      cumulative: requiredMinimum, // Fixed value
      spent, // Stays the same
      isValid: true, // Will be valid after repair
      deficit: "0.00"
    };

    // If dry run, just show what would happen
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        needsRepair: true,
        message: "🔍 DRY RUN - No changes made (set dryRun: false to apply)",
        wallet: args.walletAddress.slice(0, 20) + '...',
        beforeState,
        afterState,
        repairAction: `Would add ${deficit.toFixed(2)} to cumulative gold`,
        wouldChange: true
      };
    }

    // Actually perform the repair
    await ctx.db.patch(miner._id, {
      totalCumulativeGold: requiredMinimum,
      updatedAt: Date.now(),
      version: (miner.version || 0) + 1
    });

    // Verify repair succeeded
    const repairedMiner = await ctx.db.get(miner._id);
    const isNowValid = repairedMiner ? validateGoldInvariant(repairedMiner) : false;

    return {
      success: true,
      dryRun: false,
      needsRepair: true,
      message: isNowValid
        ? "✅ Repair successful - wallet is now healthy"
        : "❌ Repair failed - wallet still invalid",
      wallet: args.walletAddress.slice(0, 20) + '...',
      beforeState,
      afterState,
      repairAction: `Added ${deficit.toFixed(2)} to cumulative gold`,
      repairSucceeded: isNowValid
    };
  }
});

/**
 * Repair gold data in batches (Step 2.3)
 * Processes up to batchSize records at a time, allowing concurrent player activity
 */
export const repairGoldDataBatch = mutation({
  args: {
    batchSize: v.optional(v.number()),
    skipHealthy: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 50; // Default 50 at a time
    const skipHealthy = args.skipHealthy !== false; // Default true

    const allMiners = await ctx.db.query("goldMining").collect();

    let processedCount = 0;
    let repairedCount = 0;
    let skippedCount = 0;
    let alreadyHealthyCount = 0;
    const repairs = [];

    for (const miner of allMiners) {
      // Stop if we've processed enough for this batch
      if (processedCount >= batchSize) {
        break;
      }

      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;
      const requiredMinimum = accumulated + spent;
      const deficit = requiredMinimum - cumulative;
      const needsRepair = deficit > 0;

      // Check if already healthy
      const isValid = validateGoldInvariant(miner);
      if (isValid && skipHealthy) {
        alreadyHealthyCount++;
        continue; // Skip healthy records
      }

      processedCount++;

      if (needsRepair) {
        // Perform repair
        await ctx.db.patch(miner._id, {
          totalCumulativeGold: requiredMinimum,
          updatedAt: Date.now(),
          version: (miner.version || 0) + 1
        });

        repairs.push({
          wallet: miner.walletAddress.slice(0, 20) + '...',
          oldCumulative: cumulative.toFixed(2),
          newCumulative: requiredMinimum.toFixed(2),
          deficitFixed: deficit.toFixed(2)
        });

        repairedCount++;
      } else {
        skippedCount++;
      }
    }

    const totalRecords = allMiners.length;
    const remainingToProcess = totalRecords - processedCount - alreadyHealthyCount;

    return {
      success: true,
      processed: processedCount,
      repaired: repairedCount,
      skipped: skippedCount,
      alreadyHealthy: alreadyHealthyCount,
      remaining: remainingToProcess,
      totalRecords,
      isComplete: remainingToProcess === 0,
      repairs: repairs.slice(0, 10), // Show first 10
      progress: `${processedCount + alreadyHealthyCount}/${totalRecords} (${((processedCount + alreadyHealthyCount) / totalRecords * 100).toFixed(1)}%)`,
      message: remainingToProcess === 0
        ? `✅ Migration complete! Repaired ${repairedCount} records.`
        : `⏳ In progress: ${remainingToProcess} records remaining`
    };
  }
});

/**
 * Run full migration - processes ALL records in one transaction
 * This is the main migration command for Step 2.3
 *
 * Note: With only 39 records, we can safely process all in one mutation.
 * For larger datasets, use repairGoldDataBatch multiple times.
 */
export const runFullMigration = mutation({
  args: { confirmCode: v.string() },
  handler: async (ctx, args) => {
    if (args.confirmCode !== "MIGRATE_CONFIRMED") {
      throw new Error(
        "Invalid confirmation code. To proceed, provide: { confirmCode: 'MIGRATE_CONFIRMED' }"
      );
    }

    console.log("[MIGRATION START] Beginning full gold data repair");

    const allMiners = await ctx.db.query("goldMining").collect();
    let totalRepaired = 0;
    let totalProcessed = 0;
    let alreadyHealthy = 0;
    const repairs = [];

    for (const miner of allMiners) {
      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;
      const requiredMinimum = accumulated + spent;
      const deficit = requiredMinimum - cumulative;
      const needsRepair = deficit > 0;

      // Check if already healthy
      const isValid = validateGoldInvariant(miner);
      if (isValid && !needsRepair) {
        alreadyHealthy++;
        continue;
      }

      totalProcessed++;

      if (needsRepair) {
        // Perform repair
        const oldCumulative = cumulative;
        await ctx.db.patch(miner._id, {
          totalCumulativeGold: requiredMinimum,
          updatedAt: Date.now(),
          version: (miner.version || 0) + 1
        });

        repairs.push({
          wallet: miner.walletAddress.slice(0, 20) + '...',
          oldCumulative: oldCumulative.toFixed(2),
          newCumulative: requiredMinimum.toFixed(2),
          deficitFixed: deficit.toFixed(2)
        });

        totalRepaired++;

        console.log(`[MIGRATION] Repaired wallet ${miner.walletAddress.slice(0, 20)}... (deficit: ${deficit.toFixed(2)})`);
      }
    }

    console.log(`[MIGRATION COMPLETE] Total repaired: ${totalRepaired}, Already healthy: ${alreadyHealthy}`);

    return {
      success: true,
      totalRecords: allMiners.length,
      totalRepaired,
      totalProcessed,
      alreadyHealthy,
      repairs: repairs.slice(0, 10), // Show first 10
      message: `✅ Migration complete! Repaired ${totalRepaired} records (${alreadyHealthy} were already healthy).`
    };
  }
});

/**
 * Verify all records pass invariant check (Step 3.2)
 * Run this after migration to ensure 100% success
 */
export const verifyMigrationSuccess = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    let validCount = 0;
    let stillCorruptedCount = 0;
    const stillCorrupted = [];

    for (const miner of allMiners) {
      const isValid = validateGoldInvariant(miner);

      if (isValid) {
        validCount++;
      } else {
        stillCorruptedCount++;

        if (stillCorrupted.length < 10) {
          const accumulated = miner.accumulatedGold || 0;
          const cumulative = miner.totalCumulativeGold || 0;
          const spent = miner.totalGoldSpentOnUpgrades || 0;

          stillCorrupted.push({
            wallet: miner.walletAddress.slice(0, 20) + '...',
            accumulated: accumulated.toFixed(2),
            cumulative: cumulative.toFixed(2),
            spent: spent.toFixed(2),
            required: (accumulated + spent).toFixed(2),
            deficit: ((accumulated + spent) - cumulative).toFixed(2)
          });
        }
      }
    }

    const successRate = (validCount / allMiners.length * 100).toFixed(2);

    return {
      total: allMiners.length,
      valid: validCount,
      stillCorrupted: stillCorruptedCount,
      successRate: `${successRate}%`,
      samples: stillCorrupted,
      migrationSuccessful: stillCorruptedCount === 0,
      verdict: stillCorruptedCount === 0
        ? "✅ MIGRATION SUCCESSFUL - All records pass invariant check!"
        : `❌ ${stillCorruptedCount} records still corrupted - review samples and re-run repair`
    };
  }
});

/**
 * Get current migration progress
 * Useful for monitoring during migration
 */
export const getMigrationProgress = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    let healthyCount = 0;
    let corruptedCount = 0;

    for (const miner of allMiners) {
      const isValid = validateGoldInvariant(miner);
      if (isValid) {
        healthyCount++;
      } else {
        corruptedCount++;
      }
    }

    return {
      total: allMiners.length,
      healthy: healthyCount,
      corrupted: corruptedCount,
      percentComplete: ((healthyCount / allMiners.length) * 100).toFixed(1) + '%',
      status: corruptedCount === 0 ? '✅ Complete' : '⏳ In Progress',
      needsRepair: corruptedCount
    };
  }
});
