import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { calculateCurrentGold } from "./lib/goldCalculations";
import { internal } from "./_generated/api";

/**
 * Gold Backup System - Disaster Recovery for User Gold States
 *
 * This system creates comprehensive snapshots of all users' gold states
 * for disaster recovery purposes. Backups can be created manually or automatically
 * and include all necessary data to restore users' gold balances.
 */

// Create a complete backup of all users' gold states
export const createGoldBackup = mutation({
  args: {
    backupName: v.optional(v.string()),
    backupType: v.union(
      v.literal("auto_daily"),
      v.literal("manual"),
      v.literal("pre_update"),
      v.literal("pre_migration"),
      v.literal("emergency")
    ),
    triggeredBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const backupVersion = 1; // Increment this if backup format changes

    try {
      // Get all gold mining data
      const allGoldMining = await ctx.db.query("goldMining").collect();

      // Count unique wallets
      const uniqueWallets = new Set(allGoldMining.map(gm => gm.walletAddress)).size;

      // Create the main backup record
      const backupId = await ctx.db.insert("goldBackups", {
        backupTimestamp: now,
        backupName: args.backupName,
        backupType: args.backupType,
        triggeredBy: args.triggeredBy,
        totalUsersBackedUp: uniqueWallets,
        notes: args.notes,
        snapshotVersion: backupVersion,
        systemVersion: "2025-09-24", // Update this with app version
      });

      let successCount = 0;
      const errors: string[] = [];

      // Create backup records for each gold mining record
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

          // Create backup record for this wallet
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

      // Update the backup record with final counts
      await ctx.db.patch(backupId, {
        totalUsersBackedUp: successCount,
        notes: args.notes ?
          `${args.notes} | Errors: ${errors.length}` :
          errors.length > 0 ? `Errors: ${errors.length}` : undefined,
      });

      return {
        success: true,
        backupId,
        totalWallets: uniqueWallets,
        successfulBackups: successCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 10), // Return first 10 errors
        backupTimestamp: now,
      };

    } catch (error) {
      console.error("Gold backup failed:", error);
      return {
        success: false,
        error: error.toString(),
        backupTimestamp: now,
      };
    }
  },
});

// Get all gold backups (for admin interface)
export const getAllGoldBackups = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const backups = await ctx.db
      .query("goldBackups")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return backups.map(backup => ({
      ...backup,
      backupTimestamp: backup.backupTimestamp,
      formattedDate: new Date(backup.backupTimestamp).toLocaleString(),
      ageHours: Math.floor((Date.now() - backup.backupTimestamp) / (1000 * 60 * 60)),
      ageDays: Math.floor((Date.now() - backup.backupTimestamp) / (1000 * 60 * 60 * 24)),
    }));
  },
});

// Get backup details including user count and sample data
export const getBackupDetails = query({
  args: {
    backupId: v.id("goldBackups"),
  },
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backupId);
    if (!backup) {
      return null;
    }

    // Get user data count and sample
    const userData = await ctx.db
      .query("goldBackupUserData")
      .withIndex("by_backup", (q) => q.eq("backupId", args.backupId))
      .take(1000); // Take first 1000 for stats

    const totalGold = userData.reduce((sum, user) => sum + user.currentGold, 0);
    const totalGoldPerHour = userData.reduce((sum, user) => sum + user.goldPerHour, 0);
    const totalMeks = userData.reduce((sum, user) => sum + user.mekCount, 0);

    // Get top 5 users by gold
    const topUsers = userData
      .sort((a, b) => b.currentGold - a.currentGold)
      .slice(0, 5)
      .map(user => ({
        walletAddress: user.walletAddress.slice(0, 10) + "...",
        currentGold: user.currentGold,
        goldPerHour: user.goldPerHour,
        mekCount: user.mekCount,
      }));

    return {
      ...backup,
      userDataCount: userData.length,
      totalGold: Math.floor(totalGold * 100) / 100,
      totalGoldPerHour: Math.floor(totalGoldPerHour * 100) / 100,
      totalMeks,
      averageGold: userData.length > 0 ? Math.floor((totalGold / userData.length) * 100) / 100 : 0,
      averageGoldPerHour: userData.length > 0 ? Math.floor((totalGoldPerHour / userData.length) * 100) / 100 : 0,
      topUsers,
      formattedDate: new Date(backup.backupTimestamp).toLocaleString(),
    };
  },
});

