import cv2
import numpy as np
from pathlib import Path

def detect_corners(edges, quality=0.01, min_distance=10):
    """Detect corners using Harris corner detection"""
    # Convert edges to float32 for corner detection
    edges_float = np.float32(edges)

    # Harris corner detection
    corners = cv2.cornerHarris(edges_float, blockSize=2, ksize=3, k=0.04)

    # Dilate to mark corners
    corners = cv2.dilate(corners, None)

    # Threshold to find significant corners
    corner_threshold = quality * corners.max()
    corner_mask = corners > corner_threshold

    # Get corner coordinates
    corner_points = np.argwhere(corner_mask)

    return corner_points

def extend_line_at_point(image, point, direction, length, color=(0, 215, 255)):
    """Extend a line from a point in a given direction"""
    y, x = point
    dy, dx = direction

    # Normalize direction
    magnitude = np.sqrt(dx*dx + dy*dy)
    if magnitude > 0:
        dx /= magnitude
        dy /= magnitude

    # Calculate end point
    end_x = int(x + dx * length)
    end_y = int(y + dy * length)

    # Draw the extension line
    cv2.line(image, (x, y), (end_x, end_y), color, 1, cv2.LINE_AA)

def estimate_line_direction(edges, point, radius=5):
    """Estimate the dominant line direction near a point"""
    y, x = point
    h, w = edges.shape

    # Extract local region
    y1 = max(0, y - radius)
    y2 = min(h, y + radius + 1)
    x1 = max(0, x - radius)
    x2 = min(w, x + radius + 1)

    region = edges[y1:y2, x1:x2]

    # Find line pixels in region
    line_points = np.argwhere(region > 0)

    if len(line_points) < 3:
        return None

    # Fit line using PCA
    line_points = line_points.astype(np.float32)
    mean = np.mean(line_points, axis=0)

    # Center the points
    centered = line_points - mean

    # Compute covariance matrix
    cov = np.cov(centered.T)

    # Get principal direction (eigenvector with largest eigenvalue)
    eigenvalues, eigenvectors = np.linalg.eig(cov)
    principal_idx = np.argmax(eigenvalues)
    direction = eigenvectors[:, principal_idx]

    # Return as (dy, dx) for consistency
    return (float(direction[0]), float(direction[1]))

def add_overshoot_effect(edges, overshoot_min, overshoot_max, construction_lines=False):
    """Add overshoot effect to edge-detected image"""
    # Create output with color
    h, w = edges.shape
    output = np.zeros((h, w, 3), dtype=np.uint8)

    # Copy original edges in yellow
    yellow = (0, 215, 255)  # BGR for yellow/gold
    output[edges > 0] = yellow

    # Detect corners
    corners = detect_corners(edges)

    print(f"Found {len(corners)} corner points")

    # Add overshoot at each corner
    np.random.seed(42)  # For reproducibility
    overshoot_count = 0

    for corner in corners:
        # Estimate line directions near this corner
        direction = estimate_line_direction(edges, corner, radius=10)

        if direction is not None:
            # Random overshoot length
            overshoot = np.random.randint(overshoot_min, overshoot_max + 1)

            # Extend in both directions
            extend_line_at_point(output, corner, direction, overshoot, yellow)
            extend_line_at_point(output, corner, (-direction[0], -direction[1]), overshoot, yellow)

            overshoot_count += 1

            # Add construction lines for strong variation
            if construction_lines and np.random.random() < 0.15:
                # Longer construction line
                construction_length = np.random.randint(20, 40)
                extend_line_at_point(output, corner, direction, construction_length, yellow)

    print(f"Added overshoot to {overshoot_count} corners")

    return output

def add_scifi_border(image, thickness=40):
    """Add sci-fi border greebles"""
    h, w = image.shape[:2]
    yellow = (0, 215, 255)

    # Corner brackets
    bracket_size = 60
    bracket_thickness = 2

    # Top-left
    cv2.line(image, (thickness, thickness), (thickness + bracket_size, thickness), yellow, bracket_thickness)
    cv2.line(image, (thickness, thickness), (thickness, thickness + bracket_size), yellow, bracket_thickness)

    # Top-right
    cv2.line(image, (w - thickness, thickness), (w - thickness - bracket_size, thickness), yellow, bracket_thickness)
    cv2.line(image, (w - thickness, thickness), (w - thickness, thickness + bracket_size), yellow, bracket_thickness)

    # Bottom-left
    cv2.line(image, (thickness, h - thickness), (thickness + bracket_size, h - thickness), yellow, bracket_thickness)
    cv2.line(image, (thickness, h - thickness), (thickness, h - thickness - bracket_size), yellow, bracket_thickness)

    # Bottom-right
    cv2.line(image, (w - thickness, h - thickness), (w - thickness - bracket_size, h - thickness), yellow, bracket_thickness)
    cv2.line(image, (w - thickness, h - thickness), (w - thickness, h - thickness - bracket_size), yellow, bracket_thickness)

    # Add small detail marks
    for i in range(4):
        x_pos = thickness + 80 + i * 30
        cv2.line(image, (x_pos, thickness - 10), (x_pos, thickness + 10), yellow, 1)
        cv2.line(image, (x_pos, h - thickness - 10), (x_pos, h - thickness + 10), yellow, 1)

    for i in range(4):
        y_pos = thickness + 80 + i * 30
        cv2.line(image, (thickness - 10, y_pos), (thickness + 10, y_pos), yellow, 1)
        cv2.line(image, (w - thickness - 10, y_pos), (w - thickness + 10, y_pos), yellow, 1)

