/**
 * Wallet Session Storage Management
 * Handles localStorage-based session persistence for wallet connections
 */

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
 * Save wallet session to localStorage
 */
export function saveSession(session: Omit<WalletSession, 'createdAt' | 'expiresAt'>): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const fullSession: WalletSession = {
    ...session,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(fullSession));
    console.log('[Session] Saved wallet session:', {
      walletAddress: session.walletAddress.slice(0, 12) + '...',
      expiresAt: new Date(fullSession.expiresAt).toISOString(),
      platform: session.platform,
    });
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
  }
}

/**
 * Get and validate session from localStorage
 * Returns null if session is expired or invalid
 */
export function getSession(): WalletSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      console.log('[Session] No stored session found');
      return null;
    }

    const session: WalletSession = JSON.parse(stored);
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
export function updateSessionValidation(): void {
  if (typeof window === 'undefined') return;

  const session = getSession();
  if (!session) return;

  session.lastValidated = Date.now();

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('[Session] Updated session validation timestamp');
  } catch (error) {
    console.error('[Session] Failed to update validation:', error);
  }
}

/**
 * Check if session exists and is valid (without retrieving full data)
 */
export function hasValidSession(): boolean {
  if (typeof window === 'undefined') return false;

  const session = getSession();
  return session !== null;
}

/**
 * Get session expiry time in milliseconds
 */
export function getSessionTimeRemaining(): number | null {
  const session = getSession();
  if (!session) return null;

  return Math.max(0, session.expiresAt - Date.now());
}

/**
 * Extend session expiration by 24 hours
 */
export function extendSession(): boolean {
  const session = getSession();
  if (!session) return false;

  session.expiresAt = Date.now() + SESSION_DURATION;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('[Session] Extended session expiration:', {
      newExpiry: new Date(session.expiresAt).toISOString(),
    });
    return true;
  } catch (error) {
    console.error('[Session] Failed to extend session:', error);
    return false;
  }
}
