/**
 * Secure Wallet Connection Hook
 * Implements complete security-hardened wallet connection flow
 * Includes origin validation, async encryption, retry logic, and security status tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  ConnectionState,
  createConnectionState,
  generateSecureNonce,
  verifySignatureWithRetry,
  saveSessionSecurely,
  loadSessionSecurely,
  getUserFriendlyErrorMessage,
  generateSessionId,
  checkSecuritySupport,
} from '@/lib/secureWalletConnection';
import { clearWalletSession } from '@/lib/walletSessionManager';

interface SecureWalletConnectionOptions {
  maxRetries?: number;
  onConnectionStart?: () => void;
  onConnectionSuccess?: (session: any) => void;
  onConnectionError?: (error: Error) => void;
  onSecurityStateChange?: (state: ConnectionState) => void;
}

export function useSecureWalletConnection(options: SecureWalletConnectionOptions = {}) {
  const { maxRetries = 2, onConnectionStart, onConnectionSuccess, onConnectionError, onSecurityStateChange } = options;

  // Convex mutations and actions
  const generateNonceMutation = useMutation(api.walletAuthentication.generateNonce);
  const verifySignatureAction = useAction(api.walletAuthentication.verifySignature);

  // State
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(createConnectionState(maxRetries));
  const [error, setError] = useState<Error | null>(null);
  const [connectedSession, setConnectedSession] = useState<any | null>(null);
  const [securitySupported, setSecuritySupported] = useState(true);

  // Update connection state and notify listeners
  const updateConnectionState = useCallback(
    (update: Partial<ConnectionState>) => {
      setConnectionState((prev) => {
        const newState = { ...prev, ...update };
        onSecurityStateChange?.(newState);
        return newState;
      });
    },
    [onSecurityStateChange]
  );

  // Check security support on mount
  useEffect(() => {
    const support = checkSecuritySupport();
    if (!support.supported) {
      console.error('[Secure Connection] Missing security features:', support.missing);
      setSecuritySupported(false);
      setError(new Error('Your browser does not support required security features: ' + support.missing.join(', ')));
    }
  }, []);

  /**
   * Connect wallet with full security flow
   */
  const connectWallet = useCallback(
    async (args: {
      walletAddress: string;
      stakeAddress: string;
      walletName: string;
      paymentAddress?: string;
      signDataFunction: (address: string, payload: string) => Promise<string>;
      cachedMeks?: any[];
    }) => {
      if (!securitySupported) {
        const err = new Error('Security features not supported in this browser');
        setError(err);
        onConnectionError?.(err);
        return { success: false, error: err.message };
      }

      setIsConnecting(true);
      setError(null);
      setConnectionState(createConnectionState(maxRetries));
      onConnectionStart?.();

      try {
        const { walletAddress, stakeAddress, walletName, paymentAddress, signDataFunction, cachedMeks } = args;

        // Step 1: Generate secure nonce with origin validation
        console.log('[Secure Connection] Step 1: Generating secure nonce');
        const nonceResult = await generateSecureNonce({
          stakeAddress,
          walletName,
          generateNonceMutation,
          updateState: updateConnectionState,
        });

        // Step 2: Request signature from wallet
        console.log('[Secure Connection] Step 2: Requesting wallet signature');
        const signature = await signDataFunction(stakeAddress, nonceResult.message);

        if (!signature) {
          throw new Error('User rejected signature request');
        }

        // Step 3: Verify signature with retry logic
        console.log('[Secure Connection] Step 3: Verifying signature');
        const verifyResult = await verifySignatureWithRetry({
          stakeAddress,
          walletName,
          signature,
          nonce: nonceResult.nonce,
          verifySignatureAction,
          generateNonceMutation,
          signDataFunction,
          updateState: updateConnectionState,
          maxRetries,
        });

        if (!verifyResult.success || !verifyResult.verified) {
          throw new Error(verifyResult.error || 'Signature verification failed');
        }

        // Step 4: Save encrypted session
        console.log('[Secure Connection] Step 4: Saving encrypted session');
        const sessionId = generateSessionId();

        await saveSessionSecurely({
          walletAddress,
          stakeAddress,
          walletName,
          sessionId,
          nonce: nonceResult.nonce,
          paymentAddress,
          cachedMeks,
          updateState: updateConnectionState,
        });

        // Success
        const session = {
          walletAddress,
          stakeAddress,
          walletName,
          sessionId,
          expiresAt: verifyResult.expiresAt,
        };

        setConnectedSession(session);
        setIsConnecting(false);
        onConnectionSuccess?.(session);

        console.log('[Secure Connection] ✓ Connection successful');

        return {
          success: true,
          session,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Connection failed');
        const userMessage = getUserFriendlyErrorMessage(error);

        console.error('[Secure Connection] ✗ Connection failed:', error);

        setError(error);
        setIsConnecting(false);
        onConnectionError?.(error);

        return {
          success: false,
          error: userMessage,
        };
      }
    },
    [
      securitySupported,
      maxRetries,
      generateNonceMutation,
      verifySignatureAction,
      updateConnectionState,
      onConnectionStart,
      onConnectionSuccess,
      onConnectionError,
    ]
  );

  /**
   * Restore existing session from storage
   */
  const restoreSession = useCallback(async () => {
    try {
      console.log('[Secure Connection] Restoring session from storage');
      const session = await loadSessionSecurely();

      if (session) {
        setConnectedSession(session);
        console.log('[Secure Connection] ✓ Session restored');
        return session;
      }

      console.log('[Secure Connection] No valid session found');
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to restore session');
      console.error('[Secure Connection] ✗ Session restore failed:', error);
      setError(error);
      return null;
    }
  }, []);

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(() => {
    console.log('[Secure Connection] Disconnecting wallet');
    clearWalletSession();
    setConnectedSession(null);
    setError(null);
    setConnectionState(createConnectionState(maxRetries));
  }, [maxRetries]);

  /**
   * Get user-friendly status message
   */
  const getStatusMessage = useCallback(() => {
    if (connectionState.isGeneratingNonce) return 'Generating secure nonce...';
    if (connectionState.isVerifyingOrigin) return 'Verifying origin...';
    if (connectionState.isVerifyingSignature) {
      if (connectionState.retryAttempt > 0) {
        return `Retrying verification (${connectionState.retryAttempt}/${connectionState.maxRetries})...`;
      }
      return 'Verifying signature...';
    }
    if (connectionState.isEncrypting) return 'Encrypting session...';
    if (isConnecting) return 'Connecting...';
    if (connectedSession) return 'Connected';
    return 'Disconnected';
  }, [connectionState, isConnecting, connectedSession]);

  return {
    // Connection functions
    connectWallet,
    restoreSession,
    disconnectWallet,

    // State
    isConnecting,
    connectionState,
    connectedSession,
    error,
    securitySupported,

    // Helpers
    statusMessage: getStatusMessage(),
    userFriendlyError: error ? getUserFriendlyErrorMessage(error) : null,
  };
}
