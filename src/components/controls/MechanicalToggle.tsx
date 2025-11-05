import React from 'react';
import './MechanicalToggle.css';

interface MechanicalToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function MechanicalToggle({ checked, onChange }: MechanicalToggleProps) {
  return (
    <div className="toggle">
      <input
        className="toggle-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="toggle-handle-wrapper">
        <div className="toggle-handle">
          <div className="toggle-handle-knob"></div>
          <div className="toggle-handle-bar-wrapper">
            <div className="toggle-handle-bar"></div>
          </div>
        </div>
      </div>
      <div className="toggle-base">
        <div className="toggle-base-inside"></div>
      </div>
    </div>
  );
}
