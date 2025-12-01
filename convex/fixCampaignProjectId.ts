import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * ONE-TIME FIX: Update Lab Rat Collection campaign with correct NMKR project ID
 *
 * Run this mutation once to fix the typo in the project ID:
 * OLD (wrong): c68dc8e9b2ca4e0e09c4a57ef85a794d (has "8" instead of "0", missing "b")
 * NEW (correct): c68dc0e9-b2ca-4e0e-b9c4-a57ef85a794d (standard UUID format with hyphens)
 */
export const fixLabRatCampaignProjectId = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the Lab Rat Collection campaign
    const campaigns = await ctx.db
      .query("commemorativeCampaigns")
      .filter((q) => q.eq(q.field("name"), "Lab Rat Collection"))
      .collect();

    if (campaigns.length === 0) {
      console.log("[FIX] Lab Rat Collection campaign not found");
      return { success: false, error: "Campaign not found" };
    }

    const campaign = campaigns[0];
    const oldProjectId = campaign.nmkrProjectId;
    const correctProjectId = "c68dc0e9-b2ca-4e0e-b9c4-a57ef85a794d";

    console.log("[FIX] Found campaign:", campaign.name);
    console.log("[FIX] Current project ID:", oldProjectId);
    console.log("[FIX] Correct project ID:", correctProjectId);

    if (oldProjectId === correctProjectId) {
      console.log("[FIX] Project ID is already correct, no update needed");
      return { success: true, message: "Project ID already correct" };
    }

    // Update the campaign
    await ctx.db.patch(campaign._id, {
      nmkrProjectId: correctProjectId,
      updatedAt: Date.now(),
    });

    console.log("[FIX] ✅ Successfully updated project ID");
    console.log("[FIX] Old:", oldProjectId);
    console.log("[FIX] New:", correctProjectId);

    return {
      success: true,
      oldProjectId,
      newProjectId: correctProjectId,
      message: "Project ID updated successfully",
    };
  },
});
