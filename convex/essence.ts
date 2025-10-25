import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { setEssenceBalance } from "./lib/essenceHelpers";

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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (existingTracking) {
      return { success: false, message: "Already initialized" };
    }

    // Ensure global config exists - create default if missing
    let config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
    .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
    requiredEssences: slot2Essences.map((varId: number) => ({
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
  const slottedMeks = slots.filter((s) => s.mekAssetId);

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

  // Get all unique variation IDs (from both slotted Meks and existing balances)
  const safeBalances = balances ?? [];
  const allVariationIds = new Set<number>([
    ...Array.from(variationCounts.keys()),
    ...safeBalances.map(b => b.variationId)
  ]);

  // Calculate rates and caps for all variations
  for (const variationId of allVariationIds) {
    const count = variationCounts.get(variationId) || 0;

    // Check for player buffs
    const buff = await ctx.db
      .query("essencePlayerBuffs")
      .withIndex("by_wallet_and_variation", (q) =>
        q.eq("walletAddress", walletAddress).eq("variationId", variationId)
      )
      .first();

    const rateMultiplier = buff?.rateMultiplier || 1.0;
    const capBonus = buff?.capBonus || 0;

    const effectiveRate = ((config?.essenceRate ?? 0.1) * rateMultiplier);
    const effectiveCap = ((config?.essenceCap ?? 10) + capBonus);

    // Only set rate if variation is currently slotted (count > 0)
    // CRITICAL: Multiply rate by count for duplicate variations
    if (count > 0) {
      rates[variationId] = effectiveRate * count; // Stack rates for duplicates
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    // Get slots
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get slot requirements
    const requirements = await ctx.db
      .query("essenceSlotRequirements")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get essence balances (RAW snapshots from DB)
    const rawBalances = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get config
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
      slots: slots.sort((a, b) => a.slotNumber - b.slotNumber),
      requirements: requirements.sort((a, b) => a.slotNumber - b.slotNumber),
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
    .withIndex("by_config_type", (q) => q.eq("configType", "global"))
    .first();

  if (!config) {
    return balances;
  }

  // Get all slotted Meks to calculate current production rates
  const slots = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .collect();

  const slottedMeks = slots.filter((s) => s.mekAssetId);

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

      // Check for player buffs
      const buff = await ctx.db
        .query("essencePlayerBuffs")
        .withIndex("by_wallet_and_variation", (q) =>
          q.eq("walletAddress", walletAddress).eq("variationId", balance.variationId)
        )
        .first();

      const rateMultiplier = buff?.rateMultiplier || 1.0;
      const capBonus = buff?.capBonus || 0;

      const effectiveRate = config.essenceRate * rateMultiplier;
      const effectiveCap = config.essenceCap + capBonus;

      // CRITICAL FIX: Calculate essence earned since lastCalculationTime (stored in tracking)
      // balance.accumulatedAmount contains the BASE amount as of lastCalculationTime
      // We calculate additional accumulation from lastCalculationTime to NOW
      const essenceEarnedSinceLastSave = daysElapsedSinceLastSave * effectiveRate * variationData.count;
      const currentRealTimeAmount = Math.min(balance.accumulatedAmount + essenceEarnedSinceLastSave, effectiveCap);

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
    const existingBalance = balances.find(b => b.variationId === variationId);
    if (!existingBalance) {
      // This variation is being produced but has no balance record
      // Calculate its accumulated amount
      const buff = await ctx.db
        .query("essencePlayerBuffs")
        .withIndex("by_wallet_and_variation", (q) =>
          q.eq("walletAddress", walletAddress).eq("variationId", variationId)
        )
        .first();

      const rateMultiplier = buff?.rateMultiplier || 1.0;
      const capBonus = buff?.capBonus || 0;

      const effectiveRate = config.essenceRate * rateMultiplier;
      const effectiveCap = config.essenceCap + capBonus;

      const essenceEarned = daysElapsed * effectiveRate * data.count;
      const newAmount = Math.min(essenceEarned, effectiveCap);

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
      .withIndex("by_asset_id", (q) => q.eq("assetId", mekAssetId))
      .first();

    // If not in meks table, check goldMining.ownedMeks
    if (!mek) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
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
      .withIndex("by_mek", (q) => q.eq("mekAssetId", mekAssetId))
      .first();

    if (existingSlot) {
      throw new Error("This Mek is already slotted");
    }

    // Get the slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q) =>
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
        .withIndex("by_name", (q) => q.eq("name", headVariationName))
        .filter((q) => q.eq(q.field("type"), "head"))
        .first();
      headVariationId = headVar?.variationId;
    }

    if (!bodyVariationId && bodyVariationName) {
      const bodyVar = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q) => q.eq("name", bodyVariationName))
        .filter((q) => q.eq(q.field("type"), "body"))
        .first();
      bodyVariationId = bodyVar?.variationId;
    }

    if (!itemVariationId && itemVariationName) {
      const itemVar = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q) => q.eq("name", itemVariationName))
        .filter((q) => q.eq(q.field("type"), "item"))
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

    // Activate essence generation if this is the first Mek slotted
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (tracking && !tracking.isActive) {
      await ctx.db.patch(tracking._id, {
        isActive: true,
        activationTime: now,
        lastCalculationTime: now,
        lastModified: now,
      });
    }

    return { success: true };
  },
});

