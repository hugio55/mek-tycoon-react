import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { calculateGoldDecrease, validateGoldInvariant } from "./lib/goldCalculations";
import { devLog } from "./lib/devLog";
import { internal } from "./_generated/api";

// ============================================================================
// PHASE II: Helper to get gold mining data from new or old tables
// ============================================================================

async function getGoldMiningDataForWallet(ctx: any, walletAddress: string) {
  // PHASE II: First try the new normalized tables
  let user = await ctx.db
    .query("users")
    .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress))
    .first();

  // Fallback: try legacy walletAddress field
  if (!user) {
    user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("walletAddress"), walletAddress))
      .first();
  }

  if (user) {
    // Get gold mining state from new table
    const miningState = await ctx.db
      .query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", user.stakeAddress || walletAddress))
      .first();

    // Get meks from new table
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", user.stakeAddress || walletAddress))
      .collect();

    if (miningState || ownedMeks.length > 0) {
      // Build compatible format from new tables
      const formattedMeks = ownedMeks.map((mek: any) => ({
        assetId: mek.assetId,
        assetName: mek.assetName,
        goldPerHour: mek.goldPerHour || 0,
        baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
        effectiveGoldPerHour: mek.effectiveGoldPerHour || mek.goldPerHour || 0,
        rarityRank: mek.rarityRank,
        currentLevel: mek.currentLevel || 1,
        levelBoostPercent: mek.levelBoostPercent || 0,
        levelBoostAmount: mek.levelBoostAmount || 0,
      }));

      const totalGoldPerHour = formattedMeks.reduce((sum: number, m: any) => sum + (m.effectiveGoldPerHour || m.goldPerHour || 0), 0);

      return {
        _id: miningState?._id || user._id,
        walletAddress: user.stakeAddress || walletAddress,
        ownedMeks: formattedMeks,
        accumulatedGold: miningState?.accumulatedGold || 0,
        totalCumulativeGold: miningState?.totalCumulativeGold || 0,
        totalGoldPerHour: miningState?.totalGoldPerHour || totalGoldPerHour,
        baseGoldPerHour: miningState?.baseGoldPerHour || totalGoldPerHour,
        boostGoldPerHour: miningState?.boostGoldPerHour || 0,
        lastSnapshotTime: miningState?.lastSnapshotTime,
        isBlockchainVerified: miningState?.isBlockchainVerified || user.walletVerified || false,
        totalGoldSpentOnUpgrades: miningState?.totalGoldSpentOnUpgrades || 0,
        totalUpgradesPurchased: miningState?.totalUpgradesPurchased || 0,
        version: miningState?.version || 0,
        updatedAt: miningState?.updatedAt || Date.now(),
        createdAt: miningState?.createdAt || Date.now(),
        // Mark as coming from new tables for write operations
        _source: "newTables",
        _userId: user._id,
        _miningStateId: miningState?._id,
      };
    }
  }

  // LEGACY FALLBACK: Try old goldMining table
  const legacyData = await ctx.db
    .query("goldMining")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .first();

  if (legacyData) {
    return {
      ...legacyData,
      _source: "legacyTable",
    };
  }

  return null;
}

// Gold cost structure for each level upgrade
const UPGRADE_COSTS = [
  0,      // Level 0 (doesn't exist)
  0,      // Level 1 (starting level, no cost)
  100,    // Level 1→2
  250,    // Level 2→3
  500,    // Level 3→4
  1000,   // Level 4→5
  2000,   // Level 5→6
  4000,   // Level 6→7
  8000,   // Level 7→8
  16000,  // Level 8→9
  32000,  // Level 9→10
];

// Calculate the gold cost for upgrading from current level to next level
export function calculateUpgradeCost(currentLevel: number): number {
  if (currentLevel < 1 || currentLevel >= 10) {
    return 0; // Can't upgrade past level 10 or from invalid levels
  }
  return UPGRADE_COSTS[currentLevel + 1];
}

