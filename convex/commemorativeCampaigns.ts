import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Commemorative Campaign Management System
 *
 * This system manages multiple concurrent commemorative NFT campaigns.
 * Each campaign is independent with its own:
 * - NFT inventory (#1-#N numbering per campaign)
 * - Reservation system
 * - NMKR project configuration
 * - Active/inactive status
 *
 * Example campaigns:
 * - "Lab Rat" (original 10 NFTs)
 * - "Pilot Program" (future 20 NFTs)
 * - "Founder's Edition" (future 50 NFTs)
 */

// ============================================================================
// CAMPAIGN LIFECYCLE MUTATIONS
// ============================================================================

/**
 * Create a new commemorative NFT campaign
 *
 * This sets up the campaign metadata but does NOT create inventory.
 * After creating campaign, use populateCampaignInventory to add NFTs.
 */
export const createCampaign = mutation({
  args: {
    name: v.string(), // Display name (e.g., "Lab Rat", "Pilot Program")
    description: v.string(), // Campaign description for users
    nmkrProjectId: v.string(), // NMKR project ID for this campaign
    maxNFTs: v.number(), // Total NFTs in this campaign (e.g., 10, 20, 50)
    startDate: v.optional(v.number()), // When campaign becomes claimable (timestamp)
    endDate: v.optional(v.number()), // When campaign closes (timestamp)
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    console.log('[CAMPAIGN] Creating new campaign:', args.name);

    // Check if campaign with this name already exists
    const existing = await ctx.db
      .query("commemorativeCampaigns")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .first();

    if (existing) {
      console.log('[CAMPAIGN] Campaign already exists:', args.name);
      return {
        success: false,
        error: `Campaign "${args.name}" already exists`,
      };
    }

    // Create the campaign
    const campaignId = await ctx.db.insert("commemorativeCampaigns", {
      name: args.name,
      description: args.description,
      nmkrProjectId: args.nmkrProjectId,
      status: "inactive", // Start inactive until inventory is populated
      maxNFTs: args.maxNFTs,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
      // Initialize counters
      totalNFTs: 0,
      availableNFTs: 0,
      reservedNFTs: 0,
      soldNFTs: 0,
    });

    console.log('[CAMPAIGN] Created campaign:', campaignId, args.name);

    return {
      success: true,
      campaignId,
    };
  },
});

/**
 * Activate a campaign (make it claimable by users)
 */
export const activateCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Verify campaign has inventory before activating
    if (campaign.totalNFTs === 0) {
      return {
        success: false,
        error: "Cannot activate campaign with no NFTs. Populate inventory first.",
      };
    }

    await ctx.db.patch(args.campaignId, {
      status: "active",
      updatedAt: Date.now(),
    });

    console.log('[CAMPAIGN] Activated campaign:', campaign.name);

    return { success: true };
  },
});

/**
 * Deactivate a campaign (stop new claims, existing reservations still valid)
 */
export const deactivateCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    await ctx.db.patch(args.campaignId, {
      status: "inactive",
      updatedAt: Date.now(),
    });

    console.log('[CAMPAIGN] Deactivated campaign:', campaign.name);

    return { success: true };
  },
});

/**
 * Update campaign details (name, description, dates)
 */
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    nmkrProjectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.nmkrProjectId !== undefined) updates.nmkrProjectId = args.nmkrProjectId;

    await ctx.db.patch(args.campaignId, updates);

    console.log('[CAMPAIGN] Updated campaign:', campaign.name, updates);

    return { success: true };
  },
});

// ============================================================================
// CAMPAIGN INVENTORY MANAGEMENT
// ============================================================================

/**
 * Populate campaign inventory with NFTs from NMKR
 *
 * This is equivalent to populateInventoryManually but campaign-scoped.
 * Call this after creating a campaign to add its NFTs.
 */
