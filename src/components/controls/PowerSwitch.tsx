'use client';

import { useState } from 'react';

/**
 * Power Switch - Transformed from external CSS component
 *
 * Original: Vertical power switch with 3D lever animation
 * Features:
 * - 3D rotating lever (rotateX transforms)
 * - Two-part lever (top and bottom halves)
 * - Circular knob on top half
 * - Glowing indicator bar when active
 * - Shadow that morphs with switch state
 * - Smooth perspective animations
 *
 * Transformation applied:
 * - HTML → React JSX with state management
 * - CSS → Tailwind utilities + inline styles
 * - Preserved 3D transforms and gradients
 * - Maintained animation timing and easing
 */

interface PowerSwitchProps {
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
  label?: string;
}

export default function PowerSwitch({
  enabled = false,
  onChange,
  label = "Power"
}: PowerSwitchProps) {
  const [isOn, setIsOn] = useState(enabled);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    onChange?.(newState);
  };

  return (
    <div className="relative inline-flex items-center gap-4">
      {/* OFF Label */}
      <span
        className="text-lg font-bold tracking-wider transition-all duration-300"
        style={{
          fontFamily: 'Orbitron',
          color: !isOn ? '#22c55e' : '#4b5563',
          textShadow: !isOn ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none'
        }}
      >
        OFF
      </span>

      {/* Switch Container - Rotated 90 degrees */}
      <label
        className="block relative cursor-pointer rounded-[0.375em] w-[3.75em] h-[8.75em]"
        style={{
          backgroundColor: 'hsl(223, 10%, 40%)',
          boxShadow: `
            0 4.375em 2em hsl(223, 10%, 30%) inset,
            0 0.125em 0 hsl(223, 10%, 40%) inset,
            0 0 0.375em hsla(223, 10%, 10%, 0.5)
          `,
          transition: 'background-color 0.3s cubic-bezier(0.83, 0, 0.17, 1), box-shadow 0.3s cubic-bezier(0.83, 0, 0.17, 1)',
          transform: 'rotate(90deg)'
        }}
      >
        {/* Hidden Checkbox Input */}
        <input
          type="checkbox"
          role="switch"
          checked={isOn}
          onChange={handleToggle}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Lever Container */}
        <span
          className="block relative rounded-[0.25em] m-[0.375em]"
          style={{
            width: 'calc(100% - 0.75em)',
            height: 'calc(100% - 0.75em)',
            backgroundColor: 'hsla(223, 10%, 30%)',
            boxShadow: `
              0 0 0.25em hsl(223, 10%, 10%) inset,
              0.75em 0 0.5em hsl(223, 10%, 40%) inset
            `,
            transition: 'background-color 0.3s cubic-bezier(0.83, 0, 0.17, 1), box-shadow 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
          }}
        >
          {/* Gradient Overlay */}
          <span
            className="block w-full h-full rounded-[inherit]"
            style={{
              backgroundImage: 'linear-gradient(hsla(223, 10%, 10%, 0), hsla(223, 10%, 10%, 0.2))'
            }}
          />

          {/* Top Half of Lever */}
          <span
            className="absolute flex justify-center items-start bottom-1/2 left-[0.125em] p-2"
            style={{
              width: 'calc(100% - 0.25em)',
              height: 'calc(50% - 0.125em)',
              backgroundColor: isOn ? 'hsl(223, 10%, 25%)' : 'hsl(223, 10%, 35%)',
              borderRadius: '0.25em 0.25em 0 0',
              transformOrigin: '50% 100%',
              transform: isOn ? 'rotateX(35deg)' : 'rotateX(0deg)',
              transition: 'background-color 0.3s cubic-bezier(0.83, 0, 0.17, 1), transform 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
            }}
          >
            {/* Circular Knob */}
            <span
              className="block rounded-full w-4 h-4"
              style={{
                boxShadow: isOn
                  ? `0 0 0 0.125em hsl(223, 10%, 15%) inset,
                     0 0.25em 0 hsl(223, 10%, 30%) inset,
                     0 0.125em 0 hsl(223, 10%, 30%)`
                  : `0 0 0 0.125em hsl(223, 10%, 25%) inset,
                     0 0.25em 0 hsl(223, 10%, 40%) inset,
                     0 0.125em 0 hsl(223, 10%, 40%)`,
                transition: 'box-shadow 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
              }}
            />
          </span>

          {/* Bottom Half of Lever */}
          <span
            className="absolute flex justify-center items-end top-1/2 left-[0.125em] p-2"
            style={{
              width: 'calc(100% - 0.25em)',
              height: 'calc(50% - 0.125em)',
              backgroundColor: isOn ? 'hsl(223, 10%, 35%)' : 'hsl(223, 10%, 40%)',
              borderRadius: '0 0 0.25em 0.25em',
              transformOrigin: '50% 0',
              transform: isOn ? 'rotateX(0deg)' : 'rotateX(-35deg)',
              transition: 'background-color 0.3s cubic-bezier(0.83, 0, 0.17, 1), transform 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
            }}
          >
            {/* Indicator Bar */}
            <span
              className="block w-1 h-[1.125em]"
              style={{
                backgroundColor: isOn ? 'hsl(133, 90%, 45%)' : 'hsl(133, 10%, 25%)',
                boxShadow: isOn
                  ? `0 0.125em 0 hsl(133, 90%, 20%) inset,
                     0 -0.0625em 0 hsl(223, 10%, 40%) inset,
                     0 0 0.5em hsla(133, 90%, 45%, 1)`
                  : `0 0.125em 0 hsl(133, 10%, 20%) inset,
                     0 -0.0625em 0 hsl(223, 10%, 40%) inset,
                     0 0 0.5em hsla(133, 90%, 45%, 0)`,
                transition: 'background-color 0.3s cubic-bezier(0.83, 0, 0.17, 1), box-shadow 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
              }}
            />
          </span>
        </span>

        {/* Shadow Container */}
        <span
          className="absolute rounded-[0.25em] overflow-hidden top-2 right-0 w-20 pointer-events-none"
          style={{
            height: 'calc(100% - 0.25em)'
          }}
        >
          {/* Top Shadow */}
          <span
            className="absolute left-[1.625em] w-12 h-1/2 block"
            style={{
              backgroundColor: 'hsla(223, 10%, 10%, 0.25)',
              borderRadius: '1.5em 0 0 0 / 1em 0 0 0',
              transformOrigin: '0 100%',
              transform: isOn ? 'rotate(-10deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
            }}
          />
          {/* Bottom Shadow */}
          <span
            className="absolute bottom-0 left-[1.625em] w-12 h-1/2 block rounded-[0.25em]"
            style={{
              backgroundColor: 'hsla(223, 10%, 10%, 0.25)',
              transformOrigin: '0 0',
              transform: isOn ? 'skewX(0) scaleY(0.85)' : 'skewX(-10deg)',
              transition: 'transform 0.3s cubic-bezier(0.83, 0, 0.17, 1)'
            }}
          />
        </span>

        {/* Label (visually hidden but accessible) */}
        <span className="absolute overflow-hidden w-px h-px">
          {label}
        </span>
      </label>

      {/* ON Label */}
      <span
        className="text-lg font-bold tracking-wider transition-all duration-300"
        style={{
          fontFamily: 'Orbitron',
          color: isOn ? '#22c55e' : '#4b5563',
          textShadow: isOn ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none'
        }}
      >
        ON
      </span>
    </div>
  );
}
