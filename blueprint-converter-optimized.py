import cv2
import numpy as np
from pathlib import Path
import argparse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

"""
OPTIMIZED BLUEPRINT CONVERTER - PRODUCTION VERSION

This script converts Mek robot images into professional technical drawing/blueprint style.

Winner Method: Enhanced Contour-Based Edge Detection
- Creates clean, continuous lines like architectural drawings
- Preserves both outlines and internal structural details
- Produces professional-quality technical drawing aesthetic

Performance: ~0.32s per image (single-threaded), supports multi-threading for batch processing

Usage:
    # Single image
    python blueprint-converter-optimized.py input.webp output.png

    # Batch process directory
    python blueprint-converter-optimized.py --batch public/mek-images/1000px --output blueprints/

    # Custom parameters
    python blueprint-converter-optimized.py input.webp output.png --grid-size 25 --style dark_blue
"""


def add_blueprint_grid(img, grid_size=30, line_color=(100, 85, 18), line_thickness=1):
    """
    Add technical grid overlay with major and minor grid lines

    Args:
        img: Blueprint image
        grid_size: Spacing between minor grid lines (pixels)
        line_color: RGB color for grid lines
        line_thickness: Thickness of grid lines
    """
    height, width = img.shape[:2]

    # Minor grid lines (every grid_size pixels)
    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)

    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    # Major grid lines (every 5 intervals) - slightly brighter
    major_grid = grid_size * 5
    major_color = (
        min(255, int(line_color[0] * 1.3)),
        min(255, int(line_color[1] * 1.3)),
        min(255, int(line_color[2] * 1.3))
    )

    for x in range(0, width, major_grid):
        cv2.line(img, (x, 0), (x, height), major_color, line_thickness + 1)

    for y in range(0, height, major_grid):
        cv2.line(img, (0, y), (width, y), major_color, line_thickness + 1)

    return img


def extract_clean_edges(gray, detail_level='high'):
    """
    Enhanced contour-based edge detection with adaptive threshold

    This method produces the cleanest, most continuous lines by:
    1. Using bilateral filtering to smooth while preserving edges
    2. Adaptive thresholding for clean contour extraction
    3. Contour approximation for continuous lines
    4. Canny edge detection for internal structural details
    5. Light morphological operations for line refinement

    Args:
        gray: Grayscale input image
        detail_level: 'high', 'medium', or 'low' - controls detail preservation

    Returns:
        Binary edge map (white lines on black background)
    """
    # Stage 1: Edge-preserving smoothing
    # Bilateral filter removes noise while keeping edges sharp
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Stage 2: Adaptive thresholding for contour extraction
    # This creates clean regions for contour finding
    binary = cv2.adaptiveThreshold(
        smooth, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 2
    )

    # Stage 3: Find contours (outline detection)
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create blank canvas for drawing
    result = np.zeros_like(gray)

    # Stage 4: Draw contours with approximation for clean lines
    # Epsilon controls how much to simplify the contours
    detail_settings = {
        'high': 0.002,    # More points = more detail
        'medium': 0.003,
        'low': 0.005      # Fewer points = cleaner but less detail
    }
    epsilon_factor = detail_settings.get(detail_level, 0.003)

    for contour in contours:
        # Skip tiny contours (noise)
        if cv2.contourArea(contour) < 5:
            continue

        # Approximate contour to reduce jagged edges
        epsilon = epsilon_factor * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        # Draw the simplified contour
        cv2.drawContours(result, [approx], -1, 255, 1)

    # Stage 5: Add Canny edges for internal structural details
    # Lower thresholds capture fine internal structure
    canny_thresholds = {
        'high': (20, 80),
        'medium': (30, 100),
        'low': (40, 120)
    }
    low_thresh, high_thresh = canny_thresholds.get(detail_level, (30, 100))
    edges = cv2.Canny(smooth, low_thresh, high_thresh)

    # Blend contours and edges
    # Contours provide clean outlines, Canny adds internal detail
    result = cv2.addWeighted(result, 0.7, edges, 0.4, 0)

    # Stage 6: Light morphological closing to connect nearby lines
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=1)

    return result


def convert_to_blueprint(input_path, output_path,
                        blueprint_style='blue',
                        use_grid=True,
                        grid_size=30,
                        detail_level='high',
                        verbose=True):
    """
    Convert a Mek image to technical blueprint style

    Args:
        input_path: Path to input image (webp, png, jpg, etc.)
        output_path: Path to save blueprint PNG
        blueprint_style: 'blue' (classic), 'dark_blue', or 'navy'
        use_grid: Whether to add technical grid overlay
        grid_size: Spacing between grid lines in pixels
        detail_level: 'high', 'medium', or 'low'
        verbose: Print progress messages

    Returns:
        True if successful, False otherwise
    """
    # Load image
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        if verbose:
            print(f"ERROR: Could not read {input_path}")
        return False

    # Handle transparency (replace with white background)
    if len(img.shape) == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]

        # Create white background
        white_bg = np.ones_like(rgb) * 255

        # Blend using alpha channel
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Convert to grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Extract edges using optimized method
    edges = extract_clean_edges(gray, detail_level=detail_level)

    # Create blueprint background
    blueprint = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)

    # Blueprint color schemes
    color_schemes = {
        'blue': {
            'background': [180, 100, 15],     # Classic blueprint blue (BGR)
            'lines': [255, 255, 255],          # White lines
            'grid': (100, 85, 18)              # Slightly darker blue for grid
        },
        'dark_blue': {
            'background': [140, 75, 12],
            'lines': [255, 255, 255],
            'grid': (90, 60, 15)
        },
        'navy': {
            'background': [100, 50, 8],        # Deep navy blue
            'lines': [255, 255, 255],
            'grid': (80, 40, 10)
        }
    }

    scheme = color_schemes.get(blueprint_style, color_schemes['blue'])

    # Fill background
    blueprint[:, :] = scheme['background']

    # Add technical grid overlay
    if use_grid:
        blueprint = add_blueprint_grid(
            blueprint,
            grid_size=grid_size,
            line_color=scheme['grid'],
            line_thickness=1
        )

    # Draw the edge lines
    blueprint[edges > 127] = scheme['lines']

    # Subtle Gaussian blur to smooth jagged edges (anti-aliasing)
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0.5)

    # Add very subtle paper texture noise
    noise = np.random.randint(-3, 3, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Save with high quality PNG compression
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])

    if verbose:
        print(f"[OK] {Path(input_path).name} -> {Path(output_path).name}")

    return True


