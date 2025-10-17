import cv2
import numpy as np
from pathlib import Path
import sys

"""
Quick comparison script to show original vs ultra side-by-side
"""

def create_comparison(original_path, ultra_path, output_path):
    """Create side-by-side comparison image"""

    # Load both images
    original = cv2.imread(str(original_path))
    ultra = cv2.imread(str(ultra_path))

    if original is None or ultra is None:
        print("Error: Could not load images")
        return False

    # Resize if needed to match heights
    if original.shape[0] != ultra.shape[0]:
        height = min(original.shape[0], ultra.shape[0])
        original = cv2.resize(original, (int(original.shape[1] * height / original.shape[0]), height))
        ultra = cv2.resize(ultra, (int(ultra.shape[1] * height / ultra.shape[0]), height))

    # Create side-by-side
    comparison = np.hstack([original, ultra])

    # Add labels
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(comparison, "ORIGINAL (Optimized)", (20, 40), font, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(comparison, "ULTRA-DETAILED", (original.shape[1] + 20, 40), font, 1.2, (255, 255, 255), 2, cv2.LINE_AA)

    # Add divider line
    cv2.line(comparison, (original.shape[1], 0), (original.shape[1], comparison.shape[0]), (255, 255, 255), 3)

    # Save
    cv2.imwrite(str(output_path), comparison, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Comparison saved to: {output_path}")

    return True


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python compare-blueprints.py original.png ultra.png comparison-output.png")
        sys.exit(1)

    create_comparison(sys.argv[1], sys.argv[2], sys.argv[3])
