/**
 * Commemorative NFT Inventory Setup
 *
 * This module provides mutations for setting up and managing NFT inventory
 * for commemorative campaigns. It handles adding new NFTs from NMKR and
 * updating existing inventory.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Add new NFTs to campaign inventory from NMKR
 *
 * This mutation intelligently handles:
 * - Skipping duplicates (NFTs already in inventory)
 * - Adding only new NFTs
 * - Auto-generating payment URLs
 * - Including image URLs from NMKR
 */
export const addNewNFTsToInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nfts: v.array(
      v.object({
        nftUid: v.string(),
        nftNumber: v.number(),
        name: v.string(),
        paymentUrl: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log('[📥IMPORT] Adding NFTs to campaign:', args.campaignId);
    console.log('[📥IMPORT] NFTs provided:', args.nfts.length);

    // Get campaign for project ID
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Get existing inventory to check for duplicates
    const existingInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    const existingUids = new Set(existingInventory.map((n) => n.nftUid));

    console.log('[📥IMPORT] Existing inventory count:', existingInventory.length);
    console.log('[📥IMPORT] Existing UIDs:', existingUids.size);

    const now = Date.now();
    const nmkrNetwork = process.env.NEXT_PUBLIC_NMKR_NETWORK || "mainnet";
    const basePaymentUrl = nmkrNetwork === "mainnet"
      ? "https://pay.nmkr.io"
      : "https://pay.preprod.nmkr.io";

    let added = 0;
    let skipped = 0;

    for (const nft of args.nfts) {
      // Skip if already exists
      if (existingUids.has(nft.nftUid)) {
        console.log('[📥IMPORT] ⏭️ Skipping duplicate:', nft.name, nft.nftUid);
        skipped++;
        continue;
      }

      // Generate payment URL
      const paymentUrl = nft.paymentUrl || `${basePaymentUrl}/?p=${campaign.nmkrProjectId}&n=${nft.nftUid}`;

      // Insert new NFT
      await ctx.db.insert("commemorativeNFTInventory", {
        campaignId: args.campaignId,
        nftUid: nft.nftUid,
        nftNumber: nft.nftNumber,
        name: nft.name,
        status: "available",
        projectId: campaign.nmkrProjectId,
        paymentUrl,
        imageUrl: nft.imageUrl,
        createdAt: now,
      });

      added++;
      console.log('[📥IMPORT] ✅ Added:', nft.name, nft.imageUrl ? '(with image)' : '(no image)');
    }

    // Get final count
    const finalInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log('[📥IMPORT] Summary - Added:', added, 'Skipped:', skipped, 'Total:', finalInventory.length);

    return {
      success: true,
      added,
      skipped,
      total: finalInventory.length,
    };
  },
});

/**
 * Get all NFT UIDs in campaign inventory
 * Used to check for duplicates before import
 */
export const getInventoryUids = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    return inventory.map((n) => n.nftUid);
  },
});

/**
 * Mark NFT inventory as sold by UID (called by webhook when no reservation found)
 *
 * This is a CRITICAL fallback function for external sales or when reservations expire.
 * When NMKR sends a webhook but no active reservation exists, this function
 * directly marks the inventory as sold.
 */
export const markInventoryAsSoldByUid = mutation({
  args: {
    nftUid: v.string(),
    transactionHash: v.string(),
    soldTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[WEBHOOK-FALLBACK] markInventoryAsSoldByUid called:', {
      nftUid: args.nftUid,
      tx: args.transactionHash,
      soldTo: args.soldTo?.substring(0, 20) + '...',
    });

    // Find the NFT by UID
    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    if (!nft) {
      console.error('[WEBHOOK-FALLBACK] NFT not found:', args.nftUid);
      return { success: false, error: "NFT not found" };
    }

    console.log('[WEBHOOK-FALLBACK] Found NFT:', nft.name, 'current status:', nft.status);

    // Check if already sold (idempotency)
    if (nft.status === "sold") {
      console.log('[WEBHOOK-FALLBACK] NFT already sold, skipping:', nft.name);
      return { success: true, alreadySold: true, nftNumber: nft.nftNumber };
    }

    // Look up company name for historical tracking
    let companyNameAtSale: string | undefined;
    if (args.soldTo) {
      let user;
      if (args.soldTo.startsWith('stake1')) {
        user = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.soldTo))
          .first();
      } else {
        user = await ctx.db
          .query("users")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.soldTo))
          .first();
      }
      companyNameAtSale = user?.corporationName || undefined;
    }

    // Update the NFT to sold status
    await ctx.db.patch(nft._id, {
      status: "sold",
      soldTo: args.soldTo,
      soldAt: Date.now(),
      transactionHash: args.transactionHash,
      companyNameAtSale,
      reservedBy: undefined,
      reservedAt: undefined,
      expiresAt: undefined,
      paymentWindowOpenedAt: undefined,
      paymentWindowClosedAt: undefined,
    });

    console.log('[WEBHOOK-FALLBACK] Successfully marked NFT as sold:', nft.name);

    // Update campaign counters
    if (nft.campaignId) {
      const campaign = await ctx.db.get(nft.campaignId);
      if (campaign) {
        const wasAvailable = nft.status === "available";
        const wasReserved = nft.status === "reserved";

        await ctx.db.patch(nft.campaignId, {
          soldNFTs: (campaign.soldNFTs || 0) + 1,
          availableNFTs: wasAvailable
            ? Math.max(0, (campaign.availableNFTs || 0) - 1)
            : campaign.availableNFTs,
          reservedNFTs: wasReserved
            ? Math.max(0, (campaign.reservedNFTs || 0) - 1)
            : campaign.reservedNFTs,
          updatedAt: Date.now(),
        });
      }
    }

    return {
      success: true,
      nftNumber: nft.nftNumber,
      nftName: nft.name,
      soldTo: args.soldTo,
      companyNameAtSale,
    };
  },
});
