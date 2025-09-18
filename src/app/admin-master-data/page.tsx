'use client';

import { useState, useEffect } from 'react';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import MasterRangeSystem from '@/components/MasterRangeSystem';
import GameDataLightbox from '@/components/GameDataLightbox';
import StoryClimbConfig from '@/components/StoryClimbConfig';
import DifficultyAdminConfig from '@/components/DifficultyAdminConfig';

// Data system definitions
const DATA_SYSTEMS = [
  { id: 'difficulty-system', name: 'Difficulty System Configuration', icon: '⚔️', implemented: true },
  { id: 'mek-talent-tree', name: 'Mek Talent Tree Nodes', icon: '🌳', implemented: false },
  { id: 'mech-power-chips', name: 'Mech Power Chips', icon: '⚡', implemented: false },
  { id: 'universal-chips', name: 'Universal Power Chips', icon: '🔮', implemented: true },
  { id: 'story-climb-mechanics', name: 'Story Climb Mechanics', icon: '🏔️', implemented: false },
  { id: 'daily-recipes', name: 'Daily Recipes (Universal Chips)', icon: '📖', implemented: false },
  { id: 'salvage-materials', name: 'Salvage Materials', icon: '🔧', implemented: false },
  { id: 'circuitry-costs', name: 'Circuitry Crafting Costs', icon: '💰', implemented: false },
  { id: 'mech-chip-recipes', name: 'Mech Chip Crafting Recipes', icon: '🔨', implemented: false },
  { id: 'single-missions', name: 'Single Missions Formulation', icon: '🎯', implemented: false },
  { id: 'global-game-data', name: 'Global Game Data', icon: '🌐', implemented: true },
  { id: 'shop-system', name: 'Shop System', icon: '🛒', implemented: true },
  { id: 'offers-system', name: 'Offers System', icon: '💬', implemented: true }
];

