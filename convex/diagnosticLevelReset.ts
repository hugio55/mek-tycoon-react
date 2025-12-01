import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * DIAGNOSTIC: Investigate the global level reset incident
 * This query examines audit logs and level records to determine:
 * 1. When the reset happened
 * 2. How many wallets were affected
 * 3. What the levels were before the reset
 */

export const investigateLevelReset = query({
  args: {},
  handler: async (ctx) => {
    console.log("[DIAGNOSTIC] Starting level reset investigation...");

    // 1. Get all mekLevels records - check for suspicious patterns
    const allMekLevels = await ctx.db.query("mekLevels").collect();

    const level1Count = allMekLevels.filter(m => m.currentLevel === 1).length;
    const higherLevelCount = allMekLevels.filter(m => m.currentLevel > 1).length;
    const totalMeks = allMekLevels.length;

    console.log(`[DIAGNOSTIC] Mek Level Distribution:
      - Total Meks: ${totalMeks}
      - Level 1: ${level1Count} (${((level1Count/totalMeks)*100).toFixed(1)}%)
      - Level 2+: ${higherLevelCount} (${((higherLevelCount/totalMeks)*100).toFixed(1)}%)
    `);

    // 2. Check for recent level changes in audit logs
    const recentAudits = await ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("type"), "mekUpgrade"))
      .order("desc")
      .take(100);

    // Find the last upgrade before what might be a gap (indicating reset)
    const upgradeTimestamps = recentAudits.map(a => a.timestamp).sort((a, b) => b - a);

    let suspiciousGap = null;
    for (let i = 0; i < upgradeTimestamps.length - 1; i++) {
      const gap = upgradeTimestamps[i] - upgradeTimestamps[i + 1];
      const gapHours = gap / (1000 * 60 * 60);
      if (gapHours > 24) {
        suspiciousGap = {
          beforeTimestamp: upgradeTimestamps[i + 1],
          afterTimestamp: upgradeTimestamps[i],
          gapHours: gapHours.toFixed(1),
          beforeDate: new Date(upgradeTimestamps[i + 1]).toISOString(),
          afterDate: new Date(upgradeTimestamps[i]).toISOString(),
        };
        break;
      }
    }

    // 3. Get the last recorded level for each mek from audit logs
    const mekLastKnownLevels = new Map<string, { level: number, timestamp: number, date: string }>();

    for (const audit of recentAudits) {
      if (audit.assetId && audit.newLevel) {
        if (!mekLastKnownLevels.has(audit.assetId)) {
          mekLastKnownLevels.set(audit.assetId, {
            level: audit.newLevel,
            timestamp: audit.timestamp,
            date: new Date(audit.timestamp).toISOString(),
          });
        }
      }
    }

    // 4. Compare audit log levels to current levels - find discrepancies
    const discrepancies: Array<{
      assetId: string;
      assetName: string;
      currentLevel: number;
      lastRecordedLevel: number;
      lastRecordedDate: string;
      lost: number;
    }> = [];

    for (const mekLevel of allMekLevels) {
      const lastKnown = mekLastKnownLevels.get(mekLevel.assetId);
      if (lastKnown && lastKnown.level > mekLevel.currentLevel) {
        // This mek has a lower level now than in audit logs - was reset!
        const mek = await ctx.db
          .query("goldMining")
          .filter(q => q.eq(q.field("walletAddress"), mekLevel.walletAddress))
          .first();

        const mekData = mek?.ownedMeks.find(m => m.assetId === mekLevel.assetId);

        discrepancies.push({
          assetId: mekLevel.assetId,
          assetName: mekData?.assetName || "Unknown",
          currentLevel: mekLevel.currentLevel,
          lastRecordedLevel: lastKnown.level,
          lastRecordedDate: lastKnown.date,
          lost: lastKnown.level - mekLevel.currentLevel,
        });
      }
    }

    // 5. Group discrepancies by wallet to see scope
    const affectedWallets = new Set(
      discrepancies.map(d => {
        const mekLevel = allMekLevels.find(m => m.assetId === d.assetId);
        return mekLevel?.walletAddress;
      }).filter(Boolean)
    );

    // 6. Check monitoring logs for any reset-related events
    const monitoringLogs = await ctx.db
      .query("monitoringLogs")
      .filter(q =>
        q.or(
          q.eq(q.field("category"), "gold"),
          q.eq(q.field("functionName"), "resetAllMekLevels"),
          q.eq(q.field("functionName"), "resetAllProgress")
        )
      )
      .order("desc")
      .take(50);

    const resetEvents = monitoringLogs.filter(log =>
      log.message && (
        log.message.includes("reset") ||
        log.message.includes("Reset") ||
        log.message.includes("RESET")
      )
    );

    console.log(`[DIAGNOSTIC] Investigation complete:
      - Discrepancies found: ${discrepancies.length} meks
      - Affected wallets: ${affectedWallets.size}
      - Suspicious activity gap: ${suspiciousGap ? 'YES' : 'NO'}
      - Reset events in logs: ${resetEvents.length}
    `);

    return {
      summary: {
        totalMeks,
        level1Count,
        higherLevelCount,
        level1Percentage: ((level1Count/totalMeks)*100).toFixed(1) + '%',
        discrepanciesFound: discrepancies.length,
        affectedWallets: affectedWallets.size,
      },
      suspiciousGap,
      discrepancies: discrepancies.slice(0, 20), // Top 20 discrepancies
      resetEvents: resetEvents.map(log => ({
        timestamp: log.timestamp,
        date: new Date(log.timestamp || 0).toISOString(),
        eventType: log.eventType,
        category: log.category,
        message: log.message,
        functionName: log.functionName,
        severity: log.severity,
        walletAddress: log.walletAddress,
      })),
      lastUpgrades: recentAudits.slice(0, 10).map(audit => ({
        timestamp: audit.timestamp,
        date: new Date(audit.timestamp).toISOString(),
        wallet: audit.stakeAddress,
        asset: audit.assetName,
        oldLevel: audit.oldLevel,
        newLevel: audit.newLevel,
      })),
    };
  },
});

