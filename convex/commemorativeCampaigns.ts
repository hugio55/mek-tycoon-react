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
      .withIndex("by_name", (q) => q.eq("name", args.name))
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
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
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
        createdAt: now,
      });

      console.log('[CAMPAIGN] Added to', campaign.name, ':', nft.name, 'UID:', nft.nftUid);
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
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const item of inventory) {
      await ctx.db.delete(item._id);
    }

    console.log('[CAMPAIGN] Deleted', inventory.length, 'inventory items');

    // Delete all reservations for this campaign
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
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
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const stats = {
      total: inventory.length,
      available: inventory.filter((i) => i.status === "available").length,
      reserved: inventory.filter((i) => i.status === "reserved").length,
      sold: inventory.filter((i) => i.status === "sold").length,
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
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return campaigns;
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
      .withIndex("by_name", (q) => q.eq("name", args.name))
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
      .withIndex("by_campaign_and_status", (q) =>
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
      .withIndex("by_campaign_and_wallet", (q) =>
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
      .withIndex("by_wallet_and_status", (q) =>
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
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const counters = {
      totalNFTs: inventory.length,
      availableNFTs: inventory.filter((i) => i.status === "available").length,
      reservedNFTs: inventory.filter((i) => i.status === "reserved").length,
      soldNFTs: inventory.filter((i) => i.status === "sold").length,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.campaignId, counters);

    console.log('[CAMPAIGN] Synced counters for campaign:', args.campaignId, counters);

    return { success: true, counters };
  },
});
