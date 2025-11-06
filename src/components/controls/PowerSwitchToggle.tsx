'use client';

import React from 'react';

interface PowerSwitchToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * Power Switch Toggle - Transformed from external HTML/CSS/SVG component
 *
 * Original: Animated power button toggle with circle and line SVG icon
 * Colors: Changed from white (#ffffff) to Mek Tycoon gold (#fab617)
 * Features: Click animation, line bounce, circle rotation, glow effect
 * Animation: Line bounces on toggle, circle draws from partial to full
 */
export default function PowerSwitchToggle({
  checked = false,
  onChange,
  className = ''
}: PowerSwitchToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <div
      className={`
        relative flex items-center justify-center
        w-[150px] h-[150px]
        ${className}
      `}
    >
      {/* Hidden checkbox input for state */}
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="absolute w-full h-full z-20 cursor-pointer opacity-0"
      />

      {/* Button container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Glow effect backdrop - only visible when checked */}
        <div
          className={`
            absolute w-full h-full
            transition-all duration-1000 ease-out
            ${checked
              ? 'opacity-15 scale-[2]'
              : 'opacity-0 scale-100'
            }
          `}
          style={{
            background: 'radial-gradient(circle closest-side, #fab617, transparent)',
            filter: 'blur(20px)',
            transform: 'perspective(1px) translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />

        {/* Power icon - OFF state (gray) */}
        <svg
          className={`
            absolute w-full h-full z-10
            fill-none stroke-[#fab617]
            transition-all
            ${checked ? 'animate-power-click' : ''}
          `}
          style={{
            strokeWidth: 8,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }}
          viewBox="0 0 150 150"
        >
          {/* Line (vertical line at top) */}
          <line
            x1="75"
            y1="34"
            x2="75"
            y2="58"
            className={`
              transition-opacity
              ${checked
                ? 'opacity-0 duration-300 delay-1000'
                : 'opacity-20'
              }
            `}
          />
          {/* Circle (partial circle around center) */}
          <circle
            cx="75"
            cy="80"
            r="35"
            className={`
              origin-[75px_80px]
              transition-all
              ${checked
                ? 'opacity-100'
                : 'opacity-20'
              }
            `}
            style={{
              strokeDasharray: 220,
              strokeDashoffset: checked ? 40 : 220,
              transform: checked ? 'rotate(302deg)' : 'rotate(-58deg)',
              transitionProperty: 'transform, stroke-dashoffset',
              transitionDuration: checked ? '0.4s' : '1s',
              transitionDelay: checked ? '0.2s' : '0s'
            }}
          />
        </svg>

        {/* Power icon - ON state (glowing gold) */}
        <svg
          className={`
            absolute w-full h-full z-10
            fill-none stroke-[#fab617]
            ${checked ? 'animate-power-click' : ''}
          `}
          style={{
            strokeWidth: 8,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            filter: 'drop-shadow(0px 0px 6px rgba(250, 182, 23, 0.8))'
          }}
          viewBox="0 0 150 150"
        >
          {/* Line (vertical line at top) - animates on toggle */}
          <line
            x1="75"
            y1="34"
            x2="75"
            y2="58"
            className={`
              transition-opacity
              ${checked
                ? 'opacity-100 duration-50 delay-[550ms] animate-power-line'
                : 'opacity-0'
              }
            `}
          />
          {/* Circle (partial circle around center) */}
          <circle
            cx="75"
            cy="80"
            r="35"
            className={`
              origin-[75px_80px]
            `}
            style={{
              strokeDasharray: 220,
              strokeDashoffset: checked ? 40 : 220,
              transform: checked ? 'rotate(302deg)' : 'rotate(-58deg)',
              opacity: checked ? 1 : 0,
              transitionProperty: 'transform, stroke-dashoffset, opacity',
              transitionDuration: checked ? '0.4s' : '1s',
              transitionDelay: checked ? '0.2s' : '0s'
            }}
          />
        </svg>
      </div>
    </div>
  );
}
