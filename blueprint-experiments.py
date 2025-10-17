import cv2
import numpy as np
from pathlib import Path
import time

"""
ADVANCED BLUEPRINT CONVERTER - EXPERIMENTAL VERSION

This script tests multiple advanced techniques for creating professional
technical drawing / architectural blueprint aesthetics from Mek images.

Techniques being tested:
1. Multiple edge detection algorithms (Canny, Sobel, Laplacian, Scharr)
2. Line thinning and skeletonization
3. Structured edge detection (SED)
4. Morphological operations for line refinement
5. Multi-scale edge detection
6. Contour-based line drawing
7. Advanced line smoothing and anti-aliasing
8. Detail preservation with edge enhancement
"""


def add_blueprint_grid(img, grid_size=20, line_color=(100, 100, 30), line_thickness=1):
    """Add technical grid overlay - subtle but visible"""
    height, width = img.shape[:2]

    # Draw vertical lines
    for x in range(0, width, grid_size):
        cv2.line(img, (x, 0), (x, height), line_color, line_thickness)

    # Draw horizontal lines
    for y in range(0, height, grid_size):
        cv2.line(img, (0, y), (width, y), line_color, line_thickness)

    # Add thicker lines every 5 intervals for major grid
    major_grid = grid_size * 5
    for x in range(0, width, major_grid):
        cv2.line(img, (x, 0), (x, height),
                (int(line_color[0] * 1.3), int(line_color[1] * 1.3), int(line_color[2] * 1.3)),
                line_thickness + 1)
    for y in range(0, height, major_grid):
        cv2.line(img, (0, y), (width, y),
                (int(line_color[0] * 1.3), int(line_color[1] * 1.3), int(line_color[2] * 1.3)),
                line_thickness + 1)

    return img


def method_1_enhanced_canny(gray):
    """Enhanced Canny with bilateral filtering and multi-threshold"""
    # Preserve edges while smoothing
    smooth = cv2.bilateralFilter(gray, 11, 80, 80)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Multiple Canny passes with different thresholds
    edges1 = cv2.Canny(enhanced, 50, 150, L2gradient=True)
    edges2 = cv2.Canny(enhanced, 30, 90, L2gradient=True)
    edges3 = cv2.Canny(smooth, 70, 180, L2gradient=True)

    # Weighted combination
    combined = cv2.addWeighted(edges1, 0.6, edges2, 0.4, 0)
    combined = cv2.addWeighted(combined, 0.8, edges3, 0.3, 0)

    # Morphological closing to connect lines
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    connected = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Thin the lines slightly
    kernel_thin = np.ones((2, 2), np.uint8)
    thinned = cv2.erode(connected, kernel_thin, iterations=1)

    return thinned


def method_2_sobel_laplacian_hybrid(gray):
    """Hybrid approach using Sobel and Laplacian operators"""
    # Smooth first
    smooth = cv2.GaussianBlur(gray, (5, 5), 1.4)

    # Sobel operators for gradients
    sobelx = cv2.Sobel(smooth, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(smooth, cv2.CV_64F, 0, 1, ksize=3)

    # Gradient magnitude
    sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)
    sobel_magnitude = np.uint8(255 * sobel_magnitude / np.max(sobel_magnitude))

    # Laplacian for edge detection
    laplacian = cv2.Laplacian(smooth, cv2.CV_64F, ksize=3)
    laplacian = np.uint8(np.absolute(laplacian))

    # Combine both
    combined = cv2.addWeighted(sobel_magnitude, 0.6, laplacian, 0.4, 0)

    # Threshold to binary
    _, binary = cv2.threshold(combined, 30, 255, cv2.THRESH_BINARY)

    # Morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    refined = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    return refined


