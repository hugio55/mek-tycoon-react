'use client';

import { useState } from 'react';

/**
 * Nebula Checkbox - Transformed from external CSS component
 *
 * Original: Cosmic-themed checkbox with nebula effects and sparkles
 * Features:
 * - Square → Star transformation (rotate + border-radius)
 * - Swirling nebula glow with radial gradients
 * - Sparkle particles that fly outward when checked
 * - Color shift: Blue/purple → Pink/yellow
 * - Bounce animation on check
 * - Hover pulse effect
 *
 * Transformation applied:
 * - HTML → React JSX with state management
 * - CSS → Tailwind utilities + inline styles
 * - Preserved all animations and cubic-bezier timing
 * - Maintained pseudo-element sparkles
 */

interface NebulaCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

export default function NebulaCheckbox({
  checked = false,
  onChange,
  label
}: NebulaCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onChange?.(newState);
  };

  return (
    <label className="inline-block relative cursor-pointer select-none">
      {/* Hidden Checkbox Input */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="absolute opacity-0 cursor-pointer h-0 w-0"
      />

      {/* Checkbox Wrapper */}
      <div className="relative w-12 h-12 flex items-center justify-center group">
        {/* Pulse effect background (appears on hover) */}
        <div
          className="absolute w-12 h-12 rounded-full -z-10 transition-transform duration-[400ms]"
          style={{
            backgroundColor: 'rgba(75, 94, 170, 0.2)',
            transform: 'scale(0)',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1.4)'
          }}
        />

        {/* Checkmark (square → star) */}
        <div
          className={`absolute w-8 h-8 transition-all duration-300 ${
            isChecked ? 'nebula-checked' : ''
          }`}
          style={{
            background: isChecked
              ? 'linear-gradient(135deg, #ff5e62, #ffd452)'
              : 'linear-gradient(135deg, #0a0a23, #1c2526)',
            border: '2px solid',
            borderColor: isChecked ? '#ffd452' : '#4b5eaa',
            borderRadius: isChecked ? '50%' : '12px',
            transform: isChecked ? 'rotate(45deg) scale(1.2)' : 'scale(1)',
            boxShadow: isChecked
              ? '0 0 20px rgba(255, 212, 82, 0.8)'
              : '0 0 8px rgba(75, 94, 170, 0.3)',
            transitionTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            transitionProperty: 'transform, background, border-color, border-radius, box-shadow',
            transitionDuration: '0.4s, 0.3s, 0.3s, 0.3s, 0.3s'
          }}
        >
          {/* Star checkmark symbol */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              display: isChecked ? 'block' : 'none',
              width: '10px',
              height: '10px',
              background: 'transparent',
              border: '2px solid #fff',
              borderRadius: '50%',
              transform: isChecked ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1.6)',
              transitionProperty: 'transform, opacity',
              transitionDuration: '0.3s',
              opacity: isChecked ? 1 : 0
            }}
          />
        </div>

        {/* Nebula glow effect */}
        <div
          className="absolute w-10 h-10 rounded-full pointer-events-none"
          style={{
            background: isChecked
              ? 'radial-gradient(circle, rgba(255, 94, 170, 0.5) 10%, rgba(255, 212, 82, 0.3) 70%)'
              : 'radial-gradient(circle, rgba(75, 94, 170, 0.3) 10%, transparent 70%)',
            opacity: isChecked ? 1 : 0.5,
            transform: isChecked ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'opacity 0.3s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: isChecked ? 'nebula-swirl 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        />

        {/* Sparkle container */}
        <div className="absolute w-full h-full pointer-events-none">
          {/* Sparkle 1 (top-right) */}
          <div
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: '#ffd452',
              opacity: isChecked ? 1 : 0,
              transform: isChecked ? 'translate(12px, -12px)' : 'translate(0, 0)',
              transition: 'all 0.6s ease',
              animation: isChecked ? 'nebula-twinkle 0.8s cubic-bezier(0.5, 0, 0.5, 1) forwards' : 'none'
            }}
          />
          {/* Sparkle 2 (bottom-left) */}
          <div
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: '#ff5e62',
              opacity: isChecked ? 1 : 0,
              transform: isChecked ? 'translate(-12px, 12px)' : 'translate(0, 0)',
              transition: 'all 0.6s ease',
              animation: isChecked ? 'nebula-twinkle 0.8s cubic-bezier(0.5, 0, 0.5, 1) 0.2s forwards' : 'none'
            }}
          />
        </div>
      </div>

      {/* Label (if provided) */}
      {label && (
        <span className="ml-2 text-sm text-zinc-300">{label}</span>
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes nebula-swirl {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes nebula-twinkle {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(1.5) translate(10px, -10px);
              opacity: 0;
            }
          }

          @keyframes nebula-bounce {
            0%, 100% {
              transform: rotate(45deg) scale(1.2);
            }
            50% {
              transform: rotate(45deg) scale(1.4);
            }
          }

          .nebula-checked {
            animation: nebula-bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          /* Hover pulse effect */
          label:hover .group > div:first-child {
            transform: scale(1) !important;
          }

          /* Hover checkmark scale */
          label:hover .group > div:nth-child(2) {
            transform: scale(1.1);
            box-shadow: 0 0 12px rgba(75, 94, 170, 0.5);
          }

          label:has(input:checked):hover .group > div:nth-child(2) {
            transform: rotate(45deg) scale(1.3);
          }
        `
      }} />
    </label>
  );
}
