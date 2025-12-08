import { mutation, query } from "./_generated/server";

/**
 * Find duplicate meks by mek number (same NFT with different assetId formats)
 *
 * The issue: Some meks exist twice:
 * - Once with short assetId (just mint number like "2191")
 * - Once with full Cardano assetId (policyId + hex asset name)
 *
 * The correct format is the full Cardano assetId.
 */
export const findDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Extract mek number from assetName
    function getMekNumber(mek: any): number | null {
      const match = mek.assetName?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }

    // Group by mek number
    const byMekNumber = new Map<number, any[]>();
    allMeks.forEach(mek => {
      const num = getMekNumber(mek);
      if (num !== null) {
        if (!byMekNumber.has(num)) byMekNumber.set(num, []);
        byMekNumber.get(num)!.push(mek);
      }
    });

    // Find duplicates
    const duplicates: { mekNumber: number; entries: any[] }[] = [];
    byMekNumber.forEach((meks, num) => {
      if (meks.length > 1) {
        duplicates.push({
          mekNumber: num,
          entries: meks.map(m => ({
            _id: m._id,
            assetId: m.assetId,
            assetName: m.assetName,
            owner: m.owner,
            isLongFormat: m.assetId.length > 50,
          })),
        });
      }
    });

    return {
      totalMeks: allMeks.length,
      duplicateMekNumbers: duplicates.length,
      expectedAfterDedup: allMeks.length - duplicates.length,
      duplicates: duplicates.slice(0, 10), // First 10 for inspection
    };
  },
});

/**
 * Remove duplicate meks, keeping the ones with full Cardano assetIds
 *
 * For each duplicate:
 * - If one has long assetId (>50 chars) and one has short, delete the short one
 * - Transfer any important data (tenure, slot info) from short to long if needed
 */
export const removeDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Extract mek number from assetName
    function getMekNumber(mek: any): number | null {
      const match = mek.assetName?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }

    // Group by mek number
    const byMekNumber = new Map<number, any[]>();
    allMeks.forEach(mek => {
      const num = getMekNumber(mek);
      if (num !== null) {
        if (!byMekNumber.has(num)) byMekNumber.set(num, []);
        byMekNumber.get(num)!.push(mek);
      }
    });

    let deletedCount = 0;
    let mergedData = 0;
    const deletedIds: string[] = [];

    for (const [mekNumber, meks] of byMekNumber.entries()) {
      if (meks.length <= 1) continue;

      // Separate long and short format entries
      const longFormat = meks.filter(m => m.assetId.length > 50);
      const shortFormat = meks.filter(m => m.assetId.length <= 50);

      if (longFormat.length === 0 || shortFormat.length === 0) {
        console.log(`[Dedup] Mek #${mekNumber}: unexpected format distribution, skipping`);
        continue;
      }

      // Keep the long format entry, delete short format entries
      const keepEntry = longFormat[0];

      for (const deleteEntry of shortFormat) {
        // Check if short entry has important data to transfer
        const hasImportantData =
          (deleteEntry.tenurePoints && deleteEntry.tenurePoints > 0) ||
          deleteEntry.isSlotted ||
          deleteEntry.talentTree;

        if (hasImportantData) {
          // Merge important data into the long format entry
          console.log(`[Dedup] Mek #${mekNumber}: merging data from short to long format`);
          await ctx.db.patch(keepEntry._id, {
            tenurePoints: Math.max(keepEntry.tenurePoints || 0, deleteEntry.tenurePoints || 0),
            lastTenureUpdate: deleteEntry.lastTenureUpdate || keepEntry.lastTenureUpdate,
            isSlotted: keepEntry.isSlotted || deleteEntry.isSlotted,
            slotNumber: keepEntry.slotNumber || deleteEntry.slotNumber,
            talentTree: keepEntry.talentTree || deleteEntry.talentTree,
          });
          mergedData++;
        }

        // Delete the short format entry
        await ctx.db.delete(deleteEntry._id);
        deletedCount++;
        deletedIds.push(deleteEntry.assetId);
      }
    }

    console.log(`[Dedup] Removed ${deletedCount} duplicate entries`);

    // Verify final count
    const finalMeks = await ctx.db.query("meks").collect();

    return {
      success: true,
      deletedCount,
      mergedDataCount: mergedData,
      finalMekCount: finalMeks.length,
      deletedAssetIds: deletedIds.slice(0, 20),
      message: `Removed ${deletedCount} duplicates. Final count: ${finalMeks.length} meks`,
    };
  },
});
