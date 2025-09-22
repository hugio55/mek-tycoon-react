'use client';

import React from 'react';

interface SuccessMeterV2Props {
  successRate: number;
  greenLine: number;
  baseRewards?: {
    gold: number;
    xp: number;
  };
  difficultyConfig?: {
    goldMultiplier: number;
    xpMultiplier: number;
    essenceAmountMultiplier: number;
    overshootBonusRate: number;
    maxOvershootBonus: number;
  };
  showTitle?: boolean;
  barHeight?: number;
  className?: string;
  cardLayout?: 1 | 2 | 3 | 4 | 5; // How title, bar, and status are combined
}

export default function SuccessMeterV2({
  successRate,
  greenLine,
  baseRewards = { gold: 1000, xp: 500 },
  difficultyConfig = {
    goldMultiplier: 1.5,
    xpMultiplier: 1.5,
    essenceAmountMultiplier: 1.5,
    overshootBonusRate: 1,
    maxOvershootBonus: 50
  },
  showTitle = true,
  barHeight = 72,
  className = '',
  cardLayout = 1
}: SuccessMeterV2Props) {

  // Calculate overshoot bonus
  const overshootBonus = successRate > greenLine
    ? Math.min((successRate - greenLine) * difficultyConfig.overshootBonusRate, difficultyConfig.maxOvershootBonus)
    : 0;

  // Status flags
  const isOvershoot = successRate > greenLine;
  const hasReachedGoal = successRate >= greenLine;
  const percentToOvershoot = greenLine - successRate;

  // Calculate exact position for arrows and percentage text
  const paddingPixels = 8; // inset-2 = 8px on each side
  const goalpostPositionPercent = greenLine;

  // Determine success likelihood term and color
  const getSuccessLikelihoodData = (currentPercent: number, greenLinePercent: number) => {
    if (currentPercent >= greenLinePercent) return { term: 'Certain', color: '#10b981' }; // green-400
    if (greenLinePercent === 0) return { term: 'Certain', color: '#10b981' };
    const relativePercent = (currentPercent / greenLinePercent) * 100;

    if (relativePercent === 0) return { term: 'Impossible', color: '#dc2626' }; // red-600 - more vivid red
    if (relativePercent <= 5) return { term: 'Extremely Unlikely', color: '#ea580c' }; // orange-600
    if (relativePercent < 20) return { term: 'Very Unlikely', color: '#f97316' }; // orange-500
    if (relativePercent < 35) return { term: 'Unlikely', color: '#fb923c' }; // orange-400
    if (relativePercent < 45) return { term: 'Doubtful', color: '#fbbf24' }; // amber-400
    if (relativePercent < 55) return { term: 'Uncertain', color: '#fde047' }; // yellow-300
    if (relativePercent < 65) return { term: 'Possible', color: '#facc15' }; // yellow-400
    if (relativePercent < 80) return { term: 'Likely', color: '#a3e635' }; // lime-400
    if (relativePercent < 90) return { term: 'Very Likely', color: '#84cc16' }; // lime-500
    if (relativePercent < 95) return { term: 'Highly Likely', color: '#22c55e' }; // green-500
    return { term: 'Extremely Likely', color: '#10b981' }; // green-400
  };

  const likelihoodData = getSuccessLikelihoodData(successRate, greenLine);

  // Render title component (reusable across layouts)
  const renderTitle = (scale = 1, mb = 'mb-6', mt = '') => {
    if (!showTitle) return null;
    return (
      <div className={`relative ${mb} ${mt}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}>
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
    );
  };

  // Render bar component (reusable across layouts)
  const renderBar = (height = barHeight, showPercentage = true) => (
    <>
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl"
             style={{
               background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.9), rgba(30, 30, 30, 0.9))',
               backdropFilter: 'blur(10px)',
               border: '2px solid rgba(250, 204, 21, 0.3)',
               height: `${height}px`,
               zIndex: 10
             }}>

          <div className="absolute inset-0 opacity-30"
               style={{
                 background: 'linear-gradient(45deg, transparent 30%, rgba(250, 204, 21, 0.1) 50%, transparent 70%)',
                 animation: 'slide 4s infinite'
               }}></div>

          <div className="absolute inset-2 bg-black/50 rounded-xl">
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
                  <div className="absolute inset-0"
                       style={{
                         background: 'radial-gradient(ellipse at center, rgba(0, 255, 200, 0.3) 0%, transparent 70%)',
                         filter: 'blur(8px)'
                       }}></div>
                  <div className="absolute inset-0"
                       style={{
                         backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 4px, rgba(0, 255, 200, 0.1) 4px, rgba(0, 255, 200, 0.1) 6px, transparent 6px, transparent 10px, rgba(0, 255, 255, 0.15) 10px, rgba(0, 255, 255, 0.15) 11px, transparent 11px, transparent 16px)',
                         animation: 'matrixFall 1s linear infinite'
                       }}></div>
                  <div className="absolute inset-0"
                       style={{
                         backgroundImage: 'repeating-conic-gradient(from 30deg at 50% 50%, rgba(0, 255, 200, 0) 0deg, rgba(0, 255, 200, 0.2) 60deg, rgba(0, 255, 200, 0) 120deg)',
                         backgroundSize: '20px 20px',
                         animation: 'hexPulse 2s ease-in-out infinite'
                       }}></div>
                  <div className="absolute inset-0"
                       style={{
                         background: `repeating-linear-gradient(90deg, transparent 0, transparent 19px, rgba(0, 255, 255, 0.3) 19px, rgba(0, 255, 255, 0.3) 20px),
                                     repeating-linear-gradient(0deg, transparent 0, transparent 19px, rgba(0, 255, 200, 0.2) 19px, rgba(0, 255, 200, 0.2) 20px)`,
                         animation: 'gridFlicker 0.1s steps(2) infinite'
                       }}></div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 w-[15%]"
                         style={{
                           background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)',
                           animation: 'fastGleam 0.2s linear infinite'
                         }}></div>
                  </div>
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

        <div className="absolute pointer-events-none" style={{
          left: `calc(${paddingPixels}px + (100% - ${paddingPixels * 2}px) * ${goalpostPositionPercent / 100})`,
          top: 0,
          bottom: 0,
          zIndex: 20
        }}>
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
          <div className="absolute -translate-x-1/2" style={{ top: '-12px' }}>
            <div className={`text-base font-bold ${isOvershoot ? 'text-cyan-400' : 'text-green-400'}`}
                 style={{
                   filter: isOvershoot ? 'drop-shadow(0 0 15px #22d3ee)' : 'drop-shadow(0 0 10px #4ade80)',
                   animation: isOvershoot ? 'flash 0.5s infinite' : 'none'
                 }}>
              ▼
            </div>
          </div>
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

      {showPercentage && (
        <div className="relative h-6 mt-1">
          <div className="absolute -translate-x-1/2" style={{
            left: `calc(${paddingPixels}px + (100% - ${paddingPixels * 2}px) * ${goalpostPositionPercent / 100})`
          }}>
            <span className="text-xs font-bold text-green-400/60">
              {greenLine}%
            </span>
          </div>
        </div>
      )}
    </>
  );

  // Render status card component (reusable across layouts)
  const renderStatusCard = (compact = false, customMargin?: string) => (
    <div className={`relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden ${compact ? '' : customMargin || 'mt-4'}`}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
        backgroundSize: '20px 20px'
      }}></div>

      <div className="relative z-10">
        <div className={`bg-gradient-to-b from-yellow-500/10 to-transparent px-4 ${compact ? 'py-2' : 'py-3'} flex items-center justify-between`}>
          <div className="text-left">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
            <div className={`font-bold font-['Orbitron'] uppercase ${compact ? 'text-lg' : 'text-xl'}`}
                 style={{ color: likelihoodData.color }}>
              {likelihoodData.term}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              hasReachedGoal ? 'text-green-500' : 'text-gray-500'
            }`}>OVERSHOOT</div>
            <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold ${
              hasReachedGoal ? 'text-green-400' : 'text-gray-600'
            }`} style={{
              fontFamily: 'Roboto Mono, monospace',
              ...(hasReachedGoal ? {
                textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                filter: 'brightness(1.2)'
              } : {})
            }}>
              {overshootBonus.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

        <div className="relative">
          <div className={`px-4 ${compact ? 'py-2' : 'py-3'} space-y-1 ${!hasReachedGoal ? 'opacity-40' : ''}`}>
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

          {!hasReachedGoal && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Layout variations
  switch (cardLayout) {
    case 1: // Current Design - separate components (unchanged)
      return (
        <div className={`w-full ${className}`}>
          {renderTitle(0.9, 'mb-4', 'mt-3.5')}
          {renderBar()}
          {renderStatusCard(false, 'mt-2.5')}

          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
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

    case 2: // Unified Frame - all in one bordered card
      return (
        <div className={`w-full ${className}`}>
          <div className="bg-black/95 border-2 border-yellow-500/50 rounded-lg shadow-2xl overflow-hidden">
            <div className="p-4">
              {renderTitle(0.85, 'mb-4')}
              {renderBar(56)}
            </div>
            <div className="border-t-2 border-yellow-500/30">
              {renderStatusCard(true)}
            </div>
          </div>

          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
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

    case 3: // Compact Integration - tighter spacing
      return (
        <div className={`w-full ${className}`}>
          <div className="bg-gradient-to-b from-black/95 to-black/90 border border-yellow-500/40 rounded-lg p-3">
            {renderTitle(0.7, 'mb-3')}
            <div className="mb-3">
              {renderBar(48, false)}
            </div>
            <div className="-mx-3 -mb-3">
              {renderStatusCard(true)}
            </div>
          </div>

          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
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

    case 4: // Horizontal Flow - side by side elements
      return (
        <div className={`w-full ${className}`}>
          <div className="bg-black/95 border-2 border-yellow-500/50 rounded-lg p-4">
            {renderTitle(0.75, 'mb-3')}
            <div className="flex gap-3 items-stretch">
              <div className="flex-1">
                {renderBar(100, true)}
              </div>
              <div className="w-48">
                <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-2 h-full">
                  <div className="text-[9px] font-bold text-gray-500 uppercase">Status</div>
                  <div className="font-bold text-sm" style={{ color: likelihoodData.color }}>
                    {likelihoodData.term}
                  </div>
                  <div className="mt-2">
                    <div className="text-[9px] font-bold text-gray-500 uppercase">Overshoot</div>
                    <div className={`text-lg font-bold ${hasReachedGoal ? 'text-green-400' : 'text-gray-600'}`}>
                      {overshootBonus.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
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

    case 5: // Minimalist Card - clean single card
      return (
        <div className={`w-full ${className}`}>
          <div className="bg-gradient-to-b from-gray-950 to-black border border-yellow-500/30 rounded-xl shadow-2xl">
            <div className="p-4 pb-3">
              {showTitle && (
                <div className="text-center mb-3">
                  <h2 className="text-xl font-black uppercase tracking-[0.4em] text-yellow-400"
                      style={{ fontFamily: 'Orbitron, monospace' }}>
                    SUCCESS METER
                  </h2>
                </div>
              )}
              {renderBar(52, false)}
              <div className="flex justify-between items-center mt-3">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase">Status: </span>
                  <span className="text-sm font-bold" style={{ color: likelihoodData.color }}>
                    {likelihoodData.term}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase">Overshoot: </span>
                  <span className={`text-sm font-bold ${hasReachedGoal ? 'text-green-400' : 'text-gray-600'}`}>
                    {overshootBonus.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            {hasReachedGoal && (
              <div className="border-t border-yellow-500/20 px-4 py-2 bg-black/50">
                <div className="flex justify-between text-[10px]">
                  <span className="text-yellow-500">Gold: {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100)).toLocaleString()}</span>
                  <span className="text-blue-500">XP: {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100)).toLocaleString()}</span>
                  <span className="text-green-500">Ess: {(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}x</span>
                </div>
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
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

    default:
      return null;
  }
}