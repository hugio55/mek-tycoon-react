import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// PHASE II: Corporation Authentication (Stake-Address-Only)
// =============================================================================
// Corporations are identified SOLELY by stake address.
// Payment addresses are NOT stored - NMKR handles them at transaction time.
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

const CORPORATION_CONSTANTS = {
  WELCOME_BONUS_GOLD: 100,
  STARTING_LEVEL: 1,
  STARTING_CRAFTING_SLOTS: 1,
  SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  STARTING_ESSENCE: {
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
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates stake address format (bech32)
 * Mainnet: stake1... (59 chars total)
 * Testnet: stake_test1... (63 chars total)
 */
function isValidStakeAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;

  // Mainnet: stake1 + 53 lowercase alphanumeric chars
  const mainnetRegex = /^stake1[a-z0-9]{53}$/;
  // Testnet: stake_test1 + 49 lowercase alphanumeric chars
  const testnetRegex = /^stake_test1[a-z0-9]{49}$/;

  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Sanitizes corporation name input
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Returns sanitized string or null if invalid
 */
function sanitizeCorporationName(name: string): string | null {
  if (!name || typeof name !== 'string') return null;

  const sanitized = name.trim().replace(/\s+/g, ' ');

  // Validate: 3-30 chars, alphanumeric and spaces only
  const nameRegex = /^[a-zA-Z0-9 ]{3,30}$/;
  if (!nameRegex.test(sanitized)) return null;

  return sanitized;
}

/**
 * Truncates stake address for display
 */
function truncateStakeAddress(address: string): string {
  if (!address || address.length < 20) return address;
  return address.slice(0, 12) + "..." + address.slice(-6);
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

function corporationError(operation: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[corporationAuth] ${operation} failed:`, message);
  throw new Error(`${operation} failed`);
}

// =============================================================================
// SESSION AUTHENTICATION
// =============================================================================

/**
 * Validates that a session token is valid for the given stake address
 */
async function validateSession(
  ctx: { db: any },
  stakeAddress: string,
  sessionToken: string
): Promise<{ valid: boolean; corporation: any | null }> {
  const corp = await ctx.db
    .query("corporations")
    .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress))
    .first();

  if (!corp) {
    return { valid: false, corporation: null };
  }

  // Check session token exists and matches
  if (!corp.sessionToken || corp.sessionToken !== sessionToken) {
    return { valid: false, corporation: corp };
  }

  // Check session hasn't expired
  if (!corp.sessionExpiresAt || Date.now() > corp.sessionExpiresAt) {
    return { valid: false, corporation: corp };
  }

  return { valid: true, corporation: corp };
}

/**
 * Generates a new session token
 */
function generateSessionToken(): string {
  // Generate UUID-like token using random values
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
    if (i === 7 || i === 11 || i === 15 || i === 19) token += '-';
  }
  return token;
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Connect or create corporation with Cardano wallet
 * Uses stake address as the ONLY identifier
 */
export const connectCorporation = mutation({
  args: {
    stakeAddress: v.string(),
    walletType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate stake address format
    if (!isValidStakeAddress(args.stakeAddress)) {
      throw new Error("Invalid stake address format. Must be a valid bech32 stake address.");
    }

    // Check for existing corporation (use unique() to detect duplicates)
    let existingCorp;
    try {
      existingCorp = await ctx.db
        .query("corporations")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
        .first();
    } catch (error) {
      corporationError("Find corporation", error);
    }

    // Generate new session
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = Date.now() + CORPORATION_CONSTANTS.SESSION_DURATION_MS;

    if (existingCorp) {
      // Update existing corporation
      try {
        await ctx.db.patch(existingCorp._id, {
          lastLogin: Date.now(),
          lastConnectionTime: Date.now(),
          walletType: args.walletType || existingCorp.walletType,
          isOnline: true,
          sessionToken,
          sessionExpiresAt,
        });
      } catch (error) {
        corporationError("Update corporation", error);
      }

      // Fetch fresh data after patch
      const updatedCorp = await ctx.db.get(existingCorp._id);

      return {
        corporation: updatedCorp,
        sessionToken, // Return to frontend for authenticated calls
        isNew: false,
      };
    }

    // Create new corporation
    let newCorpId;
    try {
      newCorpId = await ctx.db.insert("corporations", {
        stakeAddress: args.stakeAddress,
        walletType: args.walletType,

        // Starting resources
        gold: CORPORATION_CONSTANTS.WELCOME_BONUS_GOLD,
        totalEssence: { ...CORPORATION_CONSTANTS.STARTING_ESSENCE },

        // Starting stats
        level: CORPORATION_CONSTANTS.STARTING_LEVEL,
        experience: 0,
        craftingSlots: CORPORATION_CONSTANTS.STARTING_CRAFTING_SLOTS,
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

        // Session
        sessionToken,
        sessionExpiresAt,
      });
    } catch (error: any) {
      // Handle potential race condition - another request may have created the corp
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Retry fetch
        const retryExisting = await ctx.db
          .query("corporations")
          .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
          .first();

        if (retryExisting) {
          // Update the existing one instead
          await ctx.db.patch(retryExisting._id, {
            lastLogin: Date.now(),
            isOnline: true,
            sessionToken,
            sessionExpiresAt,
          });
          return {
            corporation: await ctx.db.get(retryExisting._id),
            sessionToken,
            isNew: false,
          };
        }
      }
      corporationError("Create corporation", error);
    }

    const newCorp = await ctx.db.get(newCorpId);

    // Log welcome bonus transaction
    try {
      await ctx.db.insert("transactions", {
        type: "reward",
        userId: newCorpId,
        amount: CORPORATION_CONSTANTS.WELCOME_BONUS_GOLD,
        details: "Welcome bonus - New corporation registration",
        timestamp: Date.now(),
      });
    } catch (error) {
      // Non-fatal - corporation was created, just transaction log failed
      console.error("[corporationAuth] Failed to log welcome bonus transaction:", error);
    }

    return {
      corporation: newCorp,
      sessionToken,
      isNew: true,
    };
  },
});

/**
 * Disconnect corporation (logout) - REQUIRES SESSION AUTH
 */
export const disconnectCorporation = mutation({
  args: {
    stakeAddress: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const { valid, corporation } = await validateSession(ctx, args.stakeAddress, args.sessionToken);

    if (!valid || !corporation) {
      throw new Error("Invalid or expired session");
    }

    try {
      await ctx.db.patch(corporation._id, {
        isOnline: false,
        lastLogin: Date.now(),
        sessionToken: undefined, // Clear session on disconnect
        sessionExpiresAt: undefined,
      });
    } catch (error) {
      corporationError("Disconnect corporation", error);
    }

    return { success: true };
  },
});

/**
 * Update corporation name - REQUIRES SESSION AUTH
 */
export const updateCorporationName = mutation({
  args: {
    stakeAddress: v.string(),
    sessionToken: v.string(),
    corporationName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const { valid, corporation } = await validateSession(ctx, args.stakeAddress, args.sessionToken);

    if (!valid || !corporation) {
      throw new Error("Invalid or expired session");
    }

    // Sanitize and validate name
    const sanitizedName = sanitizeCorporationName(args.corporationName);
    if (!sanitizedName) {
      throw new Error("Corporation name must be 3-30 characters, letters, numbers, and spaces only");
    }

    // Check if name is already taken (case-insensitive)
    const nameLower = sanitizedName.toLowerCase();
    const existingName = await ctx.db
      .query("corporations")
      .withIndex("by_corporation_name_lower", (q: any) => q.eq("corporationNameLower", nameLower))
      .first();

    if (existingName && existingName._id !== corporation._id) {
      throw new Error("Corporation name is already taken");
    }

    try {
      await ctx.db.patch(corporation._id, {
        corporationName: sanitizedName,
        corporationNameLower: nameLower,
      });
    } catch (error) {
      corporationError("Update corporation name", error);
    }

    return { success: true, corporationName: sanitizedName };
  },
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get corporation by stake address
 */
export const getCorporationByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!corporation) {
      return null;
    }

    return corporation;
  },
});

/**
 * Get corporation ID by stake address
 */
export const getCorporationIdByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

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
    if (!isValidStakeAddress(args.stakeAddress)) {
      return false;
    }

    const corporation = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return corporation !== null;
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
    const limit = Math.min(args.limit || 50, 100); // Cap at 100

    const onlineCorporations = await ctx.db
      .query("corporations")
      .filter((q: any) => q.eq(q.field("isOnline"), true))
      .order("desc")
      .take(limit);

    return onlineCorporations.map((corp: any) => ({
      _id: corp._id,
      stakeAddress: corp.stakeAddress, // Full address for lookups
      stakeAddressDisplay: truncateStakeAddress(corp.stakeAddress),
      corporationName: corp.corporationName,
      level: corp.level || CORPORATION_CONSTANTS.STARTING_LEVEL,
      role: corp.role || "user",
    }));
  },
});

/**
 * Get corporation leaderboard
 * Uses database indexes for efficient sorting
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
    const limit = Math.min(args.limit || 100, 500); // Cap at 500
    const sortBy = args.sortBy || "level";

    let corporations: any[];

    // Use index-based sorting where possible for better performance
    if (sortBy === "gold") {
      corporations = await ctx.db
        .query("corporations")
        .withIndex("by_gold")
        .order("desc")
        .take(limit);
    } else if (sortBy === "level") {
      corporations = await ctx.db
        .query("corporations")
        .withIndex("by_level")
        .order("desc")
        .take(limit);
    } else {
      // For wins and winRate, fetch and sort in memory
      // (Would need additional indexes for these to be efficient)
      corporations = await ctx.db
        .query("corporations")
        .order("desc")
        .take(limit);

      corporations = corporations.sort((a: any, b: any) => {
        if (sortBy === "wins") {
          return (b.totalWins || 0) - (a.totalWins || 0);
        } else if (sortBy === "winRate") {
          return (b.winRate || 0) - (a.winRate || 0);
        }
        return 0;
      });
    }

    return corporations.map((corp: any, index: number) => ({
      rank: index + 1,
      _id: corp._id,
      stakeAddress: corp.stakeAddress, // Full address
      stakeAddressDisplay: truncateStakeAddress(corp.stakeAddress),
      corporationName: corp.corporationName,
      level: corp.level || CORPORATION_CONSTANTS.STARTING_LEVEL,
      gold: corp.gold || 0,
      totalWins: corp.totalWins || 0,
      winRate: corp.winRate || 0,
      isOnline: corp.isOnline || false,
    }));
  },
});

/**
 * Validate a session token (for frontend to check if re-auth needed)
 */
export const validateSessionToken = query({
  args: {
    stakeAddress: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return { valid: false, reason: "invalid_address" };
    }

    const corp = await ctx.db
      .query("corporations")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!corp) {
      return { valid: false, reason: "not_found" };
    }

    if (!corp.sessionToken || corp.sessionToken !== args.sessionToken) {
      return { valid: false, reason: "invalid_token" };
    }

    if (!corp.sessionExpiresAt || Date.now() > corp.sessionExpiresAt) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, reason: null };
  },
});
