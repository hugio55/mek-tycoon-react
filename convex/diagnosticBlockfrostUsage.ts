import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic to identify Blockfrost API usage patterns
 *
 * This helps identify which parts of the codebase are making excessive Blockfrost calls
 */

export const getBlockfrostCallAnalysis = query({
  args: {},
  handler: async (ctx) => {
    // Check recent NFT sync saga runs
    const recentSyncSagaRuns = await ctx.db
      .query("nftSyncSaga")
      .order("desc")
      .take(50);

    // Count syncs by status
    const syncsByStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    const syncsLast24h = recentSyncSagaRuns.filter((sync: any) => {
      const age = Date.now() - sync.createdAt;
      const hours = age / (1000 * 60 * 60);

      if (sync.status) {
        syncsByStatus[sync.status as keyof typeof syncsByStatus]++;
      }

      return hours < 24;
    });

    // Check snapshot logs
    const snapshotLogs = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .take(10);

    const snapshotsLast24h = snapshotLogs.filter((log: any) => {
      const age = Date.now() - log.timestamp;
      const hours = age / (1000 * 60 * 60);
      return hours < 24;
    });

    // Estimate Blockfrost calls
    const estimatedCallsFromSnapshots = snapshotsLast24h.reduce((total, log) => {
      // Each wallet in a snapshot makes ~10-20 Blockfrost calls
      // (addresses pagination + assets fetching + metadata)
      return total + (log.updatedCount * 15);
    }, 0);

    const estimatedCallsFromSyncs = syncsLast24h.length * 15; // ~15 calls per sync

    return {
      summary: {
        totalSyncsLast24h: syncsLast24h.length,
        totalSnapshotsLast24h: snapshotsLast24h.length,
        estimatedBlockfrostCalls: estimatedCallsFromSnapshots + estimatedCallsFromSyncs,
      },

      syncSagaActivity: {
        recentRuns: syncsLast24h.length,
        statusBreakdown: syncsByStatus,
        recentSyncs: syncsLast24h.slice(0, 10).map((sync: any) => ({
          walletAddress: sync.stakeAddress.substring(0, 20) + "...",
          status: sync.status,
          walletType: sync.walletType,
          createdAt: new Date(sync.createdAt).toISOString(),
          completedAt: sync.completedAt ? new Date(sync.completedAt).toISOString() : null,
          attemptCount: sync.attemptCount || 1,
        })),
      },

      snapshotActivity: {
        recentRuns: snapshotsLast24h.length,
        totalWalletsProcessed: snapshotsLast24h.reduce((sum, log) => sum + (log.updatedCount || 0), 0),
        recentSnapshots: snapshotsLast24h.map((log: any) => ({
          timestamp: new Date(log.timestamp).toISOString(),
          status: log.status,
          totalMiners: log.totalMiners,
          updatedCount: log.updatedCount,
          errorCount: log.errorCount,
          estimatedBlockfrostCalls: (log.updatedCount || 0) * 15,
        })),
      },

      potentialIssues: [
        syncsLast24h.length > 100 ? `⚠️ CRITICAL: ${syncsLast24h.length} NFT syncs in 24h (expected: <50)` : null,
        snapshotsLast24h.length > 5 ? `⚠️ ${snapshotsLast24h.length} snapshots in 24h (expected: 4)` : null,
        syncsByStatus.pending > 10 ? `⚠️ ${syncsByStatus.pending} pending syncs (possible backlog)` : null,
        syncsByStatus.failed > 5 ? `⚠️ ${syncsByStatus.failed} failed syncs (retries causing extra calls)` : null,
      ].filter(Boolean),

      recommendations: [
        syncsLast24h.length > 50 ? "Disable auto-sync on wallet add - trigger manually instead" : null,
        snapshotsLast24h.length > 5 ? "Check if snapshot cron is triggering too frequently" : null,
        estimatedCallsFromSnapshots + estimatedCallsFromSyncs > 10000
          ? "Consider implementing Blockfrost call caching"
          : null,
      ].filter(Boolean),
    };
  },
});

/**
 * Check for stuck or looping syncs
 */
export const checkForLoopingSyncs = query({
  args: {},
  handler: async (ctx) => {
    const allSyncs = await ctx.db.query("nftSyncSaga").collect();

    // Group syncs by wallet address
    const syncsByWallet = new Map<string, any[]>();
    for (const sync of allSyncs) {
      const syncs = syncsByWallet.get(sync.stakeAddress) || [];
      syncs.push(sync);
      syncsByWallet.set(sync.stakeAddress, syncs);
    }

    // Find wallets with excessive syncs
    const walletsWithExcessiveSyncs = [];
    for (const [wallet, syncs] of syncsByWallet.entries()) {
      if (syncs.length > 5) {
        const last24h = syncs.filter((s: any) => {
          const age = Date.now() - s.createdAt;
          return age < 24 * 60 * 60 * 1000;
        });

        if (last24h.length > 3) {
          walletsWithExcessiveSyncs.push({
            wallet: wallet.substring(0, 20) + "...",
            totalSyncs: syncs.length,
            syncsLast24h: last24h.length,
            statuses: last24h.map((s: any) => s.status),
            oldestSync: new Date(Math.min(...syncs.map((s: any) => s.createdAt))).toISOString(),
            newestSync: new Date(Math.max(...syncs.map((s: any) => s.createdAt))).toISOString(),
          });
        }
      }
    }

    return {
      totalWalletsWithSyncs: syncsByWallet.size,
      walletsWithExcessiveSyncs,
      criticalIssue: walletsWithExcessiveSyncs.length > 0,
    };
  },
});
