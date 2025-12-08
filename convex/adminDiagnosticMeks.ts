import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * DATABASE DISCREPANCY INVESTIGATION
 *
 * Problem: Database shows 4,042 meks but should only have 4,000
 * User "Monk" (stake1u8zevs...ughgq076) shows 87 meks in admin panel but wallet has 42
 *
 * This file contains TARGETED diagnostics that won't crash the session
 */

/**
 * SUMMARY ONLY - Get high-level counts without returning massive data
 */
export const getMekCountSummary = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Count assetIds
    const assetIdSet = new Set<string>();
    const duplicateAssetIds: string[] = [];
    const assetIdFirstSeen = new Map<string, boolean>();

    for (const mek of allMeks) {
      if (assetIdFirstSeen.has(mek.assetId)) {
        duplicateAssetIds.push(mek.assetId);
      } else {
        assetIdFirstSeen.set(mek.assetId, true);
      }
      assetIdSet.add(mek.assetId);
    }

    // Count invalid (short) assetIds
    const invalidMeks = allMeks.filter(m => m.assetId.length < 50);

    // Count meks with no owner
    const noOwnerMeks = allMeks.filter(m => !m.owner && !m.ownerStakeAddress);

    // Count meks with mismatched owner fields
    const mismatchedOwners = allMeks.filter(m =>
      m.owner && m.ownerStakeAddress && m.owner !== m.ownerStakeAddress
    );

    return {
      totalRecords: allMeks.length,
      uniqueAssetIds: assetIdSet.size,
      expectedMeks: 4000,
      extraRecords: allMeks.length - 4000,
      duplicateCount: duplicateAssetIds.length,
      invalidAssetIdCount: invalidMeks.length,
      noOwnerCount: noOwnerMeks.length,
      mismatchedOwnerCount: mismatchedOwners.length,

      // The math
      accountedFor: {
        duplicates: duplicateAssetIds.length,
        invalid: invalidMeks.length,
        noOwner: noOwnerMeks.length,
        mismatched: mismatchedOwners.length,
        total: duplicateAssetIds.length + invalidMeks.length + noOwnerMeks.length
      }
    };
  },
});

/**
 * Get details about DUPLICATE assetIds (same NFT registered multiple times)
 * Returns summary + first 10 examples
 */
export const getDuplicateAssetIdDetails = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // Map assetId -> array of records
    const assetIdMap = new Map<string, any[]>();

    for (const mek of allMeks) {
      const existing = assetIdMap.get(mek.assetId) || [];
      existing.push({
        _id: mek._id.toString(),
        owner: mek.owner?.substring(0, 25) || 'null',
        ownerStake: mek.ownerStakeAddress?.substring(0, 25) || 'null',
        assetName: mek.assetName,
      });
      assetIdMap.set(mek.assetId, existing);
    }

    // Find duplicates (count > 1)
    const duplicates: { assetId: string; count: number; records: any[] }[] = [];
    Array.from(assetIdMap.entries()).forEach(([assetId, records]) => {
      if (records.length > 1) {
        duplicates.push({
          assetId: assetId.substring(0, 20) + '...',
          count: records.length,
          records
        });
      }
    });

    return {
      totalDuplicateAssetIds: duplicates.length,
      totalExtraRecords: duplicates.reduce((sum, d) => sum + (d.count - 1), 0),
      examples: duplicates.slice(0, 10), // First 10 only
      recommendation: duplicates.length > 0
        ? `Found ${duplicates.length} assetIds with duplicates. Each duplicate beyond the first = 1 extra record.`
        : 'No duplicate assetIds found.'
    };
  },
});

/**
 * Get details about INVALID assetIds (short/test IDs)
 * Returns summary + grouped by owner
 */
export const getInvalidAssetIdDetails = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();
    const invalidMeks = allMeks.filter(m => m.assetId.length < 50);

    // Group by owner
    const byOwner = new Map<string, number>();
    for (const mek of invalidMeks) {
      const owner = mek.owner || mek.ownerStakeAddress || 'no_owner';
      byOwner.set(owner, (byOwner.get(owner) || 0) + 1);
    }

    const ownerBreakdown = Array.from(byOwner.entries())
      .map(([owner, count]) => ({
        owner: owner.substring(0, 30),
        count
      }))
      .sort((a, b) => b.count - a.count); // Highest count first

    // Sample assetIds
    const sampleAssetIds = invalidMeks.slice(0, 10).map(m => m.assetId);

    return {
      totalInvalid: invalidMeks.length,
      ownersAffected: byOwner.size,
      ownerBreakdown,
      sampleAssetIds,
      recommendation: invalidMeks.length > 0
        ? `Found ${invalidMeks.length} meks with invalid assetIds (length < 50). These are likely test data and should be DELETED.`
        : 'All assetIds look valid.'
    };
  },
});

/**
 * Investigate specific wallet - why does count differ from blockchain?
 * This is for the "Monk" wallet showing 87 vs 42 issue
 */
