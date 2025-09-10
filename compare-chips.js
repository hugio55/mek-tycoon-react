const fs = require('fs');

// Our current chip names in the code
const chipNamesInCode = [
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

// Read the file list
const fileContent = fs.readFileSync('all-chip-files.txt', 'utf-8');
const filesInDirectory = fileContent.split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log("Chips in code:", chipNamesInCode.length);
console.log("Files in directory:", filesInDirectory.length);

// Convert to sets for comparison
const codeSet = new Set(chipNamesInCode);
const fileSet = new Set(filesInDirectory);

// Find what's in files but not in code
const missingInCode = [];
filesInDirectory.forEach(file => {
  if (!codeSet.has(file)) {
    missingInCode.push(file);
  }
});

// Find what's in code but not in files
const missingFiles = [];
chipNamesInCode.forEach(name => {
  if (!fileSet.has(name)) {
    missingFiles.push(name);
  }
});

console.log("\n=== MISSING FROM OUR CODE (files exist but not in our list) ===");
if (missingInCode.length > 0) {
  missingInCode.forEach(name => console.log(`  "${name}"`));
  console.log(`Total missing from code: ${missingInCode.length}`);
} else {
  console.log("  None - all files are in our code");
}

console.log("\n=== MISSING FILES (in our code but files don't exist) ===");
if (missingFiles.length > 0) {
  missingFiles.forEach(name => console.log(`  "${name}"`));
  console.log(`Total missing files: ${missingFiles.length}`);
} else {
  console.log("  None - all code entries have files");
}

console.log("\n=== SUMMARY ===");
console.log(`Total unique in code: ${chipNamesInCode.length}`);
console.log(`Total files in directory: ${filesInDirectory.length}`);
console.log(`Expected total (102+112+95): 309`);
console.log(`Actual total with all files: ${filesInDirectory.length}`);