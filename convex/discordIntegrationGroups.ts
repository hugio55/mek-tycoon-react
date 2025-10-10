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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // If wallet doesn't have a group yet, create one
    if (!membership) {
      console.log('[LINK CORP] Wallet has no group, creating new group');
      const groupId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // PRESERVE ORIGINAL NAME: Get the wallet's current company name before creating group
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      const originalCompanyName = goldMining?.companyName || undefined;

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
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
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
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      return null;
    }

    // Find Discord connection for this group
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return null;
    }

    // Get all wallets in this group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
      .collect();

    return {
      ...connection,
      wallets: wallets.map(w => w.walletAddress),
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
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return null;
    }

    // Get all wallets in this group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", connection.groupId))
      .collect();

    // Get group info
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("by_groupId", (q) => q.eq("groupId", connection.groupId))
      .first();

    return {
      ...connection,
      wallets: wallets.map(w => ({
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
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
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
      .withIndex("by_group", (q) => q.eq("groupId", connection.groupId))
      .collect();

    let totalGold = 0;
    let totalGoldPerHour = 0;
    let allMeks: Array<{assetName: string, goldPerHour: number, rarityRank: number}> = [];

    for (const wallet of wallets) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet.walletAddress))
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
      .withIndex("by_active", (q) => q.eq("active", true))
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
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
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

// DEBUG: Fix a Discord connection to point to the correct group
export const fixDiscordConnectionGroup = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    correctGroupId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the Discord connection
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!connection) {
      return { success: false, error: "No active connection found" };
    }

    // Verify the target group exists
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.correctGroupId))
      .first();

    if (!group) {
      return { success: false, error: "Target group does not exist" };
    }

    // Update the connection to point to the correct group
    await ctx.db.patch(connection._id, {
      groupId: args.correctGroupId,
    });

    return {
      success: true,
      message: `Updated Discord connection to group ${args.correctGroupId}`,
      oldGroupId: connection.groupId,
      newGroupId: args.correctGroupId,
    };
  },
});

// DEBUG: Check what Discord connections exist for a Discord user
export const debugDiscordConnections = query({
  args: {
    discordUserId: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get ALL Discord connections (filtered by user or guild if provided)
    let connections = await ctx.db.query("discordConnections").collect();

    if (args.discordUserId) {
      connections = connections.filter(c => c.discordUserId === args.discordUserId);
    }

    if (args.guildId) {
      connections = connections.filter(c => c.guildId === args.guildId);
    }

    // For each connection, get the group info
    const connectionDetails = [];
    for (const conn of connections) {
      const group = await ctx.db
        .query("walletGroups")
        .withIndex("by_groupId", (q) => q.eq("groupId", conn.groupId))
        .first();

      const memberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", conn.groupId))
        .collect();

      connectionDetails.push({
        discordUserId: conn.discordUserId,
        discordUsername: conn.discordUsername,
        groupId: conn.groupId,
        guildId: conn.guildId,
        active: conn.active,
        linkedAt: conn.linkedAt,
        groupExists: !!group,
        primaryWallet: group?.primaryWallet,
        walletsInGroup: memberships.map(m => m.walletAddress),
      });
    }

    return {
      totalConnections: connections.length,
      connections: connectionDetails,
    };
  },
});

// DEBUG: Diagnostic query for troubleshooting wallet/gold issues
export const debugWalletGoldStatus = query({
  args: {
    walletAddress: v.string(),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if wallet is in wallet group
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    let groupInfo = null;
    let allWalletsInGroup: any[] = [];
    if (membership) {
      const group = await ctx.db
        .query("walletGroups")
        .withIndex("by_groupId", (q) => q.eq("groupId", membership.groupId))
        .first();

      const memberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
        .collect();

      allWalletsInGroup = memberships.map(m => m.walletAddress);

      groupInfo = {
        groupId: membership.groupId,
        primaryWallet: group?.primaryWallet,
        walletCount: memberships.length,
        allWallets: allWalletsInGroup,
      };
    }

    // 2. Check goldMining data for this wallet
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // 3. Check goldMining for all wallets in group
    const groupGoldData = [];
    for (const wallet of allWalletsInGroup) {
      const walletGold = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
        .first();

      groupGoldData.push({
        wallet,
        exists: !!walletGold,
        gold: walletGold?.accumulatedGold || 0,
        goldPerHour: walletGold?.totalGoldPerHour || 0,
        mekCount: walletGold?.ownedMeks?.length || 0,
        isVerified: walletGold?.isBlockchainVerified || false,
      });
    }

    // 4. Check Discord connection (if guildId provided)
    let discordConnection = null;
    if (args.guildId) {
      // Try to find by wallet
      if (membership) {
        discordConnection = await ctx.db
          .query("discordConnections")
          .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
          .filter((q) => q.eq(q.field("guildId"), args.guildId))
          .first();
      }
    }

    // 5. Calculate total gold from group
    const totalGold = groupGoldData.reduce((sum, w) => sum + w.gold, 0);
    const totalGoldPerHour = groupGoldData.reduce((sum, w) => sum + w.goldPerHour, 0);

    return {
      walletAddress: args.walletAddress,
      inGroup: !!membership,
      groupInfo,
      goldMiningExists: !!goldMining,
      goldMiningData: goldMining ? {
        gold: goldMining.accumulatedGold || 0,
        goldPerHour: goldMining.totalGoldPerHour || 0,
        mekCount: goldMining.ownedMeks?.length || 0,
        isVerified: goldMining.isBlockchainVerified || false,
        companyName: goldMining.companyName || null,
      } : null,
      groupGoldData,
      discordConnection: discordConnection ? {
        discordUserId: discordConnection.discordUserId,
        discordUsername: discordConnection.discordUsername,
        linkedAt: discordConnection.linkedAt,
      } : null,
      summary: {
        totalWalletsInGroup: allWalletsInGroup.length,
        totalGold,
        totalGoldPerHour,
        walletsWithGoldData: groupGoldData.filter(w => w.exists).length,
      },
    };
  },
});
