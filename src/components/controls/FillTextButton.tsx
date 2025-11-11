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
          @keyframes border-glow {
            0%, 100% {
              box-shadow: 0 0 8px 2px rgba(61, 209, 255, 0.8),
                          0 0 15px 3px rgba(61, 209, 255, 0.5);
            }
            50% {
              box-shadow: 0 0 15px 3px rgba(61, 209, 255, 1),
                          0 0 25px 5px rgba(61, 209, 255, 0.7);
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

      {/* Hover overlay (sweeps from left to right with bright blue glow) */}
      <span
        className="absolute top-0 left-0 whitespace-nowrap overflow-hidden"
        style={{
          color: '#3DD1FF',
          width: isHovered ? '100%' : '0%',
          borderRight: '3px solid #3DD1FF',
          filter: isHovered ? 'drop-shadow(0 0 35px #3DD1FF) drop-shadow(0 0 20px #3DD1FF) brightness(1.3)' : 'none',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1), filter 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          animation: 'border-glow 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>
    </button>
  );
}

export default FillTextButton;
