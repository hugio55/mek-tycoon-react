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
    
    // Rarity and ranking
    rarityRank: v.optional(v.number()), // Original CNFT marketplace ranking
    gameRank: v.optional(v.number()),   // Custom game ranking (genesis meks are 1-10)
    cnftRank: v.optional(v.number()),   // Backup of original CNFT rank when gameRank differs
    isGenesis: v.optional(v.boolean()), // True for special genesis meks (101-010-101, etc)
    rarityTier: v.optional(v.string()), // Common, Uncommon, Rare, Epic, Legendary

    // Gold mining
    goldRate: v.optional(v.number()), // Gold per hour production rate

    // Tenure system (essence slot tracking)
    tenurePoints: v.optional(v.number()), // Accumulated tenure points (1 point/second when slotted)
    lastTenureUpdate: v.optional(v.number()), // Timestamp of last tenure update
    isSlotted: v.optional(v.boolean()), // Whether Mek is currently in an essence slot
    slotNumber: v.optional(v.number()), // Which essence slot (1-6) if slotted

    // Legacy battle system fields (deprecated but kept for data compatibility)
    draws: v.optional(v.number()),
    experience: v.optional(v.number()),
    health: v.optional(v.number()),
    inBattle: v.optional(v.boolean()),
    level: v.optional(v.number()),
    losses: v.optional(v.number()),
    maxHealth: v.optional(v.number()),
    powerScore: v.optional(v.number()),
    scrapValue: v.optional(v.number()),
    speed: v.optional(v.number()),
    winStreak: v.optional(v.number()),
    wins: v.optional(v.number()),

    // Metadata
    lastUpdated: v.optional(v.number()),
    isStaked: v.optional(v.boolean())
  })
    .index("by_owner", ["owner"])
    .index("by_asset_id", ["assetId"])
    .index("by_asset_name", ["assetName"])
    .index("by_source_key", ["sourceKey"])
    .index("by_source_key_base", ["sourceKeyBase"])
    .index("by_head", ["headVariation"])
    .index("by_body", ["bodyVariation"])
    .index("by_rarity", ["rarityTier"])
    .index("by_slotted", ["isSlotted"])
    .index("by_owner_slotted", ["owner", "isSlotted"]),

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

    // Viewport dimensions - defines what portion of canvas is visible when imported to webpage
    viewportDimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
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
    sourceKey: v.optional(v.string()), // 3-character code for file naming (e.g., "BC4", "555H")
    rank: v.optional(v.number()), // Rarity rank (1 = rarest, 291 = most common)
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

  // Purchase history for marketplace listings (tracks each "tap" purchase)
  marketListingPurchases: defineTable({
    listingId: v.id("marketListings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    itemType: v.string(),
    itemVariation: v.optional(v.string()),
    essenceType: v.optional(v.string()),
    quantityPurchased: v.number(),
    pricePerUnit: v.number(),
    totalCost: v.number(),
    timestamp: v.number(),
  })
    .index("by_listing", ["listingId"])
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_timestamp", ["timestamp"]),

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

  // Slot configuration presets (essence slot upgrade costs)
  slotConfigurations: defineTable({
    name: v.string(), // User-provided name for this configuration
    basicSlot: v.array(v.number()), // 9 tenure values for basic slot (levels 1-9)
    advancedSlot: v.array(v.number()), // 9 tenure values for advanced slot (levels 1-9)
    masterSlot: v.array(v.number()), // 9 tenure values for master slot (levels 1-9)
    curveFactor: v.number(), // Exponential curve factor (0.5-3.0)
    roundingOption: v.number(), // Rounding precision: 10 | 100 | 1000
    isActive: v.boolean(), // Only one configuration can be active at a time
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

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
      sourceKey: v.optional(v.string()), // Full source key from metadata (e.g., "AA1-DM1-AP1-B")
      sourceKeyBase: v.optional(v.string()), // Source key without suffix for image lookup (e.g., "aa1-dm1-ap1")
      // New fields for level boost tracking
      baseGoldPerHour: v.optional(v.number()), // Original rate from rarity (immutable)
      currentLevel: v.optional(v.number()), // Current level (1-10)
      levelBoostPercent: v.optional(v.number()), // Boost percentage from level (0-90)
      levelBoostAmount: v.optional(v.number()), // Actual boost amount in gold/hr
      effectiveGoldPerHour: v.optional(v.number()), // baseGoldPerHour + levelBoostAmount
      // Custom name field (optional, must be unique globally across all users)
      customName: v.optional(v.string()),
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
  })
    .index("by_timestamp", ["timestamp"]),

  // Snapshot Sessions - tracks ongoing batched snapshot processing
  snapshotSessions: defineTable({
    sessionId: v.string(), // Unique session identifier
    startTime: v.number(), // When session started
    endTime: v.optional(v.number()), // When session completed
    totalWallets: v.number(), // Total wallets to process
    batchSize: v.number(), // Wallets per batch
    processedCount: v.number(), // Wallets successfully processed
    errorCount: v.number(), // Wallets with errors
    skippedCount: v.number(), // Wallets skipped
    status: v.string(), // "in_progress", "completed", "failed"
  })
    .index("by_session", ["sessionId"]),

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
  mekOwnershipHistory: defineTable({
    walletAddress: v.string(), // Which wallet this snapshot is for
    snapshotTime: v.number(), // When this snapshot was taken

    // Multi-wallet fields (for backward compatibility with old snapshots)
    companyName: v.optional(v.string()),
    groupId: v.optional(v.string()),

    meks: v.array(v.object({
      assetId: v.string(), // Unique asset ID
      assetName: v.string(), // Mek name
      goldPerHour: v.number(), // Gold rate for this Mek at this time
      rarityRank: v.optional(v.number()),
      baseGoldPerHour: v.optional(v.number()), // Base rate before level boosts
      currentLevel: v.optional(v.number()), // Mek level at time of snapshot
      levelBoostPercent: v.optional(v.number()), // Level boost percentage
      levelBoostAmount: v.optional(v.number()), // Level boost gold amount
      policyId: v.optional(v.string()), // NFT policy ID
      imageUrl: v.optional(v.string()), // Image URL for this Mek
      headVariation: v.optional(v.string()), // Head variation code
      bodyVariation: v.optional(v.string()), // Body variation code
      itemVariation: v.optional(v.string()), // Item variation code
      sourceKey: v.optional(v.string()), // Full variation code (e.g., "AE1-BJ2-JI1-B")
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
    .index("by_status", ["verificationStatus"])
    .index("by_snapshotTime", ["snapshotTime"]), // CRITICAL FIX: Index for efficient cleanup

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
    type: v.string(), // "verification", "walletConnection", "rateChange", "goldCheckpoint", "walletLink"

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
    boostAmount: v.optional(v.number()),
    newGoldPerHour: v.optional(v.number()),
    newLevel: v.optional(v.number()),
    oldLevel: v.optional(v.number()),
    upgradeCost: v.optional(v.number()),
    upgradedBy: v.optional(v.string()),
    mekOwner: v.optional(v.string()),
    cumulativeGoldBefore: v.optional(v.number()),
    cumulativeGoldAfter: v.optional(v.number()),
    goldBefore: v.optional(v.number()),
    goldAfter: v.optional(v.number()),
    totalGoldPerHour: v.optional(v.number()),
    totalGoldPerHourBefore: v.optional(v.number()),

    // Gold restoration logs
    goldRestored: v.optional(v.number()),
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
    revokedAt: v.optional(v.number()), // Timestamp when signature was revoked (e.g., on wallet disconnect)

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

  // Discord connections - links wallets to Discord accounts (1 wallet = 1 corp)
  discordConnections: defineTable({
    walletAddress: v.optional(v.string()), // Wallet address (1 wallet = 1 corp) - optional for legacy entries
    discordUserId: v.string(), // Discord snowflake ID
    discordUsername: v.string(), // For display
    guildId: v.string(), // Discord server ID
    groupId: v.optional(v.string()), // Legacy field for old connections
    linkedAt: v.number(),
    active: v.boolean(),
    lastNicknameUpdate: v.optional(v.number()),
    currentEmoji: v.optional(v.string()),
  })
    .index("by_wallet", ["walletAddress", "guildId"])
    .index("by_discord_user", ["discordUserId", "guildId"])
    .index("by_guild", ["guildId"])
    .index("by_active", ["active"]),

  // Wallet groups - corporations that can have multiple wallets
  walletGroups: defineTable({
    groupId: v.string(),
    primaryWallet: v.string(),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"]),

  // Wallet group memberships - tracks which wallets belong to which groups
  walletGroupMemberships: defineTable({
    groupId: v.string(),
    walletAddress: v.string(),
    addedAt: v.number(),
    originalCompanyName: v.union(v.string(), v.null()),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_group", ["groupId"]),

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

  // Activity Logs - comprehensive user action tracking
  activityLogs: defineTable({
    walletAddress: v.string(), // Wallet that performed the action
    actionType: v.string(), // "wallet_connect", "upgrade_purchase", "mek_level_up", "gold_spent", etc.
    timestamp: v.number(),

    // Action details
    description: v.string(), // Human-readable description

    // Financial data (for upgrades/purchases)
    goldBefore: v.optional(v.number()),
    goldAfter: v.optional(v.number()),
    goldSpent: v.optional(v.number()),

    // Gold per hour tracking
    goldPerHourBefore: v.optional(v.number()),
    goldPerHourAfter: v.optional(v.number()),

    // Mek-specific data
    mekAssetId: v.optional(v.string()),
    mekAssetName: v.optional(v.string()),

    // Upgrade details
    upgradeType: v.optional(v.string()), // "body", "head", "trait"
    upgradeName: v.optional(v.string()),
    levelBefore: v.optional(v.number()),
    levelAfter: v.optional(v.number()),

    // Additional metadata
    metadata: v.optional(v.any()), // Flexible field for additional context
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action_type", ["actionType"])
    .index("by_wallet_and_timestamp", ["walletAddress", "timestamp"]),

  // FEDERATION SYSTEM - groups of corporations (1 wallet = 1 corp)

  // Federations - main federation data
  federations: defineTable({
    federationId: v.string(), // UUID for this federation
    name: v.string(), // Federation name
    description: v.optional(v.string()),
    leaderWalletAddress: v.optional(v.string()), // The wallet/corporation that leads this federation (optional for legacy data)
    leaderGroupId: v.optional(v.string()), // Legacy leader group ID field
    createdAt: v.number(),
    updatedAt: v.number(),

    // Mining & gameplay data
    totalMiningPower: v.optional(v.number()), // Calculated from variation diversity
    lastMiningUpdate: v.optional(v.number()),

    // Visual/customization
    emblem: v.optional(v.string()), // Image URL or emoji
    color: v.optional(v.string()), // Hex color for federation theme

    // Stats
    memberCount: v.number(), // Cached count of member corporations
    totalMekCount: v.optional(v.number()), // Total Meks across all members
    uniqueVariationCount: v.optional(v.number()), // Unique variations owned
  })
    .index("by_federation_id", ["federationId"])
    .index("by_leader", ["leaderWalletAddress"])
    .index("by_name", ["name"]),

  // Federation Memberships - which corporations belong to which federations
  federationMemberships: defineTable({
    federationId: v.string(), // Reference to federations
    walletAddress: v.optional(v.string()), // Corporation wallet address (optional for legacy data)
    groupId: v.optional(v.string()), // Legacy group ID field
    joinedAt: v.number(),
    role: v.union(v.literal("leader"), v.literal("officer"), v.literal("member")), // Member roles

    // Contribution tracking
    variationsContributed: v.optional(v.number()), // Unique variations this corp contributes
    mekCount: v.optional(v.number()), // Number of Meks this corp owns
    lastContributionUpdate: v.optional(v.number()),
  })
    .index("by_federation", ["federationId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_federation_and_wallet", ["federationId", "walletAddress"]),

  // Federation Invites - pending invitations to join federations
  federationInvites: defineTable({
    federationId: v.string(), // Reference to federations
    invitedWalletAddress: v.string(), // Corporation being invited
    invitedByWalletAddress: v.string(), // Corporation that sent the invite
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("cancelled")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    expiresAt: v.number(), // Invites expire after 7 days
    message: v.optional(v.string()), // Optional message from inviter
  })
    .index("by_federation", ["federationId"])
    .index("by_invited_wallet", ["invitedWalletAddress"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // Federation Variation Collection - tracks which variations the federation owns
  federationVariationCollection: defineTable({
    federationId: v.string(),
    variationId: v.number(), // Reference to variationsReference
    count: v.number(), // How many of this variation the federation owns
    contributingWallets: v.array(v.string()), // Array of wallet addresses that own this variation
    lastUpdated: v.number(),
  })
    .index("by_federation", ["federationId"])
    .index("by_federation_and_variation", ["federationId", "variationId"])
    .index("by_variation", ["variationId"]),

  // Planet Mining - federation mining activities
  planetMining: defineTable({
    miningId: v.string(), // UUID
    federationId: v.string(),
    planetName: v.string(), // Name of planet being mined
    startedAt: v.number(),
    completesAt: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),

    // Mining mechanics
    requiredDiversity: v.number(), // How many unique variations needed for success
    currentDiversity: v.number(), // How many unique variations the federation has
    successRate: v.number(), // Calculated success rate (0-100)

    // Rewards
    resourcesEarned: v.optional(v.any()), // Materials/resources from mining
    completedAt: v.optional(v.number()),
  })
    .index("by_federation", ["federationId"])
    .index("by_status", ["status"])
    .index("by_completion", ["completesAt"]),

  // Essence System - Global configuration
  essenceConfig: defineTable({
    configType: v.string(), // "global" - only one config record

    // Slot unlock costs (gold + essence requirements)
    slot2GoldCost: v.number(), // Gold cost for slot 2
    slot3GoldCost: v.number(), // Gold cost for slot 3
    slot4GoldCost: v.number(), // Gold cost for slot 4
    slot5GoldCost: v.number(), // Gold cost for slot 5
    slot6GoldCost: v.number(), // Gold cost for slot 6

    slot2EssenceCount: v.number(), // How many essence types needed for slot 2
    slot3EssenceCount: v.number(), // How many essence types needed for slot 3
    slot4EssenceCount: v.number(), // How many essence types needed for slot 4
    slot5EssenceCount: v.number(), // How many essence types needed for slot 5
    slot6EssenceCount: v.number(), // How many essence types needed for slot 6

    // Rarity groups for slot requirements (variation IDs)
    rarityGroup1: v.array(v.number()), // Common variations
    rarityGroup2: v.array(v.number()), // Uncommon variations
    rarityGroup3: v.array(v.number()), // Rare variations
    rarityGroup4: v.array(v.number()), // Epic/Legendary variations

    // Swap costs
    swapBaseCost: v.number(), // Starting gold cost for first swap
    swapCostIncrement: v.number(), // How much cost increases per swap
    swapCostMax: v.number(), // Maximum swap cost

    // Generation settings
    essenceRate: v.number(), // Base rate (0.1 per day per variation)
    essenceCap: v.number(), // Base cap (10 per variation type)

    lastUpdated: v.number(),
  })
    .index("by_config_type", ["configType"]),

  // Essence Slots - player's 6 Mek slots
  essenceSlots: defineTable({
    walletAddress: v.string(),
    slotNumber: v.number(), // 1-6

    // Slot state
    isUnlocked: v.boolean(),
    unlockedAt: v.optional(v.number()),

    // Slotted Mek data (null if empty)
    mekAssetId: v.optional(v.string()),
    mekNumber: v.optional(v.number()),
    mekSourceKey: v.optional(v.string()),

    // Variation data for essence generation
    headVariationId: v.optional(v.number()),
    headVariationName: v.optional(v.string()),
    bodyVariationId: v.optional(v.number()),
    bodyVariationName: v.optional(v.string()),
    itemVariationId: v.optional(v.number()),
    itemVariationName: v.optional(v.string()),

    slottedAt: v.optional(v.number()),
    lastModified: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_slot", ["walletAddress", "slotNumber"])
    .index("by_mek", ["mekAssetId"]),

  // Essence Slot Requirements - per-player random requirements for unlocking slots
  essenceSlotRequirements: defineTable({
    walletAddress: v.string(),
    slotNumber: v.number(), // 2-6 (slot 1 is always free)

    goldCost: v.number(),

    // Required essences (randomly selected based on rarity groups)
    requiredEssences: v.array(v.object({
      variationId: v.number(),
      variationName: v.string(),
      amountRequired: v.number(),
    })),

    generatedAt: v.number(), // When requirements were generated
    seedUsed: v.string(), // Wallet address used as seed
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_slot", ["walletAddress", "slotNumber"]),

  // Essence Tracking - per-player essence generation tracking
  essenceTracking: defineTable({
    walletAddress: v.string(),

    isActive: v.boolean(), // Whether essence generation is active
    activationTime: v.optional(v.number()), // When first slot was filled
    lastCalculationTime: v.number(), // Last time essence was calculated
    lastCheckpointTime: v.number(), // Last daily checkpoint

    // Swap tracking
    totalSwapCount: v.number(),
    currentSwapCost: v.number(), // Current cost to swap (increases with each swap)

    createdAt: v.number(),
    lastModified: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_active", ["isActive"])
    .index("by_last_checkpoint", ["lastCheckpointTime"]),

  // Essence Balances - sparse storage of essence amounts
  essenceBalances: defineTable({
    walletAddress: v.string(),
    variationId: v.number(),
    variationName: v.string(),
    variationType: v.union(v.literal("head"), v.literal("body"), v.literal("item")),

    accumulatedAmount: v.number(), // Current essence amount (capped at essenceCap)
    lastSnapshotTime: v.optional(v.number()), // When accumulatedAmount was last calculated (anchor for real-time calculation)
    lastUpdated: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_variation", ["walletAddress", "variationId"])
    .index("by_wallet_and_name", ["walletAddress", "variationName"])
    .index("by_variation", ["variationId"]),

  // ⚠️ DEPRECATED: Use essenceBuffSources instead
  // This table stores aggregate buff values (one record per variation).
  // The new essenceBuffSources table tracks individual buff sources for granular tracking.
  // This table remains for backward compatibility only - all new buff logic should use essenceBuffSources.
  //
  // Essence Player Buffs - per-player rate multipliers and cap bonuses (LEGACY)
  essencePlayerBuffs: defineTable({
    walletAddress: v.string(),
    variationId: v.number(),

    rateMultiplier: v.number(), // Multiplier for generation rate (1.0 = base, 1.5 = 50% faster)
    capBonus: v.number(), // Additional cap amount (base is 10)

    source: v.string(), // Where buff came from ("achievement", "upgrade", "event", etc.)
    appliedAt: v.number(),
    expiresAt: v.optional(v.number()), // Null for permanent buffs
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_variation", ["walletAddress", "variationId"])
    .index("by_expires", ["expiresAt"]),

  // Essence Buff Sources - granular tracking of individual buff sources
  // This table tracks EACH individual buff source separately (e.g., each achievement, upgrade, level milestone)
  // Replaces aggregate tracking in essencePlayerBuffs with detailed per-source tracking
  essenceBuffSources: defineTable({
    walletAddress: v.string(),
    variationId: v.number(),

    // Buff values from THIS specific source
    rateMultiplier: v.number(), // 1.15 = +15% rate from this source
    capBonus: v.number(),        // 2 = +2 cap from this source

    // Source identification
    sourceType: v.string(),      // "achievement", "upgrade", "level_milestone", "event", "admin"
    sourceId: v.string(),        // Unique identifier: "level_5", "upgrade_speed_3", "achievement_collector_1"
    sourceName: v.string(),      // Human-readable: "Level 5 Milestone", "Speed Upgrade III"
    sourceDescription: v.optional(v.string()), // "Reach level 5 to unlock +15% rate"

    // Metadata
    appliedAt: v.number(),
    expiresAt: v.optional(v.number()), // null for permanent buffs
    isActive: v.boolean(),             // Can be disabled without deleting

    // Audit trail
    grantedBy: v.optional(v.string()), // "system", "admin", "player_action"
    grantReason: v.optional(v.string()), // Additional context
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_and_variation", ["walletAddress", "variationId"])
    .index("by_wallet_variation_source", ["walletAddress", "variationId", "sourceId"]) // Prevent duplicate sources
    .index("by_source_type", ["sourceType"])
    .index("by_active", ["isActive"])
    .index("by_expires", ["expiresAt"]),

  // System Monitoring - 24/7 backend monitoring and error tracking
  systemMonitoring: defineTable({
    timestamp: v.number(),
    eventType: v.union(
      v.literal("error"),
      v.literal("critical_error"),
      v.literal("warning"),
      v.literal("snapshot"),
      v.literal("cron"),
      v.literal("database_issue"),
      v.literal("info")
    ),
    category: v.string(), // "snapshot", "auth", "gold", "leaderboard", etc.
    message: v.string(),
    details: v.optional(v.any()), // Additional context (error objects, stack traces, etc.)

    // For filtering/analysis
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),

    // Context
    functionName: v.optional(v.string()),
    walletAddress: v.optional(v.string()), // If related to specific wallet

    resolved: v.optional(v.boolean()), // For tracking if issue was fixed
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_category", ["category"])
    .index("by_wallet", ["walletAddress"]),

  // System Monitoring Summaries - Periodic health reports
  monitoringSummaries: defineTable({
    startTime: v.number(),
    endTime: v.number(),
    intervalMinutes: v.number(),

    totalEvents: v.number(),
    errorCount: v.number(),
    criticalErrorCount: v.number(),
    warningCount: v.number(),
    snapshotCount: v.number(),
    cronCount: v.number(),

    topErrors: v.optional(v.array(v.string())), // Most common error messages
    criticalEvents: v.optional(v.array(v.any())), // List of critical events

    systemHealth: v.union(
      v.literal("healthy"),
      v.literal("warning"),
      v.literal("critical")
    ),
  })
    .index("by_end_time", ["endTime"])
    .index("by_health", ["systemHealth"]),

  // ==========================================
  // NFT AIRDROP SYSTEM
  // ==========================================

  // Global airdrop configuration - Controls visibility and settings
  airdropConfig: defineTable({
    campaignName: v.string(), // "Commemorative Token 1"
    isActive: v.boolean(), // Master on/off switch
    nftName: v.string(), // Display name for the NFT
    nftDescription: v.string(),
    imageUrl: v.optional(v.string()), // Preview image

    // Eligibility requirements
    minimumGold: v.number(), // Must have this much gold to qualify

    // Timing
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),

    // NMKR Integration
    nmkrProjectId: v.optional(v.string()),
    nmkrApiKey: v.optional(v.string()),

    // Stats (for admin dashboard)
    totalEligible: v.optional(v.number()), // Count of users who qualify
    totalSubmitted: v.optional(v.number()), // Count of addresses submitted
    totalSent: v.optional(v.number()), // Count of NFTs successfully sent

    // Test Mode - Restrict visibility to specific wallets during testing
    testMode: v.optional(v.boolean()), // When true, only testWallets can see banner
    testWallets: v.optional(v.array(v.string())), // Wallet addresses allowed to see in test mode

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignName"])
    .index("by_active", ["isActive"]),

  // User airdrop submissions - Tracks each user's claim
  airdropSubmissions: defineTable({
    // User identification
    userId: v.id("users"),
    walletAddress: v.string(), // Their connected/verified wallet

    // Submission details
    receiveAddress: v.string(), // Where they want NFT sent (Cardano addr1...)
    goldAtSubmission: v.number(), // Proof they were eligible at time of submission
    submittedAt: v.number(),

    // Processing status
    status: v.union(
      v.literal("pending"),      // Address submitted, awaiting processing
      v.literal("processing"),   // Being sent via NMKR
      v.literal("sent"),         // Successfully sent
      v.literal("failed")        // Failed to send
    ),

    // Success tracking
    sentAt: v.optional(v.number()), // When NFT was sent
    transactionHash: v.optional(v.string()), // Blockchain proof (tx hash)
    transactionUrl: v.optional(v.string()), // Link to cardanoscan.io

    // Failure tracking
    errorMessage: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    lastRetryAt: v.optional(v.number()),

    // Campaign tracking
    campaignName: v.string(), // Links to airdropConfig

    // Admin notes
    adminNotes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_status", ["status"])
    .index("by_campaign", ["campaignName"])
    .index("by_submitted_date", ["submittedAt"])
    .index("by_receive_address", ["receiveAddress"]),

  // Commemorative NFT Purchases
  commemorativePurchases: defineTable({
    userId: v.optional(v.id("users")), // Optional - user may not be logged in
    walletAddress: v.string(), // Cardano wallet address
    nmkrProjectUid: v.string(), // NMKR project UID
    purchaseDate: v.number(), // Timestamp
    transactionHash: v.optional(v.string()), // Cardano transaction hash if available
    nftTokenId: v.optional(v.string()), // NFT token ID if available
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed")
    ),
    goldAmount: v.optional(v.number()), // User's gold at purchase time
    mekCount: v.optional(v.number()), // User's mek count at purchase time
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_user", ["userId"])
    .index("by_date", ["purchaseDate"])
    .index("by_status", ["status"]),

  // ==========================================
  // Story Climb Event NFT System
  // ==========================================

  // NFT Events - Story Climb event definitions
  nftEvents: defineTable({
    // Event Identity
    eventNumber: v.number(), // Unique event number (e.g., 1, 2, 3...)
    eventName: v.string(), // Display name (e.g., "Microphone Challenge")
    eventSlug: v.string(), // URL-safe identifier (e.g., "microphone-challenge")

    // Story Integration
    storyNodeId: v.optional(v.string()), // Link to story climb node (if applicable)
    storyContext: v.optional(v.string()), // Description of the story event

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    isActive: v.boolean(), // Can users mint from this event?

    // NMKR Integration
    nmkrProjectId: v.optional(v.string()), // NMKR project ID (if created)
    nmkrProjectName: v.optional(v.string()), // NMKR project name

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()), // Admin user who created
  })
    .index("by_eventNumber", ["eventNumber"])
    .index("by_status", ["status"])
    .index("by_slug", ["eventSlug"])
    .index("by_active", ["isActive"]),

  // NFT Variations - 3 difficulty variations per event
  nftVariations: defineTable({
    // Event Relationship
    eventId: v.id("nftEvents"), // Parent event

    // Variation Identity
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    nftName: v.string(), // Full display name
    displayOrder: v.number(), // 1, 2, 3 for easy/medium/hard

    // Supply Management
    supplyTotal: v.number(), // Total mintable (e.g., 100, 50, 10)
    supplyMinted: v.number(), // Current minted count
    supplyRemaining: v.number(), // Calculated: total - minted
    supplyReserved: v.optional(v.number()), // Pre-allocated/held back

    // Art Assets
    mainArtUrl: v.optional(v.string()), // IPFS URL for main art (GIF/PNG/MP4)
    thumbnailUrl: v.optional(v.string()), // 500x500 thumbnail
    thumbnailSmallUrl: v.optional(v.string()), // 150x150 thumbnail
    subAssets: v.optional(v.array(v.string())), // Additional asset URLs

    // File Metadata
    mainArtFormat: v.optional(v.union(
      v.literal("gif"),
      v.literal("png"),
      v.literal("jpg"),
      v.literal("webp"),
      v.literal("mp4")
    )),
    mainArtFileSize: v.optional(v.number()), // Bytes
    mainArtDimensions: v.optional(v.string()), // "2000x2000"

    // NMKR Integration
    nmkrAssetId: v.optional(v.string()), // NMKR asset identifier
    nmkrTokenName: v.optional(v.string()), // Token name in NMKR
    policyId: v.optional(v.string()), // Cardano policy ID

    // Pricing (if applicable)
    priceAda: v.optional(v.number()), // Price in ADA (null = free/airdrop)
    priceLovelace: v.optional(v.number()), // Price in lovelace

    // CIP-25 Metadata
    metadata: v.optional(v.object({
      name: v.string(),
      image: v.string(),
      description: v.optional(v.string()),
      eventNumber: v.number(),
      difficulty: v.string(),
      attributes: v.optional(v.any()),
    })),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_difficulty", ["difficulty"])
    .index("by_eventAndDifficulty", ["eventId", "difficulty"])
    .index("by_nmkrAssetId", ["nmkrAssetId"]),

  // NFT Purchases - Track every NFT purchase/mint
  nftPurchases: defineTable({
    // Variation & Event
    variationId: v.id("nftVariations"),
    eventId: v.id("nftEvents"),

    // User/Wallet Information
    userId: v.optional(v.id("users")), // Mek Tycoon user (if logged in)
    walletAddress: v.string(), // Buyer's stake address
    paymentAddress: v.string(), // Payment address used
    companyName: v.optional(v.string()), // Company name from goldMining table

    // Transaction Details
    transactionHash: v.string(), // Cardano blockchain tx hash
    transactionUrl: v.optional(v.string()), // CardanoScan URL
    blockNumber: v.optional(v.number()), // Block height

    // Pricing & Payment
    priceAda: v.number(), // Amount paid in ADA
    priceLovelace: v.number(), // Amount paid in lovelace
    currency: v.union(v.literal("ADA"), v.literal("tADA")), // Mainnet vs testnet

    // NFT Details
    tokenName: v.string(), // Actual minted token name
    assetId: v.string(), // Full asset ID (policy + asset name)
    mintingSlot: v.optional(v.number()), // Cardano slot number

    // NMKR Data
    nmkrSaleId: v.optional(v.string()), // NMKR sale identifier
    nmkrOrderId: v.optional(v.string()), // NMKR order number
    nmkrPaymentMethod: v.optional(v.string()), // Payment method used

    // Status Tracking
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    statusMessage: v.optional(v.string()), // Error message or notes

    // Webhook Data (raw NMKR payload)
    webhookData: v.optional(v.any()),

    // Timestamps
    purchasedAt: v.number(), // When user initiated purchase
    confirmedAt: v.optional(v.number()), // When blockchain confirmed
    webhookReceivedAt: v.optional(v.number()), // When we received NMKR webhook
    createdAt: v.number(),
    updatedAt: v.number(),

    // Admin notes
    adminNotes: v.optional(v.string()),
  })
    .index("by_variation", ["variationId"])
    .index("by_event", ["eventId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_user", ["userId"])
    .index("by_txHash", ["transactionHash"])
    .index("by_status", ["status"])
    .index("by_date", ["purchasedAt"])
    .index("by_company", ["companyName"]),

  // NFT Art Assets - Centralized art asset library
  nftArtAssets: defineTable({
    // Asset Identity
    assetName: v.string(), // File name
    assetType: v.union(
      v.literal("main"),
      v.literal("thumbnail"),
      v.literal("thumbnail_small"),
      v.literal("sub_asset")
    ),
    category: v.optional(v.string()), // "event_art", "variation_art", "template"

    // Storage
    ipfsUrl: v.string(), // IPFS storage URL
    cdnUrl: v.optional(v.string()), // CDN mirror URL
    localPath: v.optional(v.string()), // Local backup path

    // File Details
    format: v.union(
      v.literal("gif"),
      v.literal("png"),
      v.literal("jpg"),
      v.literal("webp"),
      v.literal("mp4")
    ),
    fileSize: v.number(), // Bytes
    dimensions: v.optional(v.string()), // "2000x2000"
    isAnimated: v.optional(v.boolean()),

    // Usage Tracking
    usedByVariations: v.optional(v.array(v.id("nftVariations"))),
    usedByEvents: v.optional(v.array(v.id("nftEvents"))),

    // Metadata
    uploadedBy: v.optional(v.string()), // Admin user
    uploadedAt: v.number(),
    tags: v.optional(v.array(v.string())), // Searchable tags

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_type", ["assetType"])
    .index("by_category", ["category"])
    .index("by_uploadedAt", ["uploadedAt"]),

  // NMKR Sync Log - Track synchronization with NMKR API
  nmkrSyncLog: defineTable({
    syncType: v.union(
      v.literal("webhook"),
      v.literal("api_pull"),
      v.literal("manual_sync")
    ),
    nmkrProjectId: v.string(),

    // Sync Results
    status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed")),
    recordsSynced: v.number(),
    errors: v.optional(v.array(v.string())),

    // Data
    syncedData: v.optional(v.any()), // Raw data from NMKR

    // Timestamps
    syncStartedAt: v.number(),
    syncCompletedAt: v.number(),
  })
    .index("by_project", ["nmkrProjectId"])
    .index("by_status", ["status"])
    .index("by_date", ["syncStartedAt"]),

  // Image Overlays - Visual editor for positioning elements on images
  overlays: defineTable({
    imageKey: v.string(), // Unique identifier for the image (e.g., "mechanism-slots", "battle-screen")
    imagePath: v.string(), // Path to the image file
    imageWidth: v.number(), // Original image width
    imageHeight: v.number(), // Original image height

    zones: v.array(
      v.object({
        id: v.string(), // Unique zone ID
        mode: v.string(), // "zone" for rectangles, "sprite" for positioned overlays
        type: v.string(), // "mechanism-slot", "button", "clickable", "variation-bulb", etc.
        x: v.number(), // X position (pixels)
        y: v.number(), // Y position (pixels)
        width: v.optional(v.number()), // Zone width (pixels) - for "zone" mode
        height: v.optional(v.number()), // Zone height (pixels) - for "zone" mode
        label: v.optional(v.string()), // Display label
        overlayImage: v.optional(v.string()), // Path to overlay sprite - for "sprite" mode
        metadata: v.optional(v.any()), // Additional data (variation info, etc.)
      })
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.optional(v.number()), // CRITICAL FIX: Optimistic concurrency control
  })
    .index("by_imageKey", ["imageKey"]),

  // Overlay Autosave History - Permanent backup history for overlay editor
  overlayAutosaves: defineTable({
    imageKey: v.string(), // Which overlay project this autosave belongs to
    zones: v.array(
      v.object({
        id: v.string(),
        mode: v.string(),
        type: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        label: v.optional(v.string()),
        overlayImage: v.optional(v.string()),
        metadata: v.optional(v.any()),
      })
    ),
    spriteCount: v.number(), // How many sprites were placed at this point
    timestamp: v.number(), // When this autosave was created
  })
    .index("by_imageKey", ["imageKey"])
    .index("by_imageKey_and_timestamp", ["imageKey", "timestamp"]),

  // Navigation Configuration - Stores active navigation overlay settings
  navigationConfig: defineTable({
    overlayImageKey: v.string(), // Which overlay project to use for navigation
    scale: v.number(), // Scale factor (0.25 to 2.0)
    isActive: v.boolean(), // Whether this navigation is currently deployed
    deployedAt: v.optional(v.number()), // When it was deployed
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"]),

  // Mint History - Track NFTs minted through SimpleNFTMinter
  mintHistory: defineTable({
    // NFT identifiers
    nftUid: v.string(), // NMKR NFT UID
    tokenname: v.string(), // On-chain tokenname
    displayName: v.string(), // Display name
    policyId: v.optional(v.string()), // Policy ID (available after minting)
    assetId: v.optional(v.string()), // Full asset ID (policyId.tokenname)

    // Project info
    projectUid: v.string(), // NMKR project UID
    projectName: v.optional(v.string()),

    // Metadata
    description: v.optional(v.string()),
    mediaType: v.string(), // image/gif, video/mp4, etc.
    ipfsHash: v.optional(v.string()), // Main image IPFS hash
    thumbnailIpfsHash: v.optional(v.string()),
    customMetadata: v.optional(v.any()), // Custom key-value pairs

    // Recipient
    receiverAddress: v.string(),

    // Minting status
    mintStatus: v.string(), // "queued", "minted", "failed"
    mintAndSendId: v.optional(v.number()), // NMKR mint batch ID
    txHash: v.optional(v.string()), // Blockchain transaction hash

    // Timestamps
    createdAt: v.number(),
    mintedAt: v.optional(v.number()), // When actually minted on blockchain
  })
    .index("by_created_at", ["createdAt"])
    .index("by_nft_uid", ["nftUid"])
    .index("by_policy_id", ["policyId"])
    .index("by_receiver", ["receiverAddress"]),

  // Marketplace Listing History - persistent log of all admin-created marketplace listings
  marketplaceListingHistory: defineTable({
    timestamp: v.number(),
    variationName: v.string(),
    quantity: v.number(),
    pricePerUnit: v.number(),
    durationDays: v.number(),
    totalValue: v.number(), // quantity * pricePerUnit
    createdBy: v.string(), // "admin" or wallet address
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_variation", ["variationName"]),

  // ===== CUSTOM MINTING SYSTEM =====

  // Minting Policies - Store generated Cardano native script policies
  mintingPolicies: defineTable({
    policyId: v.string(), // Unique policy ID (hash of the script)
    policyName: v.string(), // Human-readable name (e.g., "Event NFTs", "Collectibles")
    policyScript: v.any(), // Native script JSON structure
    keyHash: v.string(), // Payment key hash used for signature verification
    expirySlot: v.optional(v.number()), // Blockchain slot when policy expires (if time-limited)
    expiryDate: v.optional(v.number()), // JavaScript timestamp for display
    network: v.union(v.literal("mainnet"), v.literal("preprod"), v.literal("preview")),
    createdAt: v.number(),
    isActive: v.boolean(), // Whether this policy is currently in use
    notes: v.optional(v.string()), // Admin notes about this policy

    // Wallet Configuration
    adminWallet: v.string(), // Wallet that signs minting transactions
    payoutWallet: v.optional(v.string()), // Wallet that receives sales revenue

    // Royalty Configuration (CIP-0027)
    royaltiesEnabled: v.optional(v.boolean()), // Whether royalties are enabled
    royaltyPercentage: v.optional(v.number()), // Royalty percentage (0-100)
    royaltyAddress: v.optional(v.string()), // Address that receives royalties

    // Metadata Template (CIP-25 compliant)
    metadataTemplate: v.optional(v.object({
      // Custom fields defined by admin
      customFields: v.array(v.object({
        fieldName: v.string(), // e.g., "phase", "rarity", "edition"
        fieldType: v.union(v.literal("fixed"), v.literal("placeholder")), // Fixed = same for all, Placeholder = token-specific
        fixedValue: v.optional(v.string()), // If fieldType is "fixed", this is the value
      })),
    })),
  })
    .index("by_policy_id", ["policyId"])
    .index("by_network", ["network"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // Test Mints - Track test NFT mints during development (Phase 1)
  testMints: defineTable({
    txHash: v.string(), // Blockchain transaction hash
    policyId: v.string(), // Which policy was used
    assetName: v.string(), // Hex-encoded asset name
    assetId: v.string(), // Full asset ID (policyId + assetName)

    // NFT details
    nftName: v.string(), // Display name
    description: v.optional(v.string()),
    imageUrl: v.string(),

    // Wallet info
    walletAddress: v.string(), // Who minted it

    // Network
    network: v.string(), // "preprod", "preview", or "mainnet"

    // Status
    confirmed: v.boolean(), // Whether transaction confirmed on blockchain
    mintedAt: v.number(), // Timestamp when mint was initiated
    confirmedAt: v.optional(v.number()), // When blockchain confirmed

    // Explorer
    explorerUrl: v.string(), // Link to view on Cardano explorer

    // Optional metadata for analysis
    metadata: v.optional(v.any()),
  })
    .index("by_tx_hash", ["txHash"])
    .index("by_policy_id", ["policyId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_network", ["network"])
    .index("by_minted_at", ["mintedAt"])
    .index("by_confirmed", ["confirmed"]),

  // ===== COMMEMORATIVE TOKENS SYSTEM =====

  // NFT Designs - Universal Minting Engine (Commemorative, Events, Airdrops, etc.)
  // This is the "master list" of NFT designs that can be minted
  commemorativeTokenCounters: defineTable({
    tokenType: v.string(), // "phase_1_beta", "event_easy_001", "anniversary_2026", etc.

    // Design Info
    displayName: v.string(), // "Commemorative Token #1 - Early Miner"
    description: v.optional(v.string()),

    // IPFS Assets
    imageUrl: v.string(), // IPFS URL for image
    mediaType: v.optional(v.string()), // MIME type: "image/png", "image/gif", "image/jpeg", etc.
    metadataUrl: v.string(), // IPFS URL for metadata JSON

    // Blockchain Info
    policyId: v.string(), // Which minting policy this design uses
    assetNameHex: v.string(), // Hex-encoded asset name for sub-assets (e.g., "436f6d6d656d6f726174697665546f6b656e31")

    // Custom Metadata Attributes (design-specific attribute values like "Artist: Wren Ellis", "Poop?: yes")
    customAttributes: v.optional(v.array(v.object({
      trait_type: v.string(),
      value: v.string()
    }))),

    // Sale Mode Configuration
    saleMode: v.optional(v.union(
      v.literal("whitelist"),    // Snapshot-based, one-per-wallet (commemorative tokens)
      v.literal("public_sale"),  // Open to anyone, multiple allowed (event NFTs)
      v.literal("free_claim")    // Free airdrop to eligible users
    )),

    // Whitelist Mode Settings
    eligibilitySnapshot: v.optional(v.array(v.string())), // Wallet addresses allowed to claim
    snapshotTakenAt: v.optional(v.number()), // When snapshot was created
    minimumGold: v.optional(v.number()), // Gold requirement for eligibility
    onePerWallet: v.optional(v.boolean()), // Limit one per wallet (default true for whitelist)

    // Public Sale Mode Settings (future)
    maxPerWallet: v.optional(v.number()), // Max quantity per wallet
    publicSaleStart: v.optional(v.number()), // When public sale begins
    publicSaleEnd: v.optional(v.number()), // When public sale ends

    // Minting Stats
    currentEdition: v.number(), // Current highest edition number minted
    totalMinted: v.number(), // Total successfully minted (confirmed only)
    maxEditions: v.optional(v.number()), // Optional limit (null = unlimited)

    // Status
    isActive: v.boolean(), // Whether this design is currently available for minting
    price: v.optional(v.number()), // Price in ADA (if selling, otherwise free for airdrops)

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_type", ["tokenType"])
    .index("by_policy_id", ["policyId"])
    .index("by_active", ["isActive"])
    .index("by_sale_mode", ["saleMode"]),

  // Commemorative Tokens - Individual mints with sequential editions
  commemorativeTokens: defineTable({
    // Token Info
    tokenType: v.string(), // Links to commemorativeTokenCounters
    editionNumber: v.number(), // Sequential: 1, 2, 3, etc.
    policyId: v.string(), // Shared commemorative policy
    assetName: v.string(), // Hex-encoded name
    assetId: v.string(), // policyId.assetName

    // User Info
    walletAddress: v.string(),
    userId: v.optional(v.id("users")),

    // Minting Status
    status: v.union(
      v.literal("reserved"),    // Edition reserved, awaiting mint
      v.literal("minting"),     // Transaction submitted
      v.literal("confirmed"),   // NFT minted successfully
      v.literal("failed"),      // Minting failed
      v.literal("cancelled")    // Reservation cancelled
    ),

    // Blockchain Data
    txHash: v.optional(v.string()),
    explorerUrl: v.optional(v.string()),
    network: v.string(), // "preprod" or "mainnet"

    // Metadata
    nftName: v.string(), // "Phase 1: I Was There #42"
    imageUrl: v.string(), // IPFS URL

    // Timestamps
    reservedAt: v.number(),
    mintedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),

    // Payment
    paymentAmount: v.number(), // 10 (ADA)
    treasuryAddress: v.string(), // Where payment went

    // Error tracking
    errorMessage: v.optional(v.string()),
  })
    .index("by_wallet_type", ["walletAddress", "tokenType"])
    .index("by_edition", ["tokenType", "editionNumber"])
    .index("by_status", ["status"])
    .index("by_tx_hash", ["txHash"])
    .index("by_minted_at", ["mintedAt"])
    .index("by_user", ["userId"]),

  // Batch Minted Tokens - Admin batch minting tracking (whitelist/airdrop distributions)
  batchMintedTokens: defineTable({
    // Token Info
    tokenType: v.string(), // Links to commemorativeTokenCounters
    mintNumber: v.number(), // Sequential mint number (1, 2, 3, etc.)
    policyId: v.string(),
    assetName: v.string(), // Hex-encoded name
    assetId: v.string(), // policyId.assetName

    // Recipient Info
    recipientAddress: v.string(), // Stake/payment address that received the NFT
    recipientDisplayName: v.optional(v.string()), // Optional name/label
    snapshotId: v.optional(v.id("whitelistSnapshots")), // Reference to snapshot if from whitelist

    // Batch Info
    batchNumber: v.number(), // Which batch this was in (1, 2, 3, etc.)
    batchId: v.optional(v.string()), // Unique ID for this batch run

    // Minting Status
    status: v.union(
      v.literal("pending"),     // Queued for minting
      v.literal("submitted"),   // Transaction submitted to blockchain
      v.literal("confirmed"),   // NFT minted successfully
      v.literal("failed")       // Minting failed
    ),

    // Blockchain Data
    txHash: v.optional(v.string()),
    network: v.string(), // "preprod" or "mainnet"

    // Metadata
    nftName: v.string(), // "Commemorative Token #1 - Early Miner #042"
    imageIpfsUrl: v.string(), // ipfs://Qm...

    // Timestamps
    createdAt: v.number(),
    submittedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),

    // Error Tracking
    errorMessage: v.optional(v.string()),
    retryCount: v.optional(v.number()),
  })
    .index("by_token_type", ["tokenType"])
    .index("by_recipient", ["recipientAddress"])
    .index("by_batch", ["batchId"])
    .index("by_status", ["status"])
    .index("by_tx_hash", ["txHash"])
    .index("by_snapshot", ["snapshotId"])
    .index("by_confirmed_at", ["confirmedAt"]),

  // BANDWIDTH OPTIMIZATION: Query result cache
  // Caches expensive query results to reduce bandwidth from repeated calls
  queryCache: defineTable({
    cacheKey: v.string(), // Unique key for the cached query (e.g., "getAllWallets", "getAllPlayers")
    data: v.any(), // Cached query result
    timestamp: v.number(), // When this was cached
    ttl: v.number(), // Time-to-live in milliseconds (e.g., 30000 = 30 seconds)
  })
    .index("by_key", ["cacheKey"]),

  // WHITELIST SYSTEM: Extensible criteria definitions
  // Allows admin to add new criteria types at any time (gold, experience, achievements, etc.)
  whitelistCriteria: defineTable({
    field: v.string(), // Database field name (e.g., "goldBalance", "experience", "mekCount")
    displayName: v.string(), // Human-readable name (e.g., "Gold Balance", "Experience Points")
    dataType: v.union(
      v.literal("number"),
      v.literal("boolean"),
      v.literal("string"),
      v.literal("date")
    ),
    description: v.string(), // Help text for admin
    category: v.optional(v.string()), // Grouping (e.g., "Resources", "Progress", "NFTs")

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_field", ["field"])
    .index("by_category", ["category"]),

  // WHITELIST SYSTEM: Saved whitelists
  // Stores whitelist definitions with rules and cached eligible users
  whitelists: defineTable({
    name: v.string(), // Whitelist name (e.g., "Gold Miners Tier 1", "Genesis Holders")
    description: v.optional(v.string()), // Optional description

    // Rules defining eligibility
    rules: v.array(v.object({
      criteriaField: v.string(), // References whitelistCriteria.field
      operator: v.union(
        v.literal("greater_than"),
        v.literal("less_than"),
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("greater_or_equal"),
        v.literal("less_or_equal"),
        v.literal("contains")
      ),
      value: v.any(), // Threshold value
    })),

    // Logical operator between rules
    ruleLogic: v.union(
      v.literal("AND"), // All rules must match
      v.literal("OR")   // Any rule must match
    ),

    // Cached eligible users (regenerated when rules change)
    // IMPORTANT: Uses stake addresses ONLY (stake1... or stake_test1...)
    // NMKR collects payment addresses during checkout for NFT delivery
    eligibleUsers: v.array(v.object({
      userId: v.optional(v.id("players")), // Reference to player
      stakeAddress: v.optional(v.string()), // Cardano stake address (stake1... or stake_test1...)
      walletAddress: v.optional(v.string()), // Legacy field name, use stakeAddress for new data
      displayName: v.optional(v.string()), // User's name if available
    })),
    userCount: v.number(), // Quick count without loading array

    // Generation tracking
    lastGenerated: v.number(), // When eligibleUsers was last calculated
    autoRefresh: v.boolean(), // Whether to auto-regenerate on rule change

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_createdAt", ["createdAt"])
    .index("by_lastGenerated", ["lastGenerated"]),

  // WHITELIST SNAPSHOTS: Frozen point-in-time captures of whitelist eligibility
  // Multiple snapshots can be taken from the same whitelist over time
  whitelistSnapshots: defineTable({
    whitelistId: v.id("whitelists"), // Parent whitelist this snapshot came from
    whitelistName: v.string(), // Cached whitelist name for display
    snapshotName: v.string(), // User-provided name (e.g., "Early Bird - Oct 24", "Phase 1 Launch")
    description: v.optional(v.string()), // Optional notes about this snapshot

    // Frozen eligibility list (never changes after creation)
    // IMPORTANT: Uses stake addresses ONLY (stake1... or stake_test1...)
    // NMKR collects payment addresses during checkout for NFT delivery
    eligibleUsers: v.array(v.object({
      stakeAddress: v.optional(v.string()), // Cardano stake address (stake1... or stake_test1...)
      walletAddress: v.optional(v.string()), // Legacy field name, use stakeAddress for new data
      displayName: v.optional(v.string()),
    })),
    userCount: v.number(), // Count of eligible users

    // Rules that were active when snapshot was taken (for reference)
    rulesSnapshot: v.array(v.object({
      criteriaField: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    ruleLogic: v.union(v.literal("AND"), v.literal("OR")),

    // Timestamps
    takenAt: v.number(), // When this snapshot was captured
    createdBy: v.optional(v.string()), // Admin who created it
  })
    .index("by_whitelist", ["whitelistId"])
    .index("by_takenAt", ["takenAt"])
    .index("by_whitelist_and_date", ["whitelistId", "takenAt"]),

  // ===== COMMEMORATIVE CAMPAIGNS (Multi-Campaign System) =====
  // Master table for commemorative NFT campaigns
  // Each campaign has independent inventory, numbering, and lifecycle
  commemorativeCampaigns: defineTable({
    name: v.string(), // Display name (e.g., "Lab Rat", "Pilot Program")
    description: v.string(), // Campaign description for users
    nmkrProjectId: v.string(), // NMKR project ID for this campaign
    policyId: v.optional(v.string()), // Cardano policy ID for blockchain verification
    status: v.union(
      v.literal("active"),    // Currently claimable
      v.literal("inactive")   // Not yet active or closed
    ),
    maxNFTs: v.number(), // Total NFTs in this campaign
    startDate: v.optional(v.number()), // Campaign start timestamp
    endDate: v.optional(v.number()), // Campaign end timestamp
    createdAt: v.number(),
    updatedAt: v.number(),
    // Performance counters (synced from inventory)
    totalNFTs: v.number(),     // Total NFTs added
    availableNFTs: v.number(), // Currently available
    reservedNFTs: v.number(),  // Currently reserved
    soldNFTs: v.number(),      // Sold/completed
    // Cron job control
    enableReservationCleanup: v.optional(v.boolean()), // If false, cron skips cleanup for this campaign (defaults to true)
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Commemorative NFT Claims - Tracks actual NFT ownership
  // This table records when users successfully receive their NFTs via NMKR
  commemorativeNFTClaims: defineTable({
    campaignId: v.optional(v.id("commemorativeCampaigns")), // Link to campaign (optional for backward compatibility)
    walletAddress: v.string(), // Owner's wallet address
    transactionHash: v.string(), // Blockchain transaction hash
    nftName: v.string(), // Display name (e.g., "Bronze Token #1")
    nftAssetId: v.string(), // Full asset ID (policyId + hex asset name)
    claimedAt: v.number(), // Timestamp when claim was recorded
    metadata: v.optional(v.object({
      imageUrl: v.optional(v.string()), // NFT image URL
      attributes: v.optional(v.array(v.object({
        trait_type: v.string(),
        value: v.string()
      }))),
      collection: v.optional(v.string()),
      artist: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_transaction", ["transactionHash"])
    .index("by_asset_id", ["nftAssetId"])
    .index("by_claimed_at", ["claimedAt"])
    .index("by_campaign", ["campaignId"]),

  // Commemorative NFT Inventory - Pre-populated list of NFTs per campaign
  // Each row represents one specific NFT with its NMKR UID
  commemorativeNFTInventory: defineTable({
    campaignId: v.optional(v.id("commemorativeCampaigns")), // Link to campaign (optional for backward compatibility)
    nftUid: v.string(), // NMKR NFT UID (e.g., "10aec295-d9e2-47e3-9c04-e56e2df92ad5")
    nftNumber: v.number(), // Campaign-scoped edition number (1-N per campaign)
    name: v.string(), // Display name (e.g., "Lab Rat #1")
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("sold")
    ), // Current status
    projectId: v.string(), // NMKR project ID
    paymentUrl: v.string(), // Pre-built NMKR payment URL
    imageUrl: v.optional(v.string()), // NFT image URL
    createdAt: v.number(),

    // RESERVATION FIELDS (Phase 1: Single Source of Truth Migration)
    // When status="reserved", these fields track the active reservation
    // When status="available" or "sold", these fields are null/undefined
    reservedBy: v.optional(v.string()), // Stake address of user who reserved this NFT
    reservedAt: v.optional(v.number()), // Timestamp when reservation was created
    expiresAt: v.optional(v.number()), // Timestamp when reservation expires
    paymentWindowOpenedAt: v.optional(v.number()), // When NMKR payment window was opened
    paymentWindowClosedAt: v.optional(v.number()), // When NMKR payment window was closed

    // SALE TRACKING FIELDS (when status="sold")
    soldTo: v.optional(v.string()), // Stake address of buyer (preserved after sale)
    soldAt: v.optional(v.number()), // Timestamp when sale was completed
    companyNameAtSale: v.optional(v.string()), // Corporation name at time of purchase (historical snapshot)
  })
    .index("by_uid", ["nftUid"])
    .index("by_number", ["nftNumber"])
    .index("by_status", ["status"])
    .index("by_status_and_number", ["status", "nftNumber"])
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_and_status", ["campaignId", "status"])
    .index("by_campaign_and_number", ["campaignId", "nftNumber"])
    // NEW INDEXES for reservation queries
    .index("by_reserved_by", ["reservedBy"]) // Lookup user's reservations
    .index("by_expires_at", ["expiresAt"]) // Cleanup expired reservations
    .index("by_campaign_and_wallet", ["campaignId", "reservedBy"]) // Campaign-scoped user lookup
    .index("by_wallet_and_status", ["reservedBy", "status"]), // Active reservations for user

  // Commemorative NFT Reservations - Active reservations for claim process
  // Tracks who has reserved which NFT and for how long
  commemorativeNFTReservations: defineTable({
    campaignId: v.optional(v.id("commemorativeCampaigns")), // Link to campaign (optional for backward compatibility)
    nftInventoryId: v.id("commemorativeNFTInventory"), // Reference to inventory item
    nftUid: v.string(), // NMKR NFT UID (denormalized for quick lookup)
    nftNumber: v.number(), // Campaign-scoped edition number (denormalized)
    reservedBy: v.string(), // Wallet address or session ID
    reservedAt: v.number(), // Timestamp when reservation was created
    expiresAt: v.number(), // Timestamp when reservation expires (10 minutes)
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    paymentWindowOpenedAt: v.optional(v.number()), // When NMKR window opened (for timer pause)
    paymentWindowClosedAt: v.optional(v.number()), // When NMKR window closed
  })
    .index("by_nft_uid", ["nftUid"])
    .index("by_reserved_by", ["reservedBy"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_inventory_id", ["nftInventoryId"])
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_and_wallet", ["campaignId", "reservedBy"])
    .index("by_wallet_and_status", ["reservedBy", "status"]),

  // Webhook Processing Tracking - Prevents duplicate webhook processing
  // Records all processed webhooks to ensure idempotency
  processedWebhooks: defineTable({
    transactionHash: v.string(), // Blockchain transaction hash (unique per webhook)
    stakeAddress: v.string(), // Buyer's stake address
    nftUid: v.string(), // NFT UID from NMKR
    reservationId: v.optional(v.id("commemorativeNFTReservations")), // Link to reservation if exists
    processedAt: v.number(), // When webhook was processed
    eventType: v.optional(v.string()), // transactionconfirmed, transactionfinished, etc.
  })
    .index("by_tx_hash", ["transactionHash"])
    .index("by_stake_address", ["stakeAddress"])
    .index("by_processed_at", ["processedAt"]),

  // ===== SIMPLE NFT ELIGIBILITY SYSTEM (NMKR) =====
  // Replaces the complex custom minting system above
  // Just stores which snapshot controls who sees the "Claim NFT" button
  nftEligibilityConfig: defineTable({
    activeSnapshotId: v.optional(v.id("whitelistSnapshots")), // Currently active snapshot
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ===== TENURE SYSTEM =====
  // Configuration for tenure system (base rates, multipliers, etc.)
  tenureConfig: defineTable({
    key: v.string(), // Unique config key (e.g., "baseRate", "maxLevel")
    value: v.union(v.number(), v.string(), v.boolean()), // Config value
    description: v.optional(v.string()), // What this config controls
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ===== GOLD SYSTEM =====
  // Configuration for gold system (base rates, multipliers, etc.)
  goldConfig: defineTable({
    key: v.string(), // Unique config key (e.g., "baseGoldPerHour")
    value: v.union(v.number(), v.string(), v.boolean()), // Config value
    description: v.optional(v.string()), // What this config controls
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ===== ESSENCE BUFF SYSTEM =====
  // Configuration for essence buff system (base rates, multipliers, etc.)
  essenceBuffConfig: defineTable({
    key: v.string(), // Unique config key (e.g., "baseEssencePerHour")
    value: v.union(v.number(), v.string(), v.boolean()), // Config value
    description: v.optional(v.string()), // What this config controls
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // Tracks levels/thresholds for tenure progression
  tenureLevels: defineTable({
    level: v.number(), // Tenure level (1, 2, 3, etc.)
    pointsRequired: v.number(), // Points needed to reach this level
    title: v.string(), // Display name (e.g., "Rookie", "Veteran", "Legend")
    description: v.optional(v.string()), // Optional flavor text
    badgeIcon: v.optional(v.string()), // Icon/emoji for this level
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_level", ["level"])
    .index("by_points", ["pointsRequired"]),

  // Tenure buffs - bonuses granted at specific tenure levels
  tenureBuffs: defineTable({
    // Buff identification
    name: v.string(), // Display name (e.g., "VIP Double Tenure")
    description: v.optional(v.string()), // What this buff does

    // Buff scope
    scope: v.union(v.literal("global"), v.literal("perMek")),
    mekId: v.optional(v.id("meks")), // Required if scope is "perMek"

    // Buff effect
    multiplier: v.number(), // e.g., 0.5 for +50%, 1.0 for +100%

    // State
    active: v.boolean(), // Is buff currently active
    expiresAt: v.optional(v.number()), // When buff expires (undefined = permanent)

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_scope", ["scope"])
    .index("by_mek", ["mekId"])
    .index("by_active", ["active"]),

  // Transformed UI components (conversational workflow)
  transformedComponents: defineTable({
    name: v.string(), // Component name (e.g., "IndustrialButton", "MekCard")
    code: v.string(), // Full React/TypeScript component code
    props: v.optional(v.string()), // TypeScript interface for props
    tags: v.array(v.string()), // Searchable tags: ["button", "industrial", "interactive"]
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_tags", ["tags"]),

  // Design preferences learned from transformations
  designPreferences: defineTable({
    key: v.string(), // Preference key (e.g., "primary-yellow", "button-style")
    value: v.string(), // The value (e.g., "#fab617", "mek-button-primary")
    context: v.optional(v.string()), // Where/why it's used
    confidence: v.number(), // 0-1, how confident we are this is correct
    category: v.optional(v.string()), // "color", "typography", "spacing", "pattern"
    lastUsed: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_confidence", ["confidence"]),

  // Transformation rules (patterns to auto-apply)
  transformationRules: defineTable({
    name: v.string(), // Rule name (e.g., "Generic button to industrial")
    pattern: v.string(), // What to look for (e.g., "bg-blue-500 text-white px-4 py-2")
    replacement: v.string(), // What to replace with (e.g., "mek-button-primary")
    autoApply: v.boolean(), // Should this be applied automatically
    confidence: v.number(), // 0-1, how reliable this rule is
    timesApplied: v.number(), // Usage counter
    lastApplied: v.number(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_autoApply", ["autoApply"])
    .index("by_confidence", ["confidence"]),

  // ===== SITE SETTINGS =====
  // Global site-wide configuration
  siteSettings: defineTable({
    landingPageEnabled: v.boolean(), // Controls whether root (/) shows landing page or game
    localhostBypass: v.optional(v.boolean()), // When true, localhost bypasses protection (dev mode). When false, localhost acts like production (for testing)
    ignoreLocalhostRule: v.optional(v.boolean()), // Legacy field, use localhostBypass instead
    maintenanceMode: v.optional(v.boolean()), // EMERGENCY: When true, ALL routes redirect to maintenance page (nuclear option)
  }),

  // ===== LANDING PAGE PHASE CARDS =====
  // Phase cards displayed on landing page carousel
  phaseCards: defineTable({
    header: v.optional(v.string()), // Phase label in center when idle (e.g., "Phase I", "Phase II")
    subtitle: v.optional(v.string()), // Italic header text above title (e.g., "The Beginning")
    title: v.string(), // Phase title (e.g., "Foundation", "Initialization")
    description: v.optional(v.string()), // Phase description text
    fullDescription: v.optional(v.string()), // Full description shown in Read More lightbox
    imageUrl: v.optional(v.string()), // Image URL for the phase card background
    locked: v.boolean(), // Whether the phase is locked/coming soon
    order: v.number(), // Display order (lower number = earlier in carousel)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"]),

  // ===== LANDING PAGE DEBUG SETTINGS =====
  // Visual debug settings for landing page (single record, global settings)
  // Stored as flexible config object to prevent schema breaking when adding new fields
  landingDebugSettings: defineTable({
    config: v.any(), // Full config object with all ~70 visual settings
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // MOBILE landing page debug settings (separate from desktop to prevent conflicts)
  landingDebugSettingsMobile: defineTable({
    config: v.any(), // Full config object with all ~70 visual settings
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ===== PAGE LOADER SETTINGS =====
  // Global settings for page loader animation (single record)
  loaderSettings: defineTable({
    fontSize: v.number(),
    spacing: v.number(),
    horizontalOffset: v.number(),
    fontFamily: v.string(),
    chromaticOffset: v.number(),
    triangleSize: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // DESKTOP landing page debug settings HISTORY (automatic backups before each save)
  // Keeps last 50 versions with timestamps for recovery
  landingDebugSettingsHistory: defineTable({
    config: v.any(), // Full config object snapshot
    timestamp: v.number(), // When this backup was created
    description: v.optional(v.string()), // Optional description (e.g., "Before reset", "Auto-backup")
  })
    .index("by_timestamp", ["timestamp"]),

  // MOBILE landing page debug settings HISTORY (automatic backups before each save)
  landingDebugSettingsMobileHistory: defineTable({
    config: v.any(), // Full config object snapshot
    timestamp: v.number(), // When this backup was created
    description: v.optional(v.string()), // Optional description
  })
    .index("by_timestamp", ["timestamp"]),

  // UNIFIED landing page debug settings (desktop + mobile + shared in one table)
  // Responsive design approach: CSS media queries determine which config subset to apply
  landingDebugUnified: defineTable({
    desktop: v.any(), // Desktop-specific settings (≥1024px)
    mobile: v.any(), // Mobile-specific settings (<1024px)
    shared: v.any(), // Settings that apply to both viewports
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // UNIFIED landing page debug settings HISTORY (automatic backups before each save)
  // Keeps last 200 versions with timestamps for recovery (rolling window)
  landingDebugUnifiedHistory: defineTable({
    desktop: v.any(), // Desktop config snapshot
    mobile: v.any(), // Mobile config snapshot
    shared: v.any(), // Shared config snapshot
    timestamp: v.number(), // When this backup was created
    description: v.optional(v.string()), // Optional description (e.g., "Auto-backup before save")
  })
    .index("by_timestamp", ["timestamp"]),

  // PERMANENT landing page debug settings snapshots (never deleted)
  // Every 20th backup + manual snapshots saved here forever
  landingDebugUnifiedPermanentSnapshots: defineTable({
    desktop: v.any(), // Desktop config snapshot
    mobile: v.any(), // Mobile config snapshot
    shared: v.any(), // Shared config snapshot
    timestamp: v.number(), // When this snapshot was created
    description: v.string(), // Description (e.g., "Auto-snapshot #20", "Manual backup")
    snapshotType: v.union(v.literal("auto"), v.literal("manual")), // auto = every 20th, manual = user-created
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["snapshotType"]),

  // ===== BETA SIGNUPS =====
  // Beta signup stake addresses for rewarding early participants
  betaSignups: defineTable({
    stakeAddress: v.string(), // Mainnet stake address (stake1...)
    submittedAt: v.number(), // Timestamp when signup was submitted
    ipAddress: v.union(v.string(), v.null()), // Optional IP tracking
  })
    .index("by_stakeAddress", ["stakeAddress"]) // For duplicate prevention and lookups
    .index("by_ipAddress", ["ipAddress"]), // For IP duplicate prevention

  // ===== CORPORATION MESSAGING SYSTEM =====
  // Conversations between corporations (users)
  conversations: defineTable({
    // Participants - two wallet addresses (corporations)
    participant1: v.string(), // Wallet address of first participant
    participant2: v.string(), // Wallet address of second participant
    // Last message info for inbox preview
    lastMessageAt: v.number(), // Timestamp of most recent message
    lastMessagePreview: v.optional(v.string()), // Truncated preview (max 80 chars)
    lastMessageSender: v.optional(v.string()), // Wallet of who sent last message
    // Metadata
    createdAt: v.number(),
  })
    .index("by_participant1", ["participant1", "lastMessageAt"])
    .index("by_participant2", ["participant2", "lastMessageAt"])
    .index("by_last_activity", ["lastMessageAt"]),

  // Individual messages within conversations
  messages: defineTable({
    conversationId: v.id("conversations"), // Which conversation this belongs to
    senderId: v.string(), // Wallet address of sender
    recipientId: v.string(), // Wallet address of recipient
    content: v.string(), // Message text (max 2000 chars)
    // Status tracking (sent -> delivered -> read)
    status: v.string(), // "sent" | "delivered" | "read"
    // Timestamps
    createdAt: v.number(), // When message was sent
    deliveredAt: v.optional(v.number()), // When delivered to recipient
    readAt: v.optional(v.number()), // When recipient read the message
    editedAt: v.optional(v.number()), // If message was edited
    // Soft delete
    isDeleted: v.boolean(), // Whether message is deleted for everyone
    deletedForSender: v.optional(v.boolean()), // Hidden from sender only
    deletedForRecipient: v.optional(v.boolean()), // Hidden from recipient only
    // Attachments (images for trading)
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"), // Convex storage ID
      filename: v.string(), // Original filename
      mimeType: v.string(), // e.g., "image/jpeg"
      size: v.number(), // File size in bytes
      url: v.optional(v.string()), // Generated URL (populated at query time)
    }))),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId", "createdAt"])
    .index("by_recipient", ["recipientId", "createdAt"])
    .index("by_recipient_status", ["recipientId", "status"]),

  // Pre-computed unread counts per conversation per user (performance optimization)
  messageUnreadCounts: defineTable({
    walletAddress: v.string(), // Which user's unread count
    conversationId: v.id("conversations"), // Which conversation
    count: v.number(), // Number of unread messages
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_wallet_conversation", ["walletAddress", "conversationId"]),

  // Typing indicators (transient - auto-expire after 5 seconds)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    walletAddress: v.string(), // Who is typing
    expiresAt: v.number(), // Auto-expire timestamp
  })
    .index("by_conversation", ["conversationId"])
    .index("by_expires", ["expiresAt"]),

  // Message blocking - prevents users from messaging each other
  messageBlocks: defineTable({
    blockerWallet: v.string(), // The corporation who initiated the block
    blockedWallet: v.string(), // The corporation who is blocked
    createdAt: v.number(), // When the block was created
    reason: v.optional(v.string()), // Optional reason for blocking (spam, harassment, etc.)
  })
    .index("by_blocker", ["blockerWallet"])
    .index("by_blocked", ["blockedWallet"])
    .index("by_blocker_blocked", ["blockerWallet", "blockedWallet"]),

  // Upload quota tracking for rate limiting file uploads
  messageUploadQuotas: defineTable({
    walletAddress: v.string(), // User's wallet
    date: v.string(), // YYYY-MM-DD format for daily tracking
    uploadCount: v.number(), // Number of files uploaded today
    totalBytes: v.number(), // Total bytes uploaded today
    lastUploadAt: v.number(), // Timestamp of last upload (for burst limiting)
  })
    .index("by_wallet_date", ["walletAddress", "date"]),
});
