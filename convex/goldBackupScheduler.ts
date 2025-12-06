import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { calculateCurrentGold } from "./lib/goldCalculations";

/**
 * Gold Backup Scheduler - Automated Daily Backups
 *
 * This file sets up automated daily backups of all user gold states.
 * Backups run at 2:00 AM UTC daily and include automatic cleanup of old backups.
 */

// Internal function to run daily backup
export const runDailyBackup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date(now).toDateString();

    try {
      console.log(`Starting daily gold backup for ${today}`);

      // Check if we already have a backup today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingBackup = await ctx.db
        .query("goldBackups")
        .withIndex("by_timestamp")
        .filter((q) => q.and(
          q.gte(q.field("backupTimestamp"), todayStart.getTime()),
          q.eq(q.field("backupType"), "auto_daily")
        ))
        .first();

      if (existingBackup) {
        console.log(`Daily backup already exists for ${today}, skipping`);
        return {
          skipped: true,
          reason: "Backup already exists for today",
          existingBackupId: existingBackup._id,
        };
      }

      // Get all gold mining data for backup
      const allGoldMining = await ctx.db.query("goldMining").collect();

      const uniqueWallets = new Set(allGoldMining.map((gm: any) => gm.walletAddress)).size;

      // Create the backup
      const backupId = await ctx.db.insert("goldBackups", {
        backupTimestamp: now,
        backupName: `Auto Daily ${today}`,
        backupType: "auto_daily",
        triggeredBy: "system_cron",
        totalUsersBackedUp: uniqueWallets,
        notes: `Automated daily backup for ${today}`,
        snapshotVersion: 1,
        systemVersion: "2025-09-24",
      });

      let successCount = 0;
      const errors: string[] = [];

      // Backup each gold mining record
      for (const goldMining of allGoldMining) {
        try {
          // Calculate current gold
          const currentGold = calculateCurrentGold({
            accumulatedGold: goldMining.accumulatedGold || 0,
            goldPerHour: goldMining.totalGoldPerHour,
            lastSnapshotTime: goldMining.lastSnapshotTime || goldMining.updatedAt || goldMining.createdAt,
            isVerified: true
          });

          const goldPerHour = goldMining.totalGoldPerHour;
          const mekCount = goldMining.ownedMeks.length;
          const lastActiveTime = goldMining.lastActiveTime;
          const accumulatedGold = goldMining.accumulatedGold;
          const lastSnapshotTime = goldMining.lastSnapshotTime;

          // Find top mek
          const topMek = goldMining.ownedMeks.reduce((best, mek) =>
            mek.goldPerHour > (best?.goldPerHour || 0) ? mek : best,
            goldMining.ownedMeks[0]
          );

          let topMekGoldRate = 0;
          let topMekAssetId: string | undefined;
          if (topMek) {
            topMekGoldRate = topMek.goldPerHour;
            topMekAssetId = topMek.assetId;
          }

          const totalMekGoldRate = goldMining.ownedMeks.reduce((sum, mek) => sum + mek.goldPerHour, 0);

          // Create backup record
          await ctx.db.insert("goldBackupUserData", {
            backupId,
            walletAddress: goldMining.walletAddress,
            userId: goldMining._id,
            currentGold: Math.max(0, currentGold),
            goldPerHour,
            accumulatedGold,
            lastSnapshotTime,
            totalGoldPerHour: goldPerHour,
            mekCount,
            lastActiveTime,
            backupTimestamp: now,
            calculationMethod: "goldMining_table",
            topMekGoldRate,
            topMekAssetId,
            totalMekGoldRate,
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to backup wallet ${goldMining.walletAddress}:`, error);
          errors.push(`${goldMining.walletAddress}: ${error}`);
        }
      }

      // Update backup with final stats
      await ctx.db.patch(backupId, {
        totalUsersBackedUp: successCount,
        notes: `Automated daily backup for ${today} | Success: ${successCount}, Errors: ${errors.length}`,
      });

      console.log(`Daily backup completed: ${successCount} wallets backed up, ${errors.length} errors`);

      return {
        success: true,
        backupId,
        backupName: `Auto Daily ${today}`,
        totalWallets: uniqueWallets,
        successfulBackups: successCount,
        errors: errors.length,
        timestamp: now,
      };

    } catch (error) {
      console.error("Daily backup failed:", error);

      // Try to create an error backup record
      try {
        await ctx.db.insert("goldBackups", {
          backupTimestamp: now,
          backupName: `FAILED Auto Daily ${today}`,
          backupType: "auto_daily",
          triggeredBy: "system_cron",
          totalUsersBackedUp: 0,
          notes: `FAILED: ${error.toString()}`,
          snapshotVersion: 1,
          systemVersion: "2025-09-24",
        });
      } catch (insertError) {
        console.error("Failed to create error backup record:", insertError);
      }

      return {
        success: false,
        error: error.toString(),
        timestamp: now,
      };
    }
  },
});

// Internal function to run weekly cleanup
export const runWeeklyCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 30; // Keep 30 days of backups
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting weekly backup cleanup, removing backups older than ${new Date(cutoffTime).toLocaleString()}`);

      // Find old backups to delete
      const oldBackups = await ctx.db
        .query("goldBackups")
        .withIndex("by_timestamp")
        .filter((q) => q.lt(q.field("backupTimestamp"), cutoffTime))
        .collect();

      let deletedBackups = 0;
      let deletedUserData = 0;

      // Delete old backups and their user data
      for (const backup of oldBackups) {
        try {
          // Delete all user data for this backup
          const userData = await ctx.db
            .query("goldBackupUserData")
            .withIndex("", (q: any) => q.eq("backupId", backup._id))
            .collect();

          for (const data of userData) {
            await ctx.db.delete(data._id);
            deletedUserData++;
          }

          // Delete the backup record
          await ctx.db.delete(backup._id);
          deletedBackups++;

        } catch (error) {
          console.error(`Failed to delete backup ${backup._id}:`, error);
        }
      }

      console.log(`Weekly cleanup completed: ${deletedBackups} backups deleted, ${deletedUserData} user records deleted`);

      return {
        success: true,
        deletedBackups,
        deletedUserData,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
        totalOldBackups: oldBackups.length,
      };

    } catch (error) {
      console.error("Weekly cleanup failed:", error);
      return {
        success: false,
        error: error.toString(),
        timestamp: now,
      };
    }
  },
});

// Set up the cron jobs
const crons = cronJobs();

// Daily backup at 2:00 AM UTC
crons.daily(
  "Daily Gold Backup",
  {
    hourUTC: 2, // 2:00 AM UTC
    minuteUTC: 0,
  },
  internal.goldBackupScheduler.runDailyBackup
);

// Weekly cleanup at 3:00 AM UTC on Sundays
crons.weekly(
  "Weekly Backup Cleanup",
  {
    dayOfWeek: "sunday",
    hourUTC: 3, // 3:00 AM UTC
    minuteUTC: 0,
  },
  internal.goldBackupScheduler.runWeeklyCleanup
);

export default crons;