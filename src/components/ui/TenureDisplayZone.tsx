'use client';

import React from 'react';
import '@/styles/global-design-system.css';

/**
 * TENURE DISPLAY ZONE - Industrial-themed tenure progress overlay
 *
 * Designed for admin overlay editor display zones.
 * Shows tenure progress, numeric values, and Level Up button when ready.
 *
 * USAGE IN OVERLAY EDITOR:
 * - Position this component as a display zone on slot artwork
 * - Configure size via 'size' prop or CSS scale
 * - Shows current/max tenure + progress bar
 * - "Level Up" button appears when tenure >= max
 *
 * FUNCTIONAL STATES:
 * - Accumulating: Progress bar filling (0-99%)
 * - Ready: Bar at 100%, Level Up button active/glowing
 * - Not Slotted: Greyed out minimal state
 * - Buffed: Visual indicator if tenure rate is buffed
 */

export interface TenureDisplayZoneProps {
  /** Current tenure accumulated */
  currentTenure: number;

  /** Maximum tenure threshold for level up */
  maxTenure: number;

  /** Callback when Level Up button is clicked */
  onLevelUp?: () => void;

  /** Show the Level Up button when ready? (default: true) */
  showLevelUpButton?: boolean;

  /** Is this slot currently active/slotted? (default: true) */
  isSlotted?: boolean;

  /** Tenure accumulation rate per day (for buff indicator) */
  tenureRatePerDay?: number;

  /** Is tenure rate buffed? (default: false) */
  isTenureBuffed?: boolean;

  /** Buff multiplier to display (e.g., 1.5 for 1.5x rate) */
  buffMultiplier?: number;

  /** Display size variant */
  size?: 'small' | 'medium' | 'large';

  /** Display style variant */
  variant?: 'minimal' | 'standard' | 'detailed';

  /** Additional CSS classes */
  className?: string;

  /** Custom inline styles (for overlay positioning) */
  style?: React.CSSProperties;
}

