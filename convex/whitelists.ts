import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// WHITELIST CRITERIA MANAGEMENT
// ============================================================================

export const getAllCriteria = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("whitelistCriteria").collect();
  },
});

export const getCriteriaByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whitelistCriteria")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const addCriteria = mutation({
  args: {
    field: v.string(),
    displayName: v.string(),
    dataType: v.union(
      v.literal("number"),
      v.literal("boolean"),
      v.literal("string"),
      v.literal("date")
    ),
    description: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whitelistCriteria")
      .withIndex("by_field", (q) => q.eq("field", args.field))
      .first();

    if (existing) {
      throw new Error(`Criteria with field "${args.field}" already exists`);
    }

    const criteriaId = await ctx.db.insert("whitelistCriteria", {
      field: args.field,
      displayName: args.displayName,
      dataType: args.dataType,
      description: args.description,
      category: args.category,
      createdAt: Date.now(),
    });

    return criteriaId;
  },
});

export const deleteCriteria = mutation({
  args: { criteriaId: v.id("whitelistCriteria") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.criteriaId);
  },
});

// ============================================================================
// WHITELIST MANAGEMENT
// ============================================================================

export const getAllWhitelists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("whitelists").order("desc").collect();
  },
});

export const getWhitelistById = query({
  args: { whitelistId: v.id("whitelists") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.whitelistId);
  },
});

export const getWhitelistByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whitelists")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const createWhitelist = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    rules: v.array(v.object({
      criteriaField: v.string(),
      operator: v.union(
        v.literal("greater_than"),
        v.literal("less_than"),
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("greater_or_equal"),
        v.literal("less_or_equal"),
        v.literal("contains")
      ),
      value: v.any(),
    })),
    ruleLogic: v.union(v.literal("AND"), v.literal("OR")),
    autoRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whitelists")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Whitelist with name "${args.name}" already exists`);
    }

    const whitelistId = await ctx.db.insert("whitelists", {
      name: args.name,
      description: args.description,
      rules: args.rules,
      ruleLogic: args.ruleLogic,
      eligibleUsers: [],
      userCount: 0,
      lastGenerated: 0,
      autoRefresh: args.autoRefresh ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return whitelistId;
  },
});

export const updateWhitelist = mutation({
  args: {
    whitelistId: v.id("whitelists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    rules: v.optional(v.array(v.object({
      criteriaField: v.string(),
      operator: v.union(
        v.literal("greater_than"),
        v.literal("less_than"),
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("greater_or_equal"),
        v.literal("less_or_equal"),
        v.literal("contains")
      ),
      value: v.any(),
    }))),
    ruleLogic: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
    autoRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.rules !== undefined) updates.rules = args.rules;
    if (args.ruleLogic !== undefined) updates.ruleLogic = args.ruleLogic;
    if (args.autoRefresh !== undefined) updates.autoRefresh = args.autoRefresh;

    await ctx.db.patch(args.whitelistId, updates);
  },
});

export const deleteWhitelist = mutation({
  args: { whitelistId: v.id("whitelists") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.whitelistId);
  },
});

// ============================================================================
// MANUAL WHITELIST CREATION
// ============================================================================

/**
 * Create a manual whitelist by directly providing stake addresses
 * Used for testing and one-off NFT distributions
 *
 * IMPORTANT: Accepts ONLY stake addresses (stake1... or stake_test1...)
 * - Payment addresses (addr1...) will be REJECTED with clear error message
 * - Stake addresses define eligibility (who can see the claim button)
 * - NMKR collects payment addresses during checkout for NFT delivery
 *
 * Format: One stake address per line
 */
