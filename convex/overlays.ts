import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Zone object validator (shared structure)
const zoneValidator = v.object({
  id: v.string(),
  mode: v.string(),
  type: v.string(),
  x: v.number(),
  y: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  label: v.optional(v.string()),
  overlayImage: v.optional(v.string()),
  metadata: v.optional(v.any()),
});

// Get overlay by imageKey
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

// List all overlays
export const listOverlays = query({
  args: {},
  handler: async (ctx) => {
    const overlays = await ctx.db.query("overlays").collect();
    return overlays;
  },
});

// Save overlay (create or update)
export const saveOverlay = mutation({
  args: {
    imageKey: v.string(),
    imagePath: v.string(),
    imageWidth: v.number(),
    imageHeight: v.number(),
    zones: v.array(zoneValidator),
    version: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { imageKey, imagePath, imageWidth, imageHeight, zones, version } = args;

    // Check if overlay exists
    const existing = await ctx.db
      .query("overlays")
      .withIndex("by_imageKey", (q) => q.eq("imageKey", imageKey))
      .first();

    const now = Date.now();

    if (existing) {
      // Optimistic concurrency check
      if (version !== undefined && existing.version !== undefined && existing.version !== version) {
        throw new Error("Overlay was modified by another session. Please refresh and try again.");
      }

      await ctx.db.patch(existing._id, {
        imagePath,
        imageWidth,
        imageHeight,
        zones,
        updatedAt: now,
        version: (existing.version || 0) + 1,
      });

      return { success: true, id: existing._id, version: (existing.version || 0) + 1 };
    } else {
      const id = await ctx.db.insert("overlays", {
        imageKey,
        imagePath,
        imageWidth,
        imageHeight,
        zones,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });

      return { success: true, id, version: 1 };
    }
  },
});

// Save autosave entry
export const saveAutosave = mutation({
  args: {
    imageKey: v.string(),
    zones: v.array(zoneValidator),
    spriteCount: v.number(),
  },
  handler: async (ctx, args) => {
    const { imageKey, zones, spriteCount } = args;

    const id = await ctx.db.insert("overlayAutosaves", {
      imageKey,
      zones,
      spriteCount,
      timestamp: Date.now(),
    });

    return { success: true, id };
  },
});

// Get autosave history for an overlay
export const getAutosaveHistory = query({
  args: { imageKey: v.string() },
  handler: async (ctx, args) => {
    const autosaves = await ctx.db
      .query("overlayAutosaves")
      .withIndex("by_imageKey", (q) => q.eq("imageKey", args.imageKey))
      .order("desc")
      .take(50); // Limit to 50 most recent

    return autosaves;
  },
});
