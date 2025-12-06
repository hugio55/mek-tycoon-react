import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, internalQuery, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { calculateCurrentGold } from "./lib/goldCalculations";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Internal action for scheduled snapshot updates (uses Blockfrost)
export const runNightlySnapshot = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    totalMiners: number;
    updatedCount: number;
    errorCount: number;
    skippedCount: number;
  }> => {
    const now = Date.now();
    console.log('Starting nightly snapshot at:', new Date(now).toISOString());

    // Get all gold mining records directly (avoid circular reference)
    const allMiners: any[] = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const miner of allMiners) {
      try {
        // Skip if wallet hasn't been active in last 15 days
        const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000);
        if (miner.lastActiveTime < fifteenDaysAgo) {
          console.log(`Skipping inactive wallet: ${miner.walletAddress}`);
          skippedCount++;
          continue;
        }

        // Handle both hex and bech32 stake address formats
        let stakeAddress = miner.walletAddress;

        // The blockfrostService will handle conversion if needed
        // Just skip obviously fake test addresses
        if (stakeAddress.startsWith('stake1u') && stakeAddress.length < 50) {
          console.log(`Skipping fake test address: ${stakeAddress}`);
          skippedCount++;
          continue;
        }

        console.log(`Fetching blockchain data for: ${stakeAddress}`);

        // Query blockchain for current wallet contents (stake address only)
        // Use fetchNFTsByStakeAddress with useCache: false to ensure fresh data and proper pagination
        const walletData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
          stakeAddress: stakeAddress,
          useCache: false, // Always fetch fresh data to avoid stale cache
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // CRITICAL FIX: Query mekLevels table for ACTUAL level data (source of truth)
          // Don't trust ownedMeks which might be stale from previous snapshot corruption
          const allMekLevels = await ctx.runQuery(internal.goldMiningSnapshot.getMekLevelsForWallet, {
            walletAddress: miner.walletAddress
          });

          const mekLevelsMap = new Map(
            allMekLevels.map(level => [level.assetId, level])
          );

          console.log(`[Snapshot Debug] Wallet ${stakeAddress}:`, {
            totalMeksInBlockchain: walletData.meks.length,
            mekLevelsFound: allMekLevels.length,
            mekLevelsAssetIds: allMekLevels.map(l => l.assetId.substring(0, 20)),
          });

          // Also get existing ownedMeks for metadata (policyId, imageUrl, variations, etc.)
          const existingMeksMap = new Map(
            miner.ownedMeks.map(mek => [mek.assetId, mek])
          );

          // For each blockchain Mek, use level data from mekLevels (source of truth)
          const mekDetails = [];
          let totalGoldPerHour = 0;

          for (const blockchainMek of walletData.meks) {
            const mekLevel = mekLevelsMap.get(blockchainMek.assetId);
            const existingMek = existingMeksMap.get(blockchainMek.assetId);

            console.log(`[Snapshot Debug] Mek ${blockchainMek.assetName}:`, {
              assetId: blockchainMek.assetId.substring(0, 20),
              hasMekLevel: !!mekLevel,
              hasExistingMek: !!existingMek,
              levelData: mekLevel ? {
                level: mekLevel.currentLevel,
                base: mekLevel.baseGoldPerHour,
                boost: mekLevel.currentBoostAmount,
              } : null,
              existingMekData: existingMek ? {
                goldPerHour: existingMek.goldPerHour,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                levelBoostAmount: existingMek.levelBoostAmount,
              } : null,
            });

            if (mekLevel) {
              // Mek has level data - use it! (source of truth)
              const baseGoldPerHour = mekLevel.baseGoldPerHour || 0;
              const levelBoostAmount = mekLevel.currentBoostAmount || 0;
              const effectiveGoldPerHour = baseGoldPerHour + levelBoostAmount;

              const mekData = {
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: effectiveGoldPerHour,
                rarityRank: existingMek?.rarityRank,
                baseGoldPerHour: baseGoldPerHour,
                currentLevel: mekLevel.currentLevel,
                levelBoostPercent: mekLevel.currentBoostPercent || 0,
                levelBoostAmount: levelBoostAmount,
              };

              console.log(`[Snapshot Debug] Adding Mek via PATH 1 (mekLevel):`, {
                assetName: blockchainMek.assetName,
                goldPerHour: mekData.goldPerHour,
                baseGoldPerHour: mekData.baseGoldPerHour,
                levelBoostAmount: mekData.levelBoostAmount,
              });

              mekDetails.push(mekData);
              totalGoldPerHour += effectiveGoldPerHour;
            } else if (existingMek) {
              // Fallback to ownedMeks if no mekLevel found (shouldn't happen for upgraded Meks)
              const mekData = {
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: existingMek.goldPerHour,
                rarityRank: existingMek.rarityRank,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                currentLevel: existingMek.currentLevel || 1,
                levelBoostPercent: existingMek.levelBoostPercent || 0,
                levelBoostAmount: existingMek.levelBoostAmount || 0,
              };

              console.log(`[Snapshot Debug] Adding Mek via PATH 2 (existingMek fallback):`, {
                assetName: blockchainMek.assetName,
                goldPerHour: mekData.goldPerHour,
                baseGoldPerHour: mekData.baseGoldPerHour,
                levelBoostAmount: mekData.levelBoostAmount,
                WARNING: "This Mek has no mekLevel record but exists in ownedMeks!"
              });

              mekDetails.push(mekData);
              totalGoldPerHour += existingMek.goldPerHour;
            } else {
              // New Mek not in database - need to fetch proper variation data
              console.log(`[Snapshot] New Mek detected: ${blockchainMek.assetName} - fetching variation data`);

              // Import and get proper Mek data
              const { getMekDataByNumber } = await import("../src/lib/mekNumberToVariation");
              const mekData = getMekDataByNumber(blockchainMek.mekNumber);

              if (mekData) {
                const goldPerHour = Math.round(mekData.goldPerHour * 100) / 100;
                mekDetails.push({
                  assetId: blockchainMek.assetId,
                  assetName: blockchainMek.assetName,
                  goldPerHour: goldPerHour,
                  rarityRank: mekData.finalRank,
                  baseGoldPerHour: goldPerHour,
                  currentLevel: 1,
                  levelBoostPercent: 0,
                  levelBoostAmount: 0,
                });
                totalGoldPerHour += goldPerHour;
              } else {
                console.warn(`[Snapshot] Could not find data for Mek #${blockchainMek.mekNumber}`);
              }
            }
          }

          console.log(`Wallet ${stakeAddress}: ${walletData.meks.length} Meks, ${totalGoldPerHour} gold/hr`);

          // Update the miner's record with new rate (success - reset failure counter)
          await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
            walletAddress: miner.walletAddress,
            mekCount: walletData.meks.length,
            totalGoldPerHour: totalGoldPerHour,
            mekNumbers: mekNumbers,
            mekDetails: mekDetails,
            snapshotSuccess: true, // Reset failure counter
          });

          updatedCount++;
        } else {
          console.error(`Failed to fetch wallet data: ${walletData.error}`);

          // DON'T zero out the gold rate - preserve existing data if lookup fails
          // Only update to 0 if we're CERTAIN there are no MEKs
          if (walletData.totalMeks === 0 && walletData.success) {
            // Only if we successfully queried and found 0 MEKs
            await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
              walletAddress: miner.walletAddress,
              mekCount: 0,
              totalGoldPerHour: 0,
              mekNumbers: [],
              mekDetails: []
            });
            updatedCount++;
          } else {
            // Lookup failed - increment failure counter and preserve existing data
            console.log(`Skipping wallet ${miner.walletAddress} - lookup failed, preserving existing data`);
            await ctx.runMutation(internal.goldMiningSnapshot.incrementSnapshotFailure, {
              walletAddress: miner.walletAddress,
            });
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating miner ${miner.walletAddress}:`, error);
        errorCount++;
      }
    }

    // Log snapshot results
    await ctx.runMutation(internal.goldMiningSnapshot.logSnapshotResult, {
      timestamp: now,
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount,
      status: "completed",
    });

    // LOG: Snapshot completion summary to monitoring dashboard
    const severity = errorCount > 0 ? "medium" : "low";
    const eventType = errorCount > 0 ? "warning" : "snapshot";

    await ctx.runMutation(internal.monitoring.logEvent, {
      eventType,
      category: "snapshot",
      message: `6-hour snapshot completed: ${updatedCount}/${allMiners.length} wallets updated successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      severity,
      functionName: "runNightlySnapshot",
      details: {
        totalWallets: allMiners.length,
        successfulUpdates: updatedCount,
        errors: errorCount,
        skipped: skippedCount,
        duration: Date.now() - now,
      },
    });

    return {
      success: true,
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount,
    };
  },
});

