// Chip reward calculation logic extracted from EventChipDistribution
// This allows us to reuse the calculation in multiple components

const MODIFIERS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
type Modifier = typeof MODIFIERS[number];

const MODIFIER_COLORS: Record<Modifier | 'X' | 'XX' | 'XXX', string> = {
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

export interface ChipReward {
  tier: number;
  modifier: Modifier;
  probability: number;
}

export interface EventChips {
  eventNumber: number;
  chapterNumber: number;
  rewards: ChipReward[];
  distributionType?: string;
}

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

const DISTRIBUTION_PATTERN = [3, 4, 2, 7, 6, 1, 0, 8, 5, 9]; // 0-based indices

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

function getMaxTierForEvent(eventNumber: number): number {
  for (const threshold of TIER_THRESHOLDS) {
    if (eventNumber >= threshold.eventRange[0] && eventNumber <= threshold.eventRange[1]) {
      return threshold.maxTier;
    }
  }
  return 2;
}

export function calculateChipRewardsForEvent(globalEventNumber: number): EventChips {
  const chapter = Math.ceil(globalEventNumber / 20);
  const eventInChapter = ((globalEventNumber - 1) % 20) + 1;

  // Get distribution type - Event 20 always uses Double or Nothing
  let distribution: DistributionType;
  if (eventInChapter === 20) {
    distribution = DISTRIBUTION_TYPES[7]; // Double or Nothing
  } else {
    const distributionIndex = DISTRIBUTION_PATTERN[(eventInChapter - 1) % 10];
    distribution = DISTRIBUTION_TYPES[distributionIndex];
  }

  const maxTier = getMaxTierForEvent(globalEventNumber);

  // Calculate base tier with proper progression for each chapter
  let chapterBaseTier: number;
  let baseModifierOffset: number;

  switch(chapter) {
    case 1:
      chapterBaseTier = 1;
      baseModifierOffset = 0;
      break;
    case 2:
      chapterBaseTier = 1;
      baseModifierOffset = 1;
      break;
    case 3:
      chapterBaseTier = 2;
      baseModifierOffset = 0;
      break;
    case 4:
      chapterBaseTier = 3;
      baseModifierOffset = 0;
      break;
    case 5:
      chapterBaseTier = 4;
      baseModifierOffset = 0;
      break;
    case 6:
      chapterBaseTier = 5;
      baseModifierOffset = 0;
      break;
    case 7:
      chapterBaseTier = 5;
      baseModifierOffset = 2;
      break;
    case 8:
      chapterBaseTier = 6;
      baseModifierOffset = 0;
      break;
    case 9:
      chapterBaseTier = 6;
      baseModifierOffset = 3;
      break;
    case 10:
      chapterBaseTier = 8;
      baseModifierOffset = 0;
      break;
    default:
      chapterBaseTier = 1;
      baseModifierOffset = 0;
  }

  const withinChapterProgress = (eventInChapter - 1) / 19;
  const tierBoost = chapter > 5
    ? Math.floor(withinChapterProgress * 2)
    : Math.floor(withinChapterProgress);

  const uncappedBaseTier = chapterBaseTier + tierBoost;
  const baseTier = Math.min(uncappedBaseTier, maxTier - 1);

  const eventProgress = ((globalEventNumber - 1) % 20) / 19;
  const spreadFactor = distribution.probabilities[0] / distribution.probabilities[3];

  const rewards: ChipReward[] = [];

  const getModifier = (baseIndex: number): Modifier => {
    const index = Math.min(Math.max(0, Math.floor(baseIndex)), 6);
    return MODIFIERS[index];
  };

  const getProbabilityBonus = (probability: number): number => {
    if (probability >= 10) return 0;
    if (probability >= 5) return 1;
    if (probability >= 1) return 2;
    return 3;
  };

  // Calculate all 4 reward slots (simplified version for display)
  const slot1Prob = distribution.probabilities[0];
  const slot1Bonus = getProbabilityBonus(slot1Prob);
  const modIndex1 = baseModifierOffset + Math.floor(eventProgress * 3) + slot1Bonus;
  rewards.push({
    tier: baseTier,
    modifier: getModifier(modIndex1),
    probability: slot1Prob
  });

  const slot2Prob = distribution.probabilities[1];
  const slot2Bonus = getProbabilityBonus(slot2Prob);
  const modIndex2 = baseModifierOffset + 1 + Math.floor(eventProgress * 3) + slot2Bonus;
  rewards.push({
    tier: baseTier,
    modifier: getModifier(modIndex2),
    probability: slot2Prob
  });

  const slot3Prob = distribution.probabilities[2];
  const slot3Bonus = getProbabilityBonus(slot3Prob);
  const modIndex3 = baseModifierOffset + 2 + Math.floor(eventProgress * 3) + slot3Bonus;
  rewards.push({
    tier: baseTier,
    modifier: getModifier(modIndex3),
    probability: slot3Prob
  });

  const slot4Prob = distribution.probabilities[3];
  const slot4Bonus = getProbabilityBonus(slot4Prob);

  if (globalEventNumber === 200) {
    rewards.push({
      tier: 10,
      modifier: 'SSS',
      probability: slot4Prob
    });
  } else {
    const modIndex4 = baseModifierOffset + 3 + Math.floor(eventProgress * 3) + slot4Bonus;
    rewards.push({
      tier: baseTier,
      modifier: getModifier(modIndex4),
      probability: slot4Prob
    });
  }

  return {
    eventNumber: globalEventNumber,
    chapterNumber: chapter,
    rewards,
    distributionType: distribution.name
  };
}

export { MODIFIER_COLORS, TIER_COLORS };