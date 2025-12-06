import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ADMIN TOOL: Validates and fixes gold invariant violations
 *
 * The critical invariant: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
 *
 * This tool:
 * 1. Scans all goldMining records
 * 2. Identifies violations
 * 3. Optionally fixes them by initializing totalCumulativeGold correctly
 */

// Query to check for violations (read-only)
export const checkGoldInvariantViolations = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();
    const violations = [];
    const warnings = [];
    const valid = [];

    for (const miner of allMiners) {
      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;
      const expected = accumulated + spent;

      // Check if cumulative is uninitialized
      if (cumulative === 0 && (accumulated > 0 || spent > 0)) {
        warnings.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          issue: "totalCumulativeGold not initialized",
          accumulated,
          cumulative,
          spent,
          expected
        });
      }
      // Check if cumulative is less than expected
      else if (cumulative > 0 && cumulative < expected) {
        violations.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          issue: "totalCumulativeGold < accumulatedGold + totalSpent",
          accumulated,
          cumulative,
          spent,
          expected,
          deficit: expected - cumulative
        });
      }
      // Valid record
      else {
        valid.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          accumulated,
          cumulative,
          spent
        });
      }
    }

    return {
      total: allMiners.length,
      violations: violations.length,
      warnings: warnings.length,
      valid: valid.length,
      violationDetails: violations,
      warningDetails: warnings,
      summary: {
        critical: violations.length > 0 ? "⚠️ VIOLATIONS FOUND - Run fixGoldInvariantViolations to repair" : "✅ No violations",
        warnings: warnings.length > 0 ? `⚠️ ${warnings.length} records need initialization` : "✅ All records initialized"
      }
    };
  }
});

// Mutation to fix violations (write operation)
export const fixGoldInvariantViolations = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, just simulate the fix
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun === true;
    const allMiners = await ctx.db.query("goldMining").collect();
    const fixed = [];
    const skipped = [];

    for (const miner of allMiners) {
      const accumulated = miner.accumulatedGold || 0;
      const cumulative = miner.totalCumulativeGold || 0;
      const spent = miner.totalGoldSpentOnUpgrades || 0;
      const expected = accumulated + spent;

      // Case 1: Uninitialized cumulative gold (but has accumulated or spent gold)
      if (cumulative === 0 && (accumulated > 0 || spent > 0)) {
        if (!dryRun) {
          await ctx.db.patch(miner._id, {
            totalCumulativeGold: expected,
            updatedAt: Date.now()
          });
        }
        fixed.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          action: "initialized",
          oldCumulative: 0,
          newCumulative: expected,
          accumulated,
          spent
        });
      }
      // Case 2: Cumulative is less than expected (VIOLATION)
      else if (cumulative > 0 && cumulative < expected) {
        if (!dryRun) {
          await ctx.db.patch(miner._id, {
            totalCumulativeGold: expected,
            updatedAt: Date.now()
          });
        }
        fixed.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          action: "corrected",
          oldCumulative: cumulative,
          newCumulative: expected,
          accumulated,
          spent,
          deficit: expected - cumulative
        });
      }
      // Case 3: Valid record (cumulative >= expected)
      else {
        skipped.push({
          walletAddress: miner.walletAddress.substring(0, 20) + "...",
          reason: "already valid",
          accumulated,
          cumulative,
          spent
        });
      }
    }

    return {
      dryRun,
      total: allMiners.length,
      fixed: fixed.length,
      skipped: skipped.length,
      fixedDetails: fixed,
      message: dryRun
        ? `DRY RUN: Would fix ${fixed.length} records`
        : `✅ Fixed ${fixed.length} records. Invariant restored.`
    };
  }
});

// Query specific wallet details
export const checkWalletGoldDetails = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { found: false, message: "Wallet not found" };
    }

    const accumulated = miner.accumulatedGold || 0;
    const cumulative = miner.totalCumulativeGold || 0;
    const spent = miner.totalGoldSpentOnUpgrades || 0;
    const expected = accumulated + spent;

    const isValid = cumulative >= expected;
    const isInitialized = cumulative > 0 || (accumulated === 0 && spent === 0);

    return {
      found: true,
      walletAddress: args.walletAddress,
      values: {
        accumulatedGold: accumulated,
        totalCumulativeGold: cumulative,
        totalGoldSpentOnUpgrades: spent,
        expectedCumulative: expected
      },
      status: {
        isValid,
        isInitialized,
        message: !isInitialized
          ? "⚠️ totalCumulativeGold not initialized"
          : !isValid
          ? `❌ VIOLATION: cumulative (${cumulative}) < expected (${expected})`
          : `✅ Valid: cumulative (${cumulative}) >= expected (${expected})`
      },
      formula: {
        equation: "totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades",
        calculation: `${cumulative} >= ${accumulated} + ${spent}`,
        result: isValid ? "PASS" : "FAIL"
      }
    };
  }
});
