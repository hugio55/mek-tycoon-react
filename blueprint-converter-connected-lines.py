#!/usr/bin/env python3
"""
Blueprint Converter - Connected Smooth Lines
Creates continuous, smooth technical drawing lines (not fragmented dots)
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
    """Creates subtle pencil grain texture"""
    h, w = shape

    # Fine directional noise
    texture = np.random.normal(0, 12, (h, w)).astype(np.float32)
    texture = cv2.GaussianBlur(texture, (3, 3), 0.5)

    # Add subtle horizontal grain (pencil stroke direction)
    horizontal_grain = np.random.normal(0, 8, (h, w // 8))
    horizontal_grain = cv2.resize(horizontal_grain, (w, h), interpolation=cv2.INTER_LINEAR)
    texture += horizontal_grain

    # Normalize to subtle variation around 1.0
    texture = texture - texture.mean()
    texture = texture / (texture.std() * 3)
    texture = np.clip(texture * 0.15 + 1.0, 0.85, 1.15)

    return texture


def create_smooth_connected_edges(gray: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Creates smooth, connected edges using multiple techniques
    Returns edges and gradient strength for variable opacity
    """
    h, w = gray.shape

    # Multi-scale preprocessing
    print("  - Bilateral filtering for edge preservation...")
    denoised = cv2.bilateralFilter(gray, 11, 80, 80)

    # Enhance contrast
    print("  - Enhancing contrast...")
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Calculate gradients (for opacity variation later)
    print("  - Calculating gradient magnitude...")
    sobelx = cv2.Sobel(enhanced, cv2.CV_64F, 1, 0, ksize=5)
    sobely = cv2.Sobel(enhanced, cv2.CV_64F, 0, 1, ksize=5)
    gradient_mag = np.sqrt(sobelx**2 + sobely**2)
    gradient_mag = np.clip(gradient_mag, 0, 255).astype(np.uint8)

    # Multi-threshold Canny for complete edge detection
    print("  - Multi-scale Canny edge detection...")
    # Lower threshold for weak edges
    edges_weak = cv2.Canny(enhanced, 20, 60, apertureSize=5, L2gradient=True)
    # Medium threshold for main structure
    edges_medium = cv2.Canny(enhanced, 40, 120, apertureSize=5, L2gradient=True)
    # Higher threshold for strong edges
    edges_strong = cv2.Canny(enhanced, 60, 180, apertureSize=5, L2gradient=True)

    # Combine: strong edges fully, medium edges 70%, weak edges 40%
    edges = np.zeros_like(edges_weak, dtype=np.float32)
    edges += edges_strong.astype(np.float32)
    edges += edges_medium.astype(np.float32) * 0.7
    edges += edges_weak.astype(np.float32) * 0.4
    edges = np.clip(edges, 0, 255).astype(np.uint8)

    # Connect nearby edges aggressively
    print("  - Connecting nearby edges...")
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel_connect, iterations=2)

    # Fill small gaps
    kernel_fill = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges = cv2.dilate(edges, kernel_fill, iterations=1)

    # Clean up noise while preserving structure
    print("  - Cleaning small noise...")
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_clean)

    return edges, gradient_mag


def apply_variable_line_width(edges: np.ndarray, min_width: int = 1, max_width: int = 3) -> np.ndarray:
    """
    Creates variable-width lines - thicker at intersections, thinner at details
    """
    # Create distance transform for width variation
    edges_binary = (edges > 128).astype(np.uint8) * 255

    # Calculate local edge density (more edges nearby = thicker lines)
    kernel = np.ones((15, 15), np.float32) / 225
    edge_density = cv2.filter2D(edges.astype(np.float32), -1, kernel)
    edge_density = edge_density / edge_density.max() if edge_density.max() > 0 else edge_density

    # Variable width: thicker where edges are dense
    width_map = min_width + (edge_density * (max_width - min_width))

    # Apply variable width by dilating with adaptive kernel
    result = edges.copy().astype(np.float32)

    # Create thicker lines based on width map
    kernel_size = max_width * 2 + 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    dilated = cv2.dilate(edges, kernel, iterations=1).astype(np.float32)

    # Blend based on width map
    result = edges.astype(np.float32) * (1 - edge_density * 0.5) + dilated * (edge_density * 0.5)
    result = np.clip(result, 0, 255).astype(np.uint8)

    return result


def add_line_overshoot(edges: np.ndarray, overshoot: int = 3) -> np.ndarray:
    """Extends line endpoints slightly (hand-drawn effect)"""
    # Find corners/endpoints using Harris corner detection
    edges_float = edges.astype(np.float32) / 255.0
    corners = cv2.cornerHarris(edges_float, blockSize=2, ksize=3, k=0.04)

    # Threshold for corner points
    corner_threshold = corners.max() * 0.01 if corners.max() > 0 else 0
    corner_points = corners > corner_threshold

    # Dilate corners slightly to create overshoot
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (overshoot, overshoot))
    extended = cv2.dilate(corner_points.astype(np.uint8) * 255, kernel, iterations=1)

    # Combine with original edges
    result = cv2.bitwise_or(edges, extended)

    return result


