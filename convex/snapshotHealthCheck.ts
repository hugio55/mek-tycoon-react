import { query } from "./_generated/server";
import { v } from "convex/values";

// Comprehensive snapshot system health check
export const getSnapshotHealth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sixHoursAgo = now - (6 * 60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000);

    // Get recent snapshot logs
    const recentLogs = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .take(10);

    // Get all gold mining accounts
    const allMiners = await ctx.db.query("goldMining").collect();

    // Get all snapshots from last 24 hours
    const recentSnapshots = await ctx.db
      .query("mekOwnershipHistory")
      .filter((q) => q.gte(q.field("snapshotTime"), oneDayAgo))
      .collect();

    // Wallets that haven't been snapshotted recently
    const walletsNeverSnapshotted: string[] = [];
    const walletsStaleSnapshots: Array<{ wallet: string; lastSnapshot: number; hoursSince: number }> = [];
    const walletsWithFailures: Array<{ wallet: string; failures: number; lastSnapshot: number | null }> = [];
    const inactiveWallets: Array<{ wallet: string; lastActive: number; daysSince: number }> = [];
    const activeWallets: string[] = [];

    for (const miner of allMiners) {
      const isActive = miner.lastActiveTime >= fifteenDaysAgo;

      if (isActive) {
        activeWallets.push(miner.walletAddress);
      } else {
        const daysSinceActive = (now - miner.lastActiveTime) / (1000 * 60 * 60 * 24);
        inactiveWallets.push({
          wallet: miner.walletAddress,
          lastActive: miner.lastActiveTime,
          daysSince: Math.floor(daysSinceActive)
        });
      }

      // Check if wallet has never been snapshotted
      if (!miner.lastSnapshotTime) {
        walletsNeverSnapshotted.push(miner.walletAddress);
      } else {
        // Check if snapshot is stale (more than 12 hours old for active wallets)
        const hoursSinceSnapshot = (now - miner.lastSnapshotTime) / (1000 * 60 * 60);
        if (isActive && hoursSinceSnapshot > 12) {
          walletsStaleSnapshots.push({
            wallet: miner.walletAddress,
            lastSnapshot: miner.lastSnapshotTime,
            hoursSince: Math.floor(hoursSinceSnapshot)
          });
        }
      }

      // Check for consecutive failures
      const failures = miner.consecutiveSnapshotFailures || 0;
      if (failures >= 3) {
        walletsWithFailures.push({
          wallet: miner.walletAddress,
          failures,
          lastSnapshot: miner.lastSnapshotTime || null
        });
      }
    }

    // Get unique wallets from recent snapshots
    const uniqueSnapshotWallets = new Set(recentSnapshots.map(s => s.walletAddress));

    // Calculate stats
    const lastSnapshotRun = recentLogs[0];
    const hoursSinceLastRun = lastSnapshotRun
      ? (now - lastSnapshotRun.timestamp) / (1000 * 60 * 60)
      : null;

    // Overall health status
    let healthStatus: "healthy" | "warning" | "critical";
    const issues: string[] = [];

    if (!lastSnapshotRun || hoursSinceLastRun! > 7) {
      healthStatus = "critical";
      issues.push("No snapshot has run in over 7 hours");
    } else if (walletsWithFailures.length > 5) {
      healthStatus = "critical";
      issues.push(`${walletsWithFailures.length} wallets have 3+ consecutive failures`);
    } else if (walletsStaleSnapshots.length > 10) {
      healthStatus = "warning";
      issues.push(`${walletsStaleSnapshots.length} active wallets have stale snapshots (>12 hours)`);
    } else if (walletsNeverSnapshotted.length > 0) {
      healthStatus = "warning";
      issues.push(`${walletsNeverSnapshotted.length} wallets have never been snapshotted`);
    } else {
      healthStatus = "healthy";
    }

    return {
      healthStatus,
      issues,
      timestamp: now,

      // Snapshot execution stats
      lastSnapshotRun: lastSnapshotRun ? {
        timestamp: lastSnapshotRun.timestamp,
        hoursSince: hoursSinceLastRun!,
        totalMiners: lastSnapshotRun.totalMiners,
        updatedCount: lastSnapshotRun.updatedCount,
        errorCount: lastSnapshotRun.errorCount,
        status: lastSnapshotRun.status
      } : null,

      // Wallet coverage stats
      totalWallets: allMiners.length,
      activeWallets: activeWallets.length,
      inactiveWallets: inactiveWallets.length,
      snapshotedInLast24h: uniqueSnapshotWallets.size,

      // Problem areas
      walletsNeverSnapshotted: {
        count: walletsNeverSnapshotted.length,
        wallets: walletsNeverSnapshotted.slice(0, 10) // First 10
      },
      walletsStaleSnapshots: {
        count: walletsStaleSnapshots.length,
        wallets: walletsStaleSnapshots.slice(0, 10) // First 10 with most stale
      },
      walletsWithFailures: {
        count: walletsWithFailures.length,
        wallets: walletsWithFailures
      },
      inactiveWalletsInfo: {
        count: inactiveWallets.length,
        wallets: inactiveWallets.slice(0, 10) // First 10
      },

      // Recent logs summary
      recentLogs: recentLogs.map(log => ({
        timestamp: log.timestamp,
        totalMiners: log.totalMiners,
        updatedCount: log.updatedCount,
        errorCount: log.errorCount,
        status: log.status
      }))
    };
  }
});

