// Game Constants
export const GAME_CONSTANTS = {
  // Gold rates
  DEFAULT_GOLD_RATE: 50,
  TEST_GOLD_RATE: 8743,
  MAX_GOLD_CAP_HOURS: 72,
  
  // Colors
  COLORS: {
    PRIMARY_YELLOW: '#fab617',
    PRIMARY_YELLOW_RGB: 'rgba(250, 182, 23',
    BACKGROUND_BLACK: '#000000',
    BACKGROUND_DARK: '#1a1a1a',
    BACKGROUND_GRAY: '#2a2a2a',
  },
  
  // Essence colors
  ESSENCE_COLORS: {
    stone: '#808080',
    disco: '#FF00FF',
    paul: '#FFD700',
    cartoon: '#00FFFF',
    candy: '#FF69B4',
    tiles: '#4169E1',
    moss: '#228B22',
    bullish: '#FF4500',
    journalist: '#708090',
    laser: '#FF0000',
    flashbulb: '#FFFF00',
    accordion: '#8B4513',
    turret: '#2F4F4F',
    drill: '#CD853F',
    security: '#000080',
  },
  
  // Animation durations
  ANIMATIONS: {
    GOLD_INCREMENT_INTERVAL: 100, // ms
    ESSENCE_INCREMENT_INTERVAL: 1000, // ms
    MARKET_UPDATE_INTERVAL: 5000, // ms
    BUFF_UPDATE_INTERVAL: 1000, // ms
  },
  
  // Demo values
  DEMO: {
    WALLET_ADDRESS: 'demo_wallet_123',
    INITIAL_GOLD: 1000,
    INITIAL_ESSENCE: 1.5,
    INITIAL_XP: 1500,
  },
  
  // UI
  UI: {
    TOAST_DURATION: 3000, // ms
    MODAL_FADE_DURATION: 300, // ms
    MAX_VISIBLE_BUFFS: 5,
    ITEMS_PER_PAGE: 20,
  },
  
  // Marketplace
  MARKETPLACE: {
    LISTING_FEE_PERCENTAGE: 0.02, // 2%
    MAX_LISTING_DURATION_DAYS: 7,
    DEFAULT_LISTINGS_LIMIT: 100,
  },
  
  // Crafting
  CRAFTING: {
    VARIATION_COUNTS: {
      HEADS: 102,
      BODIES: 112,
      TRAITS: 95,
    },
  },
} as const;

// Type exports for TypeScript
export type EssenceType = keyof typeof GAME_CONSTANTS.ESSENCE_COLORS;