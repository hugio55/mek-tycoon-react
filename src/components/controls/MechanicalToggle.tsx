'use client';

import { useState } from 'react';
import './MechanicalToggle.css';

/**
 * Mechanical Toggle Switch Component
 *
 * Features:
 * - Red knob with radial gradient and rotation animation
 * - Metallic handle bar with linear gradient
 * - Base changes from gray to green when checked
 * - Knob rotates -25° to +25° with cubic-bezier easing
 * - Handle bar has subtle shadow and position shift
 * - Hover effects with opacity transitions
 * - em-based sizing for scalability
 * - Industrial design with gold borders
 */

interface MechanicalToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function MechanicalToggle({
  checked = false,
  onChange,
  label,
  size = 'medium',
  disabled = false
}: MechanicalToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    if (disabled) return;
    const newState = !isChecked;
    setIsChecked(newState);
    onChange?.(newState);
  };

  const sizeClasses = {
    small: 'mechanical-toggle--small',
    medium: 'mechanical-toggle--medium',
    large: 'mechanical-toggle--large'
  };

  return (
    <div className="mechanical-toggle-wrapper">
      {label && (
        <label className="mechanical-toggle-label">
          {label}
        </label>
      )}
      <div
        className={`
          mechanical-toggle
          ${sizeClasses[size]}
          ${isChecked ? 'mechanical-toggle--checked' : ''}
          ${disabled ? 'mechanical-toggle--disabled' : ''}
        `}
        onClick={handleToggle}
        role="switch"
        aria-checked={isChecked}
        aria-label={label || 'Toggle switch'}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <input
          className="mechanical-toggle__input"
          type="checkbox"
          checked={isChecked}
          onChange={handleToggle}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="mechanical-toggle__handle-wrapper">
          <div className="mechanical-toggle__handle">
            <div className="mechanical-toggle__handle-knob"></div>
            <div className="mechanical-toggle__handle-bar-wrapper">
              <div className="mechanical-toggle__handle-bar"></div>
            </div>
          </div>
        </div>

        <div className="mechanical-toggle__base">
          <div className="mechanical-toggle__base-inside"></div>
        </div>
      </div>
    </div>
  );
}
