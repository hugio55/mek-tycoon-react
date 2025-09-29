from PIL import Image, ImageDraw, ImageFont
import os
import json

# Variation data extracted from the TypeScript file
variations = [
    {"name": "Ace of Spades Ultimate", "type": "head", "rank": 1},
    {"name": "Burnt Ultimate", "type": "body", "rank": 2},
    {"name": "Carving Ultimate", "type": "body", "rank": 3},
    {"name": "Chrome Ultimate", "type": "body", "rank": 4},
    {"name": "Cousin Itt", "type": "body", "rank": 5},
    {"name": "Derelict", "type": "head", "rank": 6},
    {"name": "Discomania", "type": "head", "rank": 7},
    {"name": "Ellie Mesh", "type": "head", "rank": 8},
    {"name": "Frost Cage", "type": "body", "rank": 9},
    {"name": "Frost King", "type": "head", "rank": 10},
    {"name": "Fury", "type": "body", "rank": 11},
    {"name": "Gatsby Ultimate", "type": "body", "rank": 12},
    {"name": "Golden Guns Ultimate", "type": "trait", "rank": 13},
    {"name": "Gone", "type": "trait", "rank": 14},
    {"name": "Heatwave Ultimate", "type": "body", "rank": 15},
    {"name": "King Tut", "type": "trait", "rank": 16},
    {"name": "Linkinator 3000", "type": "trait", "rank": 17},
    {"name": "Luxury Ultimate", "type": "body", "rank": 18},
    {"name": "Nyan Ultimate", "type": "head", "rank": 19},
    {"name": "Obliterator", "type": "head", "rank": 20},
    {"name": "Oompah", "type": "trait", "rank": 21},
    {"name": "Paul Ultimate", "type": "head", "rank": 22},
    {"name": "Peacock Ultimate", "type": "trait", "rank": 23},
    {"name": "Pie", "type": "head", "rank": 24},
    {"name": "Plush Ultimate", "type": "body", "rank": 25},
    {"name": "Projectionist", "type": "head", "rank": 26},
    {"name": "Ross", "type": "head", "rank": 27},
    {"name": "Stolen", "type": "trait", "rank": 28},
    {"name": "Vanished", "type": "trait", "rank": 29},
    {"name": "X Ray Ultimate", "type": "body", "rank": 30},
    {"name": "007", "type": "body", "rank": 31},
    {"name": "Cartoon", "type": "body", "rank": 32},
    {"name": "Heatwave", "type": "body", "rank": 33},
    {"name": "Luxury", "type": "body", "rank": 34},
    {"name": "Majesty", "type": "body", "rank": 35},
    {"name": "Oil", "type": "body", "rank": 36},
    {"name": "Peacock", "type": "trait", "rank": 37},
    {"name": "Seabiscuit", "type": "body", "rank": 38},
    {"name": "Acid", "type": "head", "rank": 39},
    {"name": "Gatsby", "type": "body", "rank": 40},
    {"name": "Gold", "type": "head", "rank": 41},
    {"name": "Palace", "type": "trait", "rank": 42},
    {"name": "Pearl", "type": "body", "rank": 43},
    {"name": "Spaghetti", "type": "body", "rank": 44},
    {"name": "Tarpie", "type": "body", "rank": 45},
    {"name": "Cartoonichrome", "type": "body", "rank": 46},
    {"name": "Drip", "type": "trait", "rank": 47},
    {"name": "Granite", "type": "body", "rank": 48},
    {"name": "Lazer", "type": "head", "rank": 49},
    {"name": "Test Track", "type": "trait", "rank": 50},
    {"name": "Tie Dye", "type": "body", "rank": 51},
    {"name": "Wires", "type": "head", "rank": 52},
    {"name": "Burnt", "type": "body", "rank": 53},
    {"name": "Damascus", "type": "body", "rank": 54},
    {"name": "Giger", "type": "body", "rank": 55},
    {"name": "Maze", "type": "body", "rank": 56},
    {"name": "Nightstalker", "type": "head", "rank": 57},
    {"name": "Nyan", "type": "head", "rank": 58},
    {"name": "Paul", "type": "head", "rank": 59},
    {"name": "Pizza", "type": "head", "rank": 60},
    {"name": "Screamo", "type": "trait", "rank": 61},
    {"name": "Terminator", "type": "head", "rank": 62},
    {"name": "24K", "type": "head", "rank": 63},
    {"name": "Bag", "type": "body", "rank": 64},
    {"name": "Blasters", "type": "trait", "rank": 65},
    {"name": "China", "type": "head", "rank": 66},
    {"name": "Nuggets", "type": "body", "rank": 67},
    {"name": "Radiance", "type": "body", "rank": 68},
    {"name": "Spectrum", "type": "trait", "rank": 69},
    {"name": "Stained Glass", "type": "head", "rank": 70},
    {"name": "The Lethal Dimension", "type": "head", "rank": 71},
    {"name": "2001", "type": "trait", "rank": 72},
    {"name": "Crow", "type": "trait", "rank": 73},
    {"name": "Jolly Rancher", "type": "body", "rank": 74},
    {"name": "Magma", "type": "head", "rank": 75},
    {"name": "Shipped", "type": "body", "rank": 76},
    {"name": "???", "type": "head", "rank": 77},
    {"name": "Hydra", "type": "trait", "rank": 78},
    {"name": "Lord", "type": "body", "rank": 79},
    {"name": "Silicon", "type": "head", "rank": 80},
    {"name": "X Ray", "type": "body", "rank": 81},
    {"name": "Bone Daddy", "type": "head", "rank": 82},
    {"name": "Bowling", "type": "head", "rank": 83},
    {"name": "OE Light", "type": "body", "rank": 84},
    {"name": "Peppermint", "type": "body", "rank": 85},
    {"name": "Snow", "type": "head", "rank": 86},
    {"name": "The Ram", "type": "head", "rank": 87},
    {"name": "Whiskey", "type": "head", "rank": 88},
    {"name": "Arcade", "type": "head", "rank": 89},
    {"name": "Blood", "type": "body", "rank": 90},
    {"name": "Carbonite", "type": "trait", "rank": 91},
    {"name": "Mint", "type": "head", "rank": 92},
    {"name": "Bubblegum", "type": "head", "rank": 93},
    {"name": "Iced", "type": "trait", "rank": 94},
    {"name": "Seafoam", "type": "body", "rank": 95},
    {"name": "Ballerina", "type": "head", "rank": 96},
    {"name": "Icon", "type": "trait", "rank": 97},
    {"name": "Ocean", "type": "body", "rank": 98},
    {"name": "Splatter", "type": "trait", "rank": 99},
    {"name": "Heatmap", "type": "head", "rank": 100},
    {"name": "Acrylic", "type": "head", "rank": 101},
    {"name": "Carving", "type": "body", "rank": 102},
    {"name": "Holographic", "type": "trait", "rank": 103},
    {"name": "Rug", "type": "body", "rank": 104},
    {"name": "Trapped", "type": "body", "rank": 105},
    {"name": "Frosted", "type": "body", "rank": 106},
    {"name": "Quilt", "type": "head", "rank": 107},
    {"name": "Ring Red", "type": "trait", "rank": 108},
    {"name": "Ornament", "type": "head", "rank": 109},
    {"name": "Sleet", "type": "head", "rank": 110},
    {"name": "Sticky", "type": "body", "rank": 111},
    {"name": "Tactical", "type": "trait", "rank": 112},
    {"name": "Vapor", "type": "body", "rank": 113},
    {"name": "Hades", "type": "head", "rank": 114},
    {"name": "Inner Rainbow", "type": "body", "rank": 115},
    {"name": "Drill", "type": "head", "rank": 116},
    {"name": "Frostbit", "type": "body", "rank": 117},
    {"name": "Nuclear", "type": "trait", "rank": 118},
    {"name": "Cotton Candy", "type": "head", "rank": 119},
    {"name": "Foil", "type": "trait", "rank": 120},
    {"name": "Mesh", "type": "head", "rank": 121},
    {"name": "Tron", "type": "head", "rank": 122},
    {"name": "Ace of Spades", "type": "head", "rank": 123},
    {"name": "Denim", "type": "body", "rank": 124},
    {"name": "Golden Guns", "type": "trait", "rank": 125},
    {"name": "Mars Attacks", "type": "head", "rank": 126},
    {"name": "Dualtone", "type": "head", "rank": 127},
    {"name": "Flaked", "type": "head", "rank": 128},
    {"name": "LV-426", "type": "trait", "rank": 129},
    {"name": "Sap", "type": "trait", "rank": 130},
    {"name": "Stars", "type": "body", "rank": 131},
    {"name": "White", "type": "body", "rank": 132},
    {"name": "Bling", "type": "trait", "rank": 133},
    {"name": "Electrik", "type": "head", "rank": 134},
    {"name": "Hal", "type": "head", "rank": 135},
    {"name": "R&B", "type": "trait", "rank": 136},
    {"name": "Earth", "type": "trait", "rank": 137},
    {"name": "Jeff", "type": "trait", "rank": 138},
    {"name": "Purplex", "type": "trait", "rank": 139},
    {"name": "Recon", "type": "head", "rank": 140},
    {"name": "Doom", "type": "body", "rank": 141},
    {"name": "Journey", "type": "body", "rank": 142},
    {"name": "Just Wren", "type": "trait", "rank": 143},
    {"name": "Mercury", "type": "body", "rank": 144},
    {"name": "Angler", "type": "trait", "rank": 145},
    {"name": "Stone", "type": "body", "rank": 146},
    {"name": "Tiles", "type": "body", "rank": 147},
    {"name": "Soul", "type": "body", "rank": 148},
    {"name": "Sun", "type": "head", "rank": 149},
    {"name": "Lizard", "type": "body", "rank": 150},
    {"name": "Sterling", "type": "head", "rank": 151},
    {"name": "Cheetah", "type": "body", "rank": 152},
    {"name": "Lich", "type": "head", "rank": 153},
    {"name": "Phoenix", "type": "trait", "rank": 154},
    {"name": "Sunset", "type": "body", "rank": 155},
    {"name": "Plate", "type": "head", "rank": 156},
    {"name": "Rose", "type": "body", "rank": 157},
    {"name": "Tat", "type": "body", "rank": 158},
    {"name": "Firebird", "type": "trait", "rank": 159},
    {"name": "Porcelain", "type": "head", "rank": 160},
    {"name": "Cream", "type": "head", "rank": 161},
    {"name": "Tangerine", "type": "body", "rank": 162},
    {"name": "Heliotropium", "type": "trait", "rank": 163},
    {"name": "Baby", "type": "head", "rank": 164},
    {"name": "Disco", "type": "head", "rank": 165},
    {"name": "Eyes", "type": "body", "rank": 166},
    {"name": "Happymeal", "type": "body", "rank": 167},
    {"name": "Maple", "type": "body", "rank": 168},
    {"name": "Ooze", "type": "body", "rank": 169},
    {"name": "Liquid Lavender", "type": "head", "rank": 170},
    {"name": "Obsidian", "type": "body", "rank": 171},
    {"name": "Prickles", "type": "body", "rank": 172},
    {"name": "Prom", "type": "body", "rank": 173},
    {"name": "Crystal Camo", "type": "body", "rank": 174},
    {"name": "Dragonfly", "type": "head", "rank": 175},
    {"name": "Sahara", "type": "head", "rank": 176},
    {"name": "Grass", "type": "head", "rank": 177},
    {"name": "Marble", "type": "body", "rank": 178},
    {"name": "Rattler", "type": "body", "rank": 179},
    {"name": "Black Parade", "type": "trait", "rank": 180},
    {"name": "Forest", "type": "body", "rank": 181},
    {"name": "Poker", "type": "body", "rank": 182},
    {"name": "Black", "type": "body", "rank": 183},
    {"name": "Ivory", "type": "head", "rank": 184},
    {"name": "Arctic", "type": "body", "rank": 185},
    {"name": "Rust", "type": "body", "rank": 186},
    {"name": "Smurf", "type": "body", "rank": 187},
    {"name": "Dr.", "type": "body", "rank": 188},
    {"name": "Bonebox", "type": "trait", "rank": 189},
    {"name": "Aztec", "type": "body", "rank": 190},
    {"name": "Meat", "type": "body", "rank": 191},
    {"name": "1960's", "type": "head", "rank": 192},
    {"name": "Hefner", "type": "trait", "rank": 193},
    {"name": "Highlights", "type": "body", "rank": 194},
    {"name": "Leeloo", "type": "body", "rank": 195},
    {"name": "Royal", "type": "head", "rank": 196},
    {"name": "Silent Film", "type": "head", "rank": 197},
    {"name": "Boss", "type": "head", "rank": 198},
    {"name": "Butane", "type": "head", "rank": 199},
    {"name": "Coin", "type": "head", "rank": 200},
    {"name": "Waves", "type": "body", "rank": 201},
    {"name": "Hammerheat", "type": "trait", "rank": 202},
    {"name": "Luna", "type": "trait", "rank": 203},
    {"name": "Plush", "type": "body", "rank": 204},
    {"name": "Tickle", "type": "body", "rank": 205},
    {"name": "Mugged", "type": "body", "rank": 206},
    {"name": "Victoria", "type": "body", "rank": 207},
    {"name": "Cubes", "type": "body", "rank": 208},
    {"name": "Pop", "type": "trait", "rank": 209},
    {"name": "Ring Green", "type": "trait", "rank": 210},
    {"name": "Sand", "type": "body", "rank": 211},
    {"name": "Fourzin", "type": "trait", "rank": 212},
    {"name": "Hacker", "type": "head", "rank": 213},
    {"name": "Heart", "type": "body", "rank": 214},
    {"name": "Bumblebee", "type": "head", "rank": 215},
    {"name": "Camo", "type": "head", "rank": 216},
    {"name": "Plastik", "type": "head", "rank": 217},
    {"name": "Mac & Cheese", "type": "head", "rank": 218},
    {"name": "Carbon", "type": "body", "rank": 219},
    {"name": "Crimson", "type": "head", "rank": 220},
    {"name": "Crystal Clear", "type": "body", "rank": 221},
    {"name": "Molten Core", "type": "trait", "rank": 222},
    {"name": "Dazed Piggy", "type": "head", "rank": 223},
    {"name": "Sir", "type": "body", "rank": 224},
    {"name": "Mahogany", "type": "head", "rank": 225},
    {"name": "Princess", "type": "body", "rank": 226},
    {"name": "Bumble Bird", "type": "trait", "rank": 227},
    {"name": "Big Brother", "type": "head", "rank": 228},
    {"name": "Chrome", "type": "body", "rank": 229},
    {"name": "Deep Space", "type": "trait", "rank": 230},
    {"name": "Night Vision", "type": "trait", "rank": 231},
    {"name": "Snapshot", "type": "head", "rank": 232},
    {"name": "Cadillac", "type": "head", "rank": 233},
    {"name": "Corroded", "type": "head", "rank": 234},
    {"name": "Albino", "type": "trait", "rank": 235},
    {"name": "Rust", "type": "head", "rank": 236},
    {"name": "Steam", "type": "body", "rank": 237},
    {"name": "Business", "type": "head", "rank": 238},
    {"name": "Scissors", "type": "trait", "rank": 239},
    {"name": "Black & White", "type": "trait", "rank": 240},
    {"name": "Goblin", "type": "body", "rank": 241},
    {"name": "Neon Flamingo", "type": "head", "rank": 242},
    {"name": "Silver", "type": "trait", "rank": 243},
    {"name": "Aztec", "type": "head", "rank": 244},
    {"name": "Milk", "type": "head", "rank": 245},
    {"name": "Whiteout", "type": "trait", "rank": 246},
    {"name": "Aqua", "type": "head", "rank": 247},
    {"name": "Lumberjack", "type": "trait", "rank": 248},
    {"name": "OE Dark", "type": "body", "rank": 249},
    {"name": "desufnoC", "type": "head", "rank": 250},
    {"name": "Bone", "type": "body", "rank": 251},
    {"name": "Bark", "type": "head", "rank": 252},
    {"name": "Abominable", "type": "body", "rank": 253},
    {"name": "Chromium", "type": "trait", "rank": 254},
    {"name": "Rainbow Morpho", "type": "trait", "rank": 255},
    {"name": "Pawn Shop", "type": "trait", "rank": 256},
    {"name": "Sky", "type": "body", "rank": 257},
    {"name": "Blush", "type": "body", "rank": 258},
    {"name": "Polished", "type": "head", "rank": 259},
    {"name": "Lightning", "type": "head", "rank": 260},
    {"name": "Ring Blue", "type": "trait", "rank": 261},
    {"name": "Ol' Faithful", "type": "head", "rank": 262},
    {"name": "Iron", "type": "body", "rank": 263},
    {"name": "James", "type": "body", "rank": 264},
    {"name": "Classic", "type": "head", "rank": 265},
    {"name": "Noob", "type": "body", "rank": 266},
    {"name": "Matte", "type": "body", "rank": 267},
    {"name": "Concrete", "type": "trait", "rank": 268},
    {"name": "Paparazzi", "type": "trait", "rank": 269},
    {"name": "Shamrock", "type": "head", "rank": 270},
    {"name": "Exposed", "type": "head", "rank": 271},
    {"name": "Moth", "type": "trait", "rank": 272},
    {"name": "Who", "type": "trait", "rank": 273},
    {"name": "Contractor", "type": "trait", "rank": 274},
    {"name": "Couch", "type": "body", "rank": 275},
    {"name": "Stock", "type": "trait", "rank": 276},
    {"name": "Nuke", "type": "head", "rank": 277},
    {"name": "101.1 FM", "type": "trait", "rank": 278},
    {"name": "Technicolor", "type": "trait", "rank": 279},
    {"name": "Kevlar", "type": "head", "rank": 280},
    {"name": "Near Space", "type": "trait", "rank": 281},
    {"name": "Log", "type": "head", "rank": 282},
    {"name": "Maps", "type": "body", "rank": 283},
    {"name": "Vampire", "type": "trait", "rank": 284},
    {"name": "Grate", "type": "body", "rank": 285},
    {"name": "Taser", "type": "head", "rank": 286},
    {"name": "Pyrex", "type": "trait", "rank": 287},
    {"name": "Nothing", "type": "trait", "rank": 288}
]

