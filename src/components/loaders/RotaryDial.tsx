'use client';

import React, { useState, useMemo } from 'react';

interface RotaryDialProps {
  options?: string[];
  defaultIndex?: number;
  onChange?: (index: number, label: string) => void;
  color?: 'gold' | 'cyan' | 'silver';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Rotary Dial - Transformed from Uiverse.io by Pradeepsaranbishnoi
 *
 * Original: Silver/gray 6-position rotary switch with light indicator
 * Transformed: Gold/Cyan/Silver variants matching Mek Tycoon design
 * Features: Rotating dial with position indicator, light glow, 3D layered rings
 * Supports any number of options (3, 6, 10, etc.) - positions calculated dynamically
 */
export default function RotaryDial({
  options = ['OFF', '1', '2', '3', '4', '5'],
  defaultIndex = 0,
  onChange,
  color = 'gold',
  size = 'md',
  className = ''
}: RotaryDialProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const sizeConfig = {
    sm: { outer: 150, scale: 0.65 },
    md: { outer: 230, scale: 1 },
    lg: { outer: 300, scale: 1.3 }
  };

  const colorConfig = {
    gold: {
      outerRing: 'radial-gradient(ellipse at center, #b8860b 0%, #3d2e00 100%)',
      innerRing: 'linear-gradient(to bottom, #f2f6f5 0%, #b8860b 100%)',
      middleRing: 'linear-gradient(to bottom, #b8860b 0%, #f2f6f5 100%)',
      centerKnob: 'linear-gradient(to bottom, #faf6e5 0%, #8d7a3a 100%)',
      lightGlow: 'radial-gradient(ellipse at center, rgba(250, 182, 23, 1) 0%, rgba(250, 182, 23, 0.42) 42%, rgba(184, 134, 11, 0) 72%, rgba(67, 34, 0, 0) 100%)',
      dotColor: 'linear-gradient(to bottom, #fab617 0%, #ffd700 100%)',
      textColor: 'rgba(250, 182, 23, 0.5)',
      selectedTextColor: '#ffffff',
      selectedTextShadow: '0 0 10px #fab617, 0 0 20px #fab617',
      textShadow: '0 1px 0 #3d2e00',
      lineTop: '#5a4a1a',
      lineBottom: '#b8860b',
      pointerColor: '#3d2e00',
      pointerGlow: '#fab617',
      segmentColor: 'rgba(250, 182, 23, 0.35)',
      segmentHoverColor: 'rgba(250, 182, 23, 0.15)'
    },
    cyan: {
      outerRing: 'radial-gradient(ellipse at center, #0077a3 0%, #002233 100%)',
      innerRing: 'linear-gradient(to bottom, #f2f6f5 0%, #00d4ff 100%)',
      middleRing: 'linear-gradient(to bottom, #00d4ff 0%, #f2f6f5 100%)',
      centerKnob: 'linear-gradient(to bottom, #e5f6fa 0%, #3a7a8d 100%)',
      lightGlow: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 1) 0%, rgba(0, 212, 255, 0.42) 42%, rgba(0, 119, 163, 0) 72%, rgba(0, 34, 67, 0) 100%)',
      dotColor: 'linear-gradient(to bottom, #00d4ff 0%, #80eaff 100%)',
      textColor: 'rgba(0, 212, 255, 0.5)',
      selectedTextColor: '#ffffff',
      selectedTextShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff',
      textShadow: '0 1px 0 #002233',
      lineTop: '#1a4a5a',
      lineBottom: '#00d4ff',
      pointerColor: '#002233',
      pointerGlow: '#00d4ff',
      segmentColor: 'rgba(0, 212, 255, 0.35)',
      segmentHoverColor: 'rgba(0, 212, 255, 0.15)'
    },
    silver: {
      outerRing: 'radial-gradient(ellipse at center, #888888 0%, #333333 100%)',
      innerRing: 'linear-gradient(to bottom, #f2f6f5 0%, #cbd5d6 100%)',
      middleRing: 'linear-gradient(to bottom, #cbd5d6 0%, #f2f6f5 100%)',
      centerKnob: 'linear-gradient(to bottom, #eef7f6 0%, #8d989a 100%)',
      lightGlow: 'radial-gradient(ellipse at center, rgba(184, 163, 204, 1) 0%, rgba(159, 197, 224, 0.42) 42%, rgba(111, 113, 179, 0) 72%, rgba(67, 34, 137, 0) 100%)',
      dotColor: 'linear-gradient(to bottom, #dae2e4 0%, #ecf5f4 100%)',
      textColor: 'rgba(200, 200, 200, 0.5)',
      selectedTextColor: '#ffffff',
      selectedTextShadow: '0 0 10px #ffffff, 0 0 20px #aaaaaa',
      textShadow: '0 1px 0 #444',
      lineTop: '#3c3d3f',
      lineBottom: '#666769',
      pointerColor: '#333',
      pointerGlow: '#fff',
      segmentColor: 'rgba(255, 255, 255, 0.25)',
      segmentHoverColor: 'rgba(255, 255, 255, 0.1)'
    }
  };

  // Calculate positions dynamically based on number of options
  // First option starts at top (-90°), then evenly distributed clockwise
  const positions = useMemo(() => {
    const count = options.length;
    const angleStep = 360 / count;
    return options.map((_, i) => -90 + (i * angleStep));
  }, [options]);

  // Generate divider lines - one between each pair of adjacent options
  const dividerAngles = useMemo(() => {
    const count = options.length;
    const angleStep = 360 / count;
    // Place dividers halfway between options
    return options.map((_, i) => -90 + (i * angleStep) + (angleStep / 2));
  }, [options]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onChange?.(index, options[index] || '');
  };

  const config = colorConfig[color];
  const sizeStyle = sizeConfig[size];

  // The label position angle (where the label sits on the dial)
  const labelAngle = positions[selectedIndex] ?? -90;

  // The pointer rotation needs +90° offset because pointer naturally points UP,
  // but CSS angles use 0° = right, 90° = down, -90° = up
  const pointerRotation = labelAngle + 90;

  // Calculate font size based on number of options (smaller text for more options)
  const getFontSize = () => {
    const count = options.length;
    if (count <= 4) return '16px';
    if (count <= 6) return '14px';
    if (count <= 8) return '13px';
    return '12px';
  };

  // Calculate the angle span for each segment (for pie slice highlighting)
  const angleStep = 360 / options.length;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        width: `${sizeStyle.outer}px`,
        height: `${sizeStyle.outer}px`,
        transform: `scale(${sizeStyle.scale})`,
        transformOrigin: 'center'
      }}
    >
      {/* Outer container with shadow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'transparent'
        }}
      >
        {/* Main dial ring (den) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '220px',
            height: '220px',
            left: '50%',
            top: '50%',
            marginLeft: '-110px',
            marginTop: '-110px',
            background: config.outerRing,
            boxShadow: 'inset 0 3px 10px rgba(0, 0, 0, 0.6), 0 2px 20px rgba(255, 255, 255, 1)'
          }}
        >
          {/* Highlighted segment (display only, below clickable layer) */}
          <svg
            className="absolute z-[0]"
            style={{
              width: '220px',
              height: '220px',
              left: '0',
              top: '0',
              pointerEvents: 'none'
            }}
            viewBox="0 0 220 220"
          >
            <path
              d={`M 110 110 L 110 0 A 110 110 0 ${angleStep > 180 ? 1 : 0} 1 ${
                110 + 110 * Math.sin((angleStep * Math.PI) / 180)
              } ${110 - 110 * Math.cos((angleStep * Math.PI) / 180)} Z`}
              fill={config.segmentColor}
              transform={`rotate(${labelAngle + 90 - angleStep / 2} 110 110)`}
              style={{ transition: 'transform 0.5s ease' }}
            />
          </svg>

          {/* Dynamic line dividers between options */}
          {dividerAngles.map((angle, i) => (
            <hr
              key={i}
              className="absolute z-[1]"
              style={{
                top: '50%',
                width: '100%',
                height: '0',
                marginTop: '-1px',
                borderWidth: '1px 0',
                borderStyle: 'solid',
                borderTopColor: config.lineTop,
                borderBottomColor: config.lineBottom,
                transform: `rotate(${angle}deg)`
              }}
            />
          ))}

          {/* Switch labels around the dial (display only) */}
          <div className="absolute inset-0 z-[3]" style={{ pointerEvents: 'none' }}>
            {options.map((label, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: '50%',
                    height: '70px',
                    marginTop: '-35px',
                    transformOrigin: '0% 50%',
                    transform: `rotate(${positions[index]}deg)`
                  }}
                >
                  <span
                    className="absolute font-bold text-center"
                    style={{
                      top: '0',
                      right: '0',
                      width: '40px',
                      height: '100%',
                      lineHeight: '70px',
                      fontSize: getFontSize(),
                      color: isSelected ? config.selectedTextColor : config.textColor,
                      textShadow: isSelected ? config.selectedTextShadow : config.textShadow,
                      transform: `rotate(${-positions[index]}deg)`,
                      transition: 'color 0.3s ease, text-shadow 0.3s ease'
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Light indicator - uses label angle directly (horizontal origin) */}
          <div
            className="absolute z-[1]"
            style={{
              left: '50%',
              top: '50%',
              width: '50%',
              height: '100px',
              marginTop: '-50px',
              transformOrigin: '0% 50%',
              transform: `rotate(${labelAngle}deg)`,
              transition: 'transform 0.5s ease'
            }}
          >
            <span
              className="absolute"
              style={{
                top: '0',
                left: '15px',
                width: '100px',
                height: '100px',
                opacity: 0.4,
                background: config.lightGlow
              }}
            />
          </div>

          {/* Dot indicator - uses label angle directly (horizontal origin) */}
          <div
            className="absolute z-[6]"
            style={{
              left: '50%',
              top: '50%',
              width: '50%',
              height: '12px',
              marginTop: '-6px',
              transformOrigin: '0% 50%',
              transform: `rotate(${labelAngle}deg)`,
              transition: 'transform 0.5s ease'
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                top: '0',
                left: '30px',
                width: '12px',
                height: '12px',
                background: config.dotColor,
                boxShadow: `0 0 8px ${color === 'gold' ? '#fab617' : color === 'cyan' ? '#00d4ff' : '#fff'}`
              }}
            />
          </div>

          {/* Inner ring 1 (dene) */}
          <div
            className="absolute z-[4] rounded-full"
            style={{
              width: '140px',
              height: '140px',
              left: '50%',
              top: '50%',
              marginLeft: '-70px',
              marginTop: '-70px',
              background: config.innerRing,
              boxShadow: 'inset 0 2px 2px rgba(255, 255, 255, 0.4), 0 3px 13px rgba(0, 0, 0, 0.85)'
            }}
          />

          {/* Inner ring 2 (denem) */}
          <div
            className="absolute z-[5] rounded-full"
            style={{
              width: '120px',
              height: '120px',
              left: '50%',
              top: '50%',
              marginLeft: '-60px',
              marginTop: '-60px',
              background: config.middleRing
            }}
          />

          {/* Center knob (deneme) */}
          <div
            className="absolute z-[6] rounded-full"
            style={{
              width: '100px',
              height: '100px',
              left: '50%',
              top: '50%',
              marginLeft: '-50px',
              marginTop: '-50px',
              background: config.centerKnob,
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.6), 0 8px 20px rgba(0, 0, 0, 0.9)'
            }}
          />

          {/* Center pointer indicator - needs +90° offset since pointer points UP */}
          <div
            className="absolute z-[7]"
            style={{
              left: '50%',
              top: '50%',
              width: '100px',
              height: '100px',
              marginLeft: '-50px',
              marginTop: '-50px',
              transform: `rotate(${pointerRotation}deg)`,
              transition: 'transform 0.5s ease',
              pointerEvents: 'none'
            }}
          >
            {/* Pointer line */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '50%',
                marginLeft: '-3px',
                width: '6px',
                height: '35px',
                background: `linear-gradient(to bottom, ${config.pointerGlow} 0%, ${config.pointerColor} 100%)`,
                borderRadius: '3px 3px 1px 1px',
                boxShadow: `0 0 6px ${config.pointerGlow}, inset 0 1px 2px rgba(255,255,255,0.5)`
              }}
            />
            {/* Pointer tip (triangle) */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '50%',
                marginLeft: '-6px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `10px solid ${config.pointerGlow}`,
                filter: `drop-shadow(0 0 3px ${config.pointerGlow})`
              }}
            />
            {/* Center cap */}
            <div
              className="absolute rounded-full"
              style={{
                top: '50%',
                left: '50%',
                width: '20px',
                height: '20px',
                marginLeft: '-10px',
                marginTop: '-10px',
                background: `radial-gradient(circle at 30% 30%, ${config.pointerGlow}, ${config.pointerColor})`,
                boxShadow: `0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3), 0 0 8px ${config.pointerGlow}`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
