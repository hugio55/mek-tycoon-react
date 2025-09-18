'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DifficultyLevel, getDifficultyColors } from '@/lib/difficultyModifiers';
import SuccessBar from '@/components/SuccessBar';

type NodeType = 'normal' | 'challenger' | 'event' | 'miniboss' | 'final_boss';

export default function DifficultyAdminConfig() {
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('normal');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<any>({});
  const [previewSuccessRate, setPreviewSuccessRate] = useState(50);

  // Dummy node data for each type
  const dummyNodeData = {
    normal: {
      name: 'Standard Combat Node',
      baseGold: 100,
      baseXp: 50,
      baseDeploymentCost: 20,
      potentialRewards: [
        { name: 'Power Chip', chance: 5 },
        { name: 'Rare Essence', chance: 15 },
        { name: 'Common Core', chance: 40 },
      ]
    },
    challenger: {
      name: 'Challenger Arena',
      baseGold: 150,
      baseXp: 75,
      baseDeploymentCost: 35,
      potentialRewards: [
        { name: 'Elite Badge', chance: 3 },
        { name: 'Enhanced Module', chance: 12 },
        { name: 'Battle Token', chance: 35 },
      ]
    },
    event: {
      name: 'Special Event Mission',
      baseGold: 80,
      baseXp: 40,
      baseDeploymentCost: 15,
      potentialRewards: [
        { name: 'Event Trophy', chance: 8 },
        { name: 'Limited Edition Item', chance: 20 },
        { name: 'Event Points', chance: 50 },
      ]
    },
    miniboss: {
      name: 'Mini Boss Encounter',
      baseGold: 250,
      baseXp: 125,
      baseDeploymentCost: 50,
      potentialRewards: [
        { name: 'Boss Crystal', chance: 2 },
        { name: 'Epic Component', chance: 10 },
        { name: 'Boss Token', chance: 25 },
      ]
    },
    final_boss: {
      name: 'Final Boss Battle',
      baseGold: 500,
      baseXp: 250,
      baseDeploymentCost: 100,
      potentialRewards: [
        { name: 'Legendary Artifact', chance: 1 },
        { name: 'Mythic Essence', chance: 5 },
        { name: 'Victory Medal', chance: 15 },
      ]
    }
  };

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
        const key = `${c.nodeType}_${c.difficulty}`;
        configMap[key] = { ...c };
      });
      setLocalConfigs(configMap);
    }
  }, [configs]);

  const configKey = `${selectedNodeType}_${selectedDifficulty}`;
  const currentConfig = localConfigs[configKey];
  const colors = getDifficultyColors(selectedDifficulty);

  const handleFieldChange = (field: string, value: any) => {
    setLocalConfigs((prev: any) => ({
      ...prev,
      [configKey]: {
        ...prev[configKey],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentConfig) return;

    await upsertConfig({
      nodeType: selectedNodeType,
      difficulty: selectedDifficulty,
      successGreenLine: currentConfig.successGreenLine,
      goldMultiplier: currentConfig.goldMultiplier,
      xpMultiplier: currentConfig.xpMultiplier,
      essenceAmountMultiplier: currentConfig.essenceAmountMultiplier,
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

  // Sample rewards for preview
  const sampleRewards = [
    { name: 'Legendary Chip', chance: 2 },
    { name: 'Rare Essence', chance: 10 },
    { name: 'Common Power', chance: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Node Type Selector */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <label className="text-sm font-bold text-yellow-400 mb-2 block">Select Node Type</label>
        <select
          value={selectedNodeType}
          onChange={(e) => setSelectedNodeType(e.target.value as NodeType)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
        >
          <option value="normal">Normal Mek</option>
          <option value="challenger">Challenger</option>
          <option value="event">Event</option>
          <option value="miniboss">Mini Boss</option>
          <option value="final_boss">Final Boss</option>
        </select>
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Live Preview Section */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-yellow-400">Live Preview: {dummyNodeData[selectedNodeType].name}</h4>
          <div className="text-xs text-gray-400">
            <span className="text-white font-bold">{selectedNodeType.toUpperCase()}</span> •
            <span className="ml-2" style={{ color: colors.text }}>{selectedDifficulty.toUpperCase()}</span>
          </div>
        </div>

        {/* Success Rate Slider Control */}
        <div className="mb-6 bg-gray-900/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-gray-300">Test Success Rate</label>
            <span className="text-lg font-bold text-yellow-400">{previewSuccessRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={previewSuccessRate}
            onChange={(e) => setPreviewSuccessRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${currentConfig.successGreenLine}%, #10b981 ${currentConfig.successGreenLine}%, #10b981 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="text-yellow-400">← Green Line: {currentConfig.successGreenLine}% →</span>
            <span>100%</span>
          </div>
        </div>

        {/* Success Bar Preview */}
        <SuccessBar
          currentSuccess={previewSuccessRate}
          difficultyConfig={currentConfig}
          showDetails={true}
          baseRewards={{
            gold: dummyNodeData[selectedNodeType].baseGold,
            xp: dummyNodeData[selectedNodeType].baseXp
          }}
          potentialRewards={dummyNodeData[selectedNodeType].potentialRewards}
        />

        {/* Base vs Modified Values */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-900/30 rounded-lg p-3">
            <h5 className="text-xs font-bold text-gray-400 mb-2">BASE VALUES</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Gold:</span>
                <span className="text-gray-400">{dummyNodeData[selectedNodeType].baseGold}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">XP:</span>
                <span className="text-gray-400">{dummyNodeData[selectedNodeType].baseXp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deploy Cost:</span>
                <span className="text-gray-400">{dummyNodeData[selectedNodeType].baseDeploymentCost}g</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-3">
            <h5 className="text-xs font-bold text-yellow-400 mb-2">WITH DIFFICULTY</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Gold:</span>
                <span className="text-yellow-400">
                  {Math.round(dummyNodeData[selectedNodeType].baseGold * currentConfig.goldMultiplier)}g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">XP:</span>
                <span className="text-blue-400">
                  {Math.round(dummyNodeData[selectedNodeType].baseXp * currentConfig.xpMultiplier)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deploy Cost:</span>
                <span className="text-red-400">
                  {Math.round(dummyNodeData[selectedNodeType].baseDeploymentCost * currentConfig.deploymentFeeMultiplier)}g
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Essence Distribution Explanation */}
        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h5 className="text-xs font-bold text-purple-400 mb-2">Essence Distribution Settings</h5>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              <span className="text-purple-300">Common Boost ({currentConfig.commonEssenceBoost}%):</span>
              <span className="ml-2">
                {currentConfig.commonEssenceBoost > 0 ? 'Increases' : currentConfig.commonEssenceBoost < 0 ? 'Decreases' : 'No change to'} common essence drop rate
              </span>
            </div>
            <div>
              <span className="text-purple-300">Rare Modifier ({currentConfig.rareEssencePenalty}%):</span>
              <span className="ml-2">
                {currentConfig.rareEssencePenalty > 0 ? 'Increases' : currentConfig.rareEssencePenalty < 0 ? 'Decreases' : 'No change to'} rare essence drop rate
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-purple-500/20">
              💡 When overshoot bonus is active, rarer items get proportionally bigger chance boosts
            </div>
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