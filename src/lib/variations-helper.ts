// Helper functions for managing variations image paths

/**
 * Gets the variations image folder path from localStorage
 * Returns the custom path if set, otherwise returns the default public path
 */
export function getVariationsImageFolder(): string {
  if (typeof window === 'undefined') {
    return '/variation-images'; // Default for SSR
  }

  const customPath = localStorage.getItem('variationsImageFolder');
  return customPath || '/variation-images'; // Default to public folder
}

/**
 * Constructs the full path to a variation image
 * @param imageName - The name of the image file (e.g., 'taser.png')
 * @returns The full path to the image
 */
export function getVariationImagePath(imageName: string): string {
  const folder = getVariationsImageFolder();

  // If it's already a full path, return as is
  if (imageName.startsWith('http') || imageName.startsWith('/')) {
    return imageName;
  }

  // For any custom folder path (Windows or web), just use the default public path
  // since Next.js serves files from the public folder
  // This ensures consistency regardless of what path format is entered
  if (folder && folder !== '/variation-images') {
    // If a custom path is set, we still use the public folder
    // but this allows for future expansion if needed
    console.log(`Custom folder set: ${folder}, but using default /variation-images for web serving`);
  }

  // Always use the web-accessible path from public folder
  return `/variation-images/${imageName}`;
}

/**
 * Maps variation names to their image filenames
 */
export const VARIATION_IMAGE_MAP: Record<string, string> = {
  // Traits/Variations
  'TASER': 'taser.png',
  'LOG': 'log.png',
  'KEVLAR': 'kevlar.png',
  'NUKE': 'nuke.png',
  'EXPOSED': 'exposed.png',
  'EXPOSEC': 'exposec.png',
  'JADE': 'jade.png',
  'SHAMROCK': 'shamrock.png',
  'CLASSIC': 'classic.png',
  'LIGHTNING': 'lightning.png',
  'CORRODED': 'corroded.png',
  'PRICKLES': 'prickles.png',
  'VAMPIRE': 'vampire.png',
  'NOOB': 'noob.png',
  'PYREX': 'pyrex.png',

  // Common variations
  'STANDARD': 'standard.png',
  'BASIC': 'basic.png',
  'COMMON': 'common.png',

  // Add more mappings as needed
  'DEFAULT': 'default.png'
};

/**
 * Gets the image path for a specific variation
 * @param variationName - The name of the variation (e.g., 'TASER', 'Exposec')
 * @returns The full path to the variation's image
 */
export function getVariationImage(variationName: string): string {
  // Normalize the name to uppercase for lookup
  const normalizedName = variationName.toUpperCase();
  const imageFile = VARIATION_IMAGE_MAP[normalizedName] || VARIATION_IMAGE_MAP['DEFAULT'];

  const fullPath = getVariationImagePath(imageFile);

  // Debug logging to help identify missing images
  if (typeof window !== 'undefined') {
    console.log(`Variation: ${variationName} → File: ${imageFile} → Path: ${fullPath}`);
  }

  return fullPath;
}