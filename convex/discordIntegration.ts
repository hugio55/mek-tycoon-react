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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existingConnection = await ctx.db
      .query("discordConnections")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (existingConnection) {
      await ctx.db.patch(existingConnection._id, {
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        active: true,
        linkedAt: now,
      });
      return { success: true, connectionId: existingConnection._id };
    }

    const connectionId = await ctx.db.insert("discordConnections", {
      walletAddress: args.walletAddress,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      guildId: args.guildId,
      linkedAt: now,
      active: true,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        discordLinkedAt: now,
      });
    }

    return { success: true, connectionId };
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        active: false,
      });
    }

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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
    const connection = await ctx.db
      .query("discordConnections")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", args.discordUserId))
      .filter((q) => q.eq(q.field("guildId"), args.guildId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    return connection;
  },
});

export const getAllActiveDiscordConnections = query({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("discordConnections")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
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
      .withIndex("by_active", (q) => q.eq("active", true))
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
      .withIndex("by_active", (q) => q.eq("active", true))
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
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        gold: 0,
        goldPerHour: 0,
        emoji: "",
        tierName: "None",
        highestEarner: null
      };
    }

    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    const totalGold = goldMining?.accumulatedGold || user.gold || 0;
    const goldPerHour = goldMining?.totalGoldPerHour || 0;

    let highestEarner = null;
    if (goldMining && goldMining.ownedMeks && goldMining.ownedMeks.length > 0) {
      const topMek = goldMining.ownedMeks.reduce((prev, current) =>
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
            goldPerHour,
            emoji: tier.emoji,
            tierName: tier.tierName,
            walletAddress: args.walletAddress,
            highestEarner
          };
        }
      }
    }

    return {
      gold: totalGold,
      goldPerHour,
      emoji: "",
      tierName: "None",
      walletAddress: args.walletAddress,
      highestEarner
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