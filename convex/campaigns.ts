import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Campaign Management Functions
 *
 * Handles creating, updating, and managing NFT campaigns.
 * Each campaign represents a distinct NFT collection with its own inventory.
 */

// Create a new campaign
export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    nmkrProjectId: v.string(),
    policyId: v.optional(v.string()),
    maxNFTs: v.number(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const campaignId = await ctx.db.insert("commemorativeCampaigns", {
      name: args.name,
      description: args.description,
      nmkrProjectId: args.nmkrProjectId,
      policyId: args.policyId,
      maxNFTs: args.maxNFTs,
      status: args.status || "inactive",
      totalNFTs: 0,
      availableNFTs: 0,
      reservedNFTs: 0,
      soldNFTs: 0,
      createdAt: now,
      updatedAt: now,
      startDate: args.startDate,
      endDate: args.endDate,
    });

    console.log("[CAMPAIGNS] Created campaign:", args.name);

    return {
      success: true,
      campaignId,
    };
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nmkrProjectId: v.optional(v.string()),
    policyId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive")
      )
    ),
    maxNFTs: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;

    await ctx.db.patch(campaignId, {
      ...updates,
      updatedAt: Date.now(),
    });

    console.log("[CAMPAIGNS] Updated campaign:", campaignId);

    return {
      success: true,
    };
  },
});

// Delete campaign (and all its inventory) - WITH CASCADE DELETE
export const deleteCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
    confirmCascadeDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get campaign info for logging
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // CASCADE DELETE: First delete all inventory records for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    console.log(`[CAMPAIGNS] Deleting campaign "${campaign.name}" (${args.campaignId})`);
    console.log(`[CAMPAIGNS] CASCADE DELETE: Found ${inventory.length} inventory records to delete`);

    // Safety check: If there are sold NFTs, require explicit confirmation
    const soldCount = inventory.filter(i => i.status === "sold").length;
    if (soldCount > 0 && !args.confirmCascadeDelete) {
      throw new Error(
        `SAFETY STOP: This campaign has ${soldCount} SOLD NFT(s). ` +
        `Deleting will remove sale records permanently. ` +
        `Pass confirmCascadeDelete: true to proceed.`
      );
    }

    // Delete all inventory records
    for (const item of inventory) {
      await ctx.db.delete(item._id);
    }
    console.log(`[CAMPAIGNS] Deleted ${inventory.length} inventory records`);

    // Also delete any reservations for this campaign
    const reservations = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const reservation of reservations) {
      await ctx.db.delete(reservation._id);
    }
    console.log(`[CAMPAIGNS] Deleted ${reservations.length} reservation records`);

    // Finally delete the campaign itself
    await ctx.db.delete(args.campaignId);

    console.log(`[CAMPAIGNS] Successfully deleted campaign "${campaign.name}" and all associated data`);

    return {
      success: true,
      deletedInventory: inventory.length,
      deletedReservations: reservations.length,
    };
  },
});

// Get all campaigns
export const getAllCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .order("desc")
      .collect();

    return campaigns;
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    return campaign;
  },
});

// Get active campaigns only
export const getActiveCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    return campaigns;
  },
});

// Update campaign stats (called when inventory changes)
export const updateCampaignStats = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Count inventory items for this campaign using indexed query
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const stats = {
      totalNFTs: inventory.length,
      availableNFTs: inventory.filter((i) => i.status === "available").length,
      reservedNFTs: inventory.filter((i) => i.status === "reserved").length,
      soldNFTs: inventory.filter((i) => i.status === "sold").length,
    };

    await ctx.db.patch(args.campaignId, {
      ...stats,
      updatedAt: Date.now(),
    });

    console.log("[CAMPAIGNS] Updated stats for campaign:", args.campaignId, stats);

    return {
      success: true,
      stats,
    };
  },
});
