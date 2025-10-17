import cv2
import numpy as np
from pathlib import Path

"""
Test the top 3 methods on multiple diverse Mek images to verify consistency
"""

def add_blueprint_grid(img, grid_size=20, line_color=(100, 100, 30), line_thickness=1):
    """Add technical grid overlay"""
    height, width = img.shape[:2]
    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)
    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    # Major grid lines
    major_grid = grid_size * 5
    major_color = (int(line_color[0] * 1.3), int(line_color[1] * 1.3), int(line_color[2] * 1.3))
    for x in range(0, width, major_grid):
        cv2.line(img, (x, 0), (x, height), major_color, line_thickness + 1)
    for y in range(0, height, major_grid):
        cv2.line(img, (0, y), (width, y), major_color, line_thickness + 1)

    return img


def method_contour_enhanced(gray):
    """Enhanced contour-based approach - WINNER from initial tests"""
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Adaptive threshold for clean contours
    binary = cv2.adaptiveThreshold(smooth, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create blank canvas
    result = np.zeros_like(gray)

    # Draw contours with approximation
    for contour in contours:
        epsilon = 0.003 * cv2.arcLength(contour, True)  # Reduced for more detail
        approx = cv2.approxPolyDP(contour, epsilon, True)
        cv2.drawContours(result, [approx], -1, 255, 1)

    # Add Canny edges for internal details
    edges = cv2.Canny(smooth, 30, 100)
    result = cv2.addWeighted(result, 0.7, edges, 0.4, 0)

    # Light morphological closing
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=1)

    return result


def method_sobel_laplacian_improved(gray):
    """Improved Sobel + Laplacian - second place candidate"""
    smooth = cv2.GaussianBlur(gray, (5, 5), 1.4)

    # Sobel operators
    sobelx = cv2.Sobel(smooth, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(smooth, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)
    sobel_magnitude = np.uint8(255 * sobel_magnitude / np.max(sobel_magnitude))

    # Laplacian
    laplacian = cv2.Laplacian(smooth, cv2.CV_64F, ksize=3)
    laplacian = np.uint8(np.absolute(laplacian))

    # Combine
    combined = cv2.addWeighted(sobel_magnitude, 0.6, laplacian, 0.4, 0)

    # Threshold
    _, binary = cv2.threshold(combined, 25, 255, cv2.THRESH_BINARY)

    # Morphological refinement
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    refined = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    return refined


def method_adaptive_canny(gray):
    """Adaptive Canny - third place candidate"""
    smooth = cv2.bilateralFilter(gray, 11, 90, 90)

    # CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Strong and weak edges
    strong_edges = cv2.Canny(enhanced, 80, 200, L2gradient=True)
    weak_edges = cv2.Canny(enhanced, 20, 60, L2gradient=True)

    # Combine
    combined = cv2.addWeighted(strong_edges, 0.7, weak_edges, 0.3, 0)

    # Connect broken lines
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    connected = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Slight dilation
    kernel_dilate = np.ones((2, 2), np.uint8)
    thickened = cv2.dilate(connected, kernel_dilate, iterations=1)

    return thickened


def convert_to_blueprint(input_path, output_path, method_func, method_name):
    """Convert using specified method"""
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        return False

    # Handle transparency
    if len(img.shape) == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        white_bg = np.ones_like(rgb) * 255
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Convert to grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Apply edge detection method
    edges = method_func(gray)

    # Create blueprint
    blueprint = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)

    # Classic blue blueprint colors
    bg_color = [180, 100, 15]
    line_color = [255, 255, 255]
    grid_color = (100, 85, 18)

    blueprint[:, :] = bg_color

    # Add grid
    blueprint = add_blueprint_grid(blueprint, grid_size=30, line_color=grid_color, line_thickness=1)

    # Draw lines
    blueprint[edges > 127] = line_color

    # Subtle smoothing
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0.5)

    # Paper texture
    noise = np.random.randint(-3, 3, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Save
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])

    return True


if __name__ == "__main__":
    print("="*80)
    print("TESTING TOP 3 METHODS ON MULTIPLE MEK IMAGES")
    print("="*80)

    # Diverse test images
    test_images = [
        "public/mek-images/1000px/aa1-ak1-bc2.webp",  # Original test (camera head)
        "public/mek-images/1000px/aa1-bi1-ap1.webp",  # Different style
        "public/mek-images/1000px/bc2-dm1-ap1.webp",  # Different head type
        "public/mek-images/1000px/aa1-dm1-de1.webp",  # Another variation
    ]

    methods = [
        (method_contour_enhanced, "contour_enhanced"),
        (method_sobel_laplacian_improved, "sobel_laplacian"),
        (method_adaptive_canny, "adaptive_canny"),
    ]

    for img_path in test_images:
        input_path = Path(img_path)
        if not input_path.exists():
            print(f"Skipping missing: {input_path.name}")
            continue

        print(f"\n{input_path.name}:")

        for method_func, method_name in methods:
            base_name = input_path.stem
            output_path = Path(f"public/mek-images/compare-{base_name}-{method_name}.png")

            print(f"  [{method_name}] ... ", end='', flush=True)
            success = convert_to_blueprint(input_path, output_path, method_func, method_name)

            if success:
                print("OK")
            else:
                print("FAILED")

    print("\n" + "="*80)
    print("COMPARISON TEST COMPLETE")
    print("="*80)
    print("Review outputs in public/mek-images/compare-*.png")
