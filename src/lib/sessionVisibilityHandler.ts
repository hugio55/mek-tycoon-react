/**
 * Session Visibility Handler
 * Handles visibility changes to detect when user returns from wallet signature
 * Validates sessions on return and handles expired sessions gracefully
 */

import { getSession, clearSession } from './walletSession';
import { SecurityStateLogger } from './securityStateLogger';

export type VisibilityCallback = (isVisible: boolean, sessionValid: boolean) => void | Promise<void>;

/**
 * Enhanced visibility change handler with async session validation
 */
export class SessionVisibilityHandler {
  private handlers: VisibilityCallback[] = [];
  private isListening: boolean = false;
  private lastVisibilityState: boolean = true;
  private logger: SecurityStateLogger;

  constructor() {
    this.logger = new SecurityStateLogger('VisibilityHandler');

    if (typeof document !== 'undefined') {
      this.lastVisibilityState = !document.hidden;
    }
  }

  /**
   * Start listening for visibility changes
   */
  start() {
    if (this.isListening || typeof document === 'undefined') {
      return;
    }

    this.logger.log('session_decrypt_start', { action: 'Start visibility listener' });
    this.isListening = true;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Stop listening for visibility changes
   */
  stop() {
    if (!this.isListening || typeof document === 'undefined') {
      return;
    }

    this.logger.log('session_decrypt_complete', { action: 'Stop visibility listener' });
    this.isListening = false;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle visibility change event with async session validation
   */
  private handleVisibilityChange = async () => {
    if (typeof document === 'undefined') return;

    const isVisible = !document.hidden;
    const stateChanged = isVisible !== this.lastVisibilityState;

    if (stateChanged) {
      this.logger.log('signature_request', {
        from: this.lastVisibilityState ? 'visible' : 'hidden',
        to: isVisible ? 'visible' : 'hidden',
        timestamp: new Date().toISOString()
      });

      this.lastVisibilityState = isVisible;

      // If page became visible, validate session asynchronously
      if (isVisible) {
        await this.validateSessionOnReturn();
      } else {
        // Notify handlers immediately for page hide
        this.notifyHandlers(false, true);
      }
    }
  };

  /**
   * Validate session when user returns to page
   */
  private async validateSessionOnReturn() {
    try {
      this.logger.log('session_decrypt_start', { reason: 'Page became visible' });

      const session = await getSession();

      if (!session) {
        this.logger.log('nonce_expire', { reason: 'No session found on return' });
        this.notifyHandlers(true, false);
        return;
      }

      // Check if session expired while user was away
      const now = Date.now();
      if (session.expiresAt < now) {
        const expiredMinutes = Math.floor((now - session.expiresAt) / 1000 / 60);

        this.logger.log('nonce_expire', {
          reason: 'Session expired while away',
          expiredMinutesAgo: expiredMinutes,
          expiredAt: new Date(session.expiresAt).toISOString()
        });

        clearSession();
        this.notifyHandlers(true, false);
        return;
      }

      this.logger.log('session_decrypt_complete', {
        sessionValid: true,
        timeRemaining: Math.floor((session.expiresAt - now) / 1000 / 60) + ' minutes'
      });

      this.notifyHandlers(true, true);
    } catch (error) {
      this.logger.error('session_decrypt_error', error, { context: 'validateSessionOnReturn' });
      clearSession();
      this.notifyHandlers(true, false);
    }
  }

  /**
   * Notify all registered handlers
   */
  private notifyHandlers(isVisible: boolean, sessionValid: boolean) {
    this.handlers.forEach(async (handler) => {
      try {
        await handler(isVisible, sessionValid);
      } catch (error) {
        this.logger.error('signature_failure', error, {
          context: 'Handler callback failed',
          isVisible,
          sessionValid
        });
      }
    });
  }

  /**
   * Register a handler to be called on visibility changes
   * @param handler - Callback receives (isVisible, sessionValid)
   * @returns Cleanup function to unregister handler
   */
  onVisibilityChange(handler: VisibilityCallback): () => void {
    this.handlers.push(handler);

    // Return cleanup function
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  /**
   * Get current visibility state
   */
  isPageVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  }
}

/**
 * React hook for using visibility handler
 * Use in wallet connection components to handle session validation
 */
export function useSessionVisibility(
  onVisibilityChange?: (isVisible: boolean, sessionValid: boolean) => void | Promise<void>
) {
  if (typeof window === 'undefined') {
    return { isVisible: true, handler: null };
  }

  const handler = new SessionVisibilityHandler();

  // Register callback if provided
  if (onVisibilityChange) {
    handler.onVisibilityChange(onVisibilityChange);
  }

  // Auto-start on mount, auto-cleanup on unmount
  handler.start();

  return {
    isVisible: handler.isPageVisible(),
    handler,
    cleanup: () => handler.stop()
  };
}
