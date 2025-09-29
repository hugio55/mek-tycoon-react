import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Thresholds for anomaly detection
const ANOMALY_THRESHOLDS = {
  MAX_GOLD_RATE: 500, // Gold per hour shouldn't exceed this
  MIN_TIME_BETWEEN_UPDATES: 30000, // 30 seconds minimum
  MAX_MEK_CHANGE: 100, // Max Meks that can be added at once
  SUSPICIOUS_GOLD_JUMP: 10000, // Sudden gold increase
  MAX_FAILED_SIGNATURES_PER_HOUR: 5,
  MAX_RATE_LIMIT_VIOLATIONS: 10,
};

// Detect anomalies in the system
export const detectAnomalies = action({
  args: {},
  handler: async (ctx): Promise<{
    anomalies: Array<{
      type: string;
      walletAddress: string;
      detail: string;
      timestamp: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    suspiciousCount: number;
  }> => {
    const anomalies = [];
    const suspiciousWallets = new Set<string>();

    try {
      // Get all miners data
      const allMiners = await ctx.runQuery(api.goldMining.getAllGoldMiningData);

      // Check for rate anomalies
      for (const miner of allMiners) {
        // Check for excessive gold rate
        if (miner.totalGoldPerHour > ANOMALY_THRESHOLDS.MAX_GOLD_RATE) {
          anomalies.push({
            type: 'EXCESSIVE_GOLD_RATE',
            walletAddress: miner.walletAddress,
            detail: `Gold rate ${miner.totalGoldPerHour}/hr exceeds max ${ANOMALY_THRESHOLDS.MAX_GOLD_RATE}/hr`,
            timestamp: Date.now(),
            severity: 'high' as const
          });
          suspiciousWallets.add(miner.walletAddress);
        }

        // Check for impossible gold accumulation
        const timeSinceCreation = Date.now() - miner.createdAt;
        const maxPossibleGold = (timeSinceCreation / (1000 * 60 * 60)) * miner.totalGoldPerHour;
        if (miner.currentGold > maxPossibleGold * 1.1) { // 10% tolerance
          anomalies.push({
            type: 'IMPOSSIBLE_GOLD_AMOUNT',
            walletAddress: miner.walletAddress,
            detail: `Current gold ${miner.currentGold} exceeds max possible ${maxPossibleGold.toFixed(0)}`,
            timestamp: Date.now(),
            severity: 'critical' as const
          });
          suspiciousWallets.add(miner.walletAddress);
        }

        // Check for sudden Mek count changes
        if (miner.snapshotMekCount !== undefined) {
          const mekChange = miner.mekCount - miner.snapshotMekCount;
          if (Math.abs(mekChange) > ANOMALY_THRESHOLDS.MAX_MEK_CHANGE) {
            anomalies.push({
              type: 'SUSPICIOUS_MEK_CHANGE',
              walletAddress: miner.walletAddress,
              detail: `Mek count changed by ${mekChange} (from ${miner.snapshotMekCount} to ${miner.mekCount})`,
              timestamp: Date.now(),
              severity: 'medium' as const
            });
            suspiciousWallets.add(miner.walletAddress);
          }
        }

        // Check for rapid update patterns
        const timeSinceLastActive = Date.now() - miner.lastActiveTime;
        if (timeSinceLastActive < ANOMALY_THRESHOLDS.MIN_TIME_BETWEEN_UPDATES) {
          anomalies.push({
            type: 'RAPID_UPDATE_PATTERN',
            walletAddress: miner.walletAddress,
            detail: `Updates happening too quickly: ${timeSinceLastActive}ms since last update`,
            timestamp: Date.now(),
            severity: 'low' as const
          });
        }
      }

      // Check authentication logs for suspicious patterns
      const recentLogs = await ctx.runQuery(api.auditLogs.getRecentLogs, { limit: 100 });
      const walletAttempts = new Map<string, number>();
      const failedSignatures = new Map<string, number>();

      for (const log of recentLogs) {
        if (log.type === 'walletConnection') {
          const wallet = log.stakeAddress;
          const attempts = walletAttempts.get(wallet) || 0;
          walletAttempts.set(wallet, attempts + 1);

          if (!log.signatureVerified) {
            const failures = failedSignatures.get(wallet) || 0;
            failedSignatures.set(wallet, failures + 1);

            if (failures > ANOMALY_THRESHOLDS.MAX_FAILED_SIGNATURES_PER_HOUR) {
              anomalies.push({
                type: 'EXCESSIVE_FAILED_SIGNATURES',
                walletAddress: wallet,
                detail: `${failures} failed signature attempts in recent period`,
                timestamp: Date.now(),
                severity: 'high' as const
              });
              suspiciousWallets.add(wallet);
            }
          }
        }
      }

      // Check for wallet spoofing patterns
      const walletsByIP = new Map<string, Set<string>>();
      for (const log of recentLogs) {
        if (log.ipAddress) {
          const wallets = walletsByIP.get(log.ipAddress) || new Set();
          wallets.add(log.stakeAddress || log.walletAddress || '');
          walletsByIP.set(log.ipAddress, wallets);
        }
      }

      // Flag IPs with multiple wallets
      for (const [ip, wallets] of walletsByIP.entries()) {
        if (wallets.size > 3) {
          anomalies.push({
            type: 'MULTIPLE_WALLETS_SAME_IP',
            walletAddress: Array.from(wallets).join(', '),
            detail: `${wallets.size} different wallets from same IP: ${ip}`,
            timestamp: Date.now(),
            severity: 'medium' as const
          });
          wallets.forEach(w => suspiciousWallets.add(w));
        }
      }

      // Store detected anomalies
      if (anomalies.length > 0) {
        await ctx.runMutation(api.securityMonitoring.storeAnomalies, {
          anomalies
        });
      }

      return {
        anomalies: anomalies.slice(0, 50), // Limit to 50 most recent
        suspiciousCount: suspiciousWallets.size
      };

    } catch (error) {
      console.error('[SecurityMonitoring] Error detecting anomalies:', error);
      return {
        anomalies: [],
        suspiciousCount: 0
      };
    }
  }
});

// Store detected anomalies
export const storeAnomalies = mutation({
  args: {
    anomalies: v.array(v.object({
      type: v.string(),
      walletAddress: v.string(),
      detail: v.string(),
      timestamp: v.number(),
      severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical'))
    }))
  },
  handler: async (ctx, args) => {
    for (const anomaly of args.anomalies) {
      await ctx.db.insert("securityAnomalies", {
        ...anomaly,
        resolved: false,
        createdAt: Date.now()
      });
    }
  }
});

// Get recent anomalies
export const getRecentAnomalies = query({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')))
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let query = ctx.db.query("securityAnomalies")
      .withIndex("by_created")
      .order("desc");

    if (args.severity) {
      query = query.filter(q => q.eq(q.field("severity"), args.severity));
    }

    return await query.take(limit);
  }
});

