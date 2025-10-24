import { v } from "convex/values";
import { query } from "./_generated/server";

// Check specific wallet's slotted Meks
export const checkMySlots = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();

    const slottedSlots = slots.filter(s => s.mekAssetId);

    return {
      walletAddress: walletAddress.substring(0, 20) + '...',
      totalSlots: slots.length,
      slottedCount: slottedSlots.length,
      slots: slots.map(s => ({
        slotNumber: s.slotNumber,
        isUnlocked: s.isUnlocked,
        isSlotted: !!s.mekAssetId,
        mekNumber: s.mekNumber,
        head: s.headVariationName,
        headId: s.headVariationId,
        body: s.bodyVariationName,
        bodyId: s.bodyVariationId,
        item: s.itemVariationName,
        itemId: s.itemVariationId,
        slottedAt: s.slottedAt ? new Date(s.slottedAt).toISOString() : null
      }))
    };
  },
});
