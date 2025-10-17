"""
Blueprint Converter - Reference Quality Match
Produces clean, smooth technical blueprints matching the quality of reference images.
"""

import cv2
import numpy as np
from typing import Tuple

def create_reference_quality_blueprint(
    input_path: str,
    output_path: str,
    output_size: int = 2000,
    style: str = "solid"  # "solid" or "stippled"
) -> None:
    """
    Create a technical blueprint matching reference quality.

    Args:
        input_path: Path to source image
        output_path: Path to save blueprint
        output_size: Output dimensions (square)
        style: "solid" for clean lines, "stippled" for dotted effect
    """

    # Load image at high resolution
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    print(f"Loaded image: {img.shape}")

    # Work at 2x resolution for smoothness
    work_size = output_size * 2

    # Resize to working resolution
    img_resized = cv2.resize(img, (work_size, work_size), interpolation=cv2.INTER_LANCZOS4)

    # Convert to grayscale
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    print("Converted to grayscale")

    # Apply bilateral filter to reduce noise while preserving edges
    denoised = cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)
    print("Applied bilateral filter")

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    print("Enhanced contrast")

    if style == "stippled":
        # Create stippled effect like test-blueprint-1000px.png
        edges = create_stippled_edges(enhanced)
    else:
        # Create solid lines like test-ultra-detailed.png
        edges = create_solid_edges(enhanced)

    print(f"Created {style} edges")

    # Apply Gaussian blur for anti-aliasing
    edges_smooth = cv2.GaussianBlur(edges, (3, 3), 0.5)
    print("Applied anti-aliasing")

    # Resize to final output size with high-quality interpolation
    edges_final = cv2.resize(edges_smooth, (output_size, output_size),
                            interpolation=cv2.INTER_LANCZOS4)

    # Create blueprint with black background and yellow lines
    blueprint = create_yellow_blueprint(edges_final)
    print("Applied yellow color scheme")

    # Add subtle grid pattern
    blueprint = add_subtle_grid(blueprint, grid_size=50, opacity=0.03)
    print("Added grid pattern")

    # Add slight paper texture
    blueprint = add_paper_texture(blueprint, intensity=0.02)
    print("Added paper texture")

    # Save result
    cv2.imwrite(output_path, blueprint)
    print(f"Saved blueprint to: {output_path}")
    print(f"Final size: {blueprint.shape}")


def create_solid_edges(gray: np.ndarray) -> np.ndarray:
    """
    Create clean solid edges like test-ultra-detailed.png reference.
    """
    # Multi-scale edge detection for better detail
    edges1 = cv2.Canny(gray, 30, 90, apertureSize=3)
    edges2 = cv2.Canny(gray, 50, 150, apertureSize=3)

    # Combine edges
    edges = cv2.addWeighted(edges1, 0.5, edges2, 0.5, 0)

    # Slight dilation to strengthen lines
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges = cv2.dilate(edges, kernel, iterations=1)

    return edges


def create_stippled_edges(gray: np.ndarray) -> np.ndarray:
    """
    Create stippled/dotted effect like test-blueprint-1000px.png reference.
    """
    # Detect edges at multiple scales
    edges1 = cv2.Canny(gray, 20, 60, apertureSize=3)
    edges2 = cv2.Canny(gray, 40, 120, apertureSize=3)
    edges3 = cv2.Canny(gray, 60, 180, apertureSize=3)

    # Combine with different weights
    edges = np.maximum(edges1, np.maximum(edges2, edges3))

    # Add stippling effect using adaptive thresholding
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    stipple = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # Combine edges with light stippling in darker areas
    mask = gray < 100  # Only in darker regions
    stipple_light = (stipple * 0.3).astype(np.uint8)
    stipple_light[~mask] = 0

    # Merge edges and stippling
    result = np.maximum(edges, stipple_light)

    return result


def create_yellow_blueprint(edges: np.ndarray) -> np.ndarray:
    """
    Create black background with yellow lines (#fab617).
    """
    # Create black background
    h, w = edges.shape
    blueprint = np.zeros((h, w, 3), dtype=np.uint8)

    # Set background to pure black
    blueprint[:] = (0, 0, 0)

    # Apply yellow color to edges (#fab617 = RGB(250, 182, 23) = BGR(23, 182, 250))
    yellow_bgr = (23, 182, 250)

    # Create smooth gradient for edges (not binary)
    edge_mask = edges.astype(np.float32) / 255.0

    for i in range(3):
        blueprint[:, :, i] = (edge_mask * yellow_bgr[i]).astype(np.uint8)

    return blueprint


def add_subtle_grid(image: np.ndarray, grid_size: int = 50, opacity: float = 0.03) -> np.ndarray:
    """
    Add subtle grid pattern for technical drawing feel.
    """
    result = image.copy()
    h, w = image.shape[:2]

    # Grid color (dim yellow)
    grid_color = (12, 91, 125)  # Dim version of yellow
    intensity = int(255 * opacity)

    # Draw vertical lines
    for x in range(0, w, grid_size):
        cv2.line(result, (x, 0), (x, h), grid_color, 1)

    # Draw horizontal lines
    for y in range(0, h, grid_size):
        cv2.line(result, (0, y), (w, y), grid_color, 1)

    return result


def add_paper_texture(image: np.ndarray, intensity: float = 0.02) -> np.ndarray:
    """
    Add subtle paper texture without creating noise artifacts.
    """
    h, w = image.shape[:2]

    # Create very subtle noise
    noise = np.random.normal(0, intensity * 255, (h, w, 3))

    # Apply only to non-line areas (preserve line quality)
    line_mask = np.any(image > 20, axis=2)
    noise[line_mask] = 0

    # Add noise
    result = image.astype(np.float32) + noise
    result = np.clip(result, 0, 255).astype(np.uint8)

    return result


if __name__ == "__main__":
    import sys

    # Base paths
    base_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"

    input_path = f"{base_path}/public/mek-images/1000px/aa1-ak1-bc2.webp"

    # Test both styles
    print("=" * 60)
    print("Creating SOLID LINE blueprint (like test-ultra-detailed.png)")
    print("=" * 60)
    output_solid = f"{base_path}/public/mek-images/test-clean-reference-match.png"
    create_reference_quality_blueprint(input_path, output_solid, output_size=2000, style="solid")

    print("\n" + "=" * 60)
    print("Creating STIPPLED blueprint (like test-blueprint-1000px.png)")
    print("=" * 60)
    output_stippled = f"{base_path}/public/mek-images/test-stippled-reference-match.png"
    create_reference_quality_blueprint(input_path, output_stippled, output_size=2000, style="stippled")

    print("\n" + "=" * 60)
    print("COMPLETE")
    print("=" * 60)
    print(f"Solid lines: {output_solid}")
    print(f"Stippled: {output_stippled}")
