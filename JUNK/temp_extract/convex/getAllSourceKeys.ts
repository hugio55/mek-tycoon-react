import { query } from "./_generated/server";

export const getAllSourceKeys = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    // Extract just the sourceKeyBase values
    const sourceKeys = meks
      .map(mek => mek.sourceKeyBase)
      .filter(key => key !== undefined && key !== null)
      .sort();
    
    return {
      total: sourceKeys.length,
      sourceKeys: sourceKeys
    };
  },
});

export const getMissingSourceKeys = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    // Find meks without sourceKeyBase
    const missing = meks
      .filter(mek => !mek.sourceKeyBase)
      .map(mek => ({
        assetId: mek.assetId,
        assetName: mek.assetName,
        sourceKey: mek.sourceKey
      }));
    
    return {
      totalMeks: meks.length,
      missingSourceKeyBase: missing.length,
      missing: missing.slice(0, 100) // First 100 for review
    };
  },
});