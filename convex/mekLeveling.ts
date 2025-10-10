import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { calculateGoldDecrease, validateGoldInvariant, GOLD_CAP } from "./lib/goldCalculations";
import { devLog } from "./lib/devLog";
import { internal } from "./_generated/api";

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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    let walletsToQuery = [args.walletAddress]; // Default to just this wallet

    if (membership) {
      // Get all wallets in the group
      const allMemberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
        .collect();

      walletsToQuery = allMemberships.map(m => m.walletAddress);
    }

    // Get Mek levels from all wallets
    const allLevels = [];
    for (const wallet of walletsToQuery) {
      const levels = await ctx.db
        .query("mekLevels")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
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
      .withIndex("by_wallet_asset", (q) =>
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
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
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

    // STEP 1: Find which wallet ACTUALLY owns this Mek (might be different in corporation)
    const mekLevelRecords = await ctx.db
      .query("mekLevels")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .filter((q) => q.eq(q.field("ownershipStatus"), "verified"))
      .collect();

    if (mekLevelRecords.length === 0) {
      throw new Error("Mek level record not found. The Mek may need to be initialized.");
    }

    // Get the mekLevel record (there should only be one verified owner)
    const mekLevel = mekLevelRecords[0];
    const mekOwnerWallet = mekLevel.walletAddress;

    devLog.log(`[UPGRADE START] Mek ownership:`, {
      assetId: args.assetId,
      owner: mekOwnerWallet,
      upgrader: args.walletAddress,
      isOwnMek: mekOwnerWallet === args.walletAddress
    });

    // STEP 2: Get the MEK OWNER's goldMining data (to verify and get base rate)
    const mekOwnerGoldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", mekOwnerWallet))
      .first();

    if (!mekOwnerGoldMining) {
      throw new Error("Mek owner wallet not found in gold mining system");
    }

    // Verify the Mek exists in the owner's wallet
    const ownedMek = mekOwnerGoldMining.ownedMeks.find(
      (m) => m.assetId === args.assetId
    );

    if (!ownedMek) {
      throw new Error("Mek not found in owner's wallet");
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
      totalRate: mekOwnerGoldMining.totalGoldPerHour
    });

    // STEP 3: Get the UPGRADER's goldMining data (for spending gold)
    const upgraderGoldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!upgraderGoldMining) {
      throw new Error("Your wallet not found in gold mining system");
    }

    // Check if upgrader's wallet is verified
    if (!upgraderGoldMining.isBlockchainVerified) {
      throw new Error("Your wallet must be blockchain verified to upgrade Meks");
    }

    // STEP 4: Verify upgrader is in same corporation as owner (or is the owner)
    const isOwnMek = mekOwnerWallet === args.walletAddress;
    if (!isOwnMek) {
      // Check if they're in the same corporation
      const upgraderMembership = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      const ownerMembership = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", mekOwnerWallet))
        .first();

      const sameGroup = upgraderMembership && ownerMembership &&
                       upgraderMembership.groupId === ownerMembership.groupId;

      if (!sameGroup) {
        throw new Error("You can only upgrade Meks in your corporation");
      }
    }

    // 5. Check if the Mek can be upgraded
    if (mekLevel.currentLevel >= 10) {
      throw new Error("Mek is already at maximum level");
    }

    // 6. Calculate upgrade cost
    const upgradeCost = calculateUpgradeCost(mekLevel.currentLevel);

    // 7. CRITICAL: Calculate CORPORATION's pooled gold (not just individual wallet)
    // Get all wallets in the corporation
    const upgraderMembership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    let corporationWallets = [upgraderGoldMining]; // Default to just upgrader
    let totalCorporationGold = 0;

    if (upgraderMembership) {
      // Get all members of this corporation
      const allMemberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", upgraderMembership.groupId))
        .collect();

      // Get gold mining data for all wallets
      corporationWallets = [];
      for (const membership of allMemberships) {
        const walletData = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", membership.walletAddress))
          .first();

        if (walletData) {
          const hoursSince = walletData.lastSnapshotTime
            ? (now - walletData.lastSnapshotTime) / (1000 * 60 * 60)
            : 0;
          const goldSince = walletData.totalGoldPerHour * hoursSince;
          const walletGold = (walletData.accumulatedGold || 0) + goldSince;

          corporationWallets.push({
            ...walletData,
            currentGold: walletGold,
          });
          totalCorporationGold += walletGold;
        }
      }
    } else {
      // Solo wallet - calculate their gold
      const hoursSince = upgraderGoldMining.lastSnapshotTime
        ? (now - upgraderGoldMining.lastSnapshotTime) / (1000 * 60 * 60)
        : 0;
      const goldSince = upgraderGoldMining.totalGoldPerHour * hoursSince;
      totalCorporationGold = (upgraderGoldMining.accumulatedGold || 0) + goldSince;
      corporationWallets[0].currentGold = totalCorporationGold;
    }

    devLog.log('[UPGRADE] Corporation gold pool:', {
      totalGold: totalCorporationGold,
      walletCount: corporationWallets.length,
      upgradeCost,
      canAfford: totalCorporationGold >= upgradeCost
    });

    // 8. Check if CORPORATION has enough gold
    if (totalCorporationGold < upgradeCost) {
      throw new Error(
        `Insufficient gold. Your corporation has ${Math.floor(
          totalCorporationGold
        )} gold but need ${upgradeCost} gold`
      );
    }

    // For backwards compatibility, keep these variables for the upgrader
    const hoursSinceLastSnapshot = upgraderGoldMining.lastSnapshotTime
      ? (now - upgraderGoldMining.lastSnapshotTime) / (1000 * 60 * 60)
      : 0;
    const goldSinceSnapshot = upgraderGoldMining.totalGoldPerHour * hoursSinceLastSnapshot;
    const uncappedCurrentGold = (upgraderGoldMining.accumulatedGold || 0) + goldSinceSnapshot;
    const currentGold = Math.min(GOLD_CAP, uncappedCurrentGold);

    // 9. Create upgrade transaction ID
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
      goldBalanceBefore: uncappedCurrentGold,
      goldBalanceAfter: uncappedCurrentGold - upgradeCost,
    });

    // 10. ATOMIC TRANSACTION: Deduct gold and update level
    try {
      // Deduct gold from accumulated balance (using uncapped value)
      const newAccumulatedGold = uncappedCurrentGold - upgradeCost;

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

      // Update the MEK OWNER's goldMining record with new effective rates
      const updatedOwnerMeks = mekOwnerGoldMining.ownedMeks.map((mek) => {
        if (mek.assetId === args.assetId) {
          return {
            ...mek,
            baseGoldPerHour: baseRate,
            currentLevel: newLevel,
            levelBoostPercent: newBoostPercent,
            levelBoostAmount: newBoostAmount,
            effectiveGoldPerHour: baseRate + newBoostAmount,
          };
        }
        return mek;
      });

      // Recalculate owner's total rates
      const ownerBaseGoldPerHour = updatedOwnerMeks.reduce(
        (sum, mek) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
        0
      );
      const ownerBoostGoldPerHour = updatedOwnerMeks.reduce(
        (sum, mek) => sum + (mek.levelBoostAmount || 0),
        0
      );
      const ownerTotalGoldPerHour = ownerBaseGoldPerHour + ownerBoostGoldPerHour;

      devLog.log(`[UPGRADE MUTATION] Owner total rate calculation:`, {
        oldTotalRate: mekOwnerGoldMining.totalGoldPerHour,
        newBaseRate: ownerBaseGoldPerHour,
        newBoostRate: ownerBoostGoldPerHour,
        newTotalRate: ownerTotalGoldPerHour,
        rateDifference: ownerTotalGoldPerHour - mekOwnerGoldMining.totalGoldPerHour,
        expectedBoostAdded: newBoostAmount
      });

      // LOG: Before database update
      devLog.log('[UPGRADE MUTATION] Before DB update:', {
        goldBefore: uncappedCurrentGold,
        cappedGold: currentGold,
        upgradeCost,
        newAccumulatedGold,
        timestamp: new Date(now).toISOString()
      });

      // Define goldMiningData as the UPGRADER's data (they're spending the gold)
      const goldMiningData = upgraderGoldMining;

      // CRITICAL FIX: Snapshot the time-based gold accumulation BEFORE spending
      // IMPORTANT: Use UNCAPPED gold to prevent gold loss when spending above 10M limit
      // The 10M cap only applies to EARNING, not SPENDING
      const snapshotRecord = {
        ...goldMiningData,
        accumulatedGold: uncappedCurrentGold, // Use UNCAPPED gold (includes time-based earnings)
        lastSnapshotTime: now
      };

      devLog.log('[UPGRADE MUTATION] Gold snapshot for spending:', {
        oldAccumulatedGold: goldMiningData.accumulatedGold,
        goldSinceSnapshot: goldSinceSnapshot,
        snapshotAccumulatedGold: uncappedCurrentGold,
        cappedValue: currentGold,
        upgradeCost,
        willRemain: uncappedCurrentGold - upgradeCost
      });

      // CRITICAL: Use centralized gold decrease function to maintain invariants
      // When spending gold, totalCumulativeGold stays the same, but totalGoldSpentOnUpgrades increases
      const goldDecrease = calculateGoldDecrease(snapshotRecord, upgradeCost);

      // Ensure totalCumulativeGold is initialized if not already
      let newTotalCumulativeGold = goldMiningData.totalCumulativeGold;
      if (!newTotalCumulativeGold || newTotalCumulativeGold === 0) {
        // Initialize from current state (use snapshotRecord which has correct accumulated gold)
        newTotalCumulativeGold = uncappedCurrentGold + (goldMiningData.totalGoldSpentOnUpgrades || 0);
      }

      devLog.log('[UPGRADE MUTATION] Gold decrease calculation:', {
        oldAccumulated: uncappedCurrentGold,
        newAccumulated: goldDecrease.newAccumulatedGold,
        oldTotalSpent: goldMiningData.totalGoldSpentOnUpgrades || 0,
        newTotalSpent: goldDecrease.newTotalGoldSpentOnUpgrades,
        cumulativeGold: newTotalCumulativeGold,
        upgradeCost,
        goldLost: uncappedCurrentGold - goldDecrease.newAccumulatedGold
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
        throw new Error("Concurrent modification detected. Please refresh and try again.");
      }

      // CRITICAL: Determine MEK owner for spending attribution
      // The MEK owner's wallet gets the spending credited, not the person upgrading
      const isUpgradingOwnMek = mekOwnerWallet === args.walletAddress;

      devLog.log('[UPGRADE MUTATION] Spending attribution:', {
        upgrader: args.walletAddress,
        mekOwner: mekOwnerWallet,
        isOwn: isUpgradingOwnMek,
        upgradeCost
      });

      // Calculate updated meks and rates for the UPGRADER
      let updatedMeks = goldMiningData.ownedMeks;
      let baseGoldPerHour = goldMiningData.baseGoldPerHour || 0;
      let boostGoldPerHour = goldMiningData.boostGoldPerHour || 0;
      let totalGoldPerHour = goldMiningData.totalGoldPerHour || 0;

      // Capture MEK OWNER's rate BEFORE upgrade (for audit log)
      const mekOwnerTotalGoldPerHourBefore = mekOwnerGoldMining.totalGoldPerHour || 0;

      // If upgrading own Mek, update the upgrader's rates
      if (isUpgradingOwnMek) {
        updatedMeks = goldMiningData.ownedMeks.map((mek) => {
          if (mek.assetId === args.assetId) {
            return {
              ...mek,
              baseGoldPerHour: baseRate,
              currentLevel: newLevel,
              levelBoostPercent: newBoostPercent,
              levelBoostAmount: newBoostAmount,
              effectiveGoldPerHour: baseRate + newBoostAmount,
            };
          }
          return mek;
        });

        // Recalculate upgrader's total rates
        baseGoldPerHour = updatedMeks.reduce(
          (sum, mek) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
          0
        );
        boostGoldPerHour = updatedMeks.reduce(
          (sum, mek) => sum + (mek.levelBoostAmount || 0),
          0
        );
        totalGoldPerHour = baseGoldPerHour + boostGoldPerHour;
      }

      // CRITICAL: Deduct gold from corporation pool (multi-wallet support)
      // Sort wallets by gold amount (descending) - deduct from richest first
      const sortedWallets = corporationWallets.sort((a, b) =>
        (b.currentGold || 0) - (a.currentGold || 0)
      );

      let remainingCost = upgradeCost;
      const walletsToUpdate: Array<{
        wallet: any;
        amountDeducted: number;
        newAccumulated: number;
        newTotalSpent: number;
      }> = [];

      // Deduct from each wallet until cost is covered
      for (const wallet of sortedWallets) {
        if (remainingCost <= 0) break;

        const walletGold = wallet.currentGold || 0;
        const deductAmount = Math.min(walletGold, remainingCost);

        if (deductAmount > 0) {
          // Calculate new values for this wallet
          const walletSnapshot = {
            ...wallet,
            accumulatedGold: walletGold
          };
          const walletDecrease = calculateGoldDecrease(walletSnapshot, deductAmount);

          // Track cumulative for this wallet
          let walletCumulative = wallet.totalCumulativeGold || 0;
          if (!walletCumulative || walletCumulative === 0) {
            walletCumulative = walletGold + (wallet.totalGoldSpentOnUpgrades || 0);
          }

          walletsToUpdate.push({
            wallet,
            amountDeducted: deductAmount,
            newAccumulated: walletDecrease.newAccumulatedGold,
            newTotalSpent: walletDecrease.newTotalGoldSpentOnUpgrades,
          });

          remainingCost -= deductAmount;
        }
      }

      devLog.log('[UPGRADE] Multi-wallet deduction:', {
        upgradeCost,
        walletsUsed: walletsToUpdate.length,
        deductions: walletsToUpdate.map(w => ({
          wallet: w.wallet.walletAddress.substring(0, 20),
          deducted: w.amountDeducted,
          remaining: w.newAccumulated
        }))
      });

      // Apply gold deductions to all affected wallets
      // Track Mek owner's rate for audit log
      let mekOwnerTotalGoldPerHourAfter = mekOwnerTotalGoldPerHourBefore; // Default to before value (no change)

      for (const update of walletsToUpdate) {
        const walletData = update.wallet;
        const isThisUpgrader = walletData.walletAddress === args.walletAddress;

        // Determine which wallet owns the Mek being upgraded
        const isThisMekOwner = walletData.walletAddress === mekOwnerWallet;

        // Update rates if this wallet owns the Mek
        let walletUpdatedMeks = walletData.ownedMeks;
        let walletBaseRate = walletData.baseGoldPerHour || 0;
        let walletBoostRate = walletData.boostGoldPerHour || 0;
        let walletTotalRate = walletData.totalGoldPerHour || 0;

        if (isThisMekOwner) {
          walletUpdatedMeks = walletData.ownedMeks.map((mek: any) => {
            if (mek.assetId === args.assetId) {
              return {
                ...mek,
                baseGoldPerHour: baseRate,
                currentLevel: newLevel,
                levelBoostPercent: newBoostPercent,
                levelBoostAmount: newBoostAmount,
                effectiveGoldPerHour: baseRate + newBoostAmount,
              };
            }
            return mek;
          });

          walletBaseRate = walletUpdatedMeks.reduce(
            (sum: number, mek: any) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
            0
          );
          walletBoostRate = walletUpdatedMeks.reduce(
            (sum: number, mek: any) => sum + (mek.levelBoostAmount || 0),
            0
          );
          walletTotalRate = walletBaseRate + walletBoostRate;

          // Capture the Mek owner's updated rate for audit log
          mekOwnerTotalGoldPerHourAfter = walletTotalRate;
        }

        // Update this wallet's database record
        await ctx.db.patch(walletData._id, {
          accumulatedGold: update.newAccumulated,
          totalCumulativeGold: walletData.totalCumulativeGold || (update.newAccumulated + update.newTotalSpent),
          lastSnapshotTime: now,
          ownedMeks: walletUpdatedMeks,
          baseGoldPerHour: walletBaseRate,
          boostGoldPerHour: walletBoostRate,
          totalGoldPerHour: walletTotalRate,
          // Only track spending on the Mek owner's wallet
          ...(isThisMekOwner ? {
            totalGoldSpentOnUpgrades: update.newTotalSpent,
            totalUpgradesPurchased: (walletData.totalUpgradesPurchased || 0) + 1,
            lastUpgradeSpend: now,
          } : {}),
          updatedAt: now,
          version: (walletData.version || 0) + 1,
        });
      }

      // LOG: After database update
      devLog.log('[UPGRADE MUTATION] After DB update - multi-wallet gold deducted:', {
        totalCost: upgradeCost,
        walletsCharged: walletsToUpdate.length,
        timestamp: new Date(now).toISOString()
      });

      // Calculate total remaining corporation gold after deduction
      const totalRemainingGold = walletsToUpdate.reduce(
        (sum, w) => sum + w.newAccumulated,
        0
      );

      // Log upgrade to audit log with gold tracking (corporation-level)
      await ctx.scheduler.runAfter(0, internal.auditLogs.logMekUpgrade, {
        stakeAddress: mekOwnerWallet,
        assetId: args.assetId,
        assetName: ownedMek.assetName,
        oldLevel: mekLevel.currentLevel,
        newLevel: newLevel,
        upgradeCost: upgradeCost,
        newGoldPerHour: baseRate + newBoostAmount,
        boostAmount: newBoostAmount,
        upgradedBy: args.walletAddress,
        mekOwner: mekOwnerWallet,
        goldBefore: totalCorporationGold, // Corporation total before
        goldAfter: totalRemainingGold,    // Corporation total after
        cumulativeGoldBefore: goldMiningData.totalCumulativeGold || 0,
        cumulativeGoldAfter: newTotalCumulativeGold,
        totalGoldPerHourBefore: mekOwnerTotalGoldPerHourBefore, // Mek owner's rate before
        totalGoldPerHour: mekOwnerTotalGoldPerHourAfter,         // Mek owner's rate after
        timestamp: now
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

      // LOG: Returning result to frontend
      devLog.log('[UPGRADE MUTATION] Returning result:', {
        success: true,
        newLevel: mekLevel.currentLevel + 1,
        goldSpent: upgradeCost,
        remainingGold: totalRemainingGold, // Corporation total
        walletsCharged: walletsToUpdate.length,
      });

      return {
        success: true,
        newLevel: mekLevel.currentLevel + 1,
        goldSpent: upgradeCost,
        remainingGold: totalRemainingGold, // Return corporation total
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningData) {
      return { checked: 0, reset: 0 };
    }

    const currentMekIds = new Set(
      goldMiningData.ownedMeks.map((mek) => mek.assetId)
    );

    // Get all level records for this wallet
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
        .withIndex("by_wallet_asset", (q) =>
          q.eq("walletAddress", args.walletAddress).eq("assetId", mek.assetId)
        )
        .first();

      if (!existing) {
        // Check if this Mek was previously owned by this wallet and transferred out
        const history = await ctx.db
          .query("mekLevels")
          .withIndex("by_asset", (q) => q.eq("assetId", mek.assetId))
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
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .first();

          const mekBaseRate = goldMiningData?.ownedMeks.find(
            (m) => m.assetId === mek.assetId
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningData) {
      // Reset all Meks to level 1 with no boosts
      const resetMeks = goldMiningData.ownedMeks.map((mek) => ({
        ...mek,
        currentLevel: 1,
        levelBoostPercent: 0,
        levelBoostAmount: 0,
        effectiveGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
      }));

      // Recalculate total rates (no boosts now)
      const baseGoldPerHour = resetMeks.reduce(
        (sum, mek) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
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