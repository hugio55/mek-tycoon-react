import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Lab Rat NFT Inventory Setup
 *
 * This file contains helper functions to initialize the NFT inventory
 * with all 10 Lab Rat NFTs from NMKR.
 */

const PROJECT_ID = process.env.NMKR_PROJECT_ID || "";
const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || "mainnet";

// Initialize inventory by fetching all Lab Rat NFTs from NMKR
export const initializeInventoryFromNMKR = action({
  handler: async (ctx) => {
    console.log('[INVENTORY SETUP] Fetching Lab Rat NFTs from NMKR...');

    try {
      // Use the existing NMKR action to get NFTs
      const result = await ctx.runAction(api.nmkr.getProjectStats, {
        projectId: PROJECT_ID,
      });

      if (result.error) {
        console.error('[INVENTORY SETUP] Failed to fetch from NMKR:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }

      console.log('[INVENTORY SETUP] Found', result.available, 'available NFTs');

      // Now we need to get the actual NFT list with UIDs
      // For now, return stats - we'll need to call a different endpoint or manually populate
      return {
        success: true,
        message: "Please use populateInventoryManually with NFT UIDs from NMKR Studio",
        stats: result,
      };
    } catch (error) {
      console.error('[INVENTORY SETUP] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Manually populate inventory with Lab Rat NFT UIDs
// Call this once with all 10 UIDs from NMKR Studio
export const populateInventoryManually = mutation({
  args: {
    nfts: v.array(
      v.object({
        nftUid: v.string(),
        nftNumber: v.number(),
        name: v.string(),
        paymentUrl: v.optional(v.string()), // Optional: use from CSV if provided
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = PROJECT_ID;

    console.log('[INVENTORY SETUP] Populating inventory with', args.nfts.length, 'NFTs');

    // Check if inventory already exists
    const existingInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    if (existingInventory.length > 0) {
      console.log('[INVENTORY SETUP] Inventory already exists with', existingInventory.length, 'items');
      return {
        success: false,
        error: "Inventory already populated. Use clearInventory() first if you want to reset.",
      };
    }

    const basePaymentUrl = NMKR_NETWORK === "mainnet"
      ? "https://pay.nmkr.io"
      : "https://pay.preprod.nmkr.io";

    // Insert all NFTs
    for (const nft of args.nfts) {
      // Use payment URL from CSV if provided, otherwise build it
      let paymentUrl: string;
      if (nft.paymentUrl) {
        // PREFERRED: Use payment URL directly from CSV (already correct format)
        paymentUrl = nft.paymentUrl;
        console.log('[INVENTORY SETUP] Using payment URL from CSV for', nft.name);
      } else {
        // FALLBACK: Build payment URL (strip dashes from UUID - NMKR expects dashless format)
        const dashlessUid = nft.nftUid.replace(/-/g, '');
        paymentUrl = `${basePaymentUrl}/?p=${projectId}&n=${dashlessUid}`;
        console.log('[INVENTORY SETUP] Built payment URL for', nft.name);
      }

      await ctx.db.insert("commemorativeNFTInventory", {
        nftUid: nft.nftUid,
        nftNumber: nft.nftNumber,
        name: nft.name,
        status: "available",
        projectId,
        paymentUrl,
        createdAt: now,
      });

      console.log('[INVENTORY SETUP] Added', nft.name, 'UID:', nft.nftUid);
    }

    console.log('[INVENTORY SETUP] Successfully populated inventory with', args.nfts.length, 'NFTs');

    return {
      success: true,
      count: args.nfts.length,
    };
  },
});

// Add new NFTs to existing inventory (skips duplicates by nftUid)
// Use this to add NFTs when inventory already has items
export const addNewNFTsToInventory = mutation({
  args: {
    nfts: v.array(
      v.object({
        nftUid: v.string(),
        nftNumber: v.number(),
        name: v.string(),
        paymentUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = PROJECT_ID;

    console.log('[INVENTORY ADD] Adding', args.nfts.length, 'NFTs to existing inventory');

    // Get existing UIDs to skip duplicates
    const existingInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    const existingUids = new Set(existingInventory.map(item => item.nftUid));
    console.log('[INVENTORY ADD] Found', existingUids.size, 'existing NFTs in inventory');

    const basePaymentUrl = NMKR_NETWORK === "mainnet"
      ? "https://pay.nmkr.io"
      : "https://pay.preprod.nmkr.io";

    let addedCount = 0;
    let skippedCount = 0;

    for (const nft of args.nfts) {
      // Skip if already exists
      if (existingUids.has(nft.nftUid)) {
        console.log('[INVENTORY ADD] Skipping duplicate:', nft.name);
        skippedCount++;
        continue;
      }

      // Build payment URL
      let paymentUrl: string;
      if (nft.paymentUrl) {
        paymentUrl = nft.paymentUrl;
      } else {
        const dashlessUid = nft.nftUid.replace(/-/g, '');
        paymentUrl = `${basePaymentUrl}/?p=${projectId}&n=${dashlessUid}`;
      }

      await ctx.db.insert("commemorativeNFTInventory", {
        nftUid: nft.nftUid,
        nftNumber: nft.nftNumber,
        name: nft.name,
        status: "available",
        projectId,
        paymentUrl,
        createdAt: now,
      });

      console.log('[INVENTORY ADD] Added:', nft.name, 'UID:', nft.nftUid);
      addedCount++;
    }

    console.log('[INVENTORY ADD] Complete - Added:', addedCount, 'Skipped:', skippedCount);

    return {
      success: true,
      added: addedCount,
      skipped: skippedCount,
      total: existingInventory.length + addedCount,
    };
  },
});

// Clear all inventory (use with caution!)
export const clearInventory = mutation({
  handler: async (ctx) => {
    console.log('[INVENTORY SETUP] Clearing inventory...');

    const inventory = await ctx.db.query("commemorativeNFTInventory").collect();

    for (const item of inventory) {
      await ctx.db.delete(item._id);
    }

    console.log('[INVENTORY SETUP] Deleted', inventory.length, 'items');

    // Also clear any reservations
    const reservations = await ctx.db.query("commemorativeNFTReservations").collect();
    for (const reservation of reservations) {
      await ctx.db.delete(reservation._id);
    }

    console.log('[INVENTORY SETUP] Deleted', reservations.length, 'reservations');

    return {
      success: true,
      deleted: inventory.length + reservations.length,
      deletedInventory: inventory.length,
      deletedReservations: reservations.length,
    };
  },
});

// Get inventory status
export const getInventoryStatus = mutation({
  handler: async (ctx) => {
    const inventory = await ctx.db.query("commemorativeNFTInventory").collect();

    const stats = {
      total: inventory.length,
      available: inventory.filter((i) => i.status === "available").length,
      reserved: inventory.filter((i) => i.status === "reserved").length,
      sold: inventory.filter((i) => i.status === "sold").length,
    };

    console.log('[INVENTORY STATUS]', stats);

    return {
      success: true,
      stats,
      inventory: inventory.map((i) => ({
        number: i.nftNumber,
        name: i.name,
        status: i.status,
        uid: i.nftUid,
      })),
    };
  },
});

// Get all inventory (query for frontend)
export const getAllInventory = query({
  handler: async (ctx) => {
    console.log('[📊GETALL] === getAllInventory query called ===');

    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    console.log('[📊GETALL] Total inventory items from DB:', inventory.length);

    // Log status breakdown from raw database
    const statusCounts = {
      available: inventory.filter((item: any) => item.status === "available").length,
      reserved: inventory.filter((item: any) => item.status === "reserved").length,
      sold: inventory.filter((item: any) => item.status === "sold").length,
    };
    console.log('[📊GETALL] Status breakdown (raw DB):', statusCounts);

    // Log first few items to see actual status values
    const sample = inventory.slice(0, 3);
    console.log('[📊GETALL] Sample items:', sample.map((nft: any) => ({
      name: nft.name,
      nftUid: nft.nftUid,
      status: nft.status,
      _creationTime: nft._creationTime,
    })));

    const mapped = inventory.map((item) => ({
      _id: item._id,
      nftUid: item.nftUid,
      nftNumber: item.nftNumber,
      name: item.name,
      status: item.status,
      isAvailable: item.status === "available",
    }));

    console.log('[📊GETALL] Returning', mapped.length, 'mapped items');
    console.log('[📊GETALL] === Query execution complete ===');

    return mapped;
  },
});

// Get count of available NFTs (query for frontend)
export const getAvailableCount = query({
  handler: async (ctx) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    return inventory.length;
  },
});

// FIX: Repair malformed payment URLs in existing inventory
// This fixes the bug where projectId was empty in payment URLs
export const repairPaymentUrls = mutation({
  args: {
    campaignId: v.optional(v.id("commemorativeCampaigns")),
  },
  handler: async (ctx, args) => {
    console.log('[🔧FIX] Starting payment URL repair...');

    // Get all inventory items (optionally filter by campaign)
    let inventoryQuery = ctx.db.query("commemorativeNFTInventory");

    if (args.campaignId) {
      inventoryQuery = inventoryQuery.withIndex("by_campaign", (q: any) =>
        q.eq("campaignId", args.campaignId)
      );
    }

    const inventory = await inventoryQuery.collect();

    console.log('[🔧FIX] Found', inventory.length, 'inventory items to check');

    const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || "mainnet";
    const basePaymentUrl = NMKR_NETWORK === "mainnet"
      ? "https://pay.nmkr.io"
      : "https://pay.preprod.nmkr.io";

    // Get project ID from environment variable as fallback
    const fallbackProjectId = process.env.NMKR_PROJECT_ID || "";

    let repairedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const item of inventory) {
      try {
        // CRITICAL: Extract project ID from existing URL to compare
        const urlMatch = item.paymentUrl.match(/[?&]p=([a-f0-9]+)/);
        const existingProjectId = urlMatch ? urlMatch[1] : '';

        // CRITICAL FIX: Always use fallback (env var) as source of truth
        // Don't trust database projectId field - it may be corrupted
        const correctProjectId = fallbackProjectId;
        const correctProjectIdDashless = correctProjectId.replace(/-/g, '');

        // Check if URL is malformed:
        // 1. Missing project ID
        // 2. Has dashes in UID
        // 3. Project ID doesn't match expected
        const isMalformed = item.paymentUrl.includes('/?p=&n=') ||
                           item.paymentUrl.includes('?p=&n=') ||
                           (item.paymentUrl.includes('&n=') && /&n=[a-f0-9-]{36}/.test(item.paymentUrl)) ||
                           (existingProjectId !== correctProjectIdDashless);

        if (!isMalformed) {
          console.log('[🔧FIX] Skipping (already correct):', item.name);
          skippedCount++;
          continue;
        }

        // Log why it's being fixed
        if (existingProjectId !== correctProjectIdDashless) {
          console.log('[🔧FIX] ⚠️ WRONG PROJECT ID detected in URL for:', item.name);
          console.log('[🔧FIX]    Existing:', existingProjectId);
          console.log('[🔧FIX]    Expected:', correctProjectIdDashless);
        }

        console.log('[🔧FIX] 🔍 Attempting to fix:', item.name);
        console.log('[🔧FIX]    Current projectId in record:', item.projectId || '(empty)');
        console.log('[🔧FIX]    Correct projectId from env:', correctProjectId);

        // Use the correctProjectId we already determined from environment variable
        const projectId = correctProjectId;

        // Construct correct payment URL
        // CRITICAL FIX: Strip dashes from UUID - NMKR expects dashless format
        const dashlessUid = item.nftUid.replace(/-/g, '');
        const dashlessProjectId = projectId.replace(/-/g, '');
        const correctPaymentUrl = `${basePaymentUrl}/?p=${dashlessProjectId}&n=${dashlessUid}`;

        console.log('[🔧FIX]    Building correct URL with project ID:', projectId);

        // Update the item
        await ctx.db.patch(item._id, {
          paymentUrl: correctPaymentUrl,
          projectId: projectId, // Also update projectId if it was missing
        });

        console.log('[🔧FIX] ✅ Repaired:', item.name);
        console.log('[🔧FIX]    Old URL:', item.paymentUrl);
        console.log('[🔧FIX]    New URL:', correctPaymentUrl);
        repairedCount++;
      } catch (error) {
        console.error('[🔧FIX] ❌ Error fixing', item.name, ':', error);
        console.error('[🔧FIX]    Error details:', error instanceof Error ? error.message : String(error));
        errorCount++;
      }
    }

    console.log('[🔧FIX] === Repair Complete ===');
    console.log('[🔧FIX] Total items:', inventory.length);
    console.log('[🔧FIX] Repaired:', repairedCount);
    console.log('[🔧FIX] Already correct:', skippedCount);
    console.log('[🔧FIX] Errors:', errorCount);

    return {
      success: true,
      totalItems: inventory.length,
      repairedCount,
      skippedCount,
      errorCount,
    };
  },
});

// Initialize from CSV (for frontend test page)
export const initializeFromCSV = action({
  args: {
    csvContent: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[CSV INIT] Parsing CSV content...');

    const lines = args.csvContent.trim().split('\n');

    // Parse header row to find column indices
    const headers = lines[0].split(',').map((h: any) => h.trim().toLowerCase());
    console.log('[CSV INIT] CSV headers:', headers);

    const nfts = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');

      // NMKR CSV has: Uid, Tokenname, Displayname, State, etc.
      const uid = values[headers.indexOf('uid')]?.trim() || '';
      const tokenname = values[headers.indexOf('tokenname')]?.trim() || '';
      const displayname = values[headers.indexOf('displayname')]?.trim() || '';
      const state = values[headers.indexOf('state')]?.trim()?.toLowerCase() || '';

      // CRITICAL FIX: Extract payment URL from CSV if available
      // Check multiple possible column names for payment URL
      const paymentUrlFromCSV =
        values[headers.indexOf('paymenturl')]?.trim() ||
        values[headers.indexOf('iagonlink')]?.trim() ||
        values[headers.indexOf('assetlink')]?.trim() ||
        '';

      // Use tokenname first, fall back to displayname
      const name = tokenname || displayname;

      // Only process NFTs that are "free" (available)
      if (!uid || !name || state !== 'free') {
        console.log('[CSV INIT] Skipping NFT:', { uid, name, state });
        continue;
      }

      // Extract number from name like "Lab Rat #1"
      let nftNumber = 0;
      const match = name.match(/#(\d+)/);
      if (match) {
        nftNumber = parseInt(match[1]);
      } else {
        // Fallback: try any number in the string
        const numMatch = name.match(/(\d+)/);
        if (numMatch) {
          nftNumber = parseInt(numMatch[1]);
        }
      }

      if (nftNumber > 0) {
        const nftData: any = {
          nftUid: uid,
          name: name,
          nftNumber: nftNumber,
        };

        // Include payment URL if found in CSV (preferred!)
        if (paymentUrlFromCSV) {
          nftData.paymentUrl = paymentUrlFromCSV;
        }

        nfts.push(nftData);
        console.log('[CSV INIT] Parsed NFT:', { uid, name, nftNumber, state, hasPaymentUrl: !!paymentUrlFromCSV });
      }
    }

    console.log('[CSV INIT] Successfully parsed', nfts.length, 'available NFTs from CSV');

    // Use addNewNFTsToInventory which handles existing inventory gracefully
    const result = await ctx.runMutation(api.commemorativeNFTInventorySetup.addNewNFTsToInventory, {
      nfts,
    });

    return {
      created: result.success ? result.added : 0,
      skipped: result.success ? result.skipped : nfts.length,
    };
  },
});

// Add known test NFTs (for testing)
export const addKnownNFTs = action({
  handler: async (ctx) => {
    console.log('[ADD KNOWN] Adding Lab Rat #1 test NFT...');

    const testNFTs = [
      {
        nftUid: "10aec295-d9e2-47e3-9c04-e56e2df92ad5",
        nftNumber: 1,
        name: "Lab Rat #1",
      },
    ];

    const result = await ctx.runMutation(api.commemorativeNFTInventorySetup.populateInventoryManually, {
      nfts: testNFTs,
    });

    return {
      created: result.success ? result.count : 0,
    };
  },
});

// Mark inventory item as sold by NFT UID (for external NMKR sales)
// This is called when an NFT is sold directly through NMKR Studio (not through our UI)
export const markInventoryAsSoldByUid = mutation({
  args: {
    nftUid: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[🔨INVENTORY] External sale - marking as sold:', args.nftUid);
    console.log('[🔨INVENTORY] Transaction:', args.transactionHash);

    // Query inventory by nftUid using the index
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    // NFT not found in inventory
    if (!inventory) {
      console.log('[🔨INVENTORY] ERROR: NFT UID not found in inventory:', args.nftUid);
      return {
        success: false,
        error: `NFT with UID ${args.nftUid} not found in inventory`,
      };
    }

    // Already sold - idempotent operation
    if (inventory.status === "sold") {
      console.log('[🔨INVENTORY] NFT already marked as sold (idempotent):', inventory.nftNumber);
      return {
        success: true,
        nftNumber: inventory.nftNumber,
        alreadySold: true,
      };
    }

    // Update status to sold
    await ctx.db.patch(inventory._id, {
      status: "sold",
    });

    console.log('[🔨INVENTORY] Updated NFT #' + inventory.nftNumber + ' to sold');
    console.log('[🔨INVENTORY] Status changed from', inventory.status, '→ sold');

    // Cancel any active reservations for this NFT (if reserved status)
    if (inventory.status === "reserved") {
      const activeReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("by_inventory_id", (q: any) => q.eq("nftInventoryId", inventory._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (activeReservation) {
        await ctx.db.patch(activeReservation._id, {
          status: "cancelled",
        });
        console.log('[🔨INVENTORY] Cancelled reservation for NFT #' + inventory.nftNumber);
      }
    }

    return {
      success: true,
      nftNumber: inventory.nftNumber,
      alreadySold: false,
    };
  },
});

// Mark inventory item as sold by NFT name (fallback method)
// Note: Prefer markInventoryAsSoldByUid when NftUid is available from webhook
export const markInventoryAsSoldByName = mutation({
  args: {
    nftName: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[🔨INVENTORY] External sale (by name) - marking as sold:', args.nftName);
    console.log('[🔨INVENTORY] Transaction:', args.transactionHash);

    // Find inventory item by name
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("name"), args.nftName))
      .first();

    if (!inventory) {
      console.log('[🔨INVENTORY] ERROR: NFT name not found in inventory:', args.nftName);
      return {
        success: false,
        error: `NFT "${args.nftName}" not found in inventory`,
      };
    }

    // Already sold - idempotent operation
    if (inventory.status === "sold") {
      console.log('[🔨INVENTORY] NFT already marked as sold (idempotent):', inventory.nftNumber);
      return {
        success: true,
        nftNumber: inventory.nftNumber,
        alreadySold: true,
      };
    }

    // Update status to sold
    await ctx.db.patch(inventory._id, {
      status: "sold",
    });

    console.log('[🔨INVENTORY] Updated NFT #' + inventory.nftNumber + ' to sold');
    console.log('[🔨INVENTORY] Status changed from', inventory.status, '→ sold');

    // Cancel any active reservations for this NFT (if reserved status)
    if (inventory.status === "reserved") {
      const activeReservation = await ctx.db
        .query("commemorativeNFTReservations")
        .withIndex("", (q: any) => q.eq("nftInventoryId", inventory._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (activeReservation) {
        await ctx.db.patch(activeReservation._id, {
          status: "cancelled",
        });
        console.log('[🔨INVENTORY] Cancelled reservation for NFT #' + inventory.nftNumber);
      }
    }

    return {
      success: true,
      nftNumber: inventory.nftNumber,
      nftUid: inventory.nftUid,
      alreadySold: false,
    };
  },
});

// DEBUG: Query to inspect Lab Rat NFT records
export const debugLabRatRecords = query({
  handler: async (ctx) => {
    const labRats = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.or(
        q.eq(q.field("name"), "Lab Rat #1"),
        q.eq(q.field("name"), "Lab Rat #2"),
        q.eq(q.field("name"), "Lab Rat #3")
      ))
      .collect();

    const results = labRats.map((nft) => ({
      name: nft.name,
      nftNumber: nft.nftNumber,
      nftUid: nft.nftUid,
      projectId: nft.projectId || "(empty/undefined)",
      paymentUrl: nft.paymentUrl,
      status: nft.status,
      createdAt: nft.createdAt,
      _id: nft._id,
    }));

    console.log('[🔍DEBUG] Lab Rat Records:', results);
    return results;
  },
});

/**
 * EXAMPLE USAGE:
 *
 * From Convex dashboard or admin panel, call:
 *
 * populateInventoryManually({
 *   nfts: [
 *     { nftUid: "10aec295-d9e2-47e3-9c04-e56e2df92ad5", nftNumber: 1, name: "Lab Rat #1" },
 *     { nftUid: "[UID_FROM_NMKR]", nftNumber: 2, name: "Lab Rat #2" },
 *     { nftUid: "[UID_FROM_NMKR]", nftNumber: 3, name: "Lab Rat #3" },
 *     ... (up to Lab Rat #10)
 *   ]
 * })
 *
 * markInventoryAsSoldByUid({
 *   nftUid: "10aec295-d9e2-47e3-9c04-e56e2df92ad5",
 *   transactionHash: "0xabcdef1234567890..."
 * })
 *
 * markInventoryAsSoldByName({
 *   nftName: "Lab Rat #1",
 *   transactionHash: "0xabcdef1234567890..."
 * })
 */
