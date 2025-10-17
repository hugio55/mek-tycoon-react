from PIL import Image, ImageDraw, ImageFont

# Open the original image
img = Image.open(r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\bumble0000.png')

# Create drawing context
draw = ImageDraw.Draw(img)

# Get image dimensions
w, h = img.size

# Use a much larger font
try:
    font = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 180)
except:
    try:
        font = ImageFont.truetype('arial.ttf', 180)
    except:
        font = ImageFont.load_default()

# Text to add
text = 'bumblebee'

# Get text bounding box for centering
bbox = draw.textbbox((0, 0), text, font=font)
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
            draw.text((x + adj_x, y + adj_y), text, fill=outline_color, font=font)

# Draw main text in bright yellow/gold
draw.text((x, y), text, fill='#FFD700', font=font)

# Save as a new file
output_path = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\bumble0000-bumblebee.png'
img.save(output_path)

print(f'Created new image with text: bumble0000-bumblebee.png')
print(f'Original file unchanged: bumble0000.png')
