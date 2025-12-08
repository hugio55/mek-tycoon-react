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
        ? (Object.values(user.totalEssence) as number[]).reduce((sum, val) => sum + val, 0)
        : 0;

      return {
        _id: user._id,
        walletAddress: user.walletAddress,
        walletType: user.walletType || user.lastWalletType || "Unknown",
        companyName: user.corporationName || null,
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
      // PHASE II: Check both legacy goldMining and new goldMiningState tables
      const goldMining = await ctx.db.query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      const goldMiningState = await ctx.db.query("goldMiningState")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress)).collect();
      const mekLevels = await ctx.db.query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      const leaderboardCache = await ctx.db.query("leaderboardCache")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();

      const totalRecords =
        craftingSessions.length + inventory.length + transactions.length +
        achievements.length + activeBuffs.length + userStatsCache.length +
        contracts.length + chipInstances.length + marketListings.length +
        mekTalentTrees.length + meks.length + goldMining.length + goldMiningState.length +
        mekLevels.length + leaderboardCache.length + 1; // +1 for user record

      return {
        walletAddress,
        displayName: user.corporationName || "No name",
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
          goldMiningState: goldMiningState.length,
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

    // goldMining (legacy)
    const goldMining = await ctx.db.query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of goldMining) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldMining = goldMining.length;

    // PHASE II: goldMiningState (new normalized table)
    const goldMiningState = await ctx.db.query("goldMiningState")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress)).collect();
    for (const record of goldMiningState) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldMiningState = goldMiningState.length;

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

    // NOTE: discordConnections table removed (Discord bot integration removed)

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

    // NOTE: walletGroupMemberships table removed (1 wallet = 1 corp model)

    // === ADDITIONAL TABLES (added for complete coverage) ===

    // marketListingPurchases (as seller)
    const marketListingPurchases = await ctx.db.query("marketListingPurchases")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
    for (const record of marketListingPurchases) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.marketListingPurchases = marketListingPurchases.length;

    // tradeAbuseFlags (as seller)
    const tradeAbuseFlags = await ctx.db.query("tradeAbuseFlags")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
    for (const record of tradeAbuseFlags) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.tradeAbuseFlags = tradeAbuseFlags.length;

    // tradeSessionData (as buyer or seller)
    const tradeSessionDataAsBuyer = await ctx.db.query("tradeSessionData")
      .withIndex("by_buyer", (q: any) => q.eq("buyerId", userId)).collect();
    const tradeSessionDataAsSeller = await ctx.db.query("tradeSessionData")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", userId)).collect();
    const allTradeSessionData = [...tradeSessionDataAsBuyer, ...tradeSessionDataAsSeller];
    // Dedupe by _id in case user is both buyer and seller
    const uniqueTradeSessionIds = new Set(allTradeSessionData.map(r => r._id.toString()));
    for (const record of allTradeSessionData) {
      if (uniqueTradeSessionIds.has(record._id.toString())) {
        await ctx.db.delete(record._id);
        uniqueTradeSessionIds.delete(record._id.toString());
      }
    }
    deletedCounts.tradeSessionData = allTradeSessionData.length;

    // testMints (by walletAddress)
    const testMints = await ctx.db.query("testMints")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of testMints) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.testMints = testMints.length;

    // mintHistory (by receiverAddress)
    const mintHistory = await ctx.db.query("mintHistory")
      .withIndex("by_receiver", (q: any) => q.eq("receiverAddress", walletAddress)).collect();
    for (const record of mintHistory) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.mintHistory = mintHistory.length;

    // commemorativeTokens (by walletAddress - no direct index, use filter)
    const commemorativeTokens = await ctx.db.query("commemorativeTokens")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of commemorativeTokens) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.commemorativeTokens = commemorativeTokens.length;

    // corpTradePairs (as corp1 or corp2)
    const corpTradePairsAsCorp1 = await ctx.db.query("corpTradePairs")
      .withIndex("by_corp1", (q: any) => q.eq("corp1Id", userId)).collect();
    const corpTradePairsAsCorp2 = await ctx.db.query("corpTradePairs")
      .withIndex("by_corp2", (q: any) => q.eq("corp2Id", userId)).collect();
    const allCorpTradePairs = [...corpTradePairsAsCorp1, ...corpTradePairsAsCorp2];
    for (const record of allCorpTradePairs) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.corpTradePairs = allCorpTradePairs.length;

    // goldBackupUserData
    const goldBackupUserData = await ctx.db.query("goldBackupUserData")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of goldBackupUserData) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.goldBackupUserData = goldBackupUserData.length;

    // levelUpgrades
    const levelUpgrades = await ctx.db.query("levelUpgrades")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of levelUpgrades) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.levelUpgrades = levelUpgrades.length;

    // activityLogs
    const activityLogs = await ctx.db.query("activityLogs")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of activityLogs) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.activityLogs = activityLogs.length;

    // federationMemberships
    const federationMemberships = await ctx.db.query("federationMemberships")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of federationMemberships) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.federationMemberships = federationMemberships.length;

    // essenceSlots
    const essenceSlots = await ctx.db.query("essenceSlots")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essenceSlots) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essenceSlots = essenceSlots.length;

    // essenceSlotRequirements
    const essenceSlotRequirements = await ctx.db.query("essenceSlotRequirements")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essenceSlotRequirements) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essenceSlotRequirements = essenceSlotRequirements.length;

    // essenceTracking
    const essenceTracking = await ctx.db.query("essenceTracking")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essenceTracking) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essenceTracking = essenceTracking.length;

    // essenceBalances
    const essenceBalances = await ctx.db.query("essenceBalances")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essenceBalances) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essenceBalances = essenceBalances.length;

    // essencePlayerBuffs
    const essencePlayerBuffs = await ctx.db.query("essencePlayerBuffs")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essencePlayerBuffs) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essencePlayerBuffs = essencePlayerBuffs.length;

    // essenceBuffSources
    const essenceBuffSources = await ctx.db.query("essenceBuffSources")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of essenceBuffSources) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.essenceBuffSources = essenceBuffSources.length;

    // airdropSubmissions (by userId)
    const airdropSubmissions = await ctx.db.query("airdropSubmissions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of airdropSubmissions) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.airdropSubmissions = airdropSubmissions.length;

    // commemorativePurchases (by walletAddress)
    const commemorativePurchases = await ctx.db.query("commemorativePurchases")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of commemorativePurchases) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.commemorativePurchases = commemorativePurchases.length;

    // commemorativeNFTClaims
    const commemorativeNFTClaims = await ctx.db.query("commemorativeNFTClaims")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of commemorativeNFTClaims) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.commemorativeNFTClaims = commemorativeNFTClaims.length;

    // messageUnreadCounts
    const messageUnreadCounts = await ctx.db.query("messageUnreadCounts")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
    for (const record of messageUnreadCounts) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.messageUnreadCounts = messageUnreadCounts.length;

    // typingIndicators (no index, use filter)
    const typingIndicators = await ctx.db.query("typingIndicators")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of typingIndicators) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.typingIndicators = typingIndicators.length;

    // messageUploadQuotas (has by_wallet_date index, use filter for wallet only)
    const messageUploadQuotas = await ctx.db.query("messageUploadQuotas")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    for (const record of messageUploadQuotas) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.messageUploadQuotas = messageUploadQuotas.length;

    // notifications (by userId)
    const notifications = await ctx.db.query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    for (const record of notifications) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.notifications = notifications.length;

    // === STAKE ADDRESS BASED TABLES ===
    // Get the user's stake address if they have one
    const stakeAddress = user.walletStakeAddress || walletAddress;

    // walletSessions (by stakeAddress)
    const walletSessions = await ctx.db.query("walletSessions")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress)).collect();
    for (const record of walletSessions) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.walletSessions = walletSessions.length;

    // walletSignatures (by stakeAddress)
    const walletSignatures = await ctx.db.query("walletSignatures")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress)).collect();
    for (const record of walletSignatures) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.walletSignatures = walletSignatures.length;

    // walletRateLimits (by stakeAddress - needs filter since index is compound)
    const walletRateLimits = await ctx.db.query("walletRateLimits")
      .filter((q) => q.eq(q.field("stakeAddress"), stakeAddress)).collect();
    for (const record of walletRateLimits) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.walletRateLimits = walletRateLimits.length;

    // auditLogs (by stakeAddress)
    const auditLogs = await ctx.db.query("auditLogs")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress)).collect();
    for (const record of auditLogs) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.auditLogs = auditLogs.length;

    // betaSignups (by stakeAddress)
    const betaSignups = await ctx.db.query("betaSignups")
      .withIndex("by_stakeAddress", (q: any) => q.eq("stakeAddress", stakeAddress)).collect();
    for (const record of betaSignups) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.betaSignups = betaSignups.length;

    // === MESSAGING TABLES ===

    // conversations (user is participant1 or participant2) - delete entire conversation
    const conversationsAsP1 = await ctx.db.query("conversations")
      .withIndex("by_participant1", (q: any) => q.eq("participant1", walletAddress)).collect();
    const conversationsAsP2 = await ctx.db.query("conversations")
      .withIndex("by_participant2", (q: any) => q.eq("participant2", walletAddress)).collect();
    const allConversations = [...conversationsAsP1, ...conversationsAsP2];

    // Delete messages in these conversations first
    let messagesDeleted = 0;
    for (const convo of allConversations) {
      const messages = await ctx.db.query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", convo._id)).collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
        messagesDeleted++;
      }
      await ctx.db.delete(convo._id);
    }
    deletedCounts.messages = messagesDeleted;
    deletedCounts.conversations = allConversations.length;

    // === ADDITIONAL WALLET-REFERENCED TABLES ===

    // federationInvites (as inviter or invitee)
    const federationInvitesAsInvitee = await ctx.db.query("federationInvites")
      .withIndex("by_invited_wallet", (q: any) => q.eq("invitedWalletAddress", walletAddress)).collect();
    const federationInvitesAsInviter = await ctx.db.query("federationInvites")
      .filter((q) => q.eq(q.field("invitedByWalletAddress"), walletAddress)).collect();
    const allFederationInvites = [...federationInvitesAsInvitee, ...federationInvitesAsInviter];
    for (const record of allFederationInvites) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.federationInvites = allFederationInvites.length;

    // mekTransferEvents (as fromWallet or toWallet)
    const mekTransferEventsFrom = await ctx.db.query("mekTransferEvents")
      .withIndex("by_from_wallet", (q: any) => q.eq("fromWallet", walletAddress)).collect();
    const mekTransferEventsTo = await ctx.db.query("mekTransferEvents")
      .withIndex("by_to_wallet", (q: any) => q.eq("toWallet", walletAddress)).collect();
    const allMekTransferEvents = [...mekTransferEventsFrom, ...mekTransferEventsTo];
    for (const record of allMekTransferEvents) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.mekTransferEvents = allMekTransferEvents.length;

    // batchMintedTokens (as recipient)
    const batchMintedTokens = await ctx.db.query("batchMintedTokens")
      .filter((q) => q.eq(q.field("recipientAddress"), walletAddress)).collect();
    for (const record of batchMintedTokens) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.batchMintedTokens = batchMintedTokens.length;

    // messageBlocks (as blocker or blocked)
    const messageBlocksAsBlocker = await ctx.db.query("messageBlocks")
      .withIndex("by_blocker", (q: any) => q.eq("blockerWallet", walletAddress)).collect();
    const messageBlocksAsBlocked = await ctx.db.query("messageBlocks")
      .withIndex("by_blocked", (q: any) => q.eq("blockedWallet", walletAddress)).collect();
    const allMessageBlocks = [...messageBlocksAsBlocker, ...messageBlocksAsBlocked];
    for (const record of allMessageBlocks) {
      await ctx.db.delete(record._id);
    }
    deletedCounts.messageBlocks = allMessageBlocks.length;

    // federationVariationCollection - remove wallet from contributingWallets array
    // Note: We update the array rather than delete the record since other wallets may still contribute
    const federationVariations = await ctx.db.query("federationVariationCollection")
      .filter((q) => q.neq(q.field("contributingWallets"), undefined)).collect();
    let federationVariationsUpdated = 0;
    for (const record of federationVariations) {
      const wallets = record.contributingWallets || [];
      if (wallets.includes(walletAddress)) {
        const updatedWallets = wallets.filter((w: string) => w !== walletAddress);
        if (updatedWallets.length === 0) {
          // No wallets left, delete the record
          await ctx.db.delete(record._id);
        } else {
          // Update the record with remaining wallets
          await ctx.db.patch(record._id, {
            contributingWallets: updatedWallets,
            count: Math.max(0, record.count - 1),
            lastUpdated: Date.now()
          });
        }
        federationVariationsUpdated++;
      }
    }
    deletedCounts.federationVariationCollectionUpdates = federationVariationsUpdated;

    // === CORPORATIONS SYSTEM (parallel user system) ===

    // nftPurchases (by walletAddress or userId)
    const nftPurchasesByWallet = await ctx.db.query("nftPurchases")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    const nftPurchasesByUser = await ctx.db.query("nftPurchases")
      .filter((q) => q.eq(q.field("userId"), userId)).collect();
    // Dedupe
    const nftPurchaseIds = new Set([...nftPurchasesByWallet, ...nftPurchasesByUser].map(r => r._id.toString()));
    for (const record of [...nftPurchasesByWallet, ...nftPurchasesByUser]) {
      if (nftPurchaseIds.has(record._id.toString())) {
        await ctx.db.delete(record._id);
        nftPurchaseIds.delete(record._id.toString());
      }
    }
    deletedCounts.nftPurchases = nftPurchasesByWallet.length + nftPurchasesByUser.length;

    // corporations (by stakeAddress - use walletAddress which could be stake address)
    const corporations = await ctx.db.query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress)).collect();
    // Also try with user's stake address if different
    const corporationsByStake = user.walletStakeAddress && user.walletStakeAddress !== walletAddress
      ? await ctx.db.query("corporations")
          .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", user.walletStakeAddress)).collect()
      : [];
    const allCorporations = [...corporations, ...corporationsByStake];

    // For each corporation, delete related coachMarkProgress
    let coachMarkProgressDeleted = 0;
    for (const corp of allCorporations) {
      const coachMarkProgress = await ctx.db.query("coachMarkProgress")
        .withIndex("by_corporation", (q: any) => q.eq("corporationId", corp._id)).collect();
      for (const record of coachMarkProgress) {
        await ctx.db.delete(record._id);
        coachMarkProgressDeleted++;
      }
      await ctx.db.delete(corp._id);
    }
    deletedCounts.corporations = allCorporations.length;
    deletedCounts.coachMarkProgress = coachMarkProgressDeleted;

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

      // PHASE II: goldMiningState (new normalized table)
      const goldMiningState = await ctx.db.query("goldMiningState")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", walletAddress)).collect();
      for (const r of goldMiningState) { await ctx.db.delete(r._id); recordsDeleted++; }

      const mekLevels = await ctx.db.query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress)).collect();
      for (const r of mekLevels) { await ctx.db.delete(r._id); recordsDeleted++; }

      const leaderboardCache = await ctx.db.query("leaderboardCache")
        .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
      for (const r of leaderboardCache) { await ctx.db.delete(r._id); recordsDeleted++; }

      // NOTE: discordConnections table removed (Discord bot integration removed)

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

      // NOTE: walletGroupMemberships table removed (1 wallet = 1 corp model)

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

