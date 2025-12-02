'use client';

import React, { useState, useId } from 'react';

interface PushButtonRadioOption {
  value: string;
  icon: React.ReactNode;
}

interface PushButtonRadioProps {
  options: PushButtonRadioOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  color?: 'gold' | 'cyan' | 'lime' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Push Button Radio - Transformed from Uiverse.io by adamgiebl
 *
 * Original: Teal 3D push buttons with pop animation
 * Transformed: Gold/cyan/lime/purple variants matching Mek Tycoon industrial design
 * Features: 3D push effect, flash glow on click, hover lift, glow shadow
 */
export default function PushButtonRadio({
  options,
  defaultValue,
  onChange,
  color = 'cyan',
  size = 'md',
  className = ''
}: PushButtonRadioProps) {
  const groupId = useId();
  const [selectedValue, setSelectedValue] = useState(defaultValue || options[0]?.value);

  const colorConfig = {
    gold: {
      front: 'hsl(43deg 96% 56%)',
      frontBright: 'hsl(43deg 96% 75%)',
      frontLight: 'hsl(43deg 96% 70%)',
      frontDark: 'hsl(43deg 96% 40%)',
      edgeLight: 'hsl(43deg 96% 40%)',
      edgeDark: 'hsl(43deg 96% 20%)',
      glow: 'hsl(43deg 96% 50%)',
      glowBright: 'hsl(43deg 96% 60%)',
      iconColor: 'hsl(43deg 96% 25%)',
      iconBright: 'hsl(43deg 96% 15%)'
    },
    cyan: {
      front: 'hsl(170deg 100% 50%)',
      frontBright: 'hsl(170deg 100% 70%)',
      frontLight: 'hsl(170deg 100% 80%)',
      frontDark: 'hsl(170deg 100% 30%)',
      edgeLight: 'hsl(170deg 100% 32%)',
      edgeDark: 'hsl(170deg 100% 16%)',
      glow: 'hsl(170deg 100% 40%)',
      glowBright: 'hsl(170deg 100% 55%)',
      iconColor: 'hsl(170deg 100% 30%)',
      iconBright: 'hsl(170deg 100% 20%)'
    },
    lime: {
      front: 'hsl(84deg 81% 44%)',
      frontBright: 'hsl(84deg 81% 60%)',
      frontLight: 'hsl(84deg 81% 65%)',
      frontDark: 'hsl(84deg 81% 30%)',
      edgeLight: 'hsl(84deg 81% 32%)',
      edgeDark: 'hsl(84deg 81% 16%)',
      glow: 'hsl(84deg 81% 40%)',
      glowBright: 'hsl(84deg 81% 55%)',
      iconColor: 'hsl(84deg 81% 25%)',
      iconBright: 'hsl(84deg 81% 15%)'
    },
    purple: {
      front: 'hsl(270deg 91% 65%)',
      frontBright: 'hsl(270deg 91% 80%)',
      frontLight: 'hsl(270deg 91% 80%)',
      frontDark: 'hsl(270deg 91% 45%)',
      edgeLight: 'hsl(270deg 91% 45%)',
      edgeDark: 'hsl(270deg 91% 25%)',
      glow: 'hsl(270deg 91% 55%)',
      glowBright: 'hsl(270deg 91% 70%)',
      iconColor: 'hsl(270deg 91% 35%)',
      iconBright: 'hsl(270deg 91% 25%)'
    }
  };

  const sizeConfig = {
    sm: { button: 40, iconSize: 18, radius: 10 },
    md: { button: 50, iconSize: 22, radius: 12 },
    lg: { button: 60, iconSize: 28, radius: 14 }
  };

  const config = colorConfig[color];
  const sizes = sizeConfig[size];

  const handleChange = (value: string) => {
    if (value !== selectedValue) {
      setSelectedValue(value);
      onChange?.(value);
    }
  };

  return (
    <div className={`flex relative gap-1 ${className}`}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;

        return (
          <div key={option.value} className="relative group/btn">
            <input
              type="radio"
              id={`${groupId}-${option.value}`}
              name={groupId}
              value={option.value}
              checked={isSelected}
              onChange={() => handleChange(option.value)}
              className="absolute opacity-0 cursor-pointer h-0 w-0 peer"
            />
            <label
              htmlFor={`${groupId}-${option.value}`}
              className="push-button-label relative block border-none bg-transparent p-0 cursor-pointer select-none transition-all duration-200"
              style={{
                width: sizes.button,
                height: sizes.button,
                borderRadius: sizes.button / 2,
                opacity: isSelected ? 1 : 0.4,
                ['--glow-color' as string]: config.glow,
                ['--glow-bright' as string]: config.glowBright,
                ['--front-color' as string]: config.front,
                ['--front-bright' as string]: config.frontBright,
                boxShadow: `0px 0px 40px -5px ${config.glow}`
              }}
            >
              {/* Shadow layer */}
              <span
                className="push-button-shadow absolute top-0 left-0 w-full h-full transition-transform duration-200"
                style={{
                  borderRadius: sizes.radius,
                  background: 'hsla(0, 0%, 0%, 0.25)',
                  transform: 'translateY(2px)',
                  transitionTimingFunction: 'cubic-bezier(0.3, 0.7, 0.4, 1)'
                }}
              />

              {/* Edge layer */}
              <span
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  borderRadius: sizes.radius,
                  background: `linear-gradient(to left, ${config.edgeDark} 0%, ${config.edgeLight} 8%, ${config.edgeLight} 92%, ${config.edgeDark} 100%)`
                }}
              />

              {/* Front layer */}
              <span
                className="push-button-front flex items-center justify-center relative w-full h-full transition-all duration-200"
                style={{
                  borderRadius: sizes.radius,
                  background: config.front,
                  transform: 'translateY(-4px)',
                  boxShadow: `inset 4px 4px 8px ${config.frontDark}, inset -4px -4px 8px ${config.frontLight}`,
                  transitionTimingFunction: 'cubic-bezier(0.3, 0.7, 0.4, 1)'
                }}
              >
                <span
                  className="push-button-icon transition-colors duration-100"
                  style={{
                    color: config.iconColor,
                    width: sizes.iconSize,
                    height: sizes.iconSize
                  }}
                >
                  {option.icon}
                </span>
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
}

// Common icon components for use with PushButtonRadio
export const PushButtonIcons = {
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Bolt: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.18 2.31-6.15 4.5-8.5.33-.35.5-.79.5-1.25V2l2.5 3c.78.93 1.5 1.87 1.5 3 0 .78-.22 1.5-.6 2.12.78-.4 1.6-.62 2.6-.62 2.21 0 4 1.34 4 3 0 .78-.22 1.5-.6 2.12C19.31 12.85 21 15.08 21 18c0 2.76-4.03 5-9 5z" />
    </svg>
  ),
  Gear: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
};