// Unslot a Mek from a slot
export const unslotMek = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber } = args;

    // Get the slot
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q) =>
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    const hasSlottedMek = allSlots.some((s) => s.mekAssetId);

    if (!hasSlottedMek) {
      const tracking = await ctx.db
        .query("essenceTracking")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (!tracking) {
      throw new Error("Essence system not initialized");
    }

    // Get config for swap costs
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMining || goldMining.cumulativeGold < swapCost) {
      throw new Error("Insufficient gold");
    }

    // Deduct gold
    await ctx.db.patch(goldMining._id, {
      cumulativeGold: goldMining.cumulativeGold - swapCost,
    });

    // Unslot current Mek
    await unslotMek(ctx, { walletAddress, slotNumber });

    // Slot new Mek
    await slotMek(ctx, { walletAddress, slotNumber, mekAssetId: newMekAssetId });

    // Update swap tracking
    const now = Date.now();
    await ctx.db.patch(tracking._id, {
      totalSwapCount: tracking.totalSwapCount + 1,
      currentSwapCost: swapCost,
      lastModified: now,
    });

    return { success: true, goldSpent: swapCost };
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
      .withIndex("by_wallet_and_slot", (q) =>
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
      .withIndex("by_wallet_and_slot", (q) =>
        q.eq("walletAddress", walletAddress).eq("slotNumber", slotNumber)
      )
      .first();

    if (!requirements) {
      throw new Error("Slot requirements not found");
    }

    // Check gold
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (!goldMining || goldMining.cumulativeGold < requirements.goldCost) {
      throw new Error("Insufficient gold");
    }

    // Check essence requirements
    for (const req of requirements.requiredEssences) {
      const balance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_variation", (q) =>
          q.eq("walletAddress", walletAddress).eq("variationId", req.variationId)
        )
        .first();

      if (!balance || balance.accumulatedAmount < req.amountRequired) {
        throw new Error(`Insufficient ${req.variationName} essence`);
      }
    }

    // Deduct gold
    await ctx.db.patch(goldMining._id, {
      cumulativeGold: goldMining.cumulativeGold - requirements.goldCost,
    });

    // Deduct essences
    for (const req of requirements.requiredEssences) {
      const balance = await ctx.db
        .query("essenceBalances")
        .withIndex("by_wallet_and_variation", (q) =>
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
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .first();

  if (!tracking || !tracking.isActive) {
    return;
  }

  const config = await ctx.db
    .query("essenceConfig")
    .withIndex("by_config_type", (q) => q.eq("configType", "global"))
    .first();

  if (!config) {
    return;
  }

  // Get all slotted Meks
  const slots = await ctx.db
    .query("essenceSlots")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .collect();

  const slottedMeks = slots.filter((s) => s.mekAssetId);

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

  // Calculate new balances
  for (const [variationId, data] of variationCounts.entries()) {
    // Get current balance - query by NAME to prevent duplicates with different IDs
    let balance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_name", (q) =>
        q.eq("walletAddress", walletAddress).eq("variationName", data.name)
      )
      .first();

    const currentAmount = balance?.accumulatedAmount || 0;

    // Check for player buffs
    const buff = await ctx.db
      .query("essencePlayerBuffs")
      .withIndex("by_wallet_and_variation", (q) =>
        q.eq("walletAddress", walletAddress).eq("variationId", variationId)
      )
      .first();

    const rateMultiplier = buff?.rateMultiplier || 1.0;
    const capBonus = buff?.capBonus || 0;

    const effectiveRate = config.essenceRate * rateMultiplier;
    const effectiveCap = config.essenceCap + capBonus;

    // Calculate essence earned
    const essenceEarned = daysElapsed * effectiveRate * data.count;
    const newAmount = Math.min(currentAmount + essenceEarned, effectiveCap);

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
      .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
      .withIndex("by_config_type", (q) => q.eq("configType", "global"))
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    const balance = existingBalance.find(b => b.variationName === variationName);

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
      .withIndex("by_active", (q) => q.eq("isActive", true))
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
        .filter(slot => slot.mekAssetId) // Has a Mek slotted
        .map(slot => slot.walletAddress)
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
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_wallet_variation", (q) =>
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
 * Remove a cap bonus buff
 */
export const removeCapBuff = mutation({
  args: {
    buffId: v.id("essencePlayerBuffs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.buffId);
    return { success: true };
  },
});
