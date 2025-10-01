import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, internalQuery, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";

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
        // Skip if wallet hasn't been active in last 7 days
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        if (miner.lastActiveTime < sevenDaysAgo) {
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
        const walletData = await ctx.runAction(api.getWalletAssetsFlexible.getWalletAssetsFlexible, {
          walletIdentifier: stakeAddress,
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // CRITICAL FIX: Look up existing gold rates from ownedMeks instead of recalculating
          // Create a map of assetId -> existing Mek data with correct gold rates
          const existingMeksMap = new Map(
            miner.ownedMeks.map(mek => [mek.assetId, mek])
          );

          // For each blockchain Mek, use existing rate if available, otherwise fetch proper rate
          const mekDetails = [];
          let totalGoldPerHour = 0;

          for (const blockchainMek of walletData.meks) {
            const existingMek = existingMeksMap.get(blockchainMek.assetId);

            if (existingMek) {
              // Mek exists in database - use its existing gold rate (includes level boosts!)
              mekDetails.push({
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: existingMek.goldPerHour, // Use existing rate (includes boosts)
                rarityRank: existingMek.rarityRank,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                currentLevel: existingMek.currentLevel,
                levelBoostPercent: existingMek.levelBoostPercent,
                levelBoostAmount: existingMek.levelBoostAmount,
              });
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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

      // Don't create a bad snapshot - return error
      return {
        success: false,
        error: "Snapshot validation failed: blockchain returned 0 MEKs but wallet has MEKs in database",
        skipped: true
      };
    }

    // Store ownership snapshot in history table with COMPLETE game state
    await ctx.db.insert("mekOwnershipHistory", {
      walletAddress: args.walletAddress,
      snapshotTime: now,
      meks: args.mekDetails,
      totalGoldPerHour: args.totalGoldPerHour,
      totalMekCount: args.mekCount,

      // Complete game state for full restoration
      accumulatedGold: miner.accumulatedGold || 0,
      totalCumulativeGold: miner.totalCumulativeGold || 0,
      totalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
      lastActiveTime: miner.lastActiveTime,
      lastSnapshotTime: miner.lastSnapshotTime,

      verificationStatus: "verified", // This snapshot passed validation
    });

    // CRITICAL: Calculate accumulated gold properly
    // If this is the first snapshot, we need to calculate from creation time
    // If this is a subsequent snapshot, calculate from last snapshot time
    let accumulatedGold: number;

    if (miner.lastSnapshotTime) {
      // Subsequent snapshot - calculate gold since last snapshot
      const hoursSinceLastSnapshot = (now - miner.lastSnapshotTime) / (1000 * 60 * 60);
      const goldSinceLastSnapshot = miner.totalGoldPerHour * hoursSinceLastSnapshot;
      accumulatedGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastSnapshot);
    } else {
      // First snapshot - calculate ALL gold from creation
      const hoursSinceCreation = (now - miner.createdAt) / (1000 * 60 * 60);
      const totalGoldEarned = miner.totalGoldPerHour * hoursSinceCreation;
      accumulatedGold = Math.min(50000, totalGoldEarned);
    }

    // Update with new Mek count and rate, saving accumulated gold
    const patchData: any = {
      totalGoldPerHour: args.totalGoldPerHour,
      lastSnapshotTime: now,
      snapshotMekCount: args.mekCount,
      updatedAt: now,
      accumulatedGold,
    };

    // Reset consecutive failures counter on successful snapshot
    if (args.snapshotSuccess) {
      patchData.consecutiveSnapshotFailures = 0;
    }

    await ctx.db.patch(miner._id, patchData);

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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
    await ctx.db.insert("goldMiningSnapshotLogs", {
      timestamp: args.timestamp,
      totalMiners: args.totalMiners,
      updatedCount: args.updatedCount,
      errorCount: args.errorCount,
      status: args.status,
    });
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

// Manual trigger for snapshot (admin only) - creates a public action
export const triggerSnapshot = action({
  args: {},
  handler: async (ctx) => {
    // Log the trigger
    await ctx.runMutation(internal.goldMiningSnapshot.logSnapshotTrigger);

    // Run the actual snapshot
    const result = await ctx.runAction(internal.goldMiningSnapshot.runManualSnapshot);

    return result;
  },
});

// Internal mutation to log snapshot trigger
export const logSnapshotTrigger = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    await ctx.db.insert("goldMiningSnapshotLogs", {
      timestamp: now,
      totalMiners: 0,
      updatedCount: 0,
      errorCount: 0,
      status: "triggered_manually",
    });
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
        // Skip if wallet hasn't been active in last 7 days
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        if (miner.lastActiveTime < sevenDaysAgo) {
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
        const walletData = await ctx.runAction(api.getWalletAssetsFlexible.getWalletAssetsFlexible, {
          walletIdentifier: stakeAddress,
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // CRITICAL FIX: Look up existing gold rates from ownedMeks instead of recalculating
          // Create a map of assetId -> existing Mek data with correct gold rates
          const existingMeksMap = new Map(
            miner.ownedMeks.map(mek => [mek.assetId, mek])
          );

          // For each blockchain Mek, use existing rate if available, otherwise fetch proper rate
          const mekDetails = [];
          let totalGoldPerHour = 0;

          for (const blockchainMek of walletData.meks) {
            const existingMek = existingMeksMap.get(blockchainMek.assetId);

            if (existingMek) {
              // Mek exists in database - use its existing gold rate (includes level boosts!)
              mekDetails.push({
                assetId: blockchainMek.assetId,
                assetName: blockchainMek.assetName,
                goldPerHour: existingMek.goldPerHour, // Use existing rate (includes boosts)
                rarityRank: existingMek.rarityRank,
                baseGoldPerHour: existingMek.baseGoldPerHour,
                currentLevel: existingMek.currentLevel,
                levelBoostPercent: existingMek.levelBoostPercent,
                levelBoostAmount: existingMek.levelBoostAmount,
              });
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

    return {
      success: true,
      totalMiners: allMiners.length,
      updatedCount,
      errorCount,
      skippedCount,
    };
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { totalGold: 0, error: "Wallet not found" };
    }

    // Get all snapshots for this wallet, ordered by time
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    // Sort by time
    const sortedSnapshots = snapshots.sort((a, b) => a.snapshotTime - b.snapshotTime);

    let totalGold = 0;

    // If no snapshots yet, use simple calculation from creation
    if (sortedSnapshots.length === 0) {
      const hoursSinceCreation = (now - miner.createdAt) / (1000 * 60 * 60);
      totalGold = Math.min(50000, miner.totalGoldPerHour * hoursSinceCreation);
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

    // Cap at 50,000
    totalGold = Math.min(50000, totalGold);

    return {
      totalGold,
      snapshotCount: sortedSnapshots.length,
      method: "history_based",
      lastSnapshotTime: lastSnapshot.snapshotTime
    };
  },
});

