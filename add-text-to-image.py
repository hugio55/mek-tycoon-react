from PIL import Image, ImageDraw, ImageFont

# Open the image
img = Image.open(r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\1k base.png')

# Create drawing context
draw = ImageDraw.Draw(img)

# Get image dimensions
w, h = img.size

# Try to use a nice font, fallback to default
try:
    font = ImageFont.truetype('arial.ttf', 80)
except:
    try:
        font = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 80)
    except:
        font = ImageFont.load_default()

# Text to add
text = 'bumblebee'

# Get text bounding box for centering
bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]

# Center the text
x = (w - text_w) // 2
y = h // 2

# Draw text with black outline for visibility
outline_color = 'black'
for adj_x, adj_y in [(-2, -2), (2, -2), (-2, 2), (2, 2), (-2, 0), (2, 0), (0, -2), (0, 2)]:
    draw.text((x + adj_x, y + adj_y), text, fill=outline_color, font=font)

# Draw main text in yellow/gold
draw.text((x, y), text, fill='#fab617', font=font)

# Save the image
img.save(r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\1k base.png')

print('Text "bumblebee" added successfully to 1k base.png')
