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

// Simple seeded random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate a realistic distribution using weighted random selection
function generateRealisticDistribution(
  variations: string[],
  totalCount: number,
  chapter: number,
  typeOffset: number
): Record<string, number> {
  const counts: Record<string, number> = {};

  // Determine how many unique variations should appear
  // Chapter 1 (least rare) might have 30-50 unique variations out of 102
  // Chapter 10 (most rare) might have 20-35 unique variations
  const uniqueCountBase = 25 + Math.floor(seededRandom(chapter * 100 + typeOffset) * 20);
  const uniqueAdjustment = Math.floor((11 - chapter) * 1.5); // More variety in early chapters
  const targetUniqueCount = Math.min(uniqueCountBase + uniqueAdjustment, variations.length);

  // Create weights for variations based on rarity
  // Early variations in the array are considered "common"
  const weights: number[] = [];
  for (let i = 0; i < variations.length; i++) {
    // Create a power law distribution
    // Common items (early in array) have higher weight in Chapter 1
    // Rare items (late in array) have higher weight in Chapter 10
    const commonWeight = Math.pow(variations.length - i, 1.5);
    const rareWeight = Math.pow(i + 1, 1.5);

    // Blend between common and rare based on chapter
    const chapterBias = (11 - chapter) / 10; // 1.0 for chapter 1, 0.1 for chapter 10
    const weight = (commonWeight * chapterBias) + (rareWeight * (1 - chapterBias));

    weights.push(weight);
  }

  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);

  // Distribute the total count across variations
  for (let i = 0; i < totalCount; i++) {
    // Pick a variation based on weights
    const rand = seededRandom(chapter * 10000 + typeOffset * 1000 + i);
    let cumulative = 0;
    let selectedIndex = 0;

    for (let j = 0; j < normalizedWeights.length; j++) {
      cumulative += normalizedWeights[j];
      if (rand < cumulative) {
        selectedIndex = j;
        break;
      }
    }

    const variation = variations[selectedIndex];
    counts[variation] = (counts[variation] || 0) + 1;
  }

  // Ensure we don't have too many unique variations
  // Remove variations that only appear once if we have too many
  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const finalCounts: Record<string, number> = {};

  for (let i = 0; i < Math.min(targetUniqueCount, sortedEntries.length); i++) {
    finalCounts[sortedEntries[i][0]] = sortedEntries[i][1];
  }

  // Redistribute any lost counts to the most common variations
  const lostCount = totalCount - Object.values(finalCounts).reduce((sum, c) => sum + c, 0);
  if (lostCount > 0) {
    const topVariations = Object.keys(finalCounts).slice(0, 5);
    for (let i = 0; i < lostCount; i++) {
      const index = i % topVariations.length;
      finalCounts[topVariations[index]]++;
    }
  }

  return finalCounts;
}

function generateChapterDistribution(chapter: number): ChapterDistribution {
  const totalMeks = 400; // Each chapter has exactly 400 meks

  // Generate realistic distributions for each type
  const headCounts = generateRealisticDistribution(HEADS_VARIATIONS, totalMeks, chapter, 1);
  const bodyCounts = generateRealisticDistribution(BODIES_VARIATIONS, totalMeks, chapter, 2);

  // Traits: only ~70% of meks have traits
  const traitsToAssign = Math.floor(totalMeks * (0.6 + seededRandom(chapter * 777) * 0.2));
  const traitCounts = generateRealisticDistribution(
    TRAITS_VARIATIONS.filter(t => !["None", "Nothing", "Nil", "Null"].includes(t)),
    traitsToAssign,
    chapter,
    3
  );

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
      percentage: totalTraits > 0 ? (count / totalTraits) * 100 : 0
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

export default function MekChapterDistributionRealistic() {
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
          <h4 className="text-sm font-bold text-yellow-500 mb-2">Realistic Distribution Pattern</h4>
          <ul className="text-xs text-yellow-500/80 space-y-1">
            <li>• Some variations appear 15-25 times (common in that chapter)</li>
            <li>• Many variations appear 5-10 times</li>
            <li>• Some variations appear only 1-3 times (rare in that chapter)</li>
            <li>• Many variations don't appear at all in a given chapter</li>
            <li>• Chapter 1 favors common variations, Chapter 10 favors rare variations</li>
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
                Out of {HEADS_VARIATIONS.length} total possible
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{currentChapter.bodyVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Body Variations</div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {BODIES_VARIATIONS.length} total possible
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{currentChapter.traitVariations.length}</div>
              <div className="text-sm text-gray-400">Unique Trait Variations</div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {TRAITS_VARIATIONS.length} total possible
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
                  Head Essences ({currentChapter.headVariations.length} unique out of {HEADS_VARIATIONS.length})
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-6">Variation</div>
                    <div className="col-span-3 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.headVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
                      <div className="col-span-6 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-3 text-center text-gray-300">
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
                  Body Essences ({currentChapter.bodyVariations.length} unique out of {BODIES_VARIATIONS.length})
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-6">Variation</div>
                    <div className="col-span-3 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.bodyVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
                      <div className="col-span-6 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-3 text-center text-gray-300">
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
                  Trait Essences ({currentChapter.traitVariations.length} unique out of {TRAITS_VARIATIONS.filter(t => !["None", "Nothing", "Nil", "Null"].includes(t)).length})
                </h5>
                <div className="space-y-0.5 max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-500 mb-2 pb-1 border-b border-gray-700 sticky top-0 bg-gray-800/90">
                    <div className="col-span-6">Variation</div>
                    <div className="col-span-3 text-center">Count</div>
                    <div className="col-span-3 text-right">%</div>
                  </div>
                  {currentChapter.traitVariations.map(variation => (
                    <div key={variation.name} className="grid grid-cols-12 gap-1 text-xs hover:bg-gray-800/50 rounded px-1 py-0.5">
                      <div className="col-span-6 text-gray-400 truncate" title={variation.name}>
                        {variation.name}
                      </div>
                      <div className="col-span-3 text-center text-gray-300">
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
                <div className="text-xs text-gray-600">
                  {currentChapter.headVariations.length} unique variations used
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Body Assignments</div>
                <div className="text-lg font-bold text-green-400">{currentChapter.totalMeks}</div>
                <div className="text-xs text-gray-600">
                  {currentChapter.bodyVariations.length} unique variations used
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Trait Assignments</div>
                <div className="text-lg font-bold text-purple-400">
                  {currentChapter.traitVariations.reduce((sum, v) => sum + v.count, 0)}
                </div>
                <div className="text-xs text-gray-600">
                  {currentChapter.traitVariations.length} unique variations used
                </div>
              </div>
            </div>
          </div>

          {/* Note about the simulation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-xs font-bold text-blue-400 mb-1">Realistic Simulated Distribution</h4>
            <p className="text-xs text-blue-400/80">
              This shows a realistic power-law distribution where some variations appear frequently (15-25 times),
              many appear moderately (5-10 times), some rarely (1-3 times), and many don't appear at all.
              The actual game will use similar distribution patterns with the player's wallet as a seed.
            </p>
          </div>
        </>
      )}
    </div>
  );
}