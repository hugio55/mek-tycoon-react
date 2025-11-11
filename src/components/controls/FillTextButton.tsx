import React, { useState } from 'react';

interface FillTextButtonProps {
  text?: string;
}

const FillTextButton = ({ text = 'uiverse' }: FillTextButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="relative bg-transparent border-none cursor-pointer m-0 h-auto p-0"
      style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '2em',
        textTransform: 'uppercase',
        letterSpacing: '3px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>
        {`
          @keyframes line-glow {
            0%, 100% {
              filter: drop-shadow(0 0 8px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 16px rgba(61, 209, 255, 0.8));
            }
            50% {
              filter: drop-shadow(0 0 12px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 20px rgba(61, 209, 255, 1));
            }
          }

          @keyframes dark-flicker {
            0%, 100% {
              opacity: 1;
              filter: brightness(1);
            }
            10% {
              opacity: 0.85;
              filter: brightness(0.9);
            }
            15% {
              opacity: 1.1;
              filter: brightness(1.2);
            }
            23% {
              opacity: 0.9;
              filter: brightness(0.95);
            }
            28% {
              opacity: 1;
              filter: brightness(1.1);
            }
            35% {
              opacity: 0.8;
              filter: brightness(0.85);
            }
            42% {
              opacity: 1.05;
              filter: brightness(1.15);
            }
            50% {
              opacity: 0.95;
              filter: brightness(1);
            }
            58% {
              opacity: 1.1;
              filter: brightness(1.2);
            }
            65% {
              opacity: 0.88;
              filter: brightness(0.92);
            }
            73% {
              opacity: 1;
              filter: brightness(1.05);
            }
            80% {
              opacity: 0.92;
              filter: brightness(0.95);
            }
            88% {
              opacity: 1.08;
              filter: brightness(1.18);
            }
            95% {
              opacity: 0.96;
              filter: brightness(1.02);
            }
          }
        `}
      </style>

      {/* Base text (always visible, solid gray-white) */}
      <span
        className="inline-block whitespace-nowrap"
        style={{
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        &nbsp;{text}&nbsp;
      </span>

      {/* Single glowing line that transitions from left to right edge */}
      <span
        className="absolute top-0 bottom-0"
        style={{
          width: '3px',
          backgroundColor: '#3DD1FF',
          animation: 'line-glow 2s ease-in-out infinite',
          left: isHovered ? 'calc(100% - 3px)' : '0',
          transition: 'left 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      />

      {/* Hover overlay (sweeps from left to right with bright blue text) */}
      <span
        className="absolute top-0 left-0 whitespace-nowrap overflow-hidden"
        style={{
          color: '#3DD1FF',
          width: isHovered ? '100%' : '0%',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          textShadow: isHovered
            ? '0 0 8px rgba(61, 209, 255, 1), 0 0 16px rgba(61, 209, 255, 0.8), 0 0 24px rgba(61, 209, 255, 0.6), 0 0 32px rgba(61, 209, 255, 0.4)'
            : 'none',
          animation: isHovered ? 'dark-flicker 0.4s infinite' : 'none',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>
    </button>
  );
}

export default FillTextButton;
