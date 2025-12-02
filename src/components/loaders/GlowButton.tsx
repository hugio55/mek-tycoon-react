'use client';

import React from 'react';

interface GlowButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'cyan';
  shape?: 'rounded' | 'pill' | 'sharp' | 'angled' | 'hexagon';
}

/**
 * Glow Button - Transformed from Uiverse.io by Allyhere
 *
 * Original: Blue/cyan gradient with glowing box shadows
 * Transformed: Gold/yellow and Cyan/blue variants matching Mek Tycoon design
 * Features: Animated gradient background, glowing inset shadows, smooth hover transition
 * Shapes: rounded (default), pill, sharp (square corners), angled (skewed), hexagon
 */
export default function GlowButton({
  children = 'Button',
  onClick,
  className = '',
  size = 'md',
  color = 'gold',
  shape = 'rounded'
}: GlowButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 min-w-[100px] min-h-[36px] text-sm',
    md: 'px-6 py-3 min-w-[120px] min-h-[44px] text-base',
    lg: 'px-8 py-4 min-w-[140px] min-h-[52px] text-lg'
  };

  const colorConfig = {
    gold: {
      gradient: 'linear-gradient(325deg, #b8860b 0%, #fab617 55%, #b8860b 90%)',
      boxShadow: `
        0px 0px 20px rgba(250, 182, 23, 0.5),
        0px 5px 5px -1px rgba(184, 134, 11, 0.25),
        inset 4px 4px 8px rgba(255, 223, 128, 0.5),
        inset -4px -4px 8px rgba(139, 92, 8, 0.35)
      `,
      focusShadow: '0 0 0 3px #000, 0 0 0 6px #fab617',
      textColor: 'text-black'
    },
    cyan: {
      gradient: 'linear-gradient(325deg, #0077a3 0%, #00d4ff 55%, #0077a3 90%)',
      boxShadow: `
        0px 0px 20px rgba(0, 212, 255, 0.5),
        0px 5px 5px -1px rgba(0, 119, 163, 0.25),
        inset 4px 4px 8px rgba(128, 234, 255, 0.5),
        inset -4px -4px 8px rgba(0, 77, 102, 0.35)
      `,
      focusShadow: '0 0 0 3px #000, 0 0 0 6px #00d4ff',
      textColor: 'text-black'
    }
  };

  const shapeStyles: Record<string, { borderRadius?: string; clipPath?: string; transform?: string }> = {
    rounded: { borderRadius: '8px' },
    pill: { borderRadius: '9999px' },
    sharp: { borderRadius: '0px' },
    angled: { borderRadius: '4px', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' },
    hexagon: { borderRadius: '0', clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }
  };

  const config = colorConfig[color];
  const shapeStyle = shapeStyles[shape];

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeStyles[size]}
        ${config.textColor}
        font-medium
        border-none
        cursor-pointer
        transition-all duration-800
        focus:outline-none
        ${className}
      `}
      style={{
        backgroundSize: '280% auto',
        backgroundImage: config.gradient,
        backgroundPosition: 'left top',
        boxShadow: config.boxShadow,
        transition: 'background-position 0.8s ease',
        ...shapeStyle
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundPosition = 'right top';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundPosition = 'left top';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = config.focusShadow;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = config.boxShadow;
      }}
    >
      {children}
    </button>
  );
}
