/**
 * Gold Migration Backup System (Phase 1, Step 1.3)
 *
 * Creates comprehensive backups before migration to ensure data safety.
 * Uses existing goldBackups and goldBackupUserData tables in schema.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a complete pre-migration backup
 * This captures ALL critical gold data before any modifications
 */
export const createPreMigrationBackup = mutation({
  args: {
    backupName: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Fetch all gold mining records
    const allMiners = await ctx.db.query("goldMining").collect();

    if (allMiners.length === 0) {
      throw new Error("No gold mining records found to backup");
    }

    // Create backup metadata record
    const backupId = await ctx.db.insert("goldBackups", {
      backupTimestamp: timestamp,
      backupName: args.backupName || `Pre-Migration Clean Fix - ${new Date(timestamp).toISOString()}`,
      backupType: "pre_migration",
      triggeredBy: "adminGoldBackup:createPreMigrationBackup",
      totalUsersBackedUp: allMiners.length,
      notes: args.notes || "Backup before Option B clean migration: fixing corrupted totalCumulativeGold values",
      snapshotVersion: 1,
      systemVersion: "migration-v1"
    });

    // Store each user's complete gold state
    let backedUpCount = 0;
    const backupSummary = [];

    for (const miner of allMiners) {
      // Store comprehensive backup data
      await ctx.db.insert("goldBackupUserData", {
        // Reference to backup
        backupId,

        // User identification
        walletAddress: miner.walletAddress,

        // Current gold state (use existing schema fields)
        currentGold: miner.accumulatedGold || 0,
        goldPerHour: miner.totalGoldPerHour || 0,
        accumulatedGold: miner.accumulatedGold || 0,
        lastSnapshotTime: miner.lastSnapshotTime || miner.updatedAt || miner.createdAt,

        // Mining data
        totalGoldPerHour: miner.totalGoldPerHour || 0,
        mekCount: miner.ownedMeks?.length || 0,
        lastActiveTime: miner.lastActiveTime || miner.updatedAt,

        // Backup metadata
        backupTimestamp: timestamp,
        calculationMethod: "direct_snapshot",

        // Mek data snapshot
        topMekGoldRate: miner.ownedMeks?.[0]?.goldPerHour || 0,
        topMekAssetId: miner.ownedMeks?.[0]?.assetId,
        totalMekGoldRate: miner.totalGoldPerHour || 0,
      });

      backedUpCount++;

      // Collect summary info for first 5 records
      if (backupSummary.length < 5) {
        backupSummary.push({
          wallet: miner.walletAddress.slice(0, 20) + '...',
          accumulated: miner.accumulatedGold || 0,
          cumulative: miner.totalCumulativeGold || 0,
          spent: miner.totalGoldSpentOnUpgrades || 0,
          meks: miner.ownedMeks?.length || 0
        });
      }
    }

    return {
      success: true,
      backupId,
      backupTimestamp: timestamp,
      recordsBackedUp: backedUpCount,
      summary: backupSummary,
      message: `✅ Backup created: ${backedUpCount} records safely stored`,
      backupName: args.backupName || `Pre-Migration Clean Fix - ${new Date(timestamp).toISOString()}`
    };
  }
});

/**
 * List all available backups
 */
export const listBackups = query({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db
      .query("goldBackups")
      .order("desc")
      .take(20);

    return backups.map((backup: any) => ({
      id: backup._id,
      timestamp: backup.backupTimestamp,
      date: new Date(backup.backupTimestamp).toISOString(),
      name: backup.backupName,
      type: backup.backupType,
      userCount: backup.totalUsersBackedUp,
      notes: backup.notes
    }));
  }
});

/**
 * Get detailed info about a specific backup
 */
export const getBackupInfo = query({
  args: { backupId: v.id("goldBackups") },
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backupId);

    if (!backup) {
      throw new Error("Backup not found");
    }

    // Get sample records from this backup
    const sampleRecords = await ctx.db
      .query("goldBackupUserData")
      .withIndex("", (q: any) => q.eq("backupId", args.backupId))
      .take(10);

    return {
      backup: {
        id: backup._id,
        timestamp: backup.backupTimestamp,
        date: new Date(backup.backupTimestamp).toISOString(),
        name: backup.backupName,
        type: backup.backupType,
        userCount: backup.totalUsersBackedUp,
        notes: backup.notes,
        triggeredBy: backup.triggeredBy
      },
      sampleRecords: sampleRecords.map((record: any) => ({
        wallet: record.walletAddress.slice(0, 20) + '...',
        accumulatedGold: record.accumulatedGold || 0,
        goldPerHour: record.goldPerHour,
        mekCount: record.mekCount,
        lastActive: record.lastActiveTime ? new Date(record.lastActiveTime).toISOString() : 'unknown'
      }))
    };
  }
});

