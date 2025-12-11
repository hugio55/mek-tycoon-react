import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * CAMPAIGN MINTS - Single Source of Truth for NFT Claim Tracking
 *
 * This file contains all functions for recording and checking campaign mints.
 *
 * IMPORTANT FOR FUTURE CLAUDE SESSIONS:
 * - This is THE authoritative system for "has wallet X ever minted from campaign Y"
 * - All claim checks should use these functions
 * - Admin should always query PRODUCTION database for claim status
 * - Do NOT use commemorativeNFTClaims, Inventory.soldTo, or Reservations for claim checks
 */

// ============================================================================
// CORE CLAIM CHECKING QUERIES
// ============================================================================

/**
 * Check if a wallet has minted from a specific campaign
 *
 * This is the PRIMARY function for preventing double-mints.
 * Returns true if a record exists, regardless of whether user still holds the NFT.
 */
export const hasWalletMintedFromCampaign = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const mint = await ctx.db
      .query("campaignMints")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("stakeAddress", args.stakeAddress)
      )
      .first();

    return {
      hasMinted: !!mint,
      mintDetails: mint
        ? {
            mintedAt: mint.mintedAt,
            nftNumber: mint.nftNumber,
            corporationNameAtMint: mint.corporationNameAtMint,
          }
        : null,
    };
  },
});

/**
 * Batch check mint status for multiple wallets in a campaign
 *
 * Used by admin Player Management to show claim status column.
 * Returns a map of stakeAddress -> { hasMinted, mintedAt }
 */
export const batchCheckMintStatus = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    stakeAddresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const result: Record<string, { hasMinted: boolean; mintedAt?: number; nftNumber?: number }> = {};

    for (const stakeAddress of args.stakeAddresses) {
      const mint = await ctx.db
        .query("campaignMints")
        .withIndex("by_campaign_and_wallet", (q) =>
          q.eq("campaignId", args.campaignId).eq("stakeAddress", stakeAddress)
        )
        .first();

      result[stakeAddress] = mint
        ? { hasMinted: true, mintedAt: mint.mintedAt, nftNumber: mint.nftNumber }
        : { hasMinted: false };
    }

    return result;
  },
});

// ============================================================================
// RECORDING MINTS (Called by webhook when sale completes)
// ============================================================================

/**
 * Record a new mint in the campaignMints table
 *
 * Called by the NMKR webhook when a sale is confirmed.
 * This creates the permanent record that prevents double-minting.
 */
export const recordMint = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    stakeAddress: v.string(),
    transactionHash: v.optional(v.string()),
    nftUid: v.string(),
    nftNumber: v.number(),
    corporationNameAtMint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for duplicate (idempotency)
    const existing = await ctx.db
      .query("campaignMints")
      .withIndex("by_campaign_and_wallet", (q) =>
        q.eq("campaignId", args.campaignId).eq("stakeAddress", args.stakeAddress)
      )
      .first();

    if (existing) {
      console.log("[CAMPAIGN_MINTS] Duplicate mint attempt blocked:", {
        campaign: args.campaignId,
        wallet: args.stakeAddress.substring(0, 20) + "...",
        existingNft: existing.nftNumber,
      });
      return {
        success: false,
        error: "Already minted from this campaign",
        existingMint: existing,
      };
    }

    // Also check by NFT UID to prevent same NFT being recorded twice
    const existingByNft = await ctx.db
      .query("campaignMints")
      .withIndex("by_nft_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    if (existingByNft) {
      console.log("[CAMPAIGN_MINTS] NFT already recorded:", args.nftUid);
      return {
        success: false,
        error: "This NFT has already been recorded as minted",
        existingMint: existingByNft,
      };
    }

    // Record the mint
    const mintId = await ctx.db.insert("campaignMints", {
      campaignId: args.campaignId,
      stakeAddress: args.stakeAddress,
      mintedAt: now,
      transactionHash: args.transactionHash,
      nftUid: args.nftUid,
      nftNumber: args.nftNumber,
      corporationNameAtMint: args.corporationNameAtMint,
      createdAt: now,
    });

    console.log("[CAMPAIGN_MINTS] Recorded mint:", {
      mintId,
      campaign: args.campaignId,
      wallet: args.stakeAddress.substring(0, 20) + "...",
      nftNumber: args.nftNumber,
    });

    return {
      success: true,
      mintId,
    };
  },
});

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/**
 * Get all mints for a campaign (admin view)
 */
export const getCampaignMints = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const mints = await ctx.db
      .query("campaignMints")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return mints;
  },
});

/**
 * Get mint statistics for a campaign
 */
export const getCampaignMintStats = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const mints = await ctx.db
      .query("campaignMints")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const uniqueWallets = new Set(mints.map((m) => m.stakeAddress)).size;

    return {
      totalMints: mints.length,
      uniqueWallets,
      mints: mints.map((m) => ({
        nftNumber: m.nftNumber,
        stakeAddress: m.stakeAddress,
        corporationName: m.corporationNameAtMint,
        mintedAt: m.mintedAt,
      })),
    };
  },
});

// ============================================================================
// MIGRATION HELPER (One-time use to backfill from Inventory.soldTo)
// ============================================================================

/**
 * Migrate existing sales from Inventory.soldTo to campaignMints
 *
 * This is a one-time migration function. Run it once to backfill
 * the campaignMints table with existing sales data from inventory.
 */
export const migrateFromInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    confirmationCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Safety check
    if (args.confirmationCode !== "MIGRATE_INVENTORY_TO_MINTS") {
      return {
        success: false,
        error: "Invalid confirmation code",
      };
    }

    // Get all sold inventory items for this campaign
    const soldItems = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_status", (q) =>
        q.eq("campaignId", args.campaignId).eq("status", "sold")
      )
      .collect();

    let migrated = 0;
    let skipped = 0;

    for (const item of soldItems) {
      if (!item.soldTo) {
        console.log("[MIGRATION] Skipping item without soldTo:", item.name);
        skipped++;
        continue;
      }

      // Check if already migrated
      const existing = await ctx.db
        .query("campaignMints")
        .withIndex("by_nft_uid", (q) => q.eq("nftUid", item.nftUid))
        .first();

      if (existing) {
        console.log("[MIGRATION] Already migrated:", item.name);
        skipped++;
        continue;
      }

      // Create mint record
      await ctx.db.insert("campaignMints", {
        campaignId: args.campaignId,
        stakeAddress: item.soldTo,
        mintedAt: item.soldAt || Date.now(),
        transactionHash: item.transactionHash,
        nftUid: item.nftUid,
        nftNumber: item.nftNumber,
        corporationNameAtMint: item.companyNameAtSale,
        createdAt: Date.now(),
      });

      migrated++;
      console.log("[MIGRATION] Migrated:", item.name, "->", item.soldTo.substring(0, 20) + "...");
    }

    return {
      success: true,
      migrated,
      skipped,
      total: soldItems.length,
    };
  },
});
