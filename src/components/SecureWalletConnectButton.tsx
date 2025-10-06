/**
 * Secure Wallet Connect Button Component
 * Demonstrates integration of security-hardened wallet connection
 * Shows security status indicators during connection flow
 */

'use client';

import { useState } from 'react';
import { useSecureWalletConnection } from '@/hooks/useSecureWalletConnection';

interface SecureWalletConnectButtonProps {
  walletType: 'eternl' | 'nami' | 'flint' | 'typhon' | 'lace' | 'vespr';
  walletApi: any; // The wallet API object from window.cardano[walletType]
  onConnected?: (session: any) => void;
  onError?: (error: Error) => void;
}

export default function SecureWalletConnectButton({
  walletType,
  walletApi,
  onConnected,
  onError,
}: SecureWalletConnectButtonProps) {
  const [addresses, setAddresses] = useState<{ payment?: string; stake?: string } | null>(null);

  const {
    connectWallet,
    disconnectWallet,
    isConnecting,
    connectionState,
    connectedSession,
    error,
    securitySupported,
    statusMessage,
    userFriendlyError,
  } = useSecureWalletConnection({
    maxRetries: 2,
    onConnectionSuccess: onConnected,
    onConnectionError: onError,
  });

  const handleConnect = async () => {
    try {
      // Enable wallet API
      const api = await walletApi.enable();

      // Get addresses
      const [paymentAddress] = await api.getUsedAddresses();
      const [stakeAddress] = await api.getRewardAddresses();

      setAddresses({
        payment: paymentAddress,
        stake: stakeAddress,
      });

      // Connect with security hardening
      const result = await connectWallet({
        walletAddress: paymentAddress || stakeAddress,
        stakeAddress: stakeAddress,
        walletName: walletType,
        paymentAddress: paymentAddress,
        signDataFunction: async (address: string, payload: string) => {
          // Sign data with wallet
          const signResult = await api.signData(address, payload);
          return signResult.signature;
        },
      });

      if (!result.success) {
        console.error('[Wallet Button] Connection failed:', result.error);
      }
    } catch (err) {
      console.error('[Wallet Button] Error during connection:', err);
    }
  };

  if (!securitySupported) {
    return (
      <div className="p-4 bg-red-900/20 border-2 border-red-500/50 rounded">
        <p className="text-red-400 text-sm font-['Orbitron']">
          Your browser does not support required security features. Please use a modern browser with HTTPS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Connect Button */}
      <button
        onClick={connectedSession ? disconnectWallet : handleConnect}
        disabled={isConnecting}
        className="w-full bg-black/40 border-2 border-yellow-500/30 text-yellow-500 px-6 py-4 transition-all hover:bg-yellow-500/10 hover:border-yellow-500/50 active:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm rounded relative overflow-hidden"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

        {/* Content */}
        <div className="relative flex items-center justify-center gap-3">
          {isConnecting ? (
            <>
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 border-r-yellow-500 rounded-full animate-spin"></div>
              </div>
              <span className="text-sm">{statusMessage}</span>
            </>
          ) : connectedSession ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Disconnect {walletType.toUpperCase()}</span>
            </>
          ) : (
            <span className="text-sm">Connect {walletType.toUpperCase()}</span>
          )}
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/50"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/50"></div>
      </button>

      {/* Security Status Indicators */}
      {isConnecting && (
        <div className="p-4 bg-black/30 border-2 border-yellow-500/20 rounded backdrop-blur-sm space-y-2">
          <p className="text-xs text-yellow-500/80 font-['Orbitron'] font-bold uppercase tracking-wider mb-3">
            Security Status
          </p>

          <div className="space-y-1.5 text-xs text-yellow-500/60 font-['Orbitron']">
            {/* Origin Verification */}
            <div className="flex items-center gap-2">
              {connectionState.isVerifyingOrigin ? (
                <div className="w-3 h-3 border border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin"></div>
              ) : connectionState.originVerified ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 border border-yellow-500/30 rounded-full"></div>
              )}
              <span>Origin Verification</span>
            </div>

            {/* Nonce Generation */}
            <div className="flex items-center gap-2">
              {connectionState.isGeneratingNonce ? (
                <div className="w-3 h-3 border border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin"></div>
              ) : connectionState.nonceGenerated ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 border border-yellow-500/30 rounded-full"></div>
              )}
              <span>Nonce Generation</span>
            </div>

            {/* Signature Verification */}
            <div className="flex items-center gap-2">
              {connectionState.isVerifyingSignature ? (
                <div className="w-3 h-3 border border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin"></div>
              ) : connectionState.signatureVerified ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 border border-yellow-500/30 rounded-full"></div>
              )}
              <span>
                Signature Verification
                {connectionState.retryAttempt > 0 && (
                  <span className="ml-1 text-yellow-500/80">
                    (Retry {connectionState.retryAttempt}/{connectionState.maxRetries})
                  </span>
                )}
              </span>
            </div>

            {/* Session Encryption */}
            <div className="flex items-center gap-2">
              {connectionState.isEncrypting ? (
                <div className="w-3 h-3 border border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin"></div>
              ) : connectionState.sessionEncrypted ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 border border-yellow-500/30 rounded-full"></div>
              )}
              <span>Session Encryption</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && userFriendlyError && (
        <div className="p-4 bg-red-900/20 border-2 border-red-500/50 rounded backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-400 font-['Orbitron'] font-bold">Connection Error</p>
              <p className="text-xs text-red-400/80 font-['Orbitron'] mt-1">{userFriendlyError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {connectedSession && (
        <div className="p-4 bg-green-900/20 border-2 border-green-500/50 rounded backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-green-400 font-['Orbitron'] font-bold">Wallet Connected</p>
              <p className="text-xs text-green-400/80 font-['Orbitron'] mt-1">
                {connectedSession.stakeAddress?.slice(0, 16)}...{connectedSession.stakeAddress?.slice(-8)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-green-400/60 font-['Orbitron']">
                <div className="w-3 h-3 bg-green-500/50 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Session Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
