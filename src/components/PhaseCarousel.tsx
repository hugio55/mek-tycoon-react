'use client';

import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface Phase {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

type DesignVariation = 'modern' | 'industrial' | 'neon';

interface PhaseCarouselProps {
  designVariation?: DesignVariation;
  imageDarkness?: number; // 0-100
  imageBlur?: number; // 0-20px
  columnHeight?: number; // 200-800px
  fadePosition?: number; // 0-100%
  customImages?: {
    phase1?: string;
    phase2?: string;
    phase3?: string;
    phase4?: string;
  };
}

export default function PhaseCarousel({
  designVariation = 'modern',
  imageDarkness = 50,
  imageBlur = 5,
  columnHeight = 288,
  fadePosition = 60,
  customImages = {}
}: PhaseCarouselProps) {
  // Load phase cards from Convex database
  const phasesData = useQuery(api.phaseCards.getAllPhaseCards);
  const phases = phasesData || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef<number>(0);
  const lastTouchXRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);
  const dragDirectionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? phases.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === phases.length - 1 ? 0 : prev + 1));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    lastTouchXRef.current = touch.clientX;
    lastTouchTimeRef.current = Date.now();
    velocityRef.current = 0;
    dragDirectionLockedRef.current = null;
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (dragDirectionLockedRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > 10 || absY > 10) {
        dragDirectionLockedRef.current = absX > absY ? 'horizontal' : 'vertical';
      }
    }

    if (dragDirectionLockedRef.current === 'vertical') {
      return;
    }

    if (dragDirectionLockedRef.current === 'horizontal') {
      e.preventDefault();
    }

    const now = Date.now();
    const timeDelta = now - lastTouchTimeRef.current;

    if (timeDelta > 0) {
      velocityRef.current = (touch.clientX - lastTouchXRef.current) / timeDelta;
    }

    lastTouchXRef.current = touch.clientX;
    lastTouchTimeRef.current = now;
    setDragOffset(deltaX);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const SWIPE_THRESHOLD = 50;
    const VELOCITY_THRESHOLD = 0.3;

    const shouldSwipe =
      Math.abs(dragOffset) > SWIPE_THRESHOLD ||
      Math.abs(velocityRef.current) > VELOCITY_THRESHOLD;

    if (shouldSwipe) {
      if (dragOffset > 0 || velocityRef.current > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    dragDirectionLockedRef.current = null;
  }, [isDragging, dragOffset, handlePrevious, handleNext]);

  const getVisiblePhases = () => {
    const prev = currentIndex === 0 ? phases.length - 1 : currentIndex - 1;
    const next = currentIndex === phases.length - 1 ? 0 : currentIndex + 1;
    return [prev, currentIndex, next];
  };

  const visibleIndices = getVisiblePhases();

  const renderCard = (phase: Phase, position: 'left' | 'center' | 'right', offset: number = 0) => {
    const isCenter = position === 'center';

    const baseTranslateX = position === 'left' ? -45 : position === 'right' ? 45 : 0;
    const dragInfluence = isDragging ? (offset / 10) : 0;
    const finalTranslateX = baseTranslateX + dragInfluence;

    const baseScale = isCenter ? 1 : 0.85;
    const dragScale = isDragging && isCenter ? Math.max(0.95, 1 - Math.abs(offset) / 1000) : baseScale;

    const baseOpacity = isCenter ? 1 : 0.4;
    const dragOpacity = isDragging && isCenter ? Math.max(0.7, 1 - Math.abs(offset) / 500) : baseOpacity;

    const positionStyles = {
      transform: `translateX(${finalTranslateX}%) scale(${dragScale})`,
      opacity: dragOpacity,
      zIndex: isCenter ? 10 : 0,
      transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s',
    };

    // Get custom image for this phase
    const getPhaseImage = () => {
      const phaseIndex = phases.findIndex(p => p._id === phase._id);
      const imageKey = `phase${phaseIndex + 1}` as keyof typeof customImages;
      return customImages[imageKey];
    };

    const phaseImage = getPhaseImage();

    // Variation-specific styles
    const getCardStyles = () => {
      switch (designVariation) {
        case 'modern':
          return {
            container: `relative rounded-3xl overflow-hidden
                       bg-black/40
                       ${isCenter ? 'backdrop-blur-[40px]' : ''}
                       border border-white/[0.15]
                       ${isCenter ? 'hover:border-white/[0.25] hover:bg-black/50' : ''}
                       transition-all duration-300 ease-out
                       shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_1px_rgba(255,255,255,0.1)_inset]
                       ${isCenter ? 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.15)_inset]' : ''}
                       group cursor-pointer
                       will-change-[transform,box-shadow]`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-gray-400/30 mb-4 group-hover:text-gray-300/45 group-hover:scale-105 transition-all duration-700',
            title: `text-2xl md:text-3xl ${phase.locked ? 'text-gray-400/50 group-hover:text-gray-300/60' : 'bg-gradient-to-br from-white via-white/95 to-white/75 bg-clip-text text-transparent group-hover:from-white group-hover:via-white group-hover:to-white/85 drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]'} font-semibold tracking-tight transition-all duration-700`,
            description: 'text-sm md:text-base text-gray-300/60 font-light tracking-wide leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[350ms]',
          };

        case 'industrial':
          return {
            container: `mek-card-industrial mek-border-sharp-gold
                       relative overflow-hidden
                       ${isCenter ? 'mek-glow-yellow' : ''}
                       transition-all duration-300
                       group cursor-pointer`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-yellow-500/20 mb-4 transition-all duration-500',
            title: `text-2xl md:text-3xl font-bold tracking-wider uppercase ${phase.locked ? 'text-gray-500' : 'text-yellow-400 mek-text-shadow'} transition-all duration-500`,
            description: 'text-sm md:text-base text-gray-400 tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[350ms]',
          };

        case 'neon':
          return {
            container: `neon-edge-card
                       relative border-2
                       ${isCenter ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.3)]' : 'border-cyan-400/20'}
                       transition-all duration-300
                       group cursor-pointer`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-cyan-400/30 mb-4 transition-all duration-500',
            title: `text-2xl md:text-3xl font-bold tracking-wider ${phase.locked ? 'text-gray-500' : 'text-cyan-400'} transition-all duration-500`,
            description: 'text-sm md:text-base text-cyan-300/60 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[350ms]',
          };
      }
    };

    const styles = getCardStyles();

    return (
      <div
        className="absolute inset-x-0 mx-auto w-[60%] max-w-md md:max-w-lg"
        style={{
          ...positionStyles,
          transformStyle: 'preserve-3d',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      >
        <div className={styles.container} style={{ height: `${columnHeight}px` }}>
          {/* Background Image with Effects */}
          {phaseImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${phaseImage})`,
                filter: `brightness(${1 - imageDarkness / 100}) blur(${!isCenter ? imageBlur : 0}px)`,
                transition: 'filter 0.3s ease-out',
              }}
            />
          )}

          {/* Gradient Fade Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, transparent ${fadePosition}%, black 100%)`,
            }}
          />
          {phase.locked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5">
              <Lock className={styles.lockIcon} />
              <h3 className={styles.title}>{phase.title}</h3>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-7 text-center">
              <div className="w-full space-y-4">
                <h3 className={styles.title}>{phase.title}</h3>
                {phase.description && (
                  <div className="relative mt-4">
                    {designVariation === 'modern' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent h-px top-0" />
                    )}
                    <p className={`${styles.description} pt-4 px-3`}>
                      {phase.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variation-specific effects */}
          {designVariation === 'modern' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
            </>
          )}

          {designVariation === 'industrial' && (
            <div className="mek-overlay-scratches" />
          )}

          {designVariation === 'neon' && isCenter && (
            <>
              <div className="neon-edge-gradient-cyan" />
              <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />
            </>
          )}
        </div>
      </div>
    );
  };

  // Show loading state while data is fetching
  if (!phasesData) {
    return (
      <div className="w-full py-8 md:py-12 relative select-none flex items-center justify-center" style={{ height: `${columnHeight}px` }}>
        <div className="text-gray-400">Loading phases...</div>
      </div>
    );
  }

  // Show empty state if no phases exist
  if (phases.length === 0) {
    return (
      <div className="w-full py-8 md:py-12 relative select-none flex items-center justify-center" style={{ height: `${columnHeight}px` }}>
        <div className="text-gray-400 text-center">
          <p>No phases configured yet.</p>
          <p className="text-sm mt-2">Visit /landing-debug to add phase cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 md:py-12 relative select-none" style={{ touchAction: 'pan-y' }}>
      {/* Carousel Container */}
      <div className="relative max-w-5xl mx-auto px-4" style={{ height: `${columnHeight}px` }}>
        {/* Background layer for blur effect - colorful gradient behind cards */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[80%] max-w-2xl rounded-3xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-xl opacity-40" style={{ height: `${columnHeight}px` }} />
        </div>

        {/* Left Arrow */}
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-200 hover:scale-110 touch-manipulation will-change-transform active:scale-95"
          style={{ touchAction: 'manipulation' }}
          aria-label="Previous phase"
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        {/* Carousel Track */}
        <div
          ref={trackRef}
          className="relative w-full cursor-grab active:cursor-grabbing"
          style={{
            height: `${columnHeight}px`,
            transform: 'translateZ(0)',
            willChange: 'transform',
            touchAction: 'pan-y',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {visibleIndices.map((phaseIndex, i) => {
            const position = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
            return (
              <div key={`${i}-${phaseIndex}`}>
                {renderCard(phases[phaseIndex], position, dragOffset)}
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-200 hover:scale-110 touch-manipulation will-change-transform active:scale-95"
          style={{ touchAction: 'manipulation' }}
          aria-label="Next phase"
        >
          <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      </div>

      {/* Phase Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {phases.map((phase, index) => (
          <button
            key={phase._id}
            onClick={() => setCurrentIndex(index)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
            style={{ touchAction: 'manipulation' }}
            aria-label={`Go to ${phase.title}`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 will-change-[width,background-color] ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              style={{
                transform: 'translateZ(0)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
