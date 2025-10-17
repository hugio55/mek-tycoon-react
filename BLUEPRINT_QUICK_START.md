# Blueprint Converter - Quick Start Guide

## TL;DR

**Use the NEW ultra-detailed version for production blueprints:**
```bash
python blueprint-converter-ultra-detailed.py input.webp output.png
```

**Original version still available for fast batch processing:**
```bash
python blueprint-converter-optimized.py input.webp output.png
```

---

## What's Different?

### Original (blueprint-converter-optimized.py)
- Fast (~0.32s per image)
- Clean outlines
- Minimal texture
- Good for quick testing

### Ultra (blueprint-converter-ultra-detailed.py) ⭐ RECOMMENDED
- Slower (~0.8-1.2s per image)
- **DENSE internal detail** (7-pass edge detection)
- **Authentic paper texture** (grain, scratches, stains, folds)
- **Aged appearance** (edge darkening, weathering)
- Professional technical drawing quality

---

## Common Use Cases

### 1. Single High-Quality Blueprint
```bash
python blueprint-converter-ultra-detailed.py \
  "public/mek-images/1000px/aa1-aa4-gh1.webp" \
  "output/aa1-aa4-gh1-blueprint.png"
```

### 2. Maximum Detail + Strong Aging
```bash
python blueprint-converter-ultra-detailed.py input.webp output.png \
  --detail-intensity 1.5 \
  --paper-texture 0.8
```

### 3. Clean Look (Less Texture)
```bash
python blueprint-converter-ultra-detailed.py input.webp output.png \
  --detail-intensity 1.2 \
  --paper-texture 0.2 \
  --no-aging
```

### 4. Batch Process Directory
```bash
python blueprint-converter-ultra-detailed.py \
  --batch "public/mek-images/1000px" \
  --output-dir "blueprints-ultra" \
  --detail-intensity 1.3 \
  --paper-texture 0.6 \
  --threads 8
```

### 5. Dark Navy Style
```bash
python blueprint-converter-ultra-detailed.py input.webp output.png \
  --style navy \
  --detail-intensity 1.4
```

---

## Parameter Guide

### Detail Intensity (`--detail-intensity`)
Controls how much internal structure is extracted:
- `0.8` - Subtle (cleaner, less busy)
- `1.0` - **Default** (balanced)
- `1.3` - High detail (recommended for production)
- `1.5` - Maximum detail (dense line work)

### Paper Texture (`--paper-texture`)
Controls aging/weathering intensity:
- `0.2` - Light (mostly clean)
- `0.5` - **Default** (authentic aged look)
- `0.7` - Heavy (well-used document)
- `1.0` - Extreme (vintage/archival)

### Blueprint Style (`--style`)
Background color scheme:
- `blue` - **Default** Classic blueprint blue
- `dark_blue` - Darker blue
- `navy` - Deep navy blue

### Grid Size (`--grid-size`)
Technical grid spacing in pixels:
- `20` - Dense grid (engineering drawings)
- `30` - **Default** Standard grid
- `40` - Sparse grid (architectural)

### Other Options
- `--no-grid` - Disable grid overlay entirely
- `--no-aging` - Disable edge darkening/vignette
- `--threads N` - Parallel threads for batch mode

---

## Batch Processing Tips

### Process Entire Directory
```bash
python blueprint-converter-ultra-detailed.py \
  --batch "public/mek-images/1000px" \
  --output-dir "blueprints" \
  --threads 8
```

### Filter Specific Files
```bash
python blueprint-converter-ultra-detailed.py \
  --batch "public/mek-images/1000px" \
  --output-dir "blueprints" \
  --pattern "aa1-*.webp" \
  --threads 4
```

### Different File Types
```bash
# For PNG files
python blueprint-converter-ultra-detailed.py \
  --batch "input-pngs/" \
  --output-dir "output/" \
  --pattern "*.png"

# For JPEG files
python blueprint-converter-ultra-detailed.py \
  --batch "input-jpgs/" \
  --output-dir "output/" \
  --pattern "*.jpg"
```

---

## Visual Quality Comparison

**See comparison images:**
- `comparison-000.png` - Original vs Ultra side-by-side
- `comparison-111.png` - Second example

**Key improvements visible:**
1. Internal mechanical structure clearly visible
2. Panel separations and compartments shown
3. Surface texture and details extracted
4. Authentic aged paper appearance
5. Professional technical drawing aesthetic

---

## Performance

### Processing Time
- **Original**: ~0.32s per image
- **Ultra**: ~0.8-1.2s per image (2.5-3.75x slower)

### Batch Processing Example
1000 images at 1.0s average = ~17 minutes (8 threads)

---

## Troubleshooting

### Images too sparse/clean
```bash
# Increase detail intensity
--detail-intensity 1.5
```

### Too noisy/busy
```bash
# Reduce detail intensity
--detail-intensity 0.8
```

### Paper texture too strong
```bash
# Reduce texture
--paper-texture 0.3
```

### Want pristine look (no aging)
```bash
# Minimal texture, no aging
--paper-texture 0.1 --no-aging
```

---

## File Organization

```
blueprint-converter-optimized.py      # Original fast version
blueprint-converter-ultra-detailed.py # NEW high-quality version ⭐
compare-blueprints.py                 # Side-by-side comparison tool
BLUEPRINT_UPGRADE_SUMMARY.md          # Technical details
BLUEPRINT_QUICK_START.md              # This guide
```

---

## Examples

### Standard Production Blueprint
```bash
python blueprint-converter-ultra-detailed.py \
  "mek.webp" \
  "mek-blueprint.png" \
  --detail-intensity 1.3 \
  --paper-texture 0.6
```

### Clean Technical Drawing (No Weathering)
```bash
python blueprint-converter-ultra-detailed.py \
  "mek.webp" \
  "mek-blueprint.png" \
  --detail-intensity 1.2 \
  --paper-texture 0.2 \
  --no-aging \
  --style navy
```

### Maximum Detail Showcase
```bash
python blueprint-converter-ultra-detailed.py \
  "mek.webp" \
  "mek-blueprint.png" \
  --detail-intensity 1.8 \
  --paper-texture 0.7 \
  --grid-size 25
```

---

## Recommendation

**For production/final outputs:** Use ultra-detailed version with these settings:
```bash
--detail-intensity 1.3
--paper-texture 0.6
--style blue (or navy)
```

This provides excellent detail density with authentic aged blueprint appearance.
