'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import PowerSwitchToggle from '@/components/controls/PowerSwitchToggle';
import TeamCarousel from '@/components/TeamCarousel';
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
  logoYPosition: 50,
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
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

  // Motion blur controls - Layer 1
  const [motionBlurEnabled, setMotionBlurEnabled] = useState(DEFAULT_CONFIG.motionBlurEnabled);
  const [blurIntensity, setBlurIntensity] = useState(DEFAULT_CONFIG.blurIntensity);

  // Motion blur controls - Layer 2
  const [motionBlurEnabled2, setMotionBlurEnabled2] = useState(DEFAULT_CONFIG.motionBlurEnabled2);
  const [blurIntensity2, setBlurIntensity2] = useState(DEFAULT_CONFIG.blurIntensity2);

  // Description text color
  const [descriptionColor, setDescriptionColor] = useState(DEFAULT_CONFIG.descriptionColor);

  // Phase Carousel design variation
  const [designVariation, setDesignVariation] = useState<'modern' | 'industrial' | 'neon'>(DEFAULT_CONFIG.designVariation);

  // Phase header font
  const [phaseHeaderFont, setPhaseHeaderFont] = useState(DEFAULT_CONFIG.phaseHeaderFont);
  const [phaseHeaderFontSize, setPhaseHeaderFontSize] = useState(DEFAULT_CONFIG.phaseHeaderFontSize);
  const [phaseHeaderColor, setPhaseHeaderColor] = useState(DEFAULT_CONFIG.phaseHeaderColor);

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
          setDesignVariation(config.designVariation ?? DEFAULT_CONFIG.designVariation);
          setPhaseHeaderFont(config.phaseHeaderFont ?? DEFAULT_CONFIG.phaseHeaderFont);
          setPhaseHeaderFontSize(config.phaseHeaderFontSize ?? DEFAULT_CONFIG.phaseHeaderFontSize);
          setPhaseHeaderColor(config.phaseHeaderColor ?? DEFAULT_CONFIG.phaseHeaderColor);
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

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
          backgroundPosition: `center ${bgYPosition}%`,
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
      <div className="relative flex justify-center z-[20] px-4 py-8" style={{ alignItems: 'flex-start', paddingTop: `${logoYPosition}vh`, minHeight: '300vh' }}>
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16 w-full max-w-7xl pb-[100vh]">
          <div className="relative max-w-[80vw] max-h-[80vw]" style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
            <Image
              src="/logo/multi-color-big-3.webp"
              alt="Mek Tycoon"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Description - Mobile Optimized */}
          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl px-4 sm:px-6 text-center">
            <p className={`${descriptionColor}
                          tracking-wide leading-relaxed
                          break-words`}
               style={{ fontFamily: selectedFont, fontSize: `${descriptionFontSize}px` }}>
              {descriptionText}
            </p>
          </div>

          {/* Phase Timeline - Below Description */}
          <div className="w-full mt-8 sm:mt-12 md:mt-16 max-w-7xl">
            <HorizontalTimeline
              phaseHeaderFont={phaseHeaderFont}
              phaseHeaderFontSize={phaseHeaderFontSize}
              phaseHeaderColor={phaseHeaderColor}
            />
          </div>

          {/* Speaker Button - Below Phase Timeline */}
          <button
            onClick={() => handleAudioToggle(!audioPlaying)}
            className={`
              relative
              transition-all duration-500 ease-out
              hover:scale-110 active:scale-95
              cursor-pointer
              ${audioPlaying ? 'text-yellow-400' : 'text-gray-400'}
            `}
            aria-label={audioPlaying ? 'Mute audio' : 'Play audio'}
            style={{
              marginTop: '-1rem',
              filter: audioPlaying
                ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
                : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))',
              transition: 'filter 0.8s ease-in-out, transform 0.3s ease-out, color 0.8s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = audioPlaying
                ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) brightness(1.4)'
                : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0)) brightness(1.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = audioPlaying
                ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
                : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))';
            }}
          >
            {(() => {
              const SelectedIcon = SPEAKER_ICON_STYLES.find(s => s.id === speakerIconStyle)?.component || SPEAKER_ICON_STYLES[0].component;
              return <SelectedIcon size={58} isPlaying={audioPlaying} />;
            })()}
          </button>

          {/* Sound Toggle - Top Right Corner (Fixed Position) */}
          <div
            className="fixed top-4 right-4 z-[30] flex flex-row items-center gap-3"
            style={{
              transform: `translate(${powerButtonHorizontalOffset}px, ${powerButtonVerticalOffset}px)`
            }}
          >
            <div
              className={`${soundLabelColor} uppercase tracking-wider`}
              style={{
                fontFamily: soundLabelFont,
                fontSize: `${soundLabelSize}px`,
                transform: `translate(${soundLabelHorizontalOffset}px, ${soundLabelVerticalOffset}px)`
              }}
            >
              soundwaves
            </div>
            <div className={powerButtonGlowEnabled ? "power-button-flash-glow" : ""}>
              <PowerSwitchToggle
                checked={audioPlaying}
                onChange={handleAudioToggle}
                className="w-16 h-16"
                scale={powerButtonScale}
                verticalOffset={0}
              />
            </div>
          </div>

          {/* Team Carousel */}
          <div className="w-full mt-16 sm:mt-24 md:mt-32">
            <TeamCarousel />
          </div>
        </div>
      </div>

    </div>
  );
}
