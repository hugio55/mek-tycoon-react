import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const getAllUsersWithDiscordEmojis = query({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("guildId", args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const usersWithEmojis = [];

    for (const connection of connections) {
      // In the new model: 1 wallet = 1 corp
      // Get gold directly from the wallet
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", connection.walletAddress))
        .first();

      const totalGold = goldMining?.accumulatedGold || 0;

      const tiers = await ctx.db
        .query("discordGoldTiers")
        .withIndex("", (q: any) => q.eq("active", true))
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
        walletAddress: connection.walletAddress,
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
          await ctx.runMutation(api.discordSync.updateNicknameTimestamp, {
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

// ============================================================
// Functions moved from deleted discordIntegrationGroups.ts
// ============================================================

// Link a Discord user to a corporation (1 wallet = 1 corp model)
export const linkDiscordToCorporation = mutation({
  args: {
    walletAddress: v.string(),
    discordUserId: v.string(),
    discordUsername: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this Discord user already has a connection in this guild
    const existingConnection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q: any) =>
        q.eq("discordUserId", args.discordUserId).eq("guildId", args.guildId)
      )
      .first();

    if (existingConnection) {
      // Update existing connection
      await ctx.db.patch(existingConnection._id, {
        walletAddress: args.walletAddress,
        discordUsername: args.discordUsername,
        active: true,
        linkedAt: Date.now(),
      });
    } else {
      // Create new connection
      await ctx.db.insert("discordConnections", {
        walletAddress: args.walletAddress,
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        guildId: args.guildId,
        linkedAt: Date.now(),
        active: true,
      });
    }

    return { success: true };
  },
});

// Unlink a Discord user from their corporation
export const unlinkDiscordFromCorporation = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q: any) =>
        q.eq("discordUserId", args.discordUserId).eq("guildId", args.guildId)
      )
      .first();

    if (!connection) {
      return { success: false, reason: "No connection found" };
    }

    // Deactivate the connection
    await ctx.db.patch(connection._id, {
      active: false,
    });

    return { success: true };
  },
});

// Get gold data and emoji tier for a Discord user
export const getUserGoldAndEmoji = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q: any) =>
        q.eq("discordUserId", args.discordUserId).eq("guildId", args.guildId)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection || !connection.walletAddress) {
      return {
        walletCount: 0,
        totalGold: 0,
        goldPerHour: 0,
        mekCount: 0,
        emoji: "",
        tierName: "None",
        highestEarner: null,
      };
    }

    // Get gold mining data for this wallet (1 wallet = 1 corp)
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", connection.walletAddress))
      .first();

    const totalGold = goldMining?.accumulatedGold || 0;
    const goldPerHour = goldMining?.totalGoldPerHour || 0;
    const mekCount = goldMining?.ownedMeks?.length || 0;

    // Get tier info
    const tiers = await ctx.db
      .query("discordGoldTiers")
      .filter((q: any) => q.eq(q.field("active"), true))
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

    // Find highest earner
    let highestEarner = null;
    if (goldMining?.ownedMeks && goldMining.ownedMeks.length > 0) {
      const sorted = [...goldMining.ownedMeks].sort(
        (a: any, b: any) => (b.effectiveGoldPerHour || b.goldPerHour || 0) - (a.effectiveGoldPerHour || a.goldPerHour || 0)
      );
      const top = sorted[0];
      highestEarner = {
        assetName: top.assetName,
        goldPerHour: top.effectiveGoldPerHour || top.goldPerHour || 0,
        rarityRank: top.rarityRank,
      };
    }

    return {
      walletCount: 1, // 1 wallet = 1 corp
      totalGold,
      goldPerHour,
      mekCount,
      emoji,
      tierName,
      highestEarner,
    };
  },
});

// Get Discord connection by Discord user ID (for /corp command)
export const getDiscordConnectionByDiscordUser = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q: any) =>
        q.eq("discordUserId", args.discordUserId).eq("guildId", args.guildId)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection || !connection.walletAddress) {
      return null;
    }

    // In 1 wallet = 1 corp model, return single wallet as array for compatibility
    return {
      primaryWallet: connection.walletAddress,
      wallets: [{ walletAddress: connection.walletAddress }],
    };
  },
});

// Update nickname timestamp in discordConnections table
export const updateNicknameTimestamp = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q: any) =>
        q.eq("discordUserId", args.discordUserId).eq("guildId", args.guildId)
      )
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        lastNicknameUpdate: Date.now(),
        currentEmoji: args.emoji || undefined,
      });
    }
  },
});