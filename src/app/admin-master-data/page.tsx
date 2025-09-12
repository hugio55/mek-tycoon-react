'use client';

import { useState, useEffect } from 'react';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Data system definitions
const DATA_SYSTEMS = [
  { id: 'mek-talent-tree', name: 'Mek Talent Tree Nodes', icon: '🌳', implemented: false },
  { id: 'mech-power-chips', name: 'Mech Power Chips', icon: '⚡', implemented: false },
  { id: 'universal-chips', name: 'Universal Power Chips', icon: '🔮', implemented: false },
  { id: 'events', name: 'Events System', icon: '📅', implemented: false },
  { id: 'bosses', name: 'Bosses', icon: '👹', implemented: false },
  { id: 'final-bosses', name: 'Final Bosses', icon: '🐉', implemented: false },
  { id: 'story-mechanisms', name: 'Story Mode Mechanisms', icon: '⚙️', implemented: false },
  { id: 'daily-recipes', name: 'Daily Recipes (Universal Chips)', icon: '📖', implemented: false },
  { id: 'salvage-materials', name: 'Salvage Materials', icon: '🔧', implemented: false },
  { id: 'circuitry-costs', name: 'Circuitry Crafting Costs', icon: '💰', implemented: false },
  { id: 'mech-chip-recipes', name: 'Mech Chip Crafting Recipes', icon: '🔨', implemented: false },
  { id: 'single-missions', name: 'Single Missions Formulation', icon: '🎯', implemented: false }
];

export default function AdminMasterDataPage() {
  const convex = useConvex();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Master Range Controls
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);
  const [scalingFactor, setScalingFactor] = useState(1.5);

  // Visual Progress Calculation
  const implementedCount = DATA_SYSTEMS.filter(s => s.implemented).length;
  const totalCount = DATA_SYSTEMS.length;
  const progressPercentage = (implementedCount / totalCount) * 100;

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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

        {/* Visual Progress Checklist */}
        <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-400">System Implementation Progress</h2>
            <div className="text-2xl font-bold text-yellow-500">
              {implementedCount}/{totalCount} Complete
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-6 mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${progressPercentage}%` }}
            >
              <span className="text-xs font-bold text-black">{progressPercentage.toFixed(0)}%</span>
            </div>
          </div>

          {/* System Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DATA_SYSTEMS.map((system) => (
              <button
                key={system.id}
                onClick={() => setActiveSystem(system.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${system.implemented 
                    ? 'bg-green-900/30 border-green-500/50 hover:border-green-400' 
                    : 'bg-gray-800/50 border-gray-600/50 hover:border-yellow-500'
                  }
                  ${activeSystem === system.id ? 'ring-2 ring-yellow-500' : ''}
                `}
              >
                <div className="text-3xl mb-2">{system.icon}</div>
                <div className="text-sm font-semibold">{system.name}</div>
                {system.implemented && (
                  <div className="absolute top-2 right-2 text-green-400">✓</div>
                )}
              </button>
            ))}
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
          {/* Mek Talent Tree Nodes */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('universal-chips')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <h3 className="text-lg font-bold text-yellow-400">Universal Power Chips</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('universal-chips') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('universal-chips') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Universal chip generation and balance</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Events System */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('events')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <h3 className="text-lg font-bold text-yellow-400">Events System</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('events') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('events') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Random events and triggers configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Bosses */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('bosses')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👹</span>
                <h3 className="text-lg font-bold text-yellow-400">Bosses</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('bosses') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('bosses') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Boss stats, abilities, and loot tables</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Final Bosses */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('final-bosses')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐉</span>
                <h3 className="text-lg font-bold text-yellow-400">Final Bosses</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('final-bosses') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('final-bosses') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">End-game boss configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Story Mode Mechanisms */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
            <button
              onClick={() => toggleSection('story-mechanisms')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <h3 className="text-lg font-bold text-yellow-400">Story Mode Mechanisms</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('story-mechanisms') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('story-mechanisms') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Story progression nodes and mechanics</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>

          {/* Daily Recipes */}
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
          <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg">
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
        </div>
      </div>
    </div>
  );
}