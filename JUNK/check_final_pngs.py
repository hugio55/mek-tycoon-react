from pathlib import Path
import json

# Check the FINAL PNGS folder
final_pngs_dir = Path(r"F:\Dropbox\Dropbox\rgb\c4d\NFT\MEKANISM\MEK PFPS\FINAL PNGS")

# Get all files
all_files = list(final_pngs_dir.glob("*"))
png_files = list(final_pngs_dir.glob("*.png"))
jpg_files = list(final_pngs_dir.glob("*.jpg"))
jpeg_files = list(final_pngs_dir.glob("*.jpeg"))

print("FINAL PNGS Folder Analysis:")
print("=" * 50)
print(f"Total files: {len(all_files)}")
print(f"PNG files: {len(png_files)}")
print(f"JPG files: {len(jpg_files)}")
print(f"JPEG files: {len(jpeg_files)}")

# Check for non-image files
other_files = [f for f in all_files if f.suffix.lower() not in ['.png', '.jpg', '.jpeg']]
if other_files:
    print(f"\nOther files found: {len(other_files)}")
    for f in other_files[:10]:
        print(f"  - {f.name}")

# Check for JPEG files (should be PNG)
if jpeg_files:
    print(f"\nJPEG files that should be PNG:")
    for f in jpeg_files:
        print(f"  - {f.name}")

# Check for duplicate names with different extensions
names = {}
for f in all_files:
    stem = f.stem.lower()
    if stem not in names:
        names[stem] = []
    names[stem].append(f.name)

duplicates = {k: v for k, v in names.items() if len(v) > 1}
if duplicates:
    print(f"\nDuplicate names with different extensions: {len(duplicates)}")
    for stem, files in list(duplicates.items())[:10]:
        print(f"  {stem}: {files}")

# Check for naming anomalies
print("\nNaming anomalies:")
for f in png_files:
    name = f.stem
    # Check for standard pattern: xxx-xxx-xxx where x is letters/numbers
    parts = name.split('-')
    if len(parts) != 3:
        print(f"  Wrong number of parts: {name}")
    elif name == "ae1-bf1-nm":  # Known issue - missing number
        print(f"  Missing number suffix: {name} (should be nm1)")
    elif "lg" in name.lower() and "Lg" not in name:  # Check for lowercase lg
        print(f"  Lowercase 'lg': {name}")

# Expected count
print(f"\nExpected: 4000 PNG files")
print(f"Actual: {len(png_files)} PNG files")
print(f"Difference: {4000 - len(png_files)}")

# If we're missing files, try to load metadata to compare
gold_rates_path = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek_gold_rates_exact.json")
if gold_rates_path.exists() and len(png_files) != 4000:
    with open(gold_rates_path, 'r') as f:
        data = json.load(f)
        source_keys = set()
        for item in data:
            if 'source_key' in item:
                # Remove the -B suffix if present
                key = item['source_key']
                if key.endswith('-B'):
                    key = key[:-2]
                source_keys.add(key.lower())
    
    # Get PNG file names
    png_names = {f.stem.lower() for f in png_files}
    
    # Find missing
    missing = sorted(source_keys - png_names)
    extra = sorted(png_names - source_keys)
    
    if missing:
        print(f"\nMissing PNG files (in metadata but not in folder): {len(missing)}")
        for name in missing[:20]:
            print(f"  - {name}")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")
    
    if extra:
        print(f"\nExtra PNG files (in folder but not in metadata): {len(extra)}")
        for name in extra[:20]:
            print(f"  - {name}")
        if len(extra) > 20:
            print(f"  ... and {len(extra) - 20} more")