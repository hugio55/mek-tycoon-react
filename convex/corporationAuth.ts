import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// =============================================================================
// PHASE II: User Authentication (Stake-Address-Only)
// =============================================================================
// Users are identified SOLELY by stake address.
// This file now uses the consolidated `users` table (not corporations).
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

const USER_CONSTANTS = {
  WELCOME_BONUS_GOLD: 100,
  STARTING_LEVEL: 1,
  STARTING_CRAFTING_SLOTS: 1,
  SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  // Starting essence types and amounts (will be stored in userEssence table)
  STARTING_ESSENCE: [
    { type: "stone", amount: 10 },
    { type: "disco", amount: 5 },
    { type: "cartoon", amount: 5 },
    { type: "candy", amount: 5 },
    { type: "tiles", amount: 5 },
    { type: "moss", amount: 5 },
  ],
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

function authError(operation: string, error: unknown): never {
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
): Promise<{ valid: boolean; user: any | null }> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress))
    .first();

  if (!user) {
    return { valid: false, user: null };
  }

  // Check session token exists and matches
  if (!user.sessionToken || user.sessionToken !== sessionToken) {
    return { valid: false, user: user };
  }

  // Check session hasn't expired
  if (!user.sessionExpiresAt || Date.now() > user.sessionExpiresAt) {
    return { valid: false, user: user };
  }

  return { valid: true, user: user };
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
 * Connect or create user with Cardano wallet
 * Uses stake address as the ONLY identifier
 *
 * PHASE II: Now uses consolidated `users` table
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

    // Check for existing user by stake address
    let existingUser;
    try {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
        .first();
    } catch (error) {
      authError("Find user", error);
    }

    // Generate new session
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = Date.now() + USER_CONSTANTS.SESSION_DURATION_MS;

    if (existingUser) {
      // Update existing user
      try {
        await ctx.db.patch(existingUser._id, {
          lastLogin: Date.now(),
          lastConnectionTime: Date.now(),
          walletType: args.walletType || existingUser.walletType,
          isOnline: true,
          sessionToken,
          sessionExpiresAt,
          updatedAt: Date.now(),
        });
      } catch (error) {
        authError("Update user", error);
      }

      // Fetch fresh data after patch
      const updatedUser = await ctx.db.get(existingUser._id);

      return {
        corporation: updatedUser, // Keep 'corporation' key for backwards compat
        user: updatedUser,
        sessionToken,
        isNew: false,
      };
    }

    // Create new user
    const now = Date.now();
    let newUserId;
    try {
      newUserId = await ctx.db.insert("users", {
        // Primary identifier (Phase II)
        stakeAddress: args.stakeAddress,

        // Wallet info
        walletType: args.walletType,
        walletAddress: args.stakeAddress, // LEGACY: Use stake as wallet for backwards compat

        // Starting resources
        gold: USER_CONSTANTS.WELCOME_BONUS_GOLD,

        // LEGACY: Empty totalEssence object (real essence stored in userEssence table)
        totalEssence: {
          stone: 0, disco: 0, paul: 0, cartoon: 0, candy: 0, tiles: 0,
          moss: 0, bullish: 0, journalist: 0, laser: 0, flashbulb: 0,
          accordion: 0, turret: 0, drill: 0, security: 0,
        },
        craftingSlots: USER_CONSTANTS.STARTING_CRAFTING_SLOTS,

        // Starting stats
        level: USER_CONSTANTS.STARTING_LEVEL,
        experience: 0,
        totalBattles: 0,
        totalWins: 0,
        winRate: 0,

        // Timestamps
        createdAt: now,
        lastLogin: now,
        lastConnectionTime: now,
        updatedAt: now,

        // Status
        isOnline: true,
        isBanned: false,
        role: "user",

        // Session
        sessionToken,
        sessionExpiresAt,
      });
    } catch (error: any) {
      // Handle potential race condition - another request may have created the user
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Retry fetch
        const retryExisting = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
          .first();

        if (retryExisting) {
          // Update the existing one instead
          await ctx.db.patch(retryExisting._id, {
            lastLogin: now,
            isOnline: true,
            sessionToken,
            sessionExpiresAt,
            updatedAt: now,
          });
          return {
            corporation: await ctx.db.get(retryExisting._id),
            user: await ctx.db.get(retryExisting._id),
            sessionToken,
            isNew: false,
          };
        }
      }
      authError("Create user", error);
    }

    // Create starting essence in userEssence table
    for (const essence of USER_CONSTANTS.STARTING_ESSENCE) {
      if (essence.amount > 0) {
        try {
          await ctx.db.insert("userEssence", {
            stakeAddress: args.stakeAddress,
            essenceType: essence.type,
            balance: essence.amount,
            lastUpdated: now,
            lastSource: "welcome_bonus",
          });
        } catch (error) {
          console.error(`[corporationAuth] Failed to create starting essence ${essence.type}:`, error);
        }
      }
    }

    // NOTE: goldMiningState creation removed - Phase II uses job slots for income, not passive mining

    const newUser = await ctx.db.get(newUserId);

    // Log welcome bonus transaction
    try {
      await ctx.db.insert("transactions", {
        type: "reward",
        userId: newUserId,
        amount: USER_CONSTANTS.WELCOME_BONUS_GOLD,
        details: "Welcome bonus - New user registration",
        timestamp: now,
      });
    } catch (error) {
      // Non-fatal - user was created, just transaction log failed
      console.error("[corporationAuth] Failed to log welcome bonus transaction:", error);
    }

    return {
      corporation: newUser, // Keep 'corporation' key for backwards compat
      user: newUser,
      sessionToken,
      isNew: true,
    };
  },
});

