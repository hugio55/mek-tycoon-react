import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Zone type for interactive areas on images
const zoneValidator = v.object({
  id: v.string(),
  mode: v.optional(v.string()), // "zone" or "sprite"
  type: v.string(), // "mechanism-slot", "button", "clickable", etc.
  x: v.number(),
  y: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  label: v.optional(v.string()),
  overlayImage: v.optional(v.string()),
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

// Save autosave history entry
export const saveAutosave = mutation({
  args: {
    imageKey: v.string(),
    zones: v.array(
      v.object({
        id: v.string(),
        mode: v.optional(v.string()),
        type: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        label: v.optional(v.string()),
        overlayImage: v.optional(v.string()),
        metadata: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const spriteCount = args.zones.filter(z => z.mode === "sprite").length;

    // Save the autosave entry
    const autosaveId = await ctx.db.insert("overlayAutosaves", {
      imageKey: args.imageKey,
      zones: args.zones,
      spriteCount,
      timestamp: Date.now(),
    });

    // Keep only the last 20 autosaves for this imageKey
    const allAutosaves = await ctx.db
      .query("overlayAutosaves")
      .withIndex("by_imageKey_and_timestamp", (q) => q.eq("imageKey", args.imageKey))
      .order("desc")
      .collect();

    // Delete old autosaves beyond the 20 most recent
    if (allAutosaves.length > 20) {
      const toDelete = allAutosaves.slice(20);
      for (const old of toDelete) {
        await ctx.db.delete(old._id);
      }
    }

    return autosaveId;
  },
});

// Get autosave history for an imageKey
export const getAutosaveHistory = query({
  args: { imageKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("overlayAutosaves")
      .withIndex("by_imageKey_and_timestamp", (q) => q.eq("imageKey", args.imageKey))
      .order("desc")
      .take(20);
  },
});
