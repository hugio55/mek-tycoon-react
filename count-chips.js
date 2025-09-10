const chipNames = [
  "007", "101.1 FM", "1960's", "2001", "24K", "Abominable", "Ace of Spades Ultimate", "Ace of Spades",
  "Acid", "Acrylic", "Albino", "Angler", "Aqua", "Arcade", "Arctic", "Aztec",
  "Baby", "Bag", "Ballerina", "Bark", "Big Brother", "Black & White", "Black Parade", "Black",
  "Blasters", "Bling", "Blood", "Blush", "Bone Daddy", "Bone", "Bonebox", "Boombox",
  "Boss", "Bowling", "Broadcast", "Bubblegum", "Bumble Bird", "Bumblebee", "Burnt Ultimate", "Burnt",
  "Business", "Butane", "Butterfly", "Cadillac", "Camo", "Cannon Ultimate", "Cannon", "Carbon",
  "Carbonite", "Cartoon", "Cartoonichrome", "Carving Ultimate", "Carving", "Cheetah", "China", "Chrome Ultimate",
  "Chrome", "Chromium", "Classic", "Coin", "Concrete", "Contractor", "Corroded", "Cotton Candy",
  "Couch", "Cousin Itt", "Cream", "Crimson", "Crow", "Crystal Camo", "Crystal Clear", "Cubes",
  "Damascus", "Dazed Piggy", "Deep Space", "Denim", "Derelict", "desufnoC", "Disco", "Discomania",
  "Doom", "Dr.", "Dragonfly", "Drill", "Drip", "Dualtone", "Earth", "Electrik",
  "Ellie Mesh", "Exposed", "Eyes", "Film", "Firebird", "Flaked", "Foil", "Forest",
  "Fourzin", "Frost Cage", "Frost King", "Frostbit", "Frosted", "Fury", "Gatsby Ultimate", "Gatsby",
  "Giger", "Goblin", "Gold", "Golden Guns Ultimate", "Golden Guns", "Gone", "Granite", "Grass",
  "Grate", "Hacker", "Hades", "Hal", "Hammerheat", "Happymeal", "Hawk", "Heart",
  "Heatmap", "Heatwave Ultimate", "Heatwave", "Hefner", "Heliotropium", "Highlights", "Holographic", "Hydra",
  "Iced", "Icon", "Inner Rainbow", "Iron", "Ivory", "James", "Jeff", "Jolly Rancher",
  "Journey", "Just Wren", "Kevlar", "King Tut", "Lazer", "Leeloo", "Lich", "Light",
  "Lightning", "Linkinator 3000", "Liquid Lavender", "Lizard", "Log", "Lord", "Lumberjack", "Luna",
  "Luxury Ultimate", "Luxury", "LV-426", "Mac & Cheese", "Magma", "Mahogany", "Majesty", "Maple",
  "Maps", "Marble", "Mars Attacks", "Matte", "Maze", "Meat", "Mercury", "Mesh",
  "Microphone", "Milk", "Mini Me", "Mint", "Molten Core", "Moth", "Mugged", "Near Space",
  "Neon Flamingo", "Night Vision", "Nightstalker", "Nil", "None", "Noob", "Nothing", "Nuclear",
  "Nuggets", "Nuke", "Null", "Nyan Ultimate", "Nyan", "Obliterator", "Obsidian", "Ocean",
  "OE Dark", "OE Light", "Oil", "Ol' Faithful", "Oompah", "Ooze", "Ornament", "Palace",
  "Paparazzi", "Paul Ultimate", "Paul", "Pawn Shop", "Peacock Ultimate", "Peacock", "Pearl", "Peppermint",
  "Phoenix", "Pie", "Pizza", "Plastik", "Plate", "Plush Ultimate", "Plush", "Poker",
  "Polished", "Pop", "Porcelain", "Prickles", "Princess", "Projectionist", "Prom", "Purplex",
  "Pylons", "Pyrex", "QQQ", "Quilt", "R&B", "Radiance", "Rainbow Morpho", "Rattler",
  "Recon", "Ring Blue", "Ring Green", "Ring Red", "Rose", "Ross", "Royal", "Rug",
  "Rust", "Sahara", "Sand", "Sap", "Satellite", "Saw", "Scissors", "Screamo",
  "Seabiscuit", "Seafoam", "Shamrock", "Shark", "Shipped", "Silent Film", "Silicon", "Silver",
  "Sir", "Sky", "Sleet", "Smurf", "Snapshot", "Snow", "Soul", "Spaghetti",
  "Spectrum", "Splatter", "Stained Glass", "Stars", "Steam", "Sterling", "Sticky", "Stock",
  "Stolen", "Stone", "Sun", "Sunset", "Tactical", "Tangerine", "Tarpie", "Taser",
  "Tat", "Technicolor", "Terminator", "Test Track", "The Lethal Dimension", "The Ram", "Tickle", "Tie Dye",
  "Tiles", "Trapped", "Tron", "Ultimate Instruments", "Ultimate Weaponry", "Vampire", "Vanished", "Vapor",
  "Victoria", "Waves", "Whiskey", "White", "Whiteout", "Who", "Wings Ultimate", "Wings",
  "Wires", "X Ray Ultimate", "X Ray"
];

console.log("Total chip names:", chipNames.length);
const unique = [...new Set(chipNames)];
console.log("Unique chip names:", unique.length);

// Check for duplicates
const counts = {};
chipNames.forEach(name => {
  counts[name] = (counts[name] || 0) + 1;
});

const duplicates = Object.entries(counts).filter(([name, count]) => count > 1);
if (duplicates.length > 0) {
  console.log("\nDuplicate names found:");
  duplicates.forEach(([name, count]) => {
    console.log(`  "${name}" appears ${count} times`);
  });
} else {
  console.log("\nNo duplicates found");
}

// The official totals should be:
// 102 Head Variations + 112 Body Variations + 95 Trait Variations = 309
console.log("\nExpected total: 309 (102 heads + 112 bodies + 95 traits)");
console.log("Actual total: " + unique.length);
console.log("Difference: " + (unique.length - 309));