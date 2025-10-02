/**
 * Mobile Wallet Support for Cardano dApps
 * Provides deep linking and mobile wallet detection for Eternl, Flint, Typhon, Vespr, etc.
 */

// Mobile wallet deep link schemas
export const MOBILE_WALLET_SCHEMES = {
  eternl: 'eternl://',
  flint: 'flint://',
  typhon: 'typhoncip30://',
  vespr: 'vespr://',
  nufi: 'nufi://',
  yoroi: 'yoroi://',
} as const;

export type MobileWalletType = keyof typeof MOBILE_WALLET_SCHEMES;

// WalletConnect project configuration
// NOTE: You'll need to create a free project at https://cloud.walletconnect.com/
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for mobile user agents
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent.toLowerCase());
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor;
  return /android/i.test(userAgent);
}

/**
 * Check if a mobile wallet app is likely installed
 * This attempts to detect the wallet by trying to open its deep link
 * and checking if the browser/OS responds successfully
 */
export function checkMobileWalletInstalled(walletType: MobileWalletType): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isMobileDevice()) {
      resolve(false);
      return;
    }

    // Create a test deep link
    const scheme = MOBILE_WALLET_SCHEMES[walletType];
    const testLink = `${scheme}`;

    // Create a hidden iframe to test the deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = testLink;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        document.body.removeChild(iframe);
        // If we timeout, the app likely isn't installed
        resolve(false);
      }
    }, 1000);

    // Listen for page visibility change (indicates app opened)
    const visibilityHandler = () => {
      if (document.hidden && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        document.removeEventListener('visibilitychange', visibilityHandler);
        // Page went to background, app likely opened
        resolve(true);
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Try to load the deep link
    document.body.appendChild(iframe);

    // Also check if we can detect the wallet through window.cardano (some mobile wallets inject this)
    if (typeof window !== 'undefined' && window.cardano) {
      const walletKey = walletType === 'eternl' ? ['eternl', 'ccvault'] : [walletType];
      for (const key of walletKey) {
        if ((window.cardano as any)[key]) {
          resolved = true;
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          document.removeEventListener('visibilitychange', visibilityHandler);
          resolve(true);
          return;
        }
      }
    }
  });
}

/**
 * Create a deep link URL for mobile wallet connection
 * @param walletType - The wallet to connect to (eternl, flint, etc.)
 * @param dappUrl - Your dApp's URL (e.g., https://mek.overexposed.io)
 * @param requestType - Type of request ('connect' or 'sign')
 */
export function createMobileWalletDeepLink(
  walletType: MobileWalletType,
  dappUrl: string,
  requestType: 'connect' | 'sign' = 'connect'
): string {
  const scheme = MOBILE_WALLET_SCHEMES[walletType];

  // Encode the dApp URL for the deep link
  const encodedDappUrl = encodeURIComponent(dappUrl);

  // Create the deep link based on wallet type
  // Each wallet has different URL schemes, these are common patterns
  switch (walletType) {
    case 'eternl':
      // Eternl mobile deep link pattern
      return `${scheme}dapp?url=${encodedDappUrl}&action=${requestType}`;

    case 'flint':
      // Flint mobile deep link pattern
      return `${scheme}connect?dapp=${encodedDappUrl}`;

    case 'typhon':
      // Typhon uses CIP-30 protocol
      return `${scheme}?url=${encodedDappUrl}&method=${requestType}`;

    case 'vespr':
      // Vespr deep link pattern
      return `${scheme}dapp/connect?url=${encodedDappUrl}`;

    case 'nufi':
      // NuFi deep link pattern
      return `${scheme}connect?origin=${encodedDappUrl}`;

    case 'yoroi':
      // Yoroi deep link pattern
      return `${scheme}connect?url=${encodedDappUrl}`;

    default:
      return `${scheme}?url=${encodedDappUrl}`;
  }
}

/**
 * Attempt to open a mobile wallet app via deep link
 * @param walletType - The wallet to open
 * @param dappUrl - Your dApp's URL
 * @returns Promise that resolves when wallet is opened or rejects if it fails
 */
export function openMobileWallet(
  walletType: MobileWalletType,
  dappUrl: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isMobileDevice()) {
      reject(new Error('Not a mobile device'));
      return;
    }

    const deepLink = createMobileWalletDeepLink(walletType, dappUrl, 'connect');

    console.log(`[Mobile Wallet] Opening ${walletType} with deep link:`, deepLink);

    // Try to open the deep link
    const startTime = Date.now();

    // Create a hidden link element and click it
    const link = document.createElement('a');
    link.href = deepLink;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Check if app opened by detecting if browser was backgrounded
    const checkInterval = setInterval(() => {
      if (document.hidden || Date.now() - startTime > 2000) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);

    // Timeout after 3 seconds if app didn't open
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error(`Could not open ${walletType} wallet app. Make sure it's installed.`));
    }, 3000);
  });
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
 */
export function getMobileWalletDisplayName(walletType: MobileWalletType): string {
  const names: Record<MobileWalletType, string> = {
    eternl: 'Eternl',
    flint: 'Flint',
    typhon: 'Typhon',
    vespr: 'Vespr',
    nufi: 'NuFi',
    yoroi: 'Yoroi',
  };
  return names[walletType];
}

/**
 * Get available mobile wallets based on platform
 * NOTE: This returns ALL possible wallets. Use detectAvailableMobileWallets()
 * to get only installed wallets.
 */
export function getAvailableMobileWallets(): MobileWalletType[] {
  if (!isMobileDevice()) return [];

  // All wallets available on both iOS and Android
  const allWallets: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi'];

  // Could filter by platform if needed
  if (isIOS()) {
    // iOS-specific filtering if needed
    return allWallets;
  } else if (isAndroid()) {
    // Android-specific filtering if needed
    return allWallets;
  }

  return allWallets;
}

/**
 * Detect which mobile wallets are actually installed on the device
 * This is more reliable than getAvailableMobileWallets() but takes longer
 * as it tests each wallet
 */
export async function detectAvailableMobileWallets(): Promise<MobileWalletType[]> {
  if (!isMobileDevice()) return [];

  const allWallets: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi'];
  const installedWallets: MobileWalletType[] = [];

  // Check each wallet in parallel
  const checks = allWallets.map(async (wallet) => {
    try {
      const isInstalled = await checkMobileWalletInstalled(wallet);
      if (isInstalled) {
        installedWallets.push(wallet);
      }
    } catch (error) {
      console.warn(`Error checking ${wallet}:`, error);
    }
  });

  await Promise.all(checks);

  console.log('[Mobile Wallet Detection] Found installed wallets:', installedWallets);
  return installedWallets;
}