// Check specific wallet's snapshot history
export const getWalletSnapshotHealth = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get wallet's gold mining record
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { error: "Wallet not found" };
    }

    // Get all snapshots for this wallet
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();

    // Analyze snapshot gaps
    const gaps: Array<{
      from: number;
      to: number;
      gapHours: number;
      mekCountChanged: boolean;
      rateChanged: boolean;
    }> = [];

    for (let i = 1; i < snapshots.length; i++) {
      const current = snapshots[i - 1];
      const previous = snapshots[i];
      const gapHours = (current.snapshotTime - previous.snapshotTime) / (1000 * 60 * 60);

      // Flag gaps larger than 8 hours (should be every 6 hours)
      if (gapHours > 8) {
        gaps.push({
          from: previous.snapshotTime,
          to: current.snapshotTime,
          gapHours: Math.floor(gapHours),
          mekCountChanged: current.totalMekCount !== previous.totalMekCount,
          rateChanged: Math.abs(current.totalGoldPerHour - previous.totalGoldPerHour) > 0.01
        });
      }
    }

    // Detect potential Mek transfers (suspicious activity)
    const mekTransfers: Array<{
      timestamp: number;
      meksAdded: number;
      meksRemoved: number;
      goldRateChange: number;
    }> = [];

    for (let i = 1; i < snapshots.length; i++) {
      const current = snapshots[i - 1];
      const previous = snapshots[i];

      const currentMekIds = new Set(current.meks.map(m => m.assetId));
      const previousMekIds = new Set(previous.meks.map(m => m.assetId));

      const meksAdded = current.meks.filter(m => !previousMekIds.has(m.assetId)).length;
      const meksRemoved = previous.meks.filter(m => !currentMekIds.has(m.assetId)).length;

      if (meksAdded > 0 || meksRemoved > 0) {
        mekTransfers.push({
          timestamp: current.snapshotTime,
          meksAdded,
          meksRemoved,
          goldRateChange: current.totalGoldPerHour - previous.totalGoldPerHour
        });
      }
    }

    const hoursSinceLastSnapshot = miner.lastSnapshotTime
      ? (now - miner.lastSnapshotTime) / (1000 * 60 * 60)
      : null;

    const isActive = miner.lastActiveTime >= (now - 15 * 24 * 60 * 60 * 1000);

    return {
      walletAddress: args.walletAddress,
      isActive,

      // Current state
      currentMekCount: miner.ownedMeks?.length || 0,
      currentGoldPerHour: miner.totalGoldPerHour || 0,
      lastSnapshotTime: miner.lastSnapshotTime || null,
      hoursSinceLastSnapshot,
      consecutiveFailures: miner.consecutiveSnapshotFailures || 0,
      isVerified: miner.isBlockchainVerified || false,

      // Snapshot history
      totalSnapshots: snapshots.length,
      firstSnapshotTime: snapshots[snapshots.length - 1]?.snapshotTime || null,

      // Issues
      snapshotGaps: {
        count: gaps.length,
        gaps: gaps.slice(0, 5) // Show first 5 gaps
      },

      // Transfer activity
      mekTransfers: {
        count: mekTransfers.length,
        transfers: mekTransfers.slice(0, 10) // Show recent 10 transfers
      },

      // Recent snapshots
      recentSnapshots: snapshots.slice(0, 5).map(s => ({
        timestamp: s.snapshotTime,
        mekCount: s.totalMekCount,
        goldPerHour: s.totalGoldPerHour,
        verificationStatus: s.verificationStatus
      }))
    };
  }
});
