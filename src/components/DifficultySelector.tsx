'use client';

import React from 'react';
import { DifficultyLevel, DifficultyConfig, getDifficultyColors, generateRewardPreview } from '@/lib/difficultyModifiers';

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  configs: DifficultyConfig[];
  baseRewards?: {
    gold: number;
    xp: number;
  };
  disabled?: boolean;
}

export default function DifficultySelector({
  currentDifficulty,
  onDifficultyChange,
  configs,
  baseRewards = { gold: 100, xp: 50 },
  disabled = false
}: DifficultySelectorProps) {

  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 text-center">
        Select Difficulty
      </div>

      {/* Difficulty Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {difficulties.map((difficulty) => {
          const config = configs.find(c => c.difficulty === difficulty);
          if (!config) return null;

          const colors = getDifficultyColors(difficulty);
          const isSelected = currentDifficulty === difficulty;

          return (
            <button
              key={difficulty}
              onClick={() => !disabled && onDifficultyChange(difficulty)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg transition-all duration-200
                ${isSelected
                  ? 'ring-2 shadow-lg transform scale-105'
                  : 'hover:transform hover:scale-102'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                backgroundColor: isSelected ? colors.background : 'rgba(0,0,0,0.5)',
                borderColor: colors.border,
                borderWidth: '2px',
                borderStyle: 'solid',
                boxShadow: isSelected ? `0 0 20px ${colors.glow}` : '',
                color: isSelected ? colors.text : '#9CA3AF',
              }}
            >
              {/* Difficulty Name */}
              <div className="font-bold text-lg mb-1" style={{ color: colors.primary }}>
                {config.displayName}
              </div>

              {/* Success Threshold */}
              <div className="text-xs opacity-90 mb-2">
                {config.successGreenLine}% Required
              </div>

              {/* Visual Indicator Bars */}
              <div className="space-y-1">
                {/* Risk Level */}
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60 w-12">Risk:</span>
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: difficulty === 'easy' ? '20%' : difficulty === 'medium' ? '50%' : '90%',
                        backgroundColor: colors.primary,
                      }}
                    />
                  </div>
                </div>

                {/* Reward Level */}
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60 w-12">Reward:</span>
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(config.goldMultiplier / 2.5) * 100}%`,
                        backgroundColor: '#FCD34D',
                      }}
                    />
                  </div>
                </div>

                {/* Slots */}
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60 w-12">Slots:</span>
                  <div className="text-xs font-mono">
                    {config.minSlots === config.maxSlots
                      ? config.minSlots
                      : `${config.minSlots}-${config.maxSlots}`}
                  </div>
                </div>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div
                  className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Info for Selected Difficulty */}
      {currentDifficulty && configs.length > 0 && (
        <div className="bg-black/50 border border-gray-700 rounded-lg p-3">
          {(() => {
            const config = configs.find(c => c.difficulty === currentDifficulty);
            if (!config) return null;

            const colors = getDifficultyColors(currentDifficulty);
            const preview = generateRewardPreview(baseRewards, config);

            return (
              <div>
                {/* Description */}
                {config.description && (
                  <p className="text-xs text-gray-400 mb-3">{config.description}</p>
                )}

                {/* Rewards Preview */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500 mb-1">Base Rewards:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Gold:</span>
                        <span className="text-yellow-400">
                          {Math.round(baseRewards.gold * config.goldMultiplier)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>XP:</span>
                        <span className="text-blue-400">
                          {Math.round(baseRewards.xp * config.xpMultiplier)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry Fee:</span>
                        <span className="text-red-400">
                          {Math.round(100 * config.deploymentFeeMultiplier)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Bonus Potential:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Per % Over:</span>
                        <span className="text-green-400">+{config.overshootBonusRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Bonus:</span>
                        <span className="text-green-400">+{config.maxOvershootBonus}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Essence:</span>
                        <span className="text-purple-400">×{config.essenceAmountMultiplier}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Bar Preview */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-500 mb-2">Success Threshold:</div>
                  <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                    {/* Background gradient */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(to right, transparent 0%, ${colors.primary} ${config.successGreenLine}%, transparent 100%)`,
                      }}
                    />

                    {/* Green line marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{
                        left: `${config.successGreenLine}%`,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <div
                        className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap px-1 rounded"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {config.successGreenLine}%
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <div className="text-xs">
                        <span className="text-red-400">Risk Zone</span>
                      </div>
                      <div className="text-xs ml-auto">
                        <span className="text-green-400">Bonus Zone</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}