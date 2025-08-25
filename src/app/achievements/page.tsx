"use client";

import { useState } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  hidden?: boolean;
}

const achievementCategories = [
  { id: "collection", name: "Collection", icon: "🏆" },
  { id: "crafting", name: "Crafting", icon: "⚒️" },
  { id: "wealth", name: "Wealth", icon: "💰" },
  { id: "combat", name: "Combat", icon: "⚔️" },
  { id: "social", name: "Social", icon: "👥" },
  { id: "exploration", name: "Exploration", icon: "🗺️" },
  { id: "special", name: "Special", icon: "⭐" },
];

const achievements: Achievement[] = [
  // Collection Achievements
  {
    id: "first_mek",
    name: "Welcome to the Factory",
    description: "Own your first Mek",
    icon: "🤖",
    category: "collection",
    points: 10,
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: "2024-01-15",
    tier: "bronze",
  },
  {
    id: "mek_collector_10",
    name: "Growing Collection",
    description: "Own 10 Meks",
    icon: "📦",
    category: "collection",
    points: 25,
    progress: 7,
    maxProgress: 10,
    unlocked: false,
    tier: "bronze",
  },
  {
    id: "mek_collector_50",
    name: "Mek Enthusiast",
    description: "Own 50 Meks",
    icon: "🏭",
    category: "collection",
    points: 50,
    progress: 7,
    maxProgress: 50,
    unlocked: false,
    tier: "silver",
  },
  {
    id: "rare_hunter",
    name: "Rare Hunter",
    description: "Own 5 Epic or Legendary Meks",
    icon: "💎",
    category: "collection",
    points: 100,
    progress: 2,
    maxProgress: 5,
    unlocked: false,
    tier: "gold",
  },
  {
    id: "genesis_owner",
    name: "Genesis Guardian",
    description: "Own a Genesis Mek",
    icon: "🌟",
    category: "collection",
    points: 500,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "diamond",
    hidden: true,
  },

  // Crafting Achievements
  {
    id: "first_craft",
    name: "Apprentice Crafter",
    description: "Complete your first craft",
    icon: "🔨",
    category: "crafting",
    points: 10,
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: "2024-01-20",
    tier: "bronze",
  },
  {
    id: "craft_master",
    name: "Master Crafter",
    description: "Complete 100 successful crafts",
    icon: "⚙️",
    category: "crafting",
    points: 75,
    progress: 45,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
  },
  {
    id: "perfect_craft",
    name: "Perfect Creation",
    description: "Craft a Legendary item",
    icon: "✨",
    category: "crafting",
    points: 150,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
  },

  // Wealth Achievements
  {
    id: "gold_hoarder_1k",
    name: "Penny Pincher",
    description: "Accumulate 1,000 gold",
    icon: "🪙",
    category: "wealth",
    points: 15,
    progress: 850,
    maxProgress: 1000,
    unlocked: false,
    tier: "bronze",
  },
  {
    id: "gold_hoarder_10k",
    name: "Gold Digger",
    description: "Accumulate 10,000 gold",
    icon: "💰",
    category: "wealth",
    points: 50,
    progress: 850,
    maxProgress: 10000,
    unlocked: false,
    tier: "silver",
  },
  {
    id: "gold_hoarder_100k",
    name: "Tycoon",
    description: "Accumulate 100,000 gold",
    icon: "🏦",
    category: "wealth",
    points: 150,
    progress: 850,
    maxProgress: 100000,
    unlocked: false,
    tier: "gold",
  },
  {
    id: "millionaire",
    name: "Millionaire",
    description: "Accumulate 1,000,000 gold",
    icon: "💸",
    category: "wealth",
    points: 500,
    progress: 850,
    maxProgress: 1000000,
    unlocked: false,
    tier: "platinum",
  },

  // Combat Achievements
  {
    id: "first_victory",
    name: "First Blood",
    description: "Win your first battle",
    icon: "🗡️",
    category: "combat",
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
  },
  {
    id: "battle_veteran",
    name: "Battle Veteran",
    description: "Win 100 battles",
    icon: "⚔️",
    category: "combat",
    points: 75,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
  },
  {
    id: "undefeated",
    name: "Undefeated Champion",
    description: "Win 10 battles in a row",
    icon: "🏅",
    category: "combat",
    points: 100,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    tier: "gold",
  },

  // Social Achievements
  {
    id: "trader",
    name: "Trader",
    description: "Complete 10 marketplace transactions",
    icon: "🤝",
    category: "social",
    points: 25,
    progress: 3,
    maxProgress: 10,
    unlocked: false,
    tier: "bronze",
  },
  {
    id: "community_member",
    name: "Community Member",
    description: "Join the Discord server",
    icon: "💬",
    category: "social",
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
  },

  // Exploration Achievements
  {
    id: "minigame_master",
    name: "Minigame Master",
    description: "Complete all minigames",
    icon: "🎮",
    category: "exploration",
    points: 100,
    progress: 2,
    maxProgress: 5,
    unlocked: false,
    tier: "gold",
  },
  {
    id: "essence_collector",
    name: "Essence Collector",
    description: "Collect all 15 essence types",
    icon: "💠",
    category: "exploration",
    points: 75,
    progress: 8,
    maxProgress: 15,
    unlocked: false,
    tier: "silver",
  },

  // Special Achievements
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Play during the beta phase",
    icon: "🎯",
    category: "special",
    points: 100,
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: "2024-01-01",
    tier: "platinum",
  },
  {
    id: "bug_hunter",
    name: "Bug Hunter",
    description: "Report a bug that gets fixed",
    icon: "🐛",
    category: "special",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    hidden: true,
  },
];

