'use client';

import { useState, useEffect, useRef } from 'react';

interface TimelineItem {
  phase: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
}

interface HorizontalTimelineProps {
  phaseHeaderFont?: string;
  phaseHeaderFontSize?: number;
  phaseHeaderColor?: string;
  phaseDescriptionFont?: string;
  phaseDescriptionFontSize?: number;
  imageDarkness?: number;
  imageBlur?: number;
  imageBlurSelected?: number; // Blur amount for the selected/active card
  columnHeight?: number;
  fadePosition?: number;
  imageBlendMode?: 'normal' | 'screen' | 'lighten' | 'lighter';
  hoverDarkenIntensity?: number; // 0-100: scales the gradient overlay darkness on hover/active
  idleBackdropBlur?: number; // 0-50px: backdrop blur on hover/active columns (blurs background behind card)
}

const STORAGE_KEY = 'mek-landing-debug-config';

const defaultTimelineData: TimelineItem[] = [
  {
    phase: 'Phase I',
    title: 'Foundation',
    subtitle: 'The Beginning',
    description: 'Project inception and initial concept development. The vision for Mek Tycoon begins to take shape.',
    imageUrl: '/mek-images/1000px/dj1-bf3-mt1.webp',
  },
  {
    phase: 'Phase II',
    title: 'Development',
    subtitle: 'Building the Future',
    description: 'Building the core ecosystem. Smart contracts, game mechanics, and NFT infrastructure come to life.',
    imageUrl: '/mek-images/1000px/dp1-er3-lg2.webp',
  },
  {
    phase: 'Phase III',
    title: 'Launch',
    subtitle: 'Going Live',
    description: 'Going live with the mainnet. The Mek Tycoon universe opens its doors to the community.',
    imageUrl: '/mek-images/1000px/dp2-jg1-nm1.webp',
  },
  {
    phase: 'Phase IV',
    title: 'Expansion',
    subtitle: 'Growing Together',
    description: 'Growing the community. New features, partnerships, and gameplay experiences emerge.',
    imageUrl: '/mek-images/1000px/fn4-cu1-de1.webp',
  },
];

