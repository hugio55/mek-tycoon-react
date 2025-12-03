/**
 * NMKR Synchronization Functions
 *
 * These functions help sync the Convex database with NMKR's actual NFT statuses.
 * Used by the admin panel to verify and fix discrepancies between what NMKR reports
 * and what our database shows.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Type definitions for sync operations
 */
export interface NMKRNFTStatus {
  nftUid: string;
  nmkrStatus: 'free' | 'reserved' | 'sold';
  soldTo?: string; // Transaction hash or wallet address from NMKR
}

export interface SyncDiscrepancy {
  nftUid: string;
  nftNumber: number;
  name: string;
  nmkrStatus: 'free' | 'reserved' | 'sold';
  convexStatus: 'available' | 'reserved' | 'sold';
  nmkrSoldTo?: string;
  convexSoldTo?: string;
}

/**
 * Compare inventory with NMKR data and return discrepancies
 * Client calls API route to get NMKR data, then passes it here for comparison
 */
export const getInventoryDiscrepancies = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nmkrStatuses: v.array(
      v.object({
        nftUid: v.string(),
        nmkrStatus: v.string(), // 'free' | 'reserved' | 'sold' - simplified to avoid type depth issues
        name: v.optional(v.string()), // Name from NMKR (may be included)
        soldTo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<SyncDiscrepancy[]> => {
    const { campaignId, nmkrStatuses } = args;

    // Get all inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect();

    const discrepancies: SyncDiscrepancy[] = [];

    // Create a map of NMKR statuses for quick lookup
    type NMKRStatusEntry = { nftUid: string; nmkrStatus: string; soldTo?: string };
    const nmkrMap = new Map<string, NMKRStatusEntry>(
      nmkrStatuses.map((status: NMKRStatusEntry) => [status.nftUid, status])
    );

    // Check each inventory item against NMKR data
    for (const item of inventory) {
      const nmkrData = nmkrMap.get(item.nftUid);

      if (!nmkrData) {
        console.warn(`[NMKR Sync] NFT ${item.nftUid} not found in NMKR data`);
        continue;
      }

      // Convert NMKR state to Convex status for comparison
      const nmkrStatus = nmkrData.nmkrStatus as 'free' | 'reserved' | 'sold';
      const expectedConvexStatus = nmkrStateToConvexStatus(nmkrStatus);

      // Check if there's a mismatch
      if (item.status !== expectedConvexStatus) {
        discrepancies.push({
          nftUid: item.nftUid,
          nftNumber: item.nftNumber,
          name: item.name,
          nmkrStatus: nmkrStatus,
          convexStatus: item.status as 'available' | 'reserved' | 'sold',
          nmkrSoldTo: nmkrData.soldTo,
          convexSoldTo: item.soldTo,
        });
      }
    }

    return discrepancies;
  },
});

/**
 * Sync a single NFT's status from NMKR
 * IMPORTANT: Now requires campaignId to prevent updating orphaned records
 */
export const syncSingleNFT = mutation({
  args: {
    nftUid: v.string(),
    nmkrStatus: v.string(), // 'free' | 'reserved' | 'sold' - simplified to avoid type depth issues
    soldTo: v.optional(v.string()),
    campaignId: v.optional(v.id("commemorativeCampaigns")), // Optional for backward compatibility, but SHOULD be provided
  },
  handler: async (ctx, args) => {
    const { nftUid, soldTo, campaignId } = args;
    const nmkrStatus = args.nmkrStatus as 'free' | 'reserved' | 'sold';

    console.log('[🔄SYNC-MUTATION] syncSingleNFT called with:', { nftUid, nmkrStatus, soldTo, campaignId });

    // Check for ALL records with this nftUid (detect duplicates/orphans)
    const allMatchingByUid = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q) => q.eq("nftUid", nftUid))
      .collect();

    console.log(`[🔄SYNC-MUTATION] Found ${allMatchingByUid.length} records with nftUid ${nftUid}`);

    if (allMatchingByUid.length === 0) {
      throw new Error(`NFT with UID ${nftUid} not found in inventory`);
    }

    if (allMatchingByUid.length > 1) {
      console.error('[🔄SYNC-MUTATION] ⚠️ DUPLICATE/ORPHAN RECORDS DETECTED!');
      console.error('[🔄SYNC-MUTATION] Records found:', allMatchingByUid.map(n => ({
        _id: n._id,
        name: n.name,
        status: n.status,
        campaignId: n.campaignId,
      })));

      // If campaignId provided, find the record for THAT campaign specifically
      if (campaignId) {
        const correctRecord = allMatchingByUid.find(n => n.campaignId === campaignId);
        if (!correctRecord) {
          throw new Error(
            `NFT ${nftUid} has ${allMatchingByUid.length} records but NONE belong to campaign ${campaignId}. ` +
            `This indicates orphaned data. Run findOrphanedInventory to diagnose.`
          );
        }
        console.log('[🔄SYNC-MUTATION] Using record for specified campaign:', correctRecord._id);
      } else {
        // No campaignId provided - warn but continue with first match (legacy behavior)
        console.warn('[🔄SYNC-MUTATION] ⚠️ WARNING: No campaignId provided and duplicates exist. Using first match.');
        console.warn('[🔄SYNC-MUTATION] This may update the wrong record! Consider passing campaignId.');
      }
    }

    // Find the correct NFT to update
    let nft;
    if (campaignId && allMatchingByUid.length > 1) {
      // Multiple records exist - use the one for the specified campaign
      nft = allMatchingByUid.find(n => n.campaignId === campaignId);
    } else {
      // Single record or no campaignId - use first match
      nft = allMatchingByUid[0];
    }

    if (!nft) {
      throw new Error(`NFT with UID ${nftUid} not found for campaign ${campaignId}`);
    }

    // Verify the campaign still exists (prevent updating orphans)
    const campaign = await ctx.db.get(nft.campaignId);
    if (!campaign) {
      throw new Error(
        `ORPHAN DETECTED: NFT ${nft.name} (${nftUid}) belongs to campaign ${nft.campaignId} which no longer exists. ` +
        `This record should be cleaned up. Run cleanupOrphanedInventory to fix.`
      );
    }

    console.log('[🔄SYNC-MUTATION] Updating NFT:', {
      _id: nft._id,
      name: nft.name,
      currentStatus: nft.status,
      campaignId: nft.campaignId,
      campaignName: campaign.name,
    });

    // Convert NMKR state to Convex status
    const newStatus = nmkrStateToConvexStatus(nmkrStatus);

    // Update the NFT status
    const updates: any = {
      status: newStatus,
    };

    // Handle status-specific updates
    if (newStatus === 'sold') {
      updates.soldTo = soldTo || nft.soldTo; // Preserve existing if not provided
      updates.soldAt = Date.now();
      // Clear reservation fields
      updates.reservedBy = undefined;
      updates.reservedAt = undefined;
      updates.expiresAt = undefined;
      updates.paymentWindowOpenedAt = undefined;
      updates.paymentWindowClosedAt = undefined;
    } else if (newStatus === 'available') {
      // Clear all reservation and sale fields
      updates.reservedBy = undefined;
      updates.reservedAt = undefined;
      updates.expiresAt = undefined;
      updates.paymentWindowOpenedAt = undefined;
      updates.paymentWindowClosedAt = undefined;
    }
    // For 'reserved' status, keep reservation fields as-is

    await ctx.db.patch(nft._id, updates);

    return {
      success: true,
      nftUid,
      oldStatus: nft.status,
      newStatus,
    };
  },
});

