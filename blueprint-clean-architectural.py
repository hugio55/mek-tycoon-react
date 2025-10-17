"""
Blueprint Converter - Clean Architectural Variations
Prioritizes CLEAN, READABLE edge extraction with SUBTLE architectural enhancements
"""

import cv2
import numpy as np
from pathlib import Path

def detect_strong_corners(edges, max_corners=100):
    """Detect only the strongest, most significant corners"""
    corners = cv2.goodFeaturesToTrack(
        edges,
        maxCorners=max_corners,
        qualityLevel=0.01,
        minDistance=20,
        blockSize=7
    )
    return corners

def extend_lines_at_corners(image, corners, extension_length=8):
    """Add small line extensions at corner points"""
    if corners is None:
        return image

    result = image.copy()

    for corner in corners:
        x, y = corner.ravel().astype(int)

        # Sample surrounding pixels to determine edge direction
        window = 5
        y1, y2 = max(0, y-window), min(image.shape[0], y+window)
        x1, x2 = max(0, x-window), min(image.shape[1], x+window)
        region = image[y1:y2, x1:x2]

        if region.size == 0:
            continue

        # Calculate gradient direction
        gy, gx = np.gradient(region.astype(float))
        angle = np.arctan2(np.mean(gy), np.mean(gx))

        # Draw short extensions in perpendicular directions
        for offset_angle in [angle + np.pi/2, angle - np.pi/2]:
            dx = int(extension_length * np.cos(offset_angle))
            dy = int(extension_length * np.sin(offset_angle))

            pt1 = (x, y)
            pt2 = (x + dx, y + dy)
            cv2.line(result, pt1, pt2, 255, 1, cv2.LINE_AA)

    return result

def variation_1_corner_extensions(image_path, output_path):
    """
    Variation 1: Clean Canny Edges + Corner Extensions
    Multi-threshold edge detection with strategic corner marks
    """
    print("\nVariation 1: Corner Extensions")

    # Read at high resolution
    img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        mask = alpha > 128
    else:
        mask = np.ones(img.shape[:2], dtype=bool)

    # Upscale to 4000px for processing
    scale_factor = 4000 / max(img.shape[:2])
    new_size = (int(img.shape[1] * scale_factor), int(img.shape[0] * scale_factor))
    img_large = cv2.resize(img, new_size, interpolation=cv2.INTER_CUBIC)
    mask_large = cv2.resize(mask.astype(np.uint8), new_size, interpolation=cv2.INTER_LINEAR) > 0

    # Convert to grayscale
    gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)

    # Strong denoising while preserving edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Multi-threshold Canny for complete edge coverage
    print("  - Extracting edges with multiple thresholds...")
    edges1 = cv2.Canny(denoised, 20, 60, apertureSize=3)
    edges2 = cv2.Canny(denoised, 40, 100, apertureSize=3)
    edges3 = cv2.Canny(denoised, 60, 150, apertureSize=3)

    # Combine all edge maps
    edges = cv2.bitwise_or(edges1, edges2)
    edges = cv2.bitwise_or(edges, edges3)

    # Apply mask
    edges = cv2.bitwise_and(edges, edges, mask=mask_large.astype(np.uint8))

    # Strengthen edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Detect strong corners only
    print("  - Detecting major corners...")
    corners = detect_strong_corners(edges, max_corners=100)

    # Add corner extensions
    print("  - Adding strategic line extensions...")
    edges_enhanced = extend_lines_at_corners(edges, corners, extension_length=8)

    # Downsample to 2000px for final output
    target_size = (2000, 2000)
    edges_final = cv2.resize(edges_enhanced, target_size, interpolation=cv2.INTER_AREA)

    # Create blueprint aesthetic - yellow lines on black
    print("  - Applying blueprint aesthetic...")
    blueprint = np.zeros((2000, 2000, 3), dtype=np.uint8)
    blueprint[edges_final > 0] = (0, 215, 255)  # Yellow (BGR)

    # Add subtle registration marks in corners
    mark_size = 30
    mark_offset = 50
    for x, y in [(mark_offset, mark_offset),
                 (2000-mark_offset, mark_offset),
                 (mark_offset, 2000-mark_offset),
                 (2000-mark_offset, 2000-mark_offset)]:
        cv2.line(blueprint, (x-mark_size, y), (x+mark_size, y), (0, 215, 255), 1)
        cv2.line(blueprint, (x, y-mark_size), (x, y+mark_size), (0, 215, 255), 1)

    cv2.imwrite(str(output_path), blueprint)
    print(f"  [DONE] Saved: {output_path}")