export const populateCampaignInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nfts: v.array(
      v.object({
        nftUid: v.string(), // NMKR NFT UID
        nftNumber: v.number(), // Campaign-scoped number (1-N)
        name: v.string(), // Display name (e.g., "Lab Rat #1")
        imageUrl: v.optional(v.string()), // IPFS image URL from NMKR (auto-populated)
      })
    ),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[CAMPAIGN] Populating inventory for:', campaign.name, 'with', args.nfts.length, 'NFTs');

    // Check if this campaign already has inventory
    const existingInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    if (existingInventory.length > 0) {
      return {
        success: false,
        error: `Campaign already has ${existingInventory.length} NFTs. Use clearCampaignInventory() first to reset.`,
      };
    }

    // Verify NFT count matches campaign maxNFTs
    if (args.nfts.length > campaign.maxNFTs) {
      return {
        success: false,
        error: `Cannot add ${args.nfts.length} NFTs. Campaign max is ${campaign.maxNFTs}.`,
      };
    }

    const now = Date.now();
    const nmkrNetwork = process.env.NEXT_PUBLIC_NMKR_NETWORK || "mainnet";
    const basePaymentUrl = nmkrNetwork === "mainnet"
      ? "https://pay.nmkr.io"
      : "https://pay.preprod.nmkr.io";

    // Insert all NFTs with campaignId
    for (const nft of args.nfts) {
      const paymentUrl = `${basePaymentUrl}/?p=${campaign.nmkrProjectId}&n=${nft.nftUid}`;

      await ctx.db.insert("commemorativeNFTInventory", {
        campaignId: args.campaignId, // Link to campaign
        nftUid: nft.nftUid,
        nftNumber: nft.nftNumber,
        name: nft.name,
        status: "available",
        projectId: campaign.nmkrProjectId,
        paymentUrl,
        imageUrl: nft.imageUrl, // Include IPFS image URL if provided
        createdAt: now,
      });

      console.log('[CAMPAIGN] Added to', campaign.name, ':', nft.name, 'UID:', nft.nftUid, nft.imageUrl ? '(with image)' : '(no image)');
    }

    // Update campaign counters
    await ctx.db.patch(args.campaignId, {
      totalNFTs: args.nfts.length,
      availableNFTs: args.nfts.length,
      updatedAt: now,
    });

    console.log('[CAMPAIGN] Successfully populated', campaign.name, 'with', args.nfts.length, 'NFTs');

    return {
      success: true,
      count: args.nfts.length,
    };
  },
});

/**
 * Clear campaign inventory (use with caution!)
 * Only affects this campaign's NFTs and reservations.
 */
export const clearCampaignInventory = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    console.log('[CAMPAIGN] Clearing inventory for:', campaign.name);

    // Delete all inventory for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const item of inventory) {
      await ctx.db.delete(item._id);
    }

    console.log('[CAMPAIGN] Deleted', inventory.length, 'inventory items');

    // Delete all reservations for this campaign
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const reservation of reservations) {
      await ctx.db.delete(reservation._id);
    }

    console.log('[CAMPAIGN] Deleted', reservations.length, 'reservations');

    // Reset campaign counters
    await ctx.db.patch(args.campaignId, {
      totalNFTs: 0,
      availableNFTs: 0,
      reservedNFTs: 0,
      soldNFTs: 0,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      deletedInventory: inventory.length,
      deletedReservations: reservations.length,
    };
  },
});

// ============================================================================
// CAMPAIGN STATISTICS & QUERIES
// ============================================================================

/**
 * Get statistics for a specific campaign
 */
export const getCampaignStats = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      return null;
    }

    // Real-time count from inventory (counters are for quick reference)
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    const stats = {
      total: inventory.length,
      available: inventory.filter((i) => i.status?.toLowerCase() === "available").length,
      reserved: inventory.filter((i) => i.status?.toLowerCase() === "reserved").length,
      sold: inventory.filter((i) => i.status?.toLowerCase() === "sold").length,
    };

    return {
      ...campaign,
      stats,
    };
  },
});

/**
 * List all campaigns (active and inactive)
 */
export const listAllCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .order("desc") // Newest first
      .collect();

    return campaigns;
  },
});

/**
 * List only active campaigns (currently claimable)
 */
export const listActiveCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    return campaigns;
  },
});

/**
 * Get campaign by ID
 */
