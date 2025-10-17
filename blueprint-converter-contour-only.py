#!/usr/bin/env python3
"""
Blueprint Converter - Contour-Only Technical Drawing
Creates clean contour lines without interior fill, like a proper technical drawing
"""

import cv2
import numpy as np
from typing import Tuple

# Color scheme
GOLD_COLOR = (23, 182, 250)  # #fab617 in BGR
YELLOW_LIGHT = (102, 217, 255)  # Lighter gold
GRID_COLOR = (40, 40, 40)  # Subtle dark gray for grid
BACKGROUND = (20, 20, 20)  # Near black background


def create_pencil_texture(shape: Tuple[int, int]) -> np.ndarray:
    """Creates subtle pencil grain texture for natural variation"""
    h, w = shape
    texture = np.random.normal(0, 10, (h, w)).astype(np.float32)
    texture = cv2.GaussianBlur(texture, (3, 3), 0.5)
    texture = texture - texture.mean()
    texture = texture / (texture.std() * 3)
    texture = np.clip(texture * 0.12 + 1.0, 0.88, 1.12)
    return texture


def extract_contours_and_details(gray: np.ndarray) -> np.ndarray:
    """
    Extracts contours and structural details WITHOUT interior fill
    Like a proper technical drawing showing only edges and important lines
    """
    print("  - Preprocessing with bilateral filter...")
    # Strong edge-preserving filter
    denoised = cv2.bilateralFilter(gray, 13, 90, 90)

    print("  - Enhancing contrast...")
    # Contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    print("  - Extracting edges with refined Canny...")
    # Use well-tuned Canny parameters for clean edges
    edges = cv2.Canny(enhanced, 40, 120, apertureSize=5, L2gradient=True)

    print("  - Detecting structural contours...")
    # Find contours for structural analysis
    contours, hierarchy = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create output for contour drawing
    contour_img = np.zeros_like(edges)

    # Draw only significant contours (filter by size)
    min_contour_area = 50  # Minimum area to be considered significant
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > min_contour_area:
            # Draw contour with slight thickness
            cv2.drawContours(contour_img, [contour], -1, 255, 1, cv2.LINE_AA)

    print("  - Adding internal structural details...")
    # For internal details, use a more aggressive edge detector on specific regions
    # This captures interior structural lines without filling
    internal_edges = cv2.Canny(enhanced, 60, 150, apertureSize=3, L2gradient=True)

    # Thin the internal edges to prevent over-drawing
    kernel_thin = np.array([[0, 1, 0],
                            [1, 1, 1],
                            [0, 1, 0]], dtype=np.uint8)
    internal_edges = cv2.erode(internal_edges, kernel_thin, iterations=1)

    # Combine contours with internal details
    combined = cv2.bitwise_or(contour_img, internal_edges)

    print("  - Connecting nearby lines...")
    # Connect very close lines (small gaps)
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_connect, iterations=1)

    print("  - Cleaning up noise...")
    # Remove isolated noise pixels
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel_clean)

    return combined


def apply_pencil_line_style(edges: np.ndarray) -> np.ndarray:
    """
    Transforms crisp edges into smooth pencil-style lines
    """
    print("  - Applying light dilation for line body...")
    # Very light dilation to give lines slight body
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    lines = cv2.dilate(edges, kernel, iterations=1)

    print("  - Smoothing for pencil quality...")
    # Multiple smoothing passes for pencil-like appearance
    # Pass 1: Gaussian blur for overall smoothness
    smooth1 = cv2.GaussianBlur(lines, (5, 5), 1.0)

    # Pass 2: Bilateral to preserve edges while smoothing
    smooth2 = cv2.bilateralFilter(smooth1, 5, 40, 40)

    # Pass 3: Final light Gaussian for anti-aliasing
    smooth3 = cv2.GaussianBlur(smooth2, (3, 3), 0.4)

    return smooth3


def add_detail_variation(lines: np.ndarray, gradient_mag: np.ndarray) -> np.ndarray:
    """
    Adds opacity variation based on line importance
    Important structural lines are darker, details lighter
    """
    # Normalize gradient
    grad_norm = gradient_mag.astype(np.float32)
    if grad_norm.max() > 0:
        grad_norm = grad_norm / grad_norm.max()

    # Variable opacity: 0.5 to 1.0 based on edge strength
    opacity = np.zeros_like(lines, dtype=np.float32)
    mask = lines > 10
    opacity[mask] = 0.5 + (grad_norm[mask] * 0.5)

    # Apply to lines
    result = (lines.astype(np.float32) * opacity).astype(np.uint8)

    return result


def add_line_overshoot(edges: np.ndarray, overshoot: int = 3) -> np.ndarray:
    """Extends line endpoints slightly (hand-drawn sketch effect)"""
    # Detect corners and endpoints
    edges_float = (edges > 10).astype(np.float32)
    corners = cv2.cornerHarris(edges_float, blockSize=2, ksize=3, k=0.04)

    # Find strong corners
    if corners.max() > 0:
        corner_threshold = corners.max() * 0.01
        corner_points = (corners > corner_threshold).astype(np.uint8) * 255

        # Extend corners slightly
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (overshoot, overshoot))
        extended = cv2.dilate(corner_points, kernel, iterations=1)

        # Combine with original
        result = cv2.bitwise_or(edges, extended)
    else:
        result = edges

    return result


