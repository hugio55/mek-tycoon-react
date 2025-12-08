import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { setEssenceBalance, getOrCreateEssenceBalance, getAggregatedBuffs, addBuffSource, removeBuffSource } from "./lib/essenceHelpers";
import { clampEssenceToCap, isEssenceFull } from "./lib/essenceCalculations";

// ============================================================================
// TENURE HELPERS (for integration with slot/unslot)
// ============================================================================

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

/**
 * Calculate accumulated tenure for a Mek
 * Formula: effectiveTenureRate = baseRate * (1 + globalBuffs + perMekBuffs)
 */
function calculateCurrentTenure(
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

// ============================================================================
// END TENURE HELPERS
// ============================================================================

// Seeded random number generator for deterministic slot requirements
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return this.seed / 2 ** 32;
  }

  selectFrom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
}

// Convert wallet address to seed number
function walletToSeed(walletAddress: string): number {
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    const char = walletAddress.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Initialize essence system for a player
export const initializeEssenceSystem = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Check if already initialized
    const existingTracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (existingTracking) {
      return { success: false, message: "Already initialized" };
    }

    // Ensure global config exists - create default if missing
    let config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    if (!config) {
      console.log('[Initialize] Creating default essence config');
      await ctx.db.insert("essenceConfig", {
        configType: "global",
        slot2GoldCost: 10000,
        slot3GoldCost: 50000,
        slot4GoldCost: 150000,
        slot5GoldCost: 500000,
        slot6GoldCost: 1000000,
        slot2EssenceCount: 2,
        slot3EssenceCount: 3,
        slot4EssenceCount: 4,
        slot5EssenceCount: 5,
        slot6EssenceCount: 6,
        rarityGroup1: [],
        rarityGroup2: [],
        rarityGroup3: [],
        rarityGroup4: [],
        swapBaseCost: 1000,
        swapCostIncrement: 500,
        swapCostMax: 10000,
        essenceRate: 0.1,
        essenceCap: 10,
        lastUpdated: Date.now(),
      });
    }

    const now = Date.now();

    // Create tracking record
    await ctx.db.insert("essenceTracking", {
      walletAddress,
      isActive: false,
      lastCalculationTime: now,
      lastCheckpointTime: now,
      totalSwapCount: 0,
      currentSwapCost: 0,
      createdAt: now,
      lastModified: now,
    });

    // Create 6 slot records (slot 1 unlocked, 2-6 locked)
    for (let i = 1; i <= 6; i++) {
      await ctx.db.insert("essenceSlots", {
        walletAddress,
        slotNumber: i,
        isUnlocked: i === 1,
        unlockedAt: i === 1 ? now : undefined,
        lastModified: now,
      });
    }

    // Generate slot requirements for slots 2-6
    await generateSlotRequirements(ctx, walletAddress);

    return { success: true, message: "Essence system initialized" };
  },
});

// Generate slot requirements using seeded random
async function generateSlotRequirements(ctx: any, walletAddress: string) {
  // Get config
  const config = await ctx.db
    .query("essenceConfig")
    .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
    .first();

  if (!config) {
    throw new Error("Essence config not found");
  }

  const seed = walletToSeed(walletAddress);
  const rng = new SeededRandom(seed);

  const now = Date.now();

  // Slot 2: Group 1 variations (common)
  const slot2Essences = rng.selectFrom(config.rarityGroup1, config.slot2EssenceCount);
  await ctx.db.insert("essenceSlotRequirements", {
    walletAddress,
    slotNumber: 2,
    goldCost: config.slot2GoldCost,
    requiredEssences: (slot2Essences as number[]).map((varId: number) => ({
      variationId: varId,
      variationName: `Variation ${varId}`, // Will be updated with actual names
      amountRequired: 5,
    })),
    generatedAt: now,
    seedUsed: walletAddress,
  });

  // Slot 3: Group 1 + Group 2
  const slot3Pool = [...config.rarityGroup1, ...config.rarityGroup2];
  const slot3Essences = rng.selectFrom(slot3Pool, config.slot3EssenceCount);
  await ctx.db.insert("essenceSlotRequirements", {
    walletAddress,
    slotNumber: 3,
    goldCost: config.slot3GoldCost,
    requiredEssences: slot3Essences.map((varId: number) => ({
      variationId: varId,
      variationName: `Variation ${varId}`,
      amountRequired: 7,
    })),
    generatedAt: now,
    seedUsed: walletAddress,
  });

  // Slot 4: Groups 1-3
  const slot4Pool = [...config.rarityGroup1, ...config.rarityGroup2, ...config.rarityGroup3];
  const slot4Essences = rng.selectFrom(slot4Pool, config.slot4EssenceCount);
  await ctx.db.insert("essenceSlotRequirements", {
    walletAddress,
    slotNumber: 4,
    goldCost: config.slot4GoldCost,
    requiredEssences: slot4Essences.map((varId: number) => ({
      variationId: varId,
      variationName: `Variation ${varId}`,
      amountRequired: 9,
    })),
    generatedAt: now,
    seedUsed: walletAddress,
  });

  // Slot 5: All groups
  const slot5Pool = [
    ...config.rarityGroup1,
    ...config.rarityGroup2,
    ...config.rarityGroup3,
    ...config.rarityGroup4,
  ];
  const slot5Essences = rng.selectFrom(slot5Pool, config.slot5EssenceCount);
  await ctx.db.insert("essenceSlotRequirements", {
    walletAddress,
    slotNumber: 5,
    goldCost: config.slot5GoldCost,
    requiredEssences: slot5Essences.map((varId: number) => ({
      variationId: varId,
      variationName: `Variation ${varId}`,
      amountRequired: 10,
    })),
    generatedAt: now,
    seedUsed: walletAddress,
  });

  // Slot 6: All groups (hardest)
  const slot6Pool = [
    ...config.rarityGroup1,
    ...config.rarityGroup2,
    ...config.rarityGroup3,
    ...config.rarityGroup4,
  ];
  const slot6Essences = rng.selectFrom(slot6Pool, config.slot6EssenceCount);
  await ctx.db.insert("essenceSlotRequirements", {
    walletAddress,
    slotNumber: 6,
    goldCost: config.slot6GoldCost,
    requiredEssences: slot6Essences.map((varId: number) => ({
      variationId: varId,
      variationName: `Variation ${varId}`,
      amountRequired: 12,
    })),
    generatedAt: now,
    seedUsed: walletAddress,
  });
}

// Calculate metadata for frontend accumulation
// Returns rates, counts, and caps for each variation being generated
async function calculateEssenceMetadata(
  ctx: any,
  walletAddress: string,
  slots: any[],
  config: any,
  balances: any[]
) {
  const slottedMeks = slots.filter((s: any) => s.mekAssetId);

  // Count variations from slotted Meks
  const variationCounts = new Map<number, number>();

  for (const slot of slottedMeks) {
    if (slot.headVariationId) {
      variationCounts.set(
        slot.headVariationId,
        (variationCounts.get(slot.headVariationId) || 0) + 1
      );
    }
    if (slot.bodyVariationId) {
      variationCounts.set(
        slot.bodyVariationId,
        (variationCounts.get(slot.bodyVariationId) || 0) + 1
      );
    }
    if (slot.itemVariationId) {
      variationCounts.set(
        slot.itemVariationId,
        (variationCounts.get(slot.itemVariationId) || 0) + 1
      );
    }
  }

  const rates: { [variationId: number]: number } = {};
  const counts: { [variationId: number]: number } = {};
  const caps: { [variationId: number]: number } = {};

  // Get all unique variation IDs (from slotted Meks, existing balances, AND active buffs)
  const safeBalances = balances ?? [];

  // Get all buff sources for this wallet (granular system)
  const buffSources = await ctx.db
    .query("essenceBuffSources")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  // Filter out expired buffs
  const now = Date.now();
  const activeBuffSources = buffSources.filter(
    (s: any) => !s.expiresAt || s.expiresAt > now
  );

  // Group sources by variationId and calculate aggregated buffs
  const buffMap = new Map<number, { rateMultiplier: number; capBonus: number }>();
  for (const source of activeBuffSources) {
    const existing = buffMap.get(source.variationId) || { rateMultiplier: 1.0, capBonus: 0 };
    buffMap.set(source.variationId, {
      rateMultiplier: existing.rateMultiplier + (source.rateMultiplier - 1.0),
      capBonus: existing.capBonus + source.capBonus,
    });
  }

  const allVariationIds = new Set<number>([
    ...Array.from(variationCounts.keys()),
    ...safeBalances.map((b: any) => b.variationId),
    ...Array.from(buffMap.keys()) // CRITICAL: Include buffed variations
  ]);

  // Calculate rates and caps for all variations
  for (const variationId of allVariationIds) {
    const count = variationCounts.get(variationId) || 0;

    // Get buff from map (much faster than querying for each variation)
    const buff = buffMap.get(variationId);

    const rateMultiplier = buff?.rateMultiplier || 1.0;
    const capBonus = buff?.capBonus || 0;

    const effectiveRate = ((config?.essenceRate ?? 0.1) * rateMultiplier);
    const effectiveCap = ((config?.essenceCap ?? 10) + capBonus);

    // Only set rate if variation is currently slotted (count > 0)
    // CRITICAL: Multiply rate by count for duplicate variations
    if (count > 0) {
      const calculatedRate = effectiveRate * count;
      rates[variationId] = calculatedRate; // Stack rates for duplicates
      counts[variationId] = count;
    }

    // Set cap for ALL variations (even if not currently slotted)
    caps[variationId] = effectiveCap;
  }

  return { rates, counts, caps };
}

// Get player's essence state (slots, balances, tracking)
export const getPlayerEssenceState = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Get tracking
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    // Get slots
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get slot requirements
    const requirements = await ctx.db
      .query("essenceSlotRequirements")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get essence balances (RAW snapshots from DB)
    const rawBalances = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get config
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    // CRITICAL FIX: Return RAW balances as snapshots (like gold system)
    // Client-side will handle all time-based calculations using the STORED lastCalculationTime
    // This ensures ALL queries return IDENTICAL values at the same moment

    // Calculate metadata for frontend (rates, caps, counts)
    const metadata = await calculateEssenceMetadata(
      ctx,
      walletAddress,
      slots,
      config,
      rawBalances
    );

    return {
      tracking,
      slots: slots.sort((a: any, b: any) => a.slotNumber - b.slotNumber),
      requirements: requirements.sort((a: any, b: any) => a.slotNumber - b.slotNumber),
      balances: rawBalances, // ✅ RETURN RAW SNAPSHOTS (not recalculated)

      // Metadata for frontend animation
      lastCalculationTime: tracking?.lastCalculationTime || Date.now(),
      isActive: tracking?.isActive || false,
      essenceRates: metadata.rates,
      slottedCounts: metadata.counts,
      caps: metadata.caps,
    };
  },
});

