"use client";

// UNIVERSAL RULE: Large numbers should use Style B font from UI showcase:
// fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
// fontWeight: 200, letterSpacing: '1px', fontVariantNumeric: 'tabular-nums'

import { useState, useEffect } from "react";

interface Reward {
  type: "frame" | "essence" | "gold" | "powerChip" | "title" | "badge";
  amount?: number;
  name?: string;
  icon: string;
}

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
  rewards?: Reward[];
}

const achievementCategories = [
  { id: "collection", name: "Collection" },
  { id: "crafting", name: "Crafting" },
  { id: "wealth", name: "Wealth" },
  { id: "combat", name: "Combat" },
  { id: "social", name: "Social" },
  { id: "exploration", name: "Exploration" },
  { id: "special", name: "Special" },
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
    rewards: [
      { type: "gold", amount: 100, icon: "🪙" },
      { type: "frame", name: "Starter Frame", icon: "🖼️" }
    ]
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
    rewards: [
      { type: "gold", amount: 500, icon: "🪙" },
      { type: "essence", amount: 3, icon: "💠" },
      { type: "title", name: "Collector", icon: "📛" }
    ]
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
    rewards: [
      { type: "gold", amount: 2500, icon: "🪙" },
      { type: "powerChip", amount: 5, icon: "⚡" },
      { type: "frame", name: "Silver Collector Frame", icon: "🖼️" }
    ]
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
    rewards: [
      { type: "gold", amount: 10000, icon: "🪙" },
      { type: "essence", amount: 10, icon: "💠" },
      { type: "badge", name: "Rare Hunter Badge", icon: "🏅" }
    ]
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
    rewards: [
      { type: "gold", amount: 100000, icon: "🪙" },
      { type: "frame", name: "Genesis Frame", icon: "🖼️" },
      { type: "title", name: "Genesis Guardian", icon: "📛" }
    ]
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
    rewards: [
      { type: "gold", amount: 250, icon: "🪙" },
      { type: "powerChip", amount: 1, icon: "⚡" }
    ]
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
    rewards: [
      { type: "gold", amount: 5000, icon: "🪙" },
      { type: "essence", amount: 5, icon: "💠" },
      { type: "title", name: "Master Crafter", icon: "📛" }
    ]
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

const tierAccents = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-400",
  platinum: "bg-purple-400",
  diamond: "bg-cyan-400",
};

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showOnlyCollected, setShowOnlyCollected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);
  const [layoutVariation, setLayoutVariation] = useState<1 | 2 | 3>(1);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  const [fineStars, setFineStars] = useState<Array<{id: number, left: string, top: string}>>([]);

  useEffect(() => {
    // Generate star background
    const generatedStars = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }));
    setStars(generatedStars);
    
    // Generate extra fine white stars
    const generatedFineStars = [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setFineStars(generatedFineStars);
  }, []);

  // Filter and sort achievements
  const filteredAchievements = achievements
    .filter((achievement) => {
      if (achievement.hidden && !achievement.unlocked) return false;
      if (showOnlyCollected && !achievement.unlocked) return false;
      if (!showOnlyCollected && achievement.unlocked) return false;
      if (selectedCategory !== "all" && achievement.category !== selectedCategory) return false;
      if (searchQuery && !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Always show unlocked first
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
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
    };
  });

  // Timeline with segmented dots progress
  const toggleAchievement = (id: string) => {
    if (expandedAchievement === id) {
      setExpandedAchievement(null);
    } else {
      setExpandedAchievement(id);
    }
  };

  const renderAchievement = (achievement: Achievement, index: number) => {
    const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
    const isExpanded = expandedAchievement === achievement.id;
    
    return (
      <div
        key={achievement.id}
        className="relative"
        onMouseEnter={() => setHoveredAchievement(achievement.id)}
        onMouseLeave={() => setHoveredAchievement(null)}
      >
        {/* Vertical Line (except for last item) */}
        {index < filteredAchievements.length - 1 && (
          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-700/30" />
        )}
        
        <div className="relative">
          <div 
            className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all cursor-pointer ${
              hoveredAchievement === achievement.id ? "bg-gray-800/40" : ""
            }`}
            onClick={() => toggleAchievement(achievement.id)}
          >
            {/* Tier Dot */}
            <div className={`w-6 h-6 rounded-full border-2 ${
              achievement.unlocked 
                ? `${tierAccents[achievement.tier]} border-gray-900`
                : "bg-gray-700 border-gray-800"
            } shadow-lg z-10`} />

            {/* Icon */}
            <div className={`text-xl ${!achievement.unlocked ? "grayscale opacity-50" : ""}`}>
              {achievement.icon}
            </div>

            {/* Name */}
            <div className="flex-1">
              <span className={`font-medium text-sm ${
                achievement.unlocked ? "text-white" : "text-gray-500"
              }`}>
                {achievement.name}
              </span>
              {/* Show description on hover */}
              {hoveredAchievement === achievement.id && !isExpanded && (
                <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
              )}
            </div>

            {/* Progress - Segmented dots */}
            <div className="flex items-center gap-1 min-w-[60px] justify-end">
              {achievement.maxProgress > 1 ? (
                <div className="flex gap-1">
                  {[...Array(Math.min(5, achievement.maxProgress))].map((_, i) => {
                    const segmentSize = achievement.maxProgress / Math.min(5, achievement.maxProgress);
                    const filled = achievement.progress >= (i + 1) * segmentSize;
                    const partial = achievement.progress > i * segmentSize && achievement.progress < (i + 1) * segmentSize;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          filled 
                            ? "bg-yellow-400 shadow-[0_0_4px_rgba(250,182,23,0.5)]" 
                            : partial
                            ? "bg-yellow-400/40"
                            : "bg-gray-700/50 border border-gray-600/30"
                        }`}
                      />
                    );
                  })}
                </div>
              ) : (
                achievement.unlocked && <span className="text-green-400">✓</span>
              )}
            </div>

            {/* Points */}
            <div className={`text-sm font-bold min-w-[50px] text-right ${
              achievement.unlocked ? "text-yellow-400" : "text-gray-600"
            }`}>
              {achievement.points}pts
            </div>

            {/* Expand/Collapse Indicator */}
            <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded Details - 3 Layout Variations */}
          {isExpanded && layoutVariation === 1 && (
            // Variation 1: Card Layout with Side-by-Side
            <div className={`ml-9 mt-3 p-4 bg-gradient-to-br from-gray-900/60 to-black/60 rounded-lg border border-yellow-400/10 backdrop-blur-sm`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-300 mb-3">{achievement.description}</p>
                  {achievement.maxProgress > 1 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="text-yellow-400">{achievement.progress} / {achievement.maxProgress}</span>
                      </div>
                      <div className="h-3 bg-gray-900/80 rounded-full overflow-hidden border border-gray-800">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            achievement.unlocked 
                              ? "bg-gradient-to-r from-green-400 to-green-500" 
                              : "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-yellow-400/70 mt-1">
                        {Math.round(progressPercent)}% Complete
                      </div>
                    </div>
                  )}
                </div>
                {achievement.rewards && achievement.rewards.length > 0 && (
                  <div>
                    <h4 className="text-xs text-yellow-400/70 uppercase tracking-wider mb-2">Rewards</h4>
                    <div className="space-y-1">
                      {achievement.rewards.map((reward, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
                          <span className="text-sm">{reward.icon}</span>
                          <span className="text-xs text-gray-300">
                            {reward.amount ? `${reward.amount.toLocaleString()}x ` : ''}
                            {reward.name || reward.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="mt-3 pt-3 border-t border-gray-800/50 text-xs text-gray-500 text-right">
                  Achieved: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {isExpanded && layoutVariation === 2 && (
            // Variation 2: Minimal Inline Layout
            <div className={`ml-9 mt-2 flex flex-wrap items-center gap-4 py-3 px-4 bg-black/30 rounded border-l-2 ${
              achievement.unlocked ? 'border-l-green-400' : 'border-l-yellow-400'
            }`}>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-gray-400">{achievement.description}</p>
                {achievement.maxProgress > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          achievement.unlocked ? "bg-green-400" : "bg-yellow-400"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(progressPercent)}%</span>
                  </div>
                )}
              </div>
              {achievement.rewards && achievement.rewards.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Rewards:</span>
                  {achievement.rewards.map((reward, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="text-sm">{reward.icon}</span>
                      {reward.amount && <span className="text-xs text-gray-400">{reward.amount}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isExpanded && layoutVariation === 3 && (
            // Variation 3: Detailed Stats Layout
            <div className={`ml-9 mt-3 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-transparent" />
              <div className="relative p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-gray-800/30">
                <div className="mb-3">
                  <p className="text-sm text-gray-300 leading-relaxed">{achievement.description}</p>
                </div>
                
                {achievement.maxProgress > 1 && (
                  <div className="mb-4 p-3 bg-gray-900/40 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500">Progress Tracker</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                          achievement.unlocked 
                            ? "bg-gradient-to-r from-green-400 to-green-500 text-black" 
                            : "bg-gradient-to-r from-yellow-400 to-amber-500 text-black"
                        }`}
                        style={{ width: `${Math.max(progressPercent, 15)}%` }}
                      >
                        {Math.round(progressPercent)}%
                      </div>
                    </div>
                  </div>
                )}

                {achievement.rewards && achievement.rewards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {achievement.rewards.map((reward, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-800/20 to-gray-900/20 rounded border border-gray-700/30"
                      >
                        <div className="text-lg">{reward.icon}</div>
                        <div>
                          <div className="text-xs font-medium text-white">
                            {reward.name || reward.type}
                          </div>
                          {reward.amount && (
                            <div className="text-xs text-yellow-400">+{reward.amount.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-400/70">
                    <span>✓</span>
                    <span>Completed {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Effects - Matching UI Showcase */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Yellow gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Fine stars */}
        {fineStars.map((star) => (
          <div
            key={`fine-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              opacity: 0.6,
            }}
          />
        ))}
        
        {/* Regular stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Main Content Container with Style L Glass */}
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
          {/* Crosshatch dirty glass pattern overlay */}
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
              <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>ACHIEVEMENTS</h1>
              <p className="text-gray-400">Track your progress and unlock rewards</p>
            </div>

            {/* Layout Variation Selector */}
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-xs text-gray-500">Layout Style:</span>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setLayoutVariation(num as 1 | 2 | 3)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    layoutVariation === num
                      ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                      : "bg-black/40 text-gray-400 border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  Style {num}
                </button>
              ))}
            </div>

            {/* Overall Progress */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Center - Total Points with Style B Font */}
                <div className="text-center md:order-2">
                  <div 
                    className="text-yellow-400"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '48px',
                      fontWeight: 200,
                      letterSpacing: '1px',
                      lineHeight: '1',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {totalPoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Achievement Points</div>
                  <div className="text-xs text-gray-500 mt-1">of {totalPossiblePoints.toLocaleString()} possible</div>
                </div>
                
                {/* Left - Unlocked (20% smaller) */}
                <div className="text-center md:order-1">
                  <div 
                    className="text-green-400"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '38.4px', // 20% smaller than 48px
                      fontWeight: 200,
                      letterSpacing: '1px',
                      lineHeight: '1',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {unlockedCount}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Unlocked</div>
                  <div className="text-xs text-gray-500 mt-1">of {totalCount} achievements</div>
                </div>
                
                {/* Right - Completion (20% smaller) */}
                <div className="text-center md:order-3">
                  <div 
                    className="text-blue-400"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '38.4px', // 20% smaller than 48px
                      fontWeight: 200,
                      letterSpacing: '1px',
                      lineHeight: '1',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Completion</div>
                  <div className="text-xs text-gray-500 mt-1">Keep going!</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
                    style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] bg-black/60 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
              />
              
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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

              {/* Toggle: Collected / Not Collected */}
              <div className="flex bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowOnlyCollected(true)}
                  className={`px-4 py-2 transition-all ${
                    showOnlyCollected
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  Collected
                </button>
                <button
                  onClick={() => setShowOnlyCollected(false)}
                  className={`px-4 py-2 transition-all ${
                    !showOnlyCollected
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  Not Collected
                </button>
              </div>
            </div>

            {/* Achievements List */}
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.3);
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(250, 182, 23, 0.3);
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(250, 182, 23, 0.5);
                }
              `}</style>
              
              {filteredAchievements.map((achievement, index) => 
                renderAchievement(achievement, index)
              )}

              {/* Empty State */}
              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-400">No achievements found</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Hidden Achievements Hint */}
            {achievements.some(a => a.hidden && !a.unlocked) && (
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