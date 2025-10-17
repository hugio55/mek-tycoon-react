import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const crons = cronJobs();

// Check all wallets every 6 hours and update Mek ownership snapshots
crons.interval(
  "wallet snapshot checks",
  {
    hours: 6
  },
  api.goldMiningSnapshot.triggerSnapshot
);

// Create automatic gold backups every 6 hours
crons.interval(
  "create gold backups",
  {
    hours: 6
  },
  api.goldBackups.triggerManualDailyBackup
);

// Update pre-computed leaderboard rankings every 5 minutes
crons.interval(
  "update leaderboard rankings",
  {
    minutes: 5
  },
  internal.leaderboardUpdater.updateGoldLeaderboard
);

// Clean up expired wallet authentication nonces every 15 minutes
crons.interval(
  "cleanup expired nonces",
  {
    minutes: 15
  },
  internal.walletAuthentication.cleanupExpiredNonces
);

// Clean up expired rate limit lockouts every hour
crons.interval(
  "cleanup expired lockouts",
  {
    hours: 1
  },
  internal.walletAuthentication.cleanupExpiredLockouts
);

// Auto-fix asset overlaps every 6 hours (right after snapshots run)
crons.interval(
  "auto-fix asset overlaps",
  {
    hours: 6
  },
  internal.duplicateWalletDetection.autoFixAssetOverlaps
);

// Daily essence checkpoint for market visibility (runs at midnight UTC)
crons.daily(
  "essence daily checkpoint",
  {
    hourUTC: 0,
    minuteUTC: 0
  },
  internal.essence.dailyEssenceCheckpoint
);

// Generate monitoring summaries every 15 minutes
crons.interval(
  "generate monitoring summary",
  {
    minutes: 15
  },
  internal.monitoringSummaryGenerator.generateSummary
);

// Clean up monitoring logs older than 30 days (runs daily at 3 AM UTC)
crons.daily(
  "cleanup old monitoring logs",
  {
    hourUTC: 3,
    minuteUTC: 0
  },
  internal.monitoring.cleanupOldEvents
);

// Clean up monitoring summaries older than 30 days (runs daily at 3:15 AM UTC)
crons.daily(
  "cleanup old monitoring summaries",
  {
    hourUTC: 3,
    minuteUTC: 15
  },
  internal.monitoring.cleanupOldSummaries
);

export default crons;