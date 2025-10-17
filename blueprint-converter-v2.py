import cv2
import numpy as np
from pathlib import Path

"""
BLUEPRINT AESTHETIC REFERENCE (from user-provided examples):
- Grid backgrounds (subtle but visible)
- Multiple edge detection passes for internal detail
- Clean, precise white lines on blue background
- Internal structures visible, not just outlines
- Technical drawing feel with fine and bold lines
- Higher resolution for detail preservation
"""

def add_blueprint_grid(img, grid_size=20, line_color=(100, 100, 30), line_thickness=1):
    """Add technical grid overlay"""
    height, width = img.shape[:2]

    # Vertical lines
    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)

    # Horizontal lines
    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    return img


def enhance_details(gray):
    """
    Apply multiple processing techniques to extract both outline and internal details
    This mimics how technical drawings show internal structure
    """
    # Technique 1: Sharp edges (outlines)
    edges_sharp = cv2.Canny(gray, 100, 200)

    # Technique 2: Softer edges (internal details)
    edges_soft = cv2.Canny(gray, 30, 100)

    # Technique 3: Laplacian for fine details
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    laplacian = np.uint8(np.absolute(laplacian))
    _, laplacian_thresh = cv2.threshold(laplacian, 20, 255, cv2.THRESH_BINARY)

    # Technique 4: Adaptive threshold for internal structures
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 11, 2)
    adaptive_inv = cv2.bitwise_not(adaptive)

    # Combine all edge detection methods
    combined = cv2.bitwise_or(edges_sharp, edges_soft)
    combined = cv2.bitwise_or(combined, laplacian_thresh)
    combined = cv2.bitwise_or(combined, adaptive_inv)

    # Clean up noise with morphological operations
    kernel = np.ones((2,2), np.uint8)
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)

    return combined


def convert_to_blueprint(input_path, output_path, use_grid=True, blueprint_style='blue'):
    """
    Convert image to high-quality technical blueprint style

    Args:
        input_path: Path to input image
        output_path: Path to save output
        use_grid: Add technical grid overlay
        blueprint_style: 'blue' (classic) or 'dark_blue' (darker) or 'white' (white background)
    """
    # Read at full resolution
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Error: Could not read image at {input_path}")
        return False

    # Handle transparency
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        white_bg = np.ones_like(rgb) * 255
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Upscale for better detail if image is small
    original_size = img.shape[:2]
    if img.shape[0] < 500 or img.shape[1] < 500:
        scale_factor = 3
        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
    else:
        scale_factor = 1

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)

    # Extract all levels of detail
    edges = enhance_details(gray)

    # Invert so we have white lines
    edges_inv = cv2.bitwise_not(edges)

    # Thin the lines for a more technical drawing look
    kernel = np.ones((2,2), np.uint8)
    edges_inv = cv2.erode(edges_inv, kernel, iterations=1)

    # Smooth slightly for cleaner lines
    edges_inv = cv2.GaussianBlur(edges_inv, (3, 3), 0)

    # Create blueprint background
    blueprint = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)

    if blueprint_style == 'blue':
        # Classic blueprint blue
        blueprint[:, :] = [180, 100, 15]  # BGR format
    elif blueprint_style == 'dark_blue':
        # Darker blue like some reference images
        blueprint[:, :] = [120, 60, 10]
    elif blueprint_style == 'white':
        # White/cream background like Prometheus image
        blueprint[:, :] = [235, 240, 245]

    # Add grid before lines
    if use_grid:
        if blueprint_style == 'white':
            grid_color = (200, 210, 220)  # Light gray grid for white background
        else:
            grid_color = (140, 80, 20)  # Slightly lighter blue for grid
        blueprint = add_blueprint_grid(blueprint, grid_size=25, line_color=grid_color, line_thickness=1)

    # Add white lines where edges were detected
    mask = edges_inv < 200
    if blueprint_style == 'white':
        blueprint[mask] = [40, 60, 80]  # Dark blue-gray lines on white
    else:
        blueprint[mask] = [255, 255, 255]  # White lines on blue

    # Add subtle texture/noise for authenticity
    noise = np.random.randint(-8, 8, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Scale back to original size if we upscaled
    if scale_factor > 1:
        new_width = int(original_size[1] * scale_factor)
        new_height = int(original_size[0] * scale_factor)
        blueprint = cv2.resize(blueprint, (new_width, new_height), interpolation=cv2.INTER_AREA)

    # Save the result
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"[OK] Converted: {input_path.name} -> {output_path.name}")
    return True


if __name__ == "__main__":
    # Test on higher resolution image
    input_image = Path("public/mek-images/500px/aa1-ak1-bc2.webp")
    output_image = Path("public/mek-images/aa1-ak1-bc2-blueprint-v2.png")

    print("Converting Mek image to technical blueprint style...")
    print(f"Input: {input_image}")
    print(f"Output: {output_image}")
    print()

    # Try new enhanced technical style
    if convert_to_blueprint(input_image, output_image, use_grid=True, blueprint_style='blue'):
        print()
        print("Success! This version includes:")
        print("- Grid background overlay")
        print("- Multiple edge detection passes for internal detail")
        print("- Higher resolution processing")
        print("- Cleaner, more technical line work")
        print()
        print("You can try:")
        print("- blueprint_style='dark_blue' for darker background")
        print("- blueprint_style='white' for cream/white background (like Prometheus)")
        print("- use_grid=False to remove grid")
    else:
        print("Failed to convert image.")
