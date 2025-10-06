/**
 * Platform Detection Utilities
 * Detects device platform, generates device IDs, and provides user agent info
 */

export type PlatformType = 'mobile_ios' | 'mobile_android' | 'mobile_web' | 'desktop';

/**
 * Detect the platform the user is on
 */
export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const userAgentLower = userAgent.toLowerCase();

  // Check for iOS
  const isIOS = /ipad|iphone|ipod/.test(userAgentLower) && !(window as any).MSStream;

  // Check for Android
  const isAndroid = /android/.test(userAgentLower);

  // Check if in standalone mode (PWA/installed app)
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://');

  if (isIOS) {
    return isStandalone ? 'mobile_ios' : 'mobile_web';
  }

  if (isAndroid) {
    return isStandalone ? 'mobile_android' : 'mobile_web';
  }

  // Check for other mobile devices
  const isMobile = /mobile|webos|blackberry|iemobile|opera mini/i.test(userAgentLower);

  if (isMobile) {
    return 'mobile_web';
  }

  return 'desktop';
}

/**
 * Generate a semi-persistent device identifier
 * This creates a fingerprint based on browser and device characteristics
 * Note: This is NOT cryptographically secure, just for tracking purposes
 */
export function generateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-side-render';

  // Check if we already have a device ID stored
  const storedId = localStorage.getItem('mek_device_id');
  if (storedId) {
    return storedId;
  }

  // Create a fingerprint from various browser properties
  const fingerprint: string[] = [];

  // Screen properties
  fingerprint.push(screen.width.toString());
  fingerprint.push(screen.height.toString());
  fingerprint.push(screen.colorDepth.toString());

  // Timezone
  fingerprint.push(new Date().getTimezoneOffset().toString());

  // Language
  fingerprint.push(navigator.language);

  // Platform
  fingerprint.push(navigator.platform);

  // Hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    fingerprint.push(navigator.hardwareConcurrency.toString());
  }

  // Device memory (if available)
  if ((navigator as any).deviceMemory) {
    fingerprint.push((navigator as any).deviceMemory.toString());
  }

  // User agent
  fingerprint.push(navigator.userAgent);

  // Touch support
  fingerprint.push(
    ('ontouchstart' in window || navigator.maxTouchPoints > 0).toString()
  );

  // Canvas fingerprinting (simple version)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Mek Tycoon', 2, 2);
      fingerprint.push(canvas.toDataURL().slice(0, 50));
    }
  } catch (e) {
    // Canvas fingerprinting failed, skip
  }

  // Combine all fingerprints and hash them
  const combined = fingerprint.join('|');
  const deviceId = simpleHash(combined);

  // Store for future use
  try {
    localStorage.setItem('mek_device_id', deviceId);
  } catch (e) {
    console.warn('[Platform] Failed to store device ID:', e);
  }

  return deviceId;
}

/**
 * Simple hash function for generating device ID
 * Creates a consistent string hash from input
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(36);

  return `mek_${hex}_${timestamp}`;
}

/**
 * Get full user agent string
 */
export function getUserAgent(): string {
  if (typeof window === 'undefined') return 'server';

  return navigator.userAgent || 'unknown';
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'server';

  const userAgent = navigator.userAgent;

  // Detect specific browsers
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';

  return 'Unknown';
}

/**
 * Get operating system name
 */
export function getOSName(): string {
  if (typeof window === 'undefined') return 'server';

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  if (/Windows/.test(platform)) return 'Windows';
  if (/Mac/.test(platform) && !(/iPhone|iPad|iPod/.test(userAgent))) return 'macOS';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Linux/.test(platform)) return 'Linux';

  return 'Unknown';
}

/**
 * Check if device is mobile (any mobile platform)
 */
export function isMobileDevice(): boolean {
  const platform = detectPlatform();
  return platform.startsWith('mobile_');
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  return detectPlatform() === 'mobile_ios';
}

/**
 * Check if device is Android
 */
export function isAndroidDevice(): boolean {
  return detectPlatform() === 'mobile_android';
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform?: PlatformType): string {
  const p = platform || detectPlatform();

  const names: Record<PlatformType, string> = {
    mobile_ios: 'iOS',
    mobile_android: 'Android',
    mobile_web: 'Mobile Web',
    desktop: 'Desktop',
  };

  return names[p];
}

/**
 * Detect if user is in a wallet's WebView (in-app browser)
 * This detects when a wallet app (like Eternl) has opened the dApp in its embedded browser
 *
 * DEPRECATED: Use detectWebViewWallet() from @/lib/walletDetection instead
 * This function is kept for backwards compatibility
 */
export function isWalletWebView(): boolean {
  // Import at runtime to avoid circular dependencies
  const { detectWebViewWallet } = require('./walletDetection');
  const result = detectWebViewWallet();
  return result.isWebView;
}

/**
 * Get the wallet type from user agent if in WebView
 *
 * DEPRECATED: Use detectWebViewWallet() from @/lib/walletDetection instead
 * This function is kept for backwards compatibility
 */
export function getWebViewWalletType(): string | null {
  // Import at runtime to avoid circular dependencies
  const { detectWebViewWallet } = require('./walletDetection');
  const result = detectWebViewWallet();
  return result.walletType || null;
}

/**
 * Get full platform info
 */
export function getPlatformInfo() {
  return {
    platform: detectPlatform(),
    deviceId: generateDeviceId(),
    userAgent: getUserAgent(),
    browser: getBrowserName(),
    os: getOSName(),
    isMobile: isMobileDevice(),
    displayName: getPlatformDisplayName(),
    isWebView: isWalletWebView(),
    webViewWallet: getWebViewWalletType(),
  };
}
