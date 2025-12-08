import { query } from "./_generated/server";

// Complete list of all 289 unique variation names
// Note: "Aztec" and "Rust" each appear as both head and body variations in the full 291 list,
// but since the database stores only names (not types), we use unique names only
const ALL_VARIATIONS = [
  "???", "007", "101.1 FM", "1960's", "2001", "24K", "Abominable", "Ace of Spades",
  "Ace of Spades Ultimate", "Acid", "Acrylic", "Albino", "Angler", "Aqua", "Arcade",
  "Arctic", "Aztec", "Baby", "Bag", "Ballerina", "Bark", "Big Brother", "Black",
  "Black & White", "Black Parade", "Blasters", "Bling", "Blood", "Blush", "Bone",
  "Bone Daddy", "Bonebox", "Boss", "Bowling", "Bubblegum", "Bumble Bird", "Bumblebee",
  "Burnt", "Burnt Ultimate", "Business", "Butane", "Cadillac", "Camo", "Carbon",
  "Carbonite", "Cartoon", "Cartoonichrome", "Carving", "Carving Ultimate", "Cheetah",
  "China", "Chrome", "Chrome Ultimate", "Chromium", "Classic", "Coin", "Concrete",
  "Contractor", "Corroded", "Cotton Candy", "Couch", "Cousin Itt", "Cream", "Crimson",
  "Crow", "Crystal Camo", "Crystal Clear", "Cubes", "Damascus", "Dazed Piggy",
  "Deep Space", "Denim", "Derelict", "desufnoC", "Disco", "Discomania", "Doom", "Dr.",
  "Dragonfly", "Drill", "Drip", "Dualtone", "Earth", "Electrik", "Ellie Mesh", "Exposed",
  "Eyes", "Firebird", "Flaked", "Foil", "Forest", "Fourzin", "Frost Cage", "Frost King",
  "Frostbit", "Frosted", "Fury", "Gatsby", "Gatsby Ultimate", "Giger", "Goblin", "Gold",
  "Golden Guns", "Golden Guns Ultimate", "Gone", "Granite", "Grass", "Grate", "Hacker",
  "Hades", "Hal", "Hammerheat", "Happymeal", "Heart", "Heatmap", "Heatwave",
  "Heatwave Ultimate", "Hefner", "Heliotropium", "Highlights", "Holographic", "Hydra",
  "Iced", "Icon", "Inner Rainbow", "Iron", "Ivory", "James", "Jeff", "Jolly Rancher",
  "Journey", "Just Wren", "Kevlar", "King Tut", "Lazer", "Leeloo", "Lich", "Lightning",
  "Linkinator 3000", "Liquid Lavender", "Lizard", "Log", "Lord", "Lumberjack", "Luna",
  "Luxury", "Luxury Ultimate", "LV-426", "Mac & Cheese", "Magma", "Mahogany", "Majesty",
  "Maple", "Maps", "Marble", "Mars Attacks", "Matte", "Maze", "Meat", "Mercury", "Mesh",
  "Milk", "Mint", "Molten Core", "Moth", "Mugged", "Near Space", "Neon Flamingo",
  "Night Vision", "Nightstalker", "Nil", "None", "Noob", "Nothing", "Nuclear", "Nuggets",
  "Nuke", "Null", "Nyan", "Nyan Ultimate", "Obliterator", "Obsidian", "Ocean", "OE Dark",
  "OE Light", "Oil", "Ol' Faithful", "Oompah", "Ooze", "Ornament", "Palace", "Paparazzi",
  "Paul", "Paul Ultimate", "Pawn Shop", "Peacock", "Peacock Ultimate", "Pearl", "Peppermint",
  "Phoenix", "Pie", "Pizza", "Plastik", "Plate", "Plush", "Plush Ultimate", "Poker",
  "Polished", "Pop", "Porcelain", "Prickles", "Princess", "Projectionist", "Prom", "Purplex",
  "Pyrex", "Quilt", "R&B", "Radiance", "Rainbow Morpho", "Rattler", "Recon", "Ring Blue",
  "Ring Green", "Ring Red", "Rose", "Ross", "Royal", "Rug", "Rust", "Sahara", "Sand", "Sap",
  "Scissors", "Screamo", "Seabiscuit", "Seafoam", "Shamrock", "Shipped", "Silent Film",
  "Silicon", "Silver", "Sir", "Sky", "Sleet", "Smurf", "Snapshot", "Snow", "Soul", "Spaghetti",
  "Spectrum", "Splatter", "Stained Glass", "Stars", "Steam", "Sterling", "Sticky", "Stock",
  "Stolen", "Stone", "Sun", "Sunset", "Tactical", "Tangerine", "Tarpie", "Taser", "Tat",
  "Technicolor", "Terminator", "Test Track", "The Lethal Dimension", "The Ram", "Tickle",
  "Tie Dye", "Tiles", "Trapped", "Tron", "Vampire", "Vanished", "Vapor", "Victoria", "Waves",
  "Whiskey", "White", "Whiteout", "Who", "Wires", "X Ray", "X Ray Ultimate"
];

