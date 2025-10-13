'use client';

import React, { useState } from 'react';
import {
  TacticalGrid,
  CommandCenter,
  HierarchicalStack,
  MilitaryConsole,
  AsymmetricFocus,
  TallDeployVariationB,
  TallDeployVariationC,
  TallDeployVariationD,
  AsymmetricFocusDurationA,
  AsymmetricFocusDurationB,
  AsymmetricFocusDurationC,
  AsymmetricFocusDurationD,
  AsymmetricDuration_Font1,
  AsymmetricDuration_Font2,
  AsymmetricDuration_Font3,
  AsymmetricDuration_Font4,
  AsymmetricDuration_Font5
} from '@/components/MissionControlDesignVariations';

export default function MissionControlDemo() {
  const [selectedVariation, setSelectedVariation] = useState<number>(1);
  const [canDeploy, setCanDeploy] = useState(true);
  const [nodeType, setNodeType] = useState<'normal' | 'boss' | 'final_boss' | 'event'>('boss');

  // Sample reward data based on node type
  const getRewards = () => {
    switch (nodeType) {
      case 'final_boss':
        return {
          gold: '200,000',
          essence: '3',
          chipT1: 'Universal T4',
          special: 'DMT Canister'
        };
      case 'boss':
        return {
          gold: '100,000',
          essence: '3',
          chipT1: 'Universal T4',
          special: 'DMT Canister'
        };
      case 'event':
        return {
          gold: '75,000',
          essence: '2',
          chipT1: 'Universal T4',
          special: 'DMT Canister'
        };
      default:
        return {
          gold: '30,000',
          essence: '1',
          chipT1: 'Universal T4',
          special: 'DMT Canister'
        };
    }
  };

  const rewards = getRewards();

  const variations = [
    {
      name: 'Tactical Grid',
      description: 'Compact 2x3 grid with integrated deploy button on top. Clean, efficient military interface.',
      component: TacticalGrid
    },
    {
      name: 'Command Center (Updated)',
      description: 'Tall deploy with integrated arrow design. Arrow flows into button structure.',
      component: CommandCenter
    },
    {
      name: 'Hierarchical Stack',
      description: 'Emphasizes primary resource (gold) with full-width deploy bar. Clear visual hierarchy.',
      component: HierarchicalStack
    },
    {
      name: 'Military Console',
      description: 'Segmented display with corner deploy button. Industrial console aesthetic.',
      component: MilitaryConsole
    },
    {
      name: 'Asymmetric Focus',
      description: 'Hero-sized deploy button with supporting resource grid. Bold, action-focused design.',
      component: AsymmetricFocus
    },
    {
      name: 'Tall Deploy: Chevron',
      description: 'Wider button with chevron-shaped border and stacked arrow indicators pointing down.',
      component: TallDeployVariationB
    },
    {
      name: 'Tall Deploy: Duration',
      description: 'Compact vertical layout showing duration at top with down arrow and vertical DEPLOY text.',
      component: TallDeployVariationC
    },
    {
      name: 'Tall Deploy: Arrow Shape',
      description: 'Button itself shaped like a downward arrow. Most visually integrated design.',
      component: TallDeployVariationD
    },
    {
      name: 'Asymmetric + Duration A',
      description: 'Duration displayed above deploy button in separate card. Clear separation.',
      component: AsymmetricFocusDurationA
    },
    {
      name: 'Asymmetric + Duration B',
      description: 'Duration integrated as header bar inside deploy button. Compact design.',
      component: AsymmetricFocusDurationB
    },
    {
      name: 'Asymmetric + Duration C',
      description: 'Duration shown as military badge in top-right corner. Sleek tactical look.',
      component: AsymmetricFocusDurationC
    },
    {
      name: 'Asymmetric + Duration D',
      description: 'Duration in full-width info panel above. Emphasizes mission time.',
      component: AsymmetricFocusDurationD
    },
    {
      name: 'Font 1: Roboto Mono',
      description: 'Clean, modern monospace font. Great for numbers and data.',
      component: AsymmetricDuration_Font1
    },
    {
      name: 'Font 2: Inter',
      description: 'Highly legible sans-serif. Optimized for digital readability.',
      component: AsymmetricDuration_Font2
    },
    {
      name: 'Font 3: System Default',
      description: 'Native system font. Most familiar and instantly readable.',
      component: AsymmetricDuration_Font3
    },
    {
      name: 'Font 4: Space Grotesk',
      description: 'Modern geometric font. Stylish while maintaining clarity.',
      component: AsymmetricDuration_Font4
    },
    {
      name: 'Font 5: JetBrains Mono',
      description: 'Developer-focused monospace. Excellent character distinction.',
      component: AsymmetricDuration_Font5
    }
  ];

  const CurrentVariation = variations[selectedVariation - 1].component;

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-black text-yellow-500 uppercase tracking-[0.3em] mb-2"
            style={{ fontFamily: 'Orbitron, monospace' }}>
          Mission Control Design Variations
        </h1>
        <p className="text-gray-400 text-sm">
          17 total layouts: 8 base designs + 4 duration variations + 5 font options for numbers
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex gap-8 items-center">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Node Type</label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as any)}
              className="bg-black border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded text-sm"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <option value="normal">Normal</option>
              <option value="event">Event</option>
              <option value="boss">Boss</option>
              <option value="final_boss">Final Boss</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Deploy State</label>
            <button
              onClick={() => setCanDeploy(!canDeploy)}
              className={`px-4 py-1 rounded text-sm font-bold transition-colors ${
                canDeploy
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : 'bg-red-500/20 border border-red-500 text-red-400'
              }`}
            >
              {canDeploy ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Current Rewards</label>
            <div className="flex gap-4 text-xs">
              <span className="text-yellow-400">GOLD: {rewards.gold}</span>
              <span className={rewards.essence ? 'text-purple-400' : 'text-gray-600'}>
                ESSENCE: {rewards.essence || '---'}
              </span>
              <span className={rewards.chipT1 ? 'text-cyan-400' : 'text-gray-600'}>
                CHIP T1: {rewards.chipT1 || '---'}
              </span>
              <span className={rewards.special ? 'text-green-400' : 'text-gray-600'}>
                SPECIAL: {rewards.special || '---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Variation Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-3 gap-2">
          {variations.map((variation, index) => (
            <button
              key={index}
              onClick={() => setSelectedVariation(index + 1)}
              className={`
                p-3 border-2 rounded-sm transition-all duration-200
                ${selectedVariation === index + 1
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                  : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'}
              `}
            >
              <div className="font-bold text-sm uppercase tracking-wider mb-1"
                   style={{ fontFamily: 'Orbitron, monospace' }}>
                {index + 1}. {variation.name}
              </div>
              <div className="text-xs opacity-70 normal-case tracking-normal">
                {variation.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Display Area */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          {/* Left - Current Variation Display */}
          <div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-4">
                VARIATION {selectedVariation}: {variations[selectedVariation - 1].name.toUpperCase()}
              </div>

              {/* Mission Control Container (matching story-climb dimensions) */}
              <div className="bg-black/90 border-2 border-yellow-500/50 rounded-lg shadow-2xl overflow-hidden"
                   style={{ width: '503px' }}>
                <div className="bg-gradient-to-b from-yellow-500/20 to-transparent px-4 py-3 border-b border-yellow-500/30">
                  <h3 className="text-yellow-500 font-black uppercase tracking-[0.2em] text-sm"
                      style={{ fontFamily: 'Orbitron, monospace' }}>
                    MISSION CONTROL
                  </h3>
                </div>
                <div className="p-4">
                  <CurrentVariation
                    rewards={rewards}
                    onDeploy={() => console.log('Deploy clicked!')}
                    canDeploy={canDeploy}
                    nodeType={nodeType}
                    duration="5h"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right - All Variations Quick View */}
          <div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-4">
                ALL VARIATIONS PREVIEW
              </div>

              <div className="space-y-4">
                {variations.map((variation, index) => {
                  const VariationComponent = variation.component;
                  return (
                    <div
                      key={index}
                      className={`
                        bg-black/60 border rounded-lg p-3 transition-all duration-200 cursor-pointer
                        ${selectedVariation === index + 1
                          ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                          : 'border-gray-700/50 hover:border-gray-600'}
                      `}
                      onClick={() => setSelectedVariation(index + 1)}
                    >
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        {index + 1}. {variation.name}
                      </div>
                      <div className="transform scale-75 origin-top-left" style={{ width: '133%' }}>
                        <VariationComponent
                          rewards={rewards}
                          onDeploy={() => {}}
                          canDeploy={canDeploy}
                          nodeType={nodeType}
                          duration="5h"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Design Notes */}
      <div className="max-w-7xl mx-auto mt-12 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider mb-4"
            style={{ fontFamily: 'Orbitron, monospace' }}>
          Design Rationale
        </h2>
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-400">
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">Visual Hierarchy Principles</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Gold always receives primary emphasis (main resource)</li>
              <li>Active resources use color coding (purple/cyan/green)</li>
              <li>Inactive resources fade to gray to reduce noise</li>
              <li>Deploy button scales with importance in each layout</li>
            </ul>
          </div>
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">Industrial Design Elements</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Sharp corners and minimal border radius</li>
              <li>Yellow/gold accents for primary actions</li>
              <li>Gradient overlays for depth without skeuomorphism</li>
              <li>Orbitron font for technical/military aesthetic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}