export const getCampaignById = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

/**
 * Get campaign by name (useful for frontend routing)
 */
export const getCampaignByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db
      .query("commemorativeCampaigns")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .first();

    return campaign;
  },
});

/**
 * Get available NFT count for campaign (quick query for UI)
 */
export const getCampaignAvailableCount = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign_and_status", (q: any) =>
        q.eq("campaignId", args.campaignId).eq("status", "available")
      )
      .collect();

    return inventory.length;
  },
});

/**
 * Check if user has already claimed from this campaign
 */
export const hasUserClaimedFromCampaign = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Check completed reservations
    const completedReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign_and_wallet", (q: any) =>
        q.eq("campaignId", args.campaignId).eq("reservedBy", args.walletAddress)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    return !!completedReservation;
  },
});

/**
 * Get user's claim history across all campaigns
 */
export const getUserClaimHistory = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const completedReservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_wallet_and_status", (q: any) =>
        q.eq("reservedBy", args.walletAddress).eq("status", "completed")
      )
      .collect();

    // Enrich with campaign details
    const history = await Promise.all(
      completedReservations.map(async (reservation) => {
        const campaign = reservation.campaignId
          ? await ctx.db.get(reservation.campaignId)
          : null;

        return {
          ...reservation,
          campaignName: campaign?.name || "Unknown Campaign",
          campaignDescription: campaign?.description || "",
        };
      })
    );

    return history;
  },
});

// ============================================================================
// COUNTER SYNCHRONIZATION (Internal Helpers)
// ============================================================================

/**
 * Get detailed NFT inventory for a campaign
 *
 * Returns all NFTs with their status, UID, payment URL, and image URL
 */
export const getCampaignInventory = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    // Note: No logging here - this query polls every 3 seconds
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .order("asc")
      .collect();

    // Sort by nftNumber to ensure correct ordering
    return inventory.sort((a, b) => a.nftNumber - b.nftNumber);
  },
});

/**
 * Look up current company names for wallet addresses
 * Used to compare with historical names to detect name changes
 */
export const getCompanyNamesForWallets = query({
  args: {
    walletAddresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[🏢CORP-LOOKUP] getCompanyNamesForWallets called with:', args.walletAddresses.length, 'addresses');

    const results: Record<string, string | null> = {};

    for (const walletAddress of args.walletAddresses) {
      if (!walletAddress) continue;

      const goldMiningRecord = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
        .first();

      results[walletAddress] = goldMiningRecord?.companyName || null;

      console.log('[🏢CORP-LOOKUP] Wallet:', walletAddress.substring(0, 12) + '... →', goldMiningRecord?.companyName || 'NO CORP');
    }

    console.log('[🏢CORP-LOOKUP] Returning results:', results);
    return results;
  },
});

/**
 * Batch update image URLs for multiple NFTs
 *
 * Allows assigning one image to multiple NFTs at once.
 * Useful for bulk artwork management.
 */
export const batchUpdateNFTImages = mutation({
  args: {
    nftIds: v.array(v.id("commemorativeNFTInventory")),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[CAMPAIGN] Batch updating', args.nftIds.length, 'NFT images');

    let updated = 0;
    for (const nftId of args.nftIds) {
      const nft = await ctx.db.get(nftId);

      if (nft) {
        await ctx.db.patch(nftId, {
          imageUrl: args.imageUrl,
        });
        updated++;
        console.log('[CAMPAIGN] Updated image for:', nft.name);
      }
    }

    console.log('[CAMPAIGN] Successfully updated', updated, 'NFT images');

    return {
      success: true,
      updated,
    };
  },
});

/**
 * Backfill inventory images from NMKR
 *
 * Takes an array of {nftUid, imageUrl} pairs from NMKR API
 * and updates matching inventory records.
 */
