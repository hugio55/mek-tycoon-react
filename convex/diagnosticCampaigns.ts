import { query } from "./_generated/server";

/**
 * Diagnostic query to check actual nmkrProjectId values in campaigns
 */
export const checkCampaignProjectIds = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .collect();

    return campaigns.map(campaign => ({
      _id: campaign._id,
      name: campaign.name,
      nmkrProjectId: campaign.nmkrProjectId,
      nmkrProjectIdLength: campaign.nmkrProjectId.length,
      nmkrProjectIdType: typeof campaign.nmkrProjectId,
      status: campaign.status,
    }));
  },
});
