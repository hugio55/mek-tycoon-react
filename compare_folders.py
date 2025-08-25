from pathlib import Path

# Count files in both folders
folder_400 = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\400x400")
folder_750 = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750")

webp_400 = list(folder_400.glob("*.webp"))
webp_750 = list(folder_750.glob("*.webp"))

print(f"400x400 folder: {len(webp_400)} files")
print(f"750x750 folder: {len(webp_750)} files")

# Get the file names (without path)
names_400 = {f.stem for f in webp_400}
names_750 = {f.stem for f in webp_750}

# Find missing in 750 (present in 400 but not in 750)
missing_in_750 = sorted(names_400 - names_750)
missing_in_400 = sorted(names_750 - names_400)

if missing_in_750:
    print(f"\nFiles in 400x400 but missing in 750x750: {len(missing_in_750)}")
    for name in missing_in_750[:10]:
        print(f"  - {name}")
    if len(missing_in_750) > 10:
        print(f"  ... and {len(missing_in_750) - 10} more")

if missing_in_400:
    print(f"\nFiles in 750x750 but missing in 400x400: {len(missing_in_400)}")
    for name in missing_in_400[:10]:
        print(f"  - {name}")
    if len(missing_in_400) > 10:
        print(f"  ... and {len(missing_in_400) - 10} more")