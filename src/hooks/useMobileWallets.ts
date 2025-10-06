/**
 * Mobile Wallet Hooks
 * Custom React hooks for detecting and managing mobile wallet apps
 * Provides composable hooks for mobile wallet detection and deep linking
 */

import { useState, useEffect, useCallback } from 'react';
import {
  detectAvailableMobileWallets,
  openMobileWallet,
  type MobileWalletType,
} from '@/lib/mobileWalletConnection';
import { useIsMobile } from './useWalletDetection';

/**
 * Hook to detect which mobile wallets are installed
 * Automatically runs detection on mount for mobile devices
 *
 * @param {number} timeoutPerWallet - Timeout in ms for each wallet check (default: 1500)
 * @returns Object with available wallets, loading state, and error
 *
 * @example
 * const { wallets, isDetecting, error } = useMobileWallets();
 * if (isDetecting) return <LoadingSpinner />;
 * return <WalletList wallets={wallets} />;
 */
export function useMobileWallets(timeoutPerWallet: number = 1500) {
  const [wallets, setWallets] = useState<MobileWalletType[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsDetecting(false);
      return;
    }

    let mounted = true;

    const detectWallets = async () => {
      try {
        setIsDetecting(true);
        setError(null);

        const detected = await detectAvailableMobileWallets(timeoutPerWallet);

        if (mounted) {
          setWallets(detected);
          setIsDetecting(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to detect wallets'));
          setIsDetecting(false);
        }
      }
    };

    detectWallets();

    return () => {
      mounted = false;
    };
  }, [isMobile, timeoutPerWallet]);

  return {
    wallets,
    isDetecting,
    error,
    hasWallets: wallets.length > 0,
  };
}

/**
 * Hook for opening a mobile wallet via deep link
 * Provides a callback function with loading and error states
 *
 * @param {string} dappUrl - The dApp URL to pass to the wallet
 * @param {number} timeout - Timeout in ms (default: 5000)
 * @returns Object with openWallet function, loading state, and error
 *
 * @example
 * const { openWallet, isOpening, error } = useWalletDeepLink('https://mek.overexposed.io');
 * <button onClick={() => openWallet('eternl')} disabled={isOpening}>
 *   {isOpening ? 'Opening...' : 'Connect Eternl'}
 * </button>
 */
export function useWalletDeepLink(dappUrl: string, timeout: number = 5000) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<MobileWalletType | null>(null);

  const openWallet = useCallback(
    async (walletType: MobileWalletType) => {
      setIsOpening(true);
      setError(null);
      setSelectedWallet(walletType);

      try {
        await openMobileWallet(walletType, dappUrl, timeout);
        console.log(`[useWalletDeepLink] Successfully opened ${walletType}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to open ${walletType}`);
        setError(error);
        console.error(`[useWalletDeepLink] Error opening ${walletType}:`, error);
      } finally {
        setIsOpening(false);
        setSelectedWallet(null);
      }
    },
    [dappUrl, timeout]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsOpening(false);
    setSelectedWallet(null);
  }, []);

  return {
    openWallet,
    isOpening,
    error,
    selectedWallet,
    reset,
  };
}

/**
 * Combined hook for mobile wallet management
 * Combines detection and deep linking in a single hook
 *
 * @param {string} dappUrl - The dApp URL to pass to wallets
 * @param {Object} options - Optional configuration
 * @returns Object with wallet list, connection functions, and states
 *
 * @example
 * const { wallets, connectWallet, isDetecting, isConnecting } = useMobileWalletManager('https://mek.overexposed.io');
 * wallets.map(wallet => (
 *   <button onClick={() => connectWallet(wallet)} disabled={isConnecting}>
 *     Connect {wallet}
 *   </button>
 * ));
 */
export function useMobileWalletManager(
  dappUrl: string,
  options?: {
    detectionTimeout?: number;
    connectionTimeout?: number;
    onWalletOpened?: (wallet: MobileWalletType) => void;
    onError?: (error: Error) => void;
  }
) {
  const {
    wallets,
    isDetecting,
    error: detectionError,
    hasWallets,
  } = useMobileWallets(options?.detectionTimeout);

  const {
    openWallet,
    isOpening,
    error: connectionError,
    selectedWallet,
    reset,
  } = useWalletDeepLink(dappUrl, options?.connectionTimeout);

  const connectWallet = useCallback(
    async (walletType: MobileWalletType) => {
      try {
        await openWallet(walletType);
        options?.onWalletOpened?.(walletType);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Connection failed');
        options?.onError?.(error);
      }
    },
    [openWallet, options]
  );

  return {
    // Wallet list
    wallets,
    hasWallets,

    // States
    isDetecting,
    isConnecting: isOpening,
    selectedWallet,

    // Errors
    detectionError,
    connectionError,
    error: detectionError || connectionError,

    // Actions
    connectWallet,
    reset,
  };
}
