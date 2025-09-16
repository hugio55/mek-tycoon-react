'use client';

import React, { useState, useEffect } from 'react';
import mekRarityMaster from '../../convex/mekRarityMaster.json';

interface MekData {
  rank: number;
  assetId: string;
  sourceKey: string;
  head: string;
  body: string;
  trait: string;
}

interface VariationCount {
  name: string;
  count: number;
  percentage: number;
  type: 'head' | 'body' | 'trait';
}

interface ChapterDistribution {
  chapter: number;
  totalMeks: number;
  headVariations: VariationCount[];
  bodyVariations: VariationCount[];
  traitVariations: VariationCount[];
  allVariationsSorted: VariationCount[]; // Combined list sorted by abundance
  eventEssenceDistribution: Array<{
    eventNumber: number;
    essences: VariationCount[];
  }>;
}

// Round-robin distribution table from the documentation
// Using the 80 LEAST abundant variations (sorted most to least, so we take from the end)
const ROUND_ROBIN_TABLE = [
  [1, 21, 41, 61], // Event 1
  [2, 22, 42, 62], // Event 2
  [3, 23, 43, 63], // Event 3
  [4, 24, 44, 64], // Event 4
  [5, 25, 45, 65], // Event 5
  [6, 26, 46, 66], // Event 6
  [7, 27, 47, 67], // Event 7
  [8, 28, 48, 68], // Event 8
  [9, 29, 49, 69], // Event 9
  [10, 30, 50, 70], // Event 10
  [11, 31, 51, 71], // Event 11
  [12, 32, 52, 72], // Event 12
  [13, 33, 53, 73], // Event 13
  [14, 34, 54, 74], // Event 14
  [15, 35, 55, 75], // Event 15
  [16, 36, 56, 76], // Event 16
  [17, 37, 57, 77], // Event 17
  [18, 38, 58, 78], // Event 18
  [19, 39, 59, 79], // Event 19
  [20, 40, 60, 80], // Event 20
];

