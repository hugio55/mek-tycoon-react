'use client';

import React, { useState, useEffect } from 'react';
import { leastRareMechanisms } from '@/app/scrap-yard/story-climb/least-rare-mechanisms';
import { HEADS_VARIATIONS, BODIES_VARIATIONS, TRAITS_VARIATIONS } from '@/app/crafting/constants/variations';

interface ChapterDistribution {
  chapter: number;
  normalMekRange: [number, number];
  challengerRange: [number, number];
  miniBossRange: [number, number];
  finalBossRank: number;
  mekCount: number;
  essenceDistribution: {
    heads: Record<string, number>;
    bodies: Record<string, number>;
    traits: Record<string, number>;
  };
}

// Generate pseudo-random variation based on rank
function getVariationByRank(rank: number, variations: string[]): string {
  // Use rank as seed for consistent results
  const index = (rank * 7919) % variations.length; // Prime number for better distribution
  return variations[index];
}

// Generate all 4000 meks with proper variation names
function generateAllMeks() {
  const meks: Array<{
    rank: number;
    head: string;
    body: string;
    trait: string;
    webpFile?: string;
  }> = [];

  for (let rank = 1; rank <= 4000; rank++) {
    // For ranks 3601-4000, use the actual webp filenames
    let webpFile: string | undefined;
    if (rank >= 3601 && rank <= 4000) {
      const index = rank - 3601;
      webpFile = leastRareMechanisms[index];
    }

    // Generate variations using consistent pseudo-random distribution
    const head = getVariationByRank(rank * 3, HEADS_VARIATIONS);
    const body = getVariationByRank(rank * 5, BODIES_VARIATIONS);
    const trait = getVariationByRank(rank * 7, TRAITS_VARIATIONS);

    meks.push({
      rank,
      head,
      body,
      trait,
      webpFile
    });
  }

  return meks;
}

