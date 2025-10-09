import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, internalQuery, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { calculateCurrentGold, GOLD_CAP } from "./lib/goldCalculations";

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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
      policyId: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      headVariation: v.optional(v.string()),
      bodyVariation: v.optional(v.string()),
      itemVariation: v.optional(v.string()),
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
        accumulatedGold = Math.min(GOLD_CAP, (miner.accumulatedGold || 0) + goldSinceLastSnapshot);

        // CRITICAL FIX: Also update cumulative gold (tracks all gold earned, even when capped)
        const baseCumulative = miner.totalCumulativeGold || 0;
        newTotalCumulativeGold = baseCumulative + goldSinceLastSnapshot;
      } else {
        // First snapshot - calculate ALL gold from creation
        const hoursSinceCreation = (now - miner.createdAt) / (1000 * 60 * 60);
        const totalGoldEarned = miner.totalGoldPerHour * hoursSinceCreation;
        accumulatedGold = Math.min(GOLD_CAP, totalGoldEarned);

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

    // Look up group membership for historical tracking
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // Store ownership snapshot in history table with COMPLETE game state
    // CRITICAL FIX: Use the NEWLY CALCULATED values (not old database values)
    await ctx.db.insert("mekOwnershipHistory", {
      walletAddress: args.walletAddress,
      groupId: membership?.groupId, // Which corporation this wallet was in
      companyName: miner.companyName, // Corporation name at snapshot time
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
        // Merge with snapshot data, but PREFER snapshot data when available
        return {
          ...existingMek, // Start with existing as base
          // OVERRIDE with complete snapshot data when provided
          assetName: (detail as any).assetName || existingMek.assetName,
          policyId: (detail as any).policyId || existingMek.policyId,
          imageUrl: (detail as any).imageUrl || existingMek.imageUrl,
          headVariation: (detail as any).headVariation || existingMek.headVariation,
          bodyVariation: (detail as any).bodyVariation || existingMek.bodyVariation,
          itemVariation: (detail as any).itemVariation || existingMek.itemVariation,
          rarityRank: detail.rarityRank || existingMek.rarityRank,
          // Update rates and levels
          goldPerHour: detail.goldPerHour,
          baseGoldPerHour: detail.baseGoldPerHour,
          currentLevel: detail.currentLevel,
          levelBoostPercent: detail.levelBoostPercent,
          levelBoostAmount: detail.levelBoostAmount,
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

// Manual trigger for snapshot (admin only) - creates a public action
export const triggerSnapshot = action({
  args: {
    walletAddress: v.optional(v.string()), // Optional: if provided, only snapshot this wallet
  },
  handler: async (ctx, args) => {
    // Log the trigger
    await ctx.runMutation(internal.goldMiningSnapshot.logSnapshotTrigger);

    // Run the actual snapshot
    const result = await ctx.runAction(internal.goldMiningSnapshot.runManualSnapshot, {
      walletAddress: args.walletAddress,
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
  args: {
    walletAddress: v.optional(v.string()), // Optional: if provided, only snapshot this wallet
  },
  handler: async (ctx, args): Promise<{
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
    let allMiners: any[] = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);

    // If walletAddress is provided, filter to just that wallet
    if (args.walletAddress) {
      allMiners = allMiners.filter(miner => miner.walletAddress === args.walletAddress);
      console.log(`Filtering to single wallet: ${args.walletAddress}`);
    }

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
      totalGold = Math.min(GOLD_CAP, miner.totalGoldPerHour * hoursSinceCreation);
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

    // Cap at GOLD_CAP
    totalGold = Math.min(GOLD_CAP, totalGold);

    return {
      totalGold,
      snapshotCount: sortedSnapshots.length,
      method: "history_based",
      lastSnapshotTime: lastSnapshot.snapshotTime
    };
  },
});