// Calculate real-time essence accumulation (like calculateCurrentGold for gold mining)
async function calculateRealTimeEssenceBalances(
  ctx: any,
  walletAddress: string,
  balances: any[],
  tracking: any
) {
  // If tracking doesn't exist or isn't active, return balances as-is
  if (!tracking || !tracking.isActive) {
    return balances;
  }

  const now = Date.now();

  // DEBUG: Log calculation timing details
  console.log('🔍 [BACKEND CALC] calculateRealTimeEssenceBalances called:', {
    timestamp: new Date(now).toISOString(),
    lastCalculationTime: new Date(tracking.lastCalculationTime).toISOString(),
    elapsedMs: now - tracking.lastCalculationTime,
    elapsedSeconds: ((now - tracking.lastCalculationTime) / 1000).toFixed(2)
  });

  const config = await ctx.db
    .query("essenceConfig")
    .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
    .first();

  if (!config) {
    return balances;
  }

  // Get all slotted Meks to calculate current production rates
  const slots = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .collect();

  const slottedMeks = slots.filter((s: any) => s.mekAssetId);

  // Count variations from slotted Meks
  const variationCounts = new Map<number, { name: string; type: string; count: number }>();

  for (const slot of slottedMeks) {
    if (slot.headVariationId && slot.headVariationName) {
      const existing = variationCounts.get(slot.headVariationId);
      variationCounts.set(slot.headVariationId, {
        name: slot.headVariationName,
        type: "head",
        count: (existing?.count || 0) + 1,
      });
    }
    if (slot.bodyVariationId && slot.bodyVariationName) {
      const existing = variationCounts.get(slot.bodyVariationId);
      variationCounts.set(slot.bodyVariationId, {
        name: slot.bodyVariationName,
        type: "body",
        count: (existing?.count || 0) + 1,
      });
    }
    if (slot.itemVariationId && slot.itemVariationName) {
      const existing = variationCounts.get(slot.itemVariationId);
      variationCounts.set(slot.itemVariationId, {
        name: slot.itemVariationName,
        type: "item",
        count: (existing?.count || 0) + 1,
      });
    }
  }

  // CRITICAL FIX: Calculate time elapsed since STORED lastCalculationTime
  // This gives us the BASE amount that was accumulated up to the last mutation
  // We store the BASE in balance.accumulatedAmount during mutations
  // Then we ADD real-time accumulation from lastCalculationTime to NOW
  const daysElapsedSinceLastSave = (now - tracking.lastCalculationTime) / (1000 * 60 * 60 * 24);

  // DEBUG: Log time calculation
  console.log('🔍 [BACKEND CALC] Time calculation:', {
    daysElapsedSinceLastSave: daysElapsedSinceLastSave.toFixed(8),
    hoursElapsed: (daysElapsedSinceLastSave * 24).toFixed(4),
    minutesElapsed: (daysElapsedSinceLastSave * 24 * 60).toFixed(2),
    secondsElapsed: (daysElapsedSinceLastSave * 24 * 60 * 60).toFixed(2)
  });

  // Update each balance with real-time accumulation
  const updatedBalances = await Promise.all(
    (balances || []).map(async (balance) => {
      const variationData = variationCounts.get(balance.variationId);

      // If this variation is no longer slotted, return existing balance
      if (!variationData) {
        return balance;
      }

      // Check for player buffs (granular system)
      const { rateMultiplier, capBonus } = await getAggregatedBuffs(ctx, {
        walletAddress,
        variationId: balance.variationId,
      });

      const effectiveRate = config.essenceRate * rateMultiplier;
      const effectiveCap = config.essenceCap + capBonus;

      // CRITICAL FIX: Calculate essence earned since lastCalculationTime (stored in tracking)
      // balance.accumulatedAmount contains the BASE amount as of lastCalculationTime
      // We calculate additional accumulation from lastCalculationTime to NOW
      const essenceEarnedSinceLastSave = daysElapsedSinceLastSave * effectiveRate * variationData.count;
      const currentRealTimeAmount = clampEssenceToCap(balance.accumulatedAmount + essenceEarnedSinceLastSave, effectiveCap);

      // DEBUG: Log calculation for this variation
      console.log(`🔍 [BACKEND CALC] ${balance.variationName}:`, {
        storedBaseAmount: balance.accumulatedAmount.toFixed(12),
        essenceEarnedSinceLastSave: essenceEarnedSinceLastSave.toFixed(12),
        currentRealTimeAmount: currentRealTimeAmount.toFixed(12),
        rate: effectiveRate,
        count: variationData.count,
        daysElapsedSinceLastSave: daysElapsedSinceLastSave.toFixed(8),
        lastSaveTime: new Date(tracking.lastCalculationTime).toISOString()
      });

      return {
        ...balance,
        accumulatedAmount: currentRealTimeAmount,
      };
    })
  );

  // Also check if there are any variations being produced that don't have balance records yet
  for (const [variationId, data] of Array.from(variationCounts.entries())) {
    const existingBalance = balances.find((b: any) => b.variationId === variationId);
    if (!existingBalance) {
      // This variation is being produced but has no balance record
      // Calculate its accumulated amount
      const buff = await ctx.db
        .query("essencePlayerBuffs")
        .withIndex("by_wallet_and_variation", (q: any) =>
          q.eq("walletAddress", walletAddress).eq("variationId", variationId)
        )
        .first();

      const rateMultiplier = buff?.rateMultiplier || 1.0;
      const capBonus = buff?.capBonus || 0;

      const effectiveRate = config.essenceRate * rateMultiplier;
      const effectiveCap = config.essenceCap + capBonus;

      const essenceEarned = daysElapsedSinceLastSave * effectiveRate * data.count;
      const newAmount = clampEssenceToCap(essenceEarned, effectiveCap);

      // Add this as a new balance entry (in-memory only, not persisted)
      updatedBalances.push({
        _id: `temp_${variationId}`, // Temporary ID for frontend
        _creationTime: now,
        walletAddress,
        variationId,
        variationName: data.name,
        variationType: data.type as "head" | "body" | "item",
        accumulatedAmount: newAmount,
        lastUpdated: now,
      });
    }
  }

  return updatedBalances;
}

// ============================================================================
// ORIGINAL MONOLITHIC SLOT/UNSLOT FUNCTIONS (COMMENTED OUT - PRESERVED FOR REFERENCE)
// ============================================================================
// These are the original implementations before the separation of concerns refactor.
// Kept here for reference and to enable easy rollback if needed.
// Scroll down to see the new refactored versions.
// ============================================================================

