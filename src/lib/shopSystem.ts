// Shop System Configuration
// Handles rarity detection, pricing algorithms, and market analysis

export interface ItemRarity {
  name: string;
  tier: number;
  color: string;
  priceMultiplier: number;
  dropChance: number;
}

export const RARITY_TIERS: Record<string, ItemRarity> = {
  common: {
    name: 'Common',
    tier: 1,
    color: '#4ade80',
    priceMultiplier: 1.0,
    dropChance: 0.60
  },
  uncommon: {
    name: 'Uncommon',
    tier: 2,
    color: '#60a5fa',
    priceMultiplier: 1.5,
    dropChance: 0.25
  },
  rare: {
    name: 'Rare',
    tier: 3,
    color: '#c084fc',
    priceMultiplier: 3.0,
    dropChance: 0.10
  },
  epic: {
    name: 'Epic',
    tier: 4,
    color: '#fb923c',
    priceMultiplier: 6.0,
    dropChance: 0.04
  },
  legendary: {
    name: 'Legendary',
    tier: 5,
    color: '#fbbf24',
    priceMultiplier: 15.0,
    dropChance: 0.01
  }
};

export interface ShopMetrics {
  totalListings: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  rarityDistribution: Record<string, number>;
  hotItems: string[];
  marketTrends: 'rising' | 'stable' | 'falling';
}

export class ShopSystem {
  // Calculate market value based on rarity and base price
  static calculateMarketValue(basePrice: number, rarity: string): number {
    const rarityTier = RARITY_TIERS[rarity] || RARITY_TIERS.common;
    return Math.round(basePrice * rarityTier.priceMultiplier);
  }

  // Determine if an item is a good deal
  static isGoodDeal(listPrice: number, marketValue: number, threshold = 0.85): boolean {
    return listPrice < marketValue * threshold;
  }

  // Calculate rarity score for sorting
  static getRarityScore(rarity: string): number {
    const rarityTier = RARITY_TIERS[rarity] || RARITY_TIERS.common;
    return rarityTier.tier;
  }

  // Compare rarities for sorting
  static compareRarity(a: string, b: string, ascending = false): number {
    const scoreA = this.getRarityScore(a);
    const scoreB = this.getRarityScore(b);
    return ascending ? scoreA - scoreB : scoreB - scoreA;
  }

  // Calculate suggested price based on various factors
  static calculateSuggestedPrice(params: {
    basePrice: number;
    rarity: string;
    marketAverage?: number;
    demand?: number; // 0-1 scale
    supply?: number; // current supply count
  }): number {
    const { basePrice, rarity, marketAverage, demand = 0.5, supply = 10 } = params;

    let price = this.calculateMarketValue(basePrice, rarity);

    // Adjust for market average
    if (marketAverage) {
      price = (price + marketAverage) / 2;
    }

    // Adjust for demand (higher demand = higher price)
    price *= (1 + (demand - 0.5) * 0.3);

    // Adjust for supply (lower supply = higher price)
    const supplyMultiplier = Math.max(0.8, Math.min(1.5, 20 / supply));
    price *= supplyMultiplier;

    return Math.round(price);
  }

  // Analyze market metrics
  static analyzeMarket(listings: any[]): ShopMetrics {
    const prices = listings.map(l => l.pricePerUnit * l.quantity);
    const rarityCount: Record<string, number> = {};

    listings.forEach(listing => {
      const rarity = listing.rarity || 'common';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    });

    // Calculate price statistics
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length > 0
      ? sortedPrices[Math.floor(sortedPrices.length / 2)]
      : 0;

    const averagePrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;

    // Identify hot items (most viewed/watched)
    const hotItems = listings
      .filter(l => l.viewCount && l.viewCount > 50)
      .map(l => l._id)
      .slice(0, 5);

    // Simple trend detection (would need historical data for real trends)
    const recentListings = listings.filter(l =>
      Date.now() - l.listedAt < 24 * 60 * 60 * 1000
    );

    let marketTrends: 'rising' | 'stable' | 'falling' = 'stable';
    if (recentListings.length > listings.length * 0.3) {
      marketTrends = 'rising';
    } else if (recentListings.length < listings.length * 0.1) {
      marketTrends = 'falling';
    }

    return {
      totalListings: listings.length,
      averagePrice: Math.round(averagePrice),
      medianPrice: Math.round(medianPrice),
      priceRange: {
        min: Math.min(...prices, 0),
        max: Math.max(...prices, 0)
      },
      rarityDistribution: rarityCount,
      hotItems,
      marketTrends
    };
  }

  // Validate listing price
  static validatePrice(price: number, marketAverage: number): {
    valid: boolean;
    warning?: string;
  } {
    if (price <= 0) {
      return { valid: false, warning: 'Price must be greater than 0' };
    }

    if (price > marketAverage * 3) {
      return { valid: true, warning: 'Price is significantly above market average' };
    }

    if (price < marketAverage * 0.3) {
      return { valid: true, warning: 'Price is significantly below market average' };
    }

    return { valid: true };
  }
}

export default ShopSystem;