export default function HorizontalTimeline({
  phaseHeaderFont = 'Orbitron',
  phaseHeaderFontSize = 48,
  phaseHeaderColor = 'text-white/70',
  phaseDescriptionFont = 'Arial',
  phaseDescriptionFontSize = 16,
  imageDarkness = 30,
  imageBlur = 20,
  imageBlurSelected = 5,
  columnHeight = 288,
  fadePosition = 50,
  imageBlendMode = 'normal',
  hoverDarkenIntensity = 90,
  idleBackdropBlur = 0
}: HorizontalTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>(defaultTimelineData);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug logging when prop changes
  useEffect(() => {
    console.log('[🔍BLUR] HorizontalTimeline received prop:', idleBackdropBlur);
  }, [idleBackdropBlur]);

  // Load phase images from localStorage
  useEffect(() => {
    const loadConfig = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updatedData = defaultTimelineData.map((item, index) => {
            const imageKey = `phaseImage${index + 1}` as keyof typeof parsed;
            const customImage = parsed[imageKey];
            return {
              ...item,
              imageUrl: customImage || item.imageUrl
            };
          });
          setTimelineData(updatedData);
          console.log('[🎯TIMELINE] Loaded phase images from config');
        } catch (e) {
          console.error('Failed to parse debug config:', e);
        }
      }
    };

    loadConfig();

    // Listen for config updates from landing-debug
    const handleConfigUpdate = () => {
      console.log('[🎯TIMELINE] Received config update event, reloading...');
      loadConfig();
    };

    window.addEventListener('storage', handleConfigUpdate);
    window.addEventListener('mek-landing-config-updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('storage', handleConfigUpdate);
      window.removeEventListener('mek-landing-config-updated', handleConfigUpdate);
    };
  }, []);

  // Handle clicking outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePhaseClick = (index: number) => {
    // Toggle: if clicking the same phase, deselect it
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Debug log hover state changes
  const handleHoverEnter = (index: number) => {
    console.log('[🔍BLUR] Mouse entered column', index, '- idleBackdropBlur prop value:', idleBackdropBlur);
    setHoveredIndex(index);
  };

  const handleHoverLeave = () => {
    console.log('[🔍BLUR] Mouse left column');
    setHoveredIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden bg-black"
      style={{ height: `${columnHeight}px` }}
    >
      <div
        className="absolute inset-0 flex"
        style={{ gap: 0 }}
      >
        {timelineData.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;
          const isActive = isHovered || isSelected; // Active if hovered OR selected
          const isAnyActive = hoveredIndex !== null || selectedIndex !== null;

          // Clean percentage-based widths that sum to exactly 100%
          let widthPercent: number;
          let translateX: number = 0; // Use transform for overlap, not margins

          if (isAnyActive) {
            if (isActive) {
              widthPercent = 30; // Active card: 30%
            } else {
              widthPercent = 70 / 3; // Inactive cards: 23.333% each (70% / 3)
            }
          } else {
            widthPercent = 25; // All equal: 25% each
          }

          // Apply sub-pixel perfect overlap using transform
          // Each card (except first) overlaps by 2px to eliminate any gaps
          if (index > 0) {
            translateX = -2 * index; // Progressive overlap: -2px, -4px, -6px
          }

          // Calculate blur value
          const blurValue = isActive && idleBackdropBlur > 0 ? `blur(${idleBackdropBlur}px)` : 'none';

          // Debug log for each column render
          console.log(`[🔍BLUR] Column ${index} render: isActive=${isActive}, blurValue="${blurValue}", idleBackdropBlur=${idleBackdropBlur}`);

          return (
            <div
              key={index}
              className={`
                relative
                overflow-hidden
                cursor-pointer
              `}
              style={{
                width: `${widthPercent}%`,
                transform: `translateX(${translateX}px)`,
                transition: 'width 0.5s ease-in-out, transform 0.5s ease-in-out',
                zIndex: isActive ? 20 : 10 - index, // Active card on top, rest stack left-to-right
              }}
              onMouseEnter={() => handleHoverEnter(index)}
              onMouseLeave={handleHoverLeave}
              onClick={() => handlePhaseClick(index)}
            >
              {/* Isolation wrapper - prevents backdrop-filter from interfering with blend mode */}
              <div
                className="absolute inset-0"
                style={{
                  isolation: 'isolate',
                  backgroundColor: '#000', // Solid black background to prevent any gap visibility
                }}
              >
                {/* Blend Mode Wrapper - contains visual layers that need to blend */}
                <div
                  className="absolute inset-0"
                  style={{
                    mixBlendMode: imageBlendMode,
                  }}
                >
                  {/* Timeline Background Image with each phase having its own Mek image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{
                      backgroundImage: `url(${item.imageUrl})`,
                      opacity: 0.85,
                      maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                      WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                      filter: `grayscale(${isActive ? '0%' : '100%'}) blur(${isActive ? imageBlurSelected : imageBlur}px)`,
                      transform: `scale(${1 + ((isActive ? imageBlurSelected : imageBlur) * 0.015)})`,
                      transformOrigin: 'center',
                    }}
                  />

                  {/* Darkening Overlay - controlled by imageDarkness parameter */}
                  <div
                    className="absolute inset-0 bg-black transition-opacity duration-500"
                    style={{
                      opacity: imageDarkness / 100
                    }}
                  />

                  {/* Dark Gradient Overlay - only when using 'normal' blend mode (not lighten modes) */}
                  {imageBlendMode === 'normal' && (
                    <div
                      className={`
                        absolute inset-0
                        transition-opacity duration-500
                        ${isActive ? 'opacity-100' : 'opacity-0'}
                      `}
                      style={{
                        background: `linear-gradient(to top, rgba(0,0,0,${0.9 * (hoverDarkenIntensity / 100)}) 0%, rgba(0,0,0,${0.6 * (hoverDarkenIntensity / 100)}) 30%, rgba(0,0,0,${0.2 * (hoverDarkenIntensity / 100)}) 50%, transparent 70%)`
                      }}
                    />
                  )}
                </div>

                {/* Frosted Glass Backdrop Blur Overlay - separate layer with pointer-events-none */}
                <div
                  className={`
                    absolute inset-0
                    transition-all duration-500
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                    pointer-events-none
                  `}
                  style={{
                    backdropFilter: blurValue,
                    WebkitBackdropFilter: blurValue,
                  }}
                />
              </div>

              {/* Phase Label - always visible, centered */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <h2
                  className={`
                    font-bold
                    ${phaseHeaderColor}
                    tracking-wider
                    transition-all duration-500
                    pointer-events-none
                  `}
                  style={{
                    fontFamily: phaseHeaderFont,
                    fontSize: `${phaseHeaderFontSize}px`,
                    textShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {item.phase}
                </h2>
              </div>

              {/* Content - slides up on entrance, slides down on exit */}
              <div
                className={`
                  absolute bottom-0 left-0
                  p-8 md:p-12
                  z-20
                  ${isActive
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                  }
                `}
                style={{
                  transition: isActive
                    ? 'transform 0.4s ease-out 0.2s, opacity 0.3s ease-out 0.2s'
                    : 'transform 0.3s ease-in, opacity 0.2s ease-in',
                  width: '30vw',
                  pointerEvents: 'none',
                }}
              >
                <h3
                  className={`
                    text-2xl md:text-3xl
                    font-bold
                    text-[#1779cf]
                    mb-2
                    font-['Orbitron']
                    tracking-wide
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  `}
                  style={{
                    transition: isActive
                      ? 'opacity 0.3s ease-out 0.4s, transform 0.3s ease-out 0.4s'
                      : 'opacity 0.2s ease-in, transform 0.2s ease-in',
                  }}
                >
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p
                    className={`
                      text-gray-300/80 text-sm md:text-base mb-3 italic
                      ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}
                    style={{
                      transition: isActive
                        ? 'opacity 0.3s ease-out 0.45s, transform 0.3s ease-out 0.45s'
                        : 'opacity 0.2s ease-in, transform 0.2s ease-in',
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}
                <p
                  className={`
                    text-white/90 leading-relaxed
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  `}
                  style={{
                    fontFamily: phaseDescriptionFont,
                    fontSize: `${phaseDescriptionFontSize}px`,
                    transition: isActive
                      ? 'opacity 0.3s ease-out 0.5s, transform 0.3s ease-out 0.5s'
                      : 'opacity 0.2s ease-in, transform 0.2s ease-in',
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
