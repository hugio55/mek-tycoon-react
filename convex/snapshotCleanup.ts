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
      console.log(`[SNAPSHOT-FIX] Starting snapshot cleanup: removing snapshots older than ${new Date(cutoffTime).toLocaleString()}`);

      // CRITICAL FIX: Use the new index and paginate instead of .collect()
      // This prevents the 16 MB read limit error from full table scans
      const BATCH_SIZE = 50; // Process 50 snapshots at a time
      let deletedCount = 0;
      let totalMeksRemoved = 0;
      let batchNumber = 0;

      while (true) {
        batchNumber++;
        console.log(`[SNAPSHOT-FIX] Processing batch ${batchNumber}...`);

        // Use the new by_snapshotTime index for efficient filtering
        const oldSnapshots = await ctx.db
          .query("mekOwnershipHistory")
          .withIndex("", (q: any) => q.lt("snapshotTime", cutoffTime))
          .take(BATCH_SIZE);

        if (oldSnapshots.length === 0) {
          console.log(`[SNAPSHOT-FIX] No more old snapshots found, cleanup complete`);
          break;
        }

        console.log(`[SNAPSHOT-FIX] Found ${oldSnapshots.length} old snapshots in this batch`);

        // Delete snapshots in this batch
        for (const snapshot of oldSnapshots) {
          try {
            totalMeksRemoved += snapshot.meks.length;
            await ctx.db.delete(snapshot._id);
            deletedCount++;
          } catch (error) {
            console.error(`[SNAPSHOT-FIX] Failed to delete snapshot ${snapshot._id}:`, error);
          }
        }

        console.log(`[SNAPSHOT-FIX] Batch ${batchNumber} complete: ${oldSnapshots.length} snapshots deleted`);

        // If we got less than BATCH_SIZE, we're done
        if (oldSnapshots.length < BATCH_SIZE) {
          console.log(`[SNAPSHOT-FIX] Reached end of old snapshots`);
          break;
        }
      }

      console.log(`[SNAPSHOT-FIX] Snapshot cleanup completed: ${deletedCount} snapshots deleted across ${batchNumber} batches, ${totalMeksRemoved} Mek records removed`);

      return {
        success: true,
        deletedSnapshots: deletedCount,
        totalMeksRemoved,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
        daysRetained: daysToKeep,
        batchesProcessed: batchNumber,
      };

    } catch (error) {
      console.error("[SNAPSHOT-FIX] Snapshot cleanup failed:", error);
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
