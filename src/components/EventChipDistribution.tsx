'use client';

import React, { useState, useEffect } from 'react';

// Chip modifiers in order of rarity
const MODIFIERS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X', 'XX', 'XXX'] as const;
type Modifier = typeof MODIFIERS[number];

// Colors for each modifier (EXACT colors from rarity bias chart)
const MODIFIER_COLORS: Record<Modifier, string> = {
  'D': '#999999',
  'C': '#90EE90',
  'B': '#87CEEB',
  'A': '#FFF700',
  'S': '#FFB6C1',
  'SS': '#DA70D6',
  'SSS': '#9370DB',
  'X': '#FF8C00',
  'XX': '#DC143C',
  'XXX': '#8B0000'
};

// 10 Distribution Types with varied probability spreads
type DistributionType = {
  name: string;
  probabilities: [number, number, number, number];
  description: string;
};

const DISTRIBUTION_TYPES: DistributionType[] = [
  { name: 'Lottery', probabilities: [80, 15, 4, 1], description: 'Wide spread' },
  { name: 'Standard', probabilities: [75, 20, 4, 1], description: 'Balanced' },
  { name: 'Gambler', probabilities: [50, 30, 15, 5], description: 'Moderate spread' },
  { name: 'Even Stevens', probabilities: [40, 30, 20, 10], description: 'Narrow spread' },
  { name: 'All or Nothing', probabilities: [90, 7, 2, 1], description: 'Extreme spread' },
  { name: 'Top Heavy', probabilities: [60, 35, 4, 1], description: 'Narrow top, wide bottom' },
  { name: 'Bottom Heavy', probabilities: [45, 25, 20, 10], description: 'Wide top, narrow bottom' },
  { name: 'Double or Nothing', probabilities: [85, 10, 4.5, 0.5], description: 'Ultra extreme' },
  { name: 'Lucky Seven', probabilities: [70, 17, 7, 6], description: 'Close 3rd/4th' },
  { name: 'Cascade', probabilities: [55, 27, 13, 5], description: 'Perfect halving' }
];

// Scrambled pattern that repeats every 10 events (ensures variety)
const DISTRIBUTION_PATTERN = [
  4, // Even Stevens (narrow)
  5, // All or Nothing (extreme)
  3, // Gambler (moderate)
  8, // Double or Nothing (ultra extreme)
  7, // Bottom Heavy (mixed)
  2, // Standard (balanced)
  1, // Lottery (wide)
  9, // Lucky Seven (unusual)
  6, // Top Heavy (mixed)
  10 // Cascade (halving)
].map(n => n - 1); // Convert to 0-based index

// Tier colors match modifier colors for consistency
const TIER_COLORS = [
  '#999999', // Tier 1 - Gray (like D)
  '#90EE90', // Tier 2 - Light Green (like C)
  '#87CEEB', // Tier 3 - Sky Blue (like B)
  '#FFF700', // Tier 4 - Yellow (like A)
  '#FFB6C1', // Tier 5 - Light Pink (like S)
  '#DA70D6', // Tier 6 - Orchid (like SS)
  '#9370DB', // Tier 7 - Medium Purple (like SSS)
  '#FF8C00', // Tier 8 - Dark Orange (like X)
  '#DC143C', // Tier 9 - Crimson (like XX)
  '#8B0000', // Tier 10 - Dark Red (like XXX)
];

interface ChipReward {
  tier: number;
  modifier: Modifier;
  probability: number; // percentage
}

interface EventChips {
  eventNumber: number;
  chapterNumber: number;
  rewards: ChipReward[];
  distributionType?: string;
}

// Tier threshold gates - defines max tier for each event range
const TIER_THRESHOLDS = [
  { eventRange: [1, 20], maxTier: 2 },
  { eventRange: [21, 40], maxTier: 3 },
  { eventRange: [41, 60], maxTier: 4 },
  { eventRange: [61, 100], maxTier: 5 },
  { eventRange: [101, 140], maxTier: 6 },
  { eventRange: [141, 170], maxTier: 7 },
  { eventRange: [171, 190], maxTier: 8 },
  { eventRange: [191, 199], maxTier: 9 },
  { eventRange: [200, 200], maxTier: 10 }
];