export const TenureDisplayZone: React.FC<TenureDisplayZoneProps> = ({
  currentTenure,
  maxTenure,
  onLevelUp,
  showLevelUpButton = true,
  isSlotted = true,
  tenureRatePerDay,
  isTenureBuffed = false,
  buffMultiplier,
  size = 'medium',
  variant = 'standard',
  className = '',
  style = {}
}) => {
  const percentage = Math.min((currentTenure / maxTenure) * 100, 100);
  const isReady = percentage >= 100;

  // Size configurations for responsive scaling
  const sizeConfigs = {
    small: {
      containerWidth: 'w-40',
      barHeight: 'h-4',
      fontSize: 'text-xs',
      labelSize: 'text-[9px]',
      iconSize: 'text-xs',
      buttonPadding: 'px-2 py-1',
      buttonText: 'text-[10px]',
      gap: 'gap-1',
      padding: 'p-2'
    },
    medium: {
      containerWidth: 'w-56',
      barHeight: 'h-6',
      fontSize: 'text-sm',
      labelSize: 'text-[10px]',
      iconSize: 'text-sm',
      buttonPadding: 'px-4 py-2',
      buttonText: 'text-xs',
      gap: 'gap-2',
      padding: 'p-3'
    },
    large: {
      containerWidth: 'w-72',
      barHeight: 'h-8',
      fontSize: 'text-base',
      labelSize: 'text-xs',
      iconSize: 'text-base',
      buttonPadding: 'px-6 py-2',
      buttonText: 'text-sm',
      gap: 'gap-3',
      padding: 'p-4'
    }
  };

  const config = sizeConfigs[size];

  // Greyed out state when not slotted
  const greyedOutClasses = !isSlotted
    ? 'opacity-40 pointer-events-none grayscale'
    : '';

  // MINIMAL VARIANT - Just progress bar with numbers
  if (variant === 'minimal') {
    return (
      <div
        className={`
          ${config.containerWidth} ${config.padding}
          flex flex-col ${config.gap}
          bg-black/80 backdrop-blur-sm
          border border-yellow-500/30
          ${greyedOutClasses}
          ${className}
        `}
        style={style}
      >
        {/* Progress bar with text overlay */}
        <div className="relative">
          <div className={`
            ${config.barHeight}
            relative overflow-hidden
            bg-black/60 border border-yellow-500/20
          `}>
            {/* Fill */}
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background: isReady
                  ? 'linear-gradient(90deg, rgba(250, 182, 23, 0.8), rgba(255, 215, 0, 1), rgba(250, 182, 23, 0.8))'
                  : 'linear-gradient(90deg, rgba(250, 182, 23, 0.5), rgba(250, 182, 23, 0.7))',
                boxShadow: isReady ? '0 0 12px rgba(250, 182, 23, 0.8)' : 'none'
              }}
            >
              {/* Shimmer when ready */}
              {isReady && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: 'mek-shimmer 2s linear infinite',
                    backgroundSize: '200% 100%'
                  }}
                />
              )}
            </div>

            {/* Numeric display */}
            <div className={`
              absolute inset-0 flex items-center justify-center
              ${config.fontSize} font-bold tracking-wider
              text-yellow-400 drop-shadow-[0_0_4px_rgba(0,0,0,1)]
            `}>
              {currentTenure.toFixed(0)}/{maxTenure.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Level Up button (compact) */}
        {isReady && showLevelUpButton && onLevelUp && (
          <button
            onClick={onLevelUp}
            className={`
              ${config.buttonPadding} ${config.buttonText}
              w-full font-bold text-black bg-yellow-400
              hover:bg-yellow-300 transition-all duration-200
              uppercase tracking-wider
              border border-yellow-500/50
            `}
            style={{
              boxShadow: '0 0 15px rgba(250, 182, 23, 0.6)'
            }}
          >
            LEVEL UP
          </button>
        )}
      </div>
    );
  }

  // DETAILED VARIANT - Full industrial treatment
  if (variant === 'detailed') {
    return (
      <div
        className={`
          ${config.containerWidth} ${config.padding}
          mek-card-industrial mek-border-sharp-gold
          ${greyedOutClasses}
          ${className}
        `}
        style={style}
      >
        {/* Header with hazard stripes */}
        <div
          className={`
            ${config.padding}
            -m-${config.padding.split('-')[1]} mb-${config.gap.split('-')[1]}
            mek-header-industrial
            flex justify-between items-center
          `}
        >
          <span className={`${config.labelSize} text-yellow-400 uppercase tracking-wider font-bold mek-text-industrial`}>
            TENURE
          </span>
          {isTenureBuffed && buffMultiplier && (
            <span className={`${config.labelSize} text-green-400 font-bold tracking-wider flex items-center ${config.gap}`}>
              <span className={config.iconSize}>⚡</span>
              {buffMultiplier.toFixed(1)}x
            </span>
          )}
        </div>

        {/* Numeric display */}
        <div className={`flex justify-between items-center mb-${config.gap.split('-')[1]}`}>
          <span className={`${config.labelSize} text-gray-400 uppercase tracking-wider`}>
            PROGRESS
          </span>
          <span className={`${config.fontSize} text-yellow-400 font-mono font-semibold`}>
            {currentTenure.toFixed(1)} / {maxTenure.toFixed(0)}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className={`
          ${config.barHeight}
          relative overflow-hidden
          bg-black/60 border-2 border-yellow-500/40
        `}>
          {/* Background hazard pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 5px,
                rgba(250, 182, 23, 0.1) 5px,
                rgba(250, 182, 23, 0.1) 10px
              )`
            }}
          />

          {/* Progress fill */}
          <div
            className="h-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${percentage}%`,
              background: isReady
                ? 'linear-gradient(90deg, rgba(250, 182, 23, 0.9), rgba(255, 215, 0, 1), rgba(250, 182, 23, 0.9))'
                : 'linear-gradient(90deg, rgba(250, 182, 23, 0.6), rgba(250, 182, 23, 0.8))',
              boxShadow: isReady ? '0 0 20px rgba(250, 182, 23, 0.9)' : '0 0 8px rgba(250, 182, 23, 0.4)'
            }}
          >
            {/* Particle sweep effect */}
            {isReady && <div className="mek-success-bar-particles" />}

            {/* Scan line when ready */}
            {isReady && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                style={{
                  animation: 'mek-scan-line 3s linear infinite'
                }}
              />
            )}
          </div>

          {/* Percentage overlay */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${config.fontSize} font-bold tracking-wider
            text-yellow-400 drop-shadow-[0_0_6px_rgba(0,0,0,1)]
            mek-text-industrial
          `}>
            {percentage.toFixed(1)}%
          </div>

          {/* Metal scratches */}
          <div className="mek-overlay-scratches" />
        </div>

        {/* Tenure rate indicator */}
        {tenureRatePerDay !== undefined && (
          <div className={`mt-${config.gap.split('-')[1]} flex justify-between items-center`}>
            <span className={`${config.labelSize} text-gray-500 uppercase tracking-wider`}>
              RATE/DAY
            </span>
            <span className={`${config.labelSize} ${isTenureBuffed ? 'text-green-400' : 'text-gray-400'} font-mono`}>
              +{tenureRatePerDay.toFixed(1)}
            </span>
          </div>
        )}

        {/* Level Up Button */}
        {isReady && showLevelUpButton && onLevelUp && (
          <button
            onClick={onLevelUp}
            className={`
              mt-${config.gap.split('-')[1]} w-full
              mek-button-primary mek-pulse
            `}
          >
            <span className="relative z-10">LEVEL UP READY</span>
          </button>
        )}
      </div>
    );
  }

  // STANDARD VARIANT (default)
  return (
    <div
      className={`
        ${config.containerWidth} ${config.padding}
        bg-black/80 backdrop-blur-sm
        border-2 border-yellow-500/40
        ${greyedOutClasses}
        ${className}
      `}
      style={style}
    >
      {/* Header row */}
      <div className={`flex justify-between items-center mb-${config.gap.split('-')[1]}`}>
        <span className={`${config.labelSize} text-gray-400 uppercase tracking-wider font-medium`}>
          Mek Tenure
        </span>
        {isTenureBuffed && buffMultiplier && (
          <span className={`${config.labelSize} text-green-400 font-bold tracking-wider flex items-center gap-1`}>
            <span className={config.iconSize}>⚡</span>
            {buffMultiplier.toFixed(1)}x
          </span>
        )}
      </div>

      {/* Numeric display */}
      <div className={`flex justify-between items-center mb-${config.gap.split('-')[1]}`}>
        <span className={`${config.fontSize} text-yellow-400 font-mono font-semibold`}>
          {currentTenure.toFixed(1)} / {maxTenure.toFixed(0)}
        </span>
        <span className={`${config.labelSize} text-gray-500`}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`
        ${config.barHeight}
        relative overflow-hidden
        bg-black/60 border border-yellow-500/30
      `}>
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px),
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)
            `
          }}
        />

        {/* Fill */}
        <div
          className="h-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: isReady
              ? 'linear-gradient(90deg, rgba(250, 182, 23, 0.8), rgba(255, 215, 0, 1), rgba(255, 255, 255, 0.3))'
              : 'linear-gradient(90deg, rgba(250, 182, 23, 0.6), rgba(250, 182, 23, 0.8), rgba(255, 255, 255, 0.2))',
            boxShadow: isReady ? '0 0 15px rgba(250, 182, 23, 0.7)' : '0 0 8px rgba(250, 182, 23, 0.3)'
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'mek-shimmer 3s linear infinite'
            }}
          />

          {/* Particle sweep when complete */}
          {isReady && <div className="mek-success-bar-particles" />}
        </div>

        {/* Corner cuts */}
        <div
          className="absolute top-0 left-0 w-1.5 h-1.5 bg-black/80 pointer-events-none"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        <div
          className="absolute top-0 right-0 w-1.5 h-1.5 bg-black/80 pointer-events-none"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
        />
      </div>

      {/* Level Up Button */}
      {isReady && showLevelUpButton && onLevelUp && (
        <button
          onClick={onLevelUp}
          className={`
            mt-${config.gap.split('-')[1]} w-full
            ${config.buttonPadding} ${config.buttonText}
            font-bold text-black bg-yellow-400
            hover:bg-yellow-300 transition-all duration-200
            uppercase tracking-wider
          `}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)',
            boxShadow: '0 0 20px rgba(250, 182, 23, 0.7)'
          }}
        >
          LEVEL UP
        </button>
      )}
    </div>
  );
};

export default TenureDisplayZone;
