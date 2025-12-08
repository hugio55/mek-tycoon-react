import { query } from "./_generated/server";
import { v } from "convex/values";

// Diagnostic query to find duplicate "Nothing" essence entries
export const findNothingDuplicates = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Check if essence system is initialized
    const tracking = await ctx.db
      .query("essenceTracking")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .first();

    // Get all essence balances for this wallet (stored in DB)
    const allBalances = await ctx.db
      .query("essenceBalances")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Get slotted Meks to check what variations are being generated
    const slots = await ctx.db
      .query("essenceSlots")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    const slottedMeks = slots.filter((s) => s.mekAssetId);

    // Analyze slotted Meks to see what "Nothing" variations exist
    const nothingVariationsFromSlots: any[] = [];

    for (const slot of slottedMeks) {
      if (slot.itemVariationName === "Nothing") {
        // Try to determine the variation ID from source key or name
        nothingVariationsFromSlots.push({
          slotNumber: slot.slotNumber,
          mekAssetId: slot.mekAssetId,
          itemVariationName: slot.itemVariationName,
          headVariationName: slot.headVariationName,
          bodyVariationName: slot.bodyVariationName,
        });
      }
    }

    // Filter for "Nothing" variations in stored balances
    const nothingBalances = allBalances.filter(
      (b) => b.variationName === "Nothing"
    );

    console.log("[Diagnostic] Total stored balances:", allBalances.length);
    console.log("[Diagnostic] Total slotted Meks:", slottedMeks.length);
    console.log("[Diagnostic] Meks with 'Nothing' trait:", nothingVariationsFromSlots.length);
    console.log("[Diagnostic] 'Nothing' balances in DB:", nothingBalances.length);
    console.log("[Diagnostic] 'Nothing' details:", nothingBalances);

    // Group by variation ID to see if there are multiple IDs
    const byVariationId = nothingBalances.reduce(
      (acc: any, balance: any) => {
        const key = balance.variationId;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(balance);
        return acc;
      },
      {}
    );

    return {
      isInitialized: !!tracking,
      isActive: tracking?.isActive || false,
      trackingInfo: tracking ? {
        lastCalculationTime: tracking.lastCalculationTime,
        lastCheckpointTime: tracking.lastCheckpointTime,
        totalSwapCount: tracking.totalSwapCount,
      } : null,
      totalBalances: allBalances.length,
      totalSlottedMeks: slottedMeks.length,
      nothingCount: nothingBalances.length,
      nothingFromSlots: nothingVariationsFromSlots.length,
      slottedMeksWithNothing: nothingVariationsFromSlots,
      nothingBalances: nothingBalances.map((b) => ({
        _id: b._id,
        variationId: b.variationId,
        variationName: b.variationName,
        variationType: b.variationType,
        accumulatedAmount: b.accumulatedAmount,
        lastUpdated: b.lastUpdated,
      })),
      groupedByVariationId: byVariationId,
      allSlots: slots.map((s) => ({
        slotNumber: s.slotNumber,
        mekAssetId: s.mekAssetId,
        isUnlocked: s.isUnlocked,
        headVariationName: s.headVariationName,
        bodyVariationName: s.bodyVariationName,
        itemVariationName: s.itemVariationName,
      })),
    };
  },
});
