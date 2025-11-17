import { query } from "./_generated/server";

// Complete list of all 291 possible variations
const ALL_VARIATIONS = [
  "Derelict", "Gatsby Ultimate", "Stolen", "Obliterator", "Luxury Ultimate",
  "Golden Guns Ultimate", "Ellie Mesh", "Chrome Ultimate", "Vanished", "Projectionist",
  "Cousin Itt", "Gone", "Pie", "Carving Ultimate", "Oompah", "Frost King",
  "Frost Cage", "Nil", "Paul Ultimate", "Burnt Ultimate", "Null", "Discomania",
  "X Ray Ultimate", "None", "Ace of Spades Ultimate", "Plush Ultimate", "Linkinator 3000",
  "Nyan Ultimate", "Heatwave Ultimate", "Peacock Ultimate", "Fury", "King Tut",
  "Ross", "007", "Cartoon", "Heatwave", "Luxury", "Majesty", "Oil", "Peacock",
  "Seabiscuit", "Acid", "Gatsby", "Gold", "Palace", "Pearl", "Spaghetti",
  "Tarpie", "Cartoonichrome", "Drip", "Granite", "Lazer", "Test Track", "Tie Dye",
  "Wires", "Burnt", "Damascus", "Giger", "Maze", "Nightstalker", "Nyan",
  "Paul", "Pizza", "Screamo", "Terminator", "24K", "Bag", "Blasters",
  "China", "Nuggets", "Radiance", "Spectrum", "Stained Glass", "The Lethal Dimension",
  "2001", "Crow", "Jolly Rancher", "Magma", "Shipped", "???",
  "Hydra", "Lord", "Silicon", "X Ray", "Bone Daddy", "Bowling",
  "OE Light", "Peppermint", "Snow", "The Ram", "Whiskey", "Arcade",
  "Blood", "Carbonite", "Mint", "Bubblegum", "Iced", "Seafoam",
  "Ballerina", "Icon", "Ocean", "Splatter", "Heatmap", "Acrylic",
  "Carving", "Holographic", "Rug", "Trapped", "Frosted", "Quilt",
  "Ring Red", "Ornament", "Sleet", "Sticky", "Tactical", "Vapor",
  "Hades", "Inner Rainbow", "Drill", "Frostbit", "Nuclear", "Cotton Candy",
  "Foil", "Mesh", "Tron", "Ace of Spades", "Denim", "Golden Guns",
  "Mars Attacks", "Dualtone", "Flaked", "LV-426", "Sap", "Stars",
  "White", "Bling", "Electrik", "Hal", "R&B", "Earth",
  "Jeff", "Purplex", "Recon", "Doom", "Journey", "Just Wren",
  "Mercury", "Angler", "Stone", "Tiles", "Soul", "Sun",
  "Lizard", "Sterling", "Cheetah", "Lich", "Phoenix", "Sunset",
  "Plate", "Rose", "Tat", "Firebird", "Porcelain", "Cream",
  "Tangerine", "Heliotropium", "Baby", "Disco", "Eyes", "Happymeal",
  "Maple", "Ooze", "Liquid Lavender", "Obsidian", "Prickles", "Prom",
  "Crystal Camo", "Dragonfly", "Sahara", "Grass", "Marble", "Rattler",
  "Black Parade", "Forest", "Poker", "Black", "Ivory", "Arctic",
  "Rust", "Smurf", "Dr.", "Bonebox", "Aztec", "Meat",
  "1960's", "Hefner", "Highlights", "Leeloo", "Royal", "Silent Film",
  "Boss", "Butane", "Coin", "Waves", "Hammerheat", "Luna",
  "Plush", "Tickle", "Mugged", "Victoria", "Cubes", "Pop",
  "Ring Green", "Sand", "Fourzin", "Hacker", "Heart", "Bumblebee",
  "Camo", "Plastik", "Mac & Cheese", "Carbon", "Crimson", "Crystal Clear",
  "Molten Core", "Dazed Piggy", "Sir", "Mahogany", "Princess", "Bumble Bird",
  "Big Brother", "Chrome", "Deep Space", "Night Vision", "Snapshot", "Cadillac",
  "Corroded", "Albino", "Steam", "Business", "Scissors", "Black & White",
  "Goblin", "Neon Flamingo", "Silver", "Milk", "Whiteout", "Aqua",
  "Lumberjack", "OE Dark", "desufnoC", "Bone", "Bark", "Abominable",
  "Chromium", "Rainbow Morpho", "Pawn Shop", "Sky", "Blush", "Polished",
  "Lightning", "Ring Blue", "Ol' Faithful", "Iron", "James", "Classic",
  "Noob", "Matte", "Concrete", "Paparazzi", "Shamrock", "Exposed",
  "Moth", "Who", "Contractor", "Couch", "Stock", "Nuke",
  "101.1 FM", "Technicolor", "Kevlar", "Near Space", "Log", "Maps",
  "Vampire", "Grate", "Taser", "Pyrex", "Nothing"
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
    // Step 1: Get all corporations/players from goldMining table
    const allCorporations = await ctx.db.query("goldMining").collect();

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
        .withIndex("by_owner", (q) => q.eq("owner", corp.walletAddress))
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
        walletAddress: corp.walletAddress,
        displayName: corp.companyName || "Unknown Corporation",
        mekCount: corpMeks.length,
        uniqueVariations: corpVariations.size,
      });
    }

    console.log(`Corporations with meks: ${userBreakdown.length}`);

    // Step 3: Calculate statistics and find missing variations
    const uniqueVariationCount = allVariations.size;
    const coveragePercentage = ((uniqueVariationCount / 291) * 100).toFixed(2);

    // Find missing variations by comparing against complete list
    const missingVariationsList = ALL_VARIATIONS.filter(
      variation => !allVariations.has(variation)
    );

    // Sort user breakdown by mek count (descending)
    userBreakdown.sort((a, b) => b.mekCount - a.mekCount);

    return {
      summary: {
        totalVerifiedPlayers: userBreakdown.length,
        totalMeks,
        uniqueVariationsFound: uniqueVariationCount,
        totalVariationsPossible: 291,
        coveragePercentage: `${coveragePercentage}%`,
        missingVariations: 291 - uniqueVariationCount,
        meksWithMissingVariations,
      },
      userBreakdown,
      variationList: Array.from(allVariations).sort(),
      missingVariationsList: missingVariationsList.sort(),
    };
  },
});