# Color scheme based on variation type
type_colors = {
    "head": (255, 195, 77),     # Gold/yellow
    "body": (77, 150, 255),     # Blue
    "trait": (255, 77, 150)     # Pink
}

def create_essence_image(variation_name, variation_type, output_path):
    """Create a single essence image with a circle and text"""
    # Create a new image with transparent background
    img = Image.new('RGBA', (120, 120), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Get the color for this variation type
    color = type_colors.get(variation_type, (200, 200, 200))

    # Draw a filled circle with anti-aliasing
    # Create a larger image for anti-aliasing
    scale = 4
    large_img = Image.new('RGBA', (120 * scale, 120 * scale), (0, 0, 0, 0))
    large_draw = ImageDraw.Draw(large_img)

    # Draw circle on larger image
    circle_color = (*color, 180)  # Add transparency
    large_draw.ellipse([10*scale, 10*scale, 110*scale, 110*scale],
                       fill=circle_color,
                       outline=(255, 255, 255, 255),
                       width=2*scale)

    # Resize back to original size with anti-aliasing
    img = large_img.resize((120, 120), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)

    # Try to use a system font, fallback to default
    try:
        # Try to use Arial or similar
        font = ImageFont.truetype("arial.ttf", 10)
    except:
        try:
            # Fallback to another common font
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 10)
        except:
            # Use default font if no TrueType fonts available
            font = ImageFont.load_default()

    # Split long names into multiple lines
    words = variation_name.split()
    lines = []
    current_line = []

    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width > 100 and current_line:
            lines.append(' '.join(current_line))
            current_line = [word]
        else:
            current_line.append(word)

    if current_line:
        lines.append(' '.join(current_line))

    # Calculate total text height
    line_height = 12
    total_height = len(lines) * line_height
    start_y = 60 - (total_height // 2)

    # Draw text centered
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = 60 - (text_width // 2)
        text_y = start_y + (i * line_height)

        # Draw text with shadow for better visibility
        draw.text((text_x + 1, text_y + 1), line, fill=(0, 0, 0, 150), font=font)
        draw.text((text_x, text_y), line, fill=(255, 255, 255, 255), font=font)

    # Save as WebP with compression
    img.save(output_path, 'WebP', quality=65, method=6)

# Output directory
output_dir = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\120px"

# Create all essence images
print(f"Generating {len(variations)} essence images...")
for i, var in enumerate(variations):
    # Clean filename - remove special characters and spaces
    filename = var['name'].replace(' ', '-').replace('&', 'and').replace('?', 'q').replace("'", '').replace('.', '-').lower()
    # Handle special cases
    if filename == '' or filename == 'qqq':  # Handle "???"
        filename = 'triple-question'
    elif filename == 'rust' and var['rank'] == 186:  # Body Rust
        filename = 'rust-body'
    elif filename == 'rust' and var['rank'] == 236:  # Head Rust
        filename = 'rust-head'
    elif filename == 'aztec' and var['rank'] == 190:  # Body Aztec
        filename = 'aztec-body'
    elif filename == 'aztec' and var['rank'] == 244:  # Head Aztec
        filename = 'aztec-head'
    output_path = os.path.join(output_dir, f"{filename}.webp")

    create_essence_image(var['name'], var['type'], output_path)

    if (i + 1) % 50 == 0:
        print(f"Generated {i + 1}/{len(variations)} images...")

print(f"Successfully generated all {len(variations)} essence images!")