/**
 * TENURE SYSTEM - Complete Backend Architecture
 *
 * OVERVIEW:
 * - Tenure accumulates at 1 tenure/second base rate for all Meks
 * - Only slotted Meks accumulate tenure (persists when unslotted)
 * - Real-time time-based accumulation with buffable rates
 * - Manual level-up system with carry-over excess tenure
 * - Admin-configurable level thresholds
 *
 * KEY BEHAVIORS:
 * - Tenure freezes when Mek is unslotted
 * - Tenure resumes when Mek is re-slotted
 * - Buffs apply globally and per-Mek
 * - Level-up requires manual action, spending tenure
 * - Excess tenure carries over after level-up
 *
 * ARCHITECTURE - SINGLE SOURCE OF TRUTH:
 * - `meks` table is the ONLY source of truth for:
 *   - tenurePoints (accumulated tenure)
 *   - tenureRate (points per second)
 *   - lastTenureUpdate (timestamp of last update)
 *   - isSlotted (whether Mek is in a slot)
 *   - slotNumber (which slot, if slotted)
 *
 * - goldMining.ownedMeks does NOT store tenure or slotting data
 * - essence.essenceSlots references Meks via mekAssetId
 * - All tenure queries/mutations operate on meks table
 * - Use getMekTenureData() query to access tenure data
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// HELPERS - Real-Time Tenure Calculation
// ============================================================================

/**
 * Calculate accumulated tenure for a Mek
 * Formula: effectiveTenureRate = baseRate * (1 + globalBuffs + perMekBuffs)
 */
export function calculateCurrentTenure(
  mek: Doc<"meks">,
  globalBuffMultiplier: number,
  perMekBuffMultiplier: number,
  baseRatePerSecond: number,
  now: number
): number {
  // Effective rate with buffs
  const effectiveRate = baseRatePerSecond * (1 + globalBuffMultiplier + perMekBuffMultiplier);

  // Calculate elapsed time if slotted
  let tenureGained = 0;
  if (mek.isSlotted && mek.lastTenureUpdate) {
    const elapsedSeconds = (now - mek.lastTenureUpdate) / 1000;
    tenureGained = elapsedSeconds * effectiveRate;
  }

  // Return total tenure (saved + gained)
  return (mek.tenurePoints || 0) + tenureGained;
}

/**
 * Get active tenure buffs for a Mek
 */
async function getActiveTenureBuffsForMek(
  ctx: any,
  mekId: Id<"meks">,
  now: number
): Promise<{ global: number; perMek: number }> {
  const buffs = await ctx.db
    .query("tenureBuffs")
    .filter((q: any) => q.eq(q.field("active"), true))
    .collect();

  let globalMultiplier = 0;
  let perMekMultiplier = 0;

  for (const buff of buffs) {
    // Check expiration
    if (buff.expiresAt && buff.expiresAt < now) {
      continue;
    }

    // Apply buff based on scope
    if (buff.scope === "global") {
      globalMultiplier += buff.multiplier;
    } else if (buff.scope === "perMek" && buff.mekId && buff.mekId === mekId) {
      perMekMultiplier += buff.multiplier;
    }
  }

  return { global: globalMultiplier, perMek: perMekMultiplier };
}

/**
 * Get the configured tenure base rate (with fallback to 1.0)
 */