/*
// Slot a Mek into a slot
export const slotMek_ORIGINAL = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
    mekAssetId: v.string(),
    // Accept Mek data directly since Meks might be in goldMining.ownedMeks
    mekNumber: v.optional(v.number()),
    sourceKey: v.optional(v.string()),
    headVariationId: v.optional(v.number()),
    headVariationName: v.optional(v.string()),
    bodyVariationId: v.optional(v.number()),
    bodyVariationName: v.optional(v.string()),
    itemVariationId: v.optional(v.number()),
    itemVariationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      walletAddress,
      slotNumber,
      mekAssetId,
      headVariationName: passedHeadName,
      bodyVariationName: passedBodyName,
      itemVariationName: passedItemName
    } = args;

    // Try to get Mek from meks table first
    let mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
      .first();

    // If not in meks table, check goldMining.ownedMeks
    if (!mek) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
        .first();

      if (goldMining) {
        const ownedMek = goldMining.ownedMeks?.find((m: any) => m.assetId === mekAssetId);
        if (ownedMek) {
          // Use the data from goldMining.ownedMeks
          mek = ownedMek as any;
        }
      }
    }

    if (!mek) {
      throw new Error("Mek not found in database or goldMining records");
    }

    // Verify ownership (check both owner field and walletAddress match)
    if (mek.owner && mek.owner !== walletAddress) {
      throw new Error("You don't own this Mek");
    }

    // Check if Mek is already slotted
    const existingSlot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_mek", (q: any) => q.eq("mekAssetId", mekAssetId))
      .first();

    if (existingSlot) {
      throw new Error("This Mek is already slotted");
    }

    // Get the slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (!slot.isUnlocked) {
      throw new Error("Slot is locked");
    }

    const now = Date.now();

    // Calculate accumulated essence before slotting
    await calculateAndUpdateEssence(ctx, walletAddress);

    // Use passed-in variation names (from frontend lookup) or fall back to Mek data
    const headVariationName = passedHeadName || mek.headVariation;
    const bodyVariationName = passedBodyName || mek.bodyVariation;
    const itemVariationName = passedItemName || mek.itemVariation;

    // Look up variation IDs if not present (goldMining.ownedMeks doesn't have them)
    let headVariationId = mek.headVariationId;
    let bodyVariationId = mek.bodyVariationId;
    let itemVariationId = mek.itemVariationId;

    if (!headVariationId && headVariationName) {
      const headVar = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q: any) => q.eq("name", headVariationName))
        .filter((q: any) => q.eq(q.field("type"), "head"))
        .first();
      headVariationId = headVar?.variationId;
    }

    if (!bodyVariationId && bodyVariationName) {
      const bodyVar = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q: any) => q.eq("name", bodyVariationName))
        .filter((q: any) => q.eq(q.field("type"), "body"))
        .first();
      bodyVariationId = bodyVar?.variationId;
    }

    if (!itemVariationId && itemVariationName) {
      const itemVar = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q: any) => q.eq("name", itemVariationName))
        .filter((q: any) => q.eq(q.field("type"), "item"))
        .first();
      itemVariationId = itemVar?.variationId;
    }

    // Update slot
    await ctx.db.patch(slot._id, {
      mekAssetId,
      mekNumber: parseInt(mek.assetName.replace("Mek #", "")),
      mekSourceKey: mek.sourceKey,
      headVariationId,
      headVariationName,
      bodyVariationId,
      bodyVariationName,
      itemVariationId,
      itemVariationName,
      slottedAt: now,
      lastModified: now,
    });

    // CRITICAL FIX: Immediately create balance records for new variations
    // This ensures they appear in the Essence Distribution lightbox right away
    const variationsToEnsure: Array<{ id: number | undefined; name: string | undefined; type: "head" | "body" | "item" }> = [
      { id: headVariationId, name: headVariationName, type: "head" },
      { id: bodyVariationId, name: bodyVariationName, type: "body" },
      { id: itemVariationId, name: itemVariationName, type: "item" },
    ];

    for (const variation of variationsToEnsure) {
      if (variation.id && variation.name) {
        // Use helper to create balance record if it doesn't exist (doesn't overwrite existing)
        await getOrCreateEssenceBalance(ctx, {
          walletAddress,
          variationId: variation.id,
          variationName: variation.name,
          variationType: variation.type,
          initialAmount: 0, // Only used if creating new record
        });
        console.log(`✅ [SLOT MEK] Ensured balance record exists for ${variation.name} (${variation.type})`);
      }
    }

    // Activate essence generation if this is the first Mek slotted
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (tracking && !tracking.isActive) {
      await ctx.db.patch(tracking._id, {
        isActive: true,
        activationTime: now,
        lastCalculationTime: now,
        lastModified: now,
      });
    }

    // TENURE INTEGRATION: Mark Mek as slotted and start tenure tracking in meks table
    // Update the authoritative meks table (not goldMining.ownedMeks)
    console.log(`[🔒TENURE-DEBUG] ========================================`);
    console.log(`[🔒TENURE-DEBUG] 🔥 TENURE UPDATE CODE BLOCK REACHED 🔥`);
    console.log(`[🔒TENURE-DEBUG] ========================================`);
    console.log(`[🔒TENURE-DEBUG] Step 1: About to query meks table for assetId: ${mekAssetId}`);

    let hasName = false;

    try {
      const mekRecord = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
        .first();

      console.log(`[🔒TENURE-DEBUG] Step 2: Query completed. mekRecord is ${mekRecord ? 'FOUND' : 'NULL'}`);

      if (mekRecord) {
        console.log(`[🔒TENURE-DEBUG] === SLOTTING MEK IN MEKS TABLE ===`);
        console.log(`[🔒TENURE-DEBUG] Mek _id: ${mekRecord._id}`);
        console.log(`[🔒TENURE-DEBUG] Mek assetId: ${mekAssetId}`);
        console.log(`[🔒TENURE-DEBUG] Mek assetName: ${mekRecord.assetName}`);
        console.log(`[🔒TENURE-DEBUG] BEFORE patch - tenurePoints: ${mekRecord.tenurePoints} (type: ${typeof mekRecord.tenurePoints})`);
        console.log(`[🔒TENURE-DEBUG] BEFORE patch - isSlotted: ${mekRecord.isSlotted} (type: ${typeof mekRecord.isSlotted})`);
        console.log(`[🔒TENURE-DEBUG] BEFORE patch - slotNumber: ${mekRecord.slotNumber}`);
        console.log(`[🔒TENURE-DEBUG] BEFORE patch - lastTenureUpdate: ${mekRecord.lastTenureUpdate}`);

        console.log(`[🔒TENURE-DEBUG] Step 3: Checking for custom name...`);
        // Check if Mek has custom name (check goldMining.ownedMeks for this)
        try {
          const goldMiningRecord = await ctx.db
            .query("goldMining")
            .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
            .first();

          if (goldMiningRecord && goldMiningRecord.ownedMeks) {
            hasName = !!goldMiningRecord.ownedMeks.find((m: any) => m.assetId === mekAssetId)?.customName;
            console.log(`[🔒TENURE-DEBUG] Custom name check: hasName = ${hasName}`);
          } else {
            console.log(`[🔒TENURE-DEBUG] No goldMining record or ownedMeks found`);
          }
        } catch (nameCheckError) {
          console.error(`[🔒TENURE-DEBUG] ERROR checking custom name:`, nameCheckError);
        }

        console.log(`[🔒TENURE-DEBUG] Step 4: Preparing patch data...`);
        // Update Mek with slotted status in meks table
        const tenureToSave = mekRecord.tenurePoints ?? 0;

        const patchData = {
          isSlotted: true,
          slotNumber: slotNumber,
          lastTenureUpdate: now,
          // Initialize tenurePoints to 0 if undefined, otherwise preserve existing value
          tenurePoints: tenureToSave,
        };

        console.log(`[🔒TENURE-DEBUG] PATCH DATA being applied:`, JSON.stringify(patchData, null, 2));
        console.log(`[🔒TENURE-DEBUG] Patching document ID: ${mekRecord._id}`);

        console.log(`[🔒TENURE-DEBUG] Step 5: Executing patch...`);
        try {
          await ctx.db.patch(mekRecord._id, patchData);
          console.log(`[🔒TENURE-DEBUG] ✅ PATCH COMPLETED SUCCESSFULLY`);
        } catch (patchError) {
          console.error(`[🔒TENURE-DEBUG] ❌ PATCH FAILED:`, patchError);
          throw patchError;
        }

        console.log(`[🔒TENURE-DEBUG] Step 6: Re-fetching to verify...`);
        // Re-fetch to verify the patch worked
        try {
          const updatedMek = await ctx.db.get(mekRecord._id);
          console.log(`[🔒TENURE-DEBUG] === AFTER PATCH VERIFICATION ===`);
          if (updatedMek) {
            console.log(`[🔒TENURE-DEBUG] ✅ Record found after patch`);
            console.log(`[🔒TENURE-DEBUG] AFTER patch - tenurePoints: ${updatedMek.tenurePoints} (type: ${typeof updatedMek.tenurePoints})`);
            console.log(`[🔒TENURE-DEBUG] AFTER patch - isSlotted: ${updatedMek.isSlotted} (type: ${typeof updatedMek.isSlotted})`);
            console.log(`[🔒TENURE-DEBUG] AFTER patch - slotNumber: ${updatedMek.slotNumber}`);
            console.log(`[🔒TENURE-DEBUG] AFTER patch - lastTenureUpdate: ${updatedMek.lastTenureUpdate}`);
          } else {
            console.error(`[🔒TENURE-DEBUG] ❌ Record NOT found after patch! This should never happen!`);
          }
        } catch (verifyError) {
          console.error(`[🔒TENURE-DEBUG] ❌ VERIFICATION FAILED:`, verifyError);
        }

        console.log(`[🔒TENURE-DEBUG] === SLOTTING COMPLETE ===`);
      } else {
        console.error(`[🔒TENURE-DEBUG] ❌ WARNING: No mek record found in meks table for assetId ${mekAssetId}!`);
        console.log(`[🔒TENURE-DEBUG] This means the Mek exists in goldMining.ownedMeks but NOT in the meks table.`);
        console.log(`[🔒TENURE-DEBUG] Tenure tracking CANNOT be enabled for this Mek until it's added to meks table.`);
      }
    } catch (error) {
      console.error(`[🔒TENURE-DEBUG] ❌ FATAL ERROR in tenure update block:`, error);
      console.error(`[🔒TENURE-DEBUG] Error name: ${(error as Error).name}`);
      console.error(`[🔒TENURE-DEBUG] Error message: ${(error as Error).message}`);
      console.error(`[🔒TENURE-DEBUG] Error stack:`, (error as Error).stack);
    }

    console.log(`[🔒TENURE-DEBUG] ========================================`);
    console.log(`[🔒TENURE-DEBUG] 🔥 TENURE UPDATE CODE BLOCK FINISHED 🔥`);
    console.log(`[🔒TENURE-DEBUG] ========================================`);

    return {
      success: true,
      shouldShowNaming: !hasName // Show naming lightbox if no name exists
    };
  },
});
*/

/*
// Unslot a Mek from a slot
export const unslotMek_ORIGINAL = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber } = args;

    // Get the slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (!slot.mekAssetId) {
      throw new Error("Slot is already empty");
    }

    const now = Date.now();

    // Calculate accumulated essence before unslotting
    await calculateAndUpdateEssence(ctx, walletAddress);

    // CRITICAL FIX: Calculate and save tenure before unslotting
    const mekAssetId = slot.mekAssetId;
    const slottedAt = slot.slottedAt || now;

    // Calculate how long this Mek was slotted (in seconds)
    const timeSlotted = (now - slottedAt) / 1000;
    const tenureEarned = timeSlotted * 1; // 1 tenure point per second base rate

    console.log(`[🔒TENURE] Unslotting Mek ${mekAssetId}: earned ${tenureEarned.toFixed(2)} tenure points (${timeSlotted.toFixed(0)}s slotted)`);

    // Save tenure to meks table (the authoritative source)
    if (mekAssetId) {
      const mekRecord = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
        .first();

      if (mekRecord) {
        const currentTenure = mekRecord.tenurePoints || 0;
        const newTenure = currentTenure + tenureEarned;
        console.log(`[🔒TENURE] Saving to meks table: ${currentTenure.toFixed(2)} + ${tenureEarned.toFixed(2)} = ${newTenure.toFixed(2)}`);

        await ctx.db.patch(mekRecord._id, {
          tenurePoints: newTenure,
          lastTenureUpdate: now,
          isSlotted: false,
          slotNumber: undefined, // Clear slot number
        });
      }
    }

    // Clear slot
    await ctx.db.patch(slot._id, {
      mekAssetId: undefined,
      mekNumber: undefined,
      mekSourceKey: undefined,
      headVariationId: undefined,
      headVariationName: undefined,
      bodyVariationId: undefined,
      bodyVariationName: undefined,
      itemVariationId: undefined,
      itemVariationName: undefined,
      slottedAt: undefined,
      lastModified: now,
    });

    // Check if all slots are now empty - if so, deactivate
    const allSlots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    const hasSlottedMek = allSlots.some((s: any) => s.mekAssetId);

    if (!hasSlottedMek) {
      const tracking = await ctx.db
        .query("essenceTracking")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
        .first();

      if (tracking) {
        await ctx.db.patch(tracking._id, {
          isActive: false,
          lastModified: now,
        });
      }
    }

    return { success: true };
  },
});
*/

// ============================================================================
// REFACTORED SLOT/UNSLOT FUNCTIONS (New Modular Implementation)
// ============================================================================
// These are the new implementations using helper functions for better
// separation of concerns, maintainability, and testability.
// ============================================================================

