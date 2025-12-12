import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import mekRarityMaster from "./mekRarityMaster.json";

// Build sourceKey to variation lookup from master data (source of truth)
const sourceKeyToVariations = new Map<string, { head: string; body: string; trait: string }>();
(mekRarityMaster as any[]).forEach((mek) => {
  if (mek.sourceKey && mek.head && mek.body && mek.trait) {
    // Normalize key: uppercase, remove suffix
    const normalizedKey = mek.sourceKey.toUpperCase().replace(/-[A-Z]$/i, "");
    sourceKeyToVariations.set(normalizedKey, {
      head: mek.head,
      body: mek.body,
      trait: mek.trait,
    });
  }
});

// Helper: Get variation names from sourceKey (source of truth)
function getVariationsFromSourceKey(sourceKey?: string): { head?: string; body?: string; trait?: string } | null {
  if (!sourceKey) return null;
  const normalizedKey = sourceKey.toUpperCase().replace(/-[A-Z]$/i, "");
  const data = sourceKeyToVariations.get(normalizedKey);
  return data || null;
}

/**
 * MEKS TABLE PROTECTION
 * The meks table contains exactly 4000 NFTs - this is FIXED and IMMUTABLE.
 * Deduplication functions require unlock code to prevent accidental data loss.
 */
const EMERGENCY_UNLOCK_CODE = "I_UNDERSTAND_THIS_WILL_MODIFY_4000_NFTS";

/**
 * Find duplicate meks by mek number (same NFT with different assetId formats)
 *
 * The issue: Some meks exist twice:
 * - Once with short assetId (just mint number like "2191")
 * - Once with full Cardano assetId (policyId + hex asset name)
 *
 * The correct format is the full Cardano assetId.
 */
export const findDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Extract mek number from assetName
    function getMekNumber(mek: any): number | null {
      const match = mek.assetName?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }

    // Group by mek number
    const byMekNumber = new Map<number, any[]>();
    allMeks.forEach(mek => {
      const num = getMekNumber(mek);
      if (num !== null) {
        if (!byMekNumber.has(num)) byMekNumber.set(num, []);
        byMekNumber.get(num)!.push(mek);
      }
    });

    // Find duplicates
    const duplicates: { mekNumber: number; entries: any[] }[] = [];
    byMekNumber.forEach((meks, num) => {
      if (meks.length > 1) {
        duplicates.push({
          mekNumber: num,
          entries: meks.map(m => ({
            _id: m._id,
            assetId: m.assetId,
            assetName: m.assetName,
            owner: m.owner,
            isLongFormat: m.assetId.length > 50,
          })),
        });
      }
    });

    return {
      totalMeks: allMeks.length,
      duplicateMekNumbers: duplicates.length,
      expectedAfterDedup: allMeks.length - duplicates.length,
      duplicates: duplicates.slice(0, 10), // First 10 for inspection
    };
  },
});

/**
 * Remove duplicate meks, keeping the ones with full Cardano assetIds
 *
 * For each duplicate:
 * - If one has long assetId (>50 chars) and one has short, delete the short one
 * - Transfer any important data (tenure, slot info) from short to long if needed
 *
 * PROTECTED: Requires unlock code to prevent accidental data loss.
 */
