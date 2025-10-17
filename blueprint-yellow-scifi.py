import cv2
import numpy as np
from typing import Tuple
import random

def add_corner_registration_marks(img: np.ndarray, color: Tuple[int, int, int]) -> None:
    """Add technical corner registration marks with crosshairs and circles."""
    h, w = img.shape[:2]
    thickness = 2
    mark_size = 40
    circle_radius = 15
    offset = 30

    corners = [
        (offset, offset),  # Top-left
        (w - offset, offset),  # Top-right
        (offset, h - offset),  # Bottom-left
        (w - offset, h - offset)  # Bottom-right
    ]

    for x, y in corners:
        # Crosshair
        cv2.line(img, (x - mark_size, y), (x + mark_size, y), color, thickness)
        cv2.line(img, (x, y - mark_size), (x, y + mark_size), color, thickness)

        # Circles
        cv2.circle(img, (x, y), circle_radius, color, thickness)
        cv2.circle(img, (x, y), circle_radius + 10, color, 1)

def add_edge_greebles(img: np.ndarray, color: Tuple[int, int, int]) -> None:
    """Add small technical details along edges."""
    h, w = img.shape[:2]

    # Top and bottom edge markers
    for x in range(100, w - 100, 200):
        # Top
        cv2.line(img, (x, 0), (x, 20), color, 2)
        cv2.line(img, (x - 5, 10), (x + 5, 10), color, 1)
        # Bottom
        cv2.line(img, (x, h), (x, h - 20), color, 2)
        cv2.line(img, (x - 5, h - 10), (x + 5, h - 10), color, 1)

    # Left and right edge markers
    for y in range(100, h - 100, 200):
        # Left
        cv2.line(img, (0, y), (20, y), color, 2)
        cv2.line(img, (10, y - 5), (10, y + 5), color, 1)
        # Right
        cv2.line(img, (w, y), (w - 20, y), color, 2)
        cv2.line(img, (w - 10, y - 5), (w - 10, y + 5), color, 1)

def add_technical_data_boxes(img: np.ndarray, color: Tuple[int, int, int]) -> None:
    """Add technical data boxes with random codes in corners."""
    h, w = img.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.4
    thickness = 1

    # Generate technical codes
    codes = [
        f"REG-{random.randint(1000, 9999)}",
        f"VER-{random.randint(100, 999)}",
        f"ID-{random.randint(10000, 99999)}",
        f"CHK-{random.randint(100, 999)}"
    ]

    positions = [
        (50, h - 100),  # Bottom-left
        (w - 200, h - 100),  # Bottom-right
        (50, 100),  # Top-left
        (w - 200, 100)  # Top-right
    ]

    for code, (x, y) in zip(codes, positions):
        # Box background
        cv2.rectangle(img, (x - 5, y - 15), (x + 150, y + 5), (20, 20, 20), -1)
        cv2.rectangle(img, (x - 5, y - 15), (x + 150, y + 5), color, 1)
        # Text
        cv2.putText(img, code, (x, y), font, font_scale, color, thickness)

def add_grid_coordinates(img: np.ndarray, color: Tuple[int, int, int]) -> None:
    """Add coordinate markers along edges."""
    h, w = img.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.35
    thickness = 1

    # Top coordinates (letters)
    letters = "ABCDEFGHIJ"
    spacing = (w - 100) // len(letters)
    for i, letter in enumerate(letters):
        x = 50 + i * spacing
        cv2.putText(img, letter, (x, 25), font, font_scale, color, thickness)

    # Left coordinates (numbers)
    numbers = range(1, 11)
    spacing = (h - 100) // len(numbers)
    for i, num in enumerate(numbers):
        y = 50 + i * spacing
        cv2.putText(img, str(num), (15, y), font, font_scale, color, thickness)

