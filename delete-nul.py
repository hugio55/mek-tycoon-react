from pathlib import Path
import os

folder = Path(r'C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\essence-images\named-bottles 1k')

# List all items
all_items = list(folder.iterdir())
print(f'Total items found: {len(all_items)}')

# Filter PNG files
png_files = [f for f in all_items if f.suffix == '.png']
print(f'PNG files: {len(png_files)}')

# Find non-PNG items
non_png = [f for f in all_items if f.suffix != '.png']
print(f'Non-PNG items: {len(non_png)}')
for item in non_png:
    print(f'  - {item.name}')

# Try extended path syntax
nul_path = folder / 'nul'
extended_path = Path('\\\\?\\' + str(nul_path.absolute()))
print(f'\nTrying to delete: {extended_path}')

try:
    extended_path.unlink()
    print('SUCCESS: Deleted nul file!')
except FileNotFoundError:
    print('File not found with extended path')
except PermissionError:
    print('Permission denied - nul is a device')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
