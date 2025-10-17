"""
Professional Architectural Blueprint Converter
Creates technical drawings with standardized information cards
"""

import cv2
import numpy as np
from typing import Tuple
import os

# Blueprint color scheme (matching reference images)
BLUEPRINT_BLUE = (158, 95, 43)  # BGR format: #2B5F9E
LINE_WHITE = (255, 255, 255)
GRID_COLOR = (180, 120, 70)  # Lighter blue for grid lines
TEXT_COLOR = (255, 255, 255)

# Canvas dimensions
CANVAS_WIDTH = 2000
CANVAS_HEIGHT = 2000
DRAWING_AREA_HEIGHT = 1700
INFO_CARD_HEIGHT = 300

def create_blueprint_background(width: int, height: int) -> np.ndarray:
    """Create architectural blueprint background with grid and registration marks."""
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    canvas[:] = BLUEPRINT_BLUE

    # Add subtle grid pattern (every 100px)
    grid_spacing = 100
    for x in range(0, width, grid_spacing):
        cv2.line(canvas, (x, 0), (x, DRAWING_AREA_HEIGHT), GRID_COLOR, 1)
    for y in range(0, DRAWING_AREA_HEIGHT, grid_spacing):
        cv2.line(canvas, (0, y), (width, y), GRID_COLOR, 1)

    # Add corner registration marks
    mark_size = 30
    mark_offset = 20
    corners = [
        (mark_offset, mark_offset),  # Top-left
        (width - mark_offset, mark_offset),  # Top-right
        (mark_offset, DRAWING_AREA_HEIGHT - mark_offset),  # Bottom-left
        (width - mark_offset, DRAWING_AREA_HEIGHT - mark_offset)  # Bottom-right
    ]

    for x, y in corners:
        # Crosshairs
        cv2.line(canvas, (x - mark_size, y), (x + mark_size, y), LINE_WHITE, 2)
        cv2.line(canvas, (x, y - mark_size), (x, y + mark_size), LINE_WHITE, 2)
        # Circle
        cv2.circle(canvas, (x, y), mark_size // 2, LINE_WHITE, 2)

    return canvas

def extract_contour_lines(image: np.ndarray) -> np.ndarray:
    """
    Extract clean contour lines from 3D render using multi-stage edge detection.
    Focuses on structural outlines without texture fill.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Stage 1: Bilateral filter to reduce texture while preserving edges
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Stage 2: Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Stage 3: Canny edge detection with conservative thresholds
    edges_main = cv2.Canny(enhanced, 30, 90, apertureSize=3)

    # Stage 4: Morphological operations to clean and strengthen lines
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges_closed = cv2.morphologyEx(edges_main, cv2.MORPH_CLOSE, kernel_close)

    # Stage 5: Find contours and redraw with variable line weights
    contours, hierarchy = cv2.findContours(edges_closed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create clean line drawing
    line_drawing = np.zeros_like(edges_main)

    # Sort contours by area (larger = thicker lines for main structure)
    contours_with_area = [(cv2.contourArea(c), c) for c in contours]
    contours_with_area.sort(reverse=True, key=lambda x: x[0])

    # Draw contours with variable thickness
    for i, (area, contour) in enumerate(contours_with_area):
        if area < 10:  # Skip tiny noise
            continue

        # Thickness based on hierarchy level
        if i < len(contours_with_area) * 0.1:  # Top 10% = thick lines (main structure)
            thickness = 3
        elif i < len(contours_with_area) * 0.3:  # Next 20% = medium lines
            thickness = 2
        else:  # Details = thin lines
            thickness = 1

        cv2.drawContours(line_drawing, [contour], -1, 255, thickness)

    # Stage 6: Final cleanup - remove isolated pixels
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    line_drawing = cv2.morphologyEx(line_drawing, cv2.MORPH_OPEN, kernel_open)

    return line_drawing

def create_info_card_template(canvas: np.ndarray, unit_code: str, classification: str,
                              variant: str, series: str) -> None:
    """
    Create standardized technical information card at bottom of blueprint.
    This template is IDENTICAL across all outputs, only text content changes.
    """
    card_top = DRAWING_AREA_HEIGHT
    card_bottom = CANVAS_HEIGHT
    card_left = 100
    card_right = CANVAS_WIDTH - 100

    # Main card border (double line for professional look)
    cv2.rectangle(canvas, (card_left, card_top + 40), (card_right, card_bottom - 40),
                  LINE_WHITE, 3)
    cv2.rectangle(canvas, (card_left + 10, card_top + 50), (card_right - 10, card_bottom - 50),
                  LINE_WHITE, 1)

    # Title section (left side)
    title_x = card_left + 40
    title_y = card_top + 100

    # "UNIT DESIGNATION" label
    cv2.putText(canvas, "UNIT DESIGNATION:", (title_x, title_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, LINE_WHITE, 1)

    # Unit code (large)
    cv2.putText(canvas, unit_code, (title_x, title_y + 50),
                cv2.FONT_HERSHEY_DUPLEX, 1.5, LINE_WHITE, 2)

    # Vertical divider line
    divider_x = card_left + 500
    cv2.line(canvas, (divider_x, card_top + 60), (divider_x, card_bottom - 60),
             LINE_WHITE, 2)

    # Data fields (right side, three columns)
    field_start_x = divider_x + 60
    field_y = card_top + 90
    field_spacing = 450

    # Field 1: CLASSIFICATION
    cv2.putText(canvas, "CLASSIFICATION:", (field_start_x, field_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, LINE_WHITE, 1)
    cv2.putText(canvas, classification, (field_start_x, field_y + 35),
                cv2.FONT_HERSHEY_DUPLEX, 0.9, LINE_WHITE, 2)

    # Field 2: VARIANT
    cv2.putText(canvas, "VARIANT:", (field_start_x + field_spacing, field_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, LINE_WHITE, 1)
    cv2.putText(canvas, variant, (field_start_x + field_spacing, field_y + 35),
                cv2.FONT_HERSHEY_DUPLEX, 0.9, LINE_WHITE, 2)

    # Field 3: SERIES
    cv2.putText(canvas, "SERIES:", (field_start_x + field_spacing * 2, field_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, LINE_WHITE, 1)
    cv2.putText(canvas, series, (field_start_x + field_spacing * 2, field_y + 35),
                cv2.FONT_HERSHEY_DUPLEX, 0.9, LINE_WHITE, 2)

    # Bottom text line (technical notes)
    bottom_text_y = card_bottom - 70
    cv2.putText(canvas, "TECHNICAL SPECIFICATION DOCUMENT - MEK TYCOON PROJECT",
                (card_left + 40, bottom_text_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, LINE_WHITE, 1)

def process_mek_to_blueprint(input_path: str, output_path: str,
                             unit_code: str, classification: str = "STANDARD",
                             variant: str = "", series: str = "ALPHA-01") -> None:
    """
    Convert Mek image to professional architectural blueprint with info card.

    Args:
        input_path: Path to input Mek image
        output_path: Path to save blueprint
        unit_code: Unit designation code (e.g., "UNIT-AA1-AK1-BC2")
        classification: Classification rank (e.g., "STANDARD", "ELITE", "PROTOTYPE")
        variant: Variant code (defaults to extracted from filename)
        series: Series identifier (default: "ALPHA-01")
    """
    # Load image
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input image not found: {input_path}")

    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Failed to load image: {input_path}")

    print(f"Processing: {input_path}")
    print(f"Input size: {img.shape[1]}x{img.shape[0]}")

    # Extract variant from filename if not provided
    if not variant:
        filename = os.path.basename(input_path)
        variant = filename.replace('.webp', '').replace('.png', '').upper()

    # Step 1: Create blueprint background
    canvas = create_blueprint_background(CANVAS_WIDTH, CANVAS_HEIGHT)
    print("Created blueprint background with grid")

    # Step 2: Extract contour lines from Mek image
    print("Extracting contour lines (multi-stage edge detection)...")
    line_drawing = extract_contour_lines(img)

    # Step 3: Resize line drawing to fit in drawing area (centered)
    h, w = line_drawing.shape
    max_size = min(CANVAS_WIDTH - 300, DRAWING_AREA_HEIGHT - 300)  # Leave margins
    scale = min(max_size / w, max_size / h)
    new_w, new_h = int(w * scale), int(h * scale)

    resized_lines = cv2.resize(line_drawing, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    print(f"Resized drawing: {new_w}x{new_h} (scale: {scale:.2f})")

    # Step 4: Center the drawing in the drawing area
    offset_x = (CANVAS_WIDTH - new_w) // 2
    offset_y = (DRAWING_AREA_HEIGHT - new_h) // 2

    # Composite white lines onto blue background
    for y in range(new_h):
        for x in range(new_w):
            if resized_lines[y, x] > 128:  # Line pixel
                canvas[offset_y + y, offset_x + x] = LINE_WHITE

    print(f"Positioned drawing at ({offset_x}, {offset_y})")

    # Step 5: Add standardized information card
    print("Adding information card template...")
    create_info_card_template(canvas, unit_code, classification, variant, series)

    # Save output
    cv2.imwrite(output_path, canvas, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Blueprint saved: {output_path}\n")

def main():
    """Process the two test Mek images with standardized template."""

    base_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"

    # Test cases with identical info card template
    test_cases = [
        {
            'input_path': os.path.join(base_path, 'public', 'mek-images', '1000px', 'aa1-ak1-bc2.webp'),
            'output_path': os.path.join(base_path, 'public', 'mek-images', 'blueprint-mech-1.png'),
            'unit_code': 'UNIT-AA1-AK1-BC2',
            'classification': 'STANDARD',
            'variant': 'AA1-AK1-BC2',
            'series': 'ALPHA-01'
        },
        {
            'input_path': os.path.join(base_path, 'public', 'mek-images', '1000px', 'aa1-bi1-ap1.webp'),
            'output_path': os.path.join(base_path, 'public', 'mek-images', 'blueprint-mech-2.png'),
            'unit_code': 'UNIT-AA1-BI1-AP1',
            'classification': 'ELITE',
            'variant': 'AA1-BI1-AP1',
            'series': 'ALPHA-02'
        }
    ]

    print("=" * 70)
    print("Professional Architectural Blueprint Converter")
    print("Creating technical drawings with standardized information cards")
    print("=" * 70)
    print()

    for i, test in enumerate(test_cases, 1):
        print(f"Processing test case {i}/2:")
        try:
            process_mek_to_blueprint(**test)
        except Exception as e:
            print(f"ERROR: {e}\n")

    print("=" * 70)
    print("Processing complete! Check outputs:")
    print("  - public/mek-images/blueprint-mech-1.png")
    print("  - public/mek-images/blueprint-mech-2.png")
    print()
    print("Both blueprints use IDENTICAL info card template")
    print("Only the Mek drawing differs between outputs")
    print("=" * 70)

if __name__ == "__main__":
    main()
