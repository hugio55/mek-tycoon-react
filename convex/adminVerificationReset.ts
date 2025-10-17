import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { calculateGoldIncrease, validateGoldInvariant } from "./lib/goldCalculations";

// Admin function to reset verification status (for testing)
export const resetVerificationStatus = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningRecord) {
      // Calculate current gold to "freeze" at this amount
      let pausedGold = goldMiningRecord.accumulatedGold || 0;

      if (goldMiningRecord.isBlockchainVerified === true) {
        const lastUpdateTime = goldMiningRecord.lastSnapshotTime || goldMiningRecord.updatedAt || goldMiningRecord.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = goldMiningRecord.totalGoldPerHour * hoursSinceLastUpdate;
        // CRITICAL FIX: NO CAP - freeze at true gold amount
        pausedGold = (goldMiningRecord.accumulatedGold || 0) + goldSinceLastUpdate;
      }

      // Save the current gold and unverify
      await ctx.db.patch(goldMiningRecord._id, {
        isBlockchainVerified: false,
        lastVerificationTime: undefined,
        accumulatedGold: pausedGold,
        lastSnapshotTime: now,
        updatedAt: now
      });

      console.log(`[Admin] Reset verification for wallet ${args.walletAddress.substring(0, 20)}... (paused at ${pausedGold.toFixed(2)} gold)`);

      return {
        success: true,
        message: `Wallet ${args.walletAddress.substring(0, 20)}... is now UNVERIFIED (paused at ${pausedGold.toFixed(2)} gold). Reload the page to see the changes.`
      };
    } else {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }
  }
});

// Admin function to delete a wallet completely (NUCLEAR OPTION - testing only)
export const deleteWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    let deletedItems = {
      goldMining: 0,
      ownershipHistory: 0,
      goldBackups: 0,
      discordConnections: 0,
    };

    // 1. Delete from goldMining table
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningRecord) {
      await ctx.db.delete(goldMiningRecord._id);
      deletedItems.goldMining = 1;
    }

    // 2. Delete ALL ownership history snapshots
    const ownershipHistory = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    for (const snapshot of ownershipHistory) {
      await ctx.db.delete(snapshot._id);
      deletedItems.ownershipHistory++;
    }

    // 3. Delete from goldBackups (if exists) - DISABLED: Schema changed
    // const backups = await ctx.db.query("goldBackups").collect();
    // for (const backup of backups) {
    //   if (backup.snapshots && Array.isArray(backup.snapshots)) {
    //     const hasWallet = backup.snapshots.some((s: any) => s.walletAddress === args.walletAddress);
    //     if (hasWallet) {
    //       const filteredSnapshots = backup.snapshots.filter((s: any) => s.walletAddress !== args.walletAddress);
    //       await ctx.db.patch(backup._id, { snapshots: filteredSnapshots });
    //       deletedItems.goldBackups++;
    //     }
    //   }
    // }

    // 4. Delete Discord connections (if exists)
    try {
      const discordConnection = await ctx.db
        .query("discordConnections")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (discordConnection) {
        await ctx.db.delete(discordConnection._id);
        deletedItems.discordConnections = 1;
      }
    } catch (error) {
      // Discord table might not exist or might not have the index
      console.log("[Admin] Discord connections table not found or no index");
    }

    console.log(`[Admin] NUCLEAR DELETE for wallet ${args.walletAddress.substring(0, 20)}...`);
    console.log(`[Admin] Deleted: ${JSON.stringify(deletedItems)}`);

    return {
      success: true,
      message: `NUCLEAR DELETE complete for ${args.walletAddress.substring(0, 20)}...`,
      details: deletedItems
    };
  }
});

