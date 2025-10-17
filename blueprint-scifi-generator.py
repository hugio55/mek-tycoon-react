"""
Sci-Fi Technical Blueprint Generator for Mek Robots
Creates unique black grid paper with yellow technical drawings and procedural greebles
"""

import cv2
import numpy as np
from typing import Tuple
import random
import string


class SciFiBlueprintGenerator:
    """Generates unique sci-fi technical blueprints with procedural variations"""

    def __init__(self, output_size: int = 2000, seed: int = None):
        self.output_size = output_size
        self.seed = seed
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        # Color scheme
        self.bg_black = (0, 0, 0)
        self.yellow = (23, 182, 250)  # BGR format for #fab617
        self.yellow_dim = (15, 120, 165)  # Dimmer yellow for grid
        self.yellow_bright = (30, 220, 255)  # Brighter yellow for highlights

    def generate_grid_paper(self) -> np.ndarray:
        """Generate black grid paper with fine grid lines and realistic grunge"""
        canvas = np.zeros((self.output_size, self.output_size, 3), dtype=np.uint8)

        # Add subtle noise to black background for texture
        noise = np.random.randint(-10, 10, (self.output_size, self.output_size), dtype=np.int16)
        for i in range(3):
            canvas[:, :, i] = np.clip(canvas[:, :, i] + noise, 0, 255).astype(np.uint8)

        # Draw fine grid lines (major and minor)
        major_spacing = 100  # Major grid lines every 100px
        minor_spacing = 20   # Minor grid lines every 20px

        # Minor grid lines (very dim)
        for i in range(0, self.output_size, minor_spacing):
            alpha = random.uniform(0.05, 0.15)
            color = tuple(int(c * alpha) for c in self.yellow_dim)
            cv2.line(canvas, (i, 0), (i, self.output_size), color, 1)
            cv2.line(canvas, (0, i), (self.output_size, i), color, 1)

        # Major grid lines (slightly brighter)
        for i in range(0, self.output_size, major_spacing):
            alpha = random.uniform(0.15, 0.25)
            color = tuple(int(c * alpha) for c in self.yellow_dim)
            cv2.line(canvas, (i, 0), (i, self.output_size), color, 1)
            cv2.line(canvas, (0, i), (self.output_size, i), color, 1)

        # Add grunge effects
        canvas = self._add_grunge_effects(canvas)

        return canvas

    def _add_grunge_effects(self, canvas: np.ndarray) -> np.ndarray:
        """Add scratches, stains, and wear marks"""
        grunge = canvas.copy()
        h, w = canvas.shape[:2]

        # Add random scratches (subtle yellow/white marks)
        num_scratches = random.randint(30, 60)
        for _ in range(num_scratches):
            x1, y1 = random.randint(0, w), random.randint(0, h)
            length = random.randint(50, 300)
            angle = random.uniform(0, 2 * np.pi)
            x2 = int(x1 + length * np.cos(angle))
            y2 = int(y1 + length * np.sin(angle))

            alpha = random.uniform(0.05, 0.2)
            color = tuple(int(c * alpha) for c in self.yellow_dim)
            thickness = random.choice([1, 1, 1, 2])
            cv2.line(grunge, (x1, y1), (x2, y2), color, thickness)

        # Add stain/wear spots
        num_stains = random.randint(10, 25)
        for _ in range(num_stains):
            center = (random.randint(0, w), random.randint(0, h))
            radius = random.randint(20, 100)
            alpha = random.uniform(0.03, 0.10)

            # Create circular stain
            overlay = grunge.copy()
            cv2.circle(overlay, center, radius, (10, 10, 10), -1)
            grunge = cv2.addWeighted(grunge, 1 - alpha, overlay, alpha, 0)

        # Add subtle texture noise
        texture = np.random.randint(-8, 8, (h, w), dtype=np.int16)
        for i in range(3):
            grunge[:, :, i] = np.clip(grunge[:, :, i] + texture, 0, 255).astype(np.uint8)

        return grunge

    def extract_edges_multipass(self, image: np.ndarray) -> np.ndarray:
        """Multi-pass edge detection for high detail extraction"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Pass 1: Bilateral filter for noise reduction while preserving edges
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # Pass 2: Multiple edge detection methods combined
        # Canny with moderate thresholds
        edges_canny = cv2.Canny(denoised, 50, 150, apertureSize=3)

        # Sobel operators for directional edges
        sobel_x = cv2.Sobel(denoised, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(denoised, cv2.CV_64F, 0, 1, ksize=3)
        sobel_combined = np.sqrt(sobel_x**2 + sobel_y**2)
        sobel_normalized = np.uint8(255 * sobel_combined / np.max(sobel_combined))
        _, edges_sobel = cv2.threshold(sobel_normalized, 50, 255, cv2.THRESH_BINARY)

        # Laplacian for fine details
        laplacian = cv2.Laplacian(denoised, cv2.CV_64F, ksize=3)
        laplacian_normalized = np.uint8(255 * np.abs(laplacian) / np.max(np.abs(laplacian)))
        _, edges_laplacian = cv2.threshold(laplacian_normalized, 30, 255, cv2.THRESH_BINARY)

        # Combine all edge maps
        edges_combined = cv2.bitwise_or(edges_canny, edges_sobel)
        edges_combined = cv2.bitwise_or(edges_combined, edges_laplacian)

        # Pass 3: Morphological refinement
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        edges_closed = cv2.morphologyEx(edges_combined, cv2.MORPH_CLOSE, kernel_close)

        # Pass 4: Remove small noise
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        edges_clean = cv2.morphologyEx(edges_closed, cv2.MORPH_OPEN, kernel_open)

        # Pass 5: Slight dilation to strengthen lines
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        edges_final = cv2.dilate(edges_clean, kernel_dilate, iterations=1)

        return edges_final

    def add_scifi_greebles(self, canvas: np.ndarray) -> np.ndarray:
        """Add procedurally generated sci-fi technical details"""
        annotated = canvas.copy()
        w, h = self.output_size, self.output_size
        margin = 50

        # Corner registration marks
        self._add_corner_marks(annotated, margin)

        # Grid coordinate markers along edges
        self._add_coordinate_markers(annotated, margin)

        # Technical data boxes (randomized positions on borders)
        self._add_data_boxes(annotated, margin)

        # Measurement annotations
        self._add_measurement_marks(annotated, margin)

        # Small technical greebles
        self._add_technical_greebles(annotated, margin)

        return annotated

    def _add_corner_marks(self, canvas: np.ndarray, margin: int):
        """Add registration marks in corners"""
        corners = [
            (margin, margin),
            (self.output_size - margin, margin),
            (margin, self.output_size - margin),
            (self.output_size - margin, self.output_size - margin)
        ]

        for x, y in corners:
            # Crosshair
            length = 20
            cv2.line(canvas, (x - length, y), (x + length, y), self.yellow, 2)
            cv2.line(canvas, (x, y - length), (x, y + length), self.yellow, 2)

            # Circle
            cv2.circle(canvas, (x, y), 15, self.yellow, 2)
            cv2.circle(canvas, (x, y), 25, self.yellow, 1)

    def _add_coordinate_markers(self, canvas: np.ndarray, margin: int):
        """Add grid coordinate markers along edges"""
        spacing = 200
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.4

        # Top edge markers
        for i, x in enumerate(range(margin, self.output_size - margin, spacing)):
            label = f"{chr(65 + i)}"  # A, B, C, ...
            cv2.line(canvas, (x, margin - 15), (x, margin - 5), self.yellow, 1)
            cv2.putText(canvas, label, (x - 5, margin - 20), font, font_scale, self.yellow, 1)

        # Left edge markers
        for i, y in enumerate(range(margin, self.output_size - margin, spacing)):
            label = f"{i + 1}"
            cv2.line(canvas, (margin - 15, y), (margin - 5, y), self.yellow, 1)
            cv2.putText(canvas, label, (margin - 30, y + 5), font, font_scale, self.yellow, 1)

    def _add_data_boxes(self, canvas: np.ndarray, margin: int):
        """Add technical data readout boxes"""
        num_boxes = random.randint(3, 6)

        for _ in range(num_boxes):
            # Random position on border
            side = random.choice(['top', 'bottom', 'left', 'right'])

            if side == 'top':
                x = random.randint(200, self.output_size - 400)
                y = 15
            elif side == 'bottom':
                x = random.randint(200, self.output_size - 400)
                y = self.output_size - 50
            elif side == 'left':
                x = 15
                y = random.randint(200, self.output_size - 400)
            else:  # right
                x = self.output_size - 180
                y = random.randint(200, self.output_size - 400)

            # Draw box
            box_w, box_h = 160, 35
            cv2.rectangle(canvas, (x, y), (x + box_w, y + box_h), self.yellow, 1)

            # Add random technical text
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            value = ''.join(random.choices(string.digits, k=4))

            font = cv2.FONT_HERSHEY_SIMPLEX
            cv2.putText(canvas, f"{code}", (x + 5, y + 15), font, 0.35, self.yellow, 1)
            cv2.putText(canvas, f"VAL: {value}", (x + 5, y + 28), font, 0.3, self.yellow_dim, 1)

    def _add_measurement_marks(self, canvas: np.ndarray, margin: int):
        """Add measurement/dimension annotations"""
        num_marks = random.randint(4, 8)

        for _ in range(num_marks):
            # Random position and orientation
            if random.choice([True, False]):
                # Horizontal measurement
                x1 = random.randint(margin + 100, self.output_size // 2)
                x2 = x1 + random.randint(100, 300)
                y = random.choice([margin + 30, self.output_size - margin - 30])

                cv2.line(canvas, (x1, y - 5), (x1, y + 5), self.yellow, 1)
                cv2.line(canvas, (x2, y - 5), (x2, y + 5), self.yellow, 1)
                cv2.line(canvas, (x1, y), (x2, y), self.yellow, 1)

                # Measurement value
                length = x2 - x1
                cv2.putText(canvas, f"{length}px", ((x1 + x2) // 2 - 20, y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.3, self.yellow, 1)
            else:
                # Vertical measurement
                y1 = random.randint(margin + 100, self.output_size // 2)
                y2 = y1 + random.randint(100, 300)
                x = random.choice([margin + 30, self.output_size - margin - 30])

                cv2.line(canvas, (x - 5, y1), (x + 5, y1), self.yellow, 1)
                cv2.line(canvas, (x - 5, y2), (x + 5, y2), self.yellow, 1)
                cv2.line(canvas, (x, y1), (x, y2), self.yellow, 1)

    def _add_technical_greebles(self, canvas: np.ndarray, margin: int):
        """Add small technical details and decorations"""
        num_greebles = random.randint(10, 20)

        for _ in range(num_greebles):
            # Random position on borders
            side = random.choice(['top', 'bottom', 'left', 'right'])

            if side == 'top':
                x = random.randint(margin, self.output_size - margin)
                y = random.randint(5, margin - 5)
            elif side == 'bottom':
                x = random.randint(margin, self.output_size - margin)
                y = random.randint(self.output_size - margin + 5, self.output_size - 5)
            elif side == 'left':
                x = random.randint(5, margin - 5)
                y = random.randint(margin, self.output_size - margin)
            else:
                x = random.randint(self.output_size - margin + 5, self.output_size - 5)
                y = random.randint(margin, self.output_size - margin)

            # Random greeble type
            greeble_type = random.choice(['circle', 'rect', 'line', 'cross'])

            if greeble_type == 'circle':
                cv2.circle(canvas, (x, y), random.randint(3, 8), self.yellow_dim, 1)
            elif greeble_type == 'rect':
                size = random.randint(5, 12)
                cv2.rectangle(canvas, (x - size//2, y - size//2),
                            (x + size//2, y + size//2), self.yellow_dim, 1)
            elif greeble_type == 'line':
                length = random.randint(5, 15)
                angle = random.uniform(0, 2 * np.pi)
                x2 = int(x + length * np.cos(angle))
                y2 = int(y + length * np.sin(angle))
                cv2.line(canvas, (x, y), (x2, y2), self.yellow_dim, 1)
            else:  # cross
                size = 5
                cv2.line(canvas, (x - size, y), (x + size, y), self.yellow_dim, 1)
                cv2.line(canvas, (x, y - size), (x, y + size), self.yellow_dim, 1)

    def process_mek_image(self, input_path: str, output_path: str):
        """
        Process a single Mek image into sci-fi blueprint

        Args:
            input_path: Path to source Mek image
            output_path: Path to save blueprint output
        """
        # Load source image
        img = cv2.imread(input_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {input_path}")

        print(f"Loaded image: {img.shape}")

        # Generate grid paper background
        print("Generating black grid paper with grunge effects...")
        canvas = self.generate_grid_paper()

        # Extract edges from Mek
        print("Extracting edges with multi-pass detection...")
        edges = self.extract_edges_multipass(img)

        # Resize Mek to fit in center (leaving room for annotations)
        target_size = 1600  # Leave 200px margin on each side
        h, w = edges.shape
        scale = min(target_size / w, target_size / h)
        new_w, new_h = int(w * scale), int(h * scale)
        edges_resized = cv2.resize(edges, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Center the Mek on canvas
        offset_x = (self.output_size - new_w) // 2
        offset_y = (self.output_size - new_h) // 2

        # Apply yellow color to edges
        print("Applying yellow color to technical drawing...")
        yellow_edges = np.zeros((self.output_size, self.output_size, 3), dtype=np.uint8)
        for i in range(3):
            yellow_edges[offset_y:offset_y+new_h, offset_x:offset_x+new_w, i] = \
                edges_resized.astype(float) * (self.yellow[i] / 255.0)

        # Composite edges onto grid paper
        mask = (yellow_edges > 0).any(axis=2)
        canvas[mask] = yellow_edges[mask]

        # Add sci-fi greebles and annotations
        print("Adding procedural sci-fi greebles and technical annotations...")
        final = self.add_scifi_greebles(canvas)

        # Save result
        cv2.imwrite(output_path, final)
        print(f"Blueprint saved to: {output_path}")
        print(f"Output size: {final.shape}")


def main():
    """Test with single Mek image"""
    input_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\1000px\aa1-ak1-bc2.webp"
    output_path = r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\test-black-yellow-scifi.png"

    # Create generator with random seed for unique variations
    # For batch processing, use different seed for each image
    generator = SciFiBlueprintGenerator(output_size=2000, seed=42)

    try:
        generator.process_mek_image(input_path, output_path)
        print("\n✓ Successfully generated sci-fi blueprint!")
        print("\nFor batch processing:")
        print("1. Loop through all Mek images")
        print("2. Use unique seed for each (e.g., hash of filename)")
        print("3. Each output will have unique grunge, greebles, and annotations")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
