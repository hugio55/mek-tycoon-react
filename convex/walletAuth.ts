import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Connect or create user with Cardano wallet
export const connectWallet = mutation({
  args: {
    walletAddress: v.string(),
    walletType: v.optional(v.string()), // "nami", "eternl", "flint", etc.
    stakeAddress: v.optional(v.string()),
    signature: v.optional(v.string()), // For future wallet verification
    message: v.optional(v.string()), // Message that was signed
  },
  handler: async (ctx, args) => {
    // Validate wallet address format (basic check)
    if (!args.walletAddress.startsWith("addr")) {
      throw new Error("Invalid Cardano wallet address format");
    }

    // Check if user exists by payment address
    let existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // If not found by payment address and stake address provided,
    // check if user exists by stake address (supports unified wallet system)
    if (!existingUser && args.stakeAddress) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q) => q.eq("walletStakeAddress", args.stakeAddress))
        .first();

      // If found by stake address, update their payment address to link the accounts
      if (existingUser) {
        await ctx.db.patch(existingUser._id, {
          walletAddress: args.walletAddress, // Link payment address
          lastLogin: Date.now(),
          walletType: args.walletType || existingUser.walletType,
          isOnline: true,
        });

        return {
          user: { ...existingUser, walletAddress: args.walletAddress },
          isNewUser: false,
          linkedByStakeAddress: true, // Flag that this was linked via stake address
        };
      }
    }

    if (existingUser) {
      // Update last login and wallet info
      await ctx.db.patch(existingUser._id, {
        lastLogin: Date.now(),
        walletType: args.walletType || existingUser.walletType,
        walletStakeAddress: args.stakeAddress || existingUser.walletStakeAddress,
        isOnline: true,
      });

      return {
        user: existingUser,
        isNewUser: false,
      };
    }
    
    // Create new user
    const newUserId = await ctx.db.insert("users", {
      walletAddress: args.walletAddress,
      walletType: args.walletType,
      walletStakeAddress: args.stakeAddress,
      walletVerified: false, // Will be true when we implement signature verification
      username: undefined,
      avatar: undefined,
      bio: undefined,
      totalEssence: {
        stone: 10,      // Starting essence
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
      },
      gold: 100,        // Starting gold
      craftingSlots: 1, // Start with 1 slot
      level: 1,
      experience: 0,
      totalBattles: 0,
      totalWins: 0,
      winRate: 0,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      isOnline: true,
      isBanned: false,
      role: "user",
    });
    
    const newUser = await ctx.db.get(newUserId);
    
    // Log transaction for new user bonus
    await ctx.db.insert("transactions", {
      type: "reward",
      userId: newUserId,
      amount: 100,
      details: "Welcome bonus - New user registration",
      timestamp: Date.now(),
    });
    
    return {
      user: newUser,
      isNewUser: true,
    };
  },
});

// Disconnect wallet (logout)
export const disconnectWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: false,
        lastLogin: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Get user by wallet address (supports both payment and stake addresses)
export const getUserByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Try payment address first
    let user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // If not found and it looks like a stake address, try stake address lookup
    if (!user && args.walletAddress.startsWith("stake1")) {
      user = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q) => q.eq("walletStakeAddress", args.walletAddress))
        .first();
    }

    if (!user) {
      return null;
    }
    
    // Get user's Meks
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.walletAddress))
      .collect();
    
    // Get user's inventory
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Get active crafting sessions
    const activeCrafting = await ctx.db
      .query("craftingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "crafting"))
      .collect();
    
    // Get achievements
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    return {
      ...user,
      stats: {
        totalMeks: meks.length,
        inventoryItems: inventory.length,
        activeCrafting: activeCrafting.length,
        achievementsUnlocked: achievements.length,
      },
    };
  },
});

// Get user by stake address (for unified wallet system)
export const getUserByStakeAddress = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) => q.eq("walletStakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      return null;
    }

    return user;
  },
});

// Get user ID by any wallet address (payment or stake)
export const getUserIdByAnyAddress = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Try payment address first
    let user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    // If not found, try stake address
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q) => q.eq("walletStakeAddress", args.walletAddress))
        .first();
    }

    return user ? user._id : null;
  },
});

// Verify wallet ownership (for future implementation with message signing)
export const verifyWalletOwnership = mutation({
  args: {
    walletAddress: v.string(),
    signature: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement actual signature verification
    // This would involve checking the signature against the message
    // using Cardano cryptographic libraries
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // For now, just mark as verified
    // In production, you'd verify the signature first
    await ctx.db.patch(user._id, {
      walletVerified: true,
      updatedAt: Date.now(),
    });
    
    return { verified: true };
  },
});

// Get online users
export const getOnlineUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const onlineUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isOnline"), true))
      .order("desc")
      .take(limit);
    
    return onlineUsers.map(user => ({
      _id: user._id,
      walletAddress: user.walletAddress.slice(0, 10) + "..." + user.walletAddress.slice(-6),
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      role: user.role,
    }));
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: {
    sortBy: v.optional(v.union(
      v.literal("gold"),
      v.literal("level"),
      v.literal("wins"),
      v.literal("winRate")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const sortBy = args.sortBy || "level";
    
    let users = await ctx.db
      .query("users")
      .order("desc")
      .take(limit);
    
    // Sort by the requested field
    users = users.sort((a, b) => {
      switch (sortBy) {
        case "gold":
          return (b.gold || 0) - (a.gold || 0);
        case "level":
          return (b.level || 0) - (a.level || 0);
        case "wins":
          return (b.totalWins || 0) - (a.totalWins || 0);
        case "winRate":
          return (b.winRate || 0) - (a.winRate || 0);
        default:
          return 0;
      }
    });
    
    return users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      walletAddress: user.walletAddress.slice(0, 10) + "..." + user.walletAddress.slice(-6),
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      gold: user.gold,
      totalWins: user.totalWins,
      winRate: user.winRate,
      isOnline: user.isOnline,
    }));
  },
});