import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Campaign Management Functions
 *
 * Handles creating, updating, and managing NFT campaigns.
 * Each campaign represents a distinct NFT collection with its own inventory.
 */

// Create a new campaign
export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    nmkrProjectId: v.string(),
    policyId: v.optional(v.string()),
    maxNFTs: v.number(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const campaignId = await ctx.db.insert("commemorativeCampaigns", {
      name: args.name,
      description: args.description,
      nmkrProjectId: args.nmkrProjectId,
      policyId: args.policyId,
      maxNFTs: args.maxNFTs,
      status: args.status || "inactive",
      totalNFTs: 0,
      availableNFTs: 0,
      reservedNFTs: 0,
      soldNFTs: 0,
      createdAt: now,
      updatedAt: now,
      startDate: args.startDate,
      endDate: args.endDate,
    });

    console.log("[CAMPAIGNS] Created campaign:", args.name);

    return {
      success: true,
      campaignId,
    };
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nmkrProjectId: v.optional(v.string()),
    policyId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive")
      )
    ),
    maxNFTs: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;

    await ctx.db.patch(campaignId, {
      ...updates,
      updatedAt: Date.now(),
    });

    console.log("[CAMPAIGNS] Updated campaign:", campaignId);

    return {
      success: true,
    };
  },
});

// Delete campaign (and all its inventory) - WITH CASCADE DELETE
// ⚠️ EXTREME CAUTION: This game likely only has ONE campaign ever.
// Deleting it would be CATASTROPHIC. Multiple safety checks required.
export const deleteCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    confirmCascadeDelete: v.optional(v.boolean()),
    iAmAbsolutelySure: v.optional(v.boolean()), // Extra safety for single-campaign scenario
  },
  handler: async (ctx, args) => {
    // Get campaign info for logging
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // CRITICAL SAFETY: Check if this is the ONLY campaign
    const allCampaigns = await ctx.db.query("commemorativeCampaigns").collect();
    if (allCampaigns.length === 1) {
      if (!args.iAmAbsolutelySure) {
        throw new Error(
          `⚠️ CRITICAL WARNING: "${campaign.name}" is the ONLY campaign in the database! ` +
          `Deleting it will remove ALL NFT inventory and sale records PERMANENTLY. ` +
          `This is almost certainly NOT what you want. ` +
          `If you REALLY mean to do this, pass iAmAbsolutelySure: true`
        );
      }
      console.error(`[CAMPAIGNS] ⚠️⚠️⚠️ DELETING THE ONLY CAMPAIGN IN THE DATABASE ⚠️⚠️⚠️`);
    }

    // CASCADE DELETE: First delete all inventory records for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log(`[CAMPAIGNS] Deleting campaign "${campaign.name}" (${args.campaignId})`);
    console.log(`[CAMPAIGNS] CASCADE DELETE: Found ${inventory.length} inventory records to delete`);

    // Safety check: If there are sold NFTs, require explicit confirmation
    const soldCount = inventory.filter((i: any) => i.status === "sold").length;
    if (soldCount > 0 && !args.confirmCascadeDelete) {
      throw new Error(
        `SAFETY STOP: This campaign has ${soldCount} SOLD NFT(s). ` +
        `Deleting will remove sale records permanently. ` +
        `Pass confirmCascadeDelete: true to proceed.`
      );
    }

    // Delete all inventory records
    for (const item of inventory) {
      await ctx.db.delete(item._id);
    }
    console.log(`[CAMPAIGNS] Deleted ${inventory.length} inventory records`);

    // Also delete any reservations for this campaign
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const reservation of reservations) {
      await ctx.db.delete(reservation._id);
    }
    console.log(`[CAMPAIGNS] Deleted ${reservations.length} reservation records`);

    // Finally delete the campaign itself
    await ctx.db.delete(args.campaignId);

    console.log(`[CAMPAIGNS] Successfully deleted campaign "${campaign.name}" and all associated data`);

    return {
      success: true,
      deletedInventory: inventory.length,
      deletedReservations: reservations.length,
    };
  },
});

// Get all campaigns
export const getAllCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .order("desc")
      .collect();

    return campaigns;
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    return campaign;
  },
});

// Get active campaigns only
export const getActiveCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    return campaigns;
  },
});