// Get max tier for a given event number
function getMaxTierForEvent(eventNumber: number): number {
  for (const threshold of TIER_THRESHOLDS) {
    if (eventNumber >= threshold.eventRange[0] && eventNumber <= threshold.eventRange[1]) {
      return threshold.maxTier;
    }
  }
  return 2; // Default fallback
}

// Calculate chip distribution for all 200 events
function calculateChipDistribution(): EventChips[] {
  const events: EventChips[] = [];

  for (let chapter = 1; chapter <= 10; chapter++) {
    for (let eventInChapter = 1; eventInChapter <= 20; eventInChapter++) {
      const globalEventNumber = (chapter - 1) * 20 + eventInChapter;

      // Get the distribution type for this event
      // Event 20 of each chapter ALWAYS uses Double or Nothing
      let distribution: DistributionType;
      if (eventInChapter === 20) {
        distribution = DISTRIBUTION_TYPES[7]; // Double or Nothing is at index 7
      } else {
        const distributionIndex = DISTRIBUTION_PATTERN[(eventInChapter - 1) % 10];
        distribution = DISTRIBUTION_TYPES[distributionIndex];
      }

      // Get max tier for this event
      const maxTier = getMaxTierForEvent(globalEventNumber);

      // Calculate base tier with proper progression for each chapter
      let chapterBaseTier: number;
      let baseModifierOffset: number; // How many modifiers to skip (0=D, 1=C, 2=B, etc.)

      switch(chapter) {
        case 1:
          chapterBaseTier = 1;
          baseModifierOffset = 0; // Start at D
          break;
        case 2:
          chapterBaseTier = 1;
          baseModifierOffset = 1; // Start at C (one better than Ch1)
          break;
        case 3:
          chapterBaseTier = 2;
          baseModifierOffset = 0; // New tier, reset to D
          break;
        case 4:
          chapterBaseTier = 3;
          baseModifierOffset = 0; // New tier, reset to D
          break;
        case 5:
          chapterBaseTier = 4;
          baseModifierOffset = 0; // New tier, reset to D
          break;
        case 6:
          chapterBaseTier = 5;
          baseModifierOffset = 0; // T5 D start
          break;
        case 7:
          chapterBaseTier = 5;
          baseModifierOffset = 2; // T5 B start (skip D and C)
          break;
        case 8:
          chapterBaseTier = 6;
          baseModifierOffset = 0; // T6 D start
          break;
        case 9:
          chapterBaseTier = 6;
          baseModifierOffset = 3; // T6 A start (skip D, C, B)
          break;
        case 10:
          chapterBaseTier = 8;
          baseModifierOffset = 0; // T8 D start (big jump)
          break;
        default:
          chapterBaseTier = 1;
          baseModifierOffset = 0;
      }

      // Add progression within the chapter (more aggressive for later chapters)
      const withinChapterProgress = (eventInChapter - 1) / 19; // 0 to 1 across chapter
      const tierBoost = chapter > 5
        ? Math.floor(withinChapterProgress * 2) // Later chapters can boost 0-2 tiers
        : Math.floor(withinChapterProgress); // Early chapters boost 0-1 tier

      // Calculate final base tier
      const uncappedBaseTier = chapterBaseTier + tierBoost;
      const baseTier = Math.min(uncappedBaseTier, maxTier - 1); // Leave room for tier jumps

      // Event progress within chapter (0.0 to 1.0)
      const eventProgress = ((globalEventNumber - 1) % 20) / 19; // 0 at event 1, 1 at event 20

      // Calculate spread factor to determine reward gaps
      const spreadFactor = distribution.probabilities[0] / distribution.probabilities[3];

      // Define the 4 reward slots based on distribution and spread
      const rewards: ChipReward[] = [];

      // Helper: get modifier based on progression (0-6 range, no X/XX/XXX)
      const getModifier = (baseIndex: number): Modifier => {
        const index = Math.min(Math.max(0, Math.floor(baseIndex)), 6); // Cap at SSS (index 6)
        return MODIFIERS[index];
      };

      // Helper: calculate probability-based bonus
      const getProbabilityBonus = (probability: number): number => {
        if (probability >= 10) return 0;      // 10%+ = no bonus
        if (probability >= 5) return 1;       // 5-9% = +1 modifier
        if (probability >= 1) return 2;       // 1-4% = +2 modifiers
        return 3;                             // <1% = +3 modifiers
      };

      // Slot 1 - Most common reward (applies baseModifierOffset)
      const slot1Prob = distribution.probabilities[0];
      const slot1Bonus = getProbabilityBonus(slot1Prob);

      if (spreadFactor > 50) {
        // Very wide spread: lowest tier, lowest modifier
        const modIndex = baseModifierOffset + Math.floor(eventProgress * 2) + slot1Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot1Prob
        });
      } else if (spreadFactor > 20) {
        // Wide spread: base tier, slightly better modifier
        const modIndex = baseModifierOffset + Math.floor(eventProgress * 3) + slot1Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot1Prob
        });
      } else {
        // Narrow spread: base tier, applies offset
        const modIndex = baseModifierOffset + Math.floor(eventProgress * 3) + slot1Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot1Prob
        });
      }

      // Slot 2 - Uncommon reward (applies offset + boost)
      const slot2Prob = distribution.probabilities[1];
      const slot2Bonus = getProbabilityBonus(slot2Prob);

      if (spreadFactor > 80) {
        // Ultra wide spread (like All or Nothing): needs big jump to be worth the low probability
        const modIndex = baseModifierOffset + 4 + Math.floor(eventProgress * 2) + slot2Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot2Prob
        });
      } else if (spreadFactor > 50) {
        // Very wide spread: significant modifier jump
        const modIndex = baseModifierOffset + 3 + Math.floor(eventProgress * 3) + slot2Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot2Prob
        });
      } else if (spreadFactor > 20) {
        // Wide spread: same tier, good modifier
        const modIndex = baseModifierOffset + 2 + Math.floor(eventProgress * 3) + slot2Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot2Prob
        });
      } else {
        // Narrow spread: same tier, one step better than slot 1
        const modIndex = baseModifierOffset + 1 + Math.floor(eventProgress * 3) + slot2Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot2Prob
        });
      }

      // Slot 3 - Rare reward
      const slot3Prob = distribution.probabilities[2];
      const slot3Bonus = getProbabilityBonus(slot3Prob);

      if (spreadFactor > 80) {
        // Ultra wide spread: can jump tier if allowed, excellent modifier
        const tierJump = baseTier < maxTier ? 1 : 0;
        const modIndex = tierJump > 0
          ? 3 + Math.floor(eventProgress * 2) + slot3Bonus  // Tier jump but keep bonus
          : baseModifierOffset + 5 + Math.floor(eventProgress) + slot3Bonus;
        rewards.push({
          tier: Math.min(baseTier + tierJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot3Prob
        });
      } else if (spreadFactor > 50) {
        // Very wide spread: can jump tier if allowed
        const tierJump = baseTier < maxTier ? 1 : 0;
        const modIndex = tierJump > 0
          ? 2 + Math.floor(eventProgress * 2) + slot3Bonus  // Tier jump but keep bonus
          : baseModifierOffset + 4 + Math.floor(eventProgress * 2) + slot3Bonus;
        rewards.push({
          tier: Math.min(baseTier + tierJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot3Prob
        });
      } else if (spreadFactor > 20) {
        // Wide spread: maybe jump tier, good modifier
        const tierJump = (eventProgress > 0.5 && baseTier < maxTier) ? 1 : 0;
        const modIndex = tierJump > 0
          ? 1 + Math.floor(eventProgress * 2) + slot3Bonus  // Tier jump but keep bonus
          : baseModifierOffset + 3 + Math.floor(eventProgress * 2) + slot3Bonus;
        rewards.push({
          tier: Math.min(baseTier + tierJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot3Prob
        });
      } else {
        // Narrow spread: same tier, two steps better than slot 1
        const modIndex = baseModifierOffset + 2 + Math.floor(eventProgress * 3) + slot3Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot3Prob
        });
      }

      // Slot 4 - Legendary reward (respects tier caps AND progression)
      const slot4Prob = distribution.probabilities[3];
      const slot4Bonus = getProbabilityBonus(slot4Prob);

      if (globalEventNumber === 200) {
        // Final event always gets Tier 10 SSS as legendary!
        rewards.push({
          tier: 10,
          modifier: 'SSS',
          probability: slot4Prob
        });
      } else if (spreadFactor > 100) {
        // Extreme spread (Double or Nothing): maximum rewards
        const maxJump = Math.min(2, maxTier - baseTier);
        // With 0.5% probability, this gets +3 bonus
        const modIndex = maxJump > 1
          ? 4 + Math.floor(eventProgress * 2) + slot4Bonus
          : baseModifierOffset + 6;  // Already at cap
        rewards.push({
          tier: Math.min(baseTier + maxJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot4Prob
        });
      } else if (spreadFactor > 80) {
        // Ultra wide spread (All or Nothing): tier jump + excellent modifier
        const maxJump = Math.min(2, maxTier - baseTier);
        const modIndex = maxJump > 0
          ? 4 + Math.floor(eventProgress * 2) + slot4Bonus
          : baseModifierOffset + 6;  // Already at cap
        rewards.push({
          tier: Math.min(baseTier + maxJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot4Prob
        });
      } else if (spreadFactor > 50) {
        // Very wide spread: moderate tier jump if allowed
        const maxJump = Math.min(1, maxTier - baseTier);
        const modIndex = maxJump > 0
          ? 4 + Math.floor(eventProgress * 2) + slot4Bonus
          : baseModifierOffset + 6;  // Cap at SSS
        rewards.push({
          tier: Math.min(baseTier + maxJump, maxTier),
          modifier: getModifier(modIndex),
          probability: slot4Prob
        });
      } else if (spreadFactor > 20) {
        // Wide spread: small tier jump or good modifier
        const canJump = baseTier < maxTier && eventProgress > 0.7;
        const tierBonus = canJump ? 1 : 0;
        const modIndex = tierBonus > 0
          ? 3 + Math.floor(eventProgress * 3) + slot4Bonus
          : baseModifierOffset + 4 + Math.floor(eventProgress * 3) + slot4Bonus;
        rewards.push({
          tier: Math.min(baseTier + tierBonus, maxTier),
          modifier: getModifier(modIndex),
          probability: slot4Prob
        });
      } else {
        // Narrow spread: same tier, progression-based modifier
        const modIndex = baseModifierOffset + 3 + Math.floor(eventProgress * 3) + slot4Bonus;
        rewards.push({
          tier: baseTier,
          modifier: getModifier(modIndex),
          probability: slot4Prob
        });
      }

      events.push({
        eventNumber: globalEventNumber,
        chapterNumber: chapter,
        rewards,
        distributionType: distribution.name // Store for display
      });
    }
  }

  return events;
}

