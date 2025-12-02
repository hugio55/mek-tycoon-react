'use client';

import React, { useState, useId } from 'react';

interface GliderRadioOption {
  value: string;
  label: string;
}

interface GliderRadioProps {
  options: GliderRadioOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  color?: 'gold' | 'cyan' | 'lime' | 'purple';
  className?: string;
}

/**
 * Glider Radio - Transformed from Uiverse.io by Smit-Prajapati
 *
 * Original: Vertical radio group with sliding glider indicator
 * Transformed: Gold/cyan/lime/purple variants matching Mek Tycoon industrial design
 * Features: Smooth cubic-bezier glider animation, glow effect, dynamic option count
 */
export default function GliderRadio({
  options,
  defaultValue,
  onChange,
  color = 'gold',
  className = ''
}: GliderRadioProps) {
  const groupId = useId();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (defaultValue) {
      const idx = options.findIndex(opt => opt.value === defaultValue);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const colorConfig = {
    gold: {
      main: '#fab617',
      mainOpacity: 'rgba(250, 182, 23, 0.11)',
      glow: 'rgba(250, 182, 23, 0.8)'
    },
    cyan: {
      main: '#00d4ff',
      mainOpacity: 'rgba(0, 212, 255, 0.11)',
      glow: 'rgba(0, 212, 255, 0.8)'
    },
    lime: {
      main: '#84cc16',
      mainOpacity: 'rgba(132, 204, 22, 0.11)',
      glow: 'rgba(132, 204, 22, 0.8)'
    },
    purple: {
      main: '#a855f7',
      mainOpacity: 'rgba(168, 85, 247, 0.11)',
      glow: 'rgba(168, 85, 247, 0.8)'
    }
  };

  const config = colorConfig[color];
  const totalOptions = options.length;

  const handleChange = (index: number, value: string) => {
    setSelectedIndex(index);
    onChange?.(value);
  };

  return (
    <div
      className={`flex flex-col relative pl-2 ${className}`}
      style={{
        ['--main-color' as string]: config.main,
        ['--main-color-opacity' as string]: config.mainOpacity,
        ['--total-radio' as string]: totalOptions
      }}
    >
      {options.map((option, index) => (
        <React.Fragment key={option.value}>
          <input
            type="radio"
            id={`${groupId}-${option.value}`}
            name={groupId}
            value={option.value}
            checked={selectedIndex === index}
            onChange={() => handleChange(index, option.value)}
            className="sr-only peer"
          />
          <label
            htmlFor={`${groupId}-${option.value}`}
            className="cursor-pointer p-4 relative transition-all duration-300 ease-in-out"
            style={{
              color: selectedIndex === index ? config.main : '#888888'
            }}
          >
            {option.label}
          </label>
        </React.Fragment>
      ))}

      {/* Glider Container - vertical line on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(27,27,27,1) 50%, rgba(0,0,0,0) 100%)'
        }}
      >
        {/* Glider - the moving indicator */}
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            height: `${100 / totalOptions}%`,
            transform: `translateY(${selectedIndex * 100}%)`,
            transitionTimingFunction: 'cubic-bezier(0.37, 1.95, 0.66, 0.56)',
            background: `linear-gradient(0deg, rgba(0,0,0,0) 0%, ${config.main} 50%, rgba(0,0,0,0) 100%)`
          }}
        >
          {/* Blur glow effect */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0"
            style={{
              height: '60%',
              width: '300%',
              background: config.main,
              filter: 'blur(10px)'
            }}
          />
          {/* Horizontal gradient trail */}
          <div
            className="absolute left-0 h-full"
            style={{
              width: '150px',
              background: `linear-gradient(90deg, ${config.mainOpacity} 0%, rgba(0,0,0,0) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
