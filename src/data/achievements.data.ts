import { Achievement, AchievementCategory, Reward, TierType, CategoryType } from '@/types/achievements';

export const achievementCategories: AchievementCategory[] = [
  { id: "collection", name: "Collection" },
  { id: "crafting", name: "Crafting" },
  { id: "wealth", name: "Wealth" },
  { id: "combat", name: "Combat" },
  { id: "social", name: "Social" },
  { id: "exploration", name: "Exploration" },
  { id: "special", name: "Special" },
];

export const generateRewards = (tier: TierType, category: CategoryType, points: number): Reward[] => {
  const rewards: Reward[] = [];
  const goldMultiplier = tier === "diamond" ? 1000 : tier === "platinum" ? 100 : tier === "gold" ? 10 : tier === "silver" ? 5 : 1;
  
  rewards.push({ type: "gold", amount: points * goldMultiplier * 10, icon: "gold" });
  
  if (tier === "diamond" || tier === "platinum") {
    rewards.push({ type: "frame", name: `${tier} Frame`, icon: "frame" });
    rewards.push({ type: "title", name: `${category} Master`, icon: "title" });
    rewards.push({ type: "powerChip", amount: Math.floor(points / 10), icon: "power" });
    rewards.push({ type: "essence", amount: Math.floor(points / 20), icon: "essence" });
    rewards.push({ type: "badge", name: `${tier} Badge`, icon: "badge" });
  } else if (tier === "gold") {
    rewards.push({ type: "essence", amount: Math.floor(points / 25), icon: "essence" });
    rewards.push({ type: "powerChip", amount: Math.floor(points / 30), icon: "power" });
    rewards.push({ type: "frame", name: "Gold Frame", icon: "frame" });
  } else if (tier === "silver") {
    rewards.push({ type: "essence", amount: Math.floor(points / 40), icon: "essence" });
    rewards.push({ type: "powerChip", amount: 1, icon: "power" });
  } else {
    rewards.push({ type: "essence", amount: 1, icon: "essence" });
  }
  
  return rewards;
};

export const achievementsData: Achievement[] = [
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
    rewards: generateRewards("bronze", "collection", 10)
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
  
  // Special Achievement
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
    rewards: generateRewards("platinum", "special", 100)
  },
  
  // Add more achievements as needed...
  // This is a subset for demonstration. In production, you'd import all achievements
];