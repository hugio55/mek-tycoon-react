import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// DISABLED UNTIL LAUNCH - Leaderboard updates not needed during development
// Uncomment when going live:
/*
crons.interval(
  "update leaderboards",
  { hours: 2 },
  internal.leaderboardOptimized.updateAllLeaderboards
);
*/

// Currently disabled to save bandwidth during development

export default crons;