import { query } from "./_generated/server";

/**
 * Analyze variation coverage across all players with meks
 *
 * This query:
 * 1. Gets all users
 * 2. For each user with meks, retrieves all their meks
 * 3. Extracts headVariation, bodyVariation, and itemVariation from each mek
 * 4. Tallies unique variations (out of 291 total)
 * 5. Returns coverage statistics
 */
export const analyzeVariationCoverage = query({
  args: {},
  handler: async (ctx) => {
    // Step 1: Get all users
    const allUsers = await ctx.db.query("users").collect();

    console.log(`Total users: ${allUsers.length}`);

    // Step 2: Collect all variations across all users' meks
    const allVariations = new Set<string>();
    let totalMeks = 0;
    let meksWithMissingVariations = 0;

    const userBreakdown = [];

    for (const user of allUsers) {
      // Get all meks for this user
      const userMeks = await ctx.db
        .query("meks")
        .withIndex("by_owner", (q) => q.eq("owner", user.walletAddress))
        .collect();

      // Skip users with no meks
      if (userMeks.length === 0) {
        continue;
      }

      totalMeks += userMeks.length;

      // Extract variations from each mek
      const userVariations = new Set<string>();
      for (const mek of userMeks) {
        // Track head variation
        if (mek.headVariation) {
          allVariations.add(mek.headVariation);
          userVariations.add(mek.headVariation);
        } else {
          meksWithMissingVariations++;
        }

        // Track body variation
        if (mek.bodyVariation) {
          allVariations.add(mek.bodyVariation);
          userVariations.add(mek.bodyVariation);
        } else {
          meksWithMissingVariations++;
        }

        // Track item/trait variation
        if (mek.itemVariation) {
          allVariations.add(mek.itemVariation);
          userVariations.add(mek.itemVariation);
        }
        // Note: itemVariation is optional, so we don't count it as "missing"
      }

      userBreakdown.push({
        walletAddress: user.walletAddress,
        displayName: user.displayName || "Unknown",
        mekCount: userMeks.length,
        uniqueVariations: userVariations.size,
      });
    }

    console.log(`Users with meks: ${userBreakdown.length}`);

    // Step 3: Calculate statistics
    const uniqueVariationCount = allVariations.size;
    const coveragePercentage = ((uniqueVariationCount / 291) * 100).toFixed(2);

    // Sort user breakdown by mek count (descending)
    userBreakdown.sort((a, b) => b.mekCount - a.mekCount);

    return {
      summary: {
        totalVerifiedPlayers: userBreakdown.length,
        totalMeks,
        uniqueVariationsFound: uniqueVariationCount,
        totalVariationsPossible: 291,
        coveragePercentage: `${coveragePercentage}%`,
        missingVariations: 291 - uniqueVariationCount,
        meksWithMissingVariations,
      },
      userBreakdown,
      variationList: Array.from(allVariations).sort(),
    };
  },
});
