import json
import re
from PIL import Image, ImageDraw, ImageFont

# Read and parse the TypeScript file to extract variation data
def extract_variation_data(ts_file_path):
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the COMPLETE_VARIATION_RARITY array
    match = re.search(r'export const COMPLETE_VARIATION_RARITY: VariationRarity\[\] = \[(.*?)\];', content, re.DOTALL)
    if not match:
        raise Exception("Could not find COMPLETE_VARIATION_RARITY array")

    array_content = match.group(1)

    # Parse each variation object
    variations = []
    # Split by closing brace followed by comma and opening brace
    objects = re.findall(r'\{[^}]+\}', array_content)

    for obj in objects:
        # Extract fields
        name_match = re.search(r'name:\s*"([^"]+)"', obj)
        type_match = re.search(r'type:\s*"([^"]+)"', obj)
        sourceKey_match = re.search(r'sourceKey:\s*"([^"]+)"', obj)

        if name_match and type_match and sourceKey_match:
            variations.append({
                'name': name_match.group(1),
                'type': type_match.group(1),
                'sourceKey': sourceKey_match.group(1)
            })

    return variations

# Font loading with fallback
def get_font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except:
        try:
            return ImageFont.truetype("C:/Windows/Fonts/arial.ttf", size)
        except:
            try:
                return ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", size)
            except:
                return ImageFont.load_default()

# Binary search for maximum font size that fits
def find_max_font_size_single_line(draw, text, max_width, max_height):
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

# Find best two-line split
def find_best_two_line_split(draw, text, max_width, max_height):
    words = text.split()
    if len(words) <= 1:
        return None

    best_config = None
    best_size = 0

    # Try different split points
    for split_idx in range(1, len(words)):
        line1 = ' '.join(words[:split_idx])
        line2 = ' '.join(words[split_idx:])

        # Binary search for max size that fits both lines
        min_size = 20
        max_size = 400
        found_size = 0

        while min_size <= max_size:
            mid_size = (min_size + max_size) // 2
            font = get_font(mid_size)

            bbox1 = draw.textbbox((0, 0), line1, font=font)
            bbox2 = draw.textbbox((0, 0), line2, font=font)

            w1 = bbox1[2] - bbox1[0]
            w2 = bbox2[2] - bbox2[0]
            h1 = bbox1[3] - bbox1[1]
            h2 = bbox2[3] - bbox2[1]

            total_height = h1 + h2 + 10  # 10px spacing

            if w1 <= max_width and w2 <= max_width and total_height <= max_height:
                found_size = mid_size
                min_size = mid_size + 1
            else:
                max_size = mid_size - 1

        if found_size > best_size:
            best_size = found_size
            best_config = (line1, line2, found_size)

    return best_config

# Generate bottle with text overlay
def generate_bottle(source_path, output_path, text):
    # Open source image
    img = Image.open(source_path).convert('RGBA')
    width, height = img.size

    # Create drawing context
    draw = ImageDraw.Draw(img)

    # Define margins (40px from each edge)
    margin = 40
    max_width = width - (2 * margin)
    max_height = height - (2 * margin)

    # Try single line first
    single_line_size = find_max_font_size_single_line(draw, text, max_width, max_height)

    # Try two-line split
    two_line_config = find_best_two_line_split(draw, text, max_width, max_height)

    # Choose the larger size
    if two_line_config and two_line_config[2] > single_line_size:
        # Use two lines
        line1, line2, font_size = two_line_config
        font = get_font(font_size)

        bbox1 = draw.textbbox((0, 0), line1, font=font)
        bbox2 = draw.textbbox((0, 0), line2, font=font)

        w1 = bbox1[2] - bbox1[0]
        w2 = bbox2[2] - bbox2[0]
        h1 = bbox1[3] - bbox1[1]
        h2 = bbox2[3] - bbox2[1]

        total_height = h1 + h2 + 10

        x1 = (width - w1) // 2
        x2 = (width - w2) // 2
        y_start = (height - total_height) // 2
        y1 = y_start
        y2 = y1 + h1 + 10

        # Draw line 1 with outline
        for dx in range(-5, 6):
            for dy in range(-5, 6):
                if dx*dx + dy*dy <= 25:
                    draw.text((x1 + dx, y1 + dy), line1, fill='black', font=font)
        draw.text((x1, y1), line1, fill='#FFD700', font=font)

        # Draw line 2 with outline
        for dx in range(-5, 6):
            for dy in range(-5, 6):
                if dx*dx + dy*dy <= 25:
                    draw.text((x2 + dx, y2 + dy), line2, fill='black', font=font)
        draw.text((x2, y2), line2, fill='#FFD700', font=font)
    else:
        # Use single line
        font = get_font(single_line_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]

        x = (width - w) // 2
        y = (height - h) // 2

        # Draw text with black outline
        for dx in range(-5, 6):
            for dy in range(-5, 6):
                if dx*dx + dy*dy <= 25:
                    draw.text((x + dx, y + dy), text, fill='black', font=font)

        # Draw gold text on top
        draw.text((x, y), text, fill='#FFD700', font=font)

    # Save
    img.save(output_path, 'PNG')