def method_3_contour_based(gray):
    """Contour-based approach for clean continuous lines"""
    # Preprocessing
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Adaptive threshold to get clean contours
    binary = cv2.adaptiveThreshold(smooth, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create blank canvas
    result = np.zeros_like(gray)

    # Draw contours with approximation for cleaner lines
    for contour in contours:
        # Approximate contour to reduce points
        epsilon = 0.005 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        # Draw the contour
        cv2.drawContours(result, [approx], -1, 255, 1)

    # Also add Canny edges for internal details
    edges = cv2.Canny(smooth, 40, 120)
    result = cv2.addWeighted(result, 0.7, edges, 0.3, 0)

    return result


def method_4_skeleton_thinning(gray):
    """Use morphological skeletonization for thin continuous lines"""
    # Prepare edges
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)
    edges = cv2.Canny(smooth, 50, 150)

    # Dilate first to ensure connectivity
    kernel_dilate = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel_dilate, iterations=2)

    # Apply thinning (skeletonization)
    skeleton = np.zeros(dilated.shape, np.uint8)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))

    while True:
        opened = cv2.morphologyEx(dilated, cv2.MORPH_OPEN, element)
        temp = cv2.subtract(dilated, opened)
        eroded = cv2.erode(dilated, element)
        skeleton = cv2.bitwise_or(skeleton, temp)
        dilated = eroded.copy()

        if cv2.countNonZero(dilated) == 0:
            break

    return skeleton


def method_5_multi_scale_edges(gray):
    """Multi-scale edge detection - capture both fine details and major structures"""
    edges_multi = np.zeros_like(gray, dtype=np.float32)

    # Different scales
    scales = [0.5, 1.0, 1.5, 2.0]
    weights = [0.2, 0.4, 0.3, 0.1]

    for scale, weight in zip(scales, weights):
        # Gaussian blur at different scales
        ksize = int(3 + 2 * scale)
        if ksize % 2 == 0:
            ksize += 1

        blurred = cv2.GaussianBlur(gray, (ksize, ksize), scale)

        # Edge detection
        edges = cv2.Canny(blurred, 40, 120, L2gradient=True)

        # Accumulate with weight
        edges_multi += edges.astype(np.float32) * weight

    # Normalize
    edges_multi = np.clip(edges_multi, 0, 255).astype(np.uint8)

    # Refine
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    refined = cv2.morphologyEx(edges_multi, cv2.MORPH_CLOSE, kernel, iterations=1)

    return refined


def method_6_scharr_operator(gray):
    """Scharr operator - more accurate than Sobel for edges"""
    smooth = cv2.GaussianBlur(gray, (5, 5), 1.4)

    # Scharr operators
    scharrx = cv2.Scharr(smooth, cv2.CV_64F, 1, 0)
    scharry = cv2.Scharr(smooth, cv2.CV_64F, 0, 1)

    # Magnitude
    magnitude = np.sqrt(scharrx**2 + scharry**2)
    magnitude = np.uint8(255 * magnitude / np.max(magnitude))

    # Threshold
    _, binary = cv2.threshold(magnitude, 25, 255, cv2.THRESH_BINARY)

    # Morphological refinement
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    refined = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    return refined


def method_7_adaptive_edge_detection(gray):
    """Adaptive method that preserves both outlines and internal details"""
    # Bilateral filter preserves edges
    smooth = cv2.bilateralFilter(gray, 11, 90, 90)

    # CLAHE for local contrast
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Strong edges (outline)
    strong_edges = cv2.Canny(enhanced, 80, 200, L2gradient=True)

    # Weak edges (internal details)
    weak_edges = cv2.Canny(enhanced, 20, 60, L2gradient=True)

    # Combine with different weights
    combined = cv2.addWeighted(strong_edges, 0.7, weak_edges, 0.3, 0)

    # Connect broken lines
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    connected = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_connect, iterations=2)

    # Slight dilation for visibility
    kernel_dilate = np.ones((2, 2), np.uint8)
    thickened = cv2.dilate(connected, kernel_dilate, iterations=1)

    return thickened


