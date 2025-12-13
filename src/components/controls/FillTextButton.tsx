import React, { useState, useEffect, useRef, useCallback } from 'react';

interface FillTextButtonProps {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  horizontalOffset?: number;
  verticalOffset?: number;
  onClick?: () => void;
}

const FillTextButton = ({
  text = 'uiverse',
  fontFamily = 'Orbitron',
  fontSize = 32,
  color = 'text-white',
  horizontalOffset = 0,
  verticalOffset = 0,
  onClick
}: FillTextButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const clickHandledRef = useRef(false);

  // Force animation restart on hover by changing key
  useEffect(() => {
    if (isHovered) {
      setAnimationKey(prev => prev + 1);
    }
  }, [isHovered]);

  // Stable click handler that works on both touch and mouse
  const handleClick = useCallback(() => {
    // Prevent double-firing from touch + click events
    if (clickHandledRef.current) return;
    clickHandledRef.current = true;

    // Reset after a short delay to allow future clicks
    setTimeout(() => {
      clickHandledRef.current = false;
    }, 300);

    onClick?.();
  }, [onClick]);

  // Handle touch events for mobile - ensures click fires reliably
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Trigger click on touch end for mobile reliability
    // This ensures the click happens even if mouse events are flaky
    handleClick();
    // Start the animation on touch
    setIsHovered(true);
    // Reset hover state after animation completes
    setTimeout(() => setIsHovered(false), 600);
  }, [handleClick]);

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
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
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
              text-shadow: 0 0 2px rgba(255, 255, 255, 0.45),
                          0 0 4px rgba(61, 209, 255, 0.35),
                          0 0 8px rgba(61, 209, 255, 0.25);
            }
            50% {
              text-shadow: 0 0 3px rgba(255, 255, 255, 0.5),
                          0 0 8px rgba(61, 209, 255, 0.45),
                          0 0 16px rgba(61, 209, 255, 0.3);
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
