import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic query to trace gold history for a specific wallet
 * Shows snapshot timeline with cumulative gold values
 */
export const traceWalletGoldHistory = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current goldMining record
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      return { error: "Wallet not found" };
    }

    // Get all snapshots for this wallet
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("asc") // Oldest first
      .collect();

    // Build timeline showing cumulative gold at each checkpoint
    const timeline = snapshots.map((snapshot, index) => {
      const prevSnapshot = index > 0 ? snapshots[index - 1] : null;

      return {
        timestamp: snapshot.snapshotTime,
        date: new Date(snapshot.snapshotTime).toLocaleString(),
        mekCount: snapshot.totalMekCount,
        goldPerHour: snapshot.totalGoldPerHour,

        // Gold values at snapshot time
        accumulatedGold: snapshot.accumulatedGold || 0,
        totalCumulativeGold: snapshot.totalCumulativeGold || 0,
        totalGoldSpentOnUpgrades: snapshot.totalGoldSpentOnUpgrades || 0,
        spendableGold: snapshot.spendableGold || 0,
        cumulativeGoldEarned: snapshot.cumulativeGoldEarned || 0,

        // Changes from previous snapshot
        cumulativeChange: prevSnapshot
          ? (snapshot.totalCumulativeGold || 0) - (prevSnapshot.totalCumulativeGold || 0)
          : null,

        // Time since previous snapshot
        hoursSincePrevious: prevSnapshot
          ? (snapshot.snapshotTime - prevSnapshot.snapshotTime) / (1000 * 60 * 60)
          : null,
      };
    });

    // Calculate current state
    const now = Date.now();
    const lastSnapshot = snapshots[snapshots.length - 1];
    const hoursSinceLastSnapshot = lastSnapshot
      ? (now - lastSnapshot.snapshotTime) / (1000 * 60 * 60)
      : (now - miner.createdAt) / (1000 * 60 * 60);

    const currentAccumulated = miner.accumulatedGold || 0;
    const currentCumulative = miner.totalCumulativeGold || 0;
    const expectedCumulative = lastSnapshot
      ? (lastSnapshot.totalCumulativeGold || 0) + (miner.totalGoldPerHour * hoursSinceLastSnapshot)
      : (miner.totalGoldPerHour * hoursSinceLastSnapshot);

    return {
      walletAddress: args.walletAddress,
      companyName: miner.companyName || null,

      currentState: {
        createdAt: new Date(miner.createdAt).toLocaleString(),
        currentGoldPerHour: miner.totalGoldPerHour,
        currentAccumulatedGold: currentAccumulated,
        currentTotalCumulativeGold: currentCumulative,
        currentTotalGoldSpentOnUpgrades: miner.totalGoldSpentOnUpgrades || 0,
        isVerified: miner.isBlockchainVerified === true,
        hoursSinceLastSnapshot,
        expectedCumulativeGold: expectedCumulative,
        cumulativeMismatch: expectedCumulative - currentCumulative,
      },

      snapshotTimeline: timeline,

      diagnostics: {
        totalSnapshots: snapshots.length,
        firstSnapshot: snapshots[0] ? new Date(snapshots[0].snapshotTime).toLocaleString() : null,
        lastSnapshot: lastSnapshot ? new Date(lastSnapshot.snapshotTime).toLocaleString() : null,
        cumulativeDropDetected: timeline.some(s => s.cumulativeChange !== null && s.cumulativeChange < 0),
      }
    };
  },
});
