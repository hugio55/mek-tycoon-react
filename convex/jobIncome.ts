/**
 * JOB INCOME SYSTEM (Phase II)
 * ============================
 *
 * This file manages the Phase II income system where Meks earn gold
 * through JOB SLOTS, not passive ownership.
 *
 * KEY DIFFERENCES FROM PHASE I:
 * - Phase I: Meks earn goldPerHour passively just by existing in wallet
 * - Phase II: Meks must be ASSIGNED to job slots to earn goldPerDay
 *
 * SALVAGED FROM goldMining.ts:
 * - Rate calculation curves (exponential, logarithmic, sigmoid, linear)
 * - Rarity-based income scaling
 * - Validation patterns
 *
 * NEW IN PHASE II:
 * - Daily income instead of hourly
 * - Job slot assignment required
 * - Income comes from slot type, not mek ownership
 * - Pit stops and tenure bonuses
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════════════
// RATE CALCULATION (Salvaged from goldMining.ts)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate base income rate for a Mek based on its rarity
 * This determines the BASE rate before job slot multipliers
 *
 * Curve types (from Phase I, adapted for daily rates):
 * - exponential: Steep curve, rare meks earn much more
 * - logarithmic: Diminishing returns for rarer meks
 * - sigmoid: S-curve, big middle tier, extremes at ends
 * - linear: Simple proportional scaling
 */