export const createManualWhitelist = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    addresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate name
    const existing = await ctx.db
      .query("whitelists")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Whitelist with name "${args.name}" already exists`);
    }

    // Parse addresses - ONLY stake addresses allowed
    const invalidAddresses: string[] = [];
    const paymentAddressesFound: string[] = [];
    const validUsers: Array<{ stakeAddress: string; displayName?: string }> = [];

    for (const line of args.addresses) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines

      // Check if this is a stake address
      if (trimmedLine.startsWith('stake1') || trimmedLine.startsWith('stake_test1')) {
        validUsers.push({
          stakeAddress: trimmedLine,
          displayName: undefined,
        });
      }
      // Reject payment addresses with helpful error
      else if (trimmedLine.startsWith('addr1') || trimmedLine.startsWith('addr_test1')) {
        paymentAddressesFound.push(trimmedLine);
      }
      // Unknown format
      else {
        invalidAddresses.push(trimmedLine);
      }
    }

    // Report payment addresses found (helpful error)
    if (paymentAddressesFound.length > 0) {
      const preview = paymentAddressesFound.slice(0, 2).map(a => a.substring(0, 20) + '...').join(', ');
      const more = paymentAddressesFound.length > 2 ? ` (+${paymentAddressesFound.length - 2} more)` : '';
      throw new Error(
        `Payment addresses not allowed (${paymentAddressesFound.length} found): ${preview}${more}. Please use STAKE addresses (stake1... or stake_test1...) only. NMKR collects payment addresses during checkout.`
      );
    }

    // Report other invalid addresses
    if (invalidAddresses.length > 0) {
      const preview = invalidAddresses.slice(0, 3).join(', ');
      const more = invalidAddresses.length > 3 ? ` (+${invalidAddresses.length - 3} more)` : '';
      throw new Error(
        `Invalid addresses found (${invalidAddresses.length}): ${preview}${more}. Only stake addresses (stake1... or stake_test1...) are allowed.`
      );
    }

    if (validUsers.length === 0) {
      throw new Error('No valid stake addresses provided. Please paste stake addresses (stake1... or stake_test1...) one per line.');
    }

    // Create manual whitelist with empty rules (indicates manual type)
    const whitelistId = await ctx.db.insert("whitelists", {
      name: args.name,
      description: args.description,
      rules: [], // Empty rules = manual whitelist
      ruleLogic: "AND",
      eligibleUsers: validUsers,
      userCount: validUsers.length,
      lastGenerated: Date.now(),
      autoRefresh: false, // Manual whitelists don't auto-refresh
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[Manual Whitelist] Created "${args.name}" with ${validUsers.length} stake addresses`);

    return { whitelistId, userCount: validUsers.length };
  },
});

// ============================================================================
// WHITELIST GENERATION
// ============================================================================

export const generateWhitelist = mutation({
  args: { whitelistId: v.id("whitelists") },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    // Phase II: Get all users from users table
    const allUsers = await ctx.db.query("users").collect();

    console.log(`[Whitelist Generation] Starting for "${whitelist.name}"`);
    console.log(`[Whitelist Generation] Total users found: ${allUsers.length}`);
    console.log(`[Whitelist Generation] Rules:`, whitelist.rules);

    // IMPORTANT: eligibleUsers contains ONLY stake addresses
    const eligibleUsers: Array<{
      stakeAddress: string;
      displayName?: string;
    }> = [];

    // Build mek count map for efficient lookup
    const allMeks = await ctx.db.query("meks").collect();
    const mekCountByOwner = new Map<string, number>();
    for (const mek of allMeks) {
      const owner = mek.ownerStakeAddress || mek.owner;
      if (owner) {
        mekCountByOwner.set(owner, (mekCountByOwner.get(owner) || 0) + 1);
      }
    }

    let debugCount = 0;
    for (const user of allUsers) {
      if (!user.stakeAddress) continue;

      // Phase II: Gold is stored in users.gold
      const currentGold = user.gold || 0;

      // Build user data object for rule checking
      const userData: any = {
        goldBalance: currentGold,
        totalGoldEarned: currentGold, // Phase II: cumulative tracking TBD
        mekCount: mekCountByOwner.get(user.stakeAddress) || 0,
        genesisMekCount: 0, // Genesis meks tracking TBD
        totalPlayTime: 0, // Playtime tracking TBD
        walletAddress: user.stakeAddress,
      };

      let isEligible = whitelist.ruleLogic === "AND";

      for (const rule of whitelist.rules) {
        const userValue = userData[rule.criteriaField];
        const ruleValue = parseFloat(rule.value) || rule.value;

        let rulePasses = false;

        switch (rule.operator) {
          case "greater_than":
            rulePasses = userValue > ruleValue;
            break;
          case "less_than":
            rulePasses = userValue < ruleValue;
            break;
          case "equals":
            rulePasses = userValue === ruleValue;
            break;
          case "not_equals":
            rulePasses = userValue !== ruleValue;
            break;
          case "greater_or_equal":
            rulePasses = userValue >= ruleValue;
            break;
          case "less_or_equal":
            rulePasses = userValue <= ruleValue;
            break;
          case "contains":
            if (typeof userValue === "string") {
              rulePasses = userValue.includes(ruleValue);
            }
            break;
        }

        if (whitelist.ruleLogic === "AND") {
          if (!rulePasses) {
            isEligible = false;
            break;
          }
        } else {
          if (rulePasses) {
            isEligible = true;
            break;
          }
        }
      }

      // Debug first 5 users
      if (debugCount < 5) {
        console.log(`[Whitelist Debug ${debugCount + 1}] Wallet: ${user.stakeAddress?.substring(0, 20)}...`);
        console.log(`  - Gold: ${currentGold}`);
        console.log(`  - isEligible: ${isEligible}`);
        debugCount++;
      }

      if (isEligible) {
        eligibleUsers.push({
          stakeAddress: user.stakeAddress,
          displayName: user.corporationName || undefined,
        });
      }
    }

    console.log(`[Whitelist Generation] Eligible users found: ${eligibleUsers.length}`);

    await ctx.db.patch(args.whitelistId, {
      eligibleUsers,
      userCount: eligibleUsers.length,
      lastGenerated: Date.now(),
      updatedAt: Date.now(),
    });

    return { userCount: eligibleUsers.length };
  },
});

