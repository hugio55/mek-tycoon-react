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
  imageBlendMode = 'normal'
}: HorizontalTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>(defaultTimelineData);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden"
      style={{ height: `${columnHeight}px` }}
    >
      <div className="absolute inset-0 flex">
        {timelineData.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;
          const isActive = isHovered || isSelected; // Active if hovered OR selected
          const isAnyActive = hoveredIndex !== null || selectedIndex !== null;

          let widthClass = 'w-1/4';
          if (isAnyActive) {
            if (isActive) {
              widthClass = 'w-[30%]';
            } else {
              widthClass = 'w-[23.33%]';
            }
          }

          return (
            <div
              key={index}
              className={`
                ${widthClass}
                relative
                overflow-hidden
                cursor-pointer
              `}
              style={{
                transition: isActive
                  ? 'all 0.5s ease-in-out 0s'
                  : 'all 0.5s ease-in-out 0.25s',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handlePhaseClick(index)}
            >
              {/* Blend Mode Wrapper - contains image + overlays so entire composition blends */}
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
                    opacity: isActive ? 0.85 : 0.5,
                    maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                    WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                    filter: `grayscale(${isActive ? '0%' : '100%'}) blur(${isActive ? imageBlurSelected : imageBlur}px)`,
                  }}
                />

                {/* Darkening Overlay - controlled by imageDarkness parameter */}
                <div
                  className="absolute inset-0 bg-black transition-opacity duration-500"
                  style={{
                    opacity: imageDarkness / 100
                  }}
                />

                {/* Dark Gradient Overlay - appears on hover/click, concentrated at bottom */}
                <div
                  className={`
                    absolute inset-0
                    transition-opacity duration-500
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.2) 50%, transparent 70%)'
                  }}
                />
              </div>

              {/* Phase Label - always visible, centered */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
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

              {/* Content - fades in from bottom on hover/click */}
              <div
                className={`
                  absolute bottom-0 left-0 right-0
                  p-8 md:p-12
                  z-20
                  ${isActive
                    ? 'translate-y-0'
                    : 'translate-y-8'
                  }
                `}
                style={{
                  transition: 'transform 0.5s ease-in-out',
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
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{
                    transition: isActive ? 'opacity 0.3s ease-in-out 0.4s' : 'opacity 0.2s ease-in-out 0s',
                  }}
                >
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p
                    className={`
                      text-gray-300/80 text-sm md:text-base mb-3 italic
                      ${isActive ? 'opacity-100' : 'opacity-0'}
                    `}
                    style={{
                      transition: isActive ? 'opacity 0.3s ease-in-out 0.4s' : 'opacity 0.2s ease-in-out 0s',
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}
                <p
                  className={`
                    text-white/90 leading-relaxed
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{
                    fontFamily: phaseDescriptionFont,
                    fontSize: `${phaseDescriptionFontSize}px`,
                    transition: isActive ? 'opacity 0.3s ease-in-out 0.4s' : 'opacity 0.2s ease-in-out 0s',
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
