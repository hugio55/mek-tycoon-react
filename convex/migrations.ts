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

// Migration to sync Meks from goldMining.ownedMeks to meks table
// This enables tenure tracking for existing Meks
export const syncMeksFromGoldMining = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[MIGRATION] Starting sync for wallet: ${args.walletAddress}`);

    // Get goldMining record
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!goldMining) {
      throw new Error(`No goldMining record found for wallet ${args.walletAddress}`);
    }

    if (!goldMining.ownedMeks || goldMining.ownedMeks.length === 0) {
      return {
        success: true,
        message: "No Meks found in goldMining.ownedMeks",
        created: 0,
        skipped: 0,
        total: 0
      };
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdMeks: string[] = [];

    for (const ownedMek of goldMining.ownedMeks) {
      // Check if Mek already exists in meks table
      const existingMek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q) => q.eq("assetId", ownedMek.assetId))
        .first();

      if (existingMek) {
        console.log(`[MIGRATION] Mek ${ownedMek.assetName} already exists in meks table, skipping`);
        skippedCount++;
        continue;
      }

      // Create new Mek record
      console.log(`[MIGRATION] Creating meks table entry for ${ownedMek.assetName}`);

      await ctx.db.insert("meks", {
        // Required fields
        assetId: ownedMek.assetId,
        assetName: ownedMek.assetName,
        owner: args.walletAddress,
        verified: true, // From goldMining, assume verified
        headVariation: ownedMek.headVariation || "Unknown",
        bodyVariation: ownedMek.bodyVariation || "Unknown",

        // Optional fields from goldMining
        sourceKey: ownedMek.sourceKey,
        sourceKeyBase: ownedMek.sourceKeyBase,
        itemVariation: ownedMek.itemVariation,
        rarityRank: ownedMek.rarityRank,
        goldRate: ownedMek.baseGoldPerHour || ownedMek.goldPerHour,

        // Initialize tenure fields
        tenurePoints: 0,
        lastTenureUpdate: Date.now(),
        isSlotted: false,
        slotNumber: undefined,

        // Metadata
        lastUpdated: Date.now(),
      });

      createdMeks.push(ownedMek.assetName);
      createdCount++;
    }

    console.log(`[MIGRATION] Complete. Created ${createdCount} Meks, skipped ${skippedCount}`);

    return {
      success: true,
      message: `Synced ${createdCount} Meks to meks table. Skipped ${skippedCount} that already existed.`,
      created: createdCount,
      skipped: skippedCount,
      total: goldMining.ownedMeks.length,
      createdMeks
    };
  },
});

// CRITICAL FIX: Migration to sync isSlotted state from essenceSlots to meks table
// This fixes the issue where Meks were slotted BEFORE the migration ran,
// so they exist in meks table with isSlotted=false even though they're in essenceSlots
export const syncIsSlottedFromEssenceSlots = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[MIGRATION] ========================================');
    console.log('[MIGRATION] Starting isSlotted sync from essenceSlots...');
    console.log('[MIGRATION] ========================================');

    // Get ALL essence slots that have a Mek slotted
    const allSlots = await ctx.db.query("essenceSlots").collect();
    const slottedSlots = allSlots.filter(slot => slot.mekAssetId);

    console.log(`[MIGRATION] Found ${slottedSlots.length} slotted Meks in essenceSlots table`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const updates: any[] = [];
    const now = Date.now();

    for (const slot of slottedSlots) {
      // Find corresponding Mek in meks table
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q) => q.eq("assetId", slot.mekAssetId!))
        .first();

      if (!mek) {
        console.log(`[MIGRATION] ⚠️  WARNING: Mek ${slot.mekAssetId} not found in meks table!`);
        notFoundCount++;
        continue;
      }

      // Check if already correctly marked as slotted
      if (mek.isSlotted && mek.slotNumber === slot.slotNumber) {
        console.log(`[MIGRATION] ✓ Mek ${mek.assetName} already correctly marked as slotted in slot ${slot.slotNumber}`);
        continue;
      }

      // Update the Mek to mark it as slotted
      console.log(`[MIGRATION] 🔄 Updating ${mek.assetName}: isSlotted=false → true, slotNumber=${slot.slotNumber}`);

      await ctx.db.patch(mek._id, {
        isSlotted: true,
        slotNumber: slot.slotNumber,
        lastTenureUpdate: now, // Start tracking tenure from now
        tenurePoints: mek.tenurePoints || 0, // Preserve existing tenure if any
      });

      updates.push({
        assetName: mek.assetName,
        slotNumber: slot.slotNumber,
        previouslySlotted: mek.isSlotted || false
      });

      updatedCount++;
    }

    console.log('[MIGRATION] ========================================');
    console.log(`[MIGRATION] Complete! Updated ${updatedCount} Meks`);
    console.log(`[MIGRATION] Not found in meks table: ${notFoundCount}`);
    console.log('[MIGRATION] ========================================');

    return {
      success: true,
      message: `Synced isSlotted state for ${updatedCount} Meks. ${notFoundCount} not found in meks table.`,
      totalSlotted: slottedSlots.length,
      updated: updatedCount,
      notFound: notFoundCount,
      updates
    };
  },
});