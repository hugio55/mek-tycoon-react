// Update variation sourceKeys in database to add H/B/T suffixes for repeating digits
import { mutation } from "./_generated/server";
import { COMPLETE_VARIATION_RARITY } from "../src/lib/completeVariationRarity";

export const updateVariationSourceKeysWithSuffixes = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔧 [SOURCE KEY UPDATE] Starting sourceKey suffix migration...');

    // Get all variations from database
    const allVariations = await ctx.db.query("variationsReference").collect();
    console.log(`📊 [SOURCE KEY UPDATE] Found ${allVariations.length} variations in database`);

    let updated = 0;
    let skipped = 0;
    const changes: any[] = [];

    for (const dbVariation of allVariations) {
      // Find matching variation in source of truth
      const correctVariation = COMPLETE_VARIATION_RARITY.find(
        v => v.name === dbVariation.name
      );

      if (!correctVariation) {
        console.log(`⚠️ [SOURCE KEY UPDATE] No match for "${dbVariation.name}"`);
        skipped++;
        continue;
      }

      // Check if sourceKey needs updating
      if (dbVariation.sourceKey !== correctVariation.sourceKey) {
        await ctx.db.patch(dbVariation._id, {
          sourceKey: correctVariation.sourceKey
        });

        changes.push({
          name: dbVariation.name,
          type: dbVariation.type,
          oldSourceKey: dbVariation.sourceKey,
          newSourceKey: correctVariation.sourceKey
        });

        console.log(`✅ [SOURCE KEY UPDATE] ${dbVariation.name} (${dbVariation.type}): ${dbVariation.sourceKey} → ${correctVariation.sourceKey}`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`🎉 [SOURCE KEY UPDATE] Complete! Updated: ${updated}, Skipped: ${skipped}`);

    return {
      success: true,
      updated,
      skipped,
      total: allVariations.length,
      changes
    };
  }
});
