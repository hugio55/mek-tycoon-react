import React, { useState, useEffect } from 'react';

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
  const [animationKey, setAnimationKey] = useState(0);

  // Force animation restart on hover by changing key
  useEffect(() => {
    if (isHovered) {
      console.log('[✨GLOW] Hover detected, restarting animation (key:', animationKey + 1, ')');
      setAnimationKey(prev => prev + 1);
    } else {
      console.log('[✨GLOW] Hover ended, stopping animation');
    }
  }, [isHovered]);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>
        {`
          @keyframes line-glow {
            0%, 100% {
              opacity: 0.8;
              box-shadow: 0 0 2px rgba(61, 209, 255, 0.6);
            }
            50% {
              opacity: 1;
              box-shadow: 0 0 4px rgba(61, 209, 255, 0.8);
            }
          }

          @keyframes soft-pulse {
            0%, 100% {
              text-shadow: 0 0 4px rgba(61, 209, 255, 0.7),
                          0 0 8px rgba(61, 209, 255, 0.5);
            }
            50% {
              text-shadow: 0 0 8px rgba(61, 209, 255, 0.9),
                          0 0 16px rgba(61, 209, 255, 0.6);
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
          left: isHovered ? 'calc(100% - 3px)' : '0',
          width: '3px',
          transition: 'left 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          animation: isHovered ? 'line-glow 2s ease-in-out infinite' : 'none',
          willChange: isHovered ? 'left, opacity, box-shadow' : 'auto',
          transform: 'translateZ(0)',
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

      {/* Blue text overlay with glow (clipped to reveal progressively) */}
      {/* Wrapper div clips the content INCLUDING text-shadow/glow effects */}
      <div
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: isHovered ? 'calc(100% - 3px)' : '0%',
          height: '100%',
          transition: 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          willChange: isHovered ? 'width' : 'auto',
          transform: 'translateZ(0)',
        }}
      >
        <span
          key={`glow-${animationKey}`}
          className="inline-block whitespace-nowrap"
          style={{
            color: '#3DD1FF',
            WebkitTextStroke: '0.5px #3DD1FF',
            animation: 'soft-pulse 3s ease-in-out infinite',
            padding: '0 20px',
            margin: '0 -20px',
            willChange: 'text-shadow',
            transform: 'translateZ(0)',
          }}
          aria-hidden="true"
        >
          &nbsp;{text}&nbsp;
        </span>
      </div>
    </button>
  );
}

export default FillTextButton;
