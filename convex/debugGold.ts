import { query } from "./_generated/server";
import { v } from "convex/values";
import { GOLD_CAP } from "./lib/goldCalculations";

// Debug function to check actual gold values
export const checkGoldDebug = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const data = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!data) {
      return { error: "No data found for this wallet" };
    }

    // Calculate time differences
    const hoursSinceLastCheck = (now - data.lastCheckTime) / (1000 * 60 * 60);
    const hoursSinceCreated = (now - data.createdAt) / (1000 * 60 * 60);
    const hoursSinceLastActive = (now - data.lastActiveTime) / (1000 * 60 * 60);

    // Calculate what gold SHOULD be based on creation time
    const theoreticalGold = data.totalGoldPerHour * hoursSinceCreated;
    const currentTotal = Math.min(GOLD_CAP, theoreticalGold);

    return {
      walletAddress: args.walletAddress,
      storedGold: data.currentGold,
      goldPerHour: data.totalGoldPerHour,
      mekCount: data.ownedMeks.length,

      timeData: {
        createdAt: new Date(data.createdAt).toISOString(),
        lastCheckTime: new Date(data.lastCheckTime).toISOString(),
        lastActiveTime: new Date(data.lastActiveTime).toISOString(),
        hoursSinceCreated: hoursSinceCreated.toFixed(2),
        hoursSinceLastCheck: hoursSinceLastCheck.toFixed(2),
        hoursSinceLastActive: hoursSinceLastActive.toFixed(2),
      },

      calculations: {
        theoreticalGoldIfNoStops: theoreticalGold.toFixed(2),
        pendingAccumulation: "0.00", // No longer relevant - always calculated from creation
        currentTotalWithPending: currentTotal.toFixed(2),
        hitCap: currentTotal >= GOLD_CAP,
      },

      debug: {
        sessionStartTime: data.sessionStartTime ? new Date(data.sessionStartTime).toISOString() : "Not set",
        lastOfflineEarnings: data.offlineEarnings || 0,
      }
    };
  },
});