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
  missingVariations: VariationCount[]; // Variations NOT in this chapter
  eventEssenceDistribution: Array<{
    eventNumber: number;
    essences: VariationCount[];
  }>;
}

// Rarity Buckets System
// Divides the 80 rarest variations into 4 buckets of 20 each
const RARITY_BUCKETS = {
  ULTRA_RARE: { start: 0, end: 20 },    // Indices 0-19 (ranks 1-20)
  VERY_RARE: { start: 20, end: 40 },    // Indices 20-39 (ranks 21-40)
  RARE: { start: 40, end: 60 },         // Indices 40-59 (ranks 41-60)
  UNCOMMON: { start: 60, end: 80 }      // Indices 60-79 (ranks 61-80)
};

// Generate dynamic tiers based on available variations
function generateDynamicTiers(availableCount: number) {
  // Divide available variations into 4 tiers as evenly as possible
  const tiersCount = 4;
  const baseSize = Math.floor(availableCount / tiersCount);
  const remainder = availableCount % tiersCount;

  const tiers: Array<{ start: number; end: number; name: string; color: string }> = [];
  let currentStart = 0;

  const tierNames = ['ULTRA RARE', 'VERY RARE', 'RARE', 'UNCOMMON'];
  const tierColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];

  for (let i = 0; i < tiersCount; i++) {
    // Give extra variations to the earlier tiers if there's a remainder
    const tierSize = baseSize + (i < remainder ? 1 : 0);

    if (tierSize > 0) {
      tiers.push({
        start: currentStart,
        end: currentStart + tierSize,
        name: tierNames[i],
        color: tierColors[i]
      });
      currentStart += tierSize;
    }
  }

  return tiers;
}

