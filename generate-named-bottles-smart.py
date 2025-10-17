from PIL import Image, ImageDraw, ImageFont
import os

# Test with two potentially long names
test_variations = [
    "Paul Ultimate",
    "Ace of Spades Ultimate"
]

# Paths
source_image = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\bumble0000.png'
output_folder = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\named-bottles 1k'

# Load font
try:
    font_large = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 180)
    font_medium = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 120)
    font_small = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 90)
except:
    try:
        font_large = ImageFont.truetype('arial.ttf', 180)
        font_medium = ImageFont.truetype('arial.ttf', 120)
        font_small = ImageFont.truetype('arial.ttf', 90)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

def draw_text_with_outline(draw, x, y, text, font, outline_color='black', fill_color='#FFD700', outline_thickness=5):
    """Draw text with thick outline"""
    for adj_x in range(-outline_thickness, outline_thickness + 1):
        for adj_y in range(-outline_thickness, outline_thickness + 1):
            if adj_x != 0 or adj_y != 0:
                draw.text((x + adj_x, y + adj_y), text, fill=outline_color, font=font)
    draw.text((x, y), text, fill=fill_color, font=font)

# Process each variation
for i, name in enumerate(test_variations, start=1):
    # Open fresh copy of original image
    img = Image.open(source_image)
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # Try different font sizes and line configurations
    fitted = False

    # Try single line with large font
    bbox = draw.textbbox((0, 0), name, font=font_large)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    if text_w <= w - 100:  # 50px margin on each side
        # Single line fits with large font
        x = (w - text_w) // 2
        y = (h - text_h) // 2
        draw_text_with_outline(draw, x, y, name, font_large)
        print(f'{i}/{len(test_variations)} {name}: Single line, large font')
    else:
        # Try splitting into multiple lines
        words = name.split()

        # Try different split points
        best_config = None

        for split_point in range(1, len(words)):
            line1 = ' '.join(words[:split_point])
            line2 = ' '.join(words[split_point:])

            # Try with medium font first
            bbox1 = draw.textbbox((0, 0), line1, font=font_medium)
            bbox2 = draw.textbbox((0, 0), line2, font=font_medium)
            w1 = bbox1[2] - bbox1[0]
            w2 = bbox2[2] - bbox2[0]
            h1 = bbox1[3] - bbox1[1]
            h2 = bbox2[3] - bbox2[1]

            if w1 <= w - 100 and w2 <= w - 100:
                best_config = ('medium', line1, line2, w1, w2, h1, h2)
                break

        # If medium doesn't work, try small font
        if not best_config:
            for split_point in range(1, len(words)):
                line1 = ' '.join(words[:split_point])
                line2 = ' '.join(words[split_point:])

                bbox1 = draw.textbbox((0, 0), line1, font=font_small)
                bbox2 = draw.textbbox((0, 0), line2, font=font_small)
                w1 = bbox1[2] - bbox1[0]
                w2 = bbox2[2] - bbox2[0]
                h1 = bbox1[3] - bbox1[1]
                h2 = bbox2[3] - bbox2[1]

                if w1 <= w - 100 and w2 <= w - 100:
                    best_config = ('small', line1, line2, w1, w2, h1, h2)
                    break

        if best_config:
            font_size, line1, line2, w1, w2, h1, h2 = best_config
            font_to_use = font_medium if font_size == 'medium' else font_small

            # Calculate positions for centered two-line text
            total_height = h1 + h2 + 20  # 20px gap between lines
            start_y = (h - total_height) // 2

            x1 = (w - w1) // 2
            y1 = start_y
            draw_text_with_outline(draw, x1, y1, line1, font_to_use)

            x2 = (w - w2) // 2
            y2 = start_y + h1 + 20
            draw_text_with_outline(draw, x2, y2, line2, font_to_use)

            print(f'{i}/{len(test_variations)} {name}: Two lines, {font_size} font')
        else:
            # Fallback: just use small font single line and let it overflow slightly
            bbox = draw.textbbox((0, 0), name, font=font_small)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            x = (w - text_w) // 2
            y = (h - text_h) // 2
            draw_text_with_outline(draw, x, y, name, font_small)
            print(f'{i}/{len(test_variations)} {name}: Single line, small font (may overflow)')

    # Save with sanitized filename
    safe_name = name.replace('/', '-').replace('\\', '-').replace('?', '')
    output_path = os.path.join(output_folder, f'{safe_name}.png')
    img.save(output_path)

print('\nTest bottles created successfully!')
