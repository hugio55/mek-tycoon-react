import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * DIAGNOSTIC: Check what sourceKey data exists in database
 * Returns first 5 Meks from the first goldMining record for inspection
 */
export const checkSourceKeyData = query({
  args: {
    walletAddress: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let record;

    if (args.walletAddress) {
      // Get specific wallet
      record = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();
    } else {
      // Get any record
      record = await ctx.db.query("goldMining").first();
    }

    if (!record) {
      return {
        found: false,
        message: "No goldMining records found"
      };
    }

    // Get first 5 Meks and their sourceKey status
    const mekSamples = record.ownedMeks.slice(0, 5).map((mek, idx) => ({
      index: idx + 1,
      assetId: mek.assetId,
      assetName: mek.assetName,
      // Check all possible sourceKey-related fields
      hasSourceKey: !!mek.sourceKey,
      sourceKey: mek.sourceKey || null,
      hasSourceKeyBase: !!mek.sourceKeyBase,
      sourceKeyBase: mek.sourceKeyBase || null,
      // Check variation fields
      hasHeadVariation: !!mek.headVariation,
      headVariation: mek.headVariation || null,
      hasBodyVariation: !!mek.bodyVariation,
      bodyVariation: mek.bodyVariation || null,
      hasItemVariation: !!mek.itemVariation,
      itemVariation: mek.itemVariation || null,
      // Other fields that might be relevant
      rarityRank: mek.rarityRank,
      goldPerHour: mek.goldPerHour
    }));

    return {
      found: true,
      walletAddress: record.walletAddress,
      totalMeks: record.ownedMeks.length,
      samples: mekSamples,
      // Summary stats
      stats: {
        totalMeks: record.ownedMeks.length,
        meksWithSourceKey: record.ownedMeks.filter(m => !!m.sourceKey).length,
        meksWithSourceKeyBase: record.ownedMeks.filter(m => !!m.sourceKeyBase).length,
        meksWithHeadVariation: record.ownedMeks.filter(m => !!m.headVariation).length,
        meksWithBodyVariation: record.ownedMeks.filter(m => !!m.bodyVariation).length,
        meksWithItemVariation: record.ownedMeks.filter(m => !!m.itemVariation).length
      }
    };
  }
});
