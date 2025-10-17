"""
Architectural Sketch Converter - Line Segment with Overshoot Method

This implementation creates authentic hand-drawn technical drawings by:
1. Detecting individual line segments using HoughLinesP
2. Extending each segment at both endpoints (5-15px overshoot)
3. Drawing segments individually to create visible overshoot at intersections
4. Adding technical drawing elements (grid, corner marks)

The result mimics how architects sketch - where the pencil naturally overshoots
at corners and intersections, creating that characteristic hand-drawn quality.

Author: Computer Vision Specialist
Date: 2025-10-13
"""

import cv2
import numpy as np
import random
from typing import Tuple, List, Optional

# Color constants (BGR format for OpenCV)
YELLOW = (23, 182, 250)  # #fab617 in BGR
BLACK = (0, 0, 0)
DARK_GRAY = (30, 30, 30)
GRID_GRAY = (40, 40, 40)


def create_technical_background(height: int, width: int, grid_spacing: int = 50) -> np.ndarray:
    """
    Create a black background with subtle grid lines for technical drawing aesthetic.

    Args:
        height: Canvas height in pixels
        width: Canvas width in pixels
        grid_spacing: Spacing between grid lines in pixels (default: 50)

    Returns:
        Background canvas with grid
    """
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    canvas[:] = BLACK

    # Draw subtle grid
    for x in range(0, width, grid_spacing):
        cv2.line(canvas, (x, 0), (x, height), GRID_GRAY, 1)
    for y in range(0, height, grid_spacing):
        cv2.line(canvas, (0, y), (width, y), GRID_GRAY, 1)

    return canvas


