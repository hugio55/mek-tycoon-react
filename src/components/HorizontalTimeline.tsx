'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
    imageUrl: '/mek-images/1000px/dp2-aa1-lg2.webp',
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedWidths, setExpandedWidths] = useState<{ [key: number]: number }>({});

  // Detect if device supports touch (mobile/tablet)
  useEffect(() => {
    const hasTouchCapability =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none)').matches;
    setIsTouchDevice(hasTouchCapability);
  }, []);

  // Load phase cards from Convex database
  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);

  // Debug logging when prop changes
  useEffect(() => {
    console.log('[🔍BLUR] HorizontalTimeline received prop:', idleBackdropBlur);
  }, [idleBackdropBlur]);

  // Update timeline data when phaseCards loads from database
  useEffect(() => {
    if (!phaseCards || phaseCards.length === 0) return;

    const updatedData = phaseCards.map((card, index) => {
      const defaultItem = defaultTimelineData[index] || defaultTimelineData[0];
      return {
        phase: card.header || defaultItem.phase,
        title: card.title || defaultItem.title,
        subtitle: card.subtitle || defaultItem.subtitle,
        description: card.description || defaultItem.description,
        imageUrl: card.imageUrl || defaultItem.imageUrl, // Use database imageUrl if available, fallback to default
      };
    });

    setTimelineData(updatedData);
    console.log('[🎯TIMELINE] Loaded phase data from Convex database:', updatedData);
  }, [phaseCards]);

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

  // Detect overflow and calculate needed width expansion for active card
  useEffect(() => {
    const activeIndex = hoveredIndex ?? selectedIndex;
    if (activeIndex === null) {
      setExpandedWidths({});
      return;
    }

    const contentElement = contentRefs.current[activeIndex];
    if (!contentElement || !containerRef.current) return;

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const scrollWidth = contentElement.scrollWidth;
      const clientWidth = contentElement.clientWidth;
      const isOverflowing = scrollWidth > clientWidth;

      console.log(`[📏OVERFLOW] Card ${activeIndex}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${isOverflowing}`);

      if (isOverflowing) {
        // Calculate additional width needed as percentage of container
        const containerWidth = containerRef.current!.offsetWidth;
        const additionalPixels = scrollWidth - clientWidth;
        const additionalPercent = (additionalPixels / containerWidth) * 100;

        // Calculate new active width (base 30.3% + additional needed * 2x for extra space)
        const newActiveWidth = 30.3 + (additionalPercent * 2);

        // Calculate how much to shrink inactive cards
        // Total available: 100% - newActiveWidth
        // Distributed among 3 inactive cards
        const remainingWidth = 100 - newActiveWidth;
        const inactiveWidth = remainingWidth / 3;

        console.log(`[📏OVERFLOW] Expanding card ${activeIndex} from 30.3% to ${newActiveWidth.toFixed(1)}%, inactive cards: ${inactiveWidth.toFixed(1)}%`);

        setExpandedWidths({
          activeWidth: newActiveWidth,
          inactiveWidth: inactiveWidth,
        });
      } else {
        // No overflow detected, use default widths
        setExpandedWidths({});
      }
    });
  }, [hoveredIndex, selectedIndex, timelineData]);

  const handlePhaseClick = (index: number) => {
    // Only handle clicks on touch devices
    if (!isTouchDevice) return;

    // Toggle: if clicking the same phase, deselect it
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Debug log hover state changes
  const handleHoverEnter = (index: number) => {
    // Only handle hover on non-touch devices (desktop)
    if (isTouchDevice) return;

    console.log('[🔍BLUR] Mouse entered column', index, '- idleBackdropBlur prop value:', idleBackdropBlur);
    setHoveredIndex(index);
  };

  const handleHoverLeave = () => {
    // Only handle hover on non-touch devices (desktop)
    if (isTouchDevice) return;

    console.log('[🔍BLUR] Mouse left column');
    setHoveredIndex(null);
  };

  // Format description text: convert markdown-style formatting to HTML
  const formatDescription = (text: string) => {
    return text
      .split('\n')
      .map(line => {
        // Convert "- " at start to bullet point
        if (line.trim().startsWith('- ')) {
          line = '• ' + line.trim().substring(2);
        }
        // Convert *text* to bold
        line = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        return line;
      })
      .join('<br/>');
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: `${columnHeight}px`,
        width: '100%',
        backgroundColor: 'transparent',
        isolation: 'isolate',
        contain: 'layout style paint',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="absolute inset-0 flex"
        style={{
          gap: 0,
          backgroundColor: 'transparent',
          width: '100%',
        }}
      >
        {timelineData.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;
          const isActive = isHovered || isSelected; // Active if hovered OR selected
          const isAnyActive = hoveredIndex !== null || selectedIndex !== null;

          // Calculate width based on overflow detection
          let widthPercent: number;

          if (isAnyActive) {
            if (isActive) {
              // Use expanded width if overflow detected, otherwise default 30.3%
              widthPercent = expandedWidths.activeWidth || 30.3;
            } else {
              // Use calculated inactive width if expansion occurred, otherwise default 23.4%
              widthPercent = expandedWidths.inactiveWidth || 23.4;
            }
          } else {
            widthPercent = 25; // All equal: 25% each
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
                transition: 'width 0.5s ease-in-out',
                zIndex: isActive ? 20 : 10, // Active card on top
              }}
              onMouseEnter={() => handleHoverEnter(index)}
              onMouseLeave={handleHoverLeave}
              onClick={() => handlePhaseClick(index)}
            >
              {/* Timeline Background Image - bottommost layer, blends with page background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${item.imageUrl})`,
                  opacity: imageBlendMode === 'screen' ? 0.6 : 0.4,
                  maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                  WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) ${fadePosition - 10}%, rgba(0,0,0,0) ${fadePosition + 25}%)`,
                  filter: `grayscale(${isActive ? '0%' : '100%'}) blur(${isActive ? imageBlurSelected * 1.2 : imageBlur * 1.2}px)`,
                  mixBlendMode: imageBlendMode,
                  transition: 'filter 0.3s ease-out',
                  willChange: isAnyActive ? 'filter' : 'auto',
                  backfaceVisibility: 'hidden',
                  border: 'none',
                  outline: 'none',
                }}
              />

              {/* Darkening Overlay removed - was blocking blend mode transparency */}

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
                className="absolute pointer-events-none"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backdropFilter: blurValue,
                  WebkitBackdropFilter: blurValue,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s ease-out, backdrop-filter 0.3s ease-out',
                  willChange: isAnyActive && idleBackdropBlur > 0 ? 'opacity, backdrop-filter' : 'auto',
                  isolation: 'isolate',
                  contain: 'layout style paint',
                }}
              />

              {/* Phase Label - fades out on hover */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <h2
                  className={`
                    font-bold
                    ${phaseHeaderColor}
                    tracking-wider
                    pointer-events-none
                    ${isActive ? 'opacity-0' : 'opacity-100'}
                  `}
                  style={{
                    fontFamily: phaseHeaderFont,
                    fontSize: `${phaseHeaderFontSize}px`,
                    textShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
                    transition: isActive
                      ? 'opacity 0.3s ease-out'
                      : 'opacity 0.3s ease-in 0.2s',
                  }}
                >
                  {item.phase}
                </h2>
              </div>

              {/* Content - slides up on entrance, slides down on exit */}
              <div
                ref={(el) => (contentRefs.current[index] = el)}
                className={`
                  absolute inset-0
                  p-8 md:p-12
                  z-20
                  flex flex-col
                  ${isActive
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                  }
                `}
                style={{
                  transition: isActive
                    ? 'transform 0.4s ease-out 0.2s, opacity 0.3s ease-out 0.2s, width 0.5s ease-in-out'
                    : 'transform 0.3s ease-in, opacity 0.2s ease-in, width 0.5s ease-in-out',
                  width: '100%',
                  maxWidth: '100%',
                  pointerEvents: 'none',
                }}
              >
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
                <div
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
                  dangerouslySetInnerHTML={{ __html: formatDescription(item.description) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