export const calculateBaseIncomeRate = query({
  args: {
    meks: v.array(v.object({
      assetId: v.string(),
      rarityRank: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the current rate configuration
    const rateConfig = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", (q: any) => q.eq("isCurrentConfig", true))
      .first();

    if (!rateConfig) {
      // Default linear rates if no config exists
      // Phase II: Using goldPerDay instead of goldPerHour
      return args.meks.map((mek) => {
        const rank = mek.rarityRank || 2000;
        // Linear scale from 2400 gold/day (rank 1) to 240 gold/day (rank 4000)
        // This is equivalent to 100 gold/hr to 10 gold/hr from Phase I
        const goldPerDay = Math.max(240, 2400 - (rank - 1) * 0.54);
        return {
          assetId: mek.assetId,
          goldPerDay: Math.round(goldPerDay * 100) / 100,
        };
      });
    }

    // Calculate rates based on configured curve
    const { curveType, minGold, maxGold, steepness, midPoint, totalMeks } = rateConfig;

    // Convert hourly config to daily (multiply by 24)
    const minDaily = (minGold || 10) * 24;
    const maxDaily = (maxGold || 100) * 24;

    return args.meks.map((mek) => {
      const rank = mek.rarityRank || totalMeks / 2;
      const normalizedRank = (rank - 1) / (totalMeks - 1);

      let goldPerDay: number;

      switch (curveType) {
        case 'exponential':
          goldPerDay = maxDaily * Math.exp(-steepness * normalizedRank);
          break;

        case 'logarithmic':
          goldPerDay = maxDaily - (maxDaily - minDaily) * Math.log(1 + steepness * normalizedRank) / Math.log(1 + steepness);
          break;

        case 'sigmoid':
          const sigmoidX = (rank - midPoint) / (totalMeks / 10);
          const sigmoidValue = 1 / (1 + Math.exp(steepness * sigmoidX));
          goldPerDay = minDaily + (maxDaily - minDaily) * sigmoidValue;
          break;

        case 'linear':
        default:
          goldPerDay = maxDaily - (maxDaily - minDaily) * normalizedRank;
          break;
      }

      // Apply rounding based on config
      switch (rateConfig.rounding) {
        case 'whole':
          goldPerDay = Math.round(goldPerDay);
          break;
        case '1decimal':
          goldPerDay = Math.round(goldPerDay * 10) / 10;
          break;
        case '2decimal':
          goldPerDay = Math.round(goldPerDay * 100) / 100;
          break;
      }

      return {
        assetId: mek.assetId,
        goldPerDay: Math.max(minDaily, Math.min(maxDaily, goldPerDay)),
      };
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// JOB SLOT INCOME COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate pending income for a job slot
 * Income = (days since last collection) × (slot base rate) × (mek modifier) × (bonuses)
 */
export const calculateSlotPendingIncome = query({
  args: {
    stakeAddress: v.string(),
    slotType: v.string(),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the job slot
    const slot = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("slotType"), args.slotType),
          q.eq(q.field("slotIndex"), args.slotIndex)
        )
      )
      .first();

    if (!slot) {
      return {
        success: false,
        error: "Slot not found",
        pendingIncome: 0,
      };
    }

    // No mek assigned = no income
    if (!slot.assignedMekId) {
      return {
        success: true,
        pendingIncome: 0,
        message: "No Mek assigned to this slot",
      };
    }

    // Get the assigned Mek for rate calculation
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
      .first();

    if (!mek) {
      return {
        success: false,
        error: "Assigned Mek not found",
        pendingIncome: 0,
      };
    }

    // Calculate time since last collection
    const lastCollection = slot.lastIncomeCollection || slot.assignedAt || now;
    const daysSinceCollection = (now - lastCollection) / (1000 * 60 * 60 * 24);

    // Get base daily rate for this mek
    // TODO: This should query slot type base rates + mek rarity modifier
    const baseDailyRate = mek.goldRate || 100; // Default 100 gold/day

    // Apply slot level bonus (1% per level above 1)
    const slotLevel = slot.slotLevel || 1;
    const slotBonus = 1 + (slotLevel - 1) * 0.01;

    // Apply tenure bonus (0.5% per day, capped at 50%)
    const tenureDays = slot.tenureDays || 0;
    const tenureBonus = 1 + Math.min(tenureDays * 0.005, 0.5);

    // Calculate total pending income
    const pendingIncome = baseDailyRate * daysSinceCollection * slotBonus * tenureBonus;

    return {
      success: true,
      pendingIncome: Math.floor(pendingIncome * 100) / 100,
      daysSinceCollection: Math.floor(daysSinceCollection * 100) / 100,
      baseDailyRate,
      slotLevel,
      slotBonus,
      tenureDays,
      tenureBonus,
    };
  },
});

/**
 * Collect income from a job slot
 * This is the Phase II equivalent of updateGoldCheckpoint
 */
export const collectSlotIncome = mutation({
  args: {
    stakeAddress: v.string(),
    slotType: v.string(),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the job slot
    const slot = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("slotType"), args.slotType),
          q.eq(q.field("slotIndex"), args.slotIndex)
        )
      )
      .first();

    if (!slot) {
      return {
        success: false,
        error: "Slot not found",
        collected: 0,
      };
    }

    if (!slot.assignedMekId) {
      return {
        success: false,
        error: "No Mek assigned to this slot",
        collected: 0,
      };
    }

    // Get the assigned Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
      .first();

    if (!mek) {
      return {
        success: false,
        error: "Assigned Mek not found",
        collected: 0,
      };
    }

    // Calculate time since last collection
    const lastCollection = slot.lastIncomeCollection || slot.assignedAt || now;
    const daysSinceCollection = (now - lastCollection) / (1000 * 60 * 60 * 24);

    // Minimum collection interval (prevent spam clicking)
    if (daysSinceCollection < 0.001) { // ~1.5 minutes
      return {
        success: false,
        error: "Too soon to collect again",
        collected: 0,
      };
    }

    // Get base daily rate for this mek
    const baseDailyRate = mek.goldRate || 100;

    // Apply slot level bonus
    const slotLevel = slot.slotLevel || 1;
    const slotBonus = 1 + (slotLevel - 1) * 0.01;

    // Apply tenure bonus
    const tenureDays = slot.tenureDays || 0;
    const tenureBonus = 1 + Math.min(tenureDays * 0.005, 0.5);

    // Calculate income to collect
    const collectedIncome = baseDailyRate * daysSinceCollection * slotBonus * tenureBonus;
    const roundedIncome = Math.floor(collectedIncome * 100) / 100;

    // Update slot with new collection time and add XP
    const xpGain = Math.floor(roundedIncome / 10); // 1 XP per 10 gold
    await ctx.db.patch(slot._id, {
      lastIncomeCollection: now,
      slotXP: (slot.slotXP || 0) + xpGain,
      lastXPUpdate: now,
    });

    // Update user's gold balance
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        gold: (user.gold || 0) + roundedIncome,
      });
    }

    // Track on the Mek how much gold it has earned (for stats)
    await ctx.db.patch(mek._id, {
      accumulatedGoldForCorp: (mek.accumulatedGoldForCorp || 0) + roundedIncome,
      accumulatedGoldAllTime: (mek.accumulatedGoldAllTime || 0) + roundedIncome,
    });

    console.log(`[💰INCOME] Collected ${roundedIncome} gold from slot ${args.slotType}#${args.slotIndex}`);

    return {
      success: true,
      collected: roundedIncome,
      newBalance: (user?.gold || 0) + roundedIncome,
      xpGained: xpGain,
    };
  },
});