// Slot a Mek into a slot
export const slotMek = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
    mekAssetId: v.string(),
    // Accept Mek data directly since Meks might be in goldMining.ownedMeks
    mekNumber: v.optional(v.number()),
    sourceKey: v.optional(v.string()),
    headVariationId: v.optional(v.number()),
    headVariationName: v.optional(v.string()),
    bodyVariationId: v.optional(v.number()),
    bodyVariationName: v.optional(v.string()),
    itemVariationId: v.optional(v.number()),
    itemVariationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Validate operation preconditions
    const { slot, mek } = await validateSlotOperation(ctx, {
      walletAddress: args.walletAddress,
      slotNumber: args.slotNumber,
      mekAssetId: args.mekAssetId,
    });

    // 2. Snapshot current essence state before making changes
    await snapshotEssenceState(ctx, args.walletAddress);

    // 3. Update slot with Mek data
    const variationData = await updateSlotWithMek(ctx, {
      slotId: slot._id,
      mekData: {
        assetId: args.mekAssetId,
        assetName: mek.assetName,
        sourceKey: mek.sourceKey,
        headVariationId: mek.headVariationId,
        headVariation: mek.headVariation,
        bodyVariationId: mek.bodyVariationId,
        bodyVariation: mek.bodyVariation,
        itemVariationId: mek.itemVariationId,
        itemVariation: mek.itemVariation,
      },
      passedVariationNames: {
        head: args.headVariationName,
        body: args.bodyVariationName,
        item: args.itemVariationName,
      },
      now,
    });

    // 4. Ensure balance records exist for all variations
    await ensureEssenceBalances(ctx, {
      walletAddress: args.walletAddress,
      variations: [
        { id: variationData.headVariationId, name: variationData.headVariationName, type: 'head' },
        { id: variationData.bodyVariationId, name: variationData.bodyVariationName, type: 'body' },
        { id: variationData.itemVariationId, name: variationData.itemVariationName, type: 'item' },
      ],
    });

    // 5. Update essence tracking state (activate if needed)
    await updateEssenceTracking(ctx, {
      walletAddress: args.walletAddress,
      now,
    });

    // 6. Mark Mek as slotted in meks table for tenure tracking
    const hasName = await markMekAsSlotted(ctx, {
      walletAddress: args.walletAddress,
      mekAssetId: args.mekAssetId,
      slotNumber: args.slotNumber,
      now,
    });

    return {
      success: true,
      shouldShowNaming: !hasName,
    };
  },
});

// Unslot a Mek from a slot
export const unslotMek = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Validate operation preconditions
    const { slot, mekAssetId } = await validateUnslotOperation(ctx, {
      walletAddress: args.walletAddress,
      slotNumber: args.slotNumber,
    });

    // 2. Snapshot current essence state before making changes
    await snapshotEssenceState(ctx, args.walletAddress);

    // 3. Mark Mek as unslotted (calculates and saves tenure)
    await markMekAsUnslotted(ctx, {
      mekAssetId,
      slottedAt: slot.slottedAt || now,
      now,
    });

    // 4. Clear slot data
    await clearSlot(ctx, {
      slotId: slot._id,
      now,
    });

    // 5. Update essence tracking state (deactivate if no more slotted Meks)
    await updateEssenceTracking(ctx, {
      walletAddress: args.walletAddress,
      now,
    });

    return { success: true };
  },
});

// Swap a Mek (costs gold)
export const swapMek = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
    newMekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber, newMekAssetId } = args;

    // Get tracking for swap cost
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!tracking) {
      throw new Error("Essence system not initialized");
    }

    // Get config for swap costs
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    if (!config) {
      throw new Error("Essence config not found");
    }

    // Calculate swap cost
    const swapCost =
      tracking.currentSwapCost === 0
        ? config.swapBaseCost
        : Math.min(
            tracking.currentSwapCost + config.swapCostIncrement,
            config.swapCostMax
          );

    // Get player's gold
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMining || (goldMining.accumulatedGold || 0) < swapCost) {
      throw new Error("Insufficient gold");
    }

    // Deduct gold
    await ctx.db.patch(goldMining._id, {
      accumulatedGold: (goldMining.accumulatedGold || 0) - swapCost,
    });

    // TODO: Refactor slotMek/unslotMek to use internal helper functions
    // For now, throw not implemented error to unblock deployment
    throw new Error("swapMek is not yet implemented - use unslotMek and slotMek separately");
  },
});

// Unlock a slot (costs gold + essence)
export const unlockSlot = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber } = args;

    if (slotNumber < 2 || slotNumber > 6) {
      throw new Error("Invalid slot number (must be 2-6)");
    }

    // Get slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.isUnlocked) {
      throw new Error("Slot already unlocked");
    }

    // Get requirements
    const requirements = await ctx.db
      .query("essenceSlotRequirements")
      .withIndex("by_wallet_and_slot", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!requirements) {
      throw new Error("Slot requirements not found");
    }

    // Check gold
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMining || (goldMining.accumulatedGold || 0) < requirements.goldCost) {
      throw new Error("Insufficient gold");
    }

    // Check essence requirements
    for (const req of requirements.requiredEssences) {
      const balance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_variation", (q: any) =>
          q.eq("walletAddress", walletAddress).eq("variationId", req.variationId)
        )
        .first();

      if (!balance || balance.accumulatedAmount < req.amountRequired) {
        throw new Error(`Insufficient ${req.variationName} essence`);
      }
    }

    // Deduct gold
    await ctx.db.patch(goldMining._id, {
      accumulatedGold: (goldMining.accumulatedGold || 0) - requirements.goldCost,
    });

    // Deduct essences
    for (const req of requirements.requiredEssences) {
      const balance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_variation", (q: any) =>
          q.eq("walletAddress", walletAddress).eq("variationId", req.variationId)
        )
        .first();

      if (balance) {
        const now = Date.now();
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount - req.amountRequired,
          lastSnapshotTime: now, // Update snapshot when spending essence
          lastUpdated: now,
        });
      }
    }

    // Unlock slot
    const now = Date.now();
    await ctx.db.patch(slot._id, {
      isUnlocked: true,
      unlockedAt: now,
      lastModified: now,
    });

    return { success: true };
  },
});

// Manual checkpoint trigger for testing (can be called from frontend)
export const triggerManualEssenceCheckpoint = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    console.log('🔧 [MANUAL CHECKPOINT] Manually triggered checkpoint for', walletAddress);
    await calculateAndUpdateEssence(ctx, walletAddress);
    return { success: true, timestamp: Date.now() };
  },
});

// Calculate and update accumulated essence
async function calculateAndUpdateEssence(ctx: any, walletAddress: string) {
  const tracking = await ctx.db
    .query("essenceTracking")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .first();

  if (!tracking || !tracking.isActive) {
    return;
  }

  const config = await ctx.db
    .query("essenceConfig")
    .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
    .first();

  if (!config) {
    return;
  }

  // Get all slotted Meks
  const slots = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .collect();

  const slottedMeks = slots.filter((s: any) => s.mekAssetId);

  // Count variations from slotted Meks
  const variationCounts = new Map<number, { name: string; type: string; count: number }>();

  for (const slot of slottedMeks) {
    if (slot.headVariationId && slot.headVariationName) {
      const existing = variationCounts.get(slot.headVariationId);
      variationCounts.set(slot.headVariationId, {
        name: slot.headVariationName,
        type: "head",
        count: (existing?.count || 0) + 1,
      });
    }
    if (slot.bodyVariationId && slot.bodyVariationName) {
      const existing = variationCounts.get(slot.bodyVariationId);
      variationCounts.set(slot.bodyVariationId, {
        name: slot.bodyVariationName,
        type: "body",
        count: (existing?.count || 0) + 1,
      });
    }
    if (slot.itemVariationId && slot.itemVariationName) {
      const existing = variationCounts.get(slot.itemVariationId);
      variationCounts.set(slot.itemVariationId, {
        name: slot.itemVariationName,
        type: "item",
        count: (existing?.count || 0) + 1,
      });
    }
  }

  const now = Date.now();
  const daysElapsed = (now - tracking.lastCalculationTime) / (1000 * 60 * 60 * 24);

  console.log('🔄 [CHECKPOINT MUTATION] Running checkpoint for', walletAddress, {
    lastCalculationTime: new Date(tracking.lastCalculationTime).toISOString(),
    now: new Date(now).toISOString(),
    daysElapsed: daysElapsed.toFixed(6),
    variationsToUpdate: variationCounts.size
  });

  // PERFORMANCE OPTIMIZATION: Query ALL buff sources ONCE (not per variation)
  // This reduces N queries to 1 query
  const allBuffSources = await ctx.db
    .query("essenceBuffSources")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  // Filter out expired buffs
  const activeBuffSources = allBuffSources.filter(
    (s: any) => !s.expiresAt || s.expiresAt > now
  );

  // Build lookup map for fast access
  const buffMap = new Map<number, { rateMultiplier: number; capBonus: number }>();
  for (const source of activeBuffSources) {
    const existing = buffMap.get(source.variationId) || { rateMultiplier: 1.0, capBonus: 0 };
    buffMap.set(source.variationId, {
      rateMultiplier: existing.rateMultiplier + (source.rateMultiplier - 1.0),
      capBonus: existing.capBonus + source.capBonus,
    });
  }

  // Calculate new balances
  for (const [variationId, data] of variationCounts.entries()) {
    // Get current balance - query by NAME to prevent duplicates with different IDs
    let balance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_name", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("variationName", data.name)
      )
      .first();

    const currentAmount = balance?.accumulatedAmount || 0;

    // Get buff from pre-built map (FAST - no database query)
    const buff = buffMap.get(variationId) || { rateMultiplier: 1.0, capBonus: 0 };

    const effectiveRate = config.essenceRate * buff.rateMultiplier;
    const effectiveCap = config.essenceCap + buff.capBonus;

    // Calculate essence earned
    const essenceEarned = daysElapsed * effectiveRate * data.count;
    const newAmount = clampEssenceToCap(currentAmount + essenceEarned, effectiveCap);

    console.log(`💾 [CHECKPOINT MUTATION] Saving ${data.name}:`, {
      oldAmount: currentAmount.toFixed(12),
      essenceEarned: essenceEarned.toFixed(12),
      newAmount: newAmount.toFixed(12),
      rate: effectiveRate,
      count: data.count
    });

    // Use helper to safely update/create balance (prevents duplicates)
    await setEssenceBalance(ctx, {
      walletAddress,
      variationId,
      variationName: data.name,
      variationType: data.type as "head" | "body" | "item",
      amount: newAmount,
    });
  }

  // Update tracking
  await ctx.db.patch(tracking._id, {
    lastCalculationTime: now,
    lastModified: now,
  });
}

// Get essence config
export const getEssenceConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();
  },
});

