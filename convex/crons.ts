import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// OPTIMIZATION: Reduce frequency to save bandwidth
// Update leaderboard cache every 30 minutes instead of 5
crons.interval(
  "update leaderboards",
  { minutes: 30 },
  internal.leaderboardOptimized.updateAllLeaderboards
);

// Update user stats cache every 60 minutes instead of 10
// Note: Individual user stats are also updated on-demand when users perform actions
crons.interval(
  "update user stats",
  { minutes: 60 },
  internal.leaderboardOptimized.updateAllLeaderboards
);

export default crons;