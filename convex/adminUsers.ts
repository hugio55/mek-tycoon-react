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

    return allUsers.map((user: any) => {
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
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
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
          .withIndex("by_owner", (q: any) => q.eq("owner", user.walletAddress))
          .collect();

        // Get active contracts
        const activeContracts = await ctx.db
          .query("contracts")
          .withIndex("by_user", (q: any) => q.eq("userId", user._id))
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
      new Map(allResults.map((item: any) => [item._id, item])).values()
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
      .withIndex("by_owner", (q: any) => q.eq("owner", user.walletAddress))
      .collect();

    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    const activeBuffs = await ctx.db
      .query("activeBuffs")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
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

// ============================================================================
// TEST WALLET CLEANUP SYSTEM
// ============================================================================

/**
 * Check if a wallet address is a test wallet
 * Real Cardano wallets start with addr1 (payment) or stake1 (stake address)
 * Any other pattern is a test/fake wallet
 */
function isTestWallet(walletAddress: string): boolean {
  if (!walletAddress) return false;
  const lower = walletAddress.toLowerCase();
  // Real Cardano addresses start with addr1 or stake1
  const isRealCardanoAddress = lower.startsWith("addr1") || lower.startsWith("stake1");
  // If it's not a real Cardano address, it's a test wallet
  return !isRealCardanoAddress;
}

/**
 * Preview all test wallets and count related data across all tables
 * Returns a detailed breakdown of what would be deleted
 */
export const previewTestWallets = query({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter to test wallets only
    const testWallets = allUsers.filter(u => isTestWallet(u.walletAddress));

    if (testWallets.length === 0) {
      return {
        testWalletCount: 0,
        wallets: [],
        totalRelatedRecords: 0,
        message: "No test wallets found"
      };
    }

    // Build detailed preview for each test wallet
    const walletPreviews = await Promise.all(testWallets.map(async (user) => {
      const walletAddress = user.walletAddress;
      const userId = user._id;

      // Count records in tables with userId
      const craftingSessions = await ctx.db.query("craftingSessions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const inventory = await ctx.db.query("inventory")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const transactions = await ctx.db.query("transactions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const achievements = await ctx.db.query("achievements")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const activeBuffs = await ctx.db.query("activeBuffs")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const userStatsCache = await ctx.db.query("userStatsCache")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const contracts = await ctx.db.query("contracts")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const chipInstances = await ctx.db.query("chipInstances")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      const marketListings = await ctx.db.query("marketListings")
        .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
      const mekTalentTrees = await ctx.db.query("mekTalentTrees")
        .withIndex("by_owner", (q: any) => q.eq("ownerId", userId)).collect();

      // Count records in tables with walletAddress
      const meks = await ctx.db.query("meks")
        .withIndex("by_owner", (q: any) => q.eq("owner", walletAddress)).collect();
      const goldMining = await ctx.db.query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      const mekLevels = await ctx.db.query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      const leaderboardCache = await ctx.db.query("leaderboardCache")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();

      const totalRecords =
        craftingSessions.length + inventory.length + transactions.length +
        achievements.length + activeBuffs.length + userStatsCache.length +
        contracts.length + chipInstances.length + marketListings.length +
        mekTalentTrees.length + meks.length + goldMining.length +
        mekLevels.length + leaderboardCache.length + 1; // +1 for user record

      return {
        walletAddress,
        displayName: user.displayName || "No name",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        relatedRecords: {
          craftingSessions: craftingSessions.length,
          inventory: inventory.length,
          transactions: transactions.length,
          achievements: achievements.length,
          activeBuffs: activeBuffs.length,
          userStatsCache: userStatsCache.length,
          contracts: contracts.length,
          chipInstances: chipInstances.length,
          marketListings: marketListings.length,
          mekTalentTrees: mekTalentTrees.length,
          meks: meks.length,
          goldMining: goldMining.length,
          mekLevels: mekLevels.length,
          leaderboardCache: leaderboardCache.length,
        },
        totalRecords,
      };
    }));

    const totalRelatedRecords = walletPreviews.reduce((sum, w) => sum + w.totalRecords, 0);

    return {
      testWalletCount: testWallets.length,
      wallets: walletPreviews,
      totalRelatedRecords,
      message: `Found ${testWallets.length} test wallet(s) with ${totalRelatedRecords} total records to delete`
    };
  },
});

/**
 * Cascade delete a single user and ALL related data from ALL tables
 * This is the comprehensive delete that cleans up everything
 */
export const cascadeDeleteUser = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const walletAddress = args.walletAddress;

    // Find the user first
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!user) {
      return {
        success: false,
        message: "User not found",
        deletedCounts: {}
      };
    }

    const userId = user._id;
    const deletedCounts: Record<string, number> = {};

    // === DELETE FROM TABLES WITH userId ===

    // craftingSessions
    const craftingSessions = await ctx.db.query("craftingSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of craftingSessions) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.craftingSessions = craftingSessions.length;

    // inventory
    const inventory = await ctx.db.query("inventory")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of inventory) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.inventory = inventory.length;

    // transactions
    const transactions = await ctx.db.query("transactions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of transactions) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.transactions = transactions.length;

    // achievements
    const achievements = await ctx.db.query("achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of achievements) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.achievements = achievements.length;

    // activeBuffs
    const activeBuffs = await ctx.db.query("activeBuffs")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of activeBuffs) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.activeBuffs = activeBuffs.length;

    // userStatsCache
    const userStatsCache = await ctx.db.query("userStatsCache")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of userStatsCache) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.userStatsCache = userStatsCache.length;

    // contracts
    const contracts = await ctx.db.query("contracts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of contracts) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.contracts = contracts.length;

    // chipInstances
    const chipInstances = await ctx.db.query("chipInstances")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of chipInstances) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.chipInstances = chipInstances.length;

    // marketListings (as seller)
    const marketListings = await ctx.db.query("marketListings")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
    for (const record of marketListings) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.marketListings = marketListings.length;

    // mekTalentTrees
    const mekTalentTrees = await ctx.db.query("mekTalentTrees")
      .withIndex("by_owner", (q: any) => q.eq("ownerId", userId)).collect();
    for (const record of mekTalentTrees) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.mekTalentTrees = mekTalentTrees.length;

    // === DELETE FROM TABLES WITH walletAddress ===

    // meks (IMPORTANT: This removes Mek ownership - they'll become unowned)
    const meks = await ctx.db.query("meks")
      .withIndex("by_owner", (q: any) => q.eq("owner", walletAddress)).collect();
    for (const record of meks) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.meks = meks.length;

    // goldMining
    const goldMining = await ctx.db.query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of goldMining) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldMining = goldMining.length;

    // mekLevels
    const mekLevels = await ctx.db.query("mekLevels")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of mekLevels) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.mekLevels = mekLevels.length;

    // leaderboardCache
    const leaderboardCache = await ctx.db.query("leaderboardCache")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of leaderboardCache) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.leaderboardCache = leaderboardCache.length;

    // discordConnections
    const discordConnections = await ctx.db.query("discordConnections")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of discordConnections) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.discordConnections = discordConnections.length;

    // mekOwnershipHistory
    const mekOwnershipHistory = await ctx.db.query("mekOwnershipHistory")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of mekOwnershipHistory) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.mekOwnershipHistory = mekOwnershipHistory.length;

    // goldCheckpoints
    const goldCheckpoints = await ctx.db.query("goldCheckpoints")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of goldCheckpoints) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldCheckpoints = goldCheckpoints.length;

    // goldSnapshots
    const goldSnapshots = await ctx.db.query("goldSnapshots")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of goldSnapshots) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldSnapshots = goldSnapshots.length;

    // syncChecksums
    const syncChecksums = await ctx.db.query("syncChecksums")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of syncChecksums) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.syncChecksums = syncChecksums.length;

    // sagaExecutions
    const sagaExecutions = await ctx.db.query("sagaExecutions")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of sagaExecutions) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.sagaExecutions = sagaExecutions.length;

    // securityAnomalies
    const securityAnomalies = await ctx.db.query("securityAnomalies")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of securityAnomalies) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.securityAnomalies = securityAnomalies.length;

    // suspiciousWallets
    const suspiciousWallets = await ctx.db.query("suspiciousWallets")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of suspiciousWallets) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.suspiciousWallets = suspiciousWallets.length;

    // rateLimitViolations
    const rateLimitViolations = await ctx.db.query("rateLimitViolations")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of rateLimitViolations) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.rateLimitViolations = rateLimitViolations.length;

    // walletGroupMemberships
    const walletGroupMemberships = await ctx.db.query("walletGroupMemberships")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of walletGroupMemberships) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.walletGroupMemberships = walletGroupMemberships.length;

    // === FINALLY DELETE THE USER ===
    await ctx.db.delete(userId);
    deletedCounts.users = 1;

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);

    console.log(`[Admin] Cascade deleted user ${walletAddress.substring(0, 20)}... (${totalDeleted} total records)`);

    return {
      success: true,
      message: `Deleted user and ${totalDeleted} related records`,
      deletedCounts,
    };
  },
});