// Internal query to get all miners for snapshot
export const getAllMinersForSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("goldMining").collect();
  },
});

// Internal query to get mekLevels for a wallet
export const getMekLevelsForWallet = internalQuery({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekLevels")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();
  },
});

// Internal mutation to update miner after snapshot
export const updateMinerAfterSnapshot = internalMutation({
  args: {
    walletAddress: v.string(),
    mekCount: v.number(),
    totalGoldPerHour: v.number(),
    mekNumbers: v.array(v.number()),
    mekDetails: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      goldPerHour: v.number(),
      rarityRank: v.optional(v.number()),
      baseGoldPerHour: v.optional(v.number()),
      currentLevel: v.optional(v.number()),
      levelBoostPercent: v.optional(v.number()),
      levelBoostAmount: v.optional(v.number()),
    })),
    snapshotSuccess: v.optional(v.boolean()), // Whether snapshot succeeded
  },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { success: false, error: "Wallet not found" };
    }

    const now = Date.now();

    // VALIDATION: Don't store snapshots with suspicious 0s
    // If the wallet currently has ownedMeks but we're trying to snapshot 0, something is wrong
    const currentMekCount = miner.ownedMeks?.length || 0;
    const snapshotMekCount = args.mekCount;

    if (currentMekCount > 0 && snapshotMekCount === 0) {
      console.error(`[Snapshot Validation] REJECTED snapshot for ${args.walletAddress}`);
      console.error(`  Current MEK count: ${currentMekCount}, Snapshot claimed: ${snapshotMekCount}`);
      console.error(`  This suggests a blockchain lookup failure - preserving existing data`);

      // LOG: Snapshot validation failure
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "critical_error",
        category: "snapshot",
        message: `Snapshot validation FAILED: Blockchain returned 0 MEKs but wallet has ${currentMekCount} MEKs in database`,
        severity: "critical",
        functionName: "updateMinerAfterSnapshot",
        walletAddress: args.walletAddress,
        details: {
          currentMekCount,
          snapshotMekCount,
          reason: "Blockchain lookup failure - data preserved",
        },
      });

      // Don't create a bad snapshot - return error
      return {
        success: false,
        error: "Snapshot validation failed: blockchain returned 0 MEKs but wallet has MEKs in database",
        skipped: true
      };
    }

    // ANTI-CHEAT REMOVED FROM PER-WALLET PROCESSING
    // Now runs once per batch in runBatchAntiCheat() to avoid O(N²) bandwidth usage
    // Old approach: 34 wallets × 33 queries each = 1,122 queries per snapshot
    // New approach: 1 query for all wallets = 1 query per snapshot (1,121 fewer queries!)

    // CRITICAL: Calculate accumulated gold properly FIRST
    // BUT ONLY IF USER IS VERIFIED!
    // Show the rate (speedometer) to everyone, but only verified users accumulate gold (car running)
    let accumulatedGold: number;
    let newTotalCumulativeGold: number;
    let spendableGold: number;

    // CHECK VERIFICATION STATUS BEFORE GIVING GOLD
    const isVerified = miner.isBlockchainVerified === true;

    if (isVerified) {
      if (miner.lastSnapshotTime) {
        // Subsequent snapshot - calculate gold since last snapshot
        const hoursSinceLastSnapshot = (now - miner.lastSnapshotTime) / (1000 * 60 * 60);
        const goldSinceLastSnapshot = miner.totalGoldPerHour * hoursSinceLastSnapshot;
        accumulatedGold = (miner.accumulatedGold || 0) + goldSinceLastSnapshot; // CRITICAL FIX: NO CAP!

        // CRITICAL FIX: Also update cumulative gold (tracks all gold earned, uncapped)
        const baseCumulative = miner.totalCumulativeGold || 0;
        newTotalCumulativeGold = baseCumulative + goldSinceLastSnapshot;
      } else {
        // First snapshot - calculate ALL gold from creation
        const hoursSinceCreation = (now - miner.createdAt) / (1000 * 60 * 60);
        const totalGoldEarned = miner.totalGoldPerHour * hoursSinceCreation;
        accumulatedGold = totalGoldEarned; // CRITICAL FIX: NO CAP!

        // Initialize cumulative gold to match accumulated (first snapshot)
        newTotalCumulativeGold = totalGoldEarned + (miner.totalGoldSpentOnUpgrades || 0);
      }
      // Spendable gold is accumulated gold for verified users
      spendableGold = accumulatedGold;
    } else {
      // UNVERIFIED USER - SHOW RATE but DON'T ACCUMULATE GOLD
      console.log(`[Snapshot Security] Skipping gold accumulation for unverified wallet: ${args.walletAddress} (rate: ${args.totalGoldPerHour})`);
      accumulatedGold = miner.accumulatedGold || 0; // Keep existing gold, don't add more
      newTotalCumulativeGold = miner.totalCumulativeGold || 0; // Don't increase cumulative
      spendableGold = accumulatedGold;
    }

    // Store ownership snapshot in history table with COMPLETE game state
    // CRITICAL FIX: Use the NEWLY CALCULATED values (not old database values)
    await ctx.db.insert("mekOwnershipHistory", {
      walletAddress: args.walletAddress,
      snapshotTime: now,
      meks: args.mekDetails,
      totalGoldPerHour: args.totalGoldPerHour,
      totalMekCount: args.mekCount,

      // Complete game state for full restoration
      accumulatedGold: accumulatedGold, // NEW calculated value
      totalCumulativeGold: newTotalCumulativeGold, // NEW calculated value
      totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
      lastActiveTime: miner.lastActiveTime,
      lastSnapshotTime: miner.lastSnapshotTime,

      // New gold tracking fields for blockchain snapshot system
      spendableGold: spendableGold, // NEW calculated value
      cumulativeGoldEarned: newTotalCumulativeGold, // NEW calculated value (matches totalCumulativeGold)

      verificationStatus: "verified", // This snapshot passed validation
    });

    // CRITICAL FIX: Rebuild ownedMeks array with updated level boost data from snapshot
    // This ensures the UI shows correct level boosts after snapshots run
    const existingMeksMap = new Map(miner.ownedMeks.map(mek => [mek.assetId, mek]));
    const updatedOwnedMeks = args.mekDetails.map(detail => {
      const existingMek = existingMeksMap.get(detail.assetId);

      if (existingMek) {
        // Merge existing Mek data with updated level boost data from snapshot
        return {
          ...existingMek, // Preserve all existing fields (policyId, imageUrl, variations, etc.)
          goldPerHour: detail.goldPerHour, // Update total rate
          baseGoldPerHour: detail.baseGoldPerHour, // Update base rate
          currentLevel: detail.currentLevel, // Update level
          levelBoostPercent: detail.levelBoostPercent, // Update boost %
          levelBoostAmount: detail.levelBoostAmount, // Update boost amount
          effectiveGoldPerHour: (detail.baseGoldPerHour || detail.goldPerHour) + (detail.levelBoostAmount || 0),
        };
      } else {
        // New Mek (not in existing ownedMeks) - use snapshot data with defaults for missing fields
        return {
          assetId: detail.assetId,
          policyId: "", // Will be filled by next full sync
          assetName: detail.assetName,
          goldPerHour: detail.goldPerHour,
          rarityRank: detail.rarityRank,
          baseGoldPerHour: detail.baseGoldPerHour || detail.goldPerHour,
          currentLevel: detail.currentLevel || 1,
          levelBoostPercent: detail.levelBoostPercent || 0,
          levelBoostAmount: detail.levelBoostAmount || 0,
          effectiveGoldPerHour: (detail.baseGoldPerHour || detail.goldPerHour) + (detail.levelBoostAmount || 0),
        };
      }
    });

    // Update with new Mek count and rate, saving accumulated gold AND cumulative gold
    // ALWAYS show the rate (speedometer) - but only verified users earn gold (car running)
    const patchData: any = {
      ownedMeks: updatedOwnedMeks, // ✅ CRITICAL FIX: Sync ownedMeks with snapshot data!
      totalGoldPerHour: args.totalGoldPerHour, // ✅ SHOW rate for everyone (speedometer)
      lastSnapshotTime: now,
      snapshotMekCount: args.mekCount,
      updatedAt: now,
      accumulatedGold, // ✅ Only increases if verified (car running)
      totalCumulativeGold: newTotalCumulativeGold, // ✅ CRITICAL FIX: Update cumulative!
    };

    // Reset consecutive failures counter on successful snapshot
    if (args.snapshotSuccess) {
      patchData.consecutiveSnapshotFailures = 0;
    }

    await ctx.db.patch(miner._id, patchData);

    // LOG: Successful snapshot update
    await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
      eventType: "snapshot",
      category: "snapshot",
      message: `Snapshot completed for wallet: ${args.mekCount} MEKs, ${args.totalGoldPerHour.toFixed(2)} g/hr, ${accumulatedGold.toFixed(2)} gold accumulated`,
      severity: "low",
      functionName: "updateMinerAfterSnapshot",
      walletAddress: args.walletAddress,
      details: {
        mekCount: args.mekCount,
        totalGoldPerHour: args.totalGoldPerHour,
        accumulatedGold,
        newTotalCumulativeGold,
        isVerified,
      },
    });

    return { success: true };
  },
});

