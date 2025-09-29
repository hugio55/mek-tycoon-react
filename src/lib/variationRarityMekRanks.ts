// Master list of variations with their Mek-rank-based tiebreakers
// For 1-of-1s, we use their parent Mek's rarityRank
// For others, we calculate based on copy count

export const VARIATION_MEK_RANKS = {
  // 1-of-1 heads tied to Mek #1 (absolute rarest)
  "Ace of Spades Ultimate": { copies: 1, mekRank: 1 },
  "Projectionist": { copies: 1, mekRank: 1 },
  "Discomania": { copies: 1, mekRank: 1 },
  "Pie": { copies: 1, mekRank: 1 },
  "Frost King": { copies: 1, mekRank: 1 },
  "Obliterator": { copies: 1, mekRank: 1 },
  "Paul Ultimate": { copies: 1, mekRank: 1 },
  "Derelict": { copies: 1, mekRank: 1 },
  "Nyan Ultimate": { copies: 1, mekRank: 1 },
  "Ellie Mesh": { copies: 1, mekRank: 1 },

  // Ross is 1-of-1 but tied to Mek #12
  "Ross": { copies: 1, mekRank: 12 },

  // Other rare variations (not 1-of-1s)
  "Acid": { copies: 3, mekRank: null },
  "Gold": { copies: 3, mekRank: null },
  "Lazer": { copies: 4, mekRank: null },
  "Wires": { copies: 4, mekRank: null },
  "Terminator": { copies: 5, mekRank: null },
  "The Lethal Dimension": { copies: 6, mekRank: null },
  "24K": { copies: 6, mekRank: null },
  "???": { copies: 8, mekRank: null },

  // Common variations
  "Taser": { copies: 132, mekRank: null },
  "Nothing": { copies: 501, mekRank: null }, // Item variation
};

/**
 * Calculate the true rarity rank for a variation
 * Lower rank = rarer
 * 1-of-1s use their Mek rank, others use copy count * 2
 */
export function getVariationTrueRank(name: string): number {
  const data = VARIATION_MEK_RANKS[name as keyof typeof VARIATION_MEK_RANKS];

  if (!data) {
    // Default for unknown variations
    return 100;
  }

  // If it's a 1-of-1 with a Mek rank, use that
  if (data.copies === 1 && data.mekRank) {
    return data.mekRank;
  }

  // Otherwise, calculate rank based on copies
  // Start after the highest 1-of-1 Mek rank (around 20)
  // to ensure all 1-of-1s come before multi-copy variations
  return 20 + (data.copies * 2);
}

/**
 * Get a complete sorted list of all variations by true rarity
 */
export function getSortedVariationList(): Array<{ name: string; rank: number; copies: number }> {
  return Object.entries(VARIATION_MEK_RANKS)
    .map(([name, data]) => ({
      name,
      rank: getVariationTrueRank(name),
      copies: data.copies
    }))
    .sort((a, b) => a.rank - b.rank);
}