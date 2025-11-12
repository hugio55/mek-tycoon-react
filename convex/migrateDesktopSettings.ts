import { mutation } from "./_generated/server";

// One-time migration to restore user's previous desktop settings
export default mutation({
  args: {},
  handler: async (ctx) => {
    // User's previous desktop configuration from landingDebugSettings table
    const oldDesktopConfig = {
      audioLightboxDescriptionFontSize: 18,
      audioToggleScale: 0.6,
      audioToggleSize: 84,
      bgStarCount: 950,
      bgStarMaxBrightness: 0.45,
      bgStarMinBrightness: 0.25,
      bgStarSizeRandomness: 10,
      bgStarTwinkleAmount: 100,
      bgStarTwinkleSpeed: 2.7,
      bgStarTwinkleSpeedRandomness: 100,
      bgYPosition: 0,
      blurIntensity: 50,
      blurIntensity2: 50,
      descriptionFontSize: 15,
      descriptionVerticalPosition: 10,
      descriptionXOffset: 0,
      descriptionYOffset: -130,
      joinBetaFontSize: 30,
      joinBetaHorizontalOffset: 0,
      joinBetaVerticalOffset: -170,
      lineLength2: 2.4,
      lineLength3: 5,
      logoSize: 500,
      logoYPosition: 0,
      motionBlurEnabled: true,
      motionBlurEnabled2: false,
      phaseBlurAmount: 0,
      phaseBlurAmountSelected: 14,
      phaseColumnHeight: 600,
      phaseColumnYOffset: -150,
      phaseDescriptionFontSize: 12,
      phaseFadePosition: 60,
      phaseHeaderFontSize: 35,
      phaseHoverDarkeningIntensity: 90,
      phaseIdleBackdropBlur: 8,
      phaseImageDarkening: 0,
      phaseImageIdleOpacity: 100,
      powerButtonHorizontalOffset: 21,
      powerButtonScale: 0.65,
      powerButtonVerticalOffset: -20,
      proceedButtonSize: 1,
      proceedButtonVerticalPosition: -55,
      sizeRandomness: 5,
      sizeRandomness2: 50,
      sizeRandomness3: 50,
      soundLabelHorizontalOffset: 0,
      soundLabelSize: 16,
      soundLabelVerticalOffset: 0,
      spawnDelay3: 470,
      starFadeFeatherSize: 480,
      starFadePosition: 23,
      starFrequency: 540,
      starFrequency2: 105,
      starFrequency3: 1,
      starScale: 0.3,
      starScale2: 0.3,
      starScale3: 0.9,
      starSpeed: 1.5,
      starSpeed2: 10,
      starSpeed3: 125,
      toggleGroupVerticalPosition: -10,
      toggleTextGap: 4,
      twinkleAmount: 35,
      twinkleAmount2: 30,
      twinkleAmount3: 0,
      twinkleSpeed: 5,
      twinkleSpeed2: 5,
      twinkleSpeed3: 1,
      twinkleSpeedRandomness: 55,
      twinkleSpeedRandomness2: 60,
      twinkleSpeedRandomness3: 50,
    };

    const oldSharedConfig = {
      selectedFont: "Saira",
      descriptionText: "An epic idle strategy game where Mekanism NFTs build empires.\nComing soon.",
      descriptionColor: "text-gray-400",
      designVariation: "modern" as const,
      phaseHeaderFont: "Rajdhani",
      phaseHeaderColor: "text-white/70",
      phaseDescriptionFont: "Saira",
      soundLabelFont: "Orbitron",
      soundLabelColor: "text-yellow-400/90",
      powerButtonGlowEnabled: true,
      speakerIconStyle: "geometric" as const,
      phaseImage1: "",
      phaseImage2: "",
      phaseImage3: "",
      phaseImage4: "",
      phaseImageBlendMode: "normal" as const,
      descriptionCardBlur: 40,
      descriptionCardDarkness: 40,
      descriptionCardBorder: true,
      logoFadeDuration: 1000,
      lightboxBackdropDarkness: 10,
      joinBetaFont: "Rajdhani",
      joinBetaColor: "text-white",
      audioLightboxDescriptionFont: "Arial",
      audioLightboxDescriptionColor: "text-white/70",
    };

    // Get existing unified settings - check all records
    const allRecords = await ctx.db
      .query("landingDebugUnified")
      .collect();

    console.log(`Found ${allRecords.length} unified settings records`);

    let existing = allRecords.length > 0 ? allRecords[0] : null;

    if (existing) {
      // Update desktop and shared, keep existing mobile
      await ctx.db.patch(existing._id, {
        desktop: oldDesktopConfig,
        shared: oldSharedConfig,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: "Desktop settings restored from previous configuration",
        recordId: existing._id,
        settingsApplied: {
          desktop: Object.keys(oldDesktopConfig).length,
          shared: Object.keys(oldSharedConfig).length,
        },
        key_changes: [
          `Logo size: 500px (restored from your previous config)`,
          `Font: Saira (restored)`,
          `Star count: 950 background stars (restored)`,
          `Description: "An epic idle strategy game..." (restored)`,
          `Phase carousel height: 600px (restored)`,
          `All 70+ desktop settings restored`,
        ],
      };
    } else {
      // Create new record with old settings
      const defaultMobile = {
        // Default mobile config
        starScale: 0.8,
        starSpeed: 2.5,
        starFrequency: 150,
        logoSize: 300,
        descriptionFontSize: 14,
        phaseHeaderFontSize: 32,
        phaseColumnHeight: 200,
        bgStarCount: 400,
      };

      const id = await ctx.db.insert("landingDebugUnified", {
        desktop: oldDesktopConfig,
        mobile: defaultMobile,
        shared: oldSharedConfig,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: "Created new unified settings with desktop configuration restored",
        recordId: id,
        settingsApplied: {
          desktop: Object.keys(oldDesktopConfig).length,
          shared: Object.keys(oldSharedConfig).length,
        },
      };
    }
  },
});