def add_subtle_grid(img: np.ndarray, grid_color: Tuple[int, int, int], spacing: int = 50) -> None:
    """Add subtle background grid lines."""
    h, w = img.shape[:2]

    # Vertical lines
    for x in range(spacing, w, spacing):
        cv2.line(img, (x, 0), (x, h), grid_color, 1)

    # Horizontal lines
    for y in range(spacing, h, spacing):
        cv2.line(img, (0, y), (w, y), grid_color, 1)

def extract_continuous_lines(image_path: str, output_size: int = 2000) -> np.ndarray:
    """
    Extract continuous lines using Canny + morphological closing.
    This method produced the best line quality in test-continuous-lines.png
    """
    # Load image
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = img[:, :, :3]
        img[alpha == 0] = [255, 255, 255]

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Bilateral filter for edge-preserving smoothing
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Canny edge detection with moderate thresholds
    edges = cv2.Canny(denoised, 50, 150, apertureSize=3)

    # Morphological closing to connect nearby lines
    # This is the key to continuous lines!
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Light dilation to strengthen lines
    dilated = cv2.dilate(closed, kernel, iterations=1)

    return dilated

def create_yellow_scifi_blueprint(
    input_path: str,
    output_path: str,
    output_size: int = 2000,
    line_color: Tuple[int, int, int] = (23, 182, 250),  # BGR format - bright yellow/gold
    grid_color: Tuple[int, int, int] = (30, 30, 30),  # Dark gray for subtle grid
    background_color: Tuple[int, int, int] = (0, 0, 0)  # Black background
) -> None:
    """
    Create yellow sci-fi blueprint with technical border elements.

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        output_size: Output dimensions (square)
        line_color: BGR color for lines (default: yellow #fab617)
        grid_color: BGR color for background grid (default: dark gray)
        background_color: BGR background color (default: black)
    """
    print(f"Processing: {input_path}")
    print(f"Line color (BGR): {line_color}")
    print(f"Output size: {output_size}x{output_size}px")

    # Extract continuous lines using the proven method
    print("Extracting continuous lines...")
    edges = extract_continuous_lines(input_path, output_size)

    # Resize to output size
    edges = cv2.resize(edges, (output_size, output_size), interpolation=cv2.INTER_LINEAR)

    # Create output canvas with black background
    print("Creating canvas with black background...")
    blueprint = np.zeros((output_size, output_size, 3), dtype=np.uint8)
    blueprint[:] = background_color

    # Add subtle grid lines first (behind everything)
    print("Adding subtle background grid...")
    add_subtle_grid(blueprint, grid_color, spacing=50)

    # Apply yellow lines where edges exist
    print("Applying yellow lines...")
    blueprint[edges > 0] = line_color

    # Add sci-fi border elements in same yellow color
    print("Adding corner registration marks...")
    add_corner_registration_marks(blueprint, line_color)

    print("Adding edge greebles...")
    add_edge_greebles(blueprint, line_color)

    print("Adding technical data boxes...")
    add_technical_data_boxes(blueprint, line_color)

    print("Adding grid coordinates...")
    add_grid_coordinates(blueprint, line_color)

    # Save output
    cv2.imwrite(output_path, blueprint)
    print(f"Saved: {output_path}")
    print(f"Size: {output_size}x{output_size}px")

if __name__ == "__main__":
    # Test with the working image
    input_path = "C:/Users/Ben Meyers/Documents/Mek Tycoon/TYCOON REACT 8-27/mek-tycoon-react/public/mek-images/1000px/aa1-ak1-bc2.webp"
    output_path = "C:/Users/Ben Meyers/Documents/Mek Tycoon/TYCOON REACT 8-27/mek-tycoon-react/public/mek-images/test-yellow-with-borders.png"

    create_yellow_scifi_blueprint(
        input_path=input_path,
        output_path=output_path,
        output_size=2000,
        line_color=(23, 182, 250),  # BGR: #fab617 yellow
        grid_color=(30, 30, 30),
        background_color=(0, 0, 0)
    )
