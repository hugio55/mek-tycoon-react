'use client';

import React from 'react';

interface CubeSpinnerProps {
  size?: number;
  color?: 'gold' | 'cyan' | 'lime' | 'purple' | 'blue';
  speed?: 'normal' | 'slow';
}

const colorMap = {
  gold: { bg: 'rgba(250, 182, 23, 0.2)', border: '#fab617' },
  cyan: { bg: 'rgba(0, 255, 255, 0.2)', border: '#00ffff' },
  lime: { bg: 'rgba(0, 255, 128, 0.2)', border: '#00ff80' },
  purple: { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' },
  blue: { bg: 'rgba(0, 77, 255, 0.2)', border: '#004dff' },
};

export default function CubeSpinner({ size = 44, color = 'gold', speed = 'normal' }: CubeSpinnerProps) {
  const { bg, border } = colorMap[color];
  const halfSize = size / 2;
  const animationDuration = speed === 'slow' ? '3s' : '2s';

  const spinnerStyle: React.CSSProperties = {
    width: size,
    height: size,
    animation: `cubeSpinAnimation ${animationDuration} infinite ease`,
    transformStyle: 'preserve-3d',
  };

  const faceBase: React.CSSProperties = {
    backgroundColor: bg,
    height: '100%',
    position: 'absolute',
    width: '100%',
    border: `2px solid ${border}`,
  };

  return (
    <>
      <style>
        {`
          @keyframes cubeSpinAnimation {
            0% {
              transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
            }
            50% {
              transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
            }
            100% {
              transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
            }
          }
        `}
      </style>

      <div style={spinnerStyle}>
        <div style={{ ...faceBase, transform: `translateZ(-${halfSize}px) rotateY(180deg)` }} />
        <div style={{ ...faceBase, transform: 'rotateY(-270deg) translateX(50%)', transformOrigin: 'top right' }} />
        <div style={{ ...faceBase, transform: 'rotateY(270deg) translateX(-50%)', transformOrigin: 'center left' }} />
        <div style={{ ...faceBase, transform: 'rotateX(90deg) translateY(-50%)', transformOrigin: 'top center' }} />
        <div style={{ ...faceBase, transform: 'rotateX(-90deg) translateY(50%)', transformOrigin: 'bottom center' }} />
        <div style={{ ...faceBase, transform: `translateZ(${halfSize}px)` }} />
      </div>
    </>
  );
}
