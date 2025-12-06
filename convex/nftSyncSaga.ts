import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { devLog } from "./lib/devLog";

/**
 * NFT SYNC SAGA - Atomic Synchronization with Rollback
 *
 * This implements the Saga pattern for NFT synchronization:
 * - Each step is independently executed
 * - Each step defines a compensation action (rollback)
 * - If any step fails, all previous steps are rolled back
 * - Prevents partial data corruption
 */

// Saga execution state
interface SagaStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "compensated";
  startTime?: number;
  endTime?: number;
  error?: string;
  data?: any;
}

interface SagaExecution {
  sagaId: string;
  walletAddress: string;
  steps: SagaStep[];
  status: "running" | "completed" | "failed" | "compensating";
  startTime: number;
  endTime?: number;
  checksum?: string;
}

// Store saga execution state for recovery
export const createSagaExecution = mutation({
  args: {
    sagaId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.insert("sagaExecutions", {
      sagaId: args.sagaId,
      walletAddress: args.walletAddress,
      steps: [],
      status: "running",
      startTime: now,
    });

    devLog.log(`[Saga] Created saga execution: ${args.sagaId}`);
    return args.sagaId;
  },
});

// Update saga step status
export const updateSagaStep = mutation({
  args: {
    sagaId: v.string(),
    stepName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("compensated")
    ),
    error: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const saga = await ctx.db
      .query("sagaExecutions")
      .withIndex("", (q: any) => q.eq("sagaId", args.sagaId))
      .first();

    if (!saga) {
      throw new Error(`Saga ${args.sagaId} not found`);
    }

    // Update or add step
    const stepIndex = saga.steps.findIndex(s => s.name === args.stepName);
    const updatedStep: SagaStep = {
      name: args.stepName,
      status: args.status,
      startTime: Date.now(),
      endTime: args.status === "completed" || args.status === "failed" ? Date.now() : undefined,
      error: args.error,
      data: args.data,
    };

    let newSteps;
    if (stepIndex >= 0) {
      newSteps = [...saga.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], ...updatedStep };
    } else {
      newSteps = [...saga.steps, updatedStep];
    }

    await ctx.db.patch(saga._id, { steps: newSteps });

    devLog.log(`[Saga] Step ${args.stepName}: ${args.status}`);
  },
});

// Complete saga execution
export const completeSagaExecution = mutation({
  args: {
    sagaId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    checksum: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const saga = await ctx.db
      .query("sagaExecutions")
      .withIndex("", (q: any) => q.eq("sagaId", args.sagaId))
      .first();

    if (!saga) {
      throw new Error(`Saga ${args.sagaId} not found`);
    }

    await ctx.db.patch(saga._id, {
      status: args.status,
      endTime: Date.now(),
      checksum: args.checksum,
    });

    devLog.log(`[Saga] Saga ${args.sagaId} ${args.status}`);
  },
});

/**
 * MAIN SAGA: Sync wallet NFTs from blockchain with atomic guarantees
 */
