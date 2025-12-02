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

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: 314, height: 70 }}
    >
      {/* Glow layer - outermost, most blurred */}
      <div
        className="absolute overflow-hidden"
        style={{
          width: 354,
          height: 130,
          borderRadius: 12,
          filter: 'blur(30px)',
          opacity: 0.4,
          zIndex: -1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 999,
            height: 999,
            backgroundImage: `conic-gradient(#000, ${colors.primary} 5%, #000 38%, #000 50%, ${colors.secondary} 60%, #000 87%)`,
            backgroundRepeat: 'no-repeat',
            transform: `translate(-50%, -50%) rotate(${getRotation(60)}deg)`,
            transition: `transform ${transitionDuration} ease`,
          }}
        />
      </div>

      {/* Dark border background layer */}
      <div
        className="absolute overflow-hidden"
        style={{
          width: 312,
          height: 65,
          borderRadius: 12,
          filter: 'blur(3px)',
          zIndex: -1,
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
        className="absolute overflow-hidden"
        style={{
          width: 303,
          height: 59,
          borderRadius: 11,
          filter: 'blur(0.5px)',
          zIndex: -1,
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
        className="absolute overflow-hidden"
        style={{
          width: 307,
          height: 63,
          borderRadius: 10,
          filter: 'blur(2px)',
          zIndex: -1,
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

      {/* Pink glow mask */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 30,
          height: 20,
          background: colors.glow,
          top: 10,
          left: 5,
          filter: 'blur(20px)',
          opacity: isHovered ? 0 : 0.8,
          transition: 'opacity 2s ease',
        }}
      />

      {/* Search icon */}
      <svg
        className="absolute"
        style={{ left: 20, top: '50%', transform: 'translateY(-50%)' }}
        width="17"
        height="16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
          stroke="white"
          strokeWidth="1.333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Input field */}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="relative bg-[#010201] text-white text-lg outline-none"
        style={{
          width: 301,
          height: 56,
          borderRadius: 10,
          border: 'none',
          paddingLeft: 59,
          paddingRight: showFilterButton ? 59 : 20,
        }}
      />

      {/* Input mask (gradient fade) */}
      {!isFocused && inputValue === '' && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 100,
            height: 20,
            background: 'linear-gradient(90deg, transparent, black)',
            top: '50%',
            left: 70,
            transform: 'translateY(-50%)',
          }}
        />
      )}

      {/* Filter button */}
      {showFilterButton && (
        <div className="absolute" style={{ top: 7, right: 7 }}>
          {/* Filter button border */}
          <div
            className="absolute overflow-hidden"
            style={{
              width: 40,
              height: 42,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 600,
                height: 600,
                backgroundImage: 'conic-gradient(rgba(0,0,0,0), #3d3a4f, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 50%, #3d3a4f, rgba(0,0,0,0) 100%)',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(1.35)',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                animation: 'glowingBorderRotate 4s linear infinite',
              }}
            />
          </div>

          {/* Filter button */}
          <button
            onClick={onFilterClick}
            className="relative flex items-center justify-center"
            style={{
              width: 38,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(180deg, #161329, black, #1d1b4b)',
              border: '1px solid transparent',
              top: 1,
              left: 1,
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 6h16M6 12h12M8 18h8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Keyframes style */}
      <style>{`
        @keyframes glowingBorderRotate {
          100% {
            transform: translate(-50%, -50%) rotate(450deg);
          }
        }
      `}</style>
    </div>
  );
};

export default GlowingBorderInput;
