import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Query to identify bad snapshots that need fixing
export const identifyBadSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();
    const badSnapshots = [];
    const uncertainSnapshots = [];

    for (const snapshot of allSnapshots) {
      // Get the goldMining record at the time (or current if still exists)
      const miner = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", snapshot.walletAddress))
        .first();

      // Mark snapshots with 0 MEKs as suspicious if:
      // 1. The wallet currently has MEKs in goldMining
      // 2. The snapshot doesn't have a verification status
      if (snapshot.totalMekCount === 0) {
        if (miner && miner.ownedMeks && miner.ownedMeks.length > 0) {
          badSnapshots.push({
            snapshotId: snapshot._id,
            walletAddress: snapshot.walletAddress,
            snapshotTime: new Date(snapshot.snapshotTime).toISOString(),
            currentMekCount: miner.ownedMeks.length,
            currentGoldPerHour: miner.totalGoldPerHour,
            hasVerificationStatus: !!snapshot.verificationStatus,
          });
        } else if (!snapshot.verificationStatus) {
          // Snapshot with 0 MEKs but we can't verify if it's correct
          uncertainSnapshots.push({
            snapshotId: snapshot._id,
            walletAddress: snapshot.walletAddress,
            snapshotTime: new Date(snapshot.snapshotTime).toISOString(),
          });
        }
      }
    }

    return {
      totalSnapshots: allSnapshots.length,
      badSnapshots: badSnapshots.length,
      uncertainSnapshots: uncertainSnapshots.length,
      badSnapshotDetails: badSnapshots,
      uncertainSnapshotDetails: uncertainSnapshots,
    };
  },
});

// Delete bad snapshots that have 0 MEKs but wallet has MEKs
export const deleteBadSnapshots = mutation({
  args: {},
  handler: async (ctx) => {
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();
    let deletedCount = 0;

    for (const snapshot of allSnapshots) {
      // Only delete snapshots with 0 MEKs that look suspicious
      if (snapshot.totalMekCount === 0 && snapshot.totalGoldPerHour === 0) {
        // Check if wallet currently has MEKs
        const miner = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", snapshot.walletAddress))
          .first();

        if (miner && miner.ownedMeks && miner.ownedMeks.length > 0) {
          console.log(`Deleting bad snapshot: ${snapshot._id} for wallet ${snapshot.walletAddress}`);
          await ctx.db.delete(snapshot._id);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} bad snapshots with 0 MEKs`,
    };
  },
});

// Mark uncertain snapshots with status
export const markUncertainSnapshots = mutation({
  args: {},
  handler: async (ctx) => {
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();
    let markedCount = 0;

    for (const snapshot of allSnapshots) {
      // Mark old snapshots without verification status as uncertain
      if (!snapshot.verificationStatus) {
        await ctx.db.patch(snapshot._id, {
          verificationStatus: "uncertain",
        });
        markedCount++;
      }
    }

    return {
      success: true,
      markedCount,
      message: `Marked ${markedCount} old snapshots as uncertain`,
    };
  },
});

// Comprehensive fix: delete bad, mark uncertain
export const fixAllSnapshots = mutation({
  args: {},
  handler: async (ctx) => {
    // Step 1: Delete obvious bad snapshots (0 MEKs but wallet has MEKs)
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();
    let deletedCount = 0;
    let markedCount = 0;

    for (const snapshot of allSnapshots) {
      const miner = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", snapshot.walletAddress))
        .first();

      // Delete if: 0 MEKs in snapshot but wallet currently has MEKs
      if (snapshot.totalMekCount === 0 && miner && miner.ownedMeks && miner.ownedMeks.length > 0) {
        console.log(`[Fix] Deleting bad snapshot: ${snapshot._id}`);
        await ctx.db.delete(snapshot._id);
        deletedCount++;
      }
      // Mark as uncertain if: no verification status
      else if (!snapshot.verificationStatus) {
        console.log(`[Fix] Marking uncertain: ${snapshot._id}`);
        await ctx.db.patch(snapshot._id, {
          verificationStatus: "uncertain",
        });
        markedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      markedCount,
      message: `Deleted ${deletedCount} bad snapshots, marked ${markedCount} as uncertain`,
    };
  },
});