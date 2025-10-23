import mekRarityMaster from '@/convex/mekRarityMaster.json';
import { COMPLETE_VARIATION_RARITY, type RarityTier } from './completeVariationRarity';

// Build a lookup map using FULL sourceKey (e.g., "AA1-DM1-AP1")
const fullSourceKeyLookup = new Map<string, { head: string; body: string; trait: string }>();

// Populate from mekRarityMaster
mekRarityMaster.forEach((mek: any) => {
  if (mek.sourceKey && mek.head && mek.body && mek.trait) {
    const upperKey = mek.sourceKey.toUpperCase().replace(/-B$/i, '');
    fullSourceKeyLookup.set(upperKey, {
      head: mek.head,
      body: mek.body,
      trait: mek.trait
    });
  }
});

// Build rarity lookup maps (using variation name as key)
const rarityLookup = new Map<string, { count: number; tier: RarityTier }>();

COMPLETE_VARIATION_RARITY.forEach(variation => {
  const key = `${variation.type}-${variation.name.toLowerCase()}`;
  rarityLookup.set(key, {
    count: variation.count,
    tier: variation.tier
  });
});

export interface VariationInfo {
  name: string;
  count: number;
  tier: RarityTier;
  color: string;
}

/**
 * Get color for rarity tier - 7-tier system with equal distribution
 * 288 variations ÷ 7 = ~41 per tier
 */
function getRarityColor(count: number): string {
  // Sort all variations by count to determine tier boundaries
  const allCounts = Array.from(rarityLookup.values()).map(v => v.count).sort((a, b) => a - b);
  const tierSize = Math.ceil(allCounts.length / 7);

  const tier1Max = allCounts[tierSize - 1] || 0;           // ~41st rarest = red
  const tier2Max = allCounts[tierSize * 2 - 1] || 0;       // ~82nd = orange
  const tier3Max = allCounts[tierSize * 3 - 1] || 0;       // ~123rd = purple
  const tier4Max = allCounts[tierSize * 4 - 1] || 0;       // ~164th = blue
  const tier5Max = allCounts[tierSize * 5 - 1] || 0;       // ~205th = green
  const tier6Max = allCounts[tierSize * 6 - 1] || 0;       // ~246th = white

  if (count <= tier1Max) return '#ef4444';      // red (rarest)
  if (count <= tier2Max) return '#f97316';      // orange
  if (count <= tier3Max) return '#a855f7';      // purple
  if (count <= tier4Max) return '#3b82f6';      // blue
  if (count <= tier5Max) return '#22c55e';      // green
  if (count <= tier6Max) return '#ffffff';      // white
  return '#6b7280';                             // dark gray (most common)
}

/**
 * Get variation info from the FULL Mek sourceKey
 * @param fullSourceKey - The complete sourceKey (e.g., "AA1-DM1-AP1-B")
 * @param fallbackData - Optional fallback data if sourceKey lookup fails (for backwards compatibility)
 * @returns Object with head, body, and trait variation info
 */
export function getVariationInfoFromFullKey(
  fullSourceKey: string | null | undefined,
  fallbackData?: { head?: string; body?: string; trait?: string }
): {
  head: VariationInfo;
  body: VariationInfo;
  trait: VariationInfo;
} {
  // Helper function to create VariationInfo from a name
  const getInfoForVariation = (name: string | undefined, type: 'head' | 'body' | 'trait'): VariationInfo => {
    if (!name) {
      return { name: 'Unknown', count: 0, tier: 'common', color: '#9ca3af' };
    }
    const rarityKey = `${type}-${name.toLowerCase()}`;
    const rarity = rarityLookup.get(rarityKey);

    return {
      name,
      count: rarity?.count || 0,
      tier: rarity?.tier || 'common',
      color: rarity ? getRarityColor(rarity.count) : '#9ca3af'
    };
  };

  // Try to use sourceKey first
  if (fullSourceKey) {
    const upperKey = fullSourceKey.toUpperCase().replace(/-[A-Z]$/i, ''); // Remove any suffix (-B, -C, etc.)
    const mekData = fullSourceKeyLookup.get(upperKey);

    if (mekData) {
      return {
        head: getInfoForVariation(mekData.head, 'head'),
        body: getInfoForVariation(mekData.body, 'body'),
        trait: getInfoForVariation(mekData.trait, 'trait')
      };
    }
  }

  // Fallback to individual variation fields if provided
  if (fallbackData) {
    return {
      head: getInfoForVariation(fallbackData.head, 'head'),
      body: getInfoForVariation(fallbackData.body, 'body'),
      trait: getInfoForVariation(fallbackData.trait, 'trait')
    };
  }

  // No data available
  return {
    head: { name: 'Unknown', count: 0, tier: 'common', color: '#9ca3af' },
    body: { name: 'Unknown', count: 0, tier: 'common', color: '#9ca3af' },
    trait: { name: 'Unknown', count: 0, tier: 'common', color: '#9ca3af' }
  };
}