/**
 * Bulk delete all test wallets with cascade delete
 * WARNING: This is destructive and cannot be undone!
 */
export const bulkDeleteTestWallets = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter to test wallets only
    const testWallets = allUsers.filter(u => isTestWallet(u.walletAddress));

    if (testWallets.length === 0) {
      return {
        success: true,
        message: "No test wallets found to delete",
        deletedCount: 0,
        details: []
      };
    }

    const details: Array<{ wallet: string; totalDeleted: number }> = [];
    let totalDeletedRecords = 0;

    for (const user of testWallets) {
      const walletAddress = user.walletAddress;
      const userId = user._id;
      let recordsDeleted = 0;

      // Delete from all tables (same as cascadeDeleteUser but inline for efficiency)

      // Tables with userId
      const craftingSessions = await ctx.db.query("craftingSessions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of craftingSessions) { await ctx.db.delete(r._id); recordsDeleted++; }

      const inventory = await ctx.db.query("inventory")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of inventory) { await ctx.db.delete(r._id); recordsDeleted++; }

      const transactions = await ctx.db.query("transactions")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of transactions) { await ctx.db.delete(r._id); recordsDeleted++; }

      const achievements = await ctx.db.query("achievements")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of achievements) { await ctx.db.delete(r._id); recordsDeleted++; }

      const activeBuffs = await ctx.db.query("activeBuffs")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of activeBuffs) { await ctx.db.delete(r._id); recordsDeleted++; }

      const userStatsCache = await ctx.db.query("userStatsCache")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of userStatsCache) { await ctx.db.delete(r._id); recordsDeleted++; }

      const contracts = await ctx.db.query("contracts")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of contracts) { await ctx.db.delete(r._id); recordsDeleted++; }

      const chipInstances = await ctx.db.query("chipInstances")
        .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
      for (const r of chipInstances) { await ctx.db.delete(r._id); recordsDeleted++; }

      const marketListings = await ctx.db.query("marketListings")
        .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
      for (const r of marketListings) { await ctx.db.delete(r._id); recordsDeleted++; }

      const mekTalentTrees = await ctx.db.query("mekTalentTrees")
        .withIndex("by_owner", (q: any) => q.eq("ownerId", userId)).collect();
      for (const r of mekTalentTrees) { await ctx.db.delete(r._id); recordsDeleted++; }

      // Tables with walletAddress
      const meks = await ctx.db.query("meks")
        .withIndex("by_owner", (q: any) => q.eq("owner", walletAddress)).collect();
      for (const r of meks) { await ctx.db.delete(r._id); recordsDeleted++; }

      const goldMining = await ctx.db.query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of goldMining) { await ctx.db.delete(r._id); recordsDeleted++; }

      const mekLevels = await ctx.db.query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of mekLevels) { await ctx.db.delete(r._id); recordsDeleted++; }

      const leaderboardCache = await ctx.db.query("leaderboardCache")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
      for (const r of leaderboardCache) { await ctx.db.delete(r._id); recordsDeleted++; }

      const discordConnections = await ctx.db.query("discordConnections")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
      for (const r of discordConnections) { await ctx.db.delete(r._id); recordsDeleted++; }

      const mekOwnershipHistory = await ctx.db.query("mekOwnershipHistory")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
      for (const r of mekOwnershipHistory) { await ctx.db.delete(r._id); recordsDeleted++; }

      const goldCheckpoints = await ctx.db.query("goldCheckpoints")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of goldCheckpoints) { await ctx.db.delete(r._id); recordsDeleted++; }

      const goldSnapshots = await ctx.db.query("goldSnapshots")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of goldSnapshots) { await ctx.db.delete(r._id); recordsDeleted++; }

      const syncChecksums = await ctx.db.query("syncChecksums")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of syncChecksums) { await ctx.db.delete(r._id); recordsDeleted++; }

      const sagaExecutions = await ctx.db.query("sagaExecutions")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of sagaExecutions) { await ctx.db.delete(r._id); recordsDeleted++; }

      const securityAnomalies = await ctx.db.query("securityAnomalies")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of securityAnomalies) { await ctx.db.delete(r._id); recordsDeleted++; }

      const suspiciousWallets = await ctx.db.query("suspiciousWallets")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of suspiciousWallets) { await ctx.db.delete(r._id); recordsDeleted++; }

      const rateLimitViolations = await ctx.db.query("rateLimitViolations")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of rateLimitViolations) { await ctx.db.delete(r._id); recordsDeleted++; }

      const walletGroupMemberships = await ctx.db.query("walletGroupMemberships")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of walletGroupMemberships) { await ctx.db.delete(r._id); recordsDeleted++; }

      // Delete user record
      await ctx.db.delete(userId);
      recordsDeleted++;

      details.push({
        wallet: walletAddress.substring(0, 25) + "...",
        totalDeleted: recordsDeleted,
      });

      totalDeletedRecords += recordsDeleted;
    }

    console.log(`[Admin] Bulk deleted ${testWallets.length} test wallets (${totalDeletedRecords} total records)`);

    return {
      success: true,
      message: `Deleted ${testWallets.length} test wallet(s) and ${totalDeletedRecords} related records`,
      deletedCount: testWallets.length,
      totalRecordsDeleted: totalDeletedRecords,
      details,
    };
  },
});