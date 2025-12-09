import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * NMKR Sync System
 *
 * Provides synchronization between NMKR's live NFT data and the Convex database.
 * Used by the Campaign Manager UI to verify and sync inventory statuses.
 */

// ==========================================
// TYPES
// ==========================================

// Status mapping from NMKR to our database
const NMKR_TO_DB_STATUS: Record<string, "available" | "reserved" | "sold"> = {
  'free': 'available',
  'reserved': 'reserved',
  'sold': 'sold',
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Compare our inventory with NMKR statuses and return discrepancies
 */
export const getInventoryDiscrepancies = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nmkrStatuses: v.array(v.object({
      nftUid: v.string(),
      nmkrStatus: v.string(),
      soldTo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    console.log('[🔄SYNC] Getting inventory discrepancies for campaign:', args.campaignId);

    // Get all inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log('[🔄SYNC] Found', inventory.length, 'inventory items in database');
    console.log('[🔄SYNC] Received', args.nmkrStatuses.length, 'statuses from NMKR');

    // Create a map of NMKR statuses by UID
    const nmkrStatusMap = new Map<string, { nmkrStatus: string; soldTo?: string }>();
    for (const status of args.nmkrStatuses) {
      nmkrStatusMap.set(status.nftUid, {
        nmkrStatus: status.nmkrStatus,
        soldTo: status.soldTo,
      });
    }

    // Find discrepancies
    const discrepancies: Array<{
      nftUid: string;
      nftName: string;
      nftNumber: number;
      inventoryId: string;
      dbStatus: string;
      nmkrStatus: string;
      expectedDbStatus: string;
      issue: string;
      soldTo?: string;
    }> = [];

    for (const item of inventory) {
      const nmkrData = nmkrStatusMap.get(item.nftUid);

      if (!nmkrData) {
        // NFT exists in our database but not in NMKR response
        discrepancies.push({
          nftUid: item.nftUid,
          nftName: item.name,
          nftNumber: item.nftNumber,
          inventoryId: item._id,
          dbStatus: item.status,
          nmkrStatus: 'not_found',
          expectedDbStatus: item.status, // Keep current status
          issue: 'Not found in NMKR project',
        });
        continue;
      }

      // Map NMKR status to our database status
      const expectedDbStatus = NMKR_TO_DB_STATUS[nmkrData.nmkrStatus] || nmkrData.nmkrStatus;

      // Check if statuses match
      if (item.status !== expectedDbStatus) {
        discrepancies.push({
          nftUid: item.nftUid,
          nftName: item.name,
          nftNumber: item.nftNumber,
          inventoryId: item._id,
          dbStatus: item.status,
          nmkrStatus: nmkrData.nmkrStatus,
          expectedDbStatus,
          issue: `Status mismatch: DB=${item.status}, NMKR=${nmkrData.nmkrStatus}`,
          soldTo: nmkrData.soldTo,
        });
      }
    }

    // Also check for NFTs in NMKR that aren't in our database
    const inventoryUids = new Set(inventory.map(i => i.nftUid));
    Array.from(nmkrStatusMap.entries()).forEach(([nftUid, data]) => {
      if (!inventoryUids.has(nftUid)) {
        discrepancies.push({
          nftUid,
          nftName: `Unknown (${nftUid.substring(0, 8)}...)`,
          nftNumber: -1,
          inventoryId: '',
          dbStatus: 'not_found',
          nmkrStatus: data.nmkrStatus,
          expectedDbStatus: NMKR_TO_DB_STATUS[data.nmkrStatus] || data.nmkrStatus,
          issue: 'Exists in NMKR but not in database',
          soldTo: data.soldTo,
        });
      }
    });

    console.log('[🔄SYNC] Found', discrepancies.length, 'discrepancies');

    return discrepancies;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Sync all NFTs for a campaign based on NMKR statuses
 */
export const syncCampaignInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nmkrStatuses: v.array(v.object({
      nftUid: v.string(),
      nmkrStatus: v.string(),
      soldTo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    console.log('[🔄SYNC] ========== SYNC CAMPAIGN INVENTORY ==========');
    console.log('[🔄SYNC] Campaign ID:', args.campaignId);
    console.log('[🔄SYNC] NMKR statuses received:', args.nmkrStatuses.length);

    // Get all inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log('[🔄SYNC] Database inventory items found:', inventory.length);
    inventory.forEach((item: any) => {
      console.log('[🔄SYNC] DB Item:', item.name, '| UID:', item.nftUid, '| Status:', item.status);
    });

    // Create a map of NMKR statuses by UID
    const nmkrStatusMap = new Map<string, { nmkrStatus: string; soldTo?: string }>();
    for (const status of args.nmkrStatuses) {
      nmkrStatusMap.set(status.nftUid, {
        nmkrStatus: status.nmkrStatus,
        soldTo: status.soldTo,
      });
    }

    console.log('[🔄SYNC] NMKR UIDs in map:', Array.from(nmkrStatusMap.keys()).slice(0, 5), '...');

    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const updates: Array<{ nftName: string; oldStatus: string; newStatus: string }> = [];

    for (const item of inventory) {
      const nmkrData = nmkrStatusMap.get(item.nftUid);

      if (!nmkrData) {
        console.log('[🔄SYNC] NFT not found in NMKR:', item.name);
        skippedCount++;
        continue;
      }

      // Map NMKR status to our database status
      const expectedDbStatus = NMKR_TO_DB_STATUS[nmkrData.nmkrStatus];
      if (!expectedDbStatus) {
        errors.push(`Unknown NMKR status for ${item.name}: ${nmkrData.nmkrStatus}`);
        continue;
      }

      // Check if update is needed
      if (item.status !== expectedDbStatus) {
        try {
          const updateData: any = {
            status: expectedDbStatus,
          };

          // If sold, add sold metadata
          if (expectedDbStatus === 'sold') {
            updateData.soldAt = Date.now();
            if (nmkrData.soldTo) {
              updateData.soldTo = nmkrData.soldTo;
            }
            // Clear reservation data
            updateData.reservedBy = undefined;
            updateData.reservedAt = undefined;
          }

          // If available, clear all reservation/sold data
          if (expectedDbStatus === 'available') {
            updateData.reservedBy = undefined;
            updateData.reservedAt = undefined;
            updateData.soldTo = undefined;
            updateData.soldAt = undefined;
          }

          await ctx.db.patch(item._id, updateData);

          updates.push({
            nftName: item.name,
            oldStatus: item.status,
            newStatus: expectedDbStatus,
          });

          console.log('[🔄SYNC] Updated', item.name, ':', item.status, '→', expectedDbStatus);
          syncedCount++;
        } catch (error: any) {
          errors.push(`Failed to update ${item.name}: ${error.message}`);
        }
      } else {
        skippedCount++;
      }
    }

    // Sync campaign counters after updates
    if (syncedCount > 0) {
      const updatedInventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
        .collect();

      const counters = {
        totalNFTs: updatedInventory.length,
        availableNFTs: updatedInventory.filter((i: any) => i.status === "available").length,
        reservedNFTs: updatedInventory.filter((i: any) => i.status === "reserved").length,
        soldNFTs: updatedInventory.filter((i: any) => i.status === "sold").length,
        updatedAt: Date.now(),
      };

      await ctx.db.patch(args.campaignId, counters);
      console.log('[🔄SYNC] Updated campaign counters:', counters);
    }

    console.log('[🔄SYNC] Sync complete. Synced:', syncedCount, 'Skipped:', skippedCount, 'Errors:', errors.length);

    return {
      success: true,
      syncedCount,
      skippedCount,
      errors,
      updates,
    };
  },
});

/**
 * Sync a single NFT based on NMKR status
 */
export const syncSingleNFT = mutation({
  args: {
    nftUid: v.string(),
    nmkrStatus: v.string(),
    soldTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[🔄SYNC] Syncing single NFT:', args.nftUid, '→', args.nmkrStatus);

    // Find the NFT in our database
    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    if (!nft) {
      throw new Error(`NFT not found in database: ${args.nftUid}`);
    }

    // Map NMKR status to our database status
    const expectedDbStatus = NMKR_TO_DB_STATUS[args.nmkrStatus];
    if (!expectedDbStatus) {
      throw new Error(`Unknown NMKR status: ${args.nmkrStatus}`);
    }

    // Check if update is needed
    if (nft.status === expectedDbStatus) {
      console.log('[🔄SYNC] NFT already has correct status:', nft.name);
      return {
        success: true,
        updated: false,
        nftName: nft.name,
        status: nft.status,
      };
    }

    const oldStatus = nft.status;

    // Build update data (only fields that exist in schema)
    const updateData: any = {
      status: expectedDbStatus,
    };

    // If sold, add sold metadata
    if (expectedDbStatus === 'sold') {
      updateData.soldAt = Date.now();
      if (args.soldTo) {
        updateData.soldTo = args.soldTo;
      }
      // Clear reservation data
      updateData.reservedBy = undefined;
      updateData.reservedAt = undefined;
    }

    // If available, clear all reservation/sold data
    if (expectedDbStatus === 'available') {
      updateData.reservedBy = undefined;
      updateData.reservedAt = undefined;
      updateData.soldTo = undefined;
      updateData.soldAt = undefined;
    }

    await ctx.db.patch(nft._id, updateData);

    console.log('[🔄SYNC] Updated', nft.name, ':', oldStatus, '→', expectedDbStatus);

    // Update campaign counters if we have a campaign ID
    if (nft.campaignId) {
      const inventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", nft.campaignId))
        .collect();

      const counters = {
        totalNFTs: inventory.length,
        availableNFTs: inventory.filter((i: any) => i.status === "available").length,
        reservedNFTs: inventory.filter((i: any) => i.status === "reserved").length,
        soldNFTs: inventory.filter((i: any) => i.status === "sold").length,
        updatedAt: Date.now(),
      };

      await ctx.db.patch(nft.campaignId, counters);
    }

    return {
      success: true,
      updated: true,
      nftName: nft.name,
      oldStatus,
      newStatus: expectedDbStatus,
    };
  },
});

// ==========================================
// SYNC LOGGING (from archived file)
// ==========================================

/**
 * Record a sync log entry
 */
export const recordSyncLog = mutation({
  args: {
    syncType: v.union(
      v.literal("webhook"),
      v.literal("api_pull"),
      v.literal("manual_sync")
    ),
    nmkrProjectId: v.string(),
    status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed")),
    recordsSynced: v.number(),
    errors: v.optional(v.array(v.string())),
    syncedData: v.optional(v.any()),
    syncStartedAt: v.number(),
    syncCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("nmkrSyncLog", {
      syncType: args.syncType,
      nmkrProjectId: args.nmkrProjectId,
      status: args.status,
      recordsSynced: args.recordsSynced,
      errors: args.errors,
      syncedData: args.syncedData,
      syncStartedAt: args.syncStartedAt,
      syncCompletedAt: args.syncCompletedAt,
    });

    return logId;
  },
});

/**
 * Get recent sync logs
 */
export const getRecentSyncLogs = query({
  args: {
    nmkrProjectId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limitCount = args.limit || 50;

    // Use different query paths based on filters
    if (args.nmkrProjectId) {
      return await ctx.db
        .query("nmkrSyncLog")
        .withIndex("by_project", (q: any) => q.eq("nmkrProjectId", args.nmkrProjectId))
        .order("desc")
        .take(limitCount);
    } else if (args.status) {
      return await ctx.db
        .query("nmkrSyncLog")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .order("desc")
        .take(limitCount);
    } else {
      return await ctx.db
        .query("nmkrSyncLog")
        .order("desc")
        .take(limitCount);
    }
  },
});

/**
 * Get sync status for a project
 */
export const getSyncStatus = query({
  args: { nmkrProjectId: v.string() },
  handler: async (ctx, args) => {
    const recentSyncs = await ctx.db
      .query("nmkrSyncLog")
      .withIndex("by_project", (q: any) => q.eq("nmkrProjectId", args.nmkrProjectId))
      .order("desc")
      .take(10);

    if (recentSyncs.length === 0) {
      return {
        lastSync: null,
        syncHealth: "unknown" as const,
        recentSyncs: [],
      };
    }

    const lastSync = recentSyncs[0];
    const successfulSyncs = recentSyncs.filter((s: any) => s.status === "success").length;
    const failedSyncs = recentSyncs.filter((s: any) => s.status === "failed").length;

    // Determine sync health
    let syncHealth: "healthy" | "warning" | "error" | "unknown";
    if (failedSyncs === 0) {
      syncHealth = "healthy";
    } else if (failedSyncs <= 2) {
      syncHealth = "warning";
    } else {
      syncHealth = "error";
    }

    return {
      lastSync,
      syncHealth,
      recentSyncs,
      stats: {
        successfulSyncs,
        failedSyncs,
        totalSyncs: recentSyncs.length,
      },
    };
  },
});
