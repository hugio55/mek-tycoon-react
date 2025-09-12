'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

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
  procChance: number;
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

interface MasterRangeSystemProps {
  onApplyRanges?: () => void;
  className?: string;
}

export default function MasterRangeSystem({ onApplyRanges, className = '' }: MasterRangeSystemProps) {
  // Fetch buff categories from database
  const buffCategories = useQuery(api.buffCategories.getAll);
  const masterRangesData = useQuery(api.chipConfigurations.getMasterRanges);
  
  // Mutations
  const setMasterRange = useMutation(api.chipConfigurations.setMasterRange);
  const setAllMasterRanges = useMutation(api.chipConfigurations.setAllMasterRanges);
  const saveAllChipConfigs = useMutation(api.chipConfigurations.saveAllChipConfigs);
  const initializeMasterRanges = useMutation(api.chipConfigurations.initializeMasterRanges);
  
  // Master range system - local state for editing
  const [masterRanges, setMasterRanges] = useState<{[buffId: string]: {min: number, max: number}}>({});
  const [curvePowers, setCurvePowers] = useState<{[buffId: string]: number}>({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'gold' | 'essence' | 'looter'>('gold');

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
    
    // Call the callback if provided
    if (onApplyRanges) {
      onApplyRanges();
    }
  };

  const exportMasterRanges = () => {
    const dataStr = JSON.stringify(masterRanges, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'master_ranges.json');
    linkElement.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-gray-900/60 border border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Master Range System</h2>
        <p className="text-gray-400 mb-4">
          Set a single master range for each buff type. This range is automatically divided across all ranks and tiers.
          <span className="block text-xs text-blue-400 mt-2">
            ℹ️ Categories are synced with the database. Add/remove categories in the Buff Categories page to update this list.
          </span>
        </p>
        
        {/* Category Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-0">
            <button
              onClick={() => setSelectedCategoryTab('gold')}
              className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                selectedCategoryTab === 'gold'
                  ? 'bg-yellow-400 text-black border-b-2 border-yellow-400'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              Gold & Market
            </button>
            <button
              onClick={() => setSelectedCategoryTab('essence')}
              className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                selectedCategoryTab === 'essence'
                  ? 'bg-purple-400 text-black border-b-2 border-purple-400'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              Essence
            </button>
            <button
              onClick={() => setSelectedCategoryTab('looter')}
              className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
                selectedCategoryTab === 'looter'
                  ? 'bg-blue-400 text-black border-b-2 border-blue-400'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              Looter & Rewards
            </button>
          </div>
        </div>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={applyMasterRanges}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
          >
            Apply All Ranges
          </button>
          <button
            onClick={exportMasterRanges}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
          >
            Export Master Ranges
          </button>
        </div>
        
        {/* Master Range Charts */}
        <div className="space-y-8">
          {buffCategories && buffCategories
            .filter(cat => {
              // Filter by active status
              if (cat.isActive === false) return false;
              
              // Filter by selected category tab
              if (selectedCategoryTab === 'gold') {
                return cat.category === 'gold' || cat.category === 'market';
              } else if (selectedCategoryTab === 'essence') {
                return cat.category === 'essence';
              } else if (selectedCategoryTab === 'looter') {
                return cat.category === 'rarity_bias' || cat.category === 'reward_chance' || cat.category === 'xp';
              }
              return false;
            })
            .map(category => {
              const masterRange = masterRanges[category._id] || { min: 1, max: 100 };
              const icon = getCategoryIcon(category.category || 'gold');
              const unit = getUnitDisplay(category.unitType || 'flat_number');
              
              const isExpanded = expandedCategory === category._id;
              
              return (
                <div key={category._id} className="bg-black/50 border border-gray-700">
                  <div 
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                    onClick={() => setExpandedCategory(isExpanded ? null : category._id)}
                  >
                    {/* Expand/Collapse Indicator */}
                    <span className="text-xl text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-xl font-bold text-yellow-400">{category.name}</h3>
                    <span className="text-sm text-gray-400">({unit || 'points'})</span>
                    
                    {/* Quick Preview when collapsed */}
                    {!isExpanded && (
                      <div className="ml-auto flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Range:</span>
                        <span className="text-green-400">{masterRange.min}</span>
                        <span className="text-gray-500">-</span>
                        <span className="text-blue-400">{masterRange.max}</span>
                        <span className="text-gray-400">{unit}</span>
                      </div>
                    )}
                  </div>
                
                {/* Expandable Content */}
                {isExpanded && (
                  <div className="p-4">
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
                )}
              </div>
            );
          })}
        </div>
        
        {/* Category Count Info */}
        {buffCategories && (
          <div className="mt-6 p-4 bg-black/50 border border-gray-700">
            <div className="text-sm text-gray-400">
              {(() => {
                const filteredCount = buffCategories.filter(cat => {
                  if (cat.isActive === false) return false;
                  if (selectedCategoryTab === 'gold') {
                    return cat.category === 'gold' || cat.category === 'market';
                  } else if (selectedCategoryTab === 'essence') {
                    return cat.category === 'essence';
                  } else if (selectedCategoryTab === 'looter') {
                    return cat.category === 'rarity_bias' || cat.category === 'reward_chance' || cat.category === 'xp';
                  }
                  return false;
                }).length;
                
                if (filteredCount === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-yellow-400 text-lg mb-2">No categories found in this group</p>
                      <p className="text-gray-500">Add categories in the <a href="/admin/buff-categories" className="text-blue-400 hover:text-blue-300 underline">Buff Categories</a> page</p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <p>Showing {filteredCount} active {selectedCategoryTab === 'gold' ? 'Gold & Market' : selectedCategoryTab === 'essence' ? 'Essence' : 'Looter & Rewards'} categories</p>
                    <p className="text-xs mt-1">Categories automatically sync from the database. Manage them in the <a href="/admin/buff-categories" className="text-blue-400 hover:text-blue-300 underline">Buff Categories</a> page.</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}