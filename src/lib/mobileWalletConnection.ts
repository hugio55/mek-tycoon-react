/**
 * Mobile Wallet Connection Utilities
 * Pure utility functions for connecting to mobile wallet apps via deep links
 * Extracted from mobileWalletSupport.ts for better separation of concerns
 */

import { type MobileWalletType, getWalletDisplayName } from './walletDetection';

/**
 * Mobile wallet deep link URL schemes
 * Each wallet app registers a custom URL scheme with the OS
 */
export const MOBILE_WALLET_SCHEMES = {
  eternl: 'eternl://',
  flint: 'flint://',
  typhon: 'typhoncip30://',
  vespr: 'vespr://',
  nufi: 'nufi://',
  yoroi: 'yoroi://',
  lace: 'lace://',
} as const;

/**
 * Create a deep link URL for mobile wallet connection
 *
 * @param {MobileWalletType} walletType - The wallet to connect to
 * @param {string} dappUrl - Your dApp's URL (e.g., https://mek.overexposed.io)
 * @param {'connect' | 'sign'} requestType - Type of request (default: 'connect')
 * @returns {string} The deep link URL
 *
 * @example
 * const link = createMobileWalletDeepLink('eternl', 'https://mek.overexposed.io');
 * // Returns: "eternl://dapp?url=https%3A%2F%2Fmek.overexposed.io&action=connect"
 */
export function createMobileWalletDeepLink(
  walletType: MobileWalletType,
  dappUrl: string,
  requestType: 'connect' | 'sign' = 'connect'
): string {
  const scheme = MOBILE_WALLET_SCHEMES[walletType];
  const encodedDappUrl = encodeURIComponent(dappUrl);

  // Each wallet has different URL schemes - these are common patterns
  switch (walletType) {
    case 'eternl':
      return `${scheme}dapp?url=${encodedDappUrl}&action=${requestType}`;

    case 'flint':
      return `${scheme}connect?dapp=${encodedDappUrl}`;

    case 'typhon':
      return `${scheme}?url=${encodedDappUrl}&method=${requestType}`;

    case 'vespr':
      return `${scheme}dapp/connect?url=${encodedDappUrl}`;

    case 'nufi':
      return `${scheme}connect?origin=${encodedDappUrl}`;

    case 'yoroi':
      return `${scheme}connect?url=${encodedDappUrl}`;

    case 'lace':
      return `${scheme}dapp?url=${encodedDappUrl}&action=${requestType}`;

    default:
      return `${scheme}?url=${encodedDappUrl}`;
  }
}

/**
 * Attempt to open a mobile wallet app via deep link
 *
 * @param {MobileWalletType} walletType - The wallet to open
 * @param {string} dappUrl - Your dApp's URL
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<void>} Resolves when wallet is opened, rejects on failure
 *
 * @example
 * try {
 *   await openMobileWallet('eternl', 'https://mek.overexposed.io');
 *   console.log('Wallet opened successfully');
 * } catch (error) {
 *   console.error('Failed to open wallet:', error);
 * }
 */
export function openMobileWallet(
  walletType: MobileWalletType,
  dappUrl: string,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deepLink = createMobileWalletDeepLink(walletType, dappUrl, 'connect');
    const displayName = getWalletDisplayName(walletType);

    console.log('[Mobile Wallet Connection] Opening wallet:', {
      wallet: displayName,
      deepLink,
      timestamp: new Date().toISOString(),
    });

    let appOpened = false;
    let visibilityChanges = 0;
    const startTime = Date.now();

    // Visibility change handler - detects when browser is backgrounded (app opened)
    const visibilityHandler = () => {
      visibilityChanges++;
      const isHidden = document.hidden;
      const elapsed = Date.now() - startTime;

      console.log('[Mobile Wallet Connection] Visibility change:', {
        changeNumber: visibilityChanges,
        isHidden,
        elapsed: `${elapsed}ms`,
      });

      if (isHidden && !appOpened) {
        appOpened = true;
        cleanup();
        console.log('[Mobile Wallet Connection] ✓ Wallet opened successfully');
        resolve();
      }
    };

    // Cleanup function
    const cleanup = () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', visibilityHandler);

    // Create and click hidden link
    try {
      const link = document.createElement('a');
      link.href = deepLink;
      link.style.display = 'none';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('[Mobile Wallet Connection] Deep link triggered successfully');
    } catch (e) {
      cleanup();
      const error = e instanceof Error ? e : new Error('Unknown error');
      console.error('[Mobile Wallet Connection] Failed to trigger deep link:', error);
      reject(new Error(`Failed to open ${displayName} - ${error.message}`));
      return;
    }

    // Poll for visibility changes
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      const elapsed = Date.now() - startTime;
      const isHidden = document.hidden;

      // Log every 10 checks (1 second)
      if (checkCount % 10 === 0) {
        console.log('[Mobile Wallet Connection] Checking status:', {
          check: checkCount,
          elapsed: `${elapsed}ms`,
          isHidden,
          appOpened,
        });
      }

      if (isHidden && !appOpened) {
        appOpened = true;
        cleanup();
        console.log('[Mobile Wallet Connection] ✓ Wallet opened (detected via polling)');
        resolve();
      }
    }, 100);

    // Timeout if app doesn't open
    const timeout = setTimeout(() => {
      if (!appOpened) {
        cleanup();
        const errorMsg = `Could not open ${displayName}. Please make sure it's installed on your device.`;
        console.error('[Mobile Wallet Connection] ✗ Timeout - wallet did not open');
        reject(new Error(errorMsg));
      }
    }, timeoutMs);
  });
}

