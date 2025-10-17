from PIL import Image, ImageDraw, ImageFont
import os

# All 288 variations from variationsReferenceData.ts
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

# Paths
source_image = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\bumble0000.png'
output_folder = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\named-bottles 1k'

def get_font(size):
    """Get font at specified size"""
    try:
        return ImageFont.truetype('C:\\Windows\\Fonts\\arialbd.ttf', size)
    except:
        try:
            return ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', size)
        except:
            return ImageFont.load_default()

def draw_text_with_outline(draw, x, y, text, font, outline_color='black', fill_color='#FFD700', outline_thickness=5):
    """Draw text with thick outline"""
    for adj_x in range(-outline_thickness, outline_thickness + 1):
        for adj_y in range(-outline_thickness, outline_thickness + 1):
            if adj_x != 0 or adj_y != 0:
                draw.text((x + adj_x, y + adj_y), text, fill=outline_color, font=font)
    draw.text((x, y), text, fill=fill_color, font=font)

def find_max_font_size_single_line(draw, text, max_width, max_height):
    """Binary search for maximum font size that fits in single line"""
    min_size = 20
    max_size = 400
    best_size = min_size

    while min_size <= max_size:
        mid_size = (min_size + max_size) // 2
        font = get_font(mid_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]

        if w <= max_width and h <= max_height:
            best_size = mid_size
            min_size = mid_size + 1
        else:
            max_size = mid_size - 1

    return best_size

def find_max_font_size_two_lines(draw, line1, line2, max_width, max_height):
    """Binary search for maximum font size that fits both lines"""
    min_size = 20
    max_size = 400
    best_size = min_size
    line_gap = 20

    while min_size <= max_size:
        mid_size = (min_size + max_size) // 2
        font = get_font(mid_size)

        bbox1 = draw.textbbox((0, 0), line1, font=font)
        bbox2 = draw.textbbox((0, 0), line2, font=font)

        w1 = bbox1[2] - bbox1[0]
        h1 = bbox1[3] - bbox1[1]
        w2 = bbox2[2] - bbox2[0]
        h2 = bbox2[3] - bbox2[1]

        max_line_width = max(w1, w2)
        total_height = h1 + h2 + line_gap

        if max_line_width <= max_width and total_height <= max_height:
            best_size = mid_size
            min_size = mid_size + 1
        else:
            max_size = mid_size - 1

    return best_size

print(f'Starting generation of {len(all_variations)} bottles...\n')

# Process each variation
for i, name in enumerate(all_variations, start=1):
    # Open fresh copy of original image
    img = Image.open(source_image)
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # Define usable area (with small margins)
    margin = 40
    max_width = w - (margin * 2)
    max_height = h - (margin * 2)

    # Try single line first
    single_line_size = find_max_font_size_single_line(draw, name, max_width, max_height)

    # Try two-line configurations
    words = name.split()
    best_two_line_size = 0
    best_split = None

    if len(words) > 1:
        for split_point in range(1, len(words)):
            line1 = ' '.join(words[:split_point])
            line2 = ' '.join(words[split_point:])
            two_line_size = find_max_font_size_two_lines(draw, line1, line2, max_width, max_height)

            if two_line_size > best_two_line_size:
                best_two_line_size = two_line_size
                best_split = (line1, line2)

    # Choose the configuration with larger font
    if best_two_line_size > single_line_size and best_split:
        # Use two lines
        font_size = best_two_line_size
        font = get_font(font_size)
        line1, line2 = best_split

        bbox1 = draw.textbbox((0, 0), line1, font=font)
        bbox2 = draw.textbbox((0, 0), line2, font=font)

        w1 = bbox1[2] - bbox1[0]
        h1 = bbox1[3] - bbox1[1]
        w2 = bbox2[2] - bbox2[0]
        h2 = bbox2[3] - bbox2[1]

        line_gap = 20
        total_height = h1 + h2 + line_gap
        start_y = (h - total_height) // 2

        x1 = (w - w1) // 2
        y1 = start_y
        draw_text_with_outline(draw, x1, y1, line1, font)

        x2 = (w - w2) // 2
        y2 = start_y + h1 + line_gap
        draw_text_with_outline(draw, x2, y2, line2, font)
    else:
        # Use single line
        font_size = single_line_size
        font = get_font(font_size)

        bbox = draw.textbbox((0, 0), name, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        x = (w - text_w) // 2
        y = (h - text_h) // 2
        draw_text_with_outline(draw, x, y, name, font)

    # Save with sanitized filename
    safe_name = name.replace('/', '-').replace('\\', '-').replace('?', 'Q').replace('&', 'and')
    # Handle edge case where name becomes empty
    if not safe_name or safe_name.strip() == '':
        safe_name = f'variation_{i}'
    output_path = os.path.join(output_folder, f'{safe_name}.png')
    img.save(output_path)

    # Progress update every 25 images
    if i % 25 == 0:
        print(f'Progress: {i}/{len(all_variations)} bottles created...')

print(f'\n✓ All {len(all_variations)} bottles created successfully!')