export const syncWalletNFTsWithSaga = action({
  args: {
    stakeAddress: v.string(),
    walletType: v.string(),
    forceResync: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sagaId = `saga_${args.stakeAddress}_${Date.now()}`;

    devLog.log(`[Saga] Starting NFT sync saga: ${sagaId}`);

    // Create saga execution record
    await ctx.runMutation(api.nftSyncSaga.createSagaExecution, {
      sagaId,
      walletAddress: args.stakeAddress,
    });

    const compensations: Array<() => Promise<void>> = [];

    try {
      // ============================================================
      // STEP 1: Authenticate Wallet
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "authenticate",
        status: "running",
      });

      const authCheck = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
        stakeAddress: args.stakeAddress,
      });

      if (!authCheck.authenticated) {
        throw new Error("Wallet not authenticated");
      }

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "authenticate",
        status: "completed",
      });

      // No compensation needed for auth check (read-only)

      // ============================================================
      // STEP 2: Fetch NFTs from Blockchain
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "fetch_blockchain",
        status: "running",
      });

      const nftResult = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.stakeAddress,
        useCache: false, // Force fresh data for saga
      });

      if (!nftResult.success || !nftResult.meks || nftResult.meks.length === 0) {
        throw new Error(`Blockchain fetch failed: ${nftResult.error || "No Meks found"}`);
      }

      devLog.log(`[Saga] Fetched ${nftResult.meks.length} Meks from blockchain`);

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "fetch_blockchain",
        status: "completed",
        data: { mekCount: nftResult.meks.length },
      });

      // Compensation: Clear NFT cache
      compensations.push(async () => {
        devLog.log(`[Saga] Compensating: Clearing NFT cache for ${args.stakeAddress}`);
        // NFT cache is stateless, no cleanup needed
      });

      // ============================================================
      // STEP 3: Enrich Mek Data (Variations, Gold Rates)
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "enrich_data",
        status: "running",
      });

      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      const enrichedMeks = [];
      const failedMeks = [];

      for (const mek of nftResult.meks) {
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          // Don't fail - use fallback data
          devLog.warn(`[Saga] No data for Mek #${mek.mekNumber}, using fallback`);
          failedMeks.push(mek.mekNumber);

          enrichedMeks.push({
            assetId: mek.assetId,
            policyId: mek.policyId,
            assetName: mek.assetName,
            mekNumber: mek.mekNumber,
            imageUrl: getMekImageUrl(mek.mekNumber),
            goldPerHour: 10, // Fallback rate
            rarityRank: 2000, // Fallback rank
            headVariation: "Unknown",
            bodyVariation: "Unknown",
            itemVariation: "Unknown",
            sourceKey: `UNKNOWN-${mek.mekNumber}`,
          });
        } else {
          enrichedMeks.push({
            assetId: mek.assetId,
            policyId: mek.policyId,
            assetName: mek.assetName,
            mekNumber: mek.mekNumber,
            imageUrl: getMekImageUrl(mek.mekNumber),
            goldPerHour: Math.round(mekData.goldPerHour * 100) / 100,
            rarityRank: mekData.finalRank,
            headVariation: mekData.headGroup,
            bodyVariation: mekData.bodyGroup,
            itemVariation: mekData.itemGroup,
            sourceKey: mekData.sourceKey,
          });
        }
      }

      if (failedMeks.length > 0) {
        devLog.warn(`[Saga] ${failedMeks.length} Meks used fallback data: ${failedMeks.join(", ")}`);
      }

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "enrich_data",
        status: "completed",
        data: { enrichedCount: enrichedMeks.length, failedCount: failedMeks.length },
      });

      // Compensation: None needed (in-memory operation)

      // ============================================================
      // STEP 4: Fetch Level Boosts
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "fetch_levels",
        status: "running",
      });

      const mekLevels = await ctx.runQuery(api.mekLeveling.getMekLevels, {
        walletAddress: args.stakeAddress,
      });

      const levelMap = new Map(mekLevels.map(level => [level.assetId, level]));

      const meksWithLevelBoosts = enrichedMeks.map(m => {
        const levelData = levelMap.get(m.assetId);
        const currentLevel = levelData?.currentLevel || 1;
        const boostPercent = levelData?.currentBoostPercent || 0;
        const boostAmount = levelData?.currentBoostAmount || 0;
        const effectiveRate = m.goldPerHour + boostAmount;

        return {
          ...m,
          baseGoldPerHour: m.goldPerHour,
          currentLevel,
          levelBoostPercent: boostPercent,
          levelBoostAmount: boostAmount,
          effectiveGoldPerHour: effectiveRate,
          goldPerHour: effectiveRate,
        };
      });

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "fetch_levels",
        status: "completed",
        data: { meksWithBoosts: meksWithLevelBoosts.length },
      });

      // Compensation: None needed (read-only)

      // ============================================================
      // STEP 5: Calculate Checksum (for verification)
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "calculate_checksum",
        status: "running",
      });

      const checksum = calculateChecksum(meksWithLevelBoosts);

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "calculate_checksum",
        status: "completed",
        data: { checksum },
      });

      // ============================================================
      // STEP 6: Persist to Database (CRITICAL - Atomic Operation)
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "persist_database",
        status: "running",
      });

      // Take snapshot of current state BEFORE updating
      const existingData = await ctx.runQuery(api.goldMining.getGoldMiningData, {
        walletAddress: args.stakeAddress,
      });

      const meksForMutation = meksWithLevelBoosts.map(m => ({
        assetId: m.assetId,
        policyId: m.policyId,
        assetName: m.assetName,
        imageUrl: m.imageUrl,
        goldPerHour: m.goldPerHour,
        rarityRank: m.rarityRank,
        headVariation: m.headVariation,
        bodyVariation: m.bodyVariation,
        itemVariation: m.itemVariation,
        baseGoldPerHour: m.baseGoldPerHour,
        currentLevel: m.currentLevel,
        levelBoostPercent: m.levelBoostPercent,
        levelBoostAmount: m.levelBoostAmount,
        effectiveGoldPerHour: m.effectiveGoldPerHour,
      }));

      // Atomic database update
      await ctx.runMutation(api.goldMining.initializeGoldMining, {
        walletAddress: args.stakeAddress,
        walletType: args.walletType,
        ownedMeks: meksForMutation,
      });

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "persist_database",
        status: "completed",
        data: { mekCount: meksForMutation.length },
      });

      // Compensation: Rollback to previous state
      compensations.push(async () => {
        devLog.log(`[Saga] Compensating: Rolling back database for ${args.stakeAddress}`);

        if (existingData && existingData.ownedMeks) {
          // Restore previous state
          await ctx.runMutation(api.goldMining.initializeGoldMining, {
            walletAddress: args.stakeAddress,
            walletType: args.walletType,
            ownedMeks: existingData.ownedMeks,
          });
          devLog.log(`[Saga] Rolled back to ${existingData.ownedMeks.length} Meks`);
        } else {
          devLog.warn(`[Saga] No previous state to rollback to`);
        }
      });

      // ============================================================
      // STEP 7: Verify Sync
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "verify_sync",
        status: "running",
      });

      const verifiedData = await ctx.runQuery(api.goldMining.getGoldMiningData, {
        walletAddress: args.stakeAddress,
      });

      if (!verifiedData || verifiedData.ownedMeks.length !== meksForMutation.length) {
        throw new Error(
          `Verification failed: Expected ${meksForMutation.length} Meks, got ${verifiedData?.ownedMeks.length || 0}`
        );
      }

      const verifiedChecksum = calculateChecksum(verifiedData.ownedMeks);
      if (verifiedChecksum !== checksum) {
        throw new Error(`Checksum mismatch: Expected ${checksum}, got ${verifiedChecksum}`);
      }

      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "verify_sync",
        status: "completed",
        data: { checksum: verifiedChecksum },
      });

      // ============================================================
      // SUCCESS - Complete Saga
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.completeSagaExecution, {
        sagaId,
        status: "completed",
        checksum,
      });

      devLog.log(`[Saga] NFT sync completed successfully: ${sagaId}`);

      return {
        success: true,
        sagaId,
        mekCount: meksWithLevelBoosts.length,
        checksum,
        failedMeks: failedMeks.length,
      };

    } catch (error: any) {
      devLog.errorAlways(`[Saga] Saga failed: ${error.message}`);

      // ============================================================
      // FAILURE - Execute Compensations in Reverse Order
      // ============================================================
      await ctx.runMutation(api.nftSyncSaga.updateSagaStep, {
        sagaId,
        stepName: "compensation",
        status: "running",
      });

      for (const compensate of compensations.reverse()) {
        try {
          await compensate();
        } catch (compError: any) {
          devLog.errorAlways(`[Saga] Compensation failed: ${compError.message}`);
        }
      }

      await ctx.runMutation(api.nftSyncSaga.completeSagaExecution, {
        sagaId,
        status: "failed",
      });

      return {
        success: false,
        sagaId,
        error: error.message,
        mekCount: 0,
      };
    }
  },
});

