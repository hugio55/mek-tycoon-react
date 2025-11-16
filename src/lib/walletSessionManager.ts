/**
 * Wallet Session Manager
 * High-level orchestration layer for wallet session management
 * Combines walletSession.ts (storage) with Convex authentication validation
 * Includes async session encryption and origin validation
 */

import { saveSession, getSession, clearSession, WalletSession } from './walletSession';
import { detectPlatform, generateDeviceId } from './platformDetection';

export interface SessionData {
  walletName: string;
  stakeAddress: string;
  paymentAddress?: string;
  nonce: string;
  sessionId: string;
  cachedMeks?: any[];
}

/**
 * Save a wallet connection session with async encryption
 * Combines localStorage persistence with platform detection
 * @returns Promise that resolves when encryption is complete
 */
export async function saveWalletSession(data: SessionData): Promise<void> {
  console.log('[TRACE-SAVE-1] saveWalletSession called with data:', {
    walletName: data.walletName,
    stakeAddress: data.stakeAddress?.slice(0, 12) + '...',
    paymentAddress: data.paymentAddress?.slice(0, 12) + '...',
    hasNonce: !!data.nonce,
    hasSessionId: !!data.sessionId,
    timestamp: new Date().toISOString()
  });

  const platform = detectPlatform();
  const deviceId = generateDeviceId();

  // CRITICAL: Validate required fields before creating session
  if (!data.stakeAddress) {
    throw new Error('[Session Manager] Cannot save session: stakeAddress is required');
  }

  const session: Omit<WalletSession, 'createdAt' | 'expiresAt'> = {
    // Always use stake address as primary identifier (payment address can be empty)
    walletAddress: data.stakeAddress,
    stakeAddress: data.stakeAddress,
    paymentAddress: data.paymentAddress, // Store separately for blockchain verification
    sessionId: data.sessionId,
    nonce: data.nonce,
    walletType: (data.walletName || 'unknown').toLowerCase(),
    walletName: data.walletName || 'unknown',
    platform,
    deviceId,
  };

  console.log('[TRACE-SAVE-2] Session object constructed:', {
    walletAddress: session.walletAddress?.slice(0, 12) + '...',
    stakeAddress: session.stakeAddress?.slice(0, 12) + '...',
    walletAddressIsUndefined: session.walletAddress === undefined,
    stakeAddressIsUndefined: session.stakeAddress === undefined,
    timestamp: new Date().toISOString()
  });

  // Save encrypted session (this is now async due to encryption)
  await saveSession(session);

  // Clear disconnect nonce since user has successfully reconnected
  try {
    localStorage.removeItem('mek_disconnect_nonce');
    console.log('[Session Manager] Cleared disconnect nonce - new session established');
  } catch (error) {
    console.error('[Session Manager] Failed to clear disconnect nonce:', error);
  }

  // Save Meks cache separately (using different key to avoid overwriting encrypted session)
  if (data.cachedMeks && data.cachedMeks.length > 0) {
    try {
      const cacheData = {
        walletName: data.walletName,
        stakeAddress: data.stakeAddress,
        paymentAddress: data.paymentAddress,
        timestamp: Date.now(),
        cachedMeks: data.cachedMeks,
      };
      // CRITICAL: Use separate key to avoid race condition with encrypted session
      localStorage.setItem('mek_cached_meks', JSON.stringify(cacheData));
      console.log('[Session Manager] Saved Meks cache with', data.cachedMeks.length, 'Meks');
    } catch (error) {
      console.error('[Session Manager] Failed to save Meks cache:', error);
    }
  }
}

/**
 * Restore a wallet session with async decryption
 * Returns session data if valid, null if expired or invalid
 * Automatically migrates legacy plaintext sessions to encrypted format
 * Validates against disconnect nonce to ensure session wasn't invalidated
 * @returns Promise that resolves to session or null
 */
