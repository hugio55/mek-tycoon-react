import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check what's actually stored
export const debugGetConnection = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (!connection) {
      return { found: false };
    }

    return {
      found: true,
      walletAddress: connection.walletAddress,
      walletLength: connection.walletAddress.length,
      discordUserId: connection.discordUserId,
      discordUsername: connection.discordUsername,
      active: connection.active,
      linkedAt: connection.linkedAt,
    };
  },
});

// Mutation to fix truncated wallet address
export const fixTruncatedWallet = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    correctWalletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    await ctx.db.patch(connection._id, {
      walletAddress: args.correctWalletAddress,
    });

    // Also update the users table if it exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", connection.walletAddress))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        walletAddress: args.correctWalletAddress,
      });
    }

    return {
      success: true,
      oldAddress: connection.walletAddress,
      newAddress: args.correctWalletAddress,
      userTableUpdated: !!user,
    };
  },
});
