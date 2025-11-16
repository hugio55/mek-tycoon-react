import { useState, useEffect } from 'react';
import FillTextButton from '@/components/controls/FillTextButton';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import { TIMINGS } from '../../hooks/useLandingStateMachine';

interface PhaseCard {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

interface FinalContentStateProps {
  isActive: boolean;
  phaseCards: PhaseCard[] | undefined;
  startDelay?: number; // Delay before starting animations (ms)
}

export default function FinalContentState({ isActive, phaseCards, startDelay = 0 }: FinalContentStateProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showPhases, setShowPhases] = useState<number>(0); // Number of phases to show
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showBetaLightbox, setShowBetaLightbox] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // TEMPORARY PHASE I INDICATOR - START
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideParticles {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      @keyframes dotPulse {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // TEMPORARY PHASE I INDICATOR - END

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    if (isActive) {
      // Staggered reveal sequence
      const descTimer = setTimeout(() => setShowDescription(true), startDelay);
      const buttonTimer = setTimeout(() => setShowButton(true), startDelay + TIMINGS.descriptionFade + TIMINGS.buttonDelay);
      const phasesStartTimer = setTimeout(() => {
        // Show phases one by one
        setShowPhases(1);
        const phase2Timer = setTimeout(() => setShowPhases(2), TIMINGS.phaseStagger);
        const phase3Timer = setTimeout(() => setShowPhases(3), TIMINGS.phaseStagger * 2);
        const phase4Timer = setTimeout(() => setShowPhases(4), TIMINGS.phaseStagger * 3);
        return () => {
          clearTimeout(phase2Timer);
          clearTimeout(phase3Timer);
          clearTimeout(phase4Timer);
        };
      }, startDelay + TIMINGS.descriptionFade + TIMINGS.buttonDelay + TIMINGS.buttonFade + TIMINGS.phaseDelay);

      return () => {
        clearTimeout(descTimer);
        clearTimeout(buttonTimer);
        clearTimeout(phasesStartTimer);
      };
    }
  }, [isActive, startDelay]);

  if (!isActive) return null;

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const displayPhases = phaseCards?.slice(0, 4) || [];

  return (
    <div
      className="flex flex-col w-full"
      style={{
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <div className="flex flex-col items-center" style={{ marginTop: isMobile ? 'calc(50vh - 50px)' : 'calc(50vh - 100px)', paddingBottom: '0', pointerEvents: 'auto' }}>
        {/* Description with fade + slide up */}
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: showDescription ? 1 : 0,
            transform: `translateY(${showDescription ? 0 : 20}px)`,
          }}
        >
          <p className="text-white/80 tracking-wide" style={{ fontFamily: 'Saira, sans-serif', fontSize: isMobile ? '11.9px' : '14px' }}>
            An epic idle strategy game where Mekanism NFTs build empires.
          </p>
        </div>

        {/* Join Beta button with fade + slide up */}
        <div
          className="mt-8 transition-all duration-500 ease-out"
          style={{
            transform: `scale(0.8) translateY(${showButton ? 0 : 20}px)`,
            opacity: showButton ? 1 : 0,
          }}
        >
          <FillTextButton
            text="join beta"
            fontFamily="Play"
            onClick={() => setShowBetaLightbox(true)}
          />
        </div>

        <div className="w-full max-w-[680px] mx-auto mb-8 flex flex-col gap-3" style={{ marginTop: '83px' }}>
          {displayPhases.map((card: PhaseCard, index: number) => {
            const isExpanded = expandedIndex === index;
            const isLocked = card.locked;
            const phaseLabel = `Phase ${['I', 'II', 'III', 'IV'][index]}`;
            const shouldShow = index < showPhases;

            return (
              <div
                key={card._id}
                className="w-full transition-all duration-500 ease-out"
                style={{
                  opacity: shouldShow ? 1 : 0,
                  transform: `translateY(${shouldShow ? 0 : 20}px)`,
                }}
              >
                <button
                  onClick={() => handleToggle(index, isLocked)}
                  disabled={isLocked}
                  className={`
                    w-full text-left relative overflow-hidden
                    ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}
                  `}
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    background: index === 0
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))'
                      : index === 1
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 200ms ease',
                    border: index === 1 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                    boxShadow: index === 1 ? '0 0 20px rgba(255, 255, 255, 0.1)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLocked) {
                      if (index === 0) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
                      } else if (index === 1) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))';
                      } else {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLocked) {
                      if (index === 0) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
                      } else if (index === 1) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
                      } else {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
                      }
                    }
                  }}
                >
                  {/* TEMPORARY PHASE I INDICATOR - START */}
                  {index === 1 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        animation: 'slideParticles 3s linear infinite',
                        opacity: 0.6,
                      }}
                    />
                  )}
                  {/* TEMPORARY PHASE I INDICATOR - END */}

                  <div className="h-full flex items-center justify-center px-6 relative">
                    <div className="flex items-center gap-2">
                      {/* TEMPORARY PHASE I INDICATOR - LOADING SPINNER */}
                      {index === 1 && (
                        <div>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            {/* 8 dots arranged in a circle - stationary, brightness travels */}
                            <circle cx="12" cy="4" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '0ms' }} />
                            <circle cx="16.95" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '125ms' }} />
                            <circle cx="20" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '250ms' }} />
                            <circle cx="16.95" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '375ms' }} />
                            <circle cx="12" cy="20" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '500ms' }} />
                            <circle cx="7.05" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '625ms' }} />
                            <circle cx="4" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '750ms' }} />
                            <circle cx="7.05" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '875ms' }} />
                          </svg>
                        </div>
                      )}

                      <h3
                        className="uppercase tracking-wider font-medium"
                        style={{
                          fontFamily: 'Saira, sans-serif',
                          fontSize: '16px',
                          color: (index === 0 || index === 1) ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        {phaseLabel}
                      </h3>

                      {/* TEMPORARY PHASE I INDICATOR - LOADING SPINNER */}
                      {index === 1 && (
                        <div>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            {/* 8 dots arranged in a circle - stationary, brightness travels */}
                            <circle cx="12" cy="4" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '0ms' }} />
                            <circle cx="16.95" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '125ms' }} />
                            <circle cx="20" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '250ms' }} />
                            <circle cx="16.95" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '375ms' }} />
                            <circle cx="12" cy="20" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '500ms' }} />
                            <circle cx="7.05" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '625ms' }} />
                            <circle cx="4" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '750ms' }} />
                            <circle cx="7.05" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '875ms' }} />
                          </svg>
                        </div>
                      )}
                    </div>

                    {isLocked && (
                      <div
                        className="absolute right-6"
                        style={{
                          transition: 'transform 200ms ease',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 2C7.79 2 6 3.79 6 6V8H5C3.9 8 3 8.9 3 10V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V10C17 8.9 16.1 8 15 8H14V6C14 3.79 12.21 2 10 2ZM10 4C11.13 4 12 4.87 12 6V8H8V6C8 4.87 8.87 4 10 4ZM10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12Z"
                            fill="rgba(250, 182, 23, 0.5)"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                <div
                  style={{
                    maxHeight: isExpanded ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 400ms ease',
                  }}
                >
                  <div
                    className="mt-2 px-6 py-4"
                    style={{
                      background: 'rgba(0, 0, 0, 0.384)',
                      borderRadius: '8px',
                      backdropFilter: isExpanded ? 'blur(16px)' : 'blur(0px)',
                      opacity: isExpanded ? 1 : 0,
                      transition: 'backdrop-filter 400ms ease, opacity 400ms ease',
                    }}
                  >
                    <div>
                      <h4
                        className="text-yellow-400 uppercase tracking-wider font-medium"
                        style={{
                          fontFamily: 'Saira, sans-serif',
                          fontSize: '16px',
                        }}
                      >
                        {card.title}
                      </h4>

                      {/* TEMPORARY PHASE I COMPLETE BADGE - START */}
                      {index === 0 && (
                        <div
                          className="uppercase font-bold mt-1 mb-3"
                          style={{
                            fontFamily: 'Play, sans-serif',
                            fontSize: '12px',
                            color: '#00d4ff',
                            textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                            letterSpacing: '2px',
                          }}
                        >
                          COMPLETE
                        </div>
                      )}
                      {/* TEMPORARY PHASE I COMPLETE BADGE - END */}
                    </div>

                    {card.description && (
                      <p
                        className="text-white/75 leading-relaxed"
                        style={{
                          fontFamily: 'Play, sans-serif',
                          fontSize: '13px',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {card.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BetaSignupLightbox
        isVisible={showBetaLightbox}
        onClose={() => setShowBetaLightbox(false)}
      />
    </div>
  );
}
