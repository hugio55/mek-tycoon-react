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
    imageUrl: '/mek-images/1000px/dp2-er3-lg2.webp',
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
        className="absolute inset-0 flex bg-transparent"
        style={{ gap: 0 }}
      >
        {timelineData.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;
          const isActive = isHovered || isSelected; // Active if hovered OR selected
          const isAnyActive = hoveredIndex !== null || selectedIndex !== null;

          // Perfect edge-to-edge with minimal overlap - no transform needed
          let widthPercent: number;

          if (isAnyActive) {
            if (isActive) {
              widthPercent = 30.1; // Active column with minimal overlap
            } else {
              widthPercent = 23.35; // Inactive columns (70/3 + 0.02 for sub-pixel gap prevention)
            }
          } else {
            widthPercent = 25.05; // All equal: 25.05% × 4 = 100.20% (0.20% overlap prevents sub-pixel gaps)
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
                marginRight: index < timelineData.length - 1 ? '-2px' : '0', // Overlap cards by 2px to eliminate sub-pixel gaps
                transition: 'width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                willChange: isAnyActive ? 'width' : 'auto',
                zIndex: isActive ? 20 : 10 - index,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
              onMouseEnter={() => handleHoverEnter(index)}
              onMouseLeave={handleHoverLeave}
              onClick={() => handlePhaseClick(index)}
            >
              {/* Timeline Background Image - bottommost layer, blends with page background */}
              <div
                className="absolute bg-cover bg-center"
                style={{
                  // Extend boundaries by blur radius × 2 to prevent soft/transparent edges
                  // When blur is applied, edges become semi-transparent. By extending the image
                  // beyond the container, we push those soft edges outside the visible area.
                  top: `${-(isActive ? imageBlurSelected : imageBlur) * 2}px`,
                  left: `${-(isActive ? imageBlurSelected : imageBlur) * 2}px`,
                  right: `${-(isActive ? imageBlurSelected : imageBlur) * 2}px`,
                  bottom: `${-(isActive ? imageBlurSelected : imageBlur) * 2}px`,
                  backgroundImage: `url(${item.imageUrl})`,
                  opacity: imageBlendMode === 'screen' ? 0.6 : 0.4,
                  maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                  WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                  filter: `grayscale(${isActive ? '0%' : '100%'}) blur(${isActive ? imageBlurSelected : imageBlur}px)`,
                  mixBlendMode: imageBlendMode,
                  transition: 'filter 0.3s ease-out, top 0.3s ease-out, left 0.3s ease-out, right 0.3s ease-out, bottom 0.3s ease-out',
                  willChange: isAnyActive ? 'filter' : 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackdropFilter: 'hidden',
                  border: 'none',
                  outline: 'none',
                }}
              />

              {/* Darkening Overlay - only in normal mode */}
              {imageBlendMode === 'normal' && (
                <div
                  className="absolute inset-0 bg-black"
                  style={{
                    opacity: (imageDarkness / 100) * 0.5,
                    transition: 'opacity 0.3s ease-out',
                    willChange: isAnyActive ? 'opacity' : 'auto',
                  }}
                />
              )}

              {/* Dark Gradient Overlay - only when using 'normal' blend mode (not lighten modes) */}
              {imageBlendMode === 'normal' && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, rgba(0,0,0,${0.9 * (hoverDarkenIntensity / 100)}) 0%, rgba(0,0,0,${0.6 * (hoverDarkenIntensity / 100)}) 30%, rgba(0,0,0,${0.2 * (hoverDarkenIntensity / 100)}) 50%, transparent 70%)`,
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.3s ease-out',
                    willChange: isAnyActive ? 'opacity' : 'auto',
                  }}
                />
              )}

              {/* Frosted Glass Backdrop Blur Overlay - separate layer with pointer-events-none */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backdropFilter: blurValue,
                  WebkitBackdropFilter: blurValue,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s ease-out, backdrop-filter 0.3s ease-out',
                  willChange: isAnyActive && idleBackdropBlur > 0 ? 'opacity, backdrop-filter' : 'auto',
                }}
              />

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
