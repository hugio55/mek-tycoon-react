import { useState, useEffect, useRef } from 'react';
import PhaseOneIndicator, { LoadingSpinner } from './PhaseOneIndicator';
import HolographicButton from '@/components/ui/IndustrialButtons/HolographicButton';
import NMKRPayLightbox from '@/components/NMKRPayLightbox';
import { restoreWalletSession } from '@/lib/walletSessionManager';

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const phaseLabel = `Phase ${PHASE_LABELS[index]}`;
  const styles = getPhaseStyles(index);
  const isPhaseTwo = index === 1;
  const isPhaseOne = index === 0;
  const isLocked = card.locked;

  // Restore wallet session on mount
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        const address = session.stakeAddress || session.walletAddress;
        setWalletAddress(address);
      }
    };
    initWallet();
  }, []);

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
            <div className="mt-6 flex justify-start">
              <div style={{ fontSize: '11px' }}> {/* Adjust font size here */}
                <HolographicButton
                  text="CLAIM NFT"
                  onClick={() => {
                    console.log('[PhaseCard] Opening NFT claim lightbox');
                    setShowClaimLightbox(true);
                  }}
                  variant="yellow"
                  alwaysOn={true}
                  hideIcon={true}
                  className="!px-3 !py-1.5 [&_span]:!text-[1em] [&_span]:!tracking-wide [&>div>div]:!shadow-none [&>div>div]:!rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NFT Claim Lightbox */}
      {showClaimLightbox && (
        <NMKRPayLightbox
          walletAddress={walletAddress}
          onClose={() => setShowClaimLightbox(false)}
        />
      )}
    </div>
  );
}
