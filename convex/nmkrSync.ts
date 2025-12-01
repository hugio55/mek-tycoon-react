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
        nmkrStatus: v.union(v.literal("free"), v.literal("reserved"), v.literal("sold")),
        soldTo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<SyncDiscrepancy[]> => {
    const { campaignId, nmkrStatuses } = args;

    // Get all inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("campaignId"), campaignId))
      .collect();

    const discrepancies: SyncDiscrepancy[] = [];

    // Create a map of NMKR statuses for quick lookup
    const nmkrMap = new Map(
      nmkrStatuses.map((status) => [status.nftUid, status])
    );

    // Check each inventory item against NMKR data
    for (const item of inventory) {
      const nmkrData = nmkrMap.get(item.nftUid);

      if (!nmkrData) {
        console.warn(`[NMKR Sync] NFT ${item.nftUid} not found in NMKR data`);
        continue;
      }

      // Convert NMKR state to Convex status for comparison
      const expectedConvexStatus = nmkrStateToConvexStatus(nmkrData.nmkrStatus);

      // Check if there's a mismatch
      if (item.status !== expectedConvexStatus) {
        discrepancies.push({
          nftUid: item.nftUid,
          nftNumber: item.nftNumber,
          name: item.name,
          nmkrStatus: nmkrData.nmkrStatus,
          convexStatus: item.status,
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
 */
export const syncSingleNFT = mutation({
  args: {
    nftUid: v.string(),
    nmkrStatus: v.union(v.literal("free"), v.literal("reserved"), v.literal("sold")),
    soldTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { nftUid, nmkrStatus, soldTo } = args;

    // Find the NFT in inventory
    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q) => q.eq("nftUid", nftUid))
      .first();

    if (!nft) {
      throw new Error(`NFT with UID ${nftUid} not found in inventory`);
    }

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
        nmkrStatus: v.union(v.literal("free"), v.literal("reserved"), v.literal("sold")),
        soldTo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { campaignId, nmkrStatuses } = args;

    // Get discrepancies first
    const discrepancies = await getInventoryDiscrepancies(ctx, args);

    if (discrepancies.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: "No discrepancies found - inventory is already in sync",
      };
    }

    // Sync each discrepancy
    let syncedCount = 0;
    const errors: string[] = [];

    for (const discrepancy of discrepancies) {
      try {
        const nmkrData = nmkrStatuses.find((s) => s.nftUid === discrepancy.nftUid);
        if (!nmkrData) continue;

        await syncSingleNFT(ctx, {
          nftUid: discrepancy.nftUid,
          nmkrStatus: nmkrData.nmkrStatus,
          soldTo: nmkrData.soldTo,
        });

        syncedCount++;
      } catch (error: any) {
        errors.push(`${discrepancy.name}: ${error.message}`);
      }
    }

    // Update campaign counters after sync
    const campaign = await ctx.db.get(campaignId);
    if (campaign) {
      const inventory = await ctx.db
        .query("commemorativeNFTInventory")
        .filter((q) => q.eq(q.field("campaignId"), campaignId))
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
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
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
