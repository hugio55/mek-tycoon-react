import os
from pathlib import Path

# Get all JPG files from meks folder
meks_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\meks")
jpg_files = {f.stem for f in meks_dir.glob("*.jpg")}

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem for f in webp_dir.glob("*.webp")}

# Find missing files
missing = jpg_files - webp_files

print(f"Total JPG files in meks: {len(jpg_files)}")
print(f"Total WebP files in 750x750: {len(webp_files)}")
print(f"Missing files: {len(missing)}")
print("\nMissing Meks:")
print("=" * 30)
for mek in sorted(missing):
    print(mek)