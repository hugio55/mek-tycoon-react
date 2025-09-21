'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DifficultyLevel, getDifficultyColors } from '@/lib/difficultyModifiers';
import SuccessBar from '@/components/SuccessBar';

type NodeType = 'normal' | 'challenger' | 'event' | 'miniboss' | 'final_boss';

interface DifficultyAdminConfigProps {
  testSuccessRate?: number;
}

export default function DifficultyAdminConfig({ testSuccessRate: externalTestRate }: DifficultyAdminConfigProps = {}) {
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('normal');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<any>({});
  const [previewSuccessRate, setPreviewSuccessRate] = useState(50);
  const [successBarLayout, setSuccessBarLayout] = useState<1 | 2 | 3 | 4 | 5>(1);

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

  // Sync external test rate when provided
  useEffect(() => {
    if (externalTestRate !== undefined) {
      setPreviewSuccessRate(externalTestRate);
    }
  }, [externalTestRate]);

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
      deploymentFeeMultiplier: currentConfig.deploymentFeeMultiplier,
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

  // State for controlling test panel visibility
  const [showTestPanel, setShowTestPanel] = useState(false);

  if (!configs) {
    return <div className="text-gray-400">Loading configurations...</div>;
  }

  if (configs.length === 0) {
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
    return (
      <div className="bg-gray-800/30 rounded p-6">
        <p className="text-yellow-400 mb-4">Configuration for {selectedNodeType} ({selectedDifficulty}) not found.</p>
        <p className="text-gray-400 mb-4">Some configurations may be missing from the database.</p>
        <div className="flex gap-3">
          <button
            onClick={handleInitialize}
            className="bg-yellow-500 text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
          >
            Initialize Missing Configurations
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 text-white font-bold px-4 py-2 rounded hover:bg-red-400 transition-colors"
          >
            Reset All to Defaults
          </button>
        </div>
      </div>
    );
  }

  // Sample rewards for preview
  const sampleRewards = [
    { name: 'Legendary Chip', chance: 2 },
    { name: 'Rare Essence', chance: 10 },
    { name: 'Common Power', chance: 30 },
  ];

  return (
    <div className="space-y-6 relative">
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

        {/* Enhanced Success Rate Testing Controls */}
        <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-purple-300 uppercase tracking-wider">
              🧪 Success Meter Testing Controls
            </label>
            <button
              onClick={() => setPreviewSuccessRate(currentConfig.successGreenLine)}
              className="text-xs px-3 py-1 bg-green-600/30 border border-green-400 rounded text-green-300 hover:bg-green-600/50 transition-colors"
            >
              Jump to Green Line
            </button>
          </div>

          {/* Current Value Display */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-2xl font-bold text-yellow-400 font-mono">{previewSuccessRate}%</span>
            <div className="flex-1 text-xs text-gray-400">
              {previewSuccessRate < currentConfig.successGreenLine ? (
                <span>
                  <span className="text-orange-400">{(currentConfig.successGreenLine - previewSuccessRate).toFixed(1)}%</span> below green line
                </span>
              ) : previewSuccessRate > currentConfig.successGreenLine ? (
                <span>
                  <span className="text-green-400">+{(previewSuccessRate - currentConfig.successGreenLine).toFixed(1)}%</span> overshoot bonus
                </span>
              ) : (
                <span className="text-green-400">Exactly at green line</span>
              )}
            </div>
          </div>

          {/* Main Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={previewSuccessRate}
            onChange={(e) => setPreviewSuccessRate(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                #dc2626 0%,
                #dc2626 ${currentConfig.successGreenLine}%,
                #10b981 ${currentConfig.successGreenLine}%,
                #10b981 100%)`
            }}
          />

          {/* Quick Jump Buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setPreviewSuccessRate(0)}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              0%
            </button>
            <button
              onClick={() => setPreviewSuccessRate(Math.floor(currentConfig.successGreenLine * 0.25))}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              25% to GL
            </button>
            <button
              onClick={() => setPreviewSuccessRate(Math.floor(currentConfig.successGreenLine * 0.5))}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              50% to GL
            </button>
            <button
              onClick={() => setPreviewSuccessRate(Math.floor(currentConfig.successGreenLine * 0.75))}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              75% to GL
            </button>
            <button
              onClick={() => setPreviewSuccessRate(currentConfig.successGreenLine)}
              className="text-xs px-2 py-1 bg-green-700 rounded hover:bg-green-600 transition-colors font-bold"
            >
              Green Line
            </button>
            <button
              onClick={() => setPreviewSuccessRate(Math.min(100, currentConfig.successGreenLine + 10))}
              className="text-xs px-2 py-1 bg-green-700 rounded hover:bg-green-600 transition-colors"
            >
              +10% Over
            </button>
            <button
              onClick={() => setPreviewSuccessRate(Math.min(100, currentConfig.successGreenLine + 25))}
              className="text-xs px-2 py-1 bg-green-700 rounded hover:bg-green-600 transition-colors"
            >
              +25% Over
            </button>
            <button
              onClick={() => setPreviewSuccessRate(100)}
              className="text-xs px-2 py-1 bg-yellow-700 rounded hover:bg-yellow-600 transition-colors"
            >
              100%
            </button>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span className="text-yellow-400">← Green Line: {currentConfig.successGreenLine}% →</span>
            <span>100%</span>
          </div>
        </div>

        {/* Success Bar Layout Selector */}
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Success Bar Layout Style</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((layout) => (
              <button
                key={layout}
                onClick={() => setSuccessBarLayout(layout as 1 | 2 | 3 | 4 | 5)}
                className={`
                  px-3 py-2 rounded text-sm font-bold transition-all flex-1
                  ${successBarLayout === layout
                    ? 'bg-yellow-500/30 border-2 border-yellow-400 text-yellow-400'
                    : 'bg-black/40 border-2 border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                  }
                `}
                title={`Layout ${layout}: ${[
                  'Vertical Stack',
                  'Two-Row',
                  'Grid Modular',
                  'Asymmetric',
                  'Compact Pills'
                ][layout - 1]}`}
              >
                {layout}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {[
              '1: Vertical Stacked Card',
              '2: Two-Row Horizontal',
              '3: Grid Modular 2x2',
              '4: Asymmetric Hero',
              '5: Compact Badge/Pills'
            ][successBarLayout - 1]}
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
          layoutStyle={successBarLayout}
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

      {/* Floating Success Meter Test Panel - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-50">
        {/* Toggle Button */}
        {!showTestPanel && (
          <button
            onClick={() => setShowTestPanel(true)}
            className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all"
          >
            <span className="text-lg">🧪</span>
            <span className="text-sm font-bold">Test Success Meter</span>
          </button>
        )}

        {/* Test Panel */}
        {showTestPanel && (
          <div className="bg-black/95 border-2 border-purple-500/50 rounded-lg p-4 shadow-2xl w-80 backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                🧪 Success Meter Test
              </span>
              <button
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {/* Current Value */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold text-yellow-400">{previewSuccessRate}%</span>
              <div className="flex-1 text-xs text-gray-400">
                {previewSuccessRate < currentConfig.successGreenLine ? (
                  <span>
                    <span className="text-orange-400">{(currentConfig.successGreenLine - previewSuccessRate).toFixed(0)}%</span> below GL
                  </span>
                ) : previewSuccessRate > currentConfig.successGreenLine ? (
                  <span>
                    <span className="text-green-400">+{(previewSuccessRate - currentConfig.successGreenLine).toFixed(0)}%</span> overshoot
                  </span>
                ) : (
                  <span className="text-green-400">At green line</span>
                )}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={previewSuccessRate}
              onChange={(e) => setPreviewSuccessRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-3"
              style={{
                background: `linear-gradient(to right,
                  #dc2626 0%,
                  #dc2626 ${currentConfig.successGreenLine}%,
                  #10b981 ${currentConfig.successGreenLine}%,
                  #10b981 100%)`
              }}
            />

            {/* Quick Jump Buttons */}
            <div className="grid grid-cols-4 gap-1 text-xs">
              <button
                onClick={() => setPreviewSuccessRate(0)}
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                0%
              </button>
              <button
                onClick={() => setPreviewSuccessRate(Math.floor(currentConfig.successGreenLine * 0.5))}
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                50%→GL
              </button>
              <button
                onClick={() => setPreviewSuccessRate(currentConfig.successGreenLine)}
                className="px-2 py-1 bg-green-700 rounded hover:bg-green-600 font-bold"
              >
                GL
              </button>
              <button
                onClick={() => setPreviewSuccessRate(100)}
                className="px-2 py-1 bg-yellow-700 rounded hover:bg-yellow-600"
              >
                100%
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}