/**
 * Search for any traces of a wallet address across ALL tables
 * Used to verify cascade delete worked completely
 */
export const searchWalletTraces = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const walletAddress = args.walletAddress;
    const traces: Record<string, number> = {};

    // Search users table
    const users = await ctx.db.query("users")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (users.length > 0) traces.users = users.length;

    // Search meks table
    const meks = await ctx.db.query("meks")
      .filter((q) => q.eq(q.field("owner"), walletAddress)).collect();
    if (meks.length > 0) traces.meks = meks.length;

    // Search goldMining table (legacy)
    const goldMining = await ctx.db.query("goldMining")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (goldMining.length > 0) traces.goldMining = goldMining.length;

    // PHASE II: Search goldMiningState table (new normalized table)
    const goldMiningState = await ctx.db.query("goldMiningState")
      .filter((q) => q.eq(q.field("stakeAddress"), walletAddress)).collect();
    if (goldMiningState.length > 0) traces.goldMiningState = goldMiningState.length;

    // Search mekLevels table
    const mekLevels = await ctx.db.query("mekLevels")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (mekLevels.length > 0) traces.mekLevels = mekLevels.length;

    // Search leaderboardCache table
    const leaderboardCache = await ctx.db.query("leaderboardCache")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (leaderboardCache.length > 0) traces.leaderboardCache = leaderboardCache.length;

    // Search goldSnapshots table
    const goldSnapshots = await ctx.db.query("goldSnapshots")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (goldSnapshots.length > 0) traces.goldSnapshots = goldSnapshots.length;

    // Search goldCheckpoints table
    const goldCheckpoints = await ctx.db.query("goldCheckpoints")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (goldCheckpoints.length > 0) traces.goldCheckpoints = goldCheckpoints.length;

    // Search activityLogs table
    const activityLogs = await ctx.db.query("activityLogs")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (activityLogs.length > 0) traces.activityLogs = activityLogs.length;

    // Search essenceBalances table
    const essenceBalances = await ctx.db.query("essenceBalances")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (essenceBalances.length > 0) traces.essenceBalances = essenceBalances.length;

    // Search essenceSlots table
    const essenceSlots = await ctx.db.query("essenceSlots")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (essenceSlots.length > 0) traces.essenceSlots = essenceSlots.length;

    // Search conversations table (as participant)
    const conversations1 = await ctx.db.query("conversations")
      .filter((q) => q.eq(q.field("participant1"), walletAddress)).collect();
    const conversations2 = await ctx.db.query("conversations")
      .filter((q) => q.eq(q.field("participant2"), walletAddress)).collect();
    const totalConvos = conversations1.length + conversations2.length;
    if (totalConvos > 0) traces.conversations = totalConvos;

    // Search corporations table
    const corporations = await ctx.db.query("corporations")
      .filter((q) => q.eq(q.field("stakeAddress"), walletAddress)).collect();
    if (corporations.length > 0) traces.corporations = corporations.length;

    // Search federationMemberships table
    const federationMemberships = await ctx.db.query("federationMemberships")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (federationMemberships.length > 0) traces.federationMemberships = federationMemberships.length;

    // Search discordConnections table
    const discordConnections = await ctx.db.query("discordConnections")
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress)).collect();
    if (discordConnections.length > 0) traces.discordConnections = discordConnections.length;

    const totalTraces = Object.values(traces).reduce((sum, count) => sum + count, 0);

    return {
      walletAddress,
      found: totalTraces > 0,
      totalTraces,
      traces,
      message: totalTraces > 0
        ? `Found ${totalTraces} trace(s) in ${Object.keys(traces).length} table(s)`
        : "No traces found - wallet completely deleted"
    };
  },
});

// ============================================================================
// LEADERBOARD CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all leaderboard cache entries
 * Safe operation - cache will repopulate on next cron run (every 15 minutes)
 */
export const clearLeaderboardCache = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[ADMIN] Clearing leaderboard cache...');

    const allEntries = await ctx.db.query("leaderboardCache").collect();

    let deletedCount = 0;
    for (const entry of allEntries) {
      await ctx.db.delete(entry._id);
      deletedCount++;
    }

    console.log(`[ADMIN] Deleted ${deletedCount} leaderboard cache entries`);

    return {
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} leaderboard cache entries. Cache will repopulate on next cron run.`
    };
  },
});