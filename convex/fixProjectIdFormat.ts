import { mutation } from "./_generated/server";

/**
 * Fix: Add hyphens to project ID (NMKR API expects standard UUID format)
 *
 * NMKR API requires UUIDs with hyphens: c68dc0e9-b2ca-4e0e-b9c4-a57ef85a794d
 * Not without hyphens: c68dc0e9b2ca4e0eb9c4a57ef85a794d
 */
export const addHyphensToProjectId = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the Lab Rat Collection campaign
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("name"), "Lab Rat Collection"))
      .collect();

    if (campaigns.length === 0) {
      return { success: false, error: "Campaign not found" };
    }

    const campaign = campaigns[0];
    const currentId = campaign.nmkrProjectId;

    // Add hyphens in UUID format: 8-4-4-4-12
    const withHyphens = "c68dc0e9-b2ca-4e0e-b9c4-a57ef85a794d";

    console.log("[FIX] Current project ID:", currentId);
    console.log("[FIX] UUID with hyphens:", withHyphens);

    // Update the campaign
    await ctx.db.patch(campaign._id, {
      nmkrProjectId: withHyphens,
      updatedAt: Date.now(),
    });

    console.log("[FIX] ✅ Updated project ID to include hyphens");

    return {
      success: true,
      oldValue: currentId,
      newValue: withHyphens,
    };
  },
});