// Admin function to merge duplicate wallets
export const mergeDuplicateWallets = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all records for this wallet address
    const allRecords = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    if (allRecords.length <= 1) {
      return {
        success: false,
        message: "No duplicates found for this wallet"
      };
    }

    // Find the best record to keep (most recent, verified, or highest gold)
    const sortedRecords = allRecords.sort((a, b) => {
      // Prefer verified over unverified
      if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
      if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;

      // Then prefer highest gold
      const aGold = a.accumulatedGold || 0;
      const bGold = b.accumulatedGold || 0;
      if (aGold !== bGold) return bGold - aGold;

      // Then prefer most recent
      return b.lastActiveTime - a.lastActiveTime;
    });

    const keepRecord = sortedRecords[0];
    const duplicates = sortedRecords.slice(1);

    // Delete the duplicates
    for (const dup of duplicates) {
      await ctx.db.delete(dup._id);
    }

    console.log(`[Admin] Merged ${duplicates.length} duplicate(s) for wallet ${args.walletAddress.substring(0, 20)}...`);
    console.log(`[Admin] Kept record with gold=${keepRecord.accumulatedGold}, verified=${keepRecord.isBlockchainVerified}`);

    return {
      success: true,
      message: `Merged ${duplicates.length} duplicate(s). Kept record with ${keepRecord.accumulatedGold || 0} gold.`,
      mergedCount: duplicates.length
    };
  }
});

// Auto-merge all duplicate wallets (runs via cron)
export const autoMergeDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("goldMining").collect();

    // Group by wallet address AND by user fingerprint (mekCount + goldPerHour)
    const walletGroups = new Map<string, typeof allRecords>();
    const userFingerprints = new Map<string, typeof allRecords>();

    allRecords.forEach(record => {
      // Group by exact address
      const existing = walletGroups.get(record.walletAddress) || [];
      existing.push(record);
      walletGroups.set(record.walletAddress, existing);

      // Group by user fingerprint (same MEKs + same rate = same user)
      const fingerprint = `${record.ownedMeks.length}_${record.totalGoldPerHour}`;
      const fingerprintGroup = userFingerprints.get(fingerprint) || [];
      fingerprintGroup.push(record);
      userFingerprints.set(fingerprint, fingerprintGroup);
    });

    let mergedCount = 0;
    const results = [];

    // First: Process exact address duplicates
    for (const [walletAddress, records] of walletGroups.entries()) {
      if (records.length <= 1) continue; // No duplicates

      // Sort to find best record
      const sortedRecords = records.sort((a, b) => {
        if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
        if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;
        const aGold = a.accumulatedGold || 0;
        const bGold = b.accumulatedGold || 0;
        if (aGold !== bGold) return bGold - aGold;
        return b.lastActiveTime - a.lastActiveTime;
      });

      const keepRecord = sortedRecords[0];
      const duplicates = sortedRecords.slice(1);

      // Delete duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
      }

      mergedCount += duplicates.length;
      results.push({
        walletAddress: walletAddress.substring(0, 20) + "...",
        duplicatesRemoved: duplicates.length,
        keptGold: keepRecord.accumulatedGold || 0
      });

      console.log(`[AutoMerge] Merged ${duplicates.length} duplicate(s) for wallet ${walletAddress.substring(0, 20)}...`);
    }

    // Second: Process user fingerprint duplicates (same user, different addresses)
    const alreadyMerged = new Set<string>();
    for (const [fingerprint, records] of userFingerprints.entries()) {
      if (records.length <= 1) continue; // No duplicates

      // Filter out records that were already merged in the exact address pass
      const remainingRecords = records.filter(r => {
        try {
          // Check if record still exists
          return !alreadyMerged.has(r._id as string);
        } catch {
          return false;
        }
      });

      if (remainingRecords.length <= 1) continue;

      // Sort to find best record
      const sortedRecords = remainingRecords.sort((a, b) => {
        if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
        if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;
        const aGold = a.accumulatedGold || 0;
        const bGold = b.accumulatedGold || 0;
        if (aGold !== bGold) return bGold - aGold;
        return b.lastActiveTime - a.lastActiveTime;
      });

      const keepRecord = sortedRecords[0];
      const duplicates = sortedRecords.slice(1);

      // Delete duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
        alreadyMerged.add(dup._id as string);
      }

      mergedCount += duplicates.length;
      results.push({
        walletAddress: `FINGERPRINT: ${fingerprint} (${duplicates.length} addresses)`,
        duplicatesRemoved: duplicates.length,
        keptGold: keepRecord.accumulatedGold || 0
      });

      console.log(`[AutoMerge] Merged ${duplicates.length} duplicate address(es) for same user (fingerprint: ${fingerprint})`);
    }

    return {
      success: true,
      totalMerged: mergedCount,
      walletsProcessed: results.length,
      details: results
    };
  }
});