def add_subtle_grid(image, grid_spacing=100, grid_alpha=0.02):
    """Add subtle background grid"""
    h, w = image.shape[:2]
    grid_color = (0, 100, 120)  # Subtle teal/yellow

    # Vertical lines
    for x in range(0, w, grid_spacing):
        cv2.line(image, (x, 0), (x, h), grid_color, 1)

    # Horizontal lines
    for y in range(0, h, grid_spacing):
        cv2.line(image, (0, y), (w, y), grid_color, 1)

def create_overshoot_blueprint(input_path, output_path, overshoot_min, overshoot_max,
                               construction_lines=False, variation_name=""):
    """Create blueprint with overshoot effect"""
    print(f"\n{'='*60}")
    print(f"Creating {variation_name} variation")
    print(f"Overshoot range: {overshoot_min}-{overshoot_max}px")
    print(f"Construction lines: {construction_lines}")
    print(f"{'='*60}\n")

    # Load image
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Could not load image: {input_path}")

    # Resize to 2000x2000
    target_size = 2000
    img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Preprocessing
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Edge detection - moderate settings for clean lines
    edges = cv2.Canny(denoised, 40, 120, apertureSize=3)

    # Morphological operations to clean up edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Dilate slightly to make lines more visible
    edges = cv2.dilate(edges, kernel, iterations=1)

    # Add overshoot effect
    output = add_overshoot_effect(edges, overshoot_min, overshoot_max, construction_lines)

    # Create final composition with black background
    final = np.zeros((target_size, target_size, 3), dtype=np.uint8)

    # Add subtle grid
    add_subtle_grid(final)

    # Add overshoot lines
    mask = (output[:, :, 0] > 0) | (output[:, :, 1] > 0) | (output[:, :, 2] > 0)
    final[mask] = output[mask]

    # Add sci-fi border greebles
    add_scifi_border(final, thickness=40)

    # Save
    cv2.imwrite(output_path, final, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"\nSaved: {output_path}\n")

def main():
    # Paths
    base_dir = Path(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react")
    input_path = str(base_dir / "public/mek-images/1000px/aa1-ak1-bc2.webp")

    # Create three variations
    variations = [
        {
            "name": "Subtle Overshoot",
            "output": str(base_dir / "public/mek-images/overshoot-subtle.png"),
            "overshoot_min": 3,
            "overshoot_max": 6,
            "construction_lines": False
        },
        {
            "name": "Medium Overshoot",
            "output": str(base_dir / "public/mek-images/overshoot-medium.png"),
            "overshoot_min": 5,
            "overshoot_max": 10,
            "construction_lines": False
        },
        {
            "name": "Strong Overshoot",
            "output": str(base_dir / "public/mek-images/overshoot-strong.png"),
            "overshoot_min": 8,
            "overshoot_max": 15,
            "construction_lines": True
        }
    ]

    print("\n" + "="*60)
    print("OVERSHOOT BLUEPRINT CONVERTER")
    print("Creating architectural sketch style with line extensions")
    print("="*60)

    for variation in variations:
        create_overshoot_blueprint(
            input_path,
            variation["output"],
            variation["overshoot_min"],
            variation["overshoot_max"],
            variation["construction_lines"],
            variation["name"]
        )

    print("\n" + "="*60)
    print("ALL VARIATIONS COMPLETE!")
    print("="*60)
    print("\nGenerated files:")
    for variation in variations:
        print(f"  - {Path(variation['output']).name}")
    print("\nEach variation has different overshoot intensities:")
    print("  - Subtle: Clean hand-drawn feel (3-6px)")
    print("  - Medium: Clear architectural sketch (5-10px)")
    print("  - Strong: Very sketchy with construction lines (8-15px)")

if __name__ == "__main__":
    main()
