'use client';

import React, { useState } from 'react';
import MekCardBottomVariations from '@/components/MekCardBottomVariations';

export default function MekCardDemoPage() {
  // Test states for different scenarios
  const [scenario, setScenario] = useState<'normal' | 'withBonus' | 'maxLevel' | 'cantAfford'>('withBonus');

  // Scenario configurations
  const scenarios = {
    normal: {
      mekNumber: 1234,
      level: 5,
      baseGoldRate: 45.2,
      bonusGoldRate: 0,
      upgradeCost: 2000,
      canAfford: true,
      currentGold: 5000,
      nextLevelBoost: 10,
    },
    withBonus: {
      mekNumber: 5678,
      level: 7,
      baseGoldRate: 21.6,
      bonusGoldRate: 14.8, // Large bonus to test overflow
      upgradeCost: 8000,
      canAfford: true,
      currentGold: 12000,
      nextLevelBoost: 10,
    },
    maxLevel: {
      mekNumber: 9999,
      level: 10,
      baseGoldRate: 108.5,
      bonusGoldRate: 35.2,
      upgradeCost: 0,
      canAfford: false,
      currentGold: 50000,
      nextLevelBoost: 0,
    },
    cantAfford: {
      mekNumber: 3333,
      level: 3,
      baseGoldRate: 12.4,
      bonusGoldRate: 3.1,
      upgradeCost: 500,
      canAfford: false,
      currentGold: 250,
      nextLevelBoost: 10,
    },
  };

  const currentScenario = scenarios[scenario];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-black text-yellow-400 mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 20px rgba(250, 182, 23, 0.5)'
        }}>
          MEK CARD BOTTOM LAYOUT VARIATIONS
        </h1>
        <p className="text-gray-400">
          Three distinct solutions for handling dynamic gold rate displays without content overflow
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Test Scenarios</h2>

          <div className="grid grid-cols-4 gap-3">
            {Object.entries(scenarios).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setScenario(key as keyof typeof scenarios)}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  ${scenario === key
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400 scale-105'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                <div className="text-xs font-bold uppercase mb-1">
                  {key === 'normal' && 'Normal'}
                  {key === 'withBonus' && 'With Large Bonus'}
                  {key === 'maxLevel' && 'Max Level'}
                  {key === 'cantAfford' && "Can't Afford"}
                </div>
                <div className="text-[10px] opacity-70">
                  {key === 'normal' && 'Base rate only'}
                  {key === 'withBonus' && `${config.baseGoldRate} + ${config.bonusGoldRate} gold/hr`}
                  {key === 'maxLevel' && 'Level 10 display'}
                  {key === 'cantAfford' && 'Insufficient gold'}
                </div>
              </button>
            ))}
          </div>

          {/* Current Scenario Details */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-xs text-gray-500 uppercase mb-2">Current Test Values</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Mek #</span>
                <span className="text-yellow-400 ml-1 font-bold">{currentScenario.mekNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Level:</span>
                <span className="text-white ml-1 font-bold">{currentScenario.level}/10</span>
              </div>
              <div>
                <span className="text-gray-500">Base Rate:</span>
                <span className="text-yellow-400 ml-1 font-bold">{currentScenario.baseGoldRate}</span>
              </div>
              <div>
                <span className="text-gray-500">Bonus:</span>
                <span className="text-green-400 ml-1 font-bold">
                  {currentScenario.bonusGoldRate > 0 ? `+${currentScenario.bonusGoldRate}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Demo Component */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900/50 rounded-lg p-8">
          <MekCardBottomVariations {...currentScenario} />
        </div>
      </div>

      {/* Feature Comparison Grid */}
      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Layout Feature Comparison</h2>

        <div className="bg-black/60 border border-yellow-500/30 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-400">Feature</th>
                <th className="p-3 text-center text-yellow-400">Tactical Grid</th>
                <th className="p-3 text-center text-cyan-400">Holographic Stack</th>
                <th className="p-3 text-center text-green-400">Command Interface</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">Layout Type</td>
                <td className="p-3 text-center">Grid System</td>
                <td className="p-3 text-center">Vertical Layers</td>
                <td className="p-3 text-center">Two Columns</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">Space Efficiency</td>
                <td className="p-3 text-center">High</td>
                <td className="p-3 text-center">Medium</td>
                <td className="p-3 text-center">Very High</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">Visual Style</td>
                <td className="p-3 text-center">Military HUD</td>
                <td className="p-3 text-center">Cyberpunk Depth</td>
                <td className="p-3 text-center">Terminal/Console</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">Overflow Handling</td>
                <td className="p-3 text-center">Protected Cells</td>
                <td className="p-3 text-center">Expandable Layers</td>
                <td className="p-3 text-center">Column Separation</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">Best For</td>
                <td className="p-3 text-center">Compact Cards</td>
                <td className="p-3 text-center">Feature-Rich Display</td>
                <td className="p-3 text-center">Data-Heavy Views</td>
              </tr>
              <tr>
                <td className="p-3 text-gray-400">Animation Style</td>
                <td className="p-3 text-center">Scan Lines</td>
                <td className="p-3 text-center">Shimmer Effects</td>
                <td className="p-3 text-center">Terminal Blink</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Solution Explanation */}
      <div className="max-w-6xl mx-auto mt-12 mb-8">
        <div className="bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">How These Layouts Solve The Overlap Problem</h2>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <span className="text-yellow-400 font-bold">Problem:</span> When bonus rates are added (e.g., "21.6 + 14.8 gold/hr"),
              the text expands horizontally causing content to overlap and the mek number to disappear.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-black/40 rounded p-3">
                <h3 className="text-yellow-400 font-bold mb-2">Variation 1: Tactical Grid</h3>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• Each element in protected grid cell</li>
                  <li>• Mek # and level in separate boxes</li>
                  <li>• Gold rate has dedicated full-width cell</li>
                  <li>• Stacks vertically when content expands</li>
                </ul>
              </div>

              <div className="bg-black/40 rounded p-3">
                <h3 className="text-cyan-400 font-bold mb-2">Variation 2: Holographic Stack</h3>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• Vertical layers with breathing room</li>
                  <li>• Each layer can expand independently</li>
                  <li>• Base/bonus/total on separate lines</li>
                  <li>• Natural vertical flow prevents overlap</li>
                </ul>
              </div>

              <div className="bg-black/40 rounded p-3">
                <h3 className="text-green-400 font-bold mb-2">Variation 3: Command Interface</h3>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• Two-column split layout</li>
                  <li>• Critical info (mek#) on left</li>
                  <li>• Dynamic content (rates) on right</li>
                  <li>• Columns prevent horizontal overflow</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}