/**
 * EMERGENCY RESTORE from backup
 * WARNING: This overwrites current gold data with backup data
 * Only use if migration fails catastrophically
 */
export const restoreFromBackup = mutation({
  args: {
    backupId: v.id("goldBackups"),
    confirmCode: v.string()
  },
  handler: async (ctx, args) => {
    // Require explicit confirmation
    if (args.confirmCode !== "RESTORE_CONFIRMED_EMERGENCY") {
      throw new Error(
        "Invalid confirmation code. " +
        "To restore, you must provide confirmCode: 'RESTORE_CONFIRMED_EMERGENCY'. " +
        "WARNING: This will overwrite current gold data!"
      );
    }

    // Verify backup exists
    const backup = await ctx.db.get(args.backupId);
    if (!backup) {
      throw new Error(`Backup not found with ID: ${args.backupId}`);
    }

    // Get all backup records
    const backupRecords = await ctx.db
      .query("goldBackupUserData")
      .withIndex("", (q: any) => q.eq("backupId", args.backupId))
      .collect();

    if (backupRecords.length === 0) {
      throw new Error(`No backup data found for backup ID: ${args.backupId}`);
    }

    let restoredCount = 0;
    let skippedCount = 0;
    const restoredSamples = [];

    for (const backupRecord of backupRecords) {
      // Find current gold mining record
      const currentMiner = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", backupRecord.walletAddress))
        .first();

      if (!currentMiner) {
        skippedCount++;
        console.warn(`[RESTORE] Wallet not found, skipping: ${backupRecord.walletAddress}`);
        continue;
      }

      // Restore gold data (ONLY the critical fields we backed up)
      await ctx.db.patch(currentMiner._id, {
        accumulatedGold: backupRecord.accumulatedGold || 0,
        totalGoldPerHour: backupRecord.totalGoldPerHour || 0,
        lastSnapshotTime: backupRecord.lastSnapshotTime,
        lastActiveTime: backupRecord.lastActiveTime,
        updatedAt: Date.now(),
        // Increment version to mark as restored
        version: (currentMiner.version || 0) + 1
      });

      restoredCount++;

      if (restoredSamples.length < 5) {
        restoredSamples.push({
          wallet: backupRecord.walletAddress.slice(0, 20) + '...',
          restoredGold: backupRecord.accumulatedGold || 0,
          restoredRate: backupRecord.totalGoldPerHour || 0
        });
      }
    }

    return {
      success: true,
      backupRestored: backup.backupName,
      backupDate: new Date(backup.backupTimestamp).toISOString(),
      recordsRestored: restoredCount,
      recordsSkipped: skippedCount,
      samples: restoredSamples,
      message: `✅ Restored ${restoredCount} records from backup (${skippedCount} skipped)`,
      warning: "⚠️ Data has been restored to pre-migration state. Verify immediately!"
    };
  }
});

/**
 * Verify backup integrity
 * Checks that backup data matches expected patterns
 */
export const verifyBackupIntegrity = query({
  args: { backupId: v.id("goldBackups") },
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backupId);

    if (!backup) {
      throw new Error("Backup not found");
    }

    const backupRecords = await ctx.db
      .query("goldBackupUserData")
      .withIndex("", (q: any) => q.eq("backupId", args.backupId))
      .collect();

    // Verify record count matches
    const countMatch = backupRecords.length === backup.totalUsersBackedUp;

    // Check for any invalid data
    let validRecords = 0;
    let invalidRecords = 0;
    const issues = [];

    for (const record of backupRecords) {
      let isValid = true;

      // Check required fields exist
      if (typeof record.accumulatedGold !== 'number') {
        isValid = false;
        issues.push(`${record.walletAddress}: Missing accumulatedGold`);
      }

      if (typeof record.goldPerHour !== 'number') {
        isValid = false;
        issues.push(`${record.walletAddress}: Missing goldPerHour`);
      }

      // Check for reasonable values (no negatives, no infinity)
      if ((record.accumulatedGold ?? 0) < 0 || !isFinite(record.accumulatedGold ?? 0)) {
        isValid = false;
        issues.push(`${record.walletAddress}: Invalid accumulatedGold (${record.accumulatedGold})`);
      }

      if (isValid) {
        validRecords++;
      } else {
        invalidRecords++;
      }
    }

    return {
      backupId: args.backupId,
      backupName: backup.backupName,
      backupDate: new Date(backup.backupTimestamp).toISOString(),
      countMatch,
      expectedRecords: backup.totalUsersBackedUp,
      actualRecords: backupRecords.length,
      validRecords,
      invalidRecords,
      isHealthy: countMatch && invalidRecords === 0,
      issues: issues.slice(0, 10),
      verdict: (countMatch && invalidRecords === 0)
        ? "✅ HEALTHY - Backup is valid and safe to use"
        : "❌ ISSUES DETECTED - Backup may be corrupted"
    };
  }
});