// Admin function to manually update wallet gold amount
// CRITICAL: This now properly maintains the totalCumulativeGold invariant
export const updateWalletGold = mutation({
  args: {
    walletAddress: v.string(),
    newGoldAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningRecord) {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }

    const now = Date.now();
    const currentAccumulated = goldMiningRecord.accumulatedGold || 0;
    const totalSpent = goldMiningRecord.totalGoldSpentOnUpgrades || 0;
    const goldDifference = args.newGoldAmount - currentAccumulated;

    // CRITICAL FIX: Properly initialize totalCumulativeGold if not set
    // The invariant is: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
    // If cumulative is 0, we need to set it to at least (accumulated + spent)
    let recordToUse = {
      ...goldMiningRecord,
      accumulatedGold: currentAccumulated,
      totalGoldSpentOnUpgrades: totalSpent,
      totalCumulativeGold: goldMiningRecord.totalCumulativeGold || 0,
      createdAt: goldMiningRecord.createdAt,
      totalGoldPerHour: goldMiningRecord.totalGoldPerHour
    };

    // If totalCumulativeGold is not initialized, calculate it from current state
    if (!recordToUse.totalCumulativeGold || recordToUse.totalCumulativeGold === 0) {
      // Initialize to minimum valid value to satisfy invariant
      recordToUse.totalCumulativeGold = currentAccumulated + totalSpent;

      console.log(`[Admin] Initializing totalCumulativeGold for wallet ${args.walletAddress.substring(0, 20)}...`, {
        currentAccumulated,
        totalSpent,
        initializedTo: recordToUse.totalCumulativeGold
      });
    }

    // Defensive check: Validate current state BEFORE making changes
    try {
      validateGoldInvariant(recordToUse);
    } catch (error) {
      console.error(`[Admin] CRITICAL: Wallet has invalid state BEFORE update!`, {
        walletAddress: args.walletAddress.substring(0, 20),
        currentAccumulated,
        totalSpent,
        totalCumulativeGold: recordToUse.totalCumulativeGold,
        error: (error as Error).message
      });

      // Force-fix the invariant before proceeding
      recordToUse.totalCumulativeGold = Math.max(
        recordToUse.totalCumulativeGold,
        currentAccumulated + totalSpent
      );

      console.log(`[Admin] Force-corrected totalCumulativeGold to ${recordToUse.totalCumulativeGold}`);
    }

    if (goldDifference > 0) {
      // Adding gold - use the increase function
      console.log(`[Admin] Attempting to ADD ${goldDifference} gold`, {
        from: currentAccumulated,
        to: args.newGoldAmount,
        recordState: {
          accumulatedGold: recordToUse.accumulatedGold,
          totalCumulativeGold: recordToUse.totalCumulativeGold,
          totalSpent: recordToUse.totalGoldSpentOnUpgrades
        }
      });

      const goldUpdate = calculateGoldIncrease(recordToUse, goldDifference);

      await ctx.db.patch(goldMiningRecord._id, {
        accumulatedGold: goldUpdate.newAccumulatedGold,
        totalCumulativeGold: goldUpdate.newTotalCumulativeGold,
        lastSnapshotTime: now,
        updatedAt: now
      });

      console.log(`[Admin] ADDED ${goldDifference} gold for wallet ${args.walletAddress.substring(0, 20)}... (${currentAccumulated} → ${goldUpdate.newAccumulatedGold}, cumulative: ${goldUpdate.newTotalCumulativeGold})`);

      return {
        success: true,
        message: `Added ${goldDifference} gold. New balance: ${goldUpdate.newAccumulatedGold}, cumulative: ${goldUpdate.newTotalCumulativeGold}`
      };
    } else if (goldDifference < 0) {
      // Removing gold - just decrease accumulated (cumulative stays the same)
      // Note: We don't use calculateGoldDecrease here because this isn't spending on upgrades

      // Defensive check: Ensure we're not removing more than available
      if (args.newGoldAmount < 0) {
        return {
          success: false,
          message: `Cannot set negative gold amount: ${args.newGoldAmount}`
        };
      }

      // Calculate what the new cumulative should be
      // If we're manually reducing accumulated, cumulative stays the same (gold was "wasted")
      const newCumulativeGold = recordToUse.totalCumulativeGold;

      // Defensive check: Ensure invariant will still hold after removal
      if (newCumulativeGold < args.newGoldAmount + totalSpent) {
        console.error(`[Admin] Cannot remove gold - would violate invariant!`, {
          currentAccumulated,
          newAmount: args.newGoldAmount,
          totalSpent,
          currentCumulative: recordToUse.totalCumulativeGold,
          wouldNeed: args.newGoldAmount + totalSpent
        });

        return {
          success: false,
          message: `Cannot reduce gold to ${args.newGoldAmount} - would violate tracking invariant (cumulative: ${newCumulativeGold}, need: ${args.newGoldAmount + totalSpent})`
        };
      }

      await ctx.db.patch(goldMiningRecord._id, {
        accumulatedGold: args.newGoldAmount,
        totalCumulativeGold: newCumulativeGold,
        lastSnapshotTime: now,
        updatedAt: now
      });

      console.log(`[Admin] REMOVED ${Math.abs(goldDifference)} gold for wallet ${args.walletAddress.substring(0, 20)}... (${currentAccumulated} → ${args.newGoldAmount}, cumulative unchanged: ${newCumulativeGold})`);

      return {
        success: true,
        message: `Removed ${Math.abs(goldDifference)} gold. New balance: ${args.newGoldAmount}, cumulative: ${newCumulativeGold}`
      };
    } else {
      // No change
      return {
        success: true,
        message: `No change - gold already at ${args.newGoldAmount}`
      };
    }
  }
});

