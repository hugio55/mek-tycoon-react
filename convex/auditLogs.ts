import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log verification event
export const logVerification = mutation({
  args: {
    stakeAddress: v.string(),
    verified: v.boolean(),
    source: v.string(),
    walletCount: v.number(),
    blockchainCount: v.number(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      type: "verification",
      stakeAddress: args.stakeAddress,
      verified: args.verified,
      source: args.source,
      walletCount: args.walletCount,
      blockchainCount: args.blockchainCount,
      timestamp: args.timestamp,
      createdAt: Date.now()
    });
  }
});

// Log wallet connection with signature
export const logWalletConnection = mutation({
  args: {
    stakeAddress: v.string(),
    walletName: v.string(),
    signatureVerified: v.boolean(),
    nonce: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      type: "walletConnection",
      stakeAddress: args.stakeAddress,
      walletName: args.walletName,
      signatureVerified: args.signatureVerified,
      nonce: args.nonce,
      timestamp: args.timestamp,
      createdAt: Date.now()
    });
  }
});

// Get recent audit logs
export const getRecentLogs = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  }
});


// Log rate changes
export const logRateChange = mutation({
  args: {
    mekNumber: v.number(),
    oldRate: v.number(),
    newRate: v.number(),
    changedBy: v.string(),
    reason: v.optional(v.string()),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      type: "rateChange",
      mekNumber: args.mekNumber,
      oldRate: args.oldRate,
      newRate: args.newRate,
      changedBy: args.changedBy,
      reason: args.reason,
      timestamp: args.timestamp,
      createdAt: Date.now()
    });
  }
});

// Log gold checkpoint
export const logGoldCheckpoint = mutation({
  args: {
    stakeAddress: v.string(),
    goldAmount: v.number(),
    merkleRoot: v.string(),
    blockHeight: v.number(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      type: "goldCheckpoint",
      stakeAddress: args.stakeAddress,
      goldAmount: args.goldAmount,
      merkleRoot: args.merkleRoot,
      blockHeight: args.blockHeight,
      timestamp: args.timestamp,
      createdAt: Date.now()
    });
  }
});

// Multi-wallet linking removed - one wallet per account


// Get audit logs by type
export const getLogsByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("type"), args.type))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  }
});

// Get all logs for a wallet
export const getWalletLogs = query({
  args: {
    stakeAddress: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("stakeAddress"), args.stakeAddress))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  }
});

// Get recent rate changes
export const getRecentRateChanges = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("type"), "rateChange"))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.take(50);
  }
});

// Get last verification for a wallet
export const getLastVerification = query({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .filter(q => q.eq(q.field("type"), "verification"))
      .order("desc")
      .first();
  }
});