import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration to remove deprecated combat fields from existing meks
export const removeDeprecatedMekFields = mutation({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    let updatedCount = 0;
    
    for (const mek of meks) {
      // Create a clean version without the deprecated fields
      const { 
        attack, 
        defense, 
        energy, 
        maxEnergy,
        ...cleanMek 
      } = mek as any;
      
      // Only update if the mek actually had these fields
      if (attack !== undefined || defense !== undefined || 
          energy !== undefined || maxEnergy !== undefined) {
        
        // Replace the entire document with the clean version
        await ctx.db.replace(mek._id, cleanMek);
        updatedCount++;
      }
    }
    
    return {
      message: `Migration complete. Updated ${updatedCount} meks.`,
      totalMeks: meks.length,
      updatedMeks: updatedCount
    };
  },
});

// Alternative: Set deprecated fields to undefined (softer approach)
export const nullifyDeprecatedMekFields = mutation({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    let updatedCount = 0;
    
    for (const mek of meks) {
      const updates: any = {};
      let hasDeprecatedFields = false;
      
      // Check if mek has any deprecated fields
      if ('attack' in mek) {
        updates.attack = undefined;
        hasDeprecatedFields = true;
      }
      if ('defense' in mek) {
        updates.defense = undefined;
        hasDeprecatedFields = true;
      }
      if ('energy' in mek) {
        updates.energy = undefined;
        hasDeprecatedFields = true;
      }
      if ('maxEnergy' in mek) {
        updates.maxEnergy = undefined;
        hasDeprecatedFields = true;
      }
      
      if (hasDeprecatedFields) {
        await ctx.db.patch(mek._id, updates);
        updatedCount++;
      }
    }
    
    return {
      message: `Migration complete. Nullified deprecated fields in ${updatedCount} meks.`,
      totalMeks: meks.length,
      updatedMeks: updatedCount
    };
  },
});

// Migration to populate source keys for existing meks
export const populateSourceKeys = mutation({
  args: {
    mappings: v.array(v.object({
      assetName: v.string(), // e.g., "Mekanism #3051"
      sourceKey: v.string(), // e.g., "HH1-DH1-JI2-B"
    }))
  },
  handler: async (ctx, args) => {
    let updatedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    
    for (const mapping of args.mappings) {
      // Use index to find the mek efficiently by asset name
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_name", (q) => q.eq("assetName", mapping.assetName))
        .first();
      
      if (mek) {
        // Skip if already has both source keys
        if (mek.sourceKey && mek.sourceKeyBase) {
          skippedCount++;
          continue;
        }
        
        // Extract base key by removing the -B suffix
        const sourceKeyBase = mapping.sourceKey.replace(/-B$/i, '');
        
        await ctx.db.patch(mek._id, {
          sourceKey: mapping.sourceKey,
          sourceKeyBase: sourceKeyBase
        });
        updatedCount++;
      } else {
        notFoundCount++;
      }
    }
    
    return {
      success: true,
      message: `Updated ${updatedCount} meks with source keys. Skipped ${skippedCount} that already had source keys. ${notFoundCount} meks not found.`,
      total: args.mappings.length
    };
  },
});

// Migration to update a single mek's source key
export const updateSingleMekSourceKey = mutation({
  args: {
    assetName: v.string(), // e.g., "Mekanism #3051"
    sourceKey: v.string(), // e.g., "HH1-DH1-JI2-B"
  },
  handler: async (ctx, args) => {
    // Find the mek by asset name using index
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_name", (q) => q.eq("assetName", args.assetName))
      .first();
    
    if (!mek) {
      throw new Error(`Mek with name ${args.assetName} not found`);
    }
    
    // Extract base key by removing the -B suffix
    const sourceKeyBase = args.sourceKey.replace(/-B$/i, '');
    
    // Update both source keys
    await ctx.db.patch(mek._id, {
      sourceKey: args.sourceKey,
      sourceKeyBase: sourceKeyBase
    });
    
    return {
      success: true,
      message: `Updated ${args.assetName} with source key ${args.sourceKey} and base ${sourceKeyBase}`
    };
  },
});