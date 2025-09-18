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
}

export default function SuccessBar({
  currentSuccess,
  difficultyConfig,
  mekContributions = [],
  showDetails = true,
  height = 'h-12',
  className = '',
  baseRewards = { gold: 100, xp: 50 },
  potentialRewards = []
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

  // Determine status
  const status = useMemo(() => {
    if (currentSuccess >= 100) {
      return { text: 'PERFECT!', color: 'text-yellow-400', glow: true };
    } else if (currentSuccess >= greenLine) {
      const overshoot = currentSuccess - greenLine;
      return {
        text: overshoot > 0 ? `+${overshoot.toFixed(0)}% BONUS!` : 'GUARANTEED!',
        color: 'text-green-400',
        glow: true
      };
    } else if (currentSuccess >= greenLine * 0.5) {
      const shortfall = greenLine - currentSuccess;
      return {
        text: `${shortfall.toFixed(0)}% SHORT`,
        color: 'text-yellow-400',
        glow: false
      };
    } else {
      return {
        text: 'HIGH RISK!',
        color: 'text-red-400',
        glow: false
      };
    }
  }, [currentSuccess, greenLine]);

  return (
    <div className={`w-full ${className}`}>
      {/* Labels */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Success Rate</span>
          {currentSuccess > 0 && (
            <span className={`text-sm font-bold ${status.color}`}>
              {currentSuccess.toFixed(1)}%
            </span>
          )}
        </div>
        {status.text && (
          <span className={`text-sm font-bold ${status.color} ${status.glow ? 'animate-pulse' : ''}`}>
            {status.text}
          </span>
        )}
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

        {/* Success fill bar */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(100, currentSuccess)}%`,
            background: currentSuccess >= greenLine
              ? `linear-gradient(90deg, ${colors.primary}, ${colors.text})`
              : `linear-gradient(90deg, #dc2626, #f87171)`
          }}
        >
          {/* Animated shimmer effect */}
          <div
            className={`absolute inset-0 ${currentSuccess >= greenLine ? 'animate-pulse' : ''}`}
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
              animation: currentSuccess >= greenLine ? 'shimmer 2s infinite' : 'none'
            }}
          />
        </div>

        {/* Green line marker - more visible */}
        <div
          className="absolute top-0 bottom-0 w-1 shadow-2xl z-20"
          style={{
            left: `${greenLine}%`,
            backgroundColor: colors.primary,
            boxShadow: `0 0 20px ${colors.glow}, 0 0 10px ${colors.primary}`,
            filter: 'brightness(1.5)'
          }}
        >
          {/* Green line label */}
          <div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`
            }}
          >
            {difficultyConfig.displayName} {greenLine}%
          </div>
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

        {/* Status text overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-lg font-bold ${status.color} ${status.glow ? 'animate-pulse' : ''}`}>
            {status.text}
          </div>
        </div>

        {/* Percentage indicators */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pb-1 text-xs text-gray-500">
          <span>0%</span>
          <span style={{ marginLeft: `${greenLine - 50}%` }}>{greenLine}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Overshoot bonus details - shows real-time reward changes */}
      {overshootBonus > 0 && (
        <div className="mt-2 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
          <div className="text-xs text-green-400 font-semibold mb-2">Overshoot Bonus Active! +{overshootBonus.toFixed(0)}%</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Gold and XP changes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400">Gold:</span>
                <span>
                  <span className="text-gray-500">{Math.round(baseRewards.gold * difficultyConfig.goldMultiplier)}</span>
                  <span className="text-gray-500"> → </span>
                  <span className="text-green-400 font-bold">
                    {Math.round(baseRewards.gold * difficultyConfig.goldMultiplier * (1 + overshootBonus / 100))}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">XP:</span>
                <span>
                  <span className="text-gray-500">{Math.round(baseRewards.xp * difficultyConfig.xpMultiplier)}</span>
                  <span className="text-gray-500"> → </span>
                  <span className="text-green-400 font-bold">
                    {Math.round(baseRewards.xp * difficultyConfig.xpMultiplier * (1 + overshootBonus / 100))}
                  </span>
                </span>
              </div>
            </div>

            {/* Reward chances changes */}
            <div>
              <div className="text-gray-400 mb-1">Reward Chances:</div>
              {potentialRewards.slice(0, 3).map((reward, idx) => {
                // Calculate skewed chances - rarer items get bigger boost
                const rarityMultiplier = idx === 0 ? 1.0 : idx === 1 ? 1.2 : 1.5;
                const boostedChance = Math.min(100, reward.chance * (1 + (overshootBonus / 100) * rarityMultiplier));
                return (
                  <div key={reward.name} className="flex items-center justify-between">
                    <span className="text-gray-500 truncate max-w-[80px]" title={reward.name}>
                      {reward.name.length > 10 ? reward.name.substring(0, 10) + '...' : reward.name}:
                    </span>
                    <span>
                      <span className="text-gray-500">{reward.chance}%</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-green-400 font-bold">{boostedChance.toFixed(0)}%</span>
                    </span>
                  </div>
                );
              })}
              {/* Essence boost */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-700">
                <span className="text-gray-400">Essence:</span>
                <span className="text-green-400 font-bold">
                  ×{(difficultyConfig.essenceAmountMultiplier * (1 + overshootBonus / 100)).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <span className={`text-sm font-bold ${status.color}`}>{currentSuccess.toFixed(1)}%</span>
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

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}