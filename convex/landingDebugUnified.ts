import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default configuration values matching landing page
// Split into desktop, mobile, and shared settings
const DEFAULT_CONFIG = {
  desktop: {
    // Desktop-specific star settings
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
    // Desktop layout
    logoSize: 600,
    logoYPosition: 0,
    descriptionFontSize: 18,
    descriptionXOffset: 0,
    descriptionYOffset: 0,
    bgYPosition: 0,
    // Desktop motion blur
    motionBlurEnabled: true,
    blurIntensity: 50,
    motionBlurEnabled2: true,
    blurIntensity2: 50,
    // Desktop phase carousel
    phaseHeaderFontSize: 48,
    phaseDescriptionFontSize: 16,
    phaseImageDarkening: 30,
    phaseBlurAmount: 20,
    phaseBlurAmountSelected: 5,
    phaseColumnHeight: 288,
    phaseFadePosition: 50,
    phaseHoverDarkeningIntensity: 90,
    phaseIdleBackdropBlur: 0,
    phaseImageIdleOpacity: 100,
    phaseColumnYOffset: 0,
    // Desktop audio controls
    soundLabelSize: 16,
    soundLabelVerticalOffset: 0,
    soundLabelHorizontalOffset: 0,
    powerButtonScale: 1,
    powerButtonVerticalOffset: 0,
    powerButtonHorizontalOffset: 0,
    audioToggleSize: 96,
    audioToggleScale: 1.0,
    toggleTextGap: 16,
    proceedButtonSize: 1.0,
    descriptionVerticalPosition: 0,
    toggleGroupVerticalPosition: 0,
    proceedButtonVerticalPosition: 0,
    // Desktop join beta button
    joinBetaFontSize: 32,
    joinBetaHorizontalOffset: 0,
    joinBetaVerticalOffset: 0,
    audioLightboxDescriptionFontSize: 18,
  },
  mobile: {
    // Mobile-specific star settings (can override desktop)
    starScale: 0.8,
    starSpeed: 2.5,
    starFrequency: 150,
    twinkleAmount: 0,
    twinkleSpeed: 1,
    twinkleSpeedRandomness: 50,
    sizeRandomness: 50,
    starScale2: 0.8,
    starSpeed2: 8,
    starFrequency2: 75,
    lineLength2: 1.5,
    twinkleAmount2: 0,
    twinkleSpeed2: 1,
    twinkleSpeedRandomness2: 50,
    sizeRandomness2: 50,
    starScale3: 0.8,
    starSpeed3: 8,
    starFrequency3: 75,
    lineLength3: 1.5,
    spawnDelay3: 60,
    twinkleAmount3: 0,
    twinkleSpeed3: 1,
    twinkleSpeedRandomness3: 50,
    sizeRandomness3: 50,
    bgStarTwinkleAmount: 25,
    bgStarTwinkleSpeed: 0.5,
    bgStarTwinkleSpeedRandomness: 50,
    bgStarSizeRandomness: 50,
    bgStarCount: 400,
    bgStarMinBrightness: 0.1,
    bgStarMaxBrightness: 0.4,
    starFadePosition: 60,
    starFadeFeatherSize: 150,
    // Mobile layout
    logoSize: 300,
    logoYPosition: 0,
    descriptionFontSize: 14,
    descriptionXOffset: 0,
    descriptionYOffset: 0,
    bgYPosition: 0,
    // Mobile motion blur
    motionBlurEnabled: false,
    blurIntensity: 30,
    motionBlurEnabled2: false,
    blurIntensity2: 30,
    // Mobile phase carousel
    phaseHeaderFontSize: 32,
    phaseDescriptionFontSize: 14,
    phaseImageDarkening: 30,
    phaseBlurAmount: 15,
    phaseBlurAmountSelected: 3,
    phaseColumnHeight: 200,
    phaseFadePosition: 50,
    phaseHoverDarkeningIntensity: 90,
    phaseIdleBackdropBlur: 0,
    phaseImageIdleOpacity: 100,
    phaseColumnYOffset: 0,
    // Mobile audio controls
    soundLabelSize: 14,
    soundLabelVerticalOffset: 0,
    soundLabelHorizontalOffset: 0,
    powerButtonScale: 0.8,
    powerButtonVerticalOffset: 0,
    powerButtonHorizontalOffset: 0,
    audioToggleSize: 72,
    audioToggleScale: 1.0,
    toggleTextGap: 12,
    proceedButtonSize: 0.9,
    descriptionVerticalPosition: 0,
    toggleGroupVerticalPosition: 0,
    proceedButtonVerticalPosition: 0,
    // Mobile join beta button
    joinBetaFontSize: 24,
    joinBetaHorizontalOffset: 0,
    joinBetaVerticalOffset: 0,
    audioLightboxDescriptionFontSize: 16,
  },
  shared: {
    // Settings that apply to both desktop and mobile
    selectedFont: 'Orbitron',
    descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
    descriptionColor: 'text-yellow-400/90',
    designVariation: 'modern' as 'modern' | 'industrial' | 'neon',
    phaseHeaderFont: 'Orbitron',
    phaseHeaderColor: 'text-white/70',
    phaseDescriptionFont: 'Arial',
    soundLabelFont: 'Orbitron',
    soundLabelColor: 'text-yellow-400/90',
    powerButtonGlowEnabled: true,
    speakerIconStyle: 'geometric' as 'minimal' | 'geometric' | 'bars' | 'hologram' | 'pulse',
    phaseImage1: '',
    phaseImage2: '',
    phaseImage3: '',
    phaseImage4: '',
    phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
    descriptionCardBlur: 40,
    descriptionCardDarkness: 40,
    descriptionCardBorder: true,
    logoFadeDuration: 4000,
    lightboxBackdropDarkness: 95,
    joinBetaFont: 'Orbitron',
    joinBetaColor: 'text-white',
    audioLightboxDescriptionFont: 'Arial',
    audioLightboxDescriptionColor: 'text-white/70',
    audioDescriptionText: 'For full immersion...',
    audioConsentFadeDuration: 500,
    forceShowAudioConsent: false,
    // Star systems master toggle
    starsEnabled: true,
  },
};

