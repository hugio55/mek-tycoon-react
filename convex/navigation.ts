import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save navigation configuration
export const saveNavigationConfig = mutation({
  args: {
    overlayImageKey: v.string(),
    scale: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if a config already exists
    const existing = await ctx.db
      .query("navigationConfig")
      .first();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        overlayImageKey: args.overlayImageKey,
        scale: args.scale,
        updatedAt: now,
      });
      return { success: true, configId: existing._id, action: "updated" };
    } else {
      // Create new config (not deployed yet)
      const configId = await ctx.db.insert("navigationConfig", {
        overlayImageKey: args.overlayImageKey,
        scale: args.scale,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, configId, action: "created" };
    }
  },
});

// Deploy navigation (make it active on the site)
export const deployNavigation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get the current config
    const config = await ctx.db
      .query("navigationConfig")
      .first();

    if (!config) {
      throw new Error("No navigation configuration found. Please save a configuration first.");
    }

    // Mark it as active
    await ctx.db.patch(config._id, {
      isActive: true,
      deployedAt: now,
      updatedAt: now,
    });

    return { success: true, message: "Navigation deployed successfully!" };
  },
});

// Deactivate navigation
export const deactivateNavigation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get the active config
    const config = await ctx.db
      .query("navigationConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!config) {
      return { success: true, message: "No active navigation to deactivate." };
    }

    // Mark it as inactive
    await ctx.db.patch(config._id, {
      isActive: false,
      updatedAt: now,
    });

    return { success: true, message: "Navigation deactivated successfully!" };
  },
});

// Get navigation configuration
export const getNavigationConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("navigationConfig")
      .first();

    return config || null;
  },
});

// Get active navigation configuration
export const getActiveNavigationConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("navigationConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    return config || null;
  },
});
