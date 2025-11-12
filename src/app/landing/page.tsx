'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import { SPEAKER_ICON_STYLES, type SpeakerIconStyle } from '@/components/SpeakerIcons';
import AudioConsentLightbox from '@/components/AudioConsentLightbox';
import FillTextButton from '@/components/controls/FillTextButton';

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
  logoFadeDuration: 3000,
  lightboxBackdropDarkness: 95,
  audioToggleSize: 96,
  audioToggleScale: 1.0,
  // Join Beta Button controls
  joinBetaFont: 'Orbitron',
  joinBetaFontSize: 32,
  joinBetaColor: 'text-white',
  joinBetaHorizontalOffset: 0,
  joinBetaVerticalOffset: 0,
  // Note: phaseImage1-4 not in DEFAULT_CONFIG - PhaseCarousel manages these
};

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load settings from Convex database (with localStorage as fallback)
  const dbSettings = useQuery(api.landingDebugSettings.getLandingDebugSettings);

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
  const [lockScrollForConsent, setLockScrollForConsent] = useState(false);

  // Animation sequence states
  const [animationStage, setAnimationStage] = useState<'initial' | 'stars' | 'logo'>('initial');
  const [useVideoLogo, setUseVideoLogo] = useState(false);

  // Debug logging for useVideoLogo changes + video playback control
  useEffect(() => {
    console.log('[🎬SWAP] useVideoLogo state changed to:', useVideoLogo);
    if (useVideoLogo && videoRef.current) {
      console.log('[🎬SWAP] Resetting video to frame 1 and starting playback');
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.error('[🎬SWAP] Video play failed:', err));

      // Unlock scroll after video plays and fade-in completes
      setTimeout(() => {
        console.log('[🔓SCROLL] Unlocking scroll after video playback + fade-in');
        setLockScrollForConsent(false);
      }, logoFadeDuration + 500); // logoFadeDuration for fade-in + 500ms buffer
    }
  }, [useVideoLogo, logoFadeDuration]);

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
  const [logoFadeDuration, setLogoFadeDuration] = useState(DEFAULT_CONFIG.logoFadeDuration);
  const [lightboxBackdropDarkness, setLightboxBackdropDarkness] = useState(DEFAULT_CONFIG.lightboxBackdropDarkness);
  const [audioToggleSize, setAudioToggleSize] = useState(DEFAULT_CONFIG.audioToggleSize);
  const [audioToggleScale, setAudioToggleScale] = useState(DEFAULT_CONFIG.audioToggleScale);

  // Join Beta Button controls
  const [joinBetaFont, setJoinBetaFont] = useState(DEFAULT_CONFIG.joinBetaFont);
  const [joinBetaFontSize, setJoinBetaFontSize] = useState(DEFAULT_CONFIG.joinBetaFontSize);
  const [joinBetaColor, setJoinBetaColor] = useState(DEFAULT_CONFIG.joinBetaColor);
  const [joinBetaHorizontalOffset, setJoinBetaHorizontalOffset] = useState(DEFAULT_CONFIG.joinBetaHorizontalOffset);
  const [joinBetaVerticalOffset, setJoinBetaVerticalOffset] = useState(DEFAULT_CONFIG.joinBetaVerticalOffset);

  // Scroll-triggered animation state
  const [hasScrolled, setHasScrolled] = useState(false);

  // Note: phaseImage1-4 not needed here - PhaseCarousel reads directly from localStorage

  // Check for audio consent on mount
  useEffect(() => {
    console.log('[🎬ANIMATION] === Component Mounted ===');
    console.log('[🎬ANIMATION] Initial showAudioConsent:', showAudioConsent);
    console.log('[🎬ANIMATION] Initial animationStage:', animationStage);

    try {
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
        console.log('[🎵ANIMATION] Return visitor - skipping lightbox, showing smooth image animation');
        // Skip consent lightbox but show smooth image zoom animation
        setAnimationStage('logo');

        // Video swap timer for return visitors
        console.log('[🎬SWAP] Setting video swap timer for return visitor, duration:', logoFadeDuration, 'ms');
        setTimeout(() => {
          console.log('[🎬SWAP] Swapping to video logo (return visitor path)');
          setUseVideoLogo(true);
        }, logoFadeDuration);

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
            // Clear the trigger so it doesn't fire again
            localStorage.removeItem('mek-debug-trigger');
          } else if (triggerData.action === 'hide-audio-consent') {
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
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
          } else if (event.data?.action === 'hide-audio-consent') {
            setShowAudioConsent(false);
            setLockScrollForConsent(false);
            setAnimationStage('logo'); // Show everything
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
  }, []);

  // Load config from Convex database (primary source) with localStorage fallback
  useEffect(() => {
    if (!dbSettings) return; // Wait for Convex data to load

    const loadConfig = (config: any) => {
      try {
        console.log('[🔍DATABASE] Full config loaded from Convex:', config);
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
          setPhaseDescriptionFontSize(config.phaseDescriptionFontSize ?? DEFAULT_CONFIG.phaseDescriptionFontSize);
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
          setJoinBetaFont(config.joinBetaFont ?? DEFAULT_CONFIG.joinBetaFont);
          setJoinBetaFontSize(config.joinBetaFontSize ?? DEFAULT_CONFIG.joinBetaFontSize);
          setJoinBetaColor(config.joinBetaColor ?? DEFAULT_CONFIG.joinBetaColor);
          setJoinBetaHorizontalOffset(config.joinBetaHorizontalOffset ?? DEFAULT_CONFIG.joinBetaHorizontalOffset);
          setJoinBetaVerticalOffset(config.joinBetaVerticalOffset ?? DEFAULT_CONFIG.joinBetaVerticalOffset);
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
          setPhaseDescriptionFontSize(config.phaseDescriptionFontSize ?? DEFAULT_CONFIG.phaseDescriptionFontSize);
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
          setJoinBetaFont(config.joinBetaFont ?? DEFAULT_CONFIG.joinBetaFont);
          setJoinBetaFontSize(config.joinBetaFontSize ?? DEFAULT_CONFIG.joinBetaFontSize);
          setJoinBetaColor(config.joinBetaColor ?? DEFAULT_CONFIG.joinBetaColor);
          setJoinBetaHorizontalOffset(config.joinBetaHorizontalOffset ?? DEFAULT_CONFIG.joinBetaHorizontalOffset);
          setJoinBetaVerticalOffset(config.joinBetaVerticalOffset ?? DEFAULT_CONFIG.joinBetaVerticalOffset);
        } catch (e) {
          console.error('Failed to load debug config from localStorage:', e);
        }
      }
    };

    loadFromLocalStorage();
  }, [dbSettings]);

  // Track viewport height for dynamic logo centering
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // Set initial height
    updateViewportHeight();

    // Update on resize
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  // Scroll detection for description text animation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize audio on component mount
  useEffect(() => {
    audioRef.current = new Audio('/audio/giggliest-girl-1.mp3');
    audioRef.current.loop = true;

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

    // Start animation sequence: stars fade in after lightbox fades
    setTimeout(() => {
      console.log('[🎵ANIMATION] ==========================================');
      console.log('[🎵ANIMATION] Stage 2: Setting to "stars" - Stars fade in and start moving');
      setAnimationStage('stars');

      // Then logo fades in after stars are visible
      setTimeout(() => {
        console.log('[🎵ANIMATION] ==========================================');
        console.log('[🎵ANIMATION] Stage 3: Setting to "logo" - Logo fade in with zoom');

        // Preload the logo image BEFORE starting animation
        const logoImage = new Image();
        logoImage.src = '/logo-first-frame.webp';
        logoImage.onload = () => {
          console.log('[🎵ANIMATION] Logo image preloaded, starting animation');
          setAnimationStage('logo');

          // Swap to video immediately when zoom completes
          console.log('[🎬SWAP] Setting video swap timer (first-time visitor), duration:', logoFadeDuration, 'ms');
          setTimeout(() => {
            console.log('[🎬SWAP] Swapping to video logo (first-time visitor path)');
            setUseVideoLogo(true);
            // Note: Scroll unlock now happens in useEffect when video plays + fades in
          }, logoFadeDuration);
        };
        logoImage.onerror = () => {
          console.error('[🎵ANIMATION] Logo image failed to load');
          // Still show animation, just without the image
          setAnimationStage('logo');
        };
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
      const currentTime = Date.now();
      stars3.forEach((star, index) => {
        star.z -= starSpeed3;

        if (star.z <= 0) {
          // Check spawn delay - only respawn if enough time has passed
          const lastSpawnTime = starLastSpawnTime3.get(index) || 0;
          const timeSinceLastSpawn = currentTime - lastSpawnTime;

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
            starLastSpawnTime3.set(index, currentTime);
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
    starScale, starSpeed, starFrequency, twinkleAmount, twinkleSpeed, twinkleSpeedRandomness, sizeRandomness,
    starScale2, starSpeed2, starFrequency2, lineLength2, twinkleAmount2, twinkleSpeed2, twinkleSpeedRandomness2, sizeRandomness2,
    starScale3, starSpeed3, starFrequency3, lineLength3, spawnDelay3, twinkleAmount3, twinkleSpeed3, twinkleSpeedRandomness3, sizeRandomness3,
    bgStarTwinkleAmount, bgStarTwinkleSpeed, bgStarTwinkleSpeedRandomness, bgStarSizeRandomness, bgStarCount, bgStarMinBrightness, bgStarMaxBrightness,
    starFadePosition, starFadeFeatherSize,
    motionBlurEnabled, blurIntensity, motionBlurEnabled2, blurIntensity2
  ]);

  return (
    <div
      className="w-screen bg-black"
      style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        overflowX: 'hidden',
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
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: viewportHeight > 0
            ? `center calc(50% + ${bgYPosition}px)`
            : `center ${bgYPosition}%`,
          backgroundRepeat: 'no-repeat',
          touchAction: 'none',
          pointerEvents: 'none',
          opacity: animationStage === 'initial' ? 0.3 : 1, // Very faded initially
        }}
      />

      {/* Fixed canvas layer - hidden initially, fades in during stars stage */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-[1] pointer-events-none transition-opacity duration-1000"
        style={{
          display: 'block',
          touchAction: 'none',
          opacity: animationStage === 'initial' ? 0 : 1, // Hidden initially
        }}
      />

      {/* Scrollable content layer */}
      <div
        className="relative flex justify-center z-[20] px-4"
        style={{
          paddingTop: viewportHeight > 0
            ? `calc(50vh - ${logoSize / 2}px - ${logoYPosition}vh)`
            : '50vh',
        }}
      >
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16 w-full">
          {/* Logo - Hidden initially, fades in with zoom during logo stage */}
          <div
            className="relative max-w-[80vw] max-h-[80vw]"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              opacity: animationStage === 'logo' ? 1 : 0,
              transform: animationStage === 'logo' ? 'translate3d(0, 0, 0) scale3d(1, 1, 1)' : 'translate3d(0, 0, 0) scale3d(0.92, 0.92, 1)',
              transition: animationStage === 'logo' ? `opacity ${logoFadeDuration}ms ease-out, transform ${logoFadeDuration}ms cubic-bezier(0.25, 0, 0.3, 1)` : 'none',
              visibility: animationStage === 'initial' || animationStage === 'stars' ? 'hidden' : 'visible',
              willChange: animationStage === 'stars' ? 'transform, opacity' : 'auto',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitPerspective: 1000,
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
            }}
            onTransitionStart={() => {
              if (animationStage === 'logo') {
                console.log('[🎬LOGO] Transition started - fading in logo');
              }
            }}
            onTransitionEnd={() => {
              if (animationStage === 'logo') {
                console.log('[🎬LOGO] Transition ended - logo fully visible');
              }
            }}
          >
            <img
              src="/logo-first-frame.webp"
              alt="Mek Tycoon Logo"
              className="w-full h-full absolute inset-0"
              style={{
                opacity: useVideoLogo ? 0 : 'inherit',
                objectFit: 'contain',
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                WebkitTransform: 'translate3d(0, 0, 0)',
                imageRendering: 'crisp-edges',
                transition: 'opacity 0ms',
                pointerEvents: 'none',
              }}
            />
            <video
              ref={videoRef}
              src="/random-images/Everydays_00000.webm"
              loop
              muted
              playsInline
              className="w-full h-full absolute inset-0"
              style={{
                opacity: useVideoLogo ? 'inherit' : 0,
                objectFit: 'contain',
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                WebkitTransform: 'translate3d(0, 0, 0)',
                imageRendering: 'crisp-edges',
                transition: 'opacity 0ms',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Description - Scroll-triggered fade-in animation */}
          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl px-4 sm:px-6 text-center"
               style={{ transform: `translate(${descriptionXOffset}px, ${descriptionYOffset}px)` }}>
            <p
              className={`${descriptionColor} tracking-wide leading-relaxed break-words transition-all duration-700 ease-out`}
              style={{
                fontFamily: selectedFont,
                fontSize: `${descriptionFontSize}px`,
                opacity: hasScrolled ? 1 : 0,
                transform: hasScrolled ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              {descriptionText}
            </p>
          </div>

          {/* Join Beta Button - Fill Text Style */}
          <div
            className="mt-8 sm:mt-10 transition-all duration-700 ease-out"
            style={{
              opacity: hasScrolled ? 1 : 0,
              transform: hasScrolled ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '0.3s',
            }}
            onClick={() => {
              // TODO: Implement beta signup functionality
              console.log('[🎮BETA] Join Beta clicked');
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

          {/* Speaker Button - Top Right Corner */}
          <button
            onClick={() => handleAudioToggle(!audioPlaying)}
            className={`
              fixed top-4 right-4
              transition-all duration-500 ease-out
              active:scale-95
              cursor-pointer
              z-[100]
              ${audioPlaying ? 'text-white' : 'text-gray-700'}
            `}
            aria-label={audioPlaying ? 'Mute audio' : 'Play audio'}
            style={{
              transform: `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px) scale(${powerButtonScale})`,
              transformOrigin: 'center center',
              filter: powerButtonGlowEnabled && audioPlaying
                ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
                : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))',
              transition: 'filter 0.8s ease-in-out, transform 0.3s ease-out, color 0.8s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px) scale(${powerButtonScale * 1.1})`;
              e.currentTarget.style.filter = powerButtonGlowEnabled && audioPlaying
                ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) brightness(1.4)'
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
        </div>
      </div>

      {/* Phase Timeline - Positioned by Debug Slider */}
      <div
        className="relative w-screen z-[20]"
        style={{
          transform: `translateY(${phaseColumnYOffset}px)`,
        }}
      >
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
      </div>

      {/* Audio Consent Lightbox */}
      <AudioConsentLightbox
        onProceed={handleConsentProceed}
        isVisible={showAudioConsent}
        backdropDarkness={lightboxBackdropDarkness}
        toggleSize={audioToggleSize}
        toggleScale={audioToggleScale}
        lockScroll={lockScrollForConsent}
      />

    </div>
  );
}
