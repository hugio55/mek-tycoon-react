// Proper mapping of mek groups to variations based on actual rarity data

import { VARIATION_TREES } from '@/app/crafting/constants/variationTrees';

// Map group names from mekGoldRates.json to variation arrays
export const GROUP_TO_VARIATIONS: Record<string, string[]> = {
  // HEAD GROUPS - Camera & Film
  'Rolleiflex': ['Hacker', 'Boss', 'Business', 'Classic', 'Bubblegum', 'Cotton Candy', 'Cream', 'Milk', 'Projectionist', 'Snapshot', 'Silent Film', 'Royal', 'Sterling', 'Gold', '24K', '???', 'desufnoC', 'Dazed Piggy', 'Kevlar', 'Mesh', 'Wires', 'Exposed'],
  'Polaroid': ['Snapshot', 'Cream', 'Milk', '1960\'s', 'Classic', 'Ornament', 'Neon Flamingo', 'Acrylic', 'Plastik'],
  '35mm': ['Business', 'Boss', 'Sterling', 'Stained Glass', 'Quilt', 'Dualtone', 'Projectionist', 'Silent Film', 'Classic'],
  '8mm': ['Silent Film', 'Projectionist', '1960\'s', 'Classic', 'Ornament', 'Ross', 'Disco', 'Discomania', 'Arcade', 'Tron', 'Lightning', 'Electrik', 'Mahogany', 'Ivory', 'Porcelain', 'Mars Attacks', 'The Lethal Dimension', 'Obliterator'],
  'Flashbulb': ['Sun', 'Lightning', 'Neon Flamingo', 'Nuke', 'Magma', 'Crimson', 'Snapshot', 'Electrik', 'Lazer', 'Gold', 'Cream', 'Milk', 'Taser', 'Wires', 'Silicon', 'Heatmap', 'Exposed', 'Sterling'],
  'Projector': ['Projectionist', 'Silent Film', 'Classic', 'Disco', 'Discomania', 'Arcade', 'Heatmap', 'Exposed', 'Lightning', 'Snapshot', 'Mint', 'Lazer', 'Taser', 'Nuke', 'Magma', 'Crimson', 'Sun'],
  'Reels': ['Silent Film', 'Projectionist', 'Classic', 'Tron', 'Electrik', 'Lightning', '1960\'s', 'Disco', 'Ross', 'Arcade', 'Nyan', 'Nyan Ultimate', 'Royal', 'Ornament', 'Sterling', 'Business', 'Boss'],

  // HEAD GROUPS - Musical
  'Accordion': ['Recon', 'Mesh', 'Mint', 'Wires', 'Hacker', 'Terminator', 'Taser', 'Nuke', 'Drill', 'Lazer', 'Silicon', 'Electrik'],

  // HEAD GROUPS - Security/Defense
  'Security': ['Big Brother', 'Nightstalker', 'Exposed', 'Kevlar', 'Plate', 'Sterling', 'Crimson', 'Nuke', 'Taser'],
  'Turret': ['Boss', 'Big Brother', 'Recon', 'Obliterator', 'The Ram', 'Nuke', 'Hacker', 'Nightstalker', 'Tron'],

  // HEAD GROUPS - Special/Ultimate (These are rare, single variations)
  'Wren': ['Ace of Spades Ultimate'], // The rarest head!
  'Steam Turret Ultimate': ['Paul Ultimate'],
  'Polaroid Ultimate': ['Nyan Ultimate'],
  'Rolliflex Ultimate': ['Paul Ultimate'],
  'Accordion Ultimate': ['Nyan Ultimate'],
  'Turret Ultimate': ['Paul Ultimate'],
  'Security Ultimate': ['Ace of Spades Ultimate'],
  'Reels Ultimate': ['Paul Ultimate'],
  'Hollow Accordion': ['Ace of Spades'],
  'Skull': ['Bone Daddy', 'Lich', 'Hades'],
  'Skull  Ultimate': ['Ace of Spades Ultimate'],
  'Laser': ['Lazer', 'Taser', 'Electrik', 'Nuke'],

  // BODY GROUPS - Character Types
  'Droid': ['Chrome', 'Chrome Ultimate', 'Carbon', 'Damascus', 'Mercury', 'Iron', 'Matte', 'Black', 'White'],
  'Robot': ['Chrome', 'Carbon', 'Iron', 'Granite', 'Stone', 'Marble', 'Grate', 'Tiles', 'Cubes'],
  'Knight': ['Damascus', 'Carbon', 'Iron', 'Chrome', 'Granite', 'Stone', 'Marble', 'Mercury'],
  'Beast': ['Fury', 'Goblin', 'Giger', 'Abominable', 'Lizard', 'Cheetah', 'Rattler'],
  'She': ['Princess', 'Victoria', 'Rose', 'Heart', 'Soul', 'Leeloo', 'Prom'],
  'Skeleton': ['Bone', 'Burnt', 'Burnt Ultimate', 'X Ray', 'X Ray Ultimate', 'Rust', 'Doom'],
  'Statue': ['Stone', 'Granite', 'Marble', 'Obsidian', 'Crystal Clear', 'Crystal Camo', 'Carving', 'Carving Ultimate'],
  'Tux': ['007', 'Gatsby', 'Gatsby Ultimate', 'Luxury', 'Luxury Ultimate', 'Lord', 'Sir', 'James'],
  'Master Hand': ['Majesty', 'Lord', 'Sir', 'Luxury', 'Luxury Ultimate', 'Gatsby', 'Gatsby Ultimate'],
  'Head': ['Eyes', 'Dr.', 'Cousin Itt', 'Mugged', 'Noob'],
  'Hoodie': ['Denim', 'Black', 'Shipped', 'Bag', 'Couch', 'Tarpie'],
  'Whorse': ['Seabiscuit', 'Maple', 'Forest', 'Waves', 'Journey'],

  // BODY GROUPS - Ultimate versions (rare)
  'Droid Ultimate': ['Chrome Ultimate'],
  'Robot Ultimate': ['Chrome Ultimate'],
  'Knight Ultimate': ['Luxury Ultimate'],
  'Beast Ultimate': ['Burnt Ultimate'],
  'She Ultimate': ['Gatsby Ultimate'],
  'Skeleton Ultimate': ['X Ray Ultimate'],
  'Statue Ultimate': ['Carving Ultimate'],
  'Tux Ultimate': ['Luxury Ultimate'],
  'Master Hand Ultimate': ['Gatsby Ultimate'],
  'Head Ultimate': ['Plush Ultimate'],

  // ITEM/TRAIT GROUPS
  'Wings': ['Wings', 'Firebird', 'Phoenix', 'Peacock', 'Hawk', 'Crow', 'Vampire', 'Butterfly', 'Moth', 'Bumble Bird', 'Rainbow Morpho', 'Angler', 'Albino'],
  'Wings Ultimate': ['Wings Ultimate', 'Peacock Ultimate'],
  'Cannon': ['Cannon', 'Blasters', 'Golden Guns', 'Tactical', 'Saw', 'Scissors'],
  'Cannon Ultimate': ['Cannon Ultimate', 'Golden Guns Ultimate'],
  'Ultimate Weaponry': ['Ultimate Weaponry'],
  'Ultimate Instruments': ['Ultimate Instruments'],
  'Stolen': ['Stolen'],
  'None': ['None'],
  'Nothing': ['Nothing'],
  'Nil': ['Nil'],
  'Null': ['Null'],
  'Gone': ['Gone'],
  'Vanished': ['Vanished'],
  'Mini Me': ['Mini Me'],
  'Hawk': ['Hawk'],
  'Butterfly': ['Butterfly'],
  'Film': ['Film'],
  'Light': ['Light'],
  'Microphone': ['Microphone'],
  'Boombox': ['Boombox', 'Bonebox'],
  'Broadcast': ['Broadcast', '101.1 FM'],
  'Pylons': ['Pylons'],
  'Satellite': ['Satellite'],
  'Saw': ['Saw'],
  'Shark': ['Shark'],
};

