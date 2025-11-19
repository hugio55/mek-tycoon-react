import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Site Settings - Global configuration for the website
 *
 * This table stores site-wide settings that control behavior across the application.
 * Currently supports:
 * - Landing Page Toggle: Controls whether root (/) shows landing page or game interface
 * - Localhost Bypass: When true, localhost bypasses protection. When false, localhost acts like production
 * - Maintenance Mode: EMERGENCY nuclear option - redirects ALL routes to maintenance page
 */

// Get the current site settings (or create default if none exist)
export const getSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("siteSettings")
      .first();

    // Return existing settings with backwards compatibility
    if (settings) {
      // Handle backwards compatibility: if old field exists but new one doesn't, migrate it
      const localhostBypass = settings.localhostBypass ??
                              (settings as any).ignoreLocalhostRule !== undefined
                                ? !(settings as any).ignoreLocalhostRule // Invert: ignoreLocalhostRule=true meant bypass=false
                                : true; // Default if neither exists

      return {
        ...settings,
        localhostBypass,
        maintenanceMode: settings.maintenanceMode ?? false,
      };
    }

    // Return default settings if none exist
    return {
      landingPageEnabled: true, // Default: show landing page
      localhostBypass: true, // Default: localhost bypasses protection for dev convenience
      maintenanceMode: false, // Default: maintenance mode OFF
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

// Toggle localhost bypass (whether localhost can bypass protection for dev/testing)
export const toggleLocalhostBypass = mutation({
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
        localhostBypass: args.enabled,
      });
      return { success: true, localhostBypass: args.enabled };
    } else {
      // Create new settings document with default landing page setting
      await ctx.db.insert("siteSettings", {
        landingPageEnabled: true,
        localhostBypass: args.enabled,
      });
      return { success: true, localhostBypass: args.enabled };
    }
  },
});

// EMERGENCY: Toggle maintenance mode (nuclear option - redirects everything to maintenance page)
export const toggleMaintenanceMode = mutation({
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
        maintenanceMode: args.enabled,
      });
      return { success: true, maintenanceMode: args.enabled };
    } else {
      // Create new settings document with defaults
      await ctx.db.insert("siteSettings", {
        landingPageEnabled: true,
        localhostBypass: true,
        maintenanceMode: args.enabled,
      });
      return { success: true, maintenanceMode: args.enabled };
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
        landingPageEnabled: true, // Default to landing page
        localhostBypass: true, // Default: localhost bypasses protection for dev
        maintenanceMode: false, // Default: maintenance mode OFF
      });
      return { success: true, message: "Site settings initialized" };
    }

    return { success: false, message: "Settings already exist" };
  },
});
