'use client';

import { useState } from 'react';
import './SlideTrackToggle.css';

interface SlideTrackToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export default function SlideTrackToggle({
  checked = false,
  onChange,
  disabled = false,
  id = 'slide-track-toggle'
}: SlideTrackToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div className="slide-track-toggle-wrapper">
      <div className="toggle">
        <input
          type="checkbox"
          id={id}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
        />
        <label htmlFor={id}>
          <span className="track">
            <span className="txt"></span>
          </span>
          <span className="thumb">|||</span>
        </label>
      </div>
    </div>
  );
}
