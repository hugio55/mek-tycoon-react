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

  const session: Omit<WalletSession, 'createdAt' | 'expiresAt'> = {
    walletAddress: data.paymentAddress || data.stakeAddress,
    stakeAddress: data.stakeAddress,
    sessionId: data.sessionId,
    nonce: data.nonce,
    walletType: data.walletName.toLowerCase(),
    walletName: data.walletName,
    platform,
    deviceId,
  };

  // Save encrypted session (this is now async due to encryption)
  await saveSession(session);

  // Also save Meks cache separately for backwards compatibility
  if (data.cachedMeks && data.cachedMeks.length > 0) {
    try {
      const legacyData = {
        walletName: data.walletName,
        stakeAddress: data.stakeAddress,
        paymentAddress: data.paymentAddress,
        timestamp: Date.now(),
        cachedMeks: data.cachedMeks,
      };
      localStorage.setItem('mek_wallet_session', JSON.stringify(legacyData));
      console.log('[Session Manager] Saved legacy session format with', data.cachedMeks.length, 'cached Meks');
    } catch (error) {
      console.error('[Session Manager] Failed to save legacy format:', error);
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

  // Also clear legacy format
  try {
    localStorage.removeItem('mek_wallet_session');
    localStorage.removeItem('goldMiningWallet');
    localStorage.removeItem('goldMiningWalletType');
    console.log('[Session Manager] Cleared all session data (new and legacy formats)');
  } catch (error) {
    console.error('[Session Manager] Error clearing legacy formats:', error);
  }
}

/**
 * Get cached Meks from legacy session format
 * This maintains backwards compatibility while migrating to new format
 */
export function getCachedMeks(): any[] | null {
  try {
    const legacyData = localStorage.getItem('mek_wallet_session');
    if (!legacyData) return null;

    const parsed = JSON.parse(legacyData);
    return parsed.cachedMeks || null;
  } catch (error) {
    console.error('[Session Manager] Error reading cached Meks:', error);
    return null;
  }
}

/**
 * Update cached Meks in session
 */
export function updateCachedMeks(meks: any[]): void {
  try {
    const legacyData = localStorage.getItem('mek_wallet_session');
    if (!legacyData) {
      console.warn('[Session Manager] No session found to update Meks cache');
      return;
    }

    const parsed = JSON.parse(legacyData);
    parsed.cachedMeks = meks;
    localStorage.setItem('mek_wallet_session', JSON.stringify(parsed));
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