// Calculate the gold rate boost for a given level
export function calculateLevelBoost(
  baseRate: number,
  level: number
): { percent: number; amount: number } {
  // Accelerating percentage system: Level 1 = 0%, Level 2 = 25%, Level 3 = 60%, etc.
  // Provides much more exciting growth for low-rate Meks
  const percentages = [
    0,      // Level 1
    25,     // Level 2
    60,     // Level 3
    110,    // Level 4
    180,    // Level 5
    270,    // Level 6
    400,    // Level 7
    600,    // Level 8
    900,    // Level 9
    1400,   // Level 10
  ];

  const percent = percentages[level - 1] || 0;
  const amount = (baseRate * percent) / 100;

  devLog.log(`[BOOST CALCULATION] Level ${level}:`, {
    baseRate,
    percent,
    amount,
    expectedIncrease: amount
  });

  return { percent, amount };
}

// Calculate effective gold rate (base + boost)
export function calculateEffectiveRate(
  baseRate: number,
  level: number
): number {
  const { amount } = calculateLevelBoost(baseRate, level);
  return baseRate + amount;
}

// Calculate total gold spent to reach a given level
export function calculateTotalGoldSpent(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += UPGRADE_COSTS[i];
  }
  return total;
}

// Get Mek levels for a wallet
export const getMekLevels = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const levels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.neq(q.field("ownershipStatus"), "transferred"))
      .collect();

    return levels;
  },
});

// Get Mek levels from ALL wallets in the corporation
export const getGroupMekLevels = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the wallet group for this wallet
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    let walletsToQuery = [args.walletAddress]; // Default to just this wallet

    if (membership) {
      // Get all wallets in the group
      const allMemberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q: any) => q.eq("groupId", membership.groupId))
        .collect();

      walletsToQuery = allMemberships.map((m: any) => m.walletAddress);
    }

    // Get Mek levels from all wallets
    const allLevels = [];
    for (const wallet of walletsToQuery) {
      const levels = await ctx.db
        .query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", wallet))
        .filter((q) => q.neq(q.field("ownershipStatus"), "transferred"))
        .collect();

      allLevels.push(...levels);
    }

    return allLevels;
  },
});

// Get level for a specific Mek
export const getMekLevel = query({
  args: {
    walletAddress: v.string(),
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    const level = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet_asset", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("assetId", args.assetId)
      )
      .first();

    return level || null;
  },
});

// Get all levels for a specific Mek (across all wallets) for history
export const getMekLevelHistory = query({
  args: {
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    const levels = await ctx.db
      .query("mekLevels")
      .withIndex("by_asset", (q: any) => q.eq("assetId", args.assetId))
      .collect();

    return levels;
  },
});