/**
 * Disconnect user (logout) - REQUIRES SESSION AUTH
 */
export const disconnectCorporation = mutation({
  args: {
    stakeAddress: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const { valid, user } = await validateSession(ctx, args.stakeAddress, args.sessionToken);

    if (!valid || !user) {
      throw new Error("Invalid or expired session");
    }

    try {
      await ctx.db.patch(user._id, {
        isOnline: false,
        lastLogin: Date.now(),
        sessionToken: undefined, // Clear session on disconnect
        sessionExpiresAt: undefined,
        updatedAt: Date.now(),
      });
    } catch (error) {
      authError("Disconnect user", error);
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
    const { valid, user } = await validateSession(ctx, args.stakeAddress, args.sessionToken);

    if (!valid || !user) {
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
      .query("users")
      .withIndex("by_corporation_name_lower", (q: any) => q.eq("corporationNameLower", nameLower))
      .first();

    if (existingName && existingName._id !== user._id) {
      throw new Error("Corporation name is already taken");
    }

    try {
      await ctx.db.patch(user._id, {
        corporationName: sanitizedName,
        corporationNameLower: nameLower,
        updatedAt: Date.now(),
      });
    } catch (error) {
      authError("Update corporation name", error);
    }

    return { success: true, corporationName: sanitizedName };
  },
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get user by stake address
 */
export const getCorporationByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      return null;
    }

    return user;
  },
});

/**
 * Get user by stake address (new name, same function)
 */
export const getUserByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return user;
  },
});

/**
 * Get user ID by stake address
 */
export const getCorporationIdByStake = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return user ? user._id : null;
  },
});

/**
 * Check if user exists by stake address
 */
export const corporationExists = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    return user !== null;
  },
});

/**
 * Get online users
 */
export const getOnlineCorporations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100); // Cap at 100

    const onlineUsers = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("isOnline"), true))
      .order("desc")
      .take(limit);

    return onlineUsers.map((user: any) => ({
      _id: user._id,
      stakeAddress: user.stakeAddress,
      stakeAddressDisplay: truncateStakeAddress(user.stakeAddress || ''),
      corporationName: user.corporationName,
      level: user.level || USER_CONSTANTS.STARTING_LEVEL,
      role: user.role || "user",
    }));
  },
});

