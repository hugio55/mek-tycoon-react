import { query } from "./_generated/server";
import { v } from "convex/values";

// Diagnostic query to check all Discord-related data
export const checkDiscordData = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, { discordUserId, guildId }) => {
    console.log('[DIAGNOSTIC] Checking Discord data for user:', discordUserId);

    // 1. Check discordConnections
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .filter((q) => q.eq(q.field("guildId"), guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return {
        step: "discordConnections",
        found: false,
        message: "No active discordConnections record found",
      };
    }

    console.log('[DIAGNOSTIC] discordConnections found:', {
      groupId: connection.groupId,
      discordUsername: connection.discordUsername,
    });

    // 2. Check walletGroupMemberships
    const memberships = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", connection.groupId))
      .collect();

    if (memberships.length === 0) {
      return {
        step: "walletGroupMemberships",
        found: false,
        message: `discordConnections exists with groupId ${connection.groupId}, but no walletGroupMemberships found for that group`,
        connectionData: connection,
      };
    }

    console.log('[DIAGNOSTIC] walletGroupMemberships found:', memberships.length);

    // 3. Check walletGroups
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("by_groupId", (q) => q.eq("groupId", connection.groupId))
      .first();

    if (!group) {
      return {
        step: "walletGroups",
        found: false,
        message: `discordConnections and walletGroupMemberships exist, but no walletGroups record found for groupId ${connection.groupId}`,
        connectionData: connection,
        memberships: memberships.map(m => m.walletAddress),
      };
    }

    console.log('[DIAGNOSTIC] walletGroups found:', {
      primaryWallet: group.primaryWallet,
    });

    // 4. Check goldMining for each wallet
    const goldMiningData = [];
    for (const membership of memberships) {
      const gm = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", membership.walletAddress))
        .first();

      goldMiningData.push({
        wallet: membership.walletAddress,
        hasGoldMining: !!gm,
        companyName: gm?.companyName,
        mekCount: gm?.ownedMeks?.length || 0,
        goldPerHour: gm?.totalGoldPerHour,
      });
    }

    return {
      step: "complete",
      found: true,
      message: "All data structures exist",
      connection: {
        groupId: connection.groupId,
        discordUsername: connection.discordUsername,
      },
      group: {
        primaryWallet: group.primaryWallet,
      },
      memberships: memberships.map(m => ({
        wallet: m.walletAddress,
        addedAt: m.addedAt,
      })),
      goldMiningData,
    };
  },
});
