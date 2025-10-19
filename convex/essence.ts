import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

    // Create 5 slot records (slot 1 unlocked, 2-5 locked)
    for (let i = 1; i <= 5; i++) {
      await ctx.db.insert("essenceSlots", {
        walletAddress,
        slotNumber: i,
        isUnlocked: i === 1,
        unlockedAt: i === 1 ? now : undefined,
        lastModified: now,
      });
    }

    // Generate slot requirements for slots 2-5
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

    // Get essence balances
    const balances = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    return {
      tracking,
      slots: slots.sort((a, b) => a.slotNumber - b.slotNumber),
      requirements: requirements.sort((a, b) => a.slotNumber - b.slotNumber),
      balances,
    };
  },
});

// Slot a Mek into a slot
export const slotMek = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const { walletAddress, slotNumber, mekAssetId } = args;

    // Get the Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", mekAssetId))
      .first();

    if (!mek) {
      throw new Error("Mek not found");
    }

    if (mek.owner !== walletAddress) {
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

    // Update slot
    await ctx.db.patch(slot._id, {
      mekAssetId,
      mekNumber: parseInt(mek.assetName.replace("Mek #", "")),
      mekSourceKey: mek.sourceKey,
      headVariationId: mek.headVariationId,
      headVariationName: mek.headVariation,
      bodyVariationId: mek.bodyVariationId,
      bodyVariationName: mek.bodyVariation,
      itemVariationId: mek.itemVariationId,
      itemVariationName: mek.itemVariation,
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

    if (slotNumber < 2 || slotNumber > 5) {
      throw new Error("Invalid slot number (must be 2-5)");
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
        await ctx.db.patch(balance._id, {
          accumulatedAmount: balance.accumulatedAmount - req.amountRequired,
          lastUpdated: Date.now(),
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

  // Calculate new balances
  for (const [variationId, data] of variationCounts.entries()) {
    // Get current balance
    let balance = await ctx.db
      .query("essenceBalances")
      .withIndex("by_wallet_and_variation", (q) =>
        q.eq("walletAddress", walletAddress).eq("variationId", variationId)
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

    // Update or create balance
    if (balance) {
      await ctx.db.patch(balance._id, {
        accumulatedAmount: newAmount,
        lastUpdated: now,
      });
    } else {
      await ctx.db.insert("essenceBalances", {
        walletAddress,
        variationId,
        variationName: data.name,
        variationType: data.type as "head" | "body" | "item",
        accumulatedAmount: newAmount,
        lastUpdated: now,
      });
    }
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
    slot2EssenceCount: v.optional(v.number()),
    slot3EssenceCount: v.optional(v.number()),
    slot4EssenceCount: v.optional(v.number()),
    slot5EssenceCount: v.optional(v.number()),
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
        slot2EssenceCount: args.slot2EssenceCount || 2,
        slot3EssenceCount: args.slot3EssenceCount || 3,
        slot4EssenceCount: args.slot4EssenceCount || 4,
        slot5EssenceCount: args.slot5EssenceCount || 5,
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