def method_8_edge_preserving_filter(gray):
    """Use edge-preserving filters before edge detection"""
    # Edge-preserving filter
    filtered = cv2.edgePreservingFilter(gray, flags=1, sigma_s=60, sigma_r=0.4)

    # Detail enhancement
    kernel_sharpen = np.array([[-1,-1,-1],
                              [-1, 9,-1],
                              [-1,-1,-1]])
    sharpened = cv2.filter2D(filtered, -1, kernel_sharpen)

    # Edge detection
    edges = cv2.Canny(sharpened, 50, 150, L2gradient=True)

    # Morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    refined = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

    return refined


def method_9_double_threshold_refinement(gray):
    """Double threshold with hysteresis for better edge connectivity"""
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Enhanced contrast
    clahe = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Compute gradients
    sobelx = cv2.Sobel(enhanced, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(enhanced, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    magnitude = np.uint8(255 * magnitude / np.max(magnitude))

    # Double threshold
    high_thresh = 100
    low_thresh = 40

    strong_edges = magnitude > high_thresh
    weak_edges = (magnitude >= low_thresh) & (magnitude <= high_thresh)

    # Hysteresis - connect weak edges to strong edges
    result = np.zeros_like(gray)
    result[strong_edges] = 255

    # Connect weak edges adjacent to strong edges
    kernel = np.ones((3, 3), np.uint8)
    dilated_strong = cv2.dilate(result, kernel, iterations=1)
    result[weak_edges & (dilated_strong > 0)] = 255

    # Final morphological refinement
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    refined = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=1)

    return refined


def method_10_combined_best_practices(gray):
    """Combination of the best techniques discovered"""
    # Stage 1: Edge-preserving smoothing
    smooth = cv2.bilateralFilter(gray, 11, 85, 85)

    # Stage 2: Adaptive contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(smooth)

    # Stage 3: Multi-method edge detection
    # Method A: Canny with optimal parameters
    canny = cv2.Canny(enhanced, 50, 140, L2gradient=True)

    # Method B: Gradient magnitude
    sobelx = cv2.Sobel(enhanced, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(enhanced, cv2.CV_64F, 0, 1, ksize=3)
    gradient = np.sqrt(sobelx**2 + sobely**2)
    gradient = np.uint8(255 * gradient / np.max(gradient))
    _, gradient_binary = cv2.threshold(gradient, 30, 255, cv2.THRESH_BINARY)

    # Method C: Laplacian for details
    laplacian = cv2.Laplacian(smooth, cv2.CV_64F, ksize=3)
    laplacian = np.uint8(np.absolute(laplacian))
    _, lap_binary = cv2.threshold(laplacian, 20, 255, cv2.THRESH_BINARY)

    # Combine all three methods
    combined = cv2.addWeighted(canny, 0.5, gradient_binary, 0.3, 0)
    combined = cv2.addWeighted(combined, 0.9, lap_binary, 0.2, 0)

    # Stage 4: Morphological line refinement
    # Connect broken lines
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    connected = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_connect, iterations=2)

    # Thicken slightly for visibility
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    thickened = cv2.dilate(connected, kernel_dilate, iterations=1)

    # Remove small noise
    kernel_open = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thickened, cv2.MORPH_OPEN, kernel_open, iterations=1)

    return cleaned


# Dictionary of all methods
METHODS = {
    'method_1_enhanced_canny': method_1_enhanced_canny,
    'method_2_sobel_laplacian': method_2_sobel_laplacian_hybrid,
    'method_3_contour_based': method_3_contour_based,
    'method_4_skeleton': method_4_skeleton_thinning,
    'method_5_multiscale': method_5_multi_scale_edges,
    'method_6_scharr': method_6_scharr_operator,
    'method_7_adaptive': method_7_adaptive_edge_detection,
    'method_8_edge_preserving': method_8_edge_preserving_filter,
    'method_9_double_threshold': method_9_double_threshold_refinement,
    'method_10_combined': method_10_combined_best_practices,
}


