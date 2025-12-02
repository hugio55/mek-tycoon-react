'use client';

import React, { useState } from 'react';

interface GradientBlurButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'cyan' | 'lime' | 'purple';
}

/**
 * Gradient Blur Button - Transformed from Uiverse.io by Spacious74
 *
 * Original: Blue/pink gradient container with blur glow on hover
 * Transformed: Gold/cyan/lime/purple variants matching Mek Tycoon industrial design
 * Features: Gradient border container, blur glow effect on hover, press feedback
 */
export default function GradientBlurButton({
  children = 'Button',
  onClick,
  className = '',
  size = 'md',
  color = 'gold'
}: GradientBlurButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const sizeStyles = {
    sm: {
      button: 'text-sm px-3 py-1.5',
      container: 'p-[2px]'
    },
    md: {
      button: 'text-base px-4 py-2',
      container: 'p-[3px]'
    },
    lg: {
      button: 'text-lg px-6 py-3',
      container: 'p-[3px]'
    }
  };

  const colorConfig = {
    gold: {
      gradient: 'linear-gradient(90deg, #fab617, #b8860b)',
      shadowColor: 'rgba(250, 182, 23, 0.6)'
    },
    cyan: {
      gradient: 'linear-gradient(90deg, #00d4ff, #0077a3)',
      shadowColor: 'rgba(0, 212, 255, 0.6)'
    },
    lime: {
      gradient: 'linear-gradient(90deg, #84cc16, #65a30d)',
      shadowColor: 'rgba(132, 204, 22, 0.6)'
    },
    purple: {
      gradient: 'linear-gradient(90deg, #a855f7, #7c3aed)',
      shadowColor: 'rgba(168, 85, 247, 0.6)'
    }
  };

  const config = colorConfig[color];
  const { button: buttonSize, container: containerSize } = sizeStyles[size];

  // Calculate blur amount based on state
  const blurAmount = isPressed ? '0.2em' : isHovered ? '1.2em' : '0';

  return (
    <div
      className={`relative ${containerSize} rounded-[0.9em] transition-all duration-400 ease-out ${className}`}
      style={{
        background: config.gradient
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Blur glow pseudo-element */}
      <div
        className="absolute inset-0 m-auto rounded-[0.9em] -z-10 transition-all duration-400 ease-out"
        style={{
          background: config.gradient,
          filter: `blur(${blurAmount})`,
          opacity: isHovered ? 1 : 0
        }}
      />

      <button
        onClick={onClick}
        className={`
          ${buttonSize}
          bg-black
          text-white
          font-medium
          rounded-[0.7em]
          border-none
          cursor-pointer
          shadow-[2px_2px_3px_rgba(0,0,0,0.7)]
          transition-all duration-200
          hover:brightness-110
          active:scale-[0.98]
        `}
      >
        {children}
      </button>
    </div>
  );
}
