import { query } from "./_generated/server";

/**
 * Find when mek levels were reset by checking audit logs
 * This will show the last time meks were at higher levels and when they became level 1
 */
export const findResetTimestamp = query({
  args: {},
  handler: async (ctx) => {
    console.log("[RESET INVESTIGATION] Starting timeline analysis...");

    // 1. Get recent level upgrades from audit logs
    const recentUpgrades = await ctx.db
      .query("auditLogs")
      .filter((q: any) => q.eq(q.field("type"), "mekUpgrade"))
      .order("desc")
      .take(100);

    if (recentUpgrades.length === 0) {
      return {
        error: "No upgrade records found in audit logs",
        suggestion: "Check if auditLogs table exists and has data"
      };
    }

    // 2. Find the last upgrade before the reset (should show level > 1)
    const lastUpgradeBeforeReset = recentUpgrades.find(
      log => log.newLevel && log.newLevel > 1
    );

    // 3. Check current mek levels
    const currentLevels = await ctx.db
      .query("mekLevels")
      .filter((q: any) => q.eq(q.field("ownershipStatus"), "verified"))
      .take(50);

    const level1Count = currentLevels.filter((m: any) => m.currentLevel === 1).length;
    const higherLevelCount = currentLevels.filter((m: any) => m.currentLevel > 1).length;

    // 4. Look for any monitoring logs around the reset time
    const monitoringLogs = await ctx.db
      .query("monitoringLogs")
      .filter((q: any) =>
        q.or(
          q.eq(q.field("functionName"), "resetAllMekLevels"),
          q.eq(q.field("functionName"), "resetAllProgress"),
          q.eq(q.field("category"), "gold")
        )
      )
      .order("desc")
      .take(50);

    const resetLogs = monitoringLogs.filter((log: any) =>
      log.message && (
        log.message.includes("reset") ||
        log.message.includes("Reset") ||
        log.message.includes("RESET")
      )
    );

    return {
      summary: {
        currentLevel1Count: level1Count,
        currentHigherLevelCount: higherLevelCount,
        lastUpgradeFound: lastUpgradeBeforeReset ? {
          timestamp: lastUpgradeBeforeReset.timestamp,
          date: new Date(lastUpgradeBeforeReset.timestamp).toISOString(),
          asset: lastUpgradeBeforeReset.assetName,
          oldLevel: lastUpgradeBeforeReset.oldLevel,
          newLevel: lastUpgradeBeforeReset.newLevel,
          wallet: lastUpgradeBeforeReset.stakeAddress?.substring(0, 20) + "..."
        } : null,
        hoursAgo: lastUpgradeBeforeReset
          ? ((Date.now() - lastUpgradeBeforeReset.timestamp) / (1000 * 60 * 60)).toFixed(1)
          : null
      },
      resetEventsInMonitoringLogs: resetLogs.map((log: any) => ({
        timestamp: log.timestamp,
        date: new Date(log.timestamp || 0).toISOString(),
        hoursAgo: log.timestamp ? ((Date.now() - log.timestamp) / (1000 * 60 * 60)).toFixed(1) : null,
        functionName: log.functionName,
        category: log.category,
        message: log.message,
        severity: log.severity
      })),
      recentUpgrades: recentUpgrades.slice(0, 10).map((log: any) => ({
        timestamp: log.timestamp,
        date: new Date(log.timestamp).toISOString(),
        hoursAgo: ((Date.now() - log.timestamp) / (1000 * 60 * 60)).toFixed(1),
        asset: log.assetName,
        oldLevel: log.oldLevel,
        newLevel: log.newLevel,
        wallet: log.stakeAddress?.substring(0, 20) + "..."
      }))
    };
  }
});
