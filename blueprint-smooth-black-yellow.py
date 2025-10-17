"""
Blueprint Converter - Smooth Black/Yellow Technical Drawing Style
Matches reference blue blueprint quality but adapted to black background with yellow lines.

Key features:
- Smooth, continuous lines (no dashes or dots)
- Pencil texture quality (subtle grain along lines)
- Variable opacity for depth
- Multi-pass edge detection for detail
- High-resolution processing with anti-aliasing
- Procedural grid paper background with sci-fi greebles
"""

import cv2
import numpy as np
from typing import Tuple
import random

def create_grid_paper_background(size: int = 2000, grid_color_intensity: int = 15) -> np.ndarray:
    """
    Create black grid paper background with subtle lines and grunge texture.

    Args:
        size: Image size in pixels (square)
        grid_color_intensity: Grid line brightness (0-255, default 15 for subtle)

    Returns:
        Black background with subtle grid
    """
    background = np.zeros((size, size, 3), dtype=np.uint8)

    # Major grid lines (every 100px)
    major_spacing = 100
    for i in range(0, size, major_spacing):
        cv2.line(background, (i, 0), (i, size), (grid_color_intensity, grid_color_intensity, grid_color_intensity), 1)
        cv2.line(background, (0, i), (size, i), (grid_color_intensity, grid_color_intensity, grid_color_intensity), 1)

    # Minor grid lines (every 20px)
    minor_spacing = 20
    minor_intensity = grid_color_intensity // 2
    for i in range(0, size, minor_spacing):
        if i % major_spacing != 0:  # Skip major grid positions
            cv2.line(background, (i, 0), (i, size), (minor_intensity, minor_intensity, minor_intensity), 1)
            cv2.line(background, (0, i), (size, i), (minor_intensity, minor_intensity, minor_intensity), 1)

    # Add subtle grunge texture
    noise = np.random.randint(0, 8, (size, size), dtype=np.uint8)
    noise_colored = cv2.cvtColor(noise, cv2.COLOR_GRAY2BGR)
    background = cv2.add(background, noise_colored)

    return background

def add_scifi_greebles(background: np.ndarray, border_size: int = 100) -> np.ndarray:
    """
    Add procedural sci-fi details to border area.

    Args:
        background: Base background image
        border_size: Size of border area for greebles

    Returns:
        Background with added greebles
    """
    height, width = background.shape[:2]
    result = background.copy()

    # Yellow color for greebles
    yellow = (23, 182, 250)  # BGR format for #fab617
    dim_yellow = (15, 120, 160)

    # Corner circles (technical drawing style)
    corner_radius = 30
    corners = [
        (corner_radius + 20, corner_radius + 20),
        (width - corner_radius - 20, corner_radius + 20),
        (corner_radius + 20, height - corner_radius - 20),
        (width - corner_radius - 20, height - corner_radius - 20)
    ]

    for x, y in corners:
        cv2.circle(result, (x, y), corner_radius, dim_yellow, 2)
        cv2.circle(result, (x, y), corner_radius - 10, dim_yellow, 1)
        # Crosshairs
        cv2.line(result, (x - 15, y), (x + 15, y), yellow, 1)
        cv2.line(result, (x, y - 15), (x, y + 15), yellow, 1)

    # Random technical markers along edges
    for _ in range(8):
        # Top edge
        x = random.randint(border_size, width - border_size)
        y = random.randint(10, 40)
        cv2.rectangle(result, (x - 3, y - 3), (x + 3, y + 3), dim_yellow, 1)
        cv2.line(result, (x, y), (x, y + 20), dim_yellow, 1)

        # Bottom edge
        x = random.randint(border_size, width - border_size)
        y = random.randint(height - 40, height - 10)
        cv2.circle(result, (x, y), 5, dim_yellow, 1)
        cv2.line(result, (x, y), (x, y - 20), dim_yellow, 1)

    return result

