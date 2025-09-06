import { Achievement, AchievementStats, CategoryStats, CollectionFilterType } from '@/types/achievements';
import { achievementCategories } from '@/data/achievements.data';

export const filterAchievements = (
  achievements: Achievement[],
  selectedCategory: string,
  collectionFilter: CollectionFilterType,
  searchQuery: string
): Achievement[] => {
  return achievements
    .filter((achievement) => {
      if (achievement.hidden && !achievement.unlocked) return false;
      if (collectionFilter === "collected" && !achievement.unlocked) return false;
      if (collectionFilter === "not_collected" && achievement.unlocked) return false;
      if (selectedCategory !== "all" && achievement.category !== selectedCategory) return false;
      if (searchQuery && !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // First sort by unlocked status (unlocked first)
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      
      // Then sort by progress percentage (highest first)
      const aProgress = a.maxProgress > 0 ? (a.progress / a.maxProgress) : 0;
      const bProgress = b.maxProgress > 0 ? (b.progress / b.maxProgress) : 0;
      return bProgress - aProgress;
    });
};

export const calculateAchievementStats = (achievements: Achievement[]): AchievementStats => {
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const totalPossiblePoints = achievements.filter(a => !a.hidden).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.filter(a => !a.hidden).length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    totalPoints,
    totalPossiblePoints,
    unlockedCount,
    totalCount,
    completionPercentage
  };
};

export const calculateCategoryStats = (achievements: Achievement[]): CategoryStats[] => {
  return achievementCategories.map(cat => {
    const catAchievements = achievements.filter(a => a.category === cat.id && !a.hidden);
    const unlockedCat = catAchievements.filter(a => a.unlocked).length;
    return {
      ...cat,
      unlocked: unlockedCat,
      total: catAchievements.length,
    };
  });
};

export const calculateProgressPercentage = (progress: number, maxProgress: number): number => {
  return maxProgress > 0 ? (progress / maxProgress) * 100 : 0;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const hasHiddenAchievements = (achievements: Achievement[]): boolean => {
  return achievements.some(a => a.hidden && !a.unlocked);
};