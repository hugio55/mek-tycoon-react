export type RewardType = "frame" | "essence" | "gold" | "powerChip" | "title" | "badge";
export type TierType = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type CategoryType = "collection" | "crafting" | "wealth" | "combat" | "social" | "exploration" | "special";
export type CollectionFilterType = "all" | "collected" | "not_collected";

export interface Reward {
  type: RewardType;
  amount?: number;
  name?: string;
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: CategoryType;
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  tier: TierType;
  hidden?: boolean;
  rewards?: Reward[];
}

export interface AchievementCategory {
  id: CategoryType;
  name: string;
}

export interface CategoryStats extends AchievementCategory {
  unlocked: number;
  total: number;
}

export interface AchievementFilters {
  selectedCategory: string;
  collectionFilter: CollectionFilterType;
  searchQuery: string;
}

export interface AchievementStats {
  totalPoints: number;
  totalPossiblePoints: number;
  unlockedCount: number;
  totalCount: number;
  completionPercentage: number;
}

export const TIER_ACCENTS: Record<TierType, string> = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-400",
  platinum: "bg-purple-400",
  diamond: "bg-cyan-400",
};

export const REWARD_COLORS: Record<RewardType, string> = {
  gold: 'bg-yellow-500',
  essence: 'bg-purple-500',
  powerChip: 'bg-blue-500',
  frame: 'bg-green-500',
  title: 'bg-orange-500',
  badge: 'bg-red-500'
};