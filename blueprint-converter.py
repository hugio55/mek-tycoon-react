import cv2
import numpy as np
from pathlib import Path

def convert_to_blueprint(input_path, output_path, style='technical'):
    """
    Convert an image to blueprint/architectural sketch style

    Args:
        input_path: Path to input image
        output_path: Path to save output
        style: 'technical' (default) or 'sketch' for different effects
    """
    # Read the image
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Error: Could not read image at {input_path}")
        return False

    # Handle transparency (convert RGBA to RGB)
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        # Create white background
        white_bg = np.ones_like(rgb) * 255
        # Blend with alpha
        alpha_factor = alpha[:, :, np.newaxis].astype(np.float32) / 255.0
        img = (rgb * alpha_factor + white_bg * (1 - alpha_factor)).astype(np.uint8)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if style == 'technical':
        # Technical blueprint style
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)

        # Invert edges (white lines on black)
        edges_inv = cv2.bitwise_not(edges)

        # Apply Gaussian blur for softer lines
        blurred = cv2.GaussianBlur(edges_inv, (3, 3), 0)

        # Create blueprint blue background
        # Classic blueprint blue: RGB(0, 42, 65) or lighter RGB(10, 80, 130)
        blueprint = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)
        blueprint[:, :] = [130, 80, 10]  # BGR format (reversed)

        # Add white lines where edges were detected
        mask = blurred < 200
        blueprint[mask] = [255, 255, 255]

        # Add slight noise for texture
        noise = np.random.randint(-10, 10, blueprint.shape, dtype=np.int16)
        blueprint = np.clip(blueprint.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    else:  # 'sketch' style
        # Sketch style with pencil effect
        edges = cv2.Canny(gray, 30, 100)
        edges_inv = cv2.bitwise_not(edges)

        # Create sepia/aged paper background
        blueprint = np.ones((img.shape[0], img.shape[1], 3), dtype=np.uint8) * 240
        blueprint[:, :, 0] = 220  # Blue channel
        blueprint[:, :, 1] = 235  # Green channel
        blueprint[:, :, 2] = 245  # Red channel

        # Add sketch lines
        mask = edges > 100
        blueprint[mask] = [50, 50, 50]  # Dark gray lines

    # Save the result
    cv2.imwrite(str(output_path), blueprint)
    print(f"[OK] Converted: {input_path.name} -> {output_path.name}")
    return True


if __name__ == "__main__":
    # Test on one image
    input_image = Path("public/mek-images/150px/aa1-ak1-bc2.webp")
    output_image = Path("public/mek-images/aa1-ak1-bc2-blueprint.png")

    print("Converting Mek image to blueprint style...")
    print(f"Input: {input_image}")
    print(f"Output: {output_image}")
    print()

    # Try technical style
    if convert_to_blueprint(input_image, output_image, style='technical'):
        print()
        print("Success! Check the output file to see the blueprint effect.")
        print()
        print("To adjust the effect, you can:")
        print("1. Try style='sketch' for a pencil drawing look")
        print("2. Adjust Canny edge detection thresholds (50, 150)")
        print("3. Change the blueprint blue color values")
    else:
        print("Failed to convert image.")
