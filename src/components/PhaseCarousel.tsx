'use client';

import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Phase {
  id: number;
  title: string;
  description?: string;
  locked: boolean;
}

const phases: Phase[] = [
  {
    id: 1,
    title: 'Phase I',
    description: 'Gold Generation and Corporation Creation',
    locked: false,
  },
  {
    id: 2,
    title: 'Phase II',
    description: 'Under Construction',
    locked: false,
  },
  {
    id: 3,
    title: 'Phase III',
    locked: true,
  },
  {
    id: 4,
    title: 'Phase IV',
    locked: true,
  },
  {
    id: 5,
    title: 'Phase V',
    locked: true,
  },
];

type DesignVariation = 'modern' | 'industrial' | 'neon';

interface PhaseCarouselProps {
  designVariation?: DesignVariation;
}

export default function PhaseCarousel({ designVariation = 'modern' }: PhaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? phases.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === phases.length - 1 ? 0 : prev + 1));
  };

  const getVisiblePhases = () => {
    const prev = currentIndex === 0 ? phases.length - 1 : currentIndex - 1;
    const next = currentIndex === phases.length - 1 ? 0 : currentIndex + 1;
    return [prev, currentIndex, next];
  };

  const visibleIndices = getVisiblePhases();

  const renderCard = (phase: Phase, position: 'left' | 'center' | 'right') => {
    const isCenter = position === 'center';

    // Base positioning and scaling - all cards centered by default, then transformed
    const positionClasses = {
      left: '-translate-x-[45%] scale-[0.85] opacity-40 z-0',
      center: 'translate-x-0 scale-100 opacity-100 z-10',
      right: 'translate-x-[45%] scale-[0.85] opacity-40 z-0',
    };

    // Variation-specific styles
    const getCardStyles = () => {
      switch (designVariation) {
        case 'modern':
          return {
            container: `relative h-64 md:h-72 rounded-3xl overflow-hidden
                       bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.07]
                       backdrop-blur-2xl backdrop-saturate-150
                       border border-white/[0.08]
                       ${isCenter ? 'hover:border-white/[0.15] hover:bg-gradient-to-br hover:from-white/[0.1] hover:via-white/[0.05] hover:to-white/[0.1]' : ''}
                       transition-all duration-700 ease-out
                       shadow-[0_8px_32px_rgba(0,0,0,0.15),0_0_1px_rgba(255,255,255,0.05)_inset]
                       ${isCenter ? 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.25),0_0_1px_rgba(255,255,255,0.1)_inset]' : ''}
                       group cursor-pointer`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-gray-400/30 mb-4 group-hover:text-gray-300/45 group-hover:scale-105 transition-all duration-700',
            title: `text-2xl md:text-3xl ${phase.locked ? 'text-gray-400/50 group-hover:text-gray-300/60' : 'bg-gradient-to-br from-white via-white/95 to-white/75 bg-clip-text text-transparent group-hover:from-white group-hover:via-white group-hover:to-white/85 drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]'} font-semibold tracking-tight transition-all duration-700`,
            description: 'text-sm md:text-base text-gray-300/60 font-light tracking-wide leading-relaxed group-hover:text-gray-200/70 transition-colors duration-700',
          };

        case 'industrial':
          return {
            container: `mek-card-industrial mek-border-sharp-gold
                       relative h-64 md:h-72 overflow-hidden
                       ${isCenter ? 'mek-glow-yellow' : ''}
                       transition-all duration-500
                       group cursor-pointer`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-yellow-500/20 mb-4 transition-all duration-500',
            title: `text-2xl md:text-3xl font-bold tracking-wider uppercase ${phase.locked ? 'text-gray-500' : 'text-yellow-400 mek-text-shadow'} transition-all duration-500`,
            description: 'text-sm md:text-base text-gray-400 tracking-wide uppercase transition-all duration-500',
          };

        case 'neon':
          return {
            container: `neon-edge-card
                       relative h-64 md:h-72 border-2
                       ${isCenter ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.3)]' : 'border-cyan-400/20'}
                       transition-all duration-500
                       group cursor-pointer`,
            lockIcon: 'w-16 h-16 md:w-20 md:h-20 text-cyan-400/30 mb-4 transition-all duration-500',
            title: `text-2xl md:text-3xl font-bold tracking-wider ${phase.locked ? 'text-gray-500' : 'text-cyan-400'} transition-all duration-500`,
            description: 'text-sm md:text-base text-cyan-300/60 tracking-wide transition-all duration-500',
          };
      }
    };

    const styles = getCardStyles();

    return (
      <div
        className={`absolute w-full max-w-md md:max-w-lg transition-all duration-700 ease-out ${positionClasses[position]}`}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          left: '50%',
          marginLeft: '-50%',
        }}
      >
        <div className={styles.container}>
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

  return (
    <div className="w-full py-8 md:py-12 relative" style={{ touchAction: 'pan-y' }}>
      {/* Carousel Container */}
      <div className="relative max-w-5xl mx-auto px-4">
        {/* Left Arrow */}
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-300 hover:scale-110 touch-manipulation"
          style={{ touchAction: 'manipulation' }}
          aria-label="Previous phase"
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        {/* Carousel Track */}
        <div className="relative w-full h-64 md:h-72 overflow-visible">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-2xl md:max-w-4xl">
              {visibleIndices.map((phaseIndex, i) => {
                const position = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
                return (
                  <div key={`${phaseIndex}-${position}`}>
                    {renderCard(phases[phaseIndex], position)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-300 hover:scale-110 touch-manipulation"
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
            key={phase.id}
            onClick={() => setCurrentIndex(index)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${
              index === currentIndex
                ? ''
                : ''
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label={`Go to ${phase.title}`}
          >
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/30'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}
