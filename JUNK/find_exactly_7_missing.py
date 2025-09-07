import json
from pathlib import Path

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = list(webp_dir.glob("*.webp"))

print(f"Total WebP files in 750x750: {len(webp_files)}")
print(f"Expected: 4000")
print(f"Missing: {4000 - len(webp_files)}")

# Since we know there are 3993 files and we need 4000, let's verify
# Check for specific known special Meks
special_meks = [
    "000-000-000",  # Genesis (previously 101-010-101)
    "111-111-111",
    "222-222-222",
    "333-333-333",
    "444-444-444",
    "555-555-555",
    "666-666-666",
    "777-777-777",
    "888-888-888",
    "999-999-999"
]

print("\nChecking special Meks:")
for mek in special_meks:
    exists = (webp_dir / f"{mek}.webp").exists()
    print(f"  {mek}: {'EXISTS' if exists else 'MISSING'}")

# Try to identify what the 7 missing files might be
# We have 3993 files, need 4000
print(f"\nNeed to find {4000 - len(webp_files)} missing files")

# Get a sorted list of all file names
all_names = sorted([f.stem for f in webp_files])

# Check if there's a pattern in what's missing
print("\nFirst 10 files:")
for name in all_names[:10]:
    print(f"  {name}")

print("\nLast 10 files:")
for name in all_names[-10:]:
    print(f"  {name}")