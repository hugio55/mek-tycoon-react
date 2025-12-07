/**
 * NMKR Synchronization Functions
 *
 * These functions help sync the Convex database with NMKR's actual NFT statuses.
 * Used by the admin panel to verify and fix discrepancies between what NMKR reports
 * and what our database shows.
 *
 * Includes automatic background sync via cron job to catch missed webhooks.
 */

import { v } from "convex/values";
import { mutation, query, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
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

    console.log('[🔄SYNC-MUTATION] syncSingleNFT called (v2 - indexes fixed):', { nftUid, nmkrStatus, soldTo, campaignId });

    // Check for ALL records with this nftUid (detect duplicates/orphans)
    const allMatchingByUid = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", nftUid))
      .collect();

    console.log(`[🔄SYNC-MUTATION] Found ${allMatchingByUid.length} records with nftUid ${nftUid}`);

    if (allMatchingByUid.length === 0) {
      throw new Error(`NFT with UID ${nftUid} not found in inventory`);
    }

    if (allMatchingByUid.length > 1) {
      console.error('[🔄SYNC-MUTATION] ⚠️ DUPLICATE/ORPHAN RECORDS DETECTED!');
      console.error('[🔄SYNC-MUTATION] Records found:', allMatchingByUid.map((n: any) => ({
        _id: n._id,
        name: n.name,
        status: n.status,
        campaignId: n.campaignId,
      })));

      // If campaignId provided, find the record for THAT campaign specifically
      if (campaignId) {
        const correctRecord = allMatchingByUid.find((n: any) => n.campaignId === campaignId);
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
      nft = allMatchingByUid.find((n: any) => n.campaignId === campaignId);
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
      // Determine the buyer's address - prefer our reservedBy (known stake address format)
      // over NMKR's soldTo (may be transaction hash or different address format)
      const finalSoldTo = nft.reservedBy || soldTo || nft.soldTo;

      // CRITICAL SAFETY CHECK: Log warning if we can't determine the buyer
      if (!finalSoldTo) {
        console.error('[🚨NMKR-SYNC] CRITICAL: Cannot determine buyer for sold NFT!', {
          nftUid: nft.nftUid,
          nftNumber: nft.nftNumber,
          name: nft.name,
          reservedBy: nft.reservedBy,
          soldToArg: soldTo,
          existingSoldTo: nft.soldTo,
        });
      } else if (!finalSoldTo.startsWith("stake1")) {
        console.warn('[⚠️NMKR-SYNC] soldTo is not a stake address format:', {
          nftUid: nft.nftUid,
          name: nft.name,
          finalSoldTo,
          source: nft.reservedBy ? 'reservedBy' : (soldTo ? 'nmkrSoldTo' : 'existingSoldTo'),
        });
      }

      updates.soldTo = finalSoldTo;
      updates.soldAt = Date.now();

      // Look up corporation name for historical tracking
      // users table IS the corporation (1 user = 1 corporation)
      if (finalSoldTo && finalSoldTo.startsWith("stake1")) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", finalSoldTo))
          .first();
        updates.companyNameAtSale = (user as any)?.corporationName || undefined;
      }

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
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
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
          .withIndex("by_uid", (q: any) => q.eq("nftUid", discrepancy.nftUid))
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
          // Determine the buyer's address - prefer our reservedBy (known stake address format)
          // over NMKR's soldTo (may be transaction hash or different address format)
          const finalSoldTo = nft.reservedBy || nmkrData.soldTo || nft.soldTo;

          // CRITICAL SAFETY CHECK: Log warning if we can't determine the buyer
          if (!finalSoldTo) {
            console.error('[🚨NMKR-SYNC] CRITICAL: Cannot determine buyer for sold NFT!', {
              nftUid: nft.nftUid,
              nftNumber: nft.nftNumber,
              name: nft.name,
              reservedBy: nft.reservedBy,
              nmkrSoldTo: nmkrData.soldTo,
              existingSoldTo: nft.soldTo,
            });
          } else if (!finalSoldTo.startsWith("stake1")) {
            console.warn('[⚠️NMKR-SYNC] soldTo is not a stake address format:', {
              nftUid: nft.nftUid,
              name: nft.name,
              finalSoldTo,
              source: nft.reservedBy ? 'reservedBy' : (nmkrData.soldTo ? 'nmkrSoldTo' : 'existingSoldTo'),
            });
          }

          updates.soldTo = finalSoldTo;
          updates.soldAt = Date.now();

          // Look up corporation name for historical tracking
          // users table IS the corporation (1 user = 1 corporation)
          if (finalSoldTo && finalSoldTo.startsWith("stake1")) {
            const user = await ctx.db
              .query("users")
              .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", finalSoldTo))
              .first();
            updates.companyNameAtSale = (user as any)?.corporationName || undefined;
          }

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
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
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
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
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

// ============================================
// AUTOMATIC NMKR SYNC (Cron Job Target)
// ============================================

const NMKR_API_BASE = 'https://studio-api.nmkr.io/v2';

/**
 * Fetch all NFTs from NMKR project (handles pagination)
 */
async function fetchAllNMKRNFTs(
  projectUid: string,
  apiKey: string
): Promise<Array<{ uid: string; state: 'free' | 'reserved' | 'sold'; name: string }>> {
  const allNFTs: Array<{ uid: string; state: 'free' | 'reserved' | 'sold'; name: string }> = [];
  let page = 1;
  const pageSize = 50;
  const maxPages = 100; // Safety limit

  while (page <= maxPages) {
    const url = `${NMKR_API_BASE}/GetNfts/${projectUid}/all/${pageSize}/${page}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NMKR API error (${response.status}): ${errorText}`);
    }

    const nfts = await response.json();

    if (!nfts || nfts.length === 0) {
      break;
    }

    allNFTs.push(...nfts.map((nft: { uid: string; state: string; name: string }) => ({
      uid: nft.uid,
      state: nft.state as 'free' | 'reserved' | 'sold',
      name: nft.name,
    })));

    if (nfts.length < pageSize) {
      break;
    }

    page++;
  }

  return allNFTs;
}