// Internal mutation to increment snapshot failure counter
export const incrementSnapshotFailure = internalMutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { success: false, error: "Wallet not found" };
    }

    const currentFailures = miner.consecutiveSnapshotFailures || 0;
    const newFailures = currentFailures + 1;

    console.log(`Incrementing snapshot failures for ${args.walletAddress}: ${currentFailures} → ${newFailures}`);

    await ctx.db.patch(miner._id, {
      consecutiveSnapshotFailures: newFailures,
      updatedAt: Date.now(),
    });

    // Log warning if reaching threshold
    if (newFailures >= 3) {
      console.warn(`⚠️ Wallet ${args.walletAddress} has reached ${newFailures} consecutive snapshot failures - gold accumulation will be paused`);

      // Log alert to admin notification system
      await ctx.db.insert("adminNotifications", {
        type: "snapshot_failure_threshold",
        severity: "warning",
        title: `Wallet reached ${newFailures} consecutive snapshot failures`,
        message: `Wallet ${args.walletAddress} has failed ${newFailures} consecutive snapshots. Gold accumulation has been paused.`,
        walletAddress: args.walletAddress,
        data: {
          consecutiveFailures: newFailures,
          threshold: 3,
        },
        timestamp: Date.now(),
        read: false,
      });
    }

    return { success: true, newFailures };
  },
});

