/**
 * Wallet Module - Unified Exports
 * Central export point for all wallet-related utilities and types
 *
 * This module provides a clean, modular API for wallet functionality:
 * - Detection: Identify platforms, WebViews, and mobile devices
 * - Connection: Connect to mobile wallets via deep links
 * - Hooks: React hooks for wallet detection and management
 */

// Core wallet detection utilities
export {
  detectWebViewWallet,
  getWalletDisplayName,
  isValidWalletType,
  getSupportedWalletTypes,
  type MobileWalletType,
  type WalletWebViewInfo,
} from '../walletDetection';

// Mobile wallet connection utilities
export {
  MOBILE_WALLET_SCHEMES,
  createMobileWalletDeepLink,
  openMobileWallet,
  checkMobileWalletInstalled,
  detectAvailableMobileWallets,
} from '../mobileWalletConnection';

// Platform detection utilities
export {
  detectPlatform,
  generateDeviceId,
  getUserAgent,
  getBrowserName,
  getOSName,
  isMobileDevice,
  isIOSDevice,
  isAndroidDevice,
  getPlatformDisplayName,
  getPlatformInfo,
  type PlatformType,
} from '../platformDetection';

// React hooks - recommended approach for React components
export {
  useWalletWebView,
  usePlatform,
  useIsMobile,
  useIsIOS,
  useIsAndroid,
  useWalletEnvironment,
} from '../../hooks/useWalletDetection';

export {
  useMobileWallets,
  useWalletDeepLink,
  useMobileWalletManager,
} from '../../hooks/useMobileWallets';

/**
 * Usage Examples:
 *
 * // In React components - use hooks:
 * import { useWalletEnvironment, useMobileWalletManager } from '@/lib/wallet';
 *
 * function MyComponent() {
 *   const { isWebView, walletType, isMobile } = useWalletEnvironment();
 *   const { wallets, connectWallet, isConnecting } = useMobileWalletManager('https://mek.overexposed.io');
 *
 *   if (isWebView) {
 *     // Auto-connect to WebView wallet
 *     return <div>Connected to {walletType}</div>;
 *   }
 *
 *   if (isMobile && wallets.length > 0) {
 *     return (
 *       <div>
 *         {wallets.map(wallet => (
 *           <button key={wallet} onClick={() => connectWallet(wallet)}>
 *             Connect {wallet}
 *           </button>
 *         ))}
 *       </div>
 *     );
 *   }
 *
 *   return <div>Desktop browser</div>;
 * }
 *
 * // In utility functions - use pure functions:
 * import { detectWebViewWallet, openMobileWallet } from '@/lib/wallet';
 *
 * const { isWebView, walletType } = detectWebViewWallet();
 * if (isWebView && walletType) {
 *   console.log(`Running in ${walletType} WebView`);
 * }
 *
 * await openMobileWallet('eternl', 'https://mek.overexposed.io');
 */
