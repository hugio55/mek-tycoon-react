import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Zone type for interactive areas on images
const zoneValidator = v.object({
  id: v.string(),
  type: v.string(), // "mechanism-slot", "button", "clickable", etc.
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
  label: v.optional(v.string()),
  metadata: v.optional(v.any()),
});

// Get overlay data by image key
export const getOverlay = query({
  args: { imageKey: v.string() },
  handler: async (ctx, args) => {
    const overlay = await ctx.db
      .query("overlays")
      .withIndex("by_imageKey", (q) => q.eq("imageKey", args.imageKey))
      .first();
    return overlay;
  },
});

// Save or update overlay data
export const saveOverlay = mutation({
  args: {
    imageKey: v.string(),
    imagePath: v.string(),
    imageWidth: v.number(),
    imageHeight: v.number(),
    zones: v.array(zoneValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("overlays")
      .withIndex("by_imageKey", (q) => q.eq("imageKey", args.imageKey))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        imagePath: args.imagePath,
        imageWidth: args.imageWidth,
        imageHeight: args.imageHeight,
        zones: args.zones,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("overlays", {
        imageKey: args.imageKey,
        imagePath: args.imagePath,
        imageWidth: args.imageWidth,
        imageHeight: args.imageHeight,
        zones: args.zones,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// List all overlays
export const listOverlays = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("overlays").collect();
  },
});

// Delete an overlay
export const deleteOverlay = mutation({
  args: { imageKey: v.string() },
  handler: async (ctx, args) => {
    const overlay = await ctx.db
      .query("overlays")
      .withIndex("by_imageKey", (q) => q.eq("imageKey", args.imageKey))
      .first();

    if (overlay) {
      await ctx.db.delete(overlay._id);
      return true;
    }
    return false;
  },
});
