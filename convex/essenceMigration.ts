import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time migration to activate essence system for already-slotted Meks
 *
 * This fixes the issue where Meks were slotted before the new essence system
 * was deployed, so isActive=false and no balances exist.
 */
export const activateEssenceForSlottedMeks = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    console.log('[Migration] Starting activation for:', walletAddress);

    // Get tracking
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    if (!tracking) {
      return { success: false, message: "Essence system not initialized" };
    }

    // Get all slots
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Find slots with Meks
    const slottedMeks = slots.filter(s => s.mekAssetId);

    console.log('[Migration] Found slotted Meks:', slottedMeks.length);

    if (slottedMeks.length === 0) {
      return { success: false, message: "No Meks are slotted" };
    }

    // Get config
    const config = await ctx.db
      .query("essenceConfig")
      .withIndex("", (q: any) => q.eq("configType", "global"))
      .first();

    if (!config) {
      return { success: false, message: "Essence config not found" };
    }

    const now = Date.now();

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

    console.log('[Migration] Unique variations:', variationCounts.size);

    // Create essence balances for each variation
    let created = 0;
    for (const [variationId, data] of Array.from(variationCounts.entries())) {
      // Check if balance already exists
      const existing = await ctx.db
        .query("essenceBalances")
        .withIndex("", (q: any) =>
          q.eq("walletAddress", walletAddress).eq("variationId", variationId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("essenceBalances", {
          walletAddress,
          variationId,
          variationName: data.name,
          variationType: data.type as "head" | "body" | "item",
          accumulatedAmount: 0,
          lastUpdated: now,
        });
        created++;
      }
    }

    // Activate the system
    await ctx.db.patch(tracking._id, {
      isActive: true,
      activationTime: now,
      lastCalculationTime: now,
      lastModified: now,
    });

    console.log('[Migration] Activation complete:', {
      meksSlotted: slottedMeks.length,
      variationsFound: variationCounts.size,
      balancesCreated: created,
    });

    return {
      success: true,
      message: "Essence system activated",
      meksSlotted: slottedMeks.length,
      variationsFound: variationCounts.size,
      balancesCreated: created,
    };
  },
});
