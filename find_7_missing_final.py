from pathlib import Path

# Get all JPG files from meks folder
meks_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\meks")
jpg_files = {f.stem.lower() for f in meks_dir.glob("*.jpg")}

# Get all WebP files from 750x750 folder  
webp_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")
webp_files = {f.stem.lower() for f in webp_dir.glob("*.webp")}

# Find missing files (JPGs without corresponding WebP)
missing = sorted(jpg_files - webp_files)

print(f"Total JPG files in /meks: {len(jpg_files)}")
print(f"Total WebP files in /750x750: {len(webp_files)}")
print(f"Missing WebP files: {len(missing)}")

if missing:
    print("\nThe 7 missing WebP files are:")
    for i, mek in enumerate(missing, 1):
        # Check if the JPG exists 
        jpg_path = meks_dir / f"{mek}.jpg"
        # Try both lowercase and original case
        if not jpg_path.exists():
            # Try with different case variations
            for jpg in meks_dir.glob("*.jpg"):
                if jpg.stem.lower() == mek:
                    jpg_path = jpg
                    break
        
        print(f"  {i}. {mek} (JPG exists: {jpg_path.exists()})")
        
print("\nThese files exist as JPGs but don't have corresponding WebP conversions in the 750x750 folder.")