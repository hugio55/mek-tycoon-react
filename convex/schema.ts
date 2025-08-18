import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main Mek NFT collection
  meks: defineTable({
    // NFT data
    assetId: v.string(),
    assetName: v.string(),
    owner: v.string(), // wallet address
    iconUrl: v.optional(v.string()),
    verified: v.boolean(), // blockchain verified
    
    // Visual attributes
    headGroup: v.optional(v.string()),
    headVariation: v.string(),
    bodyGroup: v.optional(v.string()),
    bodyVariation: v.string(),
    armsGroup: v.optional(v.string()),
    armsVariation: v.optional(v.string()),
    legsGroup: v.optional(v.string()),
    legsVariation: v.optional(v.string()),
    boosterGroup: v.optional(v.string()),
    boosterVariation: v.optional(v.string()),
    itemGroup: v.optional(v.string()),
    itemVariation: v.optional(v.string()),
    
    // Game stats
    level: v.optional(v.number()),
    experience: v.optional(v.number()),
    health: v.optional(v.number()),
    maxHealth: v.optional(v.number()),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    speed: v.optional(v.number()),
    energy: v.optional(v.number()),
    maxEnergy: v.optional(v.number()),
    
    // Rarity and ranking
    rarityRank: v.optional(v.number()),
    rarityTier: v.optional(v.string()), // Common, Uncommon, Rare, Epic, Legendary
    powerScore: v.optional(v.number()), // Overall power rating
    
    // Battle data
    wins: v.optional(v.number()),
    losses: v.optional(v.number()),
    draws: v.optional(v.number()),
    winStreak: v.optional(v.number()),
    
    // Economic data
    scrapValue: v.optional(v.number()),
    marketValue: v.optional(v.number()),
    lastSalePrice: v.optional(v.number()),
    
    // Special attributes
    abilities: v.optional(v.array(v.string())),
    traits: v.optional(v.array(v.string())),
    specialMove: v.optional(v.string()),
    
    // Metadata
    lastUpdated: v.optional(v.number()),
    inBattle: v.optional(v.boolean()),
    isStaked: v.optional(v.boolean()),
  })
    .index("by_owner", ["owner"])
    .index("by_asset_id", ["assetId"])
    .index("by_head", ["headVariation"])
    .index("by_body", ["bodyVariation"])
    .index("by_rarity", ["rarityTier"])
    .index("by_power", ["powerScore"])
    .index("by_level", ["level"]),

  // User profiles
  users: defineTable({
    walletAddress: v.string(),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    totalEssence: v.object({
      stone: v.number(),
      disco: v.number(),
      paul: v.number(),
      cartoon: v.number(),
      candy: v.number(),
      tiles: v.number(),
      moss: v.number(),
      bullish: v.number(),
      journalist: v.number(),
      laser: v.number(),
      flashbulb: v.number(),
      accordion: v.number(),
      turret: v.number(),
      drill: v.number(),
      security: v.number(),
    }),
    gold: v.number(),
    craftingSlots: v.number(),
    lastLogin: v.number(),
  }).index("by_wallet", ["walletAddress"]),

  // Crafting recipes
  craftingRecipes: defineTable({
    name: v.string(),
    outputType: v.union(v.literal("head"), v.literal("body"), v.literal("trait")),
    outputVariation: v.string(),
    essenceCost: v.object({
      stone: v.optional(v.number()),
      disco: v.optional(v.number()),
      paul: v.optional(v.number()),
      cartoon: v.optional(v.number()),
      candy: v.optional(v.number()),
      tiles: v.optional(v.number()),
      moss: v.optional(v.number()),
      bullish: v.optional(v.number()),
      journalist: v.optional(v.number()),
      laser: v.optional(v.number()),
      flashbulb: v.optional(v.number()),
      accordion: v.optional(v.number()),
      turret: v.optional(v.number()),
      drill: v.optional(v.number()),
      security: v.optional(v.number()),
    }),
    goldCost: v.optional(v.number()),
    cooldownMinutes: v.number(),
    successRate: v.number(), // 0-100
    unlockRequirement: v.optional(v.string()),
  })
    .index("by_type", ["outputType"])
    .index("by_name", ["name"]),

  // Active crafting sessions
  craftingSessions: defineTable({
    userId: v.id("users"),
    recipeId: v.id("craftingRecipes"),
    startedAt: v.number(),
    completesAt: v.number(),
    status: v.union(
      v.literal("crafting"),
      v.literal("completed"),
      v.literal("claimed"),
      v.literal("failed")
    ),
    slotNumber: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_completion", ["completesAt"]),

  // User inventory (crafted items not yet applied to Meks)
  inventory: defineTable({
    userId: v.id("users"),
    itemType: v.union(v.literal("head"), v.literal("body"), v.literal("trait")),
    itemVariation: v.string(),
    quantity: v.number(),
    craftedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["itemType"]),

  // Marketplace listings
  marketListings: defineTable({
    sellerId: v.id("users"),
    itemType: v.union(
      v.literal("essence"),
      v.literal("head"),
      v.literal("body"),
      v.literal("trait"),
      v.literal("mek")
    ),
    itemVariation: v.optional(v.string()),
    mekId: v.optional(v.id("meks")),
    essenceType: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    listedAt: v.number(),
    expiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
  })
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_type", ["itemType"])
    .index("by_price", ["pricePerUnit"]),

  // Transaction history
  transactions: defineTable({
    type: v.union(
      v.literal("craft"),
      v.literal("purchase"),
      v.literal("sale"),
      v.literal("essence_convert"),
      v.literal("reward")
    ),
    userId: v.id("users"),
    amount: v.optional(v.number()),
    itemType: v.optional(v.string()),
    itemVariation: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"]),

  // Achievements
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(),
    unlockedAt: v.number(),
    progress: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"]),

  // Buff Types - defines all possible buffs in the game
  buffTypes: defineTable({
    name: v.string(), // e.g., "Gold Boost"
    description: v.string(), // e.g., "Increases gold earning rate"
    buffType: v.union(
      v.literal("gold_rate"),           // +X gold/hr
      v.literal("xp_gain"),            // +X% XP gain
      v.literal("auction_fee_reduction"), // -X% auction house fees
      v.literal("essence_rate"),        // +X essence rate
      v.literal("crafting_speed"),      // -X% crafting time
      v.literal("crafting_success"),    // +X% crafting success rate
      v.literal("slot_bonus"),          // +X extra crafting slots
      v.literal("market_discount"),     // -X% marketplace prices
      v.literal("essence_efficiency"),  // -X% essence cost for crafting
      v.literal("gold_capacity")        // +X max gold storage
    ),
    valueType: v.union(
      v.literal("flat"),      // Flat amount (e.g., +50 gold/hr)
      v.literal("percentage") // Percentage (e.g., +10%)
    ),
    baseValue: v.number(), // The base amount or percentage
    maxStacks: v.number(), // Maximum number of times this buff can stack
    icon: v.optional(v.string()), // Emoji or icon identifier
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary")
    ),
  })
    .index("by_type", ["buffType"])
    .index("by_rarity", ["rarity"]),

  // Active Buffs - tracks which buffs users currently have active
  activeBuffs: defineTable({
    userId: v.id("users"),
    buffTypeId: v.id("buffTypes"),
    source: v.string(), // Where did this buff come from? (e.g., "talent_tree", "item", "achievement")
    sourceId: v.optional(v.string()), // ID of the source (e.g., talent node ID, item ID)
    value: v.number(), // The actual value of this buff instance
    stacks: v.number(), // How many stacks of this buff
    startedAt: v.number(), // When the buff was activated
    expiresAt: v.optional(v.number()), // When it expires (null = permanent)
    isActive: v.boolean(), // Is this buff currently active?
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_expiration", ["expiresAt"])
    .index("by_buff_type", ["buffTypeId"]),
});