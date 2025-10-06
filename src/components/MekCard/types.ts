export interface MekAsset {
  assetId: string;
  policyId: string;
  assetName: string;
  imageUrl?: string;
  goldPerHour: number;
  baseGoldPerHour?: number;
  levelBoostAmount?: number;
  currentLevel?: number;
  rarityRank?: number;
  mekNumber: number;
  headGroup?: string;
  bodyGroup?: string;
  itemGroup?: string;
  sourceKey?: string;
}

export interface AnimatedMekValues {
  level: number;
  goldRate: number;
  bonusRate: number;
}

export const LEVEL_COLORS = [
  '#CCCCCC',
  '#80FF80',
  '#00FF00',
  '#32CD32',
  '#4169E1',
  '#9370DB',
  '#6A0DAD',
  '#FFA500',
  '#FF6B00',
  '#FF0000',
];

export const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
