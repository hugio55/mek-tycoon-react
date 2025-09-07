import json
from pathlib import Path

# Read the mek gold rates data which has source keys
gold_rates_path = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek_gold_rates_exact.json")

source_keys = set()
if gold_rates_path.exists():
    with open(gold_rates_path, 'r') as f:
        data = json.load(f)
        for item in data:
            if 'source_key' in item:
                # Remove the -B suffix if present
                key = item['source_key']
                if key.endswith('-B'):
                    key = key[:-2]
                source_keys.add(key)

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem for f in webp_dir.glob("*.webp")}

print(f"Total source keys from metadata: {len(source_keys)}")
print(f"Total WebP files in 750x750: {len(webp_files)}")

if source_keys:
    # Find missing files
    missing = sorted(source_keys - webp_files)
    extra = sorted(webp_files - source_keys)
    
    print(f"\nMISSING WebP files (in metadata but not in folder): {len(missing)}")
    if missing:
        print("\nThe 7 missing files are:")
        for i, key in enumerate(missing, 1):
            print(f"  {i}. {key}")
    
    if extra:
        print(f"\nExtra WebP files (in folder but not in metadata): {len(extra)}")
        for i, key in enumerate(extra[:10], 1):
            print(f"  {i}. {key}")
        if len(extra) > 10:
            print(f"  ... and {len(extra) - 10} more")
    
    # Verify counts
    print(f"\nVerification:")
    print(f"  Metadata has: {len(source_keys)} Meks")
    print(f"  Folder has: {len(webp_files)} WebP files")
    print(f"  Missing: {len(missing)} files")
    print(f"  Extra: {len(extra)} files")
    print(f"  Net difference: {len(source_keys) - len(webp_files)} (should equal 7)")
else:
    print("\nError: Could not load source keys from metadata")