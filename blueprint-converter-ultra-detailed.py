import cv2
import numpy as np
from pathlib import Path
import argparse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

"""
ULTRA-DETAILED BLUEPRINT CONVERTER - AUTHENTIC TECHNICAL DRAWING STYLE

This script creates DENSE, HIGHLY DETAILED blueprints with authentic aged paper texture.

KEY IMPROVEMENTS OVER OPTIMIZED VERSION:
1. Multi-pass edge detection at varying sensitivities for maximum internal detail
2. Texture analysis to extract surface patterns and panel separations
3. Authentic paper texture overlays (grain, scratches, stains, fold lines)
4. Blueprint aging/weathering effects (edge darkening, discoloration)
5. Dense line work showing internal mechanical structure
6. Grunge texture generation for used technical drawing appearance

Reference: Gundam and spaceship technical drawings with extensive internal structure.

Usage:
    # Single image with maximum detail
    python blueprint-converter-ultra-detailed.py input.webp output.png

    # Batch process directory
    python blueprint-converter-ultra-detailed.py --batch public/mek-images/1000px --output blueprints-ultra/

    # Adjust detail intensity (0.5-2.0, default 1.0)
    python blueprint-converter-ultra-detailed.py input.webp output.png --detail-intensity 1.5
"""


def generate_paper_texture(shape, intensity=0.3):
    """
    Generate authentic aged paper texture with grain, scratches, and imperfections.

    Args:
        shape: (height, width) of texture to generate
        intensity: How strong the texture effect is (0.0-1.0)

    Returns:
        Grayscale texture map (values 0-255)
    """
    height, width = shape

    # Base paper grain - fine random noise
    grain = np.random.randint(-8, 8, (height, width), dtype=np.int16)
    grain = cv2.GaussianBlur(grain.astype(np.float32), (3, 3), 0.5)

    # Add larger-scale paper fiber patterns
    fiber_noise = np.random.randn(height // 4, width // 4).astype(np.float32)
    fiber_noise = cv2.resize(fiber_noise, (width, height), interpolation=cv2.INTER_LINEAR)
    fiber_noise = cv2.GaussianBlur(fiber_noise, (5, 5), 2.0) * 15

    # Combine base texture
    texture = grain + fiber_noise

    # Add scratches (random lines across the paper)
    scratch_layer = np.zeros((height, width), dtype=np.float32)
    num_scratches = int(20 * intensity)

    for _ in range(num_scratches):
        # Random scratch parameters
        x1, y1 = np.random.randint(0, width), np.random.randint(0, height)
        length = np.random.randint(50, min(width, height) // 2)
        angle = np.random.uniform(0, 2 * np.pi)

        x2 = int(x1 + length * np.cos(angle))
        y2 = int(y1 + length * np.sin(angle))

        # Draw scratch with varying opacity
        thickness = np.random.randint(1, 3)
        opacity = np.random.uniform(10, 30)
        cv2.line(scratch_layer, (x1, y1), (x2, y2), opacity, thickness)

    # Blur scratches slightly
    if num_scratches > 0:
        scratch_layer = cv2.GaussianBlur(scratch_layer, (3, 3), 1.0)

    texture += scratch_layer

    # Add stain/discoloration spots (circular darker regions)
    stain_layer = np.zeros((height, width), dtype=np.float32)
    num_stains = int(8 * intensity)

    for _ in range(num_stains):
        x, y = np.random.randint(0, width), np.random.randint(0, height)
        radius = np.random.randint(20, 100)
        intensity_val = np.random.uniform(-15, -5)

        # Create circular gradient stain
        Y, X = np.ogrid[:height, :width]
        dist = np.sqrt((X - x)**2 + (Y - y)**2)
        mask = np.maximum(0, 1 - dist / radius)
        stain_layer += mask * intensity_val

    texture += stain_layer

    # Add fold lines (sharp linear creases)
    fold_layer = np.zeros((height, width), dtype=np.float32)
    num_folds = int(3 * intensity)

    for _ in range(num_folds):
        # Horizontal or vertical fold
        if np.random.random() > 0.5:
            # Horizontal fold
            y = np.random.randint(height // 4, 3 * height // 4)
            fold_layer[max(0, y-1):min(height, y+2), :] = -20
        else:
            # Vertical fold
            x = np.random.randint(width // 4, 3 * width // 4)
            fold_layer[:, max(0, x-1):min(width, x+2)] = -20

    texture += fold_layer

    # Normalize to 0-255 range but centered around 0 (so it can darken or lighten)
    texture = np.clip(texture * intensity, -40, 40)

    return texture.astype(np.int16)


def add_edge_darkening(img, vignette_strength=0.3):
    """
    Add edge darkening/vignette effect for aged paper appearance.

    Args:
        img: Input BGR image
        vignette_strength: How much to darken edges (0.0-1.0)

    Returns:
        Image with darkened edges
    """
    height, width = img.shape[:2]

    # Create radial gradient from center
    center_x, center_y = width // 2, height // 2
    Y, X = np.ogrid[:height, :width]

    # Distance from center (normalized)
    max_dist = np.sqrt(center_x**2 + center_y**2)
    dist = np.sqrt((X - center_x)**2 + (Y - center_y)**2) / max_dist

    # Vignette mask (darker at edges)
    vignette = 1 - (dist ** 1.5) * vignette_strength
    vignette = np.clip(vignette, 1 - vignette_strength, 1.0)

    # Apply to all channels
    result = img.astype(np.float32)
    for i in range(3):
        result[:, :, i] *= vignette

    return result.astype(np.uint8)


def extract_ultra_detailed_edges(gray, detail_intensity=1.0):
    """
    Multi-pass edge detection system for MAXIMUM internal detail extraction.

    This creates DENSE line work by:
    1. Multiple Canny passes at different threshold levels
    2. Structured edge detection (horizontal/vertical panels)
    3. Texture/pattern detection for surface details
    4. Contour extraction for outlines
    5. Morphological operations to enhance line connectivity

    Args:
        gray: Grayscale input image
        detail_intensity: Multiplier for detail level (0.5-2.0, default 1.0)

    Returns:
        Dense binary edge map (white lines on black background)
    """
    # Stage 1: Edge-preserving smoothing
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Initialize result
    result = np.zeros_like(gray, dtype=np.float32)

    # PASS 1: High-sensitivity Canny for fine internal details
    canny_fine = cv2.Canny(smooth, 15, 60)
    result += canny_fine.astype(np.float32) * 0.8

    # PASS 2: Medium-sensitivity Canny for structural edges
    canny_medium = cv2.Canny(smooth, 30, 100)
    result += canny_medium.astype(np.float32) * 1.0

    # PASS 3: Low-sensitivity Canny for strong outlines
    canny_strong = cv2.Canny(smooth, 50, 150)
    result += canny_strong.astype(np.float32) * 1.2

    # PASS 4: Structured edge detection (panel separations)
    # Detect horizontal structures
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 1))
    morph_h = cv2.morphologyEx(smooth, cv2.MORPH_GRADIENT, kernel_h)
    _, thresh_h = cv2.threshold(morph_h, 10, 255, cv2.THRESH_BINARY)
    result += thresh_h.astype(np.float32) * 0.5

    # Detect vertical structures
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 15))
    morph_v = cv2.morphologyEx(smooth, cv2.MORPH_GRADIENT, kernel_v)
    _, thresh_v = cv2.threshold(morph_v, 10, 255, cv2.THRESH_BINARY)
    result += thresh_v.astype(np.float32) * 0.5

    # PASS 5: Texture detection with Laplacian
    laplacian = cv2.Laplacian(smooth, cv2.CV_64F, ksize=3)
    laplacian = np.abs(laplacian)
    laplacian_norm = cv2.normalize(laplacian, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, laplacian_thresh = cv2.threshold(laplacian_norm, 20, 255, cv2.THRESH_BINARY)
    result += laplacian_thresh.astype(np.float32) * 0.6

    # PASS 6: Contour-based outlines
    binary = cv2.adaptiveThreshold(
        smooth, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 2
    )
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    contour_layer = np.zeros_like(gray)
    for contour in contours:
        if cv2.contourArea(contour) >= 3:  # Very small threshold
            epsilon = 0.001 * cv2.arcLength(contour, True)  # Minimal simplification
            approx = cv2.approxPolyDP(contour, epsilon, True)
            cv2.drawContours(contour_layer, [approx], -1, 255, 1)

    result += contour_layer.astype(np.float32) * 0.9

    # PASS 7: Sobel gradients for directional edges
    sobel_x = cv2.Sobel(smooth, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(smooth, cv2.CV_64F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobel_x**2 + sobel_y**2)
    sobel_norm = cv2.normalize(sobel_mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, sobel_thresh = cv2.threshold(sobel_norm, 25, 255, cv2.THRESH_BINARY)
    result += sobel_thresh.astype(np.float32) * 0.7

    # Apply detail intensity multiplier
    result *= detail_intensity

    # Normalize to 0-255
    result = np.clip(result, 0, 255).astype(np.uint8)

    # Morphological operations to connect nearby lines and clean up
    # Dilate slightly to thicken thin lines
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    result = cv2.dilate(result, kernel_dilate, iterations=1)

    # Close gaps in lines
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel_close, iterations=1)

    # Thin back down to single-pixel lines where possible
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    result = cv2.erode(result, kernel_erode, iterations=1)

    return result


def add_blueprint_grid(img, grid_size=30, line_color=(100, 85, 18), line_thickness=1):
    """
    Add technical grid overlay with major and minor grid lines.

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


def convert_to_blueprint(input_path, output_path,
                        blueprint_style='blue',
                        use_grid=True,
                        grid_size=30,
                        detail_intensity=1.0,
                        paper_texture_strength=0.5,
                        add_aging=True,
                        verbose=True):
    """
    Convert a Mek image to ultra-detailed technical blueprint style with authentic paper texture.

    Args:
        input_path: Path to input image
        output_path: Path to save blueprint
        blueprint_style: 'blue', 'dark_blue', or 'navy'
        use_grid: Whether to add technical grid overlay
        grid_size: Spacing between grid lines in pixels
        detail_intensity: Detail extraction multiplier (0.5-2.0)
        paper_texture_strength: Paper texture intensity (0.0-1.0)
        add_aging: Whether to add edge darkening/aging effects
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

        white_bg = np.ones_like(rgb) * 255
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Convert to grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Extract edges using ultra-detailed multi-pass method
    edges = extract_ultra_detailed_edges(gray, detail_intensity=detail_intensity)

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

    # Add authentic paper texture
    if paper_texture_strength > 0:
        paper_texture = generate_paper_texture(
            (gray.shape[0], gray.shape[1]),
            intensity=paper_texture_strength
        )

        # Apply texture to all channels
        for i in range(3):
            channel = blueprint[:, :, i].astype(np.int16)
            channel += paper_texture
            blueprint[:, :, i] = np.clip(channel, 0, 255).astype(np.uint8)

    # Add technical grid overlay
    if use_grid:
        blueprint = add_blueprint_grid(
            blueprint,
            grid_size=grid_size,
            line_color=scheme['grid'],
            line_thickness=1
        )

    # Draw the ultra-detailed edge lines
    # Use addWeighted to blend lines with slight transparency for authenticity
    line_mask = edges > 50  # Threshold for line detection
    line_layer = np.zeros_like(blueprint)
    line_layer[line_mask] = scheme['lines']

    # Blend lines with background (slight transparency for aged look)
    blueprint = cv2.addWeighted(blueprint, 1.0, line_layer, 0.95, 0)

    # Apply edge darkening/aging effect
    if add_aging:
        blueprint = add_edge_darkening(blueprint, vignette_strength=0.25)

    # Very subtle final blur for anti-aliasing
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0.3)

    # Save with high quality PNG compression
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])

    if verbose:
        print(f"[OK] {Path(input_path).name} -> {Path(output_path).name}")

    return True


