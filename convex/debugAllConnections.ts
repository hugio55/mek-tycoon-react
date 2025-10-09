import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all connections for a user (active and inactive)
export const getAllConnectionsForUser = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .collect();

    return connections.map((conn) => ({
      id: conn._id,
      walletAddress: conn.walletAddress,
      walletLength: conn.walletAddress.length,
      active: conn.active,
      linkedAt: conn.linkedAt,
      discordUsername: conn.discordUsername,
    }));
  },
});

// Search for connections with truncated addresses
export const findTruncatedAddresses = query({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();

    // Find addresses that don't start with expected prefixes
    const truncated = connections.filter((conn) => {
      const addr = conn.walletAddress;
      return !addr.startsWith('stake1') &&
             !addr.startsWith('addr1') &&
             !addr.startsWith('addr_test') &&
             !addr.startsWith('stake_test');
    });

    return truncated.map((conn) => ({
      id: conn._id,
      walletAddress: conn.walletAddress,
      walletLength: conn.walletAddress.length,
      firstChars: conn.walletAddress.substring(0, 10),
      active: conn.active,
      discordUserId: conn.discordUserId,
      discordUsername: conn.discordUsername,
    }));
  },
});
