'use client';

import React, { useState } from 'react';

interface GlowRadioStackProps {
  options?: string[];
  defaultIndex?: number;
  onChange?: (index: number, label: string) => void;
  color?: 'gold' | 'cyan' | 'silver';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Glow Radio Stack - Transformed from Uiverse.io by Shoh2008
 *
 * Original: Cyan/blue radio buttons with positional glow indicator
 * Transformed: Gold/Cyan/Silver variants matching Mek Tycoon design
 * Features: Glowing selection indicator, smooth transitions, scale on click
 * The glow position indicates relative position to selection (above/below/at)
 */
export default function GlowRadioStack({
  options = ['Option 1', 'Option 2', 'Option 3'],
  defaultIndex = 0,
  onChange,
  color = 'gold',
  size = 'md',
  orientation = 'vertical',
  className = ''
}: GlowRadioStackProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const sizeConfig = {
    sm: { button: 20, gap: 8, fontSize: '11px' },
    md: { button: 24, gap: 10, fontSize: '13px' },
    lg: { button: 32, gap: 12, fontSize: '15px' }
  };

  const colorConfig = {
    gold: {
      glowCenter: 'hsla(45, 100%, 90%, 1)',
      glowMid: 'hsla(45, 100%, 70%, 1)',
      glowOuter: 'hsla(45, 100%, 60%, 0.3)',
      glowFade: 'hsla(45, 100%, 30%, 0)',
      shadow: 'hsla(45, 100%, 50%, 0.3)',
      labelColor: '#fab617',
      labelSelectedColor: '#ffffff'
    },
    cyan: {
      glowCenter: 'hsla(200, 100%, 90%, 1)',
      glowMid: 'hsla(200, 100%, 70%, 1)',
      glowOuter: 'hsla(200, 100%, 60%, 0.3)',
      glowFade: 'hsla(200, 100%, 30%, 0)',
      shadow: 'hsla(200, 100%, 50%, 0.3)',
      labelColor: '#00d4ff',
      labelSelectedColor: '#ffffff'
    },
    silver: {
      glowCenter: 'hsla(0, 0%, 95%, 1)',
      glowMid: 'hsla(0, 0%, 80%, 1)',
      glowOuter: 'hsla(0, 0%, 70%, 0.3)',
      glowFade: 'hsla(0, 0%, 50%, 0)',
      shadow: 'hsla(0, 0%, 70%, 0.3)',
      labelColor: '#aaaaaa',
      labelSelectedColor: '#ffffff'
    }
  };

  const config = colorConfig[color];
  const sizeStyle = sizeConfig[size];

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onChange?.(index, options[index] || '');
  };

  // Calculate background position based on selection state
  const getBackgroundPosition = (index: number) => {
    if (index === selectedIndex) {
      return '0 0'; // Glow centered - this is the selected one
    } else if (index < selectedIndex) {
      return `0 ${sizeStyle.button}px`; // Glow below (item is above selection)
    } else {
      return `0 -${sizeStyle.button}px`; // Glow above (item is below selection)
    }
  };

  const gradientImage = `radial-gradient(
    ${config.glowCenter} 0%,
    ${config.glowMid} 15%,
    ${config.glowOuter} 28%,
    ${config.glowFade} 70%
  )`;

  return (
    <div
      className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center ${className}`}
      style={{ gap: `${sizeStyle.gap}px` }}
    >
      {options.map((label, index) => {
        const isSelected = index === selectedIndex;
        return (
          <div
            key={index}
            className={`flex ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} items-center`}
            style={{ gap: `${sizeStyle.gap}px` }}
          >
            <button
              type="button"
              onClick={() => handleSelect(index)}
              className="relative outline-none"
              style={{
                width: `${sizeStyle.button}px`,
                height: `${sizeStyle.button}px`,
                borderRadius: '50%',
                cursor: 'pointer',
                border: 'none',
                boxShadow: `
                  hsla(0, 0%, 100%, 0.15) 0 1px 1px,
                  inset hsla(0, 0%, 0%, 0.5) 0 0 0 1px
                  ${isSelected ? `, 0 0 12px ${config.shadow}` : ''}
                `,
                backgroundColor: 'hsla(0, 0%, 0%, 0.2)',
                backgroundImage: gradientImage,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: getBackgroundPosition(index),
                transition: isSelected
                  ? 'background-position 0.2s 0.15s cubic-bezier(0, 0, 0.2, 1), transform 0.25s cubic-bezier(0, 0, 0.2, 1)'
                  : 'background-position 0.15s cubic-bezier(0.8, 0, 1, 1), transform 0.25s cubic-bezier(0.8, 0, 1, 1)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            {label && (
              <span
                style={{
                  fontSize: sizeStyle.fontSize,
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isSelected ? config.labelSelectedColor : config.labelColor,
                  textShadow: isSelected ? `0 0 8px ${config.shadow}` : 'none',
                  transition: 'color 0.2s ease, text-shadow 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
