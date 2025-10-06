/**
 * Wallet Visibility Synchronization Hook
 *
 * Handles state synchronization when user switches between dApp and wallet app
 * on mobile devices, particularly in WebView scenarios.
 */

import { useEffect, useRef, useCallback } from 'react';

export interface VisibilityChangeOptions {
  onBecameVisible?: () => void;
  onBecameHidden?: () => void;
  onReturnFromWallet?: () => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useWalletVisibilitySync(options: VisibilityChangeOptions = {}) {
  const {
    onBecameVisible,
    onBecameHidden,
    onReturnFromWallet,
    debounceMs = 500,
    enabled = true
  } = options;

  const lastVisibilityRef = useRef<boolean>(true);
  const hiddenTimeRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleVisibilityChange = useCallback(() => {
    if (typeof document === 'undefined') return;

    const isVisible = !document.hidden;
    const wasHidden = lastVisibilityRef.current === false;

    console.log('[Visibility Sync] Visibility changed:', {
      from: lastVisibilityRef.current ? 'visible' : 'hidden',
      to: isVisible ? 'visible' : 'hidden',
      timestamp: new Date().toISOString()
    });

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the visibility change to avoid rapid fire events
    debounceTimerRef.current = setTimeout(() => {
      if (isVisible && wasHidden) {
        // Page became visible after being hidden
        const hiddenDuration = hiddenTimeRef.current
          ? Date.now() - hiddenTimeRef.current
          : 0;

        console.log('[Visibility Sync] Page became visible after', hiddenDuration, 'ms');

        // If hidden for more than 1 second, likely user was in wallet app
        if (hiddenDuration > 1000 && onReturnFromWallet) {
          console.log('[Visibility Sync] Likely returned from wallet app - triggering callback');
          onReturnFromWallet();
        }

        if (onBecameVisible) {
          onBecameVisible();
        }

        hiddenTimeRef.current = null;
      } else if (!isVisible && !wasHidden) {
        // Page became hidden
        hiddenTimeRef.current = Date.now();
        console.log('[Visibility Sync] Page became hidden at', new Date().toISOString());

        if (onBecameHidden) {
          onBecameHidden();
        }
      }

      lastVisibilityRef.current = isVisible;
    }, debounceMs);
  }, [onBecameVisible, onBecameHidden, onReturnFromWallet, debounceMs]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    console.log('[Visibility Sync] Setting up visibility change listener');

    // Set initial state
    lastVisibilityRef.current = !document.hidden;

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[Visibility Sync] Cleaning up visibility change listener');
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, handleVisibilityChange]);

  return {
    isVisible: !document?.hidden,
    lastVisibility: lastVisibilityRef.current
  };
}

/**
 * Hook specifically for monitoring wallet connection session during visibility changes
 */
export function useWalletSessionMonitor(
  walletConnected: boolean,
  walletAddress: string | null,
  onSessionCheck: () => Promise<void>
) {
  const sessionCheckInProgressRef = useRef(false);

  const checkSession = useCallback(async () => {
    if (sessionCheckInProgressRef.current) {
      console.log('[Session Monitor] Session check already in progress, skipping');
      return;
    }

    if (!walletConnected || !walletAddress) {
      console.log('[Session Monitor] Not connected, skipping session check');
      return;
    }

    try {
      sessionCheckInProgressRef.current = true;
      console.log('[Session Monitor] Checking wallet session after visibility change');

      await onSessionCheck();

      console.log('[Session Monitor] Session check complete');
    } catch (error) {
      console.error('[Session Monitor] Session check failed:', error);
    } finally {
      sessionCheckInProgressRef.current = false;
    }
  }, [walletConnected, walletAddress, onSessionCheck]);

  useWalletVisibilitySync({
    onReturnFromWallet: checkSession,
    enabled: walletConnected && walletAddress !== null
  });
}
