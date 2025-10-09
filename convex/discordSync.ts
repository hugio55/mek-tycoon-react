import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";

export const getAllUsersWithDiscordEmojis = query({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const usersWithEmojis = [];

    for (const connection of connections) {
      // Get all wallets in this group
      const wallets = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", connection.groupId))
        .collect();

      // Aggregate gold across all wallets
      let totalGold = 0;
      for (const wallet of wallets) {
        const goldMining = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet.walletAddress))
          .first();

        totalGold += goldMining?.accumulatedGold || 0;
      }

      const tiers = await ctx.db
        .query("discordGoldTiers")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();

      const sortedTiers = tiers.sort((a, b) => b.order - a.order);

      let emoji = "";
      let tierName = "None";

      for (const tier of sortedTiers) {
        if (totalGold >= tier.minGold) {
          if (tier.maxGold === undefined || totalGold < tier.maxGold) {
            emoji = tier.emoji;
            tierName = tier.tierName;
            break;
          }
        }
      }

      usersWithEmojis.push({
        discordUserId: connection.discordUserId,
        discordUsername: connection.discordUsername,
        groupId: connection.groupId,
        gold: totalGold,
        emoji,
        tierName,
        currentEmoji: connection.currentEmoji || "",
        needsUpdate: emoji !== (connection.currentEmoji || ""),
      });
    }

    return usersWithEmojis;
  },
});

export const syncDiscordNicknames = action({
  args: {
    guildId: v.string(),
    botToken: v.string(),
  },
  handler: async (ctx, args) => {
    const usersToUpdate = await ctx.runQuery(api.discordSync.getAllUsersWithDiscordEmojis, {
      guildId: args.guildId,
    });

    const updates = [];
    const errors = [];

    for (const user of usersToUpdate) {
      if (!user.needsUpdate) {
        continue;
      }

      try {
        const memberUrl = `https://discord.com/api/v10/guilds/${args.guildId}/members/${user.discordUserId}`;

        const getMemberResponse = await fetch(memberUrl, {
          headers: {
            Authorization: `Bot ${args.botToken}`,
          },
        });

        if (!getMemberResponse.ok) {
          errors.push({
            userId: user.discordUserId,
            error: `Failed to fetch member: ${getMemberResponse.statusText}`,
          });
          continue;
        }

        const memberData = await getMemberResponse.json();
        const currentNickname = memberData.nick || memberData.user.username;

        const nicknameWithoutEmoji = currentNickname.replace(/[🥉🥈🥇💎💠👑⚡]/g, "").trim();

        const newNickname = user.emoji
          ? `${nicknameWithoutEmoji} ${user.emoji}`
          : nicknameWithoutEmoji;

        if (newNickname === currentNickname) {
          continue;
        }

        const updateUrl = `https://discord.com/api/v10/guilds/${args.guildId}/members/${user.discordUserId}`;

        const updateResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${args.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nick: newNickname.substring(0, 32),
          }),
        });

        if (updateResponse.ok) {
          await ctx.runMutation(api.discordIntegrationGroups.updateNicknameTimestamp, {
            discordUserId: user.discordUserId,
            guildId: args.guildId,
            emoji: user.emoji,
          });

          updates.push({
            userId: user.discordUserId,
            oldNickname: currentNickname,
            newNickname,
            gold: user.gold,
            tier: user.tierName,
          });
        } else {
          errors.push({
            userId: user.discordUserId,
            error: `Failed to update: ${updateResponse.statusText}`,
          });
        }
      } catch (error: any) {
        errors.push({
          userId: user.discordUserId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      totalUsers: usersToUpdate.length,
      updatesAttempted: updates.length + errors.length,
      successfulUpdates: updates.length,
      failedUpdates: errors.length,
      updates,
      errors,
    };
  },
});