// Get the unified landing debug settings
export const getUnifiedLandingDebugSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (!settings) {
      return DEFAULT_CONFIG;
    }

    // Merge with defaults to ensure all fields exist
    return {
      desktop: { ...DEFAULT_CONFIG.desktop, ...(settings.desktop || {}) },
      mobile: { ...DEFAULT_CONFIG.mobile, ...(settings.mobile || {}) },
      shared: { ...DEFAULT_CONFIG.shared, ...(settings.shared || {}) },
    };
  },
});

// Update unified landing debug settings
export const updateUnifiedLandingDebugSettings = mutation({
  args: {
    desktop: v.optional(v.any()),
    mobile: v.optional(v.any()),
    shared: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    const updatedSettings = {
      desktop: args.desktop || (existing?.desktop || DEFAULT_CONFIG.desktop),
      mobile: args.mobile || (existing?.mobile || DEFAULT_CONFIG.mobile),
      shared: args.shared || (existing?.shared || DEFAULT_CONFIG.shared),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...updatedSettings,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("landingDebugUnified", {
        ...updatedSettings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});

// Reset to defaults
export const resetUnifiedLandingDebugSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        desktop: DEFAULT_CONFIG.desktop,
        mobile: DEFAULT_CONFIG.mobile,
        shared: DEFAULT_CONFIG.shared,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("landingDebugUnified", {
        desktop: DEFAULT_CONFIG.desktop,
        mobile: DEFAULT_CONFIG.mobile,
        shared: DEFAULT_CONFIG.shared,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Migrate old settings from separate desktop/mobile tables
export const migrateFromOldTables = mutation({
  args: {},
  handler: async (ctx) => {
    // Get old desktop settings
    const oldDesktop = await ctx.db
      .query("landingDebugSettings")
      .first();

    // Get old mobile settings
    const oldMobile = await ctx.db
      .query("landingDebugSettingsMobile")
      .first();

    // Check if unified table already exists
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (existing) {
      return { success: false, message: "Unified settings already exist. Migration not needed." };
    }

    // Extract desktop-specific, mobile-specific, and shared settings
    const desktopConfig = oldDesktop?.config || {};
    const mobileConfig = oldMobile?.config || {};

    // Create new unified record
    await ctx.db.insert("landingDebugUnified", {
      desktop: { ...DEFAULT_CONFIG.desktop, ...desktopConfig },
      mobile: { ...DEFAULT_CONFIG.mobile, ...mobileConfig },
      shared: DEFAULT_CONFIG.shared,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Migration complete. Old tables preserved for backup.",
      migratedFrom: {
        desktop: !!oldDesktop,
        mobile: !!oldMobile,
      }
    };
  },
});

// Force update desktop settings (overwrites existing desktop config)
export const forceUpdateDesktop = mutation({
  args: {
    desktop: v.any(),
    shared: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        desktop: args.desktop,
        shared: args.shared || existing.shared,
        updatedAt: Date.now(),
      });
      return { success: true, message: "Desktop settings updated successfully", id: existing._id };
    } else {
      const id = await ctx.db.insert("landingDebugUnified", {
        desktop: args.desktop,
        mobile: DEFAULT_CONFIG.mobile,
        shared: args.shared || DEFAULT_CONFIG.shared,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, message: "New unified settings created with desktop config", id };
    }
  },
});

// Copy desktop settings to mobile (so mobile starts identical to desktop)
export const copyDesktopToMobile = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (!existing) {
      return { success: false, message: "No settings found to copy. Create desktop settings first." };
    }

    // Copy desktop config to mobile
    await ctx.db.patch(existing._id, {
      mobile: existing.desktop,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Desktop settings copied to mobile successfully. Mobile now starts identical to desktop.",
      copiedSettings: Object.keys(existing.desktop).length
    };
  },
});