// Internal mutation to log snapshot results
export const logSnapshotResult = internalMutation({
  args: {
    timestamp: v.number(),
    totalMiners: v.number(),
    updatedCount: v.number(),
    errorCount: v.number(),
    skippedCount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[logSnapshotResult] 💾 Inserting snapshot log into database:', {
      timestamp: new Date(args.timestamp).toISOString(),
      totalMiners: args.totalMiners,
      updatedCount: args.updatedCount,
      errorCount: args.errorCount,
      status: args.status
    });

    const logId = await ctx.db.insert("goldMiningSnapshotLogs", {
      timestamp: args.timestamp,
      totalMiners: args.totalMiners,
      updatedCount: args.updatedCount,
      errorCount: args.errorCount,
      status: args.status,
    });

    console.log('[logSnapshotResult] ✅ Snapshot log saved with ID:', logId);
  },
});

// Query to check last snapshot time
export const getLastSnapshotTime = query({
  args: {},
  handler: async (ctx) => {
    const lastLog = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .first();

    if (!lastLog) {
      return null;
    }

    return {
      timestamp: lastLog.timestamp,
      totalMiners: lastLog.totalMiners,
      updatedCount: lastLog.updatedCount,
      errorCount: lastLog.errorCount,
      status: lastLog.status,
    };
  },
});

// Manual trigger for snapshot (admin only) - uses batched processing
export const triggerSnapshot = action({
  args: {
    batchSize: v.optional(v.number()), // Optional: wallets per batch (default: 5)
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 5; // Safe default: 5 wallets per batch

    // LOG: Snapshot triggered
    await ctx.runMutation(internal.monitoring.logEvent, {
      eventType: "snapshot",
      category: "snapshot",
      message: `Snapshot triggered manually with batch size ${batchSize}`,
      severity: "low",
      functionName: "triggerSnapshot",
    });

    // Log the trigger
    await ctx.runMutation(internal.goldMiningSnapshot.logSnapshotTrigger);

    // Start batched snapshot processing
    const result = await ctx.runAction(internal.goldMiningSnapshot.runBatchedSnapshot, {
      batchSize,
    });

    return result;
  },
});

// Internal mutation to log snapshot trigger
export const logSnapshotTrigger = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    console.log('[logSnapshotTrigger] 📝 Creating snapshot trigger log at:', new Date(now).toISOString());
    const logId = await ctx.db.insert("goldMiningSnapshotLogs", {
      timestamp: now,
      totalMiners: 0,
      updatedCount: 0,
      errorCount: 0,
      status: "triggered_manually",
    });
    console.log('[logSnapshotTrigger] ✅ Log created with ID:', logId);
  },
});

