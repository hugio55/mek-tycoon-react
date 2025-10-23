import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// OPTIMIZED MEK QUERIES - Minimizing Database Calls & Network Overhead
// ============================================================================

// ----------------------------------------------------------------------------
// LEAN QUERIES - Return only essential fields to reduce bandwidth
// ----------------------------------------------------------------------------

// Get a single Mek by ID
export const getMekById = query({
  args: { mekId: v.id("meks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mekId);
  },
});

// Get meks for a specific owner - LEAN version for list views
export const getMeksByOwner = query({
  args: { owner: v.string() },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .collect();
    
    // Return only essential fields to reduce bandwidth by ~70%
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
      traitVariation: mek.traitVariation,
      level: mek.level || 1,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      gameRank: mek.gameRank || mek.rarityRank || 9999,
      rarityTier: mek.rarityTier || "Common",
      powerScore: mek.powerScore || 100,
      iconUrl: mek.iconUrl,
      sourceKeyBase: mek.sourceKeyBase,
      owner: mek.owner,
    }));
  },
});

// Get meks with pagination - Essential for large collections
export const getMeksPaginated = query({
  args: { 
    owner: v.string(),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("rarityRank"),
      v.literal("powerScore"),
      v.literal("level"),
      v.literal("assetName")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const page = args.page || 1;
    const pageSize = Math.min(args.pageSize || 20, 100); // Cap at 100 for performance
    const skip = (page - 1) * pageSize;
    
    // Get all meks for the owner
    const allMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .collect();
    
    // Sort meks
    const sortedMeks = [...allMeks].sort((a, b) => {
      const field = args.sortBy || "rarityRank";
      const order = args.sortOrder || "asc";
      
      let aVal = a[field as keyof typeof a];
      let bVal = b[field as keyof typeof b];
      
      // Handle undefined/null values
      if (aVal === undefined || aVal === null) aVal = field === "rarityRank" ? 9999 : 0;
      if (bVal === undefined || bVal === null) bVal = field === "rarityRank" ? 9999 : 0;
      
      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Paginate
    const paginatedMeks = sortedMeks.slice(skip, skip + pageSize);
    
    // Return lean data with pagination metadata
    return {
      meks: paginatedMeks.map(mek => ({
        _id: mek._id,
        assetId: mek.assetId,
        assetName: mek.assetName,
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        level: mek.level || 1,
        rarityRank: mek.rarityRank || mek.gameRank || 9999,
        gameRank: mek.gameRank || mek.rarityRank || 9999,
        rarityTier: mek.rarityTier || "Common",
        powerScore: mek.powerScore || 100,
        iconUrl: mek.iconUrl,
        sourceKeyBase: mek.sourceKeyBase,
      })),
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalItems: allMeks.length,
        totalPages: Math.ceil(allMeks.length / pageSize),
        hasNextPage: page < Math.ceil(allMeks.length / pageSize),
        hasPrevPage: page > 1,
      }
    };
  },
});

// ----------------------------------------------------------------------------
// DETAIL QUERIES - Full data for individual meks
// ----------------------------------------------------------------------------

// Get complete mek details by asset ID
export const getMekByAssetId = query({
  args: { assetId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
  },
});

// ----------------------------------------------------------------------------
// SEARCH & FILTER QUERIES - Optimized for specific lookups
// ----------------------------------------------------------------------------

// Search meks by variation combinations
export const searchMeks = query({
  args: {
    headVariation: v.optional(v.string()),
    bodyVariation: v.optional(v.string()),
    rarityTier: v.optional(v.string()),
    minLevel: v.optional(v.number()),
    maxLevel: v.optional(v.number()),
    owner: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    // Use appropriate index based on search criteria
    if (args.owner) {
      results = await ctx.db.query("meks")
        .withIndex("by_owner", (q) => q.eq("owner", args.owner!))
        .collect();
    } else if (args.rarityTier) {
      results = await ctx.db.query("meks")
        .withIndex("by_rarity", (q) => q.eq("rarityTier", args.rarityTier!))
        .collect();
    } else if (args.headVariation) {
      results = await ctx.db.query("meks")
        .withIndex("by_head", (q) => q.eq("headVariation", args.headVariation!))
        .collect();
    } else if (args.bodyVariation) {
      results = await ctx.db.query("meks")
        .withIndex("by_body", (q) => q.eq("bodyVariation", args.bodyVariation!))
        .collect();
    } else {
      results = await ctx.db.query("meks").collect();
    }
    
    // Apply additional filters
    let filtered = results;
    
    if (args.headVariation && !query.toString().includes("by_head")) {
      filtered = filtered.filter(m => m.headVariation === args.headVariation);
    }
    if (args.bodyVariation && !query.toString().includes("by_body")) {
      filtered = filtered.filter(m => m.bodyVariation === args.bodyVariation);
    }
    if (args.rarityTier && !query.toString().includes("by_rarity")) {
      filtered = filtered.filter(m => m.rarityTier === args.rarityTier);
    }
    if (args.minLevel !== undefined) {
      filtered = filtered.filter(m => (m.level || 1) >= args.minLevel!);
    }
    if (args.maxLevel !== undefined) {
      filtered = filtered.filter(m => (m.level || 1) <= args.maxLevel!);
    }
    
    // Apply limit
    const limit = Math.min(args.limit || 50, 100);
    const limited = filtered.slice(0, limit);
    
    // Return lean results
    return limited.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      level: mek.level || 1,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      rarityTier: mek.rarityTier || "Common",
      powerScore: mek.powerScore || 100,
      iconUrl: mek.iconUrl,
      sourceKeyBase: mek.sourceKeyBase,
      owner: mek.owner,
    }));
  },
});

