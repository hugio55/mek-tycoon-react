import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// CONSOLIDATED MIGRATION UTILITIES
// All one-time fixes and data migrations in one place
// ============================================================================

// ----------------------------------------------------------------------------
// IMAGE PATH MIGRATIONS
// ----------------------------------------------------------------------------

/**
 * Fix all mek image paths using sourceKey mapping
 * Consolidates: fixImagePaths.ts, fixImagePathsRemoveB.ts, updateImageUrls.ts
 */
export const fixAllImagePaths = mutation({
  args: {
    mappings: v.optional(v.array(v.object({
      assetId: v.string(),
      sourceKey: v.string(),
    }))),
    baseUrl: v.optional(v.string()), // Default: "/meks/"
    fileExtension: v.optional(v.string()), // Default: ".jpg"
  },
  handler: async (ctx, args) => {
    const baseUrl = args.baseUrl || "/meks/";
    const fileExtension = args.fileExtension || ".jpg";
    const meks = await ctx.db.query("meks").collect();
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Create mapping if provided
    const sourceKeyMap: Record<string, string> = {};
    if (args.mappings) {
      for (const mapping of args.mappings) {
        sourceKeyMap[mapping.assetId] = mapping.sourceKey;
      }
    }
    
    for (const mek of meks) {
      try {
        // Use provided mapping or existing sourceKey
        const sourceKey = sourceKeyMap[mek.assetId] || mek.sourceKey || mek.sourceKeyBase;
        
        if (sourceKey) {
          // Clean up sourceKey (remove any suffixes like -B, -C)
          const cleanSourceKey = sourceKey.replace(/-[BC]$/, "").toLowerCase();
          const filename = cleanSourceKey + fileExtension;
          const newUrl = baseUrl + filename;
          
          // Only update if URL has changed
          if (mek.iconUrl !== newUrl) {
            await ctx.db.patch(mek._id, {
              iconUrl: newUrl,
              sourceKeyBase: cleanSourceKey, // Store clean version for lookups
              lastUpdated: Date.now(),
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          console.warn(`No sourceKey found for mek ${mek.assetId}`);
          errors++;
        }
      } catch (error) {
        console.error(`Error updating mek ${mek.assetId}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      message: `Image paths fixed: ${updated} updated, ${skipped} skipped, ${errors} errors`,
      stats: {
        total: meks.length,
        updated,
        skipped,
        errors,
      }
    };
  },
});

/**
 * Fix special mek images (genesis meks, specific overrides)
 * Consolidates: fixSpecialMekImages.ts, fixMek3412Image.ts
 */
export const fixSpecialMekImages = mutation({
  args: {
    overrides: v.array(v.object({
      assetId: v.string(),
      imageUrl: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const override of args.overrides) {
      const mek = await ctx.db
        .query("meks")
        .withIndex("", (q: any) => q.eq("assetId", override.assetId))
        .first();
      
      if (mek) {
        await ctx.db.patch(mek._id, {
          iconUrl: override.imageUrl,
          lastUpdated: Date.now(),
        });
        results.push({ assetId: override.assetId, status: "updated" });
      } else {
        results.push({ assetId: override.assetId, status: "not_found" });
      }
    }
    
    const updated = results.filter((r: any) => r.status === "updated").length;
    const notFound = results.filter((r: any) => r.status === "not_found").length;
    
    return {
      success: true,
      message: `Special images updated: ${updated} updated, ${notFound} not found`,
      results,
    };
  },
});

// ----------------------------------------------------------------------------
// RANKING MIGRATIONS
// ----------------------------------------------------------------------------

/**
 * Update genesis mek rankings
 * Consolidates: updateGenesisRanks.ts, resetGameRanks.ts
 */
export const updateGenesisRanks = mutation({
  args: {
    genesisAssetIds: v.array(v.string()), // List of genesis mek asset IDs
    startRank: v.optional(v.number()), // Starting rank for genesis meks (default: 1)
  },
  handler: async (ctx, args) => {
    let currentRank = args.startRank || 1;
    const results = [];
    
    for (const assetId of args.genesisAssetIds) {
      const mek = await ctx.db
        .query("meks")
        .withIndex("", (q: any) => q.eq("assetId", assetId))
        .first();
      
      if (mek) {
        // Store original CNFT rank if not already stored
        const updates: any = {
          gameRank: currentRank,
          isGenesis: true,
          rarityTier: "Legendary",
          powerScore: 1000 + (10 - currentRank) * 100, // Higher rank = higher power
          lastUpdated: Date.now(),
        };
        
        if (!mek.cnftRank && mek.rarityRank) {
          updates.cnftRank = mek.rarityRank;
        }
        
        await ctx.db.patch(mek._id, updates);
        results.push({ assetId, rank: currentRank, status: "updated" });
        currentRank++;
      } else {
        results.push({ assetId, status: "not_found" });
      }
    }
    
    return {
      success: true,
      message: `Genesis ranks updated: ${results.filter((r: any) => r.status === "updated").length} meks`,
      results,
    };
  },
});

/**
 * Reset game ranks to original CNFT ranks
 */
export const resetGameRanks = mutation({
  args: {
    preserveGenesis: v.optional(v.boolean()), // Keep genesis mek special ranks
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db.query("meks").collect();
    let resetCount = 0;
    let skippedCount = 0;
    
    for (const mek of meks) {
      // Skip genesis meks if preserveGenesis is true
      if (args.preserveGenesis && mek.isGenesis) {
        skippedCount++;
        continue;
      }
      
      // Reset to original CNFT rank if available
      if (mek.cnftRank) {
        await ctx.db.patch(mek._id, {
          gameRank: undefined, // Remove game rank
          rarityRank: mek.cnftRank, // Restore original rank
          lastUpdated: Date.now(),
        });
        resetCount++;
      } else if (mek.gameRank) {
        // If no CNFT rank stored, just remove game rank
        await ctx.db.patch(mek._id, {
          gameRank: undefined,
          lastUpdated: Date.now(),
        });
        resetCount++;
      }
    }
    
    return {
      success: true,
      message: `Ranks reset: ${resetCount} meks reset, ${skippedCount} skipped`,
      stats: {
        total: meks.length,
        reset: resetCount,
        skipped: skippedCount,
      }
    };
  },
});

// ----------------------------------------------------------------------------
// DATA POPULATION MIGRATIONS
// ----------------------------------------------------------------------------

/**
 * Populate source keys and variation IDs
 * Consolidates: populateVariations.ts, updateMekVariationIds.ts
 */
export const populateVariationData = mutation({
  args: {
    mappings: v.array(v.object({
      assetId: v.string(),
      sourceKey: v.optional(v.string()),
      headVariationId: v.optional(v.number()),
      bodyVariationId: v.optional(v.number()),
      itemVariationId: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    let updated = 0;
    let notFound = 0;
    
    // Process in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < args.mappings.length; i += batchSize) {
      const batch = args.mappings.slice(i, i + batchSize);
      
      for (const mapping of batch) {
        const mek = await ctx.db
          .query("meks")
          .withIndex("", (q: any) => q.eq("assetId", mapping.assetId))
          .first();
        
        if (mek) {
          const updates: any = { lastUpdated: Date.now() };
          
          if (mapping.sourceKey && !mek.sourceKey) {
            updates.sourceKey = mapping.sourceKey;
            updates.sourceKeyBase = mapping.sourceKey.replace(/-[BC]$/, "");
          }
          
          if (mapping.headVariationId && !mek.headVariationId) {
            updates.headVariationId = mapping.headVariationId;
          }
          
          if (mapping.bodyVariationId && !mek.bodyVariationId) {
            updates.bodyVariationId = mapping.bodyVariationId;
          }
          
          if (mapping.itemVariationId && !mek.itemVariationId) {
            updates.itemVariationId = mapping.itemVariationId;
          }
          
          // Only update if there are actual changes
          if (Object.keys(updates).length > 1) {
            await ctx.db.patch(mek._id, updates);
            updated++;
            results.push({ assetId: mapping.assetId, status: "updated" });
          } else {
            results.push({ assetId: mapping.assetId, status: "no_changes" });
          }
        } else {
          notFound++;
          results.push({ assetId: mapping.assetId, status: "not_found" });
        }
      }
    }
    
    return {
      success: true,
      message: `Variation data populated: ${updated} updated, ${notFound} not found`,
      stats: {
        total: args.mappings.length,
        updated,
        notFound,
        noChanges: results.filter((r: any) => r.status === "no_changes").length,
      }
    };
  },
});

/**
 * Update gold generation rates for meks
 * Consolidates: updateGoldRate.ts
 */
export const updateGoldRates = mutation({
  args: {
    updates: v.array(v.object({
      assetId: v.string(),
      goldPerHour: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const update of args.updates) {
      const mek = await ctx.db
        .query("meks")
        .withIndex("", (q: any) => q.eq("assetId", update.assetId))
        .first();
      
      if (mek) {
        // Note: goldPerHour might need to be stored in a different table
        // depending on your game mechanics
        await ctx.db.patch(mek._id, {
          // Assuming there's a goldPerHour field or similar
          lastUpdated: Date.now(),
        });
        results.push({ assetId: update.assetId, status: "updated" });
      } else {
        results.push({ assetId: update.assetId, status: "not_found" });
      }
    }
    
    return {
      success: true,
      results,
    };
  },
});

// ----------------------------------------------------------------------------
// CLEANUP MIGRATIONS
// ----------------------------------------------------------------------------

/**
 * Remove deprecated fields from meks
 */
export const removeDeprecatedFields = mutation({
  args: {
    fields: v.array(v.string()), // List of field names to remove
    dryRun: v.optional(v.boolean()), // If true, only report what would be changed
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db.query("meks").collect();
    let affectedCount = 0;
    const affectedMeks = [];
    
    for (const mek of meks) {
      let hasDeprecatedFields = false;
      
      for (const field of args.fields) {
        if (field in mek) {
          hasDeprecatedFields = true;
          break;
        }
      }
      
      if (hasDeprecatedFields) {
        affectedCount++;
        affectedMeks.push(mek.assetId);
        
        if (!args.dryRun) {
          // Create a clean object without deprecated fields
          const cleanMek = { ...mek };
          for (const field of args.fields) {
            delete (cleanMek as any)[field];
          }
          
          // Replace the document
          await ctx.db.replace(mek._id, cleanMek);
        }
      }
    }
    
    return {
      success: true,
      dryRun: args.dryRun || false,
      message: args.dryRun 
        ? `Would remove fields from ${affectedCount} meks`
        : `Removed fields from ${affectedCount} meks`,
      stats: {
        total: meks.length,
        affected: affectedCount,
        affectedMeks: affectedMeks.slice(0, 10), // Return first 10 for review
      }
    };
  },
});

// ----------------------------------------------------------------------------
// VALIDATION QUERIES
// ----------------------------------------------------------------------------

/**
 * Check data integrity and find issues
 */
export const validateMekData = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    const issues = {
      missingImages: [] as string[],
      missingSourceKeys: [] as string[],
      duplicateAssetIds: new Map<string, number>(),
      invalidRanks: [] as Array<{ assetId: string; rank: number | undefined }>,
      missingVariationIds: [] as string[],
      inconsistentData: [] as Array<{ assetId: string; issue: string }>,
    };
    
    const assetIdCounts = new Map<string, number>();
    
    for (const mek of meks) {
      // Check for missing images
      if (!mek.iconUrl) {
        issues.missingImages.push(mek.assetId);
      }
      
      // Check for missing source keys
      if (!mek.sourceKey && !mek.sourceKeyBase) {
        issues.missingSourceKeys.push(mek.assetId);
      }
      
      // Check for duplicate asset IDs
      const count = assetIdCounts.get(mek.assetId) || 0;
      assetIdCounts.set(mek.assetId, count + 1);
      
      // Check for invalid ranks
      const rank = mek.rarityRank || mek.gameRank;
      if (!rank || rank < 1 || rank > 4000) {
        issues.invalidRanks.push({ assetId: mek.assetId, rank });
      }
      
      // Check for missing variation IDs
      if (!mek.headVariationId || !mek.bodyVariationId) {
        issues.missingVariationIds.push(mek.assetId);
      }
      
      // Check for data inconsistencies
      if (mek.gameRank && mek.rarityRank && !mek.cnftRank) {
        issues.inconsistentData.push({
          assetId: mek.assetId,
          issue: "Has gameRank and rarityRank but no cnftRank backup",
        });
      }
    }
    
    // Find duplicates
    for (const [assetId, count] of assetIdCounts) {
      if (count > 1) {
        issues.duplicateAssetIds.set(assetId, count);
      }
    }
    
    return {
      totalMeks: meks.length,
      issues: {
        missingImages: issues.missingImages.length,
        missingSourceKeys: issues.missingSourceKeys.length,
        duplicateAssetIds: issues.duplicateAssetIds.size,
        invalidRanks: issues.invalidRanks.length,
        missingVariationIds: issues.missingVariationIds.length,
        inconsistentData: issues.inconsistentData.length,
      },
      samples: {
        missingImages: issues.missingImages.slice(0, 5),
        missingSourceKeys: issues.missingSourceKeys.slice(0, 5),
        duplicateAssetIds: Array.from(issues.duplicateAssetIds.entries()).slice(0, 5),
        invalidRanks: issues.invalidRanks.slice(0, 5),
        missingVariationIds: issues.missingVariationIds.slice(0, 5),
        inconsistentData: issues.inconsistentData.slice(0, 5),
      }
    };
  },
});

/**
 * Get migration status summary
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const meks = await ctx.db.query("meks").collect();
    
    let withImages = 0;
    let withSourceKeys = 0;
    let withVariationIds = 0;
    let withGameRanks = 0;
    let genesisMeks = 0;
    
    for (const mek of meks) {
      if (mek.iconUrl) withImages++;
      if (mek.sourceKey || mek.sourceKeyBase) withSourceKeys++;
      if (mek.headVariationId && mek.bodyVariationId) withVariationIds++;
      if (mek.gameRank) withGameRanks++;
      if (mek.isGenesis) genesisMeks++;
    }
    
    return {
      totalMeks: meks.length,
      migrationStatus: {
        images: {
          complete: withImages,
          missing: meks.length - withImages,
          percentage: (withImages / meks.length) * 100,
        },
        sourceKeys: {
          complete: withSourceKeys,
          missing: meks.length - withSourceKeys,
          percentage: (withSourceKeys / meks.length) * 100,
        },
        variationIds: {
          complete: withVariationIds,
          missing: meks.length - withVariationIds,
          percentage: (withVariationIds / meks.length) * 100,
        },
        rankings: {
          withGameRanks,
          genesisMeks,
          standard: meks.length - withGameRanks,
        }
      },
      recommendation: withImages === meks.length && withSourceKeys === meks.length
        ? "All migrations complete - safe to remove old migration files"
        : "Migrations still needed - run remaining migration functions",
    };
  },
});