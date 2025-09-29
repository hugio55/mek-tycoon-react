import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSnapshotHistory = query({
  args: {
    walletAddress: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db.query("mekOwnershipHistory");

    if (args.walletAddress) {
      query = query.withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.walletAddress)
      );
    }

    const snapshots = await query
      .order("desc")
      .take(limit);

    return snapshots.map(snapshot => ({
      _id: snapshot._id,
      walletAddress: snapshot.walletAddress,
      snapshotTime: snapshot.snapshotTime,
      totalMekCount: snapshot.totalMekCount,
      totalGoldPerHour: snapshot.totalGoldPerHour,
      meks: snapshot.meks,
      _creationTime: snapshot._creationTime,
    }));
  },
});

export const getSnapshotLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const logs = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .take(limit);

    return logs;
  },
});

export const getWalletSnapshotTimeline = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();

    return snapshots.map(snapshot => ({
      timestamp: snapshot.snapshotTime,
      mekCount: snapshot.totalMekCount,
      goldPerHour: snapshot.totalGoldPerHour,
      meks: snapshot.meks.map(mek => ({
        assetId: mek.assetId,
        assetName: mek.assetName,
        goldPerHour: mek.goldPerHour,
        rarityRank: mek.rarityRank,
      })),
    }));
  },
});