def batch_convert(input_dir, output_dir,
                 blueprint_style='blue',
                 use_grid=True,
                 grid_size=30,
                 detail_level='high',
                 max_workers=4,
                 file_pattern='*.webp'):
    """
    Batch convert all images in a directory

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save blueprints
        blueprint_style: Blueprint color scheme
        use_grid: Whether to add grid
        grid_size: Grid spacing
        detail_level: Detail preservation level
        max_workers: Number of parallel threads
        file_pattern: Glob pattern for input files
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    # Create output directory
    output_path.mkdir(parents=True, exist_ok=True)

    # Find all matching files
    input_files = list(input_path.glob(file_pattern))

    if not input_files:
        print(f"No files matching '{file_pattern}' found in {input_dir}")
        return

    print(f"Found {len(input_files)} images to process")
    print(f"Using {max_workers} threads")
    print(f"Style: {blueprint_style}, Grid: {use_grid}, Detail: {detail_level}")
    print("="*80)

    start_time = time.time()
    success_count = 0
    failed_count = 0

    # Process images in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        futures = {}
        for input_file in input_files:
            output_file = output_path / f"{input_file.stem}-blueprint.png"

            future = executor.submit(
                convert_to_blueprint,
                input_file,
                output_file,
                blueprint_style=blueprint_style,
                use_grid=use_grid,
                grid_size=grid_size,
                detail_level=detail_level,
                verbose=False  # Disable individual messages for batch
            )
            futures[future] = input_file.name

        # Process completed tasks
        for i, future in enumerate(as_completed(futures), 1):
            filename = futures[future]

            try:
                result = future.result()
                if result:
                    success_count += 1
                    status = "OK"
                else:
                    failed_count += 1
                    status = "FAIL"
            except Exception as e:
                failed_count += 1
                status = "FAIL"
                print(f"Error processing {filename}: {e}")

            # Progress indicator
            print(f"[{i:4d}/{len(input_files)}] {status} {filename}")

    elapsed = time.time() - start_time

    # Summary
    print("="*80)
    print(f"BATCH CONVERSION COMPLETE")
    print(f"  Successful: {success_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Total time: {elapsed:.1f}s")
    print(f"  Avg per image: {elapsed/len(input_files):.2f}s")
    print(f"  Output directory: {output_path}")


def main():
    """Command-line interface"""
    parser = argparse.ArgumentParser(
        description='Convert Mek images to technical blueprint style',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert single image
  python blueprint-converter-optimized.py input.webp output.png

  # Batch convert directory
  python blueprint-converter-optimized.py --batch public/mek-images/1000px --output-dir blueprints/

  # Custom parameters
  python blueprint-converter-optimized.py input.webp output.png --style dark_blue --grid-size 25

  # High-detail conversion without grid
  python blueprint-converter-optimized.py input.webp output.png --no-grid --detail high

  # Fast batch conversion (lower detail, more threads)
  python blueprint-converter-optimized.py --batch input/ --output-dir output/ --detail low --threads 8
        """
    )

    # Single file mode
    parser.add_argument('input', nargs='?', help='Input image path')
    parser.add_argument('output_file', nargs='?', help='Output blueprint path')

    # Batch mode
    parser.add_argument('--batch', help='Batch process directory')
    parser.add_argument('--output-dir', dest='output_dir', help='Output directory for batch mode')
    parser.add_argument('--pattern', default='*.webp', help='File pattern for batch mode (default: *.webp)')
    parser.add_argument('--threads', type=int, default=4, help='Number of parallel threads for batch mode')

    # Style options
    parser.add_argument('--style', choices=['blue', 'dark_blue', 'navy'],
                       default='blue', help='Blueprint color scheme')
    parser.add_argument('--grid-size', type=int, default=30,
                       help='Grid spacing in pixels (default: 30)')
    parser.add_argument('--no-grid', action='store_true',
                       help='Disable grid overlay')
    parser.add_argument('--detail', choices=['high', 'medium', 'low'],
                       default='high', help='Detail level (default: high)')

    args = parser.parse_args()

    # Batch mode
    if args.batch:
        if not args.output_dir:
            print("ERROR: --output-dir is required for batch mode")
            return 1

        batch_convert(
            args.batch,
            args.output_dir,
            blueprint_style=args.style,
            use_grid=not args.no_grid,
            grid_size=args.grid_size,
            detail_level=args.detail,
            max_workers=args.threads,
            file_pattern=args.pattern
        )

    # Single file mode
    elif args.input and args.output_file:
        print("Converting single image...")
        success = convert_to_blueprint(
            args.input,
            args.output_file,
            blueprint_style=args.style,
            use_grid=not args.no_grid,
            grid_size=args.grid_size,
            detail_level=args.detail,
            verbose=True
        )

        if success:
            print(f"Blueprint saved to: {args.output_file}")
            return 0
        else:
            print("Conversion failed")
            return 1

    else:
        parser.print_help()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