// Get variations for a specific group
export function getVariationsForGroup(groupName: string): string[] {
  return GROUP_TO_VARIATIONS[groupName] || [groupName]; // Fallback to group name if no mapping
}

// Get a random variation from a group
export function getRandomVariationFromGroup(groupName: string): string {
  const variations = getVariationsForGroup(groupName);
  return variations[Math.floor(Math.random() * variations.length)];
}

// Distribution weights for each chapter (based on actual data analysis)
export const CHAPTER_GROUP_WEIGHTS: Record<number, {
  heads: Record<string, number>,
  bodies: Record<string, number>,
  items: Record<string, number>
}> = {
  1: { // Chapter 1: Ranks 3651-4000 (least rare)
    heads: {
      'Rolleiflex': 174,
      'Polaroid': 64,
      'Accordion': 61,
      'Security': 19,
      '35mm': 13,
      'Flashbulb': 9,
      'Reels': 5,
      'Turret': 5
    },
    bodies: {
      'Droid': 131,
      'Knight': 93,
      'Robot': 50,
      'Beast': 23,
      'Skeleton': 17,
      'Hoodie': 15,
      'She': 7,
      'Statue': 7,
      'Tux': 7
    },
    items: {
      'None': 150,
      'Nil': 50,
      'Nothing': 50,
      'Null': 50,
      'Mini Me': 30,
      'Film': 10,
      'Light': 10
    }
  },
  10: { // Chapter 10: Ranks 1-100 (most rare)
    heads: {
      'Skull': 22,
      'Rolleiflex': 15,
      'Turret': 13,
      'Wren': 1,
      'Steam Turret Ultimate': 1,
      'Polaroid Ultimate': 1,
      'Rolliflex Ultimate': 1,
      'Skull  Ultimate': 1,
      'Turret Ultimate': 1,
      'Security Ultimate': 1,
      'Reels Ultimate': 1,
      'Hollow Accordion': 1,
      'Accordion Ultimate': 1
    },
    bodies: {
      'Knight': 14,
      'Droid': 13,
      'Beast': 13,
      'Tux Ultimate': 1,
      'Master Hand Ultimate': 1,
      'Beast Ultimate': 1,
      'She Ultimate': 1,
      'Skeleton Ultimate': 1,
      'Knight Ultimate': 1,
      'Statue Ultimate': 1,
      'Head Ultimate': 1,
      'Robot Ultimate': 1,
      'Droid Ultimate': 1
    },
    items: {
      'Stolen': 1,
      'Cannon Ultimate': 1,
      'Ultimate Weaponry': 1,
      'Ultimate Instruments': 1,
      'Wings Ultimate': 1,
      'Gone': 1,
      'Vanished': 1,
      'Wings': 10,
      'Cannon': 10,
      'None': 20,
      'Nil': 20,
      'Null': 20
    }
  }
};

