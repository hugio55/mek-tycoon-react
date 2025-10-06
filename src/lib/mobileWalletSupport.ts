/**
 * Mobile Wallet Support for Cardano dApps
 * Provides deep linking and mobile wallet detection for Eternl, Flint, Typhon, Vespr, etc.
 *
 * DEPRECATED: This module is being phased out in favor of modular alternatives:
 * - @/lib/walletDetection - Core wallet detection utilities
 * - @/lib/mobileWalletConnection - Connection and deep linking utilities
 * - @/hooks/useWalletDetection - React hooks for wallet detection
 * - @/hooks/useMobileWallets - React hooks for mobile wallet management
 *
 * Functions are preserved for backwards compatibility but delegate to new modules.
 */

// Re-export from new modules for backwards compatibility
export { MOBILE_WALLET_SCHEMES } from './mobileWalletConnection';
export type { MobileWalletType } from './walletDetection';

// WalletConnect project configuration
// NOTE: You'll need to create a free project at https://cloud.walletconnect.com/
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

/**
 * Detect if user is on mobile device
 * DEPRECATED: Use isMobileDevice() from @/lib/platformDetection instead
 */
export function isMobileDevice(): boolean {
  const { isMobileDevice: isMobile } = require('./platformDetection');
  return isMobile();
}

/**
 * Detect if user is on iOS
 * DEPRECATED: Use isIOSDevice() from @/lib/platformDetection instead
 */
export function isIOS(): boolean {
  const { isIOSDevice } = require('./platformDetection');
  return isIOSDevice();
}

/**
 * Detect if user is on Android
 * DEPRECATED: Use isAndroidDevice() from @/lib/platformDetection instead
 */
export function isAndroid(): boolean {
  const { isAndroidDevice } = require('./platformDetection');
  return isAndroidDevice();
}

/**
 * Detect if running inside a wallet's WebView (in-app browser)
 * DEPRECATED: Use detectWebViewWallet() from @/lib/walletDetection instead
 */
export function isWalletWebView(): { isWebView: boolean; walletType?: string } {
  const { detectWebViewWallet } = require('./walletDetection');
  return detectWebViewWallet();
}

/**
 * Check if a mobile wallet app is likely installed
 * DEPRECATED: Use checkMobileWalletInstalled() from @/lib/mobileWalletConnection instead
 */
export function checkMobileWalletInstalled(
  walletType: MobileWalletType,
  timeoutMs: number = 1500
): Promise<boolean> {
  const { checkMobileWalletInstalled: checkInstalled } = require('./mobileWalletConnection');
  return checkInstalled(walletType, timeoutMs);
}

/**
 * Create a deep link URL for mobile wallet connection
 * DEPRECATED: Use createMobileWalletDeepLink() from @/lib/mobileWalletConnection instead
 */
export function createMobileWalletDeepLink(
  walletType: MobileWalletType,
  dappUrl: string,
  requestType: 'connect' | 'sign' = 'connect'
): string {
  const { createMobileWalletDeepLink: createDeepLink } = require('./mobileWalletConnection');
  return createDeepLink(walletType, dappUrl, requestType);
}

/**
 * Attempt to open a mobile wallet app via deep link
 * DEPRECATED: Use openMobileWallet() from @/lib/mobileWalletConnection instead
 */
export function openMobileWallet(
  walletType: MobileWalletType,
  dappUrl: string,
  timeoutMs: number = 5000
): Promise<void> {
  const { openMobileWallet: openWallet } = require('./mobileWalletConnection');
  return openWallet(walletType, dappUrl, timeoutMs);
}

/**
 * Generate a connection request payload for mobile wallets
 * This creates a connection request that can be encoded in a QR code or deep link
 */
export function generateMobileConnectionRequest(dappUrl: string, nonce: string) {
  return {
    type: 'connect',
    dappUrl,
    nonce,
    timestamp: Date.now(),
  };
}

/**
 * Wait for mobile wallet to return data after deep link redirect
 * This sets up a listener for URL parameters or postMessage events
 */
export function waitForMobileWalletResponse(timeoutMs: number = 60000): Promise<any> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    // Listen for URL hash changes (some wallets return via URL)
    const hashChangeHandler = () => {
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const response = params.get('response');
        if (response) {
          resolved = true;
          try {
            const data = JSON.parse(decodeURIComponent(response));
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid response from wallet'));
          }
        }
      }
    };

    // Listen for postMessage events (some wallets use this)
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'cardano_wallet_response') {
        resolved = true;
        resolve(event.data.payload);
      }
    };

    window.addEventListener('hashchange', hashChangeHandler);
    window.addEventListener('message', messageHandler);

    // Timeout
    const timeout = setTimeout(() => {
      if (!resolved) {
        window.removeEventListener('hashchange', hashChangeHandler);
        window.removeEventListener('message', messageHandler);
        reject(new Error('Timeout waiting for wallet response'));
      }
    }, timeoutMs);

    // Cleanup
    const cleanup = () => {
      window.removeEventListener('hashchange', hashChangeHandler);
      window.removeEventListener('message', messageHandler);
      clearTimeout(timeout);
    };

    // Store cleanup for later
    (window as any).__mobileWalletCleanup = cleanup;
  });
}

/**
 * Create a fallback QR code data URL for mobile wallets
 * When deep link fails, show QR code that user can scan
 */
export function createWalletConnectQRData(dappUrl: string, nonce: string): string {
  const connectionRequest = generateMobileConnectionRequest(dappUrl, nonce);
  return JSON.stringify(connectionRequest);
}

/**
 * Get user-friendly wallet names
 * DEPRECATED: Use getWalletDisplayName() from @/lib/walletDetection instead
 */
export function getMobileWalletDisplayName(walletType: MobileWalletType): string {
  const { getWalletDisplayName } = require('./walletDetection');
  return getWalletDisplayName(walletType);
}

/**
 * Get available mobile wallets based on platform
 * DEPRECATED: Use getSupportedWalletTypes() from @/lib/walletDetection instead
 * NOTE: This returns ALL possible wallets. Use detectAvailableMobileWallets() to get only installed wallets.
 */
export function getAvailableMobileWallets(): MobileWalletType[] {
  if (!isMobileDevice()) return [];
  const { getSupportedWalletTypes } = require('./walletDetection');
  return getSupportedWalletTypes();
}

/**
 * Detect which mobile wallets are actually installed on the device
 * DEPRECATED: Use detectAvailableMobileWallets() from @/lib/mobileWalletConnection instead
 */
export async function detectAvailableMobileWallets(
  timeoutPerWallet: number = 1500
): Promise<MobileWalletType[]> {
  const { detectAvailableMobileWallets: detectWallets } = require('./mobileWalletConnection');
  return detectWallets(timeoutPerWallet);
}