/**
 * Sync all inventory for a campaign from NMKR data
 */
export const syncCampaignInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nmkrStatuses: v.array(
      v.object({
        nftUid: v.string(),
        nmkrStatus: v.string(), // 'free' | 'reserved' | 'sold' - simplified to avoid type depth issues
        name: v.optional(v.string()), // Name from NMKR (may be included)
        soldTo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { campaignId, nmkrStatuses } = args;

    // Get discrepancies first (call the query handler directly)
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect();

    type NMKRStatusEntry = { nftUid: string; nmkrStatus: string; soldTo?: string };
    const nmkrMap = new Map<string, NMKRStatusEntry>(
      nmkrStatuses.map((status: NMKRStatusEntry) => [status.nftUid, status])
    );

    const discrepancies: SyncDiscrepancy[] = [];
    for (const item of inventory) {
      const nmkrData = nmkrMap.get(item.nftUid);
      if (!nmkrData) continue;

      const nmkrStatus = nmkrData.nmkrStatus as 'free' | 'reserved' | 'sold';
      const expectedConvexStatus = nmkrStateToConvexStatus(nmkrStatus);

      if (item.status !== expectedConvexStatus) {
        discrepancies.push({
          nftUid: item.nftUid,
          nftNumber: item.nftNumber,
          name: item.name,
          nmkrStatus: nmkrStatus,
          convexStatus: item.status as 'available' | 'reserved' | 'sold',
          nmkrSoldTo: nmkrData.soldTo,
          convexSoldTo: item.soldTo,
        });
      }
    }

    if (discrepancies.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: "No discrepancies found - inventory is already in sync",
      };
    }

    // Sync each discrepancy (inline the sync logic - can't call mutations from mutations)
    let syncedCount = 0;
    const errors: string[] = [];

    for (const discrepancy of discrepancies) {
      try {
        const nmkrData = nmkrStatuses.find((s: NMKRStatusEntry) => s.nftUid === discrepancy.nftUid);
        if (!nmkrData) continue;

        // Find the NFT in inventory
        const nft = await ctx.db
          .query("commemorativeNFTInventory")
          .withIndex("by_uid", (q) => q.eq("nftUid", discrepancy.nftUid))
          .first();

        if (!nft) {
          errors.push(`${discrepancy.name}: NFT not found`);
          continue;
        }

        const nmkrStatus = nmkrData.nmkrStatus as 'free' | 'reserved' | 'sold';
        const newStatus = nmkrStateToConvexStatus(nmkrStatus);

        // Build updates
        const updates: Record<string, unknown> = {
          status: newStatus,
        };

        if (newStatus === 'sold') {
          updates.soldTo = nmkrData.soldTo || nft.soldTo;
          updates.soldAt = Date.now();
          updates.reservedBy = undefined;
          updates.reservedAt = undefined;
          updates.expiresAt = undefined;
        } else if (newStatus === 'available') {
          updates.reservedBy = undefined;
          updates.reservedAt = undefined;
          updates.expiresAt = undefined;
        }

        await ctx.db.patch(nft._id, updates);
        syncedCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${discrepancy.name}: ${errorMessage}`);
      }
    }

    // Update campaign counters after sync
    const campaign = await ctx.db.get(campaignId);
    if (campaign) {
      const inventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect();

      const availableNFTs = inventory.filter((i) => i.status === "available").length;
      const reservedNFTs = inventory.filter((i) => i.status === "reserved").length;
      const soldNFTs = inventory.filter((i) => i.status === "sold").length;

      await ctx.db.patch(campaignId, {
        availableNFTs,
        reservedNFTs,
        soldNFTs,
      });
    }

    return {
      success: true,
      syncedCount,
      totalDiscrepancies: discrepancies.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

/**
 * Helper function to convert NMKR state to Convex status
 */
function nmkrStateToConvexStatus(
  nmkrState: 'free' | 'reserved' | 'sold'
): 'available' | 'reserved' | 'sold' {
  switch (nmkrState) {
    case 'free':
      return 'available';
    case 'reserved':
      return 'reserved';
    case 'sold':
      return 'sold';
    default:
      return 'available'; // Fallback
  }
}

/**
 * Get campaign inventory summary
 */
export const getCampaignInventorySummary = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const available = inventory.filter((i) => i.status === "available");
    const reserved = inventory.filter((i) => i.status === "reserved");
    const sold = inventory.filter((i) => i.status === "sold");

    return {
      total: inventory.length,
      available: available.length,
      reserved: reserved.length,
      sold: sold.length,
      inventory: inventory.map((i) => ({
        nftUid: i.nftUid,
        nftNumber: i.nftNumber,
        name: i.name,
        status: i.status,
        soldTo: i.soldTo,
        reservedBy: i.reservedBy,
      })),
    };
  },
});
