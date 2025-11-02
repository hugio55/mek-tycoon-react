// Auto-generated variation rarity data
// Generated from mekRarityMaster.json with 4000 Mek records
// Total unique variations: 291
//
// IMPORTANT: Special Trait Variations (Ghostly/Haunting Theme)
// The following trait variations have artistic names that may seem like "empty" states,
// but they are LEGITIMATE variations with ghostly/haunting visual appearances:
//   - "Nil" (rank 18, legendary, 1-2 copies)
//   - "Null" (rank 21, legendary, 1-2 copies)
//   - "None" (rank 24, legendary, 1-2 copies)
//   - "Nothing" (rank 291, common, 501 copies)
// These should NEVER be filtered out or ignored - they are real variations
// that appear in actual Mek data and must be preserved across all systems.

export type VariationType = 'head' | 'body' | 'trait';

export type RarityTier = 'legendary' | 'ultra-rare' | 'very-rare' | 'rare' | 'uncommon' | 'common';

export interface VariationRarity {
  id: number;
  name: string;
  type: VariationType;
  count: number;
  percentage: string;
  tier: RarityTier;
  rank: number;
  sourceKey: string;
}

// Complete variation rarity ranking (291 total variations)
export const COMPLETE_VARIATION_RARITY: VariationRarity[] = [
  {
    id: 2,
    name: "Derelict",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 1,
    sourceKey: "000H"
  },
  {
    id: 109,
    name: "Gatsby Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 2,
    sourceKey: "000B"
  },
  {
    id: 221,
    name: "Stolen",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 3,
    sourceKey: "000T"
  },
  {
    id: 7,
    name: "Obliterator",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 4,
    sourceKey: "999H"
  },
  {
    id: 111,
    name: "Luxury Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 5,
    sourceKey: "999B"
  },
  {
    id: 215,
    name: "Golden Guns Ultimate",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 6,
    sourceKey: "999T"
  },
  {
    id: 4,
    name: "Ellie Mesh",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 7,
    sourceKey: "888H"
  },
  {
    id: 105,
    name: "Chrome Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 8,
    sourceKey: "888B"
  },
  {
    id: 222,
    name: "Vanished",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 9,
    sourceKey: "888T"
  },
  {
    id: 10,
    name: "Projectionist",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 10,
    sourceKey: "777H"
  },
  {
    id: 106,
    name: "Cousin Itt",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 11,
    sourceKey: "777B"
  },
  {
    id: 216,
    name: "Gone",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 12,
    sourceKey: "777T"
  },
  {
    id: 9,
    name: "Pie",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 13,
    sourceKey: "666H"
  },
  {
    id: 104,
    name: "Carving Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 14,
    sourceKey: "666B"
  },
  {
    id: 219,
    name: "Oompah",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 15,
    sourceKey: "666T"
  },
  {
    id: 5,
    name: "Frost King",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 16,
    sourceKey: "555H"
  },
  {
    id: 107,
    name: "Frost Cage",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 17,
    sourceKey: "555B"
  },
  {
    id: 289,
    name: "Nil",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 18,
    sourceKey: "555T"
  },
  {
    id: 8,
    name: "Paul Ultimate",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 19,
    sourceKey: "444H"
  },
  {
    id: 103,
    name: "Burnt Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 20,
    sourceKey: "444B"
  },
  {
    id: 290,
    name: "Null",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 21,
    sourceKey: "444T"
  },
  {
    id: 3,
    name: "Discomania",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 22,
    sourceKey: "333H"
  },
  {
    id: 113,
    name: "X Ray Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 23,
    sourceKey: "333B"
  },
  {
    id: 291,
    name: "None",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 24,
    sourceKey: "333T"
  },
  {
    id: 1,
    name: "Ace of Spades Ultimate",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 25,
    sourceKey: "222H"
  },
  {
    id: 112,
    name: "Plush Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 26,
    sourceKey: "222B"
  },
  {
    id: 218,
    name: "Linkinator 3000",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 27,
    sourceKey: "222T"
  },
  {
    id: 6,
    name: "Nyan Ultimate",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 28,
    sourceKey: "111H"
  },
  {
    id: 110,
    name: "Heatwave Ultimate",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 29,
    sourceKey: "111B"
  },
  {
    id: 220,
    name: "Peacock Ultimate",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 30,
    sourceKey: "111T"
  },
  {
    id: 108,
    name: "Fury",
    type: "body",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 31,
    sourceKey: "BW5"
  },
  {
    id: 217,
    name: "King Tut",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 32,
    sourceKey: "AZ3"
  },
  {
    id: 11,
    name: "Ross",
    type: "head",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 33,
    sourceKey: "LZ2"
  },
  {
    id: 114,
    name: "007",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 34,
    sourceKey: "CX2"
  },
  {
    id: 115,
    name: "Cartoon",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 35,
    sourceKey: "AA5"
  },
  {
    id: 116,
    name: "Heatwave",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 36,
    sourceKey: "CX2"
  },
  {
    id: 117,
    name: "Luxury",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 37,
    sourceKey: "DS3"
  },
  {
    id: 118,
    name: "Majesty",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 38,
    sourceKey: "DC4"
  },
  {
    id: 119,
    name: "Oil",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 39,
    sourceKey: "BF5"
  },
  {
    id: 223,
    name: "Peacock",
    type: "trait",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 40,
    sourceKey: "AZ4"
  },
  {
    id: 120,
    name: "Seabiscuit",
    type: "body",
    count: 2,
    percentage: "0.05",
    tier: "ultra-rare",
    rank: 41,
    sourceKey: "KY4"
  },
  {
    id: 12,
    name: "Acid",
    type: "head",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 42,
    sourceKey: "DP4"
  },
  {
    id: 121,
    name: "Gatsby",
    type: "body",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 43,
    sourceKey: "DC4"
  },
  {
    id: 13,
    name: "Gold",
    type: "head",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 44,
    sourceKey: "IV1"
  },
  {
    id: 224,
    name: "Palace",
    type: "trait",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 45,
    sourceKey: "AZ2"
  },
  {
    id: 122,
    name: "Pearl",
    type: "body",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 46,
    sourceKey: "ER3"
  },
  {
    id: 123,
    name: "Spaghetti",
    type: "body",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 47,
    sourceKey: "AA2"
  },
  {
    id: 124,
    name: "Tarpie",
    type: "body",
    count: 3,
    percentage: "0.07",
    tier: "ultra-rare",
    rank: 48,
    sourceKey: "DS1"
  },
  {
    id: 125,
    name: "Cartoonichrome",
    type: "body",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 49,
    sourceKey: "AA1"
  },
  {
    id: 225,
    name: "Drip",
    type: "trait",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 50,
    sourceKey: "EY3"
  },
  {
    id: 126,
    name: "Granite",
    type: "body",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 51,
    sourceKey: "BQ1"
  },
  {
    id: 14,
    name: "Lazer",
    type: "head",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 52,
    sourceKey: "BC1"
  },
  {
    id: 226,
    name: "Test Track",
    type: "trait",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 53,
    sourceKey: "AW3"
  },
  {
    id: 127,
    name: "Tie Dye",
    type: "body",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 54,
    sourceKey: "BJ3"
  },
  {
    id: 15,
    name: "Wires",
    type: "head",
    count: 4,
    percentage: "0.10",
    tier: "ultra-rare",
    rank: 55,
    sourceKey: "FS1"
  },
  {
    id: 128,
    name: "Burnt",
    type: "body",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 56,
    sourceKey: "DS2"
  },
  {
    id: 129,
    name: "Damascus",
    type: "body",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 57,
    sourceKey: "BW2"
  },
  {
    id: 130,
    name: "Giger",
    type: "body",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 58,
    sourceKey: "AA1"
  },
  {
    id: 131,
    name: "Maze",
    type: "body",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 59,
    sourceKey: "BJ1"
  },
  {
    id: 16,
    name: "Nightstalker",
    type: "head",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 60,
    sourceKey: "AE1"
  },
  {
    id: 17,
    name: "Nyan",
    type: "head",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 61,
    sourceKey: "AK3"
  },
  {
    id: 18,
    name: "Paul",
    type: "head",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 62,
    sourceKey: "AA1"
  },
  {
    id: 19,
    name: "Pizza",
    type: "head",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 63,
    sourceKey: "CF3"
  },
  {
    id: 227,
    name: "Screamo",
    type: "trait",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 64,
    sourceKey: "KQ3"
  },
  {
    id: 20,
    name: "Terminator",
    type: "head",
    count: 5,
    percentage: "0.13",
    tier: "ultra-rare",
    rank: 65,
    sourceKey: "AA1"
  },
  {
    id: 21,
    name: "24K",
    type: "head",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 66,
    sourceKey: "AA1"
  },
  {
    id: 132,
    name: "Bag",
    type: "body",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 67,
    sourceKey: "DM1"
  },
  {
    id: 228,
    name: "Blasters",
    type: "trait",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 68,
    sourceKey: "CU3"
  },
  {
    id: 22,
    name: "China",
    type: "head",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 69,
    sourceKey: "CF1"
  },
  {
    id: 133,
    name: "Nuggets",
    type: "body",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 70,
    sourceKey: "AK2"
  },
  {
    id: 134,
    name: "Radiance",
    type: "body",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 71,
    sourceKey: "AA1"
  },
  {
    id: 229,
    name: "Spectrum",
    type: "trait",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 72,
    sourceKey: "EV3"
  },
  {
    id: 23,
    name: "Stained Glass",
    type: "head",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 73,
    sourceKey: "CF1"
  },
  {
    id: 24,
    name: "The Lethal Dimension",
    type: "head",
    count: 6,
    percentage: "0.15",
    tier: "ultra-rare",
    rank: 74,
    sourceKey: "BC1"
  },
  {
    id: 230,
    name: "2001",
    type: "trait",
    count: 7,
    percentage: "0.18",
    tier: "ultra-rare",
    rank: 75,
    sourceKey: "EY2"
  },
  {
    id: 231,
    name: "Crow",
    type: "trait",
    count: 7,
    percentage: "0.18",
    tier: "ultra-rare",
    rank: 76,
    sourceKey: "AZ1"
  },
  {
    id: 135,
    name: "Jolly Rancher",
    type: "body",
    count: 7,
    percentage: "0.18",
    tier: "ultra-rare",
    rank: 77,
    sourceKey: "AA1"
  },
  {
    id: 25,
    name: "Magma",
    type: "head",
    count: 7,
    percentage: "0.18",
    tier: "ultra-rare",
    rank: 78,
    sourceKey: "AA1"
  },
  {
    id: 136,
    name: "Shipped",
    type: "body",
    count: 7,
    percentage: "0.18",
    tier: "ultra-rare",
    rank: 79,
    sourceKey: "AK1"
  },
  {
    id: 26,
    name: "???",
    type: "head",
    count: 8,
    percentage: "0.20",
    tier: "ultra-rare",
    rank: 80,
    sourceKey: "AR1"
  },
  {
    id: 232,
    name: "Hydra",
    type: "trait",
    count: 8,
    percentage: "0.20",
    tier: "ultra-rare",
    rank: 81,
    sourceKey: "AP3"
  },
  {
    id: 137,
    name: "Lord",
    type: "body",
    count: 8,
    percentage: "0.20",
    tier: "ultra-rare",
    rank: 82,
    sourceKey: "AK3"
  },
  {
    id: 27,
    name: "Silicon",
    type: "head",
    count: 8,
    percentage: "0.20",
    tier: "ultra-rare",
    rank: 83,
    sourceKey: "AK1"
  },
  {
    id: 138,
    name: "X Ray",
    type: "body",
    count: 8,
    percentage: "0.20",
    tier: "ultra-rare",
    rank: 84,
    sourceKey: "BI1"
  },
  {
    id: 28,
    name: "Bone Daddy",
    type: "head",
    count: 9,
    percentage: "0.22",
    tier: "ultra-rare",
    rank: 85,
    sourceKey: "HB1"
  },
  {
    id: 29,
    name: "Bowling",
    type: "head",
    count: 9,
    percentage: "0.22",
    tier: "ultra-rare",
    rank: 86,
    sourceKey: "CF2"
  },
  {
    id: 139,
    name: "OE Light",
    type: "body",
    count: 9,
    percentage: "0.22",
    tier: "ultra-rare",
    rank: 87,
    sourceKey: "AA2"
  },
  {
    id: 140,
    name: "Peppermint",
    type: "body",
    count: 9,
    percentage: "0.22",
    tier: "ultra-rare",
    rank: 88,
    sourceKey: "CB3"
  },
  {
    id: 30,
    name: "Snow",
    type: "head",
    count: 9,
    percentage: "0.22",
    tier: "ultra-rare",
    rank: 89,
    sourceKey: "GG1"
  },
  {
    id: 31,
    name: "The Ram",
    type: "head",
    count: 10,
    percentage: "0.25",
    tier: "ultra-rare",
    rank: 90,
    sourceKey: "AE1"
  },
  {
    id: 32,
    name: "Whiskey",
    type: "head",
    count: 10,
    percentage: "0.25",
    tier: "ultra-rare",
    rank: 91,
    sourceKey: "AK1"
  },
  {
    id: 33,
    name: "Arcade",
    type: "head",
    count: 11,
    percentage: "0.27",
    tier: "ultra-rare",
    rank: 92,
    sourceKey: "HB2"
  },
  {
    id: 141,
    name: "Blood",
    type: "body",
    count: 11,
    percentage: "0.27",
    tier: "ultra-rare",
    rank: 93,
    sourceKey: "CB3"
  },
  {
    id: 233,
    name: "Carbonite",
    type: "trait",
    count: 11,
    percentage: "0.27",
    tier: "ultra-rare",
    rank: 94,
    sourceKey: "EY1"
  },
  {
    id: 34,
    name: "Mint",
    type: "head",
    count: 11,
    percentage: "0.27",
    tier: "ultra-rare",
    rank: 95,
    sourceKey: "AE1"
  },
  {
    id: 35,
    name: "Bubblegum",
    type: "head",
    count: 12,
    percentage: "0.30",
    tier: "ultra-rare",
    rank: 96,
    sourceKey: "CF3"
  },
  {
    id: 234,
    name: "Iced",
    type: "trait",
    count: 12,
    percentage: "0.30",
    tier: "ultra-rare",
    rank: 97,
    sourceKey: "BR3"
  },
  {
    id: 142,
    name: "Seafoam",
    type: "body",
    count: 12,
    percentage: "0.30",
    tier: "ultra-rare",
    rank: 98,
    sourceKey: "DC1"
  },
  {
    id: 36,
    name: "Ballerina",
    type: "head",
    count: 13,
    percentage: "0.33",
    tier: "ultra-rare",
    rank: 99,
    sourceKey: "HB2"
  },
  {
    id: 235,
    name: "Icon",
    type: "trait",
    count: 13,
    percentage: "0.33",
    tier: "ultra-rare",
    rank: 100,
    sourceKey: "EV2"
  },
  {
    id: 143,
    name: "Ocean",
    type: "body",
    count: 13,
    percentage: "0.33",
    tier: "ultra-rare",
    rank: 101,
    sourceKey: "BF1"
  },
  {
    id: 236,
    name: "Splatter",
    type: "trait",
    count: 13,
    percentage: "0.33",
    tier: "ultra-rare",
    rank: 102,
    sourceKey: "GK3"
  },
  {
    id: 37,
    name: "Heatmap",
    type: "head",
    count: 14,
    percentage: "0.35",
    tier: "ultra-rare",
    rank: 103,
    sourceKey: "BC1"
  },
  {
    id: 38,
    name: "Acrylic",
    type: "head",
    count: 15,
    percentage: "0.38",
    tier: "ultra-rare",
    rank: 104,
    sourceKey: "HB2"
  },
  {
    id: 144,
    name: "Carving",
    type: "body",
    count: 15,
    percentage: "0.38",
    tier: "ultra-rare",
    rank: 105,
    sourceKey: "FD2"
  },
  {
    id: 237,
    name: "Holographic",
    type: "trait",
    count: 15,
    percentage: "0.38",
    tier: "ultra-rare",
    rank: 106,
    sourceKey: "AS3"
  },
  {
    id: 145,
    name: "Rug",
    type: "body",
    count: 15,
    percentage: "0.38",
    tier: "ultra-rare",
    rank: 107,
    sourceKey: "BJ2"
  },
  {
    id: 146,
    name: "Trapped",
    type: "body",
    count: 15,
    percentage: "0.38",
    tier: "ultra-rare",
    rank: 108,
    sourceKey: "AA3"
  },
  {
    id: 147,
    name: "Frosted",
    type: "body",
    count: 16,
    percentage: "0.40",
    tier: "ultra-rare",
    rank: 109,
    sourceKey: "AA3"
  },
  {
    id: 39,
    name: "Quilt",
    type: "head",
    count: 16,
    percentage: "0.40",
    tier: "ultra-rare",
    rank: 110,
    sourceKey: "GQ2"
  },
  {
    id: 238,
    name: "Ring Red",
    type: "trait",
    count: 16,
    percentage: "0.40",
    tier: "ultra-rare",
    rank: 111,
    sourceKey: "DA3"
  },
  {
    id: 40,
    name: "Ornament",
    type: "head",
    count: 17,
    percentage: "0.43",
    tier: "ultra-rare",
    rank: 112,
    sourceKey: "AE1"
  },
  {
    id: 41,
    name: "Sleet",
    type: "head",
    count: 18,
    percentage: "0.45",
    tier: "ultra-rare",
    rank: 113,
    sourceKey: "HH1"
  },
  {
    id: 148,
    name: "Sticky",
    type: "body",
    count: 18,
    percentage: "0.45",
    tier: "ultra-rare",
    rank: 114,
    sourceKey: "BF1"
  },
  {
    id: 239,
    name: "Tactical",
    type: "trait",
    count: 19,
    percentage: "0.47",
    tier: "ultra-rare",
    rank: 115,
    sourceKey: "DE3"
  },
  {
    id: 149,
    name: "Vapor",
    type: "body",
    count: 19,
    percentage: "0.47",
    tier: "ultra-rare",
    rank: 116,
    sourceKey: "BF3"
  },
  {
    id: 42,
    name: "Hades",
    type: "head",
    count: 20,
    percentage: "0.50",
    tier: "ultra-rare",
    rank: 117,
    sourceKey: "AE1"
  },
  {
    id: 150,
    name: "Inner Rainbow",
    type: "body",
    count: 20,
    percentage: "0.50",
    tier: "ultra-rare",
    rank: 118,
    sourceKey: "DM1"
  },
  {
    id: 43,
    name: "Drill",
    type: "head",
    count: 21,
    percentage: "0.53",
    tier: "very-rare",
    rank: 119,
    sourceKey: "AM1"
  },
  {
    id: 151,
    name: "Frostbit",
    type: "body",
    count: 21,
    percentage: "0.53",
    tier: "very-rare",
    rank: 120,
    sourceKey: "AA2"
  },
  {
    id: 240,
    name: "Nuclear",
    type: "trait",
    count: 21,
    percentage: "0.53",
    tier: "very-rare",
    rank: 121,
    sourceKey: "HN3"
  },
  {
    id: 44,
    name: "Cotton Candy",
    type: "head",
    count: 22,
    percentage: "0.55",
    tier: "very-rare",
    rank: 122,
    sourceKey: "ED1"
  },
  {
    id: 241,
    name: "Foil",
    type: "trait",
    count: 22,
    percentage: "0.55",
    tier: "very-rare",
    rank: 123,
    sourceKey: "AJ3"
  },
  {
    id: 45,
    name: "Mesh",
    type: "head",
    count: 22,
    percentage: "0.55",
    tier: "very-rare",
    rank: 124,
    sourceKey: "BC3"
  },
  {
    id: 46,
    name: "Tron",
    type: "head",
    count: 22,
    percentage: "0.55",
    tier: "very-rare",
    rank: 125,
    sourceKey: "CF3"
  },
  {
    id: 47,
    name: "Ace of Spades",
    type: "head",
    count: 23,
    percentage: "0.57",
    tier: "very-rare",
    rank: 126,
    sourceKey: "AE2"
  },
  {
    id: 152,
    name: "Denim",
    type: "body",
    count: 23,
    percentage: "0.57",
    tier: "very-rare",
    rank: 127,
    sourceKey: "AA1"
  },
  {
    id: 242,
    name: "Golden Guns",
    type: "trait",
    count: 23,
    percentage: "0.57",
    tier: "very-rare",
    rank: 128,
    sourceKey: "CU2"
  },
  {
    id: 48,
    name: "Mars Attacks",
    type: "head",
    count: 23,
    percentage: "0.57",
    tier: "very-rare",
    rank: 129,
    sourceKey: "HB2"
  },
  {
    id: 49,
    name: "Dualtone",
    type: "head",
    count: 24,
    percentage: "0.60",
    tier: "very-rare",
    rank: 130,
    sourceKey: "BC4"
  },
  {
    id: 50,
    name: "Flaked",
    type: "head",
    count: 24,
    percentage: "0.60",
    tier: "very-rare",
    rank: 131,
    sourceKey: "AA2"
  },
  {
    id: 243,
    name: "LV-426",
    type: "trait",
    count: 25,
    percentage: "0.63",
    tier: "very-rare",
    rank: 132,
    sourceKey: "AW2"
  },
  {
    id: 244,
    name: "Sap",
    type: "trait",
    count: 25,
    percentage: "0.63",
    tier: "very-rare",
    rank: 133,
    sourceKey: "BC3"
  },
  {
    id: 153,
    name: "Stars",
    type: "body",
    count: 25,
    percentage: "0.63",
    tier: "very-rare",
    rank: 134,
    sourceKey: "BJ2"
  },
  {
    id: 154,
    name: "White",
    type: "body",
    count: 25,
    percentage: "0.63",
    tier: "very-rare",
    rank: 135,
    sourceKey: "BF1"
  },
  {
    id: 245,
    name: "Bling",
    type: "trait",
    count: 26,
    percentage: "0.65",
    tier: "very-rare",
    rank: 136,
    sourceKey: "MX1"
  },
  {
    id: 51,
    name: "Electrik",
    type: "head",
    count: 26,
    percentage: "0.65",
    tier: "very-rare",
    rank: 137,
    sourceKey: "AA1"
  },
  {
    id: 52,
    name: "Hal",
    type: "head",
    count: 26,
    percentage: "0.65",
    tier: "very-rare",
    rank: 138,
    sourceKey: "HB1"
  },
  {
    id: 246,
    name: "R&B",
    type: "trait",
    count: 27,
    percentage: "0.68",
    tier: "very-rare",
    rank: 139,
    sourceKey: "KQ2"
  },
  {
    id: 247,
    name: "Earth",
    type: "trait",
    count: 28,
    percentage: "0.70",
    tier: "very-rare",
    rank: 140,
    sourceKey: "AW1"
  },
  {
    id: 248,
    name: "Jeff",
    type: "trait",
    count: 28,
    percentage: "0.70",
    tier: "very-rare",
    rank: 141,
    sourceKey: "EH3"
  },
  {
    id: 249,
    name: "Purplex",
    type: "trait",
    count: 28,
    percentage: "0.70",
    tier: "very-rare",
    rank: 142,
    sourceKey: "MT2"
  },
  {
    id: 53,
    name: "Recon",
    type: "head",
    count: 28,
    percentage: "0.70",
    tier: "very-rare",
    rank: 143,
    sourceKey: "HB1"
  },
  {
    id: 155,
    name: "Doom",
    type: "body",
    count: 30,
    percentage: "0.75",
    tier: "very-rare",
    rank: 144,
    sourceKey: "BJ1"
  },
  {
    id: 156,
    name: "Journey",
    type: "body",
    count: 30,
    percentage: "0.75",
    tier: "very-rare",
    rank: 145,
    sourceKey: "AK1"
  },
  {
    id: 250,
    name: "Just Wren",
    type: "trait",
    count: 30,
    percentage: "0.75",
    tier: "very-rare",
    rank: 146,
    sourceKey: "EV1"
  },
  {
    id: 157,
    name: "Mercury",
    type: "body",
    count: 30,
    percentage: "0.75",
    tier: "very-rare",
    rank: 147,
    sourceKey: "BF1"
  },
  {
    id: 251,
    name: "Angler",
    type: "trait",
    count: 31,
    percentage: "0.78",
    tier: "very-rare",
    rank: 148,
    sourceKey: "AS2"
  },
  {
    id: 158,
    name: "Stone",
    type: "body",
    count: 31,
    percentage: "0.78",
    tier: "very-rare",
    rank: 149,
    sourceKey: "AK3"
  },
  {
    id: 159,
    name: "Tiles",
    type: "body",
    count: 31,
    percentage: "0.78",
    tier: "very-rare",
    rank: 150,
    sourceKey: "BF1"
  },
  {
    id: 160,
    name: "Soul",
    type: "body",
    count: 32,
    percentage: "0.80",
    tier: "very-rare",
    rank: 151,
    sourceKey: "BF1"
  },
  {
    id: 54,
    name: "Sun",
    type: "head",
    count: 32,
    percentage: "0.80",
    tier: "very-rare",
    rank: 152,
    sourceKey: "AA2"
  },
  {
    id: 161,
    name: "Lizard",
    type: "body",
    count: 33,
    percentage: "0.83",
    tier: "very-rare",
    rank: 153,
    sourceKey: "BF1"
  },
  {
    id: 55,
    name: "Sterling",
    type: "head",
    count: 33,
    percentage: "0.83",
    tier: "very-rare",
    rank: 154,
    sourceKey: "HH1"
  },
  {
    id: 162,
    name: "Cheetah",
    type: "body",
    count: 34,
    percentage: "0.85",
    tier: "very-rare",
    rank: 155,
    sourceKey: "BF1"
  },
  {
    id: 56,
    name: "Lich",
    type: "head",
    count: 34,
    percentage: "0.85",
    tier: "very-rare",
    rank: 156,
    sourceKey: "HB2"
  },
  {
    id: 252,
    name: "Phoenix",
    type: "trait",
    count: 34,
    percentage: "0.85",
    tier: "very-rare",
    rank: 157,
    sourceKey: "AP2"
  },
  {
    id: 163,
    name: "Sunset",
    type: "body",
    count: 34,
    percentage: "0.85",
    tier: "very-rare",
    rank: 158,
    sourceKey: "BI1"
  },
  {
    id: 57,
    name: "Plate",
    type: "head",
    count: 35,
    percentage: "0.88",
    tier: "very-rare",
    rank: 159,
    sourceKey: "AA1"
  },
  {
    id: 164,
    name: "Rose",
    type: "body",
    count: 36,
    percentage: "0.90",
    tier: "very-rare",
    rank: 160,
    sourceKey: "DH1"
  },
  {
    id: 165,
    name: "Tat",
    type: "body",
    count: 36,
    percentage: "0.90",
    tier: "very-rare",
    rank: 161,
    sourceKey: "BF1"
  },
  {
    id: 253,
    name: "Firebird",
    type: "trait",
    count: 37,
    percentage: "0.92",
    tier: "very-rare",
    rank: 162,
    sourceKey: "BR2"
  },
  {
    id: 58,
    name: "Porcelain",
    type: "head",
    count: 37,
    percentage: "0.92",
    tier: "very-rare",
    rank: 163,
    sourceKey: "AA1"
  },
  {
    id: 59,
    name: "Cream",
    type: "head",
    count: 38,
    percentage: "0.95",
    tier: "very-rare",
    rank: 164,
    sourceKey: "HB1"
  },
  {
    id: 166,
    name: "Tangerine",
    type: "body",
    count: 38,
    percentage: "0.95",
    tier: "very-rare",
    rank: 165,
    sourceKey: "BJ1"
  },
  {
    id: 254,
    name: "Heliotropium",
    type: "trait",
    count: 39,
    percentage: "0.97",
    tier: "very-rare",
    rank: 166,
    sourceKey: "MO2"
  },
  {
    id: 60,
    name: "Baby",
    type: "head",
    count: 41,
    percentage: "1.03",
    tier: "rare",
    rank: 167,
    sourceKey: "HH1"
  },
  {
    id: 61,
    name: "Disco",
    type: "head",
    count: 41,
    percentage: "1.03",
    tier: "rare",
    rank: 168,
    sourceKey: "HB1"
  },
  {
    id: 167,
    name: "Eyes",
    type: "body",
    count: 41,
    percentage: "1.03",
    tier: "rare",
    rank: 169,
    sourceKey: "BJ1"
  },
  {
    id: 168,
    name: "Happymeal",
    type: "body",
    count: 41,
    percentage: "1.03",
    tier: "rare",
    rank: 170,
    sourceKey: "BJ2"
  },
  {
    id: 169,
    name: "Maple",
    type: "body",
    count: 42,
    percentage: "1.05",
    tier: "rare",
    rank: 171,
    sourceKey: "AK1"
  },
  {
    id: 170,
    name: "Ooze",
    type: "body",
    count: 43,
    percentage: "1.07",
    tier: "rare",
    rank: 172,
    sourceKey: "BJ1"
  },
  {
    id: 62,
    name: "Liquid Lavender",
    type: "head",
    count: 44,
    percentage: "1.10",
    tier: "rare",
    rank: 173,
    sourceKey: "HB2"
  },
  {
    id: 171,
    name: "Obsidian",
    type: "body",
    count: 44,
    percentage: "1.10",
    tier: "rare",
    rank: 174,
    sourceKey: "BL1"
  },
  {
    id: 172,
    name: "Prickles",
    type: "body",
    count: 44,
    percentage: "1.10",
    tier: "rare",
    rank: 175,
    sourceKey: "AA1"
  },
  {
    id: 173,
    name: "Prom",
    type: "body",
    count: 44,
    percentage: "1.10",
    tier: "rare",
    rank: 176,
    sourceKey: "BJ1"
  },
  {
    id: 174,
    name: "Crystal Camo",
    type: "body",
    count: 45,
    percentage: "1.13",
    tier: "rare",
    rank: 177,
    sourceKey: "DH1"
  },
  {
    id: 63,
    name: "Dragonfly",
    type: "head",
    count: 45,
    percentage: "1.13",
    tier: "rare",
    rank: 178,
    sourceKey: "HB1"
  },
  {
    id: 64,
    name: "Sahara",
    type: "head",
    count: 45,
    percentage: "1.13",
    tier: "rare",
    rank: 179,
    sourceKey: "HH1"
  },
  {
    id: 65,
    name: "Grass",
    type: "head",
    count: 46,
    percentage: "1.15",
    tier: "rare",
    rank: 180,
    sourceKey: "HB3"
  },
  {
    id: 175,
    name: "Marble",
    type: "body",
    count: 46,
    percentage: "1.15",
    tier: "rare",
    rank: 181,
    sourceKey: "BF1"
  },
  {
    id: 176,
    name: "Rattler",
    type: "body",
    count: 46,
    percentage: "1.15",
    tier: "rare",
    rank: 182,
    sourceKey: "BF1"
  },
  {
    id: 255,
    name: "Black Parade",
    type: "trait",
    count: 49,
    percentage: "1.23",
    tier: "rare",
    rank: 183,
    sourceKey: "CU1"
  },
  {
    id: 177,
    name: "Forest",
    type: "body",
    count: 49,
    percentage: "1.23",
    tier: "rare",
    rank: 184,
    sourceKey: "BJ2"
  },
  {
    id: 178,
    name: "Poker",
    type: "body",
    count: 49,
    percentage: "1.23",
    tier: "rare",
    rank: 185,
    sourceKey: "BL1"
  },
  {
    id: 179,
    name: "Black",
    type: "body",
    count: 50,
    percentage: "1.25",
    tier: "rare",
    rank: 186,
    sourceKey: "BF1"
  },
  {
    id: 66,
    name: "Ivory",
    type: "head",
    count: 50,
    percentage: "1.25",
    tier: "rare",
    rank: 187,
    sourceKey: "HB3"
  },
  {
    id: 180,
    name: "Arctic",
    type: "body",
    count: 51,
    percentage: "1.27",
    tier: "rare",
    rank: 188,
    sourceKey: "BF1"
  },
  {
    id: 181,
    name: "Rust",
    type: "body",
    count: 51,
    percentage: "1.27",
    tier: "rare",
    rank: 189,
    sourceKey: "BJ1"
  },
  {
    id: 182,
    name: "Smurf",
    type: "body",
    count: 51,
    percentage: "1.27",
    tier: "rare",
    rank: 190,
    sourceKey: "BJ2"
  },
  {
    id: 183,
    name: "Dr.",
    type: "body",
    count: 52,
    percentage: "1.30",
    tier: "rare",
    rank: 191,
    sourceKey: "BF1"
  },
  {
    id: 256,
    name: "Bonebox",
    type: "trait",
    count: 53,
    percentage: "1.32",
    tier: "rare",
    rank: 192,
    sourceKey: "GK2"
  },
  {
    id: 184,
    name: "Aztec",
    type: "body",
    count: 54,
    percentage: "1.35",
    tier: "rare",
    rank: 193,
    sourceKey: "AK1"
  },
  {
    id: 185,
    name: "Meat",
    type: "body",
    count: 54,
    percentage: "1.35",
    tier: "rare",
    rank: 194,
    sourceKey: "FD1"
  },
  {
    id: 292,
    name: "1960's",
    type: "head",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 195,
    sourceKey: "AA2"
  },
  {
    id: 257,
    name: "Hefner",
    type: "trait",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 196,
    sourceKey: "BR1"
  },
  {
    id: 186,
    name: "Highlights",
    type: "body",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 197,
    sourceKey: "EE2"
  },
  {
    id: 187,
    name: "Leeloo",
    type: "body",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 198,
    sourceKey: "BF1"
  },
  {
    id: 68,
    name: "Royal",
    type: "head",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 199,
    sourceKey: "BC1"
  },
  {
    id: 69,
    name: "Silent Film",
    type: "head",
    count: 55,
    percentage: "1.38",
    tier: "rare",
    rank: 200,
    sourceKey: "BC4"
  },
  {
    id: 70,
    name: "Boss",
    type: "head",
    count: 56,
    percentage: "1.40",
    tier: "rare",
    rank: 201,
    sourceKey: "HH1"
  },
  {
    id: 71,
    name: "Butane",
    type: "head",
    count: 57,
    percentage: "1.43",
    tier: "rare",
    rank: 202,
    sourceKey: "HB1"
  },
  {
    id: 72,
    name: "Coin",
    type: "head",
    count: 57,
    percentage: "1.43",
    tier: "rare",
    rank: 203,
    sourceKey: "HB3"
  },
  {
    id: 188,
    name: "Waves",
    type: "body",
    count: 57,
    percentage: "1.43",
    tier: "rare",
    rank: 204,
    sourceKey: "FD1"
  },
  {
    id: 258,
    name: "Hammerheat",
    type: "trait",
    count: 58,
    percentage: "1.45",
    tier: "rare",
    rank: 205,
    sourceKey: "MT1"
  },
  {
    id: 259,
    name: "Luna",
    type: "trait",
    count: 58,
    percentage: "1.45",
    tier: "rare",
    rank: 206,
    sourceKey: "AS1"
  },
  {
    id: 189,
    name: "Plush",
    type: "body",
    count: 58,
    percentage: "1.45",
    tier: "rare",
    rank: 207,
    sourceKey: "BJ1"
  },
  {
    id: 190,
    name: "Tickle",
    type: "body",
    count: 59,
    percentage: "1.47",
    tier: "rare",
    rank: 208,
    sourceKey: "BL1"
  },
  {
    id: 191,
    name: "Mugged",
    type: "body",
    count: 60,
    percentage: "1.50",
    tier: "rare",
    rank: 209,
    sourceKey: "BJ1"
  },
  {
    id: 192,
    name: "Victoria",
    type: "body",
    count: 60,
    percentage: "1.50",
    tier: "rare",
    rank: 210,
    sourceKey: "BF2"
  },
  {
    id: 193,
    name: "Cubes",
    type: "body",
    count: 63,
    percentage: "1.57",
    tier: "rare",
    rank: 211,
    sourceKey: "DM1"
  },
  {
    id: 260,
    name: "Pop",
    type: "trait",
    count: 63,
    percentage: "1.57",
    tier: "rare",
    rank: 212,
    sourceKey: "KQ1"
  },
  {
    id: 261,
    name: "Ring Green",
    type: "trait",
    count: 63,
    percentage: "1.57",
    tier: "rare",
    rank: 213,
    sourceKey: "DA2"
  },
  {
    id: 194,
    name: "Sand",
    type: "body",
    count: 63,
    percentage: "1.57",
    tier: "rare",
    rank: 214,
    sourceKey: "DM1"
  },
  {
    id: 262,
    name: "Fourzin",
    type: "trait",
    count: 64,
    percentage: "1.60",
    tier: "rare",
    rank: 215,
    sourceKey: "EH2"
  },
  {
    id: 73,
    name: "Hacker",
    type: "head",
    count: 64,
    percentage: "1.60",
    tier: "rare",
    rank: 216,
    sourceKey: "HB2"
  },
  {
    id: 195,
    name: "Heart",
    type: "body",
    count: 64,
    percentage: "1.60",
    tier: "rare",
    rank: 217,
    sourceKey: "BI1"
  },
  {
    id: 74,
    name: "Bumblebee",
    type: "head",
    count: 65,
    percentage: "1.63",
    tier: "rare",
    rank: 218,
    sourceKey: "BC4"
  },
  {
    id: 75,
    name: "Camo",
    type: "head",
    count: 65,
    percentage: "1.63",
    tier: "rare",
    rank: 219,
    sourceKey: "CF1"
  },
  {
    id: 76,
    name: "Plastik",
    type: "head",
    count: 65,
    percentage: "1.63",
    tier: "rare",
    rank: 220,
    sourceKey: "HB1"
  },
  {
    id: 77,
    name: "Mac & Cheese",
    type: "head",
    count: 67,
    percentage: "1.68",
    tier: "rare",
    rank: 221,
    sourceKey: "AA2"
  },
  {
    id: 196,
    name: "Carbon",
    type: "body",
    count: 68,
    percentage: "1.70",
    tier: "rare",
    rank: 222,
    sourceKey: "BJ1"
  },
  {
    id: 78,
    name: "Crimson",
    type: "head",
    count: 68,
    percentage: "1.70",
    tier: "rare",
    rank: 223,
    sourceKey: "BC1"
  },
  {
    id: 197,
    name: "Crystal Clear",
    type: "body",
    count: 68,
    percentage: "1.70",
    tier: "rare",
    rank: 224,
    sourceKey: "BJ1"
  },
  {
    id: 263,
    name: "Molten Core",
    type: "trait",
    count: 68,
    percentage: "1.70",
    tier: "rare",
    rank: 225,
    sourceKey: "HN2"
  },
  {
    id: 79,
    name: "Dazed Piggy",
    type: "head",
    count: 69,
    percentage: "1.73",
    tier: "rare",
    rank: 226,
    sourceKey: "HH1"
  },
  {
    id: 198,
    name: "Sir",
    type: "body",
    count: 69,
    percentage: "1.73",
    tier: "rare",
    rank: 227,
    sourceKey: "BJ1"
  },
  {
    id: 80,
    name: "Mahogany",
    type: "head",
    count: 70,
    percentage: "1.75",
    tier: "rare",
    rank: 228,
    sourceKey: "HB2"
  },
  {
    id: 199,
    name: "Princess",
    type: "body",
    count: 70,
    percentage: "1.75",
    tier: "rare",
    rank: 229,
    sourceKey: "BF1"
  },
  {
    id: 264,
    name: "Bumble Bird",
    type: "trait",
    count: 72,
    percentage: "1.80",
    tier: "rare",
    rank: 230,
    sourceKey: "BC2"
  },
  {
    id: 81,
    name: "Big Brother",
    type: "head",
    count: 73,
    percentage: "1.82",
    tier: "rare",
    rank: 231,
    sourceKey: "HB2"
  },
  {
    id: 200,
    name: "Chrome",
    type: "body",
    count: 73,
    percentage: "1.82",
    tier: "rare",
    rank: 232,
    sourceKey: "AK1"
  },
  {
    id: 265,
    name: "Deep Space",
    type: "trait",
    count: 73,
    percentage: "1.82",
    tier: "rare",
    rank: 233,
    sourceKey: "FB2"
  },
  {
    id: 266,
    name: "Night Vision",
    type: "trait",
    count: 73,
    percentage: "1.82",
    tier: "rare",
    rank: 234,
    sourceKey: "OF2"
  },
  {
    id: 82,
    name: "Snapshot",
    type: "head",
    count: 73,
    percentage: "1.82",
    tier: "rare",
    rank: 235,
    sourceKey: "AE1"
  },
  {
    id: 83,
    name: "Cadillac",
    type: "head",
    count: 74,
    percentage: "1.85",
    tier: "rare",
    rank: 236,
    sourceKey: "BC2"
  },
  {
    id: 84,
    name: "Corroded",
    type: "head",
    count: 74,
    percentage: "1.85",
    tier: "rare",
    rank: 237,
    sourceKey: "AA1"
  },
  {
    id: 267,
    name: "Albino",
    type: "trait",
    count: 75,
    percentage: "1.88",
    tier: "rare",
    rank: 238,
    sourceKey: "AJ2"
  },
  {
    id: 181,
    name: "Rust",
    type: "head",
    count: 75,
    percentage: "1.88",
    tier: "rare",
    rank: 239,
    sourceKey: "AM1"
  },
  {
    id: 201,
    name: "Steam",
    type: "body",
    count: 76,
    percentage: "1.90",
    tier: "rare",
    rank: 240,
    sourceKey: "BI1"
  },
  {
    id: 86,
    name: "Business",
    type: "head",
    count: 77,
    percentage: "1.93",
    tier: "rare",
    rank: 241,
    sourceKey: "AA2"
  },
  {
    id: 268,
    name: "Scissors",
    type: "trait",
    count: 77,
    percentage: "1.93",
    tier: "rare",
    rank: 242,
    sourceKey: "AP1"
  },
  {
    id: 269,
    name: "Black & White",
    type: "trait",
    count: 78,
    percentage: "1.95",
    tier: "rare",
    rank: 243,
    sourceKey: "JI2"
  },
  {
    id: 202,
    name: "Goblin",
    type: "body",
    count: 78,
    percentage: "1.95",
    tier: "rare",
    rank: 244,
    sourceKey: "BI1"
  },
  {
    id: 87,
    name: "Neon Flamingo",
    type: "head",
    count: 78,
    percentage: "1.95",
    tier: "rare",
    rank: 245,
    sourceKey: "HB3"
  },
  {
    id: 270,
    name: "Silver",
    type: "trait",
    count: 78,
    percentage: "1.95",
    tier: "rare",
    rank: 246,
    sourceKey: "MO1"
  },
  {
    id: 184,
    name: "Aztec",
    type: "head",
    count: 79,
    percentage: "1.98",
    tier: "rare",
    rank: 247,
    sourceKey: "HH1"
  },
  {
    id: 89,
    name: "Milk",
    type: "head",
    count: 80,
    percentage: "2.00",
    tier: "rare",
    rank: 248,
    sourceKey: "AA1"
  },
  {
    id: 271,
    name: "Whiteout",
    type: "trait",
    count: 80,
    percentage: "2.00",
    tier: "rare",
    rank: 249,
    sourceKey: "DE2"
  },
  {
    id: 90,
    name: "Aqua",
    type: "head",
    count: 81,
    percentage: "2.02",
    tier: "rare",
    rank: 250,
    sourceKey: "HB3"
  },
  {
    id: 272,
    name: "Lumberjack",
    type: "trait",
    count: 81,
    percentage: "2.02",
    tier: "rare",
    rank: 251,
    sourceKey: "LG2"
  },
  {
    id: 203,
    name: "OE Dark",
    type: "body",
    count: 83,
    percentage: "2.08",
    tier: "rare",
    rank: 252,
    sourceKey: "BF1"
  },
  {
    id: 91,
    name: "desufnoC",
    type: "head",
    count: 85,
    percentage: "2.13",
    tier: "rare",
    rank: 253,
    sourceKey: "AK1"
  },
  {
    id: 204,
    name: "Bone",
    type: "body",
    count: 86,
    percentage: "2.15",
    tier: "rare",
    rank: 254,
    sourceKey: "DH1"
  },
  {
    id: 92,
    name: "Bark",
    type: "head",
    count: 89,
    percentage: "2.23",
    tier: "rare",
    rank: 255,
    sourceKey: "AA1"
  },
  {
    id: 205,
    name: "Abominable",
    type: "body",
    count: 90,
    percentage: "2.25",
    tier: "rare",
    rank: 256,
    sourceKey: "BF1"
  },
  {
    id: 273,
    name: "Chromium",
    type: "trait",
    count: 91,
    percentage: "2.27",
    tier: "rare",
    rank: 257,
    sourceKey: "CD2"
  },
  {
    id: 274,
    name: "Rainbow Morpho",
    type: "trait",
    count: 91,
    percentage: "2.27",
    tier: "rare",
    rank: 258,
    sourceKey: "IL2"
  },
  {
    id: 275,
    name: "Pawn Shop",
    type: "trait",
    count: 92,
    percentage: "2.30",
    tier: "rare",
    rank: 259,
    sourceKey: "GK1"
  },
  {
    id: 206,
    name: "Sky",
    type: "body",
    count: 93,
    percentage: "2.33",
    tier: "rare",
    rank: 260,
    sourceKey: "BJ1"
  },
  {
    id: 207,
    name: "Blush",
    type: "body",
    count: 94,
    percentage: "2.35",
    tier: "rare",
    rank: 261,
    sourceKey: "BJ2"
  },
  {
    id: 93,
    name: "Polished",
    type: "head",
    count: 94,
    percentage: "2.35",
    tier: "rare",
    rank: 262,
    sourceKey: "AE1"
  },
  {
    id: 94,
    name: "Lightning",
    type: "head",
    count: 96,
    percentage: "2.40",
    tier: "rare",
    rank: 263,
    sourceKey: "AA2"
  },
  {
    id: 276,
    name: "Ring Blue",
    type: "trait",
    count: 97,
    percentage: "2.43",
    tier: "rare",
    rank: 264,
    sourceKey: "DA1"
  },
  {
    id: 293,
    name: "Ol' Faithful",
    type: "head",
    count: 98,
    percentage: "2.45",
    tier: "rare",
    rank: 265,
    sourceKey: "HB2"
  },
  {
    id: 208,
    name: "Iron",
    type: "body",
    count: 99,
    percentage: "2.48",
    tier: "rare",
    rank: 266,
    sourceKey: "BJ1"
  },
  {
    id: 209,
    name: "James",
    type: "body",
    count: 99,
    percentage: "2.48",
    tier: "rare",
    rank: 267,
    sourceKey: "BF1"
  },
  {
    id: 96,
    name: "Classic",
    type: "head",
    count: 101,
    percentage: "2.53",
    tier: "uncommon",
    rank: 268,
    sourceKey: "AE1"
  },
  {
    id: 210,
    name: "Noob",
    type: "body",
    count: 104,
    percentage: "2.60",
    tier: "uncommon",
    rank: 269,
    sourceKey: "BJ1"
  },
  {
    id: 211,
    name: "Matte",
    type: "body",
    count: 106,
    percentage: "2.65",
    tier: "uncommon",
    rank: 270,
    sourceKey: "EE1"
  },
  {
    id: 277,
    name: "Concrete",
    type: "trait",
    count: 109,
    percentage: "2.73",
    tier: "uncommon",
    rank: 271,
    sourceKey: "CD1"
  },
  {
    id: 278,
    name: "Paparazzi",
    type: "trait",
    count: 111,
    percentage: "2.77",
    tier: "uncommon",
    rank: 272,
    sourceKey: "OF1"
  },
  {
    id: 97,
    name: "Shamrock",
    type: "head",
    count: 113,
    percentage: "2.83",
    tier: "uncommon",
    rank: 273,
    sourceKey: "HB2"
  },
  {
    id: 98,
    name: "Exposed",
    type: "head",
    count: 117,
    percentage: "2.93",
    tier: "uncommon",
    rank: 274,
    sourceKey: "HB1"
  },
  {
    id: 279,
    name: "Moth",
    type: "trait",
    count: 117,
    percentage: "2.93",
    tier: "uncommon",
    rank: 275,
    sourceKey: "IL1"
  },
  {
    id: 280,
    name: "Who",
    type: "trait",
    count: 117,
    percentage: "2.93",
    tier: "uncommon",
    rank: 276,
    sourceKey: "EH1"
  },
  {
    id: 281,
    name: "Contractor",
    type: "trait",
    count: 118,
    percentage: "2.95",
    tier: "uncommon",
    rank: 277,
    sourceKey: "LG1"
  },
  {
    id: 212,
    name: "Couch",
    type: "body",
    count: 118,
    percentage: "2.95",
    tier: "uncommon",
    rank: 278,
    sourceKey: "BI1"
  },
  {
    id: 282,
    name: "Stock",
    type: "trait",
    count: 118,
    percentage: "2.95",
    tier: "uncommon",
    rank: 279,
    sourceKey: "DE1"
  },
  {
    id: 99,
    name: "Nuke",
    type: "head",
    count: 119,
    percentage: "2.97",
    tier: "uncommon",
    rank: 280,
    sourceKey: "AA2"
  },
  {
    id: 283,
    name: "101.1 FM",
    type: "trait",
    count: 121,
    percentage: "3.02",
    tier: "uncommon",
    rank: 281,
    sourceKey: "BC1"
  },
  {
    id: 284,
    name: "Technicolor",
    type: "trait",
    count: 121,
    percentage: "3.02",
    tier: "uncommon",
    rank: 282,
    sourceKey: "JI1"
  },
  {
    id: 100,
    name: "Kevlar",
    type: "head",
    count: 125,
    percentage: "3.13",
    tier: "uncommon",
    rank: 283,
    sourceKey: "HB2"
  },
  {
    id: 285,
    name: "Near Space",
    type: "trait",
    count: 125,
    percentage: "3.13",
    tier: "uncommon",
    rank: 284,
    sourceKey: "FB1"
  },
  {
    id: 101,
    name: "Log",
    type: "head",
    count: 126,
    percentage: "3.15",
    tier: "uncommon",
    rank: 285,
    sourceKey: "AA2"
  },
  {
    id: 213,
    name: "Maps",
    type: "body",
    count: 127,
    percentage: "3.17",
    tier: "uncommon",
    rank: 286,
    sourceKey: "BJ1"
  },
  {
    id: 286,
    name: "Vampire",
    type: "trait",
    count: 129,
    percentage: "3.23",
    tier: "uncommon",
    rank: 287,
    sourceKey: "AJ1"
  },
  {
    id: 214,
    name: "Grate",
    type: "body",
    count: 130,
    percentage: "3.25",
    tier: "uncommon",
    rank: 288,
    sourceKey: "BF1"
  },
  {
    id: 102,
    name: "Taser",
    type: "head",
    count: 132,
    percentage: "3.30",
    tier: "uncommon",
    rank: 289,
    sourceKey: "AA1"
  },
  {
    id: 287,
    name: "Pyrex",
    type: "trait",
    count: 138,
    percentage: "3.45",
    tier: "uncommon",
    rank: 290,
    sourceKey: "HN1"
  },
  {
    id: 288,
    name: "Nothing",
    type: "trait",
    count: 501,
    percentage: "12.53",
    tier: "common",
    rank: 291,
    sourceKey: "NM1"
  }
];

