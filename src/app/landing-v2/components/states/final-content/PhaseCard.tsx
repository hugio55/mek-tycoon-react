import { useState, useEffect } from 'react';
import PhaseOneIndicator, { LoadingSpinner } from './PhaseOneIndicator';

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

        /* TEMPORARY: Animated border tracer for Phase II */
        @keyframes traceBorder {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isPhaseTwo]);

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
      className="w-full transition-all duration-500 ease-out"
      style={{
        opacity: shouldShow ? 1 : 0,
        transform: `translateY(${shouldShow ? 0 : 20}px)`,
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
          backdropFilter: 'blur(10px)',
          transition: 'all 200ms ease',
          border: styles.border,
          boxShadow: styles.boxShadow,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* TEMPORARY: Animated border tracer for Phase II */}
        {isPhaseTwo && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{
              borderRadius: '8px',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
            }}
          >
            <defs>
              <linearGradient id="tracerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="40%" stopColor="rgba(255, 255, 255, 0.1)" />
                <stop offset="60%" stopColor="rgba(255, 255, 255, 0.3)" />
                <stop offset="75%" stopColor="rgba(255, 255, 255, 0.6)" />
                <stop offset="85%" stopColor="rgba(255, 255, 255, 0.85)" />
                <stop offset="92%" stopColor="rgba(255, 255, 255, 0.95)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
              </linearGradient>
              <radialGradient id="flareGradient">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.8)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </radialGradient>
            </defs>
            <rect
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="7"
              ry="7"
              fill="none"
              stroke="url(#tracerGradient)"
              strokeWidth="2.5"
              strokeDasharray="80 320"
              strokeLinecap="round"
              style={{
                animation: 'traceBorder 2s linear infinite',
              }}
            />
          </svg>
        )}

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

            {isPhaseOne && <Checkmark />}
            {isPhaseTwo && <LoadingSpinner />}
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
}
