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
      const paymentUrl = `${basePaymentUrl}/?p=${projectId}&n=${nft.nftUid}`;

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
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    return inventory.map((item) => ({
      _id: item._id,
      nftUid: item.nftUid,
      nftNumber: item.nftNumber,
      name: item.name,
      status: item.status,
      isAvailable: item.status === "available",
    }));
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

// Initialize from CSV (for frontend test page)
export const initializeFromCSV = action({
  args: {
    csvContent: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[CSV INIT] Parsing CSV content...');

    const lines = args.csvContent.trim().split('\n');

    // Parse header row to find column indices
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
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
        nfts.push({
          nftUid: uid,
          name: name,
          nftNumber: nftNumber,
        });
        console.log('[CSV INIT] Parsed NFT:', { uid, name, nftNumber, state });
      }
    }

    console.log('[CSV INIT] Successfully parsed', nfts.length, 'available NFTs from CSV');

    // Use the existing populateInventoryManually mutation
    const result = await ctx.runMutation(api.commemorativeNFTInventorySetup.populateInventoryManually, {
      nfts,
    });

    return {
      created: result.success ? result.count : 0,
      skipped: result.success ? 0 : nfts.length,
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
 */
