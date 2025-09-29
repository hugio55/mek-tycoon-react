import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store checkpoint data in the database
export const storeCheckpoint = mutation({
  args: {
    walletAddress: v.string(),
    goldAmount: v.number(),
    merkleRoot: v.string(),
    blockHeight: v.number(),
    txHash: v.string(),
    timestamp: v.number(),
    mekCount: v.number(),
    totalGoldRate: v.number(),
  },
  handler: async (ctx, args) => {
    const checkpointId = await ctx.db.insert("goldCheckpoints", {
      walletAddress: args.walletAddress,
      goldAmount: args.goldAmount,
      merkleRoot: args.merkleRoot,
      blockHeight: args.blockHeight,
      txHash: args.txHash,
      timestamp: args.timestamp,
      mekCount: args.mekCount,
      totalGoldRate: args.totalGoldRate,
      verified: false,
      createdAt: Date.now(),
    });

    return checkpointId;
  },
});

// Get checkpoints for a wallet
export const getCheckpoints = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const checkpoints = await ctx.db
      .query("goldCheckpoints")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(limit);

    return checkpoints;
  },
});

// Get latest checkpoint for a wallet
export const getLatestCheckpoint = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const checkpoint = await ctx.db
      .query("goldCheckpoints")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .first();

    return checkpoint;
  },
});

// Calculate gold accumulation between checkpoints
export const calculateAccumulation = query({
  args: {
    walletAddress: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checkpoints = await ctx.db
      .query("goldCheckpoints")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .filter(q => {
        let conditions = q.eq(q.field("walletAddress"), args.walletAddress);

        if (args.startTime) {
          conditions = q.and(conditions, q.gte(q.field("timestamp"), args.startTime));
        }

        if (args.endTime) {
          conditions = q.and(conditions, q.lte(q.field("timestamp"), args.endTime));
        }

        return conditions;
      })
      .order("desc")
      .collect();

    if (checkpoints.length === 0) {
      return {
        totalAccumulated: 0,
        checkpointCount: 0,
        startTime: args.startTime || 0,
        endTime: args.endTime || Date.now(),
      };
    }

    // Calculate total accumulation
    const totalAccumulated = checkpoints.reduce((sum, cp) => sum + cp.goldAmount, 0);
    const averageRate = checkpoints.reduce((sum, cp) => sum + cp.totalGoldRate, 0) / checkpoints.length;

    return {
      totalAccumulated,
      checkpointCount: checkpoints.length,
      averageRate,
      startTime: checkpoints[checkpoints.length - 1].timestamp,
      endTime: checkpoints[0].timestamp,
      latestCheckpoint: checkpoints[0],
    };
  },
});

// Update checkpoint verification status
export const updateVerificationStatus = mutation({
  args: {
    checkpointId: v.id("goldCheckpoints"),
    verified: v.boolean(),
    verificationTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkpointId, {
      verified: args.verified,
      verificationTxHash: args.verificationTxHash,
      verifiedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get verification statistics
export const getVerificationStats = query({
  args: {
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("goldCheckpoints");

    if (args.walletAddress) {
      query = query.withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress));
    }

    const checkpoints = await query.collect();

    const verified = checkpoints.filter(cp => cp.verified).length;
    const pending = checkpoints.filter(cp => !cp.verified).length;
    const totalGold = checkpoints.reduce((sum, cp) => sum + cp.goldAmount, 0);

    return {
      total: checkpoints.length,
      verified,
      pending,
      totalGold,
      verificationRate: checkpoints.length > 0 ? (verified / checkpoints.length) * 100 : 0,
    };
  },
});