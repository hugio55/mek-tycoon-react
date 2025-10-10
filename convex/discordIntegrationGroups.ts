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
    console.log('[LINK CORP] ========================================');
    console.log('[LINK CORP] Starting link process');
    console.log('[LINK CORP] Wallet:', args.walletAddress);
    console.log('[LINK CORP] Discord User:', args.discordUsername);

    let walletAddress = args.walletAddress;
    let paymentAddressesToCheck: string[] = [walletAddress];

    // If this is a stake address, convert it to payment addresses
    if (walletAddress.startsWith('stake1')) {
      console.log('[LINK CORP] Detected stake address, converting to payment addresses...');

      const conversion = await ctx.runAction(api.discordIntegration.convertStakeToPaymentAddresses, {
        stakeAddress: walletAddress,
      });

      if (conversion.error || conversion.paymentAddresses.length === 0) {
        console.log('[LINK CORP] ERROR: Could not convert stake address:', conversion.error);
        return {
          success: false,
          message: `❌ Could not find payment addresses for this stake address. Error: ${conversion.error || 'No addresses found'}`,
        };
      }

      console.log('[LINK CORP] Stake address has', conversion.paymentAddresses.length, 'payment addresses');
      paymentAddressesToCheck = conversion.paymentAddresses;
    }

    // Try to find the wallet group for any of the payment addresses
    let membership = null;
    let foundWalletAddress = null;

    for (const addr of paymentAddressesToCheck) {
      const result = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
        .first();

      if (result) {
        membership = result;
        foundWalletAddress = addr;
        console.log('[LINK CORP] Found membership for payment address:', addr);
        break;
      }
    }

    console.log('[LINK CORP] Membership lookup result:', membership ? `FOUND (groupId: ${membership.groupId})` : 'NOT FOUND');

    // If wallet doesn't have a group yet, check if it exists at all
    if (!membership) {
      console.log('[LINK CORP] Wallet has no group membership');

      // Check if any of the payment addresses exist in goldMining database
      let goldMining = null;
      for (const addr of paymentAddressesToCheck) {
        const result = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
          .first();

        if (result) {
          goldMining = result;
          foundWalletAddress = addr;
          console.log('[LINK CORP] Found goldMining for payment address:', addr);
          break;
        }
      }

      console.log('[LINK CORP] GoldMining lookup:', goldMining ? 'FOUND' : 'NOT FOUND');

      if (!goldMining) {
        console.log('[LINK CORP] ERROR: Wallet not in database');
        return {
          success: false,
          message: "❌ Wallet not found in database. Please verify your wallet on the Mek Tycoon website first at https://mektycoon.com",
        };
      }

      // Wallet exists but is not in a group
      // This should not happen for multi-wallet corporations
      console.log('[LINK CORP] ERROR: Wallet exists but not in any group');
      console.log('[LINK CORP] This wallet may need to be added to a corporation on the website');

      return {
        success: false,
        message: "⚠️ Your wallet is not part of a corporation group. If you have multiple wallets, please link them on the website first.",
      };
    }

    const groupId = membership.groupId;
    console.log('[LINK CORP] Using groupId:', groupId);

    // Check if this Discord user is already linked to ANY group
    const existingConnection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    console.log('[LINK CORP] Existing connection:', existingConnection ? `FOUND (currently linked to group ${existingConnection.groupId})` : 'NOT FOUND');

    if (existingConnection) {
      console.log('[LINK CORP] Updating existing connection');
      console.log('[LINK CORP] Old groupId:', existingConnection.groupId);
      console.log('[LINK CORP] New groupId:', groupId);

      // Update existing connection to this group
      await ctx.db.patch(existingConnection._id, {
        groupId,
        discordUsername: args.discordUsername,
        linkedAt: Date.now(),
      });

      console.log('[LINK CORP] ✅ Successfully updated Discord connection');
      console.log('[LINK CORP] ========================================');

      return {
        success: true,
        message: `✅ Updated Discord link to corporation (group: ${groupId})`,
      };
    }

    // Create new Discord connection
    console.log('[LINK CORP] Creating new Discord connection');
    await ctx.db.insert("discordConnections", {
      groupId,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      guildId: args.guildId,
      linkedAt: Date.now(),
      active: true,
    });

    console.log('[LINK CORP] ✅ Successfully created Discord connection');
    console.log('[LINK CORP] ========================================');

    return {
      success: true,
      message: `✅ Linked Discord to corporation (group: ${groupId})`,
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
