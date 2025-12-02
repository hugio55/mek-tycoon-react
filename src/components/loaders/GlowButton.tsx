'use client';

import React from 'react';

interface GlowButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Glow Button - Transformed from Uiverse.io by Allyhere
 *
 * Original: Blue/cyan gradient with glowing box shadows
 * Transformed: Gold/yellow gradient matching Mek Tycoon industrial design
 * Features: Animated gradient background, glowing inset shadows, smooth hover transition
 */
export default function GlowButton({
  children = 'Donate',
  onClick,
  className = '',
  size = 'md'
}: GlowButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 min-w-[100px] min-h-[36px] text-sm',
    md: 'px-6 py-3 min-w-[120px] min-h-[44px] text-base',
    lg: 'px-8 py-4 min-w-[140px] min-h-[52px] text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeStyles[size]}
        font-medium
        rounded-lg
        border-none
        text-black
        cursor-pointer
        transition-all duration-800
        focus:outline-none
        ${className}
      `}
      style={{
        backgroundSize: '280% auto',
        backgroundImage: `linear-gradient(
          325deg,
          #b8860b 0%,
          #fab617 55%,
          #b8860b 90%
        )`,
        backgroundPosition: 'left top',
        boxShadow: `
          0px 0px 20px rgba(250, 182, 23, 0.5),
          0px 5px 5px -1px rgba(184, 134, 11, 0.25),
          inset 4px 4px 8px rgba(255, 223, 128, 0.5),
          inset -4px -4px 8px rgba(139, 92, 8, 0.35)
        `,
        transition: 'background-position 0.8s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundPosition = 'right top';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundPosition = 'left top';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `
          0 0 0 3px #000,
          0 0 0 6px #fab617
        `;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = `
          0px 0px 20px rgba(250, 182, 23, 0.5),
          0px 5px 5px -1px rgba(184, 134, 11, 0.25),
          inset 4px 4px 8px rgba(255, 223, 128, 0.5),
          inset -4px -4px 8px rgba(139, 92, 8, 0.35)
        `;
      }}
    >
      {children}
    </button>
  );
}