// Boss variations from ranks 1-10 that should not be available as event rewards
const BOSS_VARIATIONS = {
  heads: new Set([
    'Derelict', 'Obliterator', 'Ace of Spades Ultimate', 'Discomania',
    'Paul Ultimate', 'Frost King', 'Pie', 'Projectionist',
    'Ellie Mesh', 'Nyan Ultimate'
  ]),
  bodies: new Set([
    'Gatsby Ultimate', 'Luxury Ultimate', 'Plush Ultimate', 'X Ray Ultimate',
    'Burnt Ultimate', 'Frost Cage', 'Carving Ultimate', 'Cousin Itt',
    'Chrome Ultimate', 'Heatwave Ultimate'
  ]),
  traits: new Set([
    'Stolen', 'Golden Guns Ultimate', 'Linkinator 3000', 'Oompah',
    'Peacock Ultimate', 'None', 'Null', 'Nil', 'Gone', 'Vanished'
    // These are all from final bosses (ranks 1-10)
  ])
};

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
      // This is for display purposes
      const allVariationsSorted = [
        ...headVariations,
        ...bodyVariations,
        ...traitVariations.filter(t => !['None', 'Nothing', 'Nil', 'Null', 'Vanished', 'Gone'].includes(t.name))
      ].sort((a, b) => b.count - a.count);

      // NEW LOGIC: Find variations NOT in this chapter for event essences
      const chapterHeadSet = new Set(headVariations.map(v => v.name));
      const chapterBodySet = new Set(bodyVariations.map(v => v.name));
      const chapterTraitSet = new Set(traitVariations.map(v => v.name));

      // Count ALL variations globally
      const globalCounts: Record<string, { count: number, type: 'head' | 'body' | 'trait' }> = {};

      meks.forEach(mek => {
        if (!globalCounts[mek.head]) {
          globalCounts[mek.head] = { count: 0, type: 'head' };
        }
        globalCounts[mek.head].count++;

        if (!globalCounts[mek.body]) {
          globalCounts[mek.body] = { count: 0, type: 'body' };
        }
        globalCounts[mek.body].count++;

        if (!globalCounts[mek.trait]) {
          globalCounts[mek.trait] = { count: 0, type: 'trait' };
        }
        globalCounts[mek.trait].count++;
      });

      // Find variations NOT in this chapter
      const missingVariations: VariationCount[] = [];

      Object.entries(globalCounts).forEach(([name, data]) => {
        const isHead = data.type === 'head' && !chapterHeadSet.has(name);
        const isBody = data.type === 'body' && !chapterBodySet.has(name);
        const isTrait = data.type === 'trait' && !chapterTraitSet.has(name);
        // No longer filtering out None, Nil, etc. - they'll be shown as boss variations

        if (isHead || isBody || isTrait) {
          missingVariations.push({
            name,
            count: data.count,
            type: data.type,
            percentage: (data.count / 4000) * 100
          });
        }
      });

      // Filter out boss variations and sort by global rarity (rarest first)
      const bossVariationsFound: string[] = [];
      const eligibleMissingVariations = missingVariations.filter(v => {
        if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) {
          bossVariationsFound.push(`Head: ${v.name}`);
          return false;
        }
        if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) {
          bossVariationsFound.push(`Body: ${v.name}`);
          return false;
        }
        if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) {
          bossVariationsFound.push(`Trait: ${v.name}`);
          return false;
        }
        return true;
      });

      if (bossVariationsFound.length > 0 && range.chapter === 1) {
        console.log(`Chapter ${range.chapter}: Filtered out ${bossVariationsFound.length} boss variations:`, bossVariationsFound);
      }

      // Sort all eligible missing variations by rarity (rarest first)
      const sortedMissingVariations = eligibleMissingVariations
        .sort((a, b) => a.count - b.count);

      // Create dynamic tiers based on how many variations we have
      const availableCount = sortedMissingVariations.length;
      const tiers = generateDynamicTiers(Math.min(availableCount, 80)); // Cap at 80 for distribution

      // Track tier indices for round-robin
      const tierIndices = tiers.map(() => 0);

      // Get all global variations for potential filling (excluding boss variations)
      const allAvailableVariations: VariationCount[] = [];
      Object.entries(globalCounts).forEach(([name, data]) => {
        const isBoss = (data.type === 'head' && BOSS_VARIATIONS.heads.has(name)) ||
                      (data.type === 'body' && BOSS_VARIATIONS.bodies.has(name)) ||
                      (data.type === 'trait' && BOSS_VARIATIONS.traits.has(name));

        if (!isBoss) {
          allAvailableVariations.push({
            name,
            count: data.count,
            type: data.type,
            percentage: (data.count / 4000) * 100
          });
        }
      });

      // Sort all available variations by global rarity for filling
      allAvailableVariations.sort((a, b) => a.count - b.count);

      // Track all variations used across the chapter
      const usedInChapter = new Set<string>();

      // Apply distribution strategy based on chapter
      const eventEssenceDistribution = [];

      // Special handling for Chapter 10: Prioritize true global rarity
      if (range.chapter === 10) {
        // Helper to determine tier name based on global count
        function getTierName(count: number): string {
          if (count <= 5) return 'ULTRA RARE';
          if (count <= 15) return 'VERY RARE';
          if (count <= 30) return 'RARE';
          return 'UNCOMMON';
        }

        // Create a pool of variations to use (80 total needed)
        const variationPool: Array<VariationCount & { isFilled?: boolean; tierName?: string }> = [];
        const usedVariationNames = new Set<string>();

        // First, add all available native variations from this chapter (sorted by rarity)
        sortedMissingVariations.forEach(v => {
          variationPool.push({
            ...v,
            isFilled: false,
            tierName: getTierName(v.count)
          });
          usedVariationNames.add(v.name);
        });

        const nativeCount = variationPool.length;

        // Then add borrowed variations to reach 80 total
        const neededTotal = 80;
        let borrowedCount = 0;

        for (const fillVariation of allAvailableVariations) {
          if (variationPool.length >= neededTotal) break;

          // Don't duplicate variations already in the pool
          if (!usedVariationNames.has(fillVariation.name)) {
            variationPool.push({
              ...fillVariation,
              isFilled: true,
              tierName: getTierName(fillVariation.count)
            });
            usedVariationNames.add(fillVariation.name);
            borrowedCount++;
          }
        }

        console.log(`Chapter 10: Using ${nativeCount} native variations + ${borrowedCount} borrowed = ${variationPool.length} total`);

        // Show the rarest variations for debugging
        console.log(`Chapter 10 rarest variations (for Event 20):`,
          variationPool.slice(0, 4).map(v => `${v.name} (${v.count}x, ${v.isFilled ? 'borrowed' : 'native'})`));

        // Distribute variations progressively across events
        // The pool is already sorted by rarity (rarest first)
        // We'll reverse it so the most common are first, then assign progressively
        const reversedPool = [...variationPool].reverse();

        for (let eventIdx = 0; eventIdx < 20; eventIdx++) {
          const essences: Array<VariationCount & { isFilled?: boolean; tierName?: string }> = [];

          // Calculate which 4 variations this event gets
          // Event 1 gets indices 0-3 (most common)
          // Event 2 gets indices 4-7
          // ...
          // Event 20 gets indices 76-79 (rarest)
          const startIdx = eventIdx * 4;

          for (let i = 0; i < 4; i++) {
            const idx = startIdx + i;
            if (idx < reversedPool.length) {
              essences.push(reversedPool[idx]);
            } else {
              // This shouldn't happen since we ensured 80 variations
              console.error(`Event ${eventIdx + 1}: Missing variation at index ${idx}`);
            }
          }

          // For Event 20, reverse the essences to show rarest first
          if (eventIdx === 19) {
            essences.reverse();
          }

          eventEssenceDistribution.push({
            eventNumber: eventIdx + 1 + (range.chapter - 1) * 20,
            essences,
            tiers: tiers
          });
        }

        // Verify all events have 4 essences
        const emptyEvents = eventEssenceDistribution.filter(e => e.essences.length !== 4);
        if (emptyEvents.length > 0) {
          console.error(`Chapter 10: Events with missing essences:`,
            emptyEvents.map(e => `Event ${(e.eventNumber - 1) % 20 + 1} (${e.essences.length} essences)`));
        } else {
          console.log(`Chapter 10: ✓ All 20 events have 4 essences each`);
        }
      } else {
        // For other chapters, use the round-robin greedy approach
        for (let eventIdx = 0; eventIdx < 20; eventIdx++) {
          const essences: Array<VariationCount & { isFilled?: boolean; tierName?: string }> = [];

          // Try to get one variation from each tier
          tiers.forEach((tier, tierIdx) => {
            const currentIndex = tier.start + tierIndices[tierIdx];

            if (currentIndex < tier.end && currentIndex < sortedMissingVariations.length) {
              // We have a variation available in this tier
              const variation = sortedMissingVariations[currentIndex];
              if (!usedInChapter.has(variation.name)) {
                essences.push({
                  ...variation,
                  isFilled: false,
                  tierName: tier.name
                });
                usedInChapter.add(variation.name);
                tierIndices[tierIdx]++; // Move to next variation in this tier
              } else {
                // Shouldn't happen, but handle it
                const fillVariation = findUnusedVariation();
                if (fillVariation) {
                  essences.push({
                    ...fillVariation,
                    isFilled: true,
                    tierName: tier.name
                  });
                }
              }
            } else {
              // This tier is exhausted, need to borrow
              const fillVariation = findUnusedVariation();
              if (fillVariation) {
                essences.push({
                  ...fillVariation,
                  isFilled: true,
                  tierName: tier.name
              });
            }
          }
        });

        // Helper function to find an unused variation for filling
        function findUnusedVariation() {
          for (const variation of allAvailableVariations) {
            if (!usedInChapter.has(variation.name)) {
              usedInChapter.add(variation.name);
              return variation;
            }
          }
          return null;
        }

        // Safety: ensure we have exactly 4 essences
        while (essences.length < 4) {
          const fillVariation = findUnusedVariation();
          if (fillVariation) {
            essences.push({
              ...fillVariation,
              isFilled: true,
              tierName: 'FILL'
            });
          } else {
            break; // No more variations available
          }
        }

        eventEssenceDistribution.push({
          eventNumber: eventIdx + 1 + (range.chapter - 1) * 20,
          essences,
          tiers: tiers // Include tier info for visualization
        });
      }
    }

      newDistributions.push({
        chapter: range.chapter,
        totalMeks,
        headVariations,
        bodyVariations,
        traitVariations,
        allVariationsSorted,
        missingVariations: missingVariations.sort((a, b) => a.count - b.count), // All missing variations sorted by rarity
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

          {/* Missing Variations List */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              Variations NOT in Chapter {selectedChapter} (Ordered by Global Rarity)
            </h4>
            <div className="text-xs text-gray-400 mb-3">
              These {currentChapter.missingVariations.length} variations don't appear in this chapter's 400 meks. Listed from rarest to most common globally.
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              <div>
                <h5 className="text-xs font-bold text-blue-400 mb-2 sticky top-0 bg-gray-800/30 pb-1">
                  Missing Heads ({currentChapter.missingVariations.filter(v => v.type === 'head').length})
                </h5>
                <div className="space-y-1">
                  {currentChapter.missingVariations.filter(v => v.type === 'head').map((variation, i) => {
                    const isBossVariation = BOSS_VARIATIONS.heads.has(variation.name);
                    return (
                      <div key={i} className={`flex justify-between text-xs ${isBossVariation ? 'opacity-40' : ''}`}>
                        <span
                          className={`truncate ${isBossVariation ? 'text-gray-600 line-through' : 'text-gray-400'}`}
                          title={`${variation.name}${isBossVariation ? ' (Boss - Not Available)' : ''}`}
                        >
                          {i + 1}. {variation.name}
                          {isBossVariation && <span className="text-red-500 ml-1">(Boss)</span>}
                        </span>
                        <span className={isBossVariation ? 'text-blue-400/40 ml-2' : 'text-blue-400 ml-2'}>
                          {variation.count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-green-400 mb-2 sticky top-0 bg-gray-800/30 pb-1">
                  Missing Bodies ({currentChapter.missingVariations.filter(v => v.type === 'body').length})
                </h5>
                <div className="space-y-1">
                  {currentChapter.missingVariations.filter(v => v.type === 'body').map((variation, i) => {
                    const isBossVariation = BOSS_VARIATIONS.bodies.has(variation.name);
                    return (
                      <div key={i} className={`flex justify-between text-xs ${isBossVariation ? 'opacity-40' : ''}`}>
                        <span
                          className={`truncate ${isBossVariation ? 'text-gray-600 line-through' : 'text-gray-400'}`}
                          title={`${variation.name}${isBossVariation ? ' (Boss - Not Available)' : ''}`}
                        >
                          {i + 1}. {variation.name}
                          {isBossVariation && <span className="text-red-500 ml-1">(Boss)</span>}
                        </span>
                        <span className={isBossVariation ? 'text-green-400/40 ml-2' : 'text-green-400 ml-2'}>
                          {variation.count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-purple-400 mb-2 sticky top-0 bg-gray-800/30 pb-1">
                  Missing Traits ({currentChapter.missingVariations.filter(v => v.type === 'trait').length})
                </h5>
                <div className="space-y-1">
                  {currentChapter.missingVariations.filter(v => v.type === 'trait').map((variation, i) => {
                    const isBossVariation = BOSS_VARIATIONS.traits.has(variation.name);
                    return (
                      <div key={i} className={`flex justify-between text-xs ${isBossVariation ? 'opacity-40' : ''}`}>
                        <span
                          className={`truncate ${isBossVariation ? 'text-gray-600 line-through' : 'text-gray-400'}`}
                          title={`${variation.name}${isBossVariation ? ' (Boss - Not Available)' : ''}`}
                        >
                          {i + 1}. {variation.name}
                          {isBossVariation && <span className="text-red-500 ml-1">(Boss)</span>}
                        </span>
                        <span className={isBossVariation ? 'text-purple-400/40 ml-2' : 'text-purple-400 ml-2'}>
                          {variation.count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div>Total Missing: {currentChapter.missingVariations.length} variations</div>
                  <div>Boss Variations (crossed out): Not available for events</div>
                </div>
                <div>
                  <div>Rarest Eligible: {currentChapter.missingVariations.find(v => {
                    if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
                    if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
                    if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
                    return true;
                  })?.name || 'N/A'}</div>
                  <div>Used for Events: Top 80 rarest (excluding boss variations)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Tier System Visualization */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              🎯 Dynamic Tier System (Round-Robin Greedy)
            </h4>
            <div className="text-xs text-gray-400 mb-4">
              Chapter {selectedChapter} has {currentChapter.missingVariations.filter(v => {
                if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
                if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
                if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
                return true;
              }).length} missing variations (excluding boss).
              These are divided into 4 dynamic tiers for balanced distribution.
            </div>

            {/* Dynamic Tier Visualization */}
            {currentChapter.eventEssenceDistribution[0] && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {generateDynamicTiers(Math.min(
                  currentChapter.missingVariations.filter(v => {
                    if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
                    if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
                    if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
                    return true;
                  }).length,
                  80
                )).map((tier, idx) => {
                  const colors = [
                    'bg-red-500/10 border-red-500/30 text-red-400',
                    'bg-orange-500/10 border-orange-500/30 text-orange-400',
                    'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                    'bg-green-500/10 border-green-500/30 text-green-400'
                  ];
                  const tierSize = tier.end - tier.start;

                  return (
                    <div key={idx} className={`${colors[idx].split(' ').slice(0, 2).join(' ')} border rounded p-3`}>
                      <div className={`font-bold text-sm mb-1 ${colors[idx].split(' ')[2]}`}>
                        {tier.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Variations {tier.start + 1}-{tier.end}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tierSize} variation{tierSize !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Distribution Explanation */}
            <div className="bg-black/30 rounded p-3 mb-3">
              <div className="text-xs font-bold text-purple-400 mb-2">How it works:</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Each event gets one variation from each tier (round-robin)</div>
                <div>• All available variations are used before any borrowing</div>
                <div>• When a tier runs out, variations are borrowed from the global pool</div>
                <div>• Ensures balanced rarity distribution across all 20 events</div>
              </div>
            </div>
          </div>

          {/* Round-Robin Event Essence Distribution */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-500/80 mb-3">
              Event Essence Distribution (Dynamic Round-Robin)
            </h4>
            <div className="text-xs text-gray-400 mb-3">
              Each event gets 4 essences: one from each dynamic tier. Borrowed essences (when tier is exhausted) are marked with ⚠️.
            </div>
            <div className="grid grid-cols-4 gap-3">
              {currentChapter.eventEssenceDistribution.map((event: any, eventIdx) => {
                const tierColors: Record<string, string> = {
                  'ULTRA RARE': 'text-red-400',
                  'VERY RARE': 'text-orange-400',
                  'RARE': 'text-yellow-400',
                  'UNCOMMON': 'text-green-400',
                  'FILL': 'text-gray-400'
                };
                const tierAbbrev: Record<string, string> = {
                  'ULTRA RARE': 'ULTRA',
                  'VERY RARE': 'VERY',
                  'RARE': 'RARE',
                  'UNCOMMON': 'UNCOM',
                  'FILL': 'FILL'
                };

                return (
                  <div key={event.eventNumber} className="bg-black/30 rounded p-2 border border-purple-500/20">
                    <div className="font-bold text-purple-400 mb-1">
                      Event {(event.eventNumber - 1) % 20 + 1}
                    </div>
                    <div className="space-y-0.5">
                      {event.essences.map((essence: any, idx: number) => {
                        const tierName = essence.tierName || 'FILL';
                        const tierColor = tierColors[tierName] || 'text-gray-400';
                        const abbrev = tierAbbrev[tierName] || 'FILL';

                        return (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className={`${tierColor} text-[10px] font-bold`}>
                              {abbrev}:
                            </span>
                            <span className={`truncate ml-1 ${
                              essence.type === 'head' ? 'text-blue-400' :
                              essence.type === 'body' ? 'text-green-400' :
                              'text-purple-400'
                            }`} title={`${essence.name} (${essence.count} total)`}>
                              {essence.isFilled && '⚠️ '}
                              {essence.name} ({essence.count})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-500 mb-1">Dynamic Tiers:</div>
                  <div className="space-y-0.5 text-[10px]">
                    <div><span className="text-red-400">ULTRA</span> = Tier 1 (Rarest)</div>
                    <div><span className="text-orange-400">VERY</span> = Tier 2</div>
                    <div><span className="text-yellow-400">RARE</span> = Tier 3</div>
                    <div><span className="text-green-400">UNCOM</span> = Tier 4 (Most Common)</div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Symbols:</div>
                  <div className="space-y-0.5 text-[10px]">
                    <div>⚠️ = Borrowed essence (tier exhausted)</div>
                    <div className="text-blue-400">Blue = Head variation</div>
                    <div className="text-green-400">Green = Body variation</div>
                    <div className="text-purple-400">Purple = Trait variation</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <div>Chapter {selectedChapter} Distribution:</div>
                <div className="text-[10px] mt-1">
                  • Available: {currentChapter.missingVariations.filter(v => {
                    if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
                    if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
                    if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
                    return true;
                  }).length} variations
                  • Needed: 80 (4 per event × 20 events)
                  • Borrowed: {Math.max(0, 80 - currentChapter.missingVariations.filter(v => {
                    if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
                    if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
                    if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
                    return true;
                  }).length)} variations
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}