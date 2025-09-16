'use client';

import React, { useState } from 'react';
import EventNodeEditor from './EventNodeEditor';
import NormalMekRewards from './NormalMekRewards';
import MekChapterDistributionActual from './MekChapterDistributionActual';

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
    // This would call the actual generation logic
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-500">4,200</div>
          <div className="text-sm text-gray-400">Total Nodes</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-400">4,000</div>
          <div className="text-sm text-gray-400">Unique Mechanisms</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">10</div>
          <div className="text-sm text-gray-400">Chapters</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-400">420</div>
          <div className="text-sm text-gray-400">Nodes per Chapter</div>
        </div>
      </div>

      {/* Node Distribution */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Node Distribution per Chapter</h4>
        <div className="grid grid-cols-5 gap-3 text-xs">
          <div className="bg-black/30 rounded p-2">
            <div className="text-lg font-bold text-gray-300">350</div>
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


      {/* Mek Chapter Distribution */}
      <MekChapterDistributionActual />

      {/* Normal Mek Node Rewards */}
      <NormalMekRewards />

      {/* Event Node Editor */}
      <EventNodeEditor />
    </div>
  );
}