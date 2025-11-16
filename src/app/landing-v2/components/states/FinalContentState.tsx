import { useState, useEffect } from 'react';
import FillTextButton from '@/components/controls/FillTextButton';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';

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
}

export default function FinalContentState({ isActive, phaseCards }: FinalContentStateProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showBetaLightbox, setShowBetaLightbox] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
    }
  }, [isActive]);

  if (!isActive) return null;

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const displayPhases = phaseCards?.slice(0, 4) || [];

  return (
    <div
      className="flex-1 flex flex-col w-full transition-opacity duration-1000"
      style={{
        opacity: mounted ? 1 : 0,
        position: 'relative',
      }}
    >
      <div className="flex-1 flex flex-col items-center pb-8" style={{ marginTop: 'calc(50% + 25vh - 50px)' }}>
        <p className="text-white/80 text-sm tracking-wide" style={{ fontFamily: 'Saira, sans-serif' }}>
          An epic idle strategy game where Mekanism NFTs build empires.
        </p>

        <div className="mt-8" style={{ transform: 'scale(0.8)' }}>
          <FillTextButton
            text="join beta"
            fontFamily="Play"
            onClick={() => setShowBetaLightbox(true)}
          />
        </div>

        <div className="w-full max-w-[680px] mx-auto mb-[150px] flex flex-col gap-3" style={{ marginTop: '83px' }}>
          {displayPhases.map((card: PhaseCard, index: number) => {
            const isExpanded = expandedIndex === index;
            const isLocked = card.locked;
            const phaseLabel = `Phase ${['I', 'II', 'III', 'IV'][index]}`;

            return (
              <div key={card._id} className="w-full">
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
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLocked) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLocked) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
                    }
                  }}
                >
                  <div className="h-full flex items-center justify-center px-6 relative">
                    <h3
                      className="text-white uppercase tracking-wider font-medium"
                      style={{
                        fontFamily: 'Saira, sans-serif',
                        fontSize: '16px',
                      }}
                    >
                      {phaseLabel}
                    </h3>

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
                    <h4
                      className="text-yellow-400 uppercase tracking-wider font-medium mb-3"
                      style={{
                        fontFamily: 'Saira, sans-serif',
                        fontSize: '16px',
                      }}
                    >
                      {card.title}
                    </h4>

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
