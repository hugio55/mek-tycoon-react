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
              filter: drop-shadow(0 0 4px rgba(61, 209, 255, 0.8))
                      drop-shadow(0 0 8px rgba(61, 209, 255, 0.5));
            }
            50% {
              filter: drop-shadow(0 0 8px rgba(61, 209, 255, 1))
                      drop-shadow(0 0 12px rgba(61, 209, 255, 0.7));
            }
          }

          @keyframes scan-blur {
            0% {
              filter: blur(0px) drop-shadow(0 0 4px rgba(61, 209, 255, 0.8));
            }
            50% {
              filter: blur(3px) drop-shadow(0 0 12px rgba(61, 209, 255, 1));
            }
            100% {
              filter: blur(0px) drop-shadow(0 0 4px rgba(61, 209, 255, 0.8));
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

      {/* Constant glowing line at left */}
      <span
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: '3px',
          backgroundColor: '#3DD1FF',
          animation: 'line-glow 2s ease-in-out infinite',
          opacity: isHovered ? 0 : 1,
          transition: 'opacity 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      />

      {/* Hover overlay (sweeps from left to right with bright blue) */}
      <span
        className="absolute top-0 left-0 whitespace-nowrap overflow-hidden"
        style={{
          color: '#3DD1FF',
          width: isHovered ? '100%' : '0%',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
        <span
          className="absolute top-0 bottom-0 right-0"
          style={{
            width: '3px',
            backgroundColor: '#3DD1FF',
            animation: 'line-glow 2s ease-in-out infinite',
          }}
        />
      </span>
    </button>
  );
}

export default FillTextButton;
