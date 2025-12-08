import { mutation } from "./_generated/server";

// Import the backup data (converted to proper JSON array)
const backupData = require("../trout_meks_array.json");

/**
 * Restore all meks from the trout_meks.json backup file
 * This will clear the existing meks table and re-import all 4000+ meks
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

    // Import all meks in batches
    let imported = 0;
    const errors: string[] = [];

    for (const mek of backupData) {
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