export const getWhitelistEligibleUsers = query({
  args: { whitelistId: v.id("whitelists") },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    return whitelist.eligibleUsers;
  },
});

export const searchCompanyNames = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm || args.searchTerm.length < 2) {
      return [];
    }

    // Phase II: Use users table instead of goldMining
    const allUsers = await ctx.db.query("users").collect();

    const searchLower = args.searchTerm.toLowerCase();
    const matches = allUsers
      .filter(user =>
        user.corporationName &&
        user.corporationName.toLowerCase().includes(searchLower) &&
        user.stakeAddress
      )
      .map(user => ({
        companyName: user.corporationName!,
        walletAddress: user.stakeAddress!,
      }))
      .slice(0, 10); // Limit to 10 results

    return matches;
  },
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// ============================================================================
// MANUAL WHITELIST USER MANAGEMENT
// ============================================================================

export const removeUserFromWhitelist = mutation({
  args: {
    whitelistId: v.id("whitelists"),
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    const updatedUsers = whitelist.eligibleUsers.filter(
      (user) => user.stakeAddress !== args.stakeAddress
    );

    await ctx.db.patch(args.whitelistId, {
      eligibleUsers: updatedUsers,
      userCount: updatedUsers.length,
      updatedAt: Date.now(),
    });

    return { success: true, newCount: updatedUsers.length };
  },
});

export const clearAllUsersFromWhitelist = mutation({
  args: {
    whitelistId: v.id("whitelists"),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    const previousCount = whitelist.userCount;

    await ctx.db.patch(args.whitelistId, {
      eligibleUsers: [],
      userCount: 0,
      updatedAt: Date.now(),
    });

    console.log(`[Whitelist] Cleared all ${previousCount} users from whitelist "${whitelist.name}"`);

    return { success: true, clearedCount: previousCount };
  },
});

export const addUserToWhitelistByCompanyName = mutation({
  args: {
    whitelistId: v.id("whitelists"),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    // Phase II: Find user by company name in users table
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("corporationName"), args.companyName))
      .first();

    if (!user) {
      throw new Error(`No user found with company name "${args.companyName}"`);
    }

    if (!user.stakeAddress) {
      throw new Error(`User "${args.companyName}" has no stake address`);
    }

    // Check if already in whitelist
    const alreadyExists = whitelist.eligibleUsers.some(
      (u) => u.stakeAddress === user.stakeAddress
    );

    if (alreadyExists) {
      throw new Error(`User "${args.companyName}" is already in this whitelist`);
    }

    // Add user
    const updatedUsers = [
      ...whitelist.eligibleUsers,
      {
        stakeAddress: user.stakeAddress,
        displayName: user.corporationName || undefined,
      },
    ];

    await ctx.db.patch(args.whitelistId, {
      eligibleUsers: updatedUsers,
      userCount: updatedUsers.length,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newCount: updatedUsers.length,
      addedUser: {
        stakeAddress: user.stakeAddress,
        displayName: user.corporationName,
      },
    };
  },
});

export const addUserToWhitelistByAddress = mutation({
  args: {
    whitelistId: v.id("whitelists"),
    stakeAddress: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    // Validate stake address format
    const trimmedAddress = args.stakeAddress.trim();
    const normalizedAddress = trimmedAddress.toLowerCase();
    if (!trimmedAddress.startsWith('stake1') && !trimmedAddress.startsWith('stake_test1')) {
      // Reject payment addresses with helpful error
      if (trimmedAddress.startsWith('addr1') || trimmedAddress.startsWith('addr_test1')) {
        throw new Error("Payment addresses not allowed. Please use STAKE addresses (stake1... or stake_test1...) only. NMKR collects payment addresses during checkout.");
      }
      throw new Error("Invalid stake address format. Address must start with 'stake1' or 'stake_test1'.");
    }

    // Check if already in whitelist
    const alreadyExists = whitelist.eligibleUsers.some(
      (user) => user.stakeAddress === trimmedAddress || user.stakeAddress?.toLowerCase() === normalizedAddress
    );

    if (alreadyExists) {
      throw new Error(`Stake address ${trimmedAddress.substring(0, 15)}... is already in this whitelist`);
    }

    // Auto-lookup display name if not provided
    let resolvedDisplayName = args.displayName?.trim();

    if (!resolvedDisplayName) {
      // Try to find display name from active tables

      // 1. Check phase1Veterans table (42 original P1 beta testers)
      const veteran = await ctx.db
        .query("phase1Veterans")
        .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
        .first();
      if (veteran) {
        resolvedDisplayName = veteran.reservedCorporationName || veteran.originalCorporationName;
      }

      // 2. Check users table (Phase 2 users)
      if (!resolvedDisplayName) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", normalizedAddress))
          .first();
        if (user?.corporationName) {
          resolvedDisplayName = user.corporationName;
        }
      }
    }

    // Add user
    const updatedUsers = [
      ...whitelist.eligibleUsers,
      {
        stakeAddress: trimmedAddress,
        displayName: resolvedDisplayName || undefined,
      },
    ];

    await ctx.db.patch(args.whitelistId, {
      eligibleUsers: updatedUsers,
      userCount: updatedUsers.length,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newCount: updatedUsers.length,
      addedUser: {
        stakeAddress: trimmedAddress,
        displayName: resolvedDisplayName,
      },
    };
  },
});

