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

    // Get all users with their gold mining data
    const allGoldMiners = await ctx.db.query("goldMining").collect();
    const now = Date.now();

    console.log(`[Whitelist Generation] Starting for "${whitelist.name}"`);
    console.log(`[Whitelist Generation] Total miners found: ${allGoldMiners.length}`);
    console.log(`[Whitelist Generation] Rules:`, whitelist.rules);

    // IMPORTANT: eligibleUsers contains ONLY stake addresses
    // goldMining.walletAddress already stores stake addresses from the game
    const eligibleUsers: Array<{
      stakeAddress: string;
      displayName?: string;
    }> = [];

    let debugCount = 0;
    for (const miner of allGoldMiners) {
      // Calculate current gold including accumulated
      // Check both new field (accumulatedGold) and legacy field (currentGold)
      let currentGold = miner.accumulatedGold || miner.currentGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = (miner.totalGoldPerHour || 0) * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || miner.currentGold || 0) + goldSinceLastUpdate;
      }

      // Build user data object for rule checking
      const userData: any = {
        goldBalance: currentGold,
        totalGoldEarned: miner.totalCumulativeGold || currentGold,
        mekCount: miner.mekCount || 0,
        genesisMekCount: miner.genesisMekCount || 0,
        totalPlayTime: miner.totalPlayTime || 0,
        walletAddress: miner.walletAddress,
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
        console.log(`[Whitelist Debug ${debugCount + 1}] Wallet: ${miner.walletAddress?.substring(0, 20)}...`);
        console.log(`  - Gold: ${currentGold}`);
        console.log(`  - isEligible: ${isEligible}`);
        debugCount++;
      }

      if (isEligible && miner.walletAddress) {
        // goldMining.walletAddress already contains stake addresses
        eligibleUsers.push({
          stakeAddress: miner.walletAddress,
          displayName: miner.companyName || undefined,
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

    const allMiners = await ctx.db.query("goldMining").collect();

    const searchLower = args.searchTerm.toLowerCase();
    const matches = allMiners
      .filter(miner =>
        miner.companyName &&
        miner.companyName.toLowerCase().includes(searchLower) &&
        miner.walletAddress
      )
      .map(miner => ({
        companyName: miner.companyName!,
        walletAddress: miner.walletAddress!,
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

    return { success: true, deletedCount: previousCount };
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

    // Find user by company name
    const miner = await ctx.db
      .query("goldMining")
      .filter((q) => q.eq(q.field("companyName"), args.companyName))
      .first();

    if (!miner) {
      throw new Error(`No user found with company name "${args.companyName}"`);
    }

    if (!miner.walletAddress) {
      throw new Error(`User "${args.companyName}" has no wallet address`);
    }

    // Check if already in whitelist
    const alreadyExists = whitelist.eligibleUsers.some(
      (user) => user.stakeAddress === miner.walletAddress
    );

    if (alreadyExists) {
      throw new Error(`User "${args.companyName}" is already in this whitelist`);
    }

    // Add user (miner.walletAddress is already a stake address)
    const updatedUsers = [
      ...whitelist.eligibleUsers,
      {
        stakeAddress: miner.walletAddress,
        displayName: miner.companyName || undefined,
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
        stakeAddress: miner.walletAddress,
        displayName: miner.companyName,
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
    if (!trimmedAddress.startsWith('stake1') && !trimmedAddress.startsWith('stake_test1')) {
      // Reject payment addresses with helpful error
      if (trimmedAddress.startsWith('addr1') || trimmedAddress.startsWith('addr_test1')) {
        throw new Error("Payment addresses not allowed. Please use STAKE addresses (stake1... or stake_test1...) only. NMKR collects payment addresses during checkout.");
      }
      throw new Error("Invalid stake address format. Address must start with 'stake1' or 'stake_test1'.");
    }

    // Check if already in whitelist
    const alreadyExists = whitelist.eligibleUsers.some(
      (user) => user.stakeAddress === trimmedAddress
    );

    if (alreadyExists) {
      throw new Error(`Stake address ${trimmedAddress.substring(0, 15)}... is already in this whitelist`);
    }

    // Add user
    const updatedUsers = [
      ...whitelist.eligibleUsers,
      {
        stakeAddress: trimmedAddress,
        displayName: args.displayName?.trim() || undefined,
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
        displayName: args.displayName?.trim(),
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
