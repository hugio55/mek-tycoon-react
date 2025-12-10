import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const crons = cronJobs();

// PAUSED (Dec 1, 2025): Mekanism upgrading phase complete - no longer needed
// Re-enable by uncommenting when wallet verification is needed again
// Check all wallets every 24 hours and update Mek ownership snapshots
// This prevents cheating by detecting when Meks move between wallets
// crons.interval(
//   "wallet snapshot checks",
//   {
//     hours: 24
//   },
//   api.goldMiningSnapshot.triggerSnapshot
// );

// PHASE II: goldBackups table DELETED - Phase I backup system obsolete
// Gold now comes from Job Slots, not individual Mek rarity

// PAUSED (Dec 1, 2025): Leaderboard not visible during maintenance
// Re-enable when site is live again
// Update pre-computed leaderboard rankings every 6 hours (reduced from 15 minutes to save bandwidth)
// crons.interval(
//   "update leaderboard rankings",
//   {
//     hours: 6
//   },
//   internal.leaderboardUpdater.updateGoldLeaderboard
// );

// PAUSED (Dec 1, 2025): No wallet logins during maintenance - cleanup not needed
// One-time cleanup ran: 0 expired nonces found
// Re-enable when wallet connections are live again
// Clean up expired wallet authentication nonces every 15 minutes
// crons.interval(
//   "cleanup expired nonces",
//   {
//     minutes: 15
//   },
//   internal.walletAuthentication.cleanupExpiredNonces
// );

// Clean up expired NFT reservations every hour (both campaign-based and legacy Phase 1)
// Handles: campaign reservations (with campaignId) AND legacy reservations (without campaignId)
// Use the "Enable/Disable Cleanup" toggle in Campaign Management to control per-campaign
crons.interval(
  "cleanup expired NFT reservations",
  {
    hours: 1
  },
  internal.commemorativeNFTReservationsCampaign.internalCleanupExpiredReservations
);

// PAUSED (Dec 7, 2025): nmkrSync.ts disabled for TypeScript fixes
// Re-enable when nmkrSync is restored
// Auto-sync NMKR NFT statuses every 10 minutes
// This catches any missed webhooks and ensures our database reflects NMKR's actual state
// If a payment goes through but webhook fails, this will detect and fix it within 10 minutes
// crons.interval(
//   "auto sync NMKR NFT statuses",
//   {
//     minutes: 10
//   },
//   internal.nmkrSync.internalAutoSyncWithNMKR
// );

// PAUSED (Dec 1, 2025): No wallet logins during maintenance - cleanup not needed
// One-time cleanup ran: 0 expired lockouts found
// Re-enable when wallet connections are live again
// Clean up expired rate limit lockouts every hour
// crons.interval(
//   "cleanup expired lockouts",
//   {
//     hours: 1
//   },
//   internal.walletAuthentication.cleanupExpiredLockouts
// );

// PAUSED (Dec 1, 2025): Anti-cheat not needed during maintenance - no active users
// Re-enable when wallet verification is needed again
// Auto-fix asset overlaps every 24 hours (right after snapshots run)
// crons.interval(
//   "auto-fix asset overlaps",
//   {
//     hours: 24
//   },
//   internal.duplicateWalletDetection.autoFixAssetOverlaps
// );

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
// DISABLED: Was consuming massive bandwidth (477MB on Prod, 404MB on Dev)
// crons.interval(
//   "generate monitoring summary",
//   {
//     minutes: 15
//   },
//   internal.monitoringSummaryGenerator.generateSummary
// );

// PAUSED (Dec 7, 2025): monitoring.ts disabled for TypeScript fixes
// Clean up monitoring logs older than 30 days (runs daily at 3 AM UTC)
// crons.daily(
//   "cleanup old monitoring logs",
//   {
//     hourUTC: 3,
//     minuteUTC: 0
//   },
//   internal.monitoring.cleanupOldEvents
// );

// Clean up monitoring summaries older than 30 days (runs daily at 3:15 AM UTC)
// crons.daily(
//   "cleanup old monitoring summaries",
//   {
//     hourUTC: 3,
//     minuteUTC: 15
//   },
//   internal.monitoring.cleanupOldSummaries
// );

// PHASE II: mekOwnershipHistory table DELETED - Phase I gold snapshot system obsolete
// The old cron jobs for cleanup are no longer needed

// ============================================
// PHASE II: Transaction cleanup crons REMOVED
// Deleted crons: cleanup old stock price history, cleanup old gold transactions,
// cleanup old bank transactions, cleanup old stock transactions
// (These referenced tables that were removed: stockPriceHistory, goldTransactions,
// bankTransactions, stockTransactions)
// ============================================

export default crons;