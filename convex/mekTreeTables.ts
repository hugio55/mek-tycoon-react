import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all table data
export const getTableData = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mekTreeTables").collect();
  },
});

// Mutation to save table data
export const saveTableData = mutation({
  args: {
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
    // Delete all existing data for the categories being saved
    const categoriesToUpdate = [...new Set(args.data.map(item => item.category))];
    for (const category of categoriesToUpdate) {
      const existing = await ctx.db
        .query("mekTreeTables")
        .withIndex("by_category", q => q.eq("category", category))
        .collect();
      for (const item of existing) {
        await ctx.db.delete(item._id);
      }
    }

    // Insert new data
    for (const item of args.data) {
      await ctx.db.insert("mekTreeTables", {
        category: item.category,
        rankRange: item.rankRange,
        talentTier: item.talentTier,
        value: item.value,
      });
    }
  },
});