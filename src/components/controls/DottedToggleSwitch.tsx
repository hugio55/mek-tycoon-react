'use client';

import { useState } from 'react';

/**
 * Dotted Toggle Switch - Transformed from external CSS component
 *
 * Original: Toggle switch with dotted grip pattern
 * Features:
 * - Beige/tan color scheme with gradient borders
 * - Track changes: Tan (OFF) → Yellow (ON)
 * - 3D button with multiple inset shadows
 * - 12 circular dots in 3x4 grid pattern on button
 * - Dots have radial gradient for depth
 * - Button slides left → right with smooth transition
 * - Realistic lighting and shadow effects
 *
 * Transformation applied:
 * - HTML → React JSX with state management
 * - CSS → Tailwind utilities + inline styles
 * - Grid layout for dot pattern
 * - Preserved all gradients and shadows
 * - Maintained 0.4s linear transitions
 */

interface DottedToggleSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function DottedToggleSwitch({
  checked = false,
  onChange
}: DottedToggleSwitchProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onChange?.(newState);
  };

  return (
    <div
      className="flex justify-center items-center relative rounded-[0.5em] p-[0.125em]"
      style={{
        backgroundImage: 'linear-gradient(to bottom, #d0c4b8, #f5ece5)',
        boxShadow: '0 1px 1px rgb(255 255 255 / 0.6)'
      }}
    >
      {/* Hidden Checkbox Input */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="absolute z-10 rounded-[inherit] w-full h-full opacity-0 cursor-pointer"
        style={{
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />

      {/* Toggle Container (Track) */}
      <div
        className="flex items-center relative rounded-[0.375em] transition-colors duration-[400ms]"
        style={{
          width: '3em',
          height: '1.5em',
          backgroundColor: isChecked ? '#f3b519' : '#e1dacd',
          boxShadow: `
            inset 0 0 0.0625em 0.125em rgb(255 255 255 / 0.2),
            inset 0 0.0625em 0.125em rgb(0 0 0 / 0.4)
          `,
          transitionTimingFunction: 'linear'
        }}
      >
        {/* Toggle Button */}
        <div
          className="flex justify-center items-center absolute rounded-[0.3125em] transition-all duration-[400ms]"
          style={{
            left: isChecked ? '1.5625em' : '0.0625em',
            width: '1.375em',
            height: '1.375em',
            backgroundColor: '#e4ddcf',
            boxShadow: `
              inset 0 -0.0625em 0.0625em 0.125em rgb(0 0 0 / 0.1),
              inset 0 -0.125em 0.0625em rgb(0 0 0 / 0.2),
              inset 0 0.1875em 0.0625em rgb(255 255 255 / 0.3),
              0 0.125em 0.125em rgb(0 0 0 / 0.5)
            `
          }}
        >
          {/* Circles Container (3x4 grid) */}
          <div
            className="grid absolute"
            style={{
              gridTemplateColumns: 'repeat(3, min-content)',
              gap: '0.125em',
              margin: '0 auto'
            }}
          >
            {/* Generate 12 circles */}
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="rounded-full"
                style={{
                  width: '0.125em',
                  height: '0.125em',
                  backgroundImage: 'radial-gradient(circle at 50% 0, #f6f0e9, #bebcb0)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
