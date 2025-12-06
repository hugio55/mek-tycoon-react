import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// PLAYER MANAGEMENT - Primary query for admin panel
// ============================================================================

/**
 * Get all users for Player Management admin panel
 * Returns data in format compatible with WalletManagementAdmin component
 */
export const getAllUsersForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allUsers = await ctx.db.query("users").collect();

    // Get all meks once for efficiency
    const allMeks = await ctx.db.query("meks").collect();

    // Create a map of wallet -> mek count
    const mekCountByWallet = new Map<string, number>();
    for (const mek of allMeks) {
      const owner = mek.owner;
      if (owner) {
        mekCountByWallet.set(owner, (mekCountByWallet.get(owner) || 0) + 1);
      }
    }

    return allUsers.map(user => {
      // Time since last login
      const lastActiveTime = user.lastLogin || user.createdAt || now;
      const minutesSinceActive = Math.floor((now - lastActiveTime) / (1000 * 60));
      const hoursSinceActive = Math.floor(minutesSinceActive / 60);
      const daysSinceActive = Math.floor(hoursSinceActive / 24);

      let lastActiveDisplay = "Just now";
      if (daysSinceActive > 0) {
        lastActiveDisplay = `${daysSinceActive}d ago`;
      } else if (hoursSinceActive > 0) {
        lastActiveDisplay = `${hoursSinceActive}h ago`;
      } else if (minutesSinceActive > 0) {
        lastActiveDisplay = `${minutesSinceActive}m ago`;
      }

      // Calculate total essence value
      const totalEssenceValue = user.totalEssence
        ? Object.values(user.totalEssence).reduce((sum, val) => sum + val, 0)
        : 0;

      return {
        _id: user._id,
        walletAddress: user.walletAddress,
        walletType: user.walletType || user.lastWalletType || "Unknown",
        companyName: user.displayName || null,
        mekCount: mekCountByWallet.get(user.walletAddress) || 0,
        totalGoldPerHour: user.goldPerHour || 0,
        currentGold: Math.floor((user.gold || 0) * 100) / 100,
        totalCumulativeGold: Math.floor((user.gold || 0) * 100) / 100, // In Phase II, gold IS the balance
        totalGoldSpentOnUpgrades: 0, // Not tracked in users table
        isVerified: user.walletVerified === true,
        lastVerificationTime: null, // Not tracked in users table
        lastActiveTime: lastActiveTime,
        lastActiveDisplay,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSnapshotTime: null, // Not applicable in Phase II
        // Additional Phase II fields
        level: user.level || 1,
        experience: user.experience || 0,
        totalEssenceValue,
        role: user.role || "user",
        isBanned: user.isBanned || false,
      };
    });
  },
});

/**
 * Delete a user completely from the users table
 */
export const deleteUserCompletely = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by wallet address
    const user = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        success: false,
        message: "User not found in users table"
      };
    }

    // Delete the user
    await ctx.db.delete(user._id);

    console.log(`[Admin] Deleted user ${args.walletAddress.substring(0, 20)}...`);

    return {
      success: true,
      message: `User ${args.walletAddress.substring(0, 20)}... deleted successfully`,
    };
  },
});

/**
 * Reset user's gold to zero
 */
export const resetUserGoldToZero = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    await ctx.db.patch(user._id, {
      gold: 0,
      pendingGold: 0,
      updatedAt: Date.now(),
    });

    console.log(`[Admin] Reset gold to zero for user ${args.walletAddress.substring(0, 20)}...`);

    return {
      success: true,
      message: `Gold reset to zero for ${args.walletAddress.substring(0, 20)}...`
    };
  },
});

/**
 * Update user's gold amount
 */
export const updateUserGoldAmount = mutation({
  args: {
    walletAddress: v.string(),
    newGoldAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    const oldGold = user.gold || 0;

    await ctx.db.patch(user._id, {
      gold: args.newGoldAmount,
      updatedAt: Date.now(),
    });

    console.log(`[Admin] Updated gold for user ${args.walletAddress.substring(0, 20)}... (${oldGold} → ${args.newGoldAmount})`);

    return {
      success: true,
      message: `Gold updated: ${oldGold} → ${args.newGoldAmount}`
    };
  },
});

/**
 * Reset user's Mek levels (deletes mekLevels records for this wallet)
 */
export const resetUserMekLevels = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all mekLevels for this wallet
    const mekLevels = await ctx.db
      .query("mekLevels")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    if (mekLevels.length === 0) {
      return {
        success: true,
        message: "No Mek levels found for this user",
        deletedCount: 0
      };
    }

    // Delete all mekLevels records
    for (const level of mekLevels) {
      await ctx.db.delete(level._id);
    }

    console.log(`[Admin] Reset ${mekLevels.length} Mek levels for user ${args.walletAddress.substring(0, 20)}...`);

    return {
      success: true,
      message: `Reset ${mekLevels.length} Mek levels`,
      deletedCount: mekLevels.length
    };
  },
});

// ============================================================================
// ORIGINAL FUNCTIONS (kept for compatibility)
// ============================================================================

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
          .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
          .collect();

        // Get active contracts
        const activeContracts = await ctx.db
          .query("contracts")
          .withIndex("", (q: any) => q.eq("userId", user._id))
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
      .withIndex("", (q: any) => q.eq("owner", user.walletAddress))
      .collect();

    const contracts = await ctx.db
      .query("contracts")
      .withIndex("", (q: any) => q.eq("userId", args.userId))
      .collect();

    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("", (q: any) => q.eq("userId", args.userId))
      .collect();

    const inventory = await ctx.db
      .query("inventory")
      .withIndex("", (q: any) => q.eq("userId", args.userId))
      .collect();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("", (q: any) => q.eq("userId", args.userId))
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