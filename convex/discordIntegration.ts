import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const convertPaymentToStakeAddress = action({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args): Promise<{stakeAddress: string | null, isPaymentAddress: boolean}> => {
    try {
      if (args.address.startsWith('stake1') || /^[0-9a-fA-F]{56,60}$/.test(args.address)) {
        return { stakeAddress: args.address, isPaymentAddress: false };
      }

      if (args.address.startsWith('addr1')) {
        const apiKey = process.env.BLOCKFROST_API_KEY;

        if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
          console.error('[Discord] Blockfrost API key not configured');
          return { stakeAddress: null, isPaymentAddress: true };
        }

        const response = await fetch(
          `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${args.address}`,
          {
            headers: {
              'project_id': apiKey
            }
          }
        );

        if (!response.ok) {
          console.error('[Discord] Blockfrost error:', response.status);
          return { stakeAddress: null, isPaymentAddress: true };
        }

        const data = await response.json();
        return { stakeAddress: data.stake_address || null, isPaymentAddress: true };
      }

      return { stakeAddress: null, isPaymentAddress: false };
    } catch (error) {
      console.error('[Discord] Error converting address:', error);
      return { stakeAddress: null, isPaymentAddress: false };
    }
  },
});

export const linkDiscordToWallet = mutation({
  args: {
    walletAddress: v.string(),
    discordUserId: v.string(),
    discordUsername: v.string(),
    guildId: v.string(),
    walletNickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[MUTATION] linkDiscordToWallet called with:', {
      walletAddress: args.walletAddress,
      walletLength: args.walletAddress.length,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      guildId: args.guildId,
      walletNickname: args.walletNickname,
    });

    // Validate wallet address format
    const isValidFormat =
      args.walletAddress.startsWith('stake1') ||
      args.walletAddress.startsWith('addr1') ||
      args.walletAddress.startsWith('addr_test') ||
      args.walletAddress.startsWith('stake_test') ||
      /^[0-9a-fA-F]{56,60}$/.test(args.walletAddress);

    if (!isValidFormat) {
      console.error('[MUTATION] Invalid wallet address format:', args.walletAddress);
      throw new Error(`Invalid Cardano wallet address format. Address must start with 'stake1', 'addr1', or be a valid hex stake address. Received: ${args.walletAddress.substring(0, 20)}...`);
    }

    const now = Date.now();

    // Check if this wallet already exists for this user
    const existingConnection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    // Check how many active wallets this user has
    const userActiveWallets = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Determine if this should be the primary wallet
    const shouldBePrimary = userActiveWallets.length === 0;

    // Check if wallet is already linked to a different user
    if (existingConnection && existingConnection.discordUserId !== args.discordUserId) {
      throw new Error('This wallet is already linked to a different Discord user.');
    }

    // Check if this user already has this wallet linked
    if (existingConnection && existingConnection.discordUserId === args.discordUserId) {
      // Reactivate and update the existing connection
      await ctx.db.patch(existingConnection._id, {
        discordUsername: args.discordUsername,
        active: true,
        linkedAt: now,
        walletNickname: args.walletNickname,
      });
      console.log('[MUTATION] Reactivated existing connection:', existingConnection.walletAddress);
      return { success: true, connectionId: existingConnection._id, isNewWallet: false };
    }

    // Create new connection
    const connectionId = await ctx.db.insert("discordConnections", {
      walletAddress: args.walletAddress,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      guildId: args.guildId,
      linkedAt: now,
      active: true,
      isPrimary: shouldBePrimary,
      walletNickname: args.walletNickname,
    });

    console.log('[MUTATION] Created new connection:', {
      walletAddress: args.walletAddress,
      isPrimary: shouldBePrimary,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        discordLinkedAt: now,
      });
    }

    return { success: true, connectionId, isNewWallet: true, isPrimary: shouldBePrimary };
  },
});

export const unlinkDiscordFromWallet = mutation({
  args: {
    walletAddress: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    const wasPrimary = connection.isPrimary;
    const discordUserId = connection.discordUserId;

    // Deactivate the connection
    await ctx.db.patch(connection._id, {
      active: false,
    });

    // If this was the primary wallet, promote another wallet to primary
    if (wasPrimary) {
      const remainingWallets = await ctx.db
        .query("discordConnections")
        .withIndex("", (q: any) => q.eq("discordUserId", discordUserId))
        .filter((q) => q.eq(q.field("guildId"), args.guildId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      if (remainingWallets.length > 0) {
        // Promote the most recently linked wallet
        const sorted = remainingWallets.sort((a, b) => b.linkedAt - a.linkedAt);
        await ctx.db.patch(sorted[0]._id, {
          isPrimary: true,
        });
        console.log('[MUTATION] Promoted wallet to primary:', sorted[0].walletAddress);
      }
    }

    return { success: true };
  },
});

export const deactivateConnectionById = mutation({
  args: {
    connectionId: v.id("discordConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      active: false,
    });

    return { success: true };
  },
});

export const getDiscordConnectionByWallet = query({
  args: {
    walletAddress: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    return connection;
  },
});

export const getDiscordConnectionByDiscordUser = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    if (connections.length === 0) {
      return null;
    }

    // Return the most recently linked connection
    const sorted = connections.sort((a, b) => b.linkedAt - a.linkedAt);
    return sorted[0];
  },
});

