from PIL import Image, ImageDraw, ImageFont
import os

# Variation names for first 10 (as a test)
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

# Load font
try:
    font = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 180)
except:
    try:
        font = ImageFont.truetype('arial.ttf', 180)
    except:
        font = ImageFont.load_default()

# Process each variation
for i, name in enumerate(test_variations, start=1):
    # Open fresh copy of original image
    img = Image.open(source_image)
    draw = ImageDraw.Draw(img)

    # Get image dimensions
    w, h = img.size

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), name, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Center the text horizontally and vertically
    x = (w - text_w) // 2
    y = (h - text_h) // 2

    # Draw thick black outline for maximum visibility
    outline_color = 'black'
    outline_thickness = 5
    for adj_x in range(-outline_thickness, outline_thickness + 1):
        for adj_y in range(-outline_thickness, outline_thickness + 1):
            if adj_x != 0 or adj_y != 0:
                draw.text((x + adj_x, y + adj_y), name, fill=outline_color, font=font)

    # Draw main text in bright yellow/gold
    draw.text((x, y), name, fill='#FFD700', font=font)

    # Save with sanitized filename
    safe_name = name.replace('/', '-').replace('\\', '-').replace('?', '')
    output_path = os.path.join(output_folder, f'{safe_name}.png')
    img.save(output_path)

    print(f'{i}/10 Created: {safe_name}.png')

print('\nAll 10 test bottles created successfully!')
