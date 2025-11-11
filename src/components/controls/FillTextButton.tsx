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
              filter: drop-shadow(0 0 2px rgba(255, 255, 255, 1))
                      drop-shadow(0 0 4px rgba(255, 255, 255, 1))
                      drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))
                      drop-shadow(0 0 4px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 6px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 12px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 24px rgba(61, 209, 255, 0.9))
                      drop-shadow(0 0 40px rgba(61, 209, 255, 0.7))
                      drop-shadow(0 0 56px rgba(61, 209, 255, 0.5));
            }
            50% {
              filter: drop-shadow(0 0 3px rgba(255, 255, 255, 1))
                      drop-shadow(0 0 6px rgba(255, 255, 255, 1))
                      drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))
                      drop-shadow(0 0 6px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 10px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 18px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 36px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 56px rgba(61, 209, 255, 0.9))
                      drop-shadow(0 0 72px rgba(61, 209, 255, 0.7));
            }
          }

          @keyframes soft-pulse {
            0%, 100% {
              text-shadow: 0 0 10px rgba(61, 209, 255, 0.7),
                          0 0 20px rgba(61, 209, 255, 0.6),
                          0 0 32px rgba(61, 209, 255, 0.5),
                          0 0 44px rgba(61, 209, 255, 0.4),
                          0 0 56px rgba(61, 209, 255, 0.3);
            }
            50% {
              text-shadow: 0 0 16px rgba(61, 209, 255, 0.9),
                          0 0 32px rgba(61, 209, 255, 0.7),
                          0 0 48px rgba(61, 209, 255, 0.6),
                          0 0 64px rgba(61, 209, 255, 0.5),
                          0 0 80px rgba(61, 209, 255, 0.4);
            }
          }
        `}
      </style>

      {/* Base text (always visible, solid white) */}
      <span
        className="inline-block whitespace-nowrap"
        style={{
          color: '#FFFFFF',
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
          animation: isHovered ? 'soft-pulse 3s ease-in-out infinite' : 'none',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>
    </button>
  );
}

export default FillTextButton;
