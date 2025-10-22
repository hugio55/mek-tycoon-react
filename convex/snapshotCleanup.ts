import { internalMutation } from "./_generated/server";

/**
 * Snapshot Cleanup - Automated cleanup of old ownership snapshots
 *
 * mekOwnershipHistory stores full Mek data snapshots every 6 hours.
 * Without cleanup, this table grows unbounded and consumes excessive bandwidth.
 *
 * Retention Policy:
 * - Keep last 30 days of snapshots (120 snapshots per wallet)
 * - Delete older snapshots to prevent unbounded growth
 */

export const cleanupOldSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 30;
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting snapshot cleanup: removing snapshots older than ${new Date(cutoffTime).toLocaleString()}`);

      // Find old snapshots to delete
      const oldSnapshots = await ctx.db
        .query("mekOwnershipHistory")
        .filter((q) => q.lt(q.field("snapshotTime"), cutoffTime))
        .collect();

      console.log(`Found ${oldSnapshots.length} old snapshots to delete`);

      let deletedCount = 0;
      let totalMeksRemoved = 0;

      // Delete old snapshots in batches
      for (const snapshot of oldSnapshots) {
        try {
          totalMeksRemoved += snapshot.meks.length;
          await ctx.db.delete(snapshot._id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete snapshot ${snapshot._id}:`, error);
        }
      }

      console.log(`Snapshot cleanup completed: ${deletedCount} snapshots deleted, ${totalMeksRemoved} Mek records removed`);

      return {
        success: true,
        deletedSnapshots: deletedCount,
        totalMeksRemoved,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
        daysRetained: daysToKeep,
      };

    } catch (error) {
      console.error("Snapshot cleanup failed:", error);
      return {
        success: false,
        error: error.toString(),
        timestamp: now,
      };
    }
  },
});

// Cleanup old snapshot logs (goldMiningSnapshotLogs)
export const cleanupOldSnapshotLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 7; // Only need 7 days of logs
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting snapshot log cleanup: removing logs older than ${new Date(cutoffTime).toLocaleString()}`);

      // Find old logs to delete
      const oldLogs = await ctx.db
        .query("goldMiningSnapshotLogs")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();

      console.log(`Found ${oldLogs.length} old snapshot logs to delete`);

      let deletedCount = 0;

      for (const log of oldLogs) {
        try {
          await ctx.db.delete(log._id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete log ${log._id}:`, error);
        }
      }

      console.log(`Snapshot log cleanup completed: ${deletedCount} logs deleted`);

      return {
        success: true,
        deletedLogs: deletedCount,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
        daysRetained: daysToKeep,
      };

    } catch (error) {
      console.error("Snapshot log cleanup failed:", error);
      return {
        success: false,
        error: error.toString(),
        timestamp: now,
      };
    }
  },
});