def apply_pencil_smoothness(lines: np.ndarray) -> np.ndarray:
    """
    Applies multiple smoothing passes for pencil-like quality
    """
    # First pass: medium Gaussian for overall smoothness
    smooth1 = cv2.GaussianBlur(lines, (5, 5), 1.2)

    # Second pass: light bilateral to preserve edges while smoothing
    smooth2 = cv2.bilateralFilter(smooth1, 5, 50, 50)

    # Third pass: very light Gaussian for final anti-aliasing
    smooth3 = cv2.GaussianBlur(smooth2, (3, 3), 0.5)

    return smooth3


def process_image_to_pencil_blueprint(input_path: str, output_path: str, output_size: int = 2000) -> None:
    """
    Converts image to smooth pencil-style technical drawing with connected lines
    """
    print(f"Loading image: {input_path}")
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    # Process at 2x resolution for better quality
    processing_size = output_size * 2

    print(f"Resizing to {processing_size}x{processing_size} for processing...")
    h, w = img.shape[:2]
    if h != processing_size or w != processing_size:
        img = cv2.resize(img, (processing_size, processing_size), interpolation=cv2.INTER_LANCZOS4)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    print("Creating smooth connected edges...")
    edges, gradient_mag = create_smooth_connected_edges(gray)

    print("Applying variable line width...")
    thick_edges = apply_variable_line_width(edges, min_width=2, max_width=4)

    print("Adding line overshoot effect...")
    thick_edges = add_line_overshoot(thick_edges, overshoot=4)

    print("Applying pencil smoothness...")
    smooth_lines = apply_pencil_smoothness(thick_edges)

    print("Applying variable opacity based on edge strength...")
    # Normalize gradient magnitude
    gradient_norm = gradient_mag.astype(np.float32)
    if gradient_norm.max() > 0:
        gradient_norm = gradient_norm / gradient_norm.max()

    # Apply opacity: stronger edges = more opaque (0.6 to 1.0 range)
    opacity_map = np.zeros_like(smooth_lines, dtype=np.float32)
    mask = smooth_lines > 10
    opacity_map[mask] = 0.6 + (gradient_norm[mask] * 0.4)

    # Apply to lines
    variable_opacity = (smooth_lines.astype(np.float32) * opacity_map).astype(np.uint8)

    print(f"Downsampling to {output_size}x{output_size}...")
    # Downsample for final anti-aliasing
    final_lines = cv2.resize(variable_opacity, (output_size, output_size), interpolation=cv2.INTER_AREA)

    # Additional light smoothing after downsample
    final_lines = cv2.GaussianBlur(final_lines, (3, 3), 0.5)

    print("Creating pencil texture...")
    texture = create_pencil_texture((output_size, output_size))

    print("Building final blueprint canvas...")
    # Create background with subtle grid
    canvas = np.full((output_size, output_size, 3), BACKGROUND, dtype=np.uint8)

    # Draw subtle grid
    grid_spacing = 40
    for i in range(0, output_size, grid_spacing):
        cv2.line(canvas, (i, 0), (i, output_size), GRID_COLOR, 1, cv2.LINE_AA)
        cv2.line(canvas, (0, i), (output_size, i), GRID_COLOR, 1, cv2.LINE_AA)

    # Apply lines with texture
    canvas_float = canvas.astype(np.float32)

    # Create gold line layer
    line_layer = np.zeros_like(canvas_float)
    line_layer[:, :] = GOLD_COLOR

    # Apply pencil texture variation
    for c in range(3):
        line_layer[:, :, c] *= texture

    # Blend using line opacity
    line_alpha = (final_lines.astype(np.float32) / 255.0)
    line_alpha = np.stack([line_alpha] * 3, axis=-1)

    canvas_float = canvas_float * (1 - line_alpha) + line_layer * line_alpha

    # Add subtle glow
    glow = cv2.GaussianBlur(final_lines, (21, 21), 7.0)
    glow_alpha = (glow.astype(np.float32) / 255.0) * 0.25
    glow_alpha = np.stack([glow_alpha] * 3, axis=-1)

    glow_layer = np.zeros_like(canvas_float)
    glow_layer[:, :] = YELLOW_LIGHT

    canvas_float = canvas_float * (1 - glow_alpha) + glow_layer * glow_alpha

    canvas = np.clip(canvas_float, 0, 255).astype(np.uint8)

    print("Adding sci-fi border elements...")
    # Add border with technical details
    border_size = 80

    # Top border
    cv2.rectangle(canvas, (0, 0), (output_size, border_size), (30, 30, 30), -1)
    cv2.line(canvas, (0, border_size), (output_size, border_size), GOLD_COLOR, 2, cv2.LINE_AA)

    # Technical details
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