// Mark anomaly as resolved
export const resolveAnomaly = mutation({
  args: {
    anomalyId: v.id("securityAnomalies")
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.anomalyId, {
      resolved: true,
      resolvedAt: Date.now()
    });
  }
});

// Flag wallet as suspicious
export const flagWallet = mutation({
  args: {
    walletAddress: v.string(),
    reason: v.string(),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical'))
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("suspiciousWallets", {
      walletAddress: args.walletAddress,
      reason: args.reason,
      severity: args.severity,
      flaggedAt: Date.now(),
      active: true
    });
  }
});

// Get suspicious wallets
export const getSuspiciousWallets = query({
  args: {
    active: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("suspiciousWallets");

    if (args.active !== undefined) {
      query = query.filter(q => q.eq(q.field("active"), args.active));
    }

    return await query.collect();
  }
});

// Monitor rate limit violations
export const recordRateLimitViolation = mutation({
  args: {
    walletAddress: v.string(),
    endpoint: v.string(),
    timestamp: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rateLimitViolations", {
      walletAddress: args.walletAddress,
      endpoint: args.endpoint,
      timestamp: args.timestamp || Date.now()
    });

    // Check if this wallet has too many violations
    const recentViolations = await ctx.db
      .query("rateLimitViolations")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .collect();

    if (recentViolations.length > ANOMALY_THRESHOLDS.MAX_RATE_LIMIT_VIOLATIONS) {
      // Flag the wallet
      await ctx.db.insert("suspiciousWallets", {
        walletAddress: args.walletAddress,
        reason: `Excessive rate limit violations: ${recentViolations.length}`,
        severity: 'medium',
        flaggedAt: Date.now(),
        active: true
      });
    }
  }
});

// Get security metrics
export const getSecurityMetrics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    // Get recent anomalies
    const recentAnomalies = await ctx.db
      .query("securityAnomalies")
      .withIndex("by_created")
      .filter(q => q.gt(q.field("createdAt"), last24Hours))
      .collect();

    // Get suspicious wallets
    const suspiciousWallets = await ctx.db
      .query("suspiciousWallets")
      .filter(q => q.eq(q.field("active"), true))
      .collect();

    // Get rate limit violations
    const rateLimitViolations = await ctx.db
      .query("rateLimitViolations")
      .filter(q => q.gt(q.field("timestamp"), last24Hours))
      .collect();

    // Get failed signatures from audit logs
    const failedSignatures = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .filter(q =>
        q.and(
          q.gt(q.field("timestamp"), last24Hours),
          q.eq(q.field("signatureVerified"), false)
        )
      )
      .collect();

    return {
      anomalyCount: recentAnomalies.length,
      anomaliesBySeverity: {
        low: recentAnomalies.filter(a => a.severity === 'low').length,
        medium: recentAnomalies.filter(a => a.severity === 'medium').length,
        high: recentAnomalies.filter(a => a.severity === 'high').length,
        critical: recentAnomalies.filter(a => a.severity === 'critical').length,
      },
      suspiciousWalletCount: suspiciousWallets.length,
      rateLimitViolations: rateLimitViolations.length,
      failedSignatures: failedSignatures.length,
      timestamp: now
    };
  }
});