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
    sourceKey: v.optional(v.string()), // Full source key from metadata (e.g., "HH1-DH1-JI2-B")
    sourceKeyBase: v.optional(v.string()), // Source key without suffix for image lookup (e.g., "HH1-DH1-JI2")
    
    // Visual attributes
    headGroup: v.optional(v.string()),
    headVariation: v.string(),
    headVariationId: v.optional(v.number()), // Reference to variationsReference.variationId
    bodyGroup: v.optional(v.string()),
    bodyVariation: v.string(),
    bodyVariationId: v.optional(v.number()), // Reference to variationsReference.variationId
    armsGroup: v.optional(v.string()),
    armsVariation: v.optional(v.string()),
    legsGroup: v.optional(v.string()),
    legsVariation: v.optional(v.string()),
    boosterGroup: v.optional(v.string()),
    boosterVariation: v.optional(v.string()),
    itemGroup: v.optional(v.string()),
    itemVariation: v.optional(v.string()),
    itemVariationId: v.optional(v.number()), // Reference to variationsReference.variationId
    
    // Game stats
    level: v.optional(v.number()),
    experience: v.optional(v.number()),
    health: v.optional(v.number()),
    maxHealth: v.optional(v.number()),
    speed: v.optional(v.number()),
    
    // Rarity and ranking
    rarityRank: v.optional(v.number()), // Original CNFT marketplace ranking
    gameRank: v.optional(v.number()),   // Custom game ranking (genesis meks are 1-10)
    cnftRank: v.optional(v.number()),   // Backup of original CNFT rank when gameRank differs
    isGenesis: v.optional(v.boolean()), // True for special genesis meks (101-010-101, etc)
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
    
    // Employee/work status
    isEmployee: v.optional(v.boolean()),
    goldRate: v.optional(v.number()),
  })
    .index("by_owner", ["owner"])
    .index("by_asset_id", ["assetId"])
    .index("by_asset_name", ["assetName"])
    .index("by_source_key", ["sourceKey"])
    .index("by_source_key_base", ["sourceKeyBase"])
    .index("by_head", ["headVariation"])
    .index("by_body", ["bodyVariation"])
    .index("by_rarity", ["rarityTier"])
    .index("by_power", ["powerScore"])
    .index("by_level", ["level"]),

  // Mek Talent Tree Templates
  mekTreeTemplates: defineTable({
    name: v.string(), // Template name (e.g., "Offensive Build", "Tank Build", "Speed Build")
    description: v.string(), // Description of the template
    category: v.optional(v.string()), // Category like "head-based", "body-based", "balanced"
    
    // Conditions for auto-assignment (which Meks get this template)
    conditions: v.optional(v.object({
      headVariations: v.optional(v.array(v.string())), // Apply to specific head types
      bodyVariations: v.optional(v.array(v.string())), // Apply to specific body types
      traitVariations: v.optional(v.array(v.string())), // Apply to specific traits
      rarityTiers: v.optional(v.array(v.string())), // Apply to specific rarity tiers
      powerScoreMin: v.optional(v.number()),
      powerScoreMax: v.optional(v.number()),
    })),
    
    // Tree structure (same as individual trees)
    nodes: v.array(v.object({
      id: v.string(),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      tier: v.number(),
      desc: v.string(),
      xp: v.number(),
      unlocked: v.optional(v.boolean()),
      nodeType: v.optional(v.union(
        v.literal("stat"),
        v.literal("ability"),
        v.literal("passive"),
        v.literal("special")
      )),
      statBonus: v.optional(v.object({
        health: v.optional(v.number()),
        speed: v.optional(v.number()),
        attack: v.optional(v.number()),
        defense: v.optional(v.number()),
        critChance: v.optional(v.number()),
        critDamage: v.optional(v.number()),
      })),
      abilityId: v.optional(v.string()),
      passiveEffect: v.optional(v.string()),
      buffGrant: v.optional(v.object({
        buffType: v.string(),
        baseValue: v.optional(v.number()),
      })),
    })),
    
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
    
    // Metadata
    isDefault: v.optional(v.boolean()), // Is this a default template?
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // Individual Mek Talent Trees (now references a template)
  mekTalentTrees: defineTable({
    mekId: v.id("meks"), // Reference to the specific Mek
    ownerId: v.id("users"), // Reference to the owner
    templateId: v.optional(v.id("mekTreeTemplates")), // Reference to the template used
    
    // Tree structure (copied from template initially, then can be customized)
    nodes: v.array(v.object({
      id: v.string(),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      tier: v.number(),
      desc: v.string(),
      xp: v.number(),
      unlocked: v.optional(v.boolean()),
      // Node type and bonuses
      nodeType: v.optional(v.union(
        v.literal("stat"),    // Increases base stats
        v.literal("ability"), // Unlocks new abilities
        v.literal("passive"), // Passive bonuses
        v.literal("special")  // Special effects
      )),
      statBonus: v.optional(v.object({
        health: v.optional(v.number()),
        speed: v.optional(v.number()),
        attack: v.optional(v.number()),
        defense: v.optional(v.number()),
        critChance: v.optional(v.number()),
        critDamage: v.optional(v.number()),
      })),
      abilityId: v.optional(v.string()),
      passiveEffect: v.optional(v.string()),
      buffGrant: v.optional(v.object({
        buffType: v.string(),
        baseValue: v.optional(v.number()),
      })),
    })),
    
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
    
    // Progress tracking
    unlockedNodes: v.array(v.string()), // IDs of unlocked nodes
    totalXpSpent: v.number(),
    availableXp: v.number(),
    
    // Tree metadata
    treeVersion: v.optional(v.number()), // Version for migration purposes
    lastModified: v.number(),
    createdAt: v.number(),
  })
    .index("by_mek", ["mekId"])
    .index("by_owner", ["ownerId"])
    .index("by_mek_owner", ["mekId", "ownerId"]),

  // User profiles
  users: defineTable({
    // Cardano Wallet Authentication
    walletAddress: v.string(), // Primary identifier
    walletName: v.optional(v.string()), // Wallet provider name (Nami, Eternl, etc.)
    walletStakeAddress: v.optional(v.string()), // Stake address for additional verification
    walletVerified: v.optional(v.boolean()), // True if wallet ownership is verified via signature
    walletType: v.optional(v.string()), // e.g., "nami", "eternl", "flint", etc.
    
    // Profile fields
    username: v.optional(v.string()),
    displayName: v.optional(v.string()), // The actual display name shown to others (case-sensitive)
    displayNameLower: v.optional(v.string()), // Lowercase version for uniqueness checking
    displayNameSet: v.optional(v.boolean()), // Whether the user has set their display name
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    
    // Game resources
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
    
    // Gold generation tracking
    goldPerHour: v.optional(v.number()), // Total gold per hour from all sources
    lastGoldCollection: v.optional(v.number()), // Timestamp of last gold collection
    pendingGold: v.optional(v.number()), // Gold accumulated but not collected
    employeeCount: v.optional(v.number()), // Number of Meks assigned as employees
    
    // User stats
    level: v.optional(v.number()),
    experience: v.optional(v.number()),
    totalBattles: v.optional(v.number()),
    totalWins: v.optional(v.number()),
    winRate: v.optional(v.number()),
    
    // Timestamps
    lastLogin: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    
    // Status
    isOnline: v.optional(v.boolean()),
    isBanned: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("user"), v.literal("moderator"), v.literal("admin"))),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_stake_address", ["walletStakeAddress"])
    .index("by_username", ["username"])
    .index("by_display_name_lower", ["displayNameLower"]),

  // Variations reference table - maps all variations to unique IDs
  variationsReference: defineTable({
    variationId: v.number(), // Unique ID for each variation (1-291+)
    name: v.string(),         // Variation name (e.g., "Maps", "Chrome", "Golden Guns")
    type: v.union(v.literal("head"), v.literal("body"), v.literal("item")), // Type of variation
    baseXp: v.optional(v.number()),       // Base XP required to unlock in talent tree
    copies: v.optional(v.number()), // Number of copies in existence
    imageUrl: v.optional(v.string()), // URL to the variation image in public/variation-images/
  })
    .index("by_variation_id", ["variationId"])
    .index("by_type", ["type"])
    .index("by_name", ["name"]),

  // Mek Tree Buff Tables for procedural generation
  mekTreeBuffTables: defineTable({
    category: v.string(), // e.g., "flat_gold", "gold_multiplier", etc.
    displayName: v.string(), // e.g., "Flat Gold", "Gold Multiplier"
    description: v.optional(v.string()),
    unit: v.optional(v.string()), // e.g., "gold", "%", "x"
    values: v.array(v.array(v.number())), // 7x10 array: [rarityTier][treeTier]
    isActive: v.boolean(), // Whether to include in procedural generation
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"]),

  // Crafting recipes
  craftingRecipes: defineTable({
    name: v.string(),
    outputType: v.union(v.literal("head"), v.literal("body"), v.literal("trait")),
    outputVariation: v.string(),
    outputVariationId: v.optional(v.number()), // Links to variationsReference.variationId
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
      v.literal("overexposed"),
      v.literal("consumable"),
      v.literal("boost"),
      v.literal("special"),
      v.literal("mek")
    ),
    itemVariation: v.optional(v.string()),
    itemDescription: v.optional(v.string()),
    mekId: v.optional(v.id("meks")),
    essenceType: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    imageUrl: v.optional(v.string()),
    listedAt: v.number(),
    expiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    isAdminListing: v.optional(v.boolean()),
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
      v.literal("gold_capacity"),       // +X max gold storage
      v.literal("bank_deposit_cap")     // +X bank deposit daily cap
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

  // Bank Accounts - simplified bank account for each user
  bankAccounts: defineTable({
    userId: v.id("users"),
    balance: v.number(), // Current balance in the bank
    interestRate: v.number(), // Daily interest rate (percentage)
    lastInterestPaid: v.number(), // Timestamp of last interest payment
    totalDeposited: v.number(), // Total amount ever deposited
    totalWithdrawn: v.number(), // Total amount ever withdrawn
    totalInterestEarned: v.number(), // Total interest earned all time
    createdAt: v.number(),
    accountLevel: v.optional(v.string()), // Account tier (bronze, silver, gold)
    isLocked: v.optional(v.boolean()), // Whether account is locked
    maxLoanAmount: v.optional(v.number()), // Maximum loan amount allowed
  })
    .index("by_user", ["userId"]),

  // Stock Companies - the 3 companies users can invest in
  stockCompanies: defineTable({
    symbol: v.string(), // e.g., "MEK", "ESS", "MRK"
    name: v.string(), // Full company name
    currentPrice: v.number(), // Current stock price
    previousClose: v.number(), // Previous day's closing price
    dayHigh: v.number(), // Today's highest price
    dayLow: v.number(), // Today's lowest price
    volume: v.number(), // Trading volume today
    marketCap: v.number(), // Total market capitalization
    volatility: v.number(), // Price volatility factor (0.1 to 1.0)
    trend: v.number(), // Current trend (-1 to 1, negative = bearish, positive = bullish)
    lastUpdated: v.number(),
    lastSunspotCount: v.optional(v.number()),
  })
    .index("by_symbol", ["symbol"]),

  // Stock Price History - for candlestick charts
  stockPriceHistory: defineTable({
    companyId: v.id("stockCompanies"),
    symbol: v.string(),
    timestamp: v.number(),
    open: v.number(),
    high: v.number(),
    low: v.number(),
    close: v.number(),
    volume: v.number(),
    period: v.union(v.literal("1m"), v.literal("5m"), v.literal("1h"), v.literal("1d")), // Time period
    sunspots: v.optional(v.number()), // Number of sunspots at this time (for MRK stock)
  })
    .index("by_company", ["companyId"])
    .index("by_symbol_time", ["symbol", "timestamp"])
    .index("by_period", ["period"]),

  // User Stock Holdings - stocks owned by users
  stockHoldings: defineTable({
    userId: v.id("users"),
    companyId: v.id("stockCompanies"),
    symbol: v.string(),
    shares: v.number(), // Number of shares owned
    averageCost: v.number(), // Average purchase price per share
    totalInvested: v.number(), // Total amount invested
    currentValue: v.number(), // Current market value
    realizedProfitLoss: v.number(), // Profit/loss from sold shares
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_company", ["userId", "companyId"])
    .index("by_symbol", ["symbol"]),

  // Stock Transactions - buy/sell history
  stockTransactions: defineTable({
    userId: v.id("users"),
    companyId: v.id("stockCompanies"),
    symbol: v.string(),
    type: v.union(v.literal("buy"), v.literal("sell")),
    shares: v.number(),
    pricePerShare: v.number(),
    totalAmount: v.number(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_timestamp", ["timestamp"]),

  // Investments table
  investments: defineTable({
    userId: v.id("users"),
    investmentType: v.string(), // "fixed_deposit", "mek_fund", etc.
    principalAmount: v.number(),
    currentValue: v.number(),
    interestRate: v.number(),
    startDate: v.number(),
    maturityDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("matured"),
      v.literal("withdrawn"),
      v.literal("cancelled")
    ),
    riskLevel: v.optional(v.string()), // "low", "medium", "high"
    lastInterestUpdate: v.optional(v.number()),
    totalInterestEarned: v.optional(v.number()),
    autoRenew: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_maturity", ["maturityDate"]),

  // Loans table  
  loans: defineTable({
    userId: v.id("users"),
    loanAmount: v.number(),
    remainingAmount: v.number(),
    interestRate: v.number(),
    dailyPayment: v.number(),
    startDate: v.number(),
    dueDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paid"),
      v.literal("defaulted"),
      v.literal("cancelled")
    ),
    collateralType: v.optional(v.string()), // "mek", "essence", etc.
    collateralId: v.optional(v.string()),
    collateralValue: v.optional(v.number()),
    defaultCount: v.optional(v.number()),
    lastPaymentDate: v.optional(v.number()),
    totalInterestPaid: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  // Bank Transactions - detailed transaction history
  bankTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdraw"),
      v.literal("loan_disbursement"),
      v.literal("loan_payment"),
      v.literal("interest_payment"),
      v.literal("investment_purchase"),
      v.literal("investment_redemption"),
      v.literal("dividend_payment"),
      v.literal("fee"),
      v.literal("transfer_in"),
      v.literal("transfer_out")
    ),
    amount: v.number(),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    description: v.optional(v.string()),
    relatedId: v.optional(v.string()), // Related loan/investment ID
    timestamp: v.number(),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("reversed")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Interest Rates - global interest rate configurations
  interestRates: defineTable({
    productType: v.string(), // "savings", "loan", "investment_type"
    accountLevel: v.optional(v.string()), // Account level requirement
    baseRate: v.number(), // Base interest rate
    bonusRate: v.optional(v.number()), // Additional bonus rate
    minAmount: v.optional(v.number()), // Minimum amount for this rate
    maxAmount: v.optional(v.number()), // Maximum amount for this rate
    effectiveFrom: v.number(), // When this rate becomes effective
    effectiveTo: v.optional(v.number()), // When this rate expires
    isActive: v.boolean(),
  })
    .index("by_product", ["productType"])
    .index("by_active", ["isActive"])
    .index("by_effective_date", ["effectiveFrom"]),

  // Sunspot Data - daily sunspot counts that influence MRK stock
  sunspotData: defineTable({
    date: v.string(), // Format: "YYYY-MM-DD"
    count: v.number(), // Number of sunspots
    timestamp: v.number(), // When this data was fetched
    percentChange: v.optional(v.number()),
    marketDirection: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("neutral"))),
    isOfficial: v.optional(v.boolean()),
  })
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),
  
  // Sunspot Trading Commitments - users place bets before data is known
  sunspotCommitments: defineTable({
    userId: v.id("users"),
    prediction: v.union(v.literal("up"), v.literal("down"), v.literal("neutral")),
    amount: v.number(),
    targetDate: v.string(),
    timestamp: v.number(),
    nonce: v.string(),
    status: v.union(v.literal("pending"), v.literal("settled"), v.literal("cancelled")),
    lockedUntil: v.number(),
    // Settlement fields
    settledAt: v.optional(v.number()),
    marketDirection: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("neutral"))),
    actualCount: v.optional(v.number()),
    percentChange: v.optional(v.number()),
    won: v.optional(v.boolean()),
    payout: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "targetDate"])
    .index("by_date_status", ["targetDate", "status"]),
  
  // Gold Escrow - holds gold during pending trades
  goldEscrow: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    targetDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "targetDate"]),
  
  // Gold Transactions - detailed gold transaction history
  goldTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    description: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Solar Flares - chronological log of solar flare events
  solarFlares: defineTable({
    date: v.string(), // Format: "YYYY-MM-DD"
    timestamp: v.number(), // Exact time of the flare
    class: v.string(), // Flare classification (A, B, C, M, X)
    peakTime: v.string(), // Time of peak intensity
    intensity: v.optional(v.number()), // Flare intensity value
    region: v.optional(v.number()), // Active region number
  })
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"])
    .index("by_class", ["class"]),

  // Code saves/backups
  saves: defineTable({
    name: v.string(), // Save name
    description: v.optional(v.string()), // Optional description
    filesCount: v.number(), // Number of files saved
    sizeInBytes: v.number(), // Total size of save
    createdAt: v.number(), // Timestamp
  })
    .index("by_created", ["createdAt"]),

  // Leaderboard Cache - pre-computed leaderboard data
  leaderboardCache: defineTable({
    category: v.string(), // "gold", "meks", "essence", "networth", "level"
    userId: v.id("users"),
    walletAddress: v.string(),
    username: v.optional(v.string()),
    value: v.number(), // The metric value (gold amount, mek count, etc.)
    rank: v.number(), // Pre-computed rank
    lastUpdated: v.number(),
    // Additional metadata for display
    metadata: v.optional(v.object({
      level: v.optional(v.number()),
      essenceBreakdown: v.optional(v.object({
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
      })),
      mekDetails: v.optional(v.object({
        total: v.number(),
        legendary: v.number(),
        epic: v.number(),
        rare: v.number(),
        uncommon: v.number(),
        common: v.number(),
        topMekAssetId: v.optional(v.string()),
        topMekLevel: v.optional(v.number()),
      })),
      goldPerHour: v.optional(v.number()),
      essencePerHour: v.optional(v.number()),
      bankBalance: v.optional(v.number()),
      stockValue: v.optional(v.number()),
      achievementScore: v.optional(v.number()),
      topMek: v.optional(v.object({
        assetId: v.string(),
        assetName: v.string(),
        level: v.number(),
        goldRate: v.number(),
        essenceRate: v.optional(v.number()),
        totalGold: v.optional(v.number()),
        totalEssence: v.optional(v.number()),
      })),
    })),
  })
    .index("by_category_rank", ["category", "rank"])
    .index("by_category_value", ["category", "value"])
    .index("by_user_category", ["userId", "category"])
    .index("by_updated", ["lastUpdated"]),

  // User Stats Cache - pre-computed user statistics
  userStatsCache: defineTable({
    userId: v.id("users"),
    mekCount: v.number(),
    totalEssence: v.number(),
    netWorth: v.number(),
    goldPerHour: v.number(),
    bankBalance: v.number(),
    stockValue: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_updated", ["lastUpdated"]),

  // Spells for spell caster minigame
  spells: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("offensive"),
      v.literal("defensive"),
      v.literal("utility"),
      v.literal("ultimate")
    ),
    manaCost: v.number(),
    cooldown: v.number(),
    castTime: v.number(),
    range: v.number(),
    
    // Effects array
    effects: v.array(v.object({
      type: v.union(
        v.literal("damage"),
        v.literal("heal"),
        v.literal("buff"),
        v.literal("debuff"),
        v.literal("summon"),
        v.literal("aoe"),
        v.literal("dot"),
        v.literal("hot"),
        v.literal("shield"),
        v.literal("stun"),
        v.literal("slow"),
        v.literal("speed")
      ),
      value: v.number(),
      duration: v.optional(v.number()),
      radius: v.optional(v.number()),
      tickRate: v.optional(v.number()),
    })),
    
    // Visual effects
    visuals: v.object({
      particleType: v.union(
        v.literal("fire"),
        v.literal("ice"),
        v.literal("lightning"),
        v.literal("nature"),
        v.literal("arcane"),
        v.literal("shadow"),
        v.literal("holy"),
        v.literal("physical")
      ),
      particleCount: v.number(),
      particleSpeed: v.number(),
      particleSize: v.number(),
      color1: v.string(),
      color2: v.string(),
      color3: v.optional(v.string()),
      emissionPattern: v.union(
        v.literal("burst"),
        v.literal("stream"),
        v.literal("spiral"),
        v.literal("rain"),
        v.literal("orbit"),
        v.literal("wave")
      ),
      trailEffect: v.boolean(),
      glowIntensity: v.number(),
    }),
    
    soundEffect: v.optional(v.string()),
    icon: v.optional(v.string()),
    requiredLevel: v.number(),
    requiredClass: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_level", ["requiredLevel"]),
    
  // Contracts for missions
  contracts: defineTable({
    userId: v.id("users"),
    location: v.string(),
    missionType: v.string(),
    duration: v.number(),
    goldFee: v.number(),
    mekIds: v.array(v.string()),
    biasScore: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed")
    ),
    rewards: v.optional(v.object({
      gold: v.number(),
      essence: v.string(),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_end_time", ["endTime"]),

  // Event Node Rewards configuration saves
  eventNodeConfigs: defineTable({
    userId: v.string(),
    name: v.string(),
    data: v.string(), // JSON string of the configuration
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Chip Definitions - templates for all possible chips
  chipDefinitions: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("attack"),
      v.literal("defense"),
      v.literal("utility"),
      v.literal("economy"),
      v.literal("special")
    ),
    tier: v.number(), // 1-7 for T1-T7
    imageUrl: v.optional(v.string()),
    possibleBuffs: v.array(v.object({
      buffType: v.string(),
      minValue: v.number(),
      maxValue: v.number(),
      weight: v.number(), // probability weight
    })),
    rankScaling: v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier", ["tier"])
    .index("by_category", ["category"])
    .index("by_name", ["name"]),

  // Chip Instances - actual chips owned by users
  chipInstances: defineTable({
    userId: v.id("users"),
    chipDefinitionId: v.id("chipDefinitions"),
    rank: v.string(), // D, C, B, A, S, SS, SSS, X, XX, XXX
    rolledBuffs: v.array(v.object({
      buffType: v.string(),
      value: v.number(),
    })),
    equipped: v.boolean(),
    equippedToMek: v.optional(v.id("meks")),
    equipmentSlot: v.optional(v.number()), // Which slot on the Mek (1-3)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_definition", ["chipDefinitionId"])
    .index("by_equipped_mek", ["equippedToMek"])
    .index("by_user_equipped", ["userId", "equipped"]),

  // Story Trees - saved story mode layouts for story climb
  storyTrees: defineTable({
    name: v.string(),
    chapter: v.number(),
    nodes: v.array(v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      label: v.string(),
      index: v.optional(v.number()),
      storyNodeType: v.optional(v.string()),
      completed: v.optional(v.boolean()),
      available: v.optional(v.boolean()),
      current: v.optional(v.boolean()),
    })),
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_chapter", ["chapter"]),

  // Buff Categories - admin-managed buff categories used throughout the site
  buffCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("gold"),
      v.literal("essence"),
      v.literal("rarity_bias"),
      v.literal("xp"),
      v.literal("mek_slot"),
      v.literal("market"),
      v.literal("reward_chance")
    )),
    unitType: v.optional(v.union(
      v.literal("flat_number"),        // +10
      v.literal("rate_change"),        // +0.1 essence/day
      v.literal("rate_percentage"),    // +1% essence/day
      v.literal("flat_percentage")     // +10%
    )),
    applicationType: v.optional(v.union(
      v.literal("universal"),          // Not tied to anything
      v.literal("attachable")          // Applied to a thing and moves with it
    )),
    // Old fields (deprecated - for migration)
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    multiplier: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),
});