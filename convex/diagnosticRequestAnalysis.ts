import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic tool to analyze request patterns
 *
 * This helps identify what's causing high request volumes by showing:
 * 1. Most frequently called functions
 * 2. Request patterns over time
 * 3. Active users and their request counts
 */

export const getRequestAnalysis = query({
  args: {},
  handler: async (ctx) => {
    // Get all users with recent activity
    const goldMiningRecords = await ctx.db.query("goldMining").collect();

    // Count active users (updated in last 24 hours)
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);

    const activeUsers = goldMiningRecords.filter(record =>
      (record.updatedAt || record.createdAt) > dayAgo
    );

    // Get session activity
    const sessions = await ctx.db.query("walletSessions").collect();
    const activeSessions = sessions.filter(session =>
      (session.lastActivityTime || session.lastActiveTime || session.createdAt) > dayAgo
    );

    // Get recent snapshots to estimate snapshot frequency
    const recentSnapshots = await ctx.db
      .query("goldSnapshots")
      .order("desc")
      .take(100);

    // Calculate snapshot frequency
    let snapshotFrequency = "N/A";
    if (recentSnapshots.length >= 2) {
      const oldestSnapshot = recentSnapshots[recentSnapshots.length - 1];
      const newestSnapshot = recentSnapshots[0];
      const timeDiff = newestSnapshot.timestamp - oldestSnapshot.timestamp;
      const avgInterval = timeDiff / (recentSnapshots.length - 1);
      snapshotFrequency = `${(avgInterval / 60000).toFixed(1)} minutes`;
    }

    // Get leaderboard cache info
    const leaderboardCache = await ctx.db.query("leaderboardCache").first();

    // Estimate daily requests based on active users
    const estimatedQueriesPerUserPerDay =
      7 + // Initial page load queries (7 useQuery calls)
      (24 * 60 / 5) + // Checkpoint mutations (every 5 min)
      5; // Occasional re-fetches

    const estimatedDailyRequests = activeUsers.length * estimatedQueriesPerUserPerDay;

    return {
      summary: {
        totalUsers: goldMiningRecords.length,
        activeUsersLast24h: activeUsers.length,
        activeSessionsLast24h: activeSessions.length,
        estimatedDailyRequests,
        requestsPerActiveUser: estimatedQueriesPerUserPerDay.toFixed(0),
      },

      systemActivity: {
        recentSnapshotsAnalyzed: recentSnapshots.length,
        snapshotFrequency,
        lastLeaderboardUpdate: leaderboardCache?.lastUpdated
          ? new Date(leaderboardCache.lastUpdated).toISOString()
          : "Never",
      },

      breakdown: {
        initialPageLoadQueries: 7, // 7 useQuery hooks on main page
        checkpointMutations: (24 * 60) / 5, // Every 5 minutes
        estimatedReactivityUpdates: 5, // Occasional state updates
        cronJobs: {
          leaderboardUpdates: (24 * 60) / 5, // Every 5 minutes
          nonceCleanu: (24 * 60) / 15, // Every 15 minutes
          snapshotChecks: 24 / 6, // Every 6 hours
          goldBackups: 24 / 6, // Every 6 hours
        },
      },

      potentialIssues: [
        activeUsers.length > 100 ? "⚠️ High user activity detected" : null,
        estimatedDailyRequests > 50000 ? "⚠️ Estimated requests exceed 50K/day" : null,
        activeSessions.length > activeUsers.length * 2 ? "⚠️ Orphaned sessions detected" : null,
      ].filter(Boolean),

      recommendations: [
        estimatedDailyRequests > 40000
          ? "Consider increasing checkpoint interval from 5min to 10min"
          : null,
        activeUsers.length > 50
          ? "Consider implementing request caching or debouncing"
          : null,
        leaderboardCache
          ? "Leaderboard caching is active (good)"
          : "Enable leaderboard caching to reduce queries",
      ].filter(Boolean),
    };
  },
});

/**
 * Get detailed user activity breakdown
 */
export const getUserActivityBreakdown = query({
  args: {
    hours: v.optional(v.number()), // Default 24 hours
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);

    const goldMiningRecords = await ctx.db.query("goldMining").collect();
    const sessions = await ctx.db.query("walletSessions").collect();

    // Group by activity level
    const veryActive = []; // Updated in last hour
    const active = []; // Updated in last 6 hours
    const inactive = []; // Updated in last 24 hours
    const dormant = []; // No update in 24+ hours

    for (const record of goldMiningRecords) {
      const lastActivity = record.updatedAt || record.createdAt;
      const hoursSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60);

      if (hoursSinceActivity < 1) {
        veryActive.push({
          wallet: record.walletAddress.substring(0, 15) + "...",
          hoursSinceActivity: hoursSinceActivity.toFixed(1),
        });
      } else if (hoursSinceActivity < 6) {
        active.push({
          wallet: record.walletAddress.substring(0, 15) + "...",
          hoursSinceActivity: hoursSinceActivity.toFixed(1),
        });
      } else if (hoursSinceActivity < 24) {
        inactive.push({
          wallet: record.walletAddress.substring(0, 15) + "...",
          hoursSinceActivity: hoursSinceActivity.toFixed(1),
        });
      } else {
        dormant.push({
          wallet: record.walletAddress.substring(0, 15) + "...",
          hoursSinceActivity: hoursSinceActivity.toFixed(0) + "h",
        });
      }
    }

    return {
      timeframe: `Last ${hours} hours`,
      userActivity: {
        veryActive: {
          count: veryActive.length,
          description: "Updated in last hour (likely actively using site)",
          users: veryActive.slice(0, 10), // Show first 10
        },
        active: {
          count: active.length,
          description: "Updated in last 6 hours",
          users: active.slice(0, 10),
        },
        inactive: {
          count: inactive.length,
          description: "Updated in last 24 hours",
        },
        dormant: {
          count: dormant.length,
          description: "No activity in 24+ hours",
        },
      },
      estimatedLoad: {
        veryActive: veryActive.length * 20, // 20 requests/hour
        active: active.length * 5, // 5 requests/hour
        total: (veryActive.length * 20) + (active.length * 5),
      },
    };
  },
});
