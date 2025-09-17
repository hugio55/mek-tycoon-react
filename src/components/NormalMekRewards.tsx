'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface RewardConfig {
  goldRange: { min: number; max: number };
  goldCurve: number;
  goldRounding: 'none' | '5' | '10' | '100' | '1000';
  xpRange: { min: number; max: number };
  xpCurve: number;
  xpRounding: 'none' | '10' | '100' | '1000';
  essenceRange: { min: number; max: number };
  essenceCurve: number;
  essenceRounding: 'none' | '0.1' | '0.5' | '1';
}

export default function NormalMekRewards() {
  // Load config from localStorage or use defaults
  const getInitialConfig = (): RewardConfig => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('normalMekRewardConfig');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved config:', e);
        }
      }
    }
    return {
      goldRange: { min: 100, max: 10000 },
      goldCurve: 0,
      goldRounding: '100',
      xpRange: { min: 10, max: 1000 },
      xpCurve: 0,
      xpRounding: '10',
      essenceRange: { min: 1, max: 5 },
      essenceCurve: 0,
      essenceRounding: '0.1',
    };
  };

  const [config, setConfig] = useState<RewardConfig>(getInitialConfig());
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  const [selectedMekRank, setSelectedMekRank] = useState(2250);
  const [searchValue, setSearchValue] = useState('2250');
  const [searchType, setSearchType] = useState<'rank' | 'assetId'>('rank');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentMessage, setDeploymentMessage] = useState('');

  // Auto-save config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('normalMekRewardConfig', JSON.stringify(config));
    }
  }, [config]);

  const saveConfiguration = useMutation(api.normalMekRewards.saveConfiguration);
  const updateConfiguration = useMutation(api.normalMekRewards.updateConfiguration);
  const savedConfigs = useQuery(api.normalMekRewards.getConfigurations);
  const deployAllMekanisms = useMutation(api.deployedNodeData.deployAllMekanisms);
  const [saveName, setSaveName] = useState('');

  // Query backend for real mek variation data
  const mekBySearch = useQuery(api.normalMekRewards.getMekByRankOrId, {
    value: searchValue,
    searchType: searchType
  });
  const allVariationCounts = useQuery(api.normalMekRewards.getAllVariationCounts);

  // Apply rounding based on rounding setting
  const applyRounding = (value: number, rounding: string): number => {
    switch (rounding) {
      case 'none':
        return value;
      case '0.1':
        return Math.round(value * 10) / 10;
      case '0.5':
        return Math.round(value * 2) / 2;
      case '1':
        return Math.round(value);
      case '5':
        return Math.round(value / 5) * 5;
      case '10':
        return Math.round(value / 10) * 10;
      case '100':
        return Math.round(value / 100) * 100;
      case '1000':
        return Math.round(value / 1000) * 1000;
      default:
        return value;
    }
  };

  // Calculate reward based on rank and curve (rank 1 = highest rewards, rank 4000 = lowest)
  const calculateReward = (rank: number, min: number, max: number, curve: number, rounding: string = 'none'): number => {
    // Normalize rank (1-4000) to 0-1, where rank 1 = 1 and rank 4000 = 0
    const normalizedRank = 1 - ((rank - 1) / (4000 - 1));

    // Apply curve (-1 to 1, where 0 is linear)
    let curvedValue = normalizedRank;
    if (curve !== 0) {
      const factor = Math.abs(curve) * 2; // Scale curve effect
      if (curve > 0) {
        // Exponential curve (more rewards at top ranks)
        curvedValue = Math.pow(normalizedRank, 1 / (1 + factor));
      } else {
        // Logarithmic curve (flatter distribution)
        curvedValue = Math.pow(normalizedRank, 1 + factor);
      }
    }

    const result = min + (max - min) * curvedValue;
    return applyRounding(result, rounding);
  };


  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a save name');
      return;
    }

    try {
      const result = await saveConfiguration({
        name: saveName,
        data: JSON.stringify(config),
        timestamp: Date.now(),
      });

      if (result.updated) {
        alert('Configuration updated successfully!');
      } else {
        alert('New configuration saved successfully!');
      }

      // Track the saved config ID for updates
      if (result.id) {
        setSelectedConfigId(result.id);
      }

      setSaveName('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  const handleUpdate = async () => {
    if (!selectedConfigId) {
      alert('Please select a configuration to update');
      return;
    }

    try {
      await updateConfiguration({
        configId: selectedConfigId as any,
        data: JSON.stringify(config),
        timestamp: Date.now(),
      });
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration');
    }
  };

  // Use the actual rank from the found mek or fallback to default
  const actualRank = mekBySearch?.mek?.rank || selectedMekRank;

  const goldReward = calculateReward(actualRank, config.goldRange.min, config.goldRange.max, config.goldCurve, config.goldRounding);
  const xpReward = calculateReward(actualRank, config.xpRange.min, config.xpRange.max, config.xpCurve, config.xpRounding);
  const essenceReward = calculateReward(actualRank, config.essenceRange.min, config.essenceRange.max, config.essenceCurve, config.essenceRounding);

  // Use backend data for essence probabilities
  const essenceProbabilities = mekBySearch?.probabilities || [];

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Normal Mek Node Rewards</h4>

        {/* Variation Statistics */}
        {allVariationCounts && (
          <div className="mb-4 bg-black/30 rounded p-3">
            <h5 className="text-cyan-400 text-sm font-bold mb-2">Mek Database Statistics</h5>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400">Total Meks:</span>
                <span className="text-cyan-300 font-bold ml-2">{allVariationCounts.totalMeks}</span>
              </div>
              <div>
                <span className="text-gray-400">Unique Heads:</span>
                <span className="text-yellow-300 font-bold ml-2">{allVariationCounts.uniqueHeads}</span>
              </div>
              <div>
                <span className="text-gray-400">Unique Bodies:</span>
                <span className="text-blue-300 font-bold ml-2">{allVariationCounts.uniqueBodies}</span>
              </div>
              <div>
                <span className="text-gray-400">Unique Traits:</span>
                <span className="text-purple-300 font-bold ml-2">{allVariationCounts.uniqueTraits}</span>
              </div>
            </div>
          </div>
        )}

        {/* Master Ranges */}
        <div className="space-y-4">
          {/* Gold Range */}
          <div className="bg-black/30 rounded p-3">
            <h5 className="text-yellow-400 text-sm font-bold mb-2">Gold Rewards (Ranks 1-4000)</h5>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400">Min (Lowest Rank)</label>
                <input
                  type="number"
                  value={config.goldRange.min}
                  onChange={(e) => setConfig({...config, goldRange: {...config.goldRange, min: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-sm text-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max (Rank 1)</label>
                <input
                  type="number"
                  value={config.goldRange.max}
                  onChange={(e) => setConfig({...config, goldRange: {...config.goldRange, max: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-sm text-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Curve</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={config.goldCurve}
                    onChange={(e) => setConfig({...config, goldCurve: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-xs text-yellow-400 w-10">{config.goldCurve.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Rounding</label>
                <select
                  value={config.goldRounding}
                  onChange={(e) => setConfig({...config, goldRounding: e.target.value as any})}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-sm text-yellow-400"
                >
                  <option value="none">None</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="100">100</option>
                  <option value="1000">1000</option>
                </select>
              </div>
            </div>
          </div>

          {/* XP Range */}
          <div className="bg-black/30 rounded p-3">
            <h5 className="text-blue-400 text-sm font-bold mb-2">XP Rewards (Ranks 1-4000)</h5>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400">Min (Lowest Rank)</label>
                <input
                  type="number"
                  value={config.xpRange.min}
                  onChange={(e) => setConfig({...config, xpRange: {...config.xpRange, min: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-sm text-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max (Rank 1)</label>
                <input
                  type="number"
                  value={config.xpRange.max}
                  onChange={(e) => setConfig({...config, xpRange: {...config.xpRange, max: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-sm text-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Curve</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={config.xpCurve}
                    onChange={(e) => setConfig({...config, xpCurve: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-xs text-blue-400 w-10">{config.xpCurve.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Rounding</label>
                <select
                  value={config.xpRounding}
                  onChange={(e) => setConfig({...config, xpRounding: e.target.value as any})}
                  className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-sm text-blue-400"
                >
                  <option value="none">None</option>
                  <option value="10">10</option>
                  <option value="100">100</option>
                  <option value="1000">1000</option>
                </select>
              </div>
            </div>
          </div>

          {/* Essence Range */}
          <div className="bg-black/30 rounded p-3">
            <h5 className="text-purple-400 text-sm font-bold mb-2">Essence Amount (Ranks 1-4000)</h5>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400">Min (Lowest Rank)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.essenceRange.min}
                  onChange={(e) => setConfig({...config, essenceRange: {...config.essenceRange, min: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-purple-400/30 rounded text-sm text-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max (Rank 1)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.essenceRange.max}
                  onChange={(e) => setConfig({...config, essenceRange: {...config.essenceRange, max: Number(e.target.value)}})}
                  className="w-full px-2 py-1 bg-black/50 border border-purple-400/30 rounded text-sm text-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Curve</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={config.essenceCurve}
                    onChange={(e) => setConfig({...config, essenceCurve: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-xs text-purple-400 w-10">{config.essenceCurve.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Rounding</label>
                <select
                  value={config.essenceRounding}
                  onChange={(e) => setConfig({...config, essenceRounding: e.target.value as any})}
                  className="w-full px-2 py-1 bg-black/50 border border-purple-400/30 rounded text-sm text-purple-400"
                >
                  <option value="none">None</option>
                  <option value="0.1">0.1</option>
                  <option value="0.5">0.5</option>
                  <option value="1">1</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Calculator */}
        <div className="mt-6 bg-black/30 rounded p-3">
          <h5 className="text-green-400 text-sm font-bold mb-3">Reward Preview Calculator</h5>

          {/* Search Type Toggle */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setSearchType('rank')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                searchType === 'rank'
                  ? 'bg-green-500/30 text-green-400 border border-green-400/50'
                  : 'bg-black/30 text-gray-400 border border-gray-600/30 hover:border-gray-400/30'
              }`}
            >
              Search by Rank
            </button>
            <button
              onClick={() => setSearchType('assetId')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                searchType === 'assetId'
                  ? 'bg-green-500/30 text-green-400 border border-green-400/50'
                  : 'bg-black/30 text-gray-400 border border-gray-600/30 hover:border-gray-400/30'
              }`}
            >
              Search by Mek ID
            </button>
          </div>

          {/* Mek Search Input */}
          <div className="mb-3">
            <label className="text-xs text-gray-400">
              {searchType === 'rank' ? 'Mek Rank (1-4000)' : 'Mekanism ID (e.g., 2254)'}
            </label>
            <input
              type={searchType === 'rank' ? "number" : "text"}
              min={searchType === 'rank' ? "1" : undefined}
              max={searchType === 'rank' ? "4000" : undefined}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'rank' ? "Enter rank..." : "Enter Mek ID..."}
              className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-sm text-green-400"
            />
          </div>

          {/* Display Mek Info if Found */}
          {mekBySearch?.mek && (
            <div className="mb-3 bg-black/50 rounded p-2 text-xs">
              <div className="text-cyan-300 mb-1">Found Mekanism:</div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div><span className="text-gray-400">Mek ID:</span> #{mekBySearch.mek.assetId}</div>
                <div><span className="text-gray-400">Rank:</span> {mekBySearch.mek.rank}</div>
                <div><span className="text-gray-400">Head:</span> {mekBySearch.mek.head}</div>
                <div><span className="text-gray-400">Body:</span> {mekBySearch.mek.body}</div>
                <div className="col-span-2"><span className="text-gray-400">Trait:</span> {mekBySearch.mek.trait}</div>
              </div>
            </div>
          )}

          {/* Calculated Rewards */}
          <div className="bg-black/50 rounded p-3 space-y-2">
            <div className="text-sm text-gray-300">
              <span className="text-yellow-400 font-bold">Gold Reward:</span> {goldReward.toLocaleString()}g
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-blue-400 font-bold">XP Reward:</span> {xpReward.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-purple-400 font-bold">Essence Amount:</span> {essenceReward} essence(s)
            </div>

            {/* Essence Probabilities */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">
                Essence Drop Probabilities {mekBySearch?.mek ? `for Mek #${mekBySearch.mek.assetId} (Rank ${mekBySearch.mek.rank})` : ''}:
              </div>
              {essenceProbabilities.length > 0 ? (
                essenceProbabilities.map((essence, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-300">
                      {essence.type}: {essence.name}
                      <span className="text-gray-500"> (appears {essence.count}x in ranks 1-4000)</span>
                    </span>
                    <span className="text-purple-400 font-bold">{essence.probability.toFixed(2)}%</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">
                  {searchType === 'rank'
                    ? `No mek found at rank ${searchValue}`
                    : `No mek found with ID ${searchValue}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Example Rewards Across Chapters */}
        <div className="mt-6 bg-black/30 rounded p-3">
          <h5 className="text-orange-400 text-sm font-bold mb-3">Sample Rewards by Chapter</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-1">Chapter</th>
                  <th className="text-left py-1">Rank Range</th>
                  <th className="text-left py-1">Min Gold</th>
                  <th className="text-left py-1">Max Gold</th>
                  <th className="text-left py-1">Min XP</th>
                  <th className="text-left py-1">Max XP</th>
                  <th className="text-left py-1">Min Essence</th>
                  <th className="text-left py-1">Max Essence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ch: 1, range: '3651-4000', minRank: 4000, maxRank: 3651 },
                  { ch: 2, range: '3301-3650', minRank: 3650, maxRank: 3301 },
                  { ch: 5, range: '2251-2600', minRank: 2600, maxRank: 2251 },
                  { ch: 8, range: '1201-1550', minRank: 1550, maxRank: 1201 },
                  { ch: 10, range: '501-850', minRank: 850, maxRank: 501 },
                ].map((chapter) => (
                  <tr key={chapter.ch} className="border-b border-gray-800">
                    <td className="py-1 font-bold text-yellow-500">{chapter.ch}</td>
                    <td className="py-1 text-gray-300">{chapter.range}</td>
                    <td className="py-1 text-yellow-400">
                      {calculateReward(chapter.minRank, config.goldRange.min, config.goldRange.max, config.goldCurve, config.goldRounding).toLocaleString()}g
                    </td>
                    <td className="py-1 text-yellow-400">
                      {calculateReward(chapter.maxRank, config.goldRange.min, config.goldRange.max, config.goldCurve, config.goldRounding).toLocaleString()}g
                    </td>
                    <td className="py-1 text-blue-400">
                      {calculateReward(chapter.minRank, config.xpRange.min, config.xpRange.max, config.xpCurve, config.xpRounding)}
                    </td>
                    <td className="py-1 text-blue-400">
                      {calculateReward(chapter.maxRank, config.xpRange.min, config.xpRange.max, config.xpCurve, config.xpRounding)}
                    </td>
                    <td className="py-1 text-purple-400">
                      {calculateReward(chapter.minRank, config.essenceRange.min, config.essenceRange.max, config.essenceCurve, config.essenceRounding)}
                    </td>
                    <td className="py-1 text-purple-400">
                      {calculateReward(chapter.maxRank, config.essenceRange.min, config.essenceRange.max, config.essenceCurve, config.essenceRounding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save/Load Controls */}
        <div className="mt-6 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Configuration name..."
              className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
            >
              Save New
            </button>
            <button
              onClick={handleUpdate}
              disabled={!selectedConfigId}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedConfigId
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title={!selectedConfigId ? 'Click a saved config first to update it' : 'Update the currently loaded configuration'}
            >
              Update Current
            </button>
          </div>

          {savedConfigs && savedConfigs.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-2">Saved Configurations:</div>
              <div className="flex flex-wrap gap-2">
                {savedConfigs.map((cfg) => (
                  <button
                    key={cfg._id}
                    onClick={() => {
                      try {
                        const loaded = JSON.parse(cfg.data);
                        setConfig(loaded);
                        setSelectedConfigId(cfg._id);
                        setSaveName(cfg.name);
                      } catch (error) {
                        console.error('Failed to load config:', error);
                      }
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedConfigId === cfg._id
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                        : 'bg-black/30 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20'
                    }`}
                  >
                    {cfg.name}
                  </button>
                ))}
              </div>
              {selectedConfigId && (
                <div className="text-xs text-gray-400 mt-2">
                  Currently loaded: <span className="text-purple-400 font-semibold">
                    {savedConfigs.find(c => c._id === selectedConfigId)?.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deploy to All Chapters Button */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={() => setShowDeployModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg text-sm transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            🚀 Deploy Mekanisms to All 10 Chapters
          </button>
        </div>
      </div>

      {/* Deployment Modal */}
      {showDeployModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => !isDeploying && setShowDeployModal(false)}
        >
          <div
            className="bg-gray-900 border-2 border-orange-500/50 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-orange-400 mb-4">🚀 Deploy All Mekanisms</h3>

            <div className="space-y-4">
              <div className="bg-black/30 rounded p-4">
                <h4 className="text-yellow-400 font-bold mb-2">Deployment Summary</h4>
                <p className="text-sm text-gray-300 mb-3">
                  This will deploy mekanisms to all 10 chapters with the following configuration:
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-2">Normal Meks (350 per chapter):</div>
                    <div className="pl-3 space-y-1">
                      <div><span className="text-yellow-400">Gold:</span> {config.goldRange.min} - {config.goldRange.max}</div>
                      <div><span className="text-blue-400">XP:</span> {config.xpRange.min} - {config.xpRange.max}</div>
                      <div><span className="text-purple-400">Essence:</span> {config.essenceRange.min} - {config.essenceRange.max}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-2">Total Nodes to Deploy:</div>
                    <div className="pl-3 space-y-1">
                      <div><span className="text-gray-300">Normal:</span> 3,500</div>
                      <div><span className="text-orange-400">Challengers:</span> 400</div>
                      <div><span className="text-red-400">Mini-Bosses:</span> 90</div>
                      <div><span className="text-yellow-500">Final Bosses:</span> 10</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4">
                <p className="text-sm text-orange-300">
                  <strong>⚠️ Warning:</strong> This will immediately update ALL mekanisms across ALL chapters in Story Climb.
                  The current configuration will be archived and can be rolled back if needed.
                </p>
              </div>

              {deploymentMessage && (
                <div className={`p-3 rounded ${
                  deploymentMessage.includes('Success')
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {deploymentMessage}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  setIsDeploying(true);
                  setDeploymentMessage('');

                  try {
                    const result = await deployAllMekanisms({
                      normalNodeConfig: JSON.stringify(config),
                      notes: `Deployed with config: Gold ${config.goldRange.min}-${config.goldRange.max}, XP ${config.xpRange.min}-${config.xpRange.max}, Essence ${config.essenceRange.min}-${config.essenceRange.max}`
                    });

                    if (result.success) {
                      setDeploymentMessage(`✅ Success! ${result.message}`);
                      setTimeout(() => {
                        setShowDeployModal(false);
                        setDeploymentMessage('');
                      }, 3000);
                    } else {
                      setDeploymentMessage(`❌ Error: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('Deployment failed:', error);
                    setDeploymentMessage(`❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setIsDeploying(false);
                  }
                }}
                disabled={isDeploying}
                className={`flex-1 px-6 py-3 rounded font-semibold transition-colors ${
                  isDeploying
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
              >
                {isDeploying ? '⏳ Deploying...' : '🚀 Deploy Now'}
              </button>
              <button
                onClick={() => setShowDeployModal(false)}
                disabled={isDeploying}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}