// Update campaign stats (called when inventory changes)
export const updateCampaignStats = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Count inventory items for this campaign using indexed query
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    const stats = {
      totalNFTs: inventory.length,
      availableNFTs: inventory.filter((i) => i.status === "available").length,
      reservedNFTs: inventory.filter((i) => i.status === "reserved").length,
      soldNFTs: inventory.filter((i) => i.status === "sold").length,
    };

    await ctx.db.patch(args.campaignId, {
      ...stats,
      updatedAt: Date.now(),
    });

    console.log("[CAMPAIGNS] Updated stats for campaign:", args.campaignId, stats);

    return {
      success: true,
      stats,
    };
  },
});

// =============================================================================
// ORPHAN DETECTION & CLEANUP FUNCTIONS
// These help identify and fix data integrity issues
// =============================================================================

/**
 * Find orphaned inventory records (records pointing to non-existent campaigns)
 * This is a QUERY - safe to run, doesn't modify anything
 */
export const findOrphanedInventory = query({
  handler: async (ctx) => {
    // Get all existing campaign IDs
    const campaigns = await ctx.db.query("commemorativeCampaigns").collect();
    const validCampaignIds = new Set(campaigns.map((c: any) => c._id));

    // Get all inventory records
    const allInventory = await ctx.db.query("commemorativeNFTInventory").collect();

    // Find orphans (inventory pointing to non-existent campaigns or with no campaignId)
    const orphans = allInventory.filter((inv: any) => !inv.campaignId || !validCampaignIds.has(inv.campaignId));

    console.log(`[CAMPAIGNS] Found ${orphans.length} orphaned inventory records out of ${allInventory.length} total`);

    return {
      totalInventory: allInventory.length,
      orphanCount: orphans.length,
      validCampaignCount: campaigns.length,
      orphans: orphans.map((o: any) => ({
        _id: o._id,
        name: o.name,
        nftUid: o.nftUid,
        status: o.status,
        campaignId: o.campaignId,
        soldTo: o.soldTo,
        soldAt: o.soldAt,
      })),
    };
  },
});

/**
 * Clean up orphaned inventory records
 * DANGEROUS - will delete records permanently
 * Requires explicit confirmation and returns sale data before deleting
 */
export const cleanupOrphanedInventory = mutation({
  args: {
    confirmDelete: v.boolean(),
    transferSaleDataToNftUids: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDelete) {
      throw new Error("SAFETY: Must pass confirmDelete: true to proceed");
    }

    // Get all existing campaign IDs
    const campaigns = await ctx.db.query("commemorativeCampaigns").collect();
    const validCampaignIds = new Set(campaigns.map((c: any) => c._id));

    // Get all inventory records
    const allInventory = await ctx.db.query("commemorativeNFTInventory").collect();

    // Find orphans (inventory pointing to non-existent campaigns or with no campaignId)
    const orphans = allInventory.filter((inv: any) => !inv.campaignId || !validCampaignIds.has(inv.campaignId));

    if (orphans.length === 0) {
      return { success: true, message: "No orphaned records found", deleted: 0 };
    }

    // Save sale data from orphans that have it (for recovery)
    const saleDataBackup = orphans
      .filter((o: any) => o.status === "sold" && o.soldTo)
      .map((o: any) => ({
        nftUid: o.nftUid,
        name: o.name,
        soldTo: o.soldTo,
        soldAt: o.soldAt,
        companyNameAtSale: o.companyNameAtSale,
        orphanedCampaignId: o.campaignId,
      }));

    console.log(`[CAMPAIGNS] CLEANUP: Backing up ${saleDataBackup.length} sale records before deletion`);
    console.log(`[CAMPAIGNS] Sale data backup:`, JSON.stringify(saleDataBackup, null, 2));

    // If transferSaleDataToNftUids is provided, transfer sale data to matching records
    if (args.transferSaleDataToNftUids && args.transferSaleDataToNftUids.length > 0) {
      for (const nftUid of args.transferSaleDataToNftUids) {
        const orphanWithSale = saleDataBackup.find((s: any) => s.nftUid === nftUid);
        if (!orphanWithSale) continue;

        // Find the valid record with this nftUid (must have a valid campaignId)
        const validRecord = allInventory.find(
          inv => inv.nftUid === nftUid && inv.campaignId && validCampaignIds.has(inv.campaignId)
        );

        if (validRecord) {
          await ctx.db.patch(validRecord._id, {
            status: "sold",
            soldTo: orphanWithSale.soldTo,
            soldAt: orphanWithSale.soldAt,
            companyNameAtSale: orphanWithSale.companyNameAtSale,
          });
          console.log(`[CAMPAIGNS] Transferred sale data for ${orphanWithSale.name} to valid record`);
        }
      }
    }

    // Delete orphans
    for (const orphan of orphans) {
      await ctx.db.delete(orphan._id);
    }

    console.log(`[CAMPAIGNS] CLEANUP: Deleted ${orphans.length} orphaned inventory records`);

    return {
      success: true,
      deleted: orphans.length,
      saleDataBackup,
      message: `Deleted ${orphans.length} orphaned records. Sale data backed up in logs.`,
    };
  },
});

