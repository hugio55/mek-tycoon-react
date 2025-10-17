"""
Blueprint Line Variations - Pure Architectural Line Work
Focus: Clean line extraction without texture fills
"""

import cv2
import numpy as np
from typing import Tuple

def add_technical_frame(img: np.ndarray, line_color: Tuple[int, int, int]) -> np.ndarray:
    """Add subtle technical frame elements"""
    h, w = img.shape[:2]

    # Corner marks (small L-shapes)
    corner_len = 40
    for x, y in [(20, 20), (w-20, 20), (20, h-20), (w-20, h-20)]:
        # Horizontal line
        if x < w//2:
            cv2.line(img, (x, y), (x + corner_len, y), line_color, 1)
        else:
            cv2.line(img, (x, y), (x - corner_len, y), line_color, 1)
        # Vertical line
        if y < h//2:
            cv2.line(img, (x, y), (x, y + corner_len), line_color, 1)
        else:
            cv2.line(img, (x, y), (x, y - corner_len), line_color, 1)

    # Subtle grid lines (very faint)
    grid_color = tuple(int(c * 0.15) for c in line_color)
    grid_spacing = 100
    for i in range(grid_spacing, w, grid_spacing):
        cv2.line(img, (i, 30), (i, h-30), grid_color, 1)
    for i in range(grid_spacing, h, grid_spacing):
        cv2.line(img, (30, i), (w-30, i), grid_color, 1)

    return img


def variation_1_contour_lines(input_path: str, output_path: str):
    """
    Variation 1: Pure Contour Lines
    - Extract only contour outlines
    - Multiple detail levels
    - No fill, just clean line work
    """
    print("\n=== VARIATION 1: CONTOUR LINES ===")

    # Load and prepare
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load: {input_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = img[:, :, :3]
        mask = alpha > 128
    else:
        mask = None

    # Resize to target
    target_size = 2000
    img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_AREA)
    if mask is not None:
        mask = cv2.resize(mask.astype(np.uint8), (target_size, target_size), interpolation=cv2.INTER_AREA) > 0

    # Create output canvas
    output = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    line_color = (40, 180, 255)  # Yellow-gold in BGR

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply mask if available
    if mask is not None:
        gray[~mask] = 0

    # Preprocessing
    blurred = cv2.bilateralFilter(gray, 9, 50, 50)

    # Extract contours at multiple threshold levels for different details
    contour_levels = [
        (150, 3),   # Major outlines - thicker
        (100, 2),   # Medium details
        (50, 1),    # Fine details - thinnest
    ]

    for threshold_val, thickness in contour_levels:
        # Threshold to get binary image
        _, binary = cv2.threshold(blurred, threshold_val, 255, cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # Filter small contours
        min_area = 50 if thickness == 1 else 100
        contours = [c for c in contours if cv2.contourArea(c) > min_area]

        # Draw contours as lines
        cv2.drawContours(output, contours, -1, line_color, thickness)

        print(f"  Threshold {threshold_val}: {len(contours)} contours, thickness {thickness}")

    # Add technical frame
    output = add_technical_frame(output, line_color)

    # Save
    cv2.imwrite(output_path, output)
    print(f"[OK] Saved: {output_path}")


def variation_2_skeleton_lines(input_path: str, output_path: str):
    """
    Variation 2: Skeleton Centerlines
    - Morphological skeletonization
    - Single-pixel precision centerlines
    - Very technical architectural style
    """
    print("\n=== VARIATION 2: SKELETON LINES ===")

    # Load and prepare
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load: {input_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = img[:, :, :3]
        mask = alpha > 128
    else:
        mask = None

    # Resize to target
    target_size = 2000
    img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_AREA)
    if mask is not None:
        mask = cv2.resize(mask.astype(np.uint8), (target_size, target_size), interpolation=cv2.INTER_AREA) > 0

    # Create output canvas
    output = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    line_color = (40, 180, 255)  # Yellow-gold in BGR

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply mask
    if mask is not None:
        gray[~mask] = 0

    # Edge detection to get shape boundaries
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 90)

    # Dilate slightly to connect nearby edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    # Morphological skeletonization
    skeleton = np.zeros_like(dilated)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))

    print("  Computing skeleton...")
    temp = dilated.copy()
    while True:
        eroded = cv2.erode(temp, element)
        opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, element)
        subset = eroded - opened
        skeleton = cv2.bitwise_or(skeleton, subset)
        temp = eroded.copy()

        if cv2.countNonZero(temp) == 0:
            break

    # Also add some direct edge lines for external boundaries
    external_edges = cv2.Canny(blurred, 50, 150)

    # Combine skeleton (internal structure) with edges (external boundaries)
    combined = cv2.bitwise_or(skeleton, external_edges)

    # Apply to output - skeleton is already thin
    output[combined > 0] = line_color

    # Slightly thicken for visibility (1 pixel dilation)
    kernel_thin = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    for c in range(3):
        output[:, :, c] = cv2.dilate(output[:, :, c], kernel_thin, iterations=1)

    # Add technical frame
    output = add_technical_frame(output, line_color)

    # Save
    cv2.imwrite(output_path, output)
    print(f"[OK] Saved: {output_path}")


