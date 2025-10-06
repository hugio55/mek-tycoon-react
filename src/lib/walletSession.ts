/**
 * Wallet Session Storage Management
 * Handles localStorage-based session persistence for wallet connections
 * Sessions are encrypted using Web Crypto API with device-bound keys
 */

import { encryptSession, decryptSession, isEncryptedSession } from './sessionEncryption';
import { SecurityStateLogger, SessionMigrationTracker } from './securityStateLogger';

const SESSION_KEY = 'mek_wallet_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface WalletSession {
  walletAddress: string;
  stakeAddress: string;
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
 */
export async function saveSession(session: Omit<WalletSession, 'createdAt' | 'expiresAt'>): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const fullSession: WalletSession = {
    ...session,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  try {
    // Encrypt session before storing
    const encryptedSession = await encryptSession(fullSession);
    localStorage.setItem(SESSION_KEY, encryptedSession);

    console.log('[Session] Saved encrypted wallet session:', {
      walletAddress: session.walletAddress.slice(0, 12) + '...',
      expiresAt: new Date(fullSession.expiresAt).toISOString(),
      platform: session.platform,
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
      console.log('[Session] No stored session found');
      return null;
    }

    let session: WalletSession;

    // Check if this is an encrypted session or legacy plaintext
    if (isEncryptedSession(stored)) {
      // Decrypt the session
      try {
        session = await decryptSession(stored);
        console.log('[Session] Decrypted session successfully');
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
        session = JSON.parse(stored);

        // Re-save as encrypted
        await saveSession({
          walletAddress: session.walletAddress,
          stakeAddress: session.stakeAddress,
          sessionId: session.sessionId,
          nonce: session.nonce,
          walletType: session.walletType,
          walletName: session.walletName,
          platform: session.platform,
          deviceId: session.deviceId,
          lastValidated: session.lastValidated,
        });

        logger.log('session_migrate_complete', {
          walletAddress: session.walletAddress.slice(0, 12) + '...',
          platform: session.platform
        });
        logger.complete({ migrated: true });

        migrationTracker.markAttempted(true);
      } catch (migrateError) {
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

    // Validate session structure
    if (
      !session.walletAddress ||
      !session.stakeAddress ||
      !session.sessionId ||
      !session.nonce ||
      !session.walletType
    ) {
      console.warn('[Session] Invalid session structure, clearing');
      clearSession();
      return null;
    }

    console.log('[Session] Retrieved valid session:', {
      walletAddress: session.walletAddress.slice(0, 12) + '...',
      expiresAt: new Date(session.expiresAt).toISOString(),
      platform: session.platform,
      age: Math.floor((now - session.createdAt) / 1000 / 60) + ' minutes',
    });

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
 * Extend session expiration by 24 hours
 */
export async function extendSession(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  session.expiresAt = Date.now() + SESSION_DURATION;

  try {
    // Re-encrypt and save updated session
    const encryptedSession = await encryptSession(session);
    localStorage.setItem(SESSION_KEY, encryptedSession);
    console.log('[Session] Extended session expiration:', {
      newExpiry: new Date(session.expiresAt).toISOString(),
    });
    return true;
  } catch (error) {
    console.error('[Session] Failed to extend session:', error);
    return false;
  }
}
