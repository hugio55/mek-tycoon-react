import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Migration Utilities for Multi-Campaign System
 *
 * This file provides helper mutations and queries for migrating existing
 * Lab Rat NFT data into the new campaign-based system.
 *
 * IMPORTANT: User will run these migrations MANUALLY from Convex dashboard.
 * This is NOT an automated migration - it's a tool for one-time manual conversion.
 */

// ============================================================================
// MIGRATION ANALYSIS QUERIES
// ============================================================================

/**
 * Analyze existing Lab Rat data
 *
 * Returns counts and sample data to help user understand what will be migrated.
 */
export const analyzeExistingData = query({
  handler: async (ctx) => {
    // Count existing records without campaignId
    const inventoryWithoutCampaign = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    const reservationsWithoutCampaign = await ctx.db
      .query("commemorativeNFTReservations")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    const claimsWithoutCampaign = await ctx.db
      .query("commemorativeNFTClaims")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    // Status breakdown
    const inventoryStats = {
      available: inventoryWithoutCampaign.filter((i) => i.status === "available").length,
      reserved: inventoryWithoutCampaign.filter((i) => i.status === "reserved").length,
      sold: inventoryWithoutCampaign.filter((i) => i.status === "sold").length,
    };

    const reservationStats = {
      active: reservationsWithoutCampaign.filter((r) => r.status === "active").length,
      completed: reservationsWithoutCampaign.filter((r) => r.status === "completed").length,
      expired: reservationsWithoutCampaign.filter((r) => r.status === "expired").length,
      cancelled: reservationsWithoutCampaign.filter((r) => r.status === "cancelled").length,
    };

    // Sample data (first 3 items)
    const sampleInventory = inventoryWithoutCampaign.slice(0, 3).map((i) => ({
      name: i.name,
      nftNumber: i.nftNumber,
      status: i.status,
      nftUid: i.nftUid,
    }));

    return {
      summary: {
        inventoryCount: inventoryWithoutCampaign.length,
        reservationsCount: reservationsWithoutCampaign.length,
        claimsCount: claimsWithoutCampaign.length,
      },
      inventoryStats,
      reservationStats,
      sampleInventory,
      recommendedAction:
        inventoryWithoutCampaign.length > 0
          ? "Run migrateLabRatToCampaign to convert this data"
          : "No migration needed - all data is already campaign-scoped",
    };
  },
});

/**
 * Check if Lab Rat campaign already exists
 */
export const checkLabRatCampaignExists = query({
  handler: async (ctx) => {
    const campaign = await ctx.db
      .query("commemorativeCampaigns")
      .withIndex("by_name", (q: any) => q.eq("name", "Lab Rat"))
      .first();

    return {
      exists: !!campaign,
      campaign: campaign || null,
    };
  },
});

// ============================================================================
// MIGRATION MUTATIONS (Manual Execution)
// ============================================================================

/**
 * STEP 1: Create Lab Rat campaign
 *
 * Run this FIRST to create the campaign container for existing data.
 * Customize the parameters if needed (description, dates, etc.)
 */
export const createLabRatCampaign = mutation({
  args: {
    nmkrProjectId: v.string(), // User must provide their NMKR project ID
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already exists
    const existing = await ctx.db
      .query("commemorativeCampaigns")
      .withIndex("by_name", (q: any) => q.eq("name", "Lab Rat"))
      .first();

    if (existing) {
      console.log('[MIGRATION] Lab Rat campaign already exists:', existing._id);
      return {
        success: false,
        error: "Lab Rat campaign already exists",
        campaignId: existing._id,
      };
    }

    // Create Lab Rat campaign
    const campaignId = await ctx.db.insert("commemorativeCampaigns", {
      name: "Lab Rat",
      description: args.description || "Original commemorative NFT collection for Mek Tycoon Lab Rats",
      nmkrProjectId: args.nmkrProjectId,
      status: "inactive", // Start inactive, activate after migration
      maxNFTs: 10, // Lab Rat has 10 NFTs
      createdAt: now,
      updatedAt: now,
      totalNFTs: 0,
      availableNFTs: 0,
      reservedNFTs: 0,
      soldNFTs: 0,
    });

    console.log('[MIGRATION] Created Lab Rat campaign:', campaignId);

    return {
      success: true,
      campaignId,
      message: "Lab Rat campaign created. Now run migrateLabRatInventory.",
    };
  },
});

