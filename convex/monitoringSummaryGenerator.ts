import { internalMutation } from "./_generated/server";

// Generate periodic monitoring summary
export const generateSummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const intervalMinutes = 15;
    const startTime = now - intervalMinutes * 60 * 1000;

    // Get all events in this interval
    const events = await ctx.db
      .query("systemMonitoring")
      .filter(q =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), now)
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
        functionName: e.functionName,
      }));

    // Determine system health
    let systemHealth: "healthy" | "warning" | "critical";
    if (criticalErrorCount > 0) {
      systemHealth = "critical";
    } else if (errorCount > 5 || warningCount > 20) {
      systemHealth = "warning";
    } else {
      systemHealth = "healthy";
    }

    // Store summary
    await ctx.db.insert("monitoringSummaries", {
      startTime,
      endTime: now,
      intervalMinutes,
      totalEvents,
      errorCount,
      criticalErrorCount,
      warningCount,
      snapshotCount,
      cronCount,
      topErrors,
      criticalEvents,
      systemHealth,
    });

    console.log(`[Monitoring] Generated summary: ${totalEvents} events, health: ${systemHealth}`);

    return {
      totalEvents,
      systemHealth,
      errorCount,
      criticalErrorCount,
    };
  },
});
