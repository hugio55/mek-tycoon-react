/**
 * Wallet Session Storage Management
 * Handles localStorage-based session persistence for wallet connections
 * Sessions are encrypted using Web Crypto API with device-bound keys
 */

import { encryptSession, decryptSession, isEncryptedSession } from './sessionEncryption';
import { SecurityStateLogger, SessionMigrationTracker } from './securityStateLogger';

const SESSION_KEY = 'mek_wallet_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const EXTENDED_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const REMEMBERED_DEVICE_KEY = 'mek_device_remembered';

export interface WalletSession {
  walletAddress: string; // Primary identifier (stake address)
  stakeAddress: string;
  paymentAddress?: string; // Optional payment address for blockchain verification
  sessionId: string;
  nonce: string;
  expiresAt: number;
  walletType: string;
  walletName: string;
  platform: 'mobile_ios' | 'mobile_android' | 'mobile_web' | 'desktop';
  deviceId: string;
  createdAt: number;
  lastValidated?: number;
}

/**
 * Save wallet session to localStorage (encrypted)
 * Respects "device remembered" status for session duration
 */
export async function saveSession(session: Omit<WalletSession, 'createdAt' | 'expiresAt'>): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Use extended duration if device is remembered
  const duration = isDeviceRemembered() ? EXTENDED_SESSION_DURATION : SESSION_DURATION;
  const fullSession: WalletSession = {
    ...session,
    createdAt: now,
    expiresAt: now + duration,
  };

  try {
    // Encrypt session before storing
    const encryptedSession = await encryptSession(fullSession);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    console.log('[Session] Saved session:', {
      duration: isDeviceRemembered() ? '7 days (device remembered)' : '24 hours',
      expiresAt: new Date(fullSession.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
    throw error;
  }
}

/**
 * Get and validate session from localStorage (with decryption)
 * Returns null if session is expired or invalid
 * Handles migration from legacy plaintext sessions
 */
export async function getSession(): Promise<WalletSession | null> {
  if (typeof window === 'undefined') return null;

  const migrationTracker = new SessionMigrationTracker();

  try {
    const stored = localStorage.getItem(SESSION_KEY);

    if (!stored) {
      return null;
    }

    let session: WalletSession;

    // Check if this is an encrypted session or legacy plaintext
    if (isEncryptedSession(stored)) {
      // Decrypt the session
      try {
        session = await decryptSession(stored);
      } catch (decryptError) {
        console.error('[Session] Failed to decrypt session:', decryptError);
        clearSession();
        return null;
      }
    } else {
      // Legacy plaintext session - migrate to encrypted format
      // Check if we've already attempted migration to prevent loops
      const migrationStatus = migrationTracker.getStatus();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      // Only block if migration failed recently (within last hour)
      if (migrationTracker.hasAttempted() && !migrationTracker.wasSuccessful()) {
        if (migrationStatus && migrationStatus.timestamp > oneHourAgo) {
          console.error('[Session] Migration failed recently, clearing session to prevent loop');
          console.error('[Session] Migration error:', migrationStatus.error);
          console.log('[Session] Will retry after 1 hour from:', new Date(migrationStatus.timestamp));
          clearSession();
          migrationTracker.reset(); // Reset for next login attempt
          return null;
        } else {
          // Failed migration is old - reset and try again
          console.log('[Session] Previous migration failure is old (>1hr), resetting and retrying');
          migrationTracker.reset();
        }
      }

      const logger = new SecurityStateLogger('SessionMigration');
      logger.log('session_migrate_start', { sessionSize: stored.length });

      try {
        const parsed = JSON.parse(stored);

        console.log('[Migration] Parsed legacy data:', {
          hasWalletAddress: !!parsed.walletAddress,
          hasStakeAddress: !!parsed.stakeAddress,
          hasPaymentAddress: !!parsed.paymentAddress,
          hasSessionId: !!parsed.sessionId,
          hasNonce: !!parsed.nonce,
          hasCachedMeks: !!parsed.cachedMeks,
          hasTimestamp: !!parsed.timestamp,
          isLikelyCache: !!parsed.cachedMeks && !parsed.sessionId,
        });

        // Check if this is cache data (has cachedMeks but no sessionId)
        if (parsed.cachedMeks && !parsed.sessionId) {
          console.log('[Migration] Detected cache data, not session - skipping migration');
          logger.log('session_migrate_skip', { reason: 'Cache data, not session' });
          logger.complete({ migrated: false, skipped: true });
          migrationTracker.markAttempted(true); // Mark as successful "migration" (skip)
          // Don't clear - leave cache data for getCachedMeks()
          return null;
        }

        session = parsed;

        // Validate legacy session has required fields
        if (!session.stakeAddress) {
          console.error('[Migration] Legacy session missing stakeAddress - cannot migrate');
          logger.error('session_migrate_error', new Error('Missing stakeAddress in legacy session'));
          migrationTracker.markAttempted(false, 'Missing stakeAddress');
          clearSession();
          return null;
        }

        // Re-save as encrypted (use stakeAddress as walletAddress if walletAddress is missing)
        await saveSession({
          walletAddress: session.stakeAddress, // Always use stakeAddress
          stakeAddress: session.stakeAddress,
          paymentAddress: session.paymentAddress,
          sessionId: session.sessionId,
          nonce: session.nonce,
          walletType: session.walletType,
          walletName: session.walletName,
          platform: session.platform,
          deviceId: session.deviceId,
          lastValidated: session.lastValidated,
        });

        logger.log('session_migrate_complete', {
          walletAddress: session.stakeAddress.slice(0, 12) + '...',
          platform: session.platform
        });
        logger.complete({ migrated: true });

        migrationTracker.markAttempted(true);
      } catch (migrateError) {
        console.error('[Migration] Failed to migrate session:', migrateError);
        console.error('[Migration] Error details:', {
          message: (migrateError as Error).message,
          stack: (migrateError as Error).stack,
        });
        logger.error('session_migrate_error', migrateError);
        migrationTracker.markAttempted(false, (migrateError as Error).message);
        clearSession();
        return null;
      }
    }

    const now = Date.now();

    // Check if session is expired
    if (session.expiresAt < now) {
      console.log('[Session] Session expired:', {
        expiredAt: new Date(session.expiresAt).toISOString(),
        now: new Date(now).toISOString(),
      });
      clearSession();
      return null;
    }

    // Validate session structure (nonce is optional - may not exist if using existing backend session)
    // CRITICAL: Only require fields that MUST exist (nonce is optional for existing backend sessions)
    if (
      !session.walletAddress ||
      !session.stakeAddress ||
      !session.sessionId ||
      !session.walletType
    ) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('[Session] Failed to parse session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_KEY);
    console.log('[Session] Cleared wallet session');
  } catch (error) {
    console.error('[Session] Failed to clear session:', error);
  }
}

/**
 * Update session last validated timestamp
 */
export async function updateSessionValidation(): Promise<void> {
  if (typeof window === 'undefined') return;

  const session = await getSession();
  if (!session) return;

  session.lastValidated = Date.now();

  try {
    // Re-encrypt and save updated session
    const encryptedSession = await encryptSession(session);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    console.log('[Session] Updated session validation timestamp');
  } catch (error) {
    console.error('[Session] Failed to update validation:', error);
  }
}

/**
 * Check if session exists and is valid (without retrieving full data)
 */
export async function hasValidSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const session = await getSession();
  return session !== null;
}

/**
 * Get session expiry time in milliseconds
 */
export async function getSessionTimeRemaining(): Promise<number | null> {
  const session = await getSession();
  if (!session) return null;

  return Math.max(0, session.expiresAt - Date.now());
}

/**
 * Extend session expiration by 24 hours (or 7 days if device is remembered)
 */
export async function extendSession(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const duration = isDeviceRemembered() ? EXTENDED_SESSION_DURATION : SESSION_DURATION;
  session.expiresAt = Date.now() + duration;

  try {
    // Re-encrypt and save updated session
    const encryptedSession = await encryptSession(session);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    console.log('[Session] Extended session expiration:', {
      newExpiry: new Date(session.expiresAt).toISOString(),
      duration: isDeviceRemembered() ? '7 days' : '24 hours',
    });
    return true;
  } catch (error) {
    console.error('[Session] Failed to extend session:', error);
    return false;
  }
}

/**
 * Check if this device has been marked as "remembered"
 */
export function isDeviceRemembered(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBERED_DEVICE_KEY) === 'true';
}

/**
 * Mark device as remembered and extend session to 7 days + 24 hours
 * Returns the new expiration timestamp
 */
export async function rememberDevice(): Promise<number | null> {
  if (typeof window === 'undefined') return null;

  const session = await getSession();
  if (!session) return null;

  // Extend session by 7 days + 24 hours from now
  const newExpiry = Date.now() + EXTENDED_SESSION_DURATION + SESSION_DURATION;
  session.expiresAt = newExpiry;

  try {
    const encryptedSession = await encryptSession(session);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    // Mark device as remembered ONLY after successful session save
    // This prevents inconsistent state if encryption/save fails
    localStorage.setItem(REMEMBERED_DEVICE_KEY, 'true');
    console.log('[Session] Device remembered! Extended session to:', {
      newExpiry: new Date(newExpiry).toISOString(),
      duration: '8 days (7 + 1)',
    });
    return newExpiry;
  } catch (error) {
    console.error('[Session] Failed to remember device:', error);
    return null;
  }
}

/**
 * Clear device remembered status (called on manual disconnect)
 */
export function clearDeviceRemembered(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_DEVICE_KEY);
  console.log('[Session] Cleared device remembered status');
}

/**
 * Extend session on activity (page load/refresh)
 * Only extends if more than 1 hour has passed since last extension
 * to avoid excessive re-encryption
 */
export async function extendSessionOnActivity(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const now = Date.now();
  const lastValidated = session.lastValidated || session.createdAt;
  const timeSinceLastExtension = now - lastValidated;

  // Only extend if more than 1 hour since last activity
  // This prevents excessive re-encryption on every page load
  const ONE_HOUR = 60 * 60 * 1000;
  if (timeSinceLastExtension < ONE_HOUR) {
    return false; // Too soon to extend
  }

  const duration = isDeviceRemembered() ? EXTENDED_SESSION_DURATION : SESSION_DURATION;
  session.expiresAt = now + duration;
  session.lastValidated = now;

  try {
    const encryptedSession = await encryptSession(session);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    console.log('[Session] Extended session on activity:', {
      newExpiry: new Date(session.expiresAt).toISOString(),
      duration: isDeviceRemembered() ? '7 days' : '24 hours',
    });
    return true;
  } catch (error) {
    console.error('[Session] Failed to extend session on activity:', error);
    return false;
  }
}