/**
 * Manually patch sale data for an inventory item
 * Use this to restore lost sale data or fix incorrect records
 */
export const patchInventorySaleData = mutation({
  args: {
    nftUid: v.string(),
    soldTo: v.optional(v.string()),
    soldAt: v.optional(v.number()),
    companyNameAtSale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the inventory item by UID
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    if (!inventory) {
      throw new Error(`NFT with UID ${args.nftUid} not found`);
    }

    // Build update object with only provided fields
    const updates: Record<string, string | number | undefined> = {};
    if (args.soldTo !== undefined) updates.soldTo = args.soldTo;
    if (args.soldAt !== undefined) updates.soldAt = args.soldAt;
    if (args.companyNameAtSale !== undefined) updates.companyNameAtSale = args.companyNameAtSale;

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    await ctx.db.patch(inventory._id, updates);

    console.log(`[CAMPAIGNS] Patched sale data for ${inventory.name}:`, updates);

    return {
      success: true,
      nftName: inventory.name,
      updatedFields: Object.keys(updates),
    };
  },
});

// =============================================================================
// PER-CAMPAIGN ELIGIBILITY SNAPSHOT ASSIGNMENT
// =============================================================================

/**
 * Assign an eligibility snapshot to a campaign
 * This controls which users can claim NFTs from this specific campaign
 */
export const assignEligibilitySnapshot = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    snapshotId: v.optional(v.id("whitelistSnapshots")), // null/undefined to clear
  },
  handler: async (ctx, args) => {
    console.log('[🔧SNAPSHOT] assignEligibilitySnapshot called with:', {
      campaignId: args.campaignId,
      snapshotId: args.snapshotId || 'CLEARING (undefined/null)',
    });

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      console.log('[🔧SNAPSHOT] ERROR - Campaign not found');
      throw new Error("Campaign not found");
    }

    console.log('[🔧SNAPSHOT] Current campaign state:', {
      name: campaign.name,
      currentSnapshotId: campaign.eligibilitySnapshotId || 'NONE',
    });

    // Verify snapshot exists if provided
    if (args.snapshotId) {
      const snapshot = await ctx.db.get(args.snapshotId);
      if (!snapshot) {
        console.log('[🔧SNAPSHOT] ERROR - Snapshot not found');
        throw new Error("Snapshot not found");
      }
      console.log(
        `[🔧SNAPSHOT] Assigning snapshot "${snapshot.snapshotName}" to campaign "${campaign.name}"`
      );

      await ctx.db.patch(args.campaignId, {
        eligibilitySnapshotId: args.snapshotId,
        updatedAt: Date.now(),
      });
      console.log('[🔧SNAPSHOT] SUCCESS - Snapshot assigned');
    } else {
      // CRITICAL: To clear an optional field in Convex, we must use replace or patch with explicit undefined
      // Convex patch ignores undefined values, so we need to use a workaround
      // Replace the entire document with the snapshot ID removed
      console.log(
        `[🔧SNAPSHOT] CLEARING eligibility snapshot from campaign "${campaign.name}"`
      );
      console.log('[🔧SNAPSHOT] Using db.replace to remove eligibilitySnapshotId field');

      // Get current campaign and rebuild without eligibilitySnapshotId
      const { eligibilitySnapshotId, _id, _creationTime, ...rest } = campaign;

      console.log('[🔧SNAPSHOT] Fields being preserved:', Object.keys(rest));
      console.log('[🔧SNAPSHOT] Field being REMOVED: eligibilitySnapshotId (was:', eligibilitySnapshotId, ')');

      await ctx.db.replace(args.campaignId, {
        ...rest,
        updatedAt: Date.now(),
      });
      console.log('[🔧SNAPSHOT] SUCCESS - Snapshot cleared via db.replace');
    }

    // Verify the change took effect
    const updatedCampaign = await ctx.db.get(args.campaignId);
    console.log('[🔧SNAPSHOT] VERIFICATION - Campaign after update:', {
      name: updatedCampaign?.name,
      eligibilitySnapshotId: updatedCampaign?.eligibilitySnapshotId || 'NONE (successfully cleared)',
    });

    return { success: true };
  },
});

