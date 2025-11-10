'use client';

import { useEffect, useRef, useState } from 'react';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import { SPEAKER_ICON_STYLES, type SpeakerIconStyle } from '@/components/SpeakerIcons';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  brightness: number;
  twinkleOffset: number;
}


// Storage key must match the debug page
const STORAGE_KEY = 'mek-landing-debug-config';

// Default configuration
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
  logoYPosition: 400,
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
  speakerIconStyle: 'minimal' as SpeakerIconStyle,
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  // Note: phaseImage1-4 not in DEFAULT_CONFIG - PhaseCarousel manages these
};

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Control states - Layer 1
  const [starScale, setStarScale] = useState(DEFAULT_CONFIG.starScale);
  const [starSpeed, setStarSpeed] = useState(DEFAULT_CONFIG.starSpeed);
  const [starFrequency, setStarFrequency] = useState(DEFAULT_CONFIG.starFrequency);

  // Control states - Layer 2
  const [starScale2, setStarScale2] = useState(DEFAULT_CONFIG.starScale2);
  const [starSpeed2, setStarSpeed2] = useState(DEFAULT_CONFIG.starSpeed2);
  const [starFrequency2, setStarFrequency2] = useState(DEFAULT_CONFIG.starFrequency2);
  const [lineLength2, setLineLength2] = useState(DEFAULT_CONFIG.lineLength2);

  // Control states - Layer 3
  const [starScale3, setStarScale3] = useState(DEFAULT_CONFIG.starScale3);
  const [starSpeed3, setStarSpeed3] = useState(DEFAULT_CONFIG.starSpeed3);
  const [starFrequency3, setStarFrequency3] = useState(DEFAULT_CONFIG.starFrequency3);
  const [lineLength3, setLineLength3] = useState(DEFAULT_CONFIG.lineLength3);
  const [spawnDelay3, setSpawnDelay3] = useState(DEFAULT_CONFIG.spawnDelay3);

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
  // Note: phaseImage1-4 not needed here - PhaseCarousel reads directly from localStorage

  // Load config from localStorage and listen for changes from debug page
  useEffect(() => {
    const loadConfig = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const config = JSON.parse(stored);
          setStarScale(config.starScale ?? DEFAULT_CONFIG.starScale);
          setStarSpeed(config.starSpeed ?? DEFAULT_CONFIG.starSpeed);
          setStarFrequency(config.starFrequency ?? DEFAULT_CONFIG.starFrequency);
          setStarScale2(config.starScale2 ?? DEFAULT_CONFIG.starScale2);
          setStarSpeed2(config.starSpeed2 ?? DEFAULT_CONFIG.starSpeed2);
          setStarFrequency2(config.starFrequency2 ?? DEFAULT_CONFIG.starFrequency2);
          setLineLength2(config.lineLength2 ?? DEFAULT_CONFIG.lineLength2);
          setStarScale3(config.starScale3 ?? DEFAULT_CONFIG.starScale3);
          setStarSpeed3(config.starSpeed3 ?? DEFAULT_CONFIG.starSpeed3);
          setStarFrequency3(config.starFrequency3 ?? DEFAULT_CONFIG.starFrequency3);
          setLineLength3(config.lineLength3 ?? DEFAULT_CONFIG.lineLength3);
          setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
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
          // Note: phaseImage1-4 not loaded here - PhaseCarousel reads directly from localStorage
        } catch (e) {
          console.error('Failed to load debug config:', e);
        }
      }
    };

    // Load initial config
    loadConfig();

    // Listen for storage changes from debug page
    const handleStorageChange = () => {
      loadConfig();
    };

    // Listen for postMessage from parent (iframe scenario)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mek-landing-config-updated') {
        loadConfig();
      }
    };

    // Listen for both storage events:
    // 1. 'storage' - fires in OTHER tabs when localStorage changes
    // 2. 'mek-landing-config-updated' - custom event fired by debug page in SAME tab
    // 3. 'message' - postMessage from parent window (when in iframe)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mek-landing-config-updated', handleStorageChange);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mek-landing-config-updated', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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
    const numBackgroundStars = 800;
    for (let i = 0; i < numBackgroundStars; i++) {
      backgroundStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        brightness: Math.random() * 0.3 + 0.1, // Very dim
        twinkleOffset: Math.random() * Math.PI * 2,
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
      stars.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: Math.random() * 2 + 1,
      });
    }

    // Initialize Layer 2 stars (second starfield)
    const stars2: Star[] = [];
    for (let i = 0; i < starFrequency2; i++) {
      const { x, y } = initializeStar();
      stars2.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: Math.random() * 2 + 1,
      });
    }

    // Initialize Layer 3 stars (third starfield)
    const stars3: Star[] = [];
    for (let i = 0; i < starFrequency3; i++) {
      const { x, y } = initializeStar();
      stars3.push({
        x,
        y,
        z: Math.random() * maxZ,
        size: Math.random() * 2 + 1,
      });
    }

    // Track last spawn time for Layer 3 stars (for spawn delay)
    const starLastSpawnTime3 = new Map<number, number>();


    let animationId: number;
    const animate = () => {
      // Clear with transparency to show background image
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw distant background stars (very slow drift)
      const time = Date.now() * 0.00005; // Very slow movement
      backgroundStars.forEach((star) => {
        const twinkle = Math.sin(time + star.twinkleOffset) * 0.1 + 0.9;
        const opacity = star.brightness * twinkle;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, 0.5, 0, Math.PI * 2);
        ctx.fill();
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
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;
        const size = (star.size * scale) * starScale;

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const opacity = Math.min(1, (maxZ - star.z) / maxZ);
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
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;
        const size = (star.size * scale) * starScale2;

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const opacity = Math.min(1, (maxZ - star.z) / maxZ);

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
            starLastSpawnTime3.set(index, currentTime);
          } else {
            // Keep star out of view until delay passes
            star.z = -100;
          }
        }

        const scale = 1000 / star.z;
        const x = star.x * scale + centerX;
        const y = star.y * scale + centerY;
        const size = (star.size * scale) * starScale3;

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const opacity = Math.min(1, (maxZ - star.z) / maxZ);

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
  }, [starScale, starSpeed, starFrequency, starScale2, starSpeed2, starFrequency2, lineLength2, starScale3, starSpeed3, starFrequency3, lineLength3, spawnDelay3, motionBlurEnabled, blurIntensity, motionBlurEnabled2, blurIntensity2]);

  return (
    <div
      className="w-screen bg-black"
      style={{
        margin: 0,
        padding: 0,
        minHeight: '300vh',
        height: 'auto',
        overflowX: 'hidden',
        overflowY: 'scroll',
        position: 'relative',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 w-full h-full bg-black z-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: viewportHeight > 0
            ? `center calc(50% + ${bgYPosition}px)`
            : `center ${bgYPosition}%`,
          backgroundRepeat: 'no-repeat',
          touchAction: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Fixed canvas layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-[1] pointer-events-none"
        style={{ display: 'block', touchAction: 'none' }}
      />

      {/* Scrollable content layer */}
      <div
        className="relative flex justify-center z-[20] px-4"
        style={{
          paddingTop: viewportHeight > 0
            ? `calc(50vh - ${logoSize / 2}px)`
            : `${logoYPosition}px`,
          minHeight: '300vh'
        }}
      >
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16 w-full max-w-7xl pb-[100vh]">
          <div className="relative max-w-[80vw] max-h-[80vw]" style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
            <video
              src="/random-images/Everydays_00000.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          </div>

          {/* Description - Mobile Optimized with Glass Card */}
          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl px-4 sm:px-6 text-center"
               style={{ transform: `translate(${descriptionXOffset}px, ${descriptionYOffset}px)` }}>
            <div className="relative bg-black/40 backdrop-blur-[40px] border border-white/[0.15] rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <p className={`${descriptionColor}
                            tracking-wide leading-relaxed
                            break-words`}
                 style={{ fontFamily: selectedFont, fontSize: `${descriptionFontSize}px` }}>
                {descriptionText}
              </p>
            </div>
          </div>

          {/* Speaker Button - Above Phase Timeline */}
          <button
            onClick={() => handleAudioToggle(!audioPlaying)}
            className={`
              relative
              transition-all duration-500 ease-out
              active:scale-95
              cursor-pointer
              mt-8 sm:mt-12 md:mt-16
              ${audioPlaying ? 'text-yellow-400' : 'text-gray-400'}
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

          {/* Phase Timeline - Below Speaker Button */}
          <div className="w-full mt-8 sm:mt-12 md:mt-16 max-w-7xl">
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
        </div>
      </div>

    </div>
  );
}
