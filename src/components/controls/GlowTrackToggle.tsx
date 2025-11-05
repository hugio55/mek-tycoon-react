'use client';

import React, { useState } from 'react';
import './GlowTrackToggle.css';

interface GlowTrackToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function GlowTrackToggle({
  checked = false,
  onChange,
  disabled = false
}: GlowTrackToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div className="glow-toggle">
      <input
        type="checkbox"
        id="glow-btn"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="glow-btn">
        <span className="glow-track">
          <span className="glow-txt"></span>
        </span>
        <span className="glow-thumb">|||</span>
      </label>
    </div>
  );
}
