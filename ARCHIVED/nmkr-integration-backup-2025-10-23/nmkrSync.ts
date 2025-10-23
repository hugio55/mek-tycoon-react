import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

// Get sync status for a project
export const getSyncStatus = query({
  args: { nmkrProjectId: v.string() },
  handler: async (ctx, args) => {
    const recentSyncs = await ctx.db
      .query("nmkrSyncLog")
      .withIndex("by_project", (q) => q.eq("nmkrProjectId", args.nmkrProjectId))
      .order("desc")
      .take(10);

    if (recentSyncs.length === 0) {
      return {
        lastSync: null,
        syncHealth: "unknown" as const,
        recentSyncs: [],
      };
    }

    const lastSync = recentSyncs[0];
    const successfulSyncs = recentSyncs.filter(s => s.status === "success").length;
    const failedSyncs = recentSyncs.filter(s => s.status === "failed").length;

    // Determine sync health
    let syncHealth: "healthy" | "warning" | "error" | "unknown";
    if (failedSyncs === 0) {
      syncHealth = "healthy";
    } else if (failedSyncs <= 2) {
      syncHealth = "warning";
    } else {
      syncHealth = "error";
    }

    return {
      lastSync,
      syncHealth,
      recentSyncs,
      stats: {
        successfulSyncs,
        failedSyncs,
        totalSyncs: recentSyncs.length,
      },
    };
  },
});

// Get recent sync logs
export const getRecentSyncLogs = query({
  args: {
    nmkrProjectId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nmkrSyncLog");

    if (args.nmkrProjectId) {
      query = query.withIndex("by_project", (q) => q.eq("nmkrProjectId", args.nmkrProjectId));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const logs = await query.order("desc").take(args.limit || 50);

    return logs;
  },
});

// Get all NMKR projects being tracked
export const getTrackedProjects = query({
  args: {},
  handler: async (ctx) => {
    // Get all events with NMKR project IDs
    const events = await ctx.db
      .query("nftEvents")
      .filter((q) => q.neq(q.field("nmkrProjectId"), undefined))
      .collect();

    // Get unique project IDs
    const projectIds = new Set(events.map(e => e.nmkrProjectId).filter(Boolean) as string[]);

    // Get sync status for each project
    const projects = await Promise.all(
      Array.from(projectIds).map(async (projectId) => {
        const event = events.find(e => e.nmkrProjectId === projectId);
        const lastSync = await ctx.db
          .query("nmkrSyncLog")
          .withIndex("by_project", (q) => q.eq("nmkrProjectId", projectId))
          .order("desc")
          .first();

        return {
          projectId,
          projectName: event?.nmkrProjectName || projectId,
          eventName: event?.eventName,
          eventNumber: event?.eventNumber,
          lastSync: lastSync?.syncCompletedAt,
          lastSyncStatus: lastSync?.status,
        };
      })
    );

    return projects;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Record sync log
export const recordSyncLog = mutation({
  args: {
    syncType: v.union(
      v.literal("webhook"),
      v.literal("api_pull"),
      v.literal("manual_sync")
    ),
    nmkrProjectId: v.string(),
    status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed")),
    recordsSynced: v.number(),
    errors: v.optional(v.array(v.string())),
    syncedData: v.optional(v.any()),
    syncStartedAt: v.number(),
    syncCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("nmkrSyncLog", {
      syncType: args.syncType,
      nmkrProjectId: args.nmkrProjectId,
      status: args.status,
      recordsSynced: args.recordsSynced,
      errors: args.errors,
      syncedData: args.syncedData,
      syncStartedAt: args.syncStartedAt,
      syncCompletedAt: args.syncCompletedAt,
    });

    return logId;
  },
});

// Trigger manual sync (placeholder - actual sync logic would be in an action)
export const triggerSync = mutation({
  args: {
    nmkrProjectId: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a placeholder mutation
    // Actual sync logic would be implemented in a Convex action
    // that can make HTTP requests to NMKR API

    const now = Date.now();

    // Record that sync was triggered
    await ctx.db.insert("nmkrSyncLog", {
      syncType: "manual_sync",
      nmkrProjectId: args.nmkrProjectId,
      status: "success",
      recordsSynced: 0,
      syncStartedAt: now,
      syncCompletedAt: now,
    });

    return {
      success: true,
      message: "Sync triggered. Implement actual NMKR API calls in a Convex action.",
    };
  },
});

// Update NMKR project mapping
export const updateNMKRMapping = mutation({
  args: {
    eventId: v.id("nftEvents"),
    nmkrProjectId: v.string(),
    nmkrProjectName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.eventId, {
      nmkrProjectId: args.nmkrProjectId,
      nmkrProjectName: args.nmkrProjectName,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Clean up old sync logs (keep last 100 per project)
export const cleanupOldLogs = mutation({
  args: {
    nmkrProjectId: v.optional(v.string()),
    keepCount: v.optional(v.number()), // Default 100
  },
  handler: async (ctx, args) => {
    const keepCount = args.keepCount || 100;
    let deletedCount = 0;

    if (args.nmkrProjectId) {
      // Clean up for specific project
      const logs = await ctx.db
        .query("nmkrSyncLog")
        .withIndex("by_project", (q) => q.eq("nmkrProjectId", args.nmkrProjectId))
        .order("desc")
        .collect();

      // Delete logs beyond keepCount
      const logsToDelete = logs.slice(keepCount);
      for (const log of logsToDelete) {
        await ctx.db.delete(log._id);
        deletedCount++;
      }
    } else {
      // Clean up for all projects
      const allLogs = await ctx.db.query("nmkrSyncLog").collect();

      // Group by project
      const logsByProject: Record<string, typeof allLogs> = {};
      for (const log of allLogs) {
        if (!logsByProject[log.nmkrProjectId]) {
          logsByProject[log.nmkrProjectId] = [];
        }
        logsByProject[log.nmkrProjectId].push(log);
      }

      // Delete old logs for each project
      for (const projectId in logsByProject) {
        const logs = logsByProject[projectId].sort(
          (a, b) => b.syncCompletedAt - a.syncCompletedAt
        );
        const logsToDelete = logs.slice(keepCount);
        for (const log of logsToDelete) {
          await ctx.db.delete(log._id);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      deletedCount,
    };
  },
});
