"""
Blueprint Converter - Continuous Lines Edition
Focuses on smooth, connected, flowing technical drawing lines
"""

import cv2
import numpy as np
from typing import Tuple

def create_continuous_lines(
    image_path: str,
    output_path: str,
    size: Tuple[int, int] = (2000, 2000),
    blur_strength: int = 3,
    canny_low: int = 30,
    canny_high: int = 90,
    line_thickness: int = 2
) -> None:
    """
    Convert image to technical drawing with continuous, flowing lines.

    Parameters:
    -----------
    image_path : str
        Path to input image
    output_path : str
        Path to save output
    size : tuple
        Output dimensions (width, height)
    blur_strength : int
        Gaussian blur kernel size (odd number, 3-7 recommended)
    canny_low : int
        Lower Canny threshold (20-40 for smooth lines)
    canny_high : int
        Upper Canny threshold (80-120 for smooth lines)
    line_thickness : int
        Line width in pixels (1-3 recommended)
    """

    # Load and resize image
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    # Resize to target dimensions
    img = cv2.resize(img, size, interpolation=cv2.INTER_LANCZOS4)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply bilateral filter to preserve edges while smoothing
    # This reduces noise without destroying edge connectivity
    smooth = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Apply gentle Gaussian blur for additional smoothing
    smooth = cv2.GaussianBlur(smooth, (blur_strength, blur_strength), 0)

    # Canny edge detection with lower thresholds for more complete edges
    edges = cv2.Canny(smooth, canny_low, canny_high)

    # Morphological closing to connect nearby line segments
    # This is KEY for continuous lines
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel_close, iterations=1)

    # Dilate slightly to ensure lines are visible and connected
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (line_thickness, line_thickness))
    edges = cv2.dilate(edges, kernel_dilate, iterations=1)

    # Remove small noise while preserving main lines
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_open, iterations=1)

    # Create smooth anti-aliased lines
    # Apply subtle Gaussian blur to smooth jagged edges without breaking lines
    edges = cv2.GaussianBlur(edges, (3, 3), 0)

    # Threshold to get clean binary image
    _, edges = cv2.threshold(edges, 50, 255, cv2.THRESH_BINARY)

    # Find and draw contours as continuous paths
    # This ensures lines are drawn as complete, connected shapes
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    # Create clean edge map by drawing contours
    edges_clean = np.zeros_like(edges)
    cv2.drawContours(edges_clean, contours, -1, 255, thickness=1)

    # Final dilation for desired line thickness
    if line_thickness > 1:
        kernel_final = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (line_thickness, line_thickness))
        edges_clean = cv2.dilate(edges_clean, kernel_final, iterations=1)

    # Apply final smoothing for anti-aliased appearance
    edges_smooth = cv2.GaussianBlur(edges_clean, (3, 3), 0)

    # Create pure black background
    output = np.zeros((size[1], size[0], 3), dtype=np.uint8)

    # Add subtle grid (very faint, won't interfere with main lines)
    grid_color = (15, 15, 15)  # Very dark gray
    grid_spacing = 50

    for i in range(0, size[1], grid_spacing):
        cv2.line(output, (0, i), (size[0], i), grid_color, 1)
    for i in range(0, size[0], grid_spacing):
        cv2.line(output, (i, 0), (i, size[1]), grid_color, 1)

    # Apply white lines on black background
    white_lines = np.stack([edges_smooth, edges_smooth, edges_smooth], axis=2)
    output = cv2.addWeighted(output, 1.0, white_lines, 1.0, 0)

    # Add corner registration marks (simple crosshairs + circles from first attempt)
    add_corner_marks(output, size)

    # Add border with technical annotations
    add_technical_border(output, size)

    # Save output
    cv2.imwrite(output_path, output, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Continuous line blueprint saved to: {output_path}")


def add_corner_marks(img: np.ndarray, size: Tuple[int, int]) -> None:
    """Add simple corner registration marks (crosshairs + circles)"""
    color = (100, 100, 100)  # Gray
    margin = 30
    mark_size = 20
    circle_radius = 15

    corners = [
        (margin, margin),  # Top-left
        (size[0] - margin, margin),  # Top-right
        (margin, size[1] - margin),  # Bottom-left
        (size[0] - margin, size[1] - margin)  # Bottom-right
    ]

    for x, y in corners:
        # Crosshair
        cv2.line(img, (x - mark_size, y), (x + mark_size, y), color, 1)
        cv2.line(img, (x, y - mark_size), (x, y + mark_size), color, 1)
        # Circle
        cv2.circle(img, (x, y), circle_radius, color, 1)


def add_technical_border(img: np.ndarray, size: Tuple[int, int]) -> None:
    """Add border with technical annotations"""
    border_color = (80, 80, 80)  # Dark gray
    margin = 20

    # Main border rectangle
    cv2.rectangle(img, (margin, margin), (size[0] - margin, size[1] - margin), border_color, 2)

    # Add small tick marks along border (sci-fi greebles)
    tick_spacing = 100
    tick_length = 10

    # Top and bottom edges
    for x in range(margin + tick_spacing, size[0] - margin, tick_spacing):
        cv2.line(img, (x, margin), (x, margin - tick_length), border_color, 1)
        cv2.line(img, (x, size[1] - margin), (x, size[1] - margin + tick_length), border_color, 1)

    # Left and right edges
    for y in range(margin + tick_spacing, size[1] - margin, tick_spacing):
        cv2.line(img, (margin, y), (margin - tick_length, y), border_color, 1)
        cv2.line(img, (size[0] - margin, y), (size[0] - margin + tick_length, y), border_color, 1)

    # Add technical text annotations
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.4
    font_thickness = 1
    text_color = (120, 120, 120)

    # Model designation
    cv2.putText(img, "MEK TECHNICAL SCHEMATIC", (margin + 10, margin - 5),
                font, font_scale, text_color, font_thickness)

    # Scale reference
    cv2.putText(img, "1:1 SCALE", (size[0] - margin - 80, size[1] - margin + 15),
                font, font_scale, text_color, font_thickness)


def create_contour_based_lines(
    image_path: str,
    output_path: str,
    size: Tuple[int, int] = (2000, 2000)
) -> None:
    """
    Alternative approach: Use contour detection for inherently continuous lines.
    This method prioritizes shape boundaries over edge pixels.
    """

    # Load and resize
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    img = cv2.resize(img, size, interpolation=cv2.INTER_LANCZOS4)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Strong bilateral filtering to simplify image while preserving edges
    smooth = cv2.bilateralFilter(gray, d=11, sigmaColor=100, sigmaSpace=100)

    # Adaptive thresholding to segment image into regions
    thresh = cv2.adaptiveThreshold(smooth, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 11, 2)

    # Morphological operations to clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel, iterations=1)

    # Find contours
    contours, hierarchy = cv2.findContours(morph, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create pure black background
    output = np.zeros((size[1], size[0], 3), dtype=np.uint8)

    # Add grid
    grid_color = (15, 15, 15)
    grid_spacing = 50
    for i in range(0, size[1], grid_spacing):
        cv2.line(output, (0, i), (size[0], i), grid_color, 1)
    for i in range(0, size[0], grid_spacing):
        cv2.line(output, (i, 0), (i, size[1]), grid_color, 1)

    # Draw contours as continuous white lines
    line_color = (255, 255, 255)
    cv2.drawContours(output, contours, -1, line_color, 2)

    # Apply subtle Gaussian blur for anti-aliasing
    output = cv2.GaussianBlur(output, (3, 3), 0)

    # Add corner marks and border
    add_corner_marks(output, size)
    add_technical_border(output, size)

    # Save
    cv2.imwrite(output_path, output, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Contour-based blueprint saved to: {output_path}")


if __name__ == "__main__":
    input_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"

    # Method 1: Continuous lines with enhanced morphological operations
    output_path_1 = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-continuous-lines.png"
    create_continuous_lines(
        input_path,
        output_path_1,
        size=(2000, 2000),
        blur_strength=3,
        canny_low=30,
        canny_high=90,
        line_thickness=2
    )

    # Method 2: Contour-based approach for comparison
    output_path_2 = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-contour-method.png"
    create_contour_based_lines(input_path, output_path_2, size=(2000, 2000))

    print("\nBoth methods completed!")
    print(f"Method 1 (Continuous lines): {output_path_1}")
    print(f"Method 2 (Contour-based): {output_path_2}")
    print("\nCompare both outputs to determine which has better line continuity.")
