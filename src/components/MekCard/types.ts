// Phase II: Gold rate fields REMOVED from MekAsset
// Gold income now comes from Job Slots, not individual Mek properties
export interface MekAsset {
  assetId: string;
  policyId: string;
  assetName: string;
  imageUrl?: string;
  // goldPerHour, baseGoldPerHour, levelBoostAmount REMOVED - Phase II
  currentLevel?: number;
  rarityRank?: number;
  mekNumber: number;
  headGroup?: string;
  bodyGroup?: string;
  itemGroup?: string;
  sourceKey?: string;
}

// Phase II: AnimatedMekValues gold fields removed
export interface AnimatedMekValues {
  level: number;
  // goldRate, bonusRate REMOVED - Phase II
}

// Default colors for levels 1-10 (fallback only)
export const DEFAULT_LEVEL_COLORS = [
  '#4ade80', // Level 1 - Green
  '#22c55e', // Level 2 - Darker Green
  '#10b981', // Level 3 - Emerald
  '#14b8a6', // Level 4 - Teal
  '#06b6d4', // Level 5 - Cyan
  '#0ea5e9', // Level 6 - Sky Blue
  '#3b82f6', // Level 7 - Blue
  '#6366f1', // Level 8 - Indigo
  '#8b5cf6', // Level 9 - Violet
  '#a855f7', // Level 10 - Purple
];

// NOTE: Level colors are now stored in Convex database
// ONLY the parent MekCard component queries colors once via useQuery(api.levelColors.getLevelColors)
// Child components (MekIdentityLayer, MekLevelBar) receive colors as props to avoid duplicate queries
// This function is kept for SSR/fallback compatibility only
export const getLevelColors = (): string[] => {
  // This function now only returns defaults - components should use Convex query
  return DEFAULT_LEVEL_COLORS;
};

// Deprecated: Don't use this directly
// Kept for backwards compatibility
export const LEVEL_COLORS = DEFAULT_LEVEL_COLORS;

export const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
