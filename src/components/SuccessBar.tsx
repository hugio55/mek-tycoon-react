'use client';

import React, { useMemo } from 'react';
import { DifficultyConfig, getDifficultyColors } from '@/lib/difficultyModifiers';

interface SuccessBarProps {
  currentSuccess: number; // Current success percentage (0-100)
  difficultyConfig: DifficultyConfig;
  mekContributions?: {
    mekId: string;
    name: string;
    rank: number;
    contribution: number;
  }[];
  showDetails?: boolean;
  height?: string;
  className?: string;
  baseRewards?: {
    gold: number;
    xp: number;
  };
  potentialRewards?: Array<{
    name: string;
    chance: number;
  }>;
  layoutStyle?: 1 | 2 | 3 | 4 | 5; // Layout variation selector
  subLayoutStyle?: 1.1 | 1.2 | 1.3 | 1.4 | 1.5; // Sub-layout for Layout 1
  meterVariant?: 1 | 2 | 3 | 4 | 5; // Success meter bar design variant
  statusCardVariant?: 1 | 2 | 3 | 4 | 5; // Mission status card layout variant
}

export default function SuccessBar({
  currentSuccess,
  difficultyConfig,
  mekContributions = [],
  showDetails = true,
  height = 'h-12',
  className = '',
  baseRewards = { gold: 100, xp: 50 },
  potentialRewards = [],
  layoutStyle = 1,
  subLayoutStyle = 1.3,
  meterVariant = 1,
  statusCardVariant = 3
}: SuccessBarProps) {
  const colors = getDifficultyColors(difficultyConfig.difficulty);
  const greenLine = difficultyConfig.successGreenLine;

  // Calculate overshoot bonus if applicable
  const overshootBonus = useMemo(() => {
    if (currentSuccess <= greenLine) return 0;
    const overshoot = currentSuccess - greenLine;
    const bonus = overshoot * difficultyConfig.overshootBonusRate;
    return Math.min(bonus, difficultyConfig.maxOvershootBonus);
  }, [currentSuccess, greenLine, difficultyConfig]);

  // Determine success likelihood term based on percentage RELATIVE to green line
  const getSuccessLikelihood = (currentPercent: number, greenLinePercent: number) => {
    // If we're at or past the green line, it's certain
    if (currentPercent >= greenLinePercent) return 'Certain';

    // Calculate percentage of the way to the green line (0-100%)
    // Avoid division by zero
    if (greenLinePercent === 0) return 'Certain';
    const relativePercent = (currentPercent / greenLinePercent) * 100;

    if (relativePercent === 0) return 'Impossible';
    if (relativePercent <= 5) return 'Extremely Unlikely';
    if (relativePercent < 20) return 'Very Unlikely';
    if (relativePercent < 35) return 'Unlikely';
    if (relativePercent < 45) return 'Doubtful';
    if (relativePercent < 55) return 'Uncertain';
    if (relativePercent < 65) return 'Possible';
    if (relativePercent < 80) return 'Likely';
    if (relativePercent < 90) return 'Very Likely';
    if (relativePercent < 95) return 'Highly Likely';
    return 'Extremely Likely';
  };

  // Render the success meter based on variant
  const renderSuccessMeter = () => {
    const barHeight = meterVariant === 1 ? height :
                     meterVariant === 4 ? 'h-6' : 'h-5'; // Variant 4 gets thickest bar

    // Variant 1: Neon-Quantum Hybrid - Clean Neon with Quantum Particle Overdrive
    if (meterVariant === 1) {
      // Calculate bar color based on percentage relative to green line
      const getBarColor = () => {
        if (currentSuccess >= greenLine) {
          return '#00ff00'; // Bright neon green when past goal
        }
        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 0;
        if (relativePercent < 33) return '#dc2626'; // Red
        if (relativePercent < 66) return '#f59e0b'; // Orange
        if (relativePercent < 90) return '#eab308'; // Yellow
        return '#84cc16'; // Yellow-green when close
      };

      return (
        <>
          {/* Title - Using yellow glowing font */}
          <div className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-3 text-center"
               style={{
                 textShadow: '0 0 10px rgba(250, 204, 21, 0.5), 0 0 20px rgba(250, 204, 21, 0.3)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            SUCCESS METER
          </div>

          {/* Main Success Bar */}
          <div className={`relative ${height} bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700`}>
            {/* Background zones */}
            <div className="absolute inset-0 flex">
              {/* Risk zone (0 to green line) */}
              <div
                className="bg-gradient-to-r from-red-900/20 to-red-900/10"
                style={{ width: `${greenLine}%` }}
              />
              {/* Bonus zone (green line to 100) */}
              <div
                className="bg-gradient-to-r from-green-900/10 to-green-900/20 flex-1"
              />
            </div>

            {/* Success fill bar - solid color that changes */}
            <div className="absolute inset-y-0 left-0 flex">
              {/* Normal progress up to green line */}
              <div
                className="transition-all duration-500 ease-out relative"
                style={{
                  width: `${Math.min(greenLine, currentSuccess)}%`,
                  backgroundColor: getBarColor(),
                  boxShadow: `inset 0 0 10px rgba(0,0,0,0.3)`
                }}
              />

              {/* Quantum-Neon Hyperdrive section past green line */}
              {currentSuccess > greenLine && (
                <div
                  className="relative"
                  style={{
                    width: `${currentSuccess - greenLine}%`,
                    backgroundColor: '#00ff00',
                    boxShadow: '0 0 30px #00ff00, inset 0 0 25px rgba(255,255,255,0.5)',
                    filter: 'brightness(1.4) saturate(1.2)'
                  }}
                >
                  {/* Quantum particles layer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `repeating-radial-gradient(
                        circle at 0% 50%,
                        transparent 0,
                        transparent 5px,
                        rgba(255, 255, 255, 0.9) 5px,
                        rgba(255, 255, 255, 0.9) 6px,
                        transparent 6px,
                        transparent 12px
                      )`,
                      backgroundSize: '25px 100%',
                      animation: 'quantum-particles 0.7s linear infinite',
                      filter: 'brightness(1.8) blur(0.3px)',
                      mixBlendMode: 'screen'
                    }}
                  />

                  {/* Neon pulse overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent)',
                      animation: 'pulse 1.2s ease-in-out infinite'
                    }}
                  />

                  {/* Diagonal stripes for added intensity */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      background: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 8px,
                        rgba(255, 255, 255, 0.15) 8px,
                        rgba(255, 255, 255, 0.15) 16px
                      )`,
                      animation: 'slide-stripes 0.4s linear infinite',
                      opacity: 0.7
                    }}
                  />

                  {/* Energy glow core */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0,255,200,0.3) 0%, transparent 70%)',
                      animation: 'overdrive-pulse 0.8s ease-in-out infinite'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Green line marker - extended beyond bar boundaries */}
            <div
              className="absolute z-20"
              style={{
                left: `calc(${greenLine}% - 2px)`,
                width: '4px',
                top: '-8px',
                bottom: '-8px'
              }}
            >
              {/* Black background for contrast */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: '#000000',
                  width: '4px'
                }}
              />
              {/* Bright green line */}
              <div
                className="absolute"
                style={{
                  left: '1px',
                  width: '2px',
                  top: 0,
                  bottom: 0,
                  backgroundColor: '#00ff00',
                  boxShadow: `0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px ${colors.glow}`,
                  filter: 'brightness(1.5)'
                }}
              />
            </div>

            {/* Current percentage marker (if not at 0) */}
            {currentSuccess > 0 && currentSuccess < 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/50 transition-all duration-500"
                style={{ left: `${currentSuccess}%` }}
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/50" />
                </div>
              </div>
            )}
          </div>

          {/* Percentage indicator directly under goalpost line */}
          <div className="relative mt-1" style={{ height: '20px' }}>
            <div
              className="absolute text-xs font-bold text-green-400"
              style={{
                left: `${greenLine}%`,
                transform: 'translateX(-50%)',
                top: '2px',
                textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
              }}
            >
              {greenLine}%
            </div>
          </div>
        </>
      );
    }

    // Variant 2: Electric Surge with Lightning Effect
    if (meterVariant === 2) {
      const getBarColor = () => {
        if (currentSuccess >= greenLine) return '#00ff00';
        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 0;
        if (relativePercent < 40) return '#dc2626'; // Red
        if (relativePercent < 70) return '#f59e0b'; // Orange
        return '#eab308'; // Yellow
      };

      return (
        <>
          {/* Title */}
          <div className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-3 text-center"
               style={{
                 textShadow: '0 0 10px rgba(250, 204, 21, 0.5), 0 0 20px rgba(250, 204, 21, 0.3)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            SUCCESS METER
          </div>

          {/* Electric Bar */}
          <div className={`relative ${height} bg-black border-2 border-gray-600 overflow-hidden`}>
            {/* Normal progress */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-300"
              style={{
                width: `${Math.min(greenLine, currentSuccess)}%`,
                backgroundColor: getBarColor(),
                boxShadow: currentSuccess > 0 ? `inset 0 0 10px ${getBarColor()}` : 'none'
              }}
            />

            {/* Electric hyperdrive section */}
            {currentSuccess > greenLine && (
              <div
                className="absolute inset-y-0"
                style={{
                  left: `${greenLine}%`,
                  width: `${currentSuccess - greenLine}%`,
                  background: 'linear-gradient(90deg, #00ff00, #00ffff, #00ff00)',
                  boxShadow: '0 0 30px #00ff00, inset 0 0 20px rgba(255,255,255,0.5)',
                  filter: 'brightness(1.4) contrast(1.2)'
                }}
              >
                {/* Lightning bolts animation */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 20px,
                      rgba(255, 255, 255, 0.6) 20px,
                      rgba(255, 255, 255, 0.6) 22px,
                      transparent 22px,
                      transparent 40px,
                      rgba(255, 255, 255, 0.4) 40px,
                      rgba(255, 255, 255, 0.4) 41px
                    )`,
                    animation: 'electric-surge 0.3s linear infinite'
                  }}
                />
                {/* Spark effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 70%)',
                    animation: 'spark-flash 0.5s ease-in-out infinite alternate'
                  }}
                />
              </div>
            )}

            {/* Goal marker */}
            <div
              className="absolute z-20"
              style={{
                left: `${greenLine}%`,
                top: '-10px',
                bottom: '-10px',
                width: '3px',
                backgroundColor: '#00ff00',
                boxShadow: '0 0 15px #00ff00, 0 0 30px #00ff00'
              }}
            />
          </div>

          {/* Percentage indicator */}
          <div className="relative mt-2" style={{ height: '20px' }}>
            <div
              className="absolute text-xs font-bold text-green-400"
              style={{
                left: `${greenLine}%`,
                transform: 'translateX(-50%)',
                textShadow: '0 0 8px #00ff00'
              }}
            >
              {greenLine}%
            </div>
          </div>
        </>
      );
    }

    // Variant 3: Plasma Core with Energy Overflow
    if (meterVariant === 3) {
      const getBarColor = () => {
        if (currentSuccess >= greenLine) return '#00ff00';
        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 0;
        if (relativePercent < 50) return '#ff0000'; // Pure red
        if (relativePercent < 80) return '#ff9500'; // Orange
        return '#ffff00'; // Yellow
      };

      return (
        <>
          {/* Title */}
          <div className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-3 text-center"
               style={{
                 textShadow: '0 0 10px rgba(250, 204, 21, 0.5), 0 0 20px rgba(250, 204, 21, 0.3)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            SUCCESS METER
          </div>

          {/* Plasma Bar */}
          <div className={`relative ${height} bg-gradient-to-b from-gray-950 to-black rounded overflow-hidden border border-gray-700`}>
            {/* Normal progress */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-400"
              style={{
                width: `${Math.min(greenLine, currentSuccess)}%`,
                backgroundColor: getBarColor(),
                boxShadow: `0 0 20px ${getBarColor()}, inset 0 0 15px rgba(0,0,0,0.3)`,
                filter: 'brightness(1.1)'
              }}
            >
              {/* Energy ripple effect */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 60%)',
                  animation: 'ripple 2s ease-out infinite'
                }}
              />
            </div>

            {/* Plasma hyperdrive section */}
            {currentSuccess > greenLine && (
              <div
                className="absolute inset-y-0"
                style={{
                  left: `${greenLine}%`,
                  width: `${currentSuccess - greenLine}%`,
                  background: 'linear-gradient(90deg, #00ff00, #00ff88, #00ffaa, #00ff88, #00ff00)',
                  backgroundSize: '200% 100%',
                  animation: 'plasma-flow 1s linear infinite',
                  boxShadow: '0 0 40px #00ff00, inset 0 0 30px rgba(255,255,255,0.6)',
                  filter: 'brightness(1.5) saturate(2)'
                }}
              >
                {/* Plasma bubbles */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 20%),
                                     radial-gradient(circle at 60% 30%, rgba(255,255,255,0.6) 0%, transparent 15%),
                                     radial-gradient(circle at 80% 70%, rgba(255,255,255,0.7) 0%, transparent 25%)`,
                    animation: 'bubble-float 2s ease-in-out infinite'
                  }}
                />
              </div>
            )}

            {/* Goal marker */}
            <div
              className="absolute z-20"
              style={{
                left: `calc(${greenLine}% - 2px)`,
                top: '-12px',
                bottom: '-12px',
                width: '4px',
                background: 'linear-gradient(180deg, transparent, #00ff00, #00ff00, transparent)',
                boxShadow: '0 0 20px #00ff00'
              }}
            />
          </div>

          {/* Percentage indicator */}
          <div className="relative mt-2" style={{ height: '20px' }}>
            <div
              className="absolute text-xs font-bold"
              style={{
                left: `${greenLine}%`,
                transform: 'translateX(-50%)',
                color: '#00ff00',
                textShadow: '0 0 10px #00ff00'
              }}
            >
              {greenLine}%
            </div>
          </div>
        </>
      );
    }

    // Variant 4: Quantum Overdrive with Particle Effects
    if (meterVariant === 4) {
      const getBarColor = () => {
        if (currentSuccess >= greenLine) return '#00ff00';
        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 0;
        if (relativePercent < 35) return '#cc0000'; // Dark red
        if (relativePercent < 65) return '#ff6600'; // Orange
        if (relativePercent < 85) return '#ffcc00'; // Gold yellow
        return '#ccff00'; // Yellow-green
      };

      return (
        <>
          {/* Title */}
          <div className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-3 text-center"
               style={{
                 textShadow: '0 0 10px rgba(250, 204, 21, 0.5), 0 0 20px rgba(250, 204, 21, 0.3)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            SUCCESS METER
          </div>

          {/* Quantum Bar */}
          <div className={`relative ${height} bg-black rounded-sm overflow-hidden border-2 border-gray-800`}>
            {/* Dark matter background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-black to-purple-900/10" />

            {/* Normal progress */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                width: `${Math.min(greenLine, currentSuccess)}%`,
                backgroundColor: getBarColor(),
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.4)`,
                filter: 'brightness(0.9)'
              }}
            />

            {/* Quantum hyperdrive section */}
            {currentSuccess > greenLine && (
              <div
                className="absolute inset-y-0"
                style={{
                  left: `${greenLine}%`,
                  width: `${currentSuccess - greenLine}%`,
                  backgroundColor: '#00ff00'
                }}
              >
                {/* Quantum particles */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `repeating-radial-gradient(
                      circle at 0% 50%,
                      transparent 0,
                      transparent 5px,
                      rgba(255, 255, 255, 0.8) 5px,
                      rgba(255, 255, 255, 0.8) 7px,
                      transparent 7px,
                      transparent 15px
                    )`,
                    backgroundSize: '30px 100%',
                    animation: 'quantum-particles 0.8s linear infinite',
                    filter: 'brightness(2) blur(0.5px)',
                    mixBlendMode: 'screen'
                  }}
                />
                {/* Overdrive glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,255,0,0.8), rgba(0,255,200,0.6), rgba(0,255,0,0.8))',
                    animation: 'overdrive-pulse 0.6s ease-in-out infinite',
                    filter: 'blur(3px)'
                  }}
                />
              </div>
            )}

            {/* Goal marker */}
            <div
              className="absolute z-20"
              style={{
                left: `${greenLine}%`,
                top: '-15px',
                bottom: '-15px',
                width: '2px',
                backgroundColor: '#00ff00',
                boxShadow: '0 0 25px #00ff00, 0 0 50px #00ff00',
                filter: 'brightness(2)'
              }}
            />
          </div>

          {/* Percentage indicator */}
          <div className="relative mt-2" style={{ height: '20px' }}>
            <div
              className="absolute text-xs font-bold text-green-400"
              style={{
                left: `${greenLine}%`,
                transform: 'translateX(-50%)',
                textShadow: '0 0 12px #00ff00'
              }}
            >
              {greenLine}%
            </div>
          </div>
        </>
      );
    }

    // Variant 5: Neon Reactor with Meltdown Effect
    if (meterVariant === 5) {
      const getBarColor = () => {
        if (currentSuccess >= greenLine) return '#00ff00';
        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 0;
        if (relativePercent < 30) return '#ff0044'; // Neon red
        if (relativePercent < 60) return '#ff4400'; // Neon orange
        if (relativePercent < 85) return '#ffaa00'; // Neon yellow-orange
        return '#ffff00'; // Neon yellow
      };

      return (
        <>
          {/* Title */}
          <div className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-3 text-center"
               style={{
                 textShadow: '0 0 10px rgba(250, 204, 21, 0.5), 0 0 20px rgba(250, 204, 21, 0.3)',
                 fontFamily: 'Orbitron, monospace'
               }}>
            SUCCESS METER
          </div>

          {/* Neon Reactor Bar */}
          <div className={`relative ${height} bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden`}
               style={{
                 border: '1px solid #333',
                 boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
               }}>
            {/* Reactor grid */}
            <div className="absolute inset-0 opacity-20"
                 style={{
                   backgroundImage: 'linear-gradient(0deg, transparent 49%, #222 50%, transparent 51%)',
                   backgroundSize: '100% 4px'
                 }}
            />

            {/* Normal progress with neon glow */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-600"
              style={{
                width: `${Math.min(greenLine, currentSuccess)}%`,
                backgroundColor: getBarColor(),
                boxShadow: `0 0 30px ${getBarColor()}, inset 0 0 15px rgba(255,255,255,0.2)`,
                filter: 'brightness(1.2) saturate(1.5)'
              }}
            >
              {/* Reactor pulse */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                  animation: 'reactor-pulse 1.5s ease-in-out infinite'
                }}
              />
            </div>

            {/* Reactor meltdown section (hyperdrive) */}
            {currentSuccess > greenLine && (
              <div
                className="absolute inset-y-0"
                style={{
                  left: `${greenLine}%`,
                  width: `${currentSuccess - greenLine}%`
                }}
              >
                {/* Base meltdown glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: '#00ff00',
                    boxShadow: '0 0 50px #00ff00, inset 0 0 30px rgba(255,255,255,0.8)',
                    filter: 'brightness(1.8) contrast(1.2)'
                  }}
                />
                {/* Radioactive waves */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `repeating-conic-gradient(
                      from 0deg at 50% 50%,
                      transparent 0deg,
                      rgba(255, 255, 255, 0.9) 10deg,
                      transparent 20deg,
                      transparent 40deg
                    )`,
                    animation: 'reactor-spin 2s linear infinite',
                    mixBlendMode: 'overlay'
                  }}
                />
                {/* Critical warning stripes */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 8px,
                      rgba(255, 255, 0, 0.5) 8px,
                      rgba(255, 255, 0, 0.5) 16px
                    )`,
                    animation: 'warning-scroll 1s linear infinite',
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
            )}

            {/* Goal marker - warning beacon */}
            <div
              className="absolute z-20"
              style={{
                left: `calc(${greenLine}% - 1px)`,
                top: '-20px',
                bottom: '-20px',
                width: '2px',
                background: 'linear-gradient(180deg, transparent, #00ff00 20%, #00ff00 80%, transparent)',
                boxShadow: '0 0 30px #00ff00, 0 0 60px #00ff00',
                animation: currentSuccess > greenLine ? 'beacon-pulse 0.5s ease-in-out infinite' : 'none'
              }}
            />
          </div>

          {/* Percentage indicator */}
          <div className="relative mt-2" style={{ height: '20px' }}>
            <div
              className="absolute text-xs font-bold"
              style={{
                left: `${greenLine}%`,
                transform: 'translateX(-50%)',
                color: currentSuccess > greenLine ? '#ffff00' : '#00ff00',
                textShadow: currentSuccess > greenLine
                  ? '0 0 15px #ffff00, 0 0 30px #ff0000'
                  : '0 0 10px #00ff00',
                animation: currentSuccess > greenLine ? 'warning-flash 0.5s ease-in-out infinite' : 'none'
              }}
            >
              {greenLine}%
            </div>
          </div>
        </>
      );
    }


    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {renderSuccessMeter()}

      {/* Industrial Success & Rewards Panel - 5 Layout Variations */}
      <div className="mt-4 relative">
        {/* VARIATION 1: Vertical Stack with Status Card Variations */}
        {layoutStyle === 1 && (
          <>
            {/* Status Card Variation 1: Split Layout - Mission left, Overshoot right */}
            {statusCardVariant === 1 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Top Row - Mission Status LEFT, Overshoot RIGHT */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                      <div className={`font-bold font-['Orbitron'] uppercase ${
                        (() => {
                          const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                          const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                          const colorClass = relativePercent >= 100 ? 'text-green-400' :
                                 relativePercent >= 65 ? 'text-yellow-400' :
                                 relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                          const textSize = likelihood.length > 13 ? 'text-lg' : 'text-xl';
                          return `${colorClass} ${textSize}`;
                        })()
                      }`}>
                        {getSuccessLikelihood(currentSuccess, greenLine)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">OVERSHOOT</div>
                      <div className={`text-2xl font-bold font-['Orbitron'] ${
                        overshootBonus > 0 ? 'text-green-400' : 'text-gray-600'
                      }`} style={overshootBonus > 0 ? {
                        textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                        filter: 'brightness(1.2)'
                      } : {}}>
                        {overshootBonus.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Rewards Section */}
                  <div className="relative">
                    {/* Stats Area */}
                    <div className={`px-4 py-3 space-y-1 ${currentSuccess < greenLine ? 'blur-sm' : ''}`}>
                      {/* Gold */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-yellow-500">Gold:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                          </span>
                          <span className="text-xs text-yellow-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-yellow-400">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-blue-500">XP:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                          </span>
                          <span className="text-xs text-blue-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-blue-400">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Essence */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-green-500">Essence:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                          </span>
                          <span className="text-xs text-green-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-green-400">
                            {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Warning Overlay - Positioned over stats */}
                    {currentSuccess < greenLine && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-900/90 border border-red-500/50 px-4 py-2 rounded shadow-lg">
                          <div className="text-center">
                            <div className="text-xs text-red-400 font-bold">
                              You are {(greenLine - currentSuccess).toFixed(0)}% below the overshoot zone
                            </div>
                            <div className="text-[10px] text-red-300 mt-1">
                              Add more Meks or choose an easier difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Card Variation 2: Centered Balance */}
            {statusCardVariant === 2 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Top Row - Centered with Floating Overshoot Badge */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3 relative">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MISSION STATUS</div>
                      <div className={`font-bold font-['Orbitron'] uppercase ${
                        (() => {
                          const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                          const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                          const colorClass = relativePercent >= 100 ? 'text-green-400' :
                                 relativePercent >= 65 ? 'text-yellow-400' :
                                 relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                          const textSize = likelihood.length > 13 ? 'text-xl' : 'text-2xl';
                          return `${colorClass} ${textSize}`;
                        })()
                      }`}>
                        {getSuccessLikelihood(currentSuccess, greenLine)}
                      </div>
                    </div>
                    {/* Floating Overshoot Badge */}
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full border ${
                        overshootBonus > 0
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-gray-800/40 border-gray-600/40'
                      }`}>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 uppercase">OVS</span>
                          <span className={`text-base font-bold font-['Orbitron'] ${
                            overshootBonus > 0 ? 'text-green-400' : 'text-gray-600'
                          }`}>
                            {overshootBonus.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Rewards Section */}
                  <div className="relative">
                    <div className={`px-4 py-3 space-y-1.5 ${currentSuccess < greenLine ? 'blur-sm' : ''}`}>
                      {/* Rewards in balanced layout */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-yellow-500">Gold:</span>
                        <span className="text-sm font-bold tabular-nums text-yellow-400">
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-blue-500">XP:</span>
                        <span className="text-sm font-bold tabular-nums text-blue-400">
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-green-500">Essence:</span>
                        <span className="text-sm font-bold tabular-nums text-green-400">
                          {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                        </span>
                      </div>
                    </div>

                    {/* Warning Overlay */}
                    {currentSuccess < greenLine && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-900/90 border border-red-500/50 px-4 py-2 rounded shadow-lg">
                          <div className="text-center">
                            <div className="text-xs text-red-400 font-bold">
                              {(greenLine - currentSuccess).toFixed(0)}% below overshoot zone
                            </div>
                            <div className="text-[10px] text-red-300 mt-1">
                              Add more Meks or choose easier difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Card Variation 3: Top Row Focus (Default) */}
            {statusCardVariant === 3 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Full-Width Top Row */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                        <div className={`font-bold font-['Orbitron'] uppercase ${
                          (() => {
                            const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                            const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                            const colorClass = relativePercent >= 100 ? 'text-green-400' :
                                   relativePercent >= 65 ? 'text-yellow-400' :
                                   relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                            const textSize = likelihood.length > 13 ? 'text-lg' : 'text-xl';
                            return `${colorClass} ${textSize}`;
                          })()
                        }`}>
                          {getSuccessLikelihood(currentSuccess, greenLine)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">OVERSHOOT</div>
                        <div className={`text-xl font-bold font-['Orbitron'] ${
                          overshootBonus > 0 ? 'text-green-400' : 'text-gray-600'
                        }`} style={overshootBonus > 0 ? {
                          textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                          filter: 'brightness(1.2)'
                        } : {}}>
                          {overshootBonus.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Rewards Section with Overlay */}
                  <div className="relative">
                    <div className={`px-4 py-2.5 space-y-1 ${currentSuccess < greenLine ? 'blur-sm' : ''}`}>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-xs uppercase font-bold text-yellow-500">Gold:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                          </span>
                          <span className="text-xs text-yellow-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-yellow-400">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-xs uppercase font-bold text-blue-500">XP:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                          </span>
                          <span className="text-xs text-blue-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-blue-400">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-xs uppercase font-bold text-green-500">Essence:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                          </span>
                          <span className="text-xs text-green-500">→</span>
                          <span className="text-sm font-bold tabular-nums text-green-400">
                            {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Warning Overlay over Stats */}
                    {currentSuccess < greenLine && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-900/90 border border-red-500/50 px-3 py-2 rounded shadow-lg">
                          <div className="text-center">
                            <div className="text-xs text-red-400 font-bold">
                              You are {(greenLine - currentSuccess).toFixed(0)}% below guaranteed success
                            </div>
                            <div className="text-[10px] text-red-300 mt-1">
                              Add more Meks or choose an easier difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Card Variation 4: Compact Integration */}
            {statusCardVariant === 4 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                <div className="relative z-10">
                  {/* Compact Integrated Top Row */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">STATUS</div>
                          <div className={`font-bold font-['Orbitron'] uppercase ${
                            (() => {
                              const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                              const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                              const colorClass = relativePercent >= 100 ? 'text-green-400' :
                                     relativePercent >= 65 ? 'text-yellow-400' :
                                     relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                              const textSize = likelihood.length > 13 ? 'text-base' : 'text-lg';
                              return `${colorClass} ${textSize}`;
                            })()
                          }`}>
                            {getSuccessLikelihood(currentSuccess, greenLine)}
                          </div>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">OVS</div>
                          <div className={`text-lg font-bold font-['Orbitron'] ${
                            overshootBonus > 0 ? 'text-green-400' : 'text-gray-600'
                          }`}>
                            +{overshootBonus.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Compact Rewards */}
                  <div className="relative">
                    <div className={`px-3 py-2 ${currentSuccess < greenLine ? 'blur-sm' : ''}`}>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[9px] text-yellow-500 uppercase font-bold">Gold</div>
                          <div className="text-sm font-bold text-yellow-400 tabular-nums">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-blue-500 uppercase font-bold">XP</div>
                          <div className="text-sm font-bold text-blue-400 tabular-nums">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-green-500 uppercase font-bold">Essence</div>
                          <div className="text-sm font-bold text-green-400 tabular-nums">
                            {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                          </div>
                        </div>
                      </div>
                    </div>

                    {currentSuccess < greenLine && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-900/90 border border-red-500/50 px-3 py-1.5 rounded shadow-lg">
                          <div className="text-center">
                            <div className="text-[11px] text-red-400 font-bold">
                              {(greenLine - currentSuccess).toFixed(0)}% below success
                            </div>
                            <div className="text-[9px] text-red-300">
                              Add Meks or reduce difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Card Variation 5: Data Priority */}
            {statusCardVariant === 5 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                <div className="relative z-10">
                  {/* Data-First Top Row */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                        <div className={`font-bold font-['Orbitron'] uppercase ${
                          (() => {
                            const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                            const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                            const colorClass = relativePercent >= 100 ? 'text-green-400' :
                                   relativePercent >= 65 ? 'text-yellow-400' :
                                   relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                            const textSize = likelihood.length > 13 ? 'text-base' : 'text-lg';
                            return `${colorClass} ${textSize}`;
                          })()
                        }`}>
                          {getSuccessLikelihood(currentSuccess, greenLine)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold font-['Orbitron'] ${
                          overshootBonus > 0 ? 'text-green-400' : 'text-gray-600'
                        }`} style={overshootBonus > 0 ? {
                          textShadow: '0 0 15px rgba(34, 197, 94, 1)',
                          filter: 'brightness(1.3)'
                        } : {}}>
                          {overshootBonus.toFixed(0)}%
                        </div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider -mt-1">OVERSHOOT</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Data Priority Rewards */}
                  <div className="relative">
                    <div className={`px-4 py-3 ${currentSuccess < greenLine ? 'blur-sm' : ''}`}>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-400 tabular-nums">
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </div>
                          <div className="text-[9px] text-yellow-500 uppercase font-bold">Gold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400 tabular-nums">
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </div>
                          <div className="text-[9px] text-blue-500 uppercase font-bold">XP</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400 tabular-nums">
                            {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                          </div>
                          <div className="text-[9px] text-green-500 uppercase font-bold">Essence</div>
                        </div>
                      </div>
                    </div>

                    {currentSuccess < greenLine && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-900/95 border-2 border-red-500 px-4 py-2 rounded shadow-xl">
                          <div className="text-center">
                            <div className="text-sm text-red-400 font-bold">
                              ⚠️ {(greenLine - currentSuccess).toFixed(0)}% Below Success
                            </div>
                            <div className="text-[10px] text-red-300 mt-1">
                              Add more Meks or choose an easier difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Keep old sub-variations for compatibility but hidden */}
            {subLayoutStyle === 1.2 && false && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Success Status Card - Slightly reduced padding */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3 text-center">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">MISSION STATUS</div>
                    <div className={`font-bold font-['Orbitron'] uppercase h-8 flex items-center justify-center ${
                      (() => {
                        const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                        const colorClass = relativePercent >= 100 ? 'text-green-400' :
                               relativePercent >= 65 ? 'text-yellow-400' :
                               relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                        const textSize = likelihood.length > 13 ? 'text-xl' : 'text-2xl';
                        return `${colorClass} ${textSize}`;
                      })()
                    }`}>
                      {getSuccessLikelihood(currentSuccess, greenLine)}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Vertical Progression List - Reduced spacing */}
                  <div className={`px-4 py-3 space-y-1.5 ${currentSuccess < greenLine ? 'opacity-50' : ''}`}>
                    {/* Overshoot Percentage */}
                    <div className="text-center mb-2">
                      <div className={`inline-block px-3 py-1 rounded-sm border ${
                        overshootBonus > 0
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-gray-800/20 border-gray-700/40'
                      }`}>
                        <span className={`text-xs font-bold ${
                          overshootBonus > 0 ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          OVERSHOOT
                          <span className={overshootBonus > 0 ? 'inline-block ml-1' : 'ml-1'}
                                style={overshootBonus > 0 ? {
                                  textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4)',
                                  filter: 'brightness(1.2)'
                                } : {}}>
                            +{overshootBonus.toFixed(0)}%
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Gold */}
                    <div className="flex items-center justify-between py-1">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-yellow-500'}`}>Gold:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-yellow-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-yellow-400'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="flex items-center justify-between py-1">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-blue-500'}`}>XP:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-blue-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-blue-400'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Essence */}
                    <div className="flex items-center justify-between py-1">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-green-500'}`}>Essence:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-green-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-green-400'}`}>
                          {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Below Zone Warning - Reduced padding */}
                  {currentSuccess < greenLine && (
                    <div className="bg-red-900/20 border-t border-red-500/30 px-4 py-1.5">
                      <div className="text-center">
                        <span className="text-xs text-red-400 font-bold">
                          ⚠️ {(greenLine - currentSuccess).toFixed(0)}% Below Overshoot Zone
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-variation 1.3: More Condensed (20-25% less vertical space) */}
            {subLayoutStyle === 1.3 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Success Status Card - Only mission status and title at top */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-2.5 text-center">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">MISSION STATUS</div>
                    <div className={`font-bold font-['Orbitron'] uppercase h-7 flex items-center justify-center ${
                      (() => {
                        const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                        const colorClass = relativePercent >= 100 ? 'text-green-400' :
                               relativePercent >= 65 ? 'text-yellow-400' :
                               relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                        const textSize = likelihood.length > 13 ? 'text-lg' : 'text-xl';
                        return `${colorClass} ${textSize}`;
                      })()
                    }`}>
                      {getSuccessLikelihood(currentSuccess, greenLine)}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Vertical Progression List - More reduced spacing */}
                  <div className={`px-4 py-2.5 space-y-1 ${currentSuccess < greenLine ? 'opacity-50' : ''}`}>
                    {/* Overshoot Percentage replaces the "Overshoot Bonus" text */}
                    <div className={`text-center mb-1.5`}>
                      <div className={`inline-block px-2.5 py-0.5 rounded-sm border ${
                        overshootBonus > 0
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-gray-800/20 border-gray-700/40'
                      }`}>
                        <span className={`text-xs font-bold ${
                          overshootBonus > 0 ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          OVERSHOOT
                          <span className={overshootBonus > 0 ? 'inline-block ml-1' : 'ml-1'}
                                style={overshootBonus > 0 ? {
                                  textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4)',
                                  filter: 'brightness(1.2)'
                                } : {}}>
                            +{overshootBonus.toFixed(0)}%
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Gold */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-yellow-500'}`}>Gold:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-yellow-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-yellow-400'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-blue-500'}`}>XP:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-blue-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-blue-400'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Essence */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className={`text-xs uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-green-500'}`}>Essence:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                        </span>
                        <span className={`text-xs ${currentSuccess < greenLine ? 'text-gray-600' : 'text-green-500'}`}>→</span>
                        <span className={`text-sm font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-green-400'}`}>
                          {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Below Zone Warning - More reduced padding */}
                  {currentSuccess < greenLine && (
                    <div className="bg-red-900/20 border-t border-red-500/30 px-4 py-1">
                      <div className="text-center">
                        <span className="text-xs text-red-400 font-bold">
                          ⚠️ {(greenLine - currentSuccess).toFixed(0)}% Below Overshoot Zone
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-variation 1.4: Even More Compact (30-35% less vertical space) */}
            {subLayoutStyle === 1.4 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Success Status Card - Even more reduced padding */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-2 text-center">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                    <div className={`font-bold font-['Orbitron'] uppercase h-6 flex items-center justify-center ${
                      (() => {
                        const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                        const colorClass = relativePercent >= 100 ? 'text-green-400' :
                               relativePercent >= 65 ? 'text-yellow-400' :
                               relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                        const textSize = likelihood.length > 13 ? 'text-base' : 'text-lg';
                        return `${colorClass} ${textSize}`;
                      })()
                    }`}>
                      {getSuccessLikelihood(currentSuccess, greenLine)}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Vertical Progression List - Even more reduced spacing */}
                  <div className={`px-4 py-2 space-y-0.5 ${currentSuccess < greenLine ? 'opacity-50' : ''}`}>
                    {/* Overshoot Percentage */}
                    <div className="text-center mb-1">
                      <div className={`inline-block px-2 py-0.5 rounded-sm border ${
                        overshootBonus > 0
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-gray-800/20 border-gray-700/40'
                      }`}>
                        <span className={`text-[10px] font-bold ${
                          overshootBonus > 0 ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          OVERSHOOT +{overshootBonus.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Gold */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-yellow-500'}`}>Gold:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-[10px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-yellow-500'}`}>→</span>
                        <span className={`text-xs font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-yellow-400'}`}>
                          {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-blue-500'}`}>XP:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                        </span>
                        <span className={`text-[10px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-blue-500'}`}>→</span>
                        <span className={`text-xs font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-blue-400'}`}>
                          {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Essence */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-green-500'}`}>Essence:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                          {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                        </span>
                        <span className={`text-[10px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-green-500'}`}>→</span>
                        <span className={`text-xs font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-green-400'}`}>
                          {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Below Zone Warning - Even more reduced padding */}
                  {currentSuccess < greenLine && (
                    <div className="bg-red-900/20 border-t border-red-500/30 px-4 py-1">
                      <div className="text-center">
                        <span className="text-[10px] text-red-400 font-bold">
                          ⚠️ {(greenLine - currentSuccess).toFixed(0)}% Below Overshoot Zone
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-variation 1.5: Maximum Compression (40-45% less vertical space) */}
            {subLayoutStyle === 1.5 && (
              <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
                {/* Metal texture overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative z-10">
                  {/* Success Status Card - Maximum reduced padding */}
                  <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-1.5 text-center">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                    <div className={`font-bold font-['Orbitron'] uppercase h-5 flex items-center justify-center ${
                      (() => {
                        const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                        const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                        const colorClass = relativePercent >= 100 ? 'text-green-400' :
                               relativePercent >= 65 ? 'text-yellow-400' :
                               relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                        const textSize = likelihood.length > 13 ? 'text-sm' : 'text-base';
                        return `${colorClass} ${textSize}`;
                      })()
                    }`}>
                      {getSuccessLikelihood(currentSuccess, greenLine)}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                  {/* Vertical Progression List - Maximum reduced spacing */}
                  <div className={`px-4 py-1.5 ${currentSuccess < greenLine ? 'opacity-50' : ''}`}>
                    {/* Overshoot Percentage */}
                    <div className="text-center mb-0.5">
                      <span className={`inline-block px-1.5 py-0 rounded-sm border ${
                        overshootBonus > 0
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-gray-800/20 border-gray-700/40'
                      } text-[9px] font-bold ${
                        overshootBonus > 0 ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        OVERSHOOT +{overshootBonus.toFixed(0)}%
                      </span>
                    </div>

                    {/* All rewards in one tight list */}
                    <div className="space-y-0">
                      {/* Gold */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-yellow-500'}`}>G:</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                          </span>
                          <span className={`text-[9px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-yellow-500'}`}>→</span>
                          <span className={`text-[11px] font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-yellow-400'}`}>
                            {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-blue-500'}`}>X:</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                          </span>
                          <span className={`text-[9px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-blue-500'}`}>→</span>
                          <span className={`text-[11px] font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-blue-400'}`}>
                            {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Essence */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold ${currentSuccess < greenLine ? 'text-gray-500' : 'text-green-500'}`}>E:</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] tabular-nums ${currentSuccess < greenLine ? 'text-gray-600' : 'text-gray-500'}`}>
                            {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                          </span>
                          <span className={`text-[9px] ${currentSuccess < greenLine ? 'text-gray-600' : 'text-green-500'}`}>→</span>
                          <span className={`text-[11px] font-bold tabular-nums ${currentSuccess < greenLine ? 'text-gray-400' : 'text-green-400'}`}>
                            {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Below Zone Warning - Maximum reduced padding */}
                  {currentSuccess < greenLine && (
                    <div className="bg-red-900/20 border-t border-red-500/30 px-4 py-0.5">
                      <div className="text-center">
                        <span className="text-[9px] text-red-400 font-bold">
                          ⚠️ {(greenLine - currentSuccess).toFixed(0)}% Below Zone
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* VARIATION 2: Two-Row Horizontal */}
        {layoutStyle === 2 && (
          <div className="relative bg-black/90 overflow-hidden" style={{
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
          }}>
            {/* Metal texture */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-gray-500 via-gray-600 to-gray-500"></div>

            {/* Top Row - Success Status */}
            <div className="relative z-10 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-yellow-500/10 border-b-2 border-yellow-500/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status:</div>
                  <div className="text-2xl font-bold font-['Orbitron'] uppercase">
                    {(() => {
                      const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                      const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                      const colorClass = relativePercent >= 95 ? 'text-green-400' :
                                        relativePercent >= 65 ? 'text-yellow-400' :
                                        relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                      return (
                        <span className={colorClass}>
                          {likelihood}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                {overshootBonus > 0 && (
                  <div className="bg-green-500/20 px-4 py-1 skew-x-[-15deg]">
                    <div className="skew-x-[15deg] flex items-center gap-2">
                      <span className="text-green-400 text-xs uppercase font-bold">Bonus</span>
                      <span className="text-green-300 text-lg font-bold">+{overshootBonus.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row - Rewards Grid */}
            <div className="relative z-10 p-3">
              <div className="grid grid-cols-3 gap-2">
                {/* Gold Cell */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-2">
                  <div className="text-xs text-yellow-500 uppercase font-bold tracking-wider mb-1">Gold</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                    </span>
                    <span className="text-yellow-500 text-xs">→</span>
                    <span className="text-yellow-400 font-bold tabular-nums">
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* XP Cell */}
                <div className="bg-blue-500/10 border border-blue-500/30 p-2">
                  <div className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">XP</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                    </span>
                    <span className="text-blue-500 text-xs">→</span>
                    <span className="text-blue-400 font-bold tabular-nums">
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Essence Cell */}
                <div className="bg-green-500/10 border border-green-500/30 p-2">
                  <div className="text-xs text-green-500 uppercase font-bold tracking-wider mb-1">Essence</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                    </span>
                    <span className="text-green-500 text-xs">→</span>
                    <span className="text-green-400 font-bold tabular-nums">
                      {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VARIATION 3: Grid Modular 2x2 */}
        {layoutStyle === 3 && (
          <div className="grid grid-cols-2 gap-2">
            {/* Success Cell - Larger */}
            <div className="row-span-2 relative bg-black/80 border-2 border-yellow-500/40 overflow-hidden group">
              {/* Scan line effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="h-px bg-yellow-400/50 animate-pulse"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-center items-center p-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">
                  Success Rating
                </div>
                <div className="text-2xl font-bold font-['Orbitron'] uppercase text-center leading-tight">
                  {(() => {
                    const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                    const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                    const colorClass = relativePercent >= 95 ? 'text-green-400' :
                                      relativePercent >= 65 ? 'text-yellow-400' :
                                      relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                    return (
                      <span className={`${colorClass} drop-shadow-[0_0_15px_currentColor]`}>
                        {likelihood}
                      </span>
                    );
                  })()}
                </div>
                {overshootBonus > 0 && (
                  <div className="mt-3 bg-green-500/20 px-2 py-1 rounded border border-green-500/40">
                    <span className="text-green-400 text-xs font-bold">+{overshootBonus.toFixed(0)}% BONUS</span>
                  </div>
                )}
              </div>

              {/* Corner brackets */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60"></div>
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400/60"></div>
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400/60"></div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60"></div>
            </div>

            {/* Gold Cell */}
            <div className="relative bg-gradient-to-br from-yellow-900/20 to-black/80 border border-yellow-500/30 p-3 overflow-hidden">
              <div className="absolute top-0 right-0 text-yellow-500/10 text-6xl font-bold font-['Orbitron']">G</div>
              <div className="relative z-10">
                <div className="text-[10px] text-yellow-500 uppercase font-bold tracking-wider mb-1">Gold Reward</div>
                <div className="text-lg font-bold text-yellow-400 tabular-nums">
                  {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                </div>
                {overshootBonus > 0 && (
                  <div className="text-[10px] text-gray-400">
                    Base: {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* XP & Essence Combined Cell */}
            <div className="relative bg-gradient-to-br from-blue-900/20 to-black/80 border border-blue-500/30 p-3 overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                {/* XP */}
                <div>
                  <div className="text-[10px] text-blue-500 uppercase font-bold tracking-wider mb-1">XP</div>
                  <div className="text-base font-bold text-blue-400 tabular-nums">
                    {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                  </div>
                </div>
                {/* Essence */}
                <div>
                  <div className="text-[10px] text-green-500 uppercase font-bold tracking-wider mb-1">Essence</div>
                  <div className="text-base font-bold text-green-400 tabular-nums">
                    {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VARIATION 4: Asymmetric Hero Layout */}
        {layoutStyle === 4 && (
          <div className="flex gap-3">
            {/* Left Hero - Success */}
            <div className="flex-shrink-0 w-48 relative bg-gradient-to-b from-yellow-500/20 to-black/90 border-l-4 border-yellow-500 overflow-hidden">
              {/* Diagonal stripes background */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 10px, #facc15 10px, #facc15 12px)`
              }}></div>

              <div className="relative z-10 p-4 h-full flex flex-col justify-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                  Mission<br/>Success
                </div>
                <div className="text-2xl font-bold font-['Orbitron'] uppercase leading-tight mb-3">
                  {(() => {
                    const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                    const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                    const colorClass = relativePercent >= 95 ? 'text-green-400' :
                                      relativePercent >= 65 ? 'text-yellow-400' :
                                      relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                    return (
                      <span className={colorClass}>
                        {likelihood}
                      </span>
                    );
                  })()}
                </div>
                {overshootBonus > 0 && (
                  <div className="bg-green-500/20 px-2 py-1 rounded-sm border-l-2 border-green-500">
                    <div className="text-[10px] text-green-500 uppercase font-bold">Overshoot</div>
                    <div className="text-lg text-green-400 font-bold">+{overshootBonus.toFixed(0)}%</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Compact Rewards */}
            <div className="flex-1 space-y-2">
              {/* Gold Bar */}
              <div className="bg-black/60 border border-yellow-500/20 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-yellow-500 uppercase font-bold">Gold</span>
                </div>
                <div className="flex items-center gap-2">
                  {overshootBonus > 0 && (
                    <span className="text-xs text-gray-500 tabular-nums line-through">
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-yellow-400 font-bold tabular-nums">
                    {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* XP Bar */}
              <div className="bg-black/60 border border-blue-500/20 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-500 uppercase font-bold">XP</span>
                </div>
                <div className="flex items-center gap-2">
                  {overshootBonus > 0 && (
                    <span className="text-xs text-gray-500 tabular-nums line-through">
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-blue-400 font-bold tabular-nums">
                    {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Essence Bar */}
              <div className="bg-black/60 border border-green-500/20 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-500 uppercase font-bold">Essence</span>
                </div>
                <div className="flex items-center gap-2">
                  {overshootBonus > 0 && (
                    <span className="text-xs text-gray-500 tabular-nums line-through">
                      {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                    </span>
                  )}
                  <span className="text-sm text-green-400 font-bold tabular-nums">
                    {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VARIATION 5: Compact Badge/Pill Style */}
        {layoutStyle === 5 && (
          <div className="relative">
            {/* Main compact container */}
            <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-y-2 border-yellow-500/40 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Success Badge */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl"></div>
                    <div className="relative bg-black border-2 border-yellow-500/60 px-3 py-1 skew-x-[-10deg]">
                      <div className="skew-x-[10deg]">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0">Success</div>
                        <div className="text-sm font-bold font-['Orbitron'] uppercase">
                          {(() => {
                            const likelihood = getSuccessLikelihood(currentSuccess, greenLine);
                            const relativePercent = greenLine > 0 ? (currentSuccess / greenLine) * 100 : 100;
                            const colorClass = relativePercent >= 95 ? 'text-green-400' :
                                              relativePercent >= 65 ? 'text-yellow-400' :
                                              relativePercent >= 35 ? 'text-orange-400' : 'text-red-400';
                            return (
                              <span className={colorClass}>
                                {likelihood}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overshoot indicator */}
                  {overshootBonus > 0 && (
                    <div className="bg-green-500/20 px-2 py-1 rounded-full border border-green-500/40 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      <span className="text-xs text-green-400 font-bold">+{overshootBonus.toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {/* Rewards Pills */}
                <div className="flex items-center gap-2">
                  {/* Gold Pill */}
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-[10px] text-yellow-500 uppercase font-bold">G</span>
                    <span className="text-xs text-yellow-400 font-bold tabular-nums">
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>

                  {/* XP Pill */}
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-[10px] text-blue-500 uppercase font-bold">XP</span>
                    <span className="text-xs text-blue-400 font-bold tabular-nums">
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>

                  {/* Essence Pill */}
                  <div className="bg-green-900/30 border border-green-500/30 rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-[10px] text-green-500 uppercase font-bold">E</span>
                    <span className="text-xs text-green-400 font-bold tabular-nums">
                      {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable details (can be toggled) */}
            <div className="mt-1 text-center">
              <button className="text-[10px] text-gray-500 hover:text-gray-400 uppercase tracking-wider">
                ▼ Details ▼
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mek contributions breakdown */}
      {showDetails && mekContributions.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Mek Contributions</div>
          {mekContributions.map((mek) => (
            <div key={mek.mekId} className="flex justify-between items-center bg-black/30 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{mek.name}</span>
                <span className="text-xs text-gray-500">Rank #{mek.rank}</span>
              </div>
              <span className="text-xs font-mono text-yellow-400">+{mek.contribution.toFixed(1)}%</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-1 flex justify-between items-center">
            <span className="text-xs text-gray-400">Total Success Rate</span>
            <span className={`text-sm font-bold ${currentSuccess >= greenLine ? 'text-green-400' : 'text-yellow-400'}`}>{currentSuccess.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Risk warning */}
      {currentSuccess < greenLine && (
        <div className="mt-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="text-xs text-red-400 font-semibold">
                {(greenLine - currentSuccess).toFixed(1)}% below guaranteed success
              </div>
              <div className="text-xs text-gray-400">
                Add more Meks or choose an easier difficulty
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}