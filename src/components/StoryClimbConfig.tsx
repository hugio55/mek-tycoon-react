'use client';

import React, { useState } from 'react';

interface ChapterConfig {
  chapter: number;
  normalMekRange: [number, number];
  challengerRange: [number, number];
  miniBossRange: [number, number];
  finalBossRank: number;
  eventCount: number;
}

export default function StoryClimbConfig() {
  const [seedType, setSeedType] = useState<'wallet' | 'custom'>('wallet');
  const [customSeed, setCustomSeed] = useState('');

  // Define the chapter configurations based on the documentation
  const chapterConfigs: ChapterConfig[] = [
    { chapter: 1, normalMekRange: [3471, 3800], challengerRange: [461, 500], miniBossRange: [92, 100], finalBossRank: 10, eventCount: 20 },
    { chapter: 2, normalMekRange: [3141, 3470], challengerRange: [421, 460], miniBossRange: [83, 91], finalBossRank: 9, eventCount: 20 },
    { chapter: 3, normalMekRange: [2811, 3140], challengerRange: [381, 420], miniBossRange: [74, 82], finalBossRank: 8, eventCount: 20 },
    { chapter: 4, normalMekRange: [2481, 2810], challengerRange: [341, 380], miniBossRange: [65, 73], finalBossRank: 7, eventCount: 20 },
    { chapter: 5, normalMekRange: [2151, 2480], challengerRange: [301, 340], miniBossRange: [56, 64], finalBossRank: 6, eventCount: 20 },
    { chapter: 6, normalMekRange: [1821, 2150], challengerRange: [261, 300], miniBossRange: [47, 55], finalBossRank: 5, eventCount: 20 },
    { chapter: 7, normalMekRange: [1491, 1820], challengerRange: [221, 260], miniBossRange: [38, 46], finalBossRank: 4, eventCount: 20 },
    { chapter: 8, normalMekRange: [1161, 1490], challengerRange: [181, 220], miniBossRange: [29, 37], finalBossRank: 3, eventCount: 20 },
    { chapter: 9, normalMekRange: [831, 1160], challengerRange: [141, 180], miniBossRange: [20, 28], finalBossRank: 2, eventCount: 20 },
    { chapter: 10, normalMekRange: [501, 830], challengerRange: [101, 140], miniBossRange: [11, 19], finalBossRank: 1, eventCount: 20 },
  ];

  const handleGeneratePreview = () => {
    const seed = seedType === 'wallet' ? 'wallet_address_here' : customSeed;
    console.log('Generating preview with seed:', seed);
    // This would call the actual generation logic
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-500">4,000</div>
          <div className="text-sm text-gray-400">Total Nodes</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-400">3,800</div>
          <div className="text-sm text-gray-400">Unique Mechanisms</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">10</div>
          <div className="text-sm text-gray-400">Chapters</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-400">400</div>
          <div className="text-sm text-gray-400">Nodes per Chapter</div>
        </div>
      </div>

      {/* Node Distribution */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Node Distribution per Chapter</h4>
        <div className="grid grid-cols-5 gap-3 text-xs">
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-gray-300">330</div>
            <div className="text-gray-500">Normal Meks</div>
          </div>
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-orange-400">40</div>
            <div className="text-gray-500">Challengers</div>
          </div>
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-purple-400">20</div>
            <div className="text-gray-500">Events</div>
          </div>
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-red-400">9</div>
            <div className="text-gray-500">Mini-Bosses</div>
          </div>
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-yellow-500">1</div>
            <div className="text-gray-500">Final Boss</div>
          </div>
        </div>
      </div>

      {/* Chapter Rarity Breakdown */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Chapter Rarity Distribution</h4>
        <div className="overflow-x-auto">
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
      </div>

      {/* Seed Configuration */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Tree Generation Seed</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="wallet"
                checked={seedType === 'wallet'}
                onChange={(e) => setSeedType('wallet')}
                className="text-yellow-500"
              />
              <span className="text-sm text-gray-300">Use Wallet Address</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="custom"
                checked={seedType === 'custom'}
                onChange={(e) => setSeedType('custom')}
                className="text-yellow-500"
              />
              <span className="text-sm text-gray-300">Custom Seed</span>
            </label>
          </div>
          {seedType === 'custom' && (
            <input
              type="text"
              value={customSeed}
              onChange={(e) => setCustomSeed(e.target.value)}
              placeholder="Enter custom seed..."
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded text-sm text-gray-300"
            />
          )}
          <button
            onClick={handleGeneratePreview}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded text-sm transition-colors"
          >
            Generate Preview Tree
          </button>
        </div>
      </div>

      {/* Key Rules */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500 mb-2">Key Generation Rules</h4>
        <ul className="text-xs text-yellow-500/80 space-y-1">
          <li>• Rarer mechanisms appear in later chapters (Chapter 10 = rarest)</li>
          <li>• Within each chapter, node placement is randomized</li>
          <li>• Each wallet generates a unique, deterministic tree</li>
          <li>• Total of 3,800 unique mechanisms distributed across all nodes</li>
          <li>• Events are separate from mechanism ranks</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors">
          View Documentation
        </button>
        <button className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors">
          Test Generation Algorithm
        </button>
        <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded transition-colors">
          Export Configuration
        </button>
      </div>
    </div>
  );
}