def convert_to_blueprint(input_path, output_path, method_name='method_10_combined',
                        use_grid=True, grid_size=30, blueprint_style='blue'):
    """
    Convert image to technical blueprint using specified method
    """
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Error: Could not read image at {input_path}")
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

    # Apply selected edge detection method
    if method_name in METHODS:
        edges = METHODS[method_name](gray)
    else:
        print(f"Unknown method: {method_name}")
        return False

    # Create blueprint background
    blueprint = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)

    # Background colors
    if blueprint_style == 'blue':
        bg_color = [180, 100, 15]  # Classic blueprint blue (BGR)
        line_color = [255, 255, 255]  # White lines
        grid_color = (100, 85, 18)
    elif blueprint_style == 'dark_blue':
        bg_color = [140, 75, 12]
        line_color = [255, 255, 255]
        grid_color = (90, 60, 15)
    elif blueprint_style == 'navy':
        bg_color = [100, 50, 8]
        line_color = [255, 255, 255]
        grid_color = (80, 40, 10)

    blueprint[:, :] = bg_color

    # Add grid
    if use_grid:
        blueprint = add_blueprint_grid(blueprint, grid_size=grid_size,
                                      line_color=grid_color, line_thickness=1)

    # Draw lines
    blueprint[edges > 127] = line_color

    # Subtle smoothing to reduce jaggedness
    blueprint = cv2.GaussianBlur(blueprint, (3, 3), 0.5)

    # Very subtle paper texture
    noise = np.random.randint(-3, 3, blueprint.shape, dtype=np.int16)
    blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Save
    cv2.imwrite(str(output_path), blueprint, [cv2.IMWRITE_PNG_COMPRESSION, 9])

    return True


if __name__ == "__main__":
    print("="*80)
    print("BLUEPRINT CONVERTER - EXPERIMENTAL TESTING")
    print("="*80)
    print("Testing 10 different advanced edge detection methods\n")

    # Test images - use multiple for variety
    test_images = [
        "public/mek-images/1000px/aa1-ak1-bc2.webp",
        "public/mek-images/1000px/aa1-bi1-ap1.webp",
        "public/mek-images/1000px/bc2-dm1-ap1.webp",
    ]

    # Find which test images exist
    available_images = []
    for img_path in test_images:
        if Path(img_path).exists():
            available_images.append(img_path)

    if not available_images:
        print("ERROR: No test images found!")
        exit(1)

    print(f"Found {len(available_images)} test image(s)\n")

    # Test all methods on first image
    print(f"Testing all methods on: {available_images[0]}")
    print("-"*80)

    input_path = Path(available_images[0])
    method_times = {}

    for i, (method_name, method_func) in enumerate(METHODS.items(), 1):
        output_path = Path(f"public/mek-images/experiment-{method_name}.png")

        print(f"{i:2d}. {method_name:<30s} ... ", end='', flush=True)

        start_time = time.time()
        success = convert_to_blueprint(input_path, output_path,
                                      method_name=method_name,
                                      use_grid=True,
                                      grid_size=30,
                                      blueprint_style='blue')
        elapsed = time.time() - start_time
        method_times[method_name] = elapsed

        if success:
            print(f"OK ({elapsed:.2f}s)")
        else:
            print(f"FAILED")

    print("\n" + "="*80)
    print("TESTING COMPLETE")
    print("="*80)
    print("\nProcessing times:")
    for method_name, elapsed in sorted(method_times.items(), key=lambda x: x[1]):
        print(f"  {method_name:<30s}: {elapsed:.2f}s")

    print("\n" + "="*80)
    print("All experimental outputs saved to: public/mek-images/experiment-*.png")
    print("Compare outputs to determine which method produces the best results!")
    print("="*80)
