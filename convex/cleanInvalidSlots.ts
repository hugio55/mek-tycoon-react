import { mutation } from "./_generated/server";

/**
 * Clean up essence slots with invalid sourceKeys
 *
 * This mutation finds slots with sourceKeys like "aa1-aa1-aa1" (fake/test data)
 * and clears them to prevent 404 image errors.
 */
export const cleanInvalidSlots = mutation({
  handler: async (ctx) => {
    // Get all essence slots
    const allSlots = await ctx.db.query("essenceSlots").collect();

    const cleaned: string[] = [];
    const validSourceKeyPattern = /^[A-Z]{2}\d-[A-Z]{2}\d-[A-Z]{2}\d(-[A-Z])?$/i;

    for (const slot of allSlots) {
      // Check if slot has a sourceKey
      if (slot.mekSourceKey) {
        const cleanKey = slot.mekSourceKey.replace(/-[A-Z]$/, '').toUpperCase();

        // Check if it's the fake "AA1-AA1-AA1" pattern or other invalid data
        if (cleanKey === "AA1-AA1-AA1" || !validSourceKeyPattern.test(slot.mekSourceKey)) {
          // Clear all Mek data from this slot
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
            lastModified: Date.now(),
          });

          cleaned.push(`Wallet: ${slot.walletAddress.slice(0, 15)}..., Slot: ${slot.slotNumber}, SourceKey: ${slot.mekSourceKey}`);
        }
      }
    }

    return {
      success: true,
      cleanedCount: cleaned.length,
      details: cleaned
    };
  },
});

/**
 * Diagnostic query to find all invalid slots
 */
export const findInvalidSlots = mutation({
  handler: async (ctx) => {
    const allSlots = await ctx.db.query("essenceSlots").collect();

    const invalid: any[] = [];
    const validSourceKeyPattern = /^[A-Z]{2}\d-[A-Z]{2}\d-[A-Z]{2}\d(-[A-Z])?$/i;

    for (const slot of allSlots) {
      if (slot.mekSourceKey) {
        const cleanKey = slot.mekSourceKey.replace(/-[A-Z]$/, '').toUpperCase();

        if (cleanKey === "AA1-AA1-AA1" || !validSourceKeyPattern.test(slot.mekSourceKey)) {
          invalid.push({
            walletAddress: slot.walletAddress.slice(0, 20) + '...',
            slotNumber: slot.slotNumber,
            mekSourceKey: slot.mekSourceKey,
            mekAssetId: slot.mekAssetId || 'none',
            isUnlocked: slot.isUnlocked
          });
        }
      }
    }

    return {
      invalidCount: invalid.length,
      slots: invalid
    };
  },
});