// Main upgrade mutation
export const upgradeMekLevel = mutation({
  args: {
    walletAddress: v.string(),
    assetId: v.string(),
    mekNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Get the current gold mining data for the wallet
    const goldMiningData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningData) {
      throw new Error("Wallet not found in gold mining system");
    }

    // 2. Verify the wallet owns this Mek and get its base rate
    const ownedMek = goldMiningData.ownedMeks.find(
      (m: any) => m.assetId === args.assetId
    );

    if (!ownedMek) {
      throw new Error("You do not own this Mek");
    }

    // CRITICAL: Use baseGoldPerHour if available, NOT goldPerHour (which includes previous boosts)
    const mekBaseRate = ownedMek.baseGoldPerHour || ownedMek.goldPerHour || 0;

    devLog.log(`[UPGRADE START] Mek data from goldMining:`, {
      assetId: args.assetId,
      goldPerHour: ownedMek.goldPerHour,
      baseGoldPerHour: ownedMek.baseGoldPerHour,
      effectiveGoldPerHour: ownedMek.effectiveGoldPerHour,
      currentLevel: ownedMek.currentLevel,
      levelBoostAmount: ownedMek.levelBoostAmount,
      totalRate: goldMiningData.totalGoldPerHour
    });

    // Check if wallet is verified
    if (!goldMiningData.isBlockchainVerified) {
      // LOG: Unverified wallet attempted upgrade (security event)
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "warning",
        category: "gold",
        message: "Unverified wallet attempted MEK upgrade",
        severity: "high",
        functionName: "upgradeMekLevel",
        walletAddress: args.walletAddress,
        details: { assetId: args.assetId },
      });

      throw new Error("Wallet must be blockchain verified to upgrade Meks");
    }

    // 3. Get or create the level record for this wallet+mek
    let mekLevel = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet_asset", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("assetId", args.assetId)
      )
      .first();

    if (!mekLevel) {
      // Create new level record with base rate tracking
      await ctx.db.insert("mekLevels", {
        walletAddress: args.walletAddress,
        assetId: args.assetId,
        mekNumber: args.mekNumber,
        currentLevel: 1,
        totalGoldSpent: 0,
        baseGoldPerHour: mekBaseRate, // Store base rate
        currentBoostPercent: 0, // No boost at level 1
        currentBoostAmount: 0, // No boost at level 1
        levelAcquiredAt: now,
        lastVerifiedAt: now,
        ownershipStatus: "verified",
        createdAt: now,
        updatedAt: now,
      });

      mekLevel = await ctx.db
        .query("mekLevels")
        .withIndex("by_wallet_asset", (q: any) =>
          q.eq("walletAddress", args.walletAddress).eq("assetId", args.assetId)
        )
        .first();
    }

    if (!mekLevel) {
      throw new Error("Failed to create level record");
    }

    // 4. Check if the Mek can be upgraded
    if (mekLevel.currentLevel >= 10) {
      throw new Error("Mek is already at maximum level");
    }

    // 5. Calculate upgrade cost
    const upgradeCost = calculateUpgradeCost(mekLevel.currentLevel);

    // 6. Calculate current gold balance (with time-based accumulation)
    const hoursSinceLastSnapshot = goldMiningData.lastSnapshotTime
      ? (now - goldMiningData.lastSnapshotTime) / (1000 * 60 * 60)
      : 0;

    const goldSinceSnapshot = goldMiningData.totalGoldPerHour * hoursSinceLastSnapshot;
    // CRITICAL FIX: NO CAP - calculate true uncapped gold balance for spending
    const currentGold = (goldMiningData.accumulatedGold || 0) + goldSinceSnapshot;

    // 7. Check if player has enough gold
    if (currentGold < upgradeCost) {
      throw new Error(
        `Insufficient gold. You have ${Math.floor(
          currentGold
        )} gold but need ${upgradeCost} gold`
      );
    }

    // 8. Create upgrade transaction ID
    const upgradeId = `${args.walletAddress}-${args.assetId}-${now}`;

    // 9. Log the upgrade attempt
    await ctx.db.insert("levelUpgrades", {
      upgradeId,
      walletAddress: args.walletAddress,
      assetId: args.assetId,
      mekNumber: args.mekNumber,
      fromLevel: mekLevel.currentLevel,
      toLevel: mekLevel.currentLevel + 1,
      goldCost: upgradeCost,
      signatureRequired: mekLevel.currentLevel >= 7, // Require signature for levels 8-10
      ownershipVerified: true,
      status: "pending",
      timestamp: now,
      goldBalanceBefore: currentGold,
      goldBalanceAfter: currentGold - upgradeCost,
    });

    // 10. ATOMIC TRANSACTION: Deduct gold and update level
    try {
      // Deduct gold from accumulated balance
      const newAccumulatedGold = currentGold - upgradeCost;

      // Calculate new boost for the upgraded level
      const newLevel = mekLevel.currentLevel + 1;
      const baseRate = mekLevel.baseGoldPerHour || mekBaseRate;

      devLog.log(`[UPGRADE MUTATION] Calculating boost for upgrade:`, {
        assetId: args.assetId,
        currentLevel: mekLevel.currentLevel,
        newLevel,
        mekLevelBaseRate: mekLevel.baseGoldPerHour,
        mekMiningBaseRate: mekBaseRate,
        selectedBaseRate: baseRate
      });

      const { percent: newBoostPercent, amount: newBoostAmount } = calculateLevelBoost(
        baseRate,
        newLevel
      );

      // Update Mek level with boost information
      await ctx.db.patch(mekLevel._id, {
        currentLevel: newLevel,
        totalGoldSpent: mekLevel.totalGoldSpent + upgradeCost,
        baseGoldPerHour: baseRate, // Ensure base rate is stored
        currentBoostPercent: newBoostPercent,
        currentBoostAmount: newBoostAmount,
        lastUpgradeAt: now,
        updatedAt: now,
      });

      // Update the goldMining record with new effective rates
      const updatedMeks = goldMiningData.ownedMeks.map((mek: any) => {
        if (mek.assetId === args.assetId) {
          const effectiveRate = baseRate + newBoostAmount;
          return {
            ...mek,
            baseGoldPerHour: baseRate,
            currentLevel: newLevel,
            levelBoostPercent: newBoostPercent,
            levelBoostAmount: newBoostAmount,
            effectiveGoldPerHour: effectiveRate,
            goldPerHour: effectiveRate, // Also update goldPerHour for compatibility
          };
        }
        return mek;
      });

      // Recalculate total rates
      const baseGoldPerHour = updatedMeks.reduce(
        (sum: number, mek: any) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
        0
      );
      const boostGoldPerHour = updatedMeks.reduce(
        (sum: number, mek: any) => sum + (mek.levelBoostAmount || 0),
        0
      );
      const totalGoldPerHour = baseGoldPerHour + boostGoldPerHour;

      devLog.log(`[UPGRADE MUTATION] Total rate calculation:`, {
        oldTotalRate: goldMiningData.totalGoldPerHour,
        newBaseRate: baseGoldPerHour,
        newBoostRate: boostGoldPerHour,
        newTotalRate: totalGoldPerHour,
        rateDifference: totalGoldPerHour - goldMiningData.totalGoldPerHour,
        expectedBoostAdded: newBoostAmount
      });

      // LOG: Before database update
      devLog.log('[UPGRADE MUTATION] Before DB update:', {
        goldBefore: currentGold,
        upgradeCost,
        newAccumulatedGold,
        timestamp: new Date(now).toISOString()
      });

      // Calculate gold earned since last snapshot for cumulative update
      // This value represents time-based earnings not yet reflected in totalCumulativeGold
      const goldEarnedSinceSnapshot = currentGold - (goldMiningData.accumulatedGold || 0);

      // CRITICAL FIX: Snapshot the time-based gold accumulation AND update cumulative BEFORE spending
      // The bug was: calculateGoldDecrease uses goldMiningData.accumulatedGold (old value),
      // but currentGold includes time-based earnings that aren't in accumulatedGold yet,
      // AND those earnings weren't being added to totalCumulativeGold.
      // Solution: Create a snapshot record with currentGold as the new accumulatedGold
      // AND add the earned gold to totalCumulativeGold (mirrors goldMiningSnapshot.ts lines 368-374)
      const snapshotRecord = {
        ...goldMiningData,
        accumulatedGold: currentGold, // Use calculated current gold (includes time-based earnings)
        totalCumulativeGold: (goldMiningData.totalCumulativeGold || 0) + Math.max(0, goldEarnedSinceSnapshot), // CRITICAL FIX: Add earnings to cumulative
        lastSnapshotTime: now
      };

      // LOG: Cumulative gold update (BUG FIX VERIFICATION)
      devLog.log('[CUMULATIVE FIX] Gold earned and cumulative update:', {
        goldSinceSnapshot: goldSinceSnapshot,
        goldEarnedSinceSnapshot: goldEarnedSinceSnapshot,
        shouldMatch: goldSinceSnapshot === goldEarnedSinceSnapshot,
        oldAccumulated: goldMiningData.accumulatedGold || 0,
        newAccumulated: currentGold,
        oldCumulative: goldMiningData.totalCumulativeGold || 0,
        newCumulative: snapshotRecord.totalCumulativeGold,
        cumulativeIncrease: snapshotRecord.totalCumulativeGold - (goldMiningData.totalCumulativeGold || 0),
        expectedMatch: goldEarnedSinceSnapshot === (snapshotRecord.totalCumulativeGold - (goldMiningData.totalCumulativeGold || 0)),
        calculation: `${goldMiningData.totalCumulativeGold || 0} + ${Math.max(0, goldEarnedSinceSnapshot)} = ${snapshotRecord.totalCumulativeGold}`,
      });

      devLog.log('[UPGRADE MUTATION] Gold snapshot for spending:', {
        oldAccumulatedGold: goldMiningData.accumulatedGold,
        goldSinceSnapshot: goldSinceSnapshot,
        snapshotAccumulatedGold: currentGold,
        upgradeCost,
        willRemain: currentGold - upgradeCost
      });

      // CRITICAL: Use centralized gold decrease function to maintain invariants
      // calculateGoldDecrease() now handles ALL gold calculations including cumulative repair (Bug #2 & #3 fix)
      const goldDecrease = calculateGoldDecrease(snapshotRecord, upgradeCost);

      devLog.log('[UPGRADE MUTATION] Gold decrease calculation:', {
        oldAccumulated: currentGold,
        newAccumulated: goldDecrease.newAccumulatedGold,
        oldTotalSpent: goldMiningData.totalGoldSpentOnUpgrades || 0,
        newTotalSpent: goldDecrease.newTotalGoldSpentOnUpgrades,
        cumulativeGold: goldDecrease.newTotalCumulativeGold,
        snapshotCumulative: snapshotRecord.totalCumulativeGold,
        autoRepairTriggered: goldDecrease.newTotalCumulativeGold !== snapshotRecord.totalCumulativeGold,
        cumulativeChange: goldDecrease.newTotalCumulativeGold - snapshotRecord.totalCumulativeGold,
        upgradeCost
      });

      // CRITICAL: Check version for race condition protection (optimistic concurrency control)
      // Re-fetch the latest data to check if version changed during this mutation
      const latestGoldMiningData = await ctx.db.get(goldMiningData._id);
      if (!latestGoldMiningData) {
        throw new Error("Gold mining data was deleted during upgrade");
      }
      const currentVersion = goldMiningData.version || 0;
      const latestVersion = latestGoldMiningData.version || 0;
      if (currentVersion !== latestVersion) {
        // LOG: Concurrent modification detected (race condition)
        await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
          eventType: "warning",
          category: "gold",
          message: "Concurrent modification detected during MEK upgrade",
          severity: "medium",
          functionName: "upgradeMekLevel",
          walletAddress: args.walletAddress,
          details: {
            assetId: args.assetId,
            expectedVersion: currentVersion,
            actualVersion: latestVersion,
          },
        });

        throw new Error("Concurrent modification detected. Please refresh and try again.");
      }

      // Update goldMining with new rates AND DEDUCT GOLD - Using centralized calculation!
      await ctx.db.patch(goldMiningData._id, {
        accumulatedGold: goldDecrease.newAccumulatedGold,  // CRITICAL: Actually deduct the gold spent!
        totalCumulativeGold: goldDecrease.newTotalCumulativeGold, // CRITICAL: Use repaired cumulative from calculation
        lastSnapshotTime: now,  // Reset snapshot time since we're updating accumulated gold
        ownedMeks: updatedMeks,
        baseGoldPerHour,
        boostGoldPerHour,
        totalGoldPerHour,
        totalGoldSpentOnUpgrades: goldDecrease.newTotalGoldSpentOnUpgrades,
        totalUpgradesPurchased: (goldMiningData.totalUpgradesPurchased || 0) + 1,
        lastUpgradeSpend: now,
        updatedAt: now,
        version: currentVersion + 1, // Increment version to detect concurrent modifications
      });

      // LOG: After database update
      devLog.log('[UPGRADE MUTATION] After DB update - gold deducted:', {
        remainingGold: goldDecrease.newAccumulatedGold,
        totalSpent: goldDecrease.newTotalGoldSpentOnUpgrades,
        cumulativeGold: goldDecrease.newTotalCumulativeGold,
        timestamp: new Date(now).toISOString()
      });

      // Mark upgrade as completed
      const upgradeRecord = await ctx.db
        .query("levelUpgrades")
        .filter((q) => q.eq(q.field("upgradeId"), upgradeId))
        .first();

      if (upgradeRecord) {
        await ctx.db.patch(upgradeRecord._id, {
          status: "completed",
          completedAt: now,
        });
      }

      // LOG: Activity log for upgrade purchase (lean version - bandwidth optimization)
      await ctx.db.insert("auditLogs", {
        type: "mekUpgrade",
        timestamp: now,
        createdAt: now,
        stakeAddress: args.walletAddress,
        assetId: args.assetId,
        assetName: ownedMek.assetName || args.assetId,
        oldLevel: mekLevel.currentLevel,
        newLevel: newLevel,
        upgradeCost: upgradeCost,
        // Removed redundant fields: goldBefore, goldAfter, cumulativeGoldBefore/After,
        // totalGoldPerHourBefore (can be recalculated if needed, not worth bandwidth)
        boostAmount: newBoostAmount,
      });

      // LOG: Returning result to frontend
      devLog.log('[UPGRADE MUTATION] Returning result:', {
        success: true,
        newLevel: mekLevel.currentLevel + 1,
        goldSpent: upgradeCost,
        remainingGold: goldDecrease.newAccumulatedGold,
      });

      // LOG: High-value MEK upgrades (levels 7-10 cost 4000-32000 gold)
      if (newLevel >= 7) {
        await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
          eventType: "info",
          category: "gold",
          message: `MEK upgraded to Level ${newLevel} (high-value)`,
          severity: "low",
          functionName: "upgradeMekLevel",
          walletAddress: args.walletAddress,
          details: {
            assetId: args.assetId,
            assetName: ownedMek.assetName,
            fromLevel: mekLevel.currentLevel,
            toLevel: newLevel,
            goldSpent: upgradeCost,
            newBoostAmount: newBoostAmount,
            remainingGold: goldDecrease.newAccumulatedGold,
          },
        });
      }

      return {
        success: true,
        newLevel: mekLevel.currentLevel + 1,
        goldSpent: upgradeCost,
        remainingGold: goldDecrease.newAccumulatedGold,
      };
    } catch (error) {
      // Mark upgrade as failed
      const upgradeRecord = await ctx.db
        .query("levelUpgrades")
        .filter((q) => q.eq(q.field("upgradeId"), upgradeId))
        .first();

      if (upgradeRecord) {
        await ctx.db.patch(upgradeRecord._id, {
          status: "failed",
          failureReason: String(error),
        });
      }

      // LOG: Failed MEK upgrade
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "error",
        category: "gold",
        message: "MEK upgrade failed",
        severity: "medium",
        functionName: "upgradeMekLevel",
        walletAddress: args.walletAddress,
        details: {
          assetId: args.assetId,
          error: String(error),
          upgradeCost: calculateUpgradeCost(mekLevel?.currentLevel || 1),
        },
      });

      throw error;
    }
  },
});