// Get user's backup history (for a specific wallet)
export const getUserBackupHistory = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const userBackups = await ctx.db
      .query("goldBackupUserData")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(limit);

    // Get backup metadata for each user backup
    const backupIds = [...new Set(userBackups.map(ub => ub.backupId))];
    const backupMetadata = await Promise.all(
      backupIds.map(id => ctx.db.get(id))
    );

    const backupMap = new Map(backupMetadata.filter(b => b).map(b => [b!._id, b!]));

    return userBackups.map(userBackup => {
      const backup = backupMap.get(userBackup.backupId);
      return {
        ...userBackup,
        backupMetadata: backup ? {
          backupName: backup.backupName,
          backupType: backup.backupType,
          triggeredBy: backup.triggeredBy,
          formattedDate: new Date(backup.backupTimestamp).toLocaleString(),
        } : null,
      };
    });
  },
});

// Delete old backups (cleanup function)
export const cleanupOldBackups = mutation({
  args: {
    daysToKeep: v.optional(v.number()), // Default 30 days
    dryRun: v.optional(v.boolean()), // If true, just return what would be deleted
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 30;
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    // Find old backups
    const oldBackups = await ctx.db
      .query("goldBackups")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("backupTimestamp"), cutoffTime))
      .collect();

    if (args.dryRun) {
      return {
        dryRun: true,
        backupsToDelete: oldBackups.length,
        oldestBackup: oldBackups.length > 0 ? new Date(Math.min(...oldBackups.map(b => b.backupTimestamp))).toLocaleString() : null,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
      };
    }

    let deletedBackups = 0;
    let deletedUserData = 0;

    // Delete old backups and their associated user data
    for (const backup of oldBackups) {
      try {
        // Delete all user data for this backup
        const userData = await ctx.db
          .query("goldBackupUserData")
          .withIndex("by_backup", (q) => q.eq("backupId", backup._id))
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

    return {
      success: true,
      deletedBackups,
      deletedUserData,
      cutoffDate: new Date(cutoffTime).toLocaleString(),
    };
  },
});

// Restore users' gold from a backup (DANGEROUS - requires confirmation)
export const restoreFromBackup = mutation({
  args: {
    backupId: v.id("goldBackups"),
    targetWallets: v.optional(v.array(v.string())), // If provided, only restore these wallets
    confirmationCode: v.string(), // Must match expected confirmation
    triggeredBy: v.string(),
    dryRun: v.optional(v.boolean()), // If true, just return what would be restored
  },
  handler: async (ctx, args) => {
    // Security check - confirmation code must match
    const expectedCode = "RESTORE_GOLD_BACKUP_CONFIRMED";
    if (args.confirmationCode !== expectedCode) {
      throw new Error("Invalid confirmation code. Restoration cancelled for safety.");
    }

    const backup = await ctx.db.get(args.backupId);
    if (!backup) {
      throw new Error("Backup not found");
    }

    // Get all user data from the backup
    let backupUserData = await ctx.db
      .query("goldBackupUserData")
      .withIndex("by_backup", (q) => q.eq("backupId", args.backupId))
      .collect();

    // Filter by target wallets if specified
    if (args.targetWallets && args.targetWallets.length > 0) {
      backupUserData = backupUserData.filter(data =>
        args.targetWallets!.includes(data.walletAddress)
      );
    }

    if (args.dryRun) {
      return {
        dryRun: true,
        backupDate: new Date(backup.backupTimestamp).toLocaleString(),
        usersToRestore: backupUserData.length,
        totalGoldToRestore: backupUserData.reduce((sum, user) => sum + user.currentGold, 0),
        sampleUsers: backupUserData.slice(0, 5).map(user => ({
          walletAddress: user.walletAddress.slice(0, 10) + "...",
          currentGold: user.currentGold,
          goldPerHour: user.goldPerHour,
        })),
      };
    }

    let restoredUsers = 0;
    let restoredGoldMining = 0;
    const errors: string[] = [];
    const now = Date.now();

    // Restore each wallet's data
    for (const userData of backupUserData) {
      try {
        // Find and restore gold mining data
        const goldMining = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", userData.walletAddress))
          .first();

        if (goldMining) {
          await ctx.db.patch(goldMining._id, {
            totalGoldPerHour: userData.totalGoldPerHour || userData.goldPerHour,
            accumulatedGold: userData.accumulatedGold || userData.currentGold,
            lastSnapshotTime: now, // Reset snapshot time to now
            updatedAt: now,
          });
          restoredGoldMining++;
        }

      } catch (error) {
        console.error(`Failed to restore user ${userData.walletAddress}:`, error);
        errors.push(`${userData.walletAddress}: ${error}`);
      }
    }

    return {
      success: true,
      backupDate: new Date(backup.backupTimestamp).toLocaleString(),
      restoredUsers,
      restoredGoldMining,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      triggeredBy: args.triggeredBy,
      restorationTimestamp: now,
    };
  },
});