/**
 * Update campaign's multiple mints setting
 * When true, corporations can mint unlimited NFTs from this campaign
 * When false/undefined, corporations can only mint once
 */
export const updateAllowMultipleMints = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    allowMultipleMints: v.boolean(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    console.log(
      `[CAMPAIGNS] Setting allowMultipleMints=${args.allowMultipleMints} for campaign "${campaign.name}"`
    );

    await ctx.db.patch(args.campaignId, {
      allowMultipleMints: args.allowMultipleMints,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get campaign with its assigned snapshot details
 */
export const getCampaignWithSnapshot = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return null;
    }

    let snapshot = null;
    if (campaign.eligibilitySnapshotId) {
      snapshot = await ctx.db.get(campaign.eligibilitySnapshotId);
    }

    return {
      ...campaign,
      eligibilitySnapshot: snapshot
        ? {
            _id: snapshot._id,
            snapshotName: snapshot.snapshotName,
            userCount: snapshot.eligibleUsers?.length || 0,
          }
        : null,
    };
  },
});

/**
 * DIAGNOSTIC: Get full snapshot and campaign relationship overview
 * Use this to debug eligibility issues between whitelists and campaigns
 */
export const debugSnapshotsAndCampaigns = query({
  handler: async (ctx) => {
    // Get all snapshots
    const allSnapshots = await ctx.db.query("whitelistSnapshots").collect();

    // Get all campaigns
    const allCampaigns = await ctx.db.query("commemorativeCampaigns").collect();

    // Get all whitelists (parent of snapshots)
    const allWhitelists = await ctx.db.query("whitelists").collect();

    // Build snapshot info with user details
    const snapshotInfo = allSnapshots.map((snap: any) => {
      const parentWhitelist = allWhitelists.find((w: any) => w._id === snap.whitelistId);
      // Get first 5 users for inspection
      const sampleUsers = (snap.eligibleUsers || []).slice(0, 5).map((u: any) => ({
        stakeAddress: u.stakeAddress?.substring(0, 30) + '...',
        walletAddress: u.walletAddress?.substring(0, 30) + '...',
        corporationName: u.corporationName || u.displayName || 'N/A',
      }));

      return {
        snapshotId: snap._id,
        snapshotName: snap.snapshotName,
        whitelistId: snap.whitelistId,
        whitelistName: parentWhitelist?.name || 'ORPHANED (no parent whitelist)',
        userCount: snap.eligibleUsers?.length || 0,
        takenAt: new Date(snap.takenAt).toISOString(),
        sampleUsers,
      };
    });

    // Build campaign info with snapshot resolution
    const campaignInfo = await Promise.all(allCampaigns.map(async (camp: any) => {
      let snapshotDetails = null;
      let snapshotError = null;

      if (camp.eligibilitySnapshotId) {
        const snap = await ctx.db.get(camp.eligibilitySnapshotId);
        if (snap) {
          snapshotDetails = {
            snapshotId: snap._id,
            snapshotName: snap.snapshotName,
            userCount: snap.eligibleUsers?.length || 0,
          };
        } else {
          snapshotError = `BROKEN REFERENCE: Snapshot ${camp.eligibilitySnapshotId} does not exist!`;
        }
      }

      return {
        campaignId: camp._id,
        campaignName: camp.name,
        status: camp.status,
        eligibilitySnapshotId: camp.eligibilitySnapshotId || 'NOT SET',
        snapshotDetails,
        snapshotError,
        availableNFTs: camp.availableNFTs,
        soldNFTs: camp.soldNFTs,
      };
    }));

    return {
      summary: {
        totalSnapshots: allSnapshots.length,
        totalCampaigns: allCampaigns.length,
        totalWhitelists: allWhitelists.length,
        campaignsWithSnapshots: allCampaigns.filter((c: any) => c.eligibilitySnapshotId).length,
        campaignsWithoutSnapshots: allCampaigns.filter((c: any) => !c.eligibilitySnapshotId).length,
      },
      snapshots: snapshotInfo,
      campaigns: campaignInfo,
      whitelists: allWhitelists.map((w: any) => ({
        whitelistId: w._id,
        name: w.name,
        description: w.description,
      })),
    };
  },
});
