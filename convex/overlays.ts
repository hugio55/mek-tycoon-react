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
      .withIndex("by_imageKey", (q: any) => q.eq("imageKey", args.imageKey))
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
    expectedVersion: v.optional(v.number()), // CRITICAL FIX: Optimistic locking
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("overlays")
      .withIndex("by_imageKey", (q: any) => q.eq("imageKey", args.imageKey))
      .first();

    const now = Date.now();

    if (existing) {
      // CRITICAL FIX: Check version before updating to prevent concurrent write conflicts
      const currentVersion = existing.version || 0;

      if (args.expectedVersion !== undefined && args.expectedVersion !== currentVersion) {
        console.error(`[OVERLAY-FIX] Concurrent modification detected for ${args.imageKey}: expected v${args.expectedVersion}, found v${currentVersion}`);
        throw new Error(
          `Concurrent modification detected. Expected version ${args.expectedVersion} but found ${currentVersion}. Please refresh and try again.`
        );
      }

      console.log(`[OVERLAY-FIX] Updating overlay ${args.imageKey} from v${currentVersion} to v${currentVersion + 1}`);

      await ctx.db.patch(existing._id, {
        imagePath: args.imagePath,
        imageWidth: args.imageWidth,
        imageHeight: args.imageHeight,
        zones: args.zones,
        updatedAt: now,
        version: currentVersion + 1, // Increment version
      });
      return existing._id;
    } else {
      console.log(`[OVERLAY-FIX] Creating new overlay ${args.imageKey} at v1`);
      return await ctx.db.insert("overlays", {
        imageKey: args.imageKey,
        imagePath: args.imagePath,
        imageWidth: args.imageWidth,
        imageHeight: args.imageHeight,
        zones: args.zones,
        createdAt: now,
        updatedAt: now,
        version: 1, // Initialize version
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
      .withIndex("by_imageKey", (q: any) => q.eq("imageKey", args.imageKey))
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
    const spriteCount = args.zones.filter((z: any) => z.mode === "sprite").length;

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
      .withIndex("by_imageKey", (q: any) => q.eq("imageKey", args.imageKey))
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
      .withIndex("by_imageKey", (q: any) => q.eq("imageKey", args.imageKey))
      .order("desc")
      .take(20);
  },
});
