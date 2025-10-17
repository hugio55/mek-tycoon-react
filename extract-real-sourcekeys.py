import json
import os
from collections import defaultdict

# Load allMeksData.json to get variation names
with open('convex/allMeksData.json', 'r', encoding='utf-8') as f:
    all_meks = json.load(f)

# Get all Mek image filenames
image_folder = r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\150px'
image_files = [f for f in os.listdir(image_folder) if f.endswith('.webp')]

# Build mapping of variation names to source keys
head_map = defaultdict(set)
body_map = defaultdict(set)
item_map = defaultdict(set)

for mek in all_meks:
    head_var = mek.get('headVariation')
    body_var = mek.get('bodyVariation')
    item_var = mek.get('itemVariation')

    # Find corresponding image file (case insensitive search)
    asset_id = mek.get('assetId', '')

    # Try to find image by searching for matching filename patterns
    # We need to reverse-engineer from the actual images

# Alternative approach: Extract from image filenames directly
print("Extracting source keys from 4000 Mek image files...")
head_keys = set()
body_keys = set()
item_keys = set()

for img_file in image_files:
    if img_file.count('-') == 2:
        # Format: xxx-xxx-xxx.webp
        parts = img_file.replace('.webp', '').split('-')
        if len(parts) == 3:
            head_key, body_key, item_key = parts
            head_keys.add(head_key.upper())
            body_keys.add(body_key.upper())
            item_keys.add(item_key.upper())

source_keys = {'head_keys': head_keys, 'body_keys': body_keys, 'item_keys': item_keys}

print(f"Found {len(source_keys['head_keys'])} unique head keys")
print(f"Found {len(source_keys['body_keys'])} unique body keys")
print(f"Found {len(source_keys['item_keys'])} unique item keys")

# Now let's try to match variations to source keys by cross-referencing
# We'll need to find a Mek that has "Paul Ultimate" and extract its source key

print("\nSearching for Ultimate variations in actual Meks...")
ultimate_meks = []
for mek in all_meks:
    if ('Ultimate' in mek.get('headVariation', '') or
        'Ultimate' in mek.get('bodyVariation', '') or
        'Ultimate' in mek.get('itemVariation', '')):
        ultimate_meks.append({
            'assetId': mek.get('assetId'),
            'assetName': mek.get('assetName'),
            'head': mek.get('headVariation'),
            'body': mek.get('bodyVariation'),
            'item': mek.get('itemVariation')
        })

print(f"\nFound {len(ultimate_meks)} Meks with Ultimate variations:")
for mek in ultimate_meks[:10]:
    print(f"  {mek['assetName']}: head={mek['head']}, body={mek['body']}, item={mek['item']}")

# Now check if iconUrl contains the source key
print("\nChecking iconUrls for source keys...")
for mek in ultimate_meks[:5]:
    icon_url = all_meks[int(mek['assetId'])-1].get('iconUrl', '')
    print(f"  {mek['assetName']}: {icon_url}")