# Main execution
if __name__ == '__main__':
    # Paths
    ts_file = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\src\lib\completeVariationRarity.ts'
    source_image = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\bumble0000.png'
    output_folder = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\named-bottles 1k'

    print("Extracting variation data from TypeScript file...")
    variations = extract_variation_data(ts_file)
    print(f"Found {len(variations)} variations")

    # Statistics
    total = len(variations)
    unk_count = sum(1 for v in variations if v['sourceKey'] == 'UNK')
    valid_count = total - unk_count

    print(f"\nStatistics:")
    print(f"  Total variations: {total}")
    print(f"  Valid source keys: {valid_count}")
    print(f"  Unknown keys (UNK): {unk_count}")

    # Generate bottles for variations with valid source keys
    print(f"\nGenerating {valid_count} bottles...")
    generated = 0
    skipped = []

    # Pre-process to detect duplicate names
    name_counts = {}
    for var in variations:
        if var['sourceKey'] != 'UNK':
            name = var['name']
            safe_name = name.replace("'", "").replace(".", "").replace("&", "and").replace("?", "").replace("/", "-").replace("\\", "-").replace(":", "").replace("*", "").replace('"', "").replace("<", "").replace(">", "").replace("|", "").replace(" ", "-").lower()
            if not safe_name or safe_name == "---":
                safe_name = f"variation-{var['sourceKey'].lower()}"
            name_counts[safe_name] = name_counts.get(safe_name, 0) + 1

    for i, var in enumerate(variations):
        name = var['name']
        source_key = var['sourceKey']

        if source_key == 'UNK':
            skipped.append(name)
            continue

        # Use variation name as filename (sanitized)
        # Replace special chars and spaces to make valid filename
        safe_name = name.replace("'", "").replace(".", "").replace("&", "and").replace("?", "").replace("/", "-").replace("\\", "-").replace(":", "").replace("*", "").replace('"', "").replace("<", "").replace(">", "").replace("|", "").replace(" ", "-").lower()
        # Handle empty names after sanitization
        if not safe_name or safe_name == "---":
            safe_name = f"variation-{source_key.lower()}"

        # If duplicate name, append source key to make unique
        if name_counts.get(safe_name, 0) > 1:
            safe_name = f"{safe_name}-{source_key.lower()}"

        output_path = f"{output_folder}/{safe_name}.png"

        try:
            generate_bottle(source_image, output_path, name)
            generated += 1

            if generated % 25 == 0:
                print(f"  Generated {generated}/{valid_count}...")
        except Exception as e:
            print(f"  ERROR generating {source_key} ({name}): {e}")

    print(f"\nComplete!")
    print(f"  Generated: {generated}")
    print(f"  Skipped (UNK): {len(skipped)}")

    if skipped:
        print(f"\nSkipped variations with UNK source keys:")
        for name in skipped:
            print(f"  - {name}")
