'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import Navigation from '@/components/Navigation';

// Chip ranks from D to XXX
const CHIP_RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X', 'XX', 'XXX'];

// Icon mapping for buff categories
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    'gold': '🪙',
    'essence': '💎',
    'rarity_bias': '🎲',
    'xp': '⭐',
    'mek_slot': '🔧',
    'market': '📉',
    'reward_chance': '🎁',
  };
  return iconMap[category] || '📦';
};

// Get unit display for buff types
const getUnitDisplay = (unitType: string) => {
  const unitMap: Record<string, string> = {
    'flat_number': '',
    'rate_change': '/hr',
    'rate_percentage': '%/hr',
    'flat_percentage': '%',
  };
  return unitMap[unitType] || '';
};

interface BuffConfig {
  procChance: number; // 0-100 percentage chance
  minValue: number;
  maxValue: number;
}

interface ChipConfig {
  tier: number;
  rarity: string;
  buffs: {
    [buffId: string]: BuffConfig;
  };
}

// Create a unique key for each chip
const getChipKey = (tier: number, rarity: string) => `T${tier}_${rarity}`;

export default function ChipBuilderPage() {
  const [selectedTier, setSelectedTier] = useState(1);
  const [selectedRarity, setSelectedRarity] = useState('D');
  const [chipConfigs, setChipConfigs] = useState<{ [key: string]: ChipConfig }>({});
  const [viewMode, setViewMode] = useState<'edit' | 'overview'>('edit');
  const [activeTab, setActiveTab] = useState<'configuration' | 'universal' | 'master-range'>('master-range');
  
  // Fetch buff categories from database
  const buffCategories = useQuery(api.buffCategories.getAll);
  const masterRangesData = useQuery(api.chipConfigurations.getMasterRanges);
  const chipConfigsData = useQuery(api.chipConfigurations.getAllChipConfigs);
  
  // Mutations
  const setMasterRange = useMutation(api.chipConfigurations.setMasterRange);
  const setAllMasterRanges = useMutation(api.chipConfigurations.setAllMasterRanges);
  const saveAllChipConfigs = useMutation(api.chipConfigurations.saveAllChipConfigs);
  const initializeMasterRanges = useMutation(api.chipConfigurations.initializeMasterRanges);
  
  // Master range system - local state for editing
  const [masterRanges, setMasterRanges] = useState<{[buffId: string]: {min: number, max: number}}>({});
  const [curvePowers, setCurvePowers] = useState<{[buffId: string]: number}>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync master ranges from database (only on initial load)
  useEffect(() => {
    if (masterRangesData && !hasInitialized) {
      // Convert database format to local state format
      const ranges: {[buffId: string]: {min: number, max: number}} = {};
      const powers: {[buffId: string]: number} = {};
      Object.entries(masterRangesData).forEach(([buffId, rangeData]: [string, any]) => {
        ranges[buffId] = { min: rangeData.min, max: rangeData.max };
        powers[buffId] = rangeData.curvePower || 1;
      });
      setMasterRanges(ranges);
      setCurvePowers(powers);
      setHasInitialized(true);
    }
  }, [masterRangesData, hasInitialized]);

  // Initialize master ranges if none exist
  useEffect(() => {
    if (buffCategories && buffCategories.length > 0 && masterRangesData && Object.keys(masterRangesData).length === 0) {
      // No master ranges exist, initialize them
      initializeMasterRanges();
    }
  }, [buffCategories, masterRangesData, initializeMasterRanges]);

  // Initialize curve powers for categories that don't have them
  useEffect(() => {
    if (buffCategories && hasInitialized) {
      const newPowers = { ...curvePowers };
      let hasChanges = false;
      
      buffCategories.forEach(category => {
        if (!(category._id in newPowers)) {
          newPowers[category._id] = 1; // Default to linear
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setCurvePowers(newPowers);
      }
    }
  }, [buffCategories, hasInitialized, curvePowers]);

  // Calculate value based on master range, tier, rank, and curve power
  const calculateValueFromMasterRange = (
    masterMin: number,
    masterMax: number,
    tier: number,
    rankIndex: number,
    curvePower: number = 1
  ): { min: number, max: number } => {
    const masterSpan = masterMax - masterMin;
    
    // Normalize position (0 to 1)
    const totalSteps = 100; // 10 ranks * 10 tiers
    const currentStep = (rankIndex * 10) + tier;
    const normalizedPos = currentStep / totalSteps;
    
    // Apply curve (1 = linear, >1 = exponential)
    // curvePower ranges from 1 (linear) to 5 (very exponential)
    const curvedPos = Math.pow(normalizedPos, curvePower);
    
    // Calculate the range for this position
    const positionValue = masterMin + (masterSpan * curvedPos);
    
    // Calculate a small range around this position (for min/max)
    const rangeWidth = (masterSpan / totalSteps) * Math.max(1, curvedPos * 2);
    
    return {
      min: Math.round(Math.max(masterMin, positionValue - rangeWidth / 2)),
      max: Math.round(Math.min(masterMax, positionValue + rangeWidth / 2))
    };
  };

  // Apply master ranges to all chips and save to database
  const applyMasterRanges = async () => {
    if (!buffCategories) return;
    
    // First, save all master ranges to database
    const rangesToSave = Object.entries(masterRanges).map(([buffId, range]) => ({
      buffCategoryId: buffId as Id<"buffCategories">,
      min: range.min,
      max: range.max,
      curvePower: curvePowers[buffId] || 1,
    }));
    
    await setAllMasterRanges({ ranges: rangesToSave });
    
    // Then generate chip configurations
    const configs: any[] = [];
    
    for (let tier = 1; tier <= 10; tier++) {
      CHIP_RANKS.forEach((rarity, rarityIndex) => {
        const chipBuffs: any[] = [];
        
        buffCategories.forEach(category => {
          if (!category.isActive) return; // Skip inactive categories
          
          const masterRange = masterRanges[category._id];
          if (!masterRange) return;
          
          const curvePower = curvePowers[category._id] || 1;
          const values = calculateValueFromMasterRange(
            masterRange.min,
            masterRange.max,
            tier,
            rarityIndex,
            curvePower
          );
          
          // Calculate proc chance based on category type
          let procChance = 10 + (tier * 5) + (rarityIndex * 8);
          if (category.category === 'gold' || category.category === 'xp') {
            procChance = Math.min(100, procChance * 1.5);
          } else if (category.category === 'market') {
            procChance = Math.min(100, procChance * 1.2);
          } else if (category.category === 'essence' || category.category === 'rarity_bias') {
            procChance = Math.min(100, procChance * 0.6);
          }
          
          chipBuffs.push({
            buffCategoryId: category._id,
            procChance: Math.round(procChance),
            minValue: values.min,
            maxValue: values.max,
          });
        });
        
        configs.push({
          tier,
          rank: rarity,
          buffs: chipBuffs,
        });
      });
    }
    
    // Save to database
    await saveAllChipConfigs({ configs });
    
    // Update local state for display
    const localConfigs: { [key: string]: ChipConfig } = {};
    configs.forEach(config => {
      const key = getChipKey(config.tier, config.rank);
      const buffs: { [buffId: string]: BuffConfig } = {};
      config.buffs.forEach((buff: any) => {
        buffs[buff.buffCategoryId] = {
          procChance: buff.procChance,
          minValue: buff.minValue,
          maxValue: buff.maxValue,
        };
      });
      localConfigs[key] = {
        tier: config.tier,
        rarity: config.rank,
        buffs,
      };
    });
    
    setChipConfigs(localConfigs);
  };

  // Initialize all 100 chips with default values
  useEffect(() => {
    if (Object.keys(masterRanges).length > 0) {
      applyMasterRanges();
    }
  }, [masterRanges]);

  const updateBuffConfig = (buffId: string, field: keyof BuffConfig, value: number) => {
    const key = getChipKey(selectedTier, selectedRarity);
    setChipConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        buffs: {
          ...prev[key]?.buffs,
          [buffId]: {
            ...prev[key]?.buffs[buffId],
            [field]: value,
          },
        },
      },
    }));
  };

  const exportConfigs = () => {
    const dataStr = JSON.stringify(chipConfigs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'chip_configs.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfigs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setChipConfigs(imported);
          alert('Configurations imported successfully!');
        } catch (error) {
          alert('Error importing configurations. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const currentChip = chipConfigs[getChipKey(selectedTier, selectedRarity)];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 p-6 bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-gray-700 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
              CHIP ADMINISTRATION
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-wider">
              Configure and manage all chip types
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-700">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('configuration')}
                className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'configuration'
                    ? 'bg-yellow-400 text-black border-b-2 border-yellow-400'
                    : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                Configuration Builder
              </button>
              <button
                onClick={() => setActiveTab('universal')}
                className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'universal'
                    ? 'bg-yellow-400 text-black border-b-2 border-yellow-400'
                    : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                Universal Chips
              </button>
              <button
                onClick={() => setActiveTab('master-range')}
                className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'master-range'
                    ? 'bg-yellow-400 text-black border-b-2 border-yellow-400'
                    : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                Master Range System
              </button>
            </div>
          </div>

          {activeTab === 'configuration' && (
            <>
          {/* Controls */}
          <div className="mb-6 flex gap-4 flex-wrap items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-4 py-2 font-bold transition-colors ${
                  viewMode === 'edit' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                Edit Mode
              </button>
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 font-bold transition-colors ${
                  viewMode === 'overview' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                Overview
              </button>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button
                onClick={exportConfigs}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
              >
                Export All
              </button>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer">
                Import
                <input
                  type="file"
                  onChange={importConfigs}
                  accept=".json"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {viewMode === 'edit' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Chip Selector */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900/60 border border-gray-800 p-4 sticky top-32">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4">Select Chip</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Tier</label>
                      <select
                        value={selectedTier}
                        onChange={(e) => setSelectedTier(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                          <option key={tier} value={tier}>Tier {tier}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rarity</label>
                      <select
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none"
                      >
                        {CHIP_RANKS.map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-black/50 border border-gray-700">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">T{selectedTier}</div>
                      <div className="text-xl font-bold text-white">{selectedRarity}</div>
                      <div className="text-xs text-gray-400 mt-2">Chip #{(selectedTier - 1) * 10 + CHIP_RANKS.indexOf(selectedRarity) + 1}/100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Buff Configuration */}
              <div className="lg:col-span-3">
                <div className="bg-gray-900/60 border border-gray-800 p-6">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4">
                    Tier {selectedTier} - {selectedRarity} Rarity Configuration
                  </h2>
                  
                  <div className="space-y-3">
                    {buffCategories && buffCategories
                      .filter(cat => cat.isActive !== false)
                      .map(category => {
                        const config = currentChip?.buffs[category._id];
                        if (!config) return null;
                        const icon = getCategoryIcon(category.category || 'gold');
                        const unit = getUnitDisplay(category.unitType || 'flat_number');
                        
                        return (
                          <div key={category._id} className="p-4 bg-black/50 border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">{icon}</span>
                              <span className="font-bold text-yellow-400">{category.name}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs text-gray-500">Proc Chance (%)</label>
                                <input
                                  type="number"
                                  value={config.procChance}
                                  onChange={(e) => updateBuffConfig(category._id, 'procChance', Number(e.target.value))}
                                  min="0"
                                  max="100"
                                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Min Value</label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={config.minValue}
                                    onChange={(e) => updateBuffConfig(category._id, 'minValue', Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white"
                                  />
                                  <span className="ml-1 text-xs text-gray-400">{unit}</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Max Value</label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={config.maxValue}
                                    onChange={(e) => updateBuffConfig(category._id, 'maxValue', Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white"
                                  />
                                  <span className="ml-1 text-xs text-gray-400">{unit}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Overview Mode - Show all 100 chips in a grid */
            <div className="bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">All Chip Configurations</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 text-left">Chip</th>
                      {buffCategories && buffCategories
                        .filter(cat => cat.isActive !== false)
                        .slice(0, 8)
                        .map(category => (
                          <th key={category._id} className="p-2 text-center" title={category.name}>
                            <span className="text-lg">{getCategoryIcon(category.category || 'gold')}</span>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                      CHIP_RANKS.map(rarity => {
                        const chip = chipConfigs[getChipKey(tier, rarity)];
                        if (!chip) return null;
                        
                        return (
                          <tr key={`${tier}_${rarity}`} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-2">
                              <span className="font-bold text-yellow-400">T{tier}</span>
                              <span className="ml-2 text-white">{rarity}</span>
                            </td>
                            {buffCategories && buffCategories
                              .filter(cat => cat.isActive !== false)
                              .slice(0, 8)
                              .map(category => {
                                const config = chip.buffs[category._id];
                                return (
                                  <td key={category._id} className="p-2 text-center text-xs">
                                    <div className="text-green-400">{config?.procChance}%</div>
                                    <div className="text-gray-400">{config?.minValue}-{config?.maxValue}</div>
                                  </td>
                                );
                              })}
                          </tr>
                        );
                      })
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-black/50 border border-gray-700">
                <p className="text-sm text-gray-400">
                  <strong>Note:</strong> Table shows first 8 buff categories. Switch to Edit Mode to configure all {buffCategories ? buffCategories.length : 0} buff categories for each chip.
                </p>
              </div>
            </div>
          )}
            </>
          )}
          
          {activeTab === 'universal' && (
            /* Universal Chips Tab */
            <div className="bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Universal Chips Collection</h2>
              
              {/* Universal Chips Grid */}
              <div className="grid grid-cols-10 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                  <div key={tier} className="space-y-4">
                    <h3 className="text-center text-sm font-bold text-gray-400 uppercase">Tier {tier}</h3>
                    {['a', 'b', 'c', 'd', 's', 'ss', 'sss', 'x', 'xx', 'xxx'].map(rarity => {
                      const fileName = tier === 10 ? `10${rarity}.webp` : `${tier}${rarity}.webp`;
                      const imagePath = `/chip-images/uni-chips/uni chips 120px webp/${fileName}`;
                      
                      return (
                        <div 
                          key={`${tier}${rarity}`} 
                          className="relative group cursor-pointer"
                        >
                          <div className="bg-black/50 border border-gray-700 p-2 hover:border-yellow-400 transition-all">
                            <img 
                              src={imagePath}
                              alt={`Universal Chip T${tier} ${rarity.toUpperCase()}`}
                              className="w-full h-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/chip-images/placeholder.webp';
                              }}
                            />
                            <div className="text-center mt-1">
                              <span className="text-xs text-yellow-400 font-bold">{rarity.toUpperCase()}</span>
                            </div>
                          </div>
                          
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-gray-900 border border-yellow-400 px-3 py-2 whitespace-nowrap">
                              <div className="text-yellow-400 font-bold">T{tier} - {rarity.toUpperCase()}</div>
                              <div className="text-xs text-gray-400">Universal Chip</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* Info Section */}
              <div className="mt-8 p-4 bg-black/50 border border-gray-700">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Universal Chips Information</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Total Universal Chips: 100 (10 tiers × 10 rarities)</p>
                  <p>• Rarities: D, C, B, A, S, SS, SSS, X, XX, XXX</p>
                  <p>• These chips can be equipped on any Mek regardless of type</p>
                  <p>• Higher tiers and rarities provide better buffs and bonuses</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'master-range' && (
            /* Master Range System Tab */
            <div className="space-y-6">
              <div className="bg-gray-900/60 border border-gray-800 p-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Master Range System</h2>
                <p className="text-gray-400 mb-6">
                  Set a single master range for each buff type. This range is automatically divided across all ranks and tiers.
                </p>
                
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={applyMasterRanges}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
                  >
                    Apply All Ranges
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(masterRanges, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', 'master_ranges.json');
                      linkElement.click();
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                  >
                    Export Master Ranges
                  </button>
                </div>
                
                {/* Master Range Charts */}
                <div className="space-y-8">
                  {buffCategories && buffCategories
                    .filter(cat => cat.isActive !== false)
                    .map(category => {
                      const masterRange = masterRanges[category._id] || { min: 1, max: 100 };
                      const icon = getCategoryIcon(category.category || 'gold');
                      const unit = getUnitDisplay(category.unitType || 'flat_number');
                      
                      return (
                        <div key={category._id} className="bg-black/50 border border-gray-700 p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">{icon}</span>
                            <h3 className="text-xl font-bold text-yellow-400">{category.name}</h3>
                            <span className="text-sm text-gray-400">({unit || 'points'})</span>
                          </div>
                        
                        {/* Master Range Input */}
                        <div className="mb-4 p-4 bg-green-900/30 border-2 border-green-500 rounded">
                          <div className="flex items-center gap-4 mb-3">
                            <label className="text-green-400 font-bold">MASTER RANGE:</label>
                            <input
                              type="number"
                              value={masterRange.min}
                              onChange={(e) => {
                                setMasterRanges(prev => ({
                                  ...prev,
                                  [category._id]: {
                                    ...prev[category._id],
                                    min: Number(e.target.value)
                                  }
                                }));
                              }}
                              className="w-24 px-2 py-1 bg-gray-800 border border-green-500 text-white"
                              placeholder="Min"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="number"
                              value={masterRange.max}
                              onChange={(e) => {
                                setMasterRanges(prev => ({
                                  ...prev,
                                  [category._id]: {
                                    ...prev[category._id],
                                    max: Number(e.target.value)
                                  }
                                }));
                              }}
                              className="w-24 px-2 py-1 bg-gray-800 border border-green-500 text-white"
                              placeholder="Max"
                            />
                            <span className="text-green-400 ml-2">{unit || 'points'}</span>
                          </div>
                          
                          {/* Distribution Curve Slider */}
                          <div className="flex items-center gap-4">
                            <label className="text-yellow-400 font-bold text-sm">CURVE:</label>
                            <span className="text-xs text-gray-400">Linear</span>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="0.1"
                              value={curvePowers[category._id] || 1}
                              onChange={(e) => {
                                setCurvePowers(prev => ({
                                  ...prev,
                                  [category._id]: Number(e.target.value)
                                }));
                              }}
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((curvePowers[category._id] || 1) - 1) * 25}%, #374151 ${((curvePowers[category._id] || 1) - 1) * 25}%, #374151 100%)`
                              }}
                            />
                            <span className="text-xs text-gray-400">Exponential</span>
                            <span className="text-sm text-yellow-400 font-mono w-12">{(curvePowers[category._id] || 1).toFixed(1)}</span>
                            <button
                              onClick={async () => {
                                // Save just this category's settings
                                await setMasterRange({
                                  buffCategoryId: category._id,
                                  min: masterRange.min,
                                  max: masterRange.max,
                                  curvePower: curvePowers[category._id] || 1,
                                });
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                        
                        {/* Value Distribution Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-600">
                                <th className="p-2 text-left text-gray-400">Rank</th>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                                  <th key={tier} className="p-2 text-center text-gray-400">T{tier}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const currentCurvePower = curvePowers[category._id] || 1;
                                
                                return (
                                  <>
                                    {CHIP_RANKS.map((rank, rankIndex) => {
                                      return (
                                        <tr key={rank} className="border-b border-gray-700 hover:bg-gray-800/50">
                                          <td className="p-2 font-bold text-yellow-400">{rank}</td>
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => {
                                            const values = calculateValueFromMasterRange(
                                              masterRange.min,
                                              masterRange.max,
                                              tier,
                                              rankIndex,
                                              currentCurvePower
                                            );
                                            return (
                                              <td key={tier} className="p-2 text-center">
                                                <div className="text-green-400">{values.min}</div>
                                                <div className="text-gray-500">-</div>
                                                <div className="text-blue-400">{values.max}</div>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    })}
                                    {/* Summary Row */}
                                    <tr className="border-t-2 border-yellow-500 bg-gray-800/30">
                                      <td className="p-2 font-bold text-yellow-400">Curve</td>
                                      <td colSpan={10} className="p-2 text-center">
                                        <span className="text-gray-400">Distribution: </span>
                                        <span className="text-yellow-400 font-bold">
                                          {currentCurvePower === 1 ? 'Linear' : 
                                           currentCurvePower < 2 ? 'Slightly Curved' :
                                           currentCurvePower < 3 ? 'Moderate Curve' :
                                           currentCurvePower < 4 ? 'Strong Curve' :
                                           'Exponential'}
                                        </span>
                                        <span className="text-gray-400"> - higher tiers get </span>
                                        <span className="text-yellow-400 font-bold">
                                          {currentCurvePower === 1 ? 'equal' : 'increasingly larger'}
                                        </span>
                                        <span className="text-gray-400"> value increases</span>
                                      </td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}