export default function MekChapterDistributionActual() {
  const [distributions, setDistributions] = useState<ChapterDistribution[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    // Type assertion for the imported JSON
    const meks = mekRarityMaster as MekData[];

    // Define chapter ranges - each chapter gets exactly 400 meks
    const chapterRanges = [
      { chapter: 1, normal: [3651, 4000], challenger: [461, 500], miniBoss: [92, 100], boss: 10 },
      { chapter: 2, normal: [3301, 3650], challenger: [421, 460], miniBoss: [83, 91], boss: 9 },
      { chapter: 3, normal: [2951, 3300], challenger: [381, 420], miniBoss: [74, 82], boss: 8 },
      { chapter: 4, normal: [2601, 2950], challenger: [341, 380], miniBoss: [65, 73], boss: 7 },
      { chapter: 5, normal: [2251, 2600], challenger: [301, 340], miniBoss: [56, 64], boss: 6 },
      { chapter: 6, normal: [1901, 2250], challenger: [261, 300], miniBoss: [47, 55], boss: 5 },
      { chapter: 7, normal: [1551, 1900], challenger: [221, 260], miniBoss: [38, 46], boss: 4 },
      { chapter: 8, normal: [1201, 1550], challenger: [181, 220], miniBoss: [29, 37], boss: 3 },
      { chapter: 9, normal: [851, 1200], challenger: [141, 180], miniBoss: [20, 28], boss: 2 },
      { chapter: 10, normal: [501, 850], challenger: [101, 140], miniBoss: [11, 19], boss: 1 },
    ];

    const newDistributions: ChapterDistribution[] = [];

    chapterRanges.forEach(range => {
      // Get all 400 meks for this chapter
      const normalMeks = meks.filter(m => m.rank >= range.normal[0] && m.rank <= range.normal[1]);
      const challengers = meks.filter(m => m.rank >= range.challenger[0] && m.rank <= range.challenger[1]);
      const miniBosses = meks.filter(m => m.rank >= range.miniBoss[0] && m.rank <= range.miniBoss[1]);
      const finalBoss = meks.filter(m => m.rank === range.boss);

      const chapterMeks = [...normalMeks, ...challengers, ...miniBosses, ...finalBoss];

      // Count variations
      const headCounts: Record<string, number> = {};
      const bodyCounts: Record<string, number> = {};
      const traitCounts: Record<string, number> = {};

      chapterMeks.forEach(mek => {
        // Count heads
        if (mek.head) {
          headCounts[mek.head] = (headCounts[mek.head] || 0) + 1;
        }

        // Count bodies
        if (mek.body) {
          bodyCounts[mek.body] = (bodyCounts[mek.body] || 0) + 1;
        }

        // Count traits (including None, Nothing, etc. for accuracy)
        if (mek.trait) {
          traitCounts[mek.trait] = (traitCounts[mek.trait] || 0) + 1;
        }
      });

      // Convert to sorted arrays with percentages
      const totalMeks = chapterMeks.length;

      const headVariations = Object.entries(headCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100,
          type: 'head' as const
        }))
        .sort((a, b) => b.count - a.count);

      const bodyVariations = Object.entries(bodyCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100,
          type: 'body' as const
        }))
        .sort((a, b) => b.count - a.count);

      const traitVariations = Object.entries(traitCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100,
          type: 'trait' as const
        }))
        .sort((a, b) => b.count - a.count);

      // Combine all variations and sort by abundance (most to least)
      // Exclude "None", "Nothing", "Nil", "Null" from essence distribution
      const allVariationsSorted = [
        ...headVariations,
        ...bodyVariations,
        ...traitVariations.filter(t => !['None', 'Nothing', 'Nil', 'Null', 'Vanished', 'Gone'].includes(t.name))
      ].sort((a, b) => b.count - a.count);

      // Get the 80 least abundant variations
      const leastAbundant80 = [...allVariationsSorted].reverse().slice(0, 80);

      // Apply round-robin distribution to events
      const eventEssenceDistribution = ROUND_ROBIN_TABLE.map((essenceRanks, eventIndex) => {
        const essences = essenceRanks.map(rank => {
          // Rank 1 = least abundant (index 0), Rank 80 = 80th least abundant (index 79)
          const variationIndex = rank - 1;
          return leastAbundant80[variationIndex] || null;
        }).filter(Boolean) as VariationCount[];

        return {
          eventNumber: eventIndex + 1 + (range.chapter - 1) * 20,
          essences
        };
      });

      newDistributions.push({
        chapter: range.chapter,
        totalMeks,
        headVariations,
        bodyVariations,
        traitVariations,
        allVariationsSorted,
        eventEssenceDistribution
      });
    });

    setDistributions(newDistributions);
  }, []);

  const currentChapter = distributions.find(d => d.chapter === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Mek Distribution by Chapter (Actual Data)</h3>
          <button
            onClick={() => setViewMode('detail')}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded text-sm transition-colors"
          >
            View Details
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">Chapter</th>
                <th className="text-left py-2">Total Meks</th>
                <th className="text-left py-2">Unique Heads</th>
                <th className="text-left py-2">Unique Bodies</th>
                <th className="text-left py-2">Unique Traits</th>
                <th className="text-left py-2">Most Common Head</th>
                <th className="text-left py-2">Most Common Body</th>
                <th className="text-left py-2">Rarest Event Essence</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map(dist => {
                const rarestEssence = [...dist.allVariationsSorted].reverse()[0]; // The actual rarest
                return (
                  <tr key={dist.chapter} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="py-2 font-bold text-yellow-500">{dist.chapter}</td>
                    <td className="py-2 text-blue-400">{dist.totalMeks}</td>
                    <td className="py-2 text-gray-300">{dist.headVariations.length}</td>
                    <td className="py-2 text-gray-300">{dist.bodyVariations.length}</td>
                    <td className="py-2 text-gray-300">{dist.traitVariations.length}</td>
                    <td className="py-2 text-orange-400">
                      {dist.headVariations[0]?.name || '-'} ({dist.headVariations[0]?.count || 0})
                    </td>
                    <td className="py-2 text-green-400">
                      {dist.bodyVariations[0]?.name || '-'} ({dist.bodyVariations[0]?.count || 0})
                    </td>
                    <td className="py-2 text-purple-400">
                      {rarestEssence?.name || '-'} ({rarestEssence?.count || 0})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-yellow-500">Chapter {selectedChapter} Variation Details</h3>
        <div className="flex gap-2">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(Number(e.target.value))}
            className="px-3 py-1 bg-black/50 border border-gray-700 rounded text-sm text-gray-300"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ch => (
              <option key={ch} value={ch}>Chapter {ch}</option>
            ))}
          </select>
          <button
            onClick={() => setViewMode('overview')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded text-sm transition-colors"
          >
            Back to Overview
          </button>
        </div>
      </div>

      {currentChapter && (
        <>
          {/* Chapter Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-500">{currentChapter.totalMeks}</div>
              <div className="text-sm text-gray-400">Total Mechanisms</div>
              <div className="text-xs text-gray-500 mt-1">
                350 Normal + 40 Challenger + 9 Mini-Boss + 1 Boss
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{currentChapter.headVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Head Variations</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{currentChapter.bodyVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Body Variations</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{currentChapter.traitVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Trait Variations</div>
            </div>
          </div>

          {/* Essence Distribution with 3 columns each */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              Essence Drop Chances for Chapter {selectedChapter} (400 Total Mechanisms)
            </h4>
            <div className="grid grid-cols-3 gap-6">
              {/* Head Essences */}
              <div>
                <h5 className="text-xs font-bold text-blue-400 mb-3 pb-2 border-b border-blue-400/30">
                  Head Essences
                </h5>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.headVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1">
                      <div className="col-span-7 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-2 text-center text-gray-300">
                        {variation.count}
                      </div>
                      <div className="col-span-3 text-right text-blue-400">
                        {variation.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Essences */}
              <div>
                <h5 className="text-xs font-bold text-green-400 mb-3 pb-2 border-b border-green-400/30">
                  Body Essences
                </h5>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.bodyVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1">
                      <div className="col-span-7 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-2 text-center text-gray-300">
                        {variation.count}
                      </div>
                      <div className="col-span-3 text-right text-green-400">
                        {variation.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trait Essences */}
              <div>
                <h5 className="text-xs font-bold text-purple-400 mb-3 pb-2 border-b border-purple-400/30">
                  Trait Essences
                </h5>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.traitVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1">
                      <div className="col-span-7 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-2 text-center text-gray-300">
                        {variation.count}
                      </div>
                      <div className="col-span-3 text-right text-purple-400">
                        {variation.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Round-Robin Event Essence Distribution */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              Event Essence Distribution (Round-Robin from 80 Least Abundant)
            </h4>
            <div className="text-xs text-gray-400 mb-3">
              Using round-robin table where Event 1 gets ranks 1, 21, 41, 61 (counting from least to most abundant)
            </div>
            <div className="grid grid-cols-2 gap-4">
              {currentChapter.eventEssenceDistribution.map(event => (
                <div key={event.eventNumber} className="bg-black/30 rounded p-2 border border-purple-500/20">
                  <div className="font-bold text-purple-400 mb-1">
                    Event {event.eventNumber % 20 || 20}
                  </div>
                  <div className="space-y-0.5">
                    {event.essences.map((essence, idx) => {
                      const rankNumber = ROUND_ROBIN_TABLE[(event.eventNumber - 1) % 20][idx];
                      return (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-500">Rank {rankNumber}:</span>
                          <span className={`
                            ${essence.type === 'head' ? 'text-blue-400' :
                              essence.type === 'body' ? 'text-green-400' :
                              'text-purple-400'}
                          `}>
                            {essence.name} ({essence.count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}