async function getTenureBaseRateConfig(ctx: any): Promise<number> {
  const config = await ctx.db
    .query("tenureConfig")
    .withIndex("by_key", (q: any) => q.eq("key", "baseRate"))
    .first();

  return config ? (config.value as number) : 1.0; // Default to 1.0 if not configured
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get Mek with real-time tenure calculation
 */
export const getMekWithTenure = query({
  args: { mekId: v.id("meks") },
  handler: async (ctx, args) => {
    const mek = await ctx.db.get(args.mekId);
    if (!mek) return null;

    const now = Date.now();
    const baseRate = await getTenureBaseRateConfig(ctx);
    const buffs = await getActiveTenureBuffsForMek(ctx, args.mekId, now);
    const currentTenure = calculateCurrentTenure(mek, buffs.global, buffs.perMek, baseRate, now);

    return {
      ...mek,
      currentTenure,
      tenureRate: baseRate * (1 + buffs.global + buffs.perMek), // tenure per second
      activeBuffs: buffs,
    };
  },
});

/**
 * Get all tenure level thresholds (admin-configured)
 */
export const getTenureLevelThresholds = query({
  args: {},
  handler: async (ctx) => {
    const thresholds = await ctx.db
      .query("tenureLevels")
      .withIndex("by_level")
      .order("asc")
      .collect();

    return thresholds;
  },
});

/**
 * Get specific level threshold
 */
export const getTenureLevelThreshold = query({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    const threshold = await ctx.db
      .query("tenureLevels")
      .withIndex("", (q: any) => q.eq("level", args.level))
      .first();

    return threshold;
  },
});

/**
 * Get all active tenure buffs for a Mek
 */
export const getActiveTenureBuffs = query({
  args: { mekId: v.id("meks") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const baseRate = await getTenureBaseRateConfig(ctx);
    const buffs = await getActiveTenureBuffsForMek(ctx, args.mekId, now);

    // Get detailed buff information
    const allBuffs = await ctx.db
      .query("tenureBuffs")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const activeGlobalBuffs = allBuffs.filter(
      (b) => b.scope === "global" && (!b.expiresAt || b.expiresAt > now)
    );
    const activePerMekBuffs = allBuffs.filter(
      (b) => b.scope === "perMek" && b.mekId === args.mekId && (!b.expiresAt || b.expiresAt > now)
    );

    return {
      global: buffs.global,
      perMek: buffs.perMek,
      totalMultiplier: buffs.global + buffs.perMek,
      effectiveRate: baseRate * (1 + buffs.global + buffs.perMek),
      globalBuffs: activeGlobalBuffs,
      perMekBuffs: activePerMekBuffs,
    };
  },
});

/**
 * Get tenure stats for a wallet (all Meks)
 */
export const getWalletTenureStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", args.walletAddress))
      .collect();

    const now = Date.now();
    const baseRate = await getTenureBaseRateConfig(ctx);
    let totalSlottedTenure = 0;
    let totalFrozenTenure = 0;
    let slottedCount = 0;
    let unslottedCount = 0;

    for (const mek of meks) {
      const buffs = await getActiveTenureBuffsForMek(ctx, mek._id, now);
      const currentTenure = calculateCurrentTenure(mek, buffs.global, buffs.perMek, baseRate, now);

      if (mek.isSlotted) {
        totalSlottedTenure += currentTenure;
        slottedCount++;
      } else {
        totalFrozenTenure += currentTenure;
        unslottedCount++;
      }
    }

    return {
      totalSlottedTenure,
      totalFrozenTenure,
      totalTenure: totalSlottedTenure + totalFrozenTenure,
      slottedCount,
      unslottedCount,
      totalMeks: meks.length,
      averageTenure: meks.length > 0 ? (totalSlottedTenure + totalFrozenTenure) / meks.length : 0,
    };
  },
});

// ============================================================================
// MUTATIONS - Slotting
// ============================================================================

/**
 * Slot a Mek into essence system (starts tenure accumulation)
 */
