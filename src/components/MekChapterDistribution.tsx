'use client';

import React, { useState, useEffect } from 'react';
import mekGoldRates from '@/convex/mekGoldRates.json';

interface MekData {
  asset_id: string;
  name: string;
  final_rank: number;
  gold_per_hour: number;
  source_key: string;
  background: string;
  body_group: string;
  head_group: string;
  item_group: string;
  rarity_score: number;
  original_rarity_rank: number;
}

interface ChapterDistribution {
  chapter: number;
  normalMeks: MekData[];
  challengers: MekData[];
  miniBosses: MekData[];
  finalBoss: MekData | null;
  essenceDistribution: Record<string, number>;
}

export default function MekChapterDistribution() {
  const [distributions, setDistributions] = useState<ChapterDistribution[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    // Type assertion for the imported JSON
    const meks = mekGoldRates as MekData[];

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
      const normalMeks = meks.filter(m => m.final_rank >= range.normal[0] && m.final_rank <= range.normal[1]);
      const challengers = meks.filter(m => m.final_rank >= range.challenger[0] && m.final_rank <= range.challenger[1]);
      const miniBosses = meks.filter(m => m.final_rank >= range.miniBoss[0] && m.final_rank <= range.miniBoss[1]);
      const finalBoss = meks.find(m => m.final_rank === range.boss) || null;

      // Calculate essence distribution from actual variation names
      const essenceDistribution: Record<string, number> = {};
      const allChapterMeks = [...normalMeks, ...challengers, ...miniBosses];
      if (finalBoss) allChapterMeks.push(finalBoss);

      allChapterMeks.forEach(mek => {
        // Use the actual group names from the mek data
        const headVariation = mek.head_group;
        const bodyVariation = mek.body_group;
        const traitVariation = mek.item_group;

        // Count each variation type
        if (headVariation && headVariation !== 'None') {
          essenceDistribution[`H-${headVariation}`] = (essenceDistribution[`H-${headVariation}`] || 0) + 1;
        }
        if (bodyVariation && bodyVariation !== 'None') {
          essenceDistribution[`B-${bodyVariation}`] = (essenceDistribution[`B-${bodyVariation}`] || 0) + 1;
        }
        if (traitVariation && traitVariation !== 'None' && traitVariation !== 'Nothing') {
          essenceDistribution[`T-${traitVariation}`] = (essenceDistribution[`T-${traitVariation}`] || 0) + 1;
        }
      });

      newDistributions.push({
        chapter: range.chapter,
        normalMeks,
        challengers,
        miniBosses,
        finalBoss,
        essenceDistribution
      });
    });

    setDistributions(newDistributions);
  }, []);

  const calculateEssencePercentages = (distribution: Record<string, number>) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const percentages: Record<string, number> = {};

    Object.entries(distribution).forEach(([key, count]) => {
      percentages[key] = (count / total * 100);
    });

    return percentages;
  };

  const currentChapter = distributions.find(d => d.chapter === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Mek Distribution by Chapter</h3>
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
                <th className="text-left py-2">Normal</th>
                <th className="text-left py-2">Challenger</th>
                <th className="text-left py-2">Mini-Boss</th>
                <th className="text-left py-2">Boss</th>
                <th className="text-left py-2">Unique Essences</th>
                <th className="text-left py-2">Most Common</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map(dist => {
                const essencePercentages = calculateEssencePercentages(dist.essenceDistribution);
                const sortedEssences = Object.entries(essencePercentages)
                  .sort((a, b) => b[1] - a[1]);
                const topEssence = sortedEssences[0];

                return (
                  <tr key={dist.chapter} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="py-2 font-bold text-yellow-500">{dist.chapter}</td>
                    <td className="py-2 text-gray-300">{dist.normalMeks.length}</td>
                    <td className="py-2 text-orange-400">{dist.challengers.length}</td>
                    <td className="py-2 text-red-400">{dist.miniBosses.length}</td>
                    <td className="py-2 text-yellow-400">
                      {dist.finalBoss ? `#${dist.finalBoss.asset_id}` : 'None'}
                    </td>
                    <td className="py-2 text-purple-400">
                      {Object.keys(dist.essenceDistribution).length}
                    </td>
                    <td className="py-2 text-blue-400">
                      {topEssence ? `${topEssence[0]} (${topEssence[1].toFixed(1)}%)` : '-'}
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
              <div className="text-gray-500">Normal Meks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">400</div>
              <div className="text-gray-500">Challengers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">90</div>
              <div className="text-gray-500">Mini-Bosses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">10</div>
              <div className="text-gray-500">Final Bosses</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-yellow-500">Chapter {selectedChapter} Mek Details</h3>
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
              <div className="text-2xl font-bold text-gray-300">{currentChapter.normalMeks.length}</div>
              <div className="text-sm text-gray-400">Normal Meks</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.normalMeks[0]?.final_rank || '-'} - {currentChapter.normalMeks[currentChapter.normalMeks.length - 1]?.final_rank || '-'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">{currentChapter.challengers.length}</div>
              <div className="text-sm text-gray-400">Challengers</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.challengers[0]?.final_rank || '-'} - {currentChapter.challengers[currentChapter.challengers.length - 1]?.final_rank || '-'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{currentChapter.miniBosses.length}</div>
              <div className="text-sm text-gray-400">Mini-Bosses</div>
              <div className="text-xs text-gray-500">
                Ranks {currentChapter.miniBosses[0]?.final_rank || '-'} - {currentChapter.miniBosses[currentChapter.miniBosses.length - 1]?.final_rank || '-'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {currentChapter.finalBoss ? `#${currentChapter.finalBoss.asset_id}` : 'None'}
              </div>
              <div className="text-sm text-gray-400">Final Boss</div>
              <div className="text-xs text-gray-500">
                {currentChapter.finalBoss ? `Rank ${currentChapter.finalBoss.final_rank}` : '-'}
              </div>
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
                  {Object.entries(calculateEssencePercentages(currentChapter.essenceDistribution))
                    .filter(([key]) => key.startsWith('H-'))
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, percentage]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={key.replace('H-', '')}>{key.replace('H-', '')}</span>
                        <span className="text-blue-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Body Essences */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 mb-2">Body Essences</h5>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {Object.entries(calculateEssencePercentages(currentChapter.essenceDistribution))
                    .filter(([key]) => key.startsWith('B-'))
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, percentage]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={key.replace('B-', '')}>{key.replace('B-', '')}</span>
                        <span className="text-green-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Trait Essences */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 mb-2">Trait Essences</h5>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {Object.entries(calculateEssencePercentages(currentChapter.essenceDistribution))
                    .filter(([key]) => key.startsWith('T-'))
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, percentage]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]" title={key.replace('T-', '')}>{key.replace('T-', '')}</span>
                        <span className="text-purple-400 ml-2">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sample Meks */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Sample Meks from Chapter {selectedChapter}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Asset ID</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Source Key</th>
                    <th className="text-left py-2">Head</th>
                    <th className="text-left py-2">Body</th>
                    <th className="text-left py-2">Trait</th>
                    <th className="text-left py-2">Gold/Hr</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show a few samples from each category */}
                  {[
                    ...currentChapter.normalMeks.slice(0, 3).map(m => ({ ...m, type: 'Normal' })),
                    ...currentChapter.challengers.slice(0, 2).map(m => ({ ...m, type: 'Challenger' })),
                    ...currentChapter.miniBosses.slice(0, 2).map(m => ({ ...m, type: 'Mini-Boss' })),
                    ...(currentChapter.finalBoss ? [{ ...currentChapter.finalBoss, type: 'Final Boss' }] : [])
                  ].map(mek => (
                    <tr key={mek.asset_id} className="border-b border-gray-800 hover:bg-gray-800/20">
                      <td className="py-2 font-bold text-yellow-500">{mek.final_rank}</td>
                      <td className="py-2 text-gray-300">#{mek.asset_id}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          mek.type === 'Final Boss' ? 'bg-yellow-500/20 text-yellow-400' :
                          mek.type === 'Mini-Boss' ? 'bg-red-500/20 text-red-400' :
                          mek.type === 'Challenger' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-700/50 text-gray-300'
                        }`}>
                          {mek.type}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 font-mono">{mek.source_key}</td>
                      <td className="py-2 text-blue-400">{mek.head_group}</td>
                      <td className="py-2 text-green-400">{mek.body_group}</td>
                      <td className="py-2 text-purple-400">{mek.item_group}</td>
                      <td className="py-2 text-yellow-400">{mek.gold_per_hour.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}