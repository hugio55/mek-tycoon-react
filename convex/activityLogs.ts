import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log an activity
export const logActivity = mutation({
  args: {
    walletAddress: v.string(),
    actionType: v.string(),
    description: v.string(),
    goldBefore: v.optional(v.number()),
    goldAfter: v.optional(v.number()),
    goldSpent: v.optional(v.number()),
    goldPerHourBefore: v.optional(v.number()),
    goldPerHourAfter: v.optional(v.number()),
    mekAssetId: v.optional(v.string()),
    mekAssetName: v.optional(v.string()),
    upgradeType: v.optional(v.string()),
    upgradeName: v.optional(v.string()),
    levelBefore: v.optional(v.number()),
    levelAfter: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLogs", {
      walletAddress: args.walletAddress,
      actionType: args.actionType,
      description: args.description,
      timestamp: Date.now(),
      goldBefore: args.goldBefore,
      goldAfter: args.goldAfter,
      goldSpent: args.goldSpent,
      goldPerHourBefore: args.goldPerHourBefore,
      goldPerHourAfter: args.goldPerHourAfter,
      mekAssetId: args.mekAssetId,
      mekAssetName: args.mekAssetName,
      upgradeType: args.upgradeType,
      upgradeName: args.upgradeName,
      levelBefore: args.levelBefore,
      levelAfter: args.levelAfter,
      metadata: args.metadata,
    });
  },
});

// Get activity logs for a wallet
export const getActivityLogs = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("", (q: any) =>
        q.eq("walletAddress", args.walletAddress)
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Get recent activity across all wallets (admin only)
export const getAllRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Get activity by type
export const getActivityByType = query({
  args: {
    actionType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("", (q: any) =>
        q.eq("actionType", args.actionType)
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});
