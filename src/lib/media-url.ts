/**
 * Media URL Utility - Environment-aware media file loading
 *
 * Purpose: Switch between local files (localhost) and R2 CDN (production)
 * - Localhost: Uses local /public files for fast development
 * - Production: Uses Cloudflare R2 CDN for Vercel deployments
 *
 * Usage:
 *   const imageSrc = getMediaUrl('/mek-images/150px/aa1-aa4-gh1.webp');
 *   const videoSrc = getMediaUrl('/random-images/Loading Bar Full 10.120.webm');
 *   const audioSrc = getMediaUrl('/audio/giggliest-girl-1.mp3');
 */

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_URL || '';

/**
 * Get the correct URL for a media file based on environment
 * @param path - Path to media file (must start with /)
 * @returns Full URL for localhost or R2 CDN
 */
export function getMediaUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  if (R2_BASE_URL) {
    return `${R2_BASE_URL}${path}`;
  }

  return path;
}

/**
 * Check if using R2 CDN (true) or local files (false)
 */
export function isUsingR2(): boolean {
  return !!R2_BASE_URL;
}

/**
 * Get media source info for debugging
 */
export function getMediaSource(): 'local' | 'r2' {
  return R2_BASE_URL ? 'r2' : 'local';
}
