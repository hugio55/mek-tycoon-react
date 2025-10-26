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

  // DEBUG: Log what's in each slotted Mek
  console.log(`🔍 [SLOT READING] Found ${slottedMeks.length} slotted Meks for ${walletAddress.slice(0, 15)}...`);
  for (const slot of slottedMeks) {
    console.log(`🔍 [SLOT ${slot.slotNumber}] Mek #${slot.mekNumber}:`, {
      headVariationId: slot.headVariationId,
      headVariationName: slot.headVariationName,
      bodyVariationId: slot.bodyVariationId,
      bodyVariationName: slot.bodyVariationName,
      itemVariationId: slot.itemVariationId,
      itemVariationName: slot.itemVariationName
    });
  }

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
    } else if (slot.itemVariationName) {
      // DEBUG: Item variation name exists but no ID!
      console.log(`⚠️ [SLOT ${slot.slotNumber}] Item variation "${slot.itemVariationName}" has NO variationId!`);
    }
  }

  const rates: { [variationId: number]: number } = {};
  const counts: { [variationId: number]: number } = {};
  const caps: { [variationId: number]: number } = {};

  // Get all unique variation IDs (from slotted Meks, existing balances, AND active buffs)
  const safeBalances = balances ?? [];

  // Get all variations that have buffs applied
  const playerBuffs = await ctx.db
    .query("essencePlayerBuffs")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .collect();

  console.log(`🔍 [CAP DEBUG] Retrieved ${playerBuffs.length} buffs for ${walletAddress.slice(0, 15)}...`);
  console.log(`🔍 [CAP DEBUG] Slotted variations: ${variationCounts.size}, Balance records: ${safeBalances.length}`);

  const allVariationIds = new Set<number>([
    ...Array.from(variationCounts.keys()),
    ...safeBalances.map(b => b.variationId),
    ...playerBuffs.map(b => b.variationId) // CRITICAL: Include buffed variations
  ]);

  console.log(`🔍 [CAP DEBUG] Total unique variation IDs to process: ${allVariationIds.size}`);

  // Create a map of variationId → buff for quick lookup
  const buffMap = new Map<number, any>();
  for (const buff of playerBuffs) {
    buffMap.set(buff.variationId, buff);
  }

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

      // DEBUG: Log rate calculation for variations with count > 1
      if (count > 1) {
        console.log(`🔢 [DUPLICATE VARIATION DEBUG] variationId ${variationId}:`, {
          count,
          effectiveRate,
          calculatedRate,
          walletAddress: walletAddress.slice(0, 15) + '...'
        });
      }

      rates[variationId] = calculatedRate; // Stack rates for duplicates
      counts[variationId] = count;
    }

    // Set cap for ALL variations (even if not currently slotted)
    caps[variationId] = effectiveCap;
  }

  console.log(`🔍 [CAP DEBUG] Finished calculating caps for ${Object.keys(caps).length} variations`);
  console.log(`🔍 [CAP DEBUG] Sample caps:`, Object.entries(caps).slice(0, 10).map(([id, cap]) => `${id}:${cap}`));

  // Log a few specific variations to verify
  const sampleIds = [1, 26, 154, 190, 233, 288]; // Random sample including Nothing (288)
  console.log(`🔍 [CAP DEBUG] Specific variation caps:`, sampleIds.map(id => `${id}:${caps[id]}`).join(', '));

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
      .withIndex("by_wallet_and_variation", (q) =>
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
      .withIndex("by_wallet_and_slot", (q) =>
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
          .withIndex("by_name", (q) => q.eq("name", slot.itemVariationName))
          .filter((q) => q.eq(q.field("type"), "item"))
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
          .withIndex("by_name", (q) => q.eq("name", slot.headVariationName))
          .filter((q) => q.eq(q.field("type"), "head"))
          .first();

        if (headVar) {
          updates.headVariationId = headVar.variationId;
        }
      }

      // Check body variation
      if (slot.bodyVariationName && !slot.bodyVariationId) {
        const bodyVar = await ctx.db
          .query("variationsReference")
          .withIndex("by_name", (q) => q.eq("name", slot.bodyVariationName))
          .filter((q) => q.eq(q.field("type"), "body"))
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
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => q.eq(q.field("type"), args.type))
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
 * ADMIN: Seed all 288 variations from COMPLETE_VARIATION_RARITY
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
        .filter((q) => q.eq(q.field("variationId"), variation.variationId))
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
 * ADMIN: Seed all 288 variations - hardcoded from variationsReferenceData.ts
 * Skips any that already exist
 */
export const seedAllMissingVariations = mutation({
  args: {},
  handler: async (ctx) => {
    // Complete list of all 288 variations (heads 1-102, bodies 103-214, items 215-288)
    const allVariations: Array<{ id: number; name: string; type: "head" | "body" | "item" }> = [
      // HEADS (1-102)
      { id: 1, name: "Ace of Spades Ultimate", type: "head" },
      { id: 2, name: "Derelict", type: "head" },
      { id: 3, name: "Discomania", type: "head" },
      { id: 4, name: "Ellie Mesh", type: "head" },
      { id: 5, name: "Frost King", type: "head" },
      { id: 6, name: "Nyan Ultimate", type: "head" },
      { id: 7, name: "Obliterator", type: "head" },
      { id: 8, name: "Paul Ultimate", type: "head" },
      { id: 9, name: "Pie", type: "head" },
      { id: 10, name: "Projectionist", type: "head" },
      { id: 11, name: "Ross", type: "head" },
      { id: 12, name: "Acid", type: "head" },
      { id: 13, name: "Gold", type: "head" },
      { id: 14, name: "Lazer", type: "head" },
      { id: 15, name: "Wires", type: "head" },
      { id: 16, name: "Nightstalker", type: "head" },
      { id: 17, name: "Nyan", type: "head" },
      { id: 18, name: "Paul", type: "head" },
      { id: 19, name: "Pizza", type: "head" },
      { id: 20, name: "Terminator", type: "head" },
      { id: 21, name: "24K", type: "head" },
      { id: 22, name: "China", type: "head" },
      { id: 23, name: "Stained Glass", type: "head" },
      { id: 24, name: "The Lethal Dimension", type: "head" },
      { id: 25, name: "Magma", type: "head" },
      { id: 26, name: "???", type: "head" },
      { id: 27, name: "Silicon", type: "head" },
      { id: 28, name: "Bone Daddy", type: "head" },
      { id: 29, name: "Bowling", type: "head" },
      { id: 30, name: "Snow", type: "head" },
      { id: 31, name: "The Ram", type: "head" },
      { id: 32, name: "Whiskey", type: "head" },
      { id: 33, name: "Arcade", type: "head" },
      { id: 34, name: "Mint", type: "head" },
      { id: 35, name: "Bubblegum", type: "head" },
      { id: 36, name: "Ballerina", type: "head" },
      { id: 37, name: "Heatmap", type: "head" },
      { id: 38, name: "Acrylic", type: "head" },
      { id: 39, name: "Quilt", type: "head" },
      { id: 40, name: "Ornament", type: "head" },
      { id: 41, name: "Sleet", type: "head" },
      { id: 42, name: "Hades", type: "head" },
      { id: 43, name: "Drill", type: "head" },
      { id: 44, name: "Cotton Candy", type: "head" },
      { id: 45, name: "Mesh", type: "head" },
      { id: 46, name: "Tron", type: "head" },
      { id: 47, name: "Ace of Spades", type: "head" },
      { id: 48, name: "Mars Attacks", type: "head" },
      { id: 49, name: "Dualtone", type: "head" },
      { id: 50, name: "Flaked", type: "head" },
      { id: 51, name: "Electrik", type: "head" },
      { id: 52, name: "Hal", type: "head" },
      { id: 53, name: "Recon", type: "head" },
      { id: 54, name: "Sun", type: "head" },
      { id: 55, name: "Sterling", type: "head" },
      { id: 56, name: "Lich", type: "head" },
      { id: 57, name: "Plate", type: "head" },
      { id: 58, name: "Porcelain", type: "head" },
      { id: 59, name: "Cream", type: "head" },
      { id: 60, name: "Baby", type: "head" },
      { id: 61, name: "Disco", type: "head" },
      { id: 62, name: "Liquid Lavender", type: "head" },
      { id: 63, name: "Dragonfly", type: "head" },
      { id: 64, name: "Sahara", type: "head" },
      { id: 65, name: "Grass", type: "head" },
      { id: 66, name: "Ivory", type: "head" },
      { id: 67, name: "1960's", type: "head" },
      { id: 68, name: "Royal", type: "head" },
      { id: 69, name: "Silent Film", type: "head" },
      { id: 70, name: "Boss", type: "head" },
      { id: 71, name: "Butane", type: "head" },
      { id: 72, name: "Coin", type: "head" },
      { id: 73, name: "Hacker", type: "head" },
      { id: 74, name: "Bumblebee", type: "head" },
      { id: 75, name: "Camo", type: "head" },
      { id: 76, name: "Plastik", type: "head" },
      { id: 77, name: "Mac & Cheese", type: "head" },
      { id: 78, name: "Crimson", type: "head" },
      { id: 79, name: "Dazed Piggy", type: "head" },
      { id: 80, name: "Mahogany", type: "head" },
      { id: 81, name: "Big Brother", type: "head" },
      { id: 82, name: "Snapshot", type: "head" },
      { id: 83, name: "Cadillac", type: "head" },
      { id: 84, name: "Corroded", type: "head" },
      { id: 85, name: "Rust", type: "head" },
      { id: 86, name: "Business", type: "head" },
      { id: 87, name: "Neon Flamingo", type: "head" },
      { id: 88, name: "Aztec", type: "head" },
      { id: 89, name: "Milk", type: "head" },
      { id: 90, name: "Aqua", type: "head" },
      { id: 91, name: "desufnoC", type: "head" },
      { id: 92, name: "Bark", type: "head" },
      { id: 93, name: "Polished", type: "head" },
      { id: 94, name: "Lightning", type: "head" },
      { id: 95, name: "Ol' Faithful", type: "head" },
      { id: 96, name: "Classic", type: "head" },
      { id: 97, name: "Shamrock", type: "head" },
      { id: 98, name: "Exposed", type: "head" },
      { id: 99, name: "Nuke", type: "head" },
      { id: 100, name: "Kevlar", type: "head" },
      { id: 101, name: "Log", type: "head" },
      { id: 102, name: "Taser", type: "head" },

      // BODIES (103-214)
      { id: 103, name: "Burnt Ultimate", type: "body" },
      { id: 104, name: "Carving Ultimate", type: "body" },
      { id: 105, name: "Chrome Ultimate", type: "body" },
      { id: 106, name: "Cousin Itt", type: "body" },
      { id: 107, name: "Frost Cage", type: "body" },
      { id: 108, name: "Fury", type: "body" },
      { id: 109, name: "Gatsby Ultimate", type: "body" },
      { id: 110, name: "Heatwave Ultimate", type: "body" },
      { id: 111, name: "Luxury Ultimate", type: "body" },
      { id: 112, name: "Plush Ultimate", type: "body" },
      { id: 113, name: "X Ray Ultimate", type: "body" },
      { id: 114, name: "007", type: "body" },
      { id: 115, name: "Cartoon", type: "body" },
      { id: 116, name: "Heatwave", type: "body" },
      { id: 117, name: "Luxury", type: "body" },
      { id: 118, name: "Majesty", type: "body" },
      { id: 119, name: "Oil", type: "body" },
      { id: 120, name: "Seabiscuit", type: "body" },
      { id: 121, name: "Gatsby", type: "body" },
      { id: 122, name: "Pearl", type: "body" },
      { id: 123, name: "Spaghetti", type: "body" },
      { id: 124, name: "Tarpie", type: "body" },
      { id: 125, name: "Cartoonichrome", type: "body" },
      { id: 126, name: "Granite", type: "body" },
      { id: 127, name: "Tie Dye", type: "body" },
      { id: 128, name: "Burnt", type: "body" },
      { id: 129, name: "Damascus", type: "body" },
      { id: 130, name: "Giger", type: "body" },
      { id: 131, name: "Maze", type: "body" },
      { id: 132, name: "Bag", type: "body" },
      { id: 133, name: "Nuggets", type: "body" },
      { id: 134, name: "Radiance", type: "body" },
      { id: 135, name: "Jolly Rancher", type: "body" },
      { id: 136, name: "Shipped", type: "body" },
      { id: 137, name: "Lord", type: "body" },
      { id: 138, name: "X Ray", type: "body" },
      { id: 139, name: "OE Light", type: "body" },
      { id: 140, name: "Peppermint", type: "body" },
      { id: 141, name: "Blood", type: "body" },
      { id: 142, name: "Seafoam", type: "body" },
      { id: 143, name: "Ocean", type: "body" },
      { id: 144, name: "Carving", type: "body" },
      { id: 145, name: "Rug", type: "body" },
      { id: 146, name: "Trapped", type: "body" },
      { id: 147, name: "Frosted", type: "body" },
      { id: 148, name: "Sticky", type: "body" },
      { id: 149, name: "Vapor", type: "body" },
      { id: 150, name: "Inner Rainbow", type: "body" },
      { id: 151, name: "Frostbit", type: "body" },
      { id: 152, name: "Denim", type: "body" },
      { id: 153, name: "Stars", type: "body" },
      { id: 154, name: "White", type: "body" },
      { id: 155, name: "Doom", type: "body" },
      { id: 156, name: "Journey", type: "body" },
      { id: 157, name: "Mercury", type: "body" },
      { id: 158, name: "Stone", type: "body" },
      { id: 159, name: "Tiles", type: "body" },
      { id: 160, name: "Soul", type: "body" },
      { id: 161, name: "Lizard", type: "body" },
      { id: 162, name: "Cheetah", type: "body" },
      { id: 163, name: "Sunset", type: "body" },
      { id: 164, name: "Rose", type: "body" },
      { id: 165, name: "Tat", type: "body" },
      { id: 166, name: "Tangerine", type: "body" },
      { id: 167, name: "Eyes", type: "body" },
      { id: 168, name: "Happymeal", type: "body" },
      { id: 169, name: "Maple", type: "body" },
      { id: 170, name: "Ooze", type: "body" },
      { id: 171, name: "Obsidian", type: "body" },
      { id: 172, name: "Prickles", type: "body" },
      { id: 173, name: "Prom", type: "body" },
      { id: 174, name: "Crystal Camo", type: "body" },
      { id: 175, name: "Marble", type: "body" },
      { id: 176, name: "Rattler", type: "body" },
      { id: 177, name: "Forest", type: "body" },
      { id: 178, name: "Poker", type: "body" },
      { id: 179, name: "Black", type: "body" },
      { id: 180, name: "Arctic", type: "body" },
      { id: 181, name: "Rust", type: "body" },
      { id: 182, name: "Smurf", type: "body" },
      { id: 183, name: "Dr.", type: "body" },
      { id: 184, name: "Aztec", type: "body" },
      { id: 185, name: "Meat", type: "body" },
      { id: 186, name: "Highlights", type: "body" },
      { id: 187, name: "Leeloo", type: "body" },
      { id: 188, name: "Waves", type: "body" },
      { id: 189, name: "Plush", type: "body" },
      { id: 190, name: "Tickle", type: "body" },
      { id: 191, name: "Mugged", type: "body" },
      { id: 192, name: "Victoria", type: "body" },
      { id: 193, name: "Cubes", type: "body" },
      { id: 194, name: "Sand", type: "body" },
      { id: 195, name: "Heart", type: "body" },
      { id: 196, name: "Carbon", type: "body" },
      { id: 197, name: "Crystal Clear", type: "body" },
      { id: 198, name: "Sir", type: "body" },
      { id: 199, name: "Princess", type: "body" },
      { id: 200, name: "Chrome", type: "body" },
      { id: 201, name: "Steam", type: "body" },
      { id: 202, name: "Goblin", type: "body" },
      { id: 203, name: "OE Dark", type: "body" },
      { id: 204, name: "Bone", type: "body" },
      { id: 205, name: "Abominable", type: "body" },
      { id: 206, name: "Sky", type: "body" },
      { id: 207, name: "Blush", type: "body" },
      { id: 208, name: "Iron", type: "body" },
      { id: 209, name: "James", type: "body" },
      { id: 210, name: "Noob", type: "body" },
      { id: 211, name: "Matte", type: "body" },
      { id: 212, name: "Couch", type: "body" },
      { id: 213, name: "Maps", type: "body" },
      { id: 214, name: "Grate", type: "body" },

      // ITEMS (215-288)
      { id: 215, name: "Golden Guns Ultimate", type: "item" },
      { id: 216, name: "Gone", type: "item" },
      { id: 217, name: "King Tut", type: "item" },
      { id: 218, name: "Linkinator 3000", type: "item" },
      { id: 219, name: "Oompah", type: "item" },
      { id: 220, name: "Peacock Ultimate", type: "item" },
      { id: 221, name: "Stolen", type: "item" },
      { id: 222, name: "Vanished", type: "item" },
      { id: 223, name: "Peacock", type: "item" },
      { id: 224, name: "Palace", type: "item" },
      { id: 225, name: "Drip", type: "item" },
      { id: 226, name: "Test Track", type: "item" },
      { id: 227, name: "Screamo", type: "item" },
      { id: 228, name: "Blasters", type: "item" },
      { id: 229, name: "Spectrum", type: "item" },
      { id: 230, name: "2001", type: "item" },
      { id: 231, name: "Crow", type: "item" },
      { id: 232, name: "Hydra", type: "item" },
      { id: 233, name: "Carbonite", type: "item" },
      { id: 234, name: "Iced", type: "item" },
      { id: 235, name: "Icon", type: "item" },
      { id: 236, name: "Splatter", type: "item" },
      { id: 237, name: "Holographic", type: "item" },
      { id: 238, name: "Ring Red", type: "item" },
      { id: 239, name: "Tactical", type: "item" },
      { id: 240, name: "Nuclear", type: "item" },
      { id: 241, name: "Foil", type: "item" },
      { id: 242, name: "Golden Guns", type: "item" },
      { id: 243, name: "LV-426", type: "item" },
      { id: 244, name: "Sap", type: "item" },
      { id: 245, name: "Bling", type: "item" },
      { id: 246, name: "R&B", type: "item" },
      { id: 247, name: "Earth", type: "item" },
      { id: 248, name: "Jeff", type: "item" },
      { id: 249, name: "Purplex", type: "item" },
      { id: 250, name: "Just Wren", type: "item" },
      { id: 251, name: "Angler", type: "item" },
      { id: 252, name: "Phoenix", type: "item" },
      { id: 253, name: "Firebird", type: "item" },
      { id: 254, name: "Heliotropium", type: "item" },
      { id: 255, name: "Black Parade", type: "item" },
      { id: 256, name: "Bonebox", type: "item" },
      { id: 257, name: "Hefner", type: "item" },
      { id: 258, name: "Hammerheat", type: "item" },
      { id: 259, name: "Luna", type: "item" },
      { id: 260, name: "Pop", type: "item" },
      { id: 261, name: "Ring Green", type: "item" },
      { id: 262, name: "Fourzin", type: "item" },
      { id: 263, name: "Molten Core", type: "item" },
      { id: 264, name: "Bumble Bird", type: "item" },
      { id: 265, name: "Deep Space", type: "item" },
      { id: 266, name: "Night Vision", type: "item" },
      { id: 267, name: "Albino", type: "item" },
      { id: 268, name: "Scissors", type: "item" },
      { id: 269, name: "Black & White", type: "item" },
      { id: 270, name: "Silver", type: "item" },
      { id: 271, name: "Whiteout", type: "item" },
      { id: 272, name: "Lumberjack", type: "item" },
      { id: 273, name: "Chromium", type: "item" },
      { id: 274, name: "Rainbow Morpho", type: "item" },
      { id: 275, name: "Pawn Shop", type: "item" },
      { id: 276, name: "Ring Blue", type: "item" },
      { id: 277, name: "Concrete", type: "item" },
      { id: 278, name: "Paparazzi", type: "item" },
      { id: 279, name: "Moth", type: "item" },
      { id: 280, name: "Who", type: "item" },
      { id: 281, name: "Contractor", type: "item" },
      { id: 282, name: "Stock", type: "item" },
      { id: 283, name: "101.1 FM", type: "item" },
      { id: 284, name: "Technicolor", type: "item" },
      { id: 285, name: "Near Space", type: "item" },
      { id: 286, name: "Vampire", type: "item" },
      { id: 287, name: "Pyrex", type: "item" },
      { id: 288, name: "Nothing", type: "item" },
    ];

    console.log(`🌱 [SEED] Starting migration to seed all 288 variations...`);

    // Load all existing variations in ONE query to avoid document read limit
    const existingVariations = await ctx.db.query("variationsReference").collect();
    const existingIds = new Set(existingVariations.map(v => v.variationId));

    console.log(`🌱 [SEED] Found ${existingVariations.length} existing variations in database`);

    let added = 0;
    let skipped = 0;

    for (const variation of allVariations) {
      // Check if already exists using the Set
      if (existingIds.has(variation.id)) {
        skipped++;
        continue;
      }

      // Add the variation
      await ctx.db.insert("variationsReference", {
        variationId: variation.id,
        name: variation.name,
        type: variation.type,
      });

      added++;
      console.log(`✅ [SEED] Added variation ${variation.id}: ${variation.name} (${variation.type})`);
    }

    console.log(`🌱 [SEED] Migration complete! Added: ${added}, Skipped: ${skipped}, Total: ${allVariations.length}`);

    return { success: true, added, skipped, total: allVariations.length };
  },
});

/**
 * ADMIN: Check which variation IDs (1-288) are missing from variationsReference
 */
export const checkMissingVariations = query({
  args: {},
  handler: async (ctx) => {
    const allVariations = await ctx.db.query("variationsReference").collect();
    const existingIds = new Set(allVariations.map(v => v.variationId));

    const missing: number[] = [];
    for (let id = 1; id <= 288; id++) {
      if (!existingIds.has(id)) {
        missing.push(id);
      }
    }

    console.log(`📊 [VARIATION CHECK] Total variations in DB: ${allVariations.length}`);
    console.log(`📊 [VARIATION CHECK] Missing variation IDs (1-288): ${missing.length > 0 ? missing.join(', ') : 'None!'}`);

    return {
      total: allVariations.length,
      expected: 288,
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
    const zeroIdBalances = allBalances.filter(b => b.variationId === 0);

    console.log(`🔧 [FIX VARIATION IDS] Found ${zeroIdBalances.length} balances with variationId = 0`);

    let fixed = 0;
    const fixes: any[] = [];

    for (const balance of zeroIdBalances) {
      // Look up the correct variation ID by name and type
      const variation = await ctx.db
        .query("variationsReference")
        .withIndex("by_name", (q) => q.eq("name", balance.variationName))
        .filter((q) => q.eq(q.field("type"), balance.variationType))
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
 * ADMIN: Apply global cap buff to ALL variations (1-288)
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

    // Apply buff to all 288 variations (variationId 1-288)
    for (let variationId = 1; variationId <= 288; variationId++) {
      // Check if buff already exists for this variation
      const existing = await ctx.db
        .query("essencePlayerBuffs")
        .withIndex("by_wallet_and_variation", (q) =>
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

    console.log(`✅ [GLOBAL BUFF] Applied +${capBonus} cap to all 288 variations for ${walletAddress.slice(0, 15)}... (created: ${created}, updated: ${updated})`);

    return { success: true, created, updated, totalVariations: 288 };
  },
});
