// Diagnostic query to check essence slot data
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get detailed slot information for debugging
 */
export const getSlotDetails = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    const slottedMeks = slots.filter(s => s.mekAssetId);

    console.log(`🔍 [DIAGNOSTIC] Found ${slottedMeks.length} slotted Meks for ${args.walletAddress.slice(0, 15)}...`);

    const details = slottedMeks.map(slot => {
      const variations = [];

      if (slot.headVariationName) {
        variations.push({
          type: "head",
          name: slot.headVariationName,
          id: slot.headVariationId,
          hasId: !!slot.headVariationId,
          hasName: !!slot.headVariationName
        });
      }

      if (slot.bodyVariationName) {
        variations.push({
          type: "body",
          name: slot.bodyVariationName,
          id: slot.bodyVariationId,
          hasId: !!slot.bodyVariationId,
          hasName: !!slot.bodyVariationName
        });
      }

      if (slot.itemVariationName) {
        variations.push({
          type: "item",
          name: slot.itemVariationName,
          id: slot.itemVariationId,
          hasId: !!slot.itemVariationId,
          hasName: !!slot.itemVariationName
        });
      }

      console.log(`🔍 [SLOT ${slot.slotNumber}] Mek #${slot.mekNumber}:`, {
        mekAssetId: slot.mekAssetId,
        variations: variations.map(v => `${v.name} (${v.type}) - ID: ${v.id || 'MISSING'}`).join(', ')
      });

      return {
        slotNumber: slot.slotNumber,
        mekNumber: slot.mekNumber,
        mekAssetId: slot.mekAssetId,
        variations
      };
    });

    return {
      slotCount: slottedMeks.length,
      slots: details
    };
  }
});
