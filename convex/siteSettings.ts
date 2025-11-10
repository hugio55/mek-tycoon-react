import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Site Settings - Global configuration for the website
 *
 * This table stores site-wide settings that control behavior across the application.
 * Currently supports:
 * - Landing Page Toggle: Controls whether root (/) shows landing page or game interface
 * - Ignore Localhost Rule: When true, localhost behaves like production (for testing landing page locally)
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
      ignoreLocalhostRule: false, // Default: localhost bypasses landing page for dev convenience
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

// Toggle the localhost rule (whether localhost acts like production)
export const toggleIgnoreLocalhostRule = mutation({
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
        ignoreLocalhostRule: args.enabled,
      });
      return { success: true, ignoreLocalhostRule: args.enabled };
    } else {
      // Create new settings document with default landing page setting
      await ctx.db.insert("siteSettings", {
        landingPageEnabled: false,
        ignoreLocalhostRule: args.enabled,
      });
      return { success: true, ignoreLocalhostRule: args.enabled };
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
        ignoreLocalhostRule: false, // Default: localhost bypasses landing page
      });
      return { success: true, message: "Site settings initialized" };
    }

    return { success: false, message: "Settings already exist" };
  },
});