// Get top meks by power score - Efficient leaderboard query
export const getTopMeksByPower = query({
  args: { 
    limit: v.optional(v.number()),
    includeOwner: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 100);
    
    const topMeks = await ctx.db
      .query("meks")
      .withIndex("by_power")
      .order("desc")
      .take(limit);
    
    // Return lean data for leaderboard
    return topMeks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      powerScore: mek.powerScore || 100,
      level: mek.level || 1,
      rarityTier: mek.rarityTier || "Common",
      iconUrl: mek.iconUrl,
      owner: args.includeOwner ? mek.owner : undefined,
    }));
  },
});

// ----------------------------------------------------------------------------
// AGGREGATION QUERIES - Get stats without fetching all documents
// ----------------------------------------------------------------------------

// Get mek statistics for an owner
export const getOwnerMekStats = query({
  args: { owner: v.string() },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner))
      .collect();
    
    // Calculate stats efficiently
    const stats = {
      totalMeks: meks.length,
      rarityDistribution: {} as Record<string, number>,
      averageLevel: 0,
      averagePowerScore: 0,
      topPowerScore: 0,
      uniqueHeads: new Set<string>(),
      uniqueBodies: new Set<string>(),
    };
    
    let totalLevel = 0;
    let totalPower = 0;
    
    for (const mek of meks) {
      // Rarity distribution
      const tier = mek.rarityTier || "Common";
      stats.rarityDistribution[tier] = (stats.rarityDistribution[tier] || 0) + 1;
      
      // Averages
      totalLevel += mek.level || 1;
      const power = mek.powerScore || 100;
      totalPower += power;
      
      // Top power
      if (power > stats.topPowerScore) {
        stats.topPowerScore = power;
      }
      
      // Unique variations
      if (mek.headVariation) stats.uniqueHeads.add(mek.headVariation);
      if (mek.bodyVariation) stats.uniqueBodies.add(mek.bodyVariation);
    }
    
    // Calculate averages
    if (meks.length > 0) {
      stats.averageLevel = Math.round(totalLevel / meks.length);
      stats.averagePowerScore = Math.round(totalPower / meks.length);
    }
    
    return {
      totalMeks: stats.totalMeks,
      rarityDistribution: stats.rarityDistribution,
      averageLevel: stats.averageLevel,
      averagePowerScore: stats.averagePowerScore,
      topPowerScore: stats.topPowerScore,
      uniqueHeadVariations: stats.uniqueHeads.size,
      uniqueBodyVariations: stats.uniqueBodies.size,
    };
  },
});

// ----------------------------------------------------------------------------
// BATCH OPERATIONS - Reduce multiple calls to single transactions
// ----------------------------------------------------------------------------