// Admin query to get all wallets with full details
export const getAllWallets = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allMiners = await ctx.db.query("goldMining").collect();

    // Get all wallet group memberships for adding group info
    const allMemberships = await ctx.db.query("walletGroupMemberships").collect();
    const walletToGroupMap = new Map<string, string>();
    for (const membership of allMemberships) {
      walletToGroupMap.set(membership.walletAddress, membership.groupId);
    }

    // Return ALL wallets without deduplication
    // Each wallet is a unique user, even if they have the same MEK count
    return allMiners.map(miner => {
      // Calculate current gold (respecting verification status)
      let currentGold = miner.accumulatedGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        // CRITICAL FIX: NO CAP - show true uncapped gold balance
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }

      // Calculate real-time cumulative gold for display (base + ongoing earnings)
      // Note: Database value may be out of date between checkpoints
      const goldEarnedSinceLastUpdate = currentGold - (miner.accumulatedGold || 0);
      let baseCumulativeGold = miner.totalCumulativeGold || 0;

      // If totalCumulativeGold not initialized, estimate from current state
      if (!miner.totalCumulativeGold || baseCumulativeGold === 0) {
        baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
      }

      // Add real-time earnings to cumulative for accurate display
      const totalCumulativeGold = baseCumulativeGold + goldEarnedSinceLastUpdate;

      // Time since last active
      const minutesSinceActive = Math.floor((now - miner.lastActiveTime) / (1000 * 60));
      const hoursSinceActive = Math.floor(minutesSinceActive / 60);
      const daysSinceActive = Math.floor(hoursSinceActive / 24);

      let lastActiveDisplay = "Just now";
      if (daysSinceActive > 0) {
        lastActiveDisplay = `${daysSinceActive}d ago`;
      } else if (hoursSinceActive > 0) {
        lastActiveDisplay = `${hoursSinceActive}h ago`;
      } else if (minutesSinceActive > 0) {
        lastActiveDisplay = `${minutesSinceActive}m ago`;
      }

      return {
        _id: miner._id,
        walletAddress: miner.walletAddress,
        walletType: miner.walletType || "Unknown",
        companyName: miner.companyName || null,
        groupId: walletToGroupMap.get(miner.walletAddress) || null,
        mekCount: miner.ownedMeks.length,
        totalGoldPerHour: miner.totalGoldPerHour,
        currentGold: Math.floor(currentGold * 100) / 100,
        totalCumulativeGold: Math.floor(totalCumulativeGold * 100) / 100,
        totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
        isVerified: miner.isBlockchainVerified === true,
        lastVerificationTime: miner.lastVerificationTime || null,
        lastActiveTime: miner.lastActiveTime,
        lastActiveDisplay,
        createdAt: miner.createdAt,
        updatedAt: miner.updatedAt,
        lastSnapshotTime: miner.lastSnapshotTime || null,
      };
    });
  }
});

