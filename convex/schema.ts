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

    // Session Management & Mobile Tracking
    lastWalletType: v.optional(v.string()), // Last connected wallet (eternl, nami, etc.)
    lastConnectionPlatform: v.optional(v.string()), // mobile_ios, mobile_android, mobile_web, desktop
    lastConnectionTime: v.optional(v.number()), // Timestamp of last connection
    activeSessionId: v.optional(v.string()), // Current active session identifier
    sessionExpiresAt: v.optional(v.number()), // When current session expires
    preferredWallet: v.optional(v.string()), // User's preferred wallet for auto-connect
    totalConnectionCount: v.optional(v.number()), // Total number of connections made

    // Discord Integration
    discordUserId: v.optional(v.string()), // Discord user ID (snowflake)
    discordUsername: v.optional(v.string()), // Discord username for reference
    discordLinkedAt: v.optional(v.number()), // When Discord was linked
    
    // Profile fields
    username: v.optional(v.string()),
    displayName: v.optional(v.string()), // The actual display name shown to others (case-sensitive)
    displayNameLower: v.optional(v.string()), // Lowercase version for uniqueness checking
    displayNameSet: v.optional(v.boolean()), // Whether the user has set their display name
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileFrame: v.optional(v.string()), // Which frame they're using on profile page
    
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

    // Base slot values (before buffs)
    baseContractSlots: v.optional(v.number()),        // How many contracts can run at once (default: 2)
    baseChipSlots: v.optional(v.number()),            // How many chips per Mek (default: 3)

    // Inventory system - WoW style tabs
    inventoryTabsUnlocked: v.optional(v.number()),    // How many tabs unlocked (1-5, default: 1)
    inventoryTabCosts: v.optional(v.object({          // Cost paid for each tab
      tab2: v.optional(v.number()),
      tab3: v.optional(v.number()),
      tab4: v.optional(v.number()),
      tab5: v.optional(v.number()),
    })),

    // Calculated totals (with buffs applied) - computed at runtime
    totalContractSlots: v.optional(v.number()),       // Base + buffs from talent tree, chips, etc.
    
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
    .index("by_display_name_lower", ["displayNameLower"])
    .index("by_session_id", ["activeSessionId"])
    .index("by_session_expiry", ["sessionExpiresAt"]),

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
    category: v.string(), // e.g., "Gold Flat", "Essence Rate Global", etc.
    displayName: v.optional(v.string()), // Optional display name
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
      v.literal("mek"),
      v.literal("enclosure"),
      v.literal("oem"),
      v.literal("universal-chips")
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
    userId: v.optional(v.id("users")),
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
  normalMekRewardConfigs: defineTable({
    name: v.string(),
    data: v.string(),
    timestamp: v.number(),
  }),

  eventNodeConfigs: defineTable({
    userId: v.string(),
    name: v.string(),
    data: v.string(), // JSON string of the configuration
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Deployed Story Climb node data - live configuration (LEGACY - use storyClimbDeployments + storyClimbChapters instead)
  deployedStoryClimbData: defineTable({
    deploymentId: v.string(), // Unique deployment ID
    deployedAt: v.number(), // Timestamp
    deployedBy: v.string(), // User ID who deployed
    version: v.number(), // Version number for tracking
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("archived")),

    // JSON stringified node data arrays
    eventNodes: v.string(), // EventNodeData[]
    normalNodes: v.optional(v.string()), // NormalMekNodeData[]
    challengerNodes: v.optional(v.string()), // ChallengerNodeData[]
    miniBossNodes: v.optional(v.string()), // MiniBossNodeData[]
    finalBossNodes: v.optional(v.string()), // FinalBossNodeData[]

    // Metadata
    configurationName: v.optional(v.string()),
    configurationId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_deployed_by", ["deployedBy"])
    .index("by_deployment_id", ["deploymentId"]),

  // NEW OPTIMIZED SCHEMA - Story Climb Deployments (metadata only)
  storyClimbDeployments: defineTable({
    deploymentId: v.string(), // Unique deployment ID
    deployedAt: v.number(), // Timestamp
    deployedBy: v.string(), // User ID who deployed
    version: v.number(), // Version number for tracking
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("archived")),

    // Metadata
    configurationName: v.optional(v.string()),
    configurationId: v.optional(v.string()),
    notes: v.optional(v.string()),

    // Stats for convenience
    totalEventNodes: v.optional(v.number()),
    totalNormalNodes: v.optional(v.number()),
    totalChallengerNodes: v.optional(v.number()),
    totalMiniBossNodes: v.optional(v.number()),
    totalFinalBossNodes: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_deployed_by", ["deployedBy"])
    .index("by_deployment_id", ["deploymentId"]),

  // NEW OPTIMIZED SCHEMA - Story Climb Chapters (per-chapter data, ~90% bandwidth reduction)
  storyClimbChapters: defineTable({
    deploymentId: v.string(), // Links to storyClimbDeployments
    chapter: v.number(), // Chapter number (1-10)

    // JSON stringified node data arrays (per chapter only - ~400 nodes vs 4,000)
    eventNodes: v.string(), // EventNodeData[] for this chapter
    normalNodes: v.string(), // NormalMekNodeData[] for this chapter (~350 nodes)
    challengerNodes: v.string(), // ChallengerNodeData[] for this chapter (~40 nodes)
    miniBossNodes: v.string(), // MiniBossNodeData[] for this chapter (~9 nodes)
    finalBossNodes: v.string(), // FinalBossNodeData[] for this chapter (~1 node)

    // Cached for quick lookups
    nodeCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_deployment_id", ["deploymentId"])
    .index("by_deployment_and_chapter", ["deploymentId", "chapter"])
    .index("by_chapter", ["chapter"]),

  // Chip Definitions - templates for all possible chips
  chipDefinitions: defineTable({
    name: v.string(),
    imageUrl: v.optional(v.string()),
    // Temporary fields to allow clearing old data
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.number()),
    possibleBuffs: v.optional(v.array(v.object({
      buffType: v.string(),
      minValue: v.number(),
      maxValue: v.number(),
      weight: v.number(),
    }))),
    rankScaling: v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
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
      challenger: v.optional(v.boolean()), // Higher rank mechanism that's tougher
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
      v.literal("reward_chance"),
      v.literal("success")
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
    tierStart: v.optional(v.number()), // 1-10 for chip/mechanism tiers
    tierEnd: v.optional(v.number()), // 1-10 for chip/mechanism tiers
    enabledForUniversalChips: v.optional(v.boolean()), // Whether this buff can appear on universal power chips
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

  // Mechanism Tier Configuration - divides 4000 mechanisms into 10 tiers
  mechanismTiers: defineTable({
    tier: v.number(), // 1-10
    startRank: v.number(), // Starting mechanism rank for this tier
    endRank: v.number(), // Ending mechanism rank for this tier
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier", ["tier"]),

  // Chip configuration tables
  chipMasterRanges: defineTable({
    buffCategoryId: v.id("buffCategories"),
    min: v.number(),
    max: v.number(),
    curvePower: v.optional(v.number()), // 1 = linear, >1 = exponential
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buff_category", ["buffCategoryId"]),

  chipConfigurations: defineTable({
    tier: v.number(), // 1-10
    rank: v.string(), // D, C, B, A, S, SS, SSS, X, XX, XXX
    buffs: v.array(v.object({
      buffCategoryId: v.id("buffCategories"),
      procChance: v.number(),
      minValue: v.number(),
      maxValue: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier_rank", ["tier", "rank"]),

  // Game constants and configuration
  gameConstants: defineTable({
    category: v.string(),
    setting: v.string(),
    value: v.union(v.string(), v.number()),
    description: v.string(),
    configurable: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"]),

  // Dev toolbar settings
  devToolbarSettings: defineTable({
    buttons: v.array(v.object({
      name: v.string(),
      url: v.string(),
      favorite: v.boolean(),
      color: v.string(),
      order: v.optional(v.number()),
      isDivider: v.optional(v.boolean()),
    })),
    updatedAt: v.number(),
  }),

  // Difficulty system configuration
  difficultyConfigs: defineTable({
    nodeType: v.optional(v.union(
      v.literal("normal"),
      v.literal("challenger"),
      v.literal("event"),
      v.literal("miniboss"),
      v.literal("final_boss")
    )),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),

    // Success thresholds
    successGreenLine: v.number(), // Percentage required for guaranteed success (5%, 30%, 75%)

    // Reward multipliers
    goldMultiplier: v.number(), // Base gold reward multiplier
    xpMultiplier: v.number(), // Base XP reward multiplier
    essenceAmountMultiplier: v.number(), // Amount of essence received multiplier

    // Cost modifiers
    deploymentFeeMultiplier: v.number(), // Entry cost multiplier

    // Essence rarity distribution modifiers
    commonEssenceBoost: v.number(), // Percentage adjustment to common essence drop rate
    rareEssencePenalty: v.number(), // Percentage adjustment to rare essence drop rate

    // Overshoot bonus configuration
    overshootBonusRate: v.number(), // Bonus percentage per point over green line
    maxOvershootBonus: v.number(), // Maximum possible overshoot bonus percentage

    // Mek slot configuration
    minSlots: v.optional(v.number()), // Minimum number of mek slots
    maxSlots: v.optional(v.number()), // Maximum number of mek slots
    singleSlotChance: v.optional(v.number()), // Percentage chance of getting single slot

    // Visual and UI settings
    colorTheme: v.string(), // Color theme for UI (green, yellow, red)
    displayName: v.string(), // Display name for UI
    description: v.optional(v.string()), // Description for players

    // System
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_node_and_difficulty", ["nodeType", "difficulty"])
    .index("by_difficulty", ["difficulty"]),

  // Attribute rarity lookup table for essence drop calculations
  attributeRarity: defineTable({
    // Unique identifier (should only have one document)
    type: v.literal("singleton"),

    // Head variations with counts and calculated drop chances
    heads: v.optional(v.any()), // Map of head name -> { count, appearanceRate, dropChance }

    // Body variations with counts and calculated drop chances
    bodies: v.optional(v.any()), // Map of body name -> { count, appearanceRate, dropChance }

    // Trait variations with counts and calculated drop chances
    traits: v.optional(v.any()), // Map of trait name -> { count, appearanceRate, dropChance }

    // Metadata
    totalMeks: v.number(), // Total number of meks analyzed (should be 4000)
    lastUpdated: v.number(), // Timestamp of last update
    version: v.number(), // Version number for cache invalidation
  })
    .index("by_type", ["type"]),

  // Full collection of all 4000 unique meks with their attributes
  mekCollection: defineTable({
    rank: v.number(), // Rarity rank 1-4000 (1 = rarest)
    assetId: v.string(), // Unique asset ID
    sourceKey: v.string(), // Source key for image lookup
    head: v.string(), // Head variation name
    body: v.string(), // Body variation name
    trait: v.string(), // Trait variation name
  })
    .index("by_rank", ["rank"])
    .index("by_asset_id", ["assetId"])
    .index("by_head", ["head"])
    .index("by_body", ["body"])
    .index("by_trait", ["trait"]),

  // MEC Talent Tree Tables for buff values by rank ranges
  mekTreeTables: defineTable({
    category: v.string(), // Buff category name (e.g., "Gold Flat", "Essence Rate Global")
    rankRange: v.string(), // Rank range (e.g., "1-10", "11-100", etc.)
    talentTier: v.string(), // Talent tier (T1-T10)
    value: v.number(), // Buff value for this category, rank range, and talent tier
  })
    .index("by_category", ["category"])
    .index("by_category_and_range", ["category", "rankRange"])
    .index("by_category_range_tier", ["category", "rankRange", "talentTier"]),

  // Saved configurations for MEC Talent Tree Tables
  mekTreeTableSaves: defineTable({
    saveName: v.string(), // User-defined name for this save
    timestamp: v.number(), // Unix timestamp when saved
    description: v.optional(v.string()), // Optional description
    data: v.array(
      v.object({
        category: v.string(),
        rankRange: v.string(),
        talentTier: v.string(),
        value: v.number(),
      })
    ), // Complete snapshot of all table data
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_name", ["saveName"]),

  // Saved configurations for Mek Success Rate curves
  mekSuccessRateSaves: defineTable({
    saveName: v.string(), // User-defined name for this save
    timestamp: v.number(), // Unix timestamp when saved
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minSuccess: v.number(),
    maxSuccess: v.number(),
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
    rounding: v.optional(v.union(
      v.literal('whole'),
      v.literal('1decimal'),
      v.literal('2decimal'),
      v.literal('none')
    )), // Rounding option for success percentages
    isCurrentConfig: v.optional(v.boolean()), // Flag to mark the active configuration
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_name", ["saveName"])
    .index("by_current", ["isCurrentConfig"]),

  // Saved configurations for Mek Gold Rate curves
  mekGoldRateSaves: defineTable({
    saveName: v.string(), // User-defined name for this save
    timestamp: v.number(), // Unix timestamp when saved
    curveType: v.union(
      v.literal('linear'),
      v.literal('exponential'),
      v.literal('logarithmic'),
      v.literal('sigmoid')
    ),
    minGold: v.number(), // Minimum gold per hour (for rarest)
    maxGold: v.number(), // Maximum gold per hour (for most common)
    steepness: v.number(),
    midPoint: v.number(),
    totalMeks: v.number(),
    rounding: v.optional(v.union(
      v.literal('whole'),
      v.literal('1decimal'),
      v.literal('2decimal'),
      v.literal('none')
    )), // Rounding option for gold rates
    isCurrentConfig: v.optional(v.boolean()), // Flag to mark the active configuration
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_name", ["saveName"])
    .index("by_current", ["isCurrentConfig"]),

  // Variation buff configuration
  variationBuffConfig: defineTable({
    minPercent: v.number(),
    maxPercent: v.number(),
    curveType: v.union(v.literal('linear'), v.literal('exponential'), v.literal('logarithmic')),
    curveFactor: v.number(),
  }),

  // Variation buff assignments
  variationBuffs: defineTable({
    variationId: v.number(),
    name: v.string(),
    category: v.union(v.literal('head'), v.literal('body'), v.literal('item')),
    buffPercent: v.number(),
  })
    .index("by_variation", ["variationId", "category"])
    .index("by_category", ["category"])
    .index("by_buff", ["buffPercent"]),

  // Gold Mining System for wallet-connected users (SIMPLIFIED)
  goldMining: defineTable({
    // Wallet identification
    walletAddress: v.string(), // Stake address for NFT ownership
    walletType: v.optional(v.string()), // nami, eternl, flint, etc.
    paymentAddresses: v.optional(v.array(v.string())), // Payment addresses for Blockfrost fallback

    // Company identity
    companyName: v.optional(v.string()), // User-chosen company name (alphanumeric only)

    // Blockchain verification status
    isBlockchainVerified: v.optional(v.boolean()), // Has the user completed blockchain verification?
    lastVerificationTime: v.optional(v.number()), // When was the last verification performed
    consecutiveSnapshotFailures: v.optional(v.number()), // Track consecutive failed snapshots (default: 0)

    // Mek ownership data
    ownedMeks: v.array(v.object({
      assetId: v.string(), // Unique asset ID from blockchain
      policyId: v.string(), // Policy ID for verification
      assetName: v.string(), // Name of the Mek
      imageUrl: v.optional(v.string()), // Thumbnail URL
      goldPerHour: v.number(), // Base gold generation rate (LEGACY - use baseGoldPerHour)
      rarityRank: v.optional(v.number()), // Rarity ranking
      headVariation: v.optional(v.string()),
      bodyVariation: v.optional(v.string()),
      itemVariation: v.optional(v.string()),
      // New fields for level boost tracking
      baseGoldPerHour: v.optional(v.number()), // Original rate from rarity (immutable)
      currentLevel: v.optional(v.number()), // Current level (1-10)
      levelBoostPercent: v.optional(v.number()), // Boost percentage from level (0-90)
      levelBoostAmount: v.optional(v.number()), // Actual boost amount in gold/hr
      effectiveGoldPerHour: v.optional(v.number()), // baseGoldPerHour + levelBoostAmount
    })),

    // Gold accumulation (SIMPLIFIED: Gold = (now - createdAt) × totalGoldPerHour, capped at 50,000)
    totalGoldPerHour: v.number(), // Sum of all Mek rates (including boosts)
    baseGoldPerHour: v.optional(v.number()), // Sum of all base Mek rates (without boosts)
    boostGoldPerHour: v.optional(v.number()), // Sum of all level boosts
    lastActiveTime: v.number(), // Last time user was active on page
    accumulatedGold: v.optional(v.number()), // Gold accumulated up to lastSnapshotTime
    lastSnapshotTime: v.optional(v.number()), // Time of last offline accumulation snapshot

    // Gold spending tracking (for Mek leveling)
    totalGoldSpentOnUpgrades: v.optional(v.number()), // Total gold spent on Mek upgrades
    totalUpgradesPurchased: v.optional(v.number()), // Total number of upgrades bought
    lastUpgradeSpend: v.optional(v.number()), // Timestamp of last upgrade purchase

    // Cumulative gold tracking
    totalCumulativeGold: v.optional(v.number()), // Total gold earned all-time (never decreases)

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.optional(v.number()), // For optimistic concurrency control (prevents race conditions)

    // LEGACY FIELDS (kept for backwards compatibility)
    currentGold: v.optional(v.number()), // LEGACY: Use accumulatedGold instead
    lastCheckTime: v.optional(v.number()), // LEGACY: No longer needed
    sessionStartTime: v.optional(v.number()), // LEGACY: No longer needed
    offlineEarnings: v.optional(v.number()), // LEGACY: No longer needed
    snapshotMekCount: v.optional(v.number()), // Mek count from last snapshot
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_total_rate", ["totalGoldPerHour"]),

  // Duration Configuration for Story Climb nodes
  durationConfigs: defineTable({
    name: v.string(), // Configuration name (e.g., "Default", "Speed Run", "Marathon")
    isActive: v.boolean(), // Whether this config is currently deployed to Story Climb

    // Duration settings for each node type
    normal: v.object({
      min: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      max: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      curve: v.number(),
    }),
    challenger: v.object({
      min: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      max: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      curve: v.number(),
    }),
    miniboss: v.object({
      min: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      max: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      curve: v.number(),
    }),
    event: v.object({
      min: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      max: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      curve: v.number(),
    }),
    finalboss: v.object({
      min: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      max: v.object({ days: v.number(), hours: v.number(), minutes: v.number(), seconds: v.number() }),
      curve: v.number(),
    }),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    deployedAt: v.optional(v.number()), // When this config was last deployed
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  // Gold Mining Snapshot Logs - tracks nightly wallet verification
  goldMiningSnapshotLogs: defineTable({
    timestamp: v.number(), // When snapshot was run
    totalMiners: v.number(), // Total number of wallets checked
    updatedCount: v.number(), // Number successfully updated
    errorCount: v.number(), // Number of errors encountered
    status: v.string(), // "completed", "failed", "triggered_manually", etc.
  }),

  // Saga Executions - tracks atomic NFT sync operations with rollback capability
  sagaExecutions: defineTable({
    sagaId: v.string(), // Unique saga identifier
    walletAddress: v.string(), // Which wallet this saga is for
    steps: v.array(v.object({
      name: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("compensated")
      ),
      startTime: v.optional(v.number()),
      endTime: v.optional(v.number()),
      error: v.optional(v.string()),
      data: v.optional(v.any()),
    })),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("compensating")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    checksum: v.optional(v.string()), // Checksum for verification
  })
    .index("by_saga_id", ["sagaId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_status", ["status"]),

  // Sync Checksums - tracks data integrity checksums for each wallet
  syncChecksums: defineTable({
    walletAddress: v.string(),
    checksum: v.string(), // Current checksum
    mekCount: v.number(), // Number of Meks
    lastSyncTime: v.number(), // When last synced
    lastVerifiedTime: v.number(), // When last verified
    status: v.union(
      v.literal("synced"), // In sync with blockchain
      v.literal("desynced"), // Out of sync
      v.literal("unknown") // Not yet verified
    ),
    discrepancies: v.optional(v.array(v.string())), // List of issues found
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_status", ["status"]),

  // Mek Ownership History - stores snapshots of which Meks were in which wallets over time
  // Updated: Added display fields (bodyVariation, headVariation, imageUrl, itemVariation, policyId)
  mekOwnershipHistory: defineTable({
    walletAddress: v.string(), // Which wallet this snapshot is for
    groupId: v.optional(v.string()), // Which corporation/group this wallet was in at snapshot time
    companyName: v.optional(v.string()), // Corporation name at snapshot time
    snapshotTime: v.number(), // When this snapshot was taken
    meks: v.array(v.object({
      assetId: v.string(), // Unique asset ID
      assetName: v.string(), // Mek name
      policyId: v.optional(v.string()), // Policy ID for the NFT
      goldPerHour: v.number(), // Gold rate for this Mek at this time
      rarityRank: v.optional(v.number()),
      baseGoldPerHour: v.optional(v.number()), // Base rate before level boosts
      currentLevel: v.optional(v.number()), // Mek level at time of snapshot
      levelBoostPercent: v.optional(v.number()), // Level boost percentage
      levelBoostAmount: v.optional(v.number()), // Level boost gold amount
      bodyVariation: v.optional(v.string()), // Body variation name
      headVariation: v.optional(v.string()), // Head variation name
      imageUrl: v.optional(v.string()), // Image path
      itemVariation: v.optional(v.string()), // Item/trait variation name
    })),
    totalGoldPerHour: v.number(), // Total rate at time of snapshot
    totalMekCount: v.number(), // How many Meks were present

    // Complete game state (added for full restoration)
    accumulatedGold: v.optional(v.number()), // Gold accumulated at time of snapshot
    totalCumulativeGold: v.optional(v.number()), // Total cumulative gold earned
    totalGoldSpentOnUpgrades: v.optional(v.number()), // Total gold spent on upgrades
    lastActiveTime: v.optional(v.number()), // Last active time at snapshot
    lastSnapshotTime: v.optional(v.number()), // Previous snapshot time

    // New gold tracking fields for blockchain snapshot system
    spendableGold: v.optional(v.number()), // Current spendable gold at time of snapshot
    cumulativeGoldEarned: v.optional(v.number()), // Total gold earned over all time (never decreases)

    verificationStatus: v.optional(v.union(
      v.literal("verified"), // Blockchain lookup succeeded
      v.literal("lookup_failed"), // Blockchain lookup failed - data preserved
      v.literal("validation_failed"), // Data didn't pass validation checks
      v.literal("uncertain") // Unknown status (for old snapshots)
    )),
    verificationError: v.optional(v.string()), // Error message if lookup failed
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_time", ["walletAddress", "snapshotTime"])
    .index("by_status", ["verificationStatus"]),

  // Node Fee Configuration for Story Climb
  nodeFeeConfig: defineTable({
    fees: v.any(), // Object containing fee configs for each node type
    createdAt: v.number(),
    updatedAt: v.number(),
    lastVersionId: v.optional(v.id("nodeFeeVersions")),
  }),

  // Node Fee Versions - Named saves
  nodeFeeVersions: defineTable({
    name: v.string(),
    fees: v.any(),
    createdAt: v.number(),
    isAutoSave: v.optional(v.boolean()),
  }),

  // Active Missions - tracks missions currently in progress
  activeMissions: defineTable({
    nodeId: v.string(),
    nodeType: v.string(),
    nodeName: v.string(),
    startTime: v.number(),
    duration: v.number(), // Duration in milliseconds
    contractFee: v.number(),
    expectedRewards: v.object({
      gold: v.optional(v.number()),
      essence: v.optional(v.number()),
      chipT1: v.optional(v.number()),
      special: v.optional(v.number()),
    }),
    selectedMeks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      rank: v.number(),
      matchedTraits: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        image: v.string(),
        bonus: v.string(),
      }))),
    })),
    difficulty: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_node", ["nodeId"])
    .index("by_status", ["status"])
    .index("by_start_time", ["startTime"]),

  // Gold Backups - disaster recovery snapshots of all user gold states
  goldBackups: defineTable({
    // Backup metadata
    backupTimestamp: v.number(), // When this backup was created
    backupName: v.optional(v.string()), // Optional name for manual backups
    backupType: v.union(
      v.literal("auto_daily"),
      v.literal("manual"),
      v.literal("pre_update"),
      v.literal("pre_migration"),
      v.literal("emergency")
    ),
    triggeredBy: v.optional(v.string()), // Who/what triggered this backup
    totalUsersBackedUp: v.number(), // Count of users in this backup
    notes: v.optional(v.string()), // Optional notes about this backup

    // Snapshot metadata
    snapshotVersion: v.number(), // Version number for backup format
    systemVersion: v.optional(v.string()), // App version when backup was made
  })
    .index("by_timestamp", ["backupTimestamp"])
    .index("by_type", ["backupType"])
    .index("by_name", ["backupName"]),

  // Gold Backup User Data - individual user gold states within each backup
  goldBackupUserData: defineTable({
    // Reference to the backup
    backupId: v.id("goldBackups"),

    // User identification
    walletAddress: v.string(),
    userId: v.optional(v.id("users")), // Reference to users table if exists

    // Gold state at time of backup
    currentGold: v.number(), // Gold amount calculated at backup time
    goldPerHour: v.number(), // Gold generation rate per hour
    accumulatedGold: v.optional(v.number()), // Previously accumulated gold
    lastSnapshotTime: v.optional(v.number()), // Last rate update timestamp

    // Mining data
    totalGoldPerHour: v.optional(v.number()), // From goldMining table
    mekCount: v.number(), // Number of meks owned
    lastActiveTime: v.optional(v.number()), // When user was last active

    // Backup metadata
    backupTimestamp: v.number(), // When this user's data was backed up
    calculationMethod: v.optional(v.string()), // How gold was calculated

    // Mek data snapshot (for verification)
    topMekGoldRate: v.optional(v.number()), // Highest gold rate mek
    topMekAssetId: v.optional(v.string()), // Asset ID of top mek
    totalMekGoldRate: v.optional(v.number()), // Sum of all mek rates

    // Additional game state
    level: v.optional(v.number()),
    experience: v.optional(v.number()),
    bankBalance: v.optional(v.number()), // From bank account if exists
  })
    .index("by_backup", ["backupId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_backup_wallet", ["backupId", "walletAddress"])
    .index("by_timestamp", ["backupTimestamp"]),

  // Audit logs for blockchain verification and security
  auditLogs: defineTable({
    type: v.string(), // "verification", "walletConnection", "rateChange", "goldCheckpoint", "walletLink", "mekUpgrade"

    // Common fields
    timestamp: v.number(),
    createdAt: v.number(),

    // Verification logs
    stakeAddress: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    source: v.optional(v.string()), // "blockfrost" or "koios"
    walletCount: v.optional(v.number()),
    blockchainCount: v.optional(v.number()),

    // Wallet connection logs
    walletName: v.optional(v.string()),
    signatureVerified: v.optional(v.boolean()),
    nonce: v.optional(v.string()),

    // Rate change logs
    mekNumber: v.optional(v.number()),
    oldRate: v.optional(v.number()),
    newRate: v.optional(v.number()),
    changedBy: v.optional(v.string()),
    reason: v.optional(v.string()),

    // Gold checkpoint logs
    goldAmount: v.optional(v.number()),
    merkleRoot: v.optional(v.string()),
    blockHeight: v.optional(v.number()),

    // Wallet link logs
    primaryWallet: v.optional(v.string()),
    linkedWallet: v.optional(v.string()),

    // Mek upgrade logs
    assetId: v.optional(v.string()),
    assetName: v.optional(v.string()),
    oldLevel: v.optional(v.number()),
    newLevel: v.optional(v.number()),
    upgradeCost: v.optional(v.number()),
    newGoldPerHour: v.optional(v.number()),
    boostAmount: v.optional(v.number()),
    upgradedBy: v.optional(v.string()), // Who performed the upgrade
    mekOwner: v.optional(v.string()), // Who owns the mek
  })
    .index("by_type", ["type"])
    .index("by_stake_address", ["stakeAddress"])
    .index("by_timestamp", ["timestamp"])
    .index("by_created", ["createdAt"]),

  // Wallet Sessions - active login sessions (separate from signatures)
  walletSessions: defineTable({
    // Session identification
    sessionId: v.string(), // Unique session ID
    stakeAddress: v.string(), // Wallet stake address
    walletName: v.string(), // Wallet type (nami, eternl, etc.)

    // Session lifecycle
    createdAt: v.number(), // When session was created
    expiresAt: v.number(), // When session expires (24 hours from creation)
    lastActivityAt: v.number(), // Last activity timestamp (for session extension)
    isActive: v.boolean(), // Is this session currently active?

    // Device binding
    deviceId: v.optional(v.string()), // Device identifier for multi-device tracking
    platform: v.optional(v.string()), // mobile_ios, mobile_android, mobile_web, desktop
    origin: v.optional(v.string()), // Origin URL for CORS validation

    // Link to signature verification (optional - for audit trail)
    signatureId: v.optional(v.id("walletSignatures")), // Reference to signature that created this session
    nonce: v.optional(v.string()), // Nonce used during authentication

    // Security metadata
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Revocation support
    revokedAt: v.optional(v.number()), // If manually revoked
    revokeReason: v.optional(v.string()), // Why it was revoked
  })
    .index("by_session_id", ["sessionId"])
    .index("by_stake_address", ["stakeAddress"])
    .index("by_stake_and_active", ["stakeAddress", "isActive"])
    .index("by_expires", ["expiresAt"])
    .index("by_active", ["isActive"])
    .index("by_device", ["deviceId"])
    .index("by_last_activity", ["lastActivityAt"]),

  // Wallet signatures for secure connections
  walletSignatures: defineTable({
    stakeAddress: v.string(),
    nonce: v.string(),
    signature: v.string(),
    walletName: v.string(),
    verified: v.boolean(), // DEPRECATED - use usedAt instead
    expiresAt: v.number(),
    createdAt: v.number(),

    // Security enhancements
    deviceId: v.optional(v.string()), // Device identifier for binding
    origin: v.optional(v.string()), // Origin URL for CORS validation
    usedAt: v.optional(v.number()), // Timestamp when nonce was consumed (replaces verified boolean)

    // Mobile & Platform Tracking
    platform: v.optional(v.string()), // mobile_ios, mobile_android, mobile_web, desktop
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      screenWidth: v.optional(v.number()),
      screenHeight: v.optional(v.number()),
      deviceType: v.optional(v.string()), // phone, tablet, desktop
      os: v.optional(v.string()), // iOS, Android, Windows, macOS, Linux
    })),
  })
    .index("by_stake_address", ["stakeAddress"])
    .index("by_nonce", ["nonce"])
    .index("by_expires", ["expiresAt"])
    .index("by_platform", ["platform"])
    .index("by_used", ["usedAt"]) // For cleanup queries
    .index("by_nonce_stake_device", ["nonce", "stakeAddress", "deviceId"]), // Unique constraint enforcement

  // Multi-wallet aggregation
  walletLinks: defineTable({
    primaryWallet: v.string(),
    linkedWallet: v.string(),
    signatureVerified: v.boolean(),
    linkDate: v.number(),
    active: v.boolean(),
  })
    .index("by_primary", ["primaryWallet"])
    .index("by_linked", ["linkedWallet"])
    .index("by_primary_active", ["primaryWallet", "active"]),

  // Gold checkpoints for on-chain verification
  goldCheckpoints: defineTable({
    walletAddress: v.string(),
    goldAmount: v.number(),
    goldPerHour: v.number(),
    timestamp: v.number(),
    type: v.string(), // 'manual', 'automatic', 'restore'
    merkleRoot: v.optional(v.string()),
    blockHeight: v.optional(v.number()),
    mekCount: v.optional(v.number()),
    totalGoldRate: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"]),

  // Gold snapshots for historical tracking
  goldSnapshots: defineTable({
    walletAddress: v.string(),
    accumulatedGold: v.number(),
    goldPerHour: v.number(),
    mekCount: v.number(),
    timestamp: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_timestamp", ["timestamp"]),

  // CIP-25 NFT metadata cache
  nftMetadata: defineTable({
    assetId: v.string(),
    assetName: v.string(),
    metadata: v.any(), // Full CIP-25 metadata object
    mekData: v.any(), // Extracted MEK-specific data
    resolvedImage: v.optional(v.string()), // Resolved IPFS image URL
    fetchedAt: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_asset_id", ["assetId"])
    .index("by_asset_name", ["assetName"])
    .index("by_updated", ["lastUpdated"]),

  // Security anomalies detected in the system
  securityAnomalies: defineTable({
    type: v.string(),
    walletAddress: v.string(),
    detail: v.string(),
    timestamp: v.number(),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_severity", ["severity"])
    .index("by_created", ["createdAt"])
    .index("by_resolved", ["resolved"]),

  // Wallets flagged as suspicious
  suspiciousWallets: defineTable({
    walletAddress: v.string(),
    reason: v.string(),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    flaggedAt: v.number(),
    active: v.boolean(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_severity", ["severity"])
    .index("by_active", ["active"]),

  // Rate limit violations
  rateLimitViolations: defineTable({
    walletAddress: v.string(),
    endpoint: v.string(),
    timestamp: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_timestamp", ["timestamp"]),

  // Wallet Groups - allows users to link multiple wallets into a single corporation
  walletGroups: defineTable({
    groupId: v.string(), // UUID for this wallet group
    primaryWallet: v.string(), // First wallet added (cosmetic, for UI defaults)
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_primaryWallet", ["primaryWallet"]),

  // Wallet Group Memberships - tracks which wallets belong to which groups
  walletGroupMemberships: defineTable({
    groupId: v.string(), // Reference to walletGroups
    walletAddress: v.string(), // Stake address
    addedAt: v.number(),
    nickname: v.optional(v.string()), // User-defined nickname (e.g., "Main Wallet", "Trading Wallet")
    originalCompanyName: v.optional(v.string()), // Original corporation name before joining group (for restoration on removal)
  })
    .index("by_wallet", ["walletAddress"]) // CRITICAL: Find group from ANY wallet
    .index("by_group", ["groupId"]), // Get all wallets in a group

  // Discord connections - links wallet GROUPS to Discord accounts
  discordConnections: defineTable({
    groupId: v.optional(v.string()), // Reference to walletGroups (changed from walletAddress) - optional for backward compatibility
    walletAddress: v.optional(v.string()), // Legacy field - kept for backward compatibility
    discordUserId: v.string(), // Discord snowflake ID
    discordUsername: v.string(), // For display
    guildId: v.string(), // Discord server ID
    linkedAt: v.number(),
    active: v.boolean(),
    lastNicknameUpdate: v.optional(v.number()),
    currentEmoji: v.optional(v.string()),
  })
    .index("by_group", ["groupId", "guildId"])
    .index("by_discord_user", ["discordUserId", "guildId"])
    .index("by_guild", ["guildId"])
    .index("by_active", ["active"]),

  // Discord gold tier configuration
  discordGoldTiers: defineTable({
    tierName: v.string(),
    minGold: v.number(),
    maxGold: v.optional(v.number()),
    emoji: v.string(),
    order: v.number(), // Display order (higher gold = higher order)
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_active", ["active"]),

  // Bot testing system - wallet snapshot
  walletSnapshot: defineTable({
    address: v.string(),
    mekCount: v.number(),
    mekVariations: v.array(v.string()),
    lastActivity: v.number(),
    isActive: v.boolean(),
  })
    .index("by_address", ["address"])
    .index("by_active", ["isActive"]),

  // Admin Notifications - system alerts for admins
  adminNotifications: defineTable({
    type: v.string(), // "snapshot_failure_threshold", "system_error", etc.
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
    title: v.string(),
    message: v.string(),
    walletAddress: v.optional(v.string()),
    data: v.optional(v.any()), // Additional data related to the notification
    timestamp: v.number(),
    read: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index("by_read", ["read"])
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"])
    .index("by_severity", ["severity"]),

  // Wallet Rate Limiting - tracks authentication attempts
  walletRateLimits: defineTable({
    stakeAddress: v.string(),
    actionType: v.string(), // "nonce_generation", "signature_verification"
    attemptCount: v.number(),
    windowStart: v.number(), // Start of the current rate limit window
    consecutiveFailures: v.optional(v.number()), // Track consecutive failed attempts
    lockedUntil: v.optional(v.number()), // Lockout expiration timestamp
    lastAttemptAt: v.number(),
  })
    .index("by_stake_address_action", ["stakeAddress", "actionType"])
    .index("by_locked_until", ["lockedUntil"]),

  // MEK LEVELING SYSTEM TABLES

  // Mek Levels - tracks level data per wallet+mek combination
  mekLevels: defineTable({
    // Composite key for wallet-bound levels
    walletAddress: v.string(), // Wallet that owns the leveled Mek
    assetId: v.string(), // Unique Mek asset ID
    mekNumber: v.optional(v.number()), // Mek number for display

    // Level data
    currentLevel: v.number(), // Current level (1-10)
    experience: v.optional(v.number()), // Experience points (future use)
    totalGoldSpent: v.number(), // Total gold invested in this Mek

    // Gold rate boost tracking
    baseGoldPerHour: v.optional(v.number()), // Base rate when first leveled
    currentBoostPercent: v.optional(v.number()), // Current boost percentage (0-90)
    currentBoostAmount: v.optional(v.number()), // Actual boost in gold/hr

    // Ownership tracking
    levelAcquiredAt: v.number(), // When this wallet first got the Mek
    lastUpgradeAt: v.optional(v.number()), // Last upgrade timestamp
    lastVerifiedAt: v.number(), // Last ownership verification
    ownershipStatus: v.string(), // "verified", "pending", "transferred"

    // Transfer history
    previousMaxLevel: v.optional(v.number()), // Max level reached before transfer
    previousOwners: v.optional(v.array(v.object({
      walletAddress: v.string(),
      acquiredAt: v.number(),
      transferredAt: v.optional(v.number()),
      maxLevelReached: v.number(),
      totalGoldSpent: v.number(),
    }))),

    // Rate limiting
    upgradeCount24h: v.optional(v.number()), // Upgrades in last 24 hours
    lastUpgradeDay: v.optional(v.string()), // Date string for daily reset

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_wallet_asset", ["walletAddress", "assetId"])
    .index("by_asset", ["assetId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_level", ["currentLevel"])
    .index("by_ownership", ["ownershipStatus"])
    .index("by_verification", ["lastVerifiedAt"]),

  // Level Upgrades - audit log of all upgrade transactions
  levelUpgrades: defineTable({
    // Transaction data
    upgradeId: v.string(), // Unique upgrade ID
    walletAddress: v.string(), // Wallet that performed upgrade
    assetId: v.string(), // Mek being upgraded
    mekNumber: v.optional(v.number()), // For display

    // Level change
    fromLevel: v.number(), // Starting level
    toLevel: v.number(), // Target level
    goldCost: v.number(), // Gold spent

    // Verification
    signatureRequired: v.boolean(), // Was signature required (levels 8-10)
    signatureHash: v.optional(v.string()), // Signature hash if required
    ownershipVerified: v.boolean(), // Was ownership verified before upgrade

    // Transaction status
    status: v.string(), // "pending", "completed", "failed", "refunded"
    failureReason: v.optional(v.string()), // Why it failed if applicable

    // Timestamps
    timestamp: v.number(), // When upgrade occurred
    completedAt: v.optional(v.number()), // When transaction completed

    // Gold tracking
    goldBalanceBefore: v.number(), // Gold balance before upgrade
    goldBalanceAfter: v.number(), // Gold balance after upgrade

    // Additional metadata
    ipAddress: v.optional(v.string()), // For rate limiting
    userAgent: v.optional(v.string()), // Browser info
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_asset", ["assetId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"])
    .index("by_wallet_asset", ["walletAddress", "assetId"]),

  // Mek Transfer Events - tracks NFT transfers for level resets
  mekTransferEvents: defineTable({
    assetId: v.string(), // Mek that was transferred
    fromWallet: v.string(), // Previous owner
    toWallet: v.string(), // New owner

    // Level data at time of transfer
    levelAtTransfer: v.number(), // Level when transferred
    goldInvestedAtTransfer: v.number(), // Total gold invested

    // Detection method
    detectedBy: v.string(), // "blockchain_poll", "manual_sync", "ownership_check"
    detectedAt: v.number(), // When we detected the transfer
    blockchainTimestamp: v.optional(v.number()), // Actual transfer time if known

    // Processing status
    processed: v.boolean(), // Have we reset the levels?
    processedAt: v.optional(v.number()), // When we processed it
  })
    .index("by_asset", ["assetId"])
    .index("by_from_wallet", ["fromWallet"])
    .index("by_to_wallet", ["toWallet"])
    .index("by_detected", ["detectedAt"])
    .index("by_processed", ["processed"]),

  // Discord Todo List (replaces file storage for persistence)
  discordTodos: defineTable({
    key: v.string(), // 'global' for single shared todo list
    messageId: v.optional(v.string()), // Discord message ID
    channelId: v.optional(v.string()), // Discord channel ID
    tasks: v.array(v.object({
      id: v.number(),
      text: v.string(),
      completed: v.boolean(),
      createdAt: v.number(),
    })),
    page: v.number(), // Current page
    mode: v.string(), // 'view', 'complete', 'uncomplete', 'delete'
    updatedAt: v.number(), // Last update timestamp
  })
    .index("by_key", ["key"]),

  // Wallet Group Audit Trail - security and fraud detection
  walletGroupAudit: defineTable({
    groupId: v.string(), // Reference to walletGroups
    action: v.string(), // "add_wallet", "remove_wallet", "transfer_primary", "create_group"
    performedBy: v.string(), // Wallet address that initiated the action
    targetWallet: v.optional(v.string()), // Wallet being added/removed (if applicable)
    signature: v.optional(v.string()), // Cryptographic proof (for add_wallet actions)
    nonce: v.optional(v.string()), // Nonce used for signature verification
    timestamp: v.number(),
    ipAddress: v.optional(v.string()), // For advanced security tracking
    success: v.boolean(), // Did the action succeed?
    errorMessage: v.optional(v.string()), // If failed, why?
  })
    .index("by_group", ["groupId"])
    .index("by_performer", ["performedBy"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),
});