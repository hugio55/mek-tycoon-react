import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Temporary fix: Update wallet address to proper bech32 format
export const fixWalletAddressFormat = mutation({
  args: {
    oldAddress: v.string(), // The hex address currently stored
    newAddress: v.string(), // The proper bech32 address (stake1...)
  },
  handler: async (ctx, args) => {
    // Find the wallet record
    const record = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.oldAddress))
      .first();

    if (!record) {
      return {
        success: false,
        message: `No wallet found with address ${args.oldAddress.substring(0, 20)}...`,
      };
    }

    // Update to proper bech32 address
    await ctx.db.patch(record._id, {
      walletAddress: args.newAddress,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Updated wallet from hex to bech32 format`,
      oldAddress: args.oldAddress,
      newAddress: args.newAddress,
    };
  },
});

// Manual override to set correct Mek ownership
export const manualSetMekOwnership = mutation({
  args: {
    walletAddress: v.string(),
    mekCount: v.number(),
    totalGoldPerHour: v.number(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!record) {
      return {
        success: false,
        message: "Wallet not found",
      };
    }

    await ctx.db.patch(record._id, {
      totalGoldPerHour: args.totalGoldPerHour,
      isBlockchainVerified: true,
      lastVerificationTime: Date.now(),
      updatedAt: Date.now(),
    });

    // Also create a proper snapshot record
    await ctx.db.insert("mekOwnershipHistory", {
      walletAddress: args.walletAddress,
      snapshotTime: Date.now(),
      meks: [], // Empty for now, but marks the ownership
      totalGoldPerHour: args.totalGoldPerHour,
      totalMekCount: args.mekCount,
    });

    return {
      success: true,
      message: `Manually set wallet to ${args.mekCount} MEKs at ${args.totalGoldPerHour} gold/hr`,
    };
  },
});