/**
 * Get user leaderboard
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

    let users: any[];

    // Use index-based sorting where possible for better performance
    if (sortBy === "gold") {
      users = await ctx.db
        .query("users")
        .withIndex("by_gold")
        .order("desc")
        .take(limit);
    } else if (sortBy === "level") {
      users = await ctx.db
        .query("users")
        .withIndex("by_level")
        .order("desc")
        .take(limit);
    } else {
      // For wins and winRate, fetch and sort in memory
      users = await ctx.db
        .query("users")
        .order("desc")
        .take(limit);

      users = users.sort((a: any, b: any) => {
        if (sortBy === "wins") {
          return (b.totalWins || 0) - (a.totalWins || 0);
        } else if (sortBy === "winRate") {
          return (b.winRate || 0) - (a.winRate || 0);
        }
        return 0;
      });
    }

    return users.map((user: any, index: number) => ({
      rank: index + 1,
      _id: user._id,
      stakeAddress: user.stakeAddress,
      stakeAddressDisplay: truncateStakeAddress(user.stakeAddress || ''),
      corporationName: user.corporationName,
      level: user.level || USER_CONSTANTS.STARTING_LEVEL,
      gold: user.gold || 0,
      totalWins: user.totalWins || 0,
      winRate: user.winRate || 0,
      isOnline: user.isOnline || false,
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (!user) {
      return { valid: false, reason: "not_found" };
    }

    if (!user.sessionToken || user.sessionToken !== args.sessionToken) {
      return { valid: false, reason: "invalid_token" };
    }

    if (!user.sessionExpiresAt || Date.now() > user.sessionExpiresAt) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, reason: null };
  },
});

// =============================================================================
// USER ESSENCE QUERIES (using new userEssence table)
// =============================================================================

/**
 * Get all essence balances for a user
 */
export const getUserEssence = query({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return {};
    }

    const essenceRows = await ctx.db
      .query("userEssence")
      .withIndex("by_user", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    // Convert array of rows to object keyed by essenceType
    const essenceMap: Record<string, number> = {};
    for (const row of essenceRows) {
      essenceMap[row.essenceType] = row.balance;
    }

    return essenceMap;
  },
});

/**
 * Get specific essence balance for a user
 */
export const getUserEssenceBalance = query({
  args: {
    stakeAddress: v.string(),
    essenceType: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return 0;
    }

    const essenceRow = await ctx.db
      .query("userEssence")
      .withIndex("by_user_type", (q: any) =>
        q.eq("stakeAddress", args.stakeAddress).eq("essenceType", args.essenceType)
      )
      .first();

    return essenceRow?.balance || 0;
  },
});

// =============================================================================
// COMPANY NAME MANAGEMENT
// =============================================================================

/**
 * Check if a company name is available
 * Used for real-time validation in CompanyNameModal
 */
export const checkCompanyNameAvailability = query({
  args: {
    companyName: v.string(),
    currentWalletAddress: v.string(), // Actually stake address now
  },
  handler: async (ctx, args) => {
    const trimmedName = args.companyName.trim();

    // Basic validation
    if (trimmedName.length < 2) {
      return { available: false, error: "Name must be at least 2 characters" };
    }

    if (trimmedName.length > 30) {
      return { available: false, error: "Name must be 30 characters or less" };
    }

    const nameLower = trimmedName.toLowerCase();

    // Check if name exists (case-insensitive)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_corporation_name_lower", (q: any) => q.eq("corporationNameLower", nameLower))
      .first();

    // If name exists, check if it belongs to the current user
    if (existingUser) {
      // Allow if it's the current user's name
      if (existingUser.stakeAddress === args.currentWalletAddress) {
        return { available: true, isCurrentName: true };
      }
      return { available: false, error: "This name is already taken" };
    }

    return { available: true };
  },
});

/**
 * Get current company name for a user
 * Used by CompanyNameModal to pre-fill the form in edit mode
 */