// Check and reset levels for transferred Meks
export const checkAndResetTransferredMeks = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get gold mining data with current Meks
    const goldMiningData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningData) {
      return { checked: 0, reset: 0 };
    }

    const currentMekIds = new Set(
      goldMiningData.ownedMeks.map((mek: any) => mek.assetId)
    );

    // Get all level records for this wallet
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    let checkedCount = 0;
    let resetCount = 0;

    for (const levelRecord of mekLevels) {
      checkedCount++;

      // If this Mek is no longer owned by the wallet, mark it as transferred
      if (
        !currentMekIds.has(levelRecord.assetId) &&
        levelRecord.ownershipStatus === "verified"
      ) {
        // Log the transfer event
        await ctx.db.insert("mekTransferEvents", {
          assetId: levelRecord.assetId,
          fromWallet: args.walletAddress,
          toWallet: "unknown", // We don't know the new owner yet
          levelAtTransfer: levelRecord.currentLevel,
          goldInvestedAtTransfer: levelRecord.totalGoldSpent,
          detectedBy: "ownership_check",
          detectedAt: now,
          processed: true,
          processedAt: now,
        });

        // Mark the level record as transferred
        await ctx.db.patch(levelRecord._id, {
          ownershipStatus: "transferred",
          updatedAt: now,
        });

        resetCount++;
      }
    }

    return {
      checked: checkedCount,
      reset: resetCount,
    };
  },
});