export default function MekChapterDistributionV2() {
  const [distributions, setDistributions] = useState<ChapterDistribution[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    const allMeks = generateAllMeks();

    // Define chapter ranges based on documentation
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
      // Get all meks for this chapter
      const chapterMeks = allMeks.filter(m =>
        (m.rank >= range.normal[0] && m.rank <= range.normal[1]) ||
        (m.rank >= range.challenger[0] && m.rank <= range.challenger[1]) ||
        (m.rank >= range.miniBoss[0] && m.rank <= range.miniBoss[1]) ||
        m.rank === range.boss
      );

      // Calculate essence distribution
      const essenceDistribution = {
        heads: {} as Record<string, number>,
        bodies: {} as Record<string, number>,
        traits: {} as Record<string, number>
      };

      chapterMeks.forEach(mek => {
        // Count head variations
        essenceDistribution.heads[mek.head] = (essenceDistribution.heads[mek.head] || 0) + 1;

        // Count body variations
        essenceDistribution.bodies[mek.body] = (essenceDistribution.bodies[mek.body] || 0) + 1;

        // Count trait variations (skip "None", "Nothing", "Nil", "Null")
        if (!["None", "Nothing", "Nil", "Null", "Gone", "Vanished"].includes(mek.trait)) {
          essenceDistribution.traits[mek.trait] = (essenceDistribution.traits[mek.trait] || 0) + 1;
        }
      });

      newDistributions.push({
        chapter: range.chapter,
        normalMekRange: [range.normal[0], range.normal[1]],
        challengerRange: [range.challenger[0], range.challenger[1]],
        miniBossRange: [range.miniBoss[0], range.miniBoss[1]],
        finalBossRank: range.boss,
        mekCount: chapterMeks.length,
        essenceDistribution
      });
    });

    setDistributions(newDistributions);
  }, []);

  const calculateEssencePercentages = (distribution: Record<string, number>) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};

    const percentages: Array<[string, number]> = [];
    Object.entries(distribution).forEach(([key, count]) => {
      percentages.push([key, (count / total * 100)]);
    });

    return percentages.sort((a, b) => b[1] - a[1]);
  };

  const currentChapter = distributions.find(d => d.chapter === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Mek Distribution by Chapter (Actual Variations)</h3>
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
                <th className="text-left py-2">Ch</th>
                <th className="text-left py-2">Normal Range</th>
                <th className="text-left py-2">Challenger Range</th>
                <th className="text-left py-2">Mini-Boss Range</th>
                <th className="text-left py-2">Boss Rank</th>
                <th className="text-left py-2">Total Meks</th>
                <th className="text-left py-2">Unique Variations</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map(dist => {
                const uniqueHeads = Object.keys(dist.essenceDistribution.heads).length;
                const uniqueBodies = Object.keys(dist.essenceDistribution.bodies).length;
                const uniqueTraits = Object.keys(dist.essenceDistribution.traits).length;

                return (
                  <tr key={dist.chapter} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="py-2 font-bold text-yellow-500">{dist.chapter}</td>
                    <td className="py-2 text-gray-300">
                      {dist.normalMekRange[0]}-{dist.normalMekRange[1]}
                    </td>
                    <td className="py-2 text-orange-400">
                      {dist.challengerRange[0]}-{dist.challengerRange[1]}
                    </td>
                    <td className="py-2 text-red-400">
                      {dist.miniBossRange[0]}-{dist.miniBossRange[1]}
                    </td>
                    <td className="py-2 text-yellow-400">#{dist.finalBossRank}</td>
                    <td className="py-2 text-blue-400">{dist.mekCount}</td>
                    <td className="py-2 text-purple-400">
                      H:{uniqueHeads} B:{uniqueBodies} T:{uniqueTraits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-500 mb-2">Distribution Summary</h4>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-2xl font-bold text-gray-300">3,500</div>
              <div className="text-gray-500">Normal Meks (501-4000)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">400</div>
              <div className="text-gray-500">Challengers (101-500)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">90</div>
              <div className="text-gray-500">Mini-Bosses (11-100)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">10</div>
              <div className="text-gray-500">Final Bosses (1-10)</div>
            </div>
          </div>
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
              <div className="text-2xl font-bold text-gray-300">350</div>
              <div className="text-sm text-gray-400">Normal Meks</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.normalMekRange[0]}-{currentChapter.normalMekRange[1]}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">40</div>
              <div className="text-sm text-gray-400">Challengers</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.challengerRange[0]}-{currentChapter.challengerRange[1]}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">9</div>
              <div className="text-sm text-gray-400">Mini-Bosses</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.miniBossRange[0]}-{currentChapter.miniBossRange[1]}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">Rank #{currentChapter.finalBossRank}</div>
              <div className="text-sm text-gray-400">Final Boss</div>
            </div>
          </div>

          {/* Essence Distribution */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Essence Drop Chances</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Head Essences */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 mb-2">Head Essences</h5>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {calculateEssencePercentages(currentChapter.essenceDistribution.heads)
                    .slice(0, 15) // Show top 15
                    .map(([variation, percentage]) => (
                      <div key={variation} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={variation}>
                          {variation}
                        </span>
                        <span className="text-blue-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Body Essences */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 mb-2">Body Essences</h5>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {calculateEssencePercentages(currentChapter.essenceDistribution.bodies)
                    .slice(0, 15) // Show top 15
                    .map(([variation, percentage]) => (
                      <div key={variation} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={variation}>
                          {variation}
                        </span>
                        <span className="text-green-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Trait Essences */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 mb-2">Trait Essences</h5>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {calculateEssencePercentages(currentChapter.essenceDistribution.traits)
                    .slice(0, 15) // Show top 15
                    .map(([variation, percentage]) => (
                      <div key={variation} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={variation}>
                          {variation}
                        </span>
                        <span className="text-purple-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Note about the data */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
              <strong>Note:</strong> These variations are distributed using a deterministic algorithm based on rank.
              Each player's actual tree will use their wallet address as a seed for unique distribution while maintaining
              the same rarity tiers.
            </div>
          </div>
        </>
      )}
    </div>
  );
}