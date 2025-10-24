import { query } from "./_generated/server";

// Diagnostic query to see all slotted Meks
export const checkSlottedMeks = query({
  args: {},
  handler: async (ctx) => {
    const allSlots = await ctx.db
      .query("essenceSlots")
      .collect();

    const slottedMeks = allSlots.filter(s => s.mekAssetId);

    return {
      totalSlots: allSlots.length,
      slottedCount: slottedMeks.length,
      slottedMeks: slottedMeks.map(s => ({
        walletAddress: s.walletAddress, // FULL ADDRESS for debugging
        slotNumber: s.slotNumber,
        mekNumber: s.mekNumber,
        mekAssetId: s.mekAssetId,
        head: s.headVariationName,
        body: s.bodyVariationName,
        item: s.itemVariationName,
        slottedAt: s.slottedAt ? new Date(s.slottedAt).toISOString() : 'N/A'
      }))
    };
  },
});
