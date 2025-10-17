#!/usr/bin/env python3
"""
Blueprint Converter - Pencil-Smooth Technical Drawing Style
Creates beautiful, smooth technical drawing lines with pencil-like texture
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple

# Color scheme
GOLD_COLOR = (23, 182, 250)  # #fab617 in BGR
YELLOW_LIGHT = (102, 217, 255)  # Lighter gold
GRID_COLOR = (40, 40, 40)  # Subtle dark gray for grid
BACKGROUND = (20, 20, 20)  # Near black background

def create_pencil_texture(shape: Tuple[int, int]) -> np.ndarray:
    """
    Creates a subtle pencil grain texture overlay

    Args:
        shape: (height, width) for texture

    Returns:
        Grayscale texture map (0-255)
    """
    h, w = shape

    # Create multi-scale noise for natural pencil grain
    texture = np.zeros((h, w), dtype=np.float32)

    # Fine grain
    fine_noise = np.random.normal(128, 15, (h, w))
    texture += cv2.GaussianBlur(fine_noise.astype(np.float32), (3, 3), 0.5)

    # Medium grain
    medium_noise = np.random.normal(0, 8, (h // 2, w // 2))
    medium_noise = cv2.resize(medium_noise, (w, h), interpolation=cv2.INTER_LINEAR)
    texture += medium_noise

    # Directional grain (simulates pencil stroke direction)
    directional = np.random.normal(0, 5, (h, w // 4))
    directional = cv2.resize(directional, (w, h), interpolation=cv2.INTER_LINEAR)
    texture += directional

    # Normalize to 0-255 range
    texture = np.clip(texture, 0, 255).astype(np.uint8)

    return texture


def create_distance_transform_lines(edges: np.ndarray, max_width: int = 3) -> np.ndarray:
    """
    Creates variable-width lines using distance transform
    Lines are thicker in the center and taper at edges

    Args:
        edges: Binary edge map
        max_width: Maximum line width in pixels

    Returns:
        Grayscale image with variable-width lines
    """
    # Distance transform from edges
    dist = cv2.distanceTransform(255 - edges, cv2.DIST_L2, 5)

    # Create variable width based on local edge density
    kernel = np.ones((5, 5), np.uint8)
    edge_density = cv2.dilate(edges, kernel, iterations=1)
    edge_density = cv2.GaussianBlur(edge_density, (9, 9), 2.0)

    # Normalize density to 0-1
    density_norm = edge_density.astype(np.float32) / 255.0

    # Variable width: thicker where edges are dense (intersections)
    width_map = 1.0 + (density_norm * max_width)

    # Apply width map to distance transform
    lines = np.zeros_like(edges, dtype=np.float32)
    lines[dist < width_map] = 255.0

    return lines.astype(np.uint8)


def add_line_overshoot(edges: np.ndarray, overshoot_length: int = 4) -> np.ndarray:
    """
    Extends line endpoints slightly past intersections (hand-drawn effect)

    Args:
        edges: Binary edge map
        overshoot_length: Pixels to extend past endpoints

    Returns:
        Edge map with overshoots added
    """
    # Find line endpoints (pixels with only one neighbor)
    kernel_cross = np.array([[0, 1, 0],
                             [1, 1, 1],
                             [0, 1, 0]], dtype=np.uint8)

    # Count neighbors
    neighbor_count = cv2.filter2D(edges // 255, -1, kernel_cross)

    # Endpoints have exactly 2 neighbors (itself + 1 neighbor)
    endpoints = ((neighbor_count == 2) & (edges > 0)).astype(np.uint8) * 255

    # For each endpoint, extend in the direction of the line
    result = edges.copy()

    # Dilate endpoints slightly in the direction they're pointing
    # This creates the overshoot effect
    kernel_extend = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,
                                              (overshoot_length, overshoot_length))
    extended = cv2.dilate(endpoints, kernel_extend, iterations=1)

    # Combine with original edges
    result = cv2.bitwise_or(result, extended)

    return result


def create_variable_opacity_lines(edges: np.ndarray,
                                   edge_strength: np.ndarray) -> np.ndarray:
    """
    Creates lines with variable opacity based on edge strength
    Simulates pencil pressure variation

    Args:
        edges: Binary edge map
        edge_strength: Gradient magnitude (edge strength)

    Returns:
        Grayscale image with variable opacity lines
    """
    # Normalize edge strength
    if edge_strength.max() > 0:
        strength_norm = edge_strength.astype(np.float32) / edge_strength.max()
    else:
        strength_norm = np.zeros_like(edge_strength, dtype=np.float32)

    # Apply to edges: stronger edges = more opaque
    # Map to range 128-255 (never fully transparent)
    opacity = (strength_norm * 127 + 128).astype(np.uint8)

    # Apply only where edges exist
    result = np.zeros_like(edges)
    result[edges > 0] = opacity[edges > 0]

    return result


def process_image_to_pencil_blueprint(input_path: str,
                                       output_path: str,
                                       output_size: int = 2000) -> None:
    """
    Converts an image to smooth pencil-style technical drawing

    Args:
        input_path: Path to input image
        output_path: Path to save output
        output_size: Final output dimension (square)
    """
    print(f"Loading image: {input_path}")
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    # Process at 2x resolution for smoothness
    processing_size = output_size * 2

    # Resize to processing resolution
    h, w = img.shape[:2]
    if h != processing_size or w != processing_size:
        img = cv2.resize(img, (processing_size, processing_size),
                        interpolation=cv2.INTER_LANCZOS4)

    print("Converting to grayscale and preprocessing...")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Advanced preprocessing for clean edges
    # 1. Bilateral filter: smooth while preserving edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # 2. Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # 3. Additional smoothing for anti-aliasing
    smoothed = cv2.GaussianBlur(enhanced, (3, 3), 1.0)

    print("Detecting edges with Canny...")
    # Multi-scale edge detection for completeness
    edges1 = cv2.Canny(smoothed, 30, 90, apertureSize=3, L2gradient=True)
    edges2 = cv2.Canny(smoothed, 50, 150, apertureSize=3, L2gradient=True)

    # Combine edge maps
    edges = cv2.bitwise_or(edges1, edges2)

    # Calculate edge strength (gradient magnitude)
    sobelx = cv2.Sobel(smoothed, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(smoothed, cv2.CV_64F, 0, 1, ksize=3)
    edge_strength = np.sqrt(sobelx**2 + sobely**2)
    edge_strength = np.clip(edge_strength, 0, 255).astype(np.uint8)

    print("Refining edges with morphological operations...")
    # Connect nearby edges
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel_close)

    # Thin edges to single pixel width for precision
    kernel_thin = np.array([[0, 1, 0],
                           [1, 1, 1],
                           [0, 1, 0]], dtype=np.uint8)
    edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_thin)

    print("Adding line overshoot effect...")
    edges = add_line_overshoot(edges, overshoot_length=6)

    print("Creating variable-width lines...")
    # Create variable width lines
    thick_edges = create_distance_transform_lines(edges, max_width=4)

    print("Applying variable opacity...")
    # Apply variable opacity based on edge strength
    opacity_lines = create_variable_opacity_lines(thick_edges, edge_strength)

    print("Applying anti-aliasing and smoothing...")
    # Gaussian blur for smooth, anti-aliased appearance
    smooth_lines = cv2.GaussianBlur(opacity_lines, (5, 5), 1.5)

    # Additional light blur for pencil softness
    pencil_lines = cv2.GaussianBlur(smooth_lines, (3, 3), 0.5)

    print("Downsampling to final resolution...")
    # Downsample to final size (provides additional anti-aliasing)
    pencil_lines = cv2.resize(pencil_lines, (output_size, output_size),
                             interpolation=cv2.INTER_AREA)

    print("Creating pencil texture...")
    # Create pencil grain texture
    texture = create_pencil_texture((output_size, output_size))

    print("Building final blueprint...")
    # Create background with subtle grid
    canvas = np.full((output_size, output_size, 3), BACKGROUND, dtype=np.uint8)

    # Draw subtle grid
    grid_spacing = 40
    for i in range(0, output_size, grid_spacing):
        cv2.line(canvas, (i, 0), (i, output_size), GRID_COLOR, 1)
        cv2.line(canvas, (0, i), (output_size, i), GRID_COLOR, 1)

    # Apply pencil lines with texture
    # Convert to float for blending
    canvas_float = canvas.astype(np.float32)

    # Create colored line layer
    line_layer = np.zeros((output_size, output_size, 3), dtype=np.float32)
    line_layer[:, :] = GOLD_COLOR

    # Apply pencil texture to lines
    texture_norm = texture.astype(np.float32) / 255.0
    texture_variation = 0.85 + (texture_norm * 0.15)  # 85-100% intensity variation

    for c in range(3):
        line_layer[:, :, c] *= texture_variation

    # Blend lines onto canvas using opacity map
    line_mask = pencil_lines.astype(np.float32) / 255.0
    line_mask = np.stack([line_mask] * 3, axis=-1)

    canvas_float = canvas_float * (1 - line_mask) + line_layer * line_mask

    # Add slight glow to lines
    glow = cv2.GaussianBlur(pencil_lines, (15, 15), 5.0)
    glow_mask = (glow.astype(np.float32) / 255.0) * 0.3
    glow_mask = np.stack([glow_mask] * 3, axis=-1)

    glow_layer = np.zeros((output_size, output_size, 3), dtype=np.float32)
    glow_layer[:, :] = YELLOW_LIGHT

    canvas_float = canvas_float * (1 - glow_mask) + glow_layer * glow_mask

    # Convert back to uint8
    canvas = np.clip(canvas_float, 0, 255).astype(np.uint8)

    # Add sci-fi border greebles
    border_size = 80

    # Top border
    cv2.rectangle(canvas, (0, 0), (output_size, border_size), (30, 30, 30), -1)
    cv2.line(canvas, (0, border_size), (output_size, border_size), GOLD_COLOR, 2)

    # Add technical details in border
    for i in range(0, output_size, 120):
        cv2.line(canvas, (i, 10), (i + 60, 10), GOLD_COLOR, 1)
        cv2.rectangle(canvas, (i + 10, 25), (i + 50, 45), GOLD_COLOR, 1)
        cv2.circle(canvas, (i + 30, 60), 8, GOLD_COLOR, 1)

    # Bottom border
    cv2.rectangle(canvas, (0, output_size - border_size),
                 (output_size, output_size), (30, 30, 30), -1)
    cv2.line(canvas, (0, output_size - border_size),
            (output_size, output_size - border_size), GOLD_COLOR, 2)

    # Left border
    cv2.rectangle(canvas, (0, border_size),
                 (border_size, output_size - border_size), (30, 30, 30), -1)
    cv2.line(canvas, (border_size, border_size),
            (border_size, output_size - border_size), GOLD_COLOR, 2)

    # Right border
    cv2.rectangle(canvas, (output_size - border_size, border_size),
                 (output_size, output_size - border_size), (30, 30, 30), -1)
    cv2.line(canvas, (output_size - border_size, border_size),
            (output_size - border_size, output_size - border_size), GOLD_COLOR, 2)

    # Corner details
    corner_size = 40
    corners = [(border_size, border_size),
               (output_size - border_size, border_size),
               (border_size, output_size - border_size),
               (output_size - border_size, output_size - border_size)]

    for cx, cy in corners:
        cv2.circle(canvas, (cx, cy), corner_size, GOLD_COLOR, 2)
        cv2.line(canvas, (cx - corner_size // 2, cy),
                (cx + corner_size // 2, cy), GOLD_COLOR, 1)
        cv2.line(canvas, (cx, cy - corner_size // 2),
                (cx, cy + corner_size // 2), GOLD_COLOR, 1)

    print(f"Saving result to: {output_path}")
    cv2.imwrite(output_path, canvas)
    print("Done!")


def main():
    """Main execution"""
    # Define paths
    input_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_image = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-pencil-smooth.png"

    try:
        process_image_to_pencil_blueprint(input_image, output_image, output_size=2000)
        print("\n✓ Blueprint conversion complete!")
        print(f"✓ Output saved to: {output_image}")

    except Exception as e:
        print(f"\n✗ Error during conversion: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
