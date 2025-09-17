import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get toolbar settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("devToolbarSettings").first();

    // If no settings exist, return default buttons
    if (!settings) {
      return {
        buttons: getDefaultButtons(),
        updatedAt: Date.now(),
      };
    }

    return settings;
  },
});

// Save toolbar settings
export const saveSettings = mutation({
  args: {
    buttons: v.array(v.object({
      name: v.string(),
      url: v.string(),
      favorite: v.boolean(),
      color: v.string(),
      order: v.optional(v.number()),
      isDivider: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if settings already exist
    const existing = await ctx.db.query("devToolbarSettings").first();

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        buttons: args.buttons,
        updatedAt: Date.now(),
      });
    } else {
      // Create new settings
      await ctx.db.insert("devToolbarSettings", {
        buttons: args.buttons,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get default button configuration
function getDefaultButtons() {
  return [
    // === MAIN PAGES ===
    { name: "Home", url: "http://localhost:3100/", favorite: false, color: 'default' },
    { name: "Hub", url: "http://localhost:3100/hub", favorite: false, color: 'default' },
    { name: "Hub2", url: "http://localhost:3100/hub2", favorite: false, color: 'default' },

    // === OPERATIONS ===
    { name: "Essence Donut", url: "http://localhost:3100/essence-donut", favorite: false, color: 'default' },

    // === PRODUCTION ===
    { name: "Crafting", url: "http://localhost:3100/crafting", favorite: false, color: 'default' },
    { name: "Incinerator", url: "http://localhost:3100/incinerator", favorite: false, color: 'default' },
    { name: "Shop", url: "http://localhost:3100/shop", favorite: false, color: 'default' },
    { name: "Shop WOW", url: "http://localhost:3100/shop-wow", favorite: false, color: 'default' },
    { name: "Bank", url: "http://localhost:3100/bank", favorite: false, color: 'default' },
    { name: "Inventory", url: "http://localhost:3100/inventory", favorite: false, color: 'default' },

    // === MEKS & TALENTS ===
    { name: "CiruTree", url: "http://localhost:3100/cirutree", favorite: false, color: 'default' },
    { name: "Achievements", url: "http://localhost:3100/achievements", favorite: false, color: 'default' },
    { name: "XP Allocation", url: "http://localhost:3100/xp-allocation", favorite: false, color: 'default' },
    { name: "Talent Builder", url: "http://localhost:3100/talent-builder", favorite: false, color: 'default' },

    // === MANAGEMENT ===
    { name: "Profile", url: "http://localhost:3100/profile", favorite: false, color: 'default' },
    { name: "Search", url: "http://localhost:3100/search", favorite: false, color: 'default' },
    { name: "Leaderboard", url: "http://localhost:3100/leaderboard", favorite: false, color: 'default' },
    { name: "Mek Selector", url: "http://localhost:3100/mek-selector", favorite: false, color: 'default' },

    // === CONTRACTS & MISSIONS ===
    { name: "Contracts", url: "http://localhost:3100/contracts", favorite: false, color: 'default' },
    { name: "Contracts Active", url: "http://localhost:3100/contracts/active", favorite: false, color: 'default' },
    { name: "Single Missions", url: "http://localhost:3100/contracts/single-missions", favorite: false, color: 'default' },
    { name: "Story Chapters", url: "http://localhost:3100/contracts/chapters", favorite: false, color: 'default' },
    { name: "Contracts Button Demo", url: "http://localhost:3100/contracts/button-demo", favorite: false, color: 'default' },

    // === SCRAP YARD & GAMES ===
    { name: "Scrapyard", url: "http://localhost:3100/scrapyard", favorite: false, color: 'default' },
    { name: "Story Climb", url: "http://localhost:3100/scrap-yard/story-climb", favorite: false, color: 'default' },
    { name: "Block Game", url: "http://localhost:3100/scrap-yard/block-game", favorite: false, color: 'default' },

    // === CHIPS & SPECIAL ===
    { name: "Mek Chips 3", url: "http://localhost:3100/mek-chips-3", favorite: false, color: 'default' },
    { name: "Chip Builder", url: "http://localhost:3100/admin/chip-builder", favorite: false, color: 'default' },
    { name: "Sphere Selector", url: "http://localhost:3100/sphere-selector", favorite: false, color: 'default' },

    // === ADMIN TOOLS ===
    { name: "Admin Dashboard", url: "http://localhost:3100/admin", favorite: false, color: 'default' },
    { name: "Admin Save System", url: "http://localhost:3100/admin-save", favorite: false, color: 'default' },
    { name: "Admin Shop Manager", url: "http://localhost:3100/admin-shop", favorite: false, color: 'default' },
    { name: "Admin Sphere", url: "http://localhost:3100/admin-sphere", favorite: false, color: 'default' },
    { name: "Admin Master Data", url: "http://localhost:3100/admin-master-data", favorite: false, color: 'default' },
    { name: "Admin Mek Tree Tables", url: "http://localhost:3100/admin-mek-tree-tables", favorite: false, color: 'default' },
    { name: "Admin Users", url: "http://localhost:3100/admin/users", favorite: false, color: 'default' },
    { name: "Admin Buff Categories", url: "http://localhost:3100/admin/buff-categories", favorite: false, color: 'default' },
    { name: "Admin Buff Seed", url: "http://localhost:3100/admin/buff-categories/seed", favorite: false, color: 'default' },
    { name: "Admin Frames", url: "http://localhost:3100/admin/frames", favorite: false, color: 'default' },

    // === UI & TESTING ===
    { name: "UI Showcase", url: "http://localhost:3100/ui-showcase", favorite: false, color: 'default' },
    { name: "Rarity Bias", url: "http://localhost:3100/rarity-bias", favorite: false, color: 'default' }
  ];
}