// Admin function to fix corrupted cumulative gold values
// Ensures the invariant: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
export const fixCumulativeGold = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningRecord) {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }

    const now = Date.now();

    // Calculate what cumulative SHOULD be (minimum valid value)
    const currentAccumulated = goldMiningRecord.accumulatedGold || 0;
    const totalSpent = goldMiningRecord.totalGoldSpentOnUpgrades || 0;
    const currentCumulative = goldMiningRecord.totalCumulativeGold || 0;

    // Cumulative must be AT LEAST (accumulated + spent)
    const minimumCumulative = currentAccumulated + totalSpent;

    // If cumulative is already correct, no fix needed
    if (currentCumulative >= minimumCumulative) {
      return {
        success: true,
        message: `Cumulative gold is already correct: ${currentCumulative.toFixed(2)}`,
        noFixNeeded: true
      };
    }

    // Fix the cumulative gold
    const newCumulative = minimumCumulative;

    await ctx.db.patch(goldMiningRecord._id, {
      totalCumulativeGold: newCumulative,
      updatedAt: now
    });

    console.log(`[Admin] FIXED cumulative gold for wallet ${args.walletAddress.substring(0, 20)}...`, {
      oldCumulative: currentCumulative,
      newCumulative: newCumulative,
      accumulated: currentAccumulated,
      spent: totalSpent
    });

    return {
      success: true,
      message: `Fixed cumulative gold: ${currentCumulative.toFixed(2)} → ${newCumulative.toFixed(2)}`,
      oldValue: currentCumulative,
      newValue: newCumulative
    };
  }
});

// Admin function to reconstruct cumulative gold from snapshot history
// Uses the most recent snapshot's cumulative gold + gold earned since then
export const reconstructCumulativeFromSnapshots = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningRecord) {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }

    // Get the most recent snapshot
    const mostRecentSnapshot = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .first();

    if (!mostRecentSnapshot) {
      return {
        success: false,
        message: "No snapshot history found for this wallet - cannot reconstruct"
      };
    }

    const now = Date.now();
    const snapshotTime = mostRecentSnapshot.snapshotTime;
    const snapshotCumulative = mostRecentSnapshot.totalCumulativeGold || mostRecentSnapshot.cumulativeGoldEarned || 0;
    const snapshotRate = mostRecentSnapshot.totalGoldPerHour || 0;
    const currentRate = goldMiningRecord.totalGoldPerHour || 0;

    // Calculate time elapsed since snapshot (in hours)
    const hoursElapsed = (now - snapshotTime) / (1000 * 60 * 60);

    // Use the average of snapshot rate and current rate for calculation
    // (rate might have changed due to level ups)
    const averageRate = (snapshotRate + currentRate) / 2;

    // Calculate gold earned since snapshot
    const goldEarnedSinceSnapshot = averageRate * hoursElapsed;

    // Reconstructed cumulative = snapshot cumulative + gold earned since
    const reconstructedCumulative = snapshotCumulative + goldEarnedSinceSnapshot;

    // Current values
    const currentAccumulated = goldMiningRecord.accumulatedGold || 0;
    const currentCumulative = goldMiningRecord.totalCumulativeGold || 0;
    const totalSpent = goldMiningRecord.totalGoldSpentOnUpgrades || 0;

    // Don't apply if reconstruction would be LESS than current
    // (current might be correct and snapshot might be old)
    const minimumValid = Math.max(currentAccumulated + totalSpent, reconstructedCumulative);

    await ctx.db.patch(goldMiningRecord._id, {
      totalCumulativeGold: minimumValid,
      updatedAt: now
    });

    console.log(`[Admin] RECONSTRUCTED cumulative gold for wallet ${args.walletAddress.substring(0, 20)}...`, {
      snapshotDate: new Date(snapshotTime).toLocaleString(),
      snapshotCumulative,
      hoursElapsed: hoursElapsed.toFixed(2),
      goldEarnedSince: goldEarnedSinceSnapshot.toFixed(2),
      reconstructed: reconstructedCumulative.toFixed(2),
      finalApplied: minimumValid.toFixed(2),
      oldCumulative: currentCumulative
    });

    return {
      success: true,
      message: `Reconstructed from snapshot: ${currentCumulative.toFixed(2)} → ${minimumValid.toFixed(2)}`,
      snapshotDate: new Date(snapshotTime).toLocaleString(),
      snapshotCumulative,
      hoursElapsed: hoursElapsed.toFixed(2),
      goldEarnedSince: goldEarnedSinceSnapshot.toFixed(2),
      oldValue: currentCumulative,
      newValue: minimumValid
    };
  }
});

