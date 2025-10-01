import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug utility to find all wallets with gold invariant violations
 * This helps identify data corruption issues
 */
export const findBrokenInvariants = query({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("goldMining").collect();
    const brokenRecords = [];

    for (const record of allRecords) {
      const accumulated = record.accumulatedGold || 0;
      const cumulative = record.totalCumulativeGold || 0;
      const spent = record.totalGoldSpentOnUpgrades || 0;

      // Check if invariant is violated: cumulative >= accumulated + spent
      const expectedMinimum = accumulated + spent;
      const isViolated = cumulative > 0 && cumulative < expectedMinimum;

      if (isViolated) {
        brokenRecords.push({
          walletAddress: record.walletAddress.substring(0, 20) + "...",
          accumulatedGold: accumulated,
          totalCumulativeGold: cumulative,
          totalSpent: spent,
          expectedMinimum,
          shortfall: expectedMinimum - cumulative,
          mekCount: record.ownedMeks.length,
          isVerified: record.isBlockchainVerified || false
        });
      }
    }

    return {
      totalWallets: allRecords.length,
      brokenCount: brokenRecords.length,
      broken: brokenRecords.sort((a, b) => b.shortfall - a.shortfall)
    };
  }
});

/**
 * Fix all wallets with broken invariants by setting totalCumulativeGold
 * to the minimum valid value
 */
export const fixAllBrokenInvariants = mutation({
  args: {
    dryRun: v.optional(v.boolean()) // If true, just report what would be fixed
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true; // Default to dry run for safety
    const allRecords = await ctx.db.query("goldMining").collect();
    const fixes = [];

    for (const record of allRecords) {
      const accumulated = record.accumulatedGold || 0;
      const cumulative = record.totalCumulativeGold || 0;
      const spent = record.totalGoldSpentOnUpgrades || 0;

      // Check if invariant is violated OR cumulative is uninitialized
      const expectedMinimum = accumulated + spent;
      const needsFix = cumulative === 0 || cumulative < expectedMinimum;

      if (needsFix) {
        const fixData = {
          walletAddress: record.walletAddress.substring(0, 20) + "...",
          before: {
            accumulatedGold: accumulated,
            totalCumulativeGold: cumulative,
            totalSpent: spent
          },
          after: {
            accumulatedGold: accumulated, // unchanged
            totalCumulativeGold: expectedMinimum, // corrected
            totalSpent: spent // unchanged
          },
          correction: expectedMinimum - cumulative
        };

        fixes.push(fixData);

        if (!dryRun) {
          await ctx.db.patch(record._id, {
            totalCumulativeGold: expectedMinimum
          });
        }
      }
    }

    return {
      dryRun,
      totalWallets: allRecords.length,
      fixedCount: fixes.length,
      fixes: fixes.sort((a, b) => b.correction - a.correction),
      message: dryRun
        ? "DRY RUN - No changes made. Set dryRun=false to apply fixes."
        : `Fixed ${fixes.length} wallet(s)`
    };
  }
});

/**
 * Diagnostic query to show detailed gold state for a specific wallet
 */
export const inspectWalletGold = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!record) {
      return {
        found: false,
        message: "Wallet not found"
      };
    }

    const accumulated = record.accumulatedGold || 0;
    const cumulative = record.totalCumulativeGold || 0;
    const spent = record.totalGoldSpentOnUpgrades || 0;
    const expectedMinimum = accumulated + spent;

    // Check invariant
    const isValid = cumulative === 0 || cumulative >= expectedMinimum;

    return {
      found: true,
      walletAddress: record.walletAddress,
      state: {
        accumulatedGold: accumulated,
        totalCumulativeGold: cumulative,
        totalGoldSpentOnUpgrades: spent,
        goldPerHour: record.totalGoldPerHour,
        mekCount: record.ownedMeks.length,
        isVerified: record.isBlockchainVerified || false,
        lastSnapshotTime: record.lastSnapshotTime || null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      },
      invariant: {
        isValid,
        expectedMinimum,
        currentCumulative: cumulative,
        shortfall: isValid ? 0 : expectedMinimum - cumulative,
        formula: "totalCumulativeGold >= accumulatedGold + totalSpent",
        check: `${cumulative} >= ${accumulated} + ${spent} (${expectedMinimum})`
      }
    };
  }
});