/**
 * STEP 2: Migrate Lab Rat inventory to campaign
 *
 * Links all existing inventory items (without campaignId) to Lab Rat campaign.
 * This is NON-DESTRUCTIVE - only adds campaignId field.
 */
export const migrateLabRatInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[MIGRATION] Migrating inventory to campaign:', campaign.name);

    // Find all inventory without campaignId
    const inventoryToMigrate = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    if (inventoryToMigrate.length === 0) {
      return {
        success: false,
        error: "No inventory found without campaignId. Already migrated?",
      };
    }

    console.log('[MIGRATION] Found', inventoryToMigrate.length, 'inventory items to migrate');

    // Update each inventory item
    let migrated = 0;
    for (const item of inventoryToMigrate) {
      await ctx.db.patch(item._id, {
        campaignId: args.campaignId,
      });
      migrated++;
    }

    // Count status breakdown
    const stats = {
      available: inventoryToMigrate.filter((i) => i.status === "available").length,
      reserved: inventoryToMigrate.filter((i) => i.status === "reserved").length,
      sold: inventoryToMigrate.filter((i) => i.status === "sold").length,
    };

    // Update campaign counters
    await ctx.db.patch(args.campaignId, {
      totalNFTs: migrated,
      availableNFTs: stats.available,
      reservedNFTs: stats.reserved,
      soldNFTs: stats.sold,
      updatedAt: Date.now(),
    });

    console.log('[MIGRATION] Migrated', migrated, 'inventory items. Stats:', stats);

    return {
      success: true,
      migrated,
      stats,
      message: "Inventory migrated. Now run migrateLabRatReservations.",
    };
  },
});

/**
 * STEP 3: Migrate Lab Rat reservations to campaign
 *
 * Links all existing reservations (without campaignId) to Lab Rat campaign.
 */
export const migrateLabRatReservations = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[MIGRATION] Migrating reservations to campaign:', campaign.name);

    // Find all reservations without campaignId
    const reservationsToMigrate = await ctx.db
      .query("commemorativeNFTReservations")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    if (reservationsToMigrate.length === 0) {
      return {
        success: false,
        error: "No reservations found without campaignId. Already migrated?",
      };
    }

    console.log('[MIGRATION] Found', reservationsToMigrate.length, 'reservations to migrate');

    // Update each reservation
    let migrated = 0;
    for (const reservation of reservationsToMigrate) {
      await ctx.db.patch(reservation._id, {
        campaignId: args.campaignId,
      });
      migrated++;
    }

    // Count status breakdown
    const stats = {
      active: reservationsToMigrate.filter((r) => r.status === "active").length,
      completed: reservationsToMigrate.filter((r) => r.status === "completed").length,
      expired: reservationsToMigrate.filter((r) => r.status === "expired").length,
      cancelled: reservationsToMigrate.filter((r) => r.status === "cancelled").length,
    };

    console.log('[MIGRATION] Migrated', migrated, 'reservations. Stats:', stats);

    return {
      success: true,
      migrated,
      stats,
      message: "Reservations migrated. Now run migrateLabRatClaims (if any exist).",
    };
  },
});

/**
 * STEP 4: Migrate Lab Rat claims to campaign (if any exist)
 *
 * Links all existing claims (without campaignId) to Lab Rat campaign.
 * This step is optional if no claims exist yet.
 */