export const removeDuplicates = mutation({
  args: {
    unlockCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // PROTECTION: Block by default
    if (args.unlockCode !== EMERGENCY_UNLOCK_CODE) {
      console.error("[MEKS-PROTECTION] BLOCKED: removeDuplicates called without unlock code");
      return {
        success: false,
        error: "BLOCKED: This function deletes mek records. " +
               "Provide unlockCode to proceed.",
        deletedCount: 0,
        mergedDataCount: 0,
        finalMekCount: 0,
        deletedAssetIds: [],
        message: "Blocked - unlock code required",
      };
    }

    console.warn("[MEKS-PROTECTION] Emergency unlock accepted - proceeding with deduplication");
    const allMeks = await ctx.db.query("meks").collect();

    // Extract mek number from assetName
    function getMekNumber(mek: any): number | null {
      const match = mek.assetName?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }

    // Group by mek number
    const byMekNumber = new Map<number, any[]>();
    allMeks.forEach(mek => {
      const num = getMekNumber(mek);
      if (num !== null) {
        if (!byMekNumber.has(num)) byMekNumber.set(num, []);
        byMekNumber.get(num)!.push(mek);
      }
    });

    let deletedCount = 0;
    let mergedData = 0;
    const deletedIds: string[] = [];

    for (const [mekNumber, meks] of byMekNumber.entries()) {
      if (meks.length <= 1) continue;

      // Separate long and short format entries
      const longFormat = meks.filter(m => m.assetId.length > 50);
      const shortFormat = meks.filter(m => m.assetId.length <= 50);

      if (longFormat.length === 0 || shortFormat.length === 0) {
        console.log(`[Dedup] Mek #${mekNumber}: unexpected format distribution, skipping`);
        continue;
      }

      // Keep the long format entry, delete short format entries
      const keepEntry = longFormat[0];

      for (const deleteEntry of shortFormat) {
        // Check if short entry has important data to transfer
        const hasImportantData =
          (deleteEntry.tenurePoints && deleteEntry.tenurePoints > 0) ||
          deleteEntry.isSlotted ||
          deleteEntry.talentTree;

        if (hasImportantData) {
          // Merge important data into the long format entry
          console.log(`[Dedup] Mek #${mekNumber}: merging data from short to long format`);
          await ctx.db.patch(keepEntry._id, {
            tenurePoints: Math.max(keepEntry.tenurePoints || 0, deleteEntry.tenurePoints || 0),
            lastTenureUpdate: deleteEntry.lastTenureUpdate || keepEntry.lastTenureUpdate,
            isSlotted: keepEntry.isSlotted || deleteEntry.isSlotted,
            slotNumber: keepEntry.slotNumber || deleteEntry.slotNumber,
            talentTree: keepEntry.talentTree || deleteEntry.talentTree,
          });
          mergedData++;
        }

        // Delete the short format entry
        await ctx.db.delete(deleteEntry._id);
        deletedCount++;
        deletedIds.push(deleteEntry.assetId);
      }
    }

    console.log(`[Dedup] Removed ${deletedCount} duplicate entries`);

    // Verify final count
    const finalMeks = await ctx.db.query("meks").collect();

    return {
      success: true,
      deletedCount,
      mergedDataCount: mergedData,
      finalMekCount: finalMeks.length,
      deletedAssetIds: deletedIds.slice(0, 20),
      message: `Removed ${deletedCount} duplicates. Final count: ${finalMeks.length} meks`,
    };
  },
});

/**
 * Find incorrectly assigned short-format meks for a specific wallet
 * These are meks with short assetIds that shouldn't be owned by this wallet
 * (the wallet-synced long-format meks are the source of truth)
 */
export const findMisassignedMeks = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Find meks owned by this wallet
    const userMeks = allMeks.filter(m => m.owner === args.walletAddress);

    // Separate by format
    const longFormat = userMeks.filter(m => m.assetId.length > 50);
    const shortFormat = userMeks.filter(m => m.assetId.length <= 50);

    // Get mek numbers from long format (these are verified on-chain)
    const verifiedMekNumbers = new Set<number>();
    longFormat.forEach(m => {
      const match = m.assetName?.match(/\d+/);
      if (match) verifiedMekNumbers.add(parseInt(match[0]));
    });

    // Find short-format meks that are NOT in verified set
    const misassigned = shortFormat.filter(m => {
      const match = m.assetName?.match(/\d+/);
      const mekNum = match ? parseInt(match[0]) : null;
      return mekNum === null || !verifiedMekNumbers.has(mekNum);
    });

    return {
      walletAddress: args.walletAddress.substring(0, 30) + "...",
      longFormatCount: longFormat.length,
      shortFormatCount: shortFormat.length,
      verifiedMekNumbers: longFormat.length,
      misassignedCount: misassigned.length,
      misassigned: misassigned.map(m => ({
        _id: m._id.toString(),
        assetId: m.assetId,
        assetName: m.assetName,
        mekNumber: m.assetName?.match(/\d+/)?.[0] || "unknown",
      })),
    };
  },
});

