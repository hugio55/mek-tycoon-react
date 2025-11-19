import { internalMutation } from "../_generated/server";

/**
 * Phase 1 Migration: Copy reservation data into inventory table
 *
 * For each ACTIVE reservation in commemorativeNFTReservations:
 * - Find matching inventory row by nftInventoryId
 * - Copy reservation fields (reservedBy, reservedAt, expiresAt, etc.)
 * - Leave status unchanged (already "reserved")
 *
 * This makes inventory table the source of truth while keeping
 * old table intact as backup during Phase 2 testing.
 */
export const migrateActiveReservations = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    console.log('[Migration] Starting reservation migration...');

    // Get all active reservations from old table
    const activeReservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    console.log(`[Migration] Found ${activeReservations.length} active reservations to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const reservation of activeReservations) {
      try {
        // Find corresponding inventory row
        const inventoryRow = await ctx.db.get(reservation.nftInventoryId);

        if (!inventoryRow) {
          const errorMsg = `Reservation ${reservation._id}: inventory row ${reservation.nftInventoryId} not found`;
          console.error(`[Migration] ${errorMsg}`);
          errors.push(errorMsg);
          errorCount++;
          continue;
        }

        console.log(`[Migration] Migrating reservation for NFT #${inventoryRow.nftNumber}`);

        // Copy reservation data to inventory row
        await ctx.db.patch(inventoryRow._id, {
          reservedBy: reservation.reservedBy,
          reservedAt: reservation.reservedAt,
          expiresAt: reservation.expiresAt,
          paymentWindowOpenedAt: reservation.paymentWindowOpenedAt,
          paymentWindowClosedAt: reservation.paymentWindowClosedAt,
          // status is already "reserved" from old system
        });

        migratedCount++;
      } catch (error) {
        const errorMsg = `Reservation ${reservation._id}: ${error}`;
        console.error(`[Migration] ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    console.log(`[Migration] ✓ Migrated ${migratedCount} active reservations`);
    if (errorCount > 0) {
      console.error(`[Migration] ✗ ${errorCount} errors occurred`);
      errors.forEach(err => console.error(`  - ${err}`));
    }

    return {
      success: errorCount === 0,
      migratedCount,
      errorCount,
      errors,
      completedAt: now,
    };
  },
});