export const migrateLabRatClaims = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[MIGRATION] Migrating claims to campaign:', campaign.name);

    // Find all claims without campaignId
    const claimsToMigrate = await ctx.db
      .query("commemorativeNFTClaims")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();

    if (claimsToMigrate.length === 0) {
      return {
        success: true,
        migrated: 0,
        message: "No claims to migrate (this is normal if no one has claimed yet).",
      };
    }

    console.log('[MIGRATION] Found', claimsToMigrate.length, 'claims to migrate');

    // Update each claim
    let migrated = 0;
    for (const claim of claimsToMigrate) {
      await ctx.db.patch(claim._id, {
        campaignId: args.campaignId,
      });
      migrated++;
    }

    console.log('[MIGRATION] Migrated', migrated, 'claims');

    return {
      success: true,
      migrated,
      message: "Claims migrated. Migration complete! You can now activate the campaign.",
    };
  },
});

/**
 * STEP 5: Activate Lab Rat campaign
 *
 * Final step: Make the campaign active and claimable.
 */
export const activateLabRatCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Verify campaign has inventory
    if (campaign.totalNFTs === 0) {
      return {
        success: false,
        error: "Cannot activate campaign with no inventory. Run migration steps first.",
      };
    }

    await ctx.db.patch(args.campaignId, {
      status: "active",
      updatedAt: Date.now(),
    });

    console.log('[MIGRATION] Activated Lab Rat campaign');

    return {
      success: true,
      message: "Lab Rat campaign is now ACTIVE! Migration complete.",
      stats: {
        totalNFTs: campaign.totalNFTs,
        availableNFTs: campaign.availableNFTs,
        reservedNFTs: campaign.reservedNFTs,
        soldNFTs: campaign.soldNFTs,
      },
    };
  },
});

// ============================================================================
// ROLLBACK UTILITIES (Use with caution)
// ============================================================================

/**
 * Remove campaignId from all Lab Rat data (rollback migration)
 *
 * USE WITH EXTREME CAUTION - This undoes the migration.
 * Only use if migration failed and you need to retry.
 */
export const rollbackLabRatMigration = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    confirmRollback: v.boolean(), // Must be true to proceed
  },
  handler: async (ctx, args) => {
    if (!args.confirmRollback) {
      return {
        success: false,
        error: "Must set confirmRollback: true to proceed",
      };
    }

    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[ROLLBACK] Rolling back migration for campaign:', campaign.name);

    // Remove campaignId from inventory
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const item of inventory) {
      await ctx.db.patch(item._id, {
        campaignId: undefined,
      });
    }

    // Remove campaignId from reservations
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const reservation of reservations) {
      await ctx.db.patch(reservation._id, {
        campaignId: undefined,
      });
    }

    // Remove campaignId from claims
    const claims = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const claim of claims) {
      await ctx.db.patch(claim._id, {
        campaignId: undefined,
      });
    }

    console.log('[ROLLBACK] Rolled back:', {
      inventory: inventory.length,
      reservations: reservations.length,
      claims: claims.length,
    });

    return {
      success: true,
      rolledBack: {
        inventory: inventory.length,
        reservations: reservations.length,
        claims: claims.length,
      },
      message: "Migration rolled back. Campaign still exists but is unlinked from data.",
    };
  },
});

/**
 * Delete Lab Rat campaign (only if not active and has no data)
 */
export const deleteLabRatCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    confirmDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDelete) {
      return {
        success: false,
        error: "Must set confirmDelete: true to proceed",
      };
    }

    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    if (campaign.status === "active") {
      return {
        success: false,
        error: "Cannot delete active campaign. Deactivate it first.",
      };
    }

    if (campaign.totalNFTs > 0) {
      return {
        success: false,
        error: "Campaign has inventory. Run rollback first, or use clearCampaignInventory.",
      };
    }

    await ctx.db.delete(args.campaignId);

    console.log('[DELETE] Deleted campaign:', campaign.name);

    return {
      success: true,
      message: `Deleted campaign: ${campaign.name}`,
    };
  },
});
