/**
 * Phase I Veterans Module
 *
 * Manages the 42 original Phase I beta testers. Provides:
 * - Veteran status checking (is this stake address a Phase I veteran?)
 * - Corporation name reservation for Phase II
 * - Seed function to populate from "Final Gold" whitelist snapshot
 *
 * Veterans are automatically entered into Phase II and can reserve their
 * corporation name before anyone else.
 */

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Check if a stake address belongs to a Phase I veteran
 * Returns basic veteran info if found, null otherwise
 */
export const checkPhase1Veteran = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.stakeAddress.toLowerCase().trim();

    const veteran = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
      .first();

    if (!veteran) {
      // Also check with original case (in case data was stored with original casing)
      const veteranOriginalCase = await ctx.db
        .query("phase1Veterans")
        .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", args.stakeAddress.trim()))
        .first();

      if (!veteranOriginalCase) {
        return null;
      }

      return {
        isVeteran: true,
        originalCorporationName: veteranOriginalCase.originalCorporationName,
        reservedCorporationName: veteranOriginalCase.reservedCorporationName || null,
        nameReservedAt: veteranOriginalCase.nameReservedAt || null,
        hasReservedName: !!veteranOriginalCase.reservedCorporationName,
      };
    }

    return {
      isVeteran: true,
      originalCorporationName: veteran.originalCorporationName,
      reservedCorporationName: veteran.reservedCorporationName || null,
      nameReservedAt: veteran.nameReservedAt || null,
      hasReservedName: !!veteran.reservedCorporationName,
    };
  },
});

/**
 * Get full details for a Phase I veteran
 * Used after wallet verification to show complete veteran info
 */
export const getPhase1VeteranDetails = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.stakeAddress.toLowerCase().trim();

    let veteran = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
      .first();

    // Fallback to original case
    if (!veteran) {
      veteran = await ctx.db
        .query("phase1Veterans")
        .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", args.stakeAddress.trim()))
        .first();
    }

    if (!veteran) {
      return null;
    }

    return {
      stakeAddress: veteran.stakeAddress,
      originalCorporationName: veteran.originalCorporationName,
      reservedCorporationName: veteran.reservedCorporationName || null,
      nameReservedAt: veteran.nameReservedAt || null,
      nameChangeHistory: veteran.nameChangeHistory || [],
      lastVerifiedAt: veteran.lastVerifiedAt || null,
    };
  },
});

/**
 * Check if a corporation name is already reserved by another veteran
 */
export const isNameReserved = query({
  args: {
    corporationName: v.string(),
    excludeStakeAddress: v.optional(v.string()), // Don't flag if it's their own reservation
  },
  handler: async (ctx, args) => {
    const normalizedName = args.corporationName.toLowerCase().trim();

    const existingReservation = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_reservedName", (q) => q.eq("reservedCorporationName", normalizedName))
      .first();

    if (!existingReservation) {
      return { reserved: false };
    }

    // If it's their own reservation, don't flag it
    if (args.excludeStakeAddress) {
      const normalizedExclude = args.excludeStakeAddress.toLowerCase().trim();
      if (existingReservation.stakeAddress.toLowerCase() === normalizedExclude) {
        return { reserved: false, isOwnReservation: true };
      }
    }

    return {
      reserved: true,
      reservedBy: existingReservation.originalCorporationName, // Show who has it (Phase I name)
    };
  },
});

/**
 * Reserve or change corporation name for a Phase I veteran
 * REQUIRES prior wallet verification - caller must ensure wallet ownership is proven
 */
export const reserveCorporationName = mutation({
  args: {
    stakeAddress: v.string(),
    newCorporationName: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.stakeAddress.toLowerCase().trim();
    const normalizedNewName = args.newCorporationName.trim();

    // Validate name length
    if (normalizedNewName.length < 2) {
      return { success: false, error: "Corporation name must be at least 2 characters" };
    }
    if (normalizedNewName.length > 30) {
      return { success: false, error: "Corporation name cannot exceed 30 characters" };
    }

    // Find the veteran record
    let veteran = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
      .first();

    // Fallback to original case
    if (!veteran) {
      veteran = await ctx.db
        .query("phase1Veterans")
        .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", args.stakeAddress.trim()))
        .first();
    }

    if (!veteran) {
      return { success: false, error: "Not a Phase I veteran" };
    }

    // Check if the new name is already reserved by someone else
    const normalizedNewNameLower = normalizedNewName.toLowerCase();
    const existingReservation = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_reservedName", (q) => q.eq("reservedCorporationName", normalizedNewNameLower))
      .first();

    if (existingReservation && existingReservation._id !== veteran._id) {
      return {
        success: false,
        error: `"${normalizedNewName}" is already reserved by another Phase I veteran`
      };
    }

    // Build name change history
    const previousName = veteran.reservedCorporationName || veteran.originalCorporationName;
    const now = Date.now();

    const newHistoryEntry = {
      previousName,
      newName: normalizedNewName,
      changedAt: now,
    };

    const updatedHistory = [
      ...(veteran.nameChangeHistory || []),
      newHistoryEntry,
    ];

    // Update the veteran record
    await ctx.db.patch(veteran._id, {
      reservedCorporationName: normalizedNewNameLower, // Store lowercase for index
      nameReservedAt: now,
      nameChangeHistory: updatedHistory,
      lastVerifiedAt: now,
    });

    console.log(`[PHASE1] Corporation name reserved: ${normalizedNewName} for ${veteran.originalCorporationName}`);

    return {
      success: true,
      reservedName: normalizedNewName,
      reservedAt: now,
      previousName,
    };
  },
});