// Utility functions for variation lookup
export function getVariationByRank(rank: number): VariationRarity | undefined {
  if (rank < 1 || rank > COMPLETE_VARIATION_RARITY.length) {
    return undefined;
  }
  return COMPLETE_VARIATION_RARITY[rank - 1];
}

export function getVariationsByRankRange(minRank: number, maxRank: number): VariationRarity[] {
  if (minRank < 1 || maxRank > COMPLETE_VARIATION_RARITY.length || minRank > maxRank) {
    return [];
  }
  return COMPLETE_VARIATION_RARITY.slice(minRank - 1, maxRank);
}

// Hierarchical exports for systems that need grouped access
export const VARIATIONS_BY_TYPE = {
  heads: COMPLETE_VARIATION_RARITY.filter(v => v.type === 'head'),
  bodies: COMPLETE_VARIATION_RARITY.filter(v => v.type === 'body'),
  traits: COMPLETE_VARIATION_RARITY.filter(v => v.type === 'trait')
} as const;

// Convenience exports for direct access
export const HEAD_VARIATIONS = VARIATIONS_BY_TYPE.heads;
export const BODY_VARIATIONS = VARIATIONS_BY_TYPE.bodies;
export const TRAIT_VARIATIONS = VARIATIONS_BY_TYPE.traits;

// Summary counts
export const VARIATION_COUNTS = {
  heads: HEAD_VARIATIONS.length,
  bodies: BODY_VARIATIONS.length,
  traits: TRAIT_VARIATIONS.length,
  total: COMPLETE_VARIATION_RARITY.length
};
