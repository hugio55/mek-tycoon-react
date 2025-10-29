// COMPLETE VARIATION ID MIGRATION
// Fixes all variation IDs to match rarity ranking from completeVariationRarity.ts
import { mutation } from "./_generated/server";
import { COMPLETE_VARIATION_RARITY } from "../src/lib/completeVariationRarity";

export const migrateToRarityBasedIds = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔄 [MIGRATION] Starting complete variation ID migration...');

    // STEP 1: Clear existing variationsReference table
    const oldVariations = await ctx.db.query("variationsReference").collect();
    for (const variation of oldVariations) {
      await ctx.db.delete(variation._id);
    }
    console.log(`✅ [STEP 1] Deleted ${oldVariations.length} old variation records`);

    // STEP 2: Insert all variations with correct rarity-based IDs
    let inserted = 0;
    for (const variation of COMPLETE_VARIATION_RARITY) {
      await ctx.db.insert("variationsReference", {
        variationId: variation.rank, // ID = rarity rank
        name: variation.name,
        type: variation.type === "trait" ? "item" : variation.type, // Map trait→item for DB
      });
      inserted++;
    }
    console.log(`✅ [STEP 2] Inserted ${inserted} variations with rarity-based IDs`);

    // STEP 3: Update all essenceSlots with correct variation IDs
    const allSlots = await ctx.db.query("essenceSlots").collect();
    let slotsUpdated = 0;

    for (const slot of allSlots) {
      const updates: any = { lastModified: Date.now() };

      // Update head variation ID
      if (slot.headVariationName) {
        const headVar = COMPLETE_VARIATION_RARITY.find(
          v => v.name === slot.headVariationName && v.type === "head"
        );
        if (headVar) {
          updates.headVariationId = headVar.rank;
        }
      }

      // Update body variation ID
      if (slot.bodyVariationName) {
        const bodyVar = COMPLETE_VARIATION_RARITY.find(
          v => v.name === slot.bodyVariationName && v.type === "body"
        );
        if (bodyVar) {
          updates.bodyVariationId = bodyVar.rank;
        }
      }

      // Update item variation ID
      if (slot.itemVariationName) {
        const itemVar = COMPLETE_VARIATION_RARITY.find(
          v => v.name === slot.itemVariationName && v.type === "trait"
        );
        if (itemVar) {
          updates.itemVariationId = itemVar.rank;
        }
      }

      // Only update if we have changes
      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(slot._id, updates);
        slotsUpdated++;
      }
    }
    console.log(`✅ [STEP 3] Updated ${slotsUpdated} essence slots with correct variation IDs`);

    // STEP 4: Update all essenceBalances with correct variation IDs
    const allBalances = await ctx.db.query("essenceBalances").collect();
    let balancesUpdated = 0;

    for (const balance of allBalances) {
      const variation = COMPLETE_VARIATION_RARITY.find(
        v => v.name === balance.variationName &&
             (v.type === balance.variationType ||
              (v.type === "trait" && balance.variationType === "item"))
      );

      if (variation && variation.rank !== balance.variationId) {
        await ctx.db.patch(balance._id, {
          variationId: variation.rank,
        });
        balancesUpdated++;
      }
    }
    console.log(`✅ [STEP 4] Updated ${balancesUpdated} essence balances with correct variation IDs`);

    // STEP 5: Verification
    const newVariations = await ctx.db.query("variationsReference").collect();
    const lightning = newVariations.find(v => v.name === "Lightning");
    const iced = newVariations.find(v => v.name === "Iced");

    console.log('🔍 [VERIFICATION] Sample checks:');
    console.log(`   Lightning: ID ${lightning?.variationId}, type "${lightning?.type}" (should be ID 260, type "head")`);
    console.log(`   Iced: ID ${iced?.variationId}, type "${iced?.type}" (should be ID 94, type "item")`);

    return {
      success: true,
      variationsInserted: inserted,
      slotsUpdated,
      balancesUpdated,
      verification: {
        lightning: { id: lightning?.variationId, type: lightning?.type, correct: lightning?.variationId === 260 },
        iced: { id: iced?.variationId, type: iced?.type, correct: iced?.variationId === 94 },
      }
    };
  }
});