/**
 * Update last verified timestamp after wallet verification
 */
export const updateLastVerified = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.stakeAddress.toLowerCase().trim();

    let veteran = await ctx.db
      .query("phase1Veterans")
      .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
      .first();

    if (!veteran) {
      veteran = await ctx.db
        .query("phase1Veterans")
        .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", args.stakeAddress.trim()))
        .first();
    }

    if (!veteran) {
      return { success: false, error: "Not a Phase I veteran" };
    }

    await ctx.db.patch(veteran._id, {
      lastVerifiedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Seed Phase I veterans from Final Gold whitelist snapshot
 * Should only be run once to populate the table
 */
export const seedFromFinalGoldSnapshot = mutation({
  args: {
    veterans: v.array(v.object({
      stakeAddress: v.string(),
      displayName: v.string(),
    })),
    overwrite: v.optional(v.boolean()), // If true, will update existing records
  },
  handler: async (ctx, args) => {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const now = Date.now();

    for (const veteran of args.veterans) {
      try {
        const normalizedAddress = veteran.stakeAddress.toLowerCase().trim();

        // Check if veteran already exists
        const existing = await ctx.db
          .query("phase1Veterans")
          .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
          .first();

        if (existing) {
          if (args.overwrite) {
            // Update existing record
            await ctx.db.patch(existing._id, {
              originalCorporationName: veteran.displayName,
            });
            results.updated++;
          } else {
            results.skipped++;
          }
          continue;
        }

        // Create new veteran record
        await ctx.db.insert("phase1Veterans", {
          stakeAddress: normalizedAddress,
          originalCorporationName: veteran.displayName,
          createdAt: now,
        });
        results.created++;

      } catch (error: any) {
        results.errors.push(`${veteran.displayName}: ${error.message}`);
      }
    }

    console.log(`[PHASE1] Seed complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);

    return results;
  },
});

/**
 * Get all Phase I veterans (admin function)
 */
export const getAllVeterans = query({
  args: {},
  handler: async (ctx) => {
    const veterans = await ctx.db.query("phase1Veterans").collect();
    return veterans.map(v => ({
      stakeAddress: v.stakeAddress,
      originalCorporationName: v.originalCorporationName,
      reservedCorporationName: v.reservedCorporationName || null,
      nameReservedAt: v.nameReservedAt || null,
      hasReservedName: !!v.reservedCorporationName,
    }));
  },
});

/**
 * Get veteran count
 */
export const getVeteranCount = query({
  args: {},
  handler: async (ctx) => {
    const veterans = await ctx.db.query("phase1Veterans").collect();
    return {
      total: veterans.length,
      withReservedName: veterans.filter(v => v.reservedCorporationName).length,
    };
  },
});

/**
 * Seed Phase I veterans from the existing "Final Gold" whitelist snapshot
 * This queries the whitelistSnapshots table for the Final Gold snapshot
 * and populates the phase1Veterans table
 */
export const seedFromWhitelistSnapshot = mutation({
  args: {
    snapshotName: v.optional(v.string()), // Default: "Final Gold"
    overwrite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const targetName = args.snapshotName || "Final Gold";

    // Query all whitelist snapshots
    const allSnapshots = await ctx.db.query("whitelistSnapshots").collect();

    // Find the Final Gold snapshot
    const finalGoldSnapshot = allSnapshots.find(
      (s: any) => s.snapshotName?.toLowerCase() === targetName.toLowerCase()
    );

    if (!finalGoldSnapshot) {
      return {
        success: false,
        error: `Snapshot "${targetName}" not found. Available: ${allSnapshots.map((s: any) => s.snapshotName).join(", ")}`,
      };
    }

    const eligibleUsers = (finalGoldSnapshot as any).eligibleUsers || [];

    if (eligibleUsers.length === 0) {
      return {
        success: false,
        error: `Snapshot "${targetName}" has no eligible users`,
      };
    }

    console.log(`[PHASE1-SEED] Found ${eligibleUsers.length} veterans in "${targetName}" snapshot`);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const now = Date.now();

    for (const user of eligibleUsers) {
      try {
        // Handle both formats: stakeAddress and walletAddress
        const address = user.stakeAddress || user.walletAddress;
        const name = user.displayName || "Unknown";

        if (!address) {
          results.errors.push(`${name}: No address found`);
          continue;
        }

        const normalizedAddress = address.toLowerCase().trim();

        // Check if veteran already exists
        const existing = await ctx.db
          .query("phase1Veterans")
          .withIndex("by_stakeAddress", (q) => q.eq("stakeAddress", normalizedAddress))
          .first();

        if (existing) {
          if (args.overwrite) {
            await ctx.db.patch(existing._id, {
              originalCorporationName: name,
            });
            results.updated++;
          } else {
            results.skipped++;
          }
          continue;
        }

        // Create new veteran record
        await ctx.db.insert("phase1Veterans", {
          stakeAddress: normalizedAddress,
          originalCorporationName: name,
          createdAt: now,
        });
        results.created++;

      } catch (error: any) {
        results.errors.push(`Error: ${error.message}`);
      }
    }

    console.log(`[PHASE1-SEED] Complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);

    return {
      success: true,
      snapshotName: targetName,
      totalInSnapshot: eligibleUsers.length,
      ...results,
    };
  },
});
