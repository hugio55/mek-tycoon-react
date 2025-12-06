import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

// Get all categories
export const getAllCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("mekTreeCategories").collect();
  },
});

// Get a single category by ID
export const getCategory = query({
  args: { categoryId: v.id("mekTreeCategories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

// Get category by name
export const getCategoryByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekTreeCategories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Get a category with its templates
export const getCategoryWithTemplates = query({
  args: { categoryId: v.id("mekTreeCategories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) return null;

    const templates = await ctx.db
      .query("mekTreeTemplates")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    return {
      ...category,
      templates,
    };
  },
});

// Get all categories with their template counts
export const getAllCategoriesWithCounts = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("mekTreeCategories").collect();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const templates = await ctx.db
          .query("mekTreeTemplates")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
          .collect();

        return {
          ...category,
          templateCount: templates.length,
          hasActiveTemplate: !!category.activeTemplateId,
        };
      })
    );

    return categoriesWithCounts;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    conditions: v.optional(v.object({
      headVariations: v.optional(v.array(v.string())),
      bodyVariations: v.optional(v.array(v.string())),
      traitVariations: v.optional(v.array(v.string())),
      rarityTiers: v.optional(v.array(v.string())),
      powerScoreMin: v.optional(v.number()),
      powerScoreMax: v.optional(v.number()),
      rankMin: v.optional(v.number()),
      rankMax: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if category with this name already exists
    const existing = await ctx.db
      .query("mekTreeCategories")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Category with name "${args.name}" already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("mekTreeCategories", {
      name: args.name,
      description: args.description,
      conditions: args.conditions,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing category
export const updateCategory = mutation({
  args: {
    categoryId: v.id("mekTreeCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(v.object({
      headVariations: v.optional(v.array(v.string())),
      bodyVariations: v.optional(v.array(v.string())),
      traitVariations: v.optional(v.array(v.string())),
      rarityTiers: v.optional(v.array(v.string())),
      powerScoreMin: v.optional(v.number()),
      powerScoreMax: v.optional(v.number()),
      rankMin: v.optional(v.number()),
      rankMax: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { categoryId, ...updates } = args;

    // If name is being changed, check for duplicates
    if (updates.name) {
      const existing = await ctx.db
        .query("mekTreeCategories")
        .withIndex("", (q: any) => q.eq("name", updates.name!))
        .first();

      if (existing && existing._id !== categoryId) {
        throw new Error(`Category with name "${updates.name}" already exists`);
      }
    }

    await ctx.db.patch(categoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(categoryId);
  },
});

// Delete a category (and optionally its templates)
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("mekTreeCategories"),
    deleteTemplates: v.optional(v.boolean()), // If true, delete all templates in this category
  },
  handler: async (ctx, args) => {
    const { categoryId, deleteTemplates } = args;

    // Get all templates in this category
    const templates = await ctx.db
      .query("mekTreeTemplates")
      .withIndex("", (q: any) => q.eq("categoryId", categoryId))
      .collect();

    if (deleteTemplates) {
      // Delete all templates in this category
      for (const template of templates) {
        await ctx.db.delete(template._id);
      }
    } else {
      // Just unlink templates from this category (set categoryId to undefined)
      for (const template of templates) {
        await ctx.db.patch(template._id, { categoryId: undefined });
      }
    }

    // Delete the category
    await ctx.db.delete(categoryId);

    return {
      success: true,
      templatesAffected: templates.length,
      templatesDeleted: deleteTemplates || false,
    };
  },
});

// Set the active template for a category
export const setActiveTemplate = mutation({
  args: {
    categoryId: v.id("mekTreeCategories"),
    templateId: v.optional(v.id("mekTreeTemplates")), // null/undefined to clear
  },
  handler: async (ctx, args) => {
    const { categoryId, templateId } = args;

    // Verify the category exists
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // If setting a template, verify it exists and belongs to this category
    if (templateId) {
      const template = await ctx.db.get(templateId);
      if (!template) {
        throw new Error("Template not found");
      }
      if (template.categoryId !== categoryId) {
        throw new Error("Template does not belong to this category");
      }
    }

    // Update the category's active template
    await ctx.db.patch(categoryId, {
      activeTemplateId: templateId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(categoryId);
  },
});

// =============================================================================
// MEK MATCHING
// =============================================================================

// Find the best matching category for a Mek (updated from findTemplateForMek)
export const findCategoryForMek = query({
  args: { mekId: v.id("meks") },
  handler: async (ctx, args) => {
    const mek = await ctx.db.get(args.mekId);
    if (!mek) return null;

    const categories = await ctx.db.query("mekTreeCategories").collect();

    // Score each category based on how well it matches the Mek
    let bestCategory = null;
    let bestScore = -1;

    for (const category of categories) {
      let score = 0;
      const conditions = category.conditions;

      if (!conditions) {
        // Category with no conditions is a fallback (lowest priority)
        if (score === 0 && bestScore < 0) {
          bestCategory = category;
          bestScore = 0;
        }
        continue;
      }

      // Check rarity rank range (highest priority - 100 points)
      if (mek.rarityRank !== undefined && mek.rarityRank !== null) {
        const rankMin = conditions.rankMin ?? 0;
        const rankMax = conditions.rankMax ?? Infinity;
        if (mek.rarityRank >= rankMin && mek.rarityRank <= rankMax) {
          score += 100;
        }
      }

      // Check head variation match
      if (conditions.headVariations?.includes(mek.headVariation)) {
        score += 10;
      }

      // Check body variation match
      if (conditions.bodyVariations?.includes(mek.bodyVariation)) {
        score += 10;
      }

      // Check trait/item variation match
      if (mek.itemVariation && conditions.traitVariations?.includes(mek.itemVariation)) {
        score += 10;
      }

      // Check rarity tier match
      if (mek.rarityTier && conditions.rarityTiers?.includes(mek.rarityTier)) {
        score += 5;
      }

      // Check power score range
      if (mek.powerScore) {
        const min = conditions.powerScoreMin || 0;
        const max = conditions.powerScoreMax || Infinity;
        if (mek.powerScore >= min && mek.powerScore <= max) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // If we found a category, get its active template
    if (bestCategory && bestCategory.activeTemplateId) {
      const activeTemplate = await ctx.db.get(bestCategory.activeTemplateId);
      return {
        category: bestCategory,
        template: activeTemplate,
      };
    }

    return bestCategory ? { category: bestCategory, template: null } : null;
  },
});

// Get the active template for a category (for use in game logic)
export const getActiveTemplateForCategory = query({
  args: { categoryId: v.id("mekTreeCategories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category || !category.activeTemplateId) {
      return null;
    }

    return await ctx.db.get(category.activeTemplateId);
  },
});
