'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSearchParams } from 'next/navigation';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import PhaseAccordion from '@/components/PhaseAccordion';
import { SPEAKER_ICON_STYLES, type SpeakerIconStyle } from '@/components/SpeakerIcons';
import AudioConsentLightbox from '@/components/AudioConsentLightbox';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import FillTextButton from '@/components/controls/FillTextButton';
import { getMediaUrl } from '@/lib/media-url';
import { isSafariOrIOS } from '@/lib/browser-detection';
import { useLoaderContext } from '@/features/page-loader';
import Starfield2Layer from '@/components/Starfield2Layer';
import { type ProgressionState } from '@/features/landing-page/types/progression-state';
import { DEFAULT_CONFIG, STORAGE_KEY, AUDIO_CONSENT_KEY } from '@/features/landing-page/config/default-config';
import { useResponsiveLayout } from '@/features/landing-page/hooks/useResponsiveLayout';
import LandingFooter from '@/features/landing-page/components/LandingFooter';
import DebugSidebar from '@/features/landing-page/components/DebugSidebar';

// Configuration imported from /features/landing-page/config/default-config.ts

export default function LandingPage() {
  // Check for ?debug=true in URL
  const searchParams = useSearchParams();
  const [showDebugSidebar, setShowDebugSidebar] = useState(false);

  useEffect(() => {
    setShowDebugSidebar(searchParams.get('debug') === 'true');
  }, [searchParams]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Canvas compositing refs for Safari/iOS (dual-video alpha compositing)
  const colorVideoRef = useRef<HTMLVideoElement>(null);
  const alphaVideoRef = useRef<HTMLVideoElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);

  // Universal page loader context
  const { isLoading } = useLoaderContext();

  // Viewport detection for responsive settings (using hook)
  const [mobileBreakpoint, setMobileBreakpoint] = useState(DEFAULT_CONFIG.mobileBreakpoint);
  const { isMobile, windowWidth, viewportHeight, fixedViewportHeight } = useResponsiveLayout(mobileBreakpoint);

  // Browser detection for video format selection
  const [useSafariVideo, setUseSafariVideo] = useState(false);

  // Detect Safari/iOS for video format selection
  useEffect(() => {
    setUseSafariVideo(isSafariOrIOS());
    // Browser detected for video selection
  }, []);

  // Load settings from UNIFIED Convex table (with old table fallback)
  const unifiedSettings = useQuery(api.landingDebugUnified.getUnifiedLandingDebugSettings);
  const oldDbSettings = useQuery(api.landingDebugSettings.getLandingDebugSettings);

  // Choose desktop or mobile config based on viewport
  const dbSettings = unifiedSettings
    ? { ...unifiedSettings.shared, ...(isMobile ? unifiedSettings.mobile : unifiedSettings.desktop) }
    : oldDbSettings; // Fallback to old system if unified doesn't exist yet

  // Log when query data changes
  useEffect(() => {
    console.log('[🔨SYNC] Step 4 - Query data updated:', {
      hasUnified: !!unifiedSettings,
      hasOld: !!oldDbSettings,
      starsEnabled: dbSettings?.starsEnabled,
      timestamp: Date.now()
    });
  }, [unifiedSettings, oldDbSettings, dbSettings]);

  // Debug logging for config selection
  useEffect(() => {
    if (unifiedSettings) {
      console.log('[🔍BLUR-SYNC] Step 1 - Database query returned:', {
        source: 'unified',
        mode: isMobile ? 'mobile' : 'desktop',
        footerBlurAmount: dbSettings?.footerBlurAmount,
        phaseIdleBackdropBlur: dbSettings?.phaseIdleBackdropBlur,
        disablePhaseAccordionBlur: dbSettings?.disablePhaseAccordionBlur
      });
    } else if (oldDbSettings) {
      console.log('[🔍BLUR-SYNC] Step 1 - Database query returned:', {
        source: 'old fallback',
        footerBlurAmount: dbSettings?.footerBlurAmount,
        phaseIdleBackdropBlur: dbSettings?.phaseIdleBackdropBlur,
        disablePhaseAccordionBlur: dbSettings?.disablePhaseAccordionBlur
      });
    }
  }, [unifiedSettings, oldDbSettings, isMobile, dbSettings]);

  // 🔥 CRITICAL: Sync database settings to local state
  // Without this, sidebar changes don't affect the page!
  useEffect(() => {
    if (!dbSettings) return;

    console.log('[🔄SYNC] Applying database settings to local state:', dbSettings);

    // Star system master toggle
    if (dbSettings.starsEnabled !== undefined) setStarsEnabled(dbSettings.starsEnabled);

    // Layer enable/disable
    if (dbSettings.bgStarEnabled !== undefined) setBgStarEnabled(dbSettings.bgStarEnabled);
    if (dbSettings.layer1Enabled !== undefined) setLayer1Enabled(dbSettings.layer1Enabled);
    if (dbSettings.layer2Enabled !== undefined) setLayer2Enabled(dbSettings.layer2Enabled);
    if (dbSettings.layer3Enabled !== undefined) setLayer3Enabled(dbSettings.layer3Enabled);

    // Layer 1 controls
    if (dbSettings.starScale !== undefined) setStarScale(dbSettings.starScale);
    if (dbSettings.starSpeed !== undefined) setStarSpeed(dbSettings.starSpeed);
    if (dbSettings.starFrequency !== undefined) setStarFrequency(dbSettings.starFrequency);
    if (dbSettings.twinkleAmount !== undefined) setTwinkleAmount(dbSettings.twinkleAmount);
    if (dbSettings.twinkleSpeed !== undefined) setTwinkleSpeed(dbSettings.twinkleSpeed);
    if (dbSettings.twinkleSpeedRandomness !== undefined) setTwinkleSpeedRandomness(dbSettings.twinkleSpeedRandomness);
    if (dbSettings.sizeRandomness !== undefined) setSizeRandomness(dbSettings.sizeRandomness);

    // Layer 2 controls
    if (dbSettings.starScale2 !== undefined) setStarScale2(dbSettings.starScale2);
    if (dbSettings.starSpeed2 !== undefined) setStarSpeed2(dbSettings.starSpeed2);
    if (dbSettings.starFrequency2 !== undefined) setStarFrequency2(dbSettings.starFrequency2);
    if (dbSettings.lineLength2 !== undefined) setLineLength2(dbSettings.lineLength2);
    if (dbSettings.twinkleAmount2 !== undefined) setTwinkleAmount2(dbSettings.twinkleAmount2);
    if (dbSettings.twinkleSpeed2 !== undefined) setTwinkleSpeed2(dbSettings.twinkleSpeed2);
    if (dbSettings.twinkleSpeedRandomness2 !== undefined) setTwinkleSpeedRandomness2(dbSettings.twinkleSpeedRandomness2);
    if (dbSettings.sizeRandomness2 !== undefined) setSizeRandomness2(dbSettings.sizeRandomness2);

    // Layer 3 controls
    if (dbSettings.starScale3 !== undefined) setStarScale3(dbSettings.starScale3);
    if (dbSettings.starSpeed3 !== undefined) setStarSpeed3(dbSettings.starSpeed3);
    if (dbSettings.starFrequency3 !== undefined) setStarFrequency3(dbSettings.starFrequency3);
    if (dbSettings.lineLength3 !== undefined) setLineLength3(dbSettings.lineLength3);
    if (dbSettings.brightness3 !== undefined) setBrightness3(dbSettings.brightness3);
    if (dbSettings.spawnDelay3 !== undefined) setSpawnDelay3(dbSettings.spawnDelay3);
    if (dbSettings.twinkleAmount3 !== undefined) setTwinkleAmount3(dbSettings.twinkleAmount3);
    if (dbSettings.twinkleSpeed3 !== undefined) setTwinkleSpeed3(dbSettings.twinkleSpeed3);
    if (dbSettings.twinkleSpeedRandomness3 !== undefined) setTwinkleSpeedRandomness3(dbSettings.twinkleSpeedRandomness3);
    if (dbSettings.sizeRandomness3 !== undefined) setSizeRandomness3(dbSettings.sizeRandomness3);

    // Background static stars
    if (dbSettings.bgStarTwinkleAmount !== undefined) setBgStarTwinkleAmount(dbSettings.bgStarTwinkleAmount);
    if (dbSettings.bgStarTwinkleSpeed !== undefined) setBgStarTwinkleSpeed(dbSettings.bgStarTwinkleSpeed);
    if (dbSettings.bgStarTwinkleSpeedRandomness !== undefined) setBgStarTwinkleSpeedRandomness(dbSettings.bgStarTwinkleSpeedRandomness);
    if (dbSettings.bgStarSizeRandomness !== undefined) setBgStarSizeRandomness(dbSettings.bgStarSizeRandomness);
    if (dbSettings.bgStarSize !== undefined) setBgStarSize(dbSettings.bgStarSize);
    if (dbSettings.bgStarCount !== undefined) setBgStarCount(dbSettings.bgStarCount);
    if (dbSettings.bgStarMinBrightness !== undefined) setBgStarMinBrightness(dbSettings.bgStarMinBrightness);
    if (dbSettings.bgStarMaxBrightness !== undefined) setBgStarMaxBrightness(dbSettings.bgStarMaxBrightness);
    if (dbSettings.starFadePosition !== undefined) setStarFadePosition(dbSettings.starFadePosition);
    if (dbSettings.starFadeFeatherSize !== undefined) setStarFadeFeatherSize(dbSettings.starFadeFeatherSize);

    // Layout controls
    if (dbSettings.logoSize !== undefined) setLogoSize(dbSettings.logoSize);
    if (dbSettings.logoYPosition !== undefined) setLogoYPosition(dbSettings.logoYPosition);
    if (dbSettings.selectedFont !== undefined) setSelectedFont(dbSettings.selectedFont);
    if (dbSettings.descriptionFontSize !== undefined) setDescriptionFontSize(dbSettings.descriptionFontSize);
    if (dbSettings.descriptionText !== undefined) setDescriptionText(dbSettings.descriptionText);
    if (dbSettings.bgYPosition !== undefined) setBgYPosition(dbSettings.bgYPosition);

    // Motion blur controls
    if (dbSettings.motionBlurEnabled !== undefined) setMotionBlurEnabled(dbSettings.motionBlurEnabled);
    if (dbSettings.blurIntensity !== undefined) setBlurIntensity(dbSettings.blurIntensity);
    if (dbSettings.motionBlurEnabled2 !== undefined) setMotionBlurEnabled2(dbSettings.motionBlurEnabled2);
    if (dbSettings.blurIntensity2 !== undefined) setBlurIntensity2(dbSettings.blurIntensity2);

    // Description styling
    if (dbSettings.descriptionColor !== undefined) setDescriptionColor(dbSettings.descriptionColor);
    if (dbSettings.descriptionXOffset !== undefined) setDescriptionXOffset(dbSettings.descriptionXOffset);
    if (dbSettings.descriptionYOffset !== undefined) setDescriptionYOffset(dbSettings.descriptionYOffset);

    // Phase carousel
    if (dbSettings.designVariation !== undefined) setDesignVariation(dbSettings.designVariation);
    if (dbSettings.phaseHeaderFont !== undefined) setPhaseHeaderFont(dbSettings.phaseHeaderFont);
    if (dbSettings.phaseHeaderFontSize !== undefined) setPhaseHeaderFontSize(dbSettings.phaseHeaderFontSize);
    if (dbSettings.phaseHeaderColor !== undefined) setPhaseHeaderColor(dbSettings.phaseHeaderColor);
    if (dbSettings.phaseDescriptionFont !== undefined) setPhaseDescriptionFont(dbSettings.phaseDescriptionFont);
    if (dbSettings.phaseDescriptionFontSize !== undefined) setPhaseDescriptionFontSize(dbSettings.phaseDescriptionFontSize);

    // Logo animation
    if (dbSettings.logoFadeDuration !== undefined) setLogoFadeDuration(dbSettings.logoFadeDuration);

    console.log('[✅SYNC] All settings applied to local state');
  }, [dbSettings]);

  // Layer enable/disable states
  const [bgStarEnabled, setBgStarEnabled] = useState(DEFAULT_CONFIG.bgStarEnabled);
  const [layer1Enabled, setLayer1Enabled] = useState(DEFAULT_CONFIG.layer1Enabled);
  const [layer2Enabled, setLayer2Enabled] = useState(DEFAULT_CONFIG.layer2Enabled);
  const [layer3Enabled, setLayer3Enabled] = useState(DEFAULT_CONFIG.layer3Enabled);

  // Control states - Layer 1
  const [starScale, setStarScale] = useState(DEFAULT_CONFIG.starScale);
  const [starSpeed, setStarSpeed] = useState(DEFAULT_CONFIG.starSpeed);
  const [starFrequency, setStarFrequency] = useState(DEFAULT_CONFIG.starFrequency);
  const [twinkleAmount, setTwinkleAmount] = useState(DEFAULT_CONFIG.twinkleAmount);
  const [twinkleSpeed, setTwinkleSpeed] = useState(DEFAULT_CONFIG.twinkleSpeed);
  const [twinkleSpeedRandomness, setTwinkleSpeedRandomness] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness);
  const [sizeRandomness, setSizeRandomness] = useState(DEFAULT_CONFIG.sizeRandomness);

  // Control states - Layer 2
  const [starScale2, setStarScale2] = useState(DEFAULT_CONFIG.starScale2);
  const [starSpeed2, setStarSpeed2] = useState(DEFAULT_CONFIG.starSpeed2);
  const [starFrequency2, setStarFrequency2] = useState(DEFAULT_CONFIG.starFrequency2);
  const [lineLength2, setLineLength2] = useState(DEFAULT_CONFIG.lineLength2);
  const [twinkleAmount2, setTwinkleAmount2] = useState(DEFAULT_CONFIG.twinkleAmount2);
  const [twinkleSpeed2, setTwinkleSpeed2] = useState(DEFAULT_CONFIG.twinkleSpeed2);
  const [twinkleSpeedRandomness2, setTwinkleSpeedRandomness2] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness2);
  const [sizeRandomness2, setSizeRandomness2] = useState(DEFAULT_CONFIG.sizeRandomness2);

  // Control states - Layer 3
  const [starScale3, setStarScale3] = useState(DEFAULT_CONFIG.starScale3);
  const [starSpeed3, setStarSpeed3] = useState(DEFAULT_CONFIG.starSpeed3);
  const [starFrequency3, setStarFrequency3] = useState(DEFAULT_CONFIG.starFrequency3);
  const [lineLength3, setLineLength3] = useState(DEFAULT_CONFIG.lineLength3);
  const [brightness3, setBrightness3] = useState(DEFAULT_CONFIG.brightness3);
  const [spawnDelay3, setSpawnDelay3] = useState(DEFAULT_CONFIG.spawnDelay3);
  const [twinkleAmount3, setTwinkleAmount3] = useState(DEFAULT_CONFIG.twinkleAmount3);
  const [twinkleSpeed3, setTwinkleSpeed3] = useState(DEFAULT_CONFIG.twinkleSpeed3);
  const [twinkleSpeedRandomness3, setTwinkleSpeedRandomness3] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness3);
  const [sizeRandomness3, setSizeRandomness3] = useState(DEFAULT_CONFIG.sizeRandomness3);

  // Control states - Background Static Stars
  const [bgStarTwinkleAmount, setBgStarTwinkleAmount] = useState(DEFAULT_CONFIG.bgStarTwinkleAmount);
  const [bgStarTwinkleSpeed, setBgStarTwinkleSpeed] = useState(DEFAULT_CONFIG.bgStarTwinkleSpeed);
  const [bgStarTwinkleSpeedRandomness, setBgStarTwinkleSpeedRandomness] = useState(DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
  const [bgStarSizeRandomness, setBgStarSizeRandomness] = useState(DEFAULT_CONFIG.bgStarSizeRandomness);
  const [bgStarSize, setBgStarSize] = useState(DEFAULT_CONFIG.bgStarSize);
  const [bgStarCount, setBgStarCount] = useState(DEFAULT_CONFIG.bgStarCount);
  const [bgStarMinBrightness, setBgStarMinBrightness] = useState(DEFAULT_CONFIG.bgStarMinBrightness);
  const [bgStarMaxBrightness, setBgStarMaxBrightness] = useState(DEFAULT_CONFIG.bgStarMaxBrightness);
  const [starFadePosition, setStarFadePosition] = useState(DEFAULT_CONFIG.starFadePosition);
  const [starFadeFeatherSize, setStarFadeFeatherSize] = useState(DEFAULT_CONFIG.starFadeFeatherSize);

  // Layout controls
  const [logoSize, setLogoSize] = useState(DEFAULT_CONFIG.logoSize);
  const [logoYPosition, setLogoYPosition] = useState(DEFAULT_CONFIG.logoYPosition);
  const [selectedFont, setSelectedFont] = useState(DEFAULT_CONFIG.selectedFont);
  const [descriptionFontSize, setDescriptionFontSize] = useState(DEFAULT_CONFIG.descriptionFontSize);
  const [descriptionText, setDescriptionText] = useState(DEFAULT_CONFIG.descriptionText);
  const [bgYPosition, setBgYPosition] = useState(DEFAULT_CONFIG.bgYPosition);

  // Viewport height tracking now handled by useResponsiveLayout hook

  // Motion blur controls - Layer 1
  const [motionBlurEnabled, setMotionBlurEnabled] = useState(DEFAULT_CONFIG.motionBlurEnabled);
  const [blurIntensity, setBlurIntensity] = useState(DEFAULT_CONFIG.blurIntensity);

  // Motion blur controls - Layer 2
  const [motionBlurEnabled2, setMotionBlurEnabled2] = useState(DEFAULT_CONFIG.motionBlurEnabled2);
  const [blurIntensity2, setBlurIntensity2] = useState(DEFAULT_CONFIG.blurIntensity2);

  // Description text color
  const [descriptionColor, setDescriptionColor] = useState(DEFAULT_CONFIG.descriptionColor);

  // Description offsets
  const [descriptionXOffset, setDescriptionXOffset] = useState(DEFAULT_CONFIG.descriptionXOffset);
  const [descriptionYOffset, setDescriptionYOffset] = useState(DEFAULT_CONFIG.descriptionYOffset);

  // Phase Carousel design variation
  const [designVariation, setDesignVariation] = useState<'modern' | 'industrial' | 'neon'>(DEFAULT_CONFIG.designVariation);

  // Phase header font
  const [phaseHeaderFont, setPhaseHeaderFont] = useState(DEFAULT_CONFIG.phaseHeaderFont);
  const [phaseHeaderFontSize, setPhaseHeaderFontSize] = useState(DEFAULT_CONFIG.phaseHeaderFontSize);
  const [phaseHeaderColor, setPhaseHeaderColor] = useState(DEFAULT_CONFIG.phaseHeaderColor);

  // Phase description font
  const [phaseDescriptionFont, setPhaseDescriptionFont] = useState(DEFAULT_CONFIG.phaseDescriptionFont);
  const [phaseDescriptionFontSize, setPhaseDescriptionFontSize] = useState(DEFAULT_CONFIG.phaseDescriptionFontSize);

  // ===== STATE MACHINE: Landing Page Progression =====
  const [progressionState, setProgressionState] = useState<ProgressionState>('WAITING_FOR_LOADER');

  // Comprehensive state transition logging
  useEffect(() => {
    console.log('[🎭STATE-TRANSITION]', {
      state: progressionState,
      timestamp: new Date().toISOString(),
      description:
        progressionState === 'WAITING_FOR_LOADER' ? 'Universal loader running (triangles + percentage)' :
        progressionState === 'WAITING_FOR_CONSENT' ? 'Audio consent lightbox visible over dimmed background' :
        progressionState === 'CONSENT_CLOSING' ? 'User made choice, lightbox fading out (500ms)' :
        progressionState === 'MAIN_CONTENT' ? 'Logo + stars fading in, background full brightness' :
        progressionState === 'CONTENT_COMPLETE' ? 'Logo video loaded, phase cards visible' :
        'Unknown state'
    });
  }, [progressionState]);

  // Audio controls
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [lockScrollForConsent, setLockScrollForConsent] = useState(false);

  // Legacy states (keeping for compatibility during transition)
  const [showAudioConsent, setShowAudioConsent] = useState(false);
  const [allowAudioLightbox, setAllowAudioLightbox] = useState(false);
  const [animationStage, setAnimationStage] = useState<'initial' | 'stars' | 'logo'>('initial');
  const [useVideoLogo, setUseVideoLogo] = useState(false);
  const [logoVideoLoaded, setLogoVideoLoaded] = useState(false);

  // Logo animation timing (must be declared before first use in useEffect below)
  const [logoFadeDuration, setLogoFadeDuration] = useState(DEFAULT_CONFIG.logoFadeDuration);

  // JavaScript requestAnimationFrame zoom animation
  const logoContainerRef = useRef<HTMLDivElement>(null);

  // Canvas compositing for Safari/iOS (dual-video alpha transparency)
  // DISABLED - Using GIF for all Safari/iOS (too performance-intensive)
  useEffect(() => {
    // Always skip compositing - use GIF for all Safari/iOS instead
    return;
    if (!compositeCanvasRef.current || !colorVideoRef.current || !alphaVideoRef.current) return;

    const canvas = compositeCanvasRef.current;
    const colorVideo = colorVideoRef.current;
    const alphaVideo = alphaVideoRef.current;

    // Set canvas size to match video dimensions (will be set once videos load metadata)
    const initCanvas = () => {
      if (colorVideo.videoWidth > 0 && colorVideo.videoHeight > 0) {
        canvas.width = colorVideo.videoWidth;
        canvas.height = colorVideo.videoHeight;
        // Canvas initialized
      }
    };

    colorVideo.addEventListener('loadedmetadata', initCanvas);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error('[🎨CANVAS] Failed to get 2D context');
      return;
    }

    // Create temp canvas for alpha extraction
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) {
      console.error('[🎨CANVAS] Failed to get temp 2D context');
      return;
    }

    let animationFrameId: number;
    let isCompositing = false;

    // FPS limiting for mobile performance
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 30 : 60; // 30 FPS on mobile, 60 FPS on desktop
    const frameInterval = 1000 / targetFPS;

    const composite = (currentTime: number = 0) => {
      animationFrameId = requestAnimationFrame(composite);

      // FPS limiting: skip frames if we're rendering too fast
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameInterval) return;
      lastFrameTime = currentTime - (deltaTime % frameInterval);

      if (!colorVideo.paused && !colorVideo.ended && colorVideo.readyState >= colorVideo.HAVE_CURRENT_DATA) {
        // Ensure temp canvas matches size
        if (tempCanvas.width !== canvas.width || tempCanvas.height !== canvas.height) {
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
        }

        try {
          // Draw color video
          ctx.drawImage(colorVideo, 0, 0, canvas.width, canvas.height);

          // Get pixel data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Draw alpha mask to temp canvas
          tempCtx.drawImage(alphaVideo, 0, 0, canvas.width, canvas.height);
          const alphaData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
          const alphaPixels = alphaData.data;

          // Apply alpha channel (use red channel of grayscale mask as alpha)
          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i + 3] = alphaPixels[i]; // R channel of grayscale → alpha channel
          }

          // Put composited image back
          ctx.putImageData(imageData, 0, 0);
        } catch (err) {
          console.error('[🎨CANVAS] Compositing error:', err);
        }
      }
    };

    // Handle video playback events
    const handlePlay = () => {
      if (!isCompositing) {
        // Starting canvas compositing
        isCompositing = true;
        composite();
      }
    };

    const handlePause = () => {
      // Pausing canvas compositing
      isCompositing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    // Sync both videos and handle looping
    const handleLoop = () => {
      if (colorVideo.ended && alphaVideo.ended) {
        // Videos ended, looping
        colorVideo.currentTime = 0;
        alphaVideo.currentTime = 0;
        colorVideo.play().catch(err => console.error('[🎬VIDEO] Color video loop play failed:', err));
        alphaVideo.play().catch(err => console.error('[🎬VIDEO] Alpha video loop play failed:', err));
      }
    };

    colorVideo.addEventListener('play', handlePlay);
    colorVideo.addEventListener('pause', handlePause);
    colorVideo.addEventListener('ended', handleLoop);
    alphaVideo.addEventListener('ended', handleLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      colorVideo.removeEventListener('loadedmetadata', initCanvas);
      colorVideo.removeEventListener('play', handlePlay);
      colorVideo.removeEventListener('pause', handlePause);
      colorVideo.removeEventListener('ended', handleLoop);
      alphaVideo.removeEventListener('ended', handleLoop);
    };
  }, [useSafariVideo]);

  // Start video when logo animation begins
  useEffect(() => {
    if (animationStage === 'logo') {
      // Handle Safari/iOS (all devices use GIF - no action needed, onLoad handles setLogoVideoLoaded)
      if (useSafariVideo) {
        // Safari/iOS uses GIF - logo loaded state handled by img onLoad
        console.log('[🖼️GIF] Safari/iOS using GIF for logo (no video compositing)');
      }
      // Handle Chrome/Firefox (WebM)
      else if (!useSafariVideo && videoRef.current) {
        // Starting WebM video playback
        videoRef.current.currentTime = 0;
        videoRef.current.play()
          .then(() => {
            console.log('[🎬VIDEO] WebM video started - marking logo loaded');
            setLogoVideoLoaded(true);
            console.log('[🎭STATE] Transitioning: MAIN_CONTENT → CONTENT_COMPLETE');
            setProgressionState('CONTENT_COMPLETE');
          })
          .catch(err => console.error('[🎬VIDEO] Video play failed:', err));
      }

      // Custom easing function (cubic-bezier(0, 0, 0.2, 1) approximation)
      const easeOut = (t: number): number => {
        // cubic-bezier(0, 0, 0.2, 1) approximation - starts fast, slows gradually
        return 1 - Math.pow(1 - t, 3);
      };

      // Animation parameters
      const startTime = performance.now();
      const duration = logoFadeDuration;
      const startScale = 0.92;
      const endScale = 1.0;
      const startOpacity = 0;
      const endOpacity = 1;

      // FPS limiting for mobile performance
      let lastFrameTime = 0;
      const targetFPS = isMobile ? 30 : 60; // 30 FPS on mobile, 60 FPS on desktop
      const frameInterval = 1000 / targetFPS;

      let animationFrameId: number;

      const animate = (currentTime: number) => {
        if (!logoContainerRef.current) return;

        // FPS limiting: skip frames if we're rendering too fast
        const deltaTime = currentTime - lastFrameTime;
        if (deltaTime < frameInterval) {
          animationFrameId = requestAnimationFrame(animate);
          return;
        }
        lastFrameTime = currentTime - (deltaTime % frameInterval);

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOut(progress);

        // Calculate interpolated values
        const currentScale = startScale + (endScale - startScale) * easedProgress;
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * easedProgress;

        // Apply transform and opacity
        logoContainerRef.current.style.transform = `translate3d(0, 0, 0) scale3d(${currentScale}, ${currentScale}, 1)`;
        logoContainerRef.current.style.opacity = currentOpacity.toString();

        // Continue animation if not complete
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // JavaScript animation complete
        }
      };

      // Start animation
      animationFrameId = requestAnimationFrame(animate);

      // Unlock scroll after animation completes
      setTimeout(() => {
        // Unlocking scroll after animation
        setLockScrollForConsent(false);
      }, logoFadeDuration + 500);

      // Cleanup: cancel animation on unmount
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [animationStage, logoFadeDuration, showAudioConsent, useSafariVideo, isMobile]);

  // Debug logging for animation stage changes
  useEffect(() => {
    console.log('[⭐STARS] animationStage changed to:', animationStage);
  }, [animationStage]);

  const [soundLabelFont, setSoundLabelFont] = useState(DEFAULT_CONFIG.soundLabelFont);
  const [soundLabelSize, setSoundLabelSize] = useState(DEFAULT_CONFIG.soundLabelSize);
  const [soundLabelColor, setSoundLabelColor] = useState(DEFAULT_CONFIG.soundLabelColor);
  const [soundLabelVerticalOffset, setSoundLabelVerticalOffset] = useState(DEFAULT_CONFIG.soundLabelVerticalOffset);
  const [soundLabelHorizontalOffset, setSoundLabelHorizontalOffset] = useState(DEFAULT_CONFIG.soundLabelHorizontalOffset);

  // Power button controls
  const [powerButtonScale, setPowerButtonScale] = useState(DEFAULT_CONFIG.powerButtonScale);
  const [powerButtonVerticalOffset, setPowerButtonVerticalOffset] = useState(DEFAULT_CONFIG.powerButtonVerticalOffset);
  const [powerButtonHorizontalOffset, setPowerButtonHorizontalOffset] = useState(DEFAULT_CONFIG.powerButtonHorizontalOffset);
  const [powerButtonGlowEnabled, setPowerButtonGlowEnabled] = useState(DEFAULT_CONFIG.powerButtonGlowEnabled);

  // Speaker icon style
  const [speakerIconStyle, setSpeakerIconStyle] = useState<SpeakerIconStyle>(DEFAULT_CONFIG.speakerIconStyle);

  // Phase Carousel controls (used by HorizontalTimeline)
  const [phaseImageDarkening, setPhaseImageDarkening] = useState(DEFAULT_CONFIG.phaseImageDarkening);
  const [phaseBlurAmount, setPhaseBlurAmount] = useState(DEFAULT_CONFIG.phaseBlurAmount);
  const [phaseBlurAmountSelected, setPhaseBlurAmountSelected] = useState(DEFAULT_CONFIG.phaseBlurAmountSelected);
  const [phaseColumnHeight, setPhaseColumnHeight] = useState(DEFAULT_CONFIG.phaseColumnHeight);
  const [phaseFadePosition, setPhaseFadePosition] = useState(DEFAULT_CONFIG.phaseFadePosition);
  const [phaseImageBlendMode, setPhaseImageBlendMode] = useState(DEFAULT_CONFIG.phaseImageBlendMode);
  const [phaseHoverDarkeningIntensity, setPhaseHoverDarkeningIntensity] = useState(DEFAULT_CONFIG.phaseHoverDarkeningIntensity);
  const [phaseIdleBackdropBlur, setPhaseIdleBackdropBlur] = useState(DEFAULT_CONFIG.phaseIdleBackdropBlur);
  const [phaseColumnYOffset, setPhaseColumnYOffset] = useState(DEFAULT_CONFIG.phaseColumnYOffset);

  // Debug logging for phaseIdleBackdropBlur changes
  useEffect(() => {
    console.log('[🔍BLUR] landing/page.tsx state updated:', phaseIdleBackdropBlur);
    console.log('[🔍BLUR-SYNC] Step 3 - phaseIdleBackdropBlur React state changed to:', phaseIdleBackdropBlur);
    console.log('[🔍BLUR] Stack trace:', new Error().stack);
  }, [phaseIdleBackdropBlur]);

  // Footer controls (moved here before first use in useEffect)
  const [footerBlurAmount, setFooterBlurAmount] = useState(DEFAULT_CONFIG.footerBlurAmount);

  // Debug logging for footerBlurAmount changes
  useEffect(() => {
    console.log('[🔍BLUR-SYNC] Step 3 - footerBlurAmount React state changed to:', footerBlurAmount);
  }, [footerBlurAmount]);

  // Description glass card controls
  const [descriptionCardBlur, setDescriptionCardBlur] = useState(DEFAULT_CONFIG.descriptionCardBlur);
  const [descriptionCardDarkness, setDescriptionCardDarkness] = useState(DEFAULT_CONFIG.descriptionCardDarkness);
  const [descriptionCardBorder, setDescriptionCardBorder] = useState(DEFAULT_CONFIG.descriptionCardBorder);

  // Audio Consent Lightbox controls
  const [lightboxBackdropDarkness, setLightboxBackdropDarkness] = useState(DEFAULT_CONFIG.lightboxBackdropDarkness);
  const [audioToggleSize, setAudioToggleSize] = useState(DEFAULT_CONFIG.audioToggleSize);
  const [audioToggleScale, setAudioToggleScale] = useState(DEFAULT_CONFIG.audioToggleScale);
  const [toggleTextGap, setToggleTextGap] = useState(DEFAULT_CONFIG.toggleTextGap);
  const [proceedButtonSize, setProceedButtonSize] = useState(DEFAULT_CONFIG.proceedButtonSize || 1.0);
  const [descriptionVerticalPosition, setDescriptionVerticalPosition] = useState(0);
  const [toggleGroupVerticalPosition, setToggleGroupVerticalPosition] = useState(0);
  const [proceedButtonVerticalPosition, setProceedButtonVerticalPosition] = useState(0);
  const [audioDescriptionText, setAudioDescriptionText] = useState(DEFAULT_CONFIG.audioDescriptionText);
  const [audioConsentFadeDuration, setAudioConsentFadeDuration] = useState(DEFAULT_CONFIG.audioConsentFadeDuration);

  // New two-toggle design controls
  const [toggleSize, setToggleSize] = useState(DEFAULT_CONFIG.toggleSize);
  const [toggleGap, setToggleGap] = useState(DEFAULT_CONFIG.toggleGap);
  const [toggleVerticalPosition, setToggleVerticalPosition] = useState(DEFAULT_CONFIG.toggleVerticalPosition);
  const [toggleLabelFont, setToggleLabelFont] = useState(DEFAULT_CONFIG.toggleLabelFont);
  const [toggleLabelSize, setToggleLabelSize] = useState(DEFAULT_CONFIG.toggleLabelSize);
  const [toggleLabelColor, setToggleLabelColor] = useState(DEFAULT_CONFIG.toggleLabelColor);

  // Join Beta Button controls
  const [joinBetaFont, setJoinBetaFont] = useState(DEFAULT_CONFIG.joinBetaFont);
  const [joinBetaFontSize, setJoinBetaFontSize] = useState(DEFAULT_CONFIG.joinBetaFontSize);
  const [joinBetaColor, setJoinBetaColor] = useState(DEFAULT_CONFIG.joinBetaColor);
  const [joinBetaHorizontalOffset, setJoinBetaHorizontalOffset] = useState(DEFAULT_CONFIG.joinBetaHorizontalOffset);
  const [joinBetaVerticalOffset, setJoinBetaVerticalOffset] = useState(DEFAULT_CONFIG.joinBetaVerticalOffset);

  // Footer controls
  const [footerHeight, setFooterHeight] = useState(DEFAULT_CONFIG.footerHeight);
  const [footerImageVerticalPosition, setFooterImageVerticalPosition] = useState(DEFAULT_CONFIG.footerImageVerticalPosition);
  const [oeLogoScale, setOeLogoScale] = useState(DEFAULT_CONFIG.oeLogoScale);
  const [socialIconScale, setSocialIconScale] = useState(DEFAULT_CONFIG.socialIconScale);
  const [socialIconGap, setSocialIconGap] = useState(DEFAULT_CONFIG.socialIconGap);
  const [socialIconVerticalPosition, setSocialIconVerticalPosition] = useState(DEFAULT_CONFIG.socialIconVerticalPosition);
  const [socialIconPaddingTop, setSocialIconPaddingTop] = useState(DEFAULT_CONFIG.socialIconPaddingTop);
  const [socialIconPaddingBottom, setSocialIconPaddingBottom] = useState(DEFAULT_CONFIG.socialIconPaddingBottom);
  const [footerEdgeFeathering, setFooterEdgeFeathering] = useState(DEFAULT_CONFIG.footerEdgeFeathering);

  // Mobile-specific controls
  const [mobilePhaseFooterSpacing, setMobilePhaseFooterSpacing] = useState(DEFAULT_CONFIG.mobilePhaseFooterSpacing);
  const [mobilePhaseButtonMaxWidth, setMobilePhaseButtonMaxWidth] = useState(DEFAULT_CONFIG.mobilePhaseButtonMaxWidth);

  // Star systems master toggle
  const [starsEnabled, setStarsEnabled] = useState(DEFAULT_CONFIG.starsEnabled);

  // Scroll-triggered animation state (ONE-WAY FLAG - never resets once true)
  const [hasScrolled, setHasScrolled] = useState(false);

  // Debug logging for hasScrolled state changes
  useEffect(() => {
    console.log('[📜SCROLL] hasScrolled state changed to:', hasScrolled);
    console.log('[📜SCROLL] Current isMobile:', isMobile);
    console.log('[📜SCROLL] Current windowWidth:', windowWidth);
  }, [hasScrolled, isMobile, windowWidth]);

  // Beta signup lightbox state
  const [showBetaLightbox, setShowBetaLightbox] = useState(false);

  // Speaker icon visibility state (hidden during consent lightbox, fades in after)
  const [showSpeakerIcon, setShowSpeakerIcon] = useState(false);

  // Note: phaseImage1-4 not needed here - PhaseCarousel reads directly from localStorage

  // Preload critical resources immediately on mount
  useEffect(() => {
    console.log('[📥PRELOAD] Starting resource preload');

    // Preload logo image
    const logoImg = new Image();
    logoImg.src = getMediaUrl('/logo-first-frame.webp');
    logoImg.onload = () => console.log('[📥PRELOAD] Logo image loaded');
    logoImg.onerror = () => console.error('[📥PRELOAD] Logo image failed to load');

    // Preload background image
    const bgImg = new Image();
    bgImg.src = getMediaUrl('/colored-bg-1.webp');
    bgImg.onload = () => console.log('[📥PRELOAD] Background image loaded');
    bgImg.onerror = () => console.error('[📥PRELOAD] Background image failed to load');

    // Preload video - trigger load without playing
    if (videoRef.current) {
      videoRef.current.load();
      console.log('[📥PRELOAD] Video preload started');
    }
  }, []);

  // Check for audio consent on mount (GATED by universal loader completion)
  useEffect(() => {
    window.scrollTo(0, 0);
    // Component mounted

    // GATE: Wait for universal loader to complete before showing audio lightbox
    if (!allowAudioLightbox) {
      // Audio lightbox blocked - waiting for universal loader to complete
      return;
    }

    try {
      // Check if forced to show consent via Convex config
      if (dbSettings?.forceShowAudioConsent) {
        console.log('[🔒FORCE] ✅ Force show enabled - showing consent lightbox (overrides localStorage)');
        setShowAudioConsent(true);
        setLockScrollForConsent(true);
        // Keep animationStage at 'initial' (everything hidden)
        return;
      } else {
        console.log('[🔒FORCE] ❌ Force show disabled or dbSettings not loaded yet');
      }

      const consent = localStorage.getItem(AUDIO_CONSENT_KEY);
      if (!consent) {
        // First-time visitor - show consent lightbox
        // First-time visitor - showing consent lightbox
        setShowAudioConsent(true);
        setLockScrollForConsent(true);
        // Keep animationStage at 'initial' (everything hidden)
      } else {
        // Return visitor - has already given consent
        const consentData = JSON.parse(consent);
        // Return visitor - skipping lightbox, showing stars + logo animation
        // Show stars first, then logo
        console.log('[⭐STARS] Return visitor - setting animationStage to stars');
        setAnimationStage('stars');

        setTimeout(() => {
          console.log('[⭐STARS] Stars visible - transitioning to logo');
          setAnimationStage('logo');
        }, 1500); // Stars visible for 1.5s before logo appears

        // Show speaker icon immediately for return visitors (will fade in with 3s animation)
        setShowSpeakerIcon(true);

        if (consentData.audioEnabled) {
          // Don't auto-play - just remember preference
          // Audio will only start when user clicks speaker button
          console.log('[🎵AUDIO] User previously enabled audio, but waiting for interaction');
        }
      }
    } catch (e) {
      console.error('[LANDING] Error loading audio consent:', e);
      // On error, show consent lightbox (safe fallback)
      setShowAudioConsent(true);
    }

    // Listen for debug trigger events from localStorage and postMessage
    const checkDebugTrigger = () => {
      const trigger = localStorage.getItem('mek-debug-trigger');
      if (trigger) {
        try {
          const triggerData = JSON.parse(trigger);
          if (triggerData.action === 'show-audio-consent') {
            console.log('[🐛DEBUG] Debug trigger: show-audio-consent → WAITING_FOR_CONSENT');
            setProgressionState('WAITING_FOR_CONSENT'); // Go back to consent state
            setShowAudioConsent(true);
            setLockScrollForConsent(true);
            setAnimationStage('initial'); // Reset to initial dark state
            setShowSpeakerIcon(false); // Hide speaker icon when showing consent
            // Clear the trigger so it doesn't fire again
            localStorage.removeItem('mek-debug-trigger');
          } else if (triggerData.action === 'hide-audio-consent') {
            console.log('[🐛DEBUG] Debug trigger: hide-audio-consent → CONTENT_COMPLETE');
            setProgressionState('CONTENT_COMPLETE'); // Skip to final state
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
            setShowSpeakerIcon(true); // Show speaker icon when hiding consent
            setLogoVideoLoaded(true); // Mark logo as loaded
            // Clear the trigger so it doesn't fire again
            localStorage.removeItem('mek-debug-trigger');
          } else if (triggerData.action === 'set-state' && triggerData.state) {
            console.log('[🐛DEBUG] Debug trigger: set-state →', triggerData.state);
            const newState = triggerData.state as ProgressionState;
            setProgressionState(newState);

            // Sync all legacy states to match the new progression state
            switch (newState) {
              case 'WAITING_FOR_LOADER':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'WAITING_FOR_CONSENT':
                setShowAudioConsent(true);
                setLockScrollForConsent(true);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'CONSENT_CLOSING':
                setShowAudioConsent(false);
                setLockScrollForConsent(true);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'MAIN_CONTENT':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('stars');
                setShowSpeakerIcon(true);
                setLogoVideoLoaded(false);
                setTimeout(() => setAnimationStage('logo'), 500);
                break;
              case 'CONTENT_COMPLETE':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('logo');
                setShowSpeakerIcon(true);
                setLogoVideoLoaded(true);
                break;
            }

            // Clear the trigger so it doesn't fire again
            localStorage.removeItem('mek-debug-trigger');
          }
        } catch (e) {
          console.error('Failed to parse debug trigger:', e);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === 'mek-debug-trigger') {
          checkDebugTrigger();
        }
      } catch (error) {
        console.error('[LANDING] Error in audio consent handleStorageChange:', error);
      }
    };

    const handlePostMessage = (event: MessageEvent) => {
      try {
        if (event.data?.type === 'mek-debug-trigger') {
          if (event.data?.action === 'show-audio-consent') {
            console.log('[🐛DEBUG] PostMessage trigger: show-audio-consent → WAITING_FOR_CONSENT');
            setProgressionState('WAITING_FOR_CONSENT'); // Go back to consent state
            setShowAudioConsent(true);
            setLockScrollForConsent(true);
            setAnimationStage('initial'); // Reset to initial dark state
            setShowSpeakerIcon(false); // Hide speaker icon when showing consent
          } else if (event.data?.action === 'hide-audio-consent') {
            console.log('[🐛DEBUG] PostMessage trigger: hide-audio-consent → CONTENT_COMPLETE');
            setProgressionState('CONTENT_COMPLETE'); // Skip to final state
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
            setShowSpeakerIcon(true); // Show speaker icon when hiding consent
            setLogoVideoLoaded(true); // Mark logo as loaded
          } else if (event.data?.action === 'set-state' && event.data?.state) {
            console.log('[🐛DEBUG] PostMessage trigger: set-state →', event.data.state);
            const newState = event.data.state as ProgressionState;
            setProgressionState(newState);

            // Sync all legacy states to match the new progression state
            switch (newState) {
              case 'WAITING_FOR_LOADER':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'WAITING_FOR_CONSENT':
                setShowAudioConsent(true);
                setLockScrollForConsent(true);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'CONSENT_CLOSING':
                setShowAudioConsent(false);
                setLockScrollForConsent(true);
                setAnimationStage('initial');
                setShowSpeakerIcon(false);
                setLogoVideoLoaded(false);
                break;
              case 'MAIN_CONTENT':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('stars');
                setShowSpeakerIcon(true);
                setLogoVideoLoaded(false);
                setTimeout(() => setAnimationStage('logo'), 500);
                break;
              case 'CONTENT_COMPLETE':
                setShowAudioConsent(false);
                setLockScrollForConsent(false);
                setAnimationStage('logo');
                setShowSpeakerIcon(true);
                setLogoVideoLoaded(true);
                break;
            }
          }
        }
      } catch (error) {
        console.error('[LANDING] Error in audio consent handlePostMessage:', error);
      }
    };

    // Check on mount in case trigger was set before page loaded
    checkDebugTrigger();

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Listen for postMessage from iframe parent
    window.addEventListener('message', handlePostMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handlePostMessage);
    };
  }, [dbSettings?.forceShowAudioConsent, allowAudioLightbox]);

  // STATE MACHINE: Transition from WAITING_FOR_LOADER when universal loader completes
  useEffect(() => {
    if (isLoading) {
      console.log('[⏳STATE] Universal loader still running - staying in WAITING_FOR_LOADER');
      return; // Wait for loader to finish
    }

    if (progressionState !== 'WAITING_FOR_LOADER') {
      console.log('[⏳STATE] Not in WAITING_FOR_LOADER state, skipping transition');
      return; // Already progressed past loader
    }

    console.log('[✅STATE] Universal loader complete - transitioning after 500ms delay');

    // Add 500ms buffer after loader completes for smooth transition
    const timer = setTimeout(() => {
      console.log('[🎭STATE] Transitioning: WAITING_FOR_LOADER → WAITING_FOR_CONSENT');
      setProgressionState('WAITING_FOR_CONSENT');
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, progressionState]);

  // STATE MACHINE: Handle WAITING_FOR_CONSENT state - check if we need to show lightbox or skip
  useEffect(() => {
    if (progressionState !== 'WAITING_FOR_CONSENT') return;

    console.log('[🎭STATE] Entered WAITING_FOR_CONSENT - checking audio consent status');

    try {
      // Check if forced to show consent via Convex config
      if (dbSettings?.forceShowAudioConsent) {
        console.log('[🔒FORCE] Force show enabled - keeping in WAITING_FOR_CONSENT state');
        setShowAudioConsent(true);
        setLockScrollForConsent(true);
        return; // Stay in WAITING_FOR_CONSENT until user makes choice
      }

      const consent = localStorage.getItem(AUDIO_CONSENT_KEY);
      if (!consent) {
        // First-time visitor - show consent lightbox
        console.log('[🆕STATE] First-time visitor - showing audio consent lightbox');
        setShowAudioConsent(true);
        setLockScrollForConsent(true);
        // Stay in WAITING_FOR_CONSENT until user makes choice
      } else {
        // Return visitor - skip consent, go straight to main content
        const consentData = JSON.parse(consent);
        console.log('[🔙STATE] Return visitor - skipping consent, transitioning to MAIN_CONTENT');

        // Show speaker icon for return visitors
        setShowSpeakerIcon(true);

        if (consentData.audioEnabled) {
          console.log('[🎵AUDIO] User previously enabled audio (will wait for interaction)');
        }

        // Skip to MAIN_CONTENT
        setProgressionState('MAIN_CONTENT');
      }
    } catch (e) {
      console.error('[❌STATE] Error checking audio consent:', e);
      // On error, show consent lightbox (safe fallback)
      setShowAudioConsent(true);
      setLockScrollForConsent(true);
    }
  }, [progressionState, dbSettings?.forceShowAudioConsent]);

  // STATE MACHINE: Handle MAIN_CONTENT state - start logo and stars animation
  useEffect(() => {
    if (progressionState !== 'MAIN_CONTENT') return;

    console.log('[🎭STATE] Entered MAIN_CONTENT - starting logo + stars animation');
    setAnimationStage('logo'); // Triggers video playback and star fade-in
    setLockScrollForConsent(false); // Unlock scrolling
  }, [progressionState]);

  // STATE VALIDATION: Detect browser back/forward navigation and correct progressionState
  // Prevents browser navigation from causing invalid state combinations
  useEffect(() => {
    // CRITICAL: Detect invalid state combinations due to browser navigation
    // If audio consent is showing but we're in MAIN_CONTENT or CONTENT_COMPLETE, something went wrong
    if (showAudioConsent && (progressionState === 'MAIN_CONTENT' || progressionState === 'CONTENT_COMPLETE')) {
      console.error('[🚨STATE-DESYNC] INVALID STATE DETECTED! Audio consent showing but in advanced state', {
        showAudioConsent,
        progressionState,
        expected: 'progressionState should be WAITING_FOR_CONSENT when showAudioConsent is true',
        action: 'Force-resetting to WAITING_FOR_CONSENT'
      });

      // Force correction to valid state
      setProgressionState('WAITING_FOR_CONSENT');
      setLockScrollForConsent(true);
    }

    // Log state for debugging
    console.log('[🔍STATE-CHECK] State validation:', {
      progressionState,
      showAudioConsent,
      lockScrollForConsent,
      logoVideoLoaded,
      isValid: !showAudioConsent || progressionState === 'WAITING_FOR_CONSENT' || progressionState === 'CONSENT_CLOSING'
    });
  }, [showAudioConsent, progressionState, lockScrollForConsent, logoVideoLoaded]);

  // Debug logging for progression gates
  useEffect(() => {
    console.log('[🎬PROGRESSION] Phase cards visibility check:', {
      progressionState,
      shouldShow: progressionState === 'CONTENT_COMPLETE'
    });
  }, [progressionState]);

  // Load config from Convex database (primary source) with localStorage fallback
  useEffect(() => {
    console.log('[🔨SYNC] Step 4.5 - useEffect triggered, dbSettings:', dbSettings);
    if (!dbSettings) return; // Wait for Convex data to load

    const loadConfig = (config: any) => {
      try {
        console.log('[🔍DATABASE] Full config loaded from Convex:', config);
        console.log('[🔍DATABASE] Phase description font size:', config.phaseDescriptionFontSize);
        console.log('[🔨SYNC] Step 5 prep - Config has starsEnabled:', config.starsEnabled);

        // BACKUP: Save to localStorage whenever database config loads
        localStorage.setItem(STORAGE_KEY + '-backup', JSON.stringify(config));
        console.log('[💾BACKUP] Config saved to localStorage backup');
          // Layer enable/disable
          setBgStarEnabled(config.bgStarEnabled ?? DEFAULT_CONFIG.bgStarEnabled);
          setLayer1Enabled(config.layer1Enabled ?? DEFAULT_CONFIG.layer1Enabled);
          setLayer2Enabled(config.layer2Enabled ?? DEFAULT_CONFIG.layer2Enabled);
          setLayer3Enabled(config.layer3Enabled ?? DEFAULT_CONFIG.layer3Enabled);
          // Layer 1
          setStarScale(config.starScale ?? DEFAULT_CONFIG.starScale);
          setStarSpeed(config.starSpeed ?? DEFAULT_CONFIG.starSpeed);
          setStarFrequency(config.starFrequency ?? DEFAULT_CONFIG.starFrequency);
          setTwinkleAmount(config.twinkleAmount ?? DEFAULT_CONFIG.twinkleAmount);
          setTwinkleSpeed(config.twinkleSpeed ?? DEFAULT_CONFIG.twinkleSpeed);
          setTwinkleSpeedRandomness(config.twinkleSpeedRandomness ?? DEFAULT_CONFIG.twinkleSpeedRandomness);
          setSizeRandomness(config.sizeRandomness ?? DEFAULT_CONFIG.sizeRandomness);
          setStarScale2(config.starScale2 ?? DEFAULT_CONFIG.starScale2);
          setStarSpeed2(config.starSpeed2 ?? DEFAULT_CONFIG.starSpeed2);
          setStarFrequency2(config.starFrequency2 ?? DEFAULT_CONFIG.starFrequency2);
          setLineLength2(config.lineLength2 ?? DEFAULT_CONFIG.lineLength2);
          setTwinkleAmount2(config.twinkleAmount2 ?? DEFAULT_CONFIG.twinkleAmount2);
          setTwinkleSpeed2(config.twinkleSpeed2 ?? DEFAULT_CONFIG.twinkleSpeed2);
          setTwinkleSpeedRandomness2(config.twinkleSpeedRandomness2 ?? DEFAULT_CONFIG.twinkleSpeedRandomness2);
          setSizeRandomness2(config.sizeRandomness2 ?? DEFAULT_CONFIG.sizeRandomness2);
          setStarScale3(config.starScale3 ?? DEFAULT_CONFIG.starScale3);
          setStarSpeed3(config.starSpeed3 ?? DEFAULT_CONFIG.starSpeed3);
          setStarFrequency3(config.starFrequency3 ?? DEFAULT_CONFIG.starFrequency3);
          setLineLength3(config.lineLength3 ?? DEFAULT_CONFIG.lineLength3);
          setBrightness3(config.brightness3 ?? DEFAULT_CONFIG.brightness3);
          setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
          setTwinkleAmount3(config.twinkleAmount3 ?? DEFAULT_CONFIG.twinkleAmount3);
          setTwinkleSpeed3(config.twinkleSpeed3 ?? DEFAULT_CONFIG.twinkleSpeed3);
          setTwinkleSpeedRandomness3(config.twinkleSpeedRandomness3 ?? DEFAULT_CONFIG.twinkleSpeedRandomness3);
          setSizeRandomness3(config.sizeRandomness3 ?? DEFAULT_CONFIG.sizeRandomness3);
          setBgStarTwinkleAmount(config.bgStarTwinkleAmount ?? DEFAULT_CONFIG.bgStarTwinkleAmount);
          setBgStarTwinkleSpeed(config.bgStarTwinkleSpeed ?? DEFAULT_CONFIG.bgStarTwinkleSpeed);
          setBgStarTwinkleSpeedRandomness(config.bgStarTwinkleSpeedRandomness ?? DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
          setBgStarSizeRandomness(config.bgStarSizeRandomness ?? DEFAULT_CONFIG.bgStarSizeRandomness);
          setBgStarSize(config.bgStarSize ?? DEFAULT_CONFIG.bgStarSize);
          setBgStarCount(config.bgStarCount ?? DEFAULT_CONFIG.bgStarCount);
          setBgStarMinBrightness(config.bgStarMinBrightness ?? DEFAULT_CONFIG.bgStarMinBrightness);
          setBgStarMaxBrightness(config.bgStarMaxBrightness ?? DEFAULT_CONFIG.bgStarMaxBrightness);
          setStarFadePosition(config.starFadePosition ?? DEFAULT_CONFIG.starFadePosition);
          setStarFadeFeatherSize(config.starFadeFeatherSize ?? DEFAULT_CONFIG.starFadeFeatherSize);
          setLogoSize(config.logoSize ?? DEFAULT_CONFIG.logoSize);
          setLogoYPosition(config.logoYPosition ?? DEFAULT_CONFIG.logoYPosition);
          setSelectedFont(config.selectedFont ?? DEFAULT_CONFIG.selectedFont);
          setDescriptionFontSize(config.descriptionFontSize ?? DEFAULT_CONFIG.descriptionFontSize);
          setDescriptionText(config.descriptionText ?? DEFAULT_CONFIG.descriptionText);
          setBgYPosition(config.bgYPosition ?? DEFAULT_CONFIG.bgYPosition);
          setMotionBlurEnabled(config.motionBlurEnabled ?? DEFAULT_CONFIG.motionBlurEnabled);
          setBlurIntensity(config.blurIntensity ?? DEFAULT_CONFIG.blurIntensity);
          setMotionBlurEnabled2(config.motionBlurEnabled2 ?? DEFAULT_CONFIG.motionBlurEnabled2);
          setBlurIntensity2(config.blurIntensity2 ?? DEFAULT_CONFIG.blurIntensity2);
          setDescriptionColor(config.descriptionColor ?? DEFAULT_CONFIG.descriptionColor);
          setDescriptionXOffset(config.descriptionXOffset ?? DEFAULT_CONFIG.descriptionXOffset);
          setDescriptionYOffset(config.descriptionYOffset ?? DEFAULT_CONFIG.descriptionYOffset);
          setDesignVariation(config.designVariation ?? DEFAULT_CONFIG.designVariation);
          setPhaseHeaderFont(config.phaseHeaderFont ?? DEFAULT_CONFIG.phaseHeaderFont);
          setPhaseHeaderFontSize(config.phaseHeaderFontSize ?? DEFAULT_CONFIG.phaseHeaderFontSize);
          setPhaseHeaderColor(config.phaseHeaderColor ?? DEFAULT_CONFIG.phaseHeaderColor);
          setPhaseDescriptionFont(config.phaseDescriptionFont ?? DEFAULT_CONFIG.phaseDescriptionFont);
          const phaseDescSize = config.phaseDescriptionFontSize ?? DEFAULT_CONFIG.phaseDescriptionFontSize;
          console.log('[🔍DATABASE] Setting phaseDescriptionFontSize state to:', phaseDescSize);
          setPhaseDescriptionFontSize(phaseDescSize);
          setSoundLabelFont(config.soundLabelFont ?? DEFAULT_CONFIG.soundLabelFont);
          setSoundLabelSize(config.soundLabelSize ?? DEFAULT_CONFIG.soundLabelSize);
          setSoundLabelColor(config.soundLabelColor ?? DEFAULT_CONFIG.soundLabelColor);
          setSoundLabelVerticalOffset(config.soundLabelVerticalOffset ?? DEFAULT_CONFIG.soundLabelVerticalOffset);
          setSoundLabelHorizontalOffset(config.soundLabelHorizontalOffset ?? DEFAULT_CONFIG.soundLabelHorizontalOffset);
          setPowerButtonScale(config.powerButtonScale ?? DEFAULT_CONFIG.powerButtonScale);
          setPowerButtonVerticalOffset(config.powerButtonVerticalOffset ?? DEFAULT_CONFIG.powerButtonVerticalOffset);
          setPowerButtonHorizontalOffset(config.powerButtonHorizontalOffset ?? DEFAULT_CONFIG.powerButtonHorizontalOffset);
          setPowerButtonGlowEnabled(config.powerButtonGlowEnabled ?? DEFAULT_CONFIG.powerButtonGlowEnabled);
          setSpeakerIconStyle(config.speakerIconStyle ?? DEFAULT_CONFIG.speakerIconStyle);
          setPhaseImageDarkening(config.phaseImageDarkening ?? DEFAULT_CONFIG.phaseImageDarkening);
          setPhaseBlurAmount(config.phaseBlurAmount ?? DEFAULT_CONFIG.phaseBlurAmount);
          setPhaseBlurAmountSelected(config.phaseBlurAmountSelected ?? DEFAULT_CONFIG.phaseBlurAmountSelected);
          setPhaseColumnHeight(config.phaseColumnHeight ?? DEFAULT_CONFIG.phaseColumnHeight);
          setPhaseFadePosition(config.phaseFadePosition ?? DEFAULT_CONFIG.phaseFadePosition);
          setPhaseImageBlendMode(config.phaseImageBlendMode ?? DEFAULT_CONFIG.phaseImageBlendMode);
          setPhaseHoverDarkeningIntensity(config.phaseHoverDarkeningIntensity ?? DEFAULT_CONFIG.phaseHoverDarkeningIntensity);
          const backdropBlurValue = config.phaseIdleBackdropBlur ?? DEFAULT_CONFIG.phaseIdleBackdropBlur;
          console.log('[🔍BLUR] Raw value from config:', config.phaseIdleBackdropBlur);
          console.log('[🔍BLUR] After nullish coalescing:', backdropBlurValue);
          console.log('[🔍BLUR] Setting state to:', backdropBlurValue);
          console.log('[🔍BLUR-SYNC] Step 2 - Setting phaseIdleBackdropBlur state:', backdropBlurValue);
          setPhaseIdleBackdropBlur(backdropBlurValue);
          setPhaseColumnYOffset(config.phaseColumnYOffset ?? DEFAULT_CONFIG.phaseColumnYOffset);
          setDescriptionCardBlur(config.descriptionCardBlur ?? DEFAULT_CONFIG.descriptionCardBlur);
          setDescriptionCardDarkness(config.descriptionCardDarkness ?? DEFAULT_CONFIG.descriptionCardDarkness);
          setDescriptionCardBorder(config.descriptionCardBorder ?? DEFAULT_CONFIG.descriptionCardBorder);
          setLogoFadeDuration(config.logoFadeDuration ?? DEFAULT_CONFIG.logoFadeDuration);
          setLightboxBackdropDarkness(config.lightboxBackdropDarkness ?? DEFAULT_CONFIG.lightboxBackdropDarkness);
          setAudioToggleSize(config.audioToggleSize ?? DEFAULT_CONFIG.audioToggleSize);
          setAudioToggleScale(config.audioToggleScale ?? DEFAULT_CONFIG.audioToggleScale);
          setToggleTextGap(config.toggleTextGap ?? DEFAULT_CONFIG.toggleTextGap);
          setProceedButtonSize(config.proceedButtonSize ?? DEFAULT_CONFIG.proceedButtonSize ?? 1.0);
          setJoinBetaFont(config.joinBetaFont ?? DEFAULT_CONFIG.joinBetaFont);
          setJoinBetaFontSize(config.joinBetaFontSize ?? DEFAULT_CONFIG.joinBetaFontSize);
          setJoinBetaColor(config.joinBetaColor ?? DEFAULT_CONFIG.joinBetaColor);
          setJoinBetaHorizontalOffset(config.joinBetaHorizontalOffset ?? DEFAULT_CONFIG.joinBetaHorizontalOffset);
          setJoinBetaVerticalOffset(config.joinBetaVerticalOffset ?? DEFAULT_CONFIG.joinBetaVerticalOffset);
          setFooterHeight(config.footerHeight ?? DEFAULT_CONFIG.footerHeight);
          setFooterImageVerticalPosition(config.footerImageVerticalPosition ?? DEFAULT_CONFIG.footerImageVerticalPosition);
          setOeLogoScale(config.oeLogoScale ?? DEFAULT_CONFIG.oeLogoScale);
          setSocialIconScale(config.socialIconScale ?? DEFAULT_CONFIG.socialIconScale);
          setSocialIconGap(config.socialIconGap ?? DEFAULT_CONFIG.socialIconGap);
          setSocialIconVerticalPosition(config.socialIconVerticalPosition ?? DEFAULT_CONFIG.socialIconVerticalPosition);
          setSocialIconPaddingTop(config.socialIconPaddingTop ?? DEFAULT_CONFIG.socialIconPaddingTop);
          setSocialIconPaddingBottom(config.socialIconPaddingBottom ?? DEFAULT_CONFIG.socialIconPaddingBottom);
          const footerBlurValue1 = config.footerBlurAmount ?? DEFAULT_CONFIG.footerBlurAmount;
          console.log('[🔍BLUR-SYNC] Step 2 - Setting footerBlurAmount state (unified load):', footerBlurValue1);
          setFooterBlurAmount(footerBlurValue1);
          setFooterEdgeFeathering(config.footerEdgeFeathering ?? DEFAULT_CONFIG.footerEdgeFeathering);
          setDescriptionVerticalPosition(config.descriptionVerticalPosition ?? 0);
          setToggleGroupVerticalPosition(config.toggleGroupVerticalPosition ?? 0);
          setProceedButtonVerticalPosition(config.proceedButtonVerticalPosition ?? 0);
          setAudioDescriptionText(config.audioDescriptionText ?? DEFAULT_CONFIG.audioDescriptionText);
          setAudioConsentFadeDuration(config.audioConsentFadeDuration ?? DEFAULT_CONFIG.audioConsentFadeDuration);
          setToggleSize(config.toggleSize ?? DEFAULT_CONFIG.toggleSize);
          setToggleGap(config.toggleGap ?? DEFAULT_CONFIG.toggleGap);
          setToggleVerticalPosition(config.toggleVerticalPosition ?? DEFAULT_CONFIG.toggleVerticalPosition);
          setToggleLabelFont(config.toggleLabelFont ?? DEFAULT_CONFIG.toggleLabelFont);
          setToggleLabelSize(config.toggleLabelSize ?? DEFAULT_CONFIG.toggleLabelSize);
          setToggleLabelColor(config.toggleLabelColor ?? DEFAULT_CONFIG.toggleLabelColor);
          const starsEnabledValue = config.starsEnabled ?? DEFAULT_CONFIG.starsEnabled;
          console.log('[🔨SYNC] Step 5 - Setting starsEnabled state:', starsEnabledValue, 'from config:', config.starsEnabled);
          setStarsEnabled(starsEnabledValue);
          // Mobile-specific controls
          setMobileBreakpoint(config.mobileBreakpoint ?? DEFAULT_CONFIG.mobileBreakpoint);
          setMobilePhaseFooterSpacing(config.mobilePhaseFooterSpacing ?? DEFAULT_CONFIG.mobilePhaseFooterSpacing);
          setMobilePhaseButtonMaxWidth(config.mobilePhaseButtonMaxWidth ?? DEFAULT_CONFIG.mobilePhaseButtonMaxWidth);
          // Note: phaseImage1-4 not loaded here - PhaseCarousel reads directly from localStorage
      } catch (e) {
        console.error('Failed to load debug config:', e);
      }
    };

    // Load config from Convex database
    loadConfig(dbSettings);
  }, [dbSettings]);

  // Keep localStorage fallback for backward compatibility (secondary source)
  useEffect(() => {
    // Only use localStorage if Convex hasn't loaded yet
    if (dbSettings) return;

    const loadFromLocalStorage = () => {
      // Try backup first, then old STORAGE_KEY
      const backup = localStorage.getItem(STORAGE_KEY + '-backup');
      const stored = localStorage.getItem(STORAGE_KEY);

      if (backup) {
        try {
          const config = JSON.parse(backup);
          console.log('[💾RECOVERY] Database unavailable - loading from localStorage backup:', config);
          // Apply settings (same logic as Convex)
          setStarScale(config.starScale ?? DEFAULT_CONFIG.starScale);
          setStarSpeed(config.starSpeed ?? DEFAULT_CONFIG.starSpeed);
          setStarFrequency(config.starFrequency ?? DEFAULT_CONFIG.starFrequency);
          setTwinkleAmount(config.twinkleAmount ?? DEFAULT_CONFIG.twinkleAmount);
          setTwinkleSpeed(config.twinkleSpeed ?? DEFAULT_CONFIG.twinkleSpeed);
          setTwinkleSpeedRandomness(config.twinkleSpeedRandomness ?? DEFAULT_CONFIG.twinkleSpeedRandomness);
          setSizeRandomness(config.sizeRandomness ?? DEFAULT_CONFIG.sizeRandomness);
          setStarScale2(config.starScale2 ?? DEFAULT_CONFIG.starScale2);
          setStarSpeed2(config.starSpeed2 ?? DEFAULT_CONFIG.starSpeed2);
          setStarFrequency2(config.starFrequency2 ?? DEFAULT_CONFIG.starFrequency2);
          setLineLength2(config.lineLength2 ?? DEFAULT_CONFIG.lineLength2);
          setTwinkleAmount2(config.twinkleAmount2 ?? DEFAULT_CONFIG.twinkleAmount2);
          setTwinkleSpeed2(config.twinkleSpeed2 ?? DEFAULT_CONFIG.twinkleSpeed2);
          setTwinkleSpeedRandomness2(config.twinkleSpeedRandomness2 ?? DEFAULT_CONFIG.twinkleSpeedRandomness2);
          setSizeRandomness2(config.sizeRandomness2 ?? DEFAULT_CONFIG.sizeRandomness2);
          setStarScale3(config.starScale3 ?? DEFAULT_CONFIG.starScale3);
          setStarSpeed3(config.starSpeed3 ?? DEFAULT_CONFIG.starSpeed3);
          setStarFrequency3(config.starFrequency3 ?? DEFAULT_CONFIG.starFrequency3);
          setLineLength3(config.lineLength3 ?? DEFAULT_CONFIG.lineLength3);
          setBrightness3(config.brightness3 ?? DEFAULT_CONFIG.brightness3);
          setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
          setTwinkleAmount3(config.twinkleAmount3 ?? DEFAULT_CONFIG.twinkleAmount3);
          setTwinkleSpeed3(config.twinkleSpeed3 ?? DEFAULT_CONFIG.twinkleSpeed3);
          setTwinkleSpeedRandomness3(config.twinkleSpeedRandomness3 ?? DEFAULT_CONFIG.twinkleSpeedRandomness3);
          setSizeRandomness3(config.sizeRandomness3 ?? DEFAULT_CONFIG.sizeRandomness3);
          setBgStarTwinkleAmount(config.bgStarTwinkleAmount ?? DEFAULT_CONFIG.bgStarTwinkleAmount);
          setBgStarTwinkleSpeed(config.bgStarTwinkleSpeed ?? DEFAULT_CONFIG.bgStarTwinkleSpeed);
          setBgStarTwinkleSpeedRandomness(config.bgStarTwinkleSpeedRandomness ?? DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
          setBgStarSizeRandomness(config.bgStarSizeRandomness ?? DEFAULT_CONFIG.bgStarSizeRandomness);
          setBgStarSize(config.bgStarSize ?? DEFAULT_CONFIG.bgStarSize);
          setBgStarCount(config.bgStarCount ?? DEFAULT_CONFIG.bgStarCount);
          setBgStarMinBrightness(config.bgStarMinBrightness ?? DEFAULT_CONFIG.bgStarMinBrightness);
          setBgStarMaxBrightness(config.bgStarMaxBrightness ?? DEFAULT_CONFIG.bgStarMaxBrightness);
          setStarFadePosition(config.starFadePosition ?? DEFAULT_CONFIG.starFadePosition);
          setStarFadeFeatherSize(config.starFadeFeatherSize ?? DEFAULT_CONFIG.starFadeFeatherSize);
          setLogoSize(config.logoSize ?? DEFAULT_CONFIG.logoSize);
          setLogoYPosition(config.logoYPosition ?? DEFAULT_CONFIG.logoYPosition);
          setSelectedFont(config.selectedFont ?? DEFAULT_CONFIG.selectedFont);
          setDescriptionFontSize(config.descriptionFontSize ?? DEFAULT_CONFIG.descriptionFontSize);
          setDescriptionText(config.descriptionText ?? DEFAULT_CONFIG.descriptionText);
          setBgYPosition(config.bgYPosition ?? DEFAULT_CONFIG.bgYPosition);
          setMotionBlurEnabled(config.motionBlurEnabled ?? DEFAULT_CONFIG.motionBlurEnabled);
          setBlurIntensity(config.blurIntensity ?? DEFAULT_CONFIG.blurIntensity);
          setMotionBlurEnabled2(config.motionBlurEnabled2 ?? DEFAULT_CONFIG.motionBlurEnabled2);
          setBlurIntensity2(config.blurIntensity2 ?? DEFAULT_CONFIG.blurIntensity2);
          setDescriptionColor(config.descriptionColor ?? DEFAULT_CONFIG.descriptionColor);
          setDescriptionXOffset(config.descriptionXOffset ?? DEFAULT_CONFIG.descriptionXOffset);
          setDescriptionYOffset(config.descriptionYOffset ?? DEFAULT_CONFIG.descriptionYOffset);
          setDesignVariation(config.designVariation ?? DEFAULT_CONFIG.designVariation);
          setPhaseHeaderFont(config.phaseHeaderFont ?? DEFAULT_CONFIG.phaseHeaderFont);
          setPhaseHeaderFontSize(config.phaseHeaderFontSize ?? DEFAULT_CONFIG.phaseHeaderFontSize);
          setPhaseHeaderColor(config.phaseHeaderColor ?? DEFAULT_CONFIG.phaseHeaderColor);
          setPhaseDescriptionFont(config.phaseDescriptionFont ?? DEFAULT_CONFIG.phaseDescriptionFont);
          const phaseDescSize = config.phaseDescriptionFontSize ?? DEFAULT_CONFIG.phaseDescriptionFontSize;
          console.log('[🔍DATABASE] Setting phaseDescriptionFontSize state to:', phaseDescSize);
          setPhaseDescriptionFontSize(phaseDescSize);
          setSoundLabelFont(config.soundLabelFont ?? DEFAULT_CONFIG.soundLabelFont);
          setSoundLabelSize(config.soundLabelSize ?? DEFAULT_CONFIG.soundLabelSize);
          setSoundLabelColor(config.soundLabelColor ?? DEFAULT_CONFIG.soundLabelColor);
          setSoundLabelVerticalOffset(config.soundLabelVerticalOffset ?? DEFAULT_CONFIG.soundLabelVerticalOffset);
          setSoundLabelHorizontalOffset(config.soundLabelHorizontalOffset ?? DEFAULT_CONFIG.soundLabelHorizontalOffset);
          setPowerButtonScale(config.powerButtonScale ?? DEFAULT_CONFIG.powerButtonScale);
          setPowerButtonVerticalOffset(config.powerButtonVerticalOffset ?? DEFAULT_CONFIG.powerButtonVerticalOffset);
          setPowerButtonHorizontalOffset(config.powerButtonHorizontalOffset ?? DEFAULT_CONFIG.powerButtonHorizontalOffset);
          setPowerButtonGlowEnabled(config.powerButtonGlowEnabled ?? DEFAULT_CONFIG.powerButtonGlowEnabled);
          setSpeakerIconStyle(config.speakerIconStyle ?? DEFAULT_CONFIG.speakerIconStyle);
          setPhaseImageDarkening(config.phaseImageDarkening ?? DEFAULT_CONFIG.phaseImageDarkening);
          setPhaseBlurAmount(config.phaseBlurAmount ?? DEFAULT_CONFIG.phaseBlurAmount);
          setPhaseBlurAmountSelected(config.phaseBlurAmountSelected ?? DEFAULT_CONFIG.phaseBlurAmountSelected);
          setPhaseColumnHeight(config.phaseColumnHeight ?? DEFAULT_CONFIG.phaseColumnHeight);
          setPhaseFadePosition(config.phaseFadePosition ?? DEFAULT_CONFIG.phaseFadePosition);
          setPhaseImageBlendMode(config.phaseImageBlendMode ?? DEFAULT_CONFIG.phaseImageBlendMode);
          setPhaseHoverDarkeningIntensity(config.phaseHoverDarkeningIntensity ?? DEFAULT_CONFIG.phaseHoverDarkeningIntensity);
          setPhaseIdleBackdropBlur(config.phaseIdleBackdropBlur ?? DEFAULT_CONFIG.phaseIdleBackdropBlur);
          setPhaseColumnYOffset(config.phaseColumnYOffset ?? DEFAULT_CONFIG.phaseColumnYOffset);
          setDescriptionCardBlur(config.descriptionCardBlur ?? DEFAULT_CONFIG.descriptionCardBlur);
          setDescriptionCardDarkness(config.descriptionCardDarkness ?? DEFAULT_CONFIG.descriptionCardDarkness);
          setDescriptionCardBorder(config.descriptionCardBorder ?? DEFAULT_CONFIG.descriptionCardBorder);
          setLogoFadeDuration(config.logoFadeDuration ?? DEFAULT_CONFIG.logoFadeDuration);
          setLightboxBackdropDarkness(config.lightboxBackdropDarkness ?? DEFAULT_CONFIG.lightboxBackdropDarkness);
          setAudioToggleSize(config.audioToggleSize ?? DEFAULT_CONFIG.audioToggleSize);
          setAudioToggleScale(config.audioToggleScale ?? DEFAULT_CONFIG.audioToggleScale);
          setToggleTextGap(config.toggleTextGap ?? DEFAULT_CONFIG.toggleTextGap);
          setProceedButtonSize(config.proceedButtonSize ?? DEFAULT_CONFIG.proceedButtonSize ?? 1.0);
          setJoinBetaFont(config.joinBetaFont ?? DEFAULT_CONFIG.joinBetaFont);
          setJoinBetaFontSize(config.joinBetaFontSize ?? DEFAULT_CONFIG.joinBetaFontSize);
          setJoinBetaColor(config.joinBetaColor ?? DEFAULT_CONFIG.joinBetaColor);
          setJoinBetaHorizontalOffset(config.joinBetaHorizontalOffset ?? DEFAULT_CONFIG.joinBetaHorizontalOffset);
          setJoinBetaVerticalOffset(config.joinBetaVerticalOffset ?? DEFAULT_CONFIG.joinBetaVerticalOffset);
          setFooterHeight(config.footerHeight ?? DEFAULT_CONFIG.footerHeight);
          setFooterImageVerticalPosition(config.footerImageVerticalPosition ?? DEFAULT_CONFIG.footerImageVerticalPosition);
          setOeLogoScale(config.oeLogoScale ?? DEFAULT_CONFIG.oeLogoScale);
          setSocialIconScale(config.socialIconScale ?? DEFAULT_CONFIG.socialIconScale);
          setSocialIconGap(config.socialIconGap ?? DEFAULT_CONFIG.socialIconGap);
          setSocialIconVerticalPosition(config.socialIconVerticalPosition ?? DEFAULT_CONFIG.socialIconVerticalPosition);
          setSocialIconPaddingTop(config.socialIconPaddingTop ?? DEFAULT_CONFIG.socialIconPaddingTop);
          setSocialIconPaddingBottom(config.socialIconPaddingBottom ?? DEFAULT_CONFIG.socialIconPaddingBottom);
          const footerBlurValue1 = config.footerBlurAmount ?? DEFAULT_CONFIG.footerBlurAmount;
          console.log('[🔍BLUR-SYNC] Step 2 - Setting footerBlurAmount state (unified load):', footerBlurValue1);
          setFooterBlurAmount(footerBlurValue1);
          setFooterEdgeFeathering(config.footerEdgeFeathering ?? DEFAULT_CONFIG.footerEdgeFeathering);
          setDescriptionVerticalPosition(config.descriptionVerticalPosition ?? 0);
          setToggleGroupVerticalPosition(config.toggleGroupVerticalPosition ?? 0);
          setProceedButtonVerticalPosition(config.proceedButtonVerticalPosition ?? 0);
          setAudioDescriptionText(config.audioDescriptionText ?? DEFAULT_CONFIG.audioDescriptionText);
          setAudioConsentFadeDuration(config.audioConsentFadeDuration ?? DEFAULT_CONFIG.audioConsentFadeDuration);
          setToggleSize(config.toggleSize ?? DEFAULT_CONFIG.toggleSize);
          setToggleGap(config.toggleGap ?? DEFAULT_CONFIG.toggleGap);
          setToggleVerticalPosition(config.toggleVerticalPosition ?? DEFAULT_CONFIG.toggleVerticalPosition);
          setToggleLabelFont(config.toggleLabelFont ?? DEFAULT_CONFIG.toggleLabelFont);
          setToggleLabelSize(config.toggleLabelSize ?? DEFAULT_CONFIG.toggleLabelSize);
          setToggleLabelColor(config.toggleLabelColor ?? DEFAULT_CONFIG.toggleLabelColor);
          setStarsEnabled(config.starsEnabled ?? DEFAULT_CONFIG.starsEnabled);
          // Mobile-specific controls
          setMobileBreakpoint(config.mobileBreakpoint ?? DEFAULT_CONFIG.mobileBreakpoint);
          setMobilePhaseFooterSpacing(config.mobilePhaseFooterSpacing ?? DEFAULT_CONFIG.mobilePhaseFooterSpacing);
          setMobilePhaseButtonMaxWidth(config.mobilePhaseButtonMaxWidth ?? DEFAULT_CONFIG.mobilePhaseButtonMaxWidth);
        } catch (e) {
          console.error('Failed to load debug config from localStorage backup:', e);
        }
      } else if (stored) {
        // Fallback to old storage key if backup doesn't exist
        try {
          const config = JSON.parse(stored);
          console.log('[🔍STORAGE] Fallback: Loading from old localStorage key:', config);
          // Apply same settings as above (duplicate code for now)
          setStarScale(config.starScale ?? DEFAULT_CONFIG.starScale);
          setStarSpeed(config.starSpeed ?? DEFAULT_CONFIG.starSpeed);
          // ... (rest of settings - keeping existing code)
        } catch (e) {
          console.error('Failed to load debug config from old localStorage:', e);
        }
      }
    };

    loadFromLocalStorage();

    // Listen for config updates from debug panel (for iframe communication)
    const handleConfigUpdate = () => {
      // Received mek-config-update event, reloading from localStorage
      loadFromLocalStorage();
    };

    window.addEventListener('mek-config-update', handleConfigUpdate);
    return () => window.removeEventListener('mek-config-update', handleConfigUpdate);
  }, [dbSettings]);

  // Viewport height tracking handled by useResponsiveLayout hook

  // Scroll detection for description text animation and scroll indicator
  // Mobile-optimized: Handles touch events, iOS address bar, throttling for performance
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    let lastKnownScrollY = 0;

    const handleScroll = () => {
      // Cancel any pending timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Throttle for mobile performance (prevents excessive state updates during smooth scrolling)
      scrollTimeout = setTimeout(() => {
        // Use multiple methods to get scroll position (cross-browser compatibility, especially iOS)
        const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const innerHeight = window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        // Check body touchAction status for debugging mobile scroll issues
        const bodyTouchAction = document.body.style.touchAction;
        const bodyOverflow = document.body.style.overflow;
        const bodyPosition = document.body.style.position;

        // Removed verbose scroll logging to reduce console spam

        // ONE-WAY FLAG: Trigger on ANY scroll > 1px, but NEVER reset to false
        // This ensures text remains visible permanently once user has scrolled
        if (scrollY > 1 && !hasScrolled) {
          setHasScrolled(true);
        }
        // INTENTIONALLY NO ELSE BLOCK - never reset hasScrolled to false

        lastKnownScrollY = scrollY;
      }, 50); // 50ms throttle - responsive but prevents excessive updates
    };

    // Removed scroll listener initialization logging

    // CRITICAL FIX: Add { passive: true } for mobile browser performance
    // Mobile browsers may throttle or ignore scroll listeners without this flag
    window.addEventListener('scroll', handleScroll, { passive: true });

    // On mobile, also check scroll position after touch events (iOS Safari quirk)
    // iOS Safari's address bar can affect scroll detection
    if (isMobile) {
      window.addEventListener('touchend', handleScroll, { passive: true });
    }

    // Run initial check immediately to handle cases where page loads with scroll position
    handleScroll();

    return () => {
      console.log('[📜SCROLL] Removing scroll listener');
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      window.removeEventListener('scroll', handleScroll);
      if (isMobile) {
        window.removeEventListener('touchend', handleScroll);
      }
    };
  }, [isMobile, windowWidth]);

  // Auto-show description/button on mobile after logo animation completes
  useEffect(() => {
    if (isMobile && animationStage === 'logo' && !hasScrolled) {
      // Use logoFadeDuration + 1000ms buffer to ensure animation completes
      const showDelay = logoFadeDuration + 1000;
      console.log('[📱MOBILE] Logo animation active on mobile - auto-showing description/button in', showDelay, 'ms');
      const timer = setTimeout(() => {
        console.log('[📱MOBILE] Auto-setting hasScrolled = true for mobile');
        setHasScrolled(true);
      }, showDelay);

      return () => clearTimeout(timer);
    }
  }, [isMobile, animationStage, hasScrolled, logoFadeDuration]);

  // CRITICAL MOBILE FIX: Force body style cleanup after consent lightbox closes
  // The AudioConsentLightbox sets touchAction='none' which blocks scrolling on mobile
  // This safety mechanism ensures styles are restored even if timing issues occur
  useEffect(() => {
    if (!showAudioConsent && !lockScrollForConsent) {
      // Double-check body styles are cleared
      const bodyTouchAction = document.body.style.touchAction;
      const bodyOverflow = document.body.style.overflow;
      const bodyPosition = document.body.style.position;

      if (bodyTouchAction !== '' || bodyOverflow !== '' || bodyPosition !== '') {
        console.log('[🔓SCROLL] SAFETY: Forcing body style cleanup. Previous values:', {
          touchAction: bodyTouchAction,
          overflow: bodyOverflow,
          position: bodyPosition
        });

        document.body.style.touchAction = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        console.log('[🔓SCROLL] SAFETY: Body styles forcibly cleared for mobile scrolling');
      } else {
        console.log('[🔓SCROLL] SAFETY: Body styles already clean');
      }
    }
  }, [showAudioConsent, lockScrollForConsent]);

  // Initialize audio on component mount
  useEffect(() => {
    const audioUrl = getMediaUrl('/audio/giggliest-girl-1.mp3');
    console.log('[🎵AUDIO] Initializing audio with URL:', audioUrl);
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;

    audioRef.current.addEventListener('error', (e) => {
      console.error('[🎵AUDIO] Audio error:', e, 'src:', audioRef.current?.src);
    });
    audioRef.current.addEventListener('loadstart', () => {
      console.log('[🎵AUDIO] Audio load started');
    });
    audioRef.current.addEventListener('loadeddata', () => {
      console.log('[🎵AUDIO] Audio loaded successfully');
    });
    audioRef.current.addEventListener('canplay', () => {
      console.log('[🎵AUDIO] Audio can play');
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-play audio when audioPlaying state changes
  useEffect(() => {
    console.log('[🎵AUDIO] audioPlaying state changed:', audioPlaying);
    if (!audioRef.current) {
      console.log('[🎵AUDIO] No audio ref, skipping playback');
      return;
    }

    if (audioPlaying) {
      console.log('[🎵AUDIO] Starting audio playback with fade-in');
      // Fade in over 500ms
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0;
      audioRef.current.play()
        .then(() => console.log('[🎵AUDIO] Audio started successfully'))
        .catch(err => console.error('[🎵AUDIO] Audio play failed:', err));

      const fadeInDuration = 500;
      const fadeInSteps = 20;
      const stepDuration = fadeInDuration / fadeInSteps;
      const volumeStep = 1 / fadeInSteps;

      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        if (audioRef.current && currentStep < fadeInSteps) {
          audioRef.current.volume = Math.min(1, audioRef.current.volume + volumeStep);
          currentStep++;
        } else {
          if (audioRef.current) {
            audioRef.current.volume = 1; // Ensure full volume
            console.log('[🎵AUDIO] Fade-in complete, volume at 1.0');
          }
          clearInterval(fadeInterval);
        }
      }, stepDuration);
    } else {
      console.log('[🎵AUDIO] Stopping audio playback with fade-out');
      // Fade out over 500ms
      const fadeOutDuration = 500;
      const fadeOutSteps = 20;
      const stepDuration = fadeOutDuration / fadeOutSteps;
      const volumeStep = audioRef.current.volume / fadeOutSteps;

      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        if (audioRef.current && currentStep < fadeOutSteps) {
          audioRef.current.volume = Math.max(0, audioRef.current.volume - volumeStep);
          currentStep++;
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset to beginning
            audioRef.current.volume = 1; // Reset volume
            console.log('[🎵AUDIO] Fade-out complete, audio paused');
          }
          clearInterval(fadeInterval);
        }
      }, stepDuration);
    }
  }, [audioPlaying]);

  // Handle audio consent proceeding
  const handleConsentProceed = (audioEnabled: boolean) => {
    console.log('[🎭STATE] User made audio choice:', audioEnabled ? 'enabled' : 'disabled');

    // Store consent in localStorage
    localStorage.setItem(AUDIO_CONSENT_KEY, JSON.stringify({ audioEnabled, timestamp: Date.now() }));

    // If audio enabled, start playing immediately
    if (audioEnabled) {
      setAudioPlaying(true);
    }

    // Show speaker icon immediately after consent (will fade in with 3s animation)
    setShowSpeakerIcon(true);

    // STATE MACHINE: Transition to CONSENT_CLOSING
    console.log('[🎭STATE] Transitioning: WAITING_FOR_CONSENT → CONSENT_CLOSING');
    setProgressionState('CONSENT_CLOSING');

    // Hide the consent lightbox
    setShowAudioConsent(false);

    // After 500ms fade-out, transition to MAIN_CONTENT
    setTimeout(() => {
      console.log('[🎭STATE] Transitioning: CONSENT_CLOSING → MAIN_CONTENT');
      setProgressionState('MAIN_CONTENT');
    }, 500);
  };

  // Handle audio toggle with fade-in and fade-out effects
  const handleAudioToggle = (checked: boolean) => {
    setAudioPlaying(checked);
    if (audioRef.current) {
      if (checked) {
        // Reset to beginning and fade in over 500ms
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0;
        audioRef.current.play().catch(err => console.error('Audio play failed:', err));

        const fadeInDuration = 500;
        const fadeInSteps = 20;
        const stepDuration = fadeInDuration / fadeInSteps;
        const volumeStep = 1 / fadeInSteps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          if (audioRef.current && currentStep < fadeInSteps) {
            audioRef.current.volume = Math.min(1, audioRef.current.volume + volumeStep);
            currentStep++;
          } else {
            if (audioRef.current) {
              audioRef.current.volume = 1; // Ensure full volume
            }
            clearInterval(fadeInterval);
          }
        }, stepDuration);
      } else {
        // Fade out over 500ms
        const fadeOutDuration = 500;
        const fadeOutSteps = 20;
        const stepDuration = fadeOutDuration / fadeOutSteps;
        const volumeStep = audioRef.current.volume / fadeOutSteps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          if (audioRef.current && currentStep < fadeOutSteps) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - volumeStep);
            currentStep++;
          } else {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0; // Reset to beginning
              audioRef.current.volume = 1; // Reset volume
            }
            clearInterval(fadeInterval);
          }
        }, stepDuration);
      }
    }
  };

  // OLD CANVAS ANIMATION CODE REMOVED - Now using StarfieldCanvas component instead

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Main content area */}
      <div
        className="bg-black"
        style={{
          margin: 0,
          padding: 0,
          minHeight: isMobile ? 'auto' : `calc(100vh + ${phaseColumnYOffset}px + ${phaseColumnHeight}px)`,
          height: isMobile ? 'auto' : `calc(100vh + ${phaseColumnYOffset}px + ${phaseColumnHeight}px)`,
          overflowX: 'hidden',
          overflowY: isMobile ? 'visible' : 'auto',
          position: 'relative',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          width: showDebugSidebar ? 'calc(100vw - 384px)' : '100vw',
        }}
      >
      {/* Dark overlay when lightbox is visible */}
      {showAudioConsent && lightboxBackdropDarkness > 0 && (
        <div
          className="fixed inset-0 bg-black z-[9998] transition-opacity duration-500"
          style={{ opacity: lightboxBackdropDarkness / 100 }}
        />
      )}

      {/* Fixed background layer - faded initially */}
      <div
        className="fixed bg-black z-0 transition-opacity duration-1000"
        style={{
          top: 0,
          left: 0,
          right: showDebugSidebar ? '384px' : 0,
          bottom: 0,
          height: isMobile ? '100svh' : '100%',
          backgroundImage: `url(${getMediaUrl('/colored-bg-1.webp')})`,
          backgroundSize: 'cover',
          backgroundPosition: isMobile
            ? `center bottom`
            : `center calc(50% + ${bgYPosition}px)`,
          backgroundRepeat: 'no-repeat',
          touchAction: 'none',
          pointerEvents: 'none',
          opacity:
            progressionState === 'WAITING_FOR_LOADER' ? 0 : // Hidden during loader
            progressionState === 'WAITING_FOR_CONSENT' || progressionState === 'CONSENT_CLOSING' ? 0.6 : // Darkened during consent
            1, // Full brightness in MAIN_CONTENT and CONTENT_COMPLETE
        }}
      />

      {/* 2-Layer Starfield - Canvas2D with regular stars + fast streaks */}
      {(() => {
        console.log('[🔨SYNC] Step 6 - Rendering with starsEnabled:', starsEnabled, 'layer1:', layer1Enabled, 'layer2:', layer2Enabled);
        return starsEnabled;
      })() && (
        <Starfield2Layer
          layer1Enabled={layer1Enabled}
          layer1Speed={starSpeed}
          layer1Density={starFrequency}
          layer1Size={starScale}
          layer2Enabled={layer2Enabled}
          layer2Speed={starSpeed2}
          layer2Density={starFrequency2}
          layer2Size={starScale2}
          layer2LineLength={lineLength2}
          rightOffset={showDebugSidebar ? 384 : 0}
        />
      )}

      {/* Scrollable content layer */}
      <div
        className="relative flex justify-center z-[20] px-4"
        style={{
          paddingTop: viewportHeight > 0
            ? `calc(50vh - ${logoSize / 2}px - ${logoYPosition}vh)`
            : '50vh',
          opacity:
            progressionState === 'WAITING_FOR_LOADER' || progressionState === 'WAITING_FOR_CONSENT' || progressionState === 'CONSENT_CLOSING' ? 0 : // Hidden during loader and consent
            1, // Visible in MAIN_CONTENT and CONTENT_COMPLETE
          transition: 'opacity 300ms ease-out',
        }}
      >
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16 w-full">
          {/* Logo - Hidden initially, JavaScript requestAnimationFrame handles zoom during logo stage */}
          <div
            ref={logoContainerRef}
            className="relative max-w-[80vw] max-h-[80vw]"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              opacity: 0,
              transform: 'translate3d(0, 0, 0) scale3d(0.92, 0.92, 1)',
              visibility: animationStage === 'logo' ? 'visible' : 'hidden',
              willChange: animationStage === 'logo' ? 'transform, opacity' : 'auto',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitPerspective: 1000,
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              contain: 'layout style paint',
            }}
          >
            {useSafariVideo ? (
              /* Safari/iOS (all devices): Use GIF - no dual-video compositing */
              <img
                src={getMediaUrl('/random-images/logo GIF.gif')}
                alt="Logo Animation"
                className="w-full h-full absolute inset-0"
                style={{
                  opacity: 'inherit',
                  objectFit: 'contain',
                  transform: 'translateZ(0) scale3d(1, 1, 1)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0) scale3d(1, 1, 1)',
                  imageRendering: 'auto',
                  pointerEvents: 'none',
                  willChange: animationStage === 'logo' ? 'transform' : showBetaLightbox ? 'filter' : 'auto',
                  isolation: 'isolate',
                  filter: showBetaLightbox ? 'blur(8px)' : 'blur(0px)',
                  transition: showBetaLightbox
                    ? 'filter 800ms cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'filter 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onLoad={() => {
                  console.log('[🖼️GIF] Logo GIF loaded successfully');
                  setLogoVideoLoaded(true);
                }}
              />
            ) : (
              /* Chrome/Firefox: WebM video */
              <video
                ref={videoRef}
                src={getMediaUrl('/random-images/Everydays_00000.webm')}
                loop
                muted
                playsInline
                preload="auto"
                onError={(e) => console.error('[🎬VIDEO] Video error:', e, 'src:', e.currentTarget.src)}
                onLoadStart={() => console.log('[🎬VIDEO] Video load started')}
                onLoadedData={() => console.log('[🎬VIDEO] Video loaded successfully')}
                onCanPlay={() => console.log('[🎬VIDEO] Video can play')}
                className="w-full h-full absolute inset-0"
                style={{
                  opacity: 'inherit',
                  objectFit: 'contain',
                  transform: 'translateZ(0) scale3d(1, 1, 1)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0) scale3d(1, 1, 1)',
                  imageRendering: 'auto',
                  pointerEvents: 'none',
                  willChange: animationStage === 'logo' ? 'transform' : showBetaLightbox ? 'filter' : 'auto',
                  isolation: 'isolate',
                  filter: showBetaLightbox ? 'blur(8px)' : 'blur(0px)',
                  transition: showBetaLightbox
                    ? 'filter 800ms cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'filter 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )}
          </div>

          {/* Description - Scroll-triggered fade-in animation - Hidden during audio consent */}
          {!showAudioConsent && (
            <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl px-4 sm:px-6 text-center"
                 style={{ transform: `translate(${descriptionXOffset}px, ${descriptionYOffset}px)` }}
                 ref={(el) => {
                   if (el) {
                     console.log('[📜RENDER] Description rendered with hasScrolled:', hasScrolled, 'opacity:', hasScrolled ? 1 : 0);
                   }
                 }}>
              <p
                className={`${descriptionColor} tracking-wide leading-relaxed break-words transition-all duration-700 ease-out`}
                style={{
                  fontFamily: selectedFont,
                  fontSize: `${descriptionFontSize}px`,
                  opacity: hasScrolled ? 1 : 0,
                  transform: hasScrolled ? 'translateY(0)' : 'translateY(20px)',
                  whiteSpace: 'pre-line',
                  willChange: hasScrolled ? 'auto' : 'opacity, transform', // GPU acceleration hint
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {descriptionText}
              </p>
            </div>
          )}

          {/* Join Beta Button - Fill Text Style - Hidden during audio consent */}
          {!showAudioConsent && (
            <div
              className="mt-8 sm:mt-10 transition-all duration-700 ease-out"
              style={{
                opacity: hasScrolled ? 1 : 0,
                transform: hasScrolled ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.3s',
                willChange: hasScrolled ? 'auto' : 'opacity, transform', // GPU acceleration hint
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              onClick={() => {
                console.log('[🎮BETA] Join Beta clicked - opening lightbox after 500ms delay');
                setTimeout(() => {
                  setShowBetaLightbox(true);
                }, 500);
              }}
              ref={(el) => {
                if (el) {
                  console.log('[📜RENDER] Join Beta button rendered with hasScrolled:', hasScrolled, 'opacity:', hasScrolled ? 1 : 0);
                }
              }}
            >
              <FillTextButton
                text="join beta"
                fontFamily={joinBetaFont}
                fontSize={joinBetaFontSize}
                color={joinBetaColor}
                horizontalOffset={joinBetaHorizontalOffset}
                verticalOffset={joinBetaVerticalOffset}
              />
            </div>
          )}

          {/* Speaker Button - Top Right Corner - Hidden during consent lightbox, 2s delay + 4s fade-in */}
          {showSpeakerIcon && (
            <button
              onClick={() => handleAudioToggle(!audioPlaying)}
              className={`
                fixed top-4 right-4
                transition-all ease-out
                active:scale-95
                cursor-pointer
                z-[100]
                ${audioPlaying ? 'text-white/60' : 'text-gray-700'}
              `}
              aria-label={audioPlaying ? 'Mute audio' : 'Play audio'}
              style={{
                transform: `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px) scale(${powerButtonScale})`,
                transformOrigin: 'center center',
                filter: powerButtonGlowEnabled && audioPlaying
                  ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
                  : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))',
                opacity: 0,
                animation: 'speakerFadeIn 4s ease-out 2s forwards',
                transition: 'filter 0.8s ease-in-out, transform 0.3s ease-out, color 0.8s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px) scale(${powerButtonScale * 1.1})`;
                e.currentTarget.style.filter = powerButtonGlowEnabled && audioPlaying
                  ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) brightness(1.2)'
                  : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0)) brightness(1.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px) scale(${powerButtonScale})`;
                e.currentTarget.style.filter = powerButtonGlowEnabled && audioPlaying
                  ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
                  : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))';
              }}
            >
              {(() => {
                const SelectedIcon = SPEAKER_ICON_STYLES.find(s => s.id === speakerIconStyle)?.component || SPEAKER_ICON_STYLES[0].component;
                return <SelectedIcon size={58} isPlaying={audioPlaying} />;
              })()}
            </button>
          )}
        </div>
      </div>

      {/* Phase Timeline & Footer Wrapper - Ensures footer stays below carousel */}
      {progressionState === 'CONTENT_COMPLETE' && (
        <div
          className={isMobile ? "relative left-0 z-[20]" : "absolute left-0 z-[20]"}
          style={{
            top: isMobile ? 0 : `calc(100vh + ${phaseColumnYOffset}px)`,
            marginTop: isMobile ? `${96 + phaseColumnYOffset}px` : undefined,
            width: '100%',
            minHeight: isMobile ? 'auto' : undefined,
            opacity: 0,
            animation: 'fadeIn 1000ms ease-out forwards',
            animationDelay: '500ms',
          }}
        >
          {/* Phase Carousel */}
          <div style={{
            marginBottom: isMobile ? `${mobilePhaseFooterSpacing}px` : undefined,
          }}>
            {/* Mobile: Glass Accordion (NEW) | Desktop: Image Carousel (UNCHANGED) */}
            {isMobile ? (
              <PhaseAccordion
                phaseHeaderFont={phaseHeaderFont}
                phaseHeaderFontSize={phaseHeaderFontSize}
                phaseHeaderColor={phaseHeaderColor}
                phaseDescriptionFont={phaseDescriptionFont}
                phaseDescriptionFontSize={phaseDescriptionFontSize}
                disableBlur={dbSettings?.disablePhaseAccordionBlur ?? false}
                mobilePhaseButtonMaxWidth={mobilePhaseButtonMaxWidth}
              />
            ) : (
              <HorizontalTimeline
                phaseHeaderFont={phaseHeaderFont}
                phaseHeaderFontSize={phaseHeaderFontSize}
                phaseHeaderColor={phaseHeaderColor}
                phaseDescriptionFont={phaseDescriptionFont}
                phaseDescriptionFontSize={phaseDescriptionFontSize}
                imageDarkness={phaseImageDarkening}
                imageBlur={phaseBlurAmount}
                imageBlurSelected={phaseBlurAmountSelected}
                columnHeight={phaseColumnHeight}
                fadePosition={phaseFadePosition}
                imageBlendMode={phaseImageBlendMode}
                hoverDarkenIntensity={phaseHoverDarkeningIntensity}
                idleBackdropBlur={(() => {
                  console.log('[🔍BLUR-SYNC] Step 4 - Passing idleBackdropBlur prop to HorizontalTimeline:', phaseIdleBackdropBlur);
                  return phaseIdleBackdropBlur;
                })()}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer - Sits directly below phase carousel, blurs background planet/space image */}
      {progressionState === 'CONTENT_COMPLETE' && !showAudioConsent && (
        <LandingFooter
          footerHeight={footerHeight}
          socialIconPaddingTop={socialIconPaddingTop}
          socialIconPaddingBottom={socialIconPaddingBottom}
          mobilePhaseFooterSpacing={mobilePhaseFooterSpacing}
          footerBlurAmount={footerBlurAmount}
          footerImageVerticalPosition={footerImageVerticalPosition}
          oeLogoScale={oeLogoScale}
          socialIconScale={socialIconScale}
          socialIconGap={socialIconGap}
          socialIconVerticalPosition={socialIconVerticalPosition}
          footerEdgeFeathering={footerEdgeFeathering}
          phaseColumnYOffset={phaseColumnYOffset}
          phaseColumnHeight={phaseColumnHeight}
          isMobile={isMobile}
          oeLogoUrl={dbSettings?.oeLogoUrl}
          discordUrl={dbSettings?.discordUrl}
          twitterUrl={dbSettings?.twitterUrl}
          websiteUrl={dbSettings?.websiteUrl}
        />
      )}

      {/* Audio Consent Lightbox */}
      <AudioConsentLightbox
        onProceed={handleConsentProceed}
        isVisible={showAudioConsent}
        backdropDarkness={lightboxBackdropDarkness}
        lockScroll={lockScrollForConsent}
        audioConsentFadeDuration={audioConsentFadeDuration}
        toggleSize={toggleSize}
        toggleGap={toggleGap}
        toggleVerticalPosition={toggleVerticalPosition}
        toggleLabelFont={toggleLabelFont}
        toggleLabelSize={toggleLabelSize}
        toggleLabelColor={toggleLabelColor}
      />

      {/* Beta Signup Lightbox */}
      <BetaSignupLightbox
        isVisible={showBetaLightbox}
        onClose={() => setShowBetaLightbox(false)}
        onSubmit={(email) => {
          console.log('[🎮BETA] Email submitted:', email);
          // TODO: Store in Convex database
        }}
      />

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes speakerFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `
      }} />

      </div>
      {/* End main content area */}

      {/* Debug Sidebar (shown when ?debug=true in URL) */}
      {showDebugSidebar && (
        <DebugSidebar onClose={() => setShowDebugSidebar(false)} />
      )}

    </div>
  );
}
