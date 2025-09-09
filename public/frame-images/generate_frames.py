from PIL import Image, ImageDraw
import os

# Create output directory if it doesn't exist
output_dir = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\frame-images"
os.makedirs(output_dir, exist_ok=True)

def create_frame(size=400, border_width=30, color=(250, 182, 23, 255), name="frame"):
    """Create a square frame with transparent center"""
    # Create RGBA image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw outer rectangle (frame border)
    draw.rectangle(
        [(0, 0), (size-1, size-1)],
        outline=color,
        width=border_width
    )
    
    # Save the frame
    img.save(os.path.join(output_dir, f"{name}.png"))
    print(f"Created: {name}.png")

# Frame 1: Classic Gold Industrial
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Outer gold border
for i in range(25):
    alpha = int(255 - i * 3)
    color = (250, 182, 23, alpha)
    draw.rectangle([(i, i), (399-i, 399-i)], outline=color, width=1)
img.save(os.path.join(output_dir, "frame-gold-industrial.png"))
print("Created: frame-gold-industrial.png")

# Frame 2: Hazard Stripes
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Create hazard stripe pattern
for i in range(0, 400, 20):
    if (i // 20) % 2 == 0:
        # Black stripes
        draw.polygon([(i, 0), (i+20, 0), (0, i+20), (0, i)], fill=(0, 0, 0, 255))
        draw.polygon([(400-i-20, 400), (400-i, 400), (400, 400-i), (400, 400-i-20)], fill=(0, 0, 0, 255))
    else:
        # Yellow stripes
        draw.polygon([(i, 0), (i+20, 0), (0, i+20), (0, i)], fill=(250, 182, 23, 255))
        draw.polygon([(400-i-20, 400), (400-i, 400), (400, 400-i), (400, 400-i-20)], fill=(250, 182, 23, 255))
# Clear center
draw.rectangle([(30, 30), (370, 370)], fill=(0, 0, 0, 0))
img.save(os.path.join(output_dir, "frame-hazard-stripes.png"))
print("Created: frame-hazard-stripes.png")

# Frame 3: Hex Tech (angled corners)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Draw hex-style frame with cut corners
points = [
    (30, 0), (370, 0), (400, 30), (400, 370), (370, 400), (30, 400), (0, 370), (0, 30)
]
draw.polygon(points, outline=(250, 182, 23, 255), width=20)
# Inner hex
inner_points = [
    (50, 20), (350, 20), (380, 50), (380, 350), (350, 380), (50, 380), (20, 350), (20, 50)
]
draw.polygon(inner_points, outline=(26, 26, 26, 255), width=3)
img.save(os.path.join(output_dir, "frame-hex-tech.png"))
print("Created: frame-hex-tech.png")

# Frame 4: Circuit Board (green tech)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Draw circuit pattern
for i in range(0, 400, 8):
    if i % 16 == 0:
        draw.line([(0, i), (30, i)], fill=(0, 255, 136, 180), width=2)
        draw.line([(370, i), (400, i)], fill=(0, 255, 136, 180), width=2)
        draw.line([(i, 0), (i, 30)], fill=(0, 255, 136, 180), width=2)
        draw.line([(i, 370), (i, 400)], fill=(0, 255, 136, 180), width=2)
# Main border
draw.rectangle([(0, 0), (399, 399)], outline=(10, 10, 10, 255), width=25)
draw.rectangle([(22, 22), (377, 377)], outline=(0, 255, 136, 100), width=2)
img.save(os.path.join(output_dir, "frame-circuit-board.png"))
print("Created: frame-circuit-board.png")

# Frame 5: Riveted Steel
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Steel gradient effect
for i in range(30):
    gray_val = 74 + i * 2
    draw.rectangle([(i, i), (399-i, 399-i)], outline=(gray_val, gray_val, gray_val, 255), width=1)
# Add rivets
for x in [15, 385]:
    for y in range(15, 400, 40):
        draw.ellipse([(x-5, y-5), (x+5, y+5)], fill=(136, 136, 136, 255))
for y in [15, 385]:
    for x in range(15, 400, 40):
        draw.ellipse([(x-5, y-5), (x+5, y+5)], fill=(136, 136, 136, 255))
# Clear center
draw.rectangle([(30, 30), (370, 370)], fill=(0, 0, 0, 0))
img.save(os.path.join(output_dir, "frame-riveted-steel.png"))
print("Created: frame-riveted-steel.png")

# Frame 6: Energy Shield (cyan)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Energy glow effect
for i in range(20):
    alpha = int(255 - i * 10)
    color = (0, 200, 255, alpha)
    draw.rectangle([(i, i), (399-i, 399-i)], outline=color, width=2)
# Core border
draw.rectangle([(20, 20), (379, 379)], outline=(0, 255, 255, 255), width=3)
img.save(os.path.join(output_dir, "frame-energy-shield.png"))
print("Created: frame-energy-shield.png")

# Frame 7: Corrupted Data (red glitch)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Glitch effect with red
draw.rectangle([(0, 0), (399, 399)], outline=(255, 0, 64, 255), width=24)
# Add glitch lines
for i in range(5, 400, 15):
    if i % 30 == 0:
        draw.line([(0, i), (24, i)], fill=(255, 0, 64, 100), width=2)
        draw.line([(376, i), (400, i)], fill=(255, 0, 64, 100), width=2)
# Inner glitch border
draw.rectangle([(22, 22), (377, 377)], outline=(255, 0, 64, 50), width=1)
img.save(os.path.join(output_dir, "frame-corrupted-data.png"))
print("Created: frame-corrupted-data.png")

# Frame 8: Diamond Plate (metallic)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Diamond plate pattern
for i in range(0, 30, 10):
    for j in range(0, 30, 10):
        # Top edge
        draw.rectangle([(i*2, j*2), (i*2+8, j*2+8)], outline=(90, 90, 90, 255), width=1)
        draw.rectangle([(400-i*2-8, j*2), (400-i*2, j*2+8)], outline=(90, 90, 90, 255), width=1)
        # Bottom edge
        draw.rectangle([(i*2, 400-j*2-8), (i*2+8, 400-j*2)], outline=(90, 90, 90, 255), width=1)
        draw.rectangle([(400-i*2-8, 400-j*2-8), (400-i*2, 400-j*2)], outline=(90, 90, 90, 255), width=1)
# Main metallic border
for i in range(26):
    gray_val = 58 + i * 3
    draw.rectangle([(i, i), (399-i, 399-i)], outline=(gray_val, gray_val, gray_val, 255), width=1)
img.save(os.path.join(output_dir, "frame-diamond-plate.png"))
print("Created: frame-diamond-plate.png")

# Frame 9: Plasma Core (purple/magenta)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Plasma glow effect
for i in range(22):
    if i < 11:
        # Purple to magenta gradient
        r = 255
        g = 0
        b = 255 - i * 15
        alpha = 255 - i * 10
    else:
        # Magenta to purple gradient
        r = 255 - (i - 11) * 15
        g = 0
        b = 255
        alpha = 155 - (i - 11) * 10
    color = (r, g, b, alpha)
    draw.rectangle([(i, i), (399-i, 399-i)], outline=color, width=2)
img.save(os.path.join(output_dir, "frame-plasma-core.png"))
print("Created: frame-plasma-core.png")

# Frame 10: Legendary Prism (rainbow)
img = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Rainbow gradient border
colors = [
    (255, 0, 0),     # Red
    (255, 127, 0),   # Orange
    (255, 255, 0),   # Yellow
    (0, 255, 0),     # Green
    (0, 0, 255),     # Blue
    (75, 0, 130),    # Indigo
    (148, 0, 211),   # Violet
]
# Draw rainbow border
for i in range(25):
    color_idx = i % len(colors)
    color = colors[color_idx] + (255 - i * 5,)
    draw.rectangle([(i, i), (399-i, 399-i)], outline=color, width=1)
# Add shimmer effect
for i in range(25):
    shimmer_alpha = int(100 - i * 3)
    draw.rectangle([(i, i), (399-i, 399-i)], outline=(255, 255, 255, shimmer_alpha), width=1)
img.save(os.path.join(output_dir, "frame-legendary-prism.png"))
print("Created: frame-legendary-prism.png")

print("\nAll 10 frames created successfully!")
print(f"Location: {output_dir}")