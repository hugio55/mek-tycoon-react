import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all users with pagination
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get users
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(limit);

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count meks
        const meks = await ctx.db
          .query("meks")
          .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
          .collect();

        // Get active contracts
        const activeContracts = await ctx.db
          .query("contracts")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // Calculate total essence value
        const totalEssenceValue = Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0);

        return {
          ...user,
          mekCount: meks.length,
          activeContractCount: activeContracts.length,
          totalEssenceValue,
        };
      })
    );

    return usersWithStats;
  },
});

// Search users by wallet address or username
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    // Search by wallet address
    const byWallet = await ctx.db
      .query("users")
      .withIndex("by_wallet")
      .filter((q) =>
        q.or(
          q.eq(q.field("walletAddress"), args.searchTerm),
          q.eq(q.field("walletAddress"), searchLower)
        )
      )
      .collect();

    // Search by username (if exists)
    const byUsername = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.neq(q.field("username"), undefined),
          q.or(
            q.eq(q.field("username"), args.searchTerm),
            q.eq(q.field("username"), searchLower)
          )
        )
      )
      .collect();

    // Search by display name
    const byDisplayName = await ctx.db
      .query("users")
      .withIndex("by_display_name_lower")
      .filter((q) => q.eq(q.field("displayNameLower"), searchLower))
      .collect();

    // Combine and deduplicate results
    const allResults = [...byWallet, ...byUsername, ...byDisplayName];
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item._id, item])).values()
    );

    return uniqueResults;
  },
});

// Get single user details
export const getUserDetails = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get all related data
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
      .collect();

    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    return {
      user,
      meks,
      contracts,
      activeBuffs,
      inventory,
      recentTransactions: transactions,
    };
  },
});

// Update user field
export const updateUserField = mutation({
  args: {
    userId: v.id("users"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Special handling for nested objects
    if (args.field === "totalEssence") {
      await ctx.db.patch(args.userId, {
        totalEssence: args.value as Doc<"users">["totalEssence"],
      });
    } else {
      // Generic field update
      await ctx.db.patch(args.userId, {
        [args.field]: args.value,
      });
    }

    return await ctx.db.get(args.userId);
  },
});

// Update essence for a specific type
export const updateEssence = mutation({
  args: {
    userId: v.id("users"),
    essenceType: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updatedEssence = {
      ...user.totalEssence,
      [args.essenceType]: args.amount,
    };

    await ctx.db.patch(args.userId, {
      totalEssence: updatedEssence,
    });

    return await ctx.db.get(args.userId);
  },
});

// Update gold
export const updateGold = mutation({
  args: {
    userId: v.id("users"),
    gold: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      gold: args.gold,
    });

    // Note: goldTransactions table removed in Phase II cleanup

    return await ctx.db.get(args.userId);
  },
});

// Grant or revoke admin role
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return await ctx.db.get(args.userId);
  },
});

// Ban or unban user
export const toggleBan = mutation({
  args: {
    userId: v.id("users"),
    banned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      isBanned: args.banned,
    });

    return await ctx.db.get(args.userId);
  },
});

// Reset user progress (dangerous!)
export const resetUserProgress = mutation({
  args: {
    userId: v.id("users"),
    resetEssence: v.boolean(),
    resetGold: v.boolean(),
    resetLevel: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Partial<Doc<"users">> = {};

    if (args.resetEssence) {
      updates.totalEssence = {
        stone: 10,
        disco: 5,
        paul: 0,
        cartoon: 5,
        candy: 5,
        tiles: 5,
        moss: 5,
        bullish: 0,
        journalist: 0,
        laser: 0,
        flashbulb: 0,
        accordion: 0,
        turret: 0,
        drill: 0,
        security: 0,
      };
    }

    if (args.resetGold) {
      updates.gold = 100;
      updates.goldPerHour = 50;
      updates.pendingGold = 0;
    }

    if (args.resetLevel) {
      updates.level = 1;
      updates.experience = 0;
    }

    await ctx.db.patch(args.userId, updates);

    return await ctx.db.get(args.userId);
  },
});