/**
 * Fix incorrectly assigned short-format meks from a wallet
 * Clears ownership (sets owner to undefined) so mek stays in DB but isn't counted for user
 * Only affects meks that don't have corresponding long-format (on-chain) entries
 *
 * PROTECTED: Requires unlock code to prevent accidental ownership changes.
 */
export const fixMisassignedMeks = mutation({
  args: {
    walletAddress: v.string(),
    unlockCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // PROTECTION: Block by default
    if (args.unlockCode !== EMERGENCY_UNLOCK_CODE) {
      console.error("[MEKS-PROTECTION] BLOCKED: fixMisassignedMeks called without unlock code");
      return {
        success: false,
        error: "BLOCKED: This function modifies mek ownership. " +
               "Provide unlockCode to proceed.",
        fixedCount: 0,
        fixedAssetIds: [],
        finalUserMekCount: 0,
        totalMeksInDb: 0,
        message: "Blocked - unlock code required",
      };
    }

    console.warn("[MEKS-PROTECTION] Emergency unlock accepted - proceeding with ownership fix");
    const allMeks = await ctx.db.query("meks").collect();

    // Find meks owned by this wallet
    const userMeks = allMeks.filter(m => m.owner === args.walletAddress);

    // Separate by format
    const longFormat = userMeks.filter(m => m.assetId.length > 50);
    const shortFormat = userMeks.filter(m => m.assetId.length <= 50);

    // Get mek numbers from long format (verified on-chain)
    const verifiedMekNumbers = new Set<number>();
    longFormat.forEach(m => {
      const match = m.assetName?.match(/\d+/);
      if (match) verifiedMekNumbers.add(parseInt(match[0]));
    });

    // Find short-format meks NOT in verified set
    const misassigned = shortFormat.filter(m => {
      const match = m.assetName?.match(/\d+/);
      const mekNum = match ? parseInt(match[0]) : null;
      return mekNum === null || !verifiedMekNumbers.has(mekNum);
    });

    // Clear ownership on misassigned meks (don't delete - keeps total at 4000)
    // Set owner to empty string since schema requires non-null owner
    const fixedIds: string[] = [];
    for (const mek of misassigned) {
      await ctx.db.patch(mek._id, {
        owner: "", // Empty string = no owner
        ownerStakeAddress: undefined,
      });
      fixedIds.push(mek.assetId);
      console.log(`[Cleanup] Cleared ownership on misassigned mek ${mek.assetName}`);
    }

    // Verify count
    const finalUserMeks = (await ctx.db.query("meks").collect())
      .filter(m => m.owner === args.walletAddress);

    const totalMeks = (await ctx.db.query("meks").collect()).length;

    return {
      success: true,
      fixedCount: fixedIds.length,
      fixedAssetIds: fixedIds,
      finalUserMekCount: finalUserMeks.length,
      totalMeksInDb: totalMeks,
      message: `Fixed ${fixedIds.length} misassigned meks (cleared ownership). User now has ${finalUserMeks.length} meks. Total DB: ${totalMeks}`,
    };
  },
});

/**
 * Sync ownerStakeAddress from owner field
 *
 * The backup data only had `owner` field populated.
 * Phase II queries use `ownerStakeAddress` index.
 * This syncs the data so queries work correctly.
 *
 * For meks where `owner` starts with "stake1":
 * - Copy owner to ownerStakeAddress
 */