// Initialize level records for newly detected Meks
export const initializeMekLevels = mutation({
  args: {
    walletAddress: v.string(),
    meks: v.array(
      v.object({
        assetId: v.string(),
        mekNumber: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let initialized = 0;

    for (const mek of args.meks) {
      // Check if level record already exists
      const existing = await ctx.db
        .query("mekLevels")
        .withIndex("by_wallet_asset", (q: any) =>
          q.eq("walletAddress", args.walletAddress).eq("assetId", mek.assetId)
        )
        .first();

      if (!existing) {
        // Check if this Mek was previously owned by this wallet and transferred out
        const history = await ctx.db
          .query("mekLevels")
          .withIndex("by_asset", (q: any) => q.eq("assetId", mek.assetId))
          .filter((q) =>
            q.and(
              q.eq(q.field("walletAddress"), args.walletAddress),
              q.eq(q.field("ownershipStatus"), "transferred")
            )
          )
          .first();

        if (history) {
          // TRANSFER RULE: Once a Mek leaves a wallet, it resets to level 1 even if it returns
          // Delete the old transferred record and create a fresh level 1 record
          await ctx.db.delete(history._id);

          // Fall through to create new level 1 record below
        }

        {
          // Get base rate from goldMining for this Mek
          const goldMiningData = await ctx.db
            .query("goldMining")
            .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
            .first();

          const mekBaseRate = goldMiningData?.ownedMeks.find(
            (m: any) => m.assetId === mek.assetId
          )?.goldPerHour || 0;

          // Create new level record with boost tracking
          await ctx.db.insert("mekLevels", {
            walletAddress: args.walletAddress,
            assetId: mek.assetId,
            mekNumber: mek.mekNumber,
            currentLevel: 1,
            totalGoldSpent: 0,
            baseGoldPerHour: mekBaseRate,
            currentBoostPercent: 0,
            currentBoostAmount: 0,
            levelAcquiredAt: now,
            lastVerifiedAt: now,
            ownershipStatus: "verified",
            createdAt: now,
            updatedAt: now,
          });
        }
        initialized++;
      }
    }

    return { initialized };
  },
});

// Get upgrade history for a wallet
export const getUpgradeHistory = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("levelUpgrades")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get leaderboard of highest level Meks
export const getMekLevelLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_level")
      .order("desc")
      .filter((q) => q.eq(q.field("ownershipStatus"), "verified"))
      .take(args.limit || 10);

    return allLevels;
  },
});