/**
 * Analyze variation coverage across all players with meks
 *
 * This query:
 * 1. Gets all users
 * 2. For each user with meks, retrieves all their meks
 * 3. Extracts headVariation, bodyVariation, and itemVariation from each mek
 * 4. Tallies unique variations (out of 291 total)
 * 5. Returns coverage statistics including which variations are missing
 */
export const analyzeVariationCoverage = query({
  args: {},
  handler: async (ctx) => {
    // Phase II: Get all corporations/players from users table
    const allCorporations = await ctx.db.query("users").collect();

    console.log(`Total corporations: ${allCorporations.length}`);

    // Step 2: Collect all variations across all corporations' meks
    const allVariations = new Set<string>();
    let totalMeks = 0;
    let meksWithMissingVariations = 0;

    const userBreakdown = [];

    for (const corp of allCorporations) {
      // Get all meks for this corporation
      const corpMeks = await ctx.db
        .query("meks")
        .withIndex("by_owner", (q: any) => q.eq("owner", corp.stakeAddress))
        .collect();

      // Skip corporations with no meks
      if (corpMeks.length === 0) {
        continue;
      }

      totalMeks += corpMeks.length;

      // Extract variations from each mek
      const corpVariations = new Set<string>();
      for (const mek of corpMeks) {
        // Track head variation
        if (mek.headVariation) {
          allVariations.add(mek.headVariation);
          corpVariations.add(mek.headVariation);
        } else {
          meksWithMissingVariations++;
        }

        // Track body variation
        if (mek.bodyVariation) {
          allVariations.add(mek.bodyVariation);
          corpVariations.add(mek.bodyVariation);
        } else {
          meksWithMissingVariations++;
        }

        // Track item/trait variation
        if (mek.itemVariation) {
          allVariations.add(mek.itemVariation);
          corpVariations.add(mek.itemVariation);
        }
        // Note: itemVariation is optional, so we don't count it as "missing"
      }

      userBreakdown.push({
        walletAddress: corp.stakeAddress,
        displayName: corp.corporationName || "Unknown Corporation",
        mekCount: corpMeks.length,
        uniqueVariations: corpVariations.size,
      });
    }

    console.log(`Corporations with meks: ${userBreakdown.length}`);

    // Step 3: Calculate statistics and find missing variations
    const uniqueVariationCount = allVariations.size;
    const coveragePercentage = ((uniqueVariationCount / 289) * 100).toFixed(2);

    // Find missing variations by comparing against complete list
    const missingVariationsList = ALL_VARIATIONS.filter(
      variation => !allVariations.has(variation)
    );

    console.log(`[DEBUG] ALL_VARIATIONS count: ${ALL_VARIATIONS.length}`);
    console.log(`[DEBUG] Found variations count: ${allVariations.size}`);
    console.log(`[DEBUG] Missing variations count: ${missingVariationsList.length}`);
    console.log(`[DEBUG] Math check: ${ALL_VARIATIONS.length} - ${allVariations.size} = ${ALL_VARIATIONS.length - allVariations.size}`);
    console.log(`[DEBUG] First 10 missing:`, missingVariationsList.slice(0, 10));
    console.log(`[DEBUG] First 10 found:`, Array.from(allVariations).slice(0, 10));

    // Sort user breakdown by mek count (descending)
    userBreakdown.sort((a, b) => b.mekCount - a.mekCount);

    return {
      summary: {
        totalVerifiedPlayers: userBreakdown.length,
        totalMeks,
        uniqueVariationsFound: uniqueVariationCount,
        totalVariationsPossible: 289,
        coveragePercentage: `${coveragePercentage}%`,
        missingVariations: 289 - uniqueVariationCount,
        meksWithMissingVariations,
      },
      userBreakdown,
      variationList: Array.from(allVariations).sort(),
      missingVariationsList: missingVariationsList.sort(),
    };
  },
});
