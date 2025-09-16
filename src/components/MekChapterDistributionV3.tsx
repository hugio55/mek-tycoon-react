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

interface VariationCount {
  name: string;
  count: number;
  percentage: number;
}

interface ChapterDistribution {
  chapter: number;
  totalMeks: number;
  headVariations: VariationCount[];
  bodyVariations: VariationCount[];
  traitVariations: VariationCount[];
}

export default function MekChapterDistributionV3() {
  const [distributions, setDistributions] = useState<ChapterDistribution[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    // Type assertion for the imported JSON
    const meks = mekGoldRates as MekData[];

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
      const normalMeks = meks.filter(m => m.final_rank >= range.normal[0] && m.final_rank <= range.normal[1]);
      const challengers = meks.filter(m => m.final_rank >= range.challenger[0] && m.final_rank <= range.challenger[1]);
      const miniBosses = meks.filter(m => m.final_rank >= range.miniBoss[0] && m.final_rank <= range.miniBoss[1]);
      const finalBoss = meks.filter(m => m.final_rank === range.boss);

      const chapterMeks = [...normalMeks, ...challengers, ...miniBosses, ...finalBoss];

      // Count variations
      const headCounts: Record<string, number> = {};
      const bodyCounts: Record<string, number> = {};
      const traitCounts: Record<string, number> = {};

      chapterMeks.forEach(mek => {
        // Count heads - use the actual head_group from the data
        if (mek.head_group) {
          headCounts[mek.head_group] = (headCounts[mek.head_group] || 0) + 1;
        }

        // Count bodies - use the actual body_group from the data
        if (mek.body_group) {
          bodyCounts[mek.body_group] = (bodyCounts[mek.body_group] || 0) + 1;
        }

        // Count traits - use the actual item_group from the data
        // Skip "None", "Nothing", etc.
        if (mek.item_group && !['None', 'Nothing', 'Nil', 'Null'].includes(mek.item_group)) {
          traitCounts[mek.item_group] = (traitCounts[mek.item_group] || 0) + 1;
        }
      });

      // Convert to sorted arrays with percentages
      const totalMeks = chapterMeks.length;

      const headVariations = Object.entries(headCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const bodyVariations = Object.entries(bodyCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const traitVariations = Object.entries(traitCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalMeks) * 100
        }))
        .sort((a, b) => b.count - a.count);

      newDistributions.push({
        chapter: range.chapter,
        totalMeks,
        headVariations,
        bodyVariations,
        traitVariations
      });
    });

    setDistributions(newDistributions);
  }, []);

  const currentChapter = distributions.find(d => d.chapter === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Mek Distribution by Chapter (From Actual Data)</h3>
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
              </tr>
            </thead>
            <tbody>
              {distributions.map(dist => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-500 mb-2">Important Notes</h4>
          <ul className="text-xs text-yellow-500/80 space-y-1">
            <li>• Each chapter contains exactly 400 Mek nodes (350 normal + 40 challenger + 9 mini-boss + 1 boss)</li>
            <li>• Chapter 1 has the least rare mechanisms (ranks 3651-4000)</li>
            <li>• Chapter 10 has the most rare mechanisms (ranks 1-850)</li>
            <li>• The data shows actual mechanism groups from the game database</li>
          </ul>
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

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-gray-500">Total Head Occurrences</div>
                <div className="text-lg font-bold text-blue-400">{currentChapter.totalMeks}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Body Occurrences</div>
                <div className="text-lg font-bold text-green-400">{currentChapter.totalMeks}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Trait Occurrences</div>
                <div className="text-lg font-bold text-purple-400">
                  {currentChapter.traitVariations.reduce((sum, v) => sum + v.count, 0)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}