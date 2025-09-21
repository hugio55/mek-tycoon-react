import { mutation } from "./_generated/server";

// Manually set attribute rarity based on the full 4000 mek collection data
export const setManualRarity = mutation({
  args: {},
  handler: async (ctx) => {
    // Based on the actual distribution from the full 4000 mek collection
    // These numbers would come from analyzing all 4000 meks

    // Example counts based on what appears to be the pattern:
    // Vampire: 129 appearances (44.48% when this mek's three variations are considered)
    // Exposed: 117 appearances (40.34% when this mek's three variations are considered)
    // Prickles: 44 appearances (15.17% when this mek's three variations are considered)

    const rarityData = {
      type: "singleton" as const,
      heads: {
        // You would need to fill in ALL head variations here
        "Exposed": { count: 117, appearanceRate: 117/4000 },
        // ... add all other heads
      },
      bodies: {
        // You would need to fill in ALL body variations here
        "Prickles": { count: 44, appearanceRate: 44/4000 },
        // ... add all other bodies
      },
      traits: {
        // You would need to fill in ALL trait variations here
        "Vampire": { count: 129, appearanceRate: 129/4000 },
        // ... add all other traits
      },
      totalMeks: 4000,
      lastUpdated: Date.now(),
      version: 2,
    };

    // Check if a rarity document already exists
    const existing = await ctx.db
      .query("attributeRarity")
      .withIndex("by_type", q => q.eq("type", "singleton"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, rarityData);
      return { message: "Manual rarity data updated" };
    } else {
      await ctx.db.insert("attributeRarity", rarityData);
      return { message: "Manual rarity data created" };
    }
  },
});

// For testing: Set just the three attributes we know about
export const setTestRarity = mutation({
  args: {},
  handler: async (ctx) => {
    // Get existing data first
    const existing = await ctx.db
      .query("attributeRarity")
      .withIndex("by_type", q => q.eq("type", "singleton"))
      .first();

    if (!existing) {
      throw new Error("No existing rarity data found. Run calculateAndStoreRarity first.");
    }

    // Update specific attributes with correct counts
    const updatedHeads = existing.heads || {};
    const updatedBodies = existing.bodies || {};
    const updatedTraits = existing.traits || {};

    // Set the correct counts based on your admin panel
    updatedHeads["Exposed"] = { count: 117, appearanceRate: 117/4000 };
    updatedBodies["Prickles"] = { count: 44, appearanceRate: 44/4000 };
    updatedTraits["Vampire"] = { count: 129, appearanceRate: 129/4000 };

    await ctx.db.patch(existing._id, {
      heads: updatedHeads,
      bodies: updatedBodies,
      traits: updatedTraits,
      totalMeks: 4000, // Update to reflect full collection
      lastUpdated: Date.now(),
      version: (existing.version || 0) + 1,
    });

    return {
      message: "Test rarity data updated",
      vampire: 129,
      exposed: 117,
      prickles: 44,
    };
  },
});