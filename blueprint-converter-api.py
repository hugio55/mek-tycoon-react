#!/usr/bin/env python3
"""
Blueprint Converter API - Generates architectural blueprints from Mek images
Called by Next.js API with customizable parameters
"""

import cv2
import numpy as np
import argparse
import sys

def generate_blueprint(
    input_path,
    output_path,
    canny_low=20,
    canny_mid=40,
    canny_high=60,
    output_size=2000,
    line_thickness=1,
    overshoot=8,
    grid_opacity=15,
    smoothness=3,
    curviness=5,
    sketchiness=0,
    detail_density=50,
    enable_annotations=True,
    annotation_style='angled',
    annotation_line_length=100,
    annotation_font_size=24,
    mek_code='',
    head_name='',
    body_name='',
    item_name='',
    mek_rank='1',
    head_position='top-right',
    body_position='bottom-left',
    item_position='bottom-right',
    rank_position='top-left',
    mek_number_position='bottom-left',
    label_margin=150
):
    """Generate blueprint with customizable parameters"""

    try:
        # Read input image
        img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")

        # Convert to grayscale if needed
        if len(img.shape) == 4:  # RGBA
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
        elif len(img.shape) == 3:  # RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Work at 2x resolution for smoothness
        work_size = output_size * 2
        img_resized = cv2.resize(img, (work_size, work_size), interpolation=cv2.INTER_LANCZOS4)

        # Apply smoothness via bilateral filter
        bilateral_d = max(5, min(15, 9 + (smoothness - 3)))
        bilateral_sigma = 75 + (smoothness * 10)
        img_filtered = cv2.bilateralFilter(img_resized, bilateral_d, bilateral_sigma, bilateral_sigma)

        # CLAHE for contrast enhancement (adjusted by detail density)
        clahe_clip = 1.0 + (detail_density / 50.0)
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
        img_clahe = clahe.apply(img_filtered)

        # Apply curviness through additional blur
        if curviness > 5:
            kernel_size = min(15, 1 + curviness)
            if kernel_size % 2 == 0:
                kernel_size += 1
            img_clahe = cv2.GaussianBlur(img_clahe, (kernel_size, kernel_size), curviness / 3)

        # Multi-threshold Canny edge detection
        edges1 = cv2.Canny(img_clahe, canny_low, canny_low * 3)
        edges2 = cv2.Canny(img_clahe, canny_mid, canny_mid * 2.5)
        edges3 = cv2.Canny(img_clahe, canny_high, canny_high * 2)

        # Combine edges with weights
        edges_combined = np.zeros_like(edges1)
        edges_combined = cv2.addWeighted(edges1, 0.4, edges2, 0.4, 0)
        edges_combined = cv2.addWeighted(edges_combined, 1.0, edges3, 0.2, 0)

        # Morphological operations for cleaner lines
        kernel_size = max(3, 3 + int(curviness / 5))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        edges_clean = cv2.morphologyEx(edges_combined, cv2.MORPH_CLOSE, kernel)

        # Apply sketchiness effect (add variation)
        if sketchiness > 0:
            noise = np.random.randint(-sketchiness * 5, sketchiness * 5, edges_clean.shape, dtype=np.int16)
            edges_clean = np.clip(edges_clean.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        # Slight dilation if line thickness > 1
        if line_thickness > 1:
            dilation_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (line_thickness, line_thickness))
            edges_clean = cv2.dilate(edges_clean, dilation_kernel, iterations=1)

        # Gaussian blur for anti-aliasing (controlled by smoothness)
        blur_kernel = max(3, smoothness)
        if blur_kernel % 2 == 0:
            blur_kernel += 1
        edges_smooth = cv2.GaussianBlur(edges_clean, (blur_kernel, blur_kernel), smoothness / 3.0)

        # Downsample to final size
        edges_final = cv2.resize(edges_smooth, (output_size, output_size), interpolation=cv2.INTER_LANCZOS4)

        # Create black canvas
        canvas = np.zeros((output_size, output_size, 3), dtype=np.uint8)

        # Add subtle grid if opacity > 0
        if grid_opacity > 0:
            grid_color = (grid_opacity, grid_opacity, grid_opacity)
            grid_spacing = 50
            for i in range(0, output_size, grid_spacing):
                cv2.line(canvas, (i, 0), (i, output_size), grid_color, 1)
                cv2.line(canvas, (0, i), (output_size, i), grid_color, 1)

        # Convert edges to yellow lines
        yellow = (23, 182, 250)  # BGR for #fab617
        edges_mask = edges_final > 30
        canvas[edges_mask] = yellow

        # Add corner overshoot if enabled
        if overshoot > 0:
            # Harris corner detection
            corners = cv2.cornerHarris(edges_final, blockSize=2, ksize=3, k=0.04)
            corners = cv2.dilate(corners, None)

            # Get strongest corners
            threshold = corners.max() * 0.01
            corner_coords = np.argwhere(corners > threshold)

            # Limit to top N corners to avoid clutter
            num_corners = min(100, len(corner_coords))
            if len(corner_coords) > num_corners:
                corner_strengths = corners[corner_coords[:, 0], corner_coords[:, 1]]
                top_indices = np.argsort(corner_strengths)[-num_corners:]
                corner_coords = corner_coords[top_indices]

            # Draw small extension marks at corners
            for y, x in corner_coords:
                # Random overshoot length
                overshoot_len = np.random.randint(overshoot // 2, overshoot)
                # Draw small cross marks
                cv2.line(canvas, (x - overshoot_len, y), (x + overshoot_len, y), yellow, 1)
                cv2.line(canvas, (x, y - overshoot_len), (x, y + overshoot_len), yellow, 1)

        # Corner registration marks removed per user request

        # Add annotations if enabled
        if enable_annotations:
            annotations = []

            # Add variation labels if names provided
            if head_name:
                annotations.append({'label': f'HEAD: {head_name}', 'position': head_position})
            if body_name:
                annotations.append({'label': f'BODY: {body_name}', 'position': body_position})
            if item_name:
                annotations.append({'label': f'ITEM: {item_name}', 'position': item_position})

            # Add rank label
            annotations.append({'label': f'RANK: {mek_rank}', 'position': rank_position})

            # Add mek number label
            if mek_code:
                annotations.append({'label': f'MEK: {mek_code.upper()}', 'position': mek_number_position})

            if annotations:

                for ann in annotations:
                    # Calculate label box position in margin based on quadrant
                    position = ann['position']

                    # Determine text box position in margin
                    if position == 'top-left':
                        text_x = label_margin
                        text_y = label_margin
                        search_center_x = output_size // 4
                        search_center_y = output_size // 4
                    elif position == 'top-right':
                        text_x = output_size - label_margin
                        text_y = label_margin
                        search_center_x = output_size * 3 // 4
                        search_center_y = output_size // 4
                    elif position == 'bottom-left':
                        text_x = label_margin
                        text_y = output_size - label_margin
                        search_center_x = output_size // 4
                        search_center_y = output_size * 3 // 4
                    else:  # bottom-right
                        text_x = output_size - label_margin
                        text_y = output_size - label_margin
                        search_center_x = output_size * 3 // 4
                        search_center_y = output_size * 3 // 4

                    # Find nearest edge point in the appropriate quadrant of the drawing
                    search_radius = 200
                    y_start = max(0, search_center_y - search_radius)
                    y_end = min(output_size, search_center_y + search_radius)
                    x_start = max(0, search_center_x - search_radius)
                    x_end = min(output_size, search_center_x + search_radius)

                    region = edges_final[y_start:y_end, x_start:x_end]
                    edge_points = np.argwhere(region > 30)

                    if len(edge_points) > 0:
                        # Find edge point closest to the label position
                        edge_points_abs = edge_points.copy()
                        edge_points_abs[:, 0] += y_start
                        edge_points_abs[:, 1] += x_start
                        distances = np.sqrt((edge_points_abs[:, 0] - text_y)**2 + (edge_points_abs[:, 1] - text_x)**2)
                        closest_idx = np.argmin(distances)
                        connect_y = int(edge_points_abs[closest_idx, 0])
                        connect_x = int(edge_points_abs[closest_idx, 1])
                    else:
                        connect_x, connect_y = search_center_x, search_center_y

                    # Get text size for background
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = annotation_font_size / 20.0
                    thickness = max(1, int(font_scale * 2))
                    (text_w, text_h), baseline = cv2.getTextSize(ann['label'], font, font_scale, thickness)

                    # Calculate actual text box position based on quadrant
                    padding = 6
                    if 'right' in position:
                        bg_x2 = text_x - 10
                        bg_x1 = bg_x2 - text_w - padding * 2
                        text_pos_x = bg_x1 + padding
                    else:  # left
                        bg_x1 = text_x + 10
                        bg_x2 = bg_x1 + text_w + padding * 2
                        text_pos_x = bg_x1 + padding

                    if 'bottom' in position:
                        bg_y2 = text_y - 10
                        bg_y1 = bg_y2 - text_h - padding * 2
                        text_pos_y = bg_y2 - padding
                    else:  # top
                        bg_y1 = text_y + 10
                        bg_y2 = bg_y1 + text_h + padding * 2
                        text_pos_y = bg_y1 + text_h + padding // 2

                    # Draw connector line from edge to text box
                    box_center_x = (bg_x1 + bg_x2) // 2
                    box_center_y = (bg_y1 + bg_y2) // 2

                    if annotation_style == 'angled':
                        # Elbow style connector
                        mid_x = (connect_x + box_center_x) // 2
                        mid_y = (connect_y + box_center_y) // 2
                        cv2.line(canvas, (connect_x, connect_y), (mid_x, connect_y), yellow, 2)
                        cv2.line(canvas, (mid_x, connect_y), (mid_x, mid_y), yellow, 2)
                        cv2.line(canvas, (mid_x, mid_y), (box_center_x, mid_y), yellow, 2)
                        cv2.line(canvas, (box_center_x, mid_y), (box_center_x, box_center_y), yellow, 2)
                    else:
                        # Straight line
                        cv2.line(canvas, (connect_x, connect_y), (box_center_x, box_center_y), yellow, 2)

                    # Draw connection dot at edge point
                    cv2.circle(canvas, (connect_x, connect_y), 4, yellow, -1)

                    # Draw text background box
                    cv2.rectangle(canvas, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
                    cv2.rectangle(canvas, (bg_x1, bg_y1), (bg_x2, bg_y2), yellow, 2)

                    # Draw text
                    cv2.putText(canvas, ann['label'], (text_pos_x, text_pos_y), font, font_scale, yellow, thickness)

        # Save result
        cv2.imwrite(output_path, canvas, [cv2.IMWRITE_PNG_COMPRESSION, 9])

        print(f"Blueprint generated successfully: {output_path}", file=sys.stderr)
        return True

    except Exception as e:
        print(f"Error generating blueprint: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate architectural blueprint from Mek image')
    parser.add_argument('input', help='Input image path')
    parser.add_argument('output', help='Output image path')
    parser.add_argument('--canny-low', type=int, default=20, help='Canny low threshold')
    parser.add_argument('--canny-mid', type=int, default=40, help='Canny mid threshold')
    parser.add_argument('--canny-high', type=int, default=60, help='Canny high threshold')
    parser.add_argument('--output-size', type=int, default=2000, help='Output size in pixels')
    parser.add_argument('--line-thickness', type=int, default=1, help='Line thickness')
    parser.add_argument('--overshoot', type=int, default=8, help='Corner overshoot amount')
    parser.add_argument('--grid-opacity', type=int, default=15, help='Grid line opacity (0-50)')
    parser.add_argument('--smoothness', type=int, default=3, help='Line smoothness (0-9)')
    parser.add_argument('--curviness', type=int, default=5, help='Curve smoothing strength (1-15)')
    parser.add_argument('--sketchiness', type=int, default=0, help='Hand-drawn variation (0-10)')
    parser.add_argument('--detail-density', type=int, default=50, help='Amount of fine detail (0-100)')
    parser.add_argument('--enable-annotations', type=str, default='true', help='Enable part annotations')
    parser.add_argument('--annotation-style', type=str, default='angled', help='Annotation line style (straight/angled)')
    parser.add_argument('--annotation-line-length', type=int, default=100, help='Annotation line length in pixels')
    parser.add_argument('--annotation-font-size', type=int, default=24, help='Annotation font size')
    parser.add_argument('--mek-code', type=str, default='', help='Mek code for part labels')
    parser.add_argument('--head-name', type=str, default='', help='Head variation name')
    parser.add_argument('--body-name', type=str, default='', help='Body variation name')
    parser.add_argument('--item-name', type=str, default='', help='Item variation name')
    parser.add_argument('--mek-rank', type=str, default='1', help='Mek rank number')
    parser.add_argument('--head-position', type=str, default='top-right', help='Head label position (top-left/top-right/bottom-left/bottom-right)')
    parser.add_argument('--body-position', type=str, default='bottom-left', help='Body label position (top-left/top-right/bottom-left/bottom-right)')
    parser.add_argument('--item-position', type=str, default='bottom-right', help='Item label position (top-left/top-right/bottom-left/bottom-right)')
    parser.add_argument('--rank-position', type=str, default='top-left', help='Rank label position (top-left/top-right/bottom-left/bottom-right)')
    parser.add_argument('--mek-number-position', type=str, default='bottom-left', help='Mek number label position (top-left/top-right/bottom-left/bottom-right)')
    parser.add_argument('--label-margin', type=int, default=150, help='Distance of labels from canvas edge')

    args = parser.parse_args()

    success = generate_blueprint(
        args.input,
        args.output,
        args.canny_low,
        args.canny_mid,
        args.canny_high,
        args.output_size,
        args.line_thickness,
        args.overshoot,
        args.grid_opacity,
        args.smoothness,
        args.curviness,
        args.sketchiness,
        args.detail_density,
        args.enable_annotations.lower() == 'true',
        args.annotation_style,
        args.annotation_line_length,
        args.annotation_font_size,
        args.mek_code,
        args.head_name,
        args.body_name,
        args.item_name,
        args.mek_rank,
        args.head_position,
        args.body_position,
        args.item_position,
        args.rank_position,
        args.mek_number_position,
        args.label_margin
    )

    sys.exit(0 if success else 1)