export default function AdminMasterDataPage() {
  const convex = useConvex();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showGameDataLightbox, setShowGameDataLightbox] = useState(false);
  const [systemCompletion, setSystemCompletion] = useState<Record<string, 'incomplete' | 'in-progress' | 'complete'>>(() => {
    // Always use defaults during initial render to avoid hydration mismatch
    const initial: Record<string, 'incomplete' | 'in-progress' | 'complete'> = {};
    DATA_SYSTEMS.forEach(s => { initial[s.id] = s.implemented ? 'complete' : 'incomplete'; });
    return initial;
  });
  
  // Master Range Controls
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);
  const [scalingFactor, setScalingFactor] = useState(1.5);

  // Load system completion status from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('systemImplementationStatus');
    if (saved) {
      try {
        setSystemCompletion(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved system status:', e);
      }
    }
  }, []); // Only run once on mount

  // Save system completion status to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemImplementationStatus', JSON.stringify(systemCompletion));
    }
  }, [systemCompletion]);

  // Visual Progress Calculation
  const implementedCount = Object.values(systemCompletion).filter(status => status === 'complete').length;
  const inProgressCount = Object.values(systemCompletion).filter(status => status === 'in-progress').length;
  const totalCount = DATA_SYSTEMS.length;
  const progressPercentage = (implementedCount / totalCount) * 100;

  const toggleSection = (sectionId: string) => {
    // Only allow one section open at a time
    const newExpanded = new Set<string>();
    if (!expandedSections.has(sectionId)) {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const navigateToSection = (sectionId: string) => {
    // Only expand this section (close others)
    const newExpanded = new Set<string>();
    newExpanded.add(sectionId);
    setExpandedSections(newExpanded);

    // Scroll to section after a brief delay for expansion animation
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSystemRightClick = (e: React.MouseEvent, systemId: string) => {
    e.preventDefault();
    // Cycle through states: incomplete -> in-progress -> complete -> incomplete
    setSystemCompletion(prev => {
      const current = prev[systemId];
      let next: 'incomplete' | 'in-progress' | 'complete' = 'incomplete';
      if (current === 'incomplete') next = 'in-progress';
      else if (current === 'in-progress') next = 'complete';
      else next = 'incomplete';
      return { ...prev, [systemId]: next };
    });
  };

  const applyGlobalScaling = (baseValue: number, level: number = 1): number => {
    return Math.round(baseValue * globalMultiplier * Math.pow(scalingFactor, level - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
          MASTER DATA SYSTEMS
        </h1>
        <p className="text-gray-400 mb-8">Centralized procedural generation and game balance control</p>

        {/* Simple Systems Checklist */}
        <div className="bg-black/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-400">System Implementation Status</h2>
            <div className="text-xs text-gray-500">
              <span className="text-green-400">{implementedCount}</span>
              {inProgressCount > 0 && <span className="text-orange-400">/{inProgressCount}</span>}
              <span className="text-gray-500">/{totalCount}</span>
              <span className="ml-2 text-gray-600">(Complete{inProgressCount > 0 && '/In Progress'}/Total)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {DATA_SYSTEMS.map((system) => {
              const status = systemCompletion[system.id];
              const isComplete = status === 'complete';
              const isInProgress = status === 'in-progress';

              return (
                <div
                  key={system.id}
                  className={`flex items-center justify-between rounded px-3 py-2 transition-all ${
                    isComplete
                      ? 'bg-green-900/40 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      : isInProgress
                      ? 'bg-orange-900/30 border border-orange-500/50'
                      : 'bg-gray-900/30 border border-gray-700/30'
                  }`}
                >
                  <span
                    className={`text-xs cursor-pointer transition-colors ${
                      isComplete
                        ? 'text-green-300 font-semibold'
                        : isInProgress
                        ? 'text-orange-300'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    onClick={() => {
                      if (system.id === 'global-game-data') {
                        setShowGameDataLightbox(true);
                      } else {
                        navigateToSection(system.id);
                      }
                    }}
                  >
                    {system.name}
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setSystemCompletion(prev => ({
                      ...prev,
                      [system.id]: e.target.value as 'incomplete' | 'in-progress' | 'complete'
                    }))}
                    className={`text-xs px-2 py-1 rounded border bg-black/50 ${
                      isComplete
                        ? 'text-green-400 border-green-500/30 font-semibold'
                        : isInProgress
                        ? 'text-orange-400 border-orange-500/30'
                        : 'text-gray-400 border-gray-600/30'
                    }`}
                  >
                    <option value="incomplete">Incomplete</option>
                    <option value="in-progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>


        {/* Master Range Control System */}
        <div className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Master Range Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Global Multiplier</label>
              <input
                type="number"
                value={globalMultiplier}
                onChange={(e) => setGlobalMultiplier(parseFloat(e.target.value) || 1)}
                step="0.1"
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Min Range</label>
              <input
                type="number"
                value={minRange}
                onChange={(e) => setMinRange(parseInt(e.target.value) || 1)}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Max Range</label>
              <input
                type="number"
                value={maxRange}
                onChange={(e) => setMaxRange(parseInt(e.target.value) || 100)}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Scaling Factor</label>
              <input
                type="number"
                value={scalingFactor}
                onChange={(e) => setScalingFactor(parseFloat(e.target.value) || 1.5)}
                step="0.1"
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-500/20">
            <p className="text-sm text-blue-300">
              Formula: <code className="bg-black/50 px-2 py-1 rounded">baseValue × {globalMultiplier} × {scalingFactor}^(level-1)</code>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Example: Base 10 at Level 5 = {applyGlobalScaling(10, 5)}
            </p>
          </div>
        </div>

        {/* Data Systems Sections */}
        <div className="space-y-4">
          {/* Difficulty System Configuration */}
          <div id="section-difficulty-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg">
            <button
              onClick={() => toggleSection('difficulty-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚔️</span>
                <h3 className="text-lg font-bold text-yellow-400">Difficulty System Configuration</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('difficulty-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('difficulty-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Configure difficulty levels for missions: success thresholds, reward multipliers, slot counts, and essence distribution.
                  Controls how Easy, Medium, and Hard difficulties affect gameplay balance.
                </p>
                <DifficultyAdminConfig />
              </div>
            )}
          </div>

          {/* Mek Talent Tree Nodes */}
          <div id="section-mek-talent-tree" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('mek-talent-tree')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌳</span>
                <h3 className="text-lg font-bold text-yellow-400">Mek Talent Tree Nodes</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('mek-talent-tree') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mek-talent-tree') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Configure talent tree node generation parameters</p>
                {/* Content will go here */}
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Mech Power Chips */}
          <div id="section-mech-power-chips" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('mech-power-chips')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-bold text-yellow-400">Mech Power Chips</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('mech-power-chips') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mech-power-chips') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Mech chip stats and rarity configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Universal Power Chips */}
          <div id="section-universal-chips" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg">
            <button
              onClick={() => toggleSection('universal-chips')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <h3 className="text-lg font-bold text-yellow-400">Universal Power Chips</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('universal-chips') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('universal-chips') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Universal chip buff generation system with master ranges for all buff categories.
                  <span className="text-green-400 ml-2">✓ Migrated from chip-builder page</span>
                </p>
                <MasterRangeSystem 
                  onApplyRanges={() => {
                    console.log('Universal chip ranges applied');
                  }}
                />
              </div>
            )}
          </div>

          {/* Story Climb Mechanics */}
          <div id="section-story-climb-mechanics" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('story-climb-mechanics')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏔️</span>
                <h3 className="text-lg font-bold text-yellow-400">Story Climb Mechanics</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('story-climb-mechanics') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('story-climb-mechanics') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Unified system for story progression, events, mechanisms, bosses, and final bosses.
                  Controls how mechanisms are distributed across story nodes.
                </p>
                <StoryClimbConfig />
              </div>
            )}
          </div>

          {/* Daily Recipes */}
          <div id="section-daily-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('daily-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <h3 className="text-lg font-bold text-yellow-400">Daily Recipes (Universal Chips)</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('daily-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('daily-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Daily recipe rotation and requirements</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Salvage Materials */}
          <div id="section-salvage-materials" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('salvage-materials')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔧</span>
                <h3 className="text-lg font-bold text-yellow-400">Salvage Materials</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('salvage-materials') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('salvage-materials') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Material types, rarity, and drop rates</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Circuitry Crafting Costs */}
          <div id="section-circuitry-costs" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('circuitry-costs')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-bold text-yellow-400">Circuitry Crafting Costs</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('circuitry-costs') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('circuitry-costs') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Resource costs for circuitry crafting</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Mech Chip Crafting Recipes */}
          <div id="section-mech-chip-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('mech-chip-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔨</span>
                <h3 className="text-lg font-bold text-yellow-400">Mech Chip Crafting Recipes</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('mech-chip-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mech-chip-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Recipe requirements and combinations</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Single Missions Formulation */}
          <div id="section-single-missions" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('single-missions')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-bold text-yellow-400">Single Missions Formulation</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('single-missions') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('single-missions') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Mission generation and reward balancing</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Shop System */}
          <div id="section-shop-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg">
            <button
              onClick={() => toggleSection('shop-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <h3 className="text-lg font-bold text-yellow-400">Shop System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('shop-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('shop-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Comprehensive shop management, pricing, and rarity systems</p>

                {/* Rarity Sorting System */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-purple-400 mb-3">Item Rarity Sorting System</h4>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded p-3">
                      <h5 className="text-yellow-300 font-semibold mb-2">Rarity Calculation Formula</h5>
                      <div className="font-mono text-[10px] text-gray-500 bg-black/50 p-2 rounded">
                        <div>rarityScore = baseRarity * categoryWeight * supplyFactor * demandMultiplier</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded p-3">
                        <h5 className="text-green-400 font-semibold mb-1">Base Rarity Tiers</h5>
                        <div className="text-xs space-y-1 text-gray-400">
                          <div><span className="text-gray-300">Common:</span> 0-1000 score</div>
                          <div><span className="text-blue-300">Uncommon:</span> 1001-5000 score</div>
                          <div><span className="text-purple-300">Rare:</span> 5001-15000 score</div>
                          <div><span className="text-orange-300">Epic:</span> 15001-50000 score</div>
                          <div><span className="text-red-300">Legendary:</span> 50001+ score</div>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded p-3">
                        <h5 className="text-blue-400 font-semibold mb-1">Sort Priority Factors</h5>
                        <div className="text-xs space-y-1 text-gray-400">
                          <div>1. Rarity score (primary)</div>
                          <div>2. Market demand (secondary)</div>
                          <div>3. Recent sales velocity</div>
                          <div>4. Price trend direction</div>
                          <div>5. Alphabetical (fallback)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shop Categories Configuration */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-3">Shop Categories & Filters</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Main Categories</div>
                      <div className="text-gray-500 mt-1">• Meks<br/>• Chips<br/>• Materials<br/>• Blueprints</div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Sort Options</div>
                      <div className="text-gray-500 mt-1">• Rarity<br/>• Price ↑↓<br/>• Recent<br/>• Trending</div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Filters</div>
                      <div className="text-gray-500 mt-1">• Price Range<br/>• Rarity Tier<br/>• Seller<br/>• Time Listed</div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Pricing Model */}
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-green-400 mb-3">Dynamic Pricing Model</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Price Calculation:</span>
                      <span className="text-yellow-300 font-mono">rarityScore * 0.1 + minPrice</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Supply Adjustment:</span>
                      <span className="text-blue-300">±30% based on stock levels</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Demand Multiplier:</span>
                      <span className="text-purple-300">0.5x - 3.0x based on purchase rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Event Modifier:</span>
                      <span className="text-orange-300">Special sales, holidays, etc.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Offers System */}
          <div id="section-offers-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg">
            <button
              onClick={() => toggleSection('offers-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <h3 className="text-lg font-bold text-yellow-400">Offers System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('offers-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('offers-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Player-to-player offer negotiation and trade system</p>

                {/* Offer Window Criteria */}
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-orange-400 mb-3">Offer Window Interface</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="text-yellow-300 font-semibold text-xs">Required Fields</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Offer Amount:</span>
                          <span className="text-gray-300">Numeric input with validation</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Message (Optional):</span>
                          <span className="text-gray-300">140 char limit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expiration:</span>
                          <span className="text-gray-300">24h / 48h / 7d / 30d</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bundle Items:</span>
                          <span className="text-gray-300">Multi-select up to 5</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-blue-300 font-semibold text-xs">Validation Rules</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs text-gray-400">
                        <div>✓ Min offer: 10% of listing price</div>
                        <div>✓ Max offer: 200% of listing price</div>
                        <div>✓ User must have sufficient funds</div>
                        <div>✓ Cannot offer on own items</div>
                        <div>✓ Max 3 active offers per item</div>
                        <div>✓ Cooldown: 5 min between offers</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offer Status & Notifications */}
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3">Offer Management</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Offer States</div>
                      <div className="space-y-1">
                        <div className="text-yellow-300">• Pending</div>
                        <div className="text-green-300">• Accepted</div>
                        <div className="text-red-300">• Rejected</div>
                        <div className="text-gray-500">• Expired</div>
                        <div className="text-blue-300">• Counter-offered</div>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Notifications</div>
                      <div className="text-gray-500">
                        • New offer received<br/>
                        • Offer accepted/rejected<br/>
                        • Counter-offer made<br/>
                        • Offer expiring soon<br/>
                        • Outbid notification
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Quick Actions</div>
                      <div className="text-gray-500">
                        • Accept<br/>
                        • Reject<br/>
                        • Counter (±50%)<br/>
                        • Message buyer<br/>
                        • Block user
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Pricing Suggestions */}
                <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-pink-400 mb-3">AI Offer Suggestions</h4>
                  <div className="text-xs space-y-2">
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Fair Price Range:</span>
                      <span className="text-green-300 ml-2">Based on last 30 sales of similar items</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Win Probability:</span>
                      <span className="text-yellow-300 ml-2">Calculate % chance seller accepts</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Suggested Counter:</span>
                      <span className="text-blue-300 ml-2">AI-powered negotiation helper</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Game Data Lightbox */}
      <GameDataLightbox
        isOpen={showGameDataLightbox}
        onClose={() => setShowGameDataLightbox(false)}
      />
    </div>
  );
}