// Update essence config (admin only)
export const updateEssenceConfig = mutation({
  args: {
    slot2GoldCost: v.optional(v.number()),
    slot3GoldCost: v.optional(v.number()),
    slot4GoldCost: v.optional(v.number()),
    slot5GoldCost: v.optional(v.number()),
    slot6GoldCost: v.optional(v.number()),
    slot2EssenceCount: v.optional(v.number()),
    slot3EssenceCount: v.optional(v.number()),
    slot4EssenceCount: v.optional(v.number()),
    slot5EssenceCount: v.optional(v.number()),
    slot6EssenceCount: v.optional(v.number()),
    rarityGroup1: v.optional(v.array(v.number())),
    rarityGroup2: v.optional(v.array(v.number())),
    rarityGroup3: v.optional(v.array(v.number())),
    rarityGroup4: v.optional(v.array(v.number())),
    swapBaseCost: v.optional(v.number()),
    swapCostIncrement: v.optional(v.number()),
    swapCostMax: v.optional(v.number()),
    essenceRate: v.optional(v.number()),
    essenceCap: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    const updates = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (config) {
      await ctx.db.patch(config._id, updates);
    } else {
      // Create default config
      await ctx.db.insert("essenceConfig", {
        configType: "global",
        slot2GoldCost: args.slot2GoldCost || 10000,
        slot3GoldCost: args.slot3GoldCost || 50000,
        slot4GoldCost: args.slot4GoldCost || 150000,
        slot5GoldCost: args.slot5GoldCost || 500000,
        slot6GoldCost: args.slot6GoldCost || 1000000,
        slot2EssenceCount: args.slot2EssenceCount || 2,
        slot3EssenceCount: args.slot3EssenceCount || 3,
        slot4EssenceCount: args.slot4EssenceCount || 4,
        slot5EssenceCount: args.slot5EssenceCount || 5,
        slot6EssenceCount: args.slot6EssenceCount || 6,
        rarityGroup1: args.rarityGroup1 || [],
        rarityGroup2: args.rarityGroup2 || [],
        rarityGroup3: args.rarityGroup3 || [],
        rarityGroup4: args.rarityGroup4 || [],
        swapBaseCost: args.swapBaseCost || 1000,
        swapCostIncrement: args.swapCostIncrement || 500,
        swapCostMax: args.swapCostMax || 10000,
        essenceRate: args.essenceRate || 0.1,
        essenceCap: args.essenceCap || 10,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});

// Admin function to add essence for testing
export const adminAddEssence = mutation({
  args: {
    walletAddress: v.string(),
    variationName: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, variationName, amount } = args;

    // Find the variation by name to get its ID
    // For now, just use the name as a simple identifier
    const now = Date.now();

    // Try to find existing balance
    const existingBalance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    const balance = existingBalance.find((b: any) => b.variationName === variationName);

    if (balance) {
      // Update existing balance
      await ctx.db.patch(balance._id, {
        accumulatedAmount: balance.accumulatedAmount + amount,
        lastSnapshotTime: now, // Update snapshot when adding essence
        lastUpdated: now,
      });
    } else {
      // Create new balance
      await ctx.db.insert("essenceBalances", {
        walletAddress,
        variationId: 0, // Placeholder - doesn't matter for market testing
        variationName,
        variationType: "item" as const,
        accumulatedAmount: amount,
        lastSnapshotTime: now, // Set snapshot for new balance
        lastUpdated: now,
      });
    }

    return { success: true, newAmount: (balance?.accumulatedAmount || 0) + amount };
  },
});

// Daily checkpoint for market visibility (internal - called by cron)
export const dailyEssenceCheckpoint = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all active players
    const activeTracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .collect();

    let updatedCount = 0;
    const now = Date.now();

    for (const tracking of activeTracking) {
      try {
        // Calculate and update essence for this player
        await calculateAndUpdateEssence(ctx, tracking.walletAddress);

        // Update checkpoint time
        await ctx.db.patch(tracking._id, {
          lastCheckpointTime: now,
        });

        updatedCount++;
      } catch (error) {
        console.error(
          `Failed to update essence for ${tracking.walletAddress}:`,
          error
        );
      }
    }

    console.log(
      `Daily essence checkpoint completed. Updated ${updatedCount} players.`
    );

    return { success: true, playersUpdated: updatedCount };
  },
});

// 5-minute checkpoint for persistence and crash recovery (internal - called by cron)
// Mirrors gold system's updateGoldCheckpoint pattern
export const updateEssenceCheckpoints = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all players with active slotted Meks
    const allSlots = await ctx.db.query("essenceSlots").collect();

    // Get unique wallet addresses that have at least one slotted Mek
    const activeWallets = new Set(
      allSlots
        .filter((slot: any) => slot.mekAssetId) // Has a Mek slotted
        .map((slot: any) => slot.walletAddress)
    );

    let updatedCount = 0;
    const now = Date.now();

    for (const walletAddress of activeWallets) {
      try {
        // Calculate and update essence for this player
        // This updates accumulatedAmount and lastSnapshotTime for all their variations
        await calculateAndUpdateEssence(ctx, walletAddress);
        updatedCount++;
      } catch (error) {
        console.error(
          `[Essence Checkpoint] Failed to update essence for ${walletAddress.substring(0, 20)}:`,
          error
        );
      }
    }

    console.log(
      `[Essence Checkpoint] Updated ${updatedCount} active players with slotted Meks.`
    );

    return { success: true, playersUpdated: updatedCount };
  },
});

// Migration: Delete all test essence balances for clean slate
// This removes all existing balances that lack lastSnapshotTime field
// Safe to run - balances will recreate when players slot Meks
export const deleteTestEssenceBalances = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration] Starting test essence balance deletion...');

    const allBalances = await ctx.db.query("essenceBalances").collect();
    const totalCount = allBalances.length;

    console.log(`[Migration] Found ${totalCount} essence balance records to delete`);

    let deletedCount = 0;
    for (const balance of allBalances) {
      await ctx.db.delete(balance._id);
      deletedCount++;
    }

    console.log(`[Migration] Complete - Deleted ${deletedCount} essence balance records`);
    console.log('[Migration] Clean slate ready - new balances will have lastSnapshotTime field');

    return {
      success: true,
      deleted: deletedCount,
      message: `Deleted ${deletedCount} test essence balances. System ready for production.`
    };
  }
});

/**
 * Get all buffs for a specific player
 */
export const getPlayerBuffs = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const buffs = await ctx.db
      .query("essencePlayerBuffs")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return buffs;
  },
});

/**
 * Add a cap bonus buff for a specific variation
 */
export const addCapBuff = mutation({
  args: {
    walletAddress: v.string(),
    variationId: v.number(),
    capBonus: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if buff already exists for this variation
    const existing = await ctx.db
      .query("essencePlayerBuffs")
      .withIndex("by_wallet_and_variation", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("variationId", args.variationId)
      )
      .first();

    if (existing) {
      // Update existing buff
      await ctx.db.patch(existing._id, {
        capBonus: args.capBonus,
        source: args.source,
        appliedAt: Date.now(),
      });
      return { success: true, mode: "updated", buffId: existing._id };
    } else {
      // Create new buff
      const buffId = await ctx.db.insert("essencePlayerBuffs", {
        walletAddress: args.walletAddress,
        variationId: args.variationId,
        rateMultiplier: 1.0, // Default rate multiplier
        capBonus: args.capBonus,
        source: args.source,
        appliedAt: Date.now(),
      });
      return { success: true, mode: "created", buffId };
    }
  },
});

/**
 * Query to check potential essence loss before removing a buff
 * Frontend should call this first and show warning if loss will occur
 */
export const checkBuffRemovalImpact = query({
  args: {
    buffId: v.id("essencePlayerBuffs"),
  },
  handler: async (ctx, args) => {
    // Get the buff being removed
    const buff = await ctx.db.get(args.buffId);
    if (!buff) {
      throw new Error("Buff not found");
    }

    // Get essence config
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    if (!config) {
      throw new Error("Essence config not found");
    }

    // Get current balance for this variation
    const balance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_variation", (q: any) =>
        q.eq("walletAddress", buff.walletAddress).eq("variationId", buff.variationId)
      )
      .first();

    if (!balance) {
      // No balance exists, so no loss possible
      return {
        willLoseEssence: false,
        lossAmount: 0,
        changes: [],
      };
    }

    const currentCap = config.essenceCap + buff.capBonus;
    const newCap = config.essenceCap; // Back to base cap after buff removal
    const currentAmount = balance.accumulatedAmount;
    const newAmount = clampEssenceToCap(currentAmount, newCap);
    const lossAmount = Math.max(0, currentAmount - newAmount);

    return {
      willLoseEssence: lossAmount > 0,
      lossAmount,
      changes: [
        {
          variationName: balance.variationName,
          variationType: balance.variationType,
          currentCap,
          newCap,
          currentAmount,
          lossAmount,
        },
      ],
    };
  },
});

/**
 * Remove a cap bonus buff
 * CRITICAL: Frontend should call checkBuffRemovalImpact first and show warning if needed
 */
export const removeCapBuff = mutation({
  args: {
    buffId: v.id("essencePlayerBuffs"),
    acknowledgeEssenceLoss: v.optional(v.boolean()), // Must be true if loss will occur
  },
  handler: async (ctx, args) => {
    // Get the buff to check if it will cause essence loss
    const buff = await ctx.db.get(args.buffId);
    if (!buff) {
      throw new Error("Buff not found");
    }

    // Get config and balance to check for loss
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q: any) => q.eq("configType", "global"))
      .first();

    const balance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_variation", (q: any) =>
        q.eq("walletAddress", buff.walletAddress).eq("variationId", buff.variationId)
      )
      .first();

    if (config && balance && buff.capBonus > 0) {
      const currentCap = config.essenceCap + buff.capBonus;
      const newCap = config.essenceCap;
      const currentAmount = balance.accumulatedAmount;
      const newAmount = clampEssenceToCap(currentAmount, newCap);
      const lossAmount = currentAmount - newAmount;

      // If loss will occur, require acknowledgment
      if (lossAmount > 0 && !args.acknowledgeEssenceLoss) {
        throw new Error(
          `This will cause loss of ${lossAmount.toFixed(2)} ${balance.variationName} essence. ` +
            `Set acknowledgeEssenceLoss=true to proceed.`
        );
      }

      // Apply the loss by clamping to new cap
      if (lossAmount > 0) {
        await ctx.db.patch(balance._id, {
          accumulatedAmount: newAmount,
          lastSnapshotTime: Date.now(),
          lastUpdated: Date.now(),
        });

        console.log(
          `⚠️ [BUFF REMOVAL] ${balance.variationName} essence reduced from ${currentAmount.toFixed(2)} to ${newAmount.toFixed(2)} (lost ${lossAmount.toFixed(2)})`
        );
      }
    }

    // Delete the buff
    await ctx.db.delete(args.buffId);
    return { success: true };
  },
});

/**
 * ADMIN: Fix missing variation IDs in slotted Meks
 * Use this to repair slots where variation lookup failed
 */
export const fixSlotVariationId = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
    headVariationId: v.optional(v.number()),
    bodyVariationId: v.optional(v.number()),
    itemVariationId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber, headVariationId, bodyVariationId, itemVariationId } = args;

    // Get the slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q: any) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!slot) {
      throw new Error("Slot not found");
    }

    const updates: any = { lastModified: Date.now() };

    if (headVariationId !== undefined) {
      updates.headVariationId = headVariationId;
    }
    if (bodyVariationId !== undefined) {
      updates.bodyVariationId = bodyVariationId;
    }
    if (itemVariationId !== undefined) {
      updates.itemVariationId = itemVariationId;
    }

    await ctx.db.patch(slot._id, updates);

    console.log(`✅ [ADMIN FIX] Updated slot ${slotNumber} for ${walletAddress.slice(0, 15)}...`, updates);

    return { success: true, updated: updates };
  },
});

