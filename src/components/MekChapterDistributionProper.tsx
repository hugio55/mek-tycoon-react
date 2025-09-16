'use client';

import React, { useState, useEffect } from 'react';
import { HEADS_VARIATIONS, BODIES_VARIATIONS, TRAITS_VARIATIONS } from '@/app/crafting/constants/variations';

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

// Simulate a deterministic distribution based on rarity
// Chapter 1 = least rare (common variations appear more)
// Chapter 10 = most rare (rare variations appear more)
function generateChapterDistribution(chapter: number): ChapterDistribution {
  const totalMeks = 400; // Each chapter has exactly 400 meks

  // Define which variations are common vs rare
  // For heads
  const commonHeads = HEADS_VARIATIONS.slice(0, 40); // First 40 are more common
  const rareHeads = HEADS_VARIATIONS.slice(40); // Rest are rarer

  // For bodies
  const commonBodies = BODIES_VARIATIONS.slice(0, 50); // First 50 are more common
  const rareBodies = BODIES_VARIATIONS.slice(50); // Rest are rarer

  // For traits
  const commonTraits = TRAITS_VARIATIONS.slice(0, 45); // First 45 are more common
  const rareTraits = TRAITS_VARIATIONS.slice(45); // Rest are rarer

  // Generate distributions based on chapter (1 = common heavy, 10 = rare heavy)
  const rarityBias = (11 - chapter) / 10; // 1.0 for chapter 1, 0.1 for chapter 10

  // Count heads
  const headCounts: Record<string, number> = {};
  for (let i = 0; i < totalMeks; i++) {
    // Use seeded random based on chapter and index
    const seed = (chapter * 1000 + i) * 7919;
    const useCommon = ((seed % 100) / 100) < rarityBias;

    const headPool = useCommon ? commonHeads : rareHeads;
    const headIndex = seed % headPool.length;
    const head = headPool[headIndex];

    headCounts[head] = (headCounts[head] || 0) + 1;
  }

  // Count bodies
  const bodyCounts: Record<string, number> = {};
  for (let i = 0; i < totalMeks; i++) {
    const seed = (chapter * 2000 + i) * 7919;
    const useCommon = ((seed % 100) / 100) < rarityBias;

    const bodyPool = useCommon ? commonBodies : rareBodies;
    const bodyIndex = seed % bodyPool.length;
    const body = bodyPool[bodyIndex];

    bodyCounts[body] = (bodyCounts[body] || 0) + 1;
  }

  // Count traits (some meks have no traits)
  const traitCounts: Record<string, number> = {};
  const traitsToAssign = Math.floor(totalMeks * 0.7); // 70% have traits

  for (let i = 0; i < traitsToAssign; i++) {
    const seed = (chapter * 3000 + i) * 7919;
    const useCommon = ((seed % 100) / 100) < rarityBias;

    const traitPool = useCommon ? commonTraits : rareTraits;
    const traitIndex = seed % traitPool.length;
    const trait = traitPool[traitIndex];

    // Skip "None", "Nothing", "Nil", "Null" variations
    if (!["None", "Nothing", "Nil", "Null"].includes(trait)) {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    }
  }

  // Convert to sorted arrays with percentages
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

  const totalTraits = Object.values(traitCounts).reduce((sum, count) => sum + count, 0);
  const traitVariations = Object.entries(traitCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalTraits) * 100
    }))
    .sort((a, b) => b.count - a.count);

  return {
    chapter,
    totalMeks,
    headVariations,
    bodyVariations,
    traitVariations
  };
}

export default function MekChapterDistributionProper() {
  const [distributions, setDistributions] = useState<ChapterDistribution[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    const newDistributions: ChapterDistribution[] = [];
    for (let chapter = 1; chapter <= 10; chapter++) {
      newDistributions.push(generateChapterDistribution(chapter));
    }
    setDistributions(newDistributions);
  }, []);

  const currentChapter = distributions.find(d => d.chapter === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Mek Variation Distribution by Chapter</h3>
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
                <th className="text-left py-2">Most Common Trait</th>
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
                  <td className="py-2 text-purple-400">
                    {dist.traitVariations[0]?.name || '-'} ({dist.traitVariations[0]?.count || 0})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-500 mb-2">Distribution Pattern</h4>
          <ul className="text-xs text-yellow-500/80 space-y-1">
            <li>• Chapter 1: Common variations appear frequently (least rare mechanisms)</li>
            <li>• Chapter 10: Rare variations appear frequently (most rare mechanisms)</li>
            <li>• Each chapter contains exactly 400 Mek nodes</li>
            <li>• Approximately 70% of meks have trait variations</li>
            <li>• Distribution uses deterministic algorithm for consistency</li>
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
              <div className="text-xs text-gray-500 mt-1">
                Out of {HEADS_VARIATIONS.length} total
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{currentChapter.bodyVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Body Variations</div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {BODIES_VARIATIONS.length} total
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{currentChapter.traitVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Trait Variations</div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {TRAITS_VARIATIONS.length} total
              </div>
            </div>
          </div>

          {/* Essence Distribution with actual variation names */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              Essence Drop Chances for Chapter {selectedChapter} (400 Total Mechanisms)
            </h4>
            <div className="grid grid-cols-3 gap-6">
              {/* Head Essences */}
              <div>
                <h5 className="text-xs font-bold text-blue-400 mb-3 pb-2 border-b border-blue-400/30">
                  Head Essences ({currentChapter.headVariations.length} variations)
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.headVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
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
                  Body Essences ({currentChapter.bodyVariations.length} variations)
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.bodyVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
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
                  Trait Essences ({currentChapter.traitVariations.length} variations)
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-7">Variation</div>
                    <div className="col-span-2 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.traitVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
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
                <div className="text-gray-500">Total Head Assignments</div>
                <div className="text-lg font-bold text-blue-400">{currentChapter.totalMeks}</div>
                <div className="text-xs text-gray-600">All meks have heads</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Body Assignments</div>
                <div className="text-lg font-bold text-green-400">{currentChapter.totalMeks}</div>
                <div className="text-xs text-gray-600">All meks have bodies</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Trait Assignments</div>
                <div className="text-lg font-bold text-purple-400">
                  {currentChapter.traitVariations.reduce((sum, v) => sum + v.count, 0)}
                </div>
                <div className="text-xs text-gray-600">~70% have traits</div>
              </div>
            </div>
          </div>

          {/* Note about the simulation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-xs font-bold text-blue-400 mb-1">Simulated Distribution</h4>
            <p className="text-xs text-blue-400/80">
              This shows a realistic distribution of actual variations (like "Bowling", "Taser", "Cotton Candy")
              based on rarity tiers. Chapter 1 contains more common variations while Chapter 10 contains more rare variations.
              The actual game will use the player's wallet address as a seed for deterministic generation.
            </p>
          </div>
        </>
      )}
    </div>
  );
}