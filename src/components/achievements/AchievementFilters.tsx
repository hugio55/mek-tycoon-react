import React from 'react';
import { CollectionFilterType, CategoryStats } from '@/types/achievements';

interface AchievementFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  collectionFilter: CollectionFilterType;
  onCollectionFilterChange: (filter: CollectionFilterType) => void;
  categoryStats: CategoryStats[];
}

export const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  collectionFilter,
  onCollectionFilterChange,
  categoryStats
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <input
        type="text"
        placeholder="Search achievements..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-[200px] bg-black/60 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
      />
      
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="bg-black/60 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none cursor-pointer backdrop-blur-sm appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem',
        }}
      >
        <option value="all">All Categories</option>
        {categoryStats.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} ({cat.unlocked}/{cat.total})
          </option>
        ))}
      </select>

      <div className="flex bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => onCollectionFilterChange("all")}
          className={`px-4 py-2 transition-all ${
            collectionFilter === "all"
              ? "bg-yellow-400/20 text-yellow-400"
              : "text-gray-400 hover:bg-gray-800/50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onCollectionFilterChange("collected")}
          className={`px-4 py-2 transition-all ${
            collectionFilter === "collected"
              ? "bg-yellow-400/20 text-yellow-400"
              : "text-gray-400 hover:bg-gray-800/50"
          }`}
        >
          Collected
        </button>
        <button
          onClick={() => onCollectionFilterChange("not_collected")}
          className={`px-4 py-2 transition-all ${
            collectionFilter === "not_collected"
              ? "bg-yellow-400/20 text-yellow-400"
              : "text-gray-400 hover:bg-gray-800/50"
          }`}
        >
          Not Collected
        </button>
      </div>
    </div>
  );
};