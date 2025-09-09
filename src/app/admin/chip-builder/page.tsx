'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

// Chip ranks from D to XXX
const CHIP_RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X', 'XX', 'XXX'];

// Available buff types
const BUFF_TYPES = [
  { id: 'gold_rate', name: 'Gold Rate', unit: '/hr', icon: '🪙' },
  { id: 'gold_multiplier', name: 'Gold Multiplier', unit: '%', icon: '💰' },
  { id: 'xp_gain', name: 'XP Gain', unit: '%', icon: '⭐' },
  { id: 'battle_damage', name: 'Battle Damage', unit: '%', icon: '⚔️' },
  { id: 'battle_defense', name: 'Battle Defense', unit: '%', icon: '🛡️' },
  { id: 'crit_chance', name: 'Critical Chance', unit: '%', icon: '💥' },
  { id: 'crit_damage', name: 'Critical Damage', unit: '%', icon: '🎯' },
  { id: 'speed_boost', name: 'Speed Boost', unit: '%', icon: '⚡' },
  { id: 'health_boost', name: 'Health Boost', unit: '%', icon: '❤️' },
  { id: 'energy_regen', name: 'Energy Regen', unit: '/s', icon: '🔋' },
  { id: 'crafting_speed', name: 'Crafting Speed', unit: '%', icon: '🔧' },
  { id: 'auction_fee_reduction', name: 'Auction Fee Reduction', unit: '%', icon: '📉' },
  { id: 'essence_drop_rate', name: 'Essence Drop Rate', unit: '%', icon: '💎' },
  { id: 'essence_quality', name: 'Essence Quality', unit: '%', icon: '✨' },
  { id: 'contract_reward', name: 'Contract Reward', unit: '%', icon: '📜' },
  { id: 'scrap_value', name: 'Scrap Value', unit: '%', icon: '🔩' },
];

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

  // Initialize all 100 chips with default values
  useEffect(() => {
    const configs: { [key: string]: ChipConfig } = {};
    
    for (let tier = 1; tier <= 10; tier++) {
      CHIP_RANKS.forEach((rarity, rarityIndex) => {
        const key = getChipKey(tier, rarity);
        const tierMultiplier = tier;
        const rarityMultiplier = 1 + (rarityIndex * 0.5);
        
        // Create buff configuration for this chip
        const buffs: { [buffId: string]: BuffConfig } = {};
        BUFF_TYPES.forEach(buffType => {
          // Default proc chances based on tier and rarity
          let procChance = 10 + (tier * 5) + (rarityIndex * 8);
          
          // Adjust proc chances for different buff types
          if (['gold_rate', 'gold_multiplier', 'xp_gain'].includes(buffType.id)) {
            procChance = Math.min(100, procChance * 1.5); // Economic buffs more common
          } else if (['battle_damage', 'battle_defense'].includes(buffType.id)) {
            procChance = Math.min(100, procChance * 1.2); // Combat buffs moderately common
          } else if (['essence_drop_rate', 'essence_quality'].includes(buffType.id)) {
            procChance = Math.min(100, procChance * 0.6); // Rare buffs less common
          }
          
          buffs[buffType.id] = {
            procChance: Math.round(procChance),
            minValue: Math.round(5 * tierMultiplier * rarityMultiplier),
            maxValue: Math.round(20 * tierMultiplier * rarityMultiplier),
          };
        });
        
        configs[key] = {
          tier,
          rarity,
          buffs,
        };
      });
    }
    
    setChipConfigs(configs);
  }, []);

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
              UNIVERSAL CHIP CONFIGURATION
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-wider">
              Configure all 100 chip variations (10 tiers × 10 rarities)
            </p>
          </div>

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
                    {BUFF_TYPES.map(buffType => {
                      const config = currentChip?.buffs[buffType.id];
                      if (!config) return null;
                      
                      return (
                        <div key={buffType.id} className="p-4 bg-black/50 border border-gray-700">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{buffType.icon}</span>
                            <span className="font-bold text-yellow-400">{buffType.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-gray-500">Proc Chance (%)</label>
                              <input
                                type="number"
                                value={config.procChance}
                                onChange={(e) => updateBuffConfig(buffType.id, 'procChance', Number(e.target.value))}
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
                                  onChange={(e) => updateBuffConfig(buffType.id, 'minValue', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white"
                                />
                                <span className="ml-1 text-xs text-gray-400">{buffType.unit}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Max Value</label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  value={config.maxValue}
                                  onChange={(e) => updateBuffConfig(buffType.id, 'maxValue', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white"
                                />
                                <span className="ml-1 text-xs text-gray-400">{buffType.unit}</span>
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
                      {BUFF_TYPES.slice(0, 8).map(buff => (
                        <th key={buff.id} className="p-2 text-center" title={buff.name}>
                          <span className="text-lg">{buff.icon}</span>
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
                            {BUFF_TYPES.slice(0, 8).map(buff => {
                              const config = chip.buffs[buff.id];
                              return (
                                <td key={buff.id} className="p-2 text-center text-xs">
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
                  <strong>Note:</strong> Table shows first 8 buff types. Switch to Edit Mode to configure all {BUFF_TYPES.length} buff types for each chip.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}