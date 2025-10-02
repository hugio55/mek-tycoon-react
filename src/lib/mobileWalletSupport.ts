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
  lace: 'lace://',
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
export function checkMobileWalletInstalled(
  walletType: MobileWalletType,
  timeoutMs: number = 1500
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isMobileDevice()) {
      console.log(`[Mobile Wallet Detection] Not a mobile device, skipping ${walletType}`);
      resolve(false);
      return;
    }

    // First check if wallet is available in window.cardano (browser extension/WebView)
    if (typeof window !== 'undefined' && (window as any).cardano) {
      const walletKeys = walletType === 'eternl' ? ['eternl', 'ccvault'] : [walletType];
      for (const key of walletKeys) {
        if (((window as any).cardano as any)[key]) {
          console.log(`[Mobile Wallet Detection] Found ${walletType} via window.cardano`);
          resolve(true);
          return;
        }
      }
    }

    // Create a test deep link
    const scheme = MOBILE_WALLET_SCHEMES[walletType];
    const testLink = `${scheme}`;

    console.log(`[Mobile Wallet Detection] Testing ${walletType} with scheme: ${testLink}`);

    // Create a hidden iframe to test the deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.src = testLink;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (e) {
          console.warn(`[Mobile Wallet Detection] Error cleaning up iframe for ${walletType}:`, e);
        }
        document.removeEventListener('visibilitychange', visibilityHandler);
        console.log(`[Mobile Wallet Detection] Timeout for ${walletType} - likely not installed`);
        resolve(false);
      }
    }, timeoutMs);

    // Listen for page visibility change (indicates app opened)
    const visibilityHandler = () => {
      if (document.hidden && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (e) {
          console.warn(`[Mobile Wallet Detection] Error cleaning up iframe for ${walletType}:`, e);
        }
        document.removeEventListener('visibilitychange', visibilityHandler);
        console.log(`[Mobile Wallet Detection] ${walletType} opened successfully`);
        resolve(true);
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Try to load the deep link
    try {
      document.body.appendChild(iframe);
    } catch (e) {
      console.error(`[Mobile Wallet Detection] Error testing ${walletType}:`, e);
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', visibilityHandler);
      resolve(false);
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

    case 'lace':
      // Lace mobile deep link pattern (CIP-30 based)
      return `${scheme}dapp?url=${encodedDappUrl}&action=${requestType}`;

    default:
      return `${scheme}?url=${encodedDappUrl}`;
  }
}

/**
 * Attempt to open a mobile wallet app via deep link
 * @param walletType - The wallet to open
 * @param dappUrl - Your dApp's URL
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when wallet is opened or rejects if it fails
 */
export function openMobileWallet(
  walletType: MobileWalletType,
  dappUrl: string,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isMobileDevice()) {
      reject(new Error('Not a mobile device - wallet apps require mobile iOS or Android'));
      return;
    }

    const deepLink = createMobileWalletDeepLink(walletType, dappUrl, 'connect');
    const displayName = getMobileWalletDisplayName(walletType);

    console.log(`[Mobile Wallet] Opening ${displayName} (${walletType}) with deep link:`, deepLink);

    // Try to open the deep link
    const startTime = Date.now();
    let appOpened = false;

    // Create a hidden link element and click it
    const link = document.createElement('a');
    link.href = deepLink;
    link.style.display = 'none';
    link.rel = 'noopener noreferrer';

    // Listen for visibility change to detect if app opened
    const visibilityHandler = () => {
      if (document.hidden && !appOpened) {
        appOpened = true;
        console.log(`[Mobile Wallet] ${displayName} opened successfully`);
        clearInterval(checkInterval);
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', visibilityHandler);
        resolve();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    try {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(`[Mobile Wallet] Error opening ${displayName}:`, e);
      document.removeEventListener('visibilitychange', visibilityHandler);
      reject(new Error(`Failed to open ${displayName} - ${e instanceof Error ? e.message : 'unknown error'}`));
      return;
    }

    // Check if app opened by detecting if browser was backgrounded
    const checkInterval = setInterval(() => {
      if (document.hidden && !appOpened) {
        appOpened = true;
        clearInterval(checkInterval);
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', visibilityHandler);
        console.log(`[Mobile Wallet] ${displayName} opened (detected via interval check)`);
        resolve();
      } else if (Date.now() - startTime > timeoutMs / 2 && !document.hidden) {
        // If halfway through timeout and still visible, likely app didn't open
        console.warn(`[Mobile Wallet] ${displayName} may not be opening - page still visible`);
      }
    }, 100);

    // Timeout after specified time if app didn't open
    const timeout = setTimeout(() => {
      if (!appOpened) {
        clearInterval(checkInterval);
        document.removeEventListener('visibilitychange', visibilityHandler);
        const errorMsg = `Could not open ${displayName} wallet app. Please make sure it's installed on your device.`;
        console.error(`[Mobile Wallet] ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    }, timeoutMs);
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
    lace: 'Lace',
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
  const allWallets: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi', 'lace'];

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
export async function detectAvailableMobileWallets(
  timeoutPerWallet: number = 1500
): Promise<MobileWalletType[]> {
  if (!isMobileDevice()) {
    console.log('[Mobile Wallet Detection] Not a mobile device');
    return [];
  }

  const allWallets: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi', 'lace'];
  const installedWallets: MobileWalletType[] = [];

  console.log('[Mobile Wallet Detection] Starting detection for:', allWallets);

  // Check each wallet in parallel
  const checks = allWallets.map(async (wallet) => {
    try {
      const isInstalled = await checkMobileWalletInstalled(wallet, timeoutPerWallet);
      if (isInstalled) {
        installedWallets.push(wallet);
        console.log(`[Mobile Wallet Detection] ✓ ${wallet} is installed`);
      } else {
        console.log(`[Mobile Wallet Detection] ✗ ${wallet} not detected`);
      }
    } catch (error) {
      console.warn(`[Mobile Wallet Detection] Error checking ${wallet}:`, error);
    }
  });

  await Promise.all(checks);

  console.log('[Mobile Wallet Detection] Detection complete. Found installed wallets:', installedWallets);
  return installedWallets.sort(); // Sort for consistent ordering
}
