"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY, getVariationByRank, getVariationsByRankRange } from "@/lib/completeVariationRarity";
import { Id } from "@/convex/_generated/dataModel";

interface GoldConfig {
  min: number;
  max: number;
  curve: number; // 0 = linear, 1+ = exponential growth
}

interface EssenceSpawnConfig {
  startPercent: number; // Where in the tree essence starts (0-100)
  endPercent: number; // Where in the tree this config ends
  frequency: number; // Every Nth node (1 = every node, 2 = every other, 3 = every third, etc.)
}

interface EssenceRarityRange {
  startPercent: number;
  endPercent: number;
  minRank: number; // 1 = rarest
  maxRank: number; // 288 = most common (actual variation count)
}

interface EssenceQuantityConfig {
  min: number;
  max: number;
  curve: number; // 0 = linear interpolation, 1+ = exponential growth
}

interface NodeFeeSettings {
  nodeType: 'normal' | 'challenger' | 'event' | 'miniboss' | 'finalboss';
  gold?: GoldConfig;
  essence?: {
    spawnConfigs: EssenceSpawnConfig[];
    rarityRanges: EssenceRarityRange[];
    quantity: EssenceQuantityConfig;
  };
  chip?: {
    type: 'uni' | 'mek';
    tier: string; // A-Tier, B-Tier, XX-Tier, etc.
  };
  special?: string; // Placeholder for future special items
}

const NODE_TYPES = [
  { id: 'normal', name: 'Normal Nodes', icon: '⚔️' },
  { id: 'challenger', name: 'Challenger Nodes', icon: '🔥' },
  { id: 'event', name: 'Event Nodes', icon: '🎭' },
  { id: 'miniboss', name: 'Mini Boss Nodes', icon: '💀' },
  { id: 'finalboss', name: 'Final Boss Nodes', icon: '👹' }
];

const CHIP_TIERS = [
  'S-Tier', 'A-Tier', 'B-Tier', 'C-Tier', 'D-Tier',
  'X-Tier', 'XX-Tier', 'XXX-Tier'
];

