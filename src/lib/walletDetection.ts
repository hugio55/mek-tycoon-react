/**
 * Wallet Detection Utilities
 * Core utilities for detecting wallet environments (WebView vs browser)
 * Consolidates wallet detection logic from platformDetection.ts and mobileWalletSupport.ts
 */

export type MobileWalletType = 'eternl' | 'flint' | 'typhon' | 'vespr' | 'nufi' | 'yoroi' | 'lace';

export interface WalletWebViewInfo {
  isWebView: boolean;
  walletType?: MobileWalletType;
}

/**
 * Detect if user is in a wallet's WebView (in-app browser)
 * When in WebView, window.cardano should already be available
 *
 * This is the single source of truth for WebView detection - used by both
 * platform detection and mobile wallet support modules.
 *
 * @returns {WalletWebViewInfo} Object with isWebView boolean and optional walletType
 *
 * @example
 * const { isWebView, walletType } = detectWebViewWallet();
 * if (isWebView && walletType === 'eternl') {
 *   // Auto-connect to Eternl
 * }
 */
export function detectWebViewWallet(): WalletWebViewInfo {
  if (typeof window === 'undefined') {
    return { isWebView: false };
  }

  const userAgent = navigator.userAgent || '';
  const userAgentLower = userAgent.toLowerCase();

  console.log('[Wallet Detection] Checking WebView:', {
    userAgent: userAgent.substring(0, 100),
    hasCardano: typeof window.cardano !== 'undefined',
  });

  // FIRST: Check if user is on mobile/tablet (WebViews only exist on mobile)
  const isMobileUA = /android|iphone|ipad|ipod|mobile|webos|blackberry|iemobile|opera mini/i.test(userAgentLower);

  if (!isMobileUA) {
    console.log('[Wallet Detection] ✗ Desktop browser detected - not a WebView');
    return { isWebView: false };
  }

  console.log('[Wallet Detection] ✓ Mobile device detected, checking for WebView...');

  // Check for wallet-specific WebView indicators in user agent
  const walletPatterns: { pattern: string; type: MobileWalletType }[] = [
    { pattern: 'eternl', type: 'eternl' },
    { pattern: 'flint', type: 'flint' },
    { pattern: 'typhon', type: 'typhon' },
    { pattern: 'vespr', type: 'vespr' },
    { pattern: 'nufi', type: 'nufi' },
    { pattern: 'yoroi', type: 'yoroi' },
    { pattern: 'lace', type: 'lace' },
  ];

  // Check user agent for wallet identifiers
  for (const { pattern, type } of walletPatterns) {
    if (userAgentLower.includes(pattern)) {
      console.log(`[Wallet Detection] ✓ ${type} WebView detected via user agent`);
      return { isWebView: true, walletType: type };
    }
  }

  // Check if window.cardano exists (wallet injected CIP-30 API into WebView)
  // NOTE: Only check this on mobile - desktop extensions also inject window.cardano!
  if (typeof window.cardano === 'object' && window.cardano !== null) {
    console.log('[Wallet Detection] window.cardano found on mobile, checking wallet types...');

    // Map of cardano API properties to wallet types
    const cardanoApiMap: { key: string; type: MobileWalletType }[] = [
      { key: 'eternl', type: 'eternl' },
      { key: 'ccvault', type: 'eternl' }, // Eternl's old name
      { key: 'flint', type: 'flint' },
      { key: 'typhon', type: 'typhon' },
      { key: 'vespr', type: 'vespr' },
      { key: 'nufi', type: 'nufi' },
      { key: 'yoroi', type: 'yoroi' },
      { key: 'lace', type: 'lace' },
    ];

    // Check which wallet API is available
    for (const { key, type } of cardanoApiMap) {
      if ((window.cardano as any)[key]) {
        console.log(`[Wallet Detection] ✓ ${type} WebView detected via window.cardano.${key}`);
        return { isWebView: true, walletType: type };
      }
    }

    // Check for generic WebView indicators if cardano exists but no specific wallet detected
    const isGenericWebView =
      userAgentLower.includes('wv') || // Android WebView
      (userAgentLower.includes('version/') && userAgentLower.includes('mobile')); // iOS WebView

    if (isGenericWebView) {
      console.log('[Wallet Detection] ✓ Generic WebView detected with window.cardano');
      return { isWebView: true }; // WebView but unknown wallet type
    }

    console.log('[Wallet Detection] window.cardano exists but no WebView indicators');
  }

  console.log('[Wallet Detection] ✗ Not in a wallet WebView');
  return { isWebView: false };
}

/**
 * Get user-friendly wallet display name
 *
 * @param {MobileWalletType} walletType - The wallet type identifier
 * @returns {string} Human-readable wallet name
 */
export function getWalletDisplayName(walletType: MobileWalletType): string {
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
 * Check if a wallet type is valid
 *
 * @param {string} walletType - The wallet type to validate
 * @returns {boolean} True if valid wallet type
 */
export function isValidWalletType(walletType: string): walletType is MobileWalletType {
  const validTypes: MobileWalletType[] = ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi', 'lace'];
  return validTypes.includes(walletType as MobileWalletType);
}

/**
 * Get all supported wallet types
 *
 * @returns {MobileWalletType[]} Array of all supported wallet types
 */
export function getSupportedWalletTypes(): MobileWalletType[] {
  return ['eternl', 'flint', 'typhon', 'vespr', 'nufi', 'yoroi', 'lace'];
}
