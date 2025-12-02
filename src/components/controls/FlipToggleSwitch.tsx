import React, { useState } from 'react';

interface FlipToggleSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

const sizeConfig = {
  sm: { width: 100, height: 32, fontSize: 10, gap: 2, depth: 4 },
  md: { width: 140, height: 44, fontSize: 13, gap: 3, depth: 6 },
  lg: { width: 180, height: 56, fontSize: 16, gap: 4, depth: 8 },
};

const FlipToggleSwitch: React.FC<FlipToggleSwitchProps> = ({
  checked: controlledChecked,
  onChange,
  leftLabel = 'OFF',
  rightLabel = 'ON',
  size = 'md',
  accentColor = '#3b82f6',
}) => {
  const [internalChecked, setInternalChecked] = useState(false);

  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;
  const config = sizeConfig[size];

  const handleClick = () => {
    const newValue = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  const panelWidth = (config.width - config.gap) / 2;

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={handleClick}
      role="switch"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        width: config.width,
        height: config.height,
        perspective: '500px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Left Panel */}
      <div
        className="absolute flex items-center justify-center font-bold uppercase tracking-wider"
        style={{
          left: 0,
          top: 0,
          width: panelWidth,
          height: config.height,
          fontSize: config.fontSize,
          backgroundColor: '#1a1a1a',
          borderRadius: '8px 0 0 8px',
          color: isChecked ? '#555' : '#fff',
          transform: isChecked
            ? 'rotateY(-25deg) rotateX(5deg)'
            : 'rotateY(0deg) rotateX(0deg)',
          transformOrigin: 'right center',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isChecked
            ? 'inset 2px 0 8px rgba(0,0,0,0.5)'
            : `inset -2px 0 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)`,
          zIndex: isChecked ? 1 : 2,
        }}
      >
        {/* 3D depth effect - bottom face */}
        <div
          className="absolute"
          style={{
            left: 0,
            bottom: -config.depth,
            width: panelWidth,
            height: config.depth,
            backgroundColor: '#0a0a0a',
            borderRadius: '0 0 0 8px',
            transform: 'rotateX(90deg)',
            transformOrigin: 'top',
            opacity: isChecked ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        />
        {leftLabel}
      </div>

      {/* Right Panel */}
      <div
        className="absolute flex items-center justify-center font-bold uppercase tracking-wider"
        style={{
          right: 0,
          top: 0,
          width: panelWidth,
          height: config.height,
          fontSize: config.fontSize,
          backgroundColor: '#1a1a1a',
          borderRadius: '0 8px 8px 0',
          color: isChecked ? accentColor : '#555',
          textShadow: isChecked ? `0 0 10px ${accentColor}80` : 'none',
          transform: isChecked
            ? 'rotateY(0deg) rotateX(0deg)'
            : 'rotateY(25deg) rotateX(5deg)',
          transformOrigin: 'left center',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isChecked
            ? `inset 2px 0 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4), 0 0 20px ${accentColor}30`
            : 'inset -2px 0 8px rgba(0,0,0,0.5)',
          zIndex: isChecked ? 2 : 1,
        }}
      >
        {/* 3D depth effect - bottom face */}
        <div
          className="absolute"
          style={{
            right: 0,
            bottom: -config.depth,
            width: panelWidth,
            height: config.depth,
            backgroundColor: '#0a0a0a',
            borderRadius: '0 0 8px 0',
            transform: 'rotateX(90deg)',
            transformOrigin: 'top',
            opacity: isChecked ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
        {rightLabel}
      </div>

      {/* Center divider/hinge */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '10%',
          width: config.gap,
          height: '80%',
          backgroundColor: '#2a2a2a',
          transform: 'translateX(-50%)',
          borderRadius: config.gap / 2,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          zIndex: 0,
        }}
      />
    </div>
  );
};

export default FlipToggleSwitch;