def process_image_to_pencil_blueprint(input_path: str, output_path: str, output_size: int = 2000) -> None:
    """
    Converts image to contour-only pencil technical drawing
    """
    print(f"Loading image: {input_path}")
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    # Process at 2x resolution for quality
    processing_size = output_size * 2

    print(f"Resizing to {processing_size}x{processing_size}...")
    h, w = img.shape[:2]
    if h != processing_size or w != processing_size:
        img = cv2.resize(img, (processing_size, processing_size), interpolation=cv2.INTER_LANCZOS4)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    print("Extracting contour-only edges (no fill)...")
    edges = extract_contours_and_details(gray)

    # Calculate gradient for opacity variation
    print("Calculating edge strength for detail variation...")
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=5)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=5)
    gradient_mag = np.sqrt(sobelx**2 + sobely**2)
    gradient_mag = np.clip(gradient_mag, 0, 255).astype(np.uint8)

    print("Applying pencil line style...")
    pencil_lines = apply_pencil_line_style(edges)

    print("Adding line overshoot effect...")
    pencil_lines = add_line_overshoot(pencil_lines, overshoot=4)

    print("Adding detail variation...")
    varied_lines = add_detail_variation(pencil_lines, gradient_mag)

    print(f"Downsampling to {output_size}x{output_size}...")
    # Downsample for final anti-aliasing
    final_lines = cv2.resize(varied_lines, (output_size, output_size), interpolation=cv2.INTER_AREA)

    # Final smoothing pass
    final_lines = cv2.GaussianBlur(final_lines, (3, 3), 0.4)

    print("Creating pencil texture...")
    texture = create_pencil_texture((output_size, output_size))

    print("Building final blueprint canvas...")
    # Create background with grid
    canvas = np.full((output_size, output_size, 3), BACKGROUND, dtype=np.uint8)

    # Draw subtle grid
    grid_spacing = 40
    for i in range(0, output_size, grid_spacing):
        cv2.line(canvas, (i, 0), (i, output_size), GRID_COLOR, 1, cv2.LINE_AA)
        cv2.line(canvas, (0, i), (output_size, i), GRID_COLOR, 1, cv2.LINE_AA)

    # Apply lines with pencil texture
    canvas_float = canvas.astype(np.float32)

    # Create gold line layer
    line_layer = np.zeros_like(canvas_float)
    line_layer[:, :] = GOLD_COLOR

    # Apply texture variation
    for c in range(3):
        line_layer[:, :, c] *= texture

    # Blend lines onto canvas
    line_alpha = (final_lines.astype(np.float32) / 255.0)
    line_alpha = np.stack([line_alpha] * 3, axis=-1)

    canvas_float = canvas_float * (1 - line_alpha) + line_layer * line_alpha

    # Add subtle glow
    glow = cv2.GaussianBlur(final_lines, (21, 21), 6.0)
    glow_alpha = (glow.astype(np.float32) / 255.0) * 0.2
    glow_alpha = np.stack([glow_alpha] * 3, axis=-1)

    glow_layer = np.zeros_like(canvas_float)
    glow_layer[:, :] = YELLOW_LIGHT

    canvas_float = canvas_float * (1 - glow_alpha) + glow_layer * glow_alpha

    canvas = np.clip(canvas_float, 0, 255).astype(np.uint8)

    print("Adding sci-fi border frame...")
    border_size = 80

    # Top border
    cv2.rectangle(canvas, (0, 0), (output_size, border_size), (30, 30, 30), -1)
    cv2.line(canvas, (0, border_size), (output_size, border_size), GOLD_COLOR, 2, cv2.LINE_AA)

    # Technical greebles
    for i in range(0, output_size, 120):
        cv2.line(canvas, (i, 10), (i + 60, 10), GOLD_COLOR, 1, cv2.LINE_AA)
        cv2.rectangle(canvas, (i + 10, 25), (i + 50, 45), GOLD_COLOR, 1, cv2.LINE_AA)
        cv2.circle(canvas, (i + 30, 60), 8, GOLD_COLOR, 1, cv2.LINE_AA)

    # Bottom border
    cv2.rectangle(canvas, (0, output_size - border_size), (output_size, output_size), (30, 30, 30), -1)
    cv2.line(canvas, (0, output_size - border_size), (output_size, output_size - border_size), GOLD_COLOR, 2, cv2.LINE_AA)

    # Side borders
    cv2.rectangle(canvas, (0, border_size), (border_size, output_size - border_size), (30, 30, 30), -1)
    cv2.line(canvas, (border_size, border_size), (border_size, output_size - border_size), GOLD_COLOR, 2, cv2.LINE_AA)

    cv2.rectangle(canvas, (output_size - border_size, border_size), (output_size, output_size - border_size), (30, 30, 30), -1)
    cv2.line(canvas, (output_size - border_size, border_size), (output_size - border_size, output_size - border_size), GOLD_COLOR, 2, cv2.LINE_AA)

    # Corner details
    corner_size = 40
    corners = [(border_size, border_size),
               (output_size - border_size, border_size),
               (border_size, output_size - border_size),
               (output_size - border_size, output_size - border_size)]

    for cx, cy in corners:
        cv2.circle(canvas, (cx, cy), corner_size, GOLD_COLOR, 2, cv2.LINE_AA)
        cv2.line(canvas, (cx - corner_size // 2, cy), (cx + corner_size // 2, cy), GOLD_COLOR, 1, cv2.LINE_AA)
        cv2.line(canvas, (cx, cy - corner_size // 2), (cx, cy + corner_size // 2), GOLD_COLOR, 1, cv2.LINE_AA)

    print(f"Saving to: {output_path}")
    cv2.imwrite(output_path, canvas)
    print("Complete!")


def main():
    """Main execution"""
    input_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-pencil-smooth.png"

    try:
        process_image_to_pencil_blueprint(input_image, output_image, output_size=2000)
        print("\nBlueprint conversion successful!")
        print(f"Output: {output_image}")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