export const getCompanyName = query({
  args: {
    walletAddress: v.string(), // Actually stake address now
  },
  handler: async (ctx, args) => {
    // Try to find user by stake address
    let user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    // Fallback: try legacy wallet address if stake address not found
    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("walletAddress"), args.walletAddress))
        .first();
    }

    if (!user) {
      return { hasCompanyName: false, companyName: null };
    }

    return {
      hasCompanyName: !!user.corporationName,
      companyName: user.corporationName || null,
    };
  },
});

/**
 * Set company name for a user
 * Simpler version that doesn't require session token (for CompanyNameModal)
 * Uses walletAddress as the identifier (actually stake address in Phase II)
 */
export const setCompanyName = mutation({
  args: {
    walletAddress: v.string(), // Actually stake address now
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.companyName.trim();

    // Validation
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Corporation name must be at least 2 characters" };
    }

    if (trimmedName.length > 30) {
      return { success: false, error: "Corporation name must be 30 characters or less" };
    }

    // Find user by stake address
    let user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
      .first();

    // Fallback: try legacy wallet address if stake address not found
    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("walletAddress"), args.walletAddress))
        .first();
    }

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const nameLower = trimmedName.toLowerCase();

    // Check if name is already taken (case-insensitive)
    const existingWithName = await ctx.db
      .query("users")
      .withIndex("by_corporation_name_lower", (q: any) => q.eq("corporationNameLower", nameLower))
      .first();

    if (existingWithName && existingWithName._id !== user._id) {
      return { success: false, error: "This corporation name is already taken" };
    }

    // Update the user's corporation name
    await ctx.db.patch(user._id, {
      corporationName: trimmedName,
      corporationNameLower: nameLower,
      updatedAt: Date.now(),
    });

    return { success: true, companyName: trimmedName };
  },
});

// =============================================================================
// PHASE II: CORPORATION CREATION WITH AUTOMATIC VERIFICATION
// =============================================================================

/**
 * Internal mutation to sync meks ownership from blockchain verification
 * Updates the meks table to assign ownership to the verified wallet
 */
export const syncMeksOwnership = mutation({
  args: {
    stakeAddress: v.string(),
    verifiedMeks: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      mekNumber: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let synced = 0;
    let notFound = 0;

    for (const mek of args.verifiedMeks) {
      // Find the mek in database by assetId
      const existingMek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", mek.assetId))
        .first();

      if (existingMek) {
        // Update ownership
        await ctx.db.patch(existingMek._id, {
          owner: args.stakeAddress,
          ownerStakeAddress: args.stakeAddress,
          lastUpdated: now,
        });
        synced++;
      } else {
        // Mek not in database - log but don't fail
        console.warn(`[syncMeksOwnership] Mek ${mek.assetId} not found in database`);
        notFound++;
      }
    }

    console.log(`[syncMeksOwnership] Synced ${synced} meks, ${notFound} not found`);
    return { synced, notFound };
  },
});

/**
 * Internal mutation to clear meks ownership for a wallet
 * Used before re-syncing to handle meks that were transferred away
 */
export const clearMeksOwnership = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all meks currently owned by this wallet
    const ownedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    let cleared = 0;
    for (const mek of ownedMeks) {
      await ctx.db.patch(mek._id, {
        owner: "",
        ownerStakeAddress: undefined,
      });
      cleared++;
    }

    console.log(`[clearMeksOwnership] Cleared ownership on ${cleared} meks`);
    return { cleared };
  },
});

/**
 * PHASE II: Create corporation with automatic blockchain verification
 *
 * This ACTION is called when user submits their corporation name.
 * It automatically:
 * 1. Validates the corporation name
 * 2. Calls Blockfrost to verify NFT ownership
 * 3. Syncs verified meks to the meks table
 * 4. Sets the corporation name
 * 5. Marks the wallet as verified
 *
 * If Blockfrost is down, returns a clear error message.
 * Users with 0 meks are still allowed to create corporations.
 */