export default function EventChipDistribution() {
  const [distributions, setDistributions] = useState<EventChips[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('detail');

  useEffect(() => {
    setDistributions(calculateChipDistribution());
  }, []);

  const currentChapterEvents = distributions.filter(d => d.chapterNumber === selectedChapter);

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-500">Universal Chip Distribution by Chapter</h3>
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
                <th className="text-left py-2">Base Tier</th>
                <th className="text-left py-2">Common Reward (75%)</th>
                <th className="text-left py-2">Uncommon (20%)</th>
                <th className="text-left py-2">Rare (4%)</th>
                <th className="text-left py-2">Legendary (1%)</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(chapter => {
                const firstEvent = distributions.find(d => d.chapterNumber === chapter && d.eventNumber === (chapter - 1) * 20 + 1);
                const lastEvent = distributions.find(d => d.chapterNumber === chapter && d.eventNumber === chapter * 20);

                if (!firstEvent || !lastEvent) return null;

                return (
                  <tr key={chapter} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="py-2 font-bold text-yellow-500">Chapter {chapter}</td>
                    <td className="py-2">
                      <span style={{ color: TIER_COLORS[firstEvent.rewards[0].tier - 1] }}>
                        Tier {firstEvent.rewards[0].tier}
                      </span>
                    </td>
                    <td className="py-2">
                      <span style={{ color: TIER_COLORS[firstEvent.rewards[0].tier - 1] }}>
                        T{firstEvent.rewards[0].tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[firstEvent.rewards[0].modifier] }} className="ml-1">
                        {firstEvent.rewards[0].modifier}
                      </span>
                      {' → '}
                      <span style={{ color: TIER_COLORS[lastEvent.rewards[0].tier - 1] }}>
                        T{lastEvent.rewards[0].tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[lastEvent.rewards[0].modifier] }} className="ml-1">
                        {lastEvent.rewards[0].modifier}
                      </span>
                    </td>
                    <td className="py-2">
                      <span style={{ color: TIER_COLORS[lastEvent.rewards[1].tier - 1] }}>
                        T{lastEvent.rewards[1].tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[lastEvent.rewards[1].modifier] }} className="ml-1">
                        {lastEvent.rewards[1].modifier}
                      </span>
                    </td>
                    <td className="py-2">
                      <span style={{ color: TIER_COLORS[lastEvent.rewards[2].tier - 1] }}>
                        T{lastEvent.rewards[2].tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[lastEvent.rewards[2].modifier] }} className="ml-1">
                        {lastEvent.rewards[2].modifier}
                      </span>
                    </td>
                    <td className="py-2">
                      <span style={{ color: TIER_COLORS[lastEvent.rewards[3].tier - 1] }}>
                        T{lastEvent.rewards[3].tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[lastEvent.rewards[3].modifier] }} className="ml-1 font-bold">
                        {lastEvent.rewards[3].modifier}
                      </span>
                      {chapter === 10 && ' 🏆'}
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
        <h3 className="text-lg font-bold text-yellow-500">Chapter {selectedChapter} Chip Rewards</h3>
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

      {/* Event Grid */}
      <div className="grid grid-cols-4 gap-3">
        {currentChapterEvents.map(event => (
          <div key={event.eventNumber} className="bg-black/30 rounded p-3 border border-purple-500/20">
            <div className="font-bold text-purple-400 mb-1">
              Event {(event.eventNumber - 1) % 20 + 1}
            </div>
            <div className="text-[10px] text-gray-500 mb-2">
              {event.distributionType}
            </div>
            <div className="space-y-1">
              {event.rewards.map((reward, idx) => {
                // Color based on actual probability value
                const getProbColor = (prob: number) => {
                  if (prob >= 70) return 'text-gray-400';
                  if (prob >= 25) return 'text-green-400';
                  if (prob >= 10) return 'text-blue-400';
                  if (prob >= 5) return 'text-purple-400';
                  return 'text-yellow-400';
                };

                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className={getProbColor(reward.probability) + ' text-[10px] w-10'}>
                      {reward.probability}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span style={{ color: TIER_COLORS[reward.tier - 1] }} className="font-bold">
                        T{reward.tier}
                      </span>
                      <span style={{ color: MODIFIER_COLORS[reward.modifier] }} className="font-bold">
                        {reward.modifier}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-500/80 mb-3">Universal Chip System</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-gray-500 mb-2">Tiers (1-10):</div>
            <div className="flex flex-wrap gap-2">
              {TIER_COLORS.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-gray-400">T{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-2">Modifiers (D-XXX):</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MODIFIER_COLORS).map(([mod, color]) => (
                <div key={mod} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-gray-400">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          <div>• Higher tiers = more powerful chips</div>
          <div>• Better modifiers = enhanced effects within the tier</div>
          <div>• Tier X SSS ≈ Tier X+1 D (crossover point)</div>
          <div>• Event 20 of Chapter 10 has the ultimate reward: Tier 10 SSS!</div>
        </div>
      </div>
    </div>
  );
}