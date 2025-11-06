import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const crons = cronJobs();

// Check all wallets every 24 hours and update Mek ownership snapshots
// This prevents cheating by detecting when Meks move between wallets
crons.interval(
  "wallet snapshot checks",
  {
    hours: 24
  },
  api.goldMiningSnapshot.triggerSnapshot
);

// Create automatic gold backups every 12 hours
crons.interval(
  "create gold backups",
  {
    hours: 12
  },
  api.goldBackups.triggerManualDailyBackup
);

// Update pre-computed leaderboard rankings every 6 hours (reduced from 15 minutes to save bandwidth)
crons.interval(
  "update leaderboard rankings",
  {
    hours: 6
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

// Clean up expired NFT campaign reservations every 5 minutes
// Releases reserved NFTs back to available pool after 10-minute timeout
crons.interval(
  "cleanup expired NFT reservations",
  {
    minutes: 5
  },
  internal.commemorativeNFTReservationsCampaign.internalCleanupExpiredReservations
);

// Clean up expired rate limit lockouts every hour
crons.interval(
  "cleanup expired lockouts",
  {
    hours: 1
  },
  internal.walletAuthentication.cleanupExpiredLockouts
);

// Auto-fix asset overlaps every 24 hours (right after snapshots run)
crons.interval(
  "auto-fix asset overlaps",
  {
    hours: 24
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

// 12-hour essence checkpoints for persistence and crash recovery (mirrors gold system)
crons.interval(
  "update essence checkpoints",
  {
    hours: 12
  },
  internal.essence.updateEssenceCheckpoints
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