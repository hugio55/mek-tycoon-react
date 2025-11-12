import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default configuration values matching landing page (same as desktop)
const DEFAULT_CONFIG = {
  starScale: 1,
  starSpeed: 3,
  starFrequency: 200,
  twinkleAmount: 0,
  twinkleSpeed: 1,
  twinkleSpeedRandomness: 50,
  sizeRandomness: 50,
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  twinkleAmount2: 0,
  twinkleSpeed2: 1,
  twinkleSpeedRandomness2: 50,
  sizeRandomness2: 50,
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  spawnDelay3: 50,
  twinkleAmount3: 0,
  twinkleSpeed3: 1,
  twinkleSpeedRandomness3: 50,
  sizeRandomness3: 50,
  bgStarTwinkleAmount: 30,
  bgStarTwinkleSpeed: 0.5,
  bgStarTwinkleSpeedRandomness: 50,
  bgStarSizeRandomness: 50,
  bgStarCount: 800,
  bgStarMinBrightness: 0.1,
  bgStarMaxBrightness: 0.4,
  starFadePosition: 60,
  starFadeFeatherSize: 200,
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
  motionBlurEnabled2: true,
  blurIntensity2: 50,
  descriptionColor: 'text-yellow-400/90',
  designVariation: 'modern' as 'modern' | 'industrial' | 'neon',
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
  powerButtonScale: 1,
  powerButtonVerticalOffset: 0,
  powerButtonHorizontalOffset: 0,
  powerButtonGlowEnabled: true,
  speakerIconStyle: 'minimal' as 'minimal' | 'geometric' | 'bars' | 'hologram' | 'pulse',
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImage1: '',
  phaseImage2: '',
  phaseImage3: '',
  phaseImage4: '',
  phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  phaseImageIdleOpacity: 100,
  phaseColumnYOffset: 0,
  descriptionCardBlur: 40,
  descriptionCardDarkness: 40,
  descriptionCardBorder: true,
  logoFadeDuration: 1000,
  lightboxBackdropDarkness: 95,
  audioToggleSize: 96,
  joinBetaFont: 'Orbitron',
  joinBetaFontSize: 32,
  joinBetaColor: 'text-white',
  joinBetaHorizontalOffset: 0,
  joinBetaVerticalOffset: 0,
};

// Get the current mobile landing debug settings (returns default if not found)
export const getLandingDebugSettingsMobile = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("landingDebugSettingsMobile")
      .first();

    if (!settings) {
      return DEFAULT_CONFIG;
    }

    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_CONFIG, ...settings.config };
  },
});

// Update mobile landing debug settings (creates if not exists)
export const updateLandingDebugSettingsMobile = mutation({
  args: {
    config: v.any(), // Full config object
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingDebugSettingsMobile")
      .first();

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        config: args.config,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new settings document
      const id = await ctx.db.insert("landingDebugSettingsMobile", {
        config: args.config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});

// Reset settings to defaults
export const resetLandingDebugSettingsMobile = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugSettingsMobile")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        config: DEFAULT_CONFIG,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("landingDebugSettingsMobile", {
        config: DEFAULT_CONFIG,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
