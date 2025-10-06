/**
 * Wallet Connection Helper
 * Handles wallet connection flow with:
 * - Async encryption with loading states
 * - Nonce retry logic for signature failures
 * - Session validation on page visibility changes
 */

import { NonceRetryManager, SecurityStateLogger } from './securityStateLogger';
import { saveWalletSession, restoreWalletSession } from './walletSessionManager';
import { SessionVisibilityHandler } from './sessionVisibilityHandler';

export interface WalletConnectionState {
  isConnecting: boolean;
  isEncrypting: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  error: string | null;
  retryCount: number;
  canRetry: boolean;
}

export interface NonceGenerationResult {
  nonce: string;
  message: string;
  expiresAt: number;
}

export interface SignatureVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  expiresAt?: number;
}

/**
 * Wallet connection manager with retry logic and state tracking
 */
export class WalletConnectionManager {
  private state: WalletConnectionState = {
    isConnecting: false,
    isEncrypting: false,
    walletConnected: false,
    walletAddress: null,
    error: null,
    retryCount: 0,
    canRetry: true,
  };

  private nonceRetry: NonceRetryManager;
  private logger: SecurityStateLogger;
  private visibilityHandler: SessionVisibilityHandler;
  private onStateChange?: (state: WalletConnectionState) => void;

  constructor(onStateChange?: (state: WalletConnectionState) => void) {
    this.logger = new SecurityStateLogger('WalletConnection');
    this.nonceRetry = new NonceRetryManager(3, this.logger);
    this.visibilityHandler = new SessionVisibilityHandler();
    this.onStateChange = onStateChange;

    // Setup visibility handler to detect session expiry
    this.visibilityHandler.onVisibilityChange(async (isVisible, sessionValid) => {
      if (isVisible && !sessionValid && this.state.walletConnected) {
        // Session expired while user was away
        this.updateState({
          walletConnected: false,
          walletAddress: null,
          error: 'Session expired while you were away. Please reconnect.',
        });
      }
    });

    this.visibilityHandler.start();
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<WalletConnectionState>) {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }

  /**
   * Connect wallet with retry logic
   */
  async connect(
    generateNonce: () => Promise<NonceGenerationResult>,
    requestSignature: (nonce: string, message: string) => Promise<string>,
    verifySignature: (nonce: string, signature: string) => Promise<SignatureVerificationResult>,
    sessionData: {
      walletName: string;
      stakeAddress: string;
      paymentAddress?: string;
      sessionId: string;
    }
  ): Promise<boolean> {
    this.updateState({ isConnecting: true, error: null });

    try {
      // Attempt connection with retry logic
      const result = await this.attemptConnectionWithRetry(
        generateNonce,
        requestSignature,
        verifySignature,
        sessionData
      );

      if (result.success) {
        this.updateState({
          isConnecting: false,
          walletConnected: true,
          walletAddress: sessionData.stakeAddress,
          error: null,
        });
        return true;
      } else {
        this.updateState({
          isConnecting: false,
          walletConnected: false,
          error: result.error || 'Connection failed',
        });
        return false;
      }
    } catch (error) {
      this.logger.error('signature_failure', error, { context: 'connect' });
      this.updateState({
        isConnecting: false,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Attempt connection with automatic retry on nonce failures
   */
  private async attemptConnectionWithRetry(
    generateNonce: () => Promise<NonceGenerationResult>,
    requestSignature: (nonce: string, message: string) => Promise<string>,
    verifySignature: (nonce: string, signature: string) => Promise<SignatureVerificationResult>,
    sessionData: {
      walletName: string;
      stakeAddress: string;
      paymentAddress?: string;
      sessionId: string;
    }
  ): Promise<SignatureVerificationResult> {
    let lastError: string | undefined;

    while (this.nonceRetry.canRetry()) {
      try {
        // Generate nonce
        this.logger.log('nonce_generate', { attempt: this.state.retryCount + 1 });
        const { nonce, message } = await generateNonce();
        this.nonceRetry.setNonce(nonce);

        // Request signature from wallet
        this.logger.log('signature_request', { nonce });
        const signature = await requestSignature(nonce, message);

        if (!signature) {
          throw new Error('User cancelled signature request');
        }

        // Verify signature
        this.logger.log('signature_request', { nonce, hasSignature: !!signature });
        const result = await verifySignature(nonce, signature);

        if (result.success && result.verified) {
          // Success - save session with encryption
          this.logger.log('signature_success', { nonce });
          this.nonceRetry.consume();

          await this.saveSessionWithEncryption({
            ...sessionData,
            nonce,
          });

          return result;
        } else {
          // Verification failed
          lastError = result.error;

          if (this.nonceRetry.shouldRetry()) {
            this.updateState({ retryCount: this.state.retryCount + 1 });
            this.logger.log('nonce_retry', {
              reason: lastError,
              nextAttempt: this.state.retryCount + 1,
            });
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            return { success: false, error: lastError };
          }
        }
      } catch (error) {
        lastError = (error as Error).message;

        if (lastError.includes('cancelled') || lastError.includes('denied')) {
          // User cancelled - don't retry
          return { success: false, error: lastError };
        }

        if (this.nonceRetry.shouldRetry()) {
          this.updateState({ retryCount: this.state.retryCount + 1 });
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        } else {
          return { success: false, error: lastError };
        }
      }
    }

    return { success: false, error: lastError || 'Max retries exceeded' };
  }

  /**
   * Save session with async encryption and loading state
   */
  private async saveSessionWithEncryption(sessionData: {
    walletName: string;
    stakeAddress: string;
    paymentAddress?: string;
    nonce: string;
    sessionId: string;
  }): Promise<void> {
    this.updateState({ isEncrypting: true });

    try {
      this.logger.log('session_encrypt_start', {
        walletAddress: sessionData.stakeAddress.slice(0, 12) + '...',
      });

      await saveWalletSession(sessionData);

      this.logger.log('session_encrypt_complete', { sessionSaved: true });
    } catch (error) {
      this.logger.error('session_encrypt_error', error, { sessionData });
      throw error;
    } finally {
      this.updateState({ isEncrypting: false });
    }
  }

  /**
   * Restore session on app load
   */
  async restoreSession(): Promise<boolean> {
    this.updateState({ isConnecting: true });

    try {
      const session = await restoreWalletSession();

      if (session) {
        this.updateState({
          isConnecting: false,
          walletConnected: true,
          walletAddress: session.stakeAddress,
        });
        return true;
      } else {
        this.updateState({
          isConnecting: false,
          walletConnected: false,
          walletAddress: null,
        });
        return false;
      }
    } catch (error) {
      this.logger.error('session_decrypt_error', error, { context: 'restoreSession' });
      this.updateState({
        isConnecting: false,
        walletConnected: false,
        error: 'Failed to restore session',
      });
      return false;
    }
  }

  /**
   * Disconnect wallet and clear session
   */
  async disconnect(): Promise<void> {
    const { clearWalletSession } = await import('./walletSessionManager');
    clearWalletSession();

    this.updateState({
      walletConnected: false,
      walletAddress: null,
      error: null,
      retryCount: 0,
    });

    this.nonceRetry.reset();
  }

  /**
   * Get current connection state
   */
  getState(): WalletConnectionState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.visibilityHandler.stop();
  }
}

/**
 * React hook for wallet connection with retry logic
 */
export function useWalletConnectionManager() {
  if (typeof window === 'undefined') {
    return null;
  }

  const manager = new WalletConnectionManager();

  return {
    manager,
    connect: manager.connect.bind(manager),
    disconnect: manager.disconnect.bind(manager),
    restoreSession: manager.restoreSession.bind(manager),
    getState: manager.getState.bind(manager),
    cleanup: manager.cleanup.bind(manager),
  };
}