export const backfillInventoryImages = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    images: v.array(
      v.object({
        nftUid: v.string(),
        imageUrl: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log('[CAMPAIGN] Backfilling images for campaign:', args.campaignId);
    console.log('[CAMPAIGN] Received', args.images.length, 'images from NMKR');

    // Get all inventory for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    // Create a map for quick lookup
    const imageMap = new Map(args.images.map((img: any) => [img.nftUid, img.imageUrl]));

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const nft of inventory) {
      const imageUrl = imageMap.get(nft.nftUid);

      if (!imageUrl) {
        notFound++;
        continue;
      }

      // Skip if already has the same image
      if (nft.imageUrl === imageUrl) {
        skipped++;
        continue;
      }

      await ctx.db.patch(nft._id, { imageUrl });
      updated++;
      console.log('[CAMPAIGN] Updated image for:', nft.name);
    }

    console.log('[CAMPAIGN] Backfill complete:', { updated, skipped, notFound });

    return {
      success: true,
      updated,
      skipped,
      notFound,
      total: inventory.length,
    };
  },
});

/**
 * Backfill soldTo and companyNameAtSale for NFTs that were sold before these fields existed
 *
 * Looks up the completed reservation record to find the wallet address,
 * then looks up the current company name for that wallet.
 */
export const backfillSoldNFTData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[BACKFILL] Starting backfill of sold NFT data...');

    // Find all sold NFTs that are missing soldTo
    const soldNFTs = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "sold"),
          q.eq(q.field("soldTo"), undefined)
        )
      )
      .collect();

    console.log('[BACKFILL] Found', soldNFTs.length, 'sold NFTs missing soldTo');

    let backfilled = 0;
    let notFound = 0;

    for (const nft of soldNFTs) {
      // Try to find the completed reservation for this NFT
      // Check both legacy and campaign reservation tables

      // Try to find completed reservations
      let reservation = await ctx.db
        .query("commemorativeNFTReservations")
        .filter((q) =>
          q.and(
            q.eq(q.field("nftInventoryId"), nft._id),
            q.eq(q.field("status"), "completed")
          )
        )
        .first();

      // If still not found, try ANY reservation for this NFT (maybe sale was completed externally)
      if (!reservation) {
        reservation = await ctx.db
          .query("commemorativeNFTReservations")
          .filter((q) => q.eq(q.field("nftInventoryId"), nft._id))
          .order("desc")
          .first();
      }

      if (reservation && reservation.reservedBy) {
        const walletAddress = reservation.reservedBy;

        // Look up company name
        const goldMiningRecord = await ctx.db
          .query("goldMining")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
          .first();

        const companyNameAtSale = goldMiningRecord?.companyName || undefined;

        // Update the NFT with the backfilled data
        await ctx.db.patch(nft._id, {
          soldTo: walletAddress,
          soldAt: reservation.completedAt || reservation.reservedAt || Date.now(),
          companyNameAtSale,
        });

        console.log('[BACKFILL] Updated', nft.name, '- wallet:', walletAddress.substring(0, 12) + '...', '- corp:', companyNameAtSale || 'none');
        backfilled++;
      } else {
        console.log('[BACKFILL] No reservation found for:', nft.name);
        notFound++;
      }
    }

    console.log('[BACKFILL] Complete:', backfilled, 'backfilled,', notFound, 'not found');

    return {
      success: true,
      backfilled,
      notFound,
      total: soldNFTs.length,
    };
  },
});

/**
 * Debug query to see all reservations
 */
export const debugReservations = query({
  args: {},
  handler: async (ctx) => {
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .collect();

    return {
      reservations: reservations.map((r: any) => ({
        nftInventoryId: r.nftInventoryId,
        nftNumber: r.nftNumber,
        status: r.status,
        reservedBy: r.reservedBy,
      })),
    };
  },
});

/**
 * Manually set soldTo for an NFT (admin use)
 */
