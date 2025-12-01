import { query } from "../_generated/server";

/**
 * Verify that reservation migration completed successfully
 *
 * Compares all active reservations in old table with new inventory fields
 * to ensure data was copied correctly.
 */
export const verifyReservationMigration = query({
  handler: async (ctx) => {
    console.log('[Verification] Starting migration verification...');

    // Get all active reservations from OLD table
    const oldReservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    console.log(`[Verification] Found ${oldReservations.length} active reservations in old table`);

    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches: any[] = [];

    for (const oldRes of oldReservations) {
      const inventoryRow = await ctx.db.get(oldRes.nftInventoryId);

      if (!inventoryRow) {
        mismatchCount++;
        mismatches.push({
          reservationId: oldRes._id,
          issue: "Inventory row not found",
          nftNumber: oldRes.nftNumber,
        });
        continue;
      }

      // Compare fields
      const reservedByMatches = inventoryRow.reservedBy === oldRes.reservedBy;
      const reservedAtMatches = inventoryRow.reservedAt === oldRes.reservedAt;
      const expiresAtMatches = inventoryRow.expiresAt === oldRes.expiresAt;
      const statusMatches = inventoryRow.status === "reserved";

      const allMatch = reservedByMatches && reservedAtMatches && expiresAtMatches && statusMatches;

      if (allMatch) {
        matchCount++;
      } else {
        mismatchCount++;
        mismatches.push({
          reservationId: oldRes._id,
          inventoryId: inventoryRow._id,
          nftNumber: oldRes.nftNumber,
          issues: {
            reservedBy: reservedByMatches ? '✓' : `✗ old: ${oldRes.reservedBy}, new: ${inventoryRow.reservedBy}`,
            reservedAt: reservedAtMatches ? '✓' : `✗ old: ${oldRes.reservedAt}, new: ${inventoryRow.reservedAt}`,
            expiresAt: expiresAtMatches ? '✓' : `✗ old: ${oldRes.expiresAt}, new: ${inventoryRow.expiresAt}`,
            status: statusMatches ? '✓' : `✗ expected: reserved, got: ${inventoryRow.status}`,
          },
        });
      }
    }

    const success = mismatchCount === 0;

    if (success) {
      console.log(`[Verification] ✓ SUCCESS: All ${matchCount} reservations migrated correctly`);
    } else {
      console.error(`[Verification] ✗ FAILURE: ${mismatchCount} mismatches found`);
      console.error('[Verification] Mismatches:', JSON.stringify(mismatches, null, 2));
    }

    return {
      totalReservations: oldReservations.length,
      matchCount,
      mismatchCount,
      success,
      mismatches: success ? [] : mismatches,
    };
  },
});
