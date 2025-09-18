// Difficulty modifiers calculation engine

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  difficulty: DifficultyLevel;
  successGreenLine: number;
  goldMultiplier: number;
  xpMultiplier: number;
  essenceAmountMultiplier: number;
  minSlots: number;
  maxSlots: number;
  singleSlotChance: number;
  deploymentFeeMultiplier: number;
  commonEssenceBoost: number;
  rareEssencePenalty: number;
  overshootBonusRate: number;
  maxOvershootBonus: number;
  colorTheme: string;
  displayName: string;
  description?: string;
}

export interface BaseRewards {
  gold: number;
  xp: number;
  essences?: {
    type: string;
    baseChance: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  }[];
}

export interface CalculatedRewards {
  gold: number;
  xp: number;
  essences?: {
    type: string;
    adjustedChance: number;
    amount: number;
    rarity: string;
  }[];
  overshootBonus: number;
  successStatus: 'guaranteed' | 'risky' | 'failed';
  deploymentFee: number;
}

/**
 * Calculate the number of Mek slots for a mission based on difficulty
 */
export function calculateMekSlots(config: DifficultyConfig): number {
  // For easy mode, check if it should be single slot
  if (config.difficulty === 'easy' && config.singleSlotChance > 0) {
    const roll = Math.random() * 100;
    if (roll < config.singleSlotChance) {
      return 1; // 75% chance for single slot on easy
    }
  }

  // Otherwise, random between min and max
  const range = config.maxSlots - config.minSlots;
  return config.minSlots + Math.floor(Math.random() * (range + 1));
}

/**
 * Calculate overshoot bonus based on success percentage over green line
 */
export function calculateOvershootBonus(
  successPercentage: number,
  config: DifficultyConfig
): number {
  if (successPercentage <= config.successGreenLine) {
    return 0; // No bonus if below or at green line
  }

  const overshoot = successPercentage - config.successGreenLine;
  const bonus = overshoot * config.overshootBonusRate;

  // Cap at maximum overshoot bonus
  return Math.min(bonus, config.maxOvershootBonus);
}

/**
 * Adjust essence drop chances based on difficulty
 */
export function adjustEssenceChances(
  essences: BaseRewards['essences'],
  config: DifficultyConfig
): CalculatedRewards['essences'] {
  if (!essences || essences.length === 0) return [];

  // First, normalize all chances to sum to 100
  const totalChance = essences.reduce((sum, e) => sum + e.baseChance, 0);
  const normalized = essences.map(e => ({
    ...e,
    normalizedChance: (e.baseChance / totalChance) * 100,
  }));

  // Apply difficulty modifiers
  return normalized.map(essence => {
    let adjustedChance = essence.normalizedChance;

    // Apply boosts/penalties based on rarity
    if (essence.rarity === 'common' || essence.rarity === 'uncommon') {
      // Common essences get boosted in easy mode, penalized in hard
      adjustedChance = adjustedChance * (1 + config.commonEssenceBoost / 100);
    } else if (essence.rarity === 'rare' || essence.rarity === 'epic' || essence.rarity === 'legendary') {
      // Rare essences get penalized in easy mode, boosted in hard
      adjustedChance = adjustedChance * (1 + config.rareEssencePenalty / 100);
    }

    // Ensure chances stay within reasonable bounds
    adjustedChance = Math.max(0.1, Math.min(99, adjustedChance));

    return {
      type: essence.type,
      adjustedChance,
      amount: config.essenceAmountMultiplier,
      rarity: essence.rarity,
    };
  });
}

/**
 * Calculate all rewards based on difficulty and success percentage
 */
export function calculateRewards(
  baseRewards: BaseRewards,
  config: DifficultyConfig,
  successPercentage: number,
  baseDeploymentFee: number = 100
): CalculatedRewards {
  // Determine success status
  let successStatus: CalculatedRewards['successStatus'];
  if (successPercentage >= config.successGreenLine) {
    successStatus = 'guaranteed';
  } else if (successPercentage > 0) {
    successStatus = 'risky';
  } else {
    successStatus = 'failed';
  }

  // Calculate overshoot bonus
  const overshootBonus = calculateOvershootBonus(successPercentage, config);
  const overshootMultiplier = 1 + (overshootBonus / 100);

  // Calculate rewards
  const gold = baseRewards.gold * config.goldMultiplier * overshootMultiplier;
  const xp = baseRewards.xp * config.xpMultiplier * overshootMultiplier;

  // Adjust essence chances
  const essences = adjustEssenceChances(baseRewards.essences, config);

  // Calculate deployment fee
  const deploymentFee = baseDeploymentFee * config.deploymentFeeMultiplier;

  return {
    gold: Math.round(gold),
    xp: Math.round(xp),
    essences,
    overshootBonus,
    successStatus,
    deploymentFee: Math.round(deploymentFee),
  };
}

