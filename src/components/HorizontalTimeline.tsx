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

  // Debug log whenever selectedIndex changes
  useEffect(() => {
    console.log('[🎯STATE] selectedIndex changed to:', selectedIndex);
  }, [selectedIndex]);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>(defaultTimelineData);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedWidths, setExpandedWidths] = useState<{ [key: number]: number }>({});
  const [contentHeights, setContentHeights] = useState<{ [key: number]: number }>({});

  // Detect viewport size for mobile layout
  useEffect(() => {
    const checkViewport = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < 1024;
      setIsMobile(nowMobile);

      // Force layout recalculation on mobile viewport changes (Safari URL bar, orientation)
      if (nowMobile && containerRef.current) {
        setTimeout(() => {
          if (containerRef.current) {
            console.log('[📱VIEWPORT] Forcing layout recalculation after viewport change');
            // Force reflow
            const _ = containerRef.current.offsetHeight;

            // Trigger Safari layout engine
            const currentScroll = window.scrollY;
            if (currentScroll > 0) {
              window.scrollTo(0, currentScroll + 1);
              requestAnimationFrame(() => {
                window.scrollTo(0, currentScroll);
              });
            }
          }
        }, 100);
      }
    };

    checkViewport();

    // Use visualViewport API for Safari iOS (handles URL bar show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkViewport);
    }
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkViewport);
      }
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, [isMobile]);

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

  useEffect(() => {
    console.log('[📝TYPO] HorizontalTimeline received phaseDescriptionFontSize:', phaseDescriptionFontSize);
  }, [phaseDescriptionFontSize]);

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

  // Measure content heights for GPU-accelerated animations (mobile only)
  useEffect(() => {
    if (!isMobile || timelineData.length === 0) return;

    // Wait for refs to be populated and content to render
    const timer = setTimeout(() => {
      const heights: { [key: number]: number } = {};
      contentRefs.current.forEach((ref, index) => {
        if (ref) {
          // Temporarily expand to measure full content height
          const parent = ref.parentElement;
          if (parent) {
            const originalMaxHeight = (parent.parentElement as HTMLElement)?.style.maxHeight;
            if (parent.parentElement) {
              (parent.parentElement as HTMLElement).style.maxHeight = 'none';
              heights[index] = ref.scrollHeight + 48; // Add padding buffer
              (parent.parentElement as HTMLElement).style.maxHeight = originalMaxHeight || '';
            }
          }
          console.log(`[📏HEIGHT] Card ${index} measured height: ${heights[index]}px`);
        }
      });
      if (Object.keys(heights).length > 0) {
        setContentHeights(heights);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMobile, timelineData]);

  // Safari iOS: Force layout recalculation after animations complete
  useEffect(() => {
    if (!isMobile || selectedIndex === null) return;

    // After animation completes (600ms), ensure layout is correct
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Trigger reflow to fix any Safari layout bugs
        containerRef.current.getBoundingClientRect();
        // Force document height recalculation
        document.body.style.minHeight = `${document.documentElement.scrollHeight}px`;
        requestAnimationFrame(() => {
          document.body.style.minHeight = '';
        });
      }
    }, 650); // Slightly after animation completes

    return () => clearTimeout(timer);
  }, [selectedIndex, isMobile]);

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
    console.log('[🎯CLICK] Phase clicked:', {
      index,
      isMobile,
      currentSelected: selectedIndex,
      willToggleTo: selectedIndex === index ? null : index
    });

    // On mobile viewport, handle clicks to toggle selection
    // On desktop viewport, ignore clicks (use hover instead)
    if (!isMobile) {
      console.log('[🎯CLICK] Ignoring click - not mobile viewport');
      return;
    }

    // Toggle: if clicking the same phase, deselect it
    const newIndex = selectedIndex === index ? null : index;
    console.log('[🎯CLICK] Setting selectedIndex to:', newIndex);
    setSelectedIndex(newIndex);

    // CRITICAL iOS Safari fix: Force layout recalculation after transition completes
    // Safari doesn't properly update document height when cards expand/collapse
    setTimeout(() => {
      if (containerRef.current) {
        console.log('[🎯SAFARI] Forcing layout recalculation after card animation');

        // Force reflow by accessing offsetHeight
        const containerHeight = containerRef.current.offsetHeight;

        // Force document height recalculation
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );

        console.log('[🎯SAFARI] Container height:', containerHeight, 'Document height:', documentHeight);

        // REMOVED: Scroll micro-adjustments were causing cumulative upward drift
        // The +1/-1 scroll trick accumulated errors over multiple open/close cycles
        // causing phase cards to creep upward and overlap Join Beta button
      }
    }, 650); // Wait for 0.6s transition + 50ms buffer
  };

  // Debug log hover state changes
  const handleHoverEnter = (index: number) => {
    // Only handle hover on desktop viewport (not mobile)
    if (isMobile) return;

    console.log('[🔍BLUR] Mouse entered column', index, '- idleBackdropBlur prop value:', idleBackdropBlur);
    setHoveredIndex(index);
  };

  const handleHoverLeave = () => {
    // Only handle hover on desktop viewport (not mobile)
    if (isMobile) return;

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
      className="relative"
      style={{
        height: isMobile ? 'auto' : `${columnHeight}px`,
        minHeight: 'auto', // Let content determine height naturally - don't force 100vh
        width: '100%',
        backgroundColor: 'transparent',
        isolation: 'isolate',
        contain: isMobile ? 'none' : 'layout style paint', // Disable containment on mobile for proper dynamic height
        margin: 0,
        padding: 0,
        overflow: isMobile ? 'visible' : 'hidden',
        WebkitOverflowScrolling: 'touch', // Smooth iOS scrolling
      }}
    >
      <div
        className={isMobile ? "flex flex-col" : "absolute inset-0 flex"}
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

          // Debug log active state for each card
          if (isActive) {
            console.log(`[🎯ACTIVE] Card ${index} is ACTIVE:`, {
              isHovered,
              isSelected,
              hoveredIndex,
              selectedIndex,
              isMobile
            });
          }

          // Calculate width/height based on layout mode
          let dimensionStyle: React.CSSProperties;
          let useAspectRatio = false;

          if (isMobile) {
            // Mobile: vertical layout with GPU-accelerated max-height transitions
            // Calculate collapsed height based on 16:9 aspect ratio
            // Use visualViewport for Safari iOS to handle dynamic viewport changes
            const viewportWidth = typeof window !== 'undefined'
              ? (window.visualViewport?.width || window.innerWidth)
              : 400;
            const collapsedHeight = viewportWidth * (9 / 16);
            const expandedHeight = contentHeights[index] || 800;

            if (isActive) {
              // Expanded: max-height based on measured content
              dimensionStyle = {
                width: '100%',
                minHeight: `${collapsedHeight}px`, // Prevent shrinking below collapsed size
                maxHeight: `${expandedHeight}px`,
              };
              useAspectRatio = false;
              console.log(`[🎯DIMENSION] Card ${index} EXPANDED (mobile): ${expandedHeight}px`);
            } else {
              // Collapsed: max-height based on 16:9 aspect ratio
              dimensionStyle = {
                width: '100%',
                minHeight: `${collapsedHeight}px`, // Maintain card size
                maxHeight: `${collapsedHeight}px`,
              };
              useAspectRatio = true;
              console.log(`[🎯DIMENSION] Card ${index} COLLAPSED (mobile): ${collapsedHeight}px`);
            }
          } else {
            // Desktop: horizontal layout
            let widthPercent: number;

            if (isAnyActive) {
              if (isActive) {
                widthPercent = expandedWidths.activeWidth || 30.3;
              } else {
                widthPercent = expandedWidths.inactiveWidth || 23.4;
              }
            } else {
              widthPercent = index === 3 ? 25.1 : 25;
            }

            dimensionStyle = {
              width: `${widthPercent}%`,
              height: '100%',
            };
            useAspectRatio = false;
          }

          // Calculate blur value
          const blurValue = isActive && idleBackdropBlur > 0 ? `blur(${idleBackdropBlur}px)` : 'none';

          return (
            <div
              key={index}
              className={`
                relative
                overflow-hidden
                cursor-pointer
              `}
              style={{
                ...dimensionStyle,
                overflow: 'hidden',
                transition: isMobile
                  ? 'max-height 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), min-height 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  : 'width 0.5s ease-in-out',
                zIndex: isActive ? 20 : 10,
                touchAction: isMobile ? 'manipulation' : 'auto',
                contain: isMobile ? 'layout' : 'layout style paint', // Reduce Safari containment issues
                transform: 'translateZ(0)', // Force GPU acceleration
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden', // Safari-specific
                willChange: 'auto', // Remove conditional to prevent Safari rendering bugs
                isolation: 'isolate', // Prevent stacking context issues
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
                    fontSize: isMobile ? `${phaseHeaderFontSize * 0.6}px` : `${phaseHeaderFontSize}px`,
                    textShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
                    transition: isActive
                      ? 'opacity 0.3s ease-out'
                      : 'opacity 0.3s ease-in 0.2s',
                  }}
                >
                  {isMobile ? `Phase ${index + 1}` : item.phase}
                </h2>
              </div>

              {/* Content - GPU-accelerated animation wrapper */}
              <div
                className={`
                  ${isMobile ? 'relative' : 'absolute inset-0'}
                  z-20
                `}
                style={{
                  overflow: isMobile ? 'hidden' : 'visible',
                  transform: 'translateZ(0)',
                  willChange: isMobile && isAnyActive ? 'transform, opacity' : 'auto',
                }}
              >
                <div
                  ref={(el) => (contentRefs.current[index] = el)}
                  className={`
                    ${isMobile ? 'p-6' : 'p-8 md:p-12'}
                    flex flex-col
                  `}
                style={{
                  transform: isActive
                    ? 'translate3d(0, 0, 0) scale(1)'
                    : isMobile
                      ? 'translate3d(0, 8px, 0) scale(0.98)'
                      : 'translate3d(0, 16px, 0) scale(0.95)',
                  opacity: isActive ? 1 : 0,
                  transition: isActive
                    ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) 0.15s, opacity 0.4s ease-out 0.15s'
                    : 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease-in',
                  width: '100%',
                  maxWidth: '100%',
                  pointerEvents: 'none',
                  backfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d',
                }}
              >
                {item.subtitle && (
                  <p
                    className="text-gray-300/80 mb-2 italic"
                    style={{
                      fontSize: isMobile ? '14px' : undefined,
                      transform: isActive ? 'translate3d(0, 0, 0)' : 'translate3d(0, 4px, 0)',
                      opacity: isActive ? 1 : 0,
                      transition: isActive
                        ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.3s, opacity 0.4s ease-out 0.3s'
                        : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease-in',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}
                <h3
                  className={`
                    font-bold
                    text-[#fab617]
                    ${isMobile ? 'mb-3' : 'mb-2'}
                    font-['Orbitron']
                    tracking-wide
                  `}
                  style={{
                    fontSize: isMobile ? '24px' : '32px',
                    transform: isActive ? 'translate3d(0, 0, 0)' : 'translate3d(0, 4px, 0)',
                    opacity: isActive ? 1 : 0,
                    transition: isActive
                      ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.25s, opacity 0.4s ease-out 0.25s'
                      : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease-in',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {item.title}
                </h3>
                <div
                  className="text-white/90 leading-relaxed"
                  style={{
                    fontFamily: phaseDescriptionFont,
                    fontSize: `${phaseDescriptionFontSize}px`,
                    transform: isActive ? 'translate3d(0, 0, 0)' : 'translate3d(0, 4px, 0)',
                    opacity: isActive ? 1 : 0,
                    transition: isActive
                      ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.35s, opacity 0.4s ease-out 0.35s'
                      : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.2s ease-in',
                    backfaceVisibility: 'hidden',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatDescription(item.description) }}
                />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
