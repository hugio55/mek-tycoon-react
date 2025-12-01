'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MasterRangeSystem from '@/components/MasterRangeSystem';

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
  const chipConfigsData = useQuery(api.chipConfigurations.getAllChipConfigs);

  // Load chip configs from database
  useEffect(() => {
    if (chipConfigsData) {
      const localConfigs: { [key: string]: ChipConfig } = {};
      chipConfigsData.forEach((config: any) => {
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
    }
  }, [chipConfigsData]);

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
            /* Master Range System Tab - Using the modular component */
            <MasterRangeSystem 
              onApplyRanges={() => {
                // Reload chip configurations after applying ranges
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}