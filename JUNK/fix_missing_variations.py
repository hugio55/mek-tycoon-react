from PIL import Image, ImageDraw, ImageFont
import os

# Missing variations that had name issues
missing_variations = [
    ("Ace of Spades Ultimate", "HEAD"),
    ("Skull Ultimate", "HEAD")  # Check if this one is also missing
]

output_dir = "public/variation-images"

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
        font_large = ImageFont.truetype("arialbd.ttf", 16)  # Arial Bold
        font_medium = ImageFont.truetype("arial.ttf", 11)
        font_small = ImageFont.truetype("arial.ttf", 9)
    except:
        try:
            font_large = ImageFont.truetype("arial.ttf", 18)
            font_medium = ImageFont.truetype("arial.ttf", 12)
            font_small = ImageFont.truetype("arial.ttf", 10)
        except:
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
    
    # Split long names
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
            
        if text_width > 130:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                if len(word) > 10:
                    lines.append(word[:10])
                    current_line = [word[10:]]
                else:
                    lines.append(word)
        else:
            current_line.append(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw text centered
    line_height = 22
    y_start = 75 - (len(lines) * line_height // 2)
    
    for i, line in enumerate(lines):
        try:
            bbox = draw.textbbox((0, 0), line, font=font_large)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(line) * 10
            
        # Add text shadow
        draw.text((75 - text_width//2 + 1, y_start + i*line_height + 1), 
                 line, fill='#000000', font=font_large)
        draw.text((75 - text_width//2, y_start + i*line_height), 
                 line, fill='#ffffff', font=font_large)
    
    # Create filename - handle "Ultimate" properly  
    item_id = name.lower().replace(' ', '_').replace("'", "")
    # Don't truncate if it contains "ultimate"
    if "ultimate" in item_id and len(item_id) > 20:
        # Keep the full name for ultimate items
        item_id = item_id[:30]  # Allow longer names for Ultimate items
    else:
        item_id = item_id[:20]
    
    # Clean up any problematic characters
    item_id = item_id.replace("?", "q").replace("/", "_").replace("\\", "_")
    item_id = item_id.replace(":", "_").replace("*", "_").replace('"', "")
    item_id = item_id.replace('<', "").replace('>', "").replace('|', "_")
    
    # Add small ID at bottom
    draw.text((5, 135), item_id[:25], fill='#666666', font=font_small)
    
    filename = f"{item_id}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath)
    
    return filename

# Generate the missing files
print("Creating missing variation images...")
for name, category in missing_variations:
    filename = create_placeholder_image(name, category)
    print(f"Created: {filename}")

print("\nDone! All variations should now have placeholder images.")