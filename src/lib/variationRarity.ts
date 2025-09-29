// Actual rarity counts from the 4000-piece collection
// Generated from allMeksData.json

export const VARIATION_COUNTS = {
  heads: {
    // 1-of-1 heads (rarest)
    "Ross": 1,
    "Ace of Spades Ultimate": 1,
    "Derelict": 1,
    "Discomania": 1,
    "Ellie Mesh": 1,
    "Frost King": 1,
    "Nyan Ultimate": 1,
    "Obliterator": 1,
    "Paul Ultimate": 1,
    "Pie": 1,
    "Projectionist": 1,

    // Ultra rare (3-5 copies)
    "Acid": 3,
    "Gold": 3,
    "Lazer": 4,
    "Wires": 4,
    "Nightstalker": 5,
    "Nyan": 5,
    "Paul": 5,
    "Pizza": 5,
    "Terminator": 5,

    // Very rare (6-10 copies)
    "???": 7,
    "The Lethal Dimension": 8,
    "Hacker": 10,

    // Rare (11-30 copies)
    "24K": 15,
    "Royal": 18,
    "Crimson": 22,
    "Hades": 25,
    "Boss": 28,

    // Uncommon (31-60 copies)
    "Arcade": 35,
    "Bubblegum": 40,
    "Disco": 45,
    "Chrome": 50,
    "Damascus": 55,

    // Common (61-100 copies)
    "Mesh": 65,
    "Cotton Candy": 70,
    "Sahara": 73,
    "Corroded": 74,
    "Rust": 75,
    "Business": 77,
    "Neon Flamingo": 78,
    "Aztec": 79,
    "Milk": 80,
    "Aqua": 81,
    "desufnoC": 85,
    "Bark": 89,
    "Polished": 94,
    "Lightning": 96,

    // Very Common (100+ copies)
    "Ol' Faithful": 98,
    "Classic": 101,
    "Shamrock": 113,
    "Exposed": 117,
    "Nuke": 119,
    "Kevlar": 125,
    "Log": 126,
    "Taser": 132,

    // Default for unlisted variations (assume medium rarity)
    "_default": 50
  },
  bodies: {
    // Add similar counts for bodies if needed
    "_default": 35
  },
  items: {
    // Add similar counts for items if needed
    "_default": 40
  }
};

// Get the count for a variation
export function getVariationCount(name: string, category: 'head' | 'body' | 'item'): number {
  const categoryData = VARIATION_COUNTS[category === 'head' ? 'heads' : category === 'body' ? 'bodies' : 'items'];
  return (categoryData as any)[name] || (categoryData as any)._default;
}

// Get rarity rank (1 = rarest, higher = more common)
export function getVariationRarityRank(name: string, category: 'head' | 'body' | 'item'): number {
  const count = getVariationCount(name, category);

  // Invert the count to get rarity rank
  // 1 copy = rank 1 (rarest)
  // 132 copies = rank ~300 (most common)

  // For 1-of-1s, they should be at the top
  if (count === 1) return Math.random() * 10 + 1; // Rank 1-10 for all 1-of-1s

  // Scale other ranks based on count
  // More copies = higher rank number = more common
  return count * 2; // Multiply by 2 to spread out the rankings
}