import { useState, useEffect, useRef } from 'react';
import PhaseOneIndicator, { LoadingSpinner } from './PhaseOneIndicator';
import NMKRPayLightbox from '@/components/NMKRPayLightbox';

interface PhaseCardData {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

interface PhaseCardProps {
  card: PhaseCardData;
  index: number;
  isExpanded: boolean;
  shouldShow: boolean;
  onToggle: () => void;
}

const PHASE_LABELS = ['I', 'II', 'III', 'IV'];

function Checkmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="white"
      />
    </svg>
  );
}

function getPhaseStyles(index: number) {
  const styles = {
    background: '',
    hoverBackground: '',
    border: 'none',
    boxShadow: 'none',
  };

  if (index === 0) {
    styles.background = 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
    styles.hoverBackground = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
  } else if (index === 1) {
    styles.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
    styles.hoverBackground = 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))';
    styles.border = '1px solid rgba(255, 255, 255, 0.3)';
    styles.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
  } else {
    styles.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))';
    styles.hoverBackground = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))';
  }

  return styles;
}

export default function PhaseCard({ card, index, isExpanded, shouldShow, onToggle }: PhaseCardProps) {
  const [currentBackground, setCurrentBackground] = useState('');
  const [showClaimLightbox, setShowClaimLightbox] = useState(false);
  const [buttonVariation, setButtonVariation] = useState<'clean' | 'sleek' | 'industrial' | 'professional' | 'minimal-white' | 'ghost' | 'subtle'>('clean');
  const [showButtonPicker, setShowButtonPicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const phaseLabel = `Phase ${PHASE_LABELS[index]}`;
  const styles = getPhaseStyles(index);
  const isPhaseTwo = index === 1;
  const isPhaseOne = index === 0;
  const isLocked = card.locked;

  useEffect(() => {
    if (isPhaseTwo) {
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
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isPhaseTwo]);

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => {
        if (!cardRef.current) return;
        const cardRect = cardRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const cardBottom = cardRect.bottom;

        if (cardBottom > windowHeight) {
          const scrollAmount = cardBottom - windowHeight + 100;
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      }, 450);
    }
  }, [isExpanded]);

  const handleMouseEnter = () => {
    if (!isLocked) {
      setCurrentBackground(styles.hoverBackground);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setCurrentBackground(styles.background);
    }
  };

  return (
    <div
      ref={cardRef}
      className="w-full transition-all duration-[900ms] ease-out"
      style={{
        opacity: shouldShow ? 1 : 0,
        transform: `translateY(${shouldShow ? 0 : 20}px)`,
        backdropFilter: shouldShow ? 'blur(10px)' : 'blur(0px)',
      }}
    >
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={`
          w-full text-left relative overflow-hidden
          ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}
        `}
        style={{
          height: '44px',
          borderRadius: '8px',
          background: currentBackground || styles.background,
          transition: 'all 200ms ease',
          border: styles.border,
          boxShadow: styles.boxShadow,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isPhaseTwo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'slideParticles 3s linear infinite',
              opacity: 1.0,
            }}
          />
        )}

        <div className="h-full flex items-center justify-center px-6 relative">
          <div className="flex items-center gap-2">
            {isPhaseOne && <Checkmark />}
            {isPhaseTwo && <LoadingSpinner />}

            <h3
              className="uppercase tracking-wider font-medium"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontSize: '16px',
                color: (isPhaseOne || isPhaseTwo) ? 'white' : 'rgba(255, 255, 255, 0.35)',
              }}
            >
              {phaseLabel}
            </h3>
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
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <div
          className="mt-2 px-6 py-4"
          style={{
            background: 'rgba(0, 0, 0, 0.384)',
            borderRadius: '8px',
            backdropFilter: 'blur(16px)',
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 300ms ease-out',
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

            {isPhaseOne && (
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
          </div>

          {card.description && (
            <>
              {isPhaseOne ? (
                // For Phase I, split description and italicize last sentence
                (() => {
                  const lines = card.description.split('\n');
                  const lastLineIndex = lines.length - 1;

                  return (
                    <div
                      className="text-white/75 leading-relaxed"
                      style={{
                        fontFamily: 'Play, sans-serif',
                        fontSize: '13px',
                      }}
                    >
                      {lines.map((line, index) => (
                        <div
                          key={index}
                          style={{
                            fontStyle: index === lastLineIndex ? 'italic' : 'normal',
                          }}
                        >
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
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
            </>
          )}

          {/* Claim NFT Button for Phase I */}
          {isPhaseOne && (
            <>
              {/* Debug Button Selector */}
              <div className="fixed top-4 left-4 z-[9998]">
                <button
                  onClick={() => setShowButtonPicker(!showButtonPicker)}
                  className="bg-black/80 border border-gray-600 text-gray-300 px-3 py-2 rounded text-xs hover:bg-black/90 transition-colors"
                >
                  Button Style ▼
                </button>
                {showButtonPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-black/95 border border-gray-600 rounded shadow-xl min-w-[180px]">
                    <button
                      onClick={() => setButtonVariation('clean')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-yellow-500/20 transition-colors ${
                        buttonVariation === 'clean' ? 'bg-yellow-500/30 text-yellow-300' : 'text-gray-300'
                      }`}
                    >
                      Clean (Minimal)
                    </button>
                    <button
                      onClick={() => setButtonVariation('sleek')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/20 transition-colors ${
                        buttonVariation === 'sleek' ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-300'
                      }`}
                    >
                      Sleek (Subtle)
                    </button>
                    <button
                      onClick={() => setButtonVariation('industrial')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-orange-500/20 transition-colors ${
                        buttonVariation === 'industrial' ? 'bg-orange-500/30 text-orange-300' : 'text-gray-300'
                      }`}
                    >
                      Industrial
                    </button>
                    <button
                      onClick={() => setButtonVariation('professional')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-purple-500/20 transition-colors ${
                        buttonVariation === 'professional' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-300'
                      }`}
                    >
                      Professional
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button
                      onClick={() => setButtonVariation('minimal-white')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${
                        buttonVariation === 'minimal-white' ? 'bg-white/20 text-white' : 'text-gray-300'
                      }`}
                    >
                      Minimal White
                    </button>
                    <button
                      onClick={() => setButtonVariation('ghost')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${
                        buttonVariation === 'ghost' ? 'bg-white/20 text-white' : 'text-gray-300'
                      }`}
                    >
                      Ghost
                    </button>
                    <button
                      onClick={() => setButtonVariation('subtle')}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${
                        buttonVariation === 'subtle' ? 'bg-white/20 text-white' : 'text-gray-300'
                      }`}
                    >
                      Subtle Modern
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-start">
                {/* Variation 1: Clean (Minimal, no animation) */}
                {buttonVariation === 'clean' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-6 py-3 rounded-md font-semibold transition-all duration-200 hover:scale-105"
                    style={{
                      fontFamily: "'Saira', sans-serif",
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#1a1a1a',
                      boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
                      border: '2px solid #fbbf24',
                      letterSpacing: '0.1em',
                      fontSize: '15px'
                    }}
                  >
                    CLAIM NFT
                  </button>
                )}

                {/* Variation 2: Sleek (Subtle glow) */}
                {buttonVariation === 'sleek' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:brightness-110"
                    style={{
                      fontFamily: "'Saira', sans-serif",
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                      color: '#000',
                      boxShadow: '0 0 30px rgba(251, 191, 36, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      letterSpacing: '0.15em',
                      fontSize: '15px'
                    }}
                  >
                    CLAIM NFT
                  </button>
                )}

                {/* Variation 3: Industrial (Sharp edges, hazard theme) */}
                {buttonVariation === 'industrial' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="relative px-6 py-3 font-bold transition-all duration-200 hover:translate-y-[-2px]"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      background: 'linear-gradient(135deg, #fab617 0%, #d97706 100%)',
                      color: '#000',
                      boxShadow: '0 4px 20px rgba(250, 182, 23, 0.6), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
                      border: '2px solid #fab617',
                      letterSpacing: '0.2em',
                      fontSize: '14px',
                      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                    }}
                  >
                    CLAIM NFT
                  </button>
                )}

                {/* Variation 4: Professional (Mature, sophisticated) */}
                {buttonVariation === 'professional' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-8 py-3 rounded font-medium transition-all duration-300 hover:brightness-105"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      background: 'linear-gradient(to right, #d4af37 0%, #ffd700 50%, #d4af37 100%)',
                      backgroundSize: '200% 100%',
                      color: '#1a1a1a',
                      boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)',
                      border: '1px solid rgba(255, 215, 0, 0.5)',
                      letterSpacing: '0.08em',
                      fontSize: '15px',
                      fontWeight: 600
                    }}
                  >
                    Claim NFT
                  </button>
                )}

                {/* Variation 5: Minimal White (Thin stroke, modern) */}
                {buttonVariation === 'minimal-white' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-6 py-2.5 rounded-md font-medium transition-all duration-200 hover:bg-white/5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      background: 'transparent',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      letterSpacing: '0.05em',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Claim NFT
                  </button>
                )}

                {/* Variation 6: Ghost (Ultra minimal, barely there) */}
                {buttonVariation === 'ghost' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-5 py-2 rounded font-normal transition-all duration-200 hover:bg-white/10 hover:border-white/40"
                    style={{
                      fontFamily: "'Saira', sans-serif",
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      letterSpacing: '0.08em',
                      fontSize: '13px',
                      fontWeight: 400
                    }}
                  >
                    CLAIM NFT
                  </button>
                )}

                {/* Variation 7: Subtle Modern (Clean lines, understated) */}
                {buttonVariation === 'subtle' && (
                  <button
                    onClick={() => {
                      console.log('[PhaseCard] Opening NFT claim lightbox');
                      setShowClaimLightbox(true);
                    }}
                    className="px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    style={{
                      fontFamily: "'Play', sans-serif",
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                      color: '#e0e0e0',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      letterSpacing: '0.06em',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Claim NFT
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* NFT Claim Lightbox */}
      {showClaimLightbox && (
        <NMKRPayLightbox
          walletAddress={null}
          onClose={() => setShowClaimLightbox(false)}
        />
      )}
    </div>
  );
}
