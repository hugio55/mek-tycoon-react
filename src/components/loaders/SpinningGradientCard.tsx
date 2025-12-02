'use client';

import React from 'react';

interface SpinningGradientCardProps {
  title?: string;
  subtitle?: string;
  footer?: string;
  brandText?: string;
  brandSubtext?: string;
  color?: 'gold' | 'cyan' | 'purple' | 'lime';
  onClick?: () => void;
  className?: string;
}

/**
 * Spinning Gradient Card - Transformed from Uiverse.io by monkey_8812
 *
 * Original: Purple/orange gradient with glass-morphism overlay
 * Transformed: Gold/cyan/purple/lime variants matching Mek Tycoon industrial design
 * Features: Spinning gradient orb, layered glass-morphism, hover effects, customizable content
 */
export default function SpinningGradientCard({
  title = 'Card',
  subtitle = 'text',
  footer = '2025',
  brandText = 'MEK',
  brandSubtext = 'card',
  color = 'gold',
  onClick,
  className = ''
}: SpinningGradientCardProps) {
  const colorConfig = {
    gold: {
      accent: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-orange-400',
      border: 'border-yellow-500/40'
    },
    cyan: {
      accent: 'bg-cyan-400',
      gradient: 'from-cyan-400 to-blue-500',
      border: 'border-cyan-400/40'
    },
    purple: {
      accent: 'bg-purple-400',
      gradient: 'from-purple-500 to-orange-300',
      border: 'border-purple-400/40'
    },
    lime: {
      accent: 'bg-lime-400',
      gradient: 'from-lime-400 to-emerald-500',
      border: 'border-lime-400/40'
    }
  };

  const config = colorConfig[color];

  return (
    <div
      className={`w-[200px] h-[300px] relative border border-solid ${config.border} rounded-2xl overflow-hidden ${className}`}
    >
      {/* Accent background layer */}
      <div className={`w-full h-full p-1 absolute ${config.accent}`}>
        <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-[#222]" />
      </div>

      {/* Spinning gradient orb layer */}
      <div className="w-full h-full flex items-center justify-center relative backdrop-blur-lg rounded-2xl">
        <div
          className={`w-32 h-32 rounded-full bg-gradient-to-tr ${config.gradient} animate-spin`}
          style={{ animationDuration: '12s' }}
        />
      </div>

      {/* Content overlay layer */}
      <div className="w-full h-full p-2 flex justify-between absolute inset-0">
        {/* Left content panel */}
        <div className="w-3/5 p-2 pt-3 pb-1.5 flex flex-col rounded-xl backdrop-blur-lg bg-gray-50/10 text-gray-200 font-medium font-mono">
          <span className="text-xl font-medium">{title}</span>
          <span className="text-xs text-gray-400">{subtitle}</span>
          <div className="w-full mt-auto flex items-center justify-center">
            <span className="text-xs text-gray-400">{footer}</span>
          </div>
        </div>

        {/* Right side content */}
        <div className="h-full pt-2 flex flex-col items-end text-white/50">
          <span className="text-[10px] leading-[12px]">{brandText}</span>
          <span className="text-[10px] leading-[13px]">{brandSubtext}</span>

          {/* Action button */}
          <div
            onClick={onClick}
            className="w-8 h-8 mt-auto flex items-center justify-center rounded-full backdrop-blur-lg bg-gray-50/20 cursor-pointer transition-all duration-300 hover:bg-gray-50/30"
          >
            <span className="font-serif text-white/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 12 12"
                className="w-4 h-4"
              >
                <g fill="none">
                  <path
                    d="M4.646 2.146a.5.5 0 0 0 0 .708L7.793 6L4.646 9.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"
                    fill="currentColor"
                  />
                </g>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