/**
 * Get color scheme for difficulty level
 */
export function getDifficultyColors(difficulty: DifficultyLevel): {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  text: string;
  glow: string;
} {
  switch (difficulty) {
    case 'easy':
      return {
        primary: 'rgb(34, 197, 94)', // green-500
        secondary: 'rgb(21, 128, 61)', // green-700
        background: 'rgba(34, 197, 94, 0.1)', // green-500/10
        border: 'rgba(34, 197, 94, 0.3)', // green-500/30
        text: 'rgb(134, 239, 172)', // green-300
        glow: 'rgba(34, 197, 94, 0.5)',
      };
    case 'medium':
      return {
        primary: 'rgb(234, 179, 8)', // yellow-500
        secondary: 'rgb(161, 98, 7)', // yellow-700
        background: 'rgba(234, 179, 8, 0.1)', // yellow-500/10
        border: 'rgba(234, 179, 8, 0.3)', // yellow-500/30
        text: 'rgb(253, 224, 71)', // yellow-300
        glow: 'rgba(234, 179, 8, 0.5)',
      };
    case 'hard':
      return {
        primary: 'rgb(239, 68, 68)', // red-500
        secondary: 'rgb(185, 28, 28)', // red-700
        background: 'rgba(239, 68, 68, 0.1)', // red-500/10
        border: 'rgba(239, 68, 68, 0.3)', // red-500/30
        text: 'rgb(252, 165, 165)', // red-300
        glow: 'rgba(239, 68, 68, 0.5)',
      };
  }
}

/**
 * Format success percentage with color based on green line
 */
export function formatSuccessDisplay(
  successPercentage: number,
  config: DifficultyConfig
): {
  text: string;
  color: string;
  status: string;
} {
  const percentage = Math.min(100, Math.max(0, successPercentage));

  if (percentage >= config.successGreenLine) {
    const overshoot = percentage - config.successGreenLine;
    return {
      text: `${percentage.toFixed(1)}%`,
      color: 'text-green-400',
      status: overshoot > 0 ? `+${overshoot.toFixed(0)}% bonus!` : 'Guaranteed Success!',
    };
  } else {
    const shortfall = config.successGreenLine - percentage;
    return {
      text: `${percentage.toFixed(1)}%`,
      color: percentage > config.successGreenLine * 0.5 ? 'text-yellow-400' : 'text-red-400',
      status: `${shortfall.toFixed(0)}% short of guarantee`,
    };
  }
}

/**
 * Calculate success percentage contribution from a single Mek
 */
export function calculateMekSuccessContribution(
  mekRank: number,
  difficulty: DifficultyLevel,
  baseSuccessRate: number // From Success buff configuration
): number {
  // Apply difficulty modifiers to Mek success contribution
  let modifier = 1;

  if (difficulty === 'easy') {
    // Boost success contribution on easy to help new players
    modifier = 1.5;
  } else if (difficulty === 'hard') {
    // Reduce success contribution on hard to require more/better Meks
    modifier = 0.75;
  }

  return baseSuccessRate * modifier;
}

/**
 * Generate preview text for rewards
 */
export function generateRewardPreview(
  baseRewards: BaseRewards,
  config: DifficultyConfig
): string[] {
  const preview = [];

  // Gold
  const minGold = Math.round(baseRewards.gold * config.goldMultiplier);
  const maxGold = Math.round(minGold * (1 + config.maxOvershootBonus / 100));
  preview.push(`Gold: ${minGold} - ${maxGold}`);

  // XP
  const minXP = Math.round(baseRewards.xp * config.xpMultiplier);
  const maxXP = Math.round(minXP * (1 + config.maxOvershootBonus / 100));
  preview.push(`XP: ${minXP} - ${maxXP}`);

  // Deployment fee
  const fee = Math.round(100 * config.deploymentFeeMultiplier);
  preview.push(`Entry: ${fee} gold`);

  // Success threshold
  preview.push(`Success: ${config.successGreenLine}%`);

  // Slots
  if (config.singleSlotChance > 0 && config.difficulty === 'easy') {
    preview.push(`Slots: 1 (${config.singleSlotChance}%) or ${config.maxSlots}`);
  } else {
    preview.push(`Slots: ${config.minSlots}-${config.maxSlots}`);
  }

  return preview;
}