export const slotMek = mutation({
  args: {
    mekId: v.id("meks"),
    slotNumber: v.number(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get Mek
    const mek = await ctx.db.get(args.mekId);
    if (!mek) {
      throw new Error("Mek not found");
    }

    // Verify ownership
    if (mek.owner !== args.walletAddress) {
      throw new Error("You don't own this Mek");
    }

    // Check if already slotted
    if (mek.isSlotted) {
      throw new Error("Mek is already slotted");
    }

    // Update Mek with slotted status and start tenure tracking
    await ctx.db.patch(args.mekId, {
      isSlotted: true,
      slotNumber: args.slotNumber,
      lastTenureUpdate: now,
      // Initialize tenurePoints to 0 if undefined, otherwise preserve existing value
      tenurePoints: mek.tenurePoints ?? 0,
    });

    // Also update essenceSlots table if it exists
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("slotNumber", args.slotNumber)
      )
      .first();

    if (slot) {
      await ctx.db.patch(slot._id, {
        mekAssetId: mek.assetId,
        mekNumber: parseInt(mek.assetName.replace(/\D/g, "")) || undefined,
        mekSourceKey: mek.sourceKey,
      });
    }

    return {
      success: true,
      message: "Mek slotted successfully. Tenure accumulation started.",
      mekId: args.mekId,
      slotNumber: args.slotNumber,
      tenurePoints: mek.tenurePoints || 0,
    };
  },
});

/**
 * Unslot a Mek from essence system (freezes tenure)
 */
