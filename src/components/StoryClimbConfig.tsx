'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventNodeEditor from './EventNodeEditor';
import NormalMekRewards from './NormalMekRewards';
import PreviewTreeModal from './PreviewTreeModal';

interface ChapterConfig {
  chapter: number;
  normalMekRange: [number, number];
  challengerRange: [number, number];
  miniBossRange: [number, number];
  finalBossRank: number;
  eventCount: number;
}

export default function StoryClimbConfig() {
  const router = useRouter();
  const [seedType, setSeedType] = useState<'wallet' | 'custom'>('wallet');
  const [customSeed, setCustomSeed] = useState('1');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);

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

      {/* Mek Distribution Algorithm Info */}
      <div className="bg-gradient-to-br from-purple-900/20 via-black/50 to-blue-900/20 rounded-lg p-4 border border-purple-500/30">
        <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
          <span className="text-lg">🎲</span>
          Normal Mek Distribution Algorithm
        </h4>

        <div className="space-y-3 text-xs">
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

          <div className="bg-black/30 rounded p-3">
            <h5 className="text-blue-400 font-semibold mb-2">Implementation Details</h5>
            <div className="font-mono text-[10px] text-gray-500 bg-black/50 p-2 rounded">
              <div>function distributeMeks(chapter, position) {'{'}</div>
              <div className="ml-2">// Base weight: position 0-1 (bottom to top)</div>
              <div className="ml-2">baseWeight = position * 0.4 + 0.3;</div>
              <div className="ml-2"></div>
              <div className="ml-2">// Anomaly chance (30%)</div>
              <div className="ml-2">if (random() {'<'} 0.3) {'{'}</div>
              <div className="ml-4">// Spike (10%): Very rare at unexpected position</div>
              <div className="ml-4">// Valley (10%): Common cluster at high position</div>
              <div className="ml-4">// Chaos (10%): Pure random selection</div>
              <div className="ml-2">{'}'}</div>
              <div className="ml-2"></div>
              <div className="ml-2">// Apply gentle curve (not too obvious)</div>
              <div className="ml-2">finalWeight = smoothCurve(baseWeight, 0.3);</div>
              <div className="ml-2">return selectMekByWeight(finalWeight);</div>
              <div>{'}'}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-gradient-to-t from-green-500/20 to-red-500/20 rounded p-2">
              <div className="text-center text-[10px] text-gray-400">Visual Gradient</div>
              <div className="text-center mt-1">
                <span className="text-red-400 text-xs">↑ Rare</span>
                <div className="text-gray-500 text-[10px] my-1">Gentle Trend</div>
                <span className="text-green-400 text-xs">↓ Common</span>
              </div>
            </div>
            <div className="flex-1 bg-black/30 rounded p-2">
              <div className="text-center text-[10px] text-gray-400">Player Experience</div>
              <div className="text-gray-300 text-[10px] mt-1 space-y-1">
                <div>✓ Feels random</div>
                <div>✓ Exciting anomalies</div>
                <div>✓ Subtle progression</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
            <p className="text-yellow-400 text-[10px] leading-relaxed">
              <strong>Design Goal:</strong> Players should feel the distribution is random with lucky/unlucky streaks,
              but statistically they encounter slightly better meks as they progress upward, creating a subtle sense of accomplishment
              without making it feel predetermined or predictable.
            </p>
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
              placeholder="Enter custom seed (e.g., 1)"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded text-sm text-gray-300"
            />
          )}

          {/* Chapter Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300">Preview Chapter:</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
              className="px-3 py-2 bg-black/50 border border-gray-700 rounded text-sm text-gray-300"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGeneratePreview}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded text-sm transition-colors"
            >
              Open Preview in Story Climb
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded text-sm transition-colors"
            >
              Quick Preview (Modal)
            </button>
          </div>
        </div>
      </div>


      {/* Event Node Editor with integrated chip rewards */}
      <EventNodeEditor />

      {/* Normal Mek Node Rewards */}
      <NormalMekRewards />

      {/* Preview Tree Modal */}
      <PreviewTreeModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        seed={seedType === 'wallet' ? 'wallet_address_here' : customSeed}
        chapter={selectedChapter}
      />
    </div>
  );
}