import { mutation } from "./_generated/server";

/**
 * ONE-TIME MIGRATION: Add imageUrl to existing phase cards
 * Run this once to populate the 4 existing phase cards with image URLs
 */
export const addImageUrlsToPhaseCards = mutation({
  args: {},
  handler: async (ctx) => {
    const phases = await ctx.db
      .query("phaseCards")
      .withIndex("by_order")
      .order("asc")
      .collect();

    if (phases.length !== 4) {
      return {
        success: false,
        message: `Expected 4 phase cards, found ${phases.length}. Migration aborted.`,
      };
    }

    // Image URLs for the 4 phases
    const imageUrls = [
      "/mek-images/50px/bi1-cb1-nm1.webp", // Phase 1
      "/mek-images/50px/ae1-cd-nm1.webp",  // Phase 2
      "/mek-images/50px/c11-bj1-nm1.webp", // Phase 3
      "/mek-images/50px/ni1-at4-j2.webp",  // Phase 4
    ];

    const now = Date.now();
    const updates = [];

    for (let i = 0; i < phases.length; i++) {
      await ctx.db.patch(phases[i]._id, {
        imageUrl: imageUrls[i],
        updatedAt: now,
      });
      updates.push({
        title: phases[i].title,
        imageUrl: imageUrls[i],
      });
    }

    return {
      success: true,
      message: "Successfully added image URLs to 4 phase cards",
      updates,
    };
  },
});
