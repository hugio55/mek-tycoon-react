from PIL import Image, ImageDraw, ImageFont
import os
import json

# Create output directory
output_dir = "public/item-images"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Define all items from your game
items = {
    "Materials": [
        "Scrap Metal",
        "Circuit Boards", 
        "Power Cells",
        "Nano Fibers",
        "Quantum Chips",
        "Dark Matter",
        "Crystal Shards",
        "Energy Cores",
        "Titanium Plates",
        "Carbon Mesh",
        "Plasma Cells",
        "Neural Chips"
    ],
    "Weapons": [
        "Basic Laser",
        "Plasma Cannon",
        "Rocket Launcher",
        "Energy Sword",
        "Pulse Rifle",
        "Gravity Gun",
        "Ion Blaster",
        "Photon Torpedo",
        "Railgun",
        "Flamethrower"
    ],
    "Armor": [
        "Basic Plating",
        "Titanium Armor",
        "Energy Shield",
        "Quantum Barrier",
        "Nano Suit",
        "Force Field",
        "Reactive Armor",
        "Stealth Cloak"
    ],
    "Tools": [
        "Mining Drill",
        "Repair Kit",
        "Scanner",
        "Hacking Device",
        "Teleporter",
        "Time Warp",
        "Gravity Boots",
        "Jetpack"
    ],
    "Consumables": [
        "Health Pack",
        "Energy Drink",
        "Shield Boost",
        "Speed Boost",
        "Damage Boost",
        "XP Boost",
        "Gold Boost",
        "Luck Potion"
    ],
    "Special": [
        "Golden Gear",
        "Ancient Relic",
        "Mystery Box",
        "Legendary Core",
        "Epic Fragment",
        "Rare Crystal",
        "Mek Fragment",
        "Soul Stone"
    ]
}

def create_placeholder_image(item_name, category):
    """Create a 150x150 placeholder image with item name"""
    
    # Create image with dark background
    img = Image.new('RGB', (150, 150), color='#2a2a2a')
    draw = ImageDraw.Draw(img)
    
    # Add border
    border_color = {
        "Materials": '#808080',  # Gray
        "Weapons": '#ff4444',     # Red
        "Armor": '#4444ff',       # Blue
        "Tools": '#44ff44',       # Green
        "Consumables": '#ff44ff',  # Magenta
        "Special": '#ffaa00'       # Gold
    }.get(category, '#ffffff')
    
    # Draw border
    draw.rectangle([0, 0, 149, 149], outline=border_color, width=2)
    
    # Try to use a specific font, fallback to default if not available
    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", 14)
        small_font = ImageFont.truetype("arial.ttf", 10)
    except:
        # Use default font if system font not found
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw category label at top
    category_text = category.upper()
    try:
        bbox = draw.textbbox((0, 0), category_text, font=small_font)
        text_width = bbox[2] - bbox[0]
    except:
        # Fallback for older PIL versions
        text_width = len(category_text) * 6
    
    draw.text((75 - text_width//2, 10), category_text, fill='#666666', font=small_font)
    
    # Draw item name in center
    # Split long names into multiple lines
    words = item_name.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        try:
            bbox = draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(test_line) * 8
            
        if text_width > 130:  # Leave some margin
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
        else:
            current_line.append(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw the text lines centered
    y_start = 75 - (len(lines) * 10)
    for i, line in enumerate(lines):
        try:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(line) * 8
            
        draw.text((75 - text_width//2, y_start + i*20), line, fill='#ffffff', font=font)
    
    # Add item ID in corner
    item_id = item_name.lower().replace(' ', '_')
    draw.text((5, 130), item_id[:15], fill='#444444', font=small_font)
    
    # Save the image
    filename = f"{item_id}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath)
    
    return filename

# Generate all placeholder images
generated_files = []
item_data = {}

print("Generating placeholder images...")
print("-" * 50)

for category, item_list in items.items():
    print(f"\n{category}:")
    category_items = []
    
    for item_name in item_list:
        filename = create_placeholder_image(item_name, category)
        generated_files.append(filename)
        
        # Create item data for game use
        item_id = item_name.lower().replace(' ', '_')
        category_items.append({
            "id": item_id,
            "name": item_name,
            "category": category,
            "image": f"/item-images/{filename}",
            "rarity": "common",  # Default, can be changed later
            "description": f"A {item_name.lower()} item"
        })
        
        print(f"  [OK] {item_name} -> {filename}")
    
    item_data[category] = category_items

# Save item data as JSON for easy import into the game
json_path = os.path.join(output_dir, "item_data.json")
with open(json_path, 'w') as f:
    json.dump(item_data, f, indent=2)

print("\n" + "=" * 50)
print(f"[DONE] Generated {len(generated_files)} placeholder images")
print(f"[DIR] Saved to: {output_dir}")
print(f"[JSON] Item data saved to: {json_path}")
print("\nYou can now use these images in your game!")
print("To replace with real images later, just overwrite the files with the same names.")