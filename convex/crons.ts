import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Auto-merge duplicate wallet records daily
crons.daily(
  "merge duplicate wallets",
  {
    hourUTC: 4, // Run at 4 AM UTC
    minuteUTC: 0
  },
  api.adminVerificationReset.autoMergeDuplicates
);

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

export default crons;