export const unslotMek = mutation({
  args: {
    mekId: v.id("meks"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get Mek
    const mek = await ctx.db.get(args.mekId);
    if (!mek) {
      throw new Error("Mek not found");
    }

    // Verify ownership
    if (mek.owner !== args.walletAddress) {
      throw new Error("You don't own this Mek");
    }

    // Check if slotted
    if (!mek.isSlotted) {
      throw new Error("Mek is not slotted");
    }

    // Calculate and snapshot current tenure
    const baseRate = await getTenureBaseRateConfig(ctx);
    const buffs = await getActiveTenureBuffsForMek(ctx, args.mekId, now);
    const currentTenure = calculateCurrentTenure(mek, buffs.global, buffs.perMek, baseRate, now);

    // Update Mek with unslotted status and frozen tenure
    await ctx.db.patch(args.mekId, {
      isSlotted: false,
      slotNumber: undefined,
      tenurePoints: currentTenure, // Freeze current tenure
      lastTenureUpdate: now, // Mark when we froze
    });

    // Update essenceSlots table if it exists
    if (mek.slotNumber) {
      const slot = await ctx.db
        .query("essenceSlots")
        .withIndex("", (q: any) =>
          q.eq("walletAddress", args.walletAddress).eq("slotNumber", mek.slotNumber!)
        )
        .first();

      if (slot) {
        await ctx.db.patch(slot._id, {
          mekAssetId: undefined,
          mekNumber: undefined,
          mekSourceKey: undefined,
        });
      }
    }

    return {
      success: true,
      message: "Mek unslotted successfully. Tenure frozen.",
      mekId: args.mekId,
      frozenTenure: currentTenure,
    };
  },
});

// ============================================================================
// MUTATIONS - Leveling
// ============================================================================

/**
 * Level up a Mek (manual action, spends tenure)
 */
export const levelUpMek = mutation({
  args: {
    mekId: v.id("meks"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get Mek
    const mek = await ctx.db.get(args.mekId);
    if (!mek) {
      throw new Error("Mek not found");
    }

    // Verify ownership
    if (mek.owner !== args.walletAddress) {
      throw new Error("You don't own this Mek");
    }

    // Get current level (default to 1)
    const currentLevel = mek.level || 1;
    const nextLevel = currentLevel + 1;

    // Get tenure requirement for next level
    const levelThreshold = await ctx.db
      .query("tenureLevels")
      .withIndex("", (q: any) => q.eq("level", nextLevel))
      .first();

    if (!levelThreshold) {
      throw new Error(`Level ${nextLevel} configuration not found`);
    }

    // Calculate current tenure
    const baseRate = await getTenureBaseRateConfig(ctx);
    const buffs = await getActiveTenureBuffsForMek(ctx, args.mekId, now);
    const currentTenure = calculateCurrentTenure(mek, buffs.global, buffs.perMek, baseRate, now);

    // Check if enough tenure
    if (currentTenure < levelThreshold.tenureRequired) {
      return {
        success: false,
        message: `Not enough tenure. Need ${levelThreshold.tenureRequired}, have ${Math.floor(currentTenure)}`,
        currentTenure: Math.floor(currentTenure),
        required: levelThreshold.tenureRequired,
        shortfall: levelThreshold.tenureRequired - currentTenure,
      };
    }

    // Calculate excess tenure (carry-over)
    const excessTenure = currentTenure - levelThreshold.tenureRequired;

    // Level up the Mek
    await ctx.db.patch(args.mekId, {
      level: nextLevel,
      tenurePoints: excessTenure, // Carry over excess
      lastTenureUpdate: now,
    });

    return {
      success: true,
      message: `Mek leveled up to ${nextLevel}!`,
      previousLevel: currentLevel,
      newLevel: nextLevel,
      tenureSpent: levelThreshold.tenureRequired,
      tenureRemaining: Math.floor(excessTenure),
    };
  },
});

/**
 * Batch level up (for multiple level-ups at once)
 */
export const batchLevelUpMek = mutation({
  args: {
    mekId: v.id("meks"),
    walletAddress: v.string(),
    maxLevels: v.optional(v.number()), // Max levels to gain (default: unlimited)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const maxLevels = args.maxLevels || 999;

    // Get Mek
    const mek = await ctx.db.get(args.mekId);
    if (!mek) {
      throw new Error("Mek not found");
    }

    // Verify ownership
    if (mek.owner !== args.walletAddress) {
      throw new Error("You don't own this Mek");
    }

    let currentLevel = mek.level || 1;
    const startingLevel = currentLevel;

    // Calculate current tenure
    const baseRate = await getTenureBaseRateConfig(ctx);
    const buffs = await getActiveTenureBuffsForMek(ctx, args.mekId, now);
    let remainingTenure = calculateCurrentTenure(mek, buffs.global, buffs.perMek, baseRate, now);

    let levelsGained = 0;

    // Keep leveling up while we have tenure and haven't hit max
    while (levelsGained < maxLevels) {
      const nextLevel = currentLevel + 1;

      // Get threshold for next level
      const levelThreshold = await ctx.db
        .query("tenureLevels")
        .withIndex("", (q: any) => q.eq("level", nextLevel))
        .first();

      // No more levels configured
      if (!levelThreshold) {
        break;
      }

      // Not enough tenure for next level
      if (remainingTenure < levelThreshold.tenureRequired) {
        break;
      }

      // Level up!
      remainingTenure -= levelThreshold.tenureRequired;
      currentLevel = nextLevel;
      levelsGained++;
    }

    // No levels gained
    if (levelsGained === 0) {
      return {
        success: false,
        message: "Not enough tenure to level up",
        currentLevel: startingLevel,
        currentTenure: Math.floor(remainingTenure),
      };
    }

    // Update Mek
    await ctx.db.patch(args.mekId, {
      level: currentLevel,
      tenurePoints: remainingTenure,
      lastTenureUpdate: now,
    });

    return {
      success: true,
      message: `Mek leveled up ${levelsGained} time${levelsGained > 1 ? "s" : ""}!`,
      previousLevel: startingLevel,
      newLevel: currentLevel,
      levelsGained,
      tenureRemaining: Math.floor(remainingTenure),
    };
  },
});

// ============================================================================
// MUTATIONS - Buff Management
// ============================================================================

/**
 * Apply a tenure buff (global or per-Mek)
 */
export const applyTenureBuff = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    scope: v.union(v.literal("global"), v.literal("perMek")),
    multiplier: v.number(), // e.g., 0.5 for +50% tenure rate
    mekId: v.optional(v.id("meks")), // Required if scope is "perMek"
    duration: v.optional(v.number()), // Duration in milliseconds (optional)
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate scope
    if (args.scope === "perMek" && !args.mekId) {
      throw new Error("mekId is required for perMek buffs");
    }

    // Calculate expiration
    const expiresAt = args.duration ? now + args.duration : undefined;

    // Create buff
    const buffId = await ctx.db.insert("tenureBuffs", {
      name: args.name,
      description: args.description,
      scope: args.scope,
      multiplier: args.multiplier,
      mekId: args.mekId,
      active: true,
      createdAt: now,
      expiresAt,
    });

    return {
      success: true,
      message: "Tenure buff applied successfully",
      buffId,
      expiresAt,
    };
  },
});

