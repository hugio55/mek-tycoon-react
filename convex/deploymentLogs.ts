import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a deployment action
export const logDeploymentAction = mutation({
  args: {
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
    message: v.string(),
    gitBranch: v.optional(v.string()),
    gitCommitHash: v.optional(v.string()),
    details: v.optional(v.any()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deploymentLogs", {
      action: args.action,
      status: args.status,
      message: args.message,
      gitBranch: args.gitBranch,
      gitCommitHash: args.gitCommitHash,
      details: args.details,
      timestamp: args.timestamp,
      createdAt: Date.now(),
    });
  },
});

// Get recent deployment logs
export const getRecentLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db
      .query("deploymentLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

// Get logs by action type
export const getLogsByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db
      .query("deploymentLogs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .take(limit);
  },
});

// Get logs by status
export const getLogsByStatus = query({
  args: {
    status: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db
      .query("deploymentLogs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(limit);
  },
});

// Get logs within a date range
export const getLogsByDateRange = query({
  args: {
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const logs = await ctx.db
      .query("deploymentLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    return logs
      .filter(log => log.timestamp >= args.startTimestamp && log.timestamp <= args.endTimestamp)
      .slice(0, limit);
  },
});

// Get summary stats
export const getLogStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("deploymentLogs").collect();

    const stats = {
      total: allLogs.length,
      success: allLogs.filter(l => l.status === "success").length,
      error: allLogs.filter(l => l.status === "error").length,
      pending: allLogs.filter(l => l.status === "pending").length,
      lastSuccess: null as number | null,
      lastError: null as number | null,
    };

    // Find most recent success and error
    const successLogs = allLogs.filter(l => l.status === "success").sort((a, b) => b.timestamp - a.timestamp);
    const errorLogs = allLogs.filter(l => l.status === "error").sort((a, b) => b.timestamp - a.timestamp);

    if (successLogs.length > 0) {
      stats.lastSuccess = successLogs[0].timestamp;
    }
    if (errorLogs.length > 0) {
      stats.lastError = errorLogs[0].timestamp;
    }

    return stats;
  },
});
