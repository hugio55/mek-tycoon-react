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

        // Query blockchain for current wallet contents using flexible approach
        // This will work for both registered and unregistered stake addresses
        const walletData = await ctx.runAction(api.getWalletAssetsFlexible.getWalletAssetsFlexible, {
          walletIdentifier: stakeAddress,
          paymentAddresses: miner.paymentAddresses || [], // Pass stored payment addresses for fallback
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // Get gold rates for these Meks
          const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
            meks: walletData.meks.map((m: any) => ({
              assetId: m.assetId,
              rarityRank: m.mekNumber // Use mek number as rank for now
            }))
          });

          // Calculate total gold per hour
          const totalGoldPerHour = goldRates.reduce((sum: number, rate: any) =>
            sum + rate.goldPerHour, 0
          );

          console.log(`Wallet ${stakeAddress}: ${walletData.meks.length} Meks, ${totalGoldPerHour} gold/hr`);

          // Update the miner's record with new rate
          await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
            walletAddress: miner.walletAddress,
            mekCount: walletData.meks.length,
            totalGoldPerHour: totalGoldPerHour,
            mekNumbers: mekNumbers,
            mekDetails: walletData.meks.map((m: any, index: number) => ({
              assetId: m.assetId,
              assetName: m.assetName,
              goldPerHour: goldRates[index]?.goldPerHour || 0,
              rarityRank: m.mekNumber
            }))
          });

          updatedCount++;
        } else {
          console.error(`Failed to fetch wallet data: ${walletData.error}`);

          // If wallet not found or has no Meks, set rate to 0
          if (walletData.error === 'Stake address not found' || walletData.totalMeks === 0) {
            await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
              walletAddress: miner.walletAddress,
              mekCount: 0,
              totalGoldPerHour: 0,
              mekNumbers: [],
              mekDetails: []
            });
            updatedCount++;
          } else {
            errorCount++;
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
    })),
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

    // Store ownership snapshot in history table
    await ctx.db.insert("mekOwnershipHistory", {
      walletAddress: args.walletAddress,
      snapshotTime: now,
      meks: args.mekDetails,
      totalGoldPerHour: args.totalGoldPerHour,
      totalMekCount: args.mekCount,
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
    await ctx.db.patch(miner._id, {
      totalGoldPerHour: args.totalGoldPerHour,
      lastSnapshotTime: now,
      snapshotMekCount: args.mekCount,
      updatedAt: now,
      accumulatedGold,
    });

    return { success: true };
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

        // Query blockchain for current wallet contents using flexible approach
        // This will work for both registered and unregistered stake addresses
        const walletData = await ctx.runAction(api.getWalletAssetsFlexible.getWalletAssetsFlexible, {
          walletIdentifier: stakeAddress,
          paymentAddresses: miner.paymentAddresses || [], // Pass stored payment addresses for fallback
        });

        if (walletData.success && walletData.meks) {
          // Calculate new gold rate based on current Mek ownership
          const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);

          // Get gold rates for these Meks
          const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
            meks: walletData.meks.map((m: any) => ({
              assetId: m.assetId,
              rarityRank: m.mekNumber // Use mek number as rank for now
            }))
          });

          // Calculate total gold per hour
          const totalGoldPerHour = goldRates.reduce((sum: number, rate: any) =>
            sum + rate.goldPerHour, 0
          );

          console.log(`Wallet ${stakeAddress}: ${walletData.meks.length} Meks, ${totalGoldPerHour} gold/hr`);

          // Update the miner's record with new rate
          await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
            walletAddress: miner.walletAddress,
            mekCount: walletData.meks.length,
            totalGoldPerHour: totalGoldPerHour,
            mekNumbers: mekNumbers,
            mekDetails: walletData.meks.map((m: any, index: number) => ({
              assetId: m.assetId,
              assetName: m.assetName,
              goldPerHour: goldRates[index]?.goldPerHour || 0,
              rarityRank: m.mekNumber
            }))
          });

          updatedCount++;
        } else {
          console.error(`Failed to fetch wallet data: ${walletData.error}`);

          // If wallet not found or has no Meks, set rate to 0
          if (walletData.error === 'Stake address not found' || walletData.totalMeks === 0) {
            await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
              walletAddress: miner.walletAddress,
              mekCount: 0,
              totalGoldPerHour: 0,
              mekNumbers: [],
              mekDetails: []
            });
            updatedCount++;
          } else {
            errorCount++;
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

