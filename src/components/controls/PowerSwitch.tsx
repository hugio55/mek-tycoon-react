'use client';

import { useState, useEffect } from 'react';

/**
 * PowerSwitch - Horizontal 3D Toggle Switch
 *
 * Industrial/mechanical design with:
 * - Horizontal sliding toggle
 * - Deep 3D appearance with shadows
 * - Glossy finish with highlights
 * - Vibrant green when ON, dark gray when OFF
 * - Metal frame with industrial aesthetic
 * - Smooth animation on state change
 * - Click anywhere on switch to toggle
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

  // Sync internal state with prop changes
  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    onChange?.(newState);
  };

  return (
    <div className="relative inline-flex items-center gap-4">
      {/* Switch Container */}
      <div
        onClick={handleToggle}
        className="relative cursor-pointer select-none"
        style={{
          width: '180px',
          height: '80px',
          perspective: '1000px'
        }}
      >
        {/* Metal Frame */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            boxShadow: `
              inset 0 2px 4px rgba(0, 0, 0, 0.5),
              inset 0 -2px 4px rgba(255, 255, 255, 0.1),
              0 4px 8px rgba(0, 0, 0, 0.4)
            `,
            border: '2px solid #3a3a3a'
          }}
        >
          {/* Inner Track */}
          <div
            className="absolute inset-[8px] rounded-lg overflow-hidden"
            style={{
              background: isOn
                ? 'linear-gradient(to right, #374151 0%, #10b981 100%)'
                : 'linear-gradient(to right, #374151 0%, #1f2937 100%)',
              boxShadow: `
                inset 0 3px 6px rgba(0, 0, 0, 0.6),
                inset 0 -1px 3px rgba(255, 255, 255, 0.05)
              `,
              transition: 'background 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* OFF Label */}
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest pointer-events-none"
              style={{
                fontFamily: 'Orbitron',
                color: !isOn ? '#9ca3af' : '#4b5563',
                textShadow: !isOn ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
                transition: 'color 0.3s ease'
              }}
            >
              OFF
            </div>

            {/* ON Label */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest pointer-events-none"
              style={{
                fontFamily: 'Orbitron',
                color: isOn ? '#ffffff' : '#4b5563',
                textShadow: isOn ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none',
                transition: 'color 0.3s ease, text-shadow 0.3s ease'
              }}
            >
              ON
            </div>

            {/* Sliding Toggle Button */}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-lg"
              style={{
                width: '70px',
                height: '56px',
                left: isOn ? 'calc(100% - 74px)' : '4px',
                transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isOn
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
                  : 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
                boxShadow: isOn
                  ? `
                      0 4px 12px rgba(16, 185, 129, 0.4),
                      inset 0 1px 2px rgba(255, 255, 255, 0.3),
                      inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                      0 0 20px rgba(16, 185, 129, 0.3)
                    `
                  : `
                      0 4px 8px rgba(0, 0, 0, 0.3),
                      inset 0 1px 2px rgba(255, 255, 255, 0.1),
                      inset 0 -2px 4px rgba(0, 0, 0, 0.4)
                    `,
                border: isOn ? '1px solid #34d399' : '1px solid #1f2937'
              }}
            >
              {/* Glossy Highlight */}
              <div
                className="absolute inset-x-2 top-2 h-4 rounded-t-lg"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
                }}
              />

              {/* Center Grip Lines */}
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                <div
                  className="w-0.5 h-8 rounded-full"
                  style={{
                    background: isOn
                      ? 'rgba(0, 0, 0, 0.2)'
                      : 'rgba(0, 0, 0, 0.3)'
                  }}
                />
                <div
                  className="w-0.5 h-8 rounded-full"
                  style={{
                    background: isOn
                      ? 'rgba(0, 0, 0, 0.2)'
                      : 'rgba(0, 0, 0, 0.3)'
                  }}
                />
                <div
                  className="w-0.5 h-8 rounded-full"
                  style={{
                    background: isOn
                      ? 'rgba(0, 0, 0, 0.2)'
                      : 'rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden checkbox for accessibility */}
        <input
          type="checkbox"
          role="switch"
          checked={isOn}
          onChange={handleToggle}
          className="sr-only"
          aria-label={label}
        />
      </div>
    </div>
  );
}
