import { mutation } from "./_generated/server";

// Import the backup data (converted to proper JSON array)
const backupData = require("../trout_meks_array.json");

/**
 * HELPER: Extract mek number from assetName
 * e.g., "Mek #2191" -> 2191, "Mekanism #0253" -> 253
 */
function getMekNumber(assetName: string): number | null {
  const match = assetName?.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

/**
 * Restore all meks from the trout_meks.json backup file
 * This will clear the existing meks table and re-import all 4000+ meks
 *
 * IMPORTANT: Includes deduplication logic to prevent importing the same mek twice
 * with different assetId formats (short mint numbers vs long Cardano assetIds)
 */
export const restoreFromTroutBackup = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`Starting restore of ${backupData.length} meks from trout_meks.json...`);

    // Clear existing meks table
    const existing = await ctx.db.query("meks").collect();
    console.log(`Clearing ${existing.length} existing meks...`);

    for (const mek of existing) {
      await ctx.db.delete(mek._id);
    }

    // DEDUPLICATION: Group backup data by mek number, prefer long assetIds
    const byMekNumber = new Map<number, any[]>();
    for (const mek of backupData) {
      const num = getMekNumber(mek.assetName);
      if (num !== null) {
        if (!byMekNumber.has(num)) byMekNumber.set(num, []);
        byMekNumber.get(num)!.push(mek);
      }
    }

    // For each mek number, keep only ONE entry (prefer long assetId format)
    const dedupedMeks: any[] = [];
    let skippedDuplicates = 0;

    for (const [mekNum, meks] of byMekNumber.entries()) {
      if (meks.length === 1) {
        dedupedMeks.push(meks[0]);
      } else {
        // Multiple entries for same mek - prefer long format
        const longFormat = meks.find(m => m.assetId.length > 50);
        const chosen = longFormat || meks[0]; // Fall back to first if no long format
        dedupedMeks.push(chosen);
        skippedDuplicates += meks.length - 1;
        console.log(`[Restore] Mek #${mekNum}: ${meks.length} entries found, keeping ${longFormat ? 'long' : 'short'} format`);
      }
    }

    console.log(`[Restore] Deduplication: ${backupData.length} -> ${dedupedMeks.length} (skipped ${skippedDuplicates} duplicates)`);

    // Import deduplicated meks
    let imported = 0;
    const errors: string[] = [];

    for (const mek of dedupedMeks) {
      try {
        // Map the backup data to the schema
        await ctx.db.insert("meks", {
          assetId: mek.assetId,
          assetName: mek.assetName,
          owner: mek.owner,
          ownerStakeAddress: mek.ownerStakeAddress || undefined,
          verified: mek.verified ?? true,
          sourceKey: mek.sourceKey,
          sourceKeyBase: mek.sourceKeyBase,
          headGroup: mek.headGroup,
          headVariation: mek.headVariation,
          headVariationId: mek.headVariationId,
          bodyGroup: mek.bodyGroup,
          bodyVariation: mek.bodyVariation,
          bodyVariationId: mek.bodyVariationId,
          itemGroup: mek.itemGroup,
          itemVariation: mek.itemVariation,
          itemVariationId: mek.itemVariationId,
          iconUrl: mek.iconUrl,
          rarityRank: mek.rarityRank,
          gameRank: mek.gameRank,
          cnftRank: mek.cnftRank,
          rarityTier: mek.rarityTier,
          goldRate: mek.goldRate,
          tenurePoints: mek.tenurePoints,
          lastTenureUpdate: mek.lastTenureUpdate,
          isSlotted: mek.isSlotted,
          slotNumber: mek.slotNumber,
          draws: mek.draws,
          experience: mek.experience,
          health: mek.health,
          inBattle: mek.inBattle,
          level: mek.level,
          losses: mek.losses,
          maxHealth: mek.maxHealth,
          powerScore: mek.powerScore,
          scrapValue: mek.scrapValue,
          speed: mek.speed,
          winStreak: mek.winStreak,
          wins: mek.wins,
          lastUpdated: mek.lastUpdated,
          isStaked: mek.isStaked,
        });
        imported++;

        if (imported % 500 === 0) {
          console.log(`Restored ${imported}/${backupData.length} meks...`);
        }
      } catch (e) {
        errors.push(`Failed to import mek ${mek.assetId}: ${e}`);
      }
    }

    console.log(`Restore complete! Imported ${imported} meks.`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.slice(0, 10).join(", ")}`);
    }

    return {
      success: true,
      totalRestored: imported,
      errors: errors.length,
      message: `Restored ${imported} meks from trout_meks.json backup`,
    };
  },
});
