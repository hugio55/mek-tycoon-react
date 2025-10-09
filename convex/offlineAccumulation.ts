import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { GOLD_CAP } from "./lib/goldCalculations";

// Maximum gold cap (imported from goldCalculations)
const MAX_GOLD = GOLD_CAP;

// Update all users' gold accumulation (runs via cron)
export const updateAllUsersGold = action({
  args: {},
  handler: async (ctx) => {
    try {
      const startTime = Date.now();
      console.log("[OfflineAccumulation] Starting gold update for all users");

      // Get all gold mining records
      const allMiners = await ctx.runQuery(api.goldMining.getAllGoldMiningData);

      let updatedCount = 0;
      let errorCount = 0;

      for (const miner of allMiners) {
        try {
          // Calculate gold accumulated since last snapshot
          const now = Date.now();
          const lastSnapshot = miner.lastSnapshotTime || miner.createdAt;
          const hoursSinceSnapshot = (now - lastSnapshot) / (1000 * 60 * 60);

          // Skip if updated within last minute (avoid unnecessary updates)
          if (hoursSinceSnapshot < 1/60) {
            continue;
          }

          // VERIFICATION CHECK: Only accumulate gold if wallet is verified
          let goldGenerated = 0;
          let newGoldAmount = miner.accumulatedGold || 0;

          if (miner.isVerified === true) {
            goldGenerated = miner.totalGoldPerHour * hoursSinceSnapshot;
            newGoldAmount = Math.min(MAX_GOLD, (miner.accumulatedGold || 0) + goldGenerated);
          }
          // If not verified, gold stays at current accumulated amount

          // Update the snapshot
          await ctx.runMutation(api.offlineAccumulation.createGoldSnapshot, {
            walletAddress: miner.walletAddress,
            accumulatedGold: newGoldAmount,
            goldPerHour: miner.totalGoldPerHour,
            mekCount: miner.mekCount,
          });

          updatedCount++;
        } catch (error) {
          console.error(`[OfflineAccumulation] Error updating ${miner.walletAddress}:`, error);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[OfflineAccumulation] Completed. Updated ${updatedCount} users, ${errorCount} errors, took ${duration}ms`);

      return {
        success: true,
        updatedCount,
        errorCount,
        duration,
        totalUsers: allMiners.length,
      };
    } catch (error: any) {
      console.error("[OfflineAccumulation] Fatal error:", error);
      return {
        success: false,
        error: error.message,
        updatedCount: 0,
        errorCount: 0,
        duration: 0,
        totalUsers: 0,
      };
    }
  },
});

// Create a gold snapshot for a user
export const createGoldSnapshot = mutation({
  args: {
    walletAddress: v.string(),
    accumulatedGold: v.number(),
    goldPerHour: v.number(),
    mekCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get existing gold mining record
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      console.error(`[Snapshot] Gold mining record not found for ${args.walletAddress}`);
      return { success: false };
    }

    // Update the accumulated gold and snapshot time
    await ctx.db.patch(existing._id, {
      accumulatedGold: Math.min(MAX_GOLD, args.accumulatedGold),
      lastSnapshotTime: now,
      updatedAt: now,
    });

    // Also create a snapshot record for history
    await ctx.db.insert("goldSnapshots", {
      walletAddress: args.walletAddress,
      accumulatedGold: args.accumulatedGold,
      goldPerHour: args.goldPerHour,
      mekCount: args.mekCount,
      timestamp: now,
    });

    return { success: true };
  },
});

// Get gold snapshot history for a wallet
export const getGoldSnapshots = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const snapshots = await ctx.db
      .query("goldSnapshots")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(limit);

    return snapshots;
  },
});

// Calculate offline gold for a specific user
export const calculateOfflineGold = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMiningData = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMiningData) {
      return {
        currentGold: 0,
        offlineGold: 0,
        totalGoldPerHour: 0,
        lastActiveTime: null,
      };
    }

    const now = Date.now();

    // VERIFICATION CHECK: Only calculate gold if wallet is verified
    let goldSinceSnapshot = 0;
    let currentGold = goldMiningData.accumulatedGold || 0;
    let offlineGold = 0;

    if (goldMiningData.isBlockchainVerified === true) {
      // Calculate from last snapshot
      const lastSnapshot = goldMiningData.lastSnapshotTime || goldMiningData.createdAt;
      const hoursSinceSnapshot = (now - lastSnapshot) / (1000 * 60 * 60);
      goldSinceSnapshot = goldMiningData.totalGoldPerHour * hoursSinceSnapshot;

      // Calculate total gold (capped at MAX_GOLD)
      currentGold = Math.min(MAX_GOLD, (goldMiningData.accumulatedGold || 0) + goldSinceSnapshot);

      // Calculate offline gold (gold earned while inactive)
      const hoursSinceActive = (now - goldMiningData.lastActiveTime) / (1000 * 60 * 60);
      offlineGold = Math.max(0, goldMiningData.totalGoldPerHour * hoursSinceActive);
    }
    // If not verified, all values stay at 0/base

    // Calculate hours since active and snapshot for return (only if verified)
    const lastSnapshot = goldMiningData.lastSnapshotTime || goldMiningData.createdAt;
    const hoursSinceSnapshot = goldMiningData.isBlockchainVerified === true
      ? (now - lastSnapshot) / (1000 * 60 * 60)
      : 0;
    const hoursSinceActive = goldMiningData.isBlockchainVerified === true
      ? (now - goldMiningData.lastActiveTime) / (1000 * 60 * 60)
      : 0;

    return {
      currentGold,
      offlineGold: Math.min(offlineGold, currentGold), // Can't exceed total gold
      totalGoldPerHour: goldMiningData.totalGoldPerHour,
      lastActiveTime: goldMiningData.lastActiveTime,
      lastSnapshotTime: lastSnapshot,
      hoursSinceActive,
      hoursSinceSnapshot,
    };
  },
});

// Checkpoint system for preventing gold loss
export const createGoldCheckpoint = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get current gold state
      const goldData = await ctx.runQuery(api.offlineAccumulation.calculateOfflineGold, {
        walletAddress: args.walletAddress,
      });

      // Create checkpoint
      await ctx.runMutation(api.offlineAccumulation.saveGoldCheckpoint, {
        walletAddress: args.walletAddress,
        goldAmount: goldData.currentGold,
        goldPerHour: goldData.totalGoldPerHour,
      });

      return {
        success: true,
        checkpoint: {
          gold: goldData.currentGold,
          timestamp: Date.now(),
        },
      };
    } catch (error: any) {
      console.error("[Checkpoint] Error creating checkpoint:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Save a gold checkpoint
export const saveGoldCheckpoint = mutation({
  args: {
    walletAddress: v.string(),
    goldAmount: v.number(),
    goldPerHour: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create checkpoint record
    await ctx.db.insert("goldCheckpoints", {
      walletAddress: args.walletAddress,
      goldAmount: args.goldAmount,
      goldPerHour: args.goldPerHour,
      timestamp: now,
      type: "manual",
    });

    // Also update the main gold mining record
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accumulatedGold: args.goldAmount,
        lastSnapshotTime: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Restore from checkpoint (in case of issues)
export const restoreFromCheckpoint = mutation({
  args: {
    walletAddress: v.string(),
    checkpointId: v.optional(v.id("goldCheckpoints")),
  },
  handler: async (ctx, args) => {
    // Get the checkpoint to restore from
    let checkpoint;
    if (args.checkpointId) {
      checkpoint = await ctx.db.get(args.checkpointId);
    } else {
      // Get the latest checkpoint
      checkpoint = await ctx.db
        .query("goldCheckpoints")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .order("desc")
        .first();
    }

    if (!checkpoint) {
      throw new Error("No checkpoint found to restore from");
    }

    // Restore the gold mining record
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      throw new Error("Gold mining record not found");
    }

    await ctx.db.patch(existing._id, {
      accumulatedGold: checkpoint.goldAmount,
      totalGoldPerHour: checkpoint.goldPerHour,
      lastSnapshotTime: checkpoint.timestamp,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      restoredGold: checkpoint.goldAmount,
      checkpointTime: checkpoint.timestamp,
    };
  },
});

// Get snapshots by wallet
export const getSnapshotsByWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goldSnapshots")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();
  },
});

// Delete a snapshot
export const deleteSnapshot = mutation({
  args: {
    snapshotId: v.id("goldSnapshots"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.snapshotId);
    return { success: true };
  },
});

// Get checkpoints by wallet
export const getCheckpointsByWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goldCheckpoints")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();
  },
});

// Delete a checkpoint
export const deleteCheckpoint = mutation({
  args: {
    checkpointId: v.id("goldCheckpoints"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.checkpointId);
    return { success: true };
  },
});

// Clean up old snapshots/checkpoints (keep last 100 per user)
export const cleanupOldSnapshots = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all unique wallet addresses
      const allMiners = await ctx.runQuery(api.goldMining.getAllGoldMiningData);
      let totalDeleted = 0;

      for (const miner of allMiners) {
        // Get all snapshots for this wallet
        const snapshots = await ctx.runQuery(api.offlineAccumulation.getSnapshotsByWallet, {
          walletAddress: miner.walletAddress,
        });

        // If more than 100, delete the oldest ones
        if (snapshots.length > 100) {
          const toDelete = snapshots.slice(100);
          for (const snapshot of toDelete) {
            await ctx.runMutation(api.offlineAccumulation.deleteSnapshot, {
              snapshotId: snapshot._id,
            });
            totalDeleted++;
          }
        }

        // Same for checkpoints
        const checkpoints = await ctx.runQuery(api.offlineAccumulation.getCheckpointsByWallet, {
          walletAddress: miner.walletAddress,
        });

        if (checkpoints.length > 50) {
          const toDelete = checkpoints.slice(50);
          for (const checkpoint of toDelete) {
            await ctx.runMutation(api.offlineAccumulation.deleteCheckpoint, {
              checkpointId: checkpoint._id,
            });
            totalDeleted++;
          }
        }
      }

      console.log(`[Cleanup] Deleted ${totalDeleted} old snapshots/checkpoints`);
      return { success: true, deletedCount: totalDeleted };
    } catch (error: any) {
      console.error("[Cleanup] Error:", error);
      return { success: false, error: error.message };
    }
  },
});