/**
 * ADMIN: Fix all slots with missing variation IDs by name match
 */
export const fixAllMissingVariationIds = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all slots
    const allSlots = await ctx.db.query("essenceSlots").collect();

    let fixedCount = 0;
    const fixes: any[] = [];

    for (const slot of allSlots) {
      const updates: any = {};

      // Check if item variation name exists but ID is missing
      if (slot.itemVariationName && !slot.itemVariationId) {
        // Look up the variation ID by name
        const itemVar = await ctx.db
          .query("variationsReference")
          .withIndex("by_name", (q: any) => q.eq("name", slot.itemVariationName))
          .filter((q: any) => q.eq(q.field("type"), "item"))
          .first();

        if (itemVar) {
          updates.itemVariationId = itemVar.variationId;
          console.log(`🔧 [AUTO FIX] Slot ${slot.slotNumber}: "${slot.itemVariationName}" → ID ${itemVar.variationId}`);
        } else {
          console.log(`⚠️  [AUTO FIX] Slot ${slot.slotNumber}: "${slot.itemVariationName}" NOT FOUND in variationsReference`);
        }
      }

      // Check head variation
      if (slot.headVariationName && !slot.headVariationId) {
        const headVar = await ctx.db
          .query("variationsReference")
          .withIndex("by_name", (q: any) => q.eq("name", slot.headVariationName))
          .filter((q: any) => q.eq(q.field("type"), "head"))
          .first();

        if (headVar) {
          updates.headVariationId = headVar.variationId;
        }
      }

      // Check body variation
      if (slot.bodyVariationName && !slot.bodyVariationId) {
        const bodyVar = await ctx.db
          .query("variationsReference")
          .withIndex("by_name", (q: any) => q.eq("name", slot.bodyVariationName))
          .filter((q: any) => q.eq(q.field("type"), "body"))
          .first();

        if (bodyVar) {
          updates.bodyVariationId = bodyVar.variationId;
        }
      }

      // Apply updates if any were found
      if (Object.keys(updates).length > 0) {
        updates.lastModified = Date.now();
        await ctx.db.patch(slot._id, updates);
        fixedCount++;
        fixes.push({
          slotNumber: slot.slotNumber,
          wallet: slot.walletAddress?.slice(0, 15) + "...",
          updates
        });
      }
    }

    console.log(`✅ [AUTO FIX COMPLETE] Fixed ${fixedCount} slots`);

    return { success: true, fixedCount, fixes };
  },
});

/**
 * ADMIN: Add missing variation to variationsReference table
 */
export const addMissingVariation = mutation({
  args: {
    variationId: v.number(),
    name: v.string(),
    type: v.union(v.literal("head"), v.literal("body"), v.literal("item")),
  },
  handler: async (ctx, args) => {
    // Check if it already exists
    const existing = await ctx.db
      .query("variationsReference")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .filter((q: any) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      return { success: false, message: "Variation already exists", existing };
    }

    // Insert the variation
    const id = await ctx.db.insert("variationsReference", {
      variationId: args.variationId,
      name: args.name,
      type: args.type,
    });

    console.log(`✅ [VARIATION ADDED] ${args.type} variation "${args.name}" with ID ${args.variationId}`);

    return { success: true, id, variationId: args.variationId };
  },
});

/**
 * ADMIN: Seed all 291 variations from COMPLETE_VARIATION_RARITY
 * This ensures every variation ID has a corresponding record
 */
export const seedAllVariations = mutation({
  args: {},
  handler: async (ctx) => {
    // Import the complete variation data
    const COMPLETE_VARIATION_RARITY = [
      // We'll need to pass this as an array since we can't import client-side code
      // For now, let's just seed the missing ones manually
    ];

    console.log('⚠️ [SEED] This function needs to be called with variation data from the client');
    console.log('⚠️ [SEED] Use the seedMissingVariationsFromList mutation instead');

    return { success: false, message: 'Use seedMissingVariationsFromList instead' };
  },
});

/**
 * ADMIN: Seed specific variations by passing them in
 */
export const seedMissingVariationsFromList = mutation({
  args: {
    variations: v.array(v.object({
      variationId: v.number(),
      name: v.string(),
      type: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    let added = 0;
    let skipped = 0;

    for (const variation of args.variations) {
      // Check if already exists
      const existing = await ctx.db
        .query("variationsReference")
        .filter((q: any) => q.eq(q.field("variationId"), variation.variationId))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Add the variation
      await ctx.db.insert("variationsReference", {
        variationId: variation.variationId,
        name: variation.name,
        type: variation.type as "head" | "body" | "item",
      });

      added++;
      console.log(`✅ [SEED] Added variation ${variation.variationId}: ${variation.name} (${variation.type})`);
    }

    return { success: true, added, skipped, total: args.variations.length };
  },
});

/**
 * ADMIN: Fix tenure for all currently slotted Meks
 * This ensures existing slotted Meks have tenurePoints initialized to 0
 */
export const fixSlottedMeksTenure = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[🔒TENURE-FIX] Starting tenure fix for slotted Meks...');

    // Get all Meks that are currently slotted
    const allMeks = await ctx.db.query("meks").collect();
    const slottedMeks = allMeks.filter((m: any) => m.isSlotted);

    console.log(`[🔒TENURE-FIX] Found ${slottedMeks.length} slotted Meks`);

    let fixedCount = 0;
    const now = Date.now();

    for (const mek of slottedMeks) {
      // Check if tenurePoints is undefined
      if (mek.tenurePoints === undefined) {
        console.log(`[🔒TENURE-FIX] Fixing ${mek.assetId}: tenurePoints was undefined, setting to 0`);

        await ctx.db.patch(mek._id, {
          tenurePoints: 0, // Initialize to 0
          lastTenureUpdate: now, // Set current time as start point
        });

        fixedCount++;
      } else {
        console.log(`[🔒TENURE-FIX] Skipping ${mek.assetId}: tenurePoints already exists (${mek.tenurePoints})`);
      }
    }

    console.log(`[🔒TENURE-FIX] Complete - Fixed ${fixedCount} Meks`);

    return {
      success: true,
      totalSlotted: slottedMeks.length,
      fixed: fixedCount,
      message: `Fixed ${fixedCount} slotted Meks with missing tenure data`
    };
  },
});

/**
 * ADMIN: Check which variation IDs (1-291) are missing from variationsReference
 */
export const checkMissingVariations = query({
  args: {},
  handler: async (ctx) => {
    const allVariations = await ctx.db.query("variationsReference").collect();
    const existingIds = new Set(allVariations.map((v: any) => v.variationId));

    const missing: number[] = [];
    for (let id = 1; id <= 291; id++) {
      if (!existingIds.has(id)) {
        missing.push(id);
      }
    }

    console.log(`📊 [VARIATION CHECK] Total variations in DB: ${allVariations.length}`);
    console.log(`📊 [VARIATION CHECK] Missing variation IDs (1-291): ${missing.length > 0 ? missing.join(', ') : 'None!'}`);

    return {
      total: allVariations.length,
      expected: 291,
      missing,
      missingCount: missing.length
    };
  },
});

/**
 * ADMIN: Fix essence balances with variationId = 0
 * Look up correct variation ID by name and update the record
 */
export const fixZeroVariationIds = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all essence balances with variationId = 0
    const allBalances = await ctx.db.query("essenceBalances").collect();
    const zeroIdBalances = allBalances.filter((b: any) => b.variationId === 0);

    console.log(`🔧 [FIX VARIATION IDS] Found ${zeroIdBalances.length} balances with variationId = 0`);

    let fixed = 0;
    const fixes: any[] = [];

    for (const balance of zeroIdBalances) {
      // Look up the correct variation ID by name and type
      const variation = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q: any) => q.eq("name", balance.variationName))
        .filter((q: any) => q.eq(q.field("type"), balance.variationType))
        .first();

      if (variation) {
        // Update the balance with correct variation ID
        await ctx.db.patch(balance._id, {
          variationId: variation.variationId,
          lastUpdated: Date.now()
        });

        console.log(`✅ [FIX] Updated "${balance.variationName}" (${balance.variationType}): 0 → ${variation.variationId}`);

        fixed++;
        fixes.push({
          name: balance.variationName,
          type: balance.variationType,
          oldId: 0,
          newId: variation.variationId
        });
      } else {
        console.log(`⚠️  [FIX] No variation found for "${balance.variationName}" (${balance.variationType})`);
      }
    }

    return { success: true, fixed, total: zeroIdBalances.length, fixes };
  },
});

/**
 * ADMIN: Apply global cap buff to ALL variations (1-291)
 */
export const addGlobalCapBuff = mutation({
  args: {
    walletAddress: v.string(),
    capBonus: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, capBonus } = args;
    const now = Date.now();

    let created = 0;
    let updated = 0;

    // Apply buff to all 291 variations (variationId 1-291)
    for (let variationId = 1; variationId <= 291; variationId++) {
      // Check if buff already exists for this variation
      const existing = await ctx.db
        .query("essencePlayerBuffs")
        .withIndex("by_wallet_and_variation", (q: any) =>
          q.eq("walletAddress", walletAddress).eq("variationId", variationId)
        )
        .first();

      if (existing) {
        // Update existing buff
        await ctx.db.patch(existing._id, {
          capBonus,
          source: `Admin: Global cap buff`,
          appliedAt: now,
        });
        updated++;
      } else {
        // Create new buff
        await ctx.db.insert("essencePlayerBuffs", {
          walletAddress,
          variationId,
          rateMultiplier: 1.0,
          capBonus,
          source: `Admin: Global cap buff`,
          appliedAt: now,
        });
        created++;
      }
    }

    console.log(`✅ [GLOBAL BUFF] Applied +${capBonus} cap to all 291 variations for ${walletAddress.slice(0, 15)}... (created: ${created}, updated: ${updated})`);

    return { success: true, created, updated, totalVariations: 291 };
  },
});

// ============================================
// PHASE 1 TESTING MUTATIONS
// These are temporary mutations for testing the granular buff system
// TODO: Remove these after Phase 1 verification is complete
// ============================================

/**
 * Test adding a buff source (Phase 1 verification)
 */
export const testAddBuffSource = mutation({
  args: {
    walletAddress: v.string(),
    variationId: v.number(),
    rateMultiplier: v.number(),
    capBonus: v.number(),
    sourceType: v.string(),
    sourceId: v.string(),
    sourceName: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await addBuffSource(ctx, {
      walletAddress: args.walletAddress,
      variationId: args.variationId,
      rateMultiplier: args.rateMultiplier,
      capBonus: args.capBonus,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      grantedBy: "test",
      grantReason: "Phase 1 testing",
    });

    return result;
  },
});

