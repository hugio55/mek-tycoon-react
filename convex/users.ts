import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user on wallet connection
export const createOrUpdate = mutation({
  args: { 
    walletAddress: v.string(),
    walletName: v.optional(v.string()),
    lastConnected: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (existingUser) {
      // Update connection info
      await ctx.db.patch(existingUser._id, {
        lastLogin: Date.now(),
        isOnline: true,
        walletName: args.walletName || existingUser.walletName,
      });
      return existingUser;
    }
    
    // Create new user with starting resources
    const newUserId = await ctx.db.insert("users", {
      walletAddress: args.walletAddress,
      walletName: args.walletName,
      username: undefined,
      avatar: undefined,
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
      goldPerHour: 50,  // Starting gold rate
      lastGoldCollection: Date.now(),
      pendingGold: 0,
      craftingSlots: 1, // Start with 1 slot
      // Base slot values
      baseContractSlots: 2,        // Can run 2 contracts at once to start
      baseChipSlots: 3,            // 3 chips per Mek
      inventoryTabsUnlocked: 1,    // Start with 1 tab (20 slots)
      level: 1,
      experience: 0,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      isOnline: true,
      role: "user",
    });
    
    const newUser = await ctx.db.get(newUserId);
    return newUser;
  },
});

// [DEPRECATED - Use walletAuth.connectWallet instead]
// Get or create user by wallet address
export const getOrCreateUser = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (existingUser) {
      // Update last login
      await ctx.db.patch(existingUser._id, {
        lastLogin: Date.now(),
        isOnline: true,
      });
      return existingUser;
    }
    
    // Create new user with starting resources
    const newUserId = await ctx.db.insert("users", {
      walletAddress: args.walletAddress,
      username: undefined,
      avatar: undefined,
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
      goldPerHour: 50,  // Starting gold rate
      lastGoldCollection: Date.now(),
      pendingGold: 0,
      craftingSlots: 1, // Start with 1 slot
      // Base slot values
      baseContractSlots: 2,        // Can run 2 contracts at once to start
      baseChipSlots: 3,            // 3 chips per Mek
      inventoryTabsUnlocked: 1,    // Start with 1 tab (20 slots)
      level: 1,
      experience: 0,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      isOnline: true,
      role: "user",
    });
    
    const newUser = await ctx.db.get(newUserId);
    return newUser;
  },
});

// Get current user (for leaderboard page)
export const getCurrentUser = query({
  args: { walletAddress: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.walletAddress) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress!))
      .first();
    
    return user;
  },
});

// Get user profile with stats
export const getUserProfile = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
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
    const activeSessions = await ctx.db
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
        activeCrafting: activeSessions.length,
        achievementsUnlocked: achievements.length,
      },
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    
    if (args.username !== undefined) {
      // Check if username is taken
      const existing = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("username"), args.username))
        .first();
      
      if (existing && existing._id !== args.userId) {
        throw new Error("Username already taken");
      }
      
      updates.username = args.username;
    }
    
    if (args.avatar !== undefined) {
      updates.avatar = args.avatar;
    }
    
    await ctx.db.patch(args.userId, updates);
    return await ctx.db.get(args.userId);
  },
});

// Update user gold (for admin/testing)
export const updateUserGold = mutation({
  args: {
    walletAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(user._id, {
      gold: args.amount,
    });
    
    return { success: true, newGold: args.amount };
  },
});

// Add essence to user
export const addEssence = mutation({
  args: {
    userId: v.id("users"),
    essenceType: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedEssence = { ...user.totalEssence };
    const essenceKey = args.essenceType as keyof typeof updatedEssence;
    
    if (!(essenceKey in updatedEssence)) {
      throw new Error("Invalid essence type");
    }
    
    updatedEssence[essenceKey] += args.amount;
    
    await ctx.db.patch(args.userId, {
      totalEssence: updatedEssence,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      type: "reward",
      userId: args.userId,
      amount: args.amount,
      itemType: "essence",
      itemVariation: args.essenceType,
      details: `Received ${args.amount} ${args.essenceType} essence`,
      timestamp: Date.now(),
    });
    
    return updatedEssence;
  },
});

// Purchase crafting slot
export const purchaseCraftingSlot = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Calculate cost (increases with each slot)
    const slotCost = 100 * Math.pow(2, user.craftingSlots);
    
    if (user.gold < slotCost) {
      throw new Error(`Not enough gold. Need ${slotCost} gold`);
    }
    
    // Maximum 5 slots
    if (user.craftingSlots >= 5) {
      throw new Error("Maximum crafting slots reached");
    }
    
    await ctx.db.patch(args.userId, {
      gold: user.gold - slotCost,
      craftingSlots: user.craftingSlots + 1,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      type: "purchase",
      userId: args.userId,
      amount: slotCost,
      details: `Purchased crafting slot #${user.craftingSlots + 1}`,
      timestamp: Date.now(),
    });
    
    return user.craftingSlots + 1;
  },
});

// Get user's transaction history
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return transactions;
  },
});