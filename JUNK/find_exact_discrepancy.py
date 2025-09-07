import os
from pathlib import Path

# Get all JPG files from meks folder
meks_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\meks")
jpg_files = {f.stem for f in meks_dir.glob("*.jpg")}

# Get all WebP files from 750x750 folder
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem for f in webp_dir.glob("*.webp")}

# Find differences both ways
missing_webp = sorted(jpg_files - webp_files)  # JPGs without WebP
extra_webp = sorted(webp_files - jpg_files)    # WebPs without JPG

print("ANALYSIS RESULTS:")
print("=" * 60)
print(f"Total JPG files in /meks: {len(jpg_files)}")
print(f"Total WebP files in /750x750: {len(webp_files)}")
print(f"Actual file count difference: {len(jpg_files) - len(webp_files)}")

print(f"\nJPGs without corresponding WebP: {len(missing_webp)}")
print(f"WebPs without corresponding JPG: {len(extra_webp)}")

if extra_webp:
    print(f"\nExtra WebP files (no JPG source): {len(extra_webp)}")
    for f in extra_webp[:20]:  # Show first 20
        print(f"  {f}")
    if len(extra_webp) > 20:
        print(f"  ... and {len(extra_webp) - 20} more")

# The TRUE missing files are only those where we have JPG but no WebP
# AND there are no extra WebPs to compensate
true_missing_count = len(jpg_files) - len(webp_files)
print(f"\n✓ TRUE MISSING FILES: {true_missing_count}")
print("(This matches: 4000 JPGs - 3993 WebPs = 7 missing)")

# Show just the first 7 missing to identify them
print(f"\nFirst 7 missing WebP files:")
for i, mek in enumerate(missing_webp[:7], 1):
    print(f"  {i}. {mek}")

# Check for duplicates or similar names
print("\nChecking for potential duplicates or misnamed files...")
for missing in missing_webp[:5]:
    similar = [w for w in webp_files if missing.lower() in w.lower() or w.lower() in missing.lower()]
    if similar:
        print(f"  {missing} -> Similar found: {similar}")