// ADMIN: Reset all Mek levels back to Level 1 for a specific wallet
export const resetAllMekLevels = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all level records for this wallet
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("ownershipStatus"), "verified"))
      .collect();

    let resetCount = 0;

    // Reset each Mek to level 1
    for (const levelRecord of mekLevels) {
      await ctx.db.patch(levelRecord._id, {
        currentLevel: 1,
        totalGoldSpent: 0,
        currentBoostPercent: 0,
        currentBoostAmount: 0,
        lastUpgradeAt: undefined,
        updatedAt: now,
      });
      resetCount++;
    }

    // Update goldMining record to remove all boosts
    const goldMiningData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningData) {
      // Reset all Meks to level 1 with no boosts
      const resetMeks = goldMiningData.ownedMeks.map((mek: any) => ({
        ...mek,
        currentLevel: 1,
        levelBoostPercent: 0,
        levelBoostAmount: 0,
        effectiveGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
      }));

      // Recalculate total rates (no boosts now)
      const baseGoldPerHour = resetMeks.reduce(
        (sum: number, mek: any) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
        0
      );

      await ctx.db.patch(goldMiningData._id, {
        ownedMeks: resetMeks,
        baseGoldPerHour,
        boostGoldPerHour: 0,
        totalGoldPerHour: baseGoldPerHour,
        updatedAt: now,
      });
    }

    return {
      success: true,
      meksReset: resetCount,
      message: `Successfully reset ${resetCount} Meks to Level 1`,
    };
  },
});