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

// Update pre-computed leaderboard rankings every 15 minutes (reduced from 5 to save bandwidth)
crons.interval(
  "update leaderboard rankings",
  {
    minutes: 15
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

// Clean up old ownership snapshots (mekOwnershipHistory) older than 30 days (runs daily at 4 AM UTC)
crons.daily(
  "cleanup old ownership snapshots",
  {
    hourUTC: 4,
    minuteUTC: 0
  },
  internal.snapshotCleanup.cleanupOldSnapshots
);

// Clean up old snapshot logs older than 7 days (runs daily at 4:15 AM UTC)
crons.daily(
  "cleanup old snapshot logs",
  {
    hourUTC: 4,
    minuteUTC: 15
  },
  internal.snapshotCleanup.cleanupOldSnapshotLogs
);

// Clean up old transaction history tables (runs weekly on Monday at 2 AM UTC)
crons.weekly(
  "cleanup old stock price history",
  {
    dayOfWeek: "monday",
    hourUTC: 2,
    minuteUTC: 0
  },
  internal.transactionCleanup.cleanupOldStockPriceHistory
);

crons.weekly(
  "cleanup old gold transactions",
  {
    dayOfWeek: "monday",
    hourUTC: 2,
    minuteUTC: 15
  },
  internal.transactionCleanup.cleanupOldGoldTransactions
);

crons.weekly(
  "cleanup old bank transactions",
  {
    dayOfWeek: "monday",
    hourUTC: 2,
    minuteUTC: 30
  },
  internal.transactionCleanup.cleanupOldBankTransactions
);

crons.weekly(
  "cleanup old stock transactions",
  {
    dayOfWeek: "monday",
    hourUTC: 2,
    minuteUTC: 45
  },
  internal.transactionCleanup.cleanupOldStockTransactions
);

export default crons;