// Update multiple meks in a single transaction
export const batchUpdateMeks = mutation({
  args: {
    updates: v.array(v.object({
      mekId: v.id("meks"),
      level: v.optional(v.number()),
      experience: v.optional(v.number()),
      powerScore: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const update of args.updates) {
      try {
        const mek = await ctx.db.get(update.mekId);
        if (!mek) {
          results.failed++;
          results.errors.push(`Mek ${update.mekId} not found`);
          continue;
        }
        
        const updateData: any = {};
        if (update.level !== undefined) updateData.level = update.level;
        if (update.experience !== undefined) updateData.experience = update.experience;
        if (update.powerScore !== undefined) updateData.powerScore = update.powerScore;
        
        await ctx.db.patch(update.mekId, updateData);
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update ${update.mekId}: ${error}`);
      }
    }
    
    return results;
  },
});

// Update single mek stats (legacy support)
export const updateMekStats = mutation({
  args: {
    assetId: v.string(),
    stats: v.object({
      level: v.optional(v.number()),
      experience: v.optional(v.number()),
      health: v.optional(v.number()),
      maxHealth: v.optional(v.number()),
      speed: v.optional(v.number()),
      powerScore: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
    
    if (!mek) {
      throw new Error("Mek not found");
    }
    
    await ctx.db.patch(mek._id, args.stats);
    return { success: true, mekId: mek._id };
  },
});

// Transfer mek ownership
export const transferMek = mutation({
  args: {
    assetId: v.string(),
    newOwner: v.string(),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.assetId))
      .first();
    
    if (!mek) {
      throw new Error("Mek not found");
    }
    
    const oldOwner = mek.owner;
    await ctx.db.patch(mek._id, { owner: args.newOwner });
    
    return {
      success: true,
      mekId: mek._id,
      oldOwner,
      newOwner: args.newOwner,
    };
  },
});

// ----------------------------------------------------------------------------
// SPECIALIZED QUERIES - For specific features
// ----------------------------------------------------------------------------

// Get all meks (admin use only - use with caution)
export const getAllMeks = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 500); // Hard cap at 500
    const meks = await ctx.db.query("meks").take(limit);

    // Return minimal data even for admin queries
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      owner: mek.owner,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      powerScore: mek.powerScore || 100,
    }));
  },
});

// List all meks for admin detail viewer
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();

    // Return full data for admin viewer
    return meks.map(mek => ({
      id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      rarityRank: mek.rarityRank,
      gameRank: mek.gameRank,
      rarityTier: mek.rarityTier,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
      goldRate: mek.goldRate,
      level: mek.level,
      powerScore: mek.powerScore,
      iconUrl: mek.iconUrl,
      sourceKey: mek.sourceKey,
      isGenesis: mek.isGenesis,
    }));
  },
});

// Get all meks with source keys for image display
export const getAllMeksWithSourceKeys = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 500); // Hard cap at 500
    const meks = await ctx.db.query("meks").take(limit);
    
    // Return data including source keys for image lookup
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      sourceKey: mek.sourceKey,
      sourceKeyBase: mek.sourceKeyBase,
      owner: mek.owner,
      gameRank: mek.gameRank,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      goldRate: mek.goldRate || 0,
      powerScore: mek.powerScore || 100,
    }));
  },
});

// Get meks by rarity tier
export const getMeksByRarity = query({
  args: { 
    rarityTier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_rarity", (q) => q.eq("rarityTier", args.rarityTier))
      .take(limit);
    
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      powerScore: mek.powerScore || 100,
      iconUrl: mek.iconUrl,
      owner: mek.owner,
    }));
  },
});

// Get meks by head variation
export const getMeksByHead = query({
  args: { 
    headVariation: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_head", (q) => q.eq("headVariation", args.headVariation))
      .take(limit);
    
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      bodyVariation: mek.bodyVariation,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      powerScore: mek.powerScore || 100,
      iconUrl: mek.iconUrl,
    }));
  },
});

// Get meks by body variation
export const getMeksByBody = query({
  args: { 
    bodyVariation: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_body", (q) => q.eq("bodyVariation", args.bodyVariation))
      .take(limit);
    
    return meks.map(mek => ({
      _id: mek._id,
      assetId: mek.assetId,
      assetName: mek.assetName,
      headVariation: mek.headVariation,
      rarityRank: mek.rarityRank || mek.gameRank || 9999,
      powerScore: mek.powerScore || 100,
      iconUrl: mek.iconUrl,
    }));
  },
});

// Get unassigned meks for employee selection
export const getUnassignedMeks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    // Get meks owned by user that are not assigned to employee slots
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
      .collect();
    
    // Filter out meks that are already assigned as employees
    const unassignedMeks = meks.filter(mek => !mek.isEmployee);
    
    // Return essential data for selection
    return unassignedMeks.map(mek => ({
      _id: mek._id,
      name: mek.assetName,
      mekNumber: parseInt(mek.assetId?.replace("MEK", "") || "1000"),
      level: mek.level || 1,
      rarityRank: mek.rarityRank || mek.gameRank || 2000,
      powerScore: mek.powerScore || 100,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
    }));
  },
});

// Assign mek to employee slot
export const assignToEmployeeSlot = mutation({
  args: {
    userId: v.id("users"),
    mekId: v.id("meks"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const mek = await ctx.db.get(args.mekId);
    if (!mek) throw new Error("Mek not found");
    
    // Verify ownership
    if (mek.owner !== user.walletAddress) {
      throw new Error("You don't own this mek");
    }
    
    // Mark mek as employee
    await ctx.db.patch(args.mekId, {
      isEmployee: true,
    });
    
    // Update user's gold rate based on new employee
    const goldRateIncrease = (mek.level || 1) * 3.5;
    await ctx.db.patch(args.userId, {
      goldPerHour: (user.goldPerHour || 0) + goldRateIncrease,
      employeeCount: (user.employeeCount || 0) + 1,
    });
    
    return {
      success: true,
      mekId: args.mekId,
      goldRateIncrease,
      newTotalGoldRate: (user.goldPerHour || 0) + goldRateIncrease,
    };
  },
});