def extract_smooth_edges(image: np.ndarray, scale: float = 4.0) -> np.ndarray:
    """
    Multi-pass edge detection at high resolution for smooth, continuous lines.

    Process flow:
    1. Upscale to 4x resolution
    2. Multi-pass edge detection (Canny + Sobel + Laplacian)
    3. Combine and refine edges
    4. Downsample with anti-aliasing
    5. Add pencil texture

    Args:
        image: Input RGB image
        scale: Upscale factor for super-sampling (default 4.0)

    Returns:
        Grayscale edge map with smooth lines (0-255)
    """
    height, width = image.shape[:2]
    upscale_size = (int(width * scale), int(height * scale))

    # Convert to grayscale and upscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_upscaled = cv2.resize(gray, upscale_size, interpolation=cv2.INTER_CUBIC)

    # Preprocessing: bilateral filter to preserve edges while reducing noise
    denoised = cv2.bilateralFilter(gray_upscaled, d=9, sigmaColor=75, sigmaSpace=75)

    # Multi-pass edge detection
    # Pass 1: Canny with lower threshold (capture weak edges)
    edges_weak = cv2.Canny(denoised, 30, 90, apertureSize=3, L2gradient=True)

    # Pass 2: Canny with higher threshold (capture strong edges)
    edges_strong = cv2.Canny(denoised, 60, 180, apertureSize=3, L2gradient=True)

    # Pass 3: Sobel gradients (capture texture details)
    sobel_x = cv2.Sobel(denoised, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(denoised, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
    sobel_edges = np.uint8(np.clip(sobel_magnitude, 0, 255))
    _, sobel_binary = cv2.threshold(sobel_edges, 50, 255, cv2.THRESH_BINARY)

    # Pass 4: Laplacian (capture fine details)
    laplacian = cv2.Laplacian(denoised, cv2.CV_64F, ksize=3)
    laplacian_abs = np.abs(laplacian)
    laplacian_edges = np.uint8(np.clip(laplacian_abs, 0, 255))
    _, laplacian_binary = cv2.threshold(laplacian_edges, 30, 255, cv2.THRESH_BINARY)

    # Combine all edge maps with weights
    combined = np.zeros_like(edges_weak, dtype=np.float32)
    combined += edges_strong.astype(np.float32) * 1.0  # Strong edges: full weight
    combined += edges_weak.astype(np.float32) * 0.6    # Weak edges: medium weight
    combined += sobel_binary.astype(np.float32) * 0.5  # Sobel: adds texture
    combined += laplacian_binary.astype(np.float32) * 0.4  # Laplacian: fine details

    # Normalize to 0-255
    combined = np.clip(combined, 0, 255).astype(np.uint8)

    # Morphological operations to connect nearby lines
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Downsample with Gaussian blur for anti-aliasing
    # First blur to eliminate high-frequency artifacts
    combined_blurred = cv2.GaussianBlur(combined, (5, 5), 1.5)

    # Then downsample
    edges_final = cv2.resize(combined_blurred, (width, height), interpolation=cv2.INTER_AREA)

    return edges_final

def add_pencil_texture(edges: np.ndarray, texture_strength: float = 0.15) -> np.ndarray:
    """
    Add subtle pencil grain texture to edge lines.

    Args:
        edges: Grayscale edge map (0-255)
        texture_strength: Amount of texture to apply (0.0-1.0)

    Returns:
        Edge map with pencil texture
    """
    # Create noise texture
    noise = np.random.normal(0, 25, edges.shape).astype(np.float32)

    # Apply texture only where edges exist
    edges_float = edges.astype(np.float32)
    edge_mask = (edges > 0).astype(np.float32)

    # Blend noise with edges
    textured = edges_float + (noise * edge_mask * texture_strength)
    textured = np.clip(textured, 0, 255).astype(np.uint8)

    return textured

def apply_variable_opacity(edges: np.ndarray, min_opacity: float = 0.4, max_opacity: float = 1.0) -> np.ndarray:
    """
    Apply variable opacity based on edge strength for depth perception.

    Stronger edges = more opaque
    Weaker edges = more transparent

    Args:
        edges: Grayscale edge map (0-255)
        min_opacity: Minimum opacity for weak edges (0.0-1.0)
        max_opacity: Maximum opacity for strong edges (0.0-1.0)

    Returns:
        Edge map with variable opacity applied
    """
    # Normalize edge values to 0-1
    edges_normalized = edges.astype(np.float32) / 255.0

    # Apply opacity mapping: map edge strength to opacity range
    opacity = min_opacity + (edges_normalized * (max_opacity - min_opacity))

    # Apply opacity to edges
    result = (edges_normalized * opacity * 255.0).astype(np.uint8)

    return result

def create_blueprint(
    input_path: str,
    output_path: str,
    output_size: int = 2000,
    yellow_color: Tuple[int, int, int] = (23, 182, 250),  # BGR #fab617
    grid_intensity: int = 15,
    add_greebles: bool = True,
    pencil_texture: float = 0.15,
    variable_opacity: bool = True
) -> None:
    """
    Convert image to smooth black/yellow technical blueprint style.

    Args:
        input_path: Path to input image
        output_path: Path to save output blueprint
        output_size: Output image size in pixels (square)
        yellow_color: Line color in BGR format (default #fab617)
        grid_intensity: Grid line brightness (0-255)
        add_greebles: Whether to add sci-fi border details
        pencil_texture: Pencil grain strength (0.0-1.0)
        variable_opacity: Whether to apply variable opacity for depth
    """
    print(f"Loading image: {input_path}")
    image = cv2.imread(input_path)
    if image is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    print(f"Original size: {image.shape[1]}x{image.shape[0]}")

    # Resize to working size (we'll process at higher resolution internally)
    working_size = 1000  # Process at 1000px, upscale internally to 4000px
    image_resized = cv2.resize(image, (working_size, working_size), interpolation=cv2.INTER_LANCZOS4)

    print("Extracting edges (multi-pass high-resolution processing)...")
    edges = extract_smooth_edges(image_resized, scale=4.0)

    print("Adding pencil texture...")
    if pencil_texture > 0:
        edges = add_pencil_texture(edges, pencil_texture)

    print("Applying variable opacity...")
    if variable_opacity:
        edges = apply_variable_opacity(edges, min_opacity=0.4, max_opacity=1.0)

    # Resize edges to final output size
    edges_final = cv2.resize(edges, (output_size, output_size), interpolation=cv2.INTER_LANCZOS4)

    print("Creating background...")
    background = create_grid_paper_background(output_size, grid_intensity)

    if add_greebles:
        print("Adding sci-fi greebles...")
        background = add_scifi_greebles(background, border_size=100)

    print("Applying yellow color to edges...")
    # Create yellow line layer
    yellow_lines = np.zeros((output_size, output_size, 3), dtype=np.uint8)
    yellow_lines[:] = yellow_color

    # Use edges as alpha mask
    edge_mask = edges_final.astype(np.float32) / 255.0
    edge_mask_3ch = np.stack([edge_mask, edge_mask, edge_mask], axis=2)

    # Blend yellow lines onto background
    result = background.astype(np.float32) * (1.0 - edge_mask_3ch) + yellow_lines.astype(np.float32) * edge_mask_3ch
    result = np.clip(result, 0, 255).astype(np.uint8)

    # Final subtle blur to soften any remaining aliasing
    result = cv2.GaussianBlur(result, (3, 3), 0.5)

    print(f"Saving blueprint: {output_path}")
    cv2.imwrite(output_path, result, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Done! Output size: {output_size}x{output_size}")

def main():
    """
    Main execution: Convert test image to smooth black/yellow blueprint.
    """
    input_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-smooth-black-yellow.png"

    create_blueprint(
        input_path=input_path,
        output_path=output_path,
        output_size=2000,
        yellow_color=(23, 182, 250),  # BGR format for #fab617
        grid_intensity=15,
        add_greebles=True,
        pencil_texture=0.15,
        variable_opacity=True
    )

if __name__ == "__main__":
    main()
