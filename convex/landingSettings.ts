import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default configuration values matching landing-debug page
const DEFAULT_CONFIG = {
  starScale: 1,
  starSpeed: 3,
  starFrequency: 200,
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  spawnDelay3: 50,
  logoSize: 600,
  logoYPosition: 0,
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
  descriptionXOffset: 0,
  descriptionYOffset: 0,
  bgYPosition: 0,
  motionBlurEnabled: true,
  blurIntensity: 50,
  descriptionColor: 'text-yellow-400/90',
  designVariation: 'modern',
  phaseHeaderFont: 'Orbitron',
  phaseHeaderFontSize: 48,
  phaseHeaderColor: 'text-white/70',
  phaseDescriptionFont: 'Arial',
  phaseDescriptionFontSize: 16,
  soundLabelFont: 'Orbitron',
  soundLabelSize: 16,
  soundLabelColor: 'text-yellow-400/90',
  soundLabelVerticalOffset: 0,
  soundLabelHorizontalOffset: 0,
  motionBlurEnabled2: false,
  blurIntensity2: 50,
  powerButtonScale: 1,
  powerButtonVerticalOffset: 0,
  powerButtonHorizontalOffset: 0,
  powerButtonGlowEnabled: true,
  speakerIconStyle: 'minimal',
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImage1: '',
  phaseImage2: '',
  phaseImage3: '',
  phaseImage4: '',
  phaseImageBlendMode: 'normal',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  phaseColumnYOffset: 0,
  descriptionCardBlur: 40,
  descriptionCardDarkness: 40,
  descriptionCardBorder: true,
};

// Get landing settings (returns default or stored config)
export const getLandingSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("landingDebugSettings")
      .first();

    if (settings) {
      // Return stored config merged with defaults (in case new fields were added)
      return {
        ...DEFAULT_CONFIG,
        ...settings.config,
      };
    }

    // Return defaults if no settings exist
    return DEFAULT_CONFIG;
  },
});

// Update landing settings (creates if doesn't exist, updates if it does)
export const updateLandingSettings = mutation({
  args: {
    config: v.any(), // Full config object
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingDebugSettings")
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        config: args.config,
        updatedAt: now,
      });
      return { success: true, message: "Settings updated" };
    } else {
      // Create new settings document
      await ctx.db.insert("landingDebugSettings", {
        config: args.config,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: "Settings created" };
    }
  },
});

// Initialize default settings (useful for first-time setup or reset)
export const initializeDefaultSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugSettings")
      .first();

    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("landingDebugSettings", {
        config: DEFAULT_CONFIG,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: "Default settings initialized" };
    }

    return { success: false, message: "Settings already exist" };
  },
});

// Reset settings to defaults (overwrites existing)
export const resetToDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugSettings")
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        config: DEFAULT_CONFIG,
        updatedAt: now,
      });
      return { success: true, message: "Settings reset to defaults" };
    } else {
      await ctx.db.insert("landingDebugSettings", {
        config: DEFAULT_CONFIG,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: "Default settings created" };
    }
  },
});