export const initializeDefaultCriteria = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("whitelistCriteria").first();
    if (existing) {
      return { message: "Criteria already initialized" };
    }

    const defaultCriteria = [
      {
        field: "goldBalance",
        displayName: "Gold Balance",
        dataType: "number" as const,
        description: "Player's current gold balance",
        category: "Resources",
      },
      {
        field: "totalGoldEarned",
        displayName: "Total Gold Earned",
        dataType: "number" as const,
        description: "Lifetime gold earned by player",
        category: "Resources",
      },
      {
        field: "mekCount",
        displayName: "Mek Count",
        dataType: "number" as const,
        description: "Number of Meks owned",
        category: "NFTs",
      },
      {
        field: "genesisMekCount",
        displayName: "Genesis Mek Count",
        dataType: "number" as const,
        description: "Number of Genesis Meks owned",
        category: "NFTs",
      },
      {
        field: "totalPlayTime",
        displayName: "Total Play Time",
        dataType: "number" as const,
        description: "Total time spent playing (seconds)",
        category: "Progress",
      },
    ];

    for (const criteria of defaultCriteria) {
      await ctx.db.insert("whitelistCriteria", {
        ...criteria,
        createdAt: Date.now(),
      });
    }

    return { message: "Default criteria initialized", count: defaultCriteria.length };
  },
});

// ============================================================================
// WHITELIST SNAPSHOT MANAGEMENT
// ============================================================================

/**
 * Create a snapshot of a whitelist's current eligible users
 * Snapshots are frozen in time and never change
 */
export const createSnapshot = mutation({
  args: {
    whitelistId: v.id("whitelists"),
    snapshotName: v.string(),
    description: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    // Create frozen snapshot of current eligible users
    const snapshotId = await ctx.db.insert("whitelistSnapshots", {
      whitelistId: args.whitelistId,
      whitelistName: whitelist.name,
      snapshotName: args.snapshotName,
      description: args.description,
      eligibleUsers: whitelist.eligibleUsers,
      userCount: whitelist.userCount,
      rulesSnapshot: whitelist.rules.map(r => ({
        criteriaField: r.criteriaField,
        operator: r.operator,
        value: r.value,
      })),
      ruleLogic: whitelist.ruleLogic,
      takenAt: Date.now(),
      createdBy: args.createdBy,
    });

    console.log(`[Whitelist Snapshot] Created snapshot "${args.snapshotName}" for whitelist "${whitelist.name}" with ${whitelist.userCount} users`);

    return { snapshotId, userCount: whitelist.userCount };
  },
});

/**
 * Get all snapshots for a specific whitelist
 */
export const getSnapshotsByWhitelist = query({
  args: { whitelistId: v.id("whitelists") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whitelistSnapshots")
      .withIndex("by_whitelist", (q) => q.eq("whitelistId", args.whitelistId))
      .order("desc")
      .collect();
  },
});

/**
 * Get all snapshots (for dropdown selection in minting)
 */
export const getAllSnapshots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("whitelistSnapshots")
      .order("desc")
      .collect();
  },
});

/**
 * Alias for getAllSnapshots - used by commemorative token admin
 */
export const getAllWhitelistSnapshots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("whitelistSnapshots")
      .order("desc")
      .collect();
  },
});

/**
 * Get a specific snapshot by ID
 */
export const getSnapshotById = query({
  args: { snapshotId: v.id("whitelistSnapshots") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.snapshotId);
  },
});

/**
 * Delete a snapshot
 */
export const deleteSnapshot = mutation({
  args: { snapshotId: v.id("whitelistSnapshots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.snapshotId);
    console.log(`[Whitelist Snapshot] Deleted snapshot ${args.snapshotId}`);
  },
});
