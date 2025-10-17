import cv2
import numpy as np
from pathlib import Path

"""
BLUEPRINT AESTHETIC - Key insight:
- Thin WHITE LINES on blue background (like drawing with white pen on blue paper)
- NOT inverted negatives with white fills
- Lines should trace edges and show internal structure
- Most of the image should remain blue
"""

def add_blueprint_grid(img, grid_size=20, line_color=(100, 100, 30), line_thickness=1):
    """Add technical grid overlay"""
    height, width = img.shape[:2]

    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)

    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    return img


def convert_to_blueprint(input_path, output_path, use_grid=True, blueprint_style='blue'):
    """
    Convert image to technical blueprint with fine line work
    """
    # Read image
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Error: Could not read image at {input_path}")
        return False

    # Handle transparency - treat transparent areas as background
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        white_bg = np.ones_like(rgb) * 255
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Upscale if small for better detail
    original_size = img.shape[:2]
    if img.shape[0] < 800:
        scale_factor = 2
        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
    else:
        scale_factor = 1

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)

    # Edge detection - multiple passes for different detail levels
    # Strong edges (outlines)
    edges_strong = cv2.Canny(gray, 150, 250, apertureSize=3)

    # Medium edges (major internal details)
    edges_medium = cv2.Canny(gray, 80, 150, apertureSize=3)

    # Weak edges (fine internal details)
    edges_weak = cv2.Canny(gray, 30, 80, apertureSize=3)

    # Combine edge maps
    edges = cv2.addWeighted(edges_strong, 1.0, edges_medium, 0.6, 0)
    edges = cv2.addWeighted(edges, 1.0, edges_weak, 0.3, 0)

    # Thin the lines to make them more precise
    kernel = np.ones((2,2), np.uint8)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Reduce line thickness
    edges = cv2.erode(edges, kernel, iterations=1)

    # Create blueprint background
    blueprint = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)

    if blueprint_style == 'blue':
        blueprint[:, :] = [180, 100, 15]  # Classic blueprint blue (BGR)
    elif blueprint_style == 'dark_blue':
        blueprint[:, :] = [130, 70, 10]
    elif blueprint_style == 'white':
        blueprint[:, :] = [235, 240, 245]

    # Add grid
    if use_grid:
        if blueprint_style == 'white':
            grid_color = (200, 210, 220)
        else:
            grid_color = (150, 90, 20)
        blueprint = add_blueprint_grid(blueprint, grid_size=30, line_color=grid_color, line_thickness=1)

    # Draw white lines where edges are detected
    # Key: edges is already a binary map of where lines should be
    if blueprint_style == 'white':
        blueprint[edges > 127] = [60, 80, 100]  # Dark lines on white
    else:
        blueprint[edges > 127] = [255, 255, 255]  # White lines on blue

    # Smooth the lines slightly for cleaner look
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0)

    # Add subtle paper texture
    noise = np.random.randint(-5, 5, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Scale back if needed
    if scale_factor > 1:
        new_width = int(original_size[1] * scale_factor)
        new_height = int(original_size[0] * scale_factor)
        blueprint = cv2.resize(blueprint, (new_width, new_height), interpolation=cv2.INTER_AREA)

    # Save with high quality
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"[OK] Converted: {input_path.name}")
    print(f"     Resolution: {blueprint.shape[1]}x{blueprint.shape[0]}")
    return True


if __name__ == "__main__":
    # Test with multiple images to compare
    test_images = [
        ("public/mek-images/500px/aa1-ak1-bc2.webp", "public/mek-images/test-blueprint-500px.png"),
        ("public/mek-images/1000px/aa1-ak1-bc2.webp", "public/mek-images/test-blueprint-1000px.png"),
    ]

    print("Converting to technical blueprint style...")
    print("=" * 60)

    for input_path, output_path in test_images:
        input_img = Path(input_path)
        output_img = Path(output_path)

        if input_img.exists():
            print(f"\nProcessing: {input_img}")
            convert_to_blueprint(input_img, output_img, use_grid=True, blueprint_style='blue')
        else:
            print(f"\nSkipping (not found): {input_img}")

    print("\n" + "=" * 60)
    print("Done! Check output files for comparison.")
    print("\nAdjustments available:")
    print("- blueprint_style='dark_blue' or 'white'")
    print("- use_grid=False")
    print("- Adjust Canny thresholds for more/less detail")
