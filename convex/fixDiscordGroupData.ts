import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Fix missing wallet group data for a Discord connection
export const fixGroupData = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, { discordUserId, guildId }) => {
    // 1. Find the Discord connection
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", discordUserId))
      .filter((q) => q.eq(q.field("guildId"), guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return { success: false, message: "No active Discord connection found" };
    }

    const groupId = connection.groupId;
    const walletAddress = connection.walletAddress;

    if (!walletAddress) {
      return { success: false, message: "Discord connection has no wallet address" };
    }

    console.log('[FIX] Found connection:', {
      groupId,
      walletAddress,
    });

    // 2. Check if walletGroups exists
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", groupId))
      .first();

    if (!group) {
      console.log('[FIX] Creating walletGroups record');
      await ctx.db.insert("walletGroups", {
        groupId,
        primaryWallet: walletAddress,
        createdAt: Date.now(),
      });
    } else {
      console.log('[FIX] walletGroups already exists');
    }

    // 3. Check if walletGroupMemberships exists
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!membership) {
      console.log('[FIX] Creating walletGroupMemberships record');

      // Get company name from users table
      // Phase II: Query users table instead of goldMining
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
        .first();

      await ctx.db.insert("walletGroupMemberships", {
        groupId,
        walletAddress,
        addedAt: Date.now(),
        originalCompanyName: user?.corporationName || null,
      });
    } else if (membership.groupId !== groupId) {
      console.log('[FIX] Updating existing membership to correct group');
      await ctx.db.patch(membership._id, {
        groupId,
      });
    } else {
      console.log('[FIX] walletGroupMemberships already exists and is correct');
    }

    return {
      success: true,
      message: "Group data fixed successfully",
      groupId,
      walletAddress,
    };
  },
});
