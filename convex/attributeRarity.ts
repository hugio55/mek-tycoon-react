import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Calculate and store attribute rarity data from mekanisms collection
export const calculateAndStoreRarity = mutation({
  args: {},
  handler: async (ctx) => {
    // Fetch all mekanisms from the mekCollection table
    const allMeks = await ctx.db.query("mekCollection").collect();

    if (!allMeks.length) {
      throw new Error("No mekanisms found in mekCollection table");
    }

    // Count occurrences of each attribute
    const headCounts: Record<string, number> = {};
    const bodyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    allMeks.forEach(mek => {
      // Count heads
      if (mek.head) {
        headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
      }

      // Count bodies
      if (mek.body) {
        bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
      }

      // Count traits
      if (mek.trait) {
        traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
      }
    });

    // Process head data
    const headsData: Record<string, any> = {};
    for (const [head, count] of Object.entries(headCounts)) {
      headsData[head] = {
        count,
        appearanceRate: count / allMeks.length, // How common this head is (0-1)
      };
    }

    // Process body data
    const bodiesData: Record<string, any> = {};
    for (const [body, count] of Object.entries(bodyCounts)) {
      bodiesData[body] = {
        count,
        appearanceRate: count / allMeks.length, // How common this body is (0-1)
      };
    }

    // Process trait data
    const traitsData: Record<string, any> = {};
    for (const [trait, count] of Object.entries(traitCounts)) {
      traitsData[trait] = {
        count,
        appearanceRate: count / allMeks.length, // How common this trait is (0-1)
      };
    }

    // Check if a rarity document already exists
    const existing = await ctx.db
      .query("attributeRarity")
      .withIndex("by_type", q => q.eq("type", "singleton"))
      .first();

    const rarityData = {
      type: "singleton" as const,
      heads: headsData,
      bodies: bodiesData,
      traits: traitsData,
      totalMeks: allMeks.length,
      lastUpdated: Date.now(),
      version: existing ? (existing.version || 0) + 1 : 1,
    };

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, rarityData);
      return { message: "Attribute rarity data updated", totalMeks: allMeks.length };
    } else {
      // Create new document
      await ctx.db.insert("attributeRarity", rarityData);
      return { message: "Attribute rarity data created", totalMeks: allMeks.length };
    }
  },
});

// Get attribute rarity data
export const getAttributeRarity = query({
  args: {},
  handler: async (ctx) => {
    const rarityData = await ctx.db
      .query("attributeRarity")
      .withIndex("by_type", q => q.eq("type", "singleton"))
      .first();

    if (!rarityData) {
      return null;
    }

    return {
      heads: rarityData.heads,
      bodies: rarityData.bodies,
      traits: rarityData.traits,
      totalMeks: rarityData.totalMeks,
      lastUpdated: rarityData.lastUpdated,
      version: rarityData.version,
    };
  },
});

// Calculate essence drop probabilities for a specific mek
export const calculateEssenceProbabilities = query({
  args: {
    head: v.string(),
    body: v.string(),
    trait: v.string(),
  },
  handler: async (ctx, args) => {
    const rarityData = await ctx.db
      .query("attributeRarity")
      .withIndex("by_type", q => q.eq("type", "singleton"))
      .first();

    if (!rarityData || !rarityData.heads || !rarityData.bodies || !rarityData.traits) {
      // Return default probabilities if no rarity data
      return {
        headChance: 33,
        bodyChance: 34,
        traitChance: 33,
        totalChance: 100,
      };
    }

    const headData = rarityData.heads[args.head];
    const bodyData = rarityData.bodies[args.body];
    const traitData = rarityData.traits[args.trait];

    if (!headData || !bodyData || !traitData) {
      // Return default if any attribute is missing
      return {
        headChance: 33,
        bodyChance: 34,
        traitChance: 33,
        totalChance: 100,
      };
    }

    // Calculate proportional weights (more common items have higher drop chance)
    // The drop rate is proportional to how common the variation is
    const headWeight = headData.count;
    const bodyWeight = bodyData.count;
    const traitWeight = traitData.count;

    // Normalize to percentages that sum to 100%
    const totalWeight = headWeight + bodyWeight + traitWeight;

    let headChance = Math.round((headWeight / totalWeight) * 100);
    let bodyChance = Math.round((bodyWeight / totalWeight) * 100);
    let traitChance = Math.round((traitWeight / totalWeight) * 100);

    // Ensure they sum to exactly 100% (handle rounding errors)
    const currentTotal = headChance + bodyChance + traitChance;
    if (currentTotal !== 100) {
      // Adjust the largest value to make it exactly 100%
      const diff = 100 - currentTotal;
      if (headChance >= bodyChance && headChance >= traitChance) {
        headChance += diff;
      } else if (bodyChance >= traitChance) {
        bodyChance += diff;
      } else {
        traitChance += diff;
      }
    }

    return {
      headChance,
      bodyChance,
      traitChance,
      totalChance: headChance + bodyChance + traitChance,
      // Include debug info
      headCount: headData.count,
      bodyCount: bodyData.count,
      traitCount: traitData.count,
    };
  },
});