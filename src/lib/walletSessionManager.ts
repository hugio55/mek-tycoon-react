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
    walletType: data.walletName.toLowerCase(),
    walletName: data.walletName,
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
 * @returns Promise that resolves to session or null
 */
export async function restoreWalletSession(): Promise<WalletSession | null> {
  try {
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
 * Clear all wallet session data
 */
export function clearWalletSession(): void {
  clearSession();

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
    console.log('[Session Manager] Cleared all session data and caches');
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
    // Try new cache key first
    let cacheData = localStorage.getItem('mek_cached_meks');

    // Fall back to legacy key for backwards compatibility
    if (!cacheData) {
      cacheData = localStorage.getItem('mek_wallet_session');
      if (cacheData) {
        console.log('[Session Manager] Found legacy cache, will migrate on next save');
      }
    }

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
