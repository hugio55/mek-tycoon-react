import { query } from "./_generated/server";
import { v } from "convex/values";

// Check all discord connections for a user (regardless of active status or guild)
export const checkAllConnections = query({
  args: {
    discordUserId: v.string(),
  },
  handler: async (ctx, { discordUserId }) => {
    const allConnections = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .collect();

    console.log('[DIAGNOSTIC] Found', allConnections.length, 'connection(s) for user', discordUserId);

    return allConnections.map(conn => ({
      groupId: conn.groupId,
      guildId: conn.guildId,
      active: conn.active,
      discordUsername: conn.discordUsername,
      linkedAt: conn.linkedAt,
    }));
  },
});
