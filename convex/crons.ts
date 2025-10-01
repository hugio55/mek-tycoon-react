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
  api.goldMiningSnapshot.runNightlySnapshot as any
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

export default crons;