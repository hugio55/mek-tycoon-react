import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// PHASE II: Corporation Authentication (Stake-Address-Only)
// =============================================================================
// Corporations are identified SOLELY by stake address.
// Payment addresses are NOT stored - NMKR handles them at transaction time.
// Note: Using 'any' type for query callbacks to avoid TypeScript deep instantiation issues
// =============================================================================

/**
 * Connect or create corporation with Cardano wallet
 * Uses stake address as the ONLY identifier
 */
export const connectCorporation = mutation({
  args: {
    stakeAddress: v.string(), // THE identifier - stake address only
    walletType: v.optional(v.string()), // "nami", "eternl", "flint", etc.
  },
  handler: async (ctx, args) => {
    // Validate stake address format (mainnet or testnet)
    if (!args.stakeAddress.startsWith("stake1") &&
        !args.stakeAddress.startsWith("stake_test1")) {
      throw new Error("Invalid stake address format. Must start with 'stake1' (mainnet) or 'stake_test1' (testnet)");
    }

    // Find existing corporation by stake address
    const existingCorp = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (existingCorp) {
      // Update last login and connection info
      try {
        await ctx.db.patch(existingCorp._id, {
          lastLogin: Date.now(),
          lastConnectionTime: Date.now(),
          walletType: args.walletType || existingCorp.walletType,
          isOnline: true,
        });
      } catch (error) {
        console.error('[corporationAuth] Failed to update corporation:', error);
        throw new Error('Failed to update corporation');
      }

      // Fetch fresh data after patch
      const updatedCorp = await ctx.db.get(existingCorp._id);

      return {
        corporation: updatedCorp,
        isNew: false,
      };
    }

    // Create new corporation
    const newCorpId = await ctx.db.insert("corporations", {
      stakeAddress: args.stakeAddress,
      walletType: args.walletType,

      // Starting resources
      gold: 100, // Welcome bonus
      totalEssence: {
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
      },

      // Starting stats
      level: 1,
      experience: 0,
      craftingSlots: 1,
      totalBattles: 0,
      totalWins: 0,
      winRate: 0,

      // Timestamps
      createdAt: Date.now(),
      lastLogin: Date.now(),
      lastConnectionTime: Date.now(),

      // Status
      isOnline: true,
      isBanned: false,
      role: "user",
    });

    const newCorp = await ctx.db.get(newCorpId);

    // Log welcome bonus transaction
    await ctx.db.insert("transactions", {
      type: "reward",
      userId: newCorpId,
      amount: 100,
      details: "Welcome bonus - New corporation registration",
      timestamp: Date.now(),
    });

    return {
      corporation: newCorp,
      isNew: true,
    };
  },
});

/**
 * Disconnect corporation (logout)
 */
export const disconnectCorporation = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (corporation) {
      await ctx.db.patch(corporation._id, {
        isOnline: false,
        lastLogin: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get corporation by stake address
 */
export const getCorporationByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!corporation) {
      return null;
    }

    // Get corporation's Meks (owned by this stake address)
    // Note: Meks table uses "owner" field - may need to be updated for Phase II
    // For now, we'll return corporation data only

    return {
      ...corporation,
      stats: {
        // Placeholder - will be populated when Mek ownership is linked
        totalMeks: 0,
        activeCrafting: 0,
        achievementsUnlocked: 0,
      },
    };
  },
});

/**
 * Get corporation ID by stake address
 */
export const getCorporationIdByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return corporation ? corporation._id : null;
  },
});

/**
 * Check if corporation exists by stake address
 */
export const corporationExists = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return corporation !== null;
  },
});

/**
 * Update corporation name
 */
export const updateCorporationName = mutation({
  args: {
    stakeAddress: v.string(),
    corporationName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate name (alphanumeric only, 3-30 chars)
    const nameRegex = /^[a-zA-Z0-9\s]{3,30}$/;
    if (!nameRegex.test(args.corporationName)) {
      throw new Error("Corporation name must be 3-30 characters, alphanumeric only");
    }

    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!corporation) {
      throw new Error("Corporation not found");
    }

    // Check if name is already taken (case-insensitive)
    const nameLower = args.corporationName.toLowerCase();
    const existingName = await ctx.db
      .query("corporations")
      .withIndex("by_corporation_name_lower", (q: any) => q.eq("corporationNameLower", nameLower))
      .first();

    if (existingName && existingName._id !== corporation._id) {
      throw new Error("Corporation name is already taken");
    }

    await ctx.db.patch(corporation._id, {
      corporationName: args.corporationName,
      corporationNameLower: nameLower,
    });

    return { success: true };
  },
});

/**
 * Get online corporations
 */
export const getOnlineCorporations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const onlineCorporations = await ctx.db
      .query("corporations")
      .filter((q: any) => q.eq(q.field("isOnline"), true))
      .order("desc")
      .take(limit);

    return onlineCorporations.map((corp: any) => ({
      _id: corp._id,
      stakeAddress: corp.stakeAddress.slice(0, 12) + "..." + corp.stakeAddress.slice(-6),
      corporationName: corp.corporationName,
      level: corp.level,
      role: corp.role,
    }));
  },
});

/**
 * Get corporation leaderboard
 */
export const getCorporationLeaderboard = query({
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

    let corporations = await ctx.db
      .query("corporations")
      .order("desc")
      .take(limit);

    // Sort by requested field
    corporations = corporations.sort((a: any, b: any) => {
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

    return corporations.map((corp: any, index: number) => ({
      rank: index + 1,
      _id: corp._id,
      stakeAddress: corp.stakeAddress.slice(0, 12) + "..." + corp.stakeAddress.slice(-6),
      corporationName: corp.corporationName,
      level: corp.level,
      gold: corp.gold,
      totalWins: corp.totalWins,
      winRate: corp.winRate,
      isOnline: corp.isOnline,
    }));
  },
});