/**
 * Collect income from ALL job slots at once
 * Convenience function for "collect all" button
 */
export const collectAllSlotIncome = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all job slots for this user
    const slots = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    let totalCollected = 0;
    let totalXP = 0;
    let slotsCollected = 0;

    for (const slot of slots) {
      if (!slot.assignedMekId) continue;

      // Get the assigned Mek
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
        .first();

      if (!mek) continue;

      // Calculate time since last collection
      const lastCollection = slot.lastIncomeCollection || slot.assignedAt || now;
      const daysSinceCollection = (now - lastCollection) / (1000 * 60 * 60 * 24);

      if (daysSinceCollection < 0.001) continue; // Skip if too recent

      // Calculate income
      const baseDailyRate = mek.goldRate || 100;
      const slotLevel = slot.slotLevel || 1;
      const slotBonus = 1 + (slotLevel - 1) * 0.01;
      const tenureDays = slot.tenureDays || 0;
      const tenureBonus = 1 + Math.min(tenureDays * 0.005, 0.5);

      const collectedIncome = baseDailyRate * daysSinceCollection * slotBonus * tenureBonus;
      const roundedIncome = Math.floor(collectedIncome * 100) / 100;
      const xpGain = Math.floor(roundedIncome / 10);

      // Update slot
      await ctx.db.patch(slot._id, {
        lastIncomeCollection: now,
        slotXP: (slot.slotXP || 0) + xpGain,
        lastXPUpdate: now,
      });

      // Track on Mek
      await ctx.db.patch(mek._id, {
        accumulatedGoldForCorp: (mek.accumulatedGoldForCorp || 0) + roundedIncome,
        accumulatedGoldAllTime: (mek.accumulatedGoldAllTime || 0) + roundedIncome,
      });

      totalCollected += roundedIncome;
      totalXP += xpGain;
      slotsCollected++;
    }

    // Update user's gold balance
    if (totalCollected > 0) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
        .first();

      if (user) {
        await ctx.db.patch(user._id, {
          gold: (user.gold || 0) + totalCollected,
        });
      }

      console.log(`[💰INCOME] Collected ${totalCollected} gold from ${slotsCollected} slots`);
    }

    return {
      success: true,
      totalCollected: Math.floor(totalCollected * 100) / 100,
      slotsCollected,
      totalXP,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// JOB SLOT ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assign a Mek to a job slot
 */
export const assignMekToSlot = mutation({
  args: {
    stakeAddress: v.string(),
    slotType: v.string(),
    slotIndex: v.number(),
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify user owns this Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek) {
      return { success: false, error: "Mek not found" };
    }

    if (mek.ownerStakeAddress !== args.stakeAddress) {
      return { success: false, error: "You do not own this Mek" };
    }

    // Get or create the job slot
    let slot = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("slotType"), args.slotType),
          q.eq(q.field("slotIndex"), args.slotIndex)
        )
      )
      .first();

    if (!slot) {
      // Create new slot
      await ctx.db.insert("userJobSlots", {
        stakeAddress: args.stakeAddress,
        slotType: args.slotType,
        slotIndex: args.slotIndex,
        assignedMekId: args.mekAssetId,
        assignedAt: now,
        slotXP: 0,
        slotLevel: 1,
        lastXPUpdate: now,
        tenureDays: 0,
        pitStopsCompleted: 0,
        lastIncomeCollection: now,
      });
    } else {
      // Collect any pending income before reassigning
      // (This prevents losing income when swapping meks)
      // Note: In a full implementation, call collectSlotIncome first

      // Update existing slot
      await ctx.db.patch(slot._id, {
        assignedMekId: args.mekAssetId,
        assignedAt: now,
        tenureDays: 0, // Reset tenure on new assignment
        lastIncomeCollection: now,
      });
    }

    // Mark mek as slotted
    await ctx.db.patch(mek._id, {
      isSlotted: true,
      slotNumber: args.slotIndex,
    });

    console.log(`[🔧SLOT] Assigned Mek ${args.mekAssetId} to slot ${args.slotType}#${args.slotIndex}`);

    return {
      success: true,
      message: `Mek assigned to ${args.slotType} slot ${args.slotIndex}`,
    };
  },
});

