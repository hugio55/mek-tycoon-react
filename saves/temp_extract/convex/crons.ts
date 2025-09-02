import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update leaderboard cache every 5 minutes
crons.interval(
  "update leaderboards",
  { minutes: 5 },
  internal.leaderboardOptimized.updateAllLeaderboards
);

// Update user stats cache every 10 minutes
// Note: Individual user stats are also updated on-demand when users perform actions
crons.interval(
  "update user stats",
  { minutes: 10 },
  internal.leaderboardOptimized.updateAllLeaderboards
);

export default crons;