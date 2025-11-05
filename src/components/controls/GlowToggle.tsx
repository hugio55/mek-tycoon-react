'use client';

import { useState } from 'react';
import './GlowToggle.css';

interface GlowToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
}

export default function GlowToggle({
  checked: controlledChecked,
  onChange,
  id: providedId
}: GlowToggleProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  // Generate unique ID if not provided
  const uniqueId = providedId || `glow-toggle-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  return (
    <div className="glow-toggle">
      <input
        type="checkbox"
        id={uniqueId}
        checked={checked}
        onChange={handleChange}
      />
      <label htmlFor={uniqueId}>
        <span className="glow-track">
          <span className="glow-txt"></span>
        </span>
        <span className="glow-thumb">|||</span>
      </label>
    </div>
  );
}
