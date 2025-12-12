/**
 * MIGRATION: Populate mekNumber field on all meks
 * ================================================
 *
 * This migration extracts the mek number from each mek's assetName
 * (e.g., "Mek #2191" -> 2191) and stores it in the new mekNumber field.
 *
 * This is a PATCH operation - it modifies existing meks but doesn't
 * insert or delete any records. Safe to run on the protected meks table.
 *
 * Run this migration ONCE after deploying the schema change.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Parse mek number from assetName
 * Handles various formats: "Mek #2191", "Mekanism #0253", "Mekanism0995", etc.
 */
function parseMekNumberFromAssetName(assetName: string): number | null {
  if (!assetName) return null;

  // Try various patterns to extract the number
  const patterns = [
    /Mekanism\s*#?\s*0*(\d+)/i,  // "Mekanism #0253" or "Mekanism253"
    /Mek\s*#?\s*0*(\d+)/i,       // "Mek #2191" or "Mek2191"
    /#0*(\d+)/,                   // Just "#253" or "#0253"
  ];

  for (const pattern of patterns) {
    const match = assetName.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (!isNaN(number) && number >= 1 && number <= 4000) {
        return number;
      }
    }
  }

  return null;
}

/**
 * Check migration status - how many meks need mekNumber populated
 */
export const checkMekNumberMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    let total = 0;
    let withMekNumber = 0;
    let withoutMekNumber = 0;
    let parseFailures: string[] = [];

    for (const mek of allMeks) {
      total++;

      if (mek.mekNumber !== undefined && mek.mekNumber !== null) {
        withMekNumber++;
      } else {
        withoutMekNumber++;

        // Try to parse to see if it would succeed
        const parsed = parseMekNumberFromAssetName(mek.assetName);
        if (parsed === null) {
          parseFailures.push(`${mek.assetName} (assetId: ${mek.assetId.substring(0, 20)}...)`);
        }
      }
    }

    return {
      total,
      withMekNumber,
      withoutMekNumber,
      migrationNeeded: withoutMekNumber > 0,
      parseFailures: parseFailures.slice(0, 10), // First 10 failures
      totalParseFailures: parseFailures.length,
      message: withoutMekNumber === 0
        ? "Migration complete! All meks have mekNumber populated."
        : `Migration needed: ${withoutMekNumber} meks are missing mekNumber.`
    };
  },
});

/**
 * Run the migration - populate mekNumber for all meks
 *
 * This uses batching to avoid timeout issues with 4000 records.
 * Run multiple times if needed until all meks are migrated.
 */
export const populateMekNumbers = mutation({
  args: {
    batchSize: v.optional(v.number()), // Default 500
    dryRun: v.optional(v.boolean()),   // If true, just report what would be done
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 500;
    const dryRun = args.dryRun || false;

    console.log(`[Migration] Starting mekNumber population (batchSize: ${batchSize}, dryRun: ${dryRun})`);

    // Get all meks that need migration
    const allMeks = await ctx.db.query("meks").collect();
    const meksToMigrate = allMeks.filter(
      mek => mek.mekNumber === undefined || mek.mekNumber === null
    );

    console.log(`[Migration] Found ${meksToMigrate.length} meks needing migration`);

    // Process a batch
    const batch = meksToMigrate.slice(0, batchSize);
    let migrated = 0;
    let failed = 0;
    const failures: { assetName: string; reason: string }[] = [];

    for (const mek of batch) {
      const mekNumber = parseMekNumberFromAssetName(mek.assetName);

      if (mekNumber === null) {
        failed++;
        failures.push({
          assetName: mek.assetName,
          reason: "Could not parse mek number from assetName"
        });
        continue;
      }

      if (!dryRun) {
        await ctx.db.patch(mek._id, { mekNumber });
      }

      migrated++;
    }

    const remaining = meksToMigrate.length - batch.length;

    console.log(`[Migration] Batch complete: ${migrated} migrated, ${failed} failed, ${remaining} remaining`);

    return {
      success: true,
      dryRun,
      batchProcessed: batch.length,
      migrated,
      failed,
      remaining,
      totalMeks: allMeks.length,
      failures: failures.slice(0, 10),
      message: remaining > 0
        ? `Batch complete. Run again to process remaining ${remaining} meks.`
        : `Migration complete! All meks now have mekNumber populated.`,
      nextStep: remaining > 0
        ? "Run this mutation again to process the next batch"
        : "Migration finished - no further action needed"
    };
  },
});

/**
 * Verify migration integrity - ensure all mekNumbers are valid and unique
 */
export const verifyMekNumberIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    const seenNumbers = new Map<number, string[]>(); // mekNumber -> [assetIds]
    let missing = 0;
    let outOfRange = 0;
    let duplicates = 0;

    for (const mek of allMeks) {
      if (mek.mekNumber === undefined || mek.mekNumber === null) {
        missing++;
        continue;
      }

      if (mek.mekNumber < 1 || mek.mekNumber > 4000) {
        outOfRange++;
        continue;
      }

      if (!seenNumbers.has(mek.mekNumber)) {
        seenNumbers.set(mek.mekNumber, []);
      }
      seenNumbers.get(mek.mekNumber)!.push(mek.assetId);
    }

    // Check for duplicates
    const duplicateNumbers: { mekNumber: number; count: number }[] = [];
    for (const [num, assetIds] of seenNumbers.entries()) {
      if (assetIds.length > 1) {
        duplicates += assetIds.length - 1;
        duplicateNumbers.push({ mekNumber: num, count: assetIds.length });
      }
    }

    // Check coverage (should have 1-4000)
    const missingNumbers: number[] = [];
    for (let i = 1; i <= 4000; i++) {
      if (!seenNumbers.has(i) || seenNumbers.get(i)!.length === 0) {
        missingNumbers.push(i);
      }
    }

    const isValid = missing === 0 && outOfRange === 0 && duplicates === 0 && missingNumbers.length === 0;

    return {
      totalMeks: allMeks.length,
      withValidMekNumber: allMeks.length - missing,
      missing,
      outOfRange,
      duplicates,
      duplicateDetails: duplicateNumbers.slice(0, 10),
      missingMekNumbers: missingNumbers.slice(0, 20),
      totalMissingNumbers: missingNumbers.length,
      isValid,
      status: isValid ? "VALID" : "ISSUES_FOUND",
      message: isValid
        ? "All mekNumbers are valid, unique, and cover the full range 1-4000"
        : `Issues found: ${missing} missing, ${outOfRange} out of range, ${duplicates} duplicates, ${missingNumbers.length} missing numbers`
    };
  },
});