/**
 * DIAGNOSTIC: Get recovery data - last known levels before reset
 */
export const getRecoveryData = query({
  args: {},
  handler: async (ctx) => {
    // Get ALL upgrade history from audit logs
    const allUpgrades = await ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("type"), "mekUpgrade"))
      .collect();

    // Build a map of each mek's highest recorded level
    const mekMaxLevels = new Map<string, {
      assetId: string;
      assetName: string;
      walletAddress: string;
      maxLevel: number;
      lastUpgradeDate: string;
      goldSpent: number;
    }>();

    for (const upgrade of allUpgrades) {
      if (upgrade.assetId && upgrade.newLevel) {
        const existing = mekMaxLevels.get(upgrade.assetId);
        if (!existing || upgrade.newLevel > existing.maxLevel) {
          mekMaxLevels.set(upgrade.assetId, {
            assetId: upgrade.assetId,
            assetName: upgrade.assetName || "Unknown",
            walletAddress: upgrade.stakeAddress,
            maxLevel: upgrade.newLevel,
            lastUpgradeDate: new Date(upgrade.timestamp).toISOString(),
            goldSpent: upgrade.upgradeCost || 0,
          });
        }
      }
    }

    const recoveryData = Array.from(mekMaxLevels.values());

    console.log(`[RECOVERY] Found level data for ${recoveryData.length} meks`);

    return {
      totalMeks: recoveryData.length,
      recoveryData: recoveryData,
      summary: {
        level2Count: recoveryData.filter(m => m.maxLevel === 2).length,
        level3Count: recoveryData.filter(m => m.maxLevel === 3).length,
        level4Count: recoveryData.filter(m => m.maxLevel === 4).length,
        level5Count: recoveryData.filter(m => m.maxLevel === 5).length,
        level6PlusCount: recoveryData.filter(m => m.maxLevel >= 6).length,
      }
    };
  },
});