export const manuallySetSoldTo = mutation({
  args: {
    nftId: v.id("commemorativeNFTInventory"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const nft = await ctx.db.get(args.nftId);
    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Look up company name
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    const companyNameAtSale = goldMiningRecord?.companyName || undefined;

    await ctx.db.patch(args.nftId, {
      soldTo: args.walletAddress,
      soldAt: nft.soldAt || Date.now(),
      companyNameAtSale,
    });

    console.log('[MANUAL] Set soldTo for', nft.name, 'to', args.walletAddress.substring(0, 12) + '...', '- corp:', companyNameAtSale || 'none');

    return {
      success: true,
      nftName: nft.name,
      walletAddress: args.walletAddress,
      companyName: companyNameAtSale || null,
    };
  },
});

/**
 * Update NFT status by UID (used by sync system)
 */
export const updateNFTStatus = mutation({
  args: {
    nftUid: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("sold")
    ),
  },
  handler: async (ctx, args) => {
    console.log('[🔄SYNC-MUTATION] === updateNFTStatus called ===');
    console.log('[🔄SYNC-MUTATION] Args:', { nftUid: args.nftUid, status: args.status });

    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    console.log('[🔄SYNC-MUTATION] NFT found in DB:', nft ? 'YES' : 'NO');
    if (nft) {
      console.log('[🔄SYNC-MUTATION] NFT details:', {
        id: nft._id,
        name: nft.name,
        currentStatus: nft.status,
        targetStatus: args.status,
      });
    }

    if (!nft) {
      console.error('[🔄SYNC-MUTATION] ❌ NFT not found in database!');
      throw new Error(`NFT not found: ${args.nftUid}`);
    }

    console.log('[🔄SYNC-MUTATION] 🔧 Patching database record...');
    await ctx.db.patch(nft._id, {
      status: args.status,
    });

    console.log('[🔄SYNC-MUTATION] ✅ Database patch completed');
    console.log('[🔄SYNC-MUTATION] Updated NFT status:', nft.name, nft.status, '→', args.status);

    // Verify the update actually stuck
    const updatedNft = await ctx.db.get(nft._id);
    console.log('[🔄SYNC-MUTATION] 🔍 Post-update verification:', {
      id: updatedNft?._id,
      name: updatedNft?.name,
      status: updatedNft?.status,
      expectedStatus: args.status,
      statusMatch: updatedNft?.status === args.status,
    });

    if (updatedNft?.status !== args.status) {
      console.error('[🔄SYNC-MUTATION] ❌❌❌ UPDATE DID NOT PERSIST! Status is still:', updatedNft?.status);
      throw new Error(`Update failed to persist. Expected ${args.status}, got ${updatedNft?.status}`);
    }

    console.log('[🔄SYNC-MUTATION] ✅ Update verified and persisted successfully');
    return { success: true };
  },
});

/**
 * Update campaign counters based on actual inventory counts
 *
 * Called internally after inventory changes to keep counters in sync.
 * Also exposed as mutation for manual sync if needed.
 */
export const syncCampaignCounters = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    const counters = {
      totalNFTs: inventory.length,
      availableNFTs: inventory.filter((i) => i.status?.toLowerCase() === "available").length,
      reservedNFTs: inventory.filter((i) => i.status?.toLowerCase() === "reserved").length,
      soldNFTs: inventory.filter((i) => i.status?.toLowerCase() === "sold").length,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.campaignId, counters);

    console.log('[CAMPAIGN] Synced counters for campaign:', args.campaignId, counters);

    return { success: true, counters };
  },
});

// ============================================================================
// SYNC-RELATED QUERIES AND MUTATIONS
// ============================================================================
// Note: getCampaignById and updateNFTStatus are already defined above

// ============================================================================
// ADMIN / DIAGNOSTICS QUERIES
// ============================================================================

/**
 * Get all campaigns (for admin tools)
 */
export const getAllCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db.query("commemorativeCampaigns").collect();
  },
});

/**
 * Get all inventory items across all campaigns (for diagnostics)
 */
export const getAllInventoryForDiagnostics = query({
  handler: async (ctx) => {
    return await ctx.db.query("commemorativeNFTInventory").collect();
  },
});

/**
 * Link orphaned NFTs to a campaign
 * Use this to fix NFTs that have no campaignId
 */
export const linkOrphanedNFTsToCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    nftUids: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[🔧FIX] Linking orphaned NFTs to campaign:', args.campaignId);
    console.log('[🔧FIX] NFT UIDs:', args.nftUids);

    let linked = 0;
    let notFound = 0;
    let alreadyLinked = 0;

    for (const nftUid of args.nftUids) {
      const nft = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_uid", (q: any) => q.eq("nftUid", nftUid))
        .first();

      if (!nft) {
        console.log('[🔧FIX] ❌ NFT not found:', nftUid);
        notFound++;
        continue;
      }

      if (nft.campaignId) {
        console.log('[🔧FIX] ⚠️ NFT already linked to campaign:', nft.name, nft.campaignId);
        alreadyLinked++;
        continue;
      }

      await ctx.db.patch(nft._id, {
        campaignId: args.campaignId,
      });

      linked++;
      console.log('[🔧FIX] ✅ Linked NFT to campaign:', nft.name);
    }

    console.log('[🔧FIX] Summary - Linked:', linked, 'Already linked:', alreadyLinked, 'Not found:', notFound);

    // Refresh campaign counters
    await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    return {
      success: true,
      linked,
      alreadyLinked,
      notFound,
    };
  },
});

/**
 * Detailed diagnostic query for a specific NFT by UID
 * Use this to debug status persistence issues
 */
export const diagnoseNFTByUid = query({
  args: {
    nftUid: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[🔍DIAGNOSE] Querying NFT with UID:', args.nftUid);

    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q: any) => q.eq("nftUid", args.nftUid))
      .first();

    if (!nft) {
      console.log('[🔍DIAGNOSE] ❌ NFT not found in database');
      return { found: false, nftUid: args.nftUid };
    }

    console.log('[🔍DIAGNOSE] ✅ NFT found:', {
      id: nft._id,
      name: nft.name,
      nftNumber: nft.nftNumber,
      status: nft.status,
      campaignId: nft.campaignId,
      creationTime: nft._creationTime,
    });

    // Also get the campaign info (handle undefined campaignId)
    const campaign = nft.campaignId ? await ctx.db.get(nft.campaignId) : null;

    return {
      found: true,
      nft: {
        _id: nft._id,
        nftUid: nft.nftUid,
        name: nft.name,
        nftNumber: nft.nftNumber,
        status: nft.status,
        campaignId: nft.campaignId,
        creationTime: nft._creationTime,
      },
      campaign: campaign ? {
        _id: campaign._id,
        name: campaign.name,
        availableNFTs: campaign.availableNFTs,
        reservedNFTs: campaign.reservedNFTs,
        soldNFTs: campaign.soldNFTs,
      } : null,
    };
  },
});

// ============================================================================
// DUPLICATE DETECTION AND CLEANUP
// ============================================================================

/**
 * Analyze inventory for duplicate NFT records
 *
 * Returns detailed comparison of all NFTs grouped by name to identify duplicates.
 * Use this before running cleanup to understand what duplicates exist.
 */