def add_dimension_marks(image, contours, spacing=50):
    """Add dimension-style tick marks along major contours"""
    result = image.copy()

    for contour in contours:
        if len(contour) < spacing:
            continue

        # Sample points along contour at regular intervals
        for i in range(0, len(contour), spacing):
            pt = contour[i][0]
            x, y = pt[0], pt[1]

            # Calculate tangent direction
            if i + 10 < len(contour):
                next_pt = contour[i + 10][0]
                dx = next_pt[0] - x
                dy = next_pt[1] - y
            else:
                dx, dy = 1, 0

            # Perpendicular direction
            length = np.sqrt(dx*dx + dy*dy) + 1e-6
            perp_x = -dy / length * 12
            perp_y = dx / length * 12

            # Draw tick mark
            pt1 = (int(x + perp_x), int(y + perp_y))
            pt2 = (int(x - perp_x), int(y - perp_y))
            cv2.line(result, pt1, pt2, 255, 1, cv2.LINE_AA)

    return result

def variation_2_dimension_marks(image_path, output_path):
    """
    Variation 2: Contour Outlines + Dimension-Style Marks
    Professional technical drawing with measurement indicators
    """
    print("\nVariation 2: Dimension Marks")

    # Read image
    img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        mask = alpha > 128
    else:
        mask = np.ones(img.shape[:2], dtype=bool)

    # Upscale to 4000px
    scale_factor = 4000 / max(img.shape[:2])
    new_size = (int(img.shape[1] * scale_factor), int(img.shape[0] * scale_factor))
    img_large = cv2.resize(img, new_size, interpolation=cv2.INTER_CUBIC)
    mask_large = cv2.resize(mask.astype(np.uint8), new_size, interpolation=cv2.INTER_LINEAR) > 0

    # Convert to grayscale and denoise
    gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Edge detection
    print("  - Detecting edges...")
    edges = cv2.Canny(denoised, 40, 120, apertureSize=3)
    edges = cv2.bitwise_and(edges, edges, mask=mask_large.astype(np.uint8))

    # Find contours
    print("  - Extracting contours...")
    contours, hierarchy = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create drawing canvas
    drawing = np.zeros_like(edges)

    # Sort contours by area
    contours_with_area = [(cv2.contourArea(c), c) for c in contours]
    contours_with_area.sort(reverse=True, key=lambda x: x[0])

    # Draw contours with varying thickness based on significance
    print("  - Drawing contours with hierarchy...")
    total_area = sum(area for area, _ in contours_with_area)

    for area, contour in contours_with_area:
        if area < 100:  # Skip tiny contours
            continue

        # Determine thickness based on relative area
        area_ratio = area / (total_area + 1)
        if area_ratio > 0.1:
            thickness = 3
        elif area_ratio > 0.01:
            thickness = 2
        else:
            thickness = 1

        cv2.drawContours(drawing, [contour], -1, 255, thickness, cv2.LINE_AA)

    # Add dimension marks to major contours
    print("  - Adding dimension marks...")
    major_contours = [c for area, c in contours_with_area[:20] if area > 1000]
    drawing = add_dimension_marks(drawing, major_contours, spacing=60)

    # Add cross marks at significant contour endpoints
    for area, contour in contours_with_area[:30]:
        if area < 500:
            continue
        for point in contour[::len(contour)//8]:  # Sample 8 points
            x, y = point[0]
            cross_size = 8
            cv2.line(drawing, (x-cross_size, y), (x+cross_size, y), 255, 1, cv2.LINE_AA)
            cv2.line(drawing, (x, y-cross_size), (x, y+cross_size), 255, 1, cv2.LINE_AA)

    # Downsample to 2000px
    target_size = (2000, 2000)
    drawing_final = cv2.resize(drawing, target_size, interpolation=cv2.INTER_AREA)

    # Create blueprint
    print("  - Creating technical drawing...")
    blueprint = np.zeros((2000, 2000, 3), dtype=np.uint8)
    blueprint[drawing_final > 0] = (0, 215, 255)

    # Add corner registration marks
    mark_size = 30
    mark_offset = 50
    for x, y in [(mark_offset, mark_offset),
                 (2000-mark_offset, mark_offset),
                 (mark_offset, 2000-mark_offset),
                 (2000-mark_offset, 2000-mark_offset)]:
        cv2.line(blueprint, (x-mark_size, y), (x+mark_size, y), (0, 215, 255), 1)
        cv2.line(blueprint, (x, y-mark_size), (x, y+mark_size), (0, 215, 255), 1)
        cv2.circle(blueprint, (x, y), 15, (0, 215, 255), 1)

    cv2.imwrite(str(output_path), blueprint)
    print(f"  [DONE] Saved: {output_path}")

def variation_3_construction_grid(image_path, output_path):
    """
    Variation 3: Clean Edges + Light Construction Grid
    Technical drawing with subtle construction framework
    """
    print("\nVariation 3: Construction Grid")

    # Read image
    img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        mask = alpha > 128
    else:
        mask = np.ones(img.shape[:2], dtype=bool)

    # Upscale to 4000px
    scale_factor = 4000 / max(img.shape[:2])
    new_size = (int(img.shape[1] * scale_factor), int(img.shape[0] * scale_factor))
    img_large = cv2.resize(img, new_size, interpolation=cv2.INTER_CUBIC)
    mask_large = cv2.resize(mask.astype(np.uint8), new_size, interpolation=cv2.INTER_LINEAR) > 0

    # Convert to grayscale
    gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Multi-pass clean edge detection
    print("  - Extracting clean edges...")
    edges1 = cv2.Canny(denoised, 30, 90, apertureSize=3)
    edges2 = cv2.Canny(denoised, 50, 120, apertureSize=3)
    edges = cv2.bitwise_or(edges1, edges2)
    edges = cv2.bitwise_and(edges, edges, mask=mask_large.astype(np.uint8))

    # Strengthen edges slightly
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Find bounding box of the Mek
    print("  - Analyzing form structure...")
    y_coords, x_coords = np.where(edges > 0)
    if len(x_coords) == 0 or len(y_coords) == 0:
        print("  ! Warning: No edges detected")
        x_min, x_max = 0, edges.shape[1]
        y_min, y_max = 0, edges.shape[0]
    else:
        x_min, x_max = x_coords.min(), x_coords.max()
        y_min, y_max = y_coords.min(), y_coords.max()

    # Create construction grid
    print("  - Adding construction framework...")
    construction = np.zeros_like(edges)

    # Key horizontal guide lines (head, shoulders, waist, knees, feet)
    height = y_max - y_min
    key_heights = [
        y_min,                          # Top of head
        y_min + int(height * 0.15),     # Chin
        y_min + int(height * 0.30),     # Shoulders
        y_min + int(height * 0.50),     # Waist
        y_min + int(height * 0.70),     # Knees
        y_max                           # Feet
    ]

    for y in key_heights:
        # Extend line slightly beyond silhouette
        x_start = max(0, x_min - 40)
        x_end = min(edges.shape[1], x_max + 40)
        cv2.line(construction, (x_start, y), (x_end, y), 128, 1, cv2.LINE_AA)

    # Key vertical guide lines (centerline, shoulders width)
    width = x_max - x_min
    x_center = (x_min + x_max) // 2
    key_widths = [
        x_center - int(width * 0.35),   # Left edge
        x_center,                        # Centerline (stronger)
        x_center + int(width * 0.35)    # Right edge
    ]

    for x in key_widths:
        y_start = max(0, y_min - 40)
        y_end = min(edges.shape[0], y_max + 40)
        intensity = 200 if x == x_center else 128  # Centerline stronger
        cv2.line(construction, (x, y_start), (x, y_end), intensity, 1, cv2.LINE_AA)

    # Combine edges (strong) with construction lines (subtle)
    combined = np.zeros_like(edges)
    combined[edges > 0] = 255
    combined[construction > 0] = np.maximum(combined[construction > 0], construction[construction > 0])

    # Downsample to 2000px
    target_size = (2000, 2000)
    combined_final = cv2.resize(combined, target_size, interpolation=cv2.INTER_AREA)

    # Create blueprint with dual-intensity lines
    print("  - Creating construction drawing...")
    blueprint = np.zeros((2000, 2000, 3), dtype=np.uint8)

    # Main edges - full yellow
    blueprint[combined_final > 200] = (0, 215, 255)

    # Construction lines - dimmer yellow
    construction_mask = (combined_final > 100) & (combined_final <= 200)
    blueprint[construction_mask] = (0, 130, 155)

    # Add corner grid marks
    mark_size = 40
    mark_offset = 40
    for x, y in [(mark_offset, mark_offset),
                 (2000-mark_offset, mark_offset),
                 (mark_offset, 2000-mark_offset),
                 (2000-mark_offset, 2000-mark_offset)]:
        # L-shaped corner marks
        cv2.line(blueprint, (x, y), (x+mark_size, y), (0, 215, 255), 1)
        cv2.line(blueprint, (x, y), (x, y+mark_size), (0, 215, 255), 1)

    cv2.imwrite(str(output_path), blueprint)
    print(f"  [DONE] Saved: {output_path}")

def main():
    """Generate all three architectural variations"""

    # Paths
    base_dir = Path("C:/Users/Ben Meyers/Documents/Mek Tycoon/TYCOON REACT 8-27/mek-tycoon-react")
    input_path = base_dir / "public/mek-images/1000px/aa1-ak1-bc2.webp"
    output_dir = base_dir / "public/mek-images"

    # Check input
    if not input_path.exists():
        print(f"Error: Input image not found at {input_path}")
        return

    print("=" * 60)
    print("CLEAN ARCHITECTURAL BLUEPRINT VARIATIONS")
    print("=" * 60)
    print(f"Input: {input_path}")
    print(f"Output directory: {output_dir}")
    print()

    # Generate variations
    try:
        variation_1_corner_extensions(
            input_path,
            output_dir / "clean-var-1-corner-extensions.png"
        )

        variation_2_dimension_marks(
            input_path,
            output_dir / "clean-var-2-dimension-marks.png"
        )

        variation_3_construction_grid(
            input_path,
            output_dir / "clean-var-3-construction-grid.png"
        )

        print()
        print("=" * 60)
        print("[SUCCESS] All variations completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n! Error during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
