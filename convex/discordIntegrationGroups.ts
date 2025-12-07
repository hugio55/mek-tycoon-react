import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Link a Discord user to a corporation (wallet group)
// Accepts ANY wallet address from the group
export const linkDiscordToCorporation = mutation({
  args: {
    walletAddress: v.string(), // Any wallet in the group
    discordUserId: v.string(),
    discordUsername: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[LINK CORP] Linking Discord user to corporation via wallet:', args.walletAddress);

    // Find the wallet group for this wallet
    let membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    // If wallet doesn't have a group yet, create one
    if (!membership) {
      console.log('[LINK CORP] Wallet has no group, creating new group');
      const groupId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // PRESERVE ORIGINAL NAME: Get the wallet's current company name before creating group
      // Phase II: Query users table instead of goldMining
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      const originalCompanyName = user?.corporationName || null;

      await ctx.db.insert("walletGroups", {
        groupId,
        primaryWallet: args.walletAddress,
        createdAt: now,
      });

      await ctx.db.insert("walletGroupMemberships", {
        groupId,
        walletAddress: args.walletAddress,
        addedAt: now,
        originalCompanyName, // Store for restoration when wallet is removed
      });

      membership = { groupId, walletAddress: args.walletAddress };
    }

    const groupId = membership.groupId;

    // Check if this Discord user is already linked to ANY group
    const existingConnection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (existingConnection) {
      // Update existing connection to new group
      await ctx.db.patch(existingConnection._id, {
        groupId,
        discordUsername: args.discordUsername,
        linkedAt: Date.now(),
      });

      return {
        success: true,
        message: "Updated Discord link to new corporation",
      };
    }

    // Create new Discord connection
    await ctx.db.insert("discordConnections", {
      groupId,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      guildId: args.guildId,
      linkedAt: Date.now(),
      active: true,
    });

    return {
      success: true,
      message: "Linked Discord to corporation",
    };
  },
});

// Unlink Discord user from their corporation
export const unlinkDiscordFromCorporation = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (!connection) {
      return { success: false, message: "No corporation linked" };
    }

    await ctx.db.patch(connection._id, {
      active: false,
    });

    return { success: true };
  },
});

// Get Discord connection by any wallet address in the group
export const getDiscordConnectionByWallet = query({
  args: {
    walletAddress: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the group this wallet belongs to
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      return null;
    }

    // Find Discord connection for this group
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("groupId", membership.groupId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return null;
    }

    // Get all wallets in this group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", membership.groupId))
      .collect();

    return {
      ...connection,
      wallets: wallets.map((w: any) => w.walletAddress),
    };
  },
});

// Get Discord connection by Discord user ID
export const getDiscordConnectionByDiscordUser = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return null;
    }

    // Get all wallets in this group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", connection.groupId))
      .collect();

    // Get group info
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", connection.groupId))
      .first();

    return {
      ...connection,
      wallets: wallets.map((w: any) => ({
        walletAddress: w.walletAddress,
        nickname: w.nickname,
        addedAt: w.addedAt,
      })),
      primaryWallet: group?.primaryWallet,
    };
  },
});

// Get aggregated gold and emoji for a Discord user across all their wallets
export const getUserGoldAndEmoji = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return {
        gold: 0,
        goldPerHour: 0,
        emoji: "",
        tierName: "None",
        highestEarner: null,
        walletCount: 0,
      };
    }

    // Get all wallets in this group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", connection.groupId))
      .collect();

    let totalGold = 0;
    let totalGoldPerHour = 0;
    let allMeks: Array<{assetName: string, goldPerHour: number, rarityRank: number}> = [];

    for (const wallet of wallets) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", wallet.walletAddress))
        .first();

      if (goldMining) {
        totalGold += goldMining.accumulatedGold || 0;
        totalGoldPerHour += goldMining.totalGoldPerHour || 0;

        if (goldMining.ownedMeks && goldMining.ownedMeks.length > 0) {
          allMeks.push(...goldMining.ownedMeks);
        }
      }
    }

    let highestEarner = null;
    if (allMeks.length > 0) {
      const topMek = allMeks.reduce((prev, current) =>
        (prev.goldPerHour > current.goldPerHour) ? prev : current
      );

      highestEarner = {
        assetName: topMek.assetName,
        goldPerHour: topMek.goldPerHour,
        rarityRank: topMek.rarityRank
      };
    }

    const tiers = await ctx.db
      .query("discordGoldTiers")
      .withIndex("", (q: any) => q.eq("active", true))
      .collect();

    const sortedTiers = tiers.sort((a, b) => b.order - a.order);

    for (const tier of sortedTiers) {
      if (totalGold >= tier.minGold) {
        if (tier.maxGold === undefined || totalGold < tier.maxGold) {
          return {
            gold: totalGold,
            goldPerHour: totalGoldPerHour,
            emoji: tier.emoji,
            tierName: tier.tierName,
            highestEarner,
            walletCount: wallets.length,
          };
        }
      }
    }

    return {
      gold: totalGold,
      goldPerHour: totalGoldPerHour,
      emoji: "",
      tierName: "None",
      highestEarner,
      walletCount: wallets.length,
    };
  },
});

// Update nickname timestamp for Discord nickname syncing
export const updateNicknameTimestamp = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        lastNicknameUpdate: Date.now(),
        currentEmoji: args.emoji,
      });
    }

    return { success: true };
  },
});