def batch_convert(input_dir, output_dir,
                 blueprint_style='blue',
                 use_grid=True,
                 grid_size=30,
                 detail_intensity=1.0,
                 paper_texture_strength=0.5,
                 add_aging=True,
                 max_workers=4,
                 file_pattern='*.webp'):
    """
    Batch convert all images in a directory to ultra-detailed blueprints.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    output_path.mkdir(parents=True, exist_ok=True)

    input_files = list(input_path.glob(file_pattern))

    if not input_files:
        print(f"No files matching '{file_pattern}' found in {input_dir}")
        return

    print(f"Found {len(input_files)} images to process")
    print(f"Using {max_workers} threads")
    print(f"Style: {blueprint_style}, Detail: {detail_intensity:.1f}x, Paper Texture: {paper_texture_strength:.1f}")
    print("="*80)

    start_time = time.time()
    success_count = 0
    failed_count = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for input_file in input_files:
            output_file = output_path / f"{input_file.stem}-blueprint-ultra.png"

            future = executor.submit(
                convert_to_blueprint,
                input_file,
                output_file,
                blueprint_style=blueprint_style,
                use_grid=use_grid,
                grid_size=grid_size,
                detail_intensity=detail_intensity,
                paper_texture_strength=paper_texture_strength,
                add_aging=add_aging,
                verbose=False
            )
            futures[future] = input_file.name

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

            print(f"[{i:4d}/{len(input_files)}] {status} {filename}")

    elapsed = time.time() - start_time

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
        description='Convert Mek images to ultra-detailed technical blueprints with authentic paper texture',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert single image with maximum detail
  python blueprint-converter-ultra-detailed.py input.webp output.png

  # Batch convert with high detail intensity
  python blueprint-converter-ultra-detailed.py --batch public/mek-images/1000px --output-dir blueprints-ultra/

  # Maximum detail and strong paper texture
  python blueprint-converter-ultra-detailed.py input.webp output.png --detail-intensity 1.5 --paper-texture 0.8

  # Clean look (minimal texture, no aging)
  python blueprint-converter-ultra-detailed.py input.webp output.png --paper-texture 0.1 --no-aging
        """
    )

    # Single file mode
    parser.add_argument('input', nargs='?', help='Input image path')
    parser.add_argument('output_file', nargs='?', help='Output blueprint path')

    # Batch mode
    parser.add_argument('--batch', help='Batch process directory')
    parser.add_argument('--output-dir', dest='output_dir', help='Output directory for batch mode')
    parser.add_argument('--pattern', default='*.webp', help='File pattern for batch mode (default: *.webp)')
    parser.add_argument('--threads', type=int, default=4, help='Number of parallel threads')

    # Style options
    parser.add_argument('--style', choices=['blue', 'dark_blue', 'navy'],
                       default='blue', help='Blueprint color scheme')
    parser.add_argument('--grid-size', type=int, default=30,
                       help='Grid spacing in pixels (default: 30)')
    parser.add_argument('--no-grid', action='store_true',
                       help='Disable grid overlay')

    # Detail options
    parser.add_argument('--detail-intensity', type=float, default=1.0,
                       help='Detail extraction multiplier (0.5-2.0, default: 1.0)')
    parser.add_argument('--paper-texture', type=float, default=0.5,
                       help='Paper texture strength (0.0-1.0, default: 0.5)')
    parser.add_argument('--no-aging', action='store_true',
                       help='Disable edge darkening/aging effects')

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
            detail_intensity=args.detail_intensity,
            paper_texture_strength=args.paper_texture,
            add_aging=not args.no_aging,
            max_workers=args.threads,
            file_pattern=args.pattern
        )

    # Single file mode
    elif args.input and args.output_file:
        print("Converting to ultra-detailed blueprint...")
        success = convert_to_blueprint(
            args.input,
            args.output_file,
            blueprint_style=args.style,
            use_grid=not args.no_grid,
            grid_size=args.grid_size,
            detail_intensity=args.detail_intensity,
            paper_texture_strength=args.paper_texture,
            add_aging=not args.no_aging,
            verbose=True
        )

        if success:
            print(f"Ultra-detailed blueprint saved to: {args.output_file}")
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
