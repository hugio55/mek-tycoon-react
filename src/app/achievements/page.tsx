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

// Helper function to generate rewards
const generateRewards = (tier: string, category: string, points: number) => {
  const rewards: Reward[] = [];
  const goldMultiplier = tier === "diamond" ? 1000 : tier === "platinum" ? 100 : tier === "gold" ? 10 : tier === "silver" ? 5 : 1;
  
  // Always add gold reward
  rewards.push({ type: "gold", amount: points * goldMultiplier * 10, icon: "gold" });
  
  // Add other rewards based on tier and category
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

const achievements: Achievement[] = [
  // Collection Achievements (20)
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
    rewards: generateRewards("platinum", "special", 100)
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
    rewards: generateRewards("gold", "special", 50)
  },
  
  // Additional achievements to reach 100 total
  // More Collection achievements
  {
    id: "mek_collector_100",
    name: "Century Club",
    description: "Own 100 Meks",
    icon: "💯",
    category: "collection",
    points: 100,
    progress: 7,
    maxProgress: 100,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "collection", 100)
  },
  {
    id: "mek_collector_500",
    name: "Mek Empire",
    description: "Own 500 Meks",
    icon: "👑",
    category: "collection",
    points: 250,
    progress: 7,
    maxProgress: 500,
    unlocked: false,
    tier: "platinum",
    rewards: generateRewards("platinum", "collection", 250)
  },
  {
    id: "complete_set",
    name: "Complete Set",
    description: "Own all variations of a single type",
    icon: "🎭",
    category: "collection",
    points: 150,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "collection", 150)
  },
  {
    id: "rainbow_collection",
    name: "Rainbow Collection",
    description: "Own Meks of every rarity tier",
    icon: "🌈",
    category: "collection",
    points: 75,
    progress: 3,
    maxProgress: 7,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "collection", 75)
  },
  {
    id: "trait_master",
    name: "Trait Master",
    description: "Own all 95 trait variations",
    icon: "⚡",
    category: "collection",
    points: 300,
    progress: 12,
    maxProgress: 95,
    unlocked: false,
    tier: "diamond",
    rewards: generateRewards("diamond", "collection", 300)
  },
  
  // More Crafting achievements
  {
    id: "craft_streak_7",
    name: "Lucky Seven",
    description: "Craft successfully 7 days in a row",
    icon: "🍀",
    category: "crafting",
    points: 35,
    progress: 3,
    maxProgress: 7,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "crafting", 35)
  },
  {
    id: "craft_streak_30",
    name: "Consistent Creator",
    description: "Craft successfully 30 days in a row",
    icon: "📅",
    category: "crafting",
    points: 100,
    progress: 3,
    maxProgress: 30,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "crafting", 100)
  },
  {
    id: "essence_master",
    name: "Essence Master",
    description: "Use 1000 essences in crafting",
    icon: "💠",
    category: "crafting",
    points: 75,
    progress: 234,
    maxProgress: 1000,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "crafting", 75)
  },
  {
    id: "failed_craft",
    name: "Learning Experience",
    description: "Fail a craft for the first time",
    icon: "💔",
    category: "crafting",
    points: 5,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "crafting", 5)
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Craft 7 legendary items in one week",
    icon: "🌟",
    category: "crafting",
    points: 200,
    progress: 0,
    maxProgress: 7,
    unlocked: false,
    tier: "platinum",
    rewards: generateRewards("platinum", "crafting", 200)
  },
  
  // More Wealth achievements
  {
    id: "first_purchase",
    name: "First Purchase",
    description: "Buy your first item from the market",
    icon: "🛒",
    category: "wealth",
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "wealth", 10)
  },
  {
    id: "first_sale",
    name: "First Sale",
    description: "Sell your first item on the market",
    icon: "💵",
    category: "wealth",
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "wealth", 10)
  },
  {
    id: "market_mogul",
    name: "Market Mogul",
    description: "Complete 500 market transactions",
    icon: "📈",
    category: "wealth",
    points: 150,
    progress: 3,
    maxProgress: 500,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "wealth", 150)
  },
  {
    id: "billionaire",
    name: "Billionaire",
    description: "Accumulate 1,000,000,000 gold",
    icon: "🏆",
    category: "wealth",
    points: 1000,
    progress: 850,
    maxProgress: 1000000000,
    unlocked: false,
    tier: "diamond",
    rewards: generateRewards("diamond", "wealth", 1000)
  },
  {
    id: "profit_master",
    name: "Profit Master",
    description: "Make 100,000 gold profit in a single transaction",
    icon: "📊",
    category: "wealth",
    points: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "wealth", 100)
  },
  {
    id: "auction_winner",
    name: "Auction Winner",
    description: "Win your first auction",
    icon: "🔨",
    category: "wealth",
    points: 25,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "wealth", 25)
  },
  
  // More Combat achievements
  {
    id: "flawless_victory",
    name: "Flawless Victory",
    description: "Win a battle without taking damage",
    icon: "🛡️",
    category: "combat",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "combat", 50)
  },
  {
    id: "underdog",
    name: "Underdog",
    description: "Win against an opponent 100+ levels higher",
    icon: "🐕",
    category: "combat",
    points: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "combat", 100)
  },
  {
    id: "arena_champion",
    name: "Arena Champion",
    description: "Reach #1 in the arena",
    icon: "🥇",
    category: "combat",
    points: 500,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "diamond",
    rewards: generateRewards("diamond", "combat", 500)
  },
  {
    id: "battle_hardened",
    name: "Battle Hardened",
    description: "Win 1000 battles",
    icon: "⚔️",
    category: "combat",
    points: 200,
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
    tier: "platinum",
    rewards: generateRewards("platinum", "combat", 200)
  },
  {
    id: "peaceful_warrior",
    name: "Peaceful Warrior",
    description: "Win 10 battles using only defensive moves",
    icon: "☮️",
    category: "combat",
    points: 75,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "combat", 75)
  },
  
  // More Social achievements
  {
    id: "guild_founder",
    name: "Guild Founder",
    description: "Create a guild",
    icon: "🏰",
    category: "social",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "social", 50)
  },
  {
    id: "guild_leader",
    name: "Guild Leader",
    description: "Lead a guild with 50+ members",
    icon: "👥",
    category: "social",
    points: 100,
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "social", 100)
  },
  {
    id: "helpful_hand",
    name: "Helpful Hand",
    description: "Help 100 other players",
    icon: "🤲",
    category: "social",
    points: 50,
    progress: 12,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "social", 50)
  },
  {
    id: "gift_giver",
    name: "Gift Giver",
    description: "Send 50 gifts to friends",
    icon: "🎁",
    category: "social",
    points: 35,
    progress: 8,
    maxProgress: 50,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "social", 35)
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Have 100 friends",
    icon: "🦋",
    category: "social",
    points: 75,
    progress: 23,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "social", 75)
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Help 10 new players reach level 50",
    icon: "🎓",
    category: "social",
    points: 150,
    progress: 2,
    maxProgress: 10,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "social", 150)
  },
  
  // More Exploration achievements
  {
    id: "world_explorer",
    name: "World Explorer",
    description: "Visit all locations in the game",
    icon: "🗺️",
    category: "exploration",
    points: 100,
    progress: 45,
    maxProgress: 50,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "exploration", 100)
  },
  {
    id: "secret_finder",
    name: "Secret Finder",
    description: "Discover 20 hidden areas",
    icon: "🔍",
    category: "exploration",
    points: 75,
    progress: 7,
    maxProgress: 20,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "exploration", 75)
  },
  {
    id: "lore_master",
    name: "Lore Master",
    description: "Collect all lore books",
    icon: "📚",
    category: "exploration",
    points: 100,
    progress: 23,
    maxProgress: 30,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "exploration", 100)
  },
  {
    id: "speedrunner",
    name: "Speedrunner",
    description: "Complete any minigame in under 30 seconds",
    icon: "⚡",
    category: "exploration",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "exploration", 50)
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Get perfect scores in all minigames",
    icon: "💎",
    category: "exploration",
    points: 200,
    progress: 2,
    maxProgress: 10,
    unlocked: false,
    tier: "platinum",
    rewards: generateRewards("platinum", "exploration", 200)
  },
  {
    id: "easter_egg_hunter",
    name: "Easter Egg Hunter",
    description: "Find all easter eggs",
    icon: "🥚",
    category: "exploration",
    points: 150,
    progress: 3,
    maxProgress: 15,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "exploration", 150)
  },
  
  // More Special achievements
  {
    id: "anniversary_player",
    name: "Anniversary Player",
    description: "Play on the game's anniversary",
    icon: "🎂",
    category: "special",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "special", 50)
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Play between 2-5 AM",
    icon: "🦉",
    category: "special",
    points: 25,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "special", 25)
  },
  {
    id: "lucky_number",
    name: "Lucky Number",
    description: "Own Mek #7777",
    icon: "7️⃣",
    category: "special",
    points: 77,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    hidden: true,
    rewards: generateRewards("silver", "special", 77)
  },
  {
    id: "palindrome",
    name: "Palindrome",
    description: "Own a Mek with palindrome ID",
    icon: "🔄",
    category: "special",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    hidden: true,
    rewards: generateRewards("silver", "special", 50)
  },
  {
    id: "dedication",
    name: "Dedication",
    description: "Play for 365 days",
    icon: "📆",
    category: "special",
    points: 365,
    progress: 45,
    maxProgress: 365,
    unlocked: false,
    tier: "diamond",
    rewards: generateRewards("diamond", "special", 365)
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all other achievements",
    icon: "🏅",
    category: "special",
    points: 1000,
    progress: 20,
    maxProgress: 99,
    unlocked: false,
    tier: "diamond",
    rewards: generateRewards("diamond", "special", 1000)
  },
  
  // Additional misc achievements to reach 100
  {
    id: "jack_of_all_trades",
    name: "Jack of All Trades",
    description: "Have progress in all achievement categories",
    icon: "🃏",
    category: "special",
    points: 50,
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "special", 50)
  },
  {
    id: "whale",
    name: "Whale",
    description: "Support the game with premium purchases",
    icon: "🐋",
    category: "special",
    points: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    hidden: true,
    rewards: generateRewards("gold", "special", 100)
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete 100 actions in 1 minute",
    icon: "😈",
    category: "special",
    points: 75,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "special", 75)
  },
  {
    id: "patience",
    name: "Patience",
    description: "Wait 24 hours without any action",
    icon: "⏳",
    category: "special",
    points: 25,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "special", 25)
  },
  {
    id: "mek_whisperer",
    name: "Mek Whisperer",
    description: "Name all your Meks",
    icon: "💬",
    category: "collection",
    points: 35,
    progress: 3,
    maxProgress: 10,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "collection", 35)
  },
  {
    id: "recycler",
    name: "Recycler",
    description: "Recycle 100 items",
    icon: "♻️",
    category: "crafting",
    points: 50,
    progress: 23,
    maxProgress: 100,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "crafting", 50)
  },
  {
    id: "banker",
    name: "Banker",
    description: "Save 1,000,000 gold in bank",
    icon: "🏦",
    category: "wealth",
    points: 100,
    progress: 234567,
    maxProgress: 1000000,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "wealth", 100)
  },
  {
    id: "investor",
    name: "Investor",
    description: "Invest in 10 different ventures",
    icon: "📈",
    category: "wealth",
    points: 75,
    progress: 4,
    maxProgress: 10,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "wealth", 75)
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Win after being down to 1 HP",
    icon: "💪",
    category: "combat",
    points: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "combat", 100)
  },
  {
    id: "pacifist",
    name: "Pacifist",
    description: "Reach level 50 without fighting",
    icon: "🕊️",
    category: "combat",
    points: 150,
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "combat", 150)
  },
  {
    id: "trendsetter",
    name: "Trendsetter",
    description: "Start a trend that 100 players follow",
    icon: "📱",
    category: "social",
    points: 100,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "social", 100)
  },
  {
    id: "event_master",
    name: "Event Master",
    description: "Participate in all seasonal events",
    icon: "🎪",
    category: "exploration",
    points: 100,
    progress: 3,
    maxProgress: 12,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "exploration", 100)
  },
  {
    id: "data_miner",
    name: "Data Miner",
    description: "Discover unused game content",
    icon: "⛏️",
    category: "exploration",
    points: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "silver",
    hidden: true,
    rewards: generateRewards("silver", "exploration", 50)
  },
  {
    id: "rng_blessed",
    name: "RNG Blessed",
    description: "Get the best possible outcome 10 times in a row",
    icon: "🎰",
    category: "special",
    points: 77,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    tier: "silver",
    hidden: true,
    rewards: generateRewards("silver", "special", 77)
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Complete the game with minimal inventory",
    icon: "📦",
    category: "special",
    points: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "gold",
    rewards: generateRewards("gold", "special", 100)
  },
  {
    id: "maximalist",
    name: "Maximalist",
    description: "Fill every inventory slot",
    icon: "🗄️",
    category: "special",
    points: 50,
    progress: 234,
    maxProgress: 500,
    unlocked: false,
    tier: "silver",
    rewards: generateRewards("silver", "special", 50)
  },
  {
    id: "alpha_tester",
    name: "Alpha Tester",
    description: "Participated in alpha testing",
    icon: "🔬",
    category: "special",
    points: 200,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "platinum",
    hidden: true,
    rewards: generateRewards("platinum", "special", 200)
  },
  {
    id: "photographer",
    name: "Photographer",
    description: "Take 100 screenshots",
    icon: "📸",
    category: "exploration",
    points: 25,
    progress: 34,
    maxProgress: 100,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "exploration", 25)
  },
  {
    id: "tutorial_skipper",
    name: "Tutorial Skipper",
    description: "Skip all tutorials",
    icon: "⏭️",
    category: "special",
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    tier: "bronze",
    hidden: true,
    rewards: generateRewards("bronze", "special", 10)
  },
  {
    id: "tutorial_reader",
    name: "Tutorial Reader",
    description: "Complete all tutorials",
    icon: "📖",
    category: "special",
    points: 25,
    progress: 8,
    maxProgress: 10,
    unlocked: false,
    tier: "bronze",
    rewards: generateRewards("bronze", "special", 25)
  }
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
  const [collectionFilter, setCollectionFilter] = useState<"all" | "collected" | "not_collected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);
  const [layoutVariation, setLayoutVariation] = useState<1 | 2 | 3>(1);
  const [parentConnectionStyle, setParentConnectionStyle] = useState<1 | 2 | 3>(1);
  // Description display locked to right column format
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
            className={`relative flex items-center gap-2 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              hoveredAchievement === achievement.id ? "bg-gray-800/40" : ""
            } ${isExpanded ? "bg-yellow-400/10 border border-yellow-400/20" : ""}`}
            onClick={() => toggleAchievement(achievement.id)}
          >
            {/* Tier Dot */}
            <div className={`w-6 h-6 rounded-full border-2 ${
              achievement.unlocked 
                ? `${tierAccents[achievement.tier]} border-gray-900`
                : "bg-gray-700 border-gray-800"
            } shadow-lg z-10`} />


            {/* Right Column Description Display - Locked In */}
            <div className="flex-1 relative overflow-visible">
              <div className="grid grid-cols-2 gap-2">
                <div className={`font-medium text-sm ${
                  achievement.unlocked ? "text-yellow-400" : "text-white"
                }`}>
                  {achievement.name}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {achievement.description}
                </div>
              </div>
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

          {/* Expanded Details - List with Dividers Layout */}
          {isExpanded && (
            <div className="ml-9 mt-3">
              {(() => {
                const realRewards = achievement.rewards || [];
                const getRewardIcon = (type: string) => {
                  const colors = {
                    gold: 'bg-yellow-500',
                    essence: 'bg-purple-500',
                    powerChip: 'bg-blue-500',
                    frame: 'bg-green-500',
                    title: 'bg-orange-500',
                    badge: 'bg-red-500'
                  };
                  return colors[type] || 'bg-gray-500';
                };
                
                return (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-gray-900/40 to-black/40 border-l-2 border-yellow-400/30">
                    <div className="flex gap-4">
                      {/* Left: Progress (2/3 width) */}
                      <div style={{ width: '66.666%' }}>
                            <p className="text-xs text-gray-300 mb-3">{achievement.description}</p>
                        {achievement.maxProgress > 1 && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span className="text-yellow-400">{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${achievement.unlocked ? "bg-green-400" : "bg-yellow-400"}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{Math.round(progressPercent)}% Complete</div>
                          </div>
                        )}
                        
                        {/* Date - Locked to Below Progress Bar */}
                        {achievement.unlocked && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-green-400">COLLECTED</span>
                            <span className="text-sm font-medium text-gray-300">
                              {new Date(achievement.unlockedAt!).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                          </div>
                          
                      {/* Right: Rewards List (1/3 width) */}
                      {realRewards.length > 0 && (
                        <div style={{ width: '33.333%' }}>
                          <div className="text-xs text-gray-500 mb-1">Rewards</div>
                          {realRewards.map((reward, idx) => (
                            <div key={idx} className={`flex items-center gap-2 py-1 ${idx > 0 ? 'border-t border-gray-800/50' : ''}`}>
                              <div className={`w-3 h-3 rounded-sm ${getRewardIcon(reward.type)}`}></div>
                              <span className="text-xs text-yellow-400">
                                {reward.amount && reward.amount > 0 ? `+${reward.amount.toLocaleString()}` : ''}
                                {reward.name || reward.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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



            {/* Overall Progress */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Center - Total Points with Style B Font and Glow */}
                <div className="text-center md:order-2">
                  <div 
                    className="text-yellow-400 relative inline-block"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '48px',
                      fontWeight: 200,
                      letterSpacing: '1px',
                      lineHeight: '1',
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)',
                    }}
                  >
                    {totalPoints.toLocaleString()}
                  </div>
                  <div className="text-base text-white mt-2 font-medium">Achievement Points</div>
                  <div className="text-xs text-gray-500 mt-1">of {totalPossiblePoints.toLocaleString()} possible</div>
                </div>
                
                {/* Left - Unlocked (25% smaller) */}
                <div className="text-center md:order-1">
                  <div 
                    className="text-green-400"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '36px', // 25% smaller than 48px
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
                
                {/* Right - Completion (25% smaller) */}
                <div className="text-center md:order-3">
                  <div 
                    className="text-blue-400"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '36px', // 25% smaller than 48px
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

              {/* Toggle: All / Collected / Not Collected */}
              <div className="flex bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCollectionFilter("all")}
                  className={`px-4 py-2 transition-all ${
                    collectionFilter === "all"
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCollectionFilter("collected")}
                  className={`px-4 py-2 transition-all ${
                    collectionFilter === "collected"
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  Collected
                </button>
                <button
                  onClick={() => setCollectionFilter("not_collected")}
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
                
                @keyframes slideRightFade {
                  from {
                    opacity: 0;
                    transform: translateX(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(5px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                
                @keyframes expandHeight {
                  from {
                    max-height: 0;
                    opacity: 0;
                  }
                  to {
                    max-height: 40px;
                    opacity: 1;
                  }
                }
                
                @keyframes scaleIn {
                  from {
                    transform: scale(0.8);
                    opacity: 0;
                  }
                  to {
                    transform: scale(1);
                    opacity: 1;
                  }
                }
                
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 0.7;
                  }
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