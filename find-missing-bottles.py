import os

# All 288 variations
all_variations = [
    # HEADS (1-102)
    "Ace of Spades Ultimate", "Derelict", "Discomania", "Ellie Mesh", "Frost King",
    "Nyan Ultimate", "Obliterator", "Paul Ultimate", "Pie", "Projectionist",
    "Ross", "Acid", "Gold", "Lazer", "Wires",
    "Nightstalker", "Nyan", "Paul", "Pizza", "Terminator",
    "24K", "China", "Stained Glass", "The Lethal Dimension", "Magma",
    "???", "Silicon", "Bone Daddy", "Bowling", "Snow",
    "The Ram", "Whiskey", "Arcade", "Mint", "Bubblegum",
    "Ballerina", "Heatmap", "Acrylic", "Quilt", "Ornament",
    "Sleet", "Hades", "Drill", "Cotton Candy", "Mesh",
    "Tron", "Ace of Spades", "Mars Attacks", "Dualtone", "Flaked",
    "Electrik", "Hal", "Recon", "Sun", "Sterling",
    "Lich", "Plate", "Porcelain", "Cream", "Baby",
    "Disco", "Liquid Lavender", "Dragonfly", "Sahara", "Grass",
    "Ivory", "1960's", "Royal", "Silent Film", "Boss",
    "Butane", "Coin", "Hacker", "Bumblebee", "Camo",
    "Plastik", "Mac & Cheese", "Crimson", "Dazed Piggy", "Mahogany",
    "Big Brother", "Snapshot", "Cadillac", "Corroded", "Rust",
    "Business", "Neon Flamingo", "Aztec", "Milk", "Aqua",
    "desufnoC", "Bark", "Polished", "Lightning", "Ol' Faithful",
    "Classic", "Shamrock", "Exposed", "Nuke", "Kevlar",
    "Log", "Taser",

    # BODIES (103-214)
    "Burnt Ultimate", "Carving Ultimate", "Chrome Ultimate", "Cousin Itt", "Frost Cage",
    "Fury", "Gatsby Ultimate", "Heatwave Ultimate", "Luxury Ultimate", "Plush Ultimate",
    "X Ray Ultimate", "007", "Cartoon", "Heatwave", "Luxury",
    "Majesty", "Oil", "Seabiscuit", "Gatsby", "Pearl",
    "Spaghetti", "Tarpie", "Cartoonichrome", "Granite", "Tie Dye",
    "Burnt", "Damascus", "Giger", "Maze", "Bag",
    "Nuggets", "Radiance", "Jolly Rancher", "Shipped", "Lord",
    "X Ray", "OE Light", "Peppermint", "Blood", "Seafoam",
    "Ocean", "Carving", "Rug", "Trapped", "Frosted",
    "Sticky", "Vapor", "Inner Rainbow", "Frostbit", "Denim",
    "Stars", "White", "Doom", "Journey", "Mercury",
    "Stone", "Tiles", "Soul", "Lizard", "Cheetah",
    "Sunset", "Rose", "Tat", "Tangerine", "Eyes",
    "Happymeal", "Maple", "Ooze", "Obsidian", "Prickles",
    "Prom", "Crystal Camo", "Marble", "Rattler", "Forest",
    "Poker", "Black", "Arctic", "Rust", "Smurf",
    "Dr.", "Aztec", "Meat", "Highlights", "Leeloo",
    "Waves", "Plush", "Tickle", "Mugged", "Victoria",
    "Cubes", "Sand", "Heart", "Carbon", "Crystal Clear",
    "Sir", "Princess", "Chrome", "Steam", "Goblin",
    "OE Dark", "Bone", "Abominable", "Sky", "Blush",
    "Iron", "James", "Noob", "Matte", "Couch",
    "Maps", "Grate",

    # ITEMS (215-288)
    "Golden Guns Ultimate", "Gone", "King Tut", "Linkinator 3000", "Oompah",
    "Peacock Ultimate", "Stolen", "Vanished", "Peacock", "Palace",
    "Drip", "Test Track", "Screamo", "Blasters", "Spectrum",
    "2001", "Crow", "Hydra", "Carbonite", "Iced",
    "Icon", "Splatter", "Holographic", "Ring Red", "Tactical",
    "Nuclear", "Foil", "Golden Guns", "LV-426", "Sap",
    "Bling", "R&B", "Earth", "Jeff", "Purplex",
    "Just Wren", "Angler", "Phoenix", "Firebird", "Heliotropium",
    "Black Parade", "Bonebox", "Hefner", "Hammerheat", "Luna",
    "Pop", "Ring Green", "Fourzin", "Molten Core", "Bumble Bird",
    "Deep Space", "Night Vision", "Albino", "Scissors", "Black & White",
    "Silver", "Whiteout", "Lumberjack", "Chromium", "Rainbow Morpho",
    "Pawn Shop", "Ring Blue", "Concrete", "Paparazzi", "Moth",
    "Who", "Contractor", "Stock", "101.1 FM", "Technicolor",
    "Near Space", "Vampire", "Pyrex", "Nothing"
]

output_folder = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\named-bottles 1k'

# Get list of existing files
existing_files = set(os.listdir(output_folder))

# Check which variations are missing
missing = []
for name in all_variations:
    safe_name = name.replace('/', '-').replace('\\', '-').replace('?', 'Q').replace('&', 'and')
    filename = f'{safe_name}.png'
    if filename not in existing_files:
        missing.append(name)

print(f'Total variations: {len(all_variations)}')
print(f'Existing files: {len(existing_files)}')
print(f'Missing variations: {len(missing)}')
print('\nMissing:')
for m in missing:
    print(f'  - {m}')