export const syncOwnerStakeAddress = mutation({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    let synced = 0;
    let skipped = 0;

    for (const mek of allMeks) {
      // Only sync if owner is a stake address and ownerStakeAddress is empty
      if (mek.owner?.startsWith("stake1") && !mek.ownerStakeAddress) {
        await ctx.db.patch(mek._id, {
          ownerStakeAddress: mek.owner,
        });
        synced++;
      } else {
        skipped++;
      }
    }

    console.log(`[Sync] Synced ownerStakeAddress for ${synced} meks, skipped ${skipped}`);

    return {
      success: true,
      synced,
      skipped,
      total: allMeks.length,
      message: `Synced ownerStakeAddress for ${synced} meks`,
    };
  },
});

// =============================================================================
// VARIATION DATA REPAIR
// =============================================================================

/**
 * Preview meks with incorrect variation data
 *
 * Compares database variation fields against sourceKey lookup (source of truth).
 * Returns list of meks that need repair.
 */
export const previewVariationRepair = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    const needsRepair: {
      assetName: string;
      mekNumber?: number;
      sourceKey: string;
      currentVariations: { head?: string; body?: string; trait?: string };
      correctVariations: { head?: string; body?: string; trait?: string };
      ownerStakeAddress?: string;
    }[] = [];

    let checked = 0;
    let correct = 0;
    let noSourceKey = 0;
    let sourceKeyNotFound = 0;

    for (const mek of allMeks) {
      checked++;

      if (!mek.sourceKey) {
        noSourceKey++;
        continue;
      }

      const correctVars = getVariationsFromSourceKey(mek.sourceKey);
      if (!correctVars) {
        sourceKeyNotFound++;
        continue;
      }

      // Compare (case-insensitive)
      const headMatch = correctVars.head?.toLowerCase() === mek.headVariation?.toLowerCase();
      const bodyMatch = correctVars.body?.toLowerCase() === mek.bodyVariation?.toLowerCase();
      const traitMatch = correctVars.trait?.toLowerCase() === mek.itemVariation?.toLowerCase();

      if (headMatch && bodyMatch && traitMatch) {
        correct++;
      } else {
        needsRepair.push({
          assetName: mek.assetName,
          mekNumber: mek.mekNumber,
          sourceKey: mek.sourceKey,
          currentVariations: {
            head: mek.headVariation,
            body: mek.bodyVariation,
            trait: mek.itemVariation,
          },
          correctVariations: correctVars,
          ownerStakeAddress: mek.ownerStakeAddress,
        });
      }
    }

    // Group by owner for analysis
    const byOwner: Record<string, number> = {};
    for (const mek of needsRepair) {
      const owner = mek.ownerStakeAddress || "unowned";
      byOwner[owner] = (byOwner[owner] || 0) + 1;
    }

    return {
      summary: {
        totalChecked: checked,
        correct,
        needsRepair: needsRepair.length,
        noSourceKey,
        sourceKeyNotFound,
      },
      byOwner,
      // First 20 for preview
      sampleMeks: needsRepair.slice(0, 20),
      message: needsRepair.length === 0
        ? "All meks have correct variation data!"
        : `Found ${needsRepair.length} meks with incorrect variation data that need repair.`,
    };
  },
});

/**
 * Repair meks with incorrect variation data
 *
 * Updates headVariation, bodyVariation, and itemVariation fields
 * using sourceKey lookup from mekRarityMaster.json (source of truth).
 *
 * PROTECTED: Requires unlock code to prevent accidental changes.
 */
