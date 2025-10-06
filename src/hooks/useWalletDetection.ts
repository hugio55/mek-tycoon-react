/**
 * Wallet Detection Hooks
 * Custom React hooks for detecting wallet environments and platforms
 * Provides composable, testable hooks for wallet-related detection logic
 */

import { useState, useEffect, useMemo } from 'react';
import { detectPlatform, type PlatformType } from '@/lib/platformDetection';
import {
  detectWebViewWallet,
  type WalletWebViewInfo,
  type MobileWalletType
} from '@/lib/walletDetection';

/**
 * Hook to detect if user is in a wallet's WebView
 * Detects when a wallet app has opened the dApp in its embedded browser
 *
 * @returns {WalletWebViewInfo} Object with isWebView boolean and optional walletType
 *
 * @example
 * const { isWebView, walletType } = useWalletWebView();
 * if (isWebView) {
 *   console.log(`Running in ${walletType} WebView`);
 * }
 */
export function useWalletWebView(): WalletWebViewInfo {
  const [webViewInfo, setWebViewInfo] = useState<WalletWebViewInfo>({ isWebView: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect WebView on mount
    const info = detectWebViewWallet();
    setWebViewInfo(info);

    // Also listen for delayed wallet injection
    const checkInterval = setInterval(() => {
      const updatedInfo = detectWebViewWallet();
      if (updatedInfo.isWebView !== info.isWebView) {
        setWebViewInfo(updatedInfo);
        clearInterval(checkInterval);
      }
    }, 100);

    // Stop checking after 2 seconds
    const timeout = setTimeout(() => clearInterval(checkInterval), 2000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  return webViewInfo;
}

/**
 * Hook to detect the user's platform
 * Returns platform type (desktop, mobile_ios, mobile_android, mobile_web)
 *
 * @returns {PlatformType} The detected platform type
 *
 * @example
 * const platform = usePlatform();
 * if (platform === 'mobile_ios') {
 *   // Show iOS-specific UI
 * }
 */
export function usePlatform(): PlatformType {
  return useMemo(() => detectPlatform(), []);
}

/**
 * Hook to check if user is on a mobile device
 * Convenience hook that wraps platform detection
 *
 * @returns {boolean} True if on any mobile platform
 *
 * @example
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileView /> : <DesktopView />;
 */
export function useIsMobile(): boolean {
  const platform = usePlatform();
  return platform.startsWith('mobile_');
}

/**
 * Hook to check if user is on iOS
 *
 * @returns {boolean} True if on iOS (native app or mobile web)
 */
export function useIsIOS(): boolean {
  const platform = usePlatform();
  return platform === 'mobile_ios';
}

/**
 * Hook to check if user is on Android
 *
 * @returns {boolean} True if on Android (native app or mobile web)
 */
export function useIsAndroid(): boolean {
  const platform = usePlatform();
  return platform === 'mobile_android';
}

/**
 * Hook to combine platform and WebView detection
 * Provides complete environment information in one hook
 *
 * @returns Object with platform info, mobile status, and WebView detection
 *
 * @example
 * const { platform, isMobile, isWebView, walletType } = useWalletEnvironment();
 * if (isWebView && walletType) {
 *   console.log(`Auto-connecting to ${walletType} in WebView`);
 * }
 */
export function useWalletEnvironment() {
  const platform = usePlatform();
  const webViewInfo = useWalletWebView();

  return {
    platform,
    isMobile: platform.startsWith('mobile_'),
    isIOS: platform === 'mobile_ios',
    isAndroid: platform === 'mobile_android',
    isDesktop: platform === 'desktop',
    ...webViewInfo,
  };
}
