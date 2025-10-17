import cv2
import numpy as np
from pathlib import Path

"""
REFINED APPROACH:
- Focus on creating continuous, clean lines (not dotty)
- Use morphological operations to connect broken edges
- Apply bilateral filter to preserve edges while smoothing
- Multiple edge detection layers with proper blending
"""

def add_blueprint_grid(img, grid_size=20, line_color=(100, 100, 30), line_thickness=1):
    """Add technical grid overlay"""
    height, width = img.shape[:2]

    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)

    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    return img


def create_clean_edges(gray):
    """
    Create continuous, clean edges like technical drawings
    Key: connect broken lines and remove noise
    """
    # Bilateral filter - smooths while preserving edges
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Multiple edge detection passes
    edges1 = cv2.Canny(enhanced, 100, 200, L2gradient=True)
    edges2 = cv2.Canny(enhanced, 50, 150, L2gradient=True)
    edges3 = cv2.Canny(smooth, 30, 100, L2gradient=True)

    # Combine edges with weighting
    combined = cv2.addWeighted(edges1, 0.7, edges2, 0.5, 0)
    combined = cv2.addWeighted(combined, 1.0, edges3, 0.3, 0)

    # Connect broken lines using morphological closing
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    connected = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_connect, iterations=2)

    # Dilate slightly to thicken lines
    kernel_dilate = np.ones((2, 2), np.uint8)
    thickened = cv2.dilate(connected, kernel_dilate, iterations=1)

    # Remove small noise
    kernel_clean = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thickened, cv2.MORPH_OPEN, kernel_clean, iterations=1)

    return cleaned


def convert_to_blueprint(input_path, output_path, use_grid=True, blueprint_style='blue', grid_size=30):
    """
    Convert image to technical blueprint with clean, continuous lines
    """
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Error: Could not read image at {input_path}")
        return False

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        # Create white background where transparent
        white_bg = np.ones_like(rgb) * 255
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Work with higher resolution
    original_size = img.shape[:2]
    target_size = 1000
    if img.shape[0] < target_size:
        scale = target_size / img.shape[0]
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        scaled = True
    else:
        scaled = False

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Get clean edges
    edges = create_clean_edges(gray)

    # Create blueprint background
    blueprint = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)

    # Background colors
    if blueprint_style == 'blue':
        bg_color = [180, 100, 15]  # Classic blueprint blue (BGR)
        line_color = [255, 255, 255]  # White lines
        grid_color = (140, 85, 18)
    elif blueprint_style == 'dark_blue':
        bg_color = [140, 75, 12]
        line_color = [255, 255, 255]
        grid_color = (110, 60, 15)
    elif blueprint_style == 'navy':
        bg_color = [100, 50, 8]  # Darker navy blue
        line_color = [255, 255, 255]
        grid_color = (80, 40, 10)
    else:  # white
        bg_color = [235, 240, 245]
        line_color = [60, 80, 100]
        grid_color = (200, 210, 220)

    blueprint[:, :] = bg_color

    # Add grid
    if use_grid:
        blueprint = add_blueprint_grid(blueprint, grid_size=grid_size, line_color=grid_color, line_thickness=1)

    # Draw lines
    blueprint[edges > 127] = line_color

    # Very subtle blur to smooth the lines (not break them up)
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0.5)

    # Subtle texture
    noise = np.random.randint(-4, 4, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # If we scaled up, keep the higher resolution
    # (Don't scale back down - we want high quality output)

    # Save
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"[OK] {input_path.name} -> {output_path.name}")
    print(f"     Resolution: {blueprint.shape[1]}x{blueprint.shape[0]}")
    return True


if __name__ == "__main__":
    # Test with 1000px source for best quality
    print("Technical Blueprint Converter v4")
    print("=" * 70)
    print("Testing with different styles...\n")

    test_configs = [
        ("public/mek-images/1000px/aa1-ak1-bc2.webp", "public/mek-images/test-blue-clean.png", "blue", True, 30),
        ("public/mek-images/1000px/aa1-ak1-bc2.webp", "public/mek-images/test-darkblue-clean.png", "dark_blue", True, 30),
        ("public/mek-images/1000px/aa1-ak1-bc2.webp", "public/mek-images/test-navy-clean.png", "navy", True, 25),
    ]

    for input_path, output_path, style, grid, grid_size in test_configs:
        input_img = Path(input_path)
        output_img = Path(output_path)

        if input_img.exists():
            print(f"Style: {style}")
            convert_to_blueprint(input_img, output_img, use_grid=grid, blueprint_style=style, grid_size=grid_size)
            print()
        else:
            print(f"Not found: {input_img}\n")

    print("=" * 70)
    print("Done! Compare the outputs to see which style works best.")