export const repairVariationData = mutation({
  args: {
    unlockCode: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun || false;

    // PROTECTION: Block by default
    if (!dryRun && args.unlockCode !== EMERGENCY_UNLOCK_CODE) {
      console.error("[MEKS-PROTECTION] BLOCKED: repairVariationData called without unlock code");
      return {
        success: false,
        error: "BLOCKED: This function modifies mek variation data. " +
               "Provide unlockCode: 'I_UNDERSTAND_THIS_WILL_MODIFY_4000_NFTS' to proceed, " +
               "or use dryRun: true to preview changes.",
        repaired: 0,
        details: [],
      };
    }

    if (!dryRun) {
      console.warn("[MEKS-PROTECTION] Emergency unlock accepted - proceeding with variation repair");
    } else {
      console.log("[Repair] Running in dry-run mode - no changes will be made");
    }

    const allMeks = await ctx.db.query("meks").collect();

    let repaired = 0;
    let skipped = 0;
    const details: {
      assetName: string;
      mekNumber?: number;
      before: { head?: string; body?: string; trait?: string };
      after: { head?: string; body?: string; trait?: string };
    }[] = [];

    for (const mek of allMeks) {
      if (!mek.sourceKey) {
        skipped++;
        continue;
      }

      const correctVars = getVariationsFromSourceKey(mek.sourceKey);
      if (!correctVars) {
        skipped++;
        continue;
      }

      // Check if repair needed (case-insensitive comparison)
      const headMatch = correctVars.head?.toLowerCase() === mek.headVariation?.toLowerCase();
      const bodyMatch = correctVars.body?.toLowerCase() === mek.bodyVariation?.toLowerCase();
      const traitMatch = correctVars.trait?.toLowerCase() === mek.itemVariation?.toLowerCase();

      if (headMatch && bodyMatch && traitMatch) {
        // Already correct
        continue;
      }

      // Record the change
      if (details.length < 50) {
        details.push({
          assetName: mek.assetName,
          mekNumber: mek.mekNumber,
          before: {
            head: mek.headVariation,
            body: mek.bodyVariation,
            trait: mek.itemVariation,
          },
          after: correctVars,
        });
      }

      // Apply the fix (unless dry run)
      if (!dryRun) {
        await ctx.db.patch(mek._id, {
          headVariation: correctVars.head,
          bodyVariation: correctVars.body,
          itemVariation: correctVars.trait,
          lastUpdated: Date.now(),
        });
        console.log(`[Repair] Fixed ${mek.assetName}: ${mek.headVariation}/${mek.bodyVariation}/${mek.itemVariation} -> ${correctVars.head}/${correctVars.body}/${correctVars.trait}`);
      }

      repaired++;
    }

    const message = dryRun
      ? `DRY RUN: Would repair ${repaired} meks. Run with unlockCode to apply changes.`
      : `Repaired ${repaired} meks with correct variation data from sourceKey.`;

    console.log(`[Repair] ${message}`);

    return {
      success: true,
      dryRun,
      repaired,
      skipped,
      total: allMeks.length,
      details,
      message,
    };
  },
});

/**
 * Find missing mek numbers
 *
 * Checks which mek numbers (1-4000) are NOT in the database.
 * Helps identify if records were never imported or accidentally deleted.
 */
export const findMissingMekNumbers = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Extract mek numbers from assetName (e.g., "Mekanism #1234" -> 1234)
    const presentNumbers = new Set<number>();

    for (const mek of allMeks) {
      // Try mekNumber field first
      if (mek.mekNumber && typeof mek.mekNumber === "number") {
        presentNumbers.add(mek.mekNumber);
        continue;
      }

      // Fall back to parsing assetName
      const match = mek.assetName?.match(/\d+/);
      if (match) {
        presentNumbers.add(parseInt(match[0]));
      }
    }

    // Find missing numbers (1-4000)
    const missingNumbers: number[] = [];
    for (let i = 1; i <= 4000; i++) {
      if (!presentNumbers.has(i)) {
        missingNumbers.push(i);
      }
    }

    return {
      totalInDb: allMeks.length,
      expectedTotal: 4000,
      missingCount: missingNumbers.length,
      missingNumbers: missingNumbers,
      hasMekNumberField: allMeks.filter(m => m.mekNumber).length,
      message: missingNumbers.length === 0
        ? "All 4000 meks are present in the database!"
        : `Missing ${missingNumbers.length} meks from database.`,
    };
  },
});