export const getAllActiveDiscordConnections = query({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("guildId", args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return connections;
  },
});

export const getGoldTiers = query({
  args: {},
  handler: async (ctx) => {
    const tiers = await ctx.db
      .query("discordGoldTiers")
      .withIndex("", (q: any) => q.eq("active", true))
      .order("desc")
      .collect();

    return tiers.sort((a, b) => b.order - a.order);
  },
});

export const createGoldTier = mutation({
  args: {
    tierName: v.string(),
    minGold: v.number(),
    maxGold: v.optional(v.number()),
    emoji: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const tierId = await ctx.db.insert("discordGoldTiers", {
      tierName: args.tierName,
      minGold: args.minGold,
      maxGold: args.maxGold,
      emoji: args.emoji,
      order: args.order,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, tierId };
  },
});

export const updateGoldTier = mutation({
  args: {
    tierId: v.id("discordGoldTiers"),
    tierName: v.optional(v.string()),
    minGold: v.optional(v.number()),
    maxGold: v.optional(v.number()),
    emoji: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tierId, ...updates } = args;

    await ctx.db.patch(tierId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const initializeDefaultGoldTiers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTiers = await ctx.db.query("discordGoldTiers").collect();

    if (existingTiers.length > 0) {
      return { success: false, message: "Gold tiers already exist" };
    }

    const now = Date.now();
    const defaultTiers = [
      { tierName: "Bronze", minGold: 0, maxGold: 10000, emoji: "🥉", order: 1 },
      { tierName: "Silver", minGold: 10000, maxGold: 50000, emoji: "🥈", order: 2 },
      { tierName: "Gold", minGold: 50000, maxGold: 100000, emoji: "🥇", order: 3 },
      { tierName: "Platinum", minGold: 100000, maxGold: 250000, emoji: "💎", order: 4 },
      { tierName: "Diamond", minGold: 250000, maxGold: 500000, emoji: "💠", order: 5 },
      { tierName: "Master", minGold: 500000, maxGold: 1000000, emoji: "👑", order: 6 },
      { tierName: "Grandmaster", minGold: 1000000, maxGold: undefined, emoji: "⚡", order: 7 },
    ];

    for (const tier of defaultTiers) {
      await ctx.db.insert("discordGoldTiers", {
        ...tier,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, tiersCreated: defaultTiers.length };
  },
});

export const getEmojiForGoldAmount = query({
  args: {
    goldAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const tiers = await ctx.db
      .query("discordGoldTiers")
      .withIndex("", (q: any) => q.eq("active", true))
      .collect();

    const sortedTiers = tiers.sort((a, b) => b.order - a.order);

    for (const tier of sortedTiers) {
      if (args.goldAmount >= tier.minGold) {
        if (tier.maxGold === undefined || args.goldAmount < tier.maxGold) {
          return { emoji: tier.emoji, tierName: tier.tierName };
        }
      }
    }

    return { emoji: "", tierName: "None" };
  },
});

export const getUserGoldAndEmoji = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const wallets = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    if (wallets.length === 0) {
      return {
        gold: 0,
        goldPerHour: 0,
        emoji: "",
        tierName: "None",
        highestEarner: null,
        walletCount: 0,
      };
    }

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

export const getUserWallets = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const wallets = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return wallets.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.linkedAt - a.linkedAt;
    });
  },
});

export const setPrimaryWallet = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const allWallets = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const targetWallet = allWallets.find(w => w.walletAddress === args.walletAddress);

    if (!targetWallet) {
      throw new Error('Wallet not found or not linked to this user');
    }

    for (const wallet of allWallets) {
      await ctx.db.patch(wallet._id, {
        isPrimary: wallet.walletAddress === args.walletAddress,
      });
    }

    return { success: true };
  },
});

export const setWalletNickname = mutation({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
    walletAddress: v.string(),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (!connection) {
      throw new Error('Wallet connection not found');
    }

    if (connection.discordUserId !== args.discordUserId) {
      throw new Error('This wallet is not linked to your Discord account');
    }

    await ctx.db.patch(connection._id, {
      walletNickname: args.nickname,
    });

    return { success: true };
  },
});