/**
 * Check if a mobile wallet app is installed
 * Attempts to detect the wallet by trying to open its deep link
 *
 * @param {MobileWalletType} walletType - The wallet to check
 * @param {number} timeoutMs - Timeout in milliseconds (default: 1500)
 * @returns {Promise<boolean>} True if wallet is likely installed
 *
 * @example
 * const isInstalled = await checkMobileWalletInstalled('eternl');
 * if (isInstalled) {
 *   console.log('Eternl is installed');
 * }
 */
export function checkMobileWalletInstalled(
  walletType: MobileWalletType,
  timeoutMs: number = 1500
): Promise<boolean> {
  return new Promise((resolve) => {
    // First check if wallet is available in window.cardano
    if (typeof window !== 'undefined' && window.cardano) {
      const walletKeys = walletType === 'eternl' ? ['eternl', 'ccvault'] : [walletType];
      for (const key of walletKeys) {
        if ((window.cardano as any)[key]) {
          console.log(`[Wallet Detection] Found ${walletType} via window.cardano`);
          resolve(true);
          return;
        }
      }
    }

    // Create test deep link in hidden iframe
    const scheme = MOBILE_WALLET_SCHEMES[walletType];
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.src = scheme;

    let resolved = false;

    // Cleanup function
    const cleanup = () => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch (e) {
        console.warn('[Wallet Detection] Error cleaning up iframe:', e);
      }
      document.removeEventListener('visibilitychange', visibilityHandler);
    };

    // Timeout - wallet likely not installed
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log(`[Wallet Detection] ${walletType} not detected (timeout)`);
        resolve(false);
      }
    }, timeoutMs);

    // Visibility change - wallet opened (installed)
    const visibilityHandler = () => {
      if (document.hidden && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        console.log(`[Wallet Detection] ${walletType} detected (app opened)`);
        resolve(true);
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Try to load the deep link
    try {
      document.body.appendChild(iframe);
    } catch (e) {
      clearTimeout(timeout);
      cleanup();
      console.error('[Wallet Detection] Error testing wallet:', e);
      resolve(false);
    }
  });
}

/**
 * Detect which mobile wallets are actually installed on the device
 *
 * @param {number} timeoutPerWallet - Timeout in ms for each wallet check (default: 1500)
 * @returns {Promise<MobileWalletType[]>} Array of installed wallet types
 *
 * @example
 * const installedWallets = await detectAvailableMobileWallets();
 * console.log('Installed wallets:', installedWallets); // ['eternl', 'typhon']
 */
export async function detectAvailableMobileWallets(
  timeoutPerWallet: number = 1500
): Promise<MobileWalletType[]> {
  const allWallets: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi', 'lace'];
  const installedWallets: MobileWalletType[] = [];

  console.log('[Wallet Detection] Starting detection for:', allWallets);

  // Check each wallet in parallel
  const checks = allWallets.map(async (wallet) => {
    try {
      const isInstalled = await checkMobileWalletInstalled(wallet, timeoutPerWallet);
      if (isInstalled) {
        installedWallets.push(wallet);
        console.log(`[Wallet Detection] ✓ ${wallet} is installed`);
      } else {
        console.log(`[Wallet Detection] ✗ ${wallet} not detected`);
      }
    } catch (error) {
      console.warn(`[Wallet Detection] Error checking ${wallet}:`, error);
    }
  });

  await Promise.all(checks);

  console.log('[Wallet Detection] Detection complete:', installedWallets);
  return installedWallets.sort();
}
