'use client';

import { useState } from 'react';
import './AnimatedTrackToggle.css';

/**
 * Animated Track Toggle - Direct transplant from external HTML/CSS
 *
 * Features:
 * - Size-based CSS variables (--sz: 9vmin)
 * - Animated thumb that slides left/right
 * - Track with top and bottom sections that rotate (5deg to -5deg)
 * - Two light indicators (off/on) that glow with box-shadow
 * - Complex keyframe animations for thumb movement and track rotation
 * - Radial gradients for lighting effects
 * - Color variables: green (on), red (off), gray
 */

interface AnimatedTrackToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function AnimatedTrackToggle({
  checked = false,
  onChange
}: AnimatedTrackToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onChange?.(newState);
  };

  return (
    <div className="toggle">
      <input
        type="checkbox"
        id="animated-track-btn"
        checked={isChecked}
        onChange={handleChange}
      />
      <label htmlFor="animated-track-btn">
        <span className="track">
          <span className="track-top">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span className="track-bot">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </span>
        <span className="thumb"></span>
      </label>
      <div className="lights">
        <span className="light-off"></span>
        <span className="light-on"></span>
      </div>
    </div>
  );
}
