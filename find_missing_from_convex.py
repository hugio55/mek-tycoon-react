import json
from pathlib import Path

# Read the Convex meks data
convex_data_path = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\convex_meks_data.json")

# First, let's try to find where the Convex data might be stored
# Check if there's a local Convex data export
if convex_data_path.exists():
    with open(convex_data_path, 'r') as f:
        meks_data = json.load(f)
    source_keys = {mek.get('assetId', '').replace('Mek', '') for mek in meks_data if mek.get('assetId')}
else:
    # Try to find the data from any JSON files that might contain mek data
    print("Looking for mek data files...")
    
    # Check for mek data in various possible locations
    possible_paths = [
        Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\meks_data.json"),
        Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\complete_mek_data.json"),
        Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek_data_complete.json"),
        Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\all_meks_data.json"),
    ]
    
    source_keys = set()
    for path in possible_paths:
        if path.exists():
            print(f"Found data file: {path}")
            with open(path, 'r') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if 'assetId' in item:
                            key = item['assetId'].replace('Mek', '')
                            source_keys.add(key)
                        elif 'source_key' in item:
                            source_keys.add(item['source_key'])
                elif isinstance(data, dict):
                    for key, value in data.items():
                        if key.startswith('Mek'):
                            source_keys.add(key.replace('Mek', ''))
                        else:
                            source_keys.add(key)
            break

if not source_keys:
    print("No mek data found. Searching for JSON files with mek data...")
    # Search for any JSON files that might contain the data
    json_files = list(Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon").glob("*mek*.json"))
    for jf in json_files[:5]:  # Check first 5 files
        print(f"Checking {jf.name}...")
        try:
            with open(jf, 'r') as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 100:  # Likely mek data
                    for item in data[:10]:  # Check first 10 items
                        if isinstance(item, dict):
                            print(f"  Sample keys: {list(item.keys())[:5]}")
                            break
        except:
            pass

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem for f in webp_dir.glob("*.webp")}

print(f"\nTotal source keys from metadata: {len(source_keys)}")
print(f"Total WebP files in 750x750: {len(webp_files)}")

if source_keys:
    # Find missing files
    missing = sorted(source_keys - webp_files)
    extra = sorted(webp_files - source_keys)
    
    print(f"\nMissing WebP files (in metadata but not in folder): {len(missing)}")
    if missing:
        for i, key in enumerate(missing[:20], 1):
            print(f"  {i}. {key}")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")
    
    print(f"\nExtra WebP files (in folder but not in metadata): {len(extra)}")
    if extra:
        for i, key in enumerate(extra[:20], 1):
            print(f"  {i}. {key}")
        if len(extra) > 20:
            print(f"  ... and {len(extra) - 20} more")