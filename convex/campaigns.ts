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

// Delete campaign (and all its inventory)
export const deleteCampaign = mutation({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    // Delete the campaign
    await ctx.db.delete(args.campaignId);

    // Note: In production, you might want to also delete associated inventory
    // and reservations, or implement soft deletes

    console.log("[CAMPAIGNS] Deleted campaign:", args.campaignId);

    return {
      success: true,
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

    // Count inventory items for this campaign
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .filter((q) => q.eq(q.field("projectId"), campaign.nmkrProjectId))
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