// Get weighted random group for a chapter
export function getWeightedRandomGroup(
  chapter: number,
  type: 'heads' | 'bodies' | 'items'
): string {
  const weights = CHAPTER_GROUP_WEIGHTS[chapter] || CHAPTER_GROUP_WEIGHTS[1];
  const groupWeights = weights[type];

  const totalWeight = Object.values(groupWeights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [group, weight] of Object.entries(groupWeights)) {
    random -= weight;
    if (random <= 0) {
      return group;
    }
  }

  // Fallback to first group
  return Object.keys(groupWeights)[0];
}

// Generate a properly distributed mek for a specific rank
export function generateMekForRank(rank: number): {
  head: string,
  body: string,
  trait: string
} {
  // Determine chapter (1-10)
  let chapter = 1;
  if (rank <= 100) chapter = 10;
  else if (rank <= 500) chapter = 9;
  else if (rank <= 950) chapter = 8;
  else if (rank <= 1400) chapter = 7;
  else if (rank <= 1850) chapter = 6;
  else if (rank <= 2300) chapter = 5;
  else if (rank <= 2750) chapter = 4;
  else if (rank <= 3200) chapter = 3;
  else if (rank <= 3650) chapter = 2;

  // Get weighted random groups
  const headGroup = getWeightedRandomGroup(chapter, 'heads');
  const bodyGroup = getWeightedRandomGroup(chapter, 'bodies');
  const itemGroup = getWeightedRandomGroup(chapter, 'items');

  // Get random variations from those groups
  return {
    head: getRandomVariationFromGroup(headGroup),
    body: getRandomVariationFromGroup(bodyGroup),
    trait: getRandomVariationFromGroup(itemGroup)
  };
}