export const analyzeDuplicateNFTs = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    console.log('[🔍ANALYZE] Analyzing duplicates for campaign:', args.campaignId);

    const allRecords = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log('[🔍ANALYZE] Total records found:', allRecords.length);

    // Group by nftUid to find duplicates
    const groupedByUid: Record<string, typeof allRecords> = {};
    for (const record of allRecords) {
      if (!groupedByUid[record.nftUid]) {
        groupedByUid[record.nftUid] = [];
      }
      groupedByUid[record.nftUid].push(record);
    }

    // Also group by name for analysis
    const groupedByName: Record<string, typeof allRecords> = {};
    for (const record of allRecords) {
      if (!groupedByName[record.name]) {
        groupedByName[record.name] = [];
      }
      groupedByName[record.name].push(record);
    }

    // Find duplicates
    const duplicatesByUid = Object.entries(groupedByUid)
      .filter(([_, records]) => records.length > 1)
      .map(([uid, records]) => ({
        nftUid: uid,
        count: records.length,
        records: records.map((r: any) => ({
          _id: r._id,
          name: r.name,
          nftNumber: r.nftNumber,
          status: r.status,
          hasImage: !!r.imageUrl,
          _creationTime: r._creationTime,
          createdAt: r.createdAt,
        }))
      }));

    const duplicatesByName = Object.entries(groupedByName)
      .filter(([_, records]) => records.length > 1)
      .map(([name, records]) => ({
        name: name,
        count: records.length,
        records: records.map((r: any) => ({
          _id: r._id,
          nftUid: r.nftUid,
          nftNumber: r.nftNumber,
          status: r.status,
          hasImage: !!r.imageUrl,
          _creationTime: r._creationTime,
          createdAt: r.createdAt,
        }))
      }));

    // Detailed breakdown of all records
    const allRecordsDetails = allRecords.map((r: any) => ({
      _id: r._id,
      name: r.name,
      nftUid: r.nftUid,
      nftNumber: r.nftNumber,
      status: r.status,
      hasImage: !!r.imageUrl,
      imageUrl: r.imageUrl?.substring(0, 50) + '...' || null,
      _creationTime: r._creationTime,
      createdAt: r.createdAt,
      projectId: r.projectId,
    }));

    console.log('[🔍ANALYZE] Duplicates by UID:', duplicatesByUid.length);
    console.log('[🔍ANALYZE] Duplicates by name:', duplicatesByName.length);

    return {
      totalRecords: allRecords.length,
      duplicatesByUid,
      duplicatesByName,
      allRecordsDetails,
      summary: {
        hasDuplicates: duplicatesByUid.length > 0 || duplicatesByName.length > 0,
        duplicateUidCount: duplicatesByUid.length,
        duplicateNameCount: duplicatesByName.length,
      }
    };
  },
});

/**
 * Clean up duplicate NFT records (SAFE VERSION - preserves "sold" status)
 *
 * Strategy:
 * 1. For records with same nftUid, keep the "best" one based on priority:
 *    - Has imageUrl (populated from NMKR) = highest priority
 *    - Has "sold" status = second priority
 *    - Newest record (_creationTime) = third priority
 * 2. BEFORE deleting, transfer "sold" status from any duplicate to the kept record
 * 3. Delete all other duplicates
 * 4. Return summary of what was deleted
 *
 * IMPORTANT: This mutation is DESTRUCTIVE. Run analyzeDuplicateNFTs first!
 */
