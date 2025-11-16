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
 * Removes session and all cached data to force full reconnection
 * Creates disconnect nonce to require signature verification on next login
 */
export function clearWalletSession(): void {
  console.log('[🔓DISCONNECT] === Starting Wallet Disconnect Process ===');
  console.log('[🔓DISCONNECT] Step 1: Clearing encrypted session...');
  clearSession();

  // Generate and store disconnect nonce for signature verification
  // This prevents someone from reconnecting without proving wallet ownership
  console.log('[🔓DISCONNECT] Step 2: Generating disconnect nonce...');
  const disconnectNonce = crypto.randomUUID();
  console.log('[🔓DISCONNECT] Step 3: Storing disconnect nonce:', disconnectNonce.slice(0, 8) + '...');
  localStorage.setItem('mek_disconnect_nonce', disconnectNonce);

  // Verify nonce was stored
  const nonceVerify = localStorage.getItem('mek_disconnect_nonce');
  console.log('[🔓DISCONNECT] Step 4: Verifying nonce storage:', nonceVerify ? `✅ SUCCESS (${nonceVerify.slice(0, 8)}...)` : '❌ FAILED');

  // Clear all wallet-related data
  try {
    console.log('[🔓DISCONNECT] Step 5: Clearing all wallet-related localStorage items...');
    localStorage.removeItem('mek_cached_meks');
    localStorage.removeItem('mek_wallet_session');
    localStorage.removeItem('goldMiningWallet');
    localStorage.removeItem('goldMiningWalletType');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('stakeAddress');
    localStorage.removeItem('paymentAddress');
    localStorage.removeItem('mek_migration_status');
    console.log('[🔓DISCONNECT] ✅ Cleared all session data');
    console.log('[🔓DISCONNECT] === Disconnect Complete ===');
    console.log('[🔓DISCONNECT] User MUST reconnect wallet and sign verification message to access site');
  } catch (error) {
    console.error('[🔓DISCONNECT] ❌ Error clearing session data:', error);
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
