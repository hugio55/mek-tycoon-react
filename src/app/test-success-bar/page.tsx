'use client';

import React, { useState } from 'react';
import SuccessBar from '@/components/SuccessBar';
import SuccessBarImproved from '@/components/SuccessBarImproved';
import { DifficultyConfig } from '@/lib/difficultyModifiers';

export default function TestSuccessBar() {
  const [layoutStyle, setLayoutStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [successRate, setSuccessRate] = useState(65);
  const [greenLine, setGreenLine] = useState(50);
  const [showImproved, setShowImproved] = useState(true);
  const [improvedVariant, setImprovedVariant] = useState<1 | 2 | 3 | 4>(1);
  const [meterVariant, setMeterVariant] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [statusCardVariant, setStatusCardVariant] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Sample difficulty config
  const difficultyConfig: DifficultyConfig = {
    nodeType: 'normal',
    difficulty: 'medium',
    displayName: 'Medium',
    successGreenLine: greenLine,
    goldMultiplier: 1.5,
    xpMultiplier: 1.5,
    deploymentCostMultiplier: 1.5,
    overshootBonusRate: 1,
    maxOvershootBonus: 50,
    essenceAmountMultiplier: 1.5,
    requiredSuccess: 50
  };

  const layoutDescriptions = [
    'Vertical Stacked Card - Success on top with large display, rewards stacked below',
    'Two-Row Horizontal - Success spanning full width, rewards in grid below',
    'Grid Modular 2x2 - Success takes hero spot, rewards in modular cells',
    'Asymmetric Hero - Success prominent on left, compact rewards on right',
    'Compact Badge/Pills - Minimal horizontal layout with pill-shaped elements'
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Success Bar Testing - Original vs Improved Designs</h1>

        {/* Version Toggle */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border-2 border-yellow-500/50">
          <div className="flex items-center gap-4">
            <span className="text-gray-300 font-bold">Version:</span>
            <button
              onClick={() => setShowImproved(false)}
              className={`px-4 py-2 rounded font-bold transition-all ${
                !showImproved ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Original Design
            </button>
            <button
              onClick={() => setShowImproved(true)}
              className={`px-4 py-2 rounded font-bold transition-all ${
                showImproved ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-300'
              }`}
            >
              NEW Success Meter Variants (5 Designs)
            </button>
          </div>
        </div>

        {/* Meter Variant Selector */}
        {showImproved && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border-2 border-green-500/50">
            <h2 className="text-xl font-bold text-green-400 mb-4">NEW Success Meter Designs</h2>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((variant) => (
                <button
                  key={variant}
                  onClick={() => setMeterVariant(variant as 1 | 2 | 3 | 4 | 5)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${meterVariant === variant
                      ? 'bg-green-500/30 border-green-400 text-green-400'
                      : 'bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="text-lg font-bold mb-1">{variant}</div>
                  <div className="text-xs">
                    {[
                      'Current',
                      'Tactical',
                      'Holographic',
                      'Military',
                      'Cinematic'
                    ][variant - 1]}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-sm text-green-300 bg-green-900/20 p-3 rounded">
              <strong>Current:</strong> {[
                'Current Design - Original success meter',
                'Tactical Industrial - Bold yellow title, 16px bar, bright green overshoot',
                'Holographic Modern - Gradient title, 20px bar, intense glow overshoot',
                'Military Command - Stencil title with hazard stripes, 20px bar, alert green',
                'Cinematic Sci-Fi - Massive 30px title, 24px bar, cinematic green glow'
              ][meterVariant - 1]}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">Controls</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Success Rate Control */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Success Rate: {successRate}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={successRate}
                onChange={(e) => setSuccessRate(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Green Line Control */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Green Line: {greenLine}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={greenLine}
                onChange={(e) => setGreenLine(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Quick Set Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setSuccessRate(25); setGreenLine(50); }}
              className="px-3 py-1 bg-red-800 text-white rounded text-sm"
            >
              Below Green
            </button>
            <button
              onClick={() => { setSuccessRate(50); setGreenLine(50); }}
              className="px-3 py-1 bg-yellow-800 text-white rounded text-sm"
            >
              At Green Line
            </button>
            <button
              onClick={() => { setSuccessRate(75); setGreenLine(50); }}
              className="px-3 py-1 bg-green-800 text-white rounded text-sm"
            >
              Overshoot +25%
            </button>
            <button
              onClick={() => { setSuccessRate(100); setGreenLine(50); }}
              className="px-3 py-1 bg-blue-800 text-white rounded text-sm"
            >
              Max Overshoot
            </button>
          </div>
        </div>

        {/* Layout Selector */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            {showImproved ? 'Select Improved Design Variant' : 'Select Original Layout Variation'}
          </h2>

          {showImproved ? (
            <>
              {/* Improved Design Variants */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 1, name: 'Tactical Industrial', desc: 'Military-inspired with heavy industrial aesthetics' },
                  { id: 2, name: 'Holographic Modern', desc: 'Sleek with glass morphism and orb goalpost' },
                  { id: 3, name: 'Military Command', desc: 'Command center with hazard stripes and alerts' },
                  { id: 4, name: 'Cinematic Sci-Fi', desc: 'Movie-quality with lens flares and depth' }
                ].map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setImprovedVariant(variant.id as 1 | 2 | 3 | 4)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${improvedVariant === variant.id
                        ? 'bg-green-500/20 border-green-400 text-green-400'
                        : 'bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="text-lg font-bold mb-2">Variant {variant.id}</div>
                    <div className="text-xs font-bold mb-1">{variant.name}</div>
                    <div className="text-[10px] text-gray-500">{variant.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded">
                <h3 className="text-sm font-bold text-green-400 mb-2">KEY IMPROVEMENTS:</h3>
                <ul className="text-xs text-green-300 space-y-1">
                  <li>✓ Prominent SUCCESS METER label with unique styling</li>
                  <li>✓ Thicker bar (16-24px vs 12px) for better visual weight</li>
                  <li>✓ Green glowing overshoot section past goalpost</li>
                  <li>✓ Percentage positioned directly under goalpost marker</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Original Layout Variations */}
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((layout) => (
                  <button
                    key={layout}
                    onClick={() => setLayoutStyle(layout as 1 | 2 | 3 | 4 | 5)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${layoutStyle === layout
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                        : 'bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="text-2xl font-bold mb-2">Layout {layout}</div>
                    <div className="text-xs">
                      {['Vertical', 'Two-Row', 'Grid', 'Asymmetric', 'Compact'][layout - 1]}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-400 bg-black/40 p-3 rounded">
                <strong>Current:</strong> {layoutDescriptions[layoutStyle - 1]}
              </div>
            </>
          )}
        </div>

        {/* Status Card Variant Selector - Only shown for Original Design */}
        {!showImproved && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border-2 border-purple-500/50">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Mission Status Card Variations</h2>
            <div className="grid grid-cols-5 gap-3">
              {[
                { id: 1, name: 'Split Layout', desc: 'Mission left, overshoot right, divider, rewards below' },
                { id: 2, name: 'Centered Balance', desc: 'Centered mission with overshoot badge, balanced layout' },
                { id: 3, name: 'Top Row Focus', desc: 'Full-width top row with overlay warning' },
                { id: 4, name: 'Compact Integration', desc: 'Minimal spacing, integrated overshoot display' },
                { id: 5, name: 'Data Priority', desc: 'Large overshoot %, small label, clear hierarchy' }
              ].map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setStatusCardVariant(variant.id as 1 | 2 | 3 | 4 | 5)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${statusCardVariant === variant.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-400'
                      : 'bg-black/40 border-gray-600 text-gray-400 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="text-lg font-bold mb-1">V{variant.id}</div>
                  <div className="text-xs font-bold mb-1">{variant.name}</div>
                  <div className="text-[10px] text-gray-500">{variant.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded">
              <h3 className="text-sm font-bold text-purple-400 mb-2">Current Selection: Variant {statusCardVariant}</h3>
              <p className="text-xs text-purple-300">
                {statusCardVariant === 1 && "Mission status aligned left, overshoot aligned right in the top row. Divider separates from rewards."}
                {statusCardVariant === 2 && "Balanced design with centered mission status and overshoot as a floating badge."}
                {statusCardVariant === 3 && "Full-width top row with integrated overshoot. Warning overlay covers reward stats when below threshold."}
                {statusCardVariant === 4 && "Tightly integrated design with minimal spacing. Overshoot flows naturally with mission status."}
                {statusCardVariant === 5 && "Emphasizes the overshoot percentage as the primary data point with smaller supporting text."}
              </p>
            </div>
          </div>
        )}

        {/* Success Bar Display */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            {showImproved ? `Improved Design - Variant ${improvedVariant}` : 'Original Design Preview'}
          </h2>
          <div className="bg-black p-6 rounded">
            {showImproved ? (
              <SuccessBarImproved
                currentSuccess={successRate}
                difficultyConfig={difficultyConfig}
                designVariant={improvedVariant}
                mekContributions={[
                  { mekId: '1', name: 'MEK #1234', rank: 5, contribution: 15 },
                  { mekId: '2', name: 'MEK #5678', rank: 3, contribution: 10 },
                  { mekId: '3', name: 'MEK #9012', rank: 7, contribution: 20 }
                ]}
                showDetails={false}
              />
            ) : (
              <SuccessBar
                currentSuccess={successRate}
                difficultyConfig={difficultyConfig}
                layoutStyle={layoutStyle}
                meterVariant={meterVariant}
                statusCardVariant={statusCardVariant}
                baseRewards={{ gold: 1000, xp: 500 }}
                mekContributions={[
                  { mekId: '1', name: 'MEK #1234', rank: 5, contribution: 15 },
                  { mekId: '2', name: 'MEK #5678', rank: 3, contribution: 10 },
                  { mekId: '3', name: 'MEK #9012', rank: 7, contribution: 20 }
                ]}
                showDetails={false}
              />
            )}
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            {showImproved ? 'All 4 Improved Designs Side by Side' : 'All Original Layouts Side by Side'}
          </h2>
          {showImproved ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { id: 1, name: 'Tactical Industrial' },
                { id: 2, name: 'Holographic Modern' },
                { id: 3, name: 'Military Command' },
                { id: 4, name: 'Cinematic Sci-Fi' }
              ].map((variant) => (
                <div key={variant.id} className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-green-400 mb-3">
                    Variant {variant.id}: {variant.name}
                  </h3>
                  <div className="bg-black p-4 rounded">
                    <SuccessBarImproved
                      currentSuccess={successRate}
                      difficultyConfig={difficultyConfig}
                      designVariant={variant.id as 1 | 2 | 3 | 4}
                      showDetails={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5].map((layout) => (
                <div key={layout} className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-yellow-400 mb-3">
                    Layout {layout}: {['Vertical Stack', 'Two-Row', 'Grid', 'Asymmetric', 'Compact'][layout - 1]}
                  </h3>
                  <div className="bg-black p-4 rounded">
                    <SuccessBar
                      currentSuccess={successRate}
                      difficultyConfig={difficultyConfig}
                      layoutStyle={layout as 1 | 2 | 3 | 4 | 5}
                      baseRewards={{ gold: 1000, xp: 500 }}
                      showDetails={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}