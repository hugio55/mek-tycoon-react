import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to log monitoring events
export const logEvent = internalMutation({
  args: {
    eventType: v.union(
      v.literal("error"),
      v.literal("critical_error"),
      v.literal("warning"),
      v.literal("snapshot"),
      v.literal("cron"),
      v.literal("database_issue"),
      v.literal("info")
    ),
    category: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    functionName: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("systemMonitoring", {
      timestamp: Date.now(),
      eventType: args.eventType,
      category: args.category,
      message: args.message,
      severity: args.severity,
      functionName: args.functionName,
      walletAddress: args.walletAddress,
      details: args.details,
      resolved: false,
    });
  },
});

// INTERNAL: Query recent monitoring events (requires authentication wrapper)
const _getRecentEvents = internalQuery({
  args: {
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
    category: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let query = ctx.db.query("systemMonitoring").order("desc");

    // Note: Filters would need to be applied in-memory since Convex
    // doesn't support chained filters on queries without indexes
    const events = await query.take(limit);

    // Apply filters in-memory
    let filtered = events;

    if (args.eventType) {
      filtered = filtered.filter(e => e.eventType === args.eventType);
    }

    if (args.category) {
      filtered = filtered.filter(e => e.category === args.category);
    }

    if (args.severity) {
      filtered = filtered.filter(e => e.severity === args.severity);
    }

    return filtered;
  },
});

// PUBLIC: Authenticated wrapper for getRecentEvents
export const getRecentEvents = query({
  args: {
    stakeAddress: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
    category: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const auth = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
      stakeAddress: args.stakeAddress,
    });

    if (!auth.authenticated) {
      throw new Error("Unauthorized: Authentication required to view monitoring events");
    }

    // Call internal query
    return await ctx.runQuery(api.monitoring._getRecentEvents, {
      limit: args.limit,
      eventType: args.eventType,
      category: args.category,
      severity: args.severity,
    });
  },
});

// INTERNAL: Get monitoring summary for a time range (requires authentication wrapper)
const _getSummary = internalQuery({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startTime = args.startTime || now - 24 * 60 * 60 * 1000; // Last 24 hours
    const endTime = args.endTime || now;

    const events = await ctx.db
      .query("systemMonitoring")
      .filter(q =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      )
      .collect();

    // Calculate statistics
    const totalEvents = events.length;
    const errorCount = events.filter(e => e.eventType === "error").length;
    const criticalErrorCount = events.filter(e => e.eventType === "critical_error").length;
    const warningCount = events.filter(e => e.eventType === "warning").length;
    const snapshotCount = events.filter(e => e.eventType === "snapshot").length;
    const cronCount = events.filter(e => e.eventType === "cron").length;

    // Get unique error messages
    const errorMessages = events
      .filter(e => e.eventType === "error" || e.eventType === "critical_error")
      .map(e => e.message);
    const uniqueErrors = [...new Set(errorMessages)];
    const topErrors = uniqueErrors.slice(0, 10);

    // Get critical events
    const criticalEvents = events
      .filter(e => e.severity === "critical")
      .map(e => ({
        timestamp: e.timestamp,
        message: e.message,
        category: e.category,
      }));

    // Determine system health
    let systemHealth: "healthy" | "warning" | "critical";
    if (criticalErrorCount > 0) {
      systemHealth = "critical";
    } else if (errorCount > 10 || warningCount > 50) {
      systemHealth = "warning";
    } else {
      systemHealth = "healthy";
    }

    return {
      startTime,
      endTime,
      totalEvents,
      errorCount,
      criticalErrorCount,
      warningCount,
      snapshotCount,
      cronCount,
      topErrors,
      criticalEvents,
      systemHealth,
    };
  },
});

// PUBLIC: Authenticated wrapper for getSummary
export const getSummary = query({
  args: {
    stakeAddress: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const auth = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
      stakeAddress: args.stakeAddress,
    });

    if (!auth.authenticated) {
      throw new Error("Unauthorized: Authentication required to view monitoring summary");
    }

    // Call internal query
    return await ctx.runQuery(api.monitoring._getSummary, {
      startTime: args.startTime,
      endTime: args.endTime,
    });
  },
});

// INTERNAL: Get latest monitoring summaries (requires authentication wrapper)
const _getLatestSummaries = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const summaries = await ctx.db
      .query("monitoringSummaries")
      .order("desc")
      .take(limit);

    return summaries;
  },
});

// PUBLIC: Authenticated wrapper for getLatestSummaries
export const getLatestSummaries = query({
  args: {
    stakeAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const auth = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
      stakeAddress: args.stakeAddress,
    });

    if (!auth.authenticated) {
      throw new Error("Unauthorized: Authentication required to view monitoring summaries");
    }

    // Call internal query
    return await ctx.runQuery(api.monitoring._getLatestSummaries, {
      limit: args.limit,
    });
  },
});

// Mark event as resolved (requires authentication)
export const markEventResolved = mutation({
  args: {
    stakeAddress: v.string(),
    eventId: v.id("systemMonitoring"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const auth = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
      stakeAddress: args.stakeAddress,
    });

    if (!auth.authenticated) {
      throw new Error("Unauthorized: Authentication required to resolve monitoring events");
    }

    await ctx.db.patch(args.eventId, {
      resolved: true,
    });
  },
});

// Clean up monitoring events older than 30 days (runs daily via cron)
export const cleanupOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Find all events older than 30 days
    const oldEvents = await ctx.db
      .query("systemMonitoring")
      .filter(q => q.lt(q.field("timestamp"), thirtyDaysAgo))
      .collect();

    let deletedCount = 0;
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
      deletedCount++;
    }

    console.log(`[Cleanup] Deleted ${deletedCount} monitoring events older than 30 days`);

    return {
      success: true,
      deletedCount,
      cutoffTime: thirtyDaysAgo,
      timestamp: now,
    };
  },
});

// Clean up monitoring summaries older than 30 days (runs daily via cron)
export const cleanupOldSummaries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Find all summaries older than 30 days
    const oldSummaries = await ctx.db
      .query("monitoringSummaries")
      .filter(q => q.lt(q.field("endTime"), thirtyDaysAgo))
      .collect();

    let deletedCount = 0;
    for (const summary of oldSummaries) {
      await ctx.db.delete(summary._id);
      deletedCount++;
    }

    console.log(`[Cleanup] Deleted ${deletedCount} monitoring summaries older than 30 days`);

    return {
      success: true,
      deletedCount,
      cutoffTime: thirtyDaysAgo,
      timestamp: now,
    };
  },
});
