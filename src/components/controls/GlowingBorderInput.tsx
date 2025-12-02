import React, { useState } from 'react';

interface GlowingBorderInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  showFilterButton?: boolean;
  accentColor?: 'purple' | 'cyan' | 'gold';
}

const colorSchemes = {
  purple: {
    primary: '#402fb5',
    secondary: '#cf30aa',
    glow: '#cf30aa',
    dark: '#18116a',
    darkSecondary: '#6e1b60',
  },
  cyan: {
    primary: '#00d4ff',
    secondary: '#0891b2',
    glow: '#00d4ff',
    dark: '#0e4d5c',
    darkSecondary: '#0c3d4a',
  },
  gold: {
    primary: '#fab617',
    secondary: '#f59e0b',
    glow: '#fab617',
    dark: '#78350f',
    darkSecondary: '#92400e',
  },
};

const GlowingBorderInput: React.FC<GlowingBorderInputProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onFilterClick,
  showFilterButton = true,
  accentColor = 'purple',
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputValue = controlledValue !== undefined ? controlledValue : internalValue;
  const colors = colorSchemes[accentColor];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // Calculate rotation based on state
  const getRotation = (baseRotation: number) => {
    if (isFocused) return baseRotation + 360;
    if (isHovered) return baseRotation - 180;
    return baseRotation;
  };

  const transitionDuration = isFocused ? '4s' : '2s';

  // Shared style for gradient layer containers
  const layerContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    overflow: 'hidden',
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: 314, height: 70 }}
    >
      {/* Glow layer - outermost, most blurred */}
      <div
        style={{
          ...layerContainerStyle,
          width: 320,
          height: 70,
          borderRadius: 12,
          filter: 'blur(15px)',
          opacity: 0.5,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            backgroundImage: `conic-gradient(#000, ${colors.primary} 5%, #000 38%, #000 50%, ${colors.secondary} 60%, #000 87%)`,
            backgroundRepeat: 'no-repeat',
            transform: `translate(-50%, -50%) rotate(${getRotation(60)}deg)`,
            transition: `transform ${transitionDuration} ease`,
          }}
        />
      </div>

      {/* Dark border background layer */}
      <div
        style={{
          ...layerContainerStyle,
          width: 312,
          height: 65,
          borderRadius: 12,
          filter: 'blur(3px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            backgroundImage: `conic-gradient(rgba(0,0,0,0), ${colors.dark}, rgba(0,0,0,0) 10%, rgba(0,0,0,0) 50%, ${colors.darkSecondary}, rgba(0,0,0,0) 60%)`,
            backgroundRepeat: 'no-repeat',
            transform: `translate(-50%, -50%) rotate(${getRotation(82)}deg)`,
            transition: `transform ${transitionDuration} ease`,
          }}
        />
      </div>

      {/* Border layer */}
      <div
        style={{
          ...layerContainerStyle,
          width: 308,
          height: 61,
          borderRadius: 11,
          filter: 'blur(0.5px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            backgroundImage: `conic-gradient(#1c191c, ${colors.primary} 5%, #1c191c 14%, #1c191c 50%, ${colors.secondary} 60%, #1c191c 64%)`,
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.3)',
            transform: `translate(-50%, -50%) rotate(${getRotation(70)}deg)`,
            transition: `transform ${transitionDuration} ease`,
          }}
        />
      </div>

      {/* White/bright layer */}
      <div
        style={{
          ...layerContainerStyle,
          width: 305,
          height: 58,
          borderRadius: 10,
          filter: 'blur(1px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            backgroundImage: `conic-gradient(rgba(0,0,0,0) 0%, #a099d8, rgba(0,0,0,0) 8%, rgba(0,0,0,0) 50%, #dfa2da, rgba(0,0,0,0) 58%)`,
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.4)',
            transform: `translate(-50%, -50%) rotate(${getRotation(83)}deg)`,
            transition: `transform ${transitionDuration} ease`,
          }}
        />
      </div>

      {/* Input field */}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="relative text-white outline-none z-10"
        style={{
          width: 301,
          height: 56,
          borderRadius: 10,
          border: 'none',
          backgroundColor: '#010201',
          paddingLeft: 45,
          paddingRight: showFilterButton ? 55 : 16,
          fontSize: 16,
        }}
      />

      {/* Search icon */}
      <svg
        className="absolute z-20 pointer-events-none"
        style={{ left: 20, top: '50%', transform: 'translateY(-50%)' }}
        width="17"
        height="16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
          stroke="#888"
          strokeWidth="1.333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Filter button */}
      {showFilterButton && (
        <button
          onClick={onFilterClick}
          className="absolute z-20 flex items-center justify-center"
          style={{
            top: '50%',
            right: 14,
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(180deg, #252525, #1a1a1a)',
            border: `1px solid ${colors.primary}40`,
            cursor: 'pointer',
            transition: 'border-color 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = `${colors.primary}40`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 6h16M6 12h12M8 18h8"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GlowingBorderInput;
