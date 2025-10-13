import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { calculateGoldIncrease } from "./lib/goldCalculations";

// Admin function to investigate gold losses for a specific user
export const investigateUserGold = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldData) {
      return { error: "Wallet not found" };
    }

    const now = Date.now();
    const hoursSinceSnapshot = (now - (goldData.lastSnapshotTime || goldData.createdAt)) / (1000 * 60 * 60);
    const goldSinceSnapshot = goldData.totalGoldPerHour * hoursSinceSnapshot;

    // Calculate what they SHOULD have (uncapped)
    const uncappedCurrentGold = (goldData.accumulatedGold || 0) + goldSinceSnapshot;

    // What the system SHOWS them (capped at 50k)
    const cappedDisplayGold = Math.min(50000, uncappedCurrentGold);

    // Calculate lost gold using the invariant
    const totalCumulative = goldData.totalCumulativeGold || 0;
    const currentAccumulated = goldData.accumulatedGold || 0;
    const totalSpent = goldData.totalGoldSpentOnUpgrades || 0;

    // The "lost gold" is the difference
    // Invariant: totalCumulativeGold >= accumulatedGold + totalSpent
    // If this is violated or has a large gap, gold was destroyed
    const invariantDeficit = totalCumulative - (currentAccumulated + totalSpent);

    return {
      walletAddress: goldData.walletAddress,
      companyName: goldData.companyName || "None",
      mekCount: goldData.ownedMeks.length,
      goldPerHour: goldData.totalGoldPerHour,

      // Current state
      accumulatedGold: currentAccumulated,
      lastSnapshotTime: goldData.lastSnapshotTime,
      hoursSinceSnapshot: parseFloat(hoursSinceSnapshot.toFixed(2)),
      goldSinceSnapshot: parseFloat(goldSinceSnapshot.toFixed(2)),

      // What they should have vs what they have
      uncappedCurrentGold: parseFloat(uncappedCurrentGold.toFixed(2)),
      cappedDisplayGold: parseFloat(cappedDisplayGold.toFixed(2)),
      goldLostToDisplayCap: parseFloat((uncappedCurrentGold - cappedDisplayGold).toFixed(2)),

      // Lifetime tracking
      totalCumulativeGold: totalCumulative,
      totalGoldSpentOnUpgrades: totalSpent,

      // THE KEY NUMBER - Gold destroyed by bug
      invariantDeficit: parseFloat(invariantDeficit.toFixed(2)),

      // Account age
      createdAt: goldData.createdAt,
      accountAgeDays: parseFloat(((now - goldData.createdAt) / (1000 * 60 * 60 * 24)).toFixed(1)),

      // Recommendation
      recommendation: invariantDeficit > 0
        ? `SURPLUS: Cumulative is ${invariantDeficit.toFixed(2)} higher than accumulated+spent (normal if they've been capped)`
        : invariantDeficit < -0.01
        ? `DEFICIT: Add ${Math.abs(invariantDeficit).toFixed(2)} gold to restore lost balance`
        : "No deficit detected - gold tracking looks healthy"
    };
  },
});

// Find all users potentially affected by the gold cap bug
export const findAffectedUsers = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("goldMining").collect();

    const affectedUsers = [];

    for (const user of allUsers) {
      const totalCumulative = user.totalCumulativeGold || 0;
      const currentAccumulated = user.accumulatedGold || 0;
      const totalSpent = user.totalGoldSpentOnUpgrades || 0;

      // Skip users with no data
      if (totalCumulative === 0 && currentAccumulated === 0 && totalSpent === 0) {
        continue;
      }

      const invariantDeficit = totalCumulative - (currentAccumulated + totalSpent);

      // Flag users with:
      // 1. Gold close to 50k cap (45k-50k)
      // 2. High earning rate (>1000/hr)
      // 3. OR negative invariant (data corruption)
      const nearCap = currentAccumulated >= 45000 && currentAccumulated <= 50000;
      const highEarner = user.totalGoldPerHour > 1000;
      const hasDeficit = invariantDeficit < -0.01;

      if (nearCap || hasDeficit || (nearCap && highEarner)) {
        affectedUsers.push({
          walletAddress: user.walletAddress,
          companyName: user.companyName || "None",
          accumulatedGold: currentAccumulated,
          totalCumulativeGold: totalCumulative,
          totalSpent: totalSpent,
          goldPerHour: user.totalGoldPerHour,
          invariantDeficit: parseFloat(invariantDeficit.toFixed(2)),
          flags: {
            nearCap,
            highEarner,
            hasDeficit
          }
        });
      }
    }

    // Sort by deficit (most affected first)
    affectedUsers.sort((a, b) => a.invariantDeficit - b.invariantDeficit);

    return {
      totalUsers: allUsers.length,
      affectedCount: affectedUsers.length,
      affectedUsers
    };
  },
});

// Restore lost gold for a user (calculates exact amount at execution time)
export const restoreLostGold = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const goldData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldData) {
      throw new Error("Wallet not found");
    }

    // STEP 1: Calculate current gold RIGHT NOW (with time accumulation)
    const hoursSinceSnapshot = (now - (goldData.lastSnapshotTime || goldData.createdAt)) / (1000 * 60 * 60);
    const goldSinceSnapshot = goldData.totalGoldPerHour * hoursSinceSnapshot;
    const currentGold = (goldData.accumulatedGold || 0) + goldSinceSnapshot;

    // STEP 2: Calculate the invariant deficit (what was lost to the bug)
    const totalCumulative = goldData.totalCumulativeGold || 0;
    const totalSpent = goldData.totalGoldSpentOnUpgrades || 0;

    // Invariant: totalCumulativeGold = accumulatedGold + totalSpent
    // If accumulatedGold was destroyed by bug, this will be positive
    const goldToRestore = totalCumulative - (currentGold + totalSpent);

    if (goldToRestore <= 0) {
      return {
        success: false,
        message: `No gold needs to be restored. Current balance: ${currentGold.toFixed(2)}, Invariant is healthy.`,
        goldRestored: 0,
        newBalance: currentGold
      };
    }

    // STEP 3: Add the lost gold back using the centralized function
    const goldIncrease = calculateGoldIncrease(
      {
        ...goldData,
        accumulatedGold: currentGold, // Use calculated current gold
        lastSnapshotTime: now
      },
      goldToRestore
    );

    // STEP 4: Update the database with restored gold
    await ctx.db.patch(goldData._id, {
      accumulatedGold: goldIncrease.newAccumulatedGold,
      totalCumulativeGold: goldIncrease.newTotalCumulativeGold,
      lastSnapshotTime: now,
      updatedAt: now,
    });

    // STEP 5: Log the restoration
    await ctx.db.insert("auditLogs", {
      type: "goldRestoration",
      timestamp: now,
      createdAt: now,
      stakeAddress: args.walletAddress,
      goldBefore: currentGold,
      goldAfter: goldIncrease.newAccumulatedGold,
      goldRestored: goldToRestore,
      reason: "Bug fix: Restored gold lost to 50k cap during spending",
      cumulativeGoldBefore: goldData.totalCumulativeGold,
      cumulativeGoldAfter: goldIncrease.newTotalCumulativeGold,
    });

    return {
      success: true,
      message: `Successfully restored ${goldToRestore.toFixed(2)} gold`,
      goldRestored: goldToRestore,
      oldBalance: currentGold,
      newBalance: goldIncrease.newAccumulatedGold,
      cumulativeBefore: goldData.totalCumulativeGold,
      cumulativeAfter: goldIncrease.newTotalCumulativeGold,
    };
  },
});
