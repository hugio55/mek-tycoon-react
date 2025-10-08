/**
 * Session Utilities
 * Helper functions for session management
 */

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random1}${random2}`;
}

/**
 * Generate a device ID based on platform and user agent
 */
export function generateDeviceId(platform?: string, userAgent?: string): string {
  const platformStr = platform || 'unknown';
  const uaHash = userAgent ? hashString(userAgent).substring(0, 8) : 'default';
  const random = Math.random().toString(36).substring(2, 8);
  return `device_${platformStr}_${uaHash}_${random}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