export const investigateWalletMekCount = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = args.walletAddress;
    const allMeks = await ctx.db.query("meks").collect();

    // Find meks by owner (payment address)
    const byOwner = allMeks.filter(m => m.owner === wallet);

    // Find meks by ownerStakeAddress (Phase II)
    const byStake = allMeks.filter(m => m.ownerStakeAddress === wallet);

    // Find meks by EITHER field
    const byEither = allMeks.filter(m => m.owner === wallet || m.ownerStakeAddress === wallet);

    // Check for duplicates
    const assetIds = byEither.map(m => m.assetId);
    const uniqueAssetIds = new Set(assetIds);
    const hasDuplicates = assetIds.length !== uniqueAssetIds.size;

    // Check for invalid assetIds
    const invalidMeks = byEither.filter(m => m.assetId.length < 50);

    // Sample of first 10 meks
    const sample = byEither.slice(0, 10).map(m => ({
      assetId: m.assetId.length > 20 ? m.assetId.substring(0, 20) + '...' : m.assetId,
      assetName: m.assetName,
      owner: m.owner?.substring(0, 20) || 'null',
      ownerStake: m.ownerStakeAddress?.substring(0, 20) || 'null',
      valid: m.assetId.length >= 50
    }));

    return {
      wallet: wallet.substring(0, 30) + '...',
      counts: {
        byOwnerField: byOwner.length,
        byStakeField: byStake.length,
        byEitherField: byEither.length,
        uniqueAssetIds: uniqueAssetIds.size,
      },
      issues: {
        hasDuplicates,
        duplicateCount: assetIds.length - uniqueAssetIds.size,
        invalidCount: invalidMeks.length,
      },
      sample,
      diagnosis: byEither.length > uniqueAssetIds.size
        ? `DUPLICATES FOUND: Wallet has ${byEither.length} mek records but only ${uniqueAssetIds.size} unique NFTs. ${byEither.length - uniqueAssetIds.size} are duplicates.`
        : invalidMeks.length > 0
        ? `INVALID DATA: ${invalidMeks.length} meks have invalid assetIds (test data).`
        : `LOOKS OK: ${byEither.length} meks, all unique and valid.`
    };
  },
});

/**
 * Find meks with no owner at all (orphaned)
 */
export const getOrphanedMeks = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();
    const orphaned = allMeks.filter(m => !m.owner && !m.ownerStakeAddress);

    return {
      count: orphaned.length,
      sample: orphaned.slice(0, 10).map(m => ({
        _id: m._id.toString(),
        assetId: m.assetId.substring(0, 20) + '...',
        assetName: m.assetName,
      })),
      recommendation: orphaned.length > 0
        ? `Found ${orphaned.length} orphaned meks with no owner. These should be DELETED.`
        : 'No orphaned meks found.'
    };
  },
});

/**
 * COMPREHENSIVE REPORT - Run all checks and provide summary
 */
export const getComprehensiveReport = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    // 1. Total counts
    const uniqueAssetIds = new Set(allMeks.map(m => m.assetId)).size;

    // 2. Duplicates
    const assetIdMap = new Map<string, number>();
    for (const mek of allMeks) {
      assetIdMap.set(mek.assetId, (assetIdMap.get(mek.assetId) || 0) + 1);
    }
    const duplicateAssetIds = Array.from(assetIdMap.entries()).filter(([_, count]) => count > 1);
    const duplicateRecordCount = duplicateAssetIds.reduce((sum, [_, count]) => sum + (count - 1), 0);

    // 3. Invalid assetIds
    const invalidMeks = allMeks.filter(m => m.assetId.length < 50);

    // 4. Orphaned
    const orphaned = allMeks.filter(m => !m.owner && !m.ownerStakeAddress);

    // 5. Owner field mismatches
    const mismatched = allMeks.filter(m =>
      m.owner && m.ownerStakeAddress && m.owner !== m.ownerStakeAddress
    );

    return {
      summary: {
        totalRecords: allMeks.length,
        uniqueAssetIds,
        expectedMeks: 4000,
        extraRecords: allMeks.length - 4000,
      },
      issueBreakdown: {
        duplicates: {
          assetIdsWithDuplicates: duplicateAssetIds.length,
          extraRecordsFromDuplicates: duplicateRecordCount,
        },
        invalid: {
          meksWithInvalidAssetIds: invalidMeks.length,
        },
        orphaned: {
          meksWithNoOwner: orphaned.length,
        },
        mismatched: {
          meksWithMismatchedOwnerFields: mismatched.length,
        },
      },
      accounting: {
        duplicateRecords: duplicateRecordCount,
        invalidRecords: invalidMeks.length,
        orphanedRecords: orphaned.length,
        totalIssueRecords: duplicateRecordCount + invalidMeks.length + orphaned.length,
        unexplainedExtra: Math.max(0, (allMeks.length - 4000) - (duplicateRecordCount + invalidMeks.length + orphaned.length)),
      },
      recommendation: `
Database has ${allMeks.length} mek records (expected 4000).
Extra ${allMeks.length - 4000} records explained by:
- Duplicates: ${duplicateRecordCount} extra records
- Invalid assetIds: ${invalidMeks.length} test/demo meks
- Orphaned: ${orphaned.length} meks with no owner
Total accounted: ${duplicateRecordCount + invalidMeks.length + orphaned.length}
Unexplained: ${Math.max(0, (allMeks.length - 4000) - (duplicateRecordCount + invalidMeks.length + orphaned.length))}

Next steps: Run specific diagnostics to get details and deletion targets.
      `.trim()
    };
  },
});
