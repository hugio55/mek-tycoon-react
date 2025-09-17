import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all buff categories
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buffCategories").collect();
  },
});

// Create a new buff category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("gold"),
      v.literal("essence"),
      v.literal("rarity_bias"),
      v.literal("xp"),
      v.literal("mek_slot"),
      v.literal("market"),
      v.literal("reward_chance"),
      v.literal("success")
    ),
    unitType: v.union(
      v.literal("flat_number"),
      v.literal("rate_change"),
      v.literal("rate_percentage"),
      v.literal("flat_percentage")
    ),
    applicationType: v.optional(v.union(
      v.literal("universal"),
      v.literal("attachable")
    )),
    tierStart: v.optional(v.number()),
    tierEnd: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    enabledForUniversalChips: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate tier range if provided
    if (args.tierStart !== undefined && args.tierEnd !== undefined) {
      if (args.tierStart < 1 || args.tierStart > 10 || args.tierEnd < 1 || args.tierEnd > 10) {
        throw new Error("Tier values must be between 1 and 10");
      }
      if (args.tierStart > args.tierEnd) {
        throw new Error("Tier start must be less than or equal to tier end");
      }
    }

    return await ctx.db.insert("buffCategories", {
      name: args.name,
      description: args.description || "",
      category: args.category,
      unitType: args.unitType,
      applicationType: args.applicationType || "universal",
      tierStart: args.tierStart,
      tierEnd: args.tierEnd,
      isActive: args.isActive !== false,
      enabledForUniversalChips: args.enabledForUniversalChips !== false, // Default to true
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a buff category
export const update = mutation({
  args: {
    id: v.id("buffCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("gold"),
      v.literal("essence"),
      v.literal("rarity_bias"),
      v.literal("xp"),
      v.literal("mek_slot"),
      v.literal("market"),
      v.literal("reward_chance"),
      v.literal("success")
    )),
    unitType: v.optional(v.union(
      v.literal("flat_number"),
      v.literal("rate_change"),
      v.literal("rate_percentage"),
      v.literal("flat_percentage")
    )),
    applicationType: v.optional(v.union(
      v.literal("universal"),
      v.literal("attachable")
    )),
    tierStart: v.optional(v.number()),
    tierEnd: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    enabledForUniversalChips: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate tier range if provided
    if (updates.tierStart !== undefined && updates.tierEnd !== undefined) {
      if (updates.tierStart < 1 || updates.tierStart > 10 || updates.tierEnd < 1 || updates.tierEnd > 10) {
        throw new Error("Tier values must be between 1 and 10");
      }
      if (updates.tierStart > updates.tierEnd) {
        throw new Error("Tier start must be less than or equal to tier end");
      }
    }
    
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a buff category
export const remove = mutation({
  args: {
    id: v.id("buffCategories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Toggle universal chip enabled status
export const toggleUniversalChipEnabled = mutation({
  args: {
    id: v.id("buffCategories"),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }

    return await ctx.db.patch(args.id, {
      enabledForUniversalChips: !category.enabledForUniversalChips,
      updatedAt: Date.now(),
    });
  },
});

// Clear all buff categories
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allCategories = await ctx.db.query("buffCategories").collect();
    for (const category of allCategories) {
      await ctx.db.delete(category._id);
    }
    return { deleted: allCategories.length };
  },
});

// Set default enabled status for universal chips
export const setDefaultEnabledStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("buffCategories").collect();

    // Categories that should be disabled for universal chips (one-time effects)
    const disabledForChips = [
      "Gold Flat", // One-time gold reward
      "Flat Rewards of Essence", // One-time essence reward
    ];

    let updatedCount = 0;
    for (const cat of categories) {
      // Set enabledForUniversalChips if not already set
      if (cat.enabledForUniversalChips === undefined) {
        const shouldDisable = disabledForChips.includes(cat.name);
        await ctx.db.patch(cat._id, {
          enabledForUniversalChips: !shouldDisable,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} categories with default enabled status`
    };
  },
});

// Migrate existing categories to have proper fields
export const migrateAll = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("buffCategories").collect();
    
    const categoryMappings: Record<string, { category: string; unitType: string; applicationType: string }> = {
      // Gold & Market
      "Gold Flat": { category: "gold", unitType: "flat_number", applicationType: "universal" },
      "Gold Rate Mek": { category: "gold", unitType: "rate_change", applicationType: "attachable" },
      "Interest Rate Bank": { category: "gold", unitType: "rate_percentage", applicationType: "universal" },
      "Auction House Fee Reduction": { category: "market", unitType: "flat_percentage", applicationType: "universal" },
      "CircuTree Gold Cost Reduction %": { category: "gold", unitType: "flat_percentage", applicationType: "attachable" },
      "Discount on OE Items": { category: "market", unitType: "flat_percentage", applicationType: "universal" },
      "Scrapyard Gold Reward Increase": { category: "gold", unitType: "flat_percentage", applicationType: "universal" },
      "Crafting Fee Reduction": { category: "market", unitType: "flat_percentage", applicationType: "universal" },
      
      // Essence
      "CircuTree Essence Cost Reduction %": { category: "essence", unitType: "flat_percentage", applicationType: "attachable" },
      "Essence Rate Global": { category: "essence", unitType: "rate_change", applicationType: "universal" },
      "Essence Rate Specific": { category: "essence", unitType: "rate_change", applicationType: "attachable" },
      "Scrapyard Essence Reward Increase": { category: "essence", unitType: "flat_percentage", applicationType: "universal" },
      "Flat Rewards of Essence": { category: "essence", unitType: "flat_number", applicationType: "universal" },
      "Essence Bar Cap Increase": { category: "essence", unitType: "flat_number", applicationType: "universal" },
      "Crafting Essence Cost Reduction": { category: "essence", unitType: "flat_percentage", applicationType: "universal" },
      "Crafting Glyph Essence Cost Reduction": { category: "essence", unitType: "flat_percentage", applicationType: "universal" },
      
      // Looter & Rewards
      "Scrap Yard Loot Chance Increase": { category: "reward_chance", unitType: "flat_percentage", applicationType: "universal" },
      "Rarity Bias": { category: "rarity_bias", unitType: "flat_percentage", applicationType: "universal" },
      "Fight Cooldown Timer Reduction": { category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable" },
      "Various Perks to Fight Mechanics": { category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable" },
      "XP Gain Bank": { category: "xp", unitType: "flat_percentage", applicationType: "universal" },
      "XP Gain Scrap Yard": { category: "xp", unitType: "flat_percentage", applicationType: "universal" },
      "Glyph Duration": { category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable" },
      
      // Other
      "Mek Slots": { category: "mek_slot", unitType: "flat_number", applicationType: "attachable" },
    };
    
    let updatedCount = 0;
    
    for (const cat of categories) {
      const mapping = categoryMappings[cat.name];
      if (mapping && (!cat.category || !cat.unitType)) {
        await ctx.db.patch(cat._id, {
          category: mapping.category as any,
          unitType: mapping.unitType as any,
          applicationType: mapping.applicationType as any,
          tierStart: cat.tierStart || 1,
          tierEnd: cat.tierEnd || 10,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }
    
    return { 
      success: true, 
      updatedCount,
      message: `Successfully migrated ${updatedCount} buff categories`
    };
  },
});