def add_corner_marks(canvas: np.ndarray, margin: int = 50, mark_size: int = 30) -> None:
    """
    Add sci-fi corner registration marks to canvas.

    Args:
        canvas: Canvas to draw on (modified in-place)
        margin: Distance from edge to marks
        mark_size: Size of corner marks
    """
    height, width = canvas.shape[:2]
    corners = [
        (margin, margin),                          # Top-left
        (width - margin, margin),                  # Top-right
        (margin, height - margin),                 # Bottom-left
        (width - margin, height - margin)          # Bottom-right
    ]

    for x, y in corners:
        # Horizontal line
        cv2.line(canvas, (x - mark_size, y), (x + mark_size, y), YELLOW, 2)
        # Vertical line
        cv2.line(canvas, (x, y - mark_size), (x, y + mark_size), YELLOW, 2)
        # Small diagonal accents
        cv2.line(canvas, (x - mark_size//2, y - mark_size//2),
                (x - mark_size, y - mark_size), YELLOW, 1)
        cv2.line(canvas, (x + mark_size//2, y - mark_size//2),
                (x + mark_size, y - mark_size), YELLOW, 1)


def detect_line_segments(edges: np.ndarray,
                         threshold: int = 50,
                         min_line_length: int = 10,
                         max_line_gap: int = 5) -> Optional[np.ndarray]:
    """
    Detect individual line segments using probabilistic Hough transform.

    Args:
        edges: Binary edge image
        threshold: Accumulator threshold for line detection (lower = more lines)
        min_line_length: Minimum line length in pixels
        max_line_gap: Maximum gap between segments to connect

    Returns:
        Array of line segments [x1, y1, x2, y2] or None if no lines found
    """
    lines = cv2.HoughLinesP(
        edges,
        rho=1,                          # Distance resolution in pixels
        theta=np.pi/180,                # Angle resolution in radians (1 degree)
        threshold=threshold,
        minLineLength=min_line_length,
        maxLineGap=max_line_gap
    )

    return lines


def extend_line_segment(x1: int, y1: int, x2: int, y2: int,
                       overshoot_range: Tuple[int, int] = (5, 15)) -> Tuple[int, int, int, int]:
    """
    Extend a line segment at both endpoints to create overshoot effect.

    Args:
        x1, y1: Start point of line segment
        x2, y2: End point of line segment
        overshoot_range: Min and max pixels to extend (random value chosen)

    Returns:
        Extended line coordinates (new_x1, new_y1, new_x2, new_y2)
    """
    # Calculate line direction vector
    dx = x2 - x1
    dy = y2 - y1
    length = np.sqrt(dx**2 + dy**2)

    # Avoid division by zero for very short lines
    if length < 1:
        return x1, y1, x2, y2

    # Normalize direction vector
    dx_norm = dx / length
    dy_norm = dy / length

    # Random overshoot at each end (creates hand-drawn variation)
    overshoot1 = random.randint(*overshoot_range)
    overshoot2 = random.randint(*overshoot_range)

    # Calculate new endpoints
    new_x1 = int(x1 - dx_norm * overshoot1)
    new_y1 = int(y1 - dy_norm * overshoot1)
    new_x2 = int(x2 + dx_norm * overshoot2)
    new_y2 = int(y2 + dy_norm * overshoot2)

    return new_x1, new_y1, new_x2, new_y2


def convert_to_architectural_sketch(
    input_path: str,
    output_path: str,
    target_size: int = 2000,
    canny_low: int = 30,
    canny_high: int = 100,
    hough_threshold: int = 40,
    min_line_length: int = 8,
    max_line_gap: int = 5,
    overshoot_range: Tuple[int, int] = (5, 15),
    line_thickness: int = 1,
    show_grid: bool = True
) -> bool:
    """
    Convert image to architectural sketch with line segment overshoot.

    This is the main conversion function that orchestrates the entire pipeline:
    1. Load and preprocess image
    2. Detect edges using Canny
    3. Extract individual line segments using HoughLinesP
    4. Extend each segment at both endpoints
    5. Draw on technical drawing background

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        target_size: Output canvas size (square)
        canny_low: Lower threshold for Canny edge detection
        canny_high: Upper threshold for Canny edge detection
        hough_threshold: Accumulator threshold for line detection (lower = more lines)
        min_line_length: Minimum line segment length in pixels
        max_line_gap: Maximum gap between line segments to connect
        overshoot_range: (min, max) pixels to extend at line endpoints
        line_thickness: Thickness of drawn lines in pixels
        show_grid: Whether to show background grid

    Returns:
        True if successful, False otherwise
    """
    try:
        # Load image
        img = cv2.imread(input_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {input_path}")

        print(f"Loaded image: {img.shape[1]}x{img.shape[0]}px")

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Preprocessing: bilateral filter to reduce noise while preserving edges
        print("Preprocessing: noise reduction...")
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

        # Edge detection
        print(f"Detecting edges (Canny thresholds: {canny_low}, {canny_high})...")
        edges = cv2.Canny(denoised, canny_low, canny_high, apertureSize=3)

        # Morphological closing to connect nearby edges
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        # Detect line segments
        print(f"Detecting line segments (threshold={hough_threshold}, minLength={min_line_length})...")
        lines = detect_line_segments(
            edges,
            threshold=hough_threshold,
            min_line_length=min_line_length,
            max_line_gap=max_line_gap
        )

        if lines is None or len(lines) == 0:
            print("WARNING: No line segments detected. Try lowering hough_threshold.")
            return False

        print(f"Found {len(lines)} line segments")

        # Create output canvas
        canvas = create_technical_background(target_size, target_size,
                                            grid_spacing=50 if show_grid else 0)

        # Calculate scaling to fit original image on canvas
        h, w = img.shape[:2]
        scale = min((target_size - 200) / w, (target_size - 200) / h)
        offset_x = (target_size - int(w * scale)) // 2
        offset_y = (target_size - int(h * scale)) // 2

        # Draw each line segment with overshoot
        print(f"Drawing {len(lines)} extended line segments...")
        for line in lines:
            x1, y1, x2, y2 = line[0]

            # Scale and offset to canvas
            x1 = int(x1 * scale) + offset_x
            y1 = int(y1 * scale) + offset_y
            x2 = int(x2 * scale) + offset_x
            y2 = int(y2 * scale) + offset_y

            # Extend line segment at both ends
            new_x1, new_y1, new_x2, new_y2 = extend_line_segment(
                x1, y1, x2, y2, overshoot_range
            )

            # Draw extended line
            cv2.line(canvas, (new_x1, new_y1), (new_x2, new_y2),
                    YELLOW, line_thickness, cv2.LINE_AA)

        # Add technical drawing corner marks
        add_corner_marks(canvas, margin=50, mark_size=30)

        # Save output
        cv2.imwrite(output_path, canvas)
        print(f"\nSaved architectural sketch: {output_path}")
        print(f"Output size: {target_size}x{target_size}px")

        return True

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False


def batch_convert(input_dir: str, output_dir: str, **kwargs) -> None:
    """
    Convert multiple images in a directory.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save output images
        **kwargs: Parameters to pass to convert_to_architectural_sketch
    """
    import os
    from pathlib import Path

    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Supported image formats
    formats = ['.png', '.jpg', '.jpeg', '.webp', '.bmp']

    images = [f for f in input_path.iterdir()
             if f.suffix.lower() in formats]

    print(f"Found {len(images)} images to convert\n")

    for i, img_file in enumerate(images, 1):
        print(f"[{i}/{len(images)}] Processing {img_file.name}...")
        output_file = output_path / f"{img_file.stem}-sketch.png"

        success = convert_to_architectural_sketch(
            str(img_file),
            str(output_file),
            **kwargs
        )

        if success:
            print(f"✓ Completed\n")
        else:
            print(f"✗ Failed\n")


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    # Test with single image
    input_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\line-segment-overshoot.png"

    print("="*70)
    print("ARCHITECTURAL SKETCH CONVERTER - LINE SEGMENT OVERSHOOT METHOD")
    print("="*70)
    print()

    success = convert_to_architectural_sketch(
        input_path=input_image,
        output_path=output_image,
        target_size=2000,           # 2000x2000px output
        canny_low=30,               # Lower for more edges
        canny_high=100,             # Moderate upper threshold
        hough_threshold=40,         # Line detection sensitivity (lower = more lines)
        min_line_length=8,          # Minimum line segment length
        max_line_gap=5,             # Connect lines within 5px
        overshoot_range=(5, 15),    # Random overshoot 5-15px at endpoints
        line_thickness=1,           # Thin lines for architectural style
        show_grid=True              # Show background grid
    )

    if success:
        print("\n" + "="*70)
        print("SUCCESS! Architectural sketch created with line segment overshoot")
        print("="*70)
        print("\nKEY FEATURES:")
        print("- Individual line segments detected using HoughLinesP")
        print("- Each segment extended 5-15px at both endpoints")
        print("- Creates authentic hand-drawn overshoot at intersections")
        print("- Yellow lines on black background with grid")
        print("- Technical corner registration marks")
        print("\nPARAMETER TUNING GUIDE:")
        print("- hough_threshold: Lower = more lines detected (try 30-60)")
        print("- min_line_length: Shorter = more detail (try 5-15)")
        print("- max_line_gap: Larger = connects more segments (try 3-10)")
        print("- overshoot_range: Larger = more pronounced hand-drawn effect")
        print("- canny thresholds: Lower = more edges (try 20-80)")
    else:
        print("\nFailed to create sketch. Try adjusting parameters.")
        print("Suggestions:")
        print("- Lower hough_threshold (try 30)")
        print("- Lower canny thresholds (try 20, 80)")
        print("- Reduce min_line_length (try 5)")


"""
PARAMETER TUNING GUIDE FOR DIFFERENT IMAGE TYPES
=================================================

For photographs (noisy, complex):
    canny_low=40, canny_high=120
    hough_threshold=60
    min_line_length=12
    max_line_gap=8
    overshoot_range=(8, 18)

For clean renders (3D models, CAD):
    canny_low=50, canny_high=150
    hough_threshold=80
    min_line_length=15
    max_line_gap=5
    overshoot_range=(5, 12)

For sketches/line art (already simplified):
    canny_low=20, canny_high=60
    hough_threshold=30
    min_line_length=5
    max_line_gap=3
    overshoot_range=(3, 10)

For maximum detail (small features):
    canny_low=25, canny_high=80
    hough_threshold=25
    min_line_length=5
    max_line_gap=4
    overshoot_range=(4, 12)

For clean architectural lines:
    canny_low=60, canny_high=180
    hough_threshold=100
    min_line_length=20
    max_line_gap=3
    overshoot_range=(6, 15)

TROUBLESHOOTING
===============

Too few lines detected:
    - Lower hough_threshold (try 30-40)
    - Lower canny thresholds
    - Reduce min_line_length
    - Increase max_line_gap

Too many noisy lines:
    - Raise hough_threshold (try 60-80)
    - Raise canny_low threshold
    - Increase min_line_length
    - Reduce max_line_gap

Lines too short/broken:
    - Increase max_line_gap (try 8-10)
    - Lower min_line_length
    - Lower hough_threshold

Overshoot not visible enough:
    - Increase overshoot_range (try 10-20)
    - Increase line_thickness (try 2)

Lines too thick/messy:
    - Reduce line_thickness to 1
    - Reduce overshoot_range
    - Raise min_line_length
"""
