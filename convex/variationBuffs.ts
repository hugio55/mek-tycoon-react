import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Define rarity tiers for variations
export const RARITY_TIERS = {
  common: { percentage: 0.70, examples: ['Classic', 'Mesh', 'Rust', 'Milk', 'Snow'] },
  uncommon: { percentage: 0.20, examples: ['Neon Flamingo', 'Disco', 'Arcade', 'Bubblegum'] },
  rare: { percentage: 0.07, examples: ['24K', 'Gold', 'Royal', 'Crimson'] },
  epic: { percentage: 0.025, examples: ['Hacker', 'Terminator', 'Obliterator'] },
  legendary: { percentage: 0.005, examples: ['???', 'The Lethal Dimension', 'Ace of Spades Ultimate'] }
};

// Calculate buff percentage based on rarity using curve interpolation
function calculateBuffPercentage(
  rarityRank: number,
  totalVariations: number,
  minPercent: number,
  maxPercent: number,
  curveType: 'linear' | 'exponential' | 'logarithmic',
  curveFactor: number = 1.5
): number {
  // Normalize rank to 0-1 scale (0 = most common, 1 = most rare)
  const normalizedRank = rarityRank / totalVariations;

  let interpolatedValue: number;

  switch (curveType) {
    case 'linear':
      interpolatedValue = normalizedRank;
      break;
    case 'exponential':
      interpolatedValue = Math.pow(normalizedRank, curveFactor);
      break;
    case 'logarithmic':
      interpolatedValue = Math.log(1 + normalizedRank * 9) / Math.log(10);
      break;
    default:
      interpolatedValue = normalizedRank;
  }

  // Map to min-max range
  const buffPercent = minPercent + (maxPercent - minPercent) * interpolatedValue;
  return Math.round(buffPercent);
}

// Store buff configuration
export const saveBuffConfiguration = mutation({
  args: {
    minPercent: v.number(),
    maxPercent: v.number(),
    curveType: v.union(v.literal('linear'), v.literal('exponential'), v.literal('logarithmic')),
    curveFactor: v.number()
  },
  handler: async (ctx, args) => {
    const existingConfig = await ctx.db
      .query("variationBuffConfig")
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, args);
    } else {
      await ctx.db.insert("variationBuffConfig", args);
    }

    return { success: true };
  }
});

// Get buff configuration
export const getBuffConfiguration = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("variationBuffConfig")
      .first();

    return config || {
      minPercent: 5,
      maxPercent: 50,
      curveType: 'linear' as const,
      curveFactor: 1.5
    };
  }
});

// Apply buff percentages to all variations
export const applyBuffsToVariations = mutation({
  args: {
    minPercent: v.number(),
    maxPercent: v.number(),
    curveType: v.union(v.literal('linear'), v.literal('exponential'), v.literal('logarithmic')),
    curveFactor: v.number()
  },
  handler: async (ctx, args) => {
    // Get all variations (heads, bodies, traits)
    const { VARIATIONS_BY_TYPE } = await import('../src/lib/completeVariationRarity');

    const allVariations: any[] = [];
    allVariations.push(...VARIATIONS_BY_TYPE.heads.map((v: any) => ({ ...v, category: 'head' })));
    allVariations.push(...VARIATIONS_BY_TYPE.bodies.map((v: any) => ({ ...v, category: 'body' })));
    allVariations.push(...VARIATIONS_BY_TYPE.traits.map((v: any) => ({ ...v, category: 'item' })));

    // Sort variations by a pseudo-rarity (for demo purposes, using name length and special characters)
    const sortedVariations = allVariations.sort((a, b) => {
      // Special variations with ??? or Ultimate are rarest
      const aSpecial = a.name.includes('???') || a.name.includes('Ultimate') ? 1000 : 0;
      const bSpecial = b.name.includes('???') || b.name.includes('Ultimate') ? 1000 : 0;

      // Gold, 24K, Royal etc are rare
      const aRare = ['Gold', '24K', 'Royal', 'Crimson', 'Hacker', 'Terminator'].some(r => a.name.includes(r)) ? 100 : 0;
      const bRare = ['Gold', '24K', 'Royal', 'Crimson', 'Hacker', 'Terminator'].some(r => b.name.includes(r)) ? 100 : 0;

      // Sort by special status, then rarity, then alphabetically
      return (aSpecial + aRare) - (bSpecial + bRare) || a.name.localeCompare(b.name);
    });

    // Apply buff percentages based on sorted order
    for (let i = 0; i < sortedVariations.length; i++) {
      const variation = sortedVariations[i];
      const buffPercent = calculateBuffPercentage(
        i,
        sortedVariations.length,
        args.minPercent,
        args.maxPercent,
        args.curveType,
        args.curveFactor
      );

      // Store buff percentage in database
      const existingVariation = await ctx.db
        .query("variationBuffs")
        .filter(q => q.eq(q.field("variationId"), variation.id))
        .filter(q => q.eq(q.field("category"), variation.category))
        .first();

      if (existingVariation) {
        await ctx.db.patch(existingVariation._id, { buffPercent });
      } else {
        await ctx.db.insert("variationBuffs", {
          variationId: variation.id,
          name: variation.name,
          category: variation.category,
          buffPercent
        });
      }
    }

    return { success: true, totalProcessed: sortedVariations.length };
  }
});

// Get all variation buffs sorted by rarity
export const getVariationBuffs = query({
  args: {
    category: v.optional(v.union(v.literal('head'), v.literal('body'), v.literal('item')))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("variationBuffs");

    if (args.category) {
      const variations = await query.collect();
      return variations
        .filter(v => v.category === args.category)
        .sort((a, b) => a.buffPercent - b.buffPercent); // Sort by buff percent (common to rare)
    }

    const variations = await query.collect();
    return variations.sort((a, b) => a.buffPercent - b.buffPercent);
  }
});