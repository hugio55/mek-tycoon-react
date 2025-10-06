/**
 * Secure Wallet Connection Flow
 * Implements enhanced security features including:
 * - Origin validation with nonce generation
 * - Async session encryption
 * - Retry logic for nonce failures
 * - Security status tracking
 */

import { generateDeviceId, detectPlatform } from './platformDetection';
import { saveWalletSession, restoreWalletSession, clearWalletSession } from './walletSessionManager';

/**
 * Security-aware error messages for user display
 */
export const SECURITY_ERROR_MESSAGES: Record<string, string> = {
  'Unauthorized origin': 'This website is not authorized to connect wallets. Please use the official Mek Tycoon site.',
  'Nonce already consumed': 'Signature verification timeout. Please try connecting again.',
  'Nonce already used': 'Signature verification timeout. Please try connecting again.',
  'Rate limit exceeded': 'Too many connection attempts. Please wait a few minutes before trying again.',
  'Session encryption failed': 'Could not save wallet session. Please check that you are using a secure connection (HTTPS).',
  'Invalid signature': 'Signature verification failed. Please make sure you signed the correct message.',
  'Session bound to different device': 'This session was created on a different device and cannot be used here.',
  'Session bound to different origin': 'This session was created on a different website and cannot be used here.',
  'Too many failed attempts': 'Too many failed connection attempts. Your wallet has been temporarily locked for security.',
};

/**
 * Get user-friendly error message from error
 */
export function getUserFriendlyErrorMessage(error: Error | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Check for known security errors
  for (const [key, message] of Object.entries(SECURITY_ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return message;
    }
  }

  // Default message
  return 'Connection failed. Please try again.';
}

/**
 * Connection state for tracking security operations
 */
export interface ConnectionState {
  isEncrypting: boolean;
  sessionEncrypted: boolean;
  isVerifyingOrigin: boolean;
  originVerified: boolean;
  isGeneratingNonce: boolean;
  nonceGenerated: boolean;
  isVerifyingSignature: boolean;
  signatureVerified: boolean;
  retryAttempt: number;
  maxRetries: number;
}

/**
 * Create initial connection state
 */
export function createConnectionState(maxRetries = 2): ConnectionState {
  return {
    isEncrypting: false,
    sessionEncrypted: false,
    isVerifyingOrigin: false,
    originVerified: false,
    isGeneratingNonce: false,
    nonceGenerated: false,
    isVerifyingSignature: false,
    signatureVerified: false,
    retryAttempt: 0,
    maxRetries,
  };
}

/**
 * Generate nonce with origin and device binding
 * Returns nonce data including message to sign
 */
export async function generateSecureNonce(args: {
  stakeAddress: string;
  walletName: string;
  generateNonceMutation: any; // Convex mutation function
  updateState?: (update: Partial<ConnectionState>) => void;
}): Promise<{ nonce: string; expiresAt: number; message: string }> {
  const { stakeAddress, walletName, generateNonceMutation, updateState } = args;

  try {
    updateState?.({ isGeneratingNonce: true, isVerifyingOrigin: true });

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const deviceId = generateDeviceId();

    console.log('[Secure Connection] Generating nonce with origin:', origin, 'deviceId:', deviceId);

    const result = await generateNonceMutation({
      stakeAddress,
      walletName,
      origin,
      deviceId,
    });

    updateState?.({
      isGeneratingNonce: false,
      nonceGenerated: true,
      isVerifyingOrigin: false,
      originVerified: true,
    });

    return result;
  } catch (error) {
    updateState?.({
      isGeneratingNonce: false,
      isVerifyingOrigin: false,
    });
    throw error;
  }
}

/**
 * Verify signature with retry logic for nonce consumption failures
 */
export async function verifySignatureWithRetry(args: {
  stakeAddress: string;
  walletName: string;
  signature: string;
  nonce: string;
  verifySignatureAction: any; // Convex action function
  generateNonceMutation: any; // For retry if nonce consumed
  signDataFunction: (address: string, payload: string) => Promise<string>; // Wallet signing function
  updateState?: (update: Partial<ConnectionState>) => void;
  maxRetries?: number;
}): Promise<{ success: boolean; verified: boolean; expiresAt?: number; error?: string }> {
  const {
    stakeAddress,
    walletName,
    signature: initialSignature,
    nonce: initialNonce,
    verifySignatureAction,
    generateNonceMutation,
    signDataFunction,
    updateState,
    maxRetries = 2,
  } = args;

  let currentNonce = initialNonce;
  let currentSignature = initialSignature;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      updateState?.({
        isVerifyingSignature: true,
        retryAttempt: attempt,
      });

      console.log(`[Secure Connection] Verify attempt ${attempt + 1}/${maxRetries + 1}`);

      const result = await verifySignatureAction({
        stakeAddress,
        walletName,
        signature: currentSignature,
        nonce: currentNonce,
      });

      if (result.success && result.verified) {
        updateState?.({
          isVerifyingSignature: false,
          signatureVerified: true,
          retryAttempt: 0,
        });
        return result;
      }

      // Check if we should retry (nonce consumed or used)
      const shouldRetry = (
        result.error?.includes('Nonce already consumed') ||
        result.error?.includes('Nonce already used')
      ) && attempt < maxRetries;

      if (shouldRetry) {
        console.log(`[Secure Connection] Nonce consumed, retrying with new nonce (${attempt + 1}/${maxRetries})`);

        // Generate new nonce
        const nonceResult = await generateSecureNonce({
          stakeAddress,
          walletName,
          generateNonceMutation,
          updateState,
        });

        currentNonce = nonceResult.nonce;

        // Request new signature from user
        console.log('[Secure Connection] Requesting new signature from wallet');
        currentSignature = await signDataFunction(stakeAddress, nonceResult.message);

        // Continue loop to retry verification
        continue;
      }

      // No retry needed or max retries reached
      updateState?.({
        isVerifyingSignature: false,
        retryAttempt: 0,
      });

      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        updateState?.({
          isVerifyingSignature: false,
          retryAttempt: 0,
        });
        throw error;
      }
      console.warn(`[Secure Connection] Attempt ${attempt + 1} failed, retrying...`, error);
    }
  }

  // Should never reach here, but TypeScript needs it
  updateState?.({
    isVerifyingSignature: false,
    retryAttempt: 0,
  });

  return {
    success: false,
    verified: false,
    error: 'Maximum retries exceeded',
  };
}

/**
 * Save session with encryption (async)
 */
export async function saveSessionSecurely(args: {
  walletAddress: string;
  stakeAddress: string;
  walletName: string;
  sessionId: string;
  nonce: string;
  paymentAddress?: string;
  cachedMeks?: any[];
  updateState?: (update: Partial<ConnectionState>) => void;
}): Promise<void> {
  const { updateState, ...sessionData } = args;

  try {
    updateState?.({ isEncrypting: true });

    console.log('[Secure Connection] Encrypting session...');

    await saveWalletSession({
      walletName: sessionData.walletName,
      stakeAddress: sessionData.stakeAddress,
      paymentAddress: sessionData.paymentAddress,
      nonce: sessionData.nonce,
      sessionId: sessionData.sessionId,
      cachedMeks: sessionData.cachedMeks,
    });

    console.log('[Secure Connection] Session encrypted and saved');

    updateState?.({
      isEncrypting: false,
      sessionEncrypted: true,
    });
  } catch (error) {
    updateState?.({
      isEncrypting: false,
      sessionEncrypted: false,
    });
    throw new Error('Session encryption failed: ' + (error as Error).message);
  }
}

/**
 * Load session with decryption (async)
 * Handles migration from legacy plaintext sessions
 */
export async function loadSessionSecurely(): Promise<any | null> {
  try {
    console.log('[Secure Connection] Loading encrypted session...');

    const session = await restoreWalletSession();

    if (session) {
      console.log('[Secure Connection] Session restored successfully');
    } else {
      console.log('[Secure Connection] No valid session found');
    }

    return session;
  } catch (error) {
    console.error('[Secure Connection] Failed to load session:', error);

    // If decryption fails, clear the corrupted session
    if (error instanceof Error && error.message.includes('decrypt')) {
      console.log('[Secure Connection] Clearing corrupted session');
      clearWalletSession();
    }

    return null;
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}_${random2}`;
}

/**
 * Check if browser supports required security features
 */
export function checkSecuritySupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (typeof window === 'undefined') {
    return { supported: false, missing: ['Window object'] };
  }

  if (!window.crypto) {
    missing.push('Web Crypto API');
  }

  if (!window.crypto?.subtle) {
    missing.push('SubtleCrypto API (HTTPS required)');
  }

  if (!window.localStorage) {
    missing.push('LocalStorage');
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}
