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

export default crons;