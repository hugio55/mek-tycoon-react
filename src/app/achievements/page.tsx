"use client";

import { useState } from "react";
import { CollectionFilterType } from '@/types/achievements';
import { achievementsData } from '@/data/achievements.data';
import { 
  filterAchievements, 
  calculateAchievementStats, 
  calculateCategoryStats, 
  hasHiddenAchievements 
} from '@/utils/achievements.utils';
import { AchievementsBackgroundEffects } from '@/components/achievements/BackgroundEffects';
import { AchievementStatsDisplay } from '@/components/achievements/AchievementStats';
import { AchievementFilters } from '@/components/achievements/AchievementFilters';
import { AchievementsList } from '@/components/achievements/AchievementsList';

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and calculate data
  const filteredAchievements = filterAchievements(
    achievementsData,
    selectedCategory,
    collectionFilter,
    searchQuery
  );

  const stats = calculateAchievementStats(achievementsData);
  const categoryStats = calculateCategoryStats(achievementsData);
  const hasHidden = hasHiddenAchievements(achievementsData);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Effects */}
      <AchievementsBackgroundEffects />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.3) inset',
          }}
        >
          {/* Glass pattern overlay */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 11px),
                repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.015) 10px, rgba(255, 255, 255, 0.015) 11px),
                radial-gradient(circle at 25% 25%, rgba(250, 182, 23, 0.04) 0%, transparent 25%),
                radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 25%),
                radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)`,
            }}
          />

          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                ACHIEVEMENTS
              </h1>
              <p className="text-gray-400">Track your progress and unlock rewards</p>
            </div>

            {/* Overall Progress Stats */}
            <AchievementStatsDisplay stats={stats} />

            {/* Filters */}
            <AchievementFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              collectionFilter={collectionFilter}
              onCollectionFilterChange={setCollectionFilter}
              categoryStats={categoryStats}
            />

            {/* Achievements List */}
            <AchievementsList achievements={filteredAchievements} />

            {/* Hidden Achievements Hint */}
            {hasHidden && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  🔒 There are hidden achievements waiting to be discovered...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}