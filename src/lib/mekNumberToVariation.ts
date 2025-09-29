// Mapping of Mek numbers to their actual variations from the NFT collection
// This data is from the official mekGoldRates.json which contains all 4000 Meks

import mekGoldRatesData from '@/convex/mekGoldRates.json' assert { type: 'json' };

// Create the mapping structure
interface MekData {
  assetId: string;
  name: string;
  sourceKey: string;
  goldPerHour: number;
  finalRank: number;
  background: string;
  headGroup: string;
  bodyGroup: string;
  itemGroup: string;
}

// Build the mapping from the JSON data
const MEK_NUMBER_MAP: Map<number, MekData> = new Map();

// Process the data and create mapping
mekGoldRatesData.forEach((mek: any) => {
  const mekNumber = parseInt(mek.asset_id);
  if (!isNaN(mekNumber)) {
    MEK_NUMBER_MAP.set(mekNumber, {
      assetId: mek.asset_id,
      name: mek.name,
      sourceKey: mek.source_key,
      goldPerHour: mek.gold_per_hour,
      finalRank: mek.final_rank,
      background: mek.background,
      headGroup: mek.head_group,
      bodyGroup: mek.body_group,
      itemGroup: mek.item_group
    });
  }
});

/**
 * Get the variation codes and data for a specific Mek number
 * @param mekNumber The Mek number (e.g., 795, 860, 995)
 * @returns The Mek data including variation codes, or null if not found
 */
export function getMekDataByNumber(mekNumber: number): MekData | null {
  return MEK_NUMBER_MAP.get(mekNumber) || null;
}

/**
 * Get the image URL for a specific Mek number
 * @param mekNumber The Mek number
 * @param size The image size ('150px', '500px', or '1000px')
 * @returns The image URL or a placeholder if not found
 */
export function getMekImageUrl(mekNumber: number, size: '150px' | '500px' | '1000px' = '150px'): string {
  const mekData = getMekDataByNumber(mekNumber);

  if (!mekData) {
    // Return a placeholder or default image
    return `/mek-images/${size}/000-000-000.webp`;
  }

  // Extract the variation code from source_key (remove the -B suffix if present)
  const variationCode = mekData.sourceKey.toLowerCase().replace(/-b$/, '');

  return `/mek-images/${size}/${variationCode}.webp`;
}

/**
 * Parse a Mek name to extract the number
 * @param mekName The Mek name (e.g., "Mekanism #795", "Mek #860", "Mekanism0995")
 * @returns The Mek number or null if not found
 */
export function parseMekNumber(mekName: string): number | null {
  // Try various patterns to extract the number
  const patterns = [
    /Mekanism\s*#?\s*(\d+)/i,  // "Mekanism #795" or "Mekanism795"
    /Mek\s*#?\s*(\d+)/i,        // "Mek #795" or "Mek795"
    /^(\d+)$/                    // Just the number
  ];

  for (const pattern of patterns) {
    const match = mekName.match(pattern);
    if (match) {
      const number = parseInt(match[1]);
      if (!isNaN(number) && number >= 1 && number <= 4000) {
        return number;
      }
    }
  }

  return null;
}

/**
 * Get all Mek data for debugging or display
 */
export function getAllMekData(): Map<number, MekData> {
  return MEK_NUMBER_MAP;
}

// Export the raw data if needed
export { mekGoldRatesData };