def variation_3_multipass_edges(input_path: str, output_path: str):
    """
    Variation 3: Multi-Pass Edge Detection
    - Multiple Canny threshold levels
    - Each pass captures different details
    - Pure line extraction, no fills
    """
    print("\n=== VARIATION 3: MULTI-PASS EDGES ===")

    # Load and prepare
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load: {input_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = img[:, :, :3]
        mask = alpha > 128
    else:
        mask = None

    # Resize to target
    target_size = 2000
    img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_AREA)
    if mask is not None:
        mask = cv2.resize(mask.astype(np.uint8), (target_size, target_size), interpolation=cv2.INTER_AREA) > 0

    # Create output canvas
    output = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    line_color = (40, 180, 255)  # Yellow-gold in BGR

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply mask
    if mask is not None:
        gray[~mask] = 0

    # Multiple preprocessing approaches
    blurred_bilateral = cv2.bilateralFilter(gray, 9, 50, 50)
    blurred_gaussian = cv2.GaussianBlur(gray, (5, 5), 0)

    # Multi-pass edge detection with different thresholds
    edge_passes = []

    # Pass 1: Strong edges (major outlines)
    edges_strong = cv2.Canny(blurred_bilateral, 80, 160, apertureSize=5)
    edge_passes.append(("Strong edges", edges_strong, 2))

    # Pass 2: Medium edges (panel lines)
    edges_medium = cv2.Canny(blurred_bilateral, 40, 100, apertureSize=3)
    edge_passes.append(("Medium edges", edges_medium, 1))

    # Pass 3: Fine edges (detail work)
    edges_fine = cv2.Canny(blurred_gaussian, 20, 60, apertureSize=3)
    edge_passes.append(("Fine edges", edges_fine, 1))

    # Pass 4: Sobel gradients for subtle details
    sobelx = cv2.Sobel(blurred_gaussian, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(blurred_gaussian, cv2.CV_64F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobelx**2 + sobely**2)
    sobel_mag = np.uint8(np.clip(sobel_mag, 0, 255))
    _, sobel_edges = cv2.threshold(sobel_mag, 30, 255, cv2.THRESH_BINARY)
    edge_passes.append(("Sobel details", sobel_edges, 1))

    # Combine all passes with different weights
    combined_edges = np.zeros((target_size, target_size), dtype=np.uint8)

    for name, edges, thickness in edge_passes:
        # Apply thickness
        if thickness > 1:
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (thickness, thickness))
            edges = cv2.dilate(edges, kernel, iterations=1)

        combined_edges = cv2.bitwise_or(combined_edges, edges)

        edge_count = np.count_nonzero(edges)
        print(f"  {name}: {edge_count} pixels, thickness {thickness}")

    # Apply to output
    output[combined_edges > 0] = line_color

    # Add technical frame
    output = add_technical_frame(output, line_color)

    # Save
    cv2.imwrite(output_path, output)
    print(f"[OK] Saved: {output_path}")


def main():
    """Process all three variations"""
    input_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_dir = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images"

    print("=" * 60)
    print("ARCHITECTURAL LINE WORK VARIATIONS")
    print("Focus: Pure line extraction, no texture fills")
    print("=" * 60)

    # Variation 1: Contour lines
    output_1 = f"{output_dir}/variation-1-contour-lines.png"
    variation_1_contour_lines(input_path, output_1)

    # Variation 2: Skeleton lines
    output_2 = f"{output_dir}/variation-2-skeleton-lines.png"
    variation_2_skeleton_lines(input_path, output_2)

    # Variation 3: Multi-pass edges
    output_3 = f"{output_dir}/variation-3-multipass-lines.png"
    variation_3_multipass_edges(input_path, output_3)

    print("\n" + "=" * 60)
    print("[OK] ALL VARIATIONS COMPLETE")
    print("=" * 60)
    print("\nOutput files:")
    print(f"  1. {output_1}")
    print(f"  2. {output_2}")
    print(f"  3. {output_3}")
    print("\nAll variations: 2000x2000px, yellow-gold lines on black")
    print("Style: Pure architectural line work, no texture fills")


if __name__ == "__main__":
    main()
