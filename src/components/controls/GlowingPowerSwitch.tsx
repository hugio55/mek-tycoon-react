import React, { useState } from 'react';

interface GlowingPowerSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
  glowColor?: string;
}

const GlowingPowerSwitch: React.FC<GlowingPowerSwitchProps> = ({
  checked: controlledChecked,
  onChange,
  size = 70,
  glowColor = 'rgb(151, 243, 255)'
}) => {
  const [internalChecked, setInternalChecked] = useState(false);

  // Support both controlled and uncontrolled modes
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleClick = () => {
    const newValue = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  const scale = size / 70;

  return (
    <div
      className="relative cursor-pointer flex items-center justify-center rounded-full transition-all duration-300"
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
        width: size,
        height: size,
        backgroundColor: isChecked ? 'rgb(146, 180, 184)' : 'rgb(99, 99, 99)',
        border: isChecked ? '2px solid rgb(255, 255, 255)' : '2px solid rgb(126, 126, 126)',
        boxShadow: isChecked
          ? `0px 0px 1px ${glowColor} inset,
             0px 0px 2px ${glowColor} inset,
             0px 0px 10px ${glowColor} inset,
             0px 0px 40px ${glowColor},
             0px 0px 100px ${glowColor},
             0px 0px 5px ${glowColor}`
          : '0px 0px 3px rgb(2, 2, 2) inset',
      }}
    >
      {/* Power Icon SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: `${1.2 * scale}em`,
          height: `${1.2 * scale}em`,
          filter: isChecked ? `drop-shadow(0px 0px 5px ${glowColor})` : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        <path
          d="M12 2V12M12 2C12 2 12 2 12 2ZM18.36 6.64C19.6184 7.89879 20.4753 9.50244 20.8223 11.2482C21.1693 12.9939 20.9909 14.8034 20.3096 16.4478C19.6284 18.0921 18.4748 19.4976 17.0001 20.4864C15.5255 21.4752 13.7965 22.0029 12.0269 22.0029C10.2573 22.0029 8.52833 21.4752 7.05367 20.4864C5.57901 19.4976 4.42544 18.0921 3.74419 16.4478C3.06294 14.8034 2.88451 12.9939 3.23151 11.2482C3.57851 9.50244 4.43537 7.89879 5.69376 6.64"
          stroke={isChecked ? 'rgb(255, 255, 255)' : 'rgb(48, 48, 48)'}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
    </div>
  );
};

export default GlowingPowerSwitch;