/**
 * Remove a tenure buff
 */
export const removeTenureBuff = mutation({
  args: {
    buffId: v.id("tenureBuffs"),
  },
  handler: async (ctx, args) => {
    const buff = await ctx.db.get(args.buffId);
    if (!buff) {
      throw new Error("Buff not found");
    }

    await ctx.db.patch(args.buffId, {
      active: false,
    });

    return {
      success: true,
      message: "Tenure buff removed successfully",
    };
  },
});

// ============================================================================
// MUTATIONS - Admin Configuration
// ============================================================================

/**
 * Set tenure requirement for a level (admin only)
 */
export const setTenureLevelThreshold = mutation({
  args: {
    level: v.number(),
    tenureRequired: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if level already exists
    const existing = await ctx.db
      .query("tenureLevels")
      .withIndex("", (q: any) => q.eq("level", args.level))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        tenureRequired: args.tenureRequired,
        description: args.description,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: `Level ${args.level} threshold updated`,
        thresholdId: existing._id,
      };
    } else {
      // Create new
      const thresholdId = await ctx.db.insert("tenureLevels", {
        level: args.level,
        tenureRequired: args.tenureRequired,
        description: args.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: `Level ${args.level} threshold created`,
        thresholdId,
      };
    }
  },
});

/**
 * Batch set level thresholds (admin only)
 */
export const batchSetTenureLevelThresholds = mutation({
  args: {
    levels: v.array(
      v.object({
        level: v.number(),
        tenureRequired: v.number(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const levelData of args.levels) {
      // Check if exists
      const existing = await ctx.db
        .query("tenureLevels")
        .withIndex("", (q: any) => q.eq("level", levelData.level))
        .first();

      if (existing) {
        // Update
        await ctx.db.patch(existing._id, {
          tenureRequired: levelData.tenureRequired,
          description: levelData.description,
          updatedAt: Date.now(),
        });
        results.push({ level: levelData.level, action: "updated" });
      } else {
        // Create
        await ctx.db.insert("tenureLevels", {
          level: levelData.level,
          tenureRequired: levelData.tenureRequired,
          description: levelData.description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push({ level: levelData.level, action: "created" });
      }
    }

    return {
      success: true,
      message: `Processed ${results.length} level thresholds`,
      results,
    };
  },
});

/**
 * Delete a level threshold (admin only)
 */
export const deleteTenureLevelThreshold = mutation({
  args: {
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const threshold = await ctx.db
      .query("tenureLevels")
      .withIndex("", (q: any) => q.eq("level", args.level))
      .first();

    if (!threshold) {
      throw new Error(`Level ${args.level} not found`);
    }

    await ctx.db.delete(threshold._id);

    return {
      success: true,
      message: `Level ${args.level} threshold deleted`,
    };
  },
});

// ============================================================================
// QUERIES - Mek Tenure Data (SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * Get tenure data for all Meks owned by a wallet from the meks table
 * This is the ONLY source of truth for tenure points and slotting status.
 * DO NOT query goldMining.ownedMeks for this data.
 */
export const getMekTenureData = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all Meks owned by this wallet from the meks table
    const meks = await ctx.db
      .query("meks")
      .withIndex("", (q: any) => q.eq("owner", args.walletAddress))
      .collect();

    // Return tenure data mapped by assetId for fast lookup
    return meks.map((mek: any) => ({
      assetId: mek.assetId,
      tenurePoints: mek.tenurePoints || 0,
      tenureRate: mek.tenureRate || 0,
      lastTenureUpdate: mek.lastTenureUpdate || Date.now(),
      isSlotted: mek.isSlotted || false,
      slotNumber: mek.slotNumber,
    }));
  },
});
