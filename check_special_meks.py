import os
from pathlib import Path

# Get all JPG files from meks folder
meks_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\meks")
jpg_files = {f.stem for f in meks_dir.glob("*.jpg")}

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem for f in webp_dir.glob("*.webp")}

# Find missing files
missing = sorted(jpg_files - webp_files)

# Check for patterns
print("Analyzing missing files:")
print("=" * 50)

# Special numeric patterns (like 777-777-777)
numeric_patterns = []
letter_based = []

for mek in missing:
    # Check if it's a numeric pattern (digits and dashes only)
    if all(c.isdigit() or c == '-' for c in mek):
        numeric_patterns.append(mek)
    else:
        letter_based.append(mek)

print(f"\nNumeric pattern Meks missing: {len(numeric_patterns)}")
if numeric_patterns:
    for p in numeric_patterns[:10]:  # Show first 10
        print(f"  {p}")
    if len(numeric_patterns) > 10:
        print(f"  ... and {len(numeric_patterns) - 10} more")

print(f"\nLetter-based Meks missing: {len(letter_based)}")
if letter_based:
    for p in letter_based[:10]:  # Show first 10
        print(f"  {p}")
    if len(letter_based) > 10:
        print(f"  ... and {len(letter_based) - 10} more")

# Check if these exist as JPGs
print("\nVerifying these JPGs exist in source:")
for mek in missing[:5]:
    jpg_path = meks_dir / f"{mek}.jpg"
    print(f"  {mek}: {'EXISTS' if jpg_path.exists() else 'NOT FOUND'}")

# Count total files
print(f"\nTotal JPG source files: {len(jpg_files)}")
print(f"Total WebP converted files: {len(webp_files)}")
print(f"Difference: {len(jpg_files) - len(webp_files)}")