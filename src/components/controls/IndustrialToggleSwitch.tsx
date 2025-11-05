import React from 'react';
import './IndustrialToggleSwitch.css';

interface IndustrialToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export default function IndustrialToggleSwitch({
  checked,
  onChange,
  id = 'industrial-toggle'
}: IndustrialToggleSwitchProps) {
  return (
    <div className="industrial-toggle">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>
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