/**
 * Test getting aggregated buffs (Phase 1 verification)
 */
export const testGetAggregatedBuffs = query({
  args: {
    walletAddress: v.string(),
    variationId: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await getAggregatedBuffs(ctx, {
      walletAddress: args.walletAddress,
      variationId: args.variationId,
    });

    return result;
  },
});

/**
 * Test removing a buff source (Phase 1 verification)
 */
export const testRemoveBuffSource = mutation({
  args: {
    walletAddress: v.string(),
    variationId: v.number(),
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await removeBuffSource(ctx, {
      walletAddress: args.walletAddress,
      variationId: args.variationId,
      sourceId: args.sourceId,
    });

    return result;
  },
});

/**
 * Test cleanup - delete all test buff sources (Phase 1 verification)
 */
export const testCleanupBuffSources = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const buffs = await ctx.db
      .query("essenceBuffSources")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .filter((q: any) => q.eq(q.field("grantedBy"), "test"))
      .collect();

    for (const buff of buffs) {
      await ctx.db.delete(buff._id);
    }

    return { success: true, deletedCount: buffs.length };
  },
});

// ============================================
// CLEANUP MUTATION - TRANSITION TO GRANULAR SYSTEM
// Run this once to delete old aggregate buffs from essencePlayerBuffs
// ============================================

/**
 * Delete all old aggregate buffs from essencePlayerBuffs table.
 * This is a one-time cleanup to transition to the granular essenceBuffSources system.
 *
 * WARNING: This will delete ALL buffs for the specified wallet.
 * Only run this during dev phase cleanup.
 */
export const cleanupOldAggregateBuffs = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const buffs = await ctx.db
      .query("essencePlayerBuffs")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    for (const buff of buffs) {
      await ctx.db.delete(buff._id);
    }

    console.log(`✅ [CLEANUP] Deleted ${buffs.length} old aggregate buffs from essencePlayerBuffs for ${args.walletAddress.slice(0, 15)}...`);

    return {
      success: true,
      deletedCount: buffs.length,
      message: `Deleted ${buffs.length} old aggregate buffs. Ready for granular essenceBuffSources system.`
    };
  },
});

// ============================================
// BUFF BREAKDOWN QUERY FOR UI
// Returns detailed breakdown of all buff sources grouped by variation
// ============================================

/**
 * Get exhaustive breakdown of all buff sources for a player.
 * Shows each individual source (achievement, upgrade, slot, etc.) contributing to essence generation.
 *
 * @param walletAddress - Player's wallet address
 * @param variationId - Optional: filter to specific variation
 * @returns Array of variations with their buff sources and aggregated totals
 */
export const getPlayerBuffBreakdown = query({
  args: {
    walletAddress: v.string(),
    variationId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Query buff sources for this wallet
    let sourcesQuery = ctx.db
      .query("essenceBuffSources")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress));

    // Filter by variation if specified
    if (args.variationId !== undefined) {
      sourcesQuery = ctx.db
        .query("essenceBuffSources")
        .withIndex("by_wallet_and_variation", (q: any) =>
          q.eq("walletAddress", args.walletAddress).eq("variationId", args.variationId)
        );
    }

    const allSources = await sourcesQuery.collect();

    // Filter out expired and inactive buffs
    const now = Date.now();
    const activeSources = allSources.filter(
      (s) => s.isActive && (!s.expiresAt || s.expiresAt > now)
    );

    // Group by variation
    const variationMap = new Map<number, any>();

    for (const source of activeSources) {
      if (!variationMap.has(source.variationId)) {
        variationMap.set(source.variationId, {
          variationId: source.variationId,
          totalRateMultiplier: 1.0,
          totalCapBonus: 0,
          sources: [],
        });
      }

      const entry = variationMap.get(source.variationId)!;

      // Accumulate totals
      entry.totalRateMultiplier += source.rateMultiplier - 1.0;
      entry.totalCapBonus += source.capBonus;

      // Add source details
      entry.sources.push({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        sourceDescription: source.sourceDescription,
        rateMultiplier: source.rateMultiplier,
        capBonus: source.capBonus,
        appliedAt: source.appliedAt,
        expiresAt: source.expiresAt,
        isActive: source.isActive,
      });
    }

    return Array.from(variationMap.values());
  },
});

/**
 * DIAGNOSTIC: Check if user's slotted Meks exist in meks table
 * This helps diagnose why tenure tracking isn't working
 */
export const diagnosticCheckSlottedMeksInMeksTable = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Get all slotted Meks from essence slots
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    const slottedSlots = slots.filter((s: any) => s.mekAssetId);
    const results: any[] = [];

    for (const slot of slottedSlots) {
      // Check if this Mek exists in meks table
      const mekRecord = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", slot.mekAssetId!))
        .first();

      // Check if it exists in goldMining.ownedMeks
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      const ownedMek = goldMining?.ownedMeks?.find((m: any) => m.assetId === slot.mekAssetId);

      results.push({
        slotNumber: slot.slotNumber,
        mekAssetId: slot.mekAssetId,
        existsInMeksTable: !!mekRecord,
        existsInGoldMining: !!ownedMek,
        mekRecordData: mekRecord ? {
          assetId: mekRecord.assetId,
          assetName: mekRecord.assetName,
          owner: mekRecord.owner,
          isSlotted: mekRecord.isSlotted,
          tenurePoints: mekRecord.tenurePoints,
          lastTenureUpdate: mekRecord.lastTenureUpdate,
        } : null,
        diagnosis: !mekRecord
          ? "❌ PROBLEM: Mek not in meks table - tenure won't work!"
          : !mekRecord.isSlotted
          ? "⚠️  WARNING: Mek in meks table but isSlotted=false"
          : mekRecord.lastTenureUpdate
          ? "✅ OK: Mek properly configured for tenure"
          : "⚠️  WARNING: Mek slotted but lastTenureUpdate not set"
      });
    }

    return {
      walletAddress: args.walletAddress,
      totalSlottedMeks: slottedSlots.length,
      results,
      summary: {
        inMeksTable: results.filter((r: any) => r.existsInMeksTable).length,
        notInMeksTable: results.filter((r: any) => !r.existsInMeksTable).length,
        properlyConfigured: results.filter((r: any) => r.diagnosis.startsWith("✅")).length,
      }
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS FOR SLOT OPERATIONS (Separation of Concerns Refactor)
// ============================================================================
// These helper functions break down the monolithic slotMek/unslotMek operations
// into focused, single-responsibility functions for better maintainability.
// ============================================================================

/**
 * Validates that a slot operation can proceed
 * Checks: slot exists, is unlocked, Mek exists, Mek is owned, Mek not already slotted
 */
async function validateSlotOperation(
  ctx: any,
  args: {
    walletAddress: string;
    slotNumber: number;
    mekAssetId: string;
  }
) {
  const { walletAddress, slotNumber, mekAssetId } = args;

  // Try to get Mek from meks table first
  let mek = await ctx.db
    .query("meks")
    .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
    .first();

  // If not in meks table, check goldMining.ownedMeks
  if (!mek) {
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (goldMining) {
      const ownedMek = goldMining.ownedMeks?.find((m: any) => m.assetId === mekAssetId);
      if (ownedMek) {
        mek = ownedMek as any;
      }
    }
  }

  if (!mek) {
    throw new Error("Mek not found in database or goldMining records");
  }

  // Verify ownership
  if (mek.owner && mek.owner !== walletAddress) {
    throw new Error("You don't own this Mek");
  }

  // Check if Mek is already slotted
  const existingSlot = await ctx.db
    .query("essenceSlots")
    .withIndex("by_mek", (q: any) => q.eq("mekAssetId", mekAssetId))
    .first();

  if (existingSlot) {
    throw new Error("This Mek is already slotted");
  }

  // Get the target slot
  const slot = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet_and_slot", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
    )
    .first();

  if (!slot) {
    throw new Error("Slot not found");
  }

  if (!slot.isUnlocked) {
    throw new Error("Slot is locked");
  }

  return { slot, mek };
}

/**
 * Validates that an unslot operation can proceed
 * Checks: slot exists and has a Mek slotted
 */
async function validateUnslotOperation(
  ctx: any,
  args: {
    walletAddress: string;
    slotNumber: number;
  }
) {
  const { walletAddress, slotNumber } = args;

  const slot = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet_and_slot", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
    )
    .first();

  if (!slot) {
    throw new Error("Slot not found");
  }

  if (!slot.mekAssetId) {
    throw new Error("Slot is already empty");
  }

  return { slot, mekAssetId: slot.mekAssetId };
}

/**
 * Snapshots current essence state before making changes
 * This ensures no essence is lost during slot operations
 */
async function snapshotEssenceState(ctx: any, walletAddress: string) {
  await calculateAndUpdateEssence(ctx, walletAddress);
}

/**
 * Updates a slot record with Mek data
 */
async function updateSlotWithMek(
  ctx: any,
  args: {
    slotId: any;
    mekData: {
      assetId: string;
      assetName: string;
      sourceKey: string;
      headVariationId?: number;
      headVariation?: string;
      bodyVariationId?: number;
      bodyVariation?: string;
      itemVariationId?: number;
      itemVariation?: string;
    };
    passedVariationNames: {
      head?: string;
      body?: string;
      item?: string;
    };
    now: number;
  }
) {
  const { slotId, mekData, passedVariationNames, now } = args;

  // Use passed-in variation names (from frontend lookup) or fall back to Mek data
  const headVariationName = passedVariationNames.head || mekData.headVariation;
  const bodyVariationName = passedVariationNames.body || mekData.bodyVariation;
  const itemVariationName = passedVariationNames.item || mekData.itemVariation;

  // Look up variation IDs if not present (goldMining.ownedMeks doesn't have them)
  let headVariationId = mekData.headVariationId;
  let bodyVariationId = mekData.bodyVariationId;
  let itemVariationId = mekData.itemVariationId;

  if (!headVariationId && headVariationName) {
    const headVar = await ctx.db
      .query("variationsReference")
      .withIndex("by_name", (q: any) => q.eq("name", headVariationName))
      .filter((q: any) => q.eq(q.field("type"), "head"))
      .first();
    headVariationId = headVar?.variationId;
  }

  if (!bodyVariationId && bodyVariationName) {
    const bodyVar = await ctx.db
      .query("variationsReference")
      .withIndex("by_name", (q: any) => q.eq("name", bodyVariationName))
      .filter((q: any) => q.eq(q.field("type"), "body"))
      .first();
    bodyVariationId = bodyVar?.variationId;
  }

  if (!itemVariationId && itemVariationName) {
    const itemVar = await ctx.db
      .query("variationsReference")
      .withIndex("by_name", (q: any) => q.eq("name", itemVariationName))
      .filter((q: any) => q.eq(q.field("type"), "item"))
      .first();
    itemVariationId = itemVar?.variationId;
  }

  // Update slot
  await ctx.db.patch(slotId, {
    mekAssetId: mekData.assetId,
    mekNumber: parseInt(mekData.assetName.replace("Mek #", "")),
    mekSourceKey: mekData.sourceKey,
    headVariationId,
    headVariationName,
    bodyVariationId,
    bodyVariationName,
    itemVariationId,
    itemVariationName,
    slottedAt: now,
    lastModified: now,
  });

  return {
    headVariationId,
    headVariationName,
    bodyVariationId,
    bodyVariationName,
    itemVariationId,
    itemVariationName,
  };
}

