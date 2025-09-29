'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventNodeEditor from './EventNodeEditor';
import NormalMekRewards from './NormalMekRewards';
import MiniBossFinalBossRewards from './MiniBossFinalBossRewards';
import NodeFeeConfig from './NodeFeeConfig';

interface ChapterConfig {
  chapter: number;
  normalMekRange: [number, number];
  challengerRange: [number, number];
  miniBossRange: [number, number];
  finalBossRank: number;
  eventCount: number;
}

interface MekSlotsConfig {
  normalMeks: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
  challengers: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
  miniBosses: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
  finalBosses: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
  events: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
}

interface StoryClimbConfigProps {
  activeSection?: string;
}

export default function StoryClimbConfig({ activeSection }: StoryClimbConfigProps = {}) {
  const router = useRouter();
  const [seedType, setSeedType] = useState<'wallet' | 'custom'>('wallet');
  const [customSeed, setCustomSeed] = useState('1');
  const [selectedChapter, setSelectedChapter] = useState(1);

  // Map activeSection to internal section names
  const sectionMap: Record<string, keyof typeof sectionsCollapsed> = {
    'normal-mek-distribution': 'algorithm',
    'chapter-rarity': 'chapters',
    'mek-slots': 'mekSlots',
    'node-fee': 'nodeFees',
    'event-node': 'events',
    'boss-rewards': 'miniBossFinalBoss',
    'normal-rewards': 'normalMeks'
  };

  const targetSection = activeSection ? sectionMap[activeSection] : null;

  // Collapsible sections state - expand only the active section
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    overview: targetSection !== 'overview',
    algorithm: targetSection !== 'algorithm',
    chapters: targetSection !== 'chapters',
    seed: targetSection !== 'seed',
    nodeFees: targetSection !== 'nodeFees',
    events: targetSection !== 'events',
    normalMeks: targetSection !== 'normalMeks',
    mekSlots: targetSection !== 'mekSlots',
    miniBossFinalBoss: targetSection !== 'miniBossFinalBoss'
  });

  // Mek Slots configuration
  const [mekSlotsConfig, setMekSlotsConfig] = useState<MekSlotsConfig>({
    normalMeks: {
      easy: { min: 1, max: 2 },
      medium: { min: 3, max: 6 },
      hard: { min: 7, max: 8 }
    },
    challengers: {
      easy: { min: 2, max: 3 },
      medium: { min: 4, max: 6 },
      hard: { min: 7, max: 8 }
    },
    miniBosses: {
      easy: { min: 3, max: 4 },
      medium: { min: 5, max: 6 },
      hard: { min: 7, max: 8 }
    },
    finalBosses: {
      easy: { min: 4, max: 4 },
      medium: { min: 6, max: 6 },
      hard: { min: 8, max: 8 }
    },
    events: {
      easy: { min: 2, max: 3 },
      medium: { min: 4, max: 6 },
      hard: { min: 7, max: 8 }
    }
  });

  const toggleSection = (section: string) => {
    setSectionsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to check if a section should be rendered
  const shouldRenderSection = (section: keyof typeof sectionsCollapsed) => {
    // If no activeSection is specified, render all sections
    if (!targetSection) return true;
    // Otherwise, only render the target section
    return section === targetSection;
  };

  // Define the chapter configurations based on the documentation
  const chapterConfigs: ChapterConfig[] = [
    { chapter: 1, normalMekRange: [3651, 4000], challengerRange: [461, 500], miniBossRange: [92, 100], finalBossRank: 10, eventCount: 20 },
    { chapter: 2, normalMekRange: [3301, 3650], challengerRange: [421, 460], miniBossRange: [83, 91], finalBossRank: 9, eventCount: 20 },
    { chapter: 3, normalMekRange: [2951, 3300], challengerRange: [381, 420], miniBossRange: [74, 82], finalBossRank: 8, eventCount: 20 },
    { chapter: 4, normalMekRange: [2601, 2950], challengerRange: [341, 380], miniBossRange: [65, 73], finalBossRank: 7, eventCount: 20 },
    { chapter: 5, normalMekRange: [2251, 2600], challengerRange: [301, 340], miniBossRange: [56, 64], finalBossRank: 6, eventCount: 20 },
    { chapter: 6, normalMekRange: [1901, 2250], challengerRange: [261, 300], miniBossRange: [47, 55], finalBossRank: 5, eventCount: 20 },
    { chapter: 7, normalMekRange: [1551, 1900], challengerRange: [221, 260], miniBossRange: [38, 46], finalBossRank: 4, eventCount: 20 },
    { chapter: 8, normalMekRange: [1201, 1550], challengerRange: [181, 220], miniBossRange: [29, 37], finalBossRank: 3, eventCount: 20 },
    { chapter: 9, normalMekRange: [851, 1200], challengerRange: [141, 180], miniBossRange: [20, 28], finalBossRank: 2, eventCount: 20 },
    { chapter: 10, normalMekRange: [501, 850], challengerRange: [101, 140], miniBossRange: [11, 19], finalBossRank: 1, eventCount: 20 },
  ];

  const handleGeneratePreview = () => {
    const seed = seedType === 'wallet' ? 'wallet_address_here' : customSeed;
    console.log('Generating preview with seed:', seed);

    // Navigate to Story Climb page in preview mode
    const params = new URLSearchParams({
      preview: 'true',
      seed: seed,
      chapter: selectedChapter.toString()
    });

    // Open in new tab for easy comparison
    window.open(`/scrap-yard/story-climb?${params.toString()}`, '_blank');
  };

  // Calculate slot distribution for a node type
  const calculateSlotDistribution = (nodeType: string, difficulty: 'easy' | 'medium' | 'hard', totalNodes: number) => {
    const config = mekSlotsConfig[nodeType as keyof MekSlotsConfig][difficulty];
    const slotOptions = config.max - config.min + 1;

    if (slotOptions === 1) {
      return `All nodes: ${config.min} slots`;
    } else if (slotOptions === 2) {
      const midpoint = Math.floor(totalNodes / 2);
      return `Top ${midpoint} (rarer): ${config.max} slots, Bottom ${totalNodes - midpoint}: ${config.min} slots`;
    } else {
      const groupSize = Math.floor(totalNodes / slotOptions);
      const distributions = [];
      for (let i = 0; i < slotOptions; i++) {
        const slots = config.min + i;
        const start = i * groupSize + 1;
        const end = i === slotOptions - 1 ? totalNodes : (i + 1) * groupSize;
        distributions.push(`Group ${i + 1} (${start}-${end}): ${slots} slots`);
      }
      return distributions.join(', ');
    }
  };

  return (
    <div className="space-y-6">

      {/* Mek Distribution Algorithm Info - Collapsible */}
      {shouldRenderSection('algorithm') && (
      <div className="bg-gradient-to-br from-purple-900/20 via-black/50 to-blue-900/20 rounded-lg p-4 border border-purple-500/30">
        <button
          onClick={() => toggleSection('algorithm')}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <span>{sectionsCollapsed.algorithm ? '▶' : '▼'}</span>
            <span className="text-lg">🎲</span>
            Normal Mek Distribution Algorithm
          </h4>
        </button>

        {!sectionsCollapsed.algorithm && (
          <div className="mt-3 space-y-3 text-xs">
            <div className="bg-black/30 rounded p-3">
              <h5 className="text-yellow-300 font-semibold mb-2">Core Concept: Gentle Rarity Gradient with Anomalies</h5>
              <p className="text-gray-400 leading-relaxed">
                The 350 normal meks per chapter are distributed with a <span className="text-cyan-400">subtle upward trend</span> in rarity,
                appearing mostly random at first glance but statistically favoring more rare meks toward the top of the tree.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded p-3">
                <h5 className="text-green-400 font-semibold mb-1">Base Distribution (70%)</h5>
                <div className="text-gray-400 space-y-1">
                  <div>• <span className="text-gray-300">Bottom 30%:</span> 80% common, 20% rare</div>
                  <div>• <span className="text-gray-300">Middle 40%:</span> 60% common, 40% rare</div>
                  <div>• <span className="text-gray-300">Top 30%:</span> 40% common, 60% rare</div>
                </div>
              </div>

              <div className="bg-black/30 rounded p-3">
                <h5 className="text-orange-400 font-semibold mb-1">Anomaly Layer (30%)</h5>
                <div className="text-gray-400 space-y-1">
                  <div>• <span className="text-yellow-300">Random spikes:</span> Ultra-rare at bottom</div>
                  <div>• <span className="text-blue-300">Valleys:</span> Common clusters at top</div>
                  <div>• <span className="text-purple-300">Chaos zones:</span> Completely random sections</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Chapter Rarity Breakdown - Collapsible */}
      {shouldRenderSection('chapters') && (
      <div className="bg-gray-800/30 rounded-lg p-4">
        <button
          onClick={() => toggleSection('chapters')}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="text-sm font-bold text-yellow-500/80 flex items-center gap-2">
            <span>{sectionsCollapsed.chapters ? '▶' : '▼'}</span>
            Chapter Rarity Distribution
          </h4>
        </button>

        {!sectionsCollapsed.chapters && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Ch</th>
                  <th className="text-left py-2">Normal Meks</th>
                  <th className="text-left py-2">Challengers</th>
                  <th className="text-left py-2">Mini-Bosses</th>
                  <th className="text-left py-2">Final Boss</th>
                </tr>
              </thead>
              <tbody>
                {chapterConfigs.map((config) => (
                  <tr key={config.chapter} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="py-2 font-bold text-yellow-500">{config.chapter}</td>
                    <td className="py-2 text-gray-300">
                      {config.normalMekRange[0]}-{config.normalMekRange[1]}
                    </td>
                    <td className="py-2 text-orange-400">
                      {config.challengerRange[0]}-{config.challengerRange[1]}
                    </td>
                    <td className="py-2 text-red-400">
                      {config.miniBossRange[0]}-{config.miniBossRange[1]}
                    </td>
                    <td className="py-2 text-yellow-400">Rank {config.finalBossRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}


      {/* Mek Slots Configuration - New Section */}
      {shouldRenderSection('mekSlots') && (
      <div className="bg-gradient-to-br from-green-900/20 via-black/50 to-cyan-900/20 rounded-lg p-4 border border-green-500/30">
        <button
          onClick={() => toggleSection('mekSlots')}
          className="w-full flex items-center justify-between text-left mb-3"
        >
          <h4 className="text-sm font-bold text-green-400 flex items-center gap-2">
            <span>{sectionsCollapsed.mekSlots ? '▶' : '▼'}</span>
            <span className="text-lg">🎰</span>
            Mek Slots Configuration
          </h4>
        </button>

        {!sectionsCollapsed.mekSlots && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 mb-4">
              Configure how many mek slots each node type has based on difficulty. Higher rarity nodes get more slots.
            </p>

            {/* Normal Meks Slots */}
            <div className="bg-black/30 rounded p-3">
              <h5 className="text-yellow-400 text-sm font-bold mb-2">Normal Meks (350 per chapter)</h5>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-gray-400">Easy Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.normalMeks.easy.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          easy: { ...prev.normalMeks.easy, min: parseInt(e.target.value) || 1 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.normalMeks.easy.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          easy: { ...prev.normalMeks.easy, max: parseInt(e.target.value) || 2 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('normalMeks', 'easy', 350)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Medium Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.normalMeks.medium.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          medium: { ...prev.normalMeks.medium, min: parseInt(e.target.value) || 3 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.normalMeks.medium.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          medium: { ...prev.normalMeks.medium, max: parseInt(e.target.value) || 6 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('normalMeks', 'medium', 350)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Hard Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.normalMeks.hard.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          hard: { ...prev.normalMeks.hard, min: parseInt(e.target.value) || 7 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.normalMeks.hard.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        normalMeks: {
                          ...prev.normalMeks,
                          hard: { ...prev.normalMeks.hard, max: parseInt(e.target.value) || 8 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('normalMeks', 'hard', 350)}
                  </div>
                </div>
              </div>
            </div>

            {/* Challengers Slots */}
            <div className="bg-black/30 rounded p-3">
              <h5 className="text-orange-400 text-sm font-bold mb-2">Challengers (40 per chapter)</h5>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-gray-400">Easy Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.challengers.easy.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          easy: { ...prev.challengers.easy, min: parseInt(e.target.value) || 2 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.challengers.easy.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          easy: { ...prev.challengers.easy, max: parseInt(e.target.value) || 3 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('challengers', 'easy', 40)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Medium Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.challengers.medium.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          medium: { ...prev.challengers.medium, min: parseInt(e.target.value) || 4 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.challengers.medium.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          medium: { ...prev.challengers.medium, max: parseInt(e.target.value) || 7 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('challengers', 'medium', 40)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Hard Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.challengers.hard.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          hard: { ...prev.challengers.hard, min: parseInt(e.target.value) || 8 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.challengers.hard.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        challengers: {
                          ...prev.challengers,
                          hard: { ...prev.challengers.hard, max: parseInt(e.target.value) || 10 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('challengers', 'hard', 40)}
                  </div>
                </div>
              </div>
            </div>

            {/* Mini-Bosses and Final Bosses Slots */}
            <div className="bg-black/30 rounded p-3">
              <h5 className="text-red-400 text-sm font-bold mb-3">Mini-Bosses and Final Bosses (9 + 1 per chapter)</h5>

              {/* Mini-Bosses Section */}
              <div className="mb-4">
                <h6 className="text-orange-400 text-xs font-semibold mb-2">Mini-Bosses (9 per chapter)</h6>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400">Easy Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={mekSlotsConfig.miniBosses.easy.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            easy: { ...prev.miniBosses.easy, min: parseInt(e.target.value) || 3 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={mekSlotsConfig.miniBosses.easy.max}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            easy: { ...prev.miniBosses.easy, max: parseInt(e.target.value) || 4 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {calculateSlotDistribution('miniBosses', 'easy', 9)}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Medium Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={mekSlotsConfig.miniBosses.medium.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            medium: { ...prev.miniBosses.medium, min: parseInt(e.target.value) || 5 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={mekSlotsConfig.miniBosses.medium.max}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            medium: { ...prev.miniBosses.medium, max: parseInt(e.target.value) || 8 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {calculateSlotDistribution('miniBosses', 'medium', 9)}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Hard Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={mekSlotsConfig.miniBosses.hard.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            hard: { ...prev.miniBosses.hard, min: parseInt(e.target.value) || 9 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={mekSlotsConfig.miniBosses.hard.max}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          miniBosses: {
                            ...prev.miniBosses,
                            hard: { ...prev.miniBosses.hard, max: parseInt(e.target.value) || 12 }
                          }
                        }))}
                        className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {calculateSlotDistribution('miniBosses', 'hard', 9)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Bosses Section */}
              <div className="border-t border-gray-700/50 pt-3">
                <h6 className="text-yellow-500 text-xs font-semibold mb-2">Final Bosses (1 per chapter)</h6>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400">Easy Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={mekSlotsConfig.finalBosses.easy.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          finalBosses: {
                            ...prev.finalBosses,
                            easy: { ...prev.finalBosses.easy, min: parseInt(e.target.value) || 5, max: parseInt(e.target.value) || 5 }
                          }
                        }))}
                        className="w-20 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                      />
                      <span className="text-gray-400">slots</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Medium Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={mekSlotsConfig.finalBosses.medium.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          finalBosses: {
                            ...prev.finalBosses,
                            medium: { ...prev.finalBosses.medium, min: parseInt(e.target.value) || 10, max: parseInt(e.target.value) || 10 }
                          }
                        }))}
                        className="w-20 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                      />
                      <span className="text-gray-400">slots</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Hard Mode</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={mekSlotsConfig.finalBosses.hard.min}
                        onChange={(e) => setMekSlotsConfig(prev => ({
                          ...prev,
                          finalBosses: {
                            ...prev.finalBosses,
                            hard: { ...prev.finalBosses.hard, min: parseInt(e.target.value) || 15, max: parseInt(e.target.value) || 15 }
                          }
                        }))}
                        className="w-20 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                      />
                      <span className="text-gray-400">slots</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Slots */}
            <div className="bg-black/30 rounded p-3">
              <h5 className="text-purple-400 text-sm font-bold mb-2">Events (20 per chapter)</h5>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-gray-400">Easy Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.events.easy.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          easy: { ...prev.events.easy, min: parseInt(e.target.value) || 1 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mekSlotsConfig.events.easy.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          easy: { ...prev.events.easy, max: parseInt(e.target.value) || 3 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('events', 'easy', 20)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Medium Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.events.medium.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          medium: { ...prev.events.medium, min: parseInt(e.target.value) || 2 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={mekSlotsConfig.events.medium.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          medium: { ...prev.events.medium, max: parseInt(e.target.value) || 5 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('events', 'medium', 20)}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400">Hard Mode</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.events.hard.min}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          hard: { ...prev.events.hard, min: parseInt(e.target.value) || 4 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={mekSlotsConfig.events.hard.max}
                      onChange={(e) => setMekSlotsConfig(prev => ({
                        ...prev,
                        events: {
                          ...prev.events,
                          hard: { ...prev.events.hard, max: parseInt(e.target.value) || 8 }
                        }
                      }))}
                      className="w-16 px-2 py-1 bg-black/50 border border-red-400/30 rounded text-red-400"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {calculateSlotDistribution('events', 'hard', 20)}
                  </div>
                </div>
              </div>
            </div>

            {/* Save/Deploy Button */}
            <div className="flex justify-end mt-4">
              <button
                className="mek-button-primary"
                onClick={() => {
                  localStorage.setItem('mekSlotsConfig', JSON.stringify(mekSlotsConfig));
                  alert('Mek Slots configuration saved!');
                }}
              >
                Save Mek Slots Configuration
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Node Fee Configuration - Collapsible */}
      {shouldRenderSection('nodeFees') && (
      <div className="bg-gray-800/30 rounded-lg p-4">
        <button
          onClick={() => toggleSection('nodeFees')}
          className="w-full flex items-center justify-between text-left mb-3"
        >
          <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <span>{sectionsCollapsed.nodeFees ? '▶' : '▼'}</span>
            <span className="text-lg">💰</span>
            Node Fee Configuration (All Node Types)
          </h4>
        </button>
        {!sectionsCollapsed.nodeFees && <NodeFeeConfig />}
      </div>
      )}

      {/* Event Node Editor with integrated chip rewards - Collapsible */}
      {shouldRenderSection('events') && (
      <div className="bg-gray-800/30 rounded-lg p-4">
        <button
          onClick={() => toggleSection('events')}
          className="w-full flex items-center justify-between text-left mb-3"
        >
          <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <span>{sectionsCollapsed.events ? '▶' : '▼'}</span>
            Event Node Configuration
          </h4>
        </button>
        {!sectionsCollapsed.events && <EventNodeEditor />}
      </div>
      )}

      {/* Mini Boss and Final Boss Rewards Configuration - Collapsible */}
      {shouldRenderSection('miniBossFinalBoss') && (
      <div className="bg-gray-800/30 rounded-lg p-4">
        <button
          onClick={() => toggleSection('miniBossFinalBoss')}
          className="w-full flex items-center justify-between text-left mb-3"
        >
          <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <span>{sectionsCollapsed.miniBossFinalBoss ? '▶' : '▼'}</span>
            Mini Boss and Final Boss Rewards
          </h4>
        </button>
        {!sectionsCollapsed.miniBossFinalBoss && (
          <MiniBossFinalBossRewards />
        )}
      </div>
      )}

      {/* Normal Mek Node Rewards - Collapsible */}
      {shouldRenderSection('normalMeks') && (
      <div className="bg-gray-800/30 rounded-lg p-4">
        <button
          onClick={() => toggleSection('normalMeks')}
          className="w-full flex items-center justify-between text-left mb-3"
        >
          <h4 className="text-sm font-bold text-yellow-500/80 flex items-center gap-2">
            <span>{sectionsCollapsed.normalMeks ? '▶' : '▼'}</span>
            Normal Mek Node Rewards
          </h4>
        </button>
        {!sectionsCollapsed.normalMeks && <NormalMekRewards mekSlotsConfig={mekSlotsConfig.normalMeks} />}
      </div>
      )}
    </div>
  );
}