const tierColors = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-purple-400 to-purple-600",
  diamond: "from-cyan-300 to-blue-500",
};

const tierBorders = {
  bronze: "border-amber-700/50",
  silver: "border-gray-400/50",
  gold: "border-yellow-400/50",
  platinum: "border-purple-400/50",
  diamond: "border-cyan-400/50",
};

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLocked, setShowLocked] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAchievements = achievements.filter((achievement) => {
    if (!showLocked && !achievement.unlocked) return false;
    if (achievement.hidden && !achievement.unlocked) return false;
    if (selectedCategory !== "all" && achievement.category !== selectedCategory) return false;
    if (searchQuery && !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const totalPossiblePoints = achievements.filter(a => !a.hidden).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.filter(a => !a.hidden).length;

  const categoryStats = achievementCategories.map(cat => {
    const catAchievements = achievements.filter(a => a.category === cat.id && !a.hidden);
    const unlockedCat = catAchievements.filter(a => a.unlocked).length;
    return {
      ...cat,
      unlocked: unlockedCat,
      total: catAchievements.length,
      percentage: catAchievements.length > 0 ? (unlockedCat / catAchievements.length) * 100 : 0,
    };
  });

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2">Achievements</h1>
        <p className="text-gray-400">Track your progress and unlock rewards</p>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-yellow-400/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{totalPoints}</div>
            <div className="text-sm text-gray-400">Total Points</div>
            <div className="text-xs text-gray-500 mt-1">of {totalPossiblePoints} possible</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{unlockedCount}</div>
            <div className="text-sm text-gray-400">Unlocked</div>
            <div className="text-xs text-gray-500 mt-1">of {totalCount} achievements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-400">Completion</div>
            <div className="text-xs text-gray-500 mt-1">Keep going!</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {categoryStats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id)}
            className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg p-3 border transition-all ${
              selectedCategory === cat.id 
                ? "border-yellow-400 shadow-[0_0_15px_rgba(250,182,23,0.3)]" 
                : "border-gray-700/50 hover:border-yellow-400/50"
            }`}
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-xs text-gray-400">{cat.name}</div>
            <div className="text-sm font-bold text-white">{cat.unlocked}/{cat.total}</div>
            <div className="h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${cat.percentage}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
        />
        <button
          onClick={() => setShowLocked(!showLocked)}
          className={`px-4 py-2 rounded-lg border transition-all ${
            showLocked
              ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
              : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-yellow-400/50"
          }`}
        >
          {showLocked ? "Showing All" : "Unlocked Only"}
        </button>
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg border transition-all ${
            selectedCategory === "all"
              ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
              : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-yellow-400/50"
          }`}
        >
          All Categories
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative bg-gradient-to-br ${
              achievement.unlocked 
                ? "from-gray-800/70 to-gray-900/70" 
                : "from-gray-800/30 to-gray-900/30"
            } backdrop-blur-sm rounded-xl p-4 border ${
              achievement.unlocked 
                ? tierBorders[achievement.tier]
                : "border-gray-700/30"
            } transition-all ${
              achievement.unlocked 
                ? "hover:shadow-[0_0_20px_rgba(250,182,23,0.2)]" 
                : "opacity-75"
            }`}
          >
            {/* Tier Badge */}
            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${
              tierColors[achievement.tier]
            } ${!achievement.unlocked ? "opacity-50" : ""}`}>
              {achievement.tier.toUpperCase()}
            </div>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`text-4xl ${!achievement.unlocked ? "grayscale opacity-50" : ""}`}>
                {achievement.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  achievement.unlocked ? "text-white" : "text-gray-500"
                }`}>
                  {achievement.name}
                </h3>
                <p className={`text-sm mb-2 ${
                  achievement.unlocked ? "text-gray-400" : "text-gray-600"
                }`}>
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {!achievement.unlocked && achievement.maxProgress > 1 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${
                    achievement.unlocked ? "text-yellow-400" : "text-gray-600"
                  }`}>
                    {achievement.points} Points
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="text-xs text-green-400">
                      ✓ {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400">No achievements found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}

      {/* Hidden Achievements Hint */}
      {achievements.some(a => a.hidden && !a.unlocked) && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            🔒 There are hidden achievements waiting to be discovered...
          </p>
        </div>
      )}
    </div>
  );
}