/**
 * Clears Mek data from a slot record
 */
async function clearSlot(ctx: any, args: { slotId: any; now: number }) {
  const { slotId, now } = args;

  await ctx.db.patch(slotId, {
    mekAssetId: undefined,
    mekNumber: undefined,
    mekSourceKey: undefined,
    headVariationId: undefined,
    headVariationName: undefined,
    bodyVariationId: undefined,
    bodyVariationName: undefined,
    itemVariationId: undefined,
    itemVariationName: undefined,
    slottedAt: undefined,
    lastModified: now,
  });
}

/**
 * Ensures balance records exist for new variations
 * Creates missing balance records with zero amounts
 */
async function ensureEssenceBalances(
  ctx: any,
  args: {
    walletAddress: string;
    variations: Array<{
      id: number | undefined;
      name: string | undefined;
      type: "head" | "body" | "item";
    }>;
  }
) {
  const { walletAddress, variations } = args;

  for (const variation of variations) {
    if (variation.id && variation.name) {
      await getOrCreateEssenceBalance(ctx, {
        walletAddress,
        variationId: variation.id,
        variationName: variation.name,
        variationType: variation.type,
        initialAmount: 0,
      });
      console.log(`✅ [SLOT MEK] Ensured balance record exists for ${variation.name} (${variation.type})`);
    }
  }
}

/**
 * Updates essence tracking state (activate/deactivate generation)
 */
async function updateEssenceTracking(
  ctx: any,
  args: {
    walletAddress: string;
    now: number;
  }
) {
  const { walletAddress, now } = args;

  // Check if any slots have Meks
  const allSlots = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .collect();

  const hasSlottedMek = allSlots.some((s: any) => s.mekAssetId);

  const tracking = await ctx.db
    .query("essenceTracking")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
    .first();

  if (!tracking) {
    return;
  }

  // Activate if we have slotted Meks and currently inactive
  if (hasSlottedMek && !tracking.isActive) {
    await ctx.db.patch(tracking._id, {
      isActive: true,
      activationTime: now,
      lastCalculationTime: now,
      lastModified: now,
    });
  }
  // Deactivate if no slotted Meks and currently active
  else if (!hasSlottedMek && tracking.isActive) {
    await ctx.db.patch(tracking._id, {
      isActive: false,
      lastModified: now,
    });
  }
}

/**
 * Marks a Mek as slotted in the meks table for tenure tracking
 */
async function markMekAsSlotted(
  ctx: any,
  args: {
    walletAddress: string;
    mekAssetId: string;
    slotNumber: number;
    now: number;
  }
): Promise<boolean> {
  const { walletAddress, mekAssetId, slotNumber, now } = args;

  console.log(`[🔒TENURE-DEBUG] ========================================`);
  console.log(`[🔒TENURE-DEBUG] 🔥 TENURE UPDATE CODE BLOCK REACHED 🔥`);
  console.log(`[🔒TENURE-DEBUG] ========================================`);
  console.log(`[🔒TENURE-DEBUG] Step 1: About to query meks table for assetId: ${mekAssetId}`);

  let hasName = false;

  try {
    const mekRecord = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
      .first();

    console.log(`[🔒TENURE-DEBUG] Step 2: Query completed. mekRecord is ${mekRecord ? 'FOUND' : 'NULL'}`);

    if (mekRecord) {
      console.log(`[🔒TENURE-DEBUG] === SLOTTING MEK IN MEKS TABLE ===`);
      console.log(`[🔒TENURE-DEBUG] Mek _id: ${mekRecord._id}`);
      console.log(`[🔒TENURE-DEBUG] Mek assetId: ${mekAssetId}`);
      console.log(`[🔒TENURE-DEBUG] Mek assetName: ${mekRecord.assetName}`);
      console.log(`[🔒TENURE-DEBUG] BEFORE patch - tenurePoints: ${mekRecord.tenurePoints} (type: ${typeof mekRecord.tenurePoints})`);
      console.log(`[🔒TENURE-DEBUG] BEFORE patch - isSlotted: ${mekRecord.isSlotted} (type: ${typeof mekRecord.isSlotted})`);
      console.log(`[🔒TENURE-DEBUG] BEFORE patch - slotNumber: ${mekRecord.slotNumber}`);
      console.log(`[🔒TENURE-DEBUG] BEFORE patch - lastTenureUpdate: ${mekRecord.lastTenureUpdate}`);

      console.log(`[🔒TENURE-DEBUG] Step 3: Checking for custom name...`);
      // Check if Mek has custom name
      try {
        const goldMiningRecord = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
          .first();

        if (goldMiningRecord && goldMiningRecord.ownedMeks) {
          hasName = !!goldMiningRecord.ownedMeks.find((m: any) => m.assetId === mekAssetId)?.customName;
          console.log(`[🔒TENURE-DEBUG] Custom name check: hasName = ${hasName}`);
        } else {
          console.log(`[🔒TENURE-DEBUG] No goldMining record or ownedMeks found`);
        }
      } catch (nameCheckError) {
        console.error(`[🔒TENURE-DEBUG] ERROR checking custom name:`, nameCheckError);
      }

      console.log(`[🔒TENURE-DEBUG] Step 4: Preparing patch data...`);
      const tenureToSave = mekRecord.tenurePoints ?? 0;

      const patchData = {
        isSlotted: true,
        slotNumber: slotNumber,
        lastTenureUpdate: now,
        tenurePoints: tenureToSave,
      };

      console.log(`[🔒TENURE-DEBUG] PATCH DATA being applied:`, JSON.stringify(patchData, null, 2));
      console.log(`[🔒TENURE-DEBUG] Patching document ID: ${mekRecord._id}`);

      console.log(`[🔒TENURE-DEBUG] Step 5: Executing patch...`);
      try {
        await ctx.db.patch(mekRecord._id, patchData);
        console.log(`[🔒TENURE-DEBUG] ✅ PATCH COMPLETED SUCCESSFULLY`);
      } catch (patchError) {
        console.error(`[🔒TENURE-DEBUG] ❌ PATCH FAILED:`, patchError);
        throw patchError;
      }

      console.log(`[🔒TENURE-DEBUG] Step 6: Re-fetching to verify...`);
      try {
        const updatedMek = await ctx.db.get(mekRecord._id);
        console.log(`[🔒TENURE-DEBUG] === AFTER PATCH VERIFICATION ===`);
        if (updatedMek) {
          console.log(`[🔒TENURE-DEBUG] ✅ Record found after patch`);
          console.log(`[🔒TENURE-DEBUG] AFTER patch - tenurePoints: ${updatedMek.tenurePoints} (type: ${typeof updatedMek.tenurePoints})`);
          console.log(`[🔒TENURE-DEBUG] AFTER patch - isSlotted: ${updatedMek.isSlotted} (type: ${typeof updatedMek.isSlotted})`);
          console.log(`[🔒TENURE-DEBUG] AFTER patch - slotNumber: ${updatedMek.slotNumber}`);
          console.log(`[🔒TENURE-DEBUG] AFTER patch - lastTenureUpdate: ${updatedMek.lastTenureUpdate}`);
        } else {
          console.error(`[🔒TENURE-DEBUG] ❌ Record NOT found after patch! This should never happen!`);
        }
      } catch (verifyError) {
        console.error(`[🔒TENURE-DEBUG] ❌ VERIFICATION FAILED:`, verifyError);
      }

      console.log(`[🔒TENURE-DEBUG] === SLOTTING COMPLETE ===`);
    } else {
      console.error(`[🔒TENURE-DEBUG] ❌ WARNING: No mek record found in meks table for assetId ${mekAssetId}!`);
      console.log(`[🔒TENURE-DEBUG] This means the Mek exists in goldMining.ownedMeks but NOT in the meks table.`);
      console.log(`[🔒TENURE-DEBUG] Tenure tracking CANNOT be enabled for this Mek until it's added to meks table.`);
    }
  } catch (error) {
    console.error(`[🔒TENURE-DEBUG] ❌ FATAL ERROR in tenure update block:`, error);
    console.error(`[🔒TENURE-DEBUG] Error name: ${(error as Error).name}`);
    console.error(`[🔒TENURE-DEBUG] Error message: ${(error as Error).message}`);
    console.error(`[🔒TENURE-DEBUG] Error stack:`, (error as Error).stack);
  }

  console.log(`[🔒TENURE-DEBUG] ========================================`);
  console.log(`[🔒TENURE-DEBUG] 🔥 TENURE UPDATE CODE BLOCK FINISHED 🔥`);
  console.log(`[🔒TENURE-DEBUG] ========================================`);

  return hasName;
}

/**
 * Marks a Mek as unslotted in the meks table
 * Calculates and saves final tenure points
 */
async function markMekAsUnslotted(
  ctx: any,
  args: {
    mekAssetId: string;
    slottedAt: number;
    now: number;
  }
) {
  const { mekAssetId, slottedAt, now } = args;

  // Calculate tenure earned
  const timeSlotted = (now - slottedAt) / 1000;
  const tenureEarned = timeSlotted * 1; // 1 tenure point per second base rate

  console.log(`[🔒TENURE] Unslotting Mek ${mekAssetId}: earned ${tenureEarned.toFixed(2)} tenure points (${timeSlotted.toFixed(0)}s slotted)`);

  // Save tenure to meks table
  const mekRecord = await ctx.db
    .query("meks")
    .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
    .first();

  if (mekRecord) {
    const currentTenure = mekRecord.tenurePoints || 0;
    const newTenure = currentTenure + tenureEarned;
    console.log(`[🔒TENURE] Saving to meks table: ${currentTenure.toFixed(2)} + ${tenureEarned.toFixed(2)} = ${newTenure.toFixed(2)}`);

    await ctx.db.patch(mekRecord._id, {
      tenurePoints: newTenure,
      lastTenureUpdate: now,
      isSlotted: false,
      slotNumber: undefined,
    });
  }
}