export const createCorporationWithVerification = action({
  args: {
    stakeAddress: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    error?: string;
    companyName?: string;
    mekCount?: number;
    walletVerified?: boolean;
    blockfrostDown?: boolean;
  }> => {
    console.log("[createCorporationWithVerification] Starting for:", args.stakeAddress.substring(0, 20) + "...");
    console.log("[createCorporationWithVerification] Company name:", args.companyName);

    // STEP 1: Validate company name format
    const trimmedName = args.companyName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Corporation name must be at least 2 characters" };
    }
    if (trimmedName.length > 30) {
      return { success: false, error: "Corporation name must be 30 characters or less" };
    }

    // STEP 2: Check if name is available (call the mutation internally)
    const nameCheckResult: any = await ctx.runQuery(api.corporationAuth.checkCompanyNameAvailability, {
      companyName: trimmedName,
      currentWalletAddress: args.stakeAddress,
    });

    if (!nameCheckResult.available && !nameCheckResult.isCurrentName) {
      return { success: false, error: nameCheckResult.error || "Corporation name is not available" };
    }

    // STEP 3: Fetch meks from blockchain via Blockfrost
    console.log("[createCorporationWithVerification] Calling Blockfrost...");
    let blockchainMeks: any[] = [];
    let blockfrostSuccess = false;

    try {
      const blockfrostResult: any = await ctx.runAction(api.blockfrostService.getWalletAssets, {
        stakeAddress: args.stakeAddress,
      });

      if (blockfrostResult.success && blockfrostResult.meks) {
        blockchainMeks = blockfrostResult.meks;
        blockfrostSuccess = true;
        console.log(`[createCorporationWithVerification] Blockfrost found ${blockchainMeks.length} meks`);
      } else {
        console.error("[createCorporationWithVerification] Blockfrost returned error:", blockfrostResult.error);
        throw new Error(blockfrostResult.error || "Blockfrost verification failed");
      }
    } catch (blockfrostError: any) {
      console.error("[createCorporationWithVerification] Blockfrost exception:", blockfrostError.message);

      // Return user-friendly error for Blockfrost being down
      return {
        success: false,
        error: "Blockchain verification is temporarily unavailable. Blockfrost (our verification service) is currently down, which is out of our control and very rare. Please check back in a few minutes and try again.",
        blockfrostDown: true,
      };
    }

    // STEP 4: Clear any existing meks ownership for this wallet (handles transfers)
    console.log("[createCorporationWithVerification] Clearing existing ownership...");
    await ctx.runMutation(api.corporationAuth.clearMeksOwnership, {
      stakeAddress: args.stakeAddress,
    });

    // STEP 5: Sync verified meks to database
    if (blockchainMeks.length > 0) {
      console.log("[createCorporationWithVerification] Syncing", blockchainMeks.length, "meks...");

      const meksToSync = blockchainMeks.map((m: any) => ({
        assetId: m.assetId,
        assetName: m.assetName || `Mek #${m.mekNumber}`,
        mekNumber: m.mekNumber,
      }));

      await ctx.runMutation(api.corporationAuth.syncMeksOwnership, {
        stakeAddress: args.stakeAddress,
        verifiedMeks: meksToSync,
      });
    }

    // STEP 6: Set corporation name
    console.log("[createCorporationWithVerification] Setting corporation name...");
    const nameResult: any = await ctx.runMutation(api.corporationAuth.setCompanyName, {
      walletAddress: args.stakeAddress,
      companyName: trimmedName,
    });

    if (!nameResult.success) {
      return { success: false, error: nameResult.error || "Failed to set corporation name" };
    }

    // STEP 7: Mark wallet as verified
    console.log("[createCorporationWithVerification] Marking wallet as verified...");
    await ctx.runMutation(api.blockchainVerification.markWalletAsVerified, {
      walletAddress: args.stakeAddress,
    });

    console.log("[createCorporationWithVerification] SUCCESS!");
    return {
      success: true,
      companyName: trimmedName,
      mekCount: blockchainMeks.length,
      walletVerified: true,
    };
  },
});
