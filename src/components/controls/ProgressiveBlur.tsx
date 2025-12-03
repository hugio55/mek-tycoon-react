'use client';

import React from 'react';

export interface ProgressiveBlurProps {
  className?: string;
  height?: string;
  position?: 'top' | 'bottom' | 'both';
  blurLevels?: number[];
}

const ProgressiveBlur: React.FC<ProgressiveBlurProps> = ({
  className = '',
  height = '30%',
  position = 'bottom',
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}) => {
  // Create array for middle blur layers
  const middleLayers = Array(blurLevels.length - 2).fill(null);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-0';
      case 'bottom':
        return 'bottom-0';
      case 'both':
        return 'inset-y-0';
      default:
        return 'bottom-0';
    }
  };

  const getMaskGradient = (startPercent: number, midPercent: number, endPercent: number) => {
    if (position === 'bottom') {
      return `linear-gradient(to bottom, rgba(0,0,0,0) ${startPercent}%, rgba(0,0,0,1) ${midPercent}%, rgba(0,0,0,1) ${endPercent}%, rgba(0,0,0,0) ${endPercent + 12.5}%)`;
    } else if (position === 'top') {
      return `linear-gradient(to top, rgba(0,0,0,0) ${startPercent}%, rgba(0,0,0,1) ${midPercent}%, rgba(0,0,0,1) ${endPercent}%, rgba(0,0,0,0) ${endPercent + 12.5}%)`;
    } else {
      return `linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)`;
    }
  };

  const getFirstLayerMask = () => {
    if (position === 'bottom') {
      return `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)`;
    } else if (position === 'top') {
      return `linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)`;
    } else {
      return `linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)`;
    }
  };

  const getLastLayerMask = () => {
    if (position === 'bottom') {
      return `linear-gradient(to bottom, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)`;
    } else if (position === 'top') {
      return `linear-gradient(to top, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)`;
    } else {
      return `linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)`;
    }
  };

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-10 ${getPositionClasses()} ${className}`}
      style={{
        height: position === 'both' ? '100%' : height,
      }}
    >
      {/* First blur layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          backdropFilter: `blur(${blurLevels[0]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[0]}px)`,
          maskImage: getFirstLayerMask(),
          WebkitMaskImage: getFirstLayerMask(),
        }}
      />

      {/* Middle blur layers */}
      {middleLayers.map((_, index) => {
        const blurIndex = index + 1;
        const startPercent = blurIndex * 12.5;
        const midPercent = (blurIndex + 1) * 12.5;
        const endPercent = (blurIndex + 2) * 12.5;
        const maskGradient = getMaskGradient(startPercent, midPercent, endPercent);

        return (
          <div
            key={`blur-${index}`}
            className="absolute inset-0"
            style={{
              zIndex: index + 2,
              backdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              WebkitBackdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              maskImage: maskGradient,
              WebkitMaskImage: maskGradient,
            }}
          />
        );
      })}

      {/* Last blur layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: blurLevels.length,
          backdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          maskImage: getLastLayerMask(),
          WebkitMaskImage: getLastLayerMask(),
        }}
      />
    </div>
  );
};

export default ProgressiveBlur;
