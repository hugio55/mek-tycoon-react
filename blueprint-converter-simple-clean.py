#!/usr/bin/env python3
"""
Simple Clean Blueprint Converter
Focus: Clean edge detection without texture artifacts or stippling
"""

import cv2
import numpy as np
from typing import Tuple

def create_simple_clean_blueprint(
    input_path: str,
    output_path: str,
    work_size: int = 4000,
    final_size: int = 2000,
    canny_low: int = 30,
    canny_high: int = 90,
    line_color: Tuple[int, int, int] = (23, 182, 250),  # Yellow #fab617 in BGR
    grid_opacity: float = 0.03
) -> None:
    """
    Convert image to clean technical blueprint with simple edge detection.

    Strategy:
    1. Work at high resolution (4000x4000) for detail
    2. Simple Canny edge detection - no over-processing
    3. Light Gaussian blur for anti-aliasing
    4. Downsample to final size for smooth lines
    5. Add minimal background elements (subtle grid, corner marks)

    Parameters:
        input_path: Source image file path
        output_path: Output blueprint file path
        work_size: Internal processing resolution (higher = more detail)
        final_size: Final output resolution
        canny_low: Lower threshold for Canny (30-50 typical)
        canny_high: Upper threshold for Canny (80-120 typical)
        line_color: Line color in BGR format (default: yellow #fab617)
        grid_opacity: Grid visibility (0.0-1.0, very low for subtlety)
    """

    print(f"Loading image: {input_path}")
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    # Handle transparency - blend with black background
    if img.shape[2] == 4:
        alpha = img[:, :, 3:4] / 255.0
        img_rgb = img[:, :, :3]
        img = (img_rgb * alpha).astype(np.uint8)

    print(f"Original size: {img.shape[1]}x{img.shape[0]}")

    # === STEP 1: Upscale for detail preservation ===
    print(f"Upscaling to {work_size}x{work_size} for processing...")
    img_large = cv2.resize(img, (work_size, work_size), interpolation=cv2.INTER_CUBIC)

    # Convert to grayscale
    gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)

    # === STEP 2: Light preprocessing ===
    # Subtle noise reduction - preserve edges
    print("Applying noise reduction...")
    denoised = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)

    # === STEP 3: Simple Canny edge detection ===
    print(f"Detecting edges (Canny: {canny_low}-{canny_high})...")
    edges = cv2.Canny(denoised, canny_low, canny_high, apertureSize=3)

    # === STEP 4: Minimal morphological cleanup ===
    # Just connect very close edges, don't over-process
    print("Light edge refinement...")
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges_refined = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel_small, iterations=1)

    # === STEP 5: Anti-aliasing preparation ===
    # Light Gaussian blur before downsampling for smooth lines
    print("Preparing anti-aliased edges...")
    edges_smooth = cv2.GaussianBlur(edges_refined, (3, 3), 0)

    # === STEP 6: Downsample to final resolution ===
    print(f"Downsampling to {final_size}x{final_size}...")
    edges_final = cv2.resize(edges_smooth, (final_size, final_size), interpolation=cv2.INTER_AREA)

    # === STEP 7: Create final blueprint composition ===
    print("Creating blueprint composition...")
    blueprint = np.zeros((final_size, final_size, 3), dtype=np.uint8)

    # Add subtle grid (very faint)
    if grid_opacity > 0:
        grid_spacing = 100  # pixels between grid lines
        grid_color = (30, 30, 30)  # Very dark gray

        for i in range(0, final_size, grid_spacing):
            cv2.line(blueprint, (i, 0), (i, final_size), grid_color, 1)
            cv2.line(blueprint, (0, i), (final_size, i), grid_color, 1)

        # Apply grid opacity
        grid_mask = np.any(blueprint > 0, axis=2, keepdims=True)
        blueprint = (blueprint * grid_opacity).astype(np.uint8)

    # Add simple corner marks (sci-fi aesthetic)
    corner_size = 80
    corner_thickness = 3
    corner_color = (40, 40, 40)

    corners = [
        (50, 50),  # Top-left
        (final_size - 50, 50),  # Top-right
        (50, final_size - 50),  # Bottom-left
        (final_size - 50, final_size - 50)  # Bottom-right
    ]

    for x, y in corners:
        # L-shaped corner marks
        cv2.line(blueprint, (x - corner_size, y), (x, y), corner_color, corner_thickness)
        cv2.line(blueprint, (x, y - corner_size), (x, y), corner_color, corner_thickness)

    # Add very subtle paper texture (minimal)
    noise = np.random.normal(0, 3, (final_size, final_size, 3)).astype(np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # === STEP 8: Apply yellow lines ===
    # Create mask for edges
    edge_mask = edges_final > 30  # Threshold for anti-aliased edges

    # Apply yellow color with edge intensity
    for c in range(3):
        blueprint[:, :, c] = np.where(
            edge_mask,
            np.clip(blueprint[:, :, c] + (edges_final * (line_color[c] / 255.0)), 0, 255),
            blueprint[:, :, c]
        )

    # === STEP 9: Save output ===
    print(f"Saving blueprint: {output_path}")
    cv2.imwrite(output_path, blueprint)
    print(f"[DONE] Clean blueprint saved at {final_size}x{final_size}px")
    print(f"  Edge detection: Canny({canny_low}, {canny_high})")
    print(f"  Line color: RGB({line_color[2]}, {line_color[1]}, {line_color[0]})")


if __name__ == "__main__":
    # Test with the specified Mek image
    input_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-simple-clean.png"

    print("=" * 60)
    print("SIMPLE CLEAN BLUEPRINT CONVERTER")
    print("Strategy: Clean edge detection without texture artifacts")
    print("=" * 60)

    create_simple_clean_blueprint(
        input_path=input_image,
        output_path=output_image,
        work_size=4000,
        final_size=2000,
        canny_low=30,
        canny_high=90,
        line_color=(23, 182, 250),  # Yellow #fab617
        grid_opacity=0.03
    )

    print("\n" + "=" * 60)
    print("PARAMETER TUNING GUIDE")
    print("=" * 60)
    print("For more detail: Increase canny_high (90 → 110)")
    print("For cleaner result: Increase canny_low (30 → 40)")
    print("For thicker lines: Increase work_size (4000 → 6000)")
    print("For subtler grid: Decrease grid_opacity (0.03 → 0.01)")
