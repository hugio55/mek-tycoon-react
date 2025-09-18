'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DifficultyLevel, getDifficultyColors } from '@/lib/difficultyModifiers';

export default function DifficultyAdminConfig() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<any>({});

  // Fetch configurations from database
  const configs = useQuery(api.difficultyConfigs.getAll);
  const upsertConfig = useMutation(api.difficultyConfigs.upsert);
  const initializeDefaults = useMutation(api.difficultyConfigs.initializeDefaults);
  const resetToDefaults = useMutation(api.difficultyConfigs.resetToDefaults);

  // Initialize local state when configs load
  useEffect(() => {
    if (configs && configs.length > 0) {
      const configMap: any = {};
      configs.forEach(c => {
        configMap[c.difficulty] = { ...c };
      });
      setLocalConfigs(configMap);
    }
  }, [configs]);

  const currentConfig = localConfigs[selectedDifficulty];
  const colors = getDifficultyColors(selectedDifficulty);

  const handleFieldChange = (field: string, value: any) => {
    setLocalConfigs((prev: any) => ({
      ...prev,
      [selectedDifficulty]: {
        ...prev[selectedDifficulty],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentConfig) return;

    await upsertConfig({
      difficulty: selectedDifficulty,
      successGreenLine: currentConfig.successGreenLine,
      goldMultiplier: currentConfig.goldMultiplier,
      xpMultiplier: currentConfig.xpMultiplier,
      essenceAmountMultiplier: currentConfig.essenceAmountMultiplier,
      minSlots: currentConfig.minSlots,
      maxSlots: currentConfig.maxSlots,
      singleSlotChance: currentConfig.singleSlotChance,
      deploymentFeeMultiplier: currentConfig.deploymentFeeMultiplier,
      commonEssenceBoost: currentConfig.commonEssenceBoost,
      rareEssencePenalty: currentConfig.rareEssencePenalty,
      overshootBonusRate: currentConfig.overshootBonusRate,
      maxOvershootBonus: currentConfig.maxOvershootBonus,
      colorTheme: currentConfig.colorTheme,
      displayName: currentConfig.displayName,
      description: currentConfig.description,
      isActive: currentConfig.isActive
    });

    setHasChanges(false);
  };

  const handleInitialize = async () => {
    await initializeDefaults();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all difficulty configurations to defaults?')) {
      await resetToDefaults();
      setHasChanges(false);
    }
  };

  if (!configs || configs.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded p-6">
        <p className="text-yellow-400 mb-4">No difficulty configurations found.</p>
        <button
          onClick={handleInitialize}
          className="bg-yellow-500 text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
        >
          Initialize Default Configurations
        </button>
      </div>
    );
  }

  if (!currentConfig) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Difficulty Selector */}
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(diff => {
          const diffColors = getDifficultyColors(diff);
          const isSelected = selectedDifficulty === diff;
          return (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-6 py-3 rounded-lg font-bold uppercase transition-all ${
                isSelected ? 'ring-2 transform scale-105' : ''
              }`}
              style={{
                backgroundColor: isSelected ? diffColors.background : 'rgba(0,0,0,0.5)',
                borderColor: diffColors.border,
                borderWidth: '2px',
                borderStyle: 'solid',
                color: isSelected ? diffColors.text : '#9CA3AF',
                boxShadow: isSelected ? `0 0 20px ${diffColors.glow}` : ''
              }}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Success Threshold */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Success Threshold</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Green Line Position (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentConfig.successGreenLine}
                onChange={(e) => handleFieldChange('successGreenLine', Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
              <div className="mt-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${currentConfig.successGreenLine}%`,
                    backgroundColor: colors.primary
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reward Multipliers */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Reward Multipliers</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Gold Multiplier
                <span className="text-yellow-400">{currentConfig.goldMultiplier}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={currentConfig.goldMultiplier}
                onChange={(e) => handleFieldChange('goldMultiplier', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                XP Multiplier
                <span className="text-blue-400">{currentConfig.xpMultiplier}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={currentConfig.xpMultiplier}
                onChange={(e) => handleFieldChange('xpMultiplier', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Essence Amount
                <span className="text-purple-400">{currentConfig.essenceAmountMultiplier}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={currentConfig.essenceAmountMultiplier}
                onChange={(e) => handleFieldChange('essenceAmountMultiplier', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Slot Configuration */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Mek Slots</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">Min Slots</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={currentConfig.minSlots}
                  onChange={(e) => handleFieldChange('minSlots', Number(e.target.value))}
                  className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max Slots</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={currentConfig.maxSlots}
                  onChange={(e) => handleFieldChange('maxSlots', Number(e.target.value))}
                  className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            {selectedDifficulty === 'easy' && (
              <div>
                <label className="text-xs text-gray-400 flex justify-between">
                  Single Slot Chance
                  <span className="text-green-400">{currentConfig.singleSlotChance}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentConfig.singleSlotChance}
                  onChange={(e) => handleFieldChange('singleSlotChance', Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Essence Distribution */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Essence Distribution</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Common Boost
                <span className={currentConfig.commonEssenceBoost >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {currentConfig.commonEssenceBoost > 0 ? '+' : ''}{currentConfig.commonEssenceBoost}%
                </span>
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={currentConfig.commonEssenceBoost}
                onChange={(e) => handleFieldChange('commonEssenceBoost', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Rare Modifier
                <span className={currentConfig.rareEssencePenalty >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {currentConfig.rareEssencePenalty > 0 ? '+' : ''}{currentConfig.rareEssencePenalty}%
                </span>
              </label>
              <input
                type="range"
                min="-100"
                max="200"
                value={currentConfig.rareEssencePenalty}
                onChange={(e) => handleFieldChange('rareEssencePenalty', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Overshoot Bonus */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Overshoot Bonus</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Bonus Rate (per % over)
                <span className="text-green-400">{currentConfig.overshootBonusRate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={currentConfig.overshootBonusRate}
                onChange={(e) => handleFieldChange('overshootBonusRate', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Max Bonus
                <span className="text-green-400">{currentConfig.maxOvershootBonus}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={currentConfig.maxOvershootBonus}
                onChange={(e) => handleFieldChange('maxOvershootBonus', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">Costs</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 flex justify-between">
                Deployment Fee
                <span className="text-red-400">{currentConfig.deploymentFeeMultiplier}x</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={currentConfig.deploymentFeeMultiplier}
                onChange={(e) => handleFieldChange('deploymentFeeMultiplier', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-400 mb-3">Configuration Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Success Line:</span>
            <span className="ml-2 text-white">{currentConfig.successGreenLine}%</span>
          </div>
          <div>
            <span className="text-gray-400">Gold:</span>
            <span className="ml-2 text-yellow-400">{currentConfig.goldMultiplier}x</span>
          </div>
          <div>
            <span className="text-gray-400">XP:</span>
            <span className="ml-2 text-blue-400">{currentConfig.xpMultiplier}x</span>
          </div>
          <div>
            <span className="text-gray-400">Slots:</span>
            <span className="ml-2 text-white">{currentConfig.minSlots}-{currentConfig.maxSlots}</span>
          </div>
          <div>
            <span className="text-gray-400">Entry Fee:</span>
            <span className="ml-2 text-red-400">{currentConfig.deploymentFeeMultiplier}x</span>
          </div>
          <div>
            <span className="text-gray-400">Overshoot:</span>
            <span className="ml-2 text-green-400">{currentConfig.overshootBonusRate}% per point</span>
          </div>
          <div>
            <span className="text-gray-400">Max Bonus:</span>
            <span className="ml-2 text-green-400">{currentConfig.maxOvershootBonus}%</span>
          </div>
          <div>
            <span className="text-gray-400">Essence:</span>
            <span className="ml-2 text-purple-400">{currentConfig.essenceAmountMultiplier}x</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="bg-red-600 text-white font-bold px-4 py-2 rounded hover:bg-red-500 transition-colors"
        >
          Reset All to Defaults
        </button>

        <div className="flex gap-3">
          {hasChanges && (
            <span className="text-yellow-400 text-sm self-center animate-pulse">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`font-bold px-6 py-2 rounded transition-colors ${
              hasChanges
                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}