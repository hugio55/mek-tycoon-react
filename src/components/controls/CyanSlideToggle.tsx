'use client';

import { useState } from 'react';
import './CyanSlideToggle.css';

interface CyanSlideToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function CyanSlideToggle({
  checked = false,
  onChange,
  disabled = false
}: CyanSlideToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div className="cyan-slide-toggle">
      <div className="toggle">
        <input
          type="checkbox"
          id="cyan-toggle-btn"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
        />
        <label htmlFor="cyan-toggle-btn">
          <span className="track">
            <span className="txt"></span>
          </span>
          <span className="thumb">|||</span>
        </label>
      </div>
    </div>
  );
}
