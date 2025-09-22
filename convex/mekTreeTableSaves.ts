import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all saved configurations
export const getSaves = query({
  args: {},
  handler: async (ctx) => {
    const saves = await ctx.db
      .query("mekTreeTableSaves")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    return saves;
  },
});

// Query to get a specific save by ID
export const getSaveById = query({
  args: { saveId: v.id("mekTreeTableSaves") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.saveId);
  },
});

// Mutation to create a new save
export const createSave = mutation({
  args: {
    saveName: v.string(),
    description: v.optional(v.string()),
    data: v.array(
      v.object({
        category: v.string(),
        rankRange: v.string(),
        talentTier: v.string(),
        value: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if a save with this name already exists
    const existingSave = await ctx.db
      .query("mekTreeTableSaves")
      .withIndex("by_name", q => q.eq("saveName", args.saveName))
      .first();

    if (existingSave) {
      throw new Error(`A save named "${args.saveName}" already exists. Use updateSave to overwrite.`);
    }

    // Create new save
    return await ctx.db.insert("mekTreeTableSaves", {
      saveName: args.saveName,
      description: args.description,
      timestamp: Date.now(),
      data: args.data,
    });
  },
});

// Mutation to update an existing save (overwrite)
export const updateSave = mutation({
  args: {
    saveId: v.id("mekTreeTableSaves"),
    data: v.array(
      v.object({
        category: v.string(),
        rankRange: v.string(),
        talentTier: v.string(),
        value: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingSave = await ctx.db.get(args.saveId);
    if (!existingSave) {
      throw new Error("Save not found");
    }

    // Update the save with new data and timestamp
    await ctx.db.patch(args.saveId, {
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

// Mutation to delete a save
export const deleteSave = mutation({
  args: {
    saveId: v.id("mekTreeTableSaves"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.saveId);
  },
});

// Mutation to load a save into the main table
export const loadSaveIntoTable = mutation({
  args: {
    saveId: v.id("mekTreeTableSaves"),
  },
  handler: async (ctx, args) => {
    const save = await ctx.db.get(args.saveId);
    if (!save) {
      throw new Error("Save not found");
    }

    // Get categories to update from the save data
    const categoriesToUpdate = [...new Set(save.data.map(item => item.category))];

    // Delete existing data for those categories
    for (const category of categoriesToUpdate) {
      const existing = await ctx.db
        .query("mekTreeTables")
        .withIndex("by_category", q => q.eq("category", category))
        .collect();
      for (const item of existing) {
        await ctx.db.delete(item._id);
      }
    }

    // Insert saved data
    for (const item of save.data) {
      await ctx.db.insert("mekTreeTables", {
        category: item.category,
        rankRange: item.rankRange,
        talentTier: item.talentTier,
        value: item.value,
      });
    }

    return { success: true, saveName: save.saveName };
  },
});