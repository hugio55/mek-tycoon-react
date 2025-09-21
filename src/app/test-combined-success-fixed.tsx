'use client';

import React, { useState } from 'react';
import { DifficultyConfig } from '@/lib/difficultyModifiers';

export default function TestCombinedSuccess() {
  const [successRate, setSuccessRate] = useState(52);
  const [greenLine, setGreenLine] = useState(31);
  const [selectedVariation, setSelectedVariation] = useState<1 | 2 | 3>(1);

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

        {/* Holographic Modern Bar from Improved Variant 2 - EXACT CORRECT COPY */}
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
                  width: `${Math.min(greenLine, successRate)}%`,
                  background: 'linear-gradient(90deg, #dc2626, #f59e0b, #facc15)',
                  filter: 'brightness(1.2)'
                }}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              </div>

              {/* Overshoot with intense glow */}
              {successRate > greenLine && (
                <div
                  className="absolute inset-y-0 transition-all duration-700 ease-out"
                  style={{
                    left: `${greenLine}%`,
                    width: `${successRate - greenLine}%`,
                    background: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac)',
                    boxShadow: '0 0 40px #4ade80, inset 0 0 30px rgba(74, 222, 128, 0.5)',
                    filter: 'brightness(1.3)'
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                  <div className="absolute inset-0 animate-pulse bg-green-400/20"></div>
                </div>
              )}
            </div>

            {/* Goalpost - Different variations for better visibility */}
            {variant === 1 && (
              /* Variation 1: Vertical line with orb */
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                {/* Vertical line */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-green-400 -translate-x-1/2"
                     style={{
                       boxShadow: '0 0 10px #4ade80, 0 0 20px #22c55e'
                     }}></div>
                {/* Center orb */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <div className="w-4 h-4 rounded-full bg-green-400"
                       style={{
                         boxShadow: '0 0 15px #4ade80, 0 0 30px #22c55e'
                       }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

            {variant === 2 && (
              /* Variation 2: Thick glowing line */
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                {/* Thick vertical line */}
                <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 -translate-x-1/2"
                     style={{
                       boxShadow: '0 0 15px #4ade80, 0 0 30px #22c55e, inset 0 0 5px rgba(255,255,255,0.5)'
                     }}></div>
                {/* Small center indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <div className="w-3 h-3 rounded-full bg-white"
                       style={{
                         boxShadow: '0 0 10px #fff'
                       }}></div>
                </div>
              </div>
            )}

            {variant === 3 && (
              /* Variation 3: Dashed line with marker */
              <div className="absolute top-0 bottom-0" style={{ left: `${greenLine}%` }}>
                {/* Dashed vertical line */}
                <div className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2"
                     style={{
                       background: 'repeating-linear-gradient(180deg, #4ade80 0px, #4ade80 4px, transparent 4px, transparent 8px)',
                       boxShadow: '0 0 8px #4ade80'
                     }}></div>
                {/* Triangle marker at top */}
                <div className="absolute top-0 -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-transparent border-t-green-400"
                       style={{
                         filter: 'drop-shadow(0 0 5px #4ade80)'
                       }}></div>
                </div>
                {/* Triangle marker at bottom */}
                <div className="absolute bottom-0 -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-green-400"
                       style={{
                         filter: 'drop-shadow(0 0 5px #4ade80)'
                       }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Minimal percentage display */}
        <div className="relative h-6 mt-1">
          <div className="absolute" style={{ left: `${greenLine}%`, transform: 'translateX(-50%)' }}>
            <span className="text-xs font-bold text-green-400/80">
              {greenLine}%
            </span>
          </div>
        </div>

        {/* Mission Status Card - Always using the winning design */}
        {(
          /* Original Style with Split Layout */
          <div className="mt-4 relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
              backgroundSize: '20px 20px'
            }}></div>

            <div className="relative z-10">
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

              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

              <div className="px-4 py-3 space-y-1">
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
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Combined Success Meter Test</h1>

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
          <h2 className="text-xl font-bold text-gray-300 mb-4">Goalpost Variations</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 1, name: 'Line with Orb', desc: 'Vertical line with center orb marker' },
              { id: 2, name: 'Thick Glow', desc: 'Thick glowing vertical line' },
              { id: 3, name: 'Dashed Markers', desc: 'Dashed line with triangle markers' }
            ].map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariation(variant.id as 1 | 2 | 3)}
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
          <h2 className="text-xl font-bold text-gray-300 mb-4">All Goalpost Variations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((variant) => (
              <div key={variant} className="bg-black p-4 rounded">
                <h3 className="text-sm font-bold text-purple-400 mb-3 text-center">
                  Variation {variant}
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
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
