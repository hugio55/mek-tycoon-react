'use client';

import React from 'react';

interface TenureProgressBarProps {
  currentTenure: number;
  maxTenure: number;
  onLevelUp?: () => void;
  showLevelUpButton?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: 'default' | 'compact' | 'detailed';
}

export const TenureProgressBar: React.FC<TenureProgressBarProps> = ({
  currentTenure,
  maxTenure,
  onLevelUp,
  showLevelUpButton = true,
  className = '',
  size = 'md',
  style = 'default'
}) => {
  const percentage = Math.min((currentTenure / maxTenure) * 100, 100);
  const isComplete = percentage >= 100;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'h-8',
      barHeight: 'h-5',
      fontSize: 'text-xs',
      labelSize: 'text-[10px]',
      buttonPadding: 'px-3 py-1',
      buttonText: 'text-xs'
    },
    md: {
      container: 'h-12',
      barHeight: 'h-7',
      fontSize: 'text-sm',
      labelSize: 'text-xs',
      buttonPadding: 'px-6 py-2',
      buttonText: 'text-sm'
    },
    lg: {
      container: 'h-16',
      barHeight: 'h-9',
      fontSize: 'text-base',
      labelSize: 'text-sm',
      buttonPadding: 'px-8 py-3',
      buttonText: 'text-base'
    }
  };

  const config = sizeConfig[size];

  if (style === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Compact Progress Bar */}
        <div className="flex-1 relative">
          <div className={`
            ${config.barHeight}
            relative overflow-hidden
            bg-black/60 border border-yellow-500/30
            backdrop-blur-sm
          `}>
            {/* Fill */}
            <div
              className="h-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${percentage}%`,
                background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.6), rgba(250, 182, 23, 0.9), rgba(255, 215, 0, 0.8))'
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: 'shimmer 2s linear infinite',
                  backgroundSize: '200% 100%'
                }}
              />
            </div>

            {/* Progress text overlay */}
            <div className={`
              absolute inset-0 flex items-center justify-center
              ${config.fontSize} font-bold tracking-wider
              text-yellow-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]
            `}>
              {currentTenure.toFixed(0)} / {maxTenure.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Level Up Button */}
        {isComplete && showLevelUpButton && onLevelUp && (
          <button
            onClick={onLevelUp}
            className={`
              ${config.buttonPadding}
              ${config.buttonText}
              relative font-bold text-black bg-yellow-400
              transition-all duration-200 uppercase tracking-wider
              hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.6)]
              border-2 border-yellow-500/50
              whitespace-nowrap
            `}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)'
            }}
          >
            LEVEL UP
          </button>
        )}
      </div>
    );
  }

  if (style === 'detailed') {
    return (
      <div className={`${className}`}>
        {/* Header with label and stats */}
        <div className="flex justify-between items-center mb-2">
          <span className={`${config.labelSize} text-gray-400 uppercase tracking-wider font-medium`}>
            Mek Tenure
          </span>
          <span className={`${config.fontSize} text-yellow-400 font-mono font-semibold`}>
            {currentTenure.toFixed(1)} / {maxTenure.toFixed(0)}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className={`
          ${config.container}
          relative overflow-hidden
          mek-card-industrial mek-border-sharp-gold
        `}>
          {/* Background hazard stripes */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(250, 182, 23, 0.1) 10px,
                rgba(250, 182, 23, 0.1) 20px
              )`
            }}
          />

          {/* Progress Fill */}
          <div
            className={`
              ${config.barHeight}
              absolute top-1/2 left-1 right-1 -translate-y-1/2
              transition-all duration-700 ease-out
              relative overflow-hidden
            `}
            style={{
              width: `calc(${percentage}% - 8px)`,
              background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.7), rgba(250, 182, 23, 1), rgba(255, 215, 0, 0.9))',
              boxShadow: isComplete ? '0 0 20px rgba(250, 182, 23, 0.8)' : '0 0 10px rgba(250, 182, 23, 0.4)'
            }}
          >
            {/* Animated particles sweep */}
            <div className="absolute inset-0 mek-success-bar-particles" />

            {/* Scan line effect */}
            {isComplete && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                style={{
                  animation: 'mek-scan-line 3s linear infinite'
                }}
              />
            )}
          </div>

          {/* Percentage text */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${config.fontSize} font-bold tracking-wider
            text-yellow-400 drop-shadow-[0_0_6px_rgba(0,0,0,1)]
            mek-text-industrial
          `}>
            {percentage.toFixed(1)}%
          </div>

          {/* Metal scratches overlay */}
          <div className="mek-overlay-scratches" />
        </div>

        {/* Level Up Button */}
        {isComplete && showLevelUpButton && onLevelUp && (
          <button
            onClick={onLevelUp}
            className="
              mt-3 w-full
              mek-button-primary
              mek-pulse
            "
          >
            <span className="relative z-10">LEVEL UP READY</span>
          </button>
        )}
      </div>
    );
  }

  // Default style
  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className={`${config.labelSize} text-gray-400 uppercase tracking-wider font-medium`}>
          Tenure Progress
        </span>
        <span className={`${config.fontSize} text-yellow-400 font-mono`}>
          {currentTenure.toFixed(0)} / {maxTenure.toFixed(0)}
        </span>
      </div>

      {/* Progress Container */}
      <div className="flex items-center gap-3">
        {/* Progress Bar */}
        <div className={`
          flex-1 ${config.barHeight}
          relative overflow-hidden
          bg-black/60 border-2 border-yellow-500/40
          backdrop-blur-sm
        `}>
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)
              `
            }}
          />

          {/* Fill with gradient */}
          <div
            className="h-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.8), rgba(250, 182, 23, 1), rgba(255, 255, 255, 0.2))',
              boxShadow: '0 0 15px rgba(250, 182, 23, 0.5)'
            }}
          >
            {/* Shimmer animation */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'mek-shimmer 3s linear infinite'
              }}
            />

            {/* Particle sweep when complete */}
            {isComplete && (
              <div className="mek-success-bar-particles" />
            )}
          </div>

          {/* Center text */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${config.fontSize} font-bold tracking-wider
            text-yellow-400 drop-shadow-[0_0_6px_rgba(0,0,0,1)]
          `}>
            {percentage.toFixed(0)}%
          </div>

          {/* Corner cuts effect */}
          <div
            className="absolute top-0 left-0 w-2 h-2 bg-black/80 pointer-events-none"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 bg-black/80 pointer-events-none"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
          />
        </div>

        {/* Level Up Button */}
        {isComplete && showLevelUpButton && onLevelUp && (
          <button
            onClick={onLevelUp}
            className={`
              ${config.buttonPadding}
              ${config.buttonText}
              relative font-bold text-black bg-yellow-400
              transition-all duration-200 uppercase tracking-wider
              hover:bg-yellow-300
              hover:transform hover:-translate-y-0.5
              whitespace-nowrap
            `}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            LEVEL UP
          </button>
        )}
      </div>
    </div>
  );
};

export default TenureProgressBar;
