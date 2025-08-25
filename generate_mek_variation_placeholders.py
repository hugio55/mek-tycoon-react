from PIL import Image, ImageDraw, ImageFont
import os
import json

# Load the variations data
with open('mek_variations.json', 'r') as f:
    variations = json.load(f)

# Create output directory
output_dir = "public/variation-images"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def create_placeholder_image(name, category):
    """Create a 150x150 placeholder image with variation name"""
    
    # Create image with dark background
    img = Image.new('RGB', (150, 150), color='#1a1a1a')
    draw = ImageDraw.Draw(img)
    
    # Define colors for each category
    border_color = {
        "HEAD": '#FFD700',   # Gold
        "BODY": '#00CED1',   # Dark Turquoise  
        "TRAIT": '#FF69B4'   # Hot Pink
    }.get(category, '#ffffff')
    
    # Draw border (thicker for better visibility)
    draw.rectangle([0, 0, 149, 149], outline=border_color, width=3)
    draw.rectangle([2, 2, 147, 147], outline=border_color, width=1)
    
    # Try to use a larger font for better visibility at small sizes
    try:
        # Try to use a bold system font for main text
        font_large = ImageFont.truetype("arialbd.ttf", 16)  # Arial Bold
        font_medium = ImageFont.truetype("arial.ttf", 11)
        font_small = ImageFont.truetype("arial.ttf", 9)
    except:
        try:
            # Fallback to regular Arial
            font_large = ImageFont.truetype("arial.ttf", 18)
            font_medium = ImageFont.truetype("arial.ttf", 12)
            font_small = ImageFont.truetype("arial.ttf", 10)
        except:
            # Use default font if system fonts not found
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
    
    # Draw category label at top with background for visibility
    category_text = category
    try:
        bbox = draw.textbbox((0, 0), category_text, font=font_medium)
        text_width = bbox[2] - bbox[0]
    except:
        text_width = len(category_text) * 7
    
    # Draw background rectangle for category
    draw.rectangle([40, 5, 110, 20], fill=border_color)
    draw.text((75 - text_width//2, 7), category_text, fill='#000000', font=font_medium)
    
    # Process the name for display
    display_name = name.upper()
    
    # Split long names into multiple lines (more aggressively for small space)
    words = display_name.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        try:
            bbox = draw.textbbox((0, 0), test_line, font=font_large)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(test_line) * 10
            
        if text_width > 130:  # Leave margin
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                # Word is too long, split it
                if len(word) > 10:
                    lines.append(word[:10])
                    current_line = [word[10:]]
                else:
                    lines.append(word)
        else:
            current_line.append(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Limit to 4 lines max
    if len(lines) > 4:
        lines = lines[:3]
        lines.append('...')
    
    # Draw the text lines centered with larger font
    line_height = 22
    y_start = 75 - (len(lines) * line_height // 2)
    
    for i, line in enumerate(lines):
        try:
            bbox = draw.textbbox((0, 0), line, font=font_large)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(line) * 10
            
        # Add text shadow for better readability
        shadow_offset = 1
        draw.text((75 - text_width//2 + shadow_offset, y_start + i*line_height + shadow_offset), 
                 line, fill='#000000', font=font_large)
        draw.text((75 - text_width//2, y_start + i*line_height), 
                 line, fill='#ffffff', font=font_large)
    
    # Add small ID at bottom
    item_id = name.lower().replace(' ', '_').replace("'", "").replace("?", "q").replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace('"', "").replace('<', "").replace('>', "").replace('|', "_")[:20]
    draw.text((5, 135), item_id, fill='#666666', font=font_small)
    
    # Save the image
    filename = f"{item_id}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath)
    
    return filename

# Generate all placeholder images
generated_files = []
all_items = []

print("Generating Mek variation placeholder images...")
print("-" * 50)

# Process Heads
print(f"\nHEADS ({len(variations['heads'])} items):")
for name in variations['heads']:
    filename = create_placeholder_image(name, "HEAD")
    generated_files.append(filename)
    all_items.append({
        "name": name,
        "category": "head",
        "image": f"/variation-images/{filename}"
    })
    print(f"  [OK] {name}")

# Process Bodies  
print(f"\nBODIES ({len(variations['bodies'])} items):")
for name in variations['bodies']:
    filename = create_placeholder_image(name, "BODY")
    generated_files.append(filename)
    all_items.append({
        "name": name,
        "category": "body",
        "image": f"/variation-images/{filename}"
    })
    print(f"  [OK] {name}")

# Process Traits
print(f"\nTRAITS ({len(variations['traits'])} items):")
for name in variations['traits']:
    filename = create_placeholder_image(name, "TRAIT")
    generated_files.append(filename)
    all_items.append({
        "name": name,
        "category": "trait",
        "image": f"/variation-images/{filename}"
    })
    print(f"  [OK] {name}")

# Save variations data as JSON
json_path = os.path.join(output_dir, "variations_data.json")
with open(json_path, 'w') as f:
    json.dump({
        "heads": variations['heads'],
        "bodies": variations['bodies'],
        "traits": variations['traits'],
        "all_items": all_items
    }, f, indent=2)

print("\n" + "=" * 50)
print(f"[DONE] Generated {len(generated_files)} placeholder images")
print(f"  - Heads: {len(variations['heads'])}")
print(f"  - Bodies: {len(variations['bodies'])}")
print(f"  - Traits: {len(variations['traits'])}")
print(f"[DIR] Saved to: {output_dir}")
print(f"[JSON] Variations data saved to: {json_path}")
print("\nImages are 150x150px with:")
print("  - GOLD border for Heads")
print("  - TURQUOISE border for Bodies")
print("  - PINK border for Traits")
print("  - Large bold text for visibility as icons")
print("\nTo replace with real images, overwrite files with same names.")