// Public action for manual snapshot execution
export const runManualSnapshot = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    totalMiners: number;
    updatedCount: number;
    errorCount: number;
    skippedCount: number;
  }> => {
    // Directly call the runNightlySnapshot logic
    const now = Date.now();
    console.log('Starting manual snapshot at:', new Date(now).toISOString());

    // Get all gold mining records directly
    const allMiners: any[] = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);

    console.log(`Starting manual snapshot with ${allMiners.length} wallets to check`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const miner of allMiners) {
      console.log(`Processing wallet: ${miner.walletAddress}`);
      try {
        // MANUAL SNAPSHOTS: Don't skip inactive wallets - admin wants to force update
        // (The automated nightly snapshot DOES skip inactive wallets to save API calls)

        // Handle both hex and bech32 stake address formats
        let stakeAddress = miner.walletAddress;

        // The blockfrostService will handle conversion if needed
        // Just skip obviously fake test addresses
        if (stakeAddress.startsWith('stake1u') && stakeAddress.length < 50) {
          console.log(`Skipping fake test address: ${stakeAddress}`);
          skippedCount++;
          continue;
        }

        console.log(`Fetching blockchain data for: ${stakeAddress}`);

        // Query blockchain for current wallet contents (stake address only)
        // Use fetchNFTsByStakeAddress with useCache: false to ensure fresh data and proper pagination
        const walletData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
          stakeAddress: stakeAddress,
          useCache: false, // Always fetch fresh data to avoid stale cache
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // CRITICAL FIX: Query mekLevels table for ACTUAL level data (source of truth)
          // Don't trust ownedMeks which might be stale from previous snapshot corruption
          const allMekLevels = await ctx.runQuery(internal.goldMiningSnapshot.getMekLevelsForWallet, {
            walletAddress: miner.walletAddress
          });

          const mekLevelsMap = new Map(
            allMekLevels.map(level => [level.assetId, level])
          );

          console.log(`[Snapshot Debug] Wallet ${stakeAddress}:`, {
            totalMeksInBlockchain: walletData.meks.length,
            mekLevelsFound: allMekLevels.length,
            mekLevelsAssetIds: allMekLevels.map(l => l.assetId.substring(0, 20)),
          });

          // Also get existing ownedMeks for metadata (policyId, imageUrl, variations, etc.)
          const existingMeksMap = new Map(
            miner.ownedMeks.map(mek => [mek.assetId, mek])
          );

          // For each blockchain Mek, use level data from mekLevels (source of truth)
          const mekDetails = [];
          let totalGoldPerHour = 0;

          for (const blockchainMek of walletData.meks) {
            const mekLevel = mekLevelsMap.get(blockchainMek.assetId);
            const existingMek = existingMeksMap.get(blockchainMek.assetId);

            console.log(`[Snapshot Debug] Mek ${blockchainMek.assetName}:`, {
              assetId: blockchainMek.assetId.substring(0, 20),
              hasMekLevel: !!mekLevel,
              hasExistingMek: !!existingMek,
              levelData: mekLevel ? {
                level: mekLevel.currentLevel,
                base: mekLevel.baseGoldPerHour,
                boost: mekLevel.currentBoostAmount,
              } : null,
              existingMekData: existingMek ? {
                goldPerHour: existingMek.goldPerHour,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                levelBoostAmount: existingMek.levelBoostAmount,
              } : null,
            });

            if (mekLevel) {
              // Mek has level data - use it! (source of truth)
              const baseGoldPerHour = mekLevel.baseGoldPerHour || 0;
              const levelBoostAmount = mekLevel.currentBoostAmount || 0;
              const effectiveGoldPerHour = baseGoldPerHour + levelBoostAmount;

              const mekData = {
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: effectiveGoldPerHour,
                rarityRank: existingMek?.rarityRank,
                baseGoldPerHour: baseGoldPerHour,
                currentLevel: mekLevel.currentLevel,
                levelBoostPercent: mekLevel.currentBoostPercent || 0,
                levelBoostAmount: levelBoostAmount,
              };

              console.log(`[Snapshot Debug] Adding Mek via PATH 1 (mekLevel):`, {
                assetName: blockchainMek.assetName,
                goldPerHour: mekData.goldPerHour,
                baseGoldPerHour: mekData.baseGoldPerHour,
                levelBoostAmount: mekData.levelBoostAmount,
              });

              mekDetails.push(mekData);
              totalGoldPerHour += effectiveGoldPerHour;
            } else if (existingMek) {
              // Fallback to ownedMeks if no mekLevel found (shouldn't happen for upgraded Meks)
              const mekData = {
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: existingMek.goldPerHour,
                rarityRank: existingMek.rarityRank,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                currentLevel: existingMek.currentLevel || 1,
                levelBoostPercent: existingMek.levelBoostPercent || 0,
                levelBoostAmount: existingMek.levelBoostAmount || 0,
              };

              console.log(`[Snapshot Debug] Adding Mek via PATH 2 (existingMek fallback):`, {
                assetName: blockchainMek.assetName,
                goldPerHour: mekData.goldPerHour,
                baseGoldPerHour: mekData.baseGoldPerHour,
                levelBoostAmount: mekData.levelBoostAmount,
                WARNING: "This Mek has no mekLevel record but exists in ownedMeks!"
              });

              mekDetails.push(mekData);
              totalGoldPerHour += existingMek.goldPerHour;
            } else {
              // New Mek not in database - need to fetch proper variation data
              console.log(`[Snapshot] New Mek detected: ${blockchainMek.assetName} - fetching variation data`);

              // Import and get proper Mek data
              const { getMekDataByNumber } = await import("../src/lib/mekNumberToVariation");
              const mekData = getMekDataByNumber(blockchainMek.mekNumber);

              if (mekData) {
                const goldPerHour = Math.round(mekData.goldPerHour * 100) / 100;
                mekDetails.push({
                  assetId: blockchainMek.assetId,
                  assetName: blockchainMek.assetName,
                  goldPerHour: goldPerHour,
                  rarityRank: mekData.finalRank,
                  baseGoldPerHour: goldPerHour,
                  currentLevel: 1,
                  levelBoostPercent: 0,
                  levelBoostAmount: 0,
                });
                totalGoldPerHour += goldPerHour;
              } else {
                console.warn(`[Snapshot] Could not find data for Mek #${blockchainMek.mekNumber}`);
              }
            }
          }

          console.log(`Wallet ${stakeAddress}: ${walletData.meks.length} Meks, ${totalGoldPerHour} gold/hr`);

          // Update the miner's record with new rate (success - reset failure counter)
          await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
            walletAddress: miner.walletAddress,
            mekCount: walletData.meks.length,
            totalGoldPerHour: totalGoldPerHour,
            mekNumbers: mekNumbers,
            mekDetails: mekDetails,
            snapshotSuccess: true, // Reset failure counter
          });

          updatedCount++;
        } else {
          console.error(`Failed to fetch wallet data: ${walletData.error}`);

          // DON'T zero out the gold rate - preserve existing data if lookup fails
          // Only update to 0 if we're CERTAIN there are no MEKs
          if (walletData.totalMeks === 0 && walletData.success) {
            // Only if we successfully queried and found 0 MEKs
            await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
              walletAddress: miner.walletAddress,
              mekCount: 0,
              totalGoldPerHour: 0,
              mekNumbers: [],
              mekDetails: []
            });
            updatedCount++;
          } else {
            // Lookup failed - increment failure counter and preserve existing data
            console.log(`Skipping wallet ${miner.walletAddress} - lookup failed, preserving existing data`);
            await ctx.runMutation(internal.goldMiningSnapshot.incrementSnapshotFailure, {
              walletAddress: miner.walletAddress,
            });
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating miner ${miner.walletAddress}:`, error);
        errorCount++;
      }
    }

    // Log snapshot results
    console.log('[runManualSnapshot] 📝 Creating completion log:', {
      timestamp: new Date(now).toISOString(),
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount
    });

    await ctx.runMutation(internal.goldMiningSnapshot.logSnapshotResult, {
      timestamp: now,
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount,
      status: "completed",
    });

    console.log('[runManualSnapshot] ✅ Snapshot completed successfully');

    // LOG: Snapshot completion summary to monitoring dashboard
    const severity = errorCount > 0 ? "medium" : "low";
    const eventType = errorCount > 0 ? "warning" : "snapshot";

    await ctx.runMutation(internal.monitoring.logEvent, {
      eventType,
      category: "snapshot",
      message: `Manual snapshot completed: ${updatedCount}/${allMiners.length} wallets updated successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      severity,
      functionName: "runManualSnapshot",
      details: {
        totalWallets: allMiners.length,
        successfulUpdates: updatedCount,
        errors: errorCount,
        skipped: skippedCount,
        duration: Date.now() - now,
      },
    });

    return {
      success: true,
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount,
    };
  },
});

