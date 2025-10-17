from PIL import Image, ImageDraw, ImageFont
import os

# Test with first 10 variations
test_variations = [
    "Ace of Spades Ultimate",
    "Derelict",
    "Discomania",
    "Ellie Mesh",
    "Frost King",
    "Nyan Ultimate",
    "Obliterator",
    "Paul Ultimate",
    "Pie",
    "Projectionist"
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

# Process each variation
for i, name in enumerate(test_variations, start=1):
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

        print(f'{i}/{len(test_variations)} {name}: Two lines, {font_size}pt')
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

        print(f'{i}/{len(test_variations)} {name}: Single line, {font_size}pt')

    # Save with sanitized filename
    safe_name = name.replace('/', '-').replace('\\', '-').replace('?', '')
    output_path = os.path.join(output_folder, f'{safe_name}.png')
    img.save(output_path)

print('\nTest bottles created with maximum font sizes!')