// Manually trigger daily backup (for testing)
export const triggerManualDailyBackup = mutation({
  args: {},
  handler: async (ctx) => {
    // Call the internal daily backup function
    return await ctx.runMutation(internal.goldBackupScheduler.runDailyBackup, {});
  },
});

// Manually trigger weekly cleanup (for testing)
export const triggerManualCleanup = mutation({
  args: {},
  handler: async (ctx) => {
    // Call the internal cleanup function
    return await ctx.runMutation(internal.goldBackupScheduler.runWeeklyCleanup, {});
  },
});

// Get backup statistics and system health
export const getBackupSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7days = now - (7 * 24 * 60 * 60 * 1000);
    const last30days = now - (30 * 24 * 60 * 60 * 1000);

    const [allBackups, recentBackups, currentGoldMining] = await Promise.all([
      ctx.db.query("goldBackups").collect(),
      ctx.db.query("goldBackups").withIndex("by_timestamp").filter(q => q.gte(q.field("backupTimestamp"), last24h)).collect(),
      ctx.db.query("goldMining").collect(),
    ]);

    const backupsLast7Days = allBackups.filter(b => b.backupTimestamp >= last7days).length;
    const backupsLast30Days = allBackups.filter(b => b.backupTimestamp >= last30days).length;

    // Find most recent backup
    const mostRecentBackup = allBackups.sort((a, b) => b.backupTimestamp - a.backupTimestamp)[0];
    const oldestBackup = allBackups.sort((a, b) => a.backupTimestamp - b.backupTimestamp)[0];

    // Calculate storage usage estimate (rough)
    const totalUserDataRecords = await ctx.db.query("goldBackupUserData").collect();
    const storageEstimateMB = (totalUserDataRecords.length * 0.5) / 1024; // Rough estimate

    return {
      totalBackups: allBackups.length,
      backupsLast24h: recentBackups.length,
      backupsLast7Days,
      backupsLast30Days,
      totalUserDataRecords: totalUserDataRecords.length,
      storageEstimateMB: Math.floor(storageEstimateMB * 100) / 100,

      currentSystemStats: {
        totalGoldMiners: currentGoldMining.length,
        totalCurrentGold: currentGoldMining.reduce((sum, gm) => {
          return sum + calculateCurrentGold({
            accumulatedGold: gm.accumulatedGold || 0,
            goldPerHour: gm.totalGoldPerHour,
            lastSnapshotTime: gm.lastSnapshotTime || gm.updatedAt || gm.createdAt,
            isVerified: true
          });
        }, 0),
        totalGoldPerHour: currentGoldMining.reduce((sum, gm) => sum + gm.totalGoldPerHour, 0),
      },

      mostRecentBackup: mostRecentBackup ? {
        ...mostRecentBackup,
        formattedDate: new Date(mostRecentBackup.backupTimestamp).toLocaleString(),
        hoursAgo: Math.floor((now - mostRecentBackup.backupTimestamp) / (1000 * 60 * 60)),
      } : null,

      oldestBackup: oldestBackup ? {
        ...oldestBackup,
        formattedDate: new Date(oldestBackup.backupTimestamp).toLocaleString(),
        daysAgo: Math.floor((now - oldestBackup.backupTimestamp) / (1000 * 60 * 60 * 24)),
      } : null,

      backupTypes: allBackups.reduce((acc, backup) => {
        acc[backup.backupType] = (acc[backup.backupType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Health indicators
      health: {
        hasRecentBackup: mostRecentBackup && (now - mostRecentBackup.backupTimestamp) < (25 * 60 * 60 * 1000), // Less than 25 hours ago
        hasMultipleBackups: allBackups.length >= 2,
        storageUsageOK: storageEstimateMB < 100, // Less than 100MB
        backupFrequencyOK: backupsLast7Days >= 7, // At least one per day
      },
    };
  },
});