// Batched snapshot processing - uses scheduler to avoid timeouts
export const runBatchedSnapshot = internalAction({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    totalMiners: number;
    message: string;
  }> => {
    const now = Date.now();
    console.log(`[Batched Snapshot] Initializing with batch size: ${args.batchSize}`);

    // Get all wallets
    const allMiners: any[] = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);
    console.log(`[Batched Snapshot] Total wallets to process: ${allMiners.length}`);

    // LOG: Batched snapshot starting
    await ctx.runMutation(internal.monitoring.logEvent, {
      eventType: "snapshot",
      category: "snapshot",
      message: `Batched snapshot started: ${allMiners.length} wallets in batches of ${args.batchSize}`,
      severity: "low",
      functionName: "runBatchedSnapshot",
      details: {
        totalWallets: allMiners.length,
        batchSize: args.batchSize,
        estimatedBatches: Math.ceil(allMiners.length / args.batchSize),
      },
    });

    // Initialize snapshot session state
    await ctx.runMutation(internal.goldMiningSnapshot.initializeSnapshotSession, {
      totalWallets: allMiners.length,
      batchSize: args.batchSize,
      timestamp: now,
    });

    // Schedule first batch immediately
    await ctx.scheduler.runAfter(0, internal.goldMiningSnapshot.processSingleBatch, {
      batchIndex: 0,
      batchSize: args.batchSize,
      sessionId: now.toString(),
    });

    return {
      success: true,
      totalMiners: allMiners.length,
      message: `Snapshot started: ${allMiners.length} wallets queued for processing in batches of ${args.batchSize}`,
    };
  },
});

// Initialize snapshot session tracking
export const initializeSnapshotSession = internalMutation({
  args: {
    totalWallets: v.number(),
    batchSize: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("snapshotSessions", {
      sessionId: args.timestamp.toString(),
      startTime: args.timestamp,
      totalWallets: args.totalWallets,
      batchSize: args.batchSize,
      processedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      status: "in_progress",
    });
  },
});

// Process a single batch of wallets (scheduled function)
export const processSingleBatch = internalAction({
  args: {
    batchIndex: v.number(),
    batchSize: v.number(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[Batch ${args.batchIndex}] Starting...`);

    // Get all wallets and slice this batch
    const allMiners: any[] = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);
    const startIdx = args.batchIndex * args.batchSize;
    const batch = allMiners.slice(startIdx, startIdx + args.batchSize);

    if (batch.length === 0) {
      console.log(`[Batch ${args.batchIndex}] No more wallets to process. Finalizing...`);
      await ctx.runMutation(internal.goldMiningSnapshot.finalizeSnapshotSession, {
        sessionId: args.sessionId,
      });
      return;
    }

    console.log(`[Batch ${args.batchIndex}] Processing ${batch.length} wallets (${startIdx + 1}-${startIdx + batch.length} of ${allMiners.length})`);

    let batchUpdated = 0;
    let batchErrors = 0;
    let batchSkipped = 0;

    for (const miner of batch) {
      try {
        const stakeAddress = miner.walletAddress;

        // Skip fake test addresses
        if (stakeAddress.startsWith('stake1u') && stakeAddress.length < 50) {
          console.log(`[Batch ${args.batchIndex}] Skipping fake test address: ${stakeAddress}`);
          batchSkipped++;
          continue;
        }

        // Query blockchain
        const walletData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
          stakeAddress: stakeAddress,
          useCache: false,
        });

        if (walletData.success && walletData.meks) {
          // Get level data
          const allMekLevels = await ctx.runQuery(internal.goldMiningSnapshot.getMekLevelsForWallet, {
            walletAddress: miner.walletAddress
          });

          const mekLevelsMap = new Map(allMekLevels.map(level => [level.assetId, level]));
          const existingMeksMap = new Map(miner.ownedMeks.map(mek => [mek.assetId, mek]));

          // Build mek details
          const mekDetails = [];
          let totalGoldPerHour = 0;

          for (const blockchainMek of walletData.meks) {
            const mekLevel = mekLevelsMap.get(blockchainMek.assetId);
            const existingMek = existingMeksMap.get(blockchainMek.assetId);

            if (mekLevel) {
              const baseGoldPerHour = mekLevel.baseGoldPerHour || 0;
              const levelBoostAmount = mekLevel.currentBoostAmount || 0;
              const effectiveGoldPerHour = baseGoldPerHour + levelBoostAmount;

              mekDetails.push({
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: effectiveGoldPerHour,
                rarityRank: existingMek?.rarityRank,
                baseGoldPerHour: baseGoldPerHour,
                currentLevel: mekLevel.currentLevel,
                levelBoostPercent: mekLevel.currentBoostPercent || 0,
                levelBoostAmount: levelBoostAmount,
              });
              totalGoldPerHour += effectiveGoldPerHour;
            } else if (existingMek) {
              mekDetails.push({
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: existingMek.goldPerHour,
                rarityRank: existingMek.rarityRank,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                currentLevel: existingMek.currentLevel || 1,
                levelBoostPercent: existingMek.levelBoostPercent || 0,
                levelBoostAmount: existingMek.levelBoostAmount || 0,
              });
              totalGoldPerHour += existingMek.goldPerHour;
            } else {
              // New Mek - fetch data
              const { getMekDataByNumber } = await import("../src/lib/mekNumberToVariation");
              const mekData = getMekDataByNumber(blockchainMek.mekNumber);

              if (mekData) {
                const goldPerHour = Math.round(mekData.goldPerHour * 100) / 100;
                mekDetails.push({
                  assetId: blockchainMek.assetId,
                  assetName: blockchainMek.assetName,
                  goldPerHour: goldPerHour,
                  rarityRank: mekData.finalRank,
                  baseGoldPerHour: goldPerHour,
                  currentLevel: 1,
                  levelBoostPercent: 0,
                  levelBoostAmount: 0,
                });
                totalGoldPerHour += goldPerHour;
              }
            }
          }

          // Update wallet
          await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
            walletAddress: miner.walletAddress,
            mekCount: walletData.meks.length,
            totalGoldPerHour: totalGoldPerHour,
            mekNumbers: walletData.meks.map((m: any) => m.mekNumber),
            mekDetails: mekDetails,
            snapshotSuccess: true,
          });

          batchUpdated++;
          console.log(`[Batch ${args.batchIndex}] ✓ Updated ${stakeAddress}: ${walletData.meks.length} Meks, ${totalGoldPerHour.toFixed(2)} g/hr`);
        } else {
          // Lookup failed
          console.log(`[Batch ${args.batchIndex}] ✗ Lookup failed for ${stakeAddress}`);
          await ctx.runMutation(internal.goldMiningSnapshot.incrementSnapshotFailure, {
            walletAddress: miner.walletAddress,
          });
          batchSkipped++;
        }
      } catch (error) {
        console.error(`[Batch ${args.batchIndex}] Error processing ${miner.walletAddress}:`, error);
        batchErrors++;
      }
    }

    // Update session progress
    await ctx.runMutation(internal.goldMiningSnapshot.updateSnapshotSession, {
      sessionId: args.sessionId,
      processedCount: batchUpdated,
      errorCount: batchErrors,
      skippedCount: batchSkipped,
    });

    console.log(`[Batch ${args.batchIndex}] Complete: ${batchUpdated} updated, ${batchErrors} errors, ${batchSkipped} skipped`);

    // Schedule next batch
    await ctx.scheduler.runAfter(0, internal.goldMiningSnapshot.processSingleBatch, {
      batchIndex: args.batchIndex + 1,
      batchSize: args.batchSize,
      sessionId: args.sessionId,
    });
  },
});

// Update snapshot session progress
export const updateSnapshotSession = internalMutation({
  args: {
    sessionId: v.string(),
    processedCount: v.number(),
    errorCount: v.number(),
    skippedCount: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("snapshotSessions")
      .withIndex("", (q: any) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        processedCount: session.processedCount + args.processedCount,
        errorCount: session.errorCount + args.errorCount,
        skippedCount: session.skippedCount + args.skippedCount,
      });
    }
  },
});

// Finalize snapshot session
export const finalizeSnapshotSession = internalMutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("snapshotSessions")
      .withIndex("", (q: any) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "completed",
        endTime: Date.now(),
      });

      // Log final results
      await ctx.db.insert("goldMiningSnapshotLogs", {
        timestamp: session.startTime,
        totalMiners: session.totalWallets,
        updatedCount: session.processedCount,
        errorCount: session.errorCount,
        status: "completed",
      });

      // BANDWIDTH OPTIMIZATION: Run anti-cheat ONCE after all snapshots (not per-wallet)
      // Schedule it to run immediately after this mutation completes
      console.log(`[Snapshot] Scheduling batch anti-cheat check...`);
      await ctx.scheduler.runAfter(0, internal.goldMiningSnapshot.runBatchAntiCheat, {});

      console.log(`[Snapshot] ✅ Session ${args.sessionId} complete! ${session.processedCount}/${session.totalWallets} wallets updated`);

      // LOG: Snapshot completion summary to monitoring dashboard
      const severity = session.errorCount > 0 ? "medium" : "low";
      const eventType = session.errorCount > 0 ? "warning" : "snapshot";

      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType,
        category: "snapshot",
        message: `Snapshot completed: ${session.processedCount}/${session.totalWallets} wallets updated successfully${session.errorCount > 0 ? `, ${session.errorCount} errors` : ''}${session.skippedCount > 0 ? `, ${session.skippedCount} skipped` : ''}`,
        severity,
        functionName: "finalizeSnapshotSession",
        details: {
          totalWallets: session.totalWallets,
          successfulUpdates: session.processedCount,
          errors: session.errorCount,
          skipped: session.skippedCount,
          duration: Date.now() - session.startTime,
        },
      });
    }
  },
});

// Get snapshot logs for debugging
export const getSnapshotLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const logs = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .take(limit);

    return logs.map(log => ({
      timestamp: log.timestamp,
      date: new Date(log.timestamp).toISOString(),
      totalMiners: log.totalMiners,
      updatedCount: log.updatedCount,
      errorCount: log.errorCount,
      status: log.status,
    }));
  },
});

// Calculate gold based on snapshot history (exploit-proof)
export const calculateGoldFromHistory = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the goldMining record
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { totalGold: 0, error: "Wallet not found" };
    }

    // Get all snapshots for this wallet, ordered by time
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    // Sort by time
    const sortedSnapshots = snapshots.sort((a, b) => a.snapshotTime - b.snapshotTime);

    let totalGold = 0;

    // If no snapshots yet, use simple calculation from creation
    if (sortedSnapshots.length === 0) {
      const hoursSinceCreation = (now - miner.createdAt) / (1000 * 60 * 60);
      totalGold = miner.totalGoldPerHour * hoursSinceCreation; // CRITICAL FIX: NO CAP!
      return { totalGold, snapshotCount: 0, method: "creation_time" };
    }

    // Calculate gold for each period between snapshots
    for (let i = 0; i < sortedSnapshots.length; i++) {
      const snapshot = sortedSnapshots[i];
      const previousTime = i === 0 ? miner.createdAt : sortedSnapshots[i - 1].snapshotTime;
      const currentTime = snapshot.snapshotTime;

      // Calculate hours for this period
      const hours = (currentTime - previousTime) / (1000 * 60 * 60);

      // If this is the first snapshot, credit all Meks from creation
      if (i === 0) {
        totalGold += snapshot.totalGoldPerHour * hours;
      } else {
        // For subsequent snapshots, only credit Meks that were present in BOTH snapshots
        const previousSnapshot = sortedSnapshots[i - 1];
        const previousMekIds = new Set(previousSnapshot.meks.map(m => m.assetId));
        const continuousMeks = snapshot.meks.filter(m => previousMekIds.has(m.assetId));

        // Calculate rate only for continuous Meks
        const continuousRate = continuousMeks.reduce((sum, mek) => sum + mek.goldPerHour, 0);
        totalGold += continuousRate * hours;
      }
    }

    // Add gold from last snapshot to now
    const lastSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
    const hoursSinceLastSnapshot = (now - lastSnapshot.snapshotTime) / (1000 * 60 * 60);
    totalGold += lastSnapshot.totalGoldPerHour * hoursSinceLastSnapshot;

    // CRITICAL FIX: NO CAP - return true uncapped gold!

    return {
      totalGold,
      snapshotCount: sortedSnapshots.length,
      method: "history_based",
      lastSnapshotTime: lastSnapshot.snapshotTime
    };
  },
});

// BANDWIDTH OPTIMIZATION: Batch anti-cheat check
// Runs ONCE per snapshot batch instead of once per wallet (O(N) instead of O(N²))
// Savings: From 1,122 queries to 1 query per snapshot run = 99.9% reduction
export const runBatchAntiCheat = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Anti-Cheat] Running batch anti-cheat check...');
    const now = Date.now();

    // Get ALL wallets in one query
    const allWallets = await ctx.db.query("goldMining").collect();

    // Build MEK asset ID → wallet address map
    const mekToWallet = new Map<string, string>();
    const conflicts: Array<{
      assetId: string;
      assetName: string;
      wallets: string[];
    }> = [];

    // First pass: build map and detect conflicts
    for (const wallet of allWallets) {
      for (const mek of wallet.ownedMeks) {
        const existingWallet = mekToWallet.get(mek.assetId);

        if (existingWallet && existingWallet !== wallet.walletAddress) {
          // Conflict detected!
          const existingConflict = conflicts.find(c => c.assetId === mek.assetId);
          if (existingConflict) {
            if (!existingConflict.wallets.includes(wallet.walletAddress)) {
              existingConflict.wallets.push(wallet.walletAddress);
            }
          } else {
            conflicts.push({
              assetId: mek.assetId,
              assetName: mek.assetName,
              wallets: [existingWallet, wallet.walletAddress],
            });
          }
        } else {
          mekToWallet.set(mek.assetId, wallet.walletAddress);
        }
      }
    }

    if (conflicts.length === 0) {
      console.log('[Anti-Cheat] ✓ No MEK conflicts detected');
      return { conflictsFound: 0, walletsUpdated: 0 };
    }

    console.warn(`[Anti-Cheat] ⚠️ Found ${conflicts.length} MEK(s) in multiple wallets!`);

    let walletsUpdated = 0;

    // Second pass: resolve conflicts
    // Strategy: Keep MEK in most recently active wallet, remove from others
    for (const conflict of conflicts) {
      console.warn(`  MEK ${conflict.assetName} (${conflict.assetId.substring(0, 20)}...) in ${conflict.wallets.length} wallets`);

      // Get wallet records to check last active time
      const walletRecords = await Promise.all(
        conflict.wallets.map(addr =>
          ctx.db
            .query("goldMining")
            .withIndex("by_wallet", q => q.eq("walletAddress", addr))
            .first()
        )
      );

      // Sort by last active time (most recent first)
      const sortedWallets = walletRecords
        .filter(w => w !== null)
        .sort((a, b) => (b!.lastActiveTime || 0) - (a!.lastActiveTime || 0));

      if (sortedWallets.length === 0) continue;

      const keepWallet = sortedWallets[0]!;
      const removeWallets = sortedWallets.slice(1);

      console.warn(`    → Keeping in ${keepWallet.walletAddress.substring(0, 15)}... (most recent)`);

      // Remove from other wallets
      for (const wallet of removeWallets) {
        const filteredMeks = wallet.ownedMeks.filter(m => m.assetId !== conflict.assetId);
        const newRate = filteredMeks.reduce((sum, m) => sum + (m.goldPerHour || 0), 0);

        await ctx.db.patch(wallet._id, {
          ownedMeks: filteredMeks,
          totalGoldPerHour: newRate,
          updatedAt: now,
        });

        console.warn(`    → Removed from ${wallet.walletAddress.substring(0, 15)}...`);
        walletsUpdated++;

        // Log conflict resolution
        await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
          eventType: "warning",
          category: "snapshot",
          message: `ANTI-CHEAT: Duplicate MEK removed from wallet`,
          severity: "high",
          functionName: "runBatchAntiCheat",
          walletAddress: wallet.walletAddress,
          details: {
            mekAssetId: conflict.assetId,
            mekAssetName: conflict.assetName,
            keptInWallet: keepWallet.walletAddress.substring(0, 15),
            removedFromWallet: wallet.walletAddress.substring(0, 15),
          },
        });
      }
    }

    console.log(`[Anti-Cheat] ✓ Resolved ${conflicts.length} conflicts, updated ${walletsUpdated} wallets`);

    return {
      conflictsFound: conflicts.length,
      walletsUpdated,
    };
  },
});

