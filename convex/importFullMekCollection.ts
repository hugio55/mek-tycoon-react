import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Import the full 4000 mek collection from mekRarityMaster.json
const mekRarityData = require("./mekRarityMaster.json");

export const importFullCollection = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`Starting import of ${mekRarityData.length} meks...`);

    // Clear existing data
    const existing = await ctx.db.query("mekCollection").collect();
    console.log(`Clearing ${existing.length} existing entries...`);

    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Import all meks in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < mekRarityData.length; i += batchSize) {
      const batch = mekRarityData.slice(i, Math.min(i + batchSize, mekRarityData.length));

      for (const mek of batch) {
        await ctx.db.insert("mekCollection", {
          rank: mek.rank,
          assetId: mek.assetId,
          sourceKey: mek.sourceKey,
          head: mek.head,
          body: mek.body,
          trait: mek.trait,
        });
        imported++;
      }

      if (imported % 500 === 0) {
        console.log(`Imported ${imported}/${mekRarityData.length} meks...`);
      }
    }

    console.log(`Successfully imported ${imported} meks!`);

    // Now recalculate the attribute rarity
    await calculateAttributeRarity(ctx);

    return {
      message: `Successfully imported ${imported} meks and updated rarity data`,
      totalImported: imported,
    };
  },
});

// Helper to calculate and update attribute rarity after import
async function calculateAttributeRarity(ctx: any) {
  const allMeks = await ctx.db.query("mekCollection").collect();

  // Count occurrences
  const headCounts: Record<string, number> = {};
  const bodyCounts: Record<string, number> = {};
  const traitCounts: Record<string, number> = {};

  allMeks.forEach(mek => {
    if (mek.head) headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
    if (mek.body) bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
    if (mek.trait) traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
  });

  // Process data
  const headsData: Record<string, any> = {};
  for (const [head, count] of Object.entries(headCounts)) {
    headsData[head] = {
      count,
      appearanceRate: count / allMeks.length,
    };
  }

  const bodiesData: Record<string, any> = {};
  for (const [body, count] of Object.entries(bodyCounts)) {
    bodiesData[body] = {
      count,
      appearanceRate: count / allMeks.length,
    };
  }

  const traitsData: Record<string, any> = {};
  for (const [trait, count] of Object.entries(traitCounts)) {
    traitsData[trait] = {
      count,
      appearanceRate: count / allMeks.length,
    };
  }

  // Update or create rarity document
  const existing = await ctx.db
    .query("attributeRarity")
    .withIndex("by_type", q => q.eq("type", "singleton"))
    .first();

  const rarityData = {
    type: "singleton" as const,
    heads: headsData,
    bodies: bodiesData,
    traits: traitsData,
    totalMeks: allMeks.length,
    lastUpdated: Date.now(),
    version: existing ? (existing.version || 0) + 1 : 1,
  };

  if (existing) {
    await ctx.db.patch(existing._id, rarityData);
    console.log("Updated attribute rarity data");
  } else {
    await ctx.db.insert("attributeRarity", rarityData);
    console.log("Created attribute rarity data");
  }
}

// Quick import - just for testing, imports first 100 meks
export const importSample = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleSize = 100;
    const sample = mekRarityData.slice(0, sampleSize);

    console.log(`Importing sample of ${sampleSize} meks...`);

    // Clear existing
    const existing = await ctx.db.query("mekCollection").collect();
    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Import sample
    for (const mek of sample) {
      await ctx.db.insert("mekCollection", {
        rank: mek.rank,
        assetId: mek.assetId,
        sourceKey: mek.sourceKey,
        head: mek.head,
        body: mek.body,
        trait: mek.trait,
      });
    }

    await calculateAttributeRarity(ctx);

    return { message: `Imported ${sampleSize} sample meks` };
  },
});