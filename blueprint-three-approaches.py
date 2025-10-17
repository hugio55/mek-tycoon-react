"""
Blueprint Converter - Three Architectural Approaches
Creates clear, recognizable technical drawings with overshoot effects
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, List

# Configuration
INPUT_PATH = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
OUTPUT_DIR = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images"
OUTPUT_SIZE = 2000

# Color scheme - yellow/gold on black
BACKGROUND_COLOR = (0, 0, 0)  # Black
LINE_COLOR_MAIN = (0, 215, 255)  # Gold/yellow (BGR)
LINE_COLOR_DETAIL = (0, 180, 220)  # Slightly darker gold
LINE_COLOR_CONSTRUCTION = (0, 100, 150)  # Dim gold for construction lines


def load_and_prepare_image(path: str, target_size: int) -> Tuple[np.ndarray, np.ndarray]:
    """Load image and prepare for processing"""
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Could not load image: {path}")

    # Handle transparency if present
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = img[:, :, :3]
    else:
        alpha = None

    # Resize to target
    img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)
    if alpha is not None:
        alpha = cv2.resize(alpha, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)

    return img, alpha


def create_base_canvas(size: int) -> np.ndarray:
    """Create black canvas with subtle grid"""
    canvas = np.zeros((size, size, 3), dtype=np.uint8)
    canvas[:] = BACKGROUND_COLOR

    # Add subtle grid (every 100px)
    grid_color = (15, 15, 15)
    grid_spacing = 100
    for i in range(0, size, grid_spacing):
        cv2.line(canvas, (i, 0), (i, size), grid_color, 1)
        cv2.line(canvas, (0, i), (size, i), grid_color, 1)

    # Add corner registration marks
    mark_len = 40
    mark_color = (0, 100, 150)
    margin = 30
    # Top-left
    cv2.line(canvas, (margin, margin), (margin + mark_len, margin), mark_color, 2)
    cv2.line(canvas, (margin, margin), (margin, margin + mark_len), mark_color, 2)
    # Top-right
    cv2.line(canvas, (size - margin, margin), (size - margin - mark_len, margin), mark_color, 2)
    cv2.line(canvas, (size - margin, margin), (size - margin, margin + mark_len), mark_color, 2)
    # Bottom-left
    cv2.line(canvas, (margin, size - margin), (margin + mark_len, size - margin), mark_color, 2)
    cv2.line(canvas, (margin, size - margin), (margin, size - margin - mark_len), mark_color, 2)
    # Bottom-right
    cv2.line(canvas, (size - margin, size - margin), (size - margin - mark_len, size - margin), mark_color, 2)
    cv2.line(canvas, (size - margin, size - margin), (size - margin, size - margin - mark_len), mark_color, 2)

    return canvas


def approach_1_contour_overshoot(img: np.ndarray, alpha: np.ndarray = None) -> np.ndarray:
    """
    Approach 1: Clean contours with corner overshoot
    - Extract main contours as smooth lines
    - Detect corners and add overshoot ticks
    - Maintains clarity while showing architectural marks
    """
    print("Creating Approach 1: Contour Lines + Corner Overshoot...")

    canvas = create_base_canvas(OUTPUT_SIZE)

    # Convert to grayscale
    if alpha is not None:
        gray = alpha
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Strong preprocessing for clean edges
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Threshold to get binary image
    _, binary = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

    # Find contours
    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Sort by area to get main contours
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    # Draw main contours with varying thickness
    for i, contour in enumerate(contours[:20]):  # Top 20 contours
        area = cv2.contourArea(contour)
        if area < 100:  # Skip tiny contours
            continue

        # Thickness based on hierarchy level
        if i < 3:
            thickness = 3  # Main structure
            color = LINE_COLOR_MAIN
        elif i < 10:
            thickness = 2  # Secondary structure
            color = LINE_COLOR_MAIN
        else:
            thickness = 1  # Fine details
            color = LINE_COLOR_DETAIL

        # Draw smooth contour
        cv2.drawContours(canvas, [contour], -1, color, thickness)

    # Detect corners on main contours using Harris corner detection
    corners = cv2.goodFeaturesToTrack(
        binary,
        maxCorners=200,
        qualityLevel=0.01,
        minDistance=15,
        useHarrisDetector=True
    )

    # Add overshoot ticks at corners
    if corners is not None:
        overshoot_length = 12
        for corner in corners:
            x, y = corner.ravel()
            x, y = int(x), int(y)

            # Draw small cross marks extending outward
            # Sample nearby pixels to determine best overshoot direction
            angle1 = np.random.uniform(0, 2 * np.pi)
            angle2 = angle1 + np.pi / 2

            # Draw two perpendicular overshoot lines
            x1 = int(x + overshoot_length * np.cos(angle1))
            y1 = int(y + overshoot_length * np.sin(angle1))
            x2 = int(x - overshoot_length * np.cos(angle1))
            y2 = int(y - overshoot_length * np.sin(angle1))

            cv2.line(canvas, (x1, y1), (x2, y2), LINE_COLOR_DETAIL, 1)

            x3 = int(x + overshoot_length * np.cos(angle2))
            y3 = int(y + overshoot_length * np.sin(angle2))
            x4 = int(x - overshoot_length * np.cos(angle2))
            y4 = int(y - overshoot_length * np.sin(angle2))

            cv2.line(canvas, (x3, y3), (x4, y4), LINE_COLOR_DETAIL, 1)

    return canvas


def approach_2_construction_lines(img: np.ndarray, alpha: np.ndarray = None) -> np.ndarray:
    """
    Approach 2: Major outlines + construction lines
    - Strong edges for main structure (thick)
    - Weak edges for details (thin)
    - Construction lines extending beyond form
    """
    print("Creating Approach 2: Major Outlines + Construction Lines...")

    canvas = create_base_canvas(OUTPUT_SIZE)

    # Convert to grayscale
    if alpha is not None:
        gray = alpha
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Preprocessing
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Two-level edge detection
    # High threshold for main structure
    edges_strong = cv2.Canny(blurred, 100, 200, apertureSize=5)
    # Low threshold for details
    edges_weak = cv2.Canny(blurred, 30, 90, apertureSize=3)

    # Morphological operations for clean lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges_strong = cv2.morphologyEx(edges_strong, cv2.MORPH_CLOSE, kernel, iterations=2)
    edges_weak = cv2.morphologyEx(edges_weak, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Draw strong edges (thick lines)
    canvas[edges_strong > 0] = LINE_COLOR_MAIN
    # Dilate to make thicker
    strong_dilated = cv2.dilate(edges_strong, kernel, iterations=1)
    canvas[strong_dilated > 0] = LINE_COLOR_MAIN

    # Draw weak edges (thin lines)
    canvas[edges_weak > 0] = LINE_COLOR_DETAIL

    # Detect lines using Hough transform
    lines = cv2.HoughLinesP(
        edges_strong,
        rho=1,
        theta=np.pi/180,
        threshold=50,
        minLineLength=30,
        maxLineGap=10
    )

    # Extend key structural lines beyond their endpoints
    if lines is not None:
        extension = 25
        for line in lines[:50]:  # Top 50 lines
            x1, y1, x2, y2 = line[0]

            # Calculate line direction
            dx = x2 - x1
            dy = y2 - y1
            length = np.sqrt(dx**2 + dy**2)

            if length < 50:  # Only extend longer lines
                continue

            # Normalize direction
            dx /= length
            dy /= length

            # Extend both ends
            x1_ext = int(x1 - extension * dx)
            y1_ext = int(y1 - extension * dy)
            x2_ext = int(x2 + extension * dx)
            y2_ext = int(y2 + extension * dy)

            # Draw extended line in construction color
            cv2.line(canvas, (x1_ext, y1_ext), (x2_ext, y2_ext), LINE_COLOR_CONSTRUCTION, 1)

    # Add dimension-line style marks at key points
    # Find extreme points
    y_coords, x_coords = np.where(edges_strong > 0)
    if len(y_coords) > 0:
        top = np.min(y_coords)
        bottom = np.max(y_coords)
        left = np.min(x_coords)
        right = np.max(x_coords)

        # Draw dimension lines with arrows
        arrow_size = 15
        margin = 50

        # Horizontal dimension line at top
        cv2.line(canvas, (left - margin, top - margin), (right + margin, top - margin), LINE_COLOR_CONSTRUCTION, 1)
        cv2.arrowedLine(canvas, (left - margin + 20, top - margin), (left - margin, top - margin), LINE_COLOR_CONSTRUCTION, 1, tipLength=0.5)
        cv2.arrowedLine(canvas, (right + margin - 20, top - margin), (right + margin, top - margin), LINE_COLOR_CONSTRUCTION, 1, tipLength=0.5)

        # Vertical dimension line at left
        cv2.line(canvas, (left - margin, top - margin), (left - margin, bottom + margin), LINE_COLOR_CONSTRUCTION, 1)
        cv2.arrowedLine(canvas, (left - margin, top - margin + 20), (left - margin, top - margin), LINE_COLOR_CONSTRUCTION, 1, tipLength=0.5)
        cv2.arrowedLine(canvas, (left - margin, bottom + margin - 20), (left - margin, bottom + margin), LINE_COLOR_CONSTRUCTION, 1, tipLength=0.5)

    return canvas


def approach_3_hatching_style(img: np.ndarray, alpha: np.ndarray = None) -> np.ndarray:
    """
    Approach 3: Clean edges + hatching with overshoot
    - Main contour outlines (thick and clean)
    - Cross-hatching for shaded areas
    - Structural grid lines
    """
    print("Creating Approach 3: Clean Edges + Hatching Style...")

    canvas = create_base_canvas(OUTPUT_SIZE)

    # Convert to grayscale
    if alpha is not None:
        gray = alpha
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Preprocessing
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Get binary mask
    _, binary = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

    # Find main contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Draw main outlines (thick and clean)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    for i, contour in enumerate(contours[:5]):  # Top 5 main contours
        area = cv2.contourArea(contour)
        if area < 500:
            continue
        cv2.drawContours(canvas, [contour], -1, LINE_COLOR_MAIN, 3)

    # Detect edges for internal details
    edges = cv2.Canny(blurred, 50, 150, apertureSize=3)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # Draw internal edges (thin)
    canvas[edges > 0] = LINE_COLOR_DETAIL

    # Identify darker regions for hatching
    # Create shadow map
    shadow_threshold = 100
    shadows = gray < shadow_threshold

    # Dilate and erode to get cleaner shadow regions
    shadow_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    shadows = cv2.morphologyEx(shadows.astype(np.uint8) * 255, cv2.MORPH_CLOSE, shadow_kernel)
    shadows = cv2.morphologyEx(shadows, cv2.MORPH_OPEN, shadow_kernel)

    # Find shadow regions
    shadow_contours, _ = cv2.findContours(shadows, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Add hatching to shadow regions
    hatch_spacing = 15
    hatch_angle = 45  # degrees
    overshoot = 8

    for contour in shadow_contours:
        area = cv2.contourArea(contour)
        if area < 200:  # Skip small shadows
            continue

        # Get bounding box
        x, y, w, h = cv2.boundingRect(contour)

        # Create mask for this contour
        mask = np.zeros(canvas.shape[:2], dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)

        # Draw hatching lines at 45 degrees
        num_lines = int((w + h) / hatch_spacing)
        for i in range(num_lines):
            # Calculate line start/end
            offset = i * hatch_spacing
            x1 = x - h + offset
            y1 = y + h
            x2 = x + offset
            y2 = y

            # Extend with overshoot
            dx = x2 - x1
            dy = y2 - y1
            length = np.sqrt(dx**2 + dy**2)
            if length > 0:
                dx /= length
                dy /= length
                x1 -= int(overshoot * dx)
                y1 -= int(overshoot * dy)
                x2 += int(overshoot * dx)
                y2 += int(overshoot * dy)

            # Draw line only where it intersects the shadow region
            line_mask = np.zeros_like(mask)
            cv2.line(line_mask, (x1, y1), (x2, y2), 255, 1)
            intersection = cv2.bitwise_and(line_mask, mask)
            canvas[intersection > 0] = LINE_COLOR_DETAIL

        # Add perpendicular hatching for darker shadows
        if gray[y + h//2, x + w//2] < 70:  # Very dark region
            for i in range(num_lines):
                offset = i * hatch_spacing
                x1 = x
                y1 = y - w + offset
                x2 = x + w
                y2 = y + offset

                # Extend with overshoot
                dx = x2 - x1
                dy = y2 - y1
                length = np.sqrt(dx**2 + dy**2)
                if length > 0:
                    dx /= length
                    dy /= length
                    x1 -= int(overshoot * dx)
                    y1 -= int(overshoot * dy)
                    x2 += int(overshoot * dx)
                    y2 += int(overshoot * dy)

                line_mask = np.zeros_like(mask)
                cv2.line(line_mask, (x1, y1), (x2, y2), 255, 1)
                intersection = cv2.bitwise_and(line_mask, mask)
                canvas[intersection > 0] = LINE_COLOR_DETAIL

    # Add structural grid lines across the form
    # Find bounding box of entire object
    y_coords, x_coords = np.where(binary > 0)
    if len(y_coords) > 0:
        top = np.min(y_coords)
        bottom = np.max(y_coords)
        left = np.min(x_coords)
        right = np.max(x_coords)
        center_x = (left + right) // 2
        center_y = (top + bottom) // 2

        # Draw centerlines with overshoot
        margin = 30
        cv2.line(canvas, (center_x, top - margin), (center_x, bottom + margin), LINE_COLOR_CONSTRUCTION, 1)
        cv2.line(canvas, (left - margin, center_y), (right + margin, center_y), LINE_COLOR_CONSTRUCTION, 1)

    return canvas


def main():
    """Process image with all three approaches"""
    print(f"Loading image: {INPUT_PATH}")

    # Load and prepare
    img, alpha = load_and_prepare_image(INPUT_PATH, OUTPUT_SIZE)

    # Create output directory
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

    # Generate each approach
    approaches = [
        ("approach-1-contour-overshoot.png", approach_1_contour_overshoot),
        ("approach-2-construction-lines.png", approach_2_construction_lines),
        ("approach-3-hatching-style.png", approach_3_hatching_style),
    ]

    for filename, func in approaches:
        print(f"\nGenerating {filename}...")
        result = func(img, alpha)
        output_path = Path(OUTPUT_DIR) / filename
        cv2.imwrite(str(output_path), result)
        print(f"Saved: {output_path}")

    print("\n" + "="*60)
    print("All three approaches completed!")
    print("="*60)
    print("\nOutputs:")
    for filename, _ in approaches:
        print(f"  - {Path(OUTPUT_DIR) / filename}")


if __name__ == "__main__":
    main()
