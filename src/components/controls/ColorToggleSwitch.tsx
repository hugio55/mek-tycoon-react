'use client';

import { useState } from 'react';

/**
 * Color Toggle Switch - Transformed from external CSS component
 *
 * Original: 3D toggle switch with color variants
 * Features:
 * - Three color options: red, yellow, blue
 * - 3D ball with radial gradients and shadows
 * - Inset shadows on container track
 * - Ball slides left → right when toggled
 * - Color overlay fades in on ::after pseudo-element
 * - Smooth 0.4s transitions
 * - Realistic lighting effects
 *
 * Transformation applied:
 * - HTML → React JSX with state management
 * - CSS → Tailwind utilities + inline styles
 * - SCSS color variants → TypeScript color prop
 * - ::after pseudo-element → Real div element
 * - Preserved all radial gradients and box-shadows
 */

interface ColorToggleSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  color?: 'red' | 'yellow' | 'blue';
}

export default function ColorToggleSwitch({
  checked = false,
  onChange,
  color = 'red'
}: ColorToggleSwitchProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onChange?.(newState);
  };

  // Color configurations
  const colorConfig = {
    red: {
      container: {
        on: '#f5233c',
        shadowOn: '#d70026'
      },
      ball: {
        gradient1: '#ff2751',
        gradient2: '#e0022f',
        shadow: '#b70033',
        insetLight: '#fe7d7e',
        insetDark: '#870002'
      }
    },
    yellow: {
      container: {
        on: '#fbc433',
        shadowOn: '#ee9902'
      },
      ball: {
        gradient1: '#f5d05f',
        gradient2: '#d67f1b',
        shadow: '#bc6d00',
        insetLight: '#fff27a',
        insetDark: '#9f3901'
      }
    },
    blue: {
      container: {
        on: '#4588ff',
        shadowOn: '#3952f3'
      },
      ball: {
        gradient1: '#419efe',
        gradient2: '#4ba2ff',
        shadow: '#2634d0',
        insetLight: '#8dd5ff',
        insetDark: '#1500ac'
      }
    }
  };

  const config = colorConfig[color];

  return (
    <div className="inline-block relative rounded-[3.125em] overflow-hidden">
      {/* Hidden Checkbox Input */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="absolute z-10 top-0 left-0 rounded-[inherit] w-full h-full cursor-pointer opacity-0"
        style={{
          WebkitAppearance: 'none',
          appearance: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: '1px solid transparent'
        }}
      />

      {/* Toggle Container */}
      <div
        className="flex relative rounded-[inherit] transition-all duration-[400ms]"
        style={{
          width: '2.5em',
          height: '1.25em',
          backgroundColor: isChecked ? config.container.on : '#d1d4dc',
          boxShadow: isChecked
            ? `inset 0.0625em 0 0 ${config.container.on},
               inset -0.0625em 0 0 ${config.container.on},
               inset 0.125em 0.25em 0.125em 0.25em ${config.container.shadowOn}`
            : `inset 0.0625em 0 0 #d4d2de,
               inset -0.0625em 0 0 #d4d2de,
               inset 0.125em 0.25em 0.125em 0.25em #b5b5c3`,
          maskImage: 'radial-gradient(#fff, #000)'
        }}
      >
        {/* Toggle Ball */}
        <div
          className="relative rounded-full transition-all duration-[400ms]"
          style={{
            width: '1.25em',
            height: '1.25em',
            backgroundImage: `
              radial-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 16%),
              radial-gradient(#d2d4dc, #babac2)
            `,
            backgroundPosition: '-0.25em -0.25em',
            backgroundSize: 'auto, calc(100% + 0.25em) calc(100% + 0.25em)',
            backgroundRepeat: 'no-repeat',
            boxShadow: `
              0.25em 0.25em 0.25em #8d889e,
              inset 0.0625em 0.0625em 0.25em #d1d1d6,
              inset -0.0625em -0.0625em 0.25em #8c869e
            `,
            transform: isChecked ? 'translateX(100%)' : 'translateX(0)'
          }}
        >
          {/* Color Overlay (pseudo-element replacement) */}
          <div
            className="absolute top-0 left-0 rounded-full w-full h-full transition-opacity duration-[400ms]"
            style={{
              backgroundImage: `
                radial-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 16%),
                radial-gradient(${config.ball.gradient1}, ${config.ball.gradient2})
              `,
              backgroundPosition: '-0.25em -0.25em',
              backgroundSize: 'auto, calc(100% + 0.25em) calc(100% + 0.25em)',
              backgroundRepeat: 'no-repeat',
              boxShadow: `
                0.25em 0.25em 0.25em ${config.ball.shadow},
                inset 0.0625em 0.0625em 0.25em ${config.ball.insetLight},
                inset -0.0625em -0.0625em 0.25em ${config.ball.insetDark}
              `,
              opacity: isChecked ? 1 : 0
            }}
          />
        </div>
      </div>
    </div>
  );
}