/**
 * Internal action called by cron job to automatically sync all active campaigns with NMKR
 * This catches any missed webhooks and ensures database stays in sync with NMKR's truth
 *
 * SMART SYNC: Only makes API calls when there are NFTs in "reserved" status
 * - "reserved" = someone started a purchase, might have paid but webhook failed
 * - Skips API calls entirely when no reservations exist (quiet periods)
 */
export const internalAutoSyncWithNMKR = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    campaignsSynced: number;
    totalDiscrepanciesFixed: number;
    errors: string[];
  }> => {
    console.log('[🔄NMKR-AUTO-SYNC] Starting smart NMKR synchronization...');

    // Get NMKR API key from environment
    const apiKey = process.env.NMKR_API_KEY;
    if (!apiKey) {
      console.error('[🔄NMKR-AUTO-SYNC] NMKR_API_KEY not configured');
      return {
        success: false,
        campaignsSynced: 0,
        totalDiscrepanciesFixed: 0,
        errors: ['NMKR_API_KEY not configured in environment'],
      };
    }

    // Get campaigns that actually need syncing (have at-risk NFTs)
    const campaignsNeedingSync = await ctx.runQuery(internal.nmkrSync.getCampaignsNeedingSync);

    if (campaignsNeedingSync.length === 0) {
      console.log('[🔄NMKR-AUTO-SYNC] No reserved NFTs found - skipping NMKR API calls');
      return {
        success: true,
        campaignsSynced: 0,
        totalDiscrepanciesFixed: 0,
        errors: [],
      };
    }

    const totalReserved = campaignsNeedingSync.reduce((sum, c) => sum + c.reservedCount, 0);
    console.log(`[🔄NMKR-AUTO-SYNC] Found ${totalReserved} reserved NFT(s) across ${campaignsNeedingSync.length} campaign(s) - syncing with NMKR`);

    let campaignsSynced = 0;
    let totalDiscrepanciesFixed = 0;
    const errors: string[] = [];

    for (const campaign of campaignsNeedingSync) {
      try {
        console.log(`[🔄NMKR-AUTO-SYNC] Syncing campaign: ${campaign.name} (${campaign.nmkrProjectUid})`);

        // Fetch current NFT statuses from NMKR
        const nmkrNFTs = await fetchAllNMKRNFTs(campaign.nmkrProjectUid, apiKey);

        console.log(`[🔄NMKR-AUTO-SYNC] Retrieved ${nmkrNFTs.length} NFTs from NMKR`);

        // Map to format expected by syncCampaignInventory
        const nmkrStatuses = nmkrNFTs.map((nft: any) => ({
          nftUid: nft.uid,
          nmkrStatus: nft.state,
          name: nft.name,
          soldTo: undefined,
        }));

        // Run the sync mutation
        const result = await ctx.runMutation(internal.nmkrSync.internalSyncCampaignInventory, {
          campaignId: campaign._id,
          nmkrStatuses,
        });

        if (result.syncedCount > 0) {
          console.log(`[🔄NMKR-AUTO-SYNC] ✓ Campaign "${campaign.name}": Fixed ${result.syncedCount} discrepancies`);
          totalDiscrepanciesFixed += result.syncedCount;
        } else {
          console.log(`[🔄NMKR-AUTO-SYNC] ✓ Campaign "${campaign.name}": Already in sync`);
        }

        campaignsSynced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[🔄NMKR-AUTO-SYNC] ✗ Failed to sync campaign "${campaign.name}":`, errorMsg);
        errors.push(`${campaign.name}: ${errorMsg}`);
      }
    }

    console.log(`[🔄NMKR-AUTO-SYNC] Completed. Synced ${campaignsSynced}/${campaignsNeedingSync.length} campaigns, fixed ${totalDiscrepanciesFixed} discrepancies`);

    return {
      success: errors.length === 0,
      campaignsSynced,
      totalDiscrepanciesFixed,
      errors,
    };
  },
});

/**
 * Internal query to get active campaigns that need syncing
 * (Used for manual/forced sync - returns ALL active campaigns)
 */
export const getActiveCampaignsForSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Only return campaigns that have NMKR project UIDs
    return campaigns
      .filter((c: any) => c.nmkrProjectUid)
      .map((c: any) => ({
        _id: c._id,
        name: c.name,
        nmkrProjectUid: c.nmkrProjectUid!,
      }));
  },
});

/**
 * SMART SYNC: Only returns campaigns that actually need checking
 *
 * A campaign needs syncing if it has NFTs in "reserved" status.
 * This means someone started a purchase but it hasn't completed yet.
 *
 * Why only check "reserved" status?
 * - "available" = no one is buying, nothing to sync
 * - "reserved" = someone might have paid but webhook failed (the case we want to catch!)
 * - "sold" = already synced, nothing to do
 *
 * This prevents wasteful API calls during quiet periods (weeks between sales)
 */
export const getCampaignsNeedingSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all active campaigns with NMKR project UIDs
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const campaignsNeedingSync = [];

    for (const campaign of campaigns) {
      if (!campaign.nmkrProjectUid) continue;

      // Check if this campaign has any reserved NFTs (at-risk of missed webhook)
      const inventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaign._id))
        .collect();

      const reservedCount = inventory.filter((nft: any) => nft.status === 'reserved').length;

      if (reservedCount > 0) {
        campaignsNeedingSync.push({
          _id: campaign._id,
          name: campaign.name,
          nmkrProjectUid: campaign.nmkrProjectUid,
          reservedCount,
        });
      }
    }

    return campaignsNeedingSync;
  },
});

/**
 * Internal mutation version of syncCampaignInventory (callable from actions)
 */
export const internalSyncCampaignInventory = internalMutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nmkrStatuses: v.array(
      v.object({
        nftUid: v.string(),
        nmkrStatus: v.string(),
        name: v.optional(v.string()),
        soldTo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { campaignId, nmkrStatuses } = args;

    // Get all inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
      .collect();

    type NMKRStatusEntry = { nftUid: string; nmkrStatus: string; soldTo?: string };
    const nmkrMap = new Map<string, NMKRStatusEntry>(
      nmkrStatuses.map((status: NMKRStatusEntry) => [status.nftUid, status])
    );

    // Find discrepancies
    const discrepancies: Array<{
      nftUid: string;
      nmkrStatus: string;
      currentStatus: string;
    }> = [];

    for (const item of inventory) {
      const nmkrData = nmkrMap.get(item.nftUid);
      if (!nmkrData) continue;

      const nmkrStatus = nmkrData.nmkrStatus as 'free' | 'reserved' | 'sold';
      const expectedConvexStatus = nmkrStateToConvexStatus(nmkrStatus);

      if (item.status !== expectedConvexStatus) {
        discrepancies.push({
          nftUid: item.nftUid,
          nmkrStatus: nmkrData.nmkrStatus,
          currentStatus: item.status,
        });
      }
    }

    if (discrepancies.length === 0) {
      return { syncedCount: 0, message: "Already in sync" };
    }

    // Fix discrepancies
    let syncedCount = 0;
    for (const discrepancy of discrepancies) {
      const nmkrData = nmkrStatuses.find((s: NMKRStatusEntry) => s.nftUid === discrepancy.nftUid);
      if (!nmkrData) continue;

      const nft = inventory.find((i: any) => i.nftUid === discrepancy.nftUid);
      if (!nft) continue;

      const nmkrStatus = nmkrData.nmkrStatus as 'free' | 'reserved' | 'sold';
      const newStatus = nmkrStateToConvexStatus(nmkrStatus);

      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'sold') {
        // Determine the buyer's address - prefer our reservedBy (known stake address format)
        // over NMKR's soldTo (may be transaction hash or different address format)
        const finalSoldTo = nft.reservedBy || nmkrData.soldTo || nft.soldTo;

        // CRITICAL SAFETY CHECK: Log warning if we can't determine the buyer
        if (!finalSoldTo) {
          console.error('[🚨NMKR-SYNC-INTERNAL] CRITICAL: Cannot determine buyer for sold NFT!', {
            nftUid: nft.nftUid,
            nftNumber: nft.nftNumber,
            name: nft.name,
            reservedBy: nft.reservedBy,
            nmkrSoldTo: nmkrData.soldTo,
            existingSoldTo: nft.soldTo,
          });
        } else if (!finalSoldTo.startsWith("stake1")) {
          console.warn('[⚠️NMKR-SYNC-INTERNAL] soldTo is not a stake address format:', {
            nftUid: nft.nftUid,
            name: nft.name,
            finalSoldTo,
            source: nft.reservedBy ? 'reservedBy' : (nmkrData.soldTo ? 'nmkrSoldTo' : 'existingSoldTo'),
          });
        }

        updates.soldTo = finalSoldTo;
        updates.soldAt = Date.now();

        // Look up corporation name for historical tracking
        // users table IS the corporation (1 user = 1 corporation)
        if (finalSoldTo && finalSoldTo.startsWith("stake1")) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", finalSoldTo))
            .first();
          updates.companyNameAtSale = (user as any)?.corporationName || undefined;
        }

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
    }

    // Update campaign counters
    const campaign = await ctx.db.get(campaignId);
    if (campaign) {
      const updatedInventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
        .collect();

      await ctx.db.patch(campaignId, {
        availableNFTs: updatedInventory.filter((i: any) => i.status === "available").length,
        reservedNFTs: updatedInventory.filter((i: any) => i.status === "reserved").length,
        soldNFTs: updatedInventory.filter((i: any) => i.status === "sold").length,
      });
    }

    return { syncedCount, message: `Fixed ${syncedCount} discrepancies` };
  },
});