/**
 * Remove a Mek from a job slot
 */
export const removeMekFromSlot = mutation({
  args: {
    stakeAddress: v.string(),
    slotType: v.string(),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the slot
    const slot = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("slotType"), args.slotType),
          q.eq(q.field("slotIndex"), args.slotIndex)
        )
      )
      .first();

    if (!slot) {
      return { success: false, error: "Slot not found" };
    }

    if (!slot.assignedMekId) {
      return { success: false, error: "Slot is already empty" };
    }

    // Get the mek to update its slotted status
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
      .first();

    if (mek) {
      await ctx.db.patch(mek._id, {
        isSlotted: false,
        slotNumber: undefined,
      });
    }

    // Clear the slot assignment (keep slot XP and level)
    await ctx.db.patch(slot._id, {
      assignedMekId: undefined,
      assignedAt: undefined,
      tenureDays: 0,
    });

    console.log(`[🔧SLOT] Removed Mek from slot ${args.slotType}#${args.slotIndex}`);

    return {
      success: true,
      message: `Mek removed from ${args.slotType} slot ${args.slotIndex}`,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// INCOME QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get total daily income rate for a user (sum of all active slots)
 */
export const getTotalDailyIncomeRate = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    let totalDailyRate = 0;
    let activeSlots = 0;

    for (const slot of slots) {
      if (!slot.assignedMekId) continue;

      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
        .first();

      if (!mek) continue;

      const baseDailyRate = mek.goldRate || 100;
      const slotLevel = slot.slotLevel || 1;
      const slotBonus = 1 + (slotLevel - 1) * 0.01;
      const tenureDays = slot.tenureDays || 0;
      const tenureBonus = 1 + Math.min(tenureDays * 0.005, 0.5);

      totalDailyRate += baseDailyRate * slotBonus * tenureBonus;
      activeSlots++;
    }

    return {
      totalDailyRate: Math.floor(totalDailyRate * 100) / 100,
      activeSlots,
      totalSlots: slots.length,
    };
  },
});

/**
 * Get all pending income across all slots (for "collect all" preview)
 */
export const getAllPendingIncome = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const slots = await ctx.db
      .query("userJobSlots")
      .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    let totalPending = 0;
    const slotDetails = [];

    for (const slot of slots) {
      if (!slot.assignedMekId) continue;

      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.assignedMekId))
        .first();

      if (!mek) continue;

      const lastCollection = slot.lastIncomeCollection || slot.assignedAt || now;
      const daysSinceCollection = (now - lastCollection) / (1000 * 60 * 60 * 24);

      const baseDailyRate = mek.goldRate || 100;
      const slotLevel = slot.slotLevel || 1;
      const slotBonus = 1 + (slotLevel - 1) * 0.01;
      const tenureDays = slot.tenureDays || 0;
      const tenureBonus = 1 + Math.min(tenureDays * 0.005, 0.5);

      const pending = baseDailyRate * daysSinceCollection * slotBonus * tenureBonus;

      totalPending += pending;
      slotDetails.push({
        slotType: slot.slotType,
        slotIndex: slot.slotIndex,
        mekAssetId: slot.assignedMekId,
        mekName: mek.customName || mek.assetName,
        pending: Math.floor(pending * 100) / 100,
        daysSinceCollection: Math.floor(daysSinceCollection * 100) / 100,
      });
    }

    return {
      totalPending: Math.floor(totalPending * 100) / 100,
      slots: slotDetails,
    };
  },
});
