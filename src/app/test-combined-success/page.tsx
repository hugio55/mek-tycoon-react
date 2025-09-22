'use client';

import React, { useState } from 'react';
import { DifficultyConfig } from '@/lib/difficultyModifiers';

export default function TestCombinedSuccess() {
  const [successRate, setSuccessRate] = useState(52);
  const [greenLine, setGreenLine] = useState(31);
  const [selectedVariation, setSelectedVariation] = useState<1 | 2 | 3 | 4>(1);

  // Sample difficulty config
  const difficultyConfig: DifficultyConfig = {
    nodeType: 'normal',
    difficulty: 'medium',
    displayName: 'Medium',
    successGreenLine: greenLine,
    goldMultiplier: 1.5,
    xpMultiplier: 1.5,
    deploymentCostMultiplier: 1.5,
    overshootBonusRate: 1,
    maxOvershootBonus: 50,
    essenceAmountMultiplier: 1.5,
    requiredSuccess: 50
  };

  const baseRewards = { gold: 1000, xp: 500 };

  // Calculate overshoot bonus
  const overshootBonus = successRate > greenLine
    ? Math.min((successRate - greenLine) * difficultyConfig.overshootBonusRate, difficultyConfig.maxOvershootBonus)
    : 0;

  // Determine success likelihood term
  const getSuccessLikelihood = (currentPercent: number, greenLinePercent: number) => {
    if (currentPercent >= greenLinePercent) return 'Certain';
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

  const renderCombinedSuccess = (variant: number) => {
    const isOvershoot = successRate > greenLine;
    const hasReachedGoal = successRate >= greenLine; // New variable for when at or past goalpost
    const percentToOvershoot = greenLine - successRate;

    // All variations now use the same height
    const barHeight = 72;

    // Calculate exact position for arrows and percentage text
    const innerBarWidth = 100; // percentage-based width
    const paddingPixels = 8; // inset-2 = 8px on each side
    const goalpostPositionPercent = greenLine; // This is the percentage within the inner bar

    return (
      <div className="w-full max-w-md mx-auto">
        {/* Cinematic Sci-Fi Text from Improved Variant 4 - EXACT COPY WITH DIVIDER LINE */}
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

        {/* Container for extended markers */}
        <div className="relative">
          {/* Holographic Modern Bar */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.9), rgba(30, 30, 30, 0.9))',
                 backdropFilter: 'blur(10px)',
                 border: '2px solid rgba(250, 204, 21, 0.3)',
                 height: `${barHeight}px`,
                 zIndex: 10
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
                    width: `${Math.min(greenLine, successRate)}%`,
                    background: 'linear-gradient(90deg, #dc2626, #f59e0b, #facc15)',
                    filter: 'brightness(1.2)'
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>

                {/* GREEN OVERSHOOT AREA - Always Matrix Stream Effect */}
                {successRate > greenLine && (
                  <div
                    className="absolute inset-y-0 transition-all duration-700 ease-out"
                    style={{
                      left: `${greenLine}%`,
                      width: `${successRate - greenLine}%`,
                      background: 'linear-gradient(180deg, #00ff88 0%, #00ffdd 50%, #00ff88 100%)',
                      boxShadow: '0 0 30px rgba(0, 255, 136, 0.7), 0 0 50px rgba(0, 255, 221, 0.5), inset 0 0 20px rgba(0, 255, 221, 0.5)',
                      filter: 'brightness(1.3) saturate(1.2)'
                    }}>
                    {/* Extra glow layer */}
                    <div className="absolute inset-0"
                         style={{
                           background: 'radial-gradient(ellipse at center, rgba(0, 255, 200, 0.3) 0%, transparent 70%)',
                           filter: 'blur(8px)'
                         }}></div>
                    {/* Matrix rain */}
                    <div className="absolute inset-0"
                         style={{
                           backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 4px, rgba(0, 255, 200, 0.1) 4px, rgba(0, 255, 200, 0.1) 6px, transparent 6px, transparent 10px, rgba(0, 255, 255, 0.15) 10px, rgba(0, 255, 255, 0.15) 11px, transparent 11px, transparent 16px)',
                           animation: 'matrixFall 1s linear infinite'
                         }}></div>
                    {/* Hex grid */}
                    <div className="absolute inset-0"
                         style={{
                           backgroundImage: 'repeating-conic-gradient(from 30deg at 50% 50%, rgba(0, 255, 200, 0) 0deg, rgba(0, 255, 200, 0.2) 60deg, rgba(0, 255, 200, 0) 120deg)',
                           backgroundSize: '20px 20px',
                           animation: 'hexPulse 2s ease-in-out infinite'
                         }}></div>
                    {/* Grid lines */}
                    <div className="absolute inset-0"
                         style={{
                           background: `repeating-linear-gradient(90deg, transparent 0, transparent 19px, rgba(0, 255, 255, 0.3) 19px, rgba(0, 255, 255, 0.3) 20px),
                                       repeating-linear-gradient(0deg, transparent 0, transparent 19px, rgba(0, 255, 200, 0.2) 19px, rgba(0, 255, 200, 0.2) 20px)`,
                           animation: 'gridFlicker 0.1s steps(2) infinite'
                         }}></div>
                    {/* Fast white gleam */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-y-0 w-[15%]"
                           style={{
                             background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)',
                             animation: 'fastGleam 0.2s linear infinite'
                           }}></div>
                    </div>
                    {/* Data stream */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-y-0 w-[30%]"
                           style={{
                             background: 'linear-gradient(90deg, transparent 0%, rgba(150, 255, 255, 0.4) 10%, rgba(150, 255, 255, 0.6) 50%, rgba(150, 255, 255, 0.4) 90%, transparent 100%)',
                             animation: 'dataStream 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                           }}></div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Goalpost and Arrow Markers as ONE UNIT */}
          <div className="absolute pointer-events-none" style={{
            left: `calc(${paddingPixels}px + (100% - ${paddingPixels * 2}px) * ${goalpostPositionPercent / 100})`,
            top: 0,
            bottom: 0,
            zIndex: 20
          }}>
            {/* Dashed vertical line - positioned at exact center */}
            <div className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2"
                 style={{
                   background: isOvershoot
                     ? 'repeating-linear-gradient(180deg, #22d3ee 0px, #22d3ee 4px, transparent 4px, transparent 8px)'
                     : 'repeating-linear-gradient(180deg, #4ade80 0px, #4ade80 4px, transparent 4px, transparent 8px)',
                   boxShadow: isOvershoot
                     ? '0 0 10px #22d3ee, 0 0 20px #22d3ee'
                     : '0 0 8px #4ade80',
                   animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                 }}></div>
            {/* Top arrow */}
            <div className="absolute -translate-x-1/2" style={{ top: '-12px' }}>
              <div className={`text-base font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                   style={{
                     filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                     animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                   }}>
                ▼
              </div>
            </div>
            {/* Bottom arrow */}
            <div className="absolute -translate-x-1/2" style={{ bottom: '-12px' }}>
              <div className={`text-base font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                   style={{
                     filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                     animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                   }}>
                ▲
              </div>
            </div>
          </div>
        </div>

        {/* Percentage display - Fixed alignment */}
        <div className="relative h-6 mt-1">
          <div className="absolute -translate-x-1/2" style={{
            left: `calc(${paddingPixels}px + (100% - ${paddingPixels * 2}px) * ${goalpostPositionPercent / 100})`
          }}>
            <span className="text-xs font-bold text-green-400/60">
              {greenLine}%
            </span>
          </div>
        </div>

        {/* Mission Status Card with gray/colored states and warning overlay */}
        <div className="mt-4 relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative z-10">
            {/* Top Row - Mission Status LEFT, Overshoot RIGHT */}
            <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                <div className={`font-bold font-['Orbitron'] uppercase text-xl ${
                  successRate >= greenLine ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {getSuccessLikelihood(successRate, greenLine)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${
                  hasReachedGoal ? 'text-green-500' : 'text-gray-500'
                }`}>OVERSHOOT</div>
                <div className={`text-2xl font-bold ${
                  hasReachedGoal ? 'text-green-400' : 'text-gray-600'
                }`} style={{
                  fontFamily: 'Roboto Mono, monospace', // Locked to Roboto Mono for all variations
                  ...(hasReachedGoal ? {
                    textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                    filter: 'brightness(1.2)'
                  } : {})
                }}>
                  {overshootBonus.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

            {/* Rewards Section */}
            <div className="relative">
              <div className={`px-4 py-3 space-y-1 ${!hasReachedGoal ? 'opacity-40' : ''}`}>
                {/* Gold */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-yellow-500' : 'text-gray-500'}`}>Gold:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                    </span>
                    <span className={`text-xs ${hasReachedGoal ? 'text-yellow-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-blue-500' : 'text-gray-500'}`}>XP:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                    </span>
                    <span className={`text-xs ${hasReachedGoal ? 'text-blue-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-blue-400' : 'text-gray-500'}`}>
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Essence */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-green-500' : 'text-gray-500'}`}>Essence:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                      {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                    </span>
                    <span className={`text-xs ${hasReachedGoal ? 'text-green-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-green-400' : 'text-gray-500'}`}>
                      {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Industrial warning overlay ONLY when BELOW goalpost */}
              {!hasReachedGoal && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {variant === 1 && (
                    // Original Angled Boost - Orange/Yellow gradient with polygon clip
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-orange-500/30 blur animate-pulse"></div>
                      <div className="relative bg-black/90 px-3 py-1.5" style={{
                        clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                      }}>
                        <div className="text-center">
                          <div className="text-xs text-orange-400 font-bold italic tracking-wide font-['Roboto']">
                            OVERSHOOT IN {Math.abs(percentToOvershoot).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {variant === 2 && (
                    // Hexagon shape - Cyan/Blue gradient
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-cyan-500/40 blur-lg animate-pulse"></div>
                      <div className="relative bg-gradient-to-b from-black/80 to-blue-950/90 px-4 py-2 border border-cyan-500/50" style={{
                        clipPath: 'polygon(30px 0%, 100% 0%, calc(100% - 30px) 100%, 0% 100%)'
                      }}>
                        <div className="text-center">
                          <div className="text-xs text-cyan-300 font-black uppercase tracking-[0.2em] font-['Roboto']">
                            ⚡ +{Math.abs(percentToOvershoot).toFixed(0)}% NEEDED
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {variant === 3 && (
                    // Square/Rectangle with cut corners - Purple/Pink gradient
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/30 to-purple-600/20 blur animate-pulse"></div>
                      <div className="relative bg-black/85 px-5 py-2 border-2 border-purple-500/60" style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(88,28,135,0.3) 100%)',
                        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                      }}>
                        <div className="text-center">
                          <div className="text-[11px] text-purple-300 font-bold uppercase tracking-wider font-['Roboto']"
                               style={{textShadow: '0 0 8px rgba(168, 85, 247, 0.8)'}}>
                            THRESHOLD -{Math.abs(percentToOvershoot).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {variant === 4 && (
                    // Diamond shape - Green/Emerald gradient
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-green-400/40 to-emerald-500/30 blur-md animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-black/90 to-emerald-950/80 px-6 py-2.5" style={{
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                        boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.3)'
                      }}>
                        <div className="text-center">
                          <div className="text-[10px] text-emerald-300 font-black uppercase tracking-[0.15em] font-['Roboto']">
                            {Math.abs(percentToOvershoot).toFixed(0)}% TO GO
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Combined Success Meter - Angled Boost Variations</h1>

        {/* Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">Controls</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Success Rate: {successRate}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={successRate}
                onChange={(e) => setSuccessRate(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setSuccessRate(25)} className="px-2 py-1 bg-gray-700 text-xs rounded">25%</button>
                <button onClick={() => setSuccessRate(greenLine - 5)} className="px-2 py-1 bg-gray-700 text-xs rounded">Before</button>
                <button onClick={() => setSuccessRate(greenLine)} className="px-2 py-1 bg-gray-700 text-xs rounded">At Goal</button>
                <button onClick={() => setSuccessRate(greenLine + 15)} className="px-2 py-1 bg-gray-700 text-xs rounded">Past +15</button>
                <button onClick={() => setSuccessRate(greenLine + 30)} className="px-2 py-1 bg-gray-700 text-xs rounded">Past +30</button>
                <button onClick={() => setSuccessRate(75)} className="px-2 py-1 bg-gray-700 text-xs rounded">75%</button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Green Line: {greenLine}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={greenLine}
                onChange={(e) => setGreenLine(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Variation Selector */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">Angled Boost Warning Variations</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 1, name: 'Angled Polygon', color: 'Orange/Yellow', shape: 'Slanted Rectangle' },
              { id: 2, name: 'Power Hexagon', color: 'Cyan/Blue', shape: 'Hexagon Cut' },
              { id: 3, name: 'Threshold Box', color: 'Purple/Pink', shape: 'Cut Corner Square' },
              { id: 4, name: 'Diamond Alert', color: 'Green/Emerald', shape: 'Diamond' }
            ].map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariation(variant.id as 1 | 2 | 3 | 4)}
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${selectedVariation === variant.id
                    ? 'bg-purple-500/20 border-purple-400 text-purple-400'
                    : 'bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400'
                  }
                `}
              >
                <div className="text-lg font-bold mb-1">V{variant.id}</div>
                <div className="text-xs font-bold mb-1">{variant.name}</div>
                <div className="text-[10px] text-gray-500">Color: {variant.color}</div>
                <div className="text-[10px] text-gray-500">Shape: {variant.shape}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">Current Selection: Variation {selectedVariation}</h2>
          {renderCombinedSuccess(selectedVariation)}
        </div>

        {/* All Variations Side by Side */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">All Variations Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((variant) => (
              <div key={variant} className="bg-black p-3 rounded">
                <h3 className="text-xs font-bold text-purple-400 mb-2 text-center">
                  V{variant}: {
                    variant === 1 ? 'Angled' :
                    variant === 2 ? 'Hexagon' :
                    variant === 3 ? 'Threshold' :
                    'Diamond'
                  }
                </h3>
                {renderCombinedSuccess(variant)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Matrix Stream Animations */
        @keyframes matrixFall {
          0% { transform: translateY(-20px); }
          100% { transform: translateY(20px); }
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes gridFlicker {
          0% { opacity: 0.5; }
          50% { opacity: 0.7; }
          100% { opacity: 0.5; }
        }
        @keyframes dataStream {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes fastGleam {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(700%); }
        }
      `}</style>
    </div>
  );
}