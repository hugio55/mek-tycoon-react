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
    const percentToOvershoot = greenLine - successRate;

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
          {/* Extended Arrow Markers - OUTSIDE the frame */}
          {variant === 1 && (
            <div className="absolute inset-0 pointer-events-none" style={{ left: `${greenLine}%` }}>
              {/* Top arrow way outside */}
              <div className="absolute -top-8 -translate-x-1/2">
                <div className={`text-2xl font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                     style={{
                       filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                       animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                     }}>
                  ▼
                </div>
              </div>
              {/* Bottom arrow way outside */}
              <div className="absolute -bottom-8 top-auto -translate-x-1/2">
                <div className={`text-2xl font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                     style={{
                       filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                       animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                     }}>
                  ▲
                </div>
              </div>
            </div>
          )}

          {variant === 2 && (
            <div className="absolute inset-0 pointer-events-none" style={{ left: `${greenLine}%` }}>
              {/* Large diamond markers outside */}
              <div className="absolute -top-10 -translate-x-1/2">
                <div className={`w-4 h-4 rotate-45 ${isOvershoot ? 'bg-cyan-400' : 'bg-green-400'}`}
                     style={{
                       boxShadow: isOvershoot ? '0 0 20px #22d3ee, 0 0 40px #22d3ee' : '0 0 15px #4ade80',
                       animation: isOvershoot ? 'pulse 0.3s infinite' : 'none'
                     }}></div>
              </div>
              <div className="absolute -bottom-10 top-auto -translate-x-1/2">
                <div className={`w-4 h-4 rotate-45 ${isOvershoot ? 'bg-cyan-400' : 'bg-green-400'}`}
                     style={{
                       boxShadow: isOvershoot ? '0 0 20px #22d3ee, 0 0 40px #22d3ee' : '0 0 15px #4ade80',
                       animation: isOvershoot ? 'pulse 0.3s infinite' : 'none'
                     }}></div>
              </div>
            </div>
          )}

          {variant === 3 && (
            <div className="absolute inset-0 pointer-events-none" style={{ left: `${greenLine}%` }}>
              {/* Bracket markers outside */}
              <div className="absolute -top-9 -translate-x-1/2">
                <div className={`text-xl font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                     style={{
                       filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                       animation: isOvershoot ? 'glow-pulse 0.4s infinite' : 'none'
                     }}>
                  ⌄
                </div>
              </div>
              <div className="absolute -bottom-9 top-auto -translate-x-1/2">
                <div className={`text-xl font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                     style={{
                       filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                       animation: isOvershoot ? 'glow-pulse 0.4s infinite' : 'none'
                     }}>
                  ⌃
                </div>
              </div>
            </div>
          )}

          {variant === 4 && (
            <div className="absolute inset-0 pointer-events-none" style={{ left: `${greenLine}%` }}>
              {/* Line extensions with caps */}
              <div className="absolute -top-12 -translate-x-1/2">
                <div className={`w-6 h-1 ${isOvershoot ? 'bg-cyan-400' : 'bg-green-400'}`}
                     style={{
                       boxShadow: isOvershoot ? '0 0 20px #22d3ee' : '0 0 15px #4ade80',
                       animation: isOvershoot ? 'flash 0.3s infinite' : 'none'
                     }}></div>
              </div>
              <div className="absolute -bottom-12 top-auto -translate-x-1/2">
                <div className={`w-6 h-1 ${isOvershoot ? 'bg-cyan-400' : 'bg-green-400'}`}
                     style={{
                       boxShadow: isOvershoot ? '0 0 20px #22d3ee' : '0 0 15px #4ade80',
                       animation: isOvershoot ? 'flash 0.3s infinite' : 'none'
                     }}></div>
              </div>
            </div>
          )}

          {/* Holographic Modern Bar - Reduced height from h-20 to h-18 */}
          <div className="relative h-18 rounded-2xl overflow-hidden shadow-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.9), rgba(30, 30, 30, 0.9))',
                 backdropFilter: 'blur(10px)',
                 border: '2px solid rgba(250, 204, 21, 0.3)',
                 height: '72px' // Reduced from 80px by 10%
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

                {/* Animated Overshoot with energy effects */}
                {successRate > greenLine && (
                  <div
                    className="absolute inset-y-0 transition-all duration-700 ease-out"
                    style={{
                      left: `${greenLine}%`,
                      width: `${successRate - greenLine}%`,
                      background: 'linear-gradient(90deg, #047857, #10b981, #34d399)',
                      boxShadow: '0 0 25px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(52, 211, 153, 0.4)',
                      filter: 'brightness(1.2)'
                    }}>
                    {/* Base gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>

                    {/* Energy pulse animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                         style={{
                           animation: 'energy-flow 1.5s infinite'
                         }}></div>

                    {/* Light blue shimmer streaks */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0"
                           style={{
                             background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(34, 211, 238, 0.2) 10px, rgba(34, 211, 238, 0.2) 12px)',
                             animation: 'shimmer-fast 0.8s infinite linear'
                           }}></div>
                    </div>

                    {/* Energy particles */}
                    <div className="absolute inset-0"
                         style={{
                           backgroundImage: `radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.3) 0%, transparent 50%),
                                           radial-gradient(circle at 80% 50%, rgba(34, 211, 238, 0.3) 0%, transparent 50%)`,
                           animation: 'pulse 2s infinite'
                         }}></div>
                  </div>
                )}
              </div>

              {/* Goalpost - changes color when passed */}
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                {/* Main vertical line - glows white-blue when passed */}
                <div className={`absolute top-0 bottom-0 w-0.5 -translate-x-1/2 ${
                  isOvershoot ? 'bg-cyan-400' : 'bg-green-400'
                }`}
                     style={{
                       boxShadow: isOvershoot
                         ? '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 30px #0891b2'
                         : '0 0 8px #4ade80',
                       animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                     }}></div>

                {/* Center orb - also changes */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <div className={`w-4 h-4 rounded-full ${
                    isOvershoot ? 'bg-white' : 'bg-green-400'
                  }`}
                       style={{
                         boxShadow: isOvershoot
                           ? '0 0 20px #22d3ee, 0 0 40px #0891b2'
                           : '0 0 15px #4ade80, 0 0 30px #22c55e'
                       }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal percentage display */}
        <div className="relative h-6 mt-1">
          <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
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
                  isOvershoot ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {getSuccessLikelihood(successRate, greenLine)}
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
              <div className={`px-4 py-3 space-y-1 ${!isOvershoot ? 'opacity-40' : ''}`}>
                {/* Gold */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${isOvershoot ? 'text-yellow-500' : 'text-gray-500'}`}>Gold:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${isOvershoot ? 'text-gray-500' : 'text-gray-600'}`}>
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier).toLocaleString()}
                    </span>
                    <span className={`text-xs ${isOvershoot ? 'text-yellow-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${isOvershoot ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${isOvershoot ? 'text-blue-500' : 'text-gray-500'}`}>XP:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${isOvershoot ? 'text-gray-500' : 'text-gray-600'}`}>
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier).toLocaleString()}
                    </span>
                    <span className={`text-xs ${isOvershoot ? 'text-blue-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${isOvershoot ? 'text-blue-400' : 'text-gray-500'}`}>
                      {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Essence */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase font-bold ${isOvershoot ? 'text-green-500' : 'text-gray-500'}`}>Essence:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${isOvershoot ? 'text-gray-500' : 'text-gray-600'}`}>
                      {difficultyConfig.essenceAmountMultiplier.toFixed(1)}x
                    </span>
                    <span className={`text-xs ${isOvershoot ? 'text-green-500' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-bold tabular-nums ${isOvershoot ? 'text-green-400' : 'text-gray-500'}`}>
                      {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Industrial warning overlay variations when below goalpost */}
              {!isOvershoot && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {variant === 1 && (
                    /* V1: Clean industrial with yellow accent */
                    <div className="bg-black/95 border-2 border-yellow-500/60 px-3 py-2">
                      <div className="text-center">
                        <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
                          Overshoot Bonuses in {Math.abs(percentToOvershoot).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {variant === 2 && (
                    /* V2: Hazard stripes */
                    <div className="relative bg-black/95 border border-yellow-500/40 px-3 py-2">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(250, 204, 21, 0.1) 3px, rgba(250, 204, 21, 0.1) 6px)'
                      }}></div>
                      <div className="relative text-center">
                        <div className="text-xs text-yellow-400 font-bold">
                          ⚠ OVERSHOOT IN {Math.abs(percentToOvershoot).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {variant === 3 && (
                    /* V3: Metallic plate */
                    <div className="bg-gradient-to-b from-gray-800 to-black border-t-2 border-b-2 border-yellow-500/50 px-4 py-1.5">
                      <div className="text-center">
                        <div className="text-[11px] text-yellow-500 font-black uppercase" style={{
                          letterSpacing: '0.15em',
                          textShadow: '0 1px 0 rgba(0,0,0,0.5)'
                        }}>
                          +{Math.abs(percentToOvershoot).toFixed(0)}% TO OVERSHOOT
                        </div>
                      </div>
                    </div>
                  )}

                  {variant === 4 && (
                    /* V4: Alert badge */
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-500/20 blur-xl"></div>
                      <div className="relative bg-black border border-yellow-500 px-2 py-1">
                        <div className="absolute -top-px -bottom-px -left-1 w-1 bg-yellow-500"></div>
                        <div className="absolute -top-px -bottom-px -right-1 w-1 bg-yellow-500"></div>
                        <div className="text-[11px] text-yellow-400 font-bold text-center">
                          BONUS: {Math.abs(percentToOvershoot).toFixed(0)}%
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
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Combined Success Meter Test - Enhanced Variations</h1>

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
                <button onClick={() => setSuccessRate(greenLine + 15)} className="px-2 py-1 bg-gray-700 text-xs rounded">Past</button>
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
          <h2 className="text-xl font-bold text-gray-300 mb-4">Marker & Warning Box Variations</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 1, name: 'Extended Arrows', desc: 'Arrows outside frame, clean warning box' },
              { id: 2, name: 'Diamond Markers', desc: 'Diamond markers, hazard stripe warning' },
              { id: 3, name: 'Bracket Style', desc: 'Bracket markers, metallic plate warning' },
              { id: 4, name: 'Line Caps', desc: 'Line extensions, alert badge warning' }
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
                <div className="text-[10px] text-gray-500">{variant.desc}</div>
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
                  V{variant}
                </h3>
                {renderCombinedSuccess(variant)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes energy-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}