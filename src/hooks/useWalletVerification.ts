/**
 * Wallet Verification Hook
 *
 * Provides wallet ownership verification via CIP-30 signature signing.
 * Used for Phase I veteran name reservation and NFT claims.
 *
 * Flow:
 * 1. Detect available wallets (desktop) or show mobile flow
 * 2. User connects wallet via CIP-30 enable()
 * 3. Extract stake address from wallet
 * 4. Compare with expected stake address
 * 5. Generate nonce from backend
 * 6. User signs nonce with wallet
 * 7. Backend verifies signature cryptographically
 *
 * Security: All verification happens server-side via /api/wallet/* endpoints
 */

import { useState, useCallback, useEffect } from 'react';
import { ensureBech32StakeAddress } from '@/lib/cardanoAddressConverter';

export interface AvailableWallet {
  name: string;
  icon: string;
  api: any;
}

export type VerificationStatus =
  | 'idle'
  | 'detecting_wallets'
  | 'connecting'
  | 'checking_address'
  | 'generating_nonce'
  | 'awaiting_signature'
  | 'verifying'
  | 'success'
  | 'failed';

export interface WalletVerificationResult {
  success: boolean;
  stakeAddress?: string;
  walletName?: string;
  error?: string;
}

interface UseWalletVerificationOptions {
  onVerificationStart?: () => void;
  onVerificationSuccess?: (result: WalletVerificationResult) => void;
  onVerificationError?: (error: string) => void;
}

const KNOWN_WALLETS = [
  { name: 'Nami', icon: '/wallet-icons/nami.png' },
  { name: 'Eternl', icon: '/wallet-icons/eternl.png' },
  { name: 'Flint', icon: '/wallet-icons/flint.png' },
  { name: 'Vespr', icon: '/wallet-icons/vespr.png' },
  { name: 'Typhon', icon: '/wallet-icons/typhon.png' },
  { name: 'NuFi', icon: '/wallet-icons/nufi.png' },
  { name: 'Lace', icon: '/wallet-icons/lace.png' },
  { name: 'Yoroi', icon: '/wallet-icons/yoroi.png' },
];

export function useWalletVerification(options: UseWalletVerificationOptions = {}) {
  const { onVerificationStart, onVerificationSuccess, onVerificationError } = options;

  // Wallet detection state
  const [availableWallets, setAvailableWallets] = useState<AvailableWallet[]>([]);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [walletsDetected, setWalletsDetected] = useState(false);

  // Verification state
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRequestingSignature, setIsRequestingSignature] = useState(false);
  const [verifiedStakeAddress, setVerifiedStakeAddress] = useState<string | null>(null);
  const [verifiedWalletName, setVerifiedWalletName] = useState<string | null>(null);

  // Nonce state (for retry scenarios)
  const [currentNonce, setCurrentNonce] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  /**
   * Detect available wallets on desktop, or set mobile mode
   */
  const detectWallets = useCallback(() => {
    setStatus('detecting_wallets');
    setWalletsDetected(false);

    // Check for mobile browser
    const isMobile = typeof navigator !== 'undefined' &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    if (isMobile) {
      console.log('[🔐VERIFY-HOOK] Mobile browser detected');
      setIsMobileBrowser(true);
      setAvailableWallets([]);
      setWalletsDetected(true);
      setStatus('idle');
      return;
    }

    // Check if window.cardano exists
    const hasCardano = typeof window !== 'undefined' && window.cardano;
    console.log('[🔐VERIFY-HOOK] Starting detection, window.cardano exists:', !!hasCardano);

    if (!hasCardano) {
      // Extensions might not have injected yet - retry after delay
      setTimeout(() => {
        const retryCardano = typeof window !== 'undefined' && window.cardano;
        if (retryCardano) {
          console.log('[🔐VERIFY-HOOK] Retry successful - extensions loaded');
          doWalletDetection();
        } else {
          console.log('[🔐VERIFY-HOOK] No window.cardano after retry - assuming mobile');
          setIsMobileBrowser(true);
          setAvailableWallets([]);
          setWalletsDetected(true);
          setStatus('idle');
        }
      }, 500);
      return;
    }

    doWalletDetection();
  }, []);

  const doWalletDetection = useCallback(() => {
    const cardano = (window as any).cardano;
    if (!cardano) {
      setIsMobileBrowser(true);
      setAvailableWallets([]);
      setWalletsDetected(true);
      setStatus('idle');
      return;
    }

    setIsMobileBrowser(false);
    const wallets: AvailableWallet[] = [];

    KNOWN_WALLETS.forEach(wallet => {
      const name = wallet.name.toLowerCase();
      if (cardano[name]) {
        wallets.push({
          icon: wallet.icon,
          name: wallet.name,
          api: cardano[name]
        });
      }
    });

    console.log('[🔐VERIFY-HOOK] Detected wallets:', wallets.map(w => w.name));
    setAvailableWallets(wallets);
    setWalletsDetected(true);
    setStatus('idle');
  }, []);

  // Auto-detect wallets on mount
  useEffect(() => {
    detectWallets();
  }, [detectWallets]);

  /**
   * Connect to wallet and verify it matches expected stake address
   */
  const verifyWallet = useCallback(async (
    wallet: AvailableWallet,
    expectedStakeAddress: string
  ): Promise<WalletVerificationResult> => {
    setIsConnecting(true);
    setError(null);
    setStatus('connecting');
    setCurrentNonce(null);
    setCurrentMessage(null);
    onVerificationStart?.();

    try {
      console.log(`[🔐VERIFY-HOOK] Connecting to ${wallet.name}...`);

      // Step 1: Enable the wallet (CIP-30)
      const api = await Promise.race([
        wallet.api.enable(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet connection timeout after 30 seconds')), 30000)
        )
      ]) as any;

      // Step 2: Get stake addresses from connected wallet
      setStatus('checking_address');
      console.log('[🔐VERIFY-HOOK] Getting stake addresses...');
      const stakeAddresses = await api.getRewardAddresses();

      if (!stakeAddresses || stakeAddresses.length === 0) {
        throw new Error('No stake addresses found in wallet');
      }

      const walletStakeRaw = stakeAddresses[0];
      console.log('[🔐VERIFY-HOOK] Wallet stake address (raw):', walletStakeRaw);

      // Convert to bech32 if needed
      let walletStakeAddress = walletStakeRaw;
      if (!walletStakeRaw.startsWith('stake')) {
        try {
          walletStakeAddress = ensureBech32StakeAddress(walletStakeRaw);
          console.log('[🔐VERIFY-HOOK] Converted to bech32:', walletStakeAddress);
        } catch (convErr) {
          console.error('[🔐VERIFY-HOOK] Conversion failed, using raw:', convErr);
        }
      }

      // Step 3: Compare with expected stake address
      const normalizedExpected = expectedStakeAddress.toLowerCase().trim();
      const normalizedWallet = walletStakeAddress.toLowerCase();

      console.log('[🔐VERIFY-HOOK] Comparing addresses:');
      console.log('  Expected:', normalizedExpected);
      console.log('  Wallet:', normalizedWallet);

      if (normalizedWallet !== normalizedExpected) {
        console.error('[🔐VERIFY-HOOK] ❌ MISMATCH');
        const errorMsg = 'The connected wallet does not match the expected stake address. Please connect the correct wallet.';
        setError(errorMsg);
        setStatus('failed');
        setIsConnecting(false);
        onVerificationError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('[🔐VERIFY-HOOK] ✅ Address match - starting backend verification...');
      setIsConnecting(false);

      // Step 4: Generate nonce from backend
      setStatus('generating_nonce');
      console.log('[🔐VERIFY-HOOK] Requesting nonce from backend...');

      const nonceResponse = await fetch('/api/wallet/generate-nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeAddress: walletStakeAddress,
          walletName: wallet.name.toLowerCase()
        })
      });

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json().catch(() => ({}));
        console.error('[🔐VERIFY-HOOK] ❌ Nonce generation failed:', errorData);

        if (nonceResponse.status === 429) {
          throw new Error('Too many verification attempts. Please wait a few minutes and try again.');
        }
        throw new Error(errorData.error || 'Failed to generate verification challenge');
      }

      const { nonce, message } = await nonceResponse.json();
      console.log('[🔐VERIFY-HOOK] ✅ Received nonce');
      setCurrentNonce(nonce);
      setCurrentMessage(message);

      // Step 5: Request user signature
      setStatus('awaiting_signature');
      setIsRequestingSignature(true);

      // Convert message to hex (CIP-30 requires hex-encoded message)
      const messageHex = Array.from(new TextEncoder().encode(message))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Get address for signing
      const usedAddresses = await api.getUsedAddresses();
      const signingAddress = usedAddresses[0];

      if (!signingAddress) {
        throw new Error('No signing address available. Please ensure your wallet has been used.');
      }

      console.log('[🔐VERIFY-HOOK] Requesting user signature...');
      const signatureResult = await api.signData(signingAddress, messageHex);
      console.log('[🔐VERIFY-HOOK] ✅ Signature received');
      setIsRequestingSignature(false);

      // Step 6: Verify signature with backend
      setStatus('verifying');
      console.log('[🔐VERIFY-HOOK] Sending to backend for verification...');

      const verifyResponse = await fetch('/api/wallet/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeAddress: walletStakeAddress,
          nonce,
          signature: signatureResult.signature || signatureResult,
          key: signatureResult.key || undefined,
          walletName: wallet.name.toLowerCase()
        })
      });

      const verifyResult = await verifyResponse.json();
      console.log('[🔐VERIFY-HOOK] Verification result:', verifyResult);

      // Step 7: Check for weak verification warning
      if (verifyResult.warning) {
        console.warn('[🔐VERIFY-HOOK] ⚠️ Weak verification detected:', verifyResult.warning);
        const errorMsg = 'Your wallet\'s signature could not be fully verified. Please try a different wallet (Eternl, Nami, or Flint recommended).';
        setError(errorMsg);
        setStatus('failed');
        onVerificationError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (verifyResult.success && verifyResult.verified) {
        console.log('[🔐VERIFY-HOOK] ✅ VERIFIED SUCCESSFULLY');
        setStatus('success');
        setVerifiedStakeAddress(walletStakeAddress);
        setVerifiedWalletName(wallet.name);
        setCurrentNonce(null);
        setCurrentMessage(null);

        const result: WalletVerificationResult = {
          success: true,
          stakeAddress: walletStakeAddress,
          walletName: wallet.name
        };
        onVerificationSuccess?.(result);
        return result;
      } else {
        console.error('[🔐VERIFY-HOOK] ❌ Backend rejected:', verifyResult.error);
        let errorMsg = 'Signature verification failed. Please try again.';
        if (verifyResult.error?.includes('rate limit') || verifyResult.error?.includes('Too many')) {
          errorMsg = 'Too many verification attempts. Please wait a few minutes and try again.';
        } else if (verifyResult.error?.includes('expired')) {
          errorMsg = 'Verification challenge expired. Please try again.';
        } else if (verifyResult.error?.includes('locked')) {
          errorMsg = 'Account temporarily locked due to failed attempts. Please wait an hour.';
        }

        setError(errorMsg);
        setStatus('failed');
        onVerificationError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

    } catch (err: any) {
      console.error('[🔐VERIFY-HOOK] Error:', err);
      setIsRequestingSignature(false);
      setIsConnecting(false);

      // Handle user rejection vs error
      const errorMsg = err.message?.toLowerCase() || '';
      let userError: string;

      if (errorMsg.includes('declined') ||
          errorMsg.includes('rejected') ||
          errorMsg.includes('cancel') ||
          errorMsg.includes('user') ||
          errorMsg.includes('denied')) {
        userError = 'Signature request was declined. Please sign to verify wallet ownership.';
      } else if (errorMsg.includes('not supported') || errorMsg.includes('signdata')) {
        userError = 'Your wallet doesn\'t support message signing. Please try a different wallet.';
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        userError = 'Too many verification attempts. Please wait a few minutes and try again.';
      } else if (errorMsg.includes('timeout')) {
        userError = 'Wallet connection timed out. Please try again.';
      } else {
        userError = err.message || 'Verification failed. Please try again.';
      }

      setError(userError);
      setStatus('failed');
      onVerificationError?.(userError);
      return { success: false, error: userError };
    }
  }, [onVerificationStart, onVerificationSuccess, onVerificationError]);

  /**
   * Reset verification state for retry
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setIsConnecting(false);
    setIsRequestingSignature(false);
    setVerifiedStakeAddress(null);
    setVerifiedWalletName(null);
    setCurrentNonce(null);
    setCurrentMessage(null);
  }, []);

  /**
   * Get user-friendly status message
   */
  const getStatusMessage = useCallback((): string => {
    switch (status) {
      case 'detecting_wallets': return 'Detecting wallets...';
      case 'connecting': return 'Connecting to wallet...';
      case 'checking_address': return 'Checking wallet address...';
      case 'generating_nonce': return 'Generating verification challenge...';
      case 'awaiting_signature': return 'Please sign in your wallet...';
      case 'verifying': return 'Verifying signature...';
      case 'success': return 'Wallet verified!';
      case 'failed': return error || 'Verification failed';
      default: return 'Ready to verify';
    }
  }, [status, error]);

  return {
    // Wallet detection
    availableWallets,
    isMobileBrowser,
    walletsDetected,
    detectWallets,

    // Verification
    verifyWallet,
    reset,

    // State
    status,
    error,
    isConnecting,
    isRequestingSignature,
    isVerifying: status === 'generating_nonce' || status === 'awaiting_signature' || status === 'verifying',
    isSuccess: status === 'success',
    isFailed: status === 'failed',

    // Results
    verifiedStakeAddress,
    verifiedWalletName,

    // Helpers
    statusMessage: getStatusMessage(),
  };
}