// Get saga execution details
export const getSagaExecution = query({
  args: { sagaId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sagaExecutions")
      .withIndex("", (q: any) => q.eq("sagaId", args.sagaId))
      .first();
  },
});

// Get recent saga executions for a wallet
export const getRecentSagas = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    return await ctx.db
      .query("sagaExecutions")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(limit);
  },
});

// Helper: Calculate checksum from Mek array
function calculateChecksum(meks: any[]): string {
  // Sort by assetId for deterministic ordering
  const sortedAssetIds = meks
    .map(m => m.assetId || m.assetName)
    .sort();

  // Create checksum string
  const checksumInput = sortedAssetIds.join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < checksumInput.length; i++) {
    const char = checksumInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `v1_${hash.toString(16)}_n${meks.length}`;
}

/**
 * Manual wallet re-scan - syncs all wallets in the group
 */
export const manualRescanWalletGroup = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    devLog.log(`[ManualRescan] Starting manual rescan for wallet group: ${args.walletAddress}`);

    // Get all wallets in this group
    const walletGroup = await ctx.runQuery(api.walletGroups.getMyGroupWallets, {
      walletAddress: args.walletAddress,
    });

    if (!walletGroup || walletGroup.length === 0) {
      throw new Error("No wallets found in group");
    }

    const results = [];

    // Re-sync each wallet in the group
    for (const wallet of walletGroup) {
      devLog.log(`[ManualRescan] Syncing wallet: ${wallet.walletAddress}`);

      try {
        const syncResult = await ctx.runAction(api.nftSyncSaga.syncWalletNFTsWithSaga, {
          stakeAddress: wallet.walletAddress,
          walletType: 'Manual-Rescan',
          forceResync: true,
        });

        results.push({
          walletAddress: wallet.walletAddress,
          success: syncResult.success,
          mekCount: syncResult.mekCount,
          error: syncResult.error,
        });

        devLog.log(`[ManualRescan] ✓ Synced ${wallet.walletAddress}: ${syncResult.mekCount} Meks`);
      } catch (error: any) {
        devLog.errorAlways(`[ManualRescan] Failed to sync ${wallet.walletAddress}: ${error.message}`);
        results.push({
          walletAddress: wallet.walletAddress,
          success: false,
          mekCount: 0,
          error: error.message,
        });
      }
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalMeks = results.reduce((sum, r) => sum + (r.mekCount || 0), 0);

    devLog.log(`[ManualRescan] Completed: ${totalSuccess}/${walletGroup.length} wallets synced, ${totalMeks} total Meks`);

    return {
      success: totalSuccess > 0,
      walletsScanned: walletGroup.length,
      walletsSucceeded: totalSuccess,
      totalMeks,
      results,
    };
  },
});
