'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Image from 'next/image';

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

interface ChipBuff {
  buffType: string;
  procChance: number; // Base chance this buff can appear (0-100%)
}

interface TierConfig {
  tier: number;
  rarityConfigs: {
    [rarity: string]: {
      minValue: number;
      maxValue: number;
      buffCount: number; // How many buffs this rarity gets
      procMultiplier: number; // Multiplier for buff proc chances
    };
  };
}

interface ChipDefinition {
  id: string;
  name: string;
  description: string;
  category: 'attack' | 'defense' | 'utility' | 'economy' | 'special';
  tier: number; // 1-10 for chip tiers
  imageUrl?: string;
  possibleBuffs: ChipBuff[];
  tierConfig: TierConfig;
}

export default function ChipBuilderPage() {
  const [chipName, setChipName] = useState('');
  const [chipDescription, setChipDescription] = useState('');
  const [chipCategory, setChipCategory] = useState<ChipDefinition['category']>('utility');
  const [chipTier, setChipTier] = useState(1);
  const [selectedBuffs, setSelectedBuffs] = useState<ChipBuff[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tierConfig, setTierConfig] = useState<TierConfig>({
    tier: 1,
    rarityConfigs: {}
  });
  const [savedChips, setSavedChips] = useState<ChipDefinition[]>([]);
  const [editingChip, setEditingChip] = useState<ChipDefinition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize tier config with defaults when tier changes
  useEffect(() => {
    const defaultConfig: TierConfig = {
      tier: chipTier,
      rarityConfigs: {}
    };
    
    // Set default values for each rarity based on tier
    CHIP_RANKS.forEach((rank, rankIndex) => {
      const tierMultiplier = chipTier; // Tier 1 = 1x, Tier 10 = 10x
      const rarityMultiplier = 1 + (rankIndex * 0.5); // D=1x, C=1.5x, B=2x... XXX=6x
      
      defaultConfig.rarityConfigs[rank] = {
        minValue: Math.round(5 * tierMultiplier * rarityMultiplier),
        maxValue: Math.round(20 * tierMultiplier * rarityMultiplier),
        buffCount: Math.min(1 + Math.floor(rankIndex / 2), 6), // 1-6 buffs
        procMultiplier: 0.5 + (rankIndex * 0.15), // 50% to 185% proc chance multiplier
      };
    });
    
    setTierConfig(defaultConfig);
  }, [chipTier]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addBuff = () => {
    setSelectedBuffs([
      ...selectedBuffs,
      {
        buffType: BUFF_TYPES[0].id,
        procChance: 50, // 50% base chance
      },
    ]);
  };

  const updateBuff = (index: number, updates: Partial<ChipBuff>) => {
    const newBuffs = [...selectedBuffs];
    newBuffs[index] = { ...newBuffs[index], ...updates };
    setSelectedBuffs(newBuffs);
  };

  const removeBuff = (index: number) => {
    setSelectedBuffs(selectedBuffs.filter((_, i) => i !== index));
  };

  const updateRarityConfig = (rank: string, field: keyof TierConfig['rarityConfigs'][string], value: number) => {
    setTierConfig({
      ...tierConfig,
      rarityConfigs: {
        ...tierConfig.rarityConfigs,
        [rank]: {
          ...tierConfig.rarityConfigs[rank],
          [field]: value,
        },
      },
    });
  };

  const saveChip = () => {
    if (!chipName || selectedBuffs.length === 0) {
      alert('Please provide a chip name and at least one buff');
      return;
    }

    const newChip: ChipDefinition = {
      id: `chip_${Date.now()}`,
      name: chipName,
      description: chipDescription,
      category: chipCategory,
      tier: chipTier,
      imageUrl: imagePreview || undefined,
      possibleBuffs: selectedBuffs,
      tierConfig,
    };

    if (editingChip) {
      setSavedChips(savedChips.map(chip => chip.id === editingChip.id ? newChip : chip));
      setEditingChip(null);
    } else {
      setSavedChips([...savedChips, newChip]);
    }

    // Reset form
    setChipName('');
    setChipDescription('');
    setChipCategory('utility');
    setChipTier(1);
    setSelectedBuffs([]);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const editChip = (chip: ChipDefinition) => {
    setEditingChip(chip);
    setChipName(chip.name);
    setChipDescription(chip.description);
    setChipCategory(chip.category);
    setChipTier(chip.tier);
    setSelectedBuffs(chip.possibleBuffs);
    setImagePreview(chip.imageUrl || null);
    setTierConfig(chip.tierConfig);
  };

  const deleteChip = (chipId: string) => {
    if (confirm('Are you sure you want to delete this chip?')) {
      setSavedChips(savedChips.filter(chip => chip.id !== chipId));
    }
  };

  const exportChips = () => {
    const dataStr = JSON.stringify(savedChips, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'chip_definitions.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 p-6 bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-gray-700 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
              CHIP BUILDER
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-wider">
              Design and configure universal enhancement chips
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Chip Editor */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-900/60 border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Chip Name</label>
                    <input
                      type="text"
                      value={chipName}
                      onChange={(e) => setChipName(e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none"
                      placeholder="e.g., Quantum Processor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                    <textarea
                      value={chipDescription}
                      onChange={(e) => setChipDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none h-20 resize-none"
                      placeholder="A powerful chip that enhances quantum calculations..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Category</label>
                      <select
                        value={chipCategory}
                        onChange={(e) => setChipCategory(e.target.value as ChipDefinition['category'])}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none"
                      >
                        <option value="attack">Attack</option>
                        <option value="defense">Defense</option>
                        <option value="utility">Utility</option>
                        <option value="economy">Economy</option>
                        <option value="special">Special</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Tier (T1-T10)</label>
                      <select
                        value={chipTier}
                        onChange={(e) => setChipTier(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 text-white focus:border-yellow-500 outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                          <option key={tier} value={tier}>Tier {tier}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Chip Artwork</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    >
                      Upload Image
                    </button>
                    {imagePreview && (
                      <div className="mt-4 relative w-32 h-32 border border-gray-700">
                        <Image
                          src={imagePreview}
                          alt="Chip preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buff Configuration */}
              <div className="bg-gray-900/60 border border-gray-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-yellow-400">Possible Buffs</h2>
                  <button
                    onClick={addBuff}
                    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold transition-colors"
                  >
                    + Add Buff
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedBuffs.map((buff, index) => {
                    const buffType = BUFF_TYPES.find(b => b.id === buff.buffType);
                    return (
                      <div key={index} className="p-4 bg-black/50 border border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{buffType?.icon}</span>
                            <select
                              value={buff.buffType}
                              onChange={(e) => updateBuff(index, { buffType: e.target.value })}
                              className="px-3 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                            >
                              {BUFF_TYPES.map(type => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removeBuff(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Base Proc Chance (%)</label>
                            <input
                              type="number"
                              value={buff.procChance}
                              onChange={(e) => updateBuff(index, { procChance: Number(e.target.value) })}
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                            />
                            <span className="text-xs text-gray-500">Chance this buff appears (modified by rarity)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveChip}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg transition-colors"
              >
                {editingChip ? 'Update Chip' : 'Save Chip'}
              </button>
            </div>

            {/* Right Column - Tier/Rarity Configuration & Preview */}
            <div className="space-y-6">
              {/* Tier Configuration for Each Rarity */}
              <div className="bg-gray-900/60 border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">Tier {chipTier} - Rarity Configuration</h2>
                <p className="text-sm text-gray-400 mb-4">Configure value ranges and buff counts for each rarity</p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {CHIP_RANKS.map((rank) => (
                    <div key={rank} className="p-3 bg-black/50 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-yellow-400">{rank} Rarity</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="text-xs text-gray-500">Min Value</label>
                          <input
                            type="number"
                            value={tierConfig.rarityConfigs[rank]?.minValue || 0}
                            onChange={(e) => updateRarityConfig(rank, 'minValue', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Max Value</label>
                          <input
                            type="number"
                            value={tierConfig.rarityConfigs[rank]?.maxValue || 0}
                            onChange={(e) => updateRarityConfig(rank, 'maxValue', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Buff Count</label>
                          <input
                            type="number"
                            value={tierConfig.rarityConfigs[rank]?.buffCount || 1}
                            onChange={(e) => updateRarityConfig(rank, 'buffCount', Number(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Proc Multiplier</label>
                          <input
                            type="number"
                            value={tierConfig.rarityConfigs[rank]?.procMultiplier || 1}
                            onChange={(e) => updateRarityConfig(rank, 'procMultiplier', Number(e.target.value))}
                            step="0.1"
                            min="0.1"
                            max="5"
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {chipName && selectedBuffs.length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 p-6">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4">Preview</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black/50 border-2 border-yellow-500/50">
                      <div className="flex items-start gap-4">
                        {imagePreview && (
                          <div className="relative w-16 h-16 border border-gray-700 flex-shrink-0">
                            <Image
                              src={imagePreview}
                              alt={chipName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-yellow-400">{chipName}</h3>
                          <p className="text-sm text-gray-400 mb-2">{chipDescription}</p>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-800 text-gray-300">T{chipTier}</span>
                            <span className="px-2 py-1 bg-gray-800 text-gray-300 capitalize">{chipCategory}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      <p className="mb-2">Example at SSS Rarity:</p>
                      <ul className="space-y-1">
                        {selectedBuffs.map((buff, index) => {
                          const buffType = BUFF_TYPES.find(b => b.id === buff.buffType);
                          const config = tierConfig.rarityConfigs['SSS'];
                          const finalProcChance = Math.round(buff.procChance * (config?.procMultiplier || 1));
                          return (
                            <li key={index} className="flex items-center gap-2">
                              <span>{buffType?.icon}</span>
                              <span>
                                {buffType?.name}: {config?.minValue || 0}-{config?.maxValue || 0}{buffType?.unit}
                                <span className="text-xs text-gray-500"> ({finalProcChance}% chance)</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-2 text-xs">
                        This rarity gets {tierConfig.rarityConfigs['SSS']?.buffCount || 1} random buffs from above
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Saved Chips */}
          {savedChips.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-yellow-400">Saved Chips</h2>
                <button
                  onClick={exportChips}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
                >
                  Export All Chips
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedChips.map((chip) => (
                  <div key={chip.id} className="bg-gray-900/60 border border-gray-800 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {chip.imageUrl && (
                        <div className="relative w-12 h-12 border border-gray-700 flex-shrink-0">
                          <Image
                            src={chip.imageUrl}
                            alt={chip.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-400">{chip.name}</h3>
                        <p className="text-xs text-gray-400">{chip.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-gray-800">T{chip.tier}</span>
                          <span className="text-xs px-2 py-1 bg-gray-800 capitalize">{chip.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      {chip.possibleBuffs.length} buff types configured
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editChip(chip)}
                        className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteChip(chip.id)}
                        className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}