export const cleanupDuplicateNFTs = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    dryRun: v.optional(v.boolean()), // If true, don't actually delete (just report what would be deleted)
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;

    console.log('[🧹CLEANUP] Starting cleanup for campaign:', args.campaignId);
    console.log('[🧹CLEANUP] Dry run mode:', dryRun);

    const allRecords = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log('[🧹CLEANUP] Total records found:', allRecords.length);

    // Group by nftUid
    const groupedByUid: Record<string, typeof allRecords> = {};
    for (const record of allRecords) {
      if (!groupedByUid[record.nftUid]) {
        groupedByUid[record.nftUid] = [];
      }
      groupedByUid[record.nftUid].push(record);
    }

    let totalDeleted = 0;
    let statusTransfers = 0;
    const deletionLog: Array<{
      nftUid: string;
      name: string;
      keptRecordId: string;
      deletedRecordIds: string[];
      statusTransferred: boolean;
      reason: string;
    }> = [];

    // Process each group
    for (const [nftUid, records] of Object.entries(groupedByUid)) {
      if (records.length <= 1) {
        // No duplicates, skip
        continue;
      }

      console.log('[🧹CLEANUP] Found', records.length, 'records for UID:', nftUid);

      // Sort records by priority:
      // 1. Has imageUrl (1 = yes, 0 = no)
      // 2. Status is "sold" (1 = yes, 0 = no)
      // 3. Newest _creationTime (higher = newer)
      const sorted = records.sort((a, b) => {
        const aScore = (a.imageUrl ? 100 : 0) + (a.status === "sold" ? 10 : 0);
        const bScore = (b.imageUrl ? 100 : 0) + (b.status === "sold" ? 10 : 0);

        if (aScore !== bScore) return bScore - aScore; // Higher score first
        return b._creationTime - a._creationTime; // Newer first
      });

      const keepRecord = sorted[0];
      const deleteRecords = sorted.slice(1);

      // CRITICAL FIX: Check if any duplicate has "sold" status but the kept record doesn't
      const hasSoldDuplicate = deleteRecords.some((r: any) => r.status === "sold");
      const needsStatusTransfer = hasSoldDuplicate && keepRecord.status !== "sold";

      if (needsStatusTransfer) {
        console.log('[🧹CLEANUP] ⚠️  TRANSFERRING "sold" status to kept record');
        if (!dryRun) {
          await ctx.db.patch(keepRecord._id, { status: "sold" });
        }
        statusTransfers++;
      }

      console.log('[🧹CLEANUP] Keeping record:', keepRecord._id, keepRecord.name, {
        hasImage: !!keepRecord.imageUrl,
        status: needsStatusTransfer ? "sold (transferred)" : keepRecord.status,
      });

      const deletedIds: string[] = [];
      for (const record of deleteRecords) {
        console.log('[🧹CLEANUP] Deleting record:', record._id, record.name, {
          hasImage: !!record.imageUrl,
          status: record.status,
        });

        if (!dryRun) {
          await ctx.db.delete(record._id);
        }

        deletedIds.push(record._id);
        totalDeleted++;
      }

      deletionLog.push({
        nftUid,
        name: keepRecord.name,
        keptRecordId: keepRecord._id,
        deletedRecordIds: deletedIds,
        statusTransferred: needsStatusTransfer,
        reason: `Kept: ${keepRecord.imageUrl ? 'has image' : 'no image'}, status=${needsStatusTransfer ? 'sold (transferred)' : keepRecord.status}`,
      });
    }

    // Update campaign counters after cleanup (only if not dry run)
    if (!dryRun && totalDeleted > 0) {
      const remainingInventory = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
        .collect();

      await ctx.db.patch(args.campaignId, {
        totalNFTs: remainingInventory.length,
        availableNFTs: remainingInventory.filter((i) => i.status?.toLowerCase() === "available").length,
        reservedNFTs: remainingInventory.filter((i) => i.status?.toLowerCase() === "reserved").length,
        soldNFTs: remainingInventory.filter((i) => i.status?.toLowerCase() === "sold").length,
        updatedAt: Date.now(),
      });
    }

    console.log('[🧹CLEANUP] Cleanup complete. Deleted:', totalDeleted, 'records');
    console.log('[🧹CLEANUP] Status transfers:', statusTransfers);

    return {
      success: true,
      dryRun,
      totalDeleted,
      statusTransfers,
      deletionLog,
      message: dryRun
        ? `Dry run: Would delete ${totalDeleted} duplicates and transfer ${statusTransfers} sold statuses`
        : `Deleted ${totalDeleted} duplicates and transferred ${statusTransfers} sold statuses successfully`,
    };
  },
});

/**
 * Fix payment URLs for a campaign's NFT inventory
 * Use this to correct wrong NMKR project IDs in payment URLs
 */
export const fixPaymentUrls = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const correctProjectId = campaign.nmkrProjectId;
    const basePaymentUrl = "https://pay.nmkr.io";

    console.log('[FIX-URLS] Fixing payment URLs for campaign:', campaign.name);
    console.log('[FIX-URLS] Correct NMKR Project ID:', correctProjectId);

    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    let fixedCount = 0;
    for (const nft of inventory) {
      const correctPaymentUrl = `${basePaymentUrl}/?p=${correctProjectId}&n=${nft.nftUid}`;

      if (nft.paymentUrl !== correctPaymentUrl || nft.projectId !== correctProjectId) {
        console.log('[FIX-URLS] Fixing', nft.name);
        console.log('[FIX-URLS]   Old URL:', nft.paymentUrl);
        console.log('[FIX-URLS]   New URL:', correctPaymentUrl);

        await ctx.db.patch(nft._id, {
          projectId: correctProjectId,
          paymentUrl: correctPaymentUrl,
        });
        fixedCount++;
      }
    }

    console.log('[FIX-URLS] Fixed', fixedCount, 'of', inventory.length, 'NFTs');

    return {
      success: true,
      fixedCount,
      totalNFTs: inventory.length,
      correctProjectId,
    };
  },
});