export async function restoreWalletSession(): Promise<WalletSession | null> {
  try {
    // Check if user has disconnected since this session was created
    const disconnectNonce = localStorage.getItem('mek_disconnect_nonce');
    if (disconnectNonce) {
      console.log('[Session Manager] Disconnect nonce found - session invalidated, user must reconnect');
      // Clear the encrypted session to force new login
      clearSession();
      return null;
    }

    const session = await getSession();

    if (!session) {
      console.log('[Session Manager] No valid session found');
      return null;
    }

    console.log('[Session Manager] Restored encrypted session:', {
      walletAddress: session.walletAddress.slice(0, 12) + '...',
      platform: session.platform,
      walletName: session.walletName,
      age: Math.floor((Date.now() - session.createdAt) / 1000 / 60) + ' minutes',
    });

    return session;
  } catch (error) {
    console.error('[Session Manager] Failed to restore session:', error);
    return null;
  }
}

/**
 * Clear all wallet session data and invalidate current session
 * Forces user to reconnect even if wallet extension has cached permission
 */
export function clearWalletSession(): void {
  clearSession();

  // Generate a new disconnect nonce to invalidate old sessions
  // When user reconnects, we'll validate this matches or force new connection
  const disconnectNonce = crypto.randomUUID();
  localStorage.setItem('mek_disconnect_nonce', disconnectNonce);

  // Also clear cache and additional wallet keys
  try {
    localStorage.removeItem('mek_cached_meks'); // New cache key
    localStorage.removeItem('mek_wallet_session'); // Legacy key (may still exist)
    localStorage.removeItem('goldMiningWallet');
    localStorage.removeItem('goldMiningWalletType');
    localStorage.removeItem('walletAddress'); // Clear payment address
    localStorage.removeItem('stakeAddress'); // Clear stake address
    localStorage.removeItem('paymentAddress'); // Clear payment address (alt key)
    localStorage.removeItem('mek_migration_status'); // CRITICAL: Clear failed migration tracker
    console.log('[Session Manager] Cleared all session data and set disconnect nonce:', disconnectNonce);
  } catch (error) {
    console.error('[Session Manager] Error clearing session data:', error);
  }
}

/**
 * Get cached Meks from separate cache storage
 * IMPORTANT: Validates that cached Meks belong to the specified wallet address
 *
 * @param walletAddress - The stake address of the currently connected wallet
 * @returns Cached Meks if they match the wallet, null otherwise
 */
export function getCachedMeks(walletAddress?: string): any[] | null {
  try {
    // Get cache data from dedicated cache key
    const cacheData = localStorage.getItem('mek_cached_meks');

    if (!cacheData) return null;

    const parsed = JSON.parse(cacheData);

    // CRITICAL: Validate cached Meks belong to current wallet
    if (walletAddress && parsed.stakeAddress !== walletAddress) {
      console.warn('[Session Manager] Cached Meks belong to different wallet - ignoring');
      console.log('[Session Manager] Cached wallet:', parsed.stakeAddress?.slice(0, 12) + '...');
      console.log('[Session Manager] Current wallet:', walletAddress?.slice(0, 12) + '...');
      // Clear the mismatched caches
      localStorage.removeItem('mek_cached_meks');
      localStorage.removeItem('mek_wallet_session');
      return null;
    }

    return parsed.cachedMeks || null;
  } catch (error) {
    console.error('[Session Manager] Error reading cached Meks:', error);
    return null;
  }
}

/**
 * Update cached Meks in separate cache storage
 */
export function updateCachedMeks(meks: any[]): void {
  try {
    // Try new cache key first
    let cacheData = localStorage.getItem('mek_cached_meks');

    // Fall back to legacy key
    if (!cacheData) {
      cacheData = localStorage.getItem('mek_wallet_session');
    }

    if (!cacheData) {
      console.warn('[Session Manager] No cache found to update Meks');
      return;
    }

    const parsed = JSON.parse(cacheData);
    parsed.cachedMeks = meks;
    parsed.timestamp = Date.now();

    // Save to new cache key
    localStorage.setItem('mek_cached_meks', JSON.stringify(parsed));
    console.log('[Session Manager] Updated cached Meks:', meks.length);
  } catch (error) {
    console.error('[Session Manager] Error updating cached Meks:', error);
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}
