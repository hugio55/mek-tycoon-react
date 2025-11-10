import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Site Settings - Global configuration for the website
 *
 * This table stores site-wide settings that control behavior across the application.
 * Currently supports:
 * - Landing Page Toggle: Controls whether root (/) shows landing page or game interface
 */

// Get the current site settings (or create default if none exist)
export const getSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("siteSettings")
      .first();

    // Return existing settings or default values
    if (settings) {
      return settings;
    }

    // Return default settings if none exist
    return {
      landingPageEnabled: false, // Default: show game interface, not landing page
    };
  },
});

// Update the landing page toggle
export const toggleLandingPage = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existingSettings = await ctx.db
      .query("siteSettings")
      .first();

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, {
        landingPageEnabled: args.enabled,
      });
      return { success: true, landingPageEnabled: args.enabled };
    } else {
      // Create new settings document
      await ctx.db.insert("siteSettings", {
        landingPageEnabled: args.enabled,
      });
      return { success: true, landingPageEnabled: args.enabled };
    }
  },
});

// Initialize site settings with defaults (run once during setup)
export const initializeSiteSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("siteSettings")
      .first();

    if (!existing) {
      await ctx.db.insert("siteSettings", {
        landingPageEnabled: false, // Default to game interface
      });
      return { success: true, message: "Site settings initialized" };
    }

    return { success: false, message: "Settings already exist" };
  },
});