export default function NodeFeeConfig() {
  const [selectedNodeType, setSelectedNodeType] = useState<string>('normal');
  const [feeConfigs, setFeeConfigs] = useState<Record<string, NodeFeeSettings>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [saveName, setSaveName] = useState<string>('');
  const [currentVersionId, setCurrentVersionId] = useState<Id<"nodeFeeVersions"> | null>(null);
  const [currentVersionName, setCurrentVersionName] = useState<string>('');
  const [showVersionList, setShowVersionList] = useState<boolean>(false);

  // Get saved fee configuration from database
  const savedConfig = useQuery(api.nodeFees.getConfig);
  const saveConfig = useMutation(api.nodeFees.saveConfig);

  // Version management
  const allVersions = useQuery(api.nodeFeeVersions.getAllVersions);
  const mostRecentVersion = useQuery(api.nodeFeeVersions.getMostRecent);
  const saveVersion = useMutation(api.nodeFeeVersions.saveVersion);
  const deleteVersion = useMutation(api.nodeFeeVersions.deleteVersion);
  const renameVersion = useMutation(api.nodeFeeVersions.renameVersion);

  // Load most recent version on mount
  useEffect(() => {
    if (mostRecentVersion && !currentVersionId) {
      setFeeConfigs(mostRecentVersion.fees || {});
      setCurrentVersionId(mostRecentVersion._id);
      setCurrentVersionName(mostRecentVersion.name);
    }
  }, [mostRecentVersion, currentVersionId]);

  // Use the complete variation rarity data
  const rankedVariations = COMPLETE_VARIATION_RARITY;

  // Handle gold updates
  const updateGold = (nodeType: string, field: keyof GoldConfig, value: number | string) => {
    // Allow empty string for better UX
    const numValue = value === '' ? 0 : Number(value);

    setFeeConfigs(prev => ({
      ...prev,
      [nodeType]: {
        ...prev[nodeType],
        nodeType: nodeType as any,
        gold: {
          ...(prev[nodeType]?.gold || { min: 0, max: 100, curve: 1 }),
          [field]: numValue
        }
      }
    }));
  };

  // Handle essence spawn config
  const updateEssenceSpawn = (nodeType: string, index: number, field: keyof EssenceSpawnConfig, value: number | string) => {
    const numValue = value === '' ? 0 : Number(value);

    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };
      const spawnConfigs = [...essence.spawnConfigs];

      // Ensure the config exists
      if (!spawnConfigs[index]) {
        spawnConfigs[index] = { startPercent: 0, endPercent: 100, frequency: 1 };
      }

      spawnConfigs[index] = { ...spawnConfigs[index], [field]: numValue };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: { ...essence, spawnConfigs }
        }
      };
    });
  };

  // Add new essence spawn config
  const addEssenceSpawnConfig = (nodeType: string) => {
    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: {
            ...essence,
            spawnConfigs: [...essence.spawnConfigs, { startPercent: 0, endPercent: 100, frequency: 1 }]
          }
        }
      };
    });
  };

  // Remove essence spawn config
  const removeEssenceSpawnConfig = (nodeType: string, index: number) => {
    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: {
            ...essence,
            spawnConfigs: essence.spawnConfigs.filter((_, i) => i !== index)
          }
        }
      };
    });
  };

  // Handle essence rarity range
  const updateEssenceRarity = (nodeType: string, index: number, field: keyof EssenceRarityRange, value: number | string) => {
    const numValue = value === '' ? 0 : Number(value);

    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };
      const rarityRanges = [...essence.rarityRanges];

      // Ensure the config exists
      if (!rarityRanges[index]) {
        rarityRanges[index] = { startPercent: 0, endPercent: 100, minRank: 1, maxRank: rankedVariations.length || 288 };
      }

      rarityRanges[index] = { ...rarityRanges[index], [field]: numValue };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: { ...essence, rarityRanges }
        }
      };
    });
  };

  // Add new essence rarity range
  const addEssenceRarityRange = (nodeType: string) => {
    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: {
            ...essence,
            rarityRanges: [...essence.rarityRanges, { startPercent: 0, endPercent: 100, minRank: 1, maxRank: rankedVariations.length || 288 }]
          }
        }
      };
    });
  };

  // Remove essence rarity range
  const removeEssenceRarityRange = (nodeType: string, index: number) => {
    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: {
            ...essence,
            rarityRanges: essence.rarityRanges.filter((_, i) => i !== index)
          }
        }
      };
    });
  };

  // Handle essence quantity
  const updateEssenceQuantity = (nodeType: string, field: keyof EssenceQuantityConfig, value: number | string) => {
    const numValue = value === '' ? 0 : Number(value);

    setFeeConfigs(prev => {
      const current = prev[nodeType] || { nodeType: nodeType as any };
      const essence = current.essence || { spawnConfigs: [], rarityRanges: [], quantity: { min: 1, max: 3, curve: 1 } };

      return {
        ...prev,
        [nodeType]: {
          ...current,
          essence: {
            ...essence,
            quantity: { ...essence.quantity, [field]: numValue }
          }
        }
      };
    });
  };

  // Handle chip updates
  const updateChip = (nodeType: string, type: 'uni' | 'mek', tier: string) => {
    setFeeConfigs(prev => ({
      ...prev,
      [nodeType]: {
        ...prev[nodeType],
        nodeType: nodeType as any,
        chip: { type, tier }
      }
    }));
  };

  // Load a specific version
  const loadVersion = async (versionId: Id<"nodeFeeVersions">) => {
    const version = await useQuery(api.nodeFeeVersions.getVersion, { versionId });
    if (version) {
      setFeeConfigs(version.fees || {});
      setCurrentVersionId(version._id);
      setCurrentVersionName(version.name);
      setSaveStatus(`Loaded: ${version.name}`);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Save configuration as new version
  const handleSaveVersion = async () => {
    if (!saveName.trim()) {
      setSaveStatus('Please enter a save name');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      const result = await saveVersion({
        name: saveName,
        fees: feeConfigs,
        isAutoSave: false
      });
      setCurrentVersionId(result.versionId);
      setCurrentVersionName(saveName);
      setSaveName('');
      setSaveStatus(`Saved as: ${saveName}`);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving version');
      console.error(error);
    }
  };

  // Update currently loaded version
  const handleUpdateVersion = async () => {
    if (!currentVersionId) {
      setSaveStatus('No version loaded to update');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      const result = await saveVersion({
        name: currentVersionName,
        fees: feeConfigs,
        isAutoSave: false
      });
      setCurrentVersionId(result.versionId);
      setSaveStatus(`Updated: ${currentVersionName}`);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error updating version');
      console.error(error);
    }
  };

  // Get current node configuration
  const currentConfig = feeConfigs[selectedNodeType] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/30">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-purple-400 mb-2">Node Fee Configuration</h3>
            <p className="text-xs text-gray-400">Configure entry fees for all node types in Story Climb</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Current Version:</div>
            <div className="text-sm text-purple-300 font-semibold">
              {currentVersionName || 'Unsaved'}
            </div>
          </div>
        </div>
      </div>

      {/* Node Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {NODE_TYPES.map(node => (
          <button
            key={node.id}
            onClick={() => setSelectedNodeType(node.id)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedNodeType === node.id
                ? 'bg-purple-900/50 border-purple-400 text-purple-300'
                : 'bg-black/30 border-gray-600 text-gray-400 hover:border-purple-500/50'
            }`}
          >
            <span className="mr-2">{node.icon}</span>
            {node.name}
          </button>
        ))}
      </div>

      {/* Fee Configuration for Selected Node */}
      <div className="bg-black/40 rounded-lg border border-purple-500/20 p-6 space-y-6">
        <h4 className="text-md font-semibold text-purple-300 mb-4">
          {NODE_TYPES.find(n => n.id === selectedNodeType)?.icon} {NODE_TYPES.find(n => n.id === selectedNodeType)?.name} Fee Structure
        </h4>

        {/* Gold Configuration */}
        <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/20 space-y-4">
          <h5 className="text-sm font-semibold text-yellow-400">Gold Requirements</h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Min Gold</label>
              <input
                type="number"
                value={currentConfig.gold?.min === 0 ? '' : currentConfig.gold?.min || ''}
                onChange={(e) => updateGold(selectedNodeType, 'min', e.target.value)}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="px-3 py-2 bg-black/50 border border-yellow-500/30 rounded text-yellow-400 w-full"
                placeholder="0"
                min="0"
                step="10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Max Gold</label>
              <input
                type="number"
                value={currentConfig.gold?.max === 0 ? '' : currentConfig.gold?.max || ''}
                onChange={(e) => updateGold(selectedNodeType, 'max', e.target.value)}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="px-3 py-2 bg-black/50 border border-yellow-500/30 rounded text-yellow-400 w-full"
                placeholder="100"
                min="0"
                step="10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Curve (0=linear, 1+=exponential)</label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={currentConfig.gold?.curve || 1}
                onChange={(e) => updateGold(selectedNodeType, 'curve', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-yellow-500 text-center">{currentConfig.gold?.curve || 1}</div>
            </div>
          </div>
        </div>

        {/* Essence Configuration */}
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/20 space-y-4">
          <h5 className="text-sm font-semibold text-green-400">Essence Configuration</h5>

          {/* Essence Spawn Configs */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400 font-medium">Spawn Settings</label>
              <button
                onClick={() => addEssenceSpawnConfig(selectedNodeType)}
                className="px-3 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-xs rounded"
              >
                + Add Spawn Range
              </button>
            </div>

            {(currentConfig.essence?.spawnConfigs || []).map((config, index) => (
              <div key={index} className="bg-black/30 rounded p-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-green-300">Spawn Range {index + 1}</span>
                  <button
                    onClick={() => removeEssenceSpawnConfig(selectedNodeType, index)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Start %</label>
                    <input
                      type="number"
                      value={config.startPercent === 0 ? '' : config.startPercent}
                      onChange={(e) => updateEssenceSpawn(selectedNodeType, index, 'startPercent', e.target.value)}
                      onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                      className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">End %</label>
                    <input
                      type="number"
                      value={config.endPercent === 0 ? '' : config.endPercent}
                      onChange={(e) => updateEssenceSpawn(selectedNodeType, index, 'endPercent', e.target.value)}
                      onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                      className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Every Nth Node</label>
                    <input
                      type="number"
                      value={config.frequency === 0 ? '' : config.frequency}
                      onChange={(e) => updateEssenceSpawn(selectedNodeType, index, 'frequency', e.target.value)}
                      onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                      className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {config.startPercent}%-{config.endPercent}% of tree, every {config.frequency === 1 ? '' : `${config.frequency}${config.frequency === 2 ? 'nd' : config.frequency === 3 ? 'rd' : 'th'} `}node
                </div>
              </div>
            ))}
          </div>

          {/* Essence Rarity Ranges */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400 font-medium">Rarity Distribution</label>
              <button
                onClick={() => addEssenceRarityRange(selectedNodeType)}
                className="px-3 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-xs rounded"
              >
                + Add Rarity Range
              </button>
            </div>

            {(currentConfig.essence?.rarityRanges || []).map((config, index) => (
              <div key={index} className="bg-black/30 rounded p-3 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-green-300">Rarity Range {index + 1}</span>
                  <button
                    onClick={() => removeEssenceRarityRange(selectedNodeType, index)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Tree Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={config.startPercent === 0 ? '' : config.startPercent}
                        onChange={(e) => updateEssenceRarity(selectedNodeType, index, 'startPercent', e.target.value)}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                        min="0"
                        max="100"
                        placeholder="Start %"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        value={config.endPercent === 0 ? '' : config.endPercent}
                        onChange={(e) => updateEssenceRarity(selectedNodeType, index, 'endPercent', e.target.value)}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                        min="0"
                        max="100"
                        placeholder="End %"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Variation Ranks</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={config.minRank === 0 ? '' : config.minRank}
                        onChange={(e) => updateEssenceRarity(selectedNodeType, index, 'minRank', e.target.value)}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                        min="1"
                        max="288"
                        placeholder="Min"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        value={config.maxRank === 0 ? '' : config.maxRank}
                        onChange={(e) => updateEssenceRarity(selectedNodeType, index, 'maxRank', e.target.value)}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        className="px-2 py-1 bg-black/50 border border-green-500/30 rounded text-green-400 w-full text-sm"
                        min="1"
                        max={rankedVariations.length || 288}
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {config.startPercent}%-{config.endPercent}% of tree: Variations ranked #{config.minRank} to #{config.maxRank}
                  {(() => {
                    const minVar = getVariationByRank(config.minRank);
                    const maxVar = getVariationByRank(config.maxRank);
                    const variationsInRange = getVariationsByRankRange(config.minRank, config.maxRank);
                    return (
                      <>
                        <span className="text-green-400 ml-2">
                          ({minVar?.name || '?'} to {maxVar?.name || '?'})
                        </span>
                        <span className="text-gray-600 ml-2">
                          [{variationsInRange.length} variations]
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Essence Quantity */}
          <div className="space-y-3">
            <label className="text-xs text-gray-400 font-medium">Essence Quantity (per drop)</label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Min Quantity</label>
                <input
                  type="number"
                  value={currentConfig.essence?.quantity?.min === 0 ? '' : currentConfig.essence?.quantity?.min || ''}
                  onChange={(e) => updateEssenceQuantity(selectedNodeType, 'min', e.target.value)}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="px-3 py-2 bg-black/50 border border-green-500/30 rounded text-green-400 w-full"
                  placeholder="1"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500">Max Quantity</label>
                <input
                  type="number"
                  value={currentConfig.essence?.quantity?.max === 0 ? '' : currentConfig.essence?.quantity?.max || ''}
                  onChange={(e) => updateEssenceQuantity(selectedNodeType, 'max', e.target.value)}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="px-3 py-2 bg-black/50 border border-green-500/30 rounded text-green-400 w-full"
                  placeholder="3"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500">Interpolation Curve</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={currentConfig.essence?.quantity?.curve || 1}
                  onChange={(e) => updateEssenceQuantity(selectedNodeType, 'curve', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-green-500 text-center">{currentConfig.essence?.quantity?.curve || 1}</div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              First nodes drop {currentConfig.essence?.quantity?.min || 1}, last nodes drop {currentConfig.essence?.quantity?.max || 3}
            </div>
          </div>
        </div>

        {/* Chip Fee */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 font-medium">Chip Fee</label>
          <div className="flex gap-3 items-center flex-wrap">
            <select
              value={currentConfig.chip?.type || ''}
              onChange={(e) => updateChip(selectedNodeType, e.target.value as 'uni' | 'mek', currentConfig.chip?.tier || 'A-Tier')}
              className="px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400"
            >
              <option value="">No Chip Required</option>
              <option value="uni">Universal Chip</option>
              <option value="mek">Mek Chip</option>
            </select>
            {currentConfig.chip?.type && (
              <>
                <select
                  value={currentConfig.chip.tier}
                  onChange={(e) => updateChip(selectedNodeType, currentConfig.chip!.type, e.target.value)}
                  className="px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400"
                >
                  {CHIP_TIERS.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Chip modification tier</span>
              </>
            )}
          </div>
        </div>

        {/* Variation Ranking Reference */}
        <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20">
          <h5 className="text-sm font-semibold text-purple-300 mb-2">Variation Ranking Reference</h5>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="text-yellow-400 font-semibold">
                Total Variations: {rankedVariations.length} (Max Rank: {rankedVariations.length})
              </div>
              <div>Database: 4000 Meks analyzed</div>
              <div>Rarest (Rank #1): {rankedVariations[0]?.name} ({rankedVariations[0]?.count} copies, {rankedVariations[0]?.type})</div>
              <div>Most Common (Rank #{rankedVariations.length}): {rankedVariations[rankedVariations.length - 1]?.name} ({rankedVariations[rankedVariations.length - 1]?.count} copies, {rankedVariations[rankedVariations.length - 1]?.type})</div>

              {/* Sample variations at different ranks */}
              <div className="mt-2 pt-2 border-t border-purple-500/20 space-y-1">
                <div className="text-purple-300 font-semibold">Sample Ranks:</div>
                {[50, 100, 150, 200, 250, Math.min(288, rankedVariations.length)].map(rank => {
                  const variation = rankedVariations[rank - 1];
                  return variation ? (
                    <div key={rank}>
                      Rank #{rank}: {variation.name} ({variation.count} copies, {variation.type}, Code: {variation.sourceKey})
                    </div>
                  ) : null;
                })}
              </div>

              {/* Show tier boundaries */}
              <div className="mt-2 pt-2 border-t border-purple-500/20 space-y-1">
                <div className="text-purple-300 font-semibold">Rarity Tiers:</div>
                <div className="text-xs space-y-1">
                  <div className="text-red-400">Legendary (1-of-1): Ranks #1-30</div>
                  <div className="text-orange-400">Ultra-rare (≤20 copies): Ranks #31-115</div>
                  <div className="text-yellow-400">Very-rare (≤40 copies): Ranks #116-163</div>
                  <div className="text-green-400">Rare (≤100 copies): Ranks #164-264</div>
                  <div className="text-blue-400">Uncommon (≤200 copies): Ranks #265-287</div>
                  <div className="text-gray-400">{`Common (>200 copies): Rank #288`}</div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Version Management */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-bold text-indigo-300 mb-3">Version Management</h4>

        {/* Save New Version */}
        <div className="flex gap-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter save name..."
            className="flex-1 px-3 py-2 bg-black/50 border border-indigo-500/30 rounded text-indigo-300 placeholder-gray-500"
          />
          <button
            onClick={handleSaveVersion}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all"
          >
            Save Version
          </button>
          {currentVersionId && (
            <button
              onClick={handleUpdateVersion}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              Update
            </button>
          )}
        </div>

        {/* Version List Toggle */}
        <button
          onClick={() => setShowVersionList(!showVersionList)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {showVersionList ? '▼ Hide' : '▶ Show'} Saved Versions ({allVersions?.length || 0})
        </button>

        {/* Version List */}
        {showVersionList && allVersions && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allVersions.map(version => (
              <div
                key={version._id}
                className={`flex justify-between items-center p-2 rounded ${
                  version._id === currentVersionId
                    ? 'bg-indigo-900/30 border border-indigo-500/50'
                    : 'bg-black/30 border border-gray-700'
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-300">{version.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadVersion(version._id)}
                    className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs rounded"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteVersion({ versionId: version._id })}
                    className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Message */}
      {saveStatus && (
        <div className={`text-sm text-center py-2 px-4 rounded-lg ${
          saveStatus.includes('Error')
            ? 'bg-red-900/30 text-red-400 border border-red-500/30'
            : saveStatus.includes('Loaded')
            ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
            : 'bg-green-900/30 text-green-400 border border-green-500/30'
        }`}>
          {saveStatus}
        </div>
      )}
    </div>
  );
}