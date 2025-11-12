import React, { useState } from 'react';

interface FillTextButtonProps {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  horizontalOffset?: number;
  verticalOffset?: number;
}

const FillTextButton = ({
  text = 'uiverse',
  fontFamily = 'Orbitron',
  fontSize = 32,
  color = 'text-white',
  horizontalOffset = 0,
  verticalOffset = 0
}: FillTextButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  return (
    <button
      className="relative bg-transparent border-none cursor-pointer m-0 h-auto p-0"
      style={{
        fontFamily: `${fontFamily}, sans-serif`,
        fontSize: `${fontSize}px`,
        textTransform: 'uppercase',
        letterSpacing: '3px',
        transform: `translate(${horizontalOffset}px, ${verticalOffset}px)`,
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsGlowing(true);
        setIsFadingOut(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <style>
        {`
          @keyframes line-glow {
            0%, 100% {
              filter: drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.5))
                      drop-shadow(0 0 2.25px rgba(255, 255, 255, 0.5))
                      drop-shadow(0 0 3.75px rgba(255, 255, 255, 0.45))
                      drop-shadow(0 0 2.25px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 3.75px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 6.75px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 6.75px rgba(61, 209, 255, 0.45))
                      drop-shadow(0 0 11.25px rgba(61, 209, 255, 0.35))
                      drop-shadow(0 0 15.75px rgba(61, 209, 255, 0.25));
            }
            50% {
              filter: drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.5))
                      drop-shadow(0 0 3.75px rgba(255, 255, 255, 0.5))
                      drop-shadow(0 0 6px rgba(255, 255, 255, 0.45))
                      drop-shadow(0 0 3.75px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 6px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 10.5px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 10.5px rgba(61, 209, 255, 0.5))
                      drop-shadow(0 0 15.75px rgba(61, 209, 255, 0.45))
                      drop-shadow(0 0 20.25px rgba(61, 209, 255, 0.35));
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

      {/* Wrapper for glowing line - allows glow to extend beyond bounds */}
      <span
        className="absolute top-0 bottom-0"
        style={{
          width: '3px',
          left: isHovered ? 'calc(100% - 3px)' : '0',
          transition: 'left 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          animation: isGlowing && !isFadingOut ? 'line-glow 2s ease-in-out infinite' : 'none',
          opacity: isFadingOut ? 0 : 1,
          filter: isFadingOut ? 'none' : undefined,
          transitionProperty: isFadingOut ? 'left, opacity, filter' : 'left',
          transitionDuration: isFadingOut ? '500ms, 800ms, 800ms' : '500ms',
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'left' && !isHovered && isGlowing) {
            setIsFadingOut(true);
            setTimeout(() => {
              setIsGlowing(false);
              setIsFadingOut(false);
            }, 800);
          }
        }}
      >
        {/* Inner line element */}
        <span
          className="absolute inset-0"
          style={{
            backgroundColor: '#3DD1FF',
          }}
        />
      </span>

      {/* Glow layer (visible only on hover, extends beyond boundaries for full glow effect) */}
      <span
        className="absolute top-0 left-0 whitespace-nowrap overflow-hidden"
        style={{
          color: 'transparent',
          width: isHovered ? '100%' : '0%',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          animation: isHovered ? 'soft-pulse 3s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
          WebkitTextStroke: '0.5px #3DD1FF',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>

      {/* Blue text overlay (clipped to show only where line has passed) */}
      <span
        className="absolute top-0 left-0 whitespace-nowrap overflow-hidden"
        style={{
          color: '#3DD1FF',
          width: isHovered ? 'calc(100% - 3px)' : '0%',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          textShadow: 'none',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>
    </button>
  );
}

export default FillTextButton;
