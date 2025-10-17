"""
Technical Blueprint Converter - Dashed/Stippled Line Style
===========================================================
Creates engineering drawings with dashed pen strokes instead of continuous lines.
Mimics technical pen work (rapidograph/isograph style) for hand-drawn aesthetic.
"""

import cv2
import numpy as np
from typing import Tuple
import random

class DashedBlueprintConverter:
    """Converts images to technical blueprints with dashed/stippled line style."""

    # Color constants
    GOLD = (23, 182, 250)  # BGR format for #fab617
    BLACK = (0, 0, 0)
    DARK_GRAY = (20, 20, 20)
    GRID_COLOR = (40, 40, 40)

    def __init__(self, output_size: int = 2000):
        """
        Initialize converter.

        Args:
            output_size: Output image dimension (square)
        """
        self.output_size = output_size

    def create_grid_background(self, size: int) -> np.ndarray:
        """Create black grid paper background."""
        bg = np.zeros((size, size, 3), dtype=np.uint8)
        bg[:] = self.BLACK

        # Draw grid lines
        grid_spacing = 40
        for i in range(0, size, grid_spacing):
            # Vertical lines
            cv2.line(bg, (i, 0), (i, size), self.GRID_COLOR, 1)
            # Horizontal lines
            cv2.line(bg, (0, i), (size, i), self.GRID_COLOR, 1)

        return bg

    def draw_dashed_line(self, img: np.ndarray, pt1: Tuple[int, int],
                         pt2: Tuple[int, int], color: Tuple[int, int, int],
                         min_dash: int = 2, max_dash: int = 8,
                         min_gap: int = 1, max_gap: int = 4) -> None:
        """
        Draw a dashed line with randomized dash/gap lengths.

        Args:
            img: Image to draw on
            pt1: Start point (x, y)
            pt2: End point (x, y)
            color: Line color in BGR
            min_dash: Minimum dash length in pixels
            max_dash: Maximum dash length in pixels
            min_gap: Minimum gap length in pixels
            max_gap: Maximum gap length in pixels
        """
        x1, y1 = pt1
        x2, y2 = pt2

        # Calculate line length and direction
        dx = x2 - x1
        dy = y2 - y1
        length = np.sqrt(dx**2 + dy**2)

        if length < 1:
            return

        # Unit vector
        ux = dx / length
        uy = dy / length

        # Draw dashes along the line
        current_length = 0
        drawing = True

        while current_length < length:
            if drawing:
                # Draw a dash
                dash_length = random.randint(min_dash, max_dash)
                dash_length = min(dash_length, length - current_length)

                start_x = int(x1 + ux * current_length)
                start_y = int(y1 + uy * current_length)
                end_x = int(x1 + ux * (current_length + dash_length))
                end_y = int(y1 + uy * (current_length + dash_length))

                cv2.line(img, (start_x, start_y), (end_x, end_y), color, 1, cv2.LINE_AA)
                current_length += dash_length
                drawing = False
            else:
                # Add a gap
                gap_length = random.randint(min_gap, max_gap)
                current_length += gap_length
                drawing = True

    def draw_stippled_contour(self, img: np.ndarray, contour: np.ndarray,
                              color: Tuple[int, int, int], line_type: str = 'medium') -> None:
        """
        Draw a contour as dashed/stippled lines.

        Args:
            img: Image to draw on
            contour: OpenCV contour array
            color: Line color in BGR
            line_type: 'long', 'medium', or 'short' for dash length variation
        """
        # Dash/gap parameters based on line type
        params = {
            'long': (6, 10, 2, 4),    # Primary outlines - longer dashes
            'medium': (4, 7, 2, 3),   # Secondary details - medium dashes
            'short': (2, 4, 1, 2)     # Texture/shading - short dashes/dots
        }

        min_dash, max_dash, min_gap, max_gap = params.get(line_type, params['medium'])

        # Flatten contour to list of points
        points = contour.reshape(-1, 2)

        # Draw dashed lines between consecutive points
        for i in range(len(points) - 1):
            pt1 = tuple(points[i])
            pt2 = tuple(points[i + 1])
            self.draw_dashed_line(img, pt1, pt2, color, min_dash, max_dash, min_gap, max_gap)

        # Close the contour
        if len(points) > 0:
            pt1 = tuple(points[-1])
            pt2 = tuple(points[0])
            self.draw_dashed_line(img, pt1, pt2, color, min_dash, max_dash, min_gap, max_gap)

    def add_stippled_texture(self, img: np.ndarray, edges: np.ndarray,
                             color: Tuple[int, int, int], density: float = 0.3) -> None:
        """
        Add stippled dots in areas with weak edges for texture.

        Args:
            img: Image to draw on
            edges: Edge map
            color: Dot color in BGR
            density: Probability of placing a dot (0-1)
        """
        # Find weak edge areas (below threshold but not zero)
        weak_edges = cv2.inRange(edges, 30, 100)

        # Get coordinates of weak edge pixels
        y_coords, x_coords = np.where(weak_edges > 0)

        # Randomly sample points for stippling
        num_points = len(x_coords)
        sample_size = int(num_points * density)

        if sample_size > 0:
            indices = random.sample(range(num_points), min(sample_size, num_points))

            for idx in indices:
                x, y = int(x_coords[idx]), int(y_coords[idx])
                # Draw small dots
                cv2.circle(img, (x, y), 1, color, -1, cv2.LINE_AA)

    def draw_sci_fi_border(self, img: np.ndarray, color: Tuple[int, int, int]) -> None:
        """Draw sci-fi technical border with greebles using dashed lines."""
        h, w = img.shape[:2]
        border_thickness = 60
        corner_size = 120

        # Outer frame - long dashes
        frame_points = [
            ((border_thickness, border_thickness), (w - border_thickness, border_thickness)),
            ((w - border_thickness, border_thickness), (w - border_thickness, h - border_thickness)),
            ((w - border_thickness, h - border_thickness), (border_thickness, h - border_thickness)),
            ((border_thickness, h - border_thickness), (border_thickness, border_thickness))
        ]

        for pt1, pt2 in frame_points:
            self.draw_dashed_line(img, pt1, pt2, color, 8, 12, 3, 5)

        # Corner brackets - medium dashes
        corners = [
            (border_thickness, border_thickness),  # Top-left
            (w - border_thickness, border_thickness),  # Top-right
            (w - border_thickness, h - border_thickness),  # Bottom-right
            (border_thickness, h - border_thickness)  # Bottom-left
        ]

        for i, (cx, cy) in enumerate(corners):
            # Determine corner direction
            if i == 0:  # Top-left
                pts = [
                    ((cx, cy), (cx + corner_size, cy)),
                    ((cx, cy), (cx, cy + corner_size)),
                    ((cx + 20, cy + 20), (cx + 40, cy + 20)),
                    ((cx + 20, cy + 20), (cx + 20, cy + 40))
                ]
            elif i == 1:  # Top-right
                pts = [
                    ((cx, cy), (cx - corner_size, cy)),
                    ((cx, cy), (cx, cy + corner_size)),
                    ((cx - 20, cy + 20), (cx - 40, cy + 20)),
                    ((cx - 20, cy + 20), (cx - 20, cy + 40))
                ]
            elif i == 2:  # Bottom-right
                pts = [
                    ((cx, cy), (cx - corner_size, cy)),
                    ((cx, cy), (cx, cy - corner_size)),
                    ((cx - 20, cy - 20), (cx - 40, cy - 20)),
                    ((cx - 20, cy - 20), (cx - 20, cy - 40))
                ]
            else:  # Bottom-left
                pts = [
                    ((cx, cy), (cx + corner_size, cy)),
                    ((cx, cy), (cx, cy - corner_size)),
                    ((cx + 20, cy - 20), (cx + 40, cy - 20)),
                    ((cx + 20, cy - 20), (cx + 20, cy - 40))
                ]

            for pt1, pt2 in pts:
                self.draw_dashed_line(img, pt1, pt2, color, 4, 7, 2, 3)

    def convert(self, input_path: str, output_path: str) -> None:
        """
        Convert image to dashed technical blueprint.

        Args:
            input_path: Path to input image
            output_path: Path to save output image
        """
        print(f"Loading image: {input_path}")
        img = cv2.imread(input_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {input_path}")

        print("Preprocessing image...")
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply bilateral filter to reduce noise while preserving edges
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # Edge detection with multiple thresholds
        print("Detecting edges at multiple levels...")
        edges_strong = cv2.Canny(denoised, 100, 200, apertureSize=3)
        edges_medium = cv2.Canny(denoised, 50, 150, apertureSize=3)
        edges_weak = cv2.Canny(denoised, 30, 100, apertureSize=3)

        # Find contours for each edge level
        print("Finding contours...")
        contours_strong, _ = cv2.findContours(edges_strong, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        contours_medium, _ = cv2.findContours(edges_medium, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        contours_weak, _ = cv2.findContours(edges_weak, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        # Filter out tiny contours
        contours_strong = [c for c in contours_strong if cv2.contourArea(c) > 10]
        contours_medium = [c for c in contours_medium if cv2.contourArea(c) > 5]
        contours_weak = [c for c in contours_weak if cv2.contourArea(c) > 3]

        print(f"Found {len(contours_strong)} strong, {len(contours_medium)} medium, {len(contours_weak)} weak contours")

        # Resize to fit output with padding
        print("Preparing canvas...")
        padding = 200
        content_size = self.output_size - 2 * padding

        # Calculate scaling to fit content area
        h, w = gray.shape
        scale = min(content_size / w, content_size / h)
        new_w = int(w * scale)
        new_h = int(h * scale)

        # Scale factor for contours
        scale_x = new_w / w
        scale_y = new_h / h

        # Create grid background
        blueprint = self.create_grid_background(self.output_size)

        # Calculate centering offset
        offset_x = padding + (content_size - new_w) // 2
        offset_y = padding + (content_size - new_h) // 2

        print("Drawing dashed contours...")
        # Draw contours with different dash styles (from back to front)

        # 1. Weak edges - short dashes/dots for texture
        for contour in contours_weak:
            # Scale and offset contour
            scaled_contour = contour.copy().astype(float)
            scaled_contour[:, 0, 0] = scaled_contour[:, 0, 0] * scale_x + offset_x
            scaled_contour[:, 0, 1] = scaled_contour[:, 0, 1] * scale_y + offset_y
            scaled_contour = scaled_contour.astype(np.int32)

            self.draw_stippled_contour(blueprint, scaled_contour, self.GOLD, 'short')

        # 2. Medium edges - medium dashes for secondary details
        for contour in contours_medium:
            scaled_contour = contour.copy().astype(float)
            scaled_contour[:, 0, 0] = scaled_contour[:, 0, 0] * scale_x + offset_x
            scaled_contour[:, 0, 1] = scaled_contour[:, 0, 1] * scale_y + offset_y
            scaled_contour = scaled_contour.astype(np.int32)

            self.draw_stippled_contour(blueprint, scaled_contour, self.GOLD, 'medium')

        # 3. Strong edges - long dashes for primary outlines
        for contour in contours_strong:
            scaled_contour = contour.copy().astype(float)
            scaled_contour[:, 0, 0] = scaled_contour[:, 0, 0] * scale_x + offset_x
            scaled_contour[:, 0, 1] = scaled_contour[:, 0, 1] * scale_y + offset_y
            scaled_contour = scaled_contour.astype(np.int32)

            self.draw_stippled_contour(blueprint, scaled_contour, self.GOLD, 'long')

        # Add stippled texture in weak edge areas
        print("Adding stippled texture...")
        # Resize weak edges map
        edges_weak_resized = cv2.resize(edges_weak, (new_w, new_h))

        # Create temporary canvas for texture
        texture_canvas = np.zeros((new_h, new_w, 3), dtype=np.uint8)
        self.add_stippled_texture(texture_canvas, edges_weak_resized, self.GOLD, density=0.2)

        # Copy texture to main blueprint
        blueprint[offset_y:offset_y+new_h, offset_x:offset_x+new_w] = cv2.addWeighted(
            blueprint[offset_y:offset_y+new_h, offset_x:offset_x+new_w],
            1.0,
            texture_canvas,
            1.0,
            0
        )

        # Draw sci-fi border with dashed lines
        print("Drawing technical border...")
        self.draw_sci_fi_border(blueprint, self.GOLD)

        # Save output
        print(f"Saving blueprint: {output_path}")
        cv2.imwrite(output_path, blueprint)
        print("Complete!")


def main():
    """Convert test image to dashed technical blueprint."""
    converter = DashedBlueprintConverter(output_size=2000)

    input_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-dashed-technical.png"

    converter.convert(input_path, output_path)


if __name__ == "__main__":
    main()
