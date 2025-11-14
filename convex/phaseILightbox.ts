import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get ONLY Phase I lightbox settings (convenience wrapper)
export const getPhaseILightboxSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("landingDebugUnified")
      .first();

    if (!settings?.shared) {
      // Return defaults if no settings exist
      return {
        phaseILightboxContent: 'Default Phase I lightbox content text goes here.',
        phaseIVideoScale: 1.0,
        phaseIVideoPositionX: 0,
        phaseIVideoPositionY: 0,
        phaseIBackdropBlur: 20,
        phaseITextFont: 'Arial',
        phaseITextFontSize: 16,
        phaseITextColor: 'text-white/70',
        phaseILightboxWidth: 1280,
      };
    }

    // Extract only Phase I lightbox settings from shared settings
    return {
      phaseILightboxContent: settings.shared.phaseILightboxContent || 'Default Phase I lightbox content text goes here.',
      phaseIVideoScale: settings.shared.phaseIVideoScale || 1.0,
      phaseIVideoPositionX: settings.shared.phaseIVideoPositionX || 0,
      phaseIVideoPositionY: settings.shared.phaseIVideoPositionY || 0,
      phaseIBackdropBlur: settings.shared.phaseIBackdropBlur || 20,
      phaseITextFont: settings.shared.phaseITextFont || 'Arial',
      phaseITextFontSize: settings.shared.phaseITextFontSize || 16,
      phaseITextColor: settings.shared.phaseITextColor || 'text-white/70',
      phaseILightboxWidth: settings.shared.phaseILightboxWidth || 1280,
    };
  },
});

// Update Phase I lightbox settings (partial update - only updates Phase I fields)
export const updatePhaseILightboxSettings = mutation({
  args: {
    phaseILightboxContent: v.optional(v.string()),
    phaseIVideoScale: v.optional(v.number()),
    phaseIVideoPositionX: v.optional(v.number()),
    phaseIVideoPositionY: v.optional(v.number()),
    phaseIBackdropBlur: v.optional(v.number()),
    phaseITextFont: v.optional(v.string()),
    phaseITextFontSize: v.optional(v.number()),
    phaseITextColor: v.optional(v.string()),
    phaseILightboxWidth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (args.phaseILightboxContent !== undefined) updates.phaseILightboxContent = args.phaseILightboxContent;
    if (args.phaseIVideoScale !== undefined) updates.phaseIVideoScale = args.phaseIVideoScale;
    if (args.phaseIVideoPositionX !== undefined) updates.phaseIVideoPositionX = args.phaseIVideoPositionX;
    if (args.phaseIVideoPositionY !== undefined) updates.phaseIVideoPositionY = args.phaseIVideoPositionY;
    if (args.phaseIBackdropBlur !== undefined) updates.phaseIBackdropBlur = args.phaseIBackdropBlur;
    if (args.phaseITextFont !== undefined) updates.phaseITextFont = args.phaseITextFont;
    if (args.phaseITextFontSize !== undefined) updates.phaseITextFontSize = args.phaseITextFontSize;
    if (args.phaseITextColor !== undefined) updates.phaseITextColor = args.phaseITextColor;
    if (args.phaseILightboxWidth !== undefined) updates.phaseILightboxWidth = args.phaseILightboxWidth;

    if (!existing) {
      // Create new settings with defaults + updates
      const defaultShared = {
        selectedFont: 'Orbitron',
        descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
        descriptionColor: 'text-yellow-400/90',
        designVariation: 'modern',
        phaseHeaderFont: 'Orbitron',
        phaseHeaderColor: 'text-white/70',
        phaseDescriptionFont: 'Arial',
        soundLabelFont: 'Orbitron',
        soundLabelColor: 'text-yellow-400/90',
        powerButtonGlowEnabled: true,
        speakerIconStyle: 'geometric',
        phaseImage1: '',
        phaseImage2: '',
        phaseImage3: '',
        phaseImage4: '',
        phaseImageBlendMode: 'normal',
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
        starsEnabled: true,
        oeLogoUrl: '#',
        discordUrl: 'https://discord.gg/your-discord',
        twitterUrl: 'https://twitter.com/your-twitter',
        websiteUrl: 'https://your-website.com',
        // Phase I defaults
        phaseILightboxContent: 'Default Phase I lightbox content text goes here.',
        phaseIVideoScale: 1.0,
        phaseIVideoPositionX: 0,
        phaseIVideoPositionY: 0,
        phaseIBackdropBlur: 20,
        phaseITextFont: 'Arial',
        phaseITextFontSize: 16,
        phaseITextColor: 'text-white/70',
      };

      const id = await ctx.db.insert("landingDebugUnified", {
        desktop: {},
        mobile: {},
        shared: { ...defaultShared, ...updates },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    } else {
      // Update existing settings - merge updates into shared
      const updatedShared = { ...existing.shared, ...updates };
      await ctx.db.patch(existing._id, {
        shared: updatedShared,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
  },
});

// Reset Phase I lightbox settings to defaults (leaves other settings untouched)
export const resetPhaseILightboxSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("landingDebugUnified")
      .first();

    const defaults = {
      phaseILightboxContent: 'Default Phase I lightbox content text goes here.',
      phaseIVideoScale: 1.0,
      phaseIVideoPositionX: 0,
      phaseIVideoPositionY: 0,
      phaseIBackdropBlur: 20,
      phaseITextFont: 'Arial',
      phaseITextFontSize: 16,
      phaseITextColor: 'text-white/70',
    };

    if (!existing) {
      // Create new settings with defaults
      const defaultShared = {
        selectedFont: 'Orbitron',
        descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
        descriptionColor: 'text-yellow-400/90',
        designVariation: 'modern',
        phaseHeaderFont: 'Orbitron',
        phaseHeaderColor: 'text-white/70',
        phaseDescriptionFont: 'Arial',
        soundLabelFont: 'Orbitron',
        soundLabelColor: 'text-yellow-400/90',
        powerButtonGlowEnabled: true,
        speakerIconStyle: 'geometric',
        phaseImage1: '',
        phaseImage2: '',
        phaseImage3: '',
        phaseImage4: '',
        phaseImageBlendMode: 'normal',
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
        starsEnabled: true,
        oeLogoUrl: '#',
        discordUrl: 'https://discord.gg/your-discord',
        twitterUrl: 'https://twitter.com/your-twitter',
        websiteUrl: 'https://your-website.com',
        ...defaults,
      };

      const id = await ctx.db.insert("landingDebugUnified", {
        desktop: {},
        mobile: {},
        shared: defaultShared,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    } else {
      // Update only Phase I fields to defaults
      const updatedShared = { ...existing.shared, ...defaults };
      await ctx.db.patch(existing._id, {
        shared: updatedShared,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
  },
});
