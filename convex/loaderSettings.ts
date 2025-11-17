import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get loader settings (returns first record or null)
export const getLoaderSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("loaderSettings").first();
    return settings;
  },
});

// Save/update loader settings (upsert pattern)
export const saveLoaderSettings = mutation({
  args: {
    fontSize: v.number(),
    spacing: v.number(),
    horizontalOffset: v.number(),
    fontFamily: v.string(),
    chromaticOffset: v.number(),
    triangleSize: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("loaderSettings").first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        fontSize: args.fontSize,
        spacing: args.spacing,
        horizontalOffset: args.horizontalOffset,
        fontFamily: args.fontFamily,
        chromaticOffset: args.chromaticOffset,
        triangleSize: args.triangleSize,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new record
      const id = await ctx.db.insert("loaderSettings", {
        fontSize: args.fontSize,
        spacing: args.spacing,
        horizontalOffset: args.horizontalOffset,
        fontFamily: args.fontFamily,
        chromaticOffset: args.chromaticOffset,
        triangleSize: args.triangleSize,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});

// Clear all loader settings (resets to code defaults)
export const clearLoaderSettings = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("loaderSettings").first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { deleted: true, id: existing._id };
    }
    return { deleted: false, message: "No settings found to delete" };
  },
});

// Reset loader settings to new defaults
export const resetToNewDefaults = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("loaderSettings").first();

    const newDefaults = {
      fontSize: 15,
      spacing: 8,
      horizontalOffset: 0,
      fontFamily: 'Saira',
      chromaticOffset: 0,
      triangleSize: 0.75,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...newDefaults,
        updatedAt: Date.now(),
      });
      return { success: true, message: "Settings updated to new defaults", settings: newDefaults };
    } else {
      const id = await ctx.db.insert("loaderSettings", {
        ...newDefaults,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, message: "New default settings created", id, settings: newDefaults };
    }
  },
});
