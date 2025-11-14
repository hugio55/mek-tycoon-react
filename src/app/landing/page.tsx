'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import PhaseAccordion from '@/components/PhaseAccordion';
import { SPEAKER_ICON_STYLES, type SpeakerIconStyle } from '@/components/SpeakerIcons';
import AudioConsentLightbox from '@/components/AudioConsentLightbox';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import FillTextButton from '@/components/controls/FillTextButton';
import { getMediaUrl } from '@/lib/media-url';
import { isSafariOrIOS } from '@/lib/browser-detection';
import { useLoaderContext } from '@/features/page-loader';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseSize: number; // Base size for randomness calculation
  twinkleOffset: number; // Phase offset for twinkle effect
  twinkleSpeedMultiplier: number; // Individual speed variation
}

interface BackgroundStar {
  x: number;
  y: number;
  brightness: number;
  baseSize: number; // Base size for size randomness
  twinkleOffset: number;
  twinkleSpeedMultiplier: number; // Individual speed variation
}


// Storage key must match the debug page
const STORAGE_KEY = 'mek-landing-debug-config';
const AUDIO_CONSENT_KEY = 'mek-audio-consent';

// Default configuration
const DEFAULT_CONFIG = {
  starsEnabled: true,
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
  starFadePosition: 60, // Percentage from top where fade begins (0-100)
  starFadeFeatherSize: 200, // Pixels of fade transition zone
  logoSize: 600,
  logoYPosition: 0, // Percentage offset from center (-50 to +50)
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
  speakerIconStyle: 'geometric' as SpeakerIconStyle,
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  phaseColumnYOffset: 0,
  // Description glass card controls
  descriptionCardBlur: 40,
  descriptionCardDarkness: 40,
  descriptionCardBorder: true,
  // Audio Consent Lightbox controls
  logoFadeDuration: 4000,
  lightboxBackdropDarkness: 70,
  audioToggleSize: 96,
  audioToggleScale: 1.0,
  toggleTextGap: 16,
  proceedButtonSize: 1.0,
  audioDescriptionText: 'For full immersion...',
  audioConsentFadeDuration: 500,
  // Join Beta Button controls
  joinBetaFont: 'Orbitron',
  joinBetaFontSize: 32,
  joinBetaColor: 'text-white',
  joinBetaHorizontalOffset: 0,
  joinBetaVerticalOffset: 0,
  // Footer settings
  footerHeight: 120,
  footerImageVerticalPosition: 50,
  oeLogoScale: 1.0,
  socialIconScale: 1.0,
  socialIconGap: 24,
  socialIconVerticalPosition: 70,
  socialIconPaddingTop: 0,
  socialIconPaddingBottom: 0,
  footerBlurAmount: 20,
  footerEdgeFeathering: 0,
  // Mobile-specific controls
  mobileBreakpoint: 1024, // Pixel width where mobile view activates
  mobilePhaseFooterSpacing: 32, // Pixels of space between Phase IV and footer on mobile
  mobilePhaseButtonMaxWidth: 600, // Max width for phase buttons on mobile (pixels)
  // Note: phaseImage1-4 not in DEFAULT_CONFIG - PhaseCarousel manages these
};

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Canvas compositing refs for Safari/iOS (dual-video alpha compositing)
  const colorVideoRef = useRef<HTMLVideoElement>(null);
  const alphaVideoRef = useRef<HTMLVideoElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);

  // Universal page loader context
  const { isLoading } = useLoaderContext();

  // Viewport detection for responsive settings
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [mobileBreakpoint, setMobileBreakpoint] = useState(DEFAULT_CONFIG.mobileBreakpoint);

  // Browser detection for video format selection
  const [useSafariVideo, setUseSafariVideo] = useState(false);

  // Detect Safari/iOS for video format selection
  useEffect(() => {
    setUseSafariVideo(isSafariOrIOS());
    console.log('[🎬VIDEO] Browser detected:', isSafariOrIOS() ? 'Safari/iOS (using H.265 canvas compositing)' : 'Chrome/Firefox (using WebM)');
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      const wasMobile = isMobile;
      const nowMobile = width < mobileBreakpoint;

      console.log('[📱VIEWPORT] Width:', width, 'Breakpoint:', mobileBreakpoint, 'isMobile:', nowMobile);

      if (wasMobile !== nowMobile) {
        console.log('[📱VIEWPORT] 🔄 CHANGED from', wasMobile ? 'mobile' : 'desktop', 'to', nowMobile ? 'mobile' : 'desktop');
      }

      setIsMobile(nowMobile);
      setWindowWidth(width);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [isMobile, mobileBreakpoint]);

  // Load settings from UNIFIED Convex table (with old table fallback)
  const unifiedSettings = useQuery(api.landingDebugUnified.getUnifiedLandingDebugSettings);
  const oldDbSettings = useQuery(api.landingDebugSettings.getLandingDebugSettings);

  // Choose desktop or mobile config based on viewport
  const dbSettings = unifiedSettings
    ? { ...unifiedSettings.shared, ...(isMobile ? unifiedSettings.mobile : unifiedSettings.desktop) }
    : oldDbSettings; // Fallback to old system if unified doesn't exist yet

  // Debug logging for config selection
  useEffect(() => {
    if (unifiedSettings) {
      console.log('[⚙️CONFIG] Using unified settings. isMobile:', isMobile);
      console.log('[⚙️CONFIG] Selected config:', isMobile ? 'MOBILE' : 'DESKTOP');
      console.log('[⚙️CONFIG] logoSize:', dbSettings?.logoSize);
      console.log('[⚙️CONFIG] starFrequency:', dbSettings?.starFrequency);
      console.log('[⚙️CONFIG] bgStarCount:', dbSettings?.bgStarCount);
      console.log('[🔒FORCE] forceShowAudioConsent from shared:', unifiedSettings.shared?.forceShowAudioConsent);
      console.log('[🔒FORCE] forceShowAudioConsent in final dbSettings:', dbSettings?.forceShowAudioConsent);
    } else if (oldDbSettings) {
      console.log('[⚙️CONFIG] Using old settings (fallback)');
    }
  }, [unifiedSettings, oldDbSettings, isMobile, dbSettings]);

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

  // Dynamic viewport height tracking
  const [viewportHeight, setViewportHeight] = useState(0);

  // Fixed initial viewport height for background (prevents mobile chrome jumping)
  const [fixedViewportHeight, setFixedViewportHeight] = useState(0);

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

  // Audio controls
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showAudioConsent, setShowAudioConsent] = useState(false);
  const [allowAudioLightbox, setAllowAudioLightbox] = useState(false); // Gates lightbox after universal loader completes
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [lockScrollForConsent, setLockScrollForConsent] = useState(false);

  // Animation sequence states
  const [animationStage, setAnimationStage] = useState<'initial' | 'stars' | 'logo'>('initial');
  const [useVideoLogo, setUseVideoLogo] = useState(false);

  // Logo animation timing (must be declared before first use in useEffect below)
  const [logoFadeDuration, setLogoFadeDuration] = useState(DEFAULT_CONFIG.logoFadeDuration);

  // JavaScript requestAnimationFrame zoom animation
  const logoContainerRef = useRef<HTMLDivElement>(null);

  // Canvas compositing for Safari/iOS (dual-video alpha transparency)
  useEffect(() => {
    if (!useSafariVideo) return;
    if (!compositeCanvasRef.current || !colorVideoRef.current || !alphaVideoRef.current) return;

    const canvas = compositeCanvasRef.current;
    const colorVideo = colorVideoRef.current;
    const alphaVideo = alphaVideoRef.current;

    // Set canvas size to match video dimensions (will be set once videos load metadata)
    const initCanvas = () => {
      if (colorVideo.videoWidth > 0 && colorVideo.videoHeight > 0) {
        canvas.width = colorVideo.videoWidth;
        canvas.height = colorVideo.videoHeight;
        console.log('[🎨CANVAS] Canvas initialized:', canvas.width, 'x', canvas.height);
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

    const composite = () => {
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

      animationFrameId = requestAnimationFrame(composite);
    };

    // Handle video playback events
    const handlePlay = () => {
      if (!isCompositing) {
        console.log('[🎨CANVAS] Starting canvas compositing');
        isCompositing = true;
        composite();
      }
    };

    const handlePause = () => {
      console.log('[🎨CANVAS] Pausing canvas compositing');
      isCompositing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    // Sync both videos and handle looping
    const handleLoop = () => {
      if (colorVideo.ended && alphaVideo.ended) {
        console.log('[🎨CANVAS] Videos ended, looping...');
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
      // Handle Safari/iOS (dual video compositing)
      if (useSafariVideo && colorVideoRef.current && alphaVideoRef.current) {
        console.log('[🎬VIDEO] Starting Safari dual-video playback');
        colorVideoRef.current.currentTime = 0;
        alphaVideoRef.current.currentTime = 0;
        colorVideoRef.current.play().catch(err => console.error('[🎬VIDEO] Color video play failed:', err));
        alphaVideoRef.current.play().catch(err => console.error('[🎬VIDEO] Alpha video play failed:', err));
      }
      // Handle Chrome/Firefox (WebM)
      else if (!useSafariVideo && videoRef.current) {
        console.log('[🎬VIDEO] Starting WebM video playback');
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => console.error('[🎬VIDEO] Video play failed:', err));
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

      let animationFrameId: number;

      const animate = (currentTime: number) => {
        if (!logoContainerRef.current) return;

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
          console.log('[🎬LOGO] JavaScript animation complete - final scale:', currentScale, 'opacity:', currentOpacity);
        }
      };

      // Start animation
      animationFrameId = requestAnimationFrame(animate);

      // Unlock scroll after animation completes
      setTimeout(() => {
        console.log('[🔓SCROLL] Unlocking scroll after animation');
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
    console.log('[🎬ANIMATION] Animation stage changed to:', animationStage);
    console.log('[🎬ANIMATION] Logo should be:', animationStage === 'logo' ? 'VISIBLE (opacity: 1)' : 'HIDDEN (opacity: 0)');
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
    console.log('[🔍BLUR] Stack trace:', new Error().stack);
  }, [phaseIdleBackdropBlur]);

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
  const [footerBlurAmount, setFooterBlurAmount] = useState(DEFAULT_CONFIG.footerBlurAmount);
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
    console.log('[🎬ANIMATION] === Component Mounted ===');
    console.log('[🎬ANIMATION] Initial showAudioConsent:', showAudioConsent);
    console.log('[🎬ANIMATION] Initial animationStage:', animationStage);
    console.log('[🔒FORCE] dbSettings available:', !!dbSettings);
    console.log('[🔒FORCE] dbSettings.forceShowAudioConsent value:', dbSettings?.forceShowAudioConsent);
    console.log('[🔒FORCE] Type of forceShowAudioConsent:', typeof dbSettings?.forceShowAudioConsent);
    console.log('[🚪GATE] allowAudioLightbox:', allowAudioLightbox);

    // GATE: Wait for universal loader to complete before showing audio lightbox
    if (!allowAudioLightbox) {
      console.log('[🚪GATE] Audio lightbox blocked - waiting for universal loader to complete');
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
        console.log('[🎬ANIMATION] First-time visitor - showing consent lightbox');
        setShowAudioConsent(true);
        setLockScrollForConsent(true);
        // Keep animationStage at 'initial' (everything hidden)
      } else {
        // Return visitor - has already given consent
        const consentData = JSON.parse(consent);
        console.log('[🎵ANIMATION] Return visitor - skipping lightbox, showing video zoom animation');
        // Skip consent lightbox and show video zoom animation directly
        setAnimationStage('logo');

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
            setShowAudioConsent(true);
            setLockScrollForConsent(true);
            setAnimationStage('initial'); // Reset to initial dark state
            setShowSpeakerIcon(false); // Hide speaker icon when showing consent
            // Clear the trigger so it doesn't fire again
            localStorage.removeItem('mek-debug-trigger');
          } else if (triggerData.action === 'hide-audio-consent') {
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
            setShowSpeakerIcon(true); // Show speaker icon when hiding consent
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
            setShowAudioConsent(true);
            setLockScrollForConsent(true);
            setAnimationStage('initial'); // Reset to initial dark state
            setShowSpeakerIcon(false); // Hide speaker icon when showing consent
          } else if (event.data?.action === 'hide-audio-consent') {
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
            setShowSpeakerIcon(true); // Show speaker icon when hiding consent
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

  // PROGRESSION GATE: Only allow audio lightbox after universal loader completes
  useEffect(() => {
    if (isLoading) {
      console.log('[⏳LOADER] Universal loader still running - audio lightbox blocked');
      return; // Wait for loader to finish
    }

    console.log('[✅LOADER] Universal loader complete - scheduling audio lightbox delay');

    // Add 500ms buffer after loader completes for smooth transition
    const timer = setTimeout(() => {
      console.log('[🎭LIGHTBOX] Allowing audio consent lightbox to appear');
      setAllowAudioLightbox(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // STATE VALIDATION: Ensure showAudioConsent and animationStage are mutually exclusive
  // Prevents browser navigation from causing invalid state combinations
  useEffect(() => {
    // CRITICAL: Detect invalid state where lightbox is visible but content is showing
    if (showAudioConsent && animationStage !== 'initial') {
      console.error('[🚨STATE-DESYNC] INVALID STATE DETECTED!', {
        showAudioConsent,
        animationStage,
        expected: 'animationStage should be "initial" when showAudioConsent is true',
        action: 'Force-resetting animationStage to "initial"'
      });

      // Force correction to valid state
      setAnimationStage('initial');
      setLockScrollForConsent(true);
    }

    // Log state transitions for debugging
    console.log('[🔍STATE-CHECK] State validation:', {
      showAudioConsent,
      animationStage,
      lockScrollForConsent,
      isValid: !showAudioConsent || animationStage === 'initial'
    });
  }, [showAudioConsent, animationStage, lockScrollForConsent]);

  // Load config from Convex database (primary source) with localStorage fallback
  useEffect(() => {
    if (!dbSettings) return; // Wait for Convex data to load

    const loadConfig = (config: any) => {
      try {
        console.log('[🔍DATABASE] Full config loaded from Convex:', config);
        console.log('[🔍DATABASE] Phase description font size:', config.phaseDescriptionFontSize);
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
          setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
          setTwinkleAmount3(config.twinkleAmount3 ?? DEFAULT_CONFIG.twinkleAmount3);
          setTwinkleSpeed3(config.twinkleSpeed3 ?? DEFAULT_CONFIG.twinkleSpeed3);
          setTwinkleSpeedRandomness3(config.twinkleSpeedRandomness3 ?? DEFAULT_CONFIG.twinkleSpeedRandomness3);
          setSizeRandomness3(config.sizeRandomness3 ?? DEFAULT_CONFIG.sizeRandomness3);
          setBgStarTwinkleAmount(config.bgStarTwinkleAmount ?? DEFAULT_CONFIG.bgStarTwinkleAmount);
          setBgStarTwinkleSpeed(config.bgStarTwinkleSpeed ?? DEFAULT_CONFIG.bgStarTwinkleSpeed);
          setBgStarTwinkleSpeedRandomness(config.bgStarTwinkleSpeedRandomness ?? DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
          setBgStarSizeRandomness(config.bgStarSizeRandomness ?? DEFAULT_CONFIG.bgStarSizeRandomness);
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
          setFooterBlurAmount(config.footerBlurAmount ?? DEFAULT_CONFIG.footerBlurAmount);
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const config = JSON.parse(stored);
          console.log('[🔍STORAGE] Fallback: Loading from localStorage:', config);
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
          setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
          setTwinkleAmount3(config.twinkleAmount3 ?? DEFAULT_CONFIG.twinkleAmount3);
          setTwinkleSpeed3(config.twinkleSpeed3 ?? DEFAULT_CONFIG.twinkleSpeed3);
          setTwinkleSpeedRandomness3(config.twinkleSpeedRandomness3 ?? DEFAULT_CONFIG.twinkleSpeedRandomness3);
          setSizeRandomness3(config.sizeRandomness3 ?? DEFAULT_CONFIG.sizeRandomness3);
          setBgStarTwinkleAmount(config.bgStarTwinkleAmount ?? DEFAULT_CONFIG.bgStarTwinkleAmount);
          setBgStarTwinkleSpeed(config.bgStarTwinkleSpeed ?? DEFAULT_CONFIG.bgStarTwinkleSpeed);
          setBgStarTwinkleSpeedRandomness(config.bgStarTwinkleSpeedRandomness ?? DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
          setBgStarSizeRandomness(config.bgStarSizeRandomness ?? DEFAULT_CONFIG.bgStarSizeRandomness);
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
          setFooterBlurAmount(config.footerBlurAmount ?? DEFAULT_CONFIG.footerBlurAmount);
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
          console.error('Failed to load debug config from localStorage:', e);
        }
      }
    };

    loadFromLocalStorage();

    // Listen for config updates from debug panel (for iframe communication)
    const handleConfigUpdate = () => {
      console.log('[🔄CONFIG] Received mek-config-update event, reloading from localStorage');
      loadFromLocalStorage();
    };

    window.addEventListener('mek-config-update', handleConfigUpdate);
    return () => window.removeEventListener('mek-config-update', handleConfigUpdate);
  }, [dbSettings]);

  // Track viewport height for dynamic logo centering
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // Set initial height
    updateViewportHeight();

    // Set fixed height ONCE on mount (for background stability on mobile)
    setFixedViewportHeight(window.innerHeight);

    // Update on resize
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

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

        console.log('[📜SCROLL] handleScroll fired:', {
          scrollY,
          innerHeight,
          scrollHeight,
          isMobile,
          windowWidth,
          bodyTouchAction,
          bodyOverflow,
          bodyPosition,
          hasScrolled: scrollY > 0,
          changeFromLast: scrollY - lastKnownScrollY
        });

        // ONE-WAY FLAG: Trigger on ANY scroll > 1px, but NEVER reset to false
        // This ensures text remains visible permanently once user has scrolled
        if (scrollY > 1 && !hasScrolled) {
          console.log('[📜SCROLL] ✅ TRIGGERED - Setting hasScrolled = true (permanent)');
          setHasScrolled(true);
        }
        // INTENTIONALLY NO ELSE BLOCK - never reset hasScrolled to false

        lastKnownScrollY = scrollY;
      }, 50); // 50ms throttle - responsive but prevents excessive updates
    };

    console.log('[📜SCROLL] Adding scroll listener. Initial state:', {
      isMobile,
      windowWidth,
      hasScrolled,
      scrollY: window.scrollY,
      bodyTouchAction: document.body.style.touchAction
    });

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
    console.log('[🎵ANIMATION] ==========================================');
    console.log('[🎵ANIMATION] Consent proceed clicked, audioEnabled:', audioEnabled);
    console.log('[🎵ANIMATION] Current animationStage:', animationStage);

    // Store consent in localStorage
    localStorage.setItem(AUDIO_CONSENT_KEY, JSON.stringify({ audioEnabled, timestamp: Date.now() }));

    // If audio enabled, start playing immediately
    if (audioEnabled) {
      console.log('[🎵ANIMATION] Starting audio playback');
      setAudioPlaying(true);
    }

    // Hide the consent lightbox with fade-out
    setShowAudioConsent(false);
    console.log('[🎵ANIMATION] Lightbox hidden (showAudioConsent = false)');
    console.log('[🎵ANIMATION] Starting animation sequence in 500ms...');

    // Show speaker icon immediately after consent (will fade in with 3s animation)
    console.log('[🎵ANIMATION] Showing speaker icon after consent');
    setShowSpeakerIcon(true);

    // Start animation sequence: stars fade in after lightbox fades
    setTimeout(() => {
      console.log('[🎵ANIMATION] ==========================================');
      console.log('[🎵ANIMATION] Stage 2: Setting to "stars" - Stars fade in and start moving');
      setAnimationStage('stars');

      // Then logo fades in after stars are visible
      setTimeout(() => {
        console.log('[🎵ANIMATION] ==========================================');
        console.log('[🎵ANIMATION] Stage 3: Setting to "logo" - Video zoom in');
        setAnimationStage('logo');
      }, 1000); // 1 second after stars start fading in
    }, 500); // 500ms for lightbox fade-out
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Create distant background star field (static/very slow)
    const backgroundStars: BackgroundStar[] = [];
    // Calculate fade boundaries (only spawn stars above fade end)
    const fadeStartY = (starFadePosition / 100) * canvas.height;
    const fadeEndY = fadeStartY + starFadeFeatherSize;

    for (let i = 0; i < bgStarCount; i++) {
      const baseSize = 0.5;
      const sizeVariation = (bgStarSizeRandomness / 100) * baseSize;
      // Only spawn stars in the visible region (above fade end)
      const starY = Math.random() * fadeEndY;
      backgroundStars.push({
        x: Math.random() * canvas.width,
        y: starY,
        brightness: Math.random() * (bgStarMaxBrightness - bgStarMinBrightness) + bgStarMinBrightness,
        baseSize: baseSize + (Math.random() * 2 - 1) * sizeVariation, // Apply size randomness
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeedMultiplier: 1 + (Math.random() * 2 - 1) * (bgStarTwinkleSpeedRandomness / 100),
      });
    }

    const stars: Star[] = [];
    const maxZ = 1500;
    const coneAngle = 25; // Degrees - creates exclusion cone in center

    // Initialize stars outside the cone of impenetrability
    const initializeStar = () => {
      let x, y;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Keep trying until we get a star outside the center cone
      do {
        x = Math.random() * canvas.width - canvas.width / 2;
        y = Math.random() * canvas.height - canvas.height / 2;

        // Calculate angle from center
        const distance = Math.sqrt(x * x + y * y);
        const angleFromCenter = Math.atan2(Math.abs(y), Math.abs(x)) * (180 / Math.PI);

        // Check if outside cone (cone points toward viewer)
        const maxAllowedDistance = Math.tan((coneAngle * Math.PI) / 180) * maxZ;
        if (distance > maxAllowedDistance * 0.3) break; // 0.3 makes cone stricter at spawn
      } while (true);

      return { x, y };
    };

    for (let i = 0; i < starFrequency; i++) {
      const { x, y } = initializeStar();
      const baseSize = Math.random() * 2 + 1;
      const sizeVariation = (sizeRandomness / 100) * baseSize;
      stars.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: baseSize,
        baseSize: baseSize + (Math.random() * 2 - 1) * sizeVariation,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeedMultiplier: 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness / 100),
      });
    }

    // Initialize Layer 2 stars (second starfield)
    const stars2: Star[] = [];
    for (let i = 0; i < starFrequency2; i++) {
      const { x, y } = initializeStar();
      const baseSize = Math.random() * 2 + 1;
      const sizeVariation = (sizeRandomness2 / 100) * baseSize;
      stars2.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: baseSize,
        baseSize: baseSize + (Math.random() * 2 - 1) * sizeVariation,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeedMultiplier: 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness2 / 100),
      });
    }

    // Initialize Layer 3 stars (third starfield)
    const stars3: Star[] = [];
    for (let i = 0; i < starFrequency3; i++) {
      const { x, y } = initializeStar();
      const baseSize = Math.random() * 2 + 1;
      const sizeVariation = (sizeRandomness3 / 100) * baseSize;
      stars3.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: baseSize,
        baseSize: baseSize + (Math.random() * 2 - 1) * sizeVariation,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeedMultiplier: 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness3 / 100),
      });
    }

    // Track last spawn time for Layer 3 stars (for spawn delay)
    const starLastSpawnTime3 = new Map<number, number>();

    let animationId: number;
    const animate = () => {
      // Clear with transparency to show background image
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If stars are disabled, skip all star rendering (massive performance boost)
      if (!starsEnabled) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Draw distant background stars (very slow drift) with gradient fade
      const time = Date.now() * 0.001; // Convert to seconds
      const fadeStartY = (starFadePosition / 100) * canvas.height;
      const fadeEndY = fadeStartY + starFadeFeatherSize;

      backgroundStars.forEach((star) => {
        // Skip stars below fade end (performance optimization)
        if (star.y > fadeEndY) return;

        // Calculate fade multiplier based on Y position
        let fadeMultiplier = 1;
        if (star.y > fadeStartY) {
          // Star is in fade zone - calculate gradient
          const fadeProgress = (star.y - fadeStartY) / starFadeFeatherSize;
          fadeMultiplier = 1 - fadeProgress; // 1 at fadeStart, 0 at fadeEnd
        }

        // Calculate twinkle effect using sine wave
        // twinkleAmount controls amplitude (0-100%), twinkleSpeed controls frequency
        const twinkleAmplitude = bgStarTwinkleAmount / 100; // Convert to 0-1 range
        const effectiveSpeed = bgStarTwinkleSpeed * star.twinkleSpeedMultiplier;
        const twinkle = Math.sin(time * effectiveSpeed + star.twinkleOffset) * twinkleAmplitude;
        const opacity = star.brightness * (1 + twinkle) * fadeMultiplier; // Apply fade to opacity

        // Only render if visible
        if (opacity > 0.01) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.baseSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Layer 1 stars
      stars.forEach((star) => {
        star.z -= starSpeed;

        if (star.z <= 0) {
          const { x, y } = initializeStar();
          star.x = x;
          star.y = y;
          star.z = maxZ;
          star.twinkleOffset = Math.random() * Math.PI * 2; // Randomize twinkle phase on respawn
          star.twinkleSpeedMultiplier = 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness / 100);
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;

        // Apply twinkle effect to size
        const twinkleAmplitude = twinkleAmount / 100;
        const effectiveSpeed = twinkleSpeed * star.twinkleSpeedMultiplier;
        const twinkle = Math.sin(time * effectiveSpeed + star.twinkleOffset) * twinkleAmplitude;
        const size = (star.baseSize * scale) * starScale * (1 + twinkle);

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          // Apply twinkle to opacity as well
          const baseOpacity = Math.min(1, (maxZ - star.z) / maxZ);
          const opacity = baseOpacity * (1 + twinkle * 0.5); // Less twinkle on opacity
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Layer 2 stars as lines (fast-moving streaks)
      stars2.forEach((star) => {
        star.z -= starSpeed2;

        if (star.z <= 0) {
          const { x, y } = initializeStar();
          star.x = x;
          star.y = y;
          star.z = maxZ;
          star.twinkleOffset = Math.random() * Math.PI * 2;
          star.twinkleSpeedMultiplier = 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness2 / 100);
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;

        // Apply twinkle effect to size
        const twinkleAmplitude = twinkleAmount2 / 100;
        const effectiveSpeed = twinkleSpeed2 * star.twinkleSpeedMultiplier;
        const twinkle = Math.sin(time * effectiveSpeed + star.twinkleOffset) * twinkleAmplitude;
        const size = (star.baseSize * scale) * starScale2 * (1 + twinkle);

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const baseOpacity = Math.min(1, (maxZ - star.z) / maxZ);
          const opacity = baseOpacity * (1 + twinkle * 0.5);

          // Calculate previous position to create streak effect
          const prevZ = star.z + starSpeed2;
          const prevScale = 1000 / prevZ;
          const prevX = star.x * prevScale + centerX;
          const prevY = star.y * prevScale + centerY;

          // Draw star as a line (streak) instead of a dot
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = size * 0.5; // Thinner line for streak effect
          ctx.lineCap = 'round'; // Smooth ends

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      // Draw Layer 3 stars as lines (ultra-fast-moving streaks)
      const now = Date.now();
      stars3.forEach((star, index) => {
        star.z -= starSpeed3;

        if (star.z <= 0) {
          // Check spawn delay - only respawn if enough time has passed
          const lastSpawnTime = starLastSpawnTime3.get(index) || 0;
          const timeSinceLastSpawn = now - lastSpawnTime;

          // Add randomization (±30%) to spread out spawns and prevent clustering
          const randomFactor = 0.7 + Math.random() * 0.6; // Range: 0.7 to 1.3
          const requiredDelay = spawnDelay3 * randomFactor;

          if (timeSinceLastSpawn >= requiredDelay) {
            const { x, y } = initializeStar();
            star.x = x;
            star.y = y;
            star.z = maxZ;
            star.twinkleOffset = Math.random() * Math.PI * 2;
            star.twinkleSpeedMultiplier = 1 + (Math.random() * 2 - 1) * (twinkleSpeedRandomness3 / 100);
            starLastSpawnTime3.set(index, now);
          } else {
            // Keep star out of view until delay passes
            star.z = -100;
          }
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;

        // Apply twinkle effect to size
        const twinkleAmplitude = twinkleAmount3 / 100;
        const effectiveSpeed = twinkleSpeed3 * star.twinkleSpeedMultiplier;
        const twinkle = Math.sin(time * effectiveSpeed + star.twinkleOffset) * twinkleAmplitude;
        const size = (star.baseSize * scale) * starScale3 * (1 + twinkle);

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const baseOpacity = Math.min(1, (maxZ - star.z) / maxZ);
          const opacity = baseOpacity * (1 + twinkle * 0.5);

          // Calculate previous position to create streak effect
          const prevZ = star.z + starSpeed3;
          const prevScale = 1000 / prevZ;
          const prevX = star.x * prevScale + centerX;
          const prevY = star.y * prevScale + centerY;

          // Draw star as a line (streak) instead of a dot
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = size * 0.5; // Thinner line for streak effect
          ctx.lineCap = 'round'; // Smooth ends

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [
    starsEnabled,
    starScale, starSpeed, starFrequency, twinkleAmount, twinkleSpeed, twinkleSpeedRandomness, sizeRandomness,
    starScale2, starSpeed2, starFrequency2, lineLength2, twinkleAmount2, twinkleSpeed2, twinkleSpeedRandomness2, sizeRandomness2,
    starScale3, starSpeed3, starFrequency3, lineLength3, spawnDelay3, twinkleAmount3, twinkleSpeed3, twinkleSpeedRandomness3, sizeRandomness3,
    bgStarTwinkleAmount, bgStarTwinkleSpeed, bgStarTwinkleSpeedRandomness, bgStarSizeRandomness, bgStarCount, bgStarMinBrightness, bgStarMaxBrightness,
    starFadePosition, starFadeFeatherSize,
    motionBlurEnabled, blurIntensity, motionBlurEnabled2, blurIntensity2,
    isMobile // CRITICAL: Re-initialize stars when viewport changes to apply mobile optimizations
  ]);

  return (
    <div
      className="w-screen bg-black"
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
        className="fixed inset-0 w-full h-full bg-black z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${getMediaUrl('/colored-bg-1.webp')})`,
          backgroundSize: 'cover',
          backgroundPosition: isMobile
            ? `center bottom`
            : `center calc(50% + ${bgYPosition}px)`,
          backgroundRepeat: 'no-repeat',
          touchAction: 'none',
          pointerEvents: 'none',
          opacity: showAudioConsent ? 1 : (animationStage === 'initial' ? 0.3 : 1), // Keep visible when lightbox shows (darkened by overlay)
        }}
      />

      {/* Fixed canvas layer - hidden initially, fades in during stars stage with smooth 1.5s transition */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-[1] pointer-events-none"
        style={{
          display: 'block',
          touchAction: 'none',
          opacity: showAudioConsent ? 0 : (animationStage === 'initial' ? 0 : 1), // Hide when lightbox visible
          transition: animationStage === 'initial' ? 'none' : 'opacity 1500ms ease-out',
        }}
      />

      {/* Scrollable content layer */}
      <div
        className="relative flex justify-center z-[20] px-4"
        style={{
          paddingTop: viewportHeight > 0
            ? `calc(50vh - ${logoSize / 2}px - ${logoYPosition}vh)`
            : '50vh',
          opacity: showAudioConsent ? 0 : 1, // Hide when lightbox visible
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
              visibility: animationStage === 'initial' || animationStage === 'stars' ? 'hidden' : 'visible',
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
              <>
                {/* Safari/iOS: Canvas compositing with dual H.265 videos */}
                <canvas
                  ref={compositeCanvasRef}
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
                {/* Hidden color video */}
                <video
                  ref={colorVideoRef}
                  src={getMediaUrl('/random-images/logo vid for apple/logo h265 1 point 5q winner.mp4')}
                  loop
                  muted
                  playsInline
                  preload="auto"
                  style={{ display: 'none' }}
                  onError={(e) => console.error('[🎬VIDEO] Color video error:', e)}
                  onLoadStart={() => console.log('[🎬VIDEO] Color video load started')}
                  onLoadedData={() => console.log('[🎬VIDEO] Color video loaded successfully')}
                />
                {/* Hidden alpha mask video */}
                <video
                  ref={alphaVideoRef}
                  src={getMediaUrl('/random-images/logo vid for apple/logo h265 1 point 5q ALPHA 2.mp4')}
                  loop
                  muted
                  playsInline
                  preload="auto"
                  style={{ display: 'none' }}
                  onError={(e) => console.error('[🎬VIDEO] Alpha video error:', e)}
                  onLoadStart={() => console.log('[🎬VIDEO] Alpha video load started')}
                  onLoadedData={() => console.log('[🎬VIDEO] Alpha video loaded successfully')}
                />
              </>
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
      {!showAudioConsent && (
        <div
          className={isMobile ? "relative left-0 z-[20]" : "absolute left-0 z-[20]"}
          style={{
            top: isMobile ? 0 : `calc(100vh + ${phaseColumnYOffset}px)`,
            marginTop: isMobile ? `${96 + phaseColumnYOffset}px` : undefined,
            width: '100%',
            minHeight: isMobile ? 'auto' : undefined,
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
                idleBackdropBlur={phaseIdleBackdropBlur}
              />
            )}
          </div>

          {/* Footer - Now properly positioned below phase carousel */}
          {!showAudioConsent && (
            <div
              className="border-t border-gray-700 flex items-center justify-center relative"
              style={{
                height: `${footerHeight}px`,
                paddingTop: `${socialIconPaddingTop}px`,
                paddingBottom: `${socialIconPaddingBottom}px`,
                backdropFilter: footerBlurAmount > 0 ? `blur(${footerBlurAmount}px)` : 'none',
                WebkitBackdropFilter: footerBlurAmount > 0 ? `blur(${footerBlurAmount}px)` : 'none',
                backgroundColor: 'rgba(17, 24, 39, 0.3)',
              }}
            >
            {/* OE Logo */}
            <div
              className="absolute"
              style={{
                top: `${footerImageVerticalPosition}%`,
                transform: 'translateY(-50%)',
                left: '50%',
                marginLeft: `-${50 * oeLogoScale}px`,
                cursor: dbSettings?.oeLogoUrl && dbSettings.oeLogoUrl !== '#' ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (dbSettings?.oeLogoUrl && dbSettings.oeLogoUrl !== '#') {
                  window.open(dbSettings.oeLogoUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <img
                src="/oe-items/oe-icon.png"
                alt="OE Icon"
                style={{
                  width: `${100 * oeLogoScale}px`,
                  height: 'auto',
                }}
                onError={(e) => {
                  console.error('[🖼️FOOTER] Failed to load OE icon');
                }}
              />
            </div>

            {/* Social Icons */}
            <div
              className="absolute flex items-center"
              style={{
                top: `${socialIconVerticalPosition}%`,
                left: '50%',
                transform: 'translateX(-50%)',
                gap: `${socialIconGap}px`,
              }}
            >
              {/* Discord Icon */}
              <div
                onClick={() => {
                  if (dbSettings?.discordUrl && dbSettings.discordUrl !== 'https://discord.gg/your-discord') {
                    window.open(dbSettings.discordUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="hover:opacity-70 transition-opacity"
                style={{
                  cursor: dbSettings?.discordUrl && dbSettings.discordUrl !== 'https://discord.gg/your-discord' ? 'pointer' : 'default',
                }}
              >
                <svg
                  width={40 * socialIconScale}
                  height={40 * socialIconScale}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-400"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>

              {/* X (Twitter) Icon */}
              <div
                onClick={() => {
                  if (dbSettings?.twitterUrl && dbSettings.twitterUrl !== 'https://twitter.com/your-twitter') {
                    window.open(dbSettings.twitterUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="hover:opacity-70 transition-opacity"
                style={{
                  cursor: dbSettings?.twitterUrl && dbSettings.twitterUrl !== 'https://twitter.com/your-twitter' ? 'pointer' : 'default',
                }}
              >
                <svg
                  width={40 * socialIconScale}
                  height={40 * socialIconScale}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-400"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>

              {/* Globe (Website) Icon */}
              <div
                onClick={() => {
                  if (dbSettings?.websiteUrl && dbSettings.websiteUrl !== 'https://your-website.com') {
                    window.open(dbSettings.websiteUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="hover:opacity-70 transition-opacity"
                style={{
                  cursor: dbSettings?.websiteUrl && dbSettings.websiteUrl !== 'https://your-website.com' ? 'pointer' : 'default',
                }}
              >
                <svg
                  width={40 * socialIconScale}
                  height={40 * socialIconScale}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
            </div>

            {/* Edge Feathering - Gradient fade at top of footer */}
            {footerEdgeFeathering > 0 && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `-${footerEdgeFeathering}px`,
                  height: `${footerEdgeFeathering}px`,
                  background: 'linear-gradient(to bottom, transparent, rgba(17, 24, 39, 0.3))',
                }}
              />
            )}
          </div>
          )}
        </div>
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

      {/* Speaker fade-in animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes speakerFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `
      }} />

    </div>
  );
}
