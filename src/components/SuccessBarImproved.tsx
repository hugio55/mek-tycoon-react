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
  className?: string;
  designVariant?: 1 | 2 | 3 | 4; // New design variations
}

export default function SuccessBarImproved({
  currentSuccess,
  difficultyConfig,
  mekContributions = [],
  showDetails = true,
  className = '',
  designVariant = 1
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

  return (
    <div className={`w-full ${className}`}>

      {/* DESIGN VARIANT 1: TACTICAL INDUSTRIAL */}
      {designVariant === 1 && (
        <>
          {/* Title - More prominent with industrial styling */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent"></div>
            <div className="relative flex items-center justify-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent to-yellow-500/50 flex-1"></div>
              <h2 className="text-lg font-black text-yellow-500 uppercase tracking-[0.3em] font-['Orbitron'] px-4">
                SUCCESS METER
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent to-yellow-500/50 flex-1"></div>
            </div>
          </div>

          {/* Main Success Bar - Thicker with enhanced visuals */}
          <div className="relative h-16 bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
            {/* Background zones with grid texture */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `linear-gradient(0deg, transparent 90%, rgba(255,255,255,0.02) 90%), linear-gradient(90deg, transparent 90%, rgba(255,255,255,0.02) 90%)`,
              backgroundSize: '10px 10px'
            }}></div>

            <div className="absolute inset-0 flex">
              {/* Risk zone (0 to green line) */}
              <div
                className="bg-gradient-to-r from-red-950/40 via-red-900/30 to-orange-900/20 border-r-2 border-yellow-500/30"
                style={{ width: `${greenLine}%` }}
              />
              {/* Bonus zone (green line to 100) */}
              <div className="bg-gradient-to-r from-green-900/20 via-green-900/30 to-green-950/40 flex-1" />
            </div>

            {/* Success fill bar - Split at goalpost */}
            {currentSuccess > 0 && (
              <>
                {/* Normal portion (up to greenLine) */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(greenLine, currentSuccess)}%`,
                    background: `linear-gradient(90deg,
                      rgba(250, 182, 23, 0.8) 0%,
                      rgba(250, 204, 21, 1) 50%,
                      rgba(251, 191, 36, 1) 100%)`
                  }}
                >
                  {/* Animated shimmer effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,
                      animation: 'shimmer 3s infinite'
                    }}
                  />
                </div>

                {/* Overshoot portion (past greenLine) - Green and glowing */}
                {currentSuccess > greenLine && (
                  <div
                    className="absolute inset-y-0 transition-all duration-500 ease-out"
                    style={{
                      left: `${greenLine}%`,
                      width: `${currentSuccess - greenLine}%`,
                      background: `linear-gradient(90deg,
                        rgba(34, 197, 94, 1) 0%,
                        rgba(74, 222, 128, 1) 50%,
                        rgba(34, 197, 94, 0.9) 100%)`,
                      boxShadow: `0 0 20px rgba(74, 222, 128, 0.6), inset 0 0 20px rgba(74, 222, 128, 0.3)`,
                    }}
                  >
                    {/* Intense pulsing glow for overshoot */}
                    <div
                      className="absolute inset-0 animate-pulse"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, rgba(74, 222, 128, 0.4) 50%, transparent 100%)`,
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Goalpost marker - Enhanced visibility */}
            <div
              className="absolute top-0 bottom-0 z-30"
              style={{ left: `${greenLine}%` }}
            >
              {/* White background pillar for contrast */}
              <div className="absolute top-0 bottom-0 w-1 bg-white/90 -translate-x-1/2"></div>
              {/* Green glowing overlay */}
              <div
                className="absolute top-0 bottom-0 w-0.5 -translate-x-1/4"
                style={{
                  backgroundColor: '#00ff00',
                  boxShadow: `0 0 15px #00ff00, 0 0 30px #00ff00, 0 0 45px rgba(0, 255, 0, 0.5)`,
                }}
              />
              {/* Top flag */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-green-400"></div>
              </div>
              {/* Bottom flag */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-green-400"></div>
              </div>
            </div>

            {/* Current position marker */}
            {currentSuccess > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 transition-all duration-500"
                style={{ left: `${currentSuccess}%` }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-white/70"></div>
                </div>
              </div>
            )}
          </div>

          {/* Percentage directly under goalpost */}
          <div className="relative h-8 mt-1">
            <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
              <div className="bg-black/80 border border-green-500 px-2 py-1 rounded text-xs font-bold text-green-400 whitespace-nowrap">
                {difficultyConfig.displayName}: {greenLine}%
              </div>
            </div>
          </div>
        </>
      )}

      {/* DESIGN VARIANT 2: HOLOGRAPHIC MODERN */}
      {designVariant === 2 && (
        <>
          {/* Title with holographic effect */}
          <div className="relative mb-4 py-2">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-green-500/20 to-yellow-500/20 blur-xl"></div>
            <h2 className="relative text-2xl font-black text-center uppercase tracking-[0.4em] font-['Orbitron']"
                style={{
                  background: 'linear-gradient(135deg, #facc15, #4ade80, #facc15)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(250, 204, 21, 0.5)'
                }}>
              SUCCESS METER
            </h2>
          </div>

          {/* Main Bar with glass morphism */}
          <div className="relative h-20 rounded-2xl overflow-hidden shadow-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.9), rgba(30, 30, 30, 0.9))',
                 backdropFilter: 'blur(10px)',
                 border: '2px solid rgba(250, 204, 21, 0.3)'
               }}>

            {/* Holographic shimmer background */}
            <div className="absolute inset-0 opacity-30"
                 style={{
                   background: 'linear-gradient(45deg, transparent 30%, rgba(250, 204, 21, 0.1) 50%, transparent 70%)',
                   animation: 'slide 4s infinite'
                 }}></div>

            {/* Base track */}
            <div className="absolute inset-2 bg-black/50 rounded-xl">
              {/* Normal fill */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(greenLine, currentSuccess)}%`,
                    background: 'linear-gradient(90deg, #dc2626, #f59e0b, #facc15)',
                    filter: 'brightness(1.2)'
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>

                {/* Overshoot with intense glow */}
                {currentSuccess > greenLine && (
                  <div
                    className="absolute inset-y-0 transition-all duration-700 ease-out"
                    style={{
                      left: `${greenLine}%`,
                      width: `${currentSuccess - greenLine}%`,
                      background: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac)',
                      boxShadow: '0 0 40px #4ade80, inset 0 0 30px rgba(74, 222, 128, 0.5)',
                      filter: 'brightness(1.3)'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                    <div className="absolute inset-0 animate-pulse bg-green-400/20"></div>
                  </div>
                )}
              </div>

              {/* Goalpost with glow orb */}
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                  {/* Glowing orb */}
                  <div className="w-6 h-6 rounded-full bg-green-400"
                       style={{
                         boxShadow: '0 0 20px #4ade80, 0 0 40px #4ade80, 0 0 60px #22c55e'
                       }}></div>
                  {/* Center dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Percentage under goalpost */}
          <div className="relative h-10 mt-2">
            <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 blur-xl"></div>
                <div className="relative bg-black/90 border-2 border-green-500/60 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-green-400 font-['Orbitron']">
                    GOAL: {greenLine}%
                  </span>
                </div>
              </div>
            </div>
            {/* Current percentage */}
            {currentSuccess !== greenLine && (
              <div className="absolute" style={{ left: `${currentSuccess}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black/80 px-2 py-0.5 rounded text-xs text-gray-400">
                  {currentSuccess.toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* DESIGN VARIANT 3: MILITARY COMMAND */}
      {designVariant === 3 && (
        <>
          {/* Title with military stencil style */}
          <div className="mb-4">
            <div className="bg-yellow-500/10 border-y-4 border-yellow-500 py-2">
              <h2 className="text-2xl font-black text-center text-yellow-500 uppercase font-['Orbitron']"
                  style={{
                    letterSpacing: '0.5em',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                  }}>
                SUCCESS METER
              </h2>
            </div>
            <div className="h-2 bg-repeating-linear-gradient"
                 style={{
                   backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, #facc15 10px, #facc15 20px)'
                 }}></div>
          </div>

          {/* Main bar with military aesthetics */}
          <div className="relative">
            {/* Outer frame */}
            <div className="absolute -inset-1 bg-gradient-to-b from-gray-700 to-gray-900 rounded-sm"></div>

            {/* Main bar container */}
            <div className="relative h-20 bg-black rounded-sm overflow-hidden border-4 border-gray-800">
              {/* Measurement marks */}
              <div className="absolute inset-0 flex">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-800/50"></div>
                ))}
              </div>

              {/* Progress tracks */}
              <div className="absolute inset-2 bg-gray-950 rounded-sm">
                {/* Normal progress */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${Math.min(greenLine, currentSuccess)}%`,
                    background: 'linear-gradient(180deg, #fbbf24, #f59e0b, #d97706)',
                    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 0 100%)'
                  }}>
                  {/* Scan line effect */}
                  <div className="absolute inset-0 opacity-50"
                       style={{
                         backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)'
                       }}></div>
                </div>

                {/* Overshoot progress - GREEN ALERT */}
                {currentSuccess > greenLine && (
                  <div
                    className="absolute inset-y-0 transition-all duration-500 animate-pulse"
                    style={{
                      left: `${greenLine}%`,
                      width: `${currentSuccess - greenLine}%`,
                      background: 'linear-gradient(180deg, #4ade80, #22c55e, #16a34a)',
                      boxShadow: '0 0 30px #22c55e, inset 0 0 20px rgba(34, 197, 94, 0.5)',
                      clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 0 100%)'
                    }}>
                    {/* Alert stripes for overshoot */}
                    <div className="absolute inset-0 opacity-30"
                         style={{
                           backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)'
                         }}></div>
                  </div>
                )}

                {/* Goalpost - Military checkpoint style */}
                <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                  <div className="absolute top-0 bottom-0 w-2 bg-green-500 -translate-x-1/2"
                       style={{
                         boxShadow: '0 0 20px #22c55e, 0 0 40px #22c55e'
                       }}></div>
                  {/* Warning lights */}
                  <div className="absolute top-2 -translate-x-1/2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <div className="absolute bottom-2 -translate-x-1/2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>

              {/* LED indicators on sides */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                   style={{
                     background: currentSuccess >= greenLine ? '#22c55e' : '#dc2626',
                     boxShadow: currentSuccess >= greenLine ? '0 0 10px #22c55e' : '0 0 10px #dc2626'
                   }}></div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                   style={{
                     background: currentSuccess >= greenLine ? '#22c55e' : '#dc2626',
                     boxShadow: currentSuccess >= greenLine ? '0 0 10px #22c55e' : '0 0 10px #dc2626'
                   }}></div>
            </div>
          </div>

          {/* Tactical readout under goalpost */}
          <div className="relative h-12 mt-2">
            <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
              <div className="bg-green-900/90 border-2 border-green-500 px-3 py-1">
                <div className="text-xs font-bold text-green-400 font-mono uppercase">
                  TARGET: {greenLine}%
                </div>
                <div className="text-[10px] text-green-300">
                  {difficultyConfig.displayName}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DESIGN VARIANT 4: CINEMATIC SCI-FI */}
      {designVariant === 4 && (
        <>
          {/* Cinematic title with lens flare effect */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
            </div>
            <div className="relative text-center">
              <h2 className="text-3xl font-black uppercase tracking-[0.6em]"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    background: 'linear-gradient(180deg, #fff 0%, #facc15 50%, #f59e0b 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(250, 204, 21, 0.4))'
                  }}>
                SUCCESS METER
              </h2>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
            </div>
          </div>

          {/* Cinematic bar with depth and lighting */}
          <div className="relative h-24 rounded-lg overflow-hidden"
               style={{
                 background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(5,5,5,0.95) 100%)',
                 boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.5)'
               }}>

            {/* Depth grooves */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-black/50 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-t from-black/50 to-transparent"></div>

            {/* Main track with inset */}
            <div className="absolute inset-4 bg-gray-950 rounded-md"
                 style={{
                   boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)'
                 }}>

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10"
                   style={{
                     backgroundImage: 'linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%)',
                     backgroundSize: '20px 100%'
                   }}></div>

              {/* Normal progress with gradient */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-l-md"
                style={{
                  width: `${Math.min(greenLine, currentSuccess)}%`,
                  background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 40%, #facc15 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)'
                }}>
                {/* Top highlight */}
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/30 to-transparent"></div>
                {/* Moving light sweep */}
                <div className="absolute inset-0 opacity-50"
                     style={{
                       background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                       animation: 'sweep 3s infinite'
                     }}></div>
              </div>

              {/* Overshoot with cinematic green glow */}
              {currentSuccess > greenLine && (
                <div
                  className="absolute inset-y-0 transition-all duration-700 ease-out"
                  style={{
                    left: `${greenLine}%`,
                    width: `${currentSuccess - greenLine}%`,
                    background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #86efac 100%)',
                    boxShadow: `
                      0 0 40px rgba(74, 222, 128, 0.8),
                      0 0 80px rgba(74, 222, 128, 0.6),
                      inset 0 0 30px rgba(134, 239, 172, 0.5),
                      inset 0 2px 4px rgba(255,255,255,0.4),
                      inset 0 -2px 4px rgba(0,0,0,0.3)
                    `,
                    filter: 'brightness(1.2) contrast(1.1)'
                  }}>
                  {/* Animated energy field */}
                  <div className="absolute inset-0"
                       style={{
                         background: 'radial-gradient(circle at 50% 50%, rgba(134, 239, 172, 0.4), transparent)',
                         animation: 'pulse 2s infinite'
                       }}></div>
                  {/* Top shine */}
                  <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white/40 to-transparent"></div>
                </div>
              )}

              {/* Goalpost - Cinematic beacon */}
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                {/* Glow aura */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 bg-green-500/30 rounded-full blur-xl"></div>
                {/* Main pillar */}
                <div className="absolute top-0 bottom-0 w-1 bg-white -translate-x-1/2"
                     style={{
                       boxShadow: `
                         0 0 10px rgba(255,255,255,0.9),
                         0 0 20px rgba(74, 222, 128, 0.8),
                         0 0 40px rgba(74, 222, 128, 0.6)
                       `
                     }}></div>
                {/* Energy core */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full border-2 border-green-400"
                       style={{
                         background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
                         boxShadow: '0 0 30px #4ade80',
                         animation: 'pulse 2s infinite'
                       }}></div>
                </div>
              </div>
            </div>

            {/* Side panels with status lights */}
            <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-gray-900 to-transparent flex flex-col justify-center gap-2 pl-1">
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse animation-delay-500`}></div>
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse animation-delay-1000`}></div>
            </div>
            <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-gray-900 to-transparent flex flex-col justify-center gap-2 pr-1 items-end">
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse animation-delay-500`}></div>
              <div className={`w-2 h-2 rounded-full ${currentSuccess >= greenLine ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse animation-delay-1000`}></div>
            </div>
          </div>

          {/* Cinematic data readout under goalpost */}
          <div className="relative h-14 mt-3">
            <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
              <div className="relative">
                {/* Holographic effect */}
                <div className="absolute inset-0 bg-green-500/20 blur-lg"></div>
                <div className="relative bg-black/90 border border-green-500/60 px-4 py-2 rounded-lg"
                     style={{
                       boxShadow: '0 4px 16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(74, 222, 128, 0.3)'
                     }}>
                  <div className="text-sm font-bold text-green-400 font-['Orbitron'] text-center">
                    OBJECTIVE: {greenLine}%
                  </div>
                  <div className="text-xs text-green-300/80 text-center uppercase tracking-wider">
                    {difficultyConfig.displayName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success status and rewards info (same for all variants) */}
      <div className="mt-6 bg-black/60 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mission Status</div>
            <div className={`text-xl font-bold font-['Orbitron'] uppercase ${
              currentSuccess >= greenLine ? 'text-green-400' :
              currentSuccess >= greenLine * 0.65 ? 'text-yellow-400' :
              currentSuccess >= greenLine * 0.35 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {getSuccessLikelihood(currentSuccess, greenLine)}
            </div>
          </div>
          {overshootBonus > 0 && (
            <div className="bg-green-500/20 px-3 py-2 rounded border border-green-500/40">
              <div className="text-xs text-green-500 uppercase tracking-wider mb-1">Overshoot Bonus</div>
              <div className="text-xl font-bold text-green-400">+{overshootBonus.toFixed(0)}%</div>
            </div>
          )}
        </div>

        {/* Current success percentage display */}
        <div className="text-center py-2 bg-gray-900/50 rounded">
          <span className="text-sm text-gray-400">Current Success: </span>
          <span className={`text-lg font-bold ${
            currentSuccess >= greenLine ? 'text-green-400' : 'text-yellow-400'
          }`}>{currentSuccess.toFixed(1)}%</span>
        </div>
      </div>

      {/* Mek contributions (if any) */}
      {showDetails && mekContributions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Mek Contributions</div>
          {mekContributions.map((mek) => (
            <div key={mek.mekId} className="flex justify-between items-center bg-black/40 rounded px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{mek.name}</span>
                <span className="text-xs text-gray-500">Rank #{mek.rank}</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">+{mek.contribution.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}