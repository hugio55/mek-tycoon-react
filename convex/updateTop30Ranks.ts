// Update ranks for ALL variations in database to match completeVariationRarity.ts
import { mutation } from "./_generated/server";
import { COMPLETE_VARIATION_RARITY } from "../src/lib/completeVariationRarity";

export const updateAllRanksInDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔧 [RANK UPDATE] Starting full rank update migration for all variations...');

    // Get all variations from database
    const allVariations = await ctx.db.query("variationsReference").collect();
    console.log(`📊 [RANK UPDATE] Found ${allVariations.length} variations in database`);

    let updated = 0;
    let inserted = 0;
    let skipped = 0;
    const changes: any[] = [];

    // First, update existing variations
    for (const dbVariation of allVariations) {
      // Find matching variation in source of truth
      const correctVariation = COMPLETE_VARIATION_RARITY.find(
        v => v.name === dbVariation.name
      );

      if (!correctVariation) {
        console.log(`⚠️ [RANK UPDATE] No match for "${dbVariation.name}"`);
        skipped++;
        continue;
      }

      // Check if rank needs updating
      if (dbVariation.rank !== correctVariation.rank) {
        await ctx.db.patch(dbVariation._id, {
          rank: correctVariation.rank,
          sourceKey: correctVariation.sourceKey
        });

        changes.push({
          name: dbVariation.name,
          type: dbVariation.type,
          oldRank: dbVariation.rank,
          newRank: correctVariation.rank,
          sourceKey: correctVariation.sourceKey
        });

        console.log(`✅ [RANK UPDATE] ${dbVariation.name} (${correctVariation.sourceKey}): rank ${dbVariation.rank} → ${correctVariation.rank}`);
        updated++;
      } else {
        skipped++;
      }
    }

    // Second, insert new variations that exist in source but not in database
    for (const sourceVariation of COMPLETE_VARIATION_RARITY) {
      const existsInDb = allVariations.some(v => v.name === sourceVariation.name);

      if (!existsInDb) {
        // Find next available variationId
        const maxId = Math.max(...allVariations.map(v => v.variationId), 0);
        const newVariationId = maxId + 1 + inserted;

        await ctx.db.insert("variationsReference", {
          variationId: newVariationId,
          name: sourceVariation.name,
          type: sourceVariation.type === "trait" ? "item" : sourceVariation.type,
          sourceKey: sourceVariation.sourceKey,
          rank: sourceVariation.rank,
          copies: sourceVariation.count
        });

        console.log(`🆕 [RANK UPDATE] Inserted new variation: ${sourceVariation.name} (${sourceVariation.sourceKey}) at rank ${sourceVariation.rank}`);
        inserted++;
      }
    }

    console.log(`🎉 [RANK UPDATE] Complete! Updated: ${updated}, Inserted: ${inserted}, Skipped: ${skipped}`);

    return {
      success: true,
      updated,
      inserted,
      skipped,
      total: allVariations.length + inserted,
      changes
    };
  }
});