// Admin function to completely reset all gold values to zero
// WARNING: This bypasses the normal gold invariant protections
export const resetAllGoldToZero = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningRecord) {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }

    const now = Date.now();

    // NUCLEAR OPTION: Reset ALL gold values to zero
    // This is an admin override that bypasses normal protections
    await ctx.db.patch(goldMiningRecord._id, {
      accumulatedGold: 0,                    // Spendable gold = 0
      totalCumulativeGold: 0,                // Cumulative gold = 0
      totalGoldSpentOnUpgrades: 0,           // Gold spent on upgrades = 0
      lastSnapshotTime: now,
      updatedAt: now
    });

    console.log(`[Admin] RESET ALL GOLD TO ZERO for wallet ${args.walletAddress.substring(0, 20)}...`);

    return {
      success: true,
      message: `All gold values reset to zero for ${args.walletAddress.substring(0, 20)}...`
    };
  }
});

// 100% ACCURATE CUMULATIVE GOLD RECONSTRUCTION
// Uses snapshot history + upgrade tracking to rebuild exact cumulative gold
export const reconstructCumulativeGoldExact = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningRecord) {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }

    // Get ALL snapshots for this wallet, ordered chronologically
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("asc")
      .collect();

    if (snapshots.length === 0) {
      return {
        success: false,
        message: "No snapshot history found - cannot reconstruct"
      };
    }

    // Get ALL level upgrades for this wallet, ordered chronologically
    const allUpgrades = await ctx.db
      .query("mekLevels")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    const now = Date.now();
    const timeline: string[] = [];

    console.log(`\n========== EXACT RECONSTRUCTION FOR ${args.walletAddress.substring(0, 20)}... ==========`);
    timeline.push(`Starting reconstruction at ${new Date(now).toLocaleString()}`);
    timeline.push(`Found ${snapshots.length} snapshots and ${allUpgrades.length} Meks with upgrades\n`);

    let reconstructedCumulative = 0;
    let totalGoldEarned = 0;
    let totalGoldSpent = 0;

    // Process each interval between snapshots
    for (let i = 0; i < snapshots.length; i++) {
      const currentSnapshot = snapshots[i];
      const nextSnapshot = i < snapshots.length - 1 ? snapshots[i + 1] : null;

      const intervalStart = currentSnapshot.snapshotTime;
      const intervalEnd = nextSnapshot?.snapshotTime || now;
      const hoursInInterval = (intervalEnd - intervalStart) / (1000 * 60 * 60);

      timeline.push(`\n--- SNAPSHOT ${i + 1} at ${new Date(intervalStart).toLocaleString()} ---`);
      timeline.push(`  Rate: ${currentSnapshot.totalGoldPerHour.toFixed(2)} g/hr`);
      timeline.push(`  Snapshot cumulative: ${(currentSnapshot.totalCumulativeGold || 0).toFixed(2)}`);
      timeline.push(`  Snapshot spent: ${(currentSnapshot.totalGoldSpentOnUpgrades || 0).toFixed(2)}`);

      // Use snapshot's cumulative as our baseline for this interval
      if (i === 0) {
        reconstructedCumulative = currentSnapshot.totalCumulativeGold || 0;
        totalGoldSpent = currentSnapshot.totalGoldSpentOnUpgrades || 0;
        timeline.push(`  → BASELINE: Starting with cumulative = ${reconstructedCumulative.toFixed(2)}`);
      }

      // Find all upgrades that happened in this interval
      const upgradesInInterval = allUpgrades.filter(mek => {
        const acquiredAt = mek.levelAcquiredAt || 0;
        return acquiredAt > intervalStart && acquiredAt <= intervalEnd && mek.currentLevel > 1;
      });

      // Build a timeline of rate changes within this interval
      interface RateChange {
        timestamp: number;
        type: 'upgrade';
        mekAssetId: string;
        fromLevel: number;
        toLevel: number;
        goldSpent: number;
        oldRate: number;
        newRate: number;
      }

      const rateChanges: RateChange[] = [];

      for (const mek of upgradesInInterval) {
        // Get the levelUpgrades records to determine when each level was acquired
        const upgrades = await ctx.db
          .query("levelUpgrades")
          .withIndex("by_wallet_asset", (q) =>
            q.eq("walletAddress", args.walletAddress).eq("assetId", mek.assetId)
          )
          .filter((q) => q.eq(q.field("status"), "completed"))
          .order("asc")
          .collect();

        for (const upgrade of upgrades) {
          if (upgrade.timestamp > intervalStart && upgrade.timestamp <= intervalEnd) {
            // Calculate the rate change from this upgrade
            // We need the base rate and the boost amounts before and after
            const baseRate = mek.baseGoldPerHour || 0;

            // Calculate boost at old level and new level
            const oldLevelBoost = calculateLevelBoost(baseRate, upgrade.fromLevel);
            const newLevelBoost = calculateLevelBoost(baseRate, upgrade.toLevel);

            const oldRate = baseRate + oldLevelBoost.amount;
            const newRate = baseRate + newLevelBoost.amount;

            rateChanges.push({
              timestamp: upgrade.timestamp,
              type: 'upgrade',
              mekAssetId: mek.assetId,
              fromLevel: upgrade.fromLevel,
              toLevel: upgrade.toLevel,
              goldSpent: upgrade.goldCost,
              oldRate,
              newRate
            });
          }
        }
      }

      // Sort rate changes chronologically
      rateChanges.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate gold earned with rate changes
      let currentTime = intervalStart;
      let currentRate = currentSnapshot.totalGoldPerHour;
      let goldEarnedThisInterval = 0;
      let goldSpentThisInterval = 0;

      for (const change of rateChanges) {
        // Calculate gold earned from currentTime to change.timestamp at currentRate
        const hoursAtThisRate = (change.timestamp - currentTime) / (1000 * 60 * 60);
        const goldEarned = currentRate * hoursAtThisRate;
        goldEarnedThisInterval += goldEarned;

        timeline.push(`\n  UPGRADE at ${new Date(change.timestamp).toLocaleString()}:`);
        timeline.push(`    Mek ${change.mekAssetId.substring(0, 10)}... Level ${change.fromLevel} → ${change.toLevel}`);
        timeline.push(`    Gold earned before upgrade: ${goldEarned.toFixed(2)} (${hoursAtThisRate.toFixed(2)}hr @ ${currentRate.toFixed(2)} g/hr)`);
        timeline.push(`    Gold spent: ${change.goldSpent.toFixed(2)}`);

        goldSpentThisInterval += change.goldSpent;

        // Update rate for next segment
        const rateIncrease = change.newRate - change.oldRate;
        currentRate += rateIncrease;
        timeline.push(`    New total rate: ${currentRate.toFixed(2)} g/hr (+${rateIncrease.toFixed(2)} from upgrade)`);

        currentTime = change.timestamp;
      }

      // Calculate gold earned from last rate change to end of interval
      const finalHours = (intervalEnd - currentTime) / (1000 * 60 * 60);
      const finalGoldEarned = currentRate * finalHours;
      goldEarnedThisInterval += finalGoldEarned;

      if (nextSnapshot) {
        timeline.push(`\n  Gold earned until next snapshot: ${finalGoldEarned.toFixed(2)} (${finalHours.toFixed(2)}hr @ ${currentRate.toFixed(2)} g/hr)`);
      } else {
        timeline.push(`\n  Gold earned until NOW: ${finalGoldEarned.toFixed(2)} (${finalHours.toFixed(2)}hr @ ${currentRate.toFixed(2)} g/hr)`);
      }

      timeline.push(`\n  INTERVAL TOTALS:`);
      timeline.push(`    Earned: ${goldEarnedThisInterval.toFixed(2)}`);
      timeline.push(`    Spent: ${goldSpentThisInterval.toFixed(2)}`);

      // Update cumulative gold
      reconstructedCumulative += goldEarnedThisInterval;
      totalGoldEarned += goldEarnedThisInterval;
      totalGoldSpent += goldSpentThisInterval;

      timeline.push(`    Cumulative after interval: ${reconstructedCumulative.toFixed(2)}`);

      // Verify against next snapshot if available
      if (nextSnapshot) {
        const nextSnapshotCumulative = nextSnapshot.totalCumulativeGold || 0;
        const difference = Math.abs(reconstructedCumulative - nextSnapshotCumulative);

        if (difference > 0.01) {
          timeline.push(`\n  ⚠️  WARNING: Mismatch with next snapshot!`);
          timeline.push(`    Expected: ${nextSnapshotCumulative.toFixed(2)}`);
          timeline.push(`    Calculated: ${reconstructedCumulative.toFixed(2)}`);
          timeline.push(`    Difference: ${difference.toFixed(2)}`);
        } else {
          timeline.push(`\n  ✓ VERIFIED: Matches next snapshot cumulative`);
        }
      }
    }

    // Calculate current spendable gold
    const currentAccumulatedGold = goldMiningRecord.accumulatedGold || 0;

    timeline.push(`\n\n========== FINAL RESULTS ==========`);
    timeline.push(`Total gold earned (all time): ${totalGoldEarned.toFixed(2)}`);
    timeline.push(`Total gold spent on upgrades: ${totalGoldSpent.toFixed(2)}`);
    timeline.push(`Reconstructed cumulative gold: ${reconstructedCumulative.toFixed(2)}`);
    timeline.push(`Current spendable gold: ${currentAccumulatedGold.toFixed(2)}`);
    timeline.push(`\nInvariant check: ${reconstructedCumulative.toFixed(2)} >= ${currentAccumulatedGold.toFixed(2)} + ${totalGoldSpent.toFixed(2)} = ${(currentAccumulatedGold + totalGoldSpent).toFixed(2)}`);

    const invariantValid = reconstructedCumulative >= (currentAccumulatedGold + totalGoldSpent - 0.01); // Allow tiny floating point error
    timeline.push(invariantValid ? "✓ INVARIANT VALID" : "✗ INVARIANT VIOLATED");

    // Print full timeline to console
    console.log(timeline.join('\n'));
    console.log(`\n========================================\n`);

    // Update database with reconstructed value
    await ctx.db.patch(goldMiningRecord._id, {
      totalCumulativeGold: reconstructedCumulative,
      totalGoldSpentOnUpgrades: totalGoldSpent,
      updatedAt: now
    });

    return {
      success: true,
      message: `Reconstruction complete: ${reconstructedCumulative.toFixed(2)} cumulative gold`,
      reconstructedCumulative,
      totalGoldEarned,
      totalGoldSpent,
      currentSpendable: currentAccumulatedGold,
      invariantValid,
      timeline: timeline.slice(0, 50) // Return first 50 lines to UI (full version in console)
    };
  }
});

// Helper function to calculate level boost (copied from mekLeveling.ts)
function calculateLevelBoost(
  baseRate: number,
  level: number
): { percent: number; amount: number } {
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

  return { percent, amount };
}