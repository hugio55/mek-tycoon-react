import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default colors for levels 1-10
const DEFAULT_LEVEL_COLORS = [
  "#4ade80", // Level 1 - Green
  "#22c55e", // Level 2 - Darker Green
  "#10b981", // Level 3 - Emerald
  "#14b8a6", // Level 4 - Teal
  "#06b6d4", // Level 5 - Cyan
  "#0ea5e9", // Level 6 - Sky Blue
  "#3b82f6", // Level 7 - Blue
  "#6366f1", // Level 8 - Indigo
  "#8b5cf6", // Level 9 - Violet
  "#a855f7", // Level 10 - Purple
];

// Get level colors (returns array of 10 hex colors)
export const getLevelColors = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    // Try to get from gameConstants table
    const colorsSetting = await ctx.db
      .query("gameConstants")
      .filter((q) => q.and(
        q.eq(q.field("category"), "UI"),
        q.eq(q.field("setting"), "Mek Level Colors")
      ))
      .first();

    if (colorsSetting && typeof colorsSetting.value === 'string') {
      try {
        const parsed = JSON.parse(colorsSetting.value);
        if (Array.isArray(parsed) && parsed.length === 10) {
          return parsed;
        }
      } catch (e) {
        console.error('[Level Colors] Failed to parse DB colors:', e);
      }
    }

    return DEFAULT_LEVEL_COLORS;
  },
});

// Save level colors
export const saveLevelColors = mutation({
  args: {
    colors: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Validate input
    if (!Array.isArray(args.colors) || args.colors.length !== 10) {
      throw new Error('Must provide exactly 10 colors');
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of args.colors) {
      if (!hexColorRegex.test(color)) {
        throw new Error(`Invalid hex color format: ${color}`);
      }
    }

    // Check if setting exists
    const existing = await ctx.db
      .query("gameConstants")
      .filter((q) => q.and(
        q.eq(q.field("category"), "UI"),
        q.eq(q.field("setting"), "Mek Level Colors")
      ))
      .first();

    const colorJson = JSON.stringify(args.colors);

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        value: colorJson,
        updatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("gameConstants", {
        category: "UI",
        setting: "Mek Level Colors",
        value: colorJson,
        description: "Hex color codes for Mek levels 1-10",
        configurable: true,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Reset to defaults
export const resetToDefaults = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean }> => {
    const existing = await ctx.db
      .query("gameConstants")
      .filter((q) => q.and(
        q.eq(q.field("category"), "UI"),
        q.eq(q.field("setting"), "Mek Level Colors")
      ))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
