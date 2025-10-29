import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStorageStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Use limited sampling to avoid exceeding 16MB read limit
    // Reduced to 500 because mekOwnershipHistory records are very large (contain arrays of Meks)
    const SAMPLE_LIMIT = 500;

    const [
      goldMiningCount,
      ownershipHistorySample,
      goldSnapshotsSample,
      goldCheckpointsSample,
      snapshotLogsSample,
      auditLogsSample,
      nftMetadataCount,
    ] = await Promise.all([
      ctx.db.query("goldMining").take(SAMPLE_LIMIT).then(r => r.length),
      ctx.db.query("mekOwnershipHistory").order("desc").take(SAMPLE_LIMIT),
      ctx.db.query("goldSnapshots").order("desc").take(SAMPLE_LIMIT),
      ctx.db.query("goldCheckpoints").take(SAMPLE_LIMIT).then(r => r.length),
      ctx.db.query("goldMiningSnapshotLogs").take(SAMPLE_LIMIT).then(r => r.length),
      ctx.db.query("auditLogs").take(SAMPLE_LIMIT).then(r => r.length),
      ctx.db.query("nftMetadata").take(SAMPLE_LIMIT).then(r => r.length),
    ]);

    // Calculate counts from samples
    const ownershipHistoryCount = ownershipHistorySample.length;
    const ownershipHistoryRecent24h = ownershipHistorySample.filter(s => s.snapshotTime >= oneDayAgo).length;
    const ownershipHistoryRecent7d = ownershipHistorySample.filter(s => s.snapshotTime >= sevenDaysAgo).length;
    const ownershipHistoryRecent30d = ownershipHistorySample.filter(s => s.snapshotTime >= thirtyDaysAgo).length;

    const goldSnapshotsCount = goldSnapshotsSample.length;
    const goldSnapshotsRecent24h = goldSnapshotsSample.filter(s => s.timestamp >= oneDayAgo).length;
    const goldSnapshotsRecent7d = goldSnapshotsSample.filter(s => s.timestamp >= sevenDaysAgo).length;

    const goldCheckpointsCount = goldCheckpointsSample;
    const snapshotLogsCount = snapshotLogsSample;
    const auditLogsCount = auditLogsSample;

    const avgMeksPerSnapshot = 5;
    const ownershipHistorySize = ownershipHistoryCount * (100 + avgMeksPerSnapshot * 106);
    const goldSnapshotsSize = goldSnapshotsCount * 92;
    const goldCheckpointsSize = goldCheckpointsCount * 110;
    const snapshotLogsSize = snapshotLogsCount * 85;
    const auditLogsSize = auditLogsCount * 120;
    const nftMetadataSize = nftMetadataCount * 800;

    const totalEstimatedBytes =
      ownershipHistorySize +
      goldSnapshotsSize +
      goldCheckpointsSize +
      snapshotLogsSize +
      auditLogsSize +
      nftMetadataSize;

    const growthRate24h = ownershipHistoryRecent24h + goldSnapshotsRecent24h;
    const growthRate7d = (ownershipHistoryRecent7d + goldSnapshotsRecent7d) / 7;

    const dailyGrowthBytes = (ownershipHistoryRecent24h * 630) + (goldSnapshotsRecent24h * 92);
    const projectedMonthlyGrowthMB = (dailyGrowthBytes * 30) / (1024 * 1024);
    const projectedYearlyGrowthMB = (dailyGrowthBytes * 365) / (1024 * 1024);

    return {
      tables: {
        goldMining: {
          recordCount: goldMiningCount,
          estimatedSizeKB: Math.round((goldMiningCount * 500) / 1024),
          description: "Active wallet mining records"
        },
        mekOwnershipHistory: {
          recordCount: ownershipHistoryCount,
          recent24h: ownershipHistoryRecent24h,
          recent7d: ownershipHistoryRecent7d,
          recent30d: ownershipHistoryRecent30d,
          estimatedSizeKB: Math.round(ownershipHistorySize / 1024),
          avgRecordSizeBytes: 630,
          description: "6-hour wallet snapshots (forever)"
        },
        goldSnapshots: {
          recordCount: goldSnapshotsCount,
          recent24h: goldSnapshotsRecent24h,
          recent7d: goldSnapshotsRecent7d,
          estimatedSizeKB: Math.round(goldSnapshotsSize / 1024),
          avgRecordSizeBytes: 92,
          description: "Hourly gold snapshots (capped at 100/wallet)"
        },
        goldCheckpoints: {
          recordCount: goldCheckpointsCount,
          estimatedSizeKB: Math.round(goldCheckpointsSize / 1024),
          description: "Manual checkpoint backups"
        },
        goldMiningSnapshotLogs: {
          recordCount: snapshotLogsCount,
          estimatedSizeKB: Math.round(snapshotLogsSize / 1024),
          description: "Snapshot execution logs"
        },
        auditLogs: {
          recordCount: auditLogsCount,
          estimatedSizeKB: Math.round(auditLogsSize / 1024),
          description: "Security and verification logs"
        },
        nftMetadata: {
          recordCount: nftMetadataCount,
          estimatedSizeKB: Math.round(nftMetadataSize / 1024),
          description: "Cached NFT metadata"
        }
      },
      totals: {
        estimatedSizeMB: Math.round((totalEstimatedBytes / (1024 * 1024)) * 100) / 100,
        totalRecords: ownershipHistoryCount + goldSnapshotsCount + goldCheckpointsCount + snapshotLogsCount + auditLogsCount + nftMetadataCount,
      },
      growth: {
        recordsLast24h: growthRate24h,
        avgRecordsPerDay: Math.round(growthRate7d),
        estimatedDailyGrowthKB: Math.round(dailyGrowthBytes / 1024),
        projectedMonthlyGrowthMB: Math.round(projectedMonthlyGrowthMB * 100) / 100,
        projectedYearlyGrowthMB: Math.round(projectedYearlyGrowthMB * 100) / 100,
      },
      costs: {
        currentMonthlyUSD: Math.round((totalEstimatedBytes / (1024 * 1024 * 1024)) * 0.20 * 100) / 100,
        projectedYearlyUSD: Math.round(((totalEstimatedBytes + (dailyGrowthBytes * 365)) / (1024 * 1024 * 1024)) * 0.20 * 100) / 100,
      },
      timestamp: now,
    };
  },
});

export const getOwnershipHistoryByWallet = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(limit);

    return snapshots.map(snapshot => ({
      snapshotTime: snapshot.snapshotTime,
      date: new Date(snapshot.snapshotTime).toISOString(),
      mekCount: snapshot.totalMekCount,
      totalGoldPerHour: snapshot.totalGoldPerHour,
      meks: snapshot.meks.length,
    }));
  },
});

export const getStorageHealthCheck = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.runQuery(ctx.db.system.query("storageMonitoring:getStorageStats") as any);

    const warnings = [];
    const errors = [];

    if (stats.totals.estimatedSizeMB > 1000) {
      warnings.push("Storage exceeds 1 GB - consider implementing cleanup strategies");
    }

    if (stats.growth.projectedYearlyGrowthMB > 5000) {
      warnings.push("Projected yearly growth exceeds 5 GB");
    }

    if (stats.costs.projectedYearlyUSD > 5) {
      warnings.push("Projected yearly storage cost exceeds $5");
    }

    const ownershipTable = stats.tables.mekOwnershipHistory;
    if (ownershipTable.recordCount > 100000) {
      warnings.push("Ownership history has over 100k records");
    }

    return {
      status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "healthy",
      errors,
      warnings,
      timestamp: Date.now(),
    };
  },
});