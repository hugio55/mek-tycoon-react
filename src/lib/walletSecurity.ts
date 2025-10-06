/**
 * Wallet Security - Index
 * Comprehensive security utilities for wallet authentication and session management
 *
 * This module provides:
 * - Security state logging and monitoring
 * - Session encryption with device binding
 * - Nonce retry logic for signature failures
 * - Migration tracking to prevent loops
 * - Visibility change handling for session validation
 * - Complete wallet connection flow management
 */

// Security State Logging
export {
  SecurityStateLogger,
  SessionMigrationTracker,
  NonceRetryManager,
  type SecurityEvent,
  type SecurityLogEntry,
  type MigrationStatus,
} from './securityStateLogger';

// Session Encryption
export {
  encryptSession,
  decryptSession,
  isEncryptedSession,
  clearEncryptionSalt,
} from './sessionEncryption';

// Session Management
export {
  saveSession,
  getSession,
  clearSession,
  updateSessionValidation,
  hasValidSession,
  getSessionTimeRemaining,
  extendSession,
  type WalletSession,
} from './walletSession';

// Visibility Handling
export {
  SessionVisibilityHandler,
  useSessionVisibility,
  type VisibilityCallback,
} from './sessionVisibilityHandler';

// Wallet Connection Flow
export {
  WalletConnectionManager,
  useWalletConnectionManager,
  type WalletConnectionState,
  type NonceGenerationResult,
  type SignatureVerificationResult,
} from './walletConnectionHelper';

// High-level session management
export {
  saveWalletSession,
  restoreWalletSession,
  clearWalletSession,
  getCachedMeks,
  updateCachedMeks,
  generateSessionId,
  type SessionData,
} from './walletSessionManager';

/**
 * Usage Example:
 *
 * ```typescript
 * import { WalletConnectionManager } from '@/lib/walletSecurity';
 *
 * const manager = new WalletConnectionManager((state) => {
 *   console.log('Connection state:', state);
 *   setIsConnecting(state.isConnecting);
 *   setIsEncrypting(state.isEncrypting);
 * });
 *
 * const success = await manager.connect(
 *   async () => {
 *     const result = await generateNonce.mutate({ stakeAddress, walletName });
 *     return result;
 *   },
 *   async (nonce, message) => {
 *     const signature = await wallet.signData(stakeAddress, message);
 *     return signature;
 *   },
 *   async (nonce, signature) => {
 *     const result = await verifySignature.mutate({ nonce, signature, stakeAddress, walletName });
 *     return result;
 *   },
 *   {
 *     walletName: 'eternl',
 *     stakeAddress,
 *     sessionId: generateSessionId(),
 *   }
 * );
 * ```
 */

/**
 * Security Testing Scenarios:
 *
 * 1. **Encrypt → Navigate away → Return**
 *    - Session should decrypt and restore correctly
 *    - Visibility handler should validate session on return
 *
 * 2. **Generate nonce → Deny signature → Retry**
 *    - Should get new nonce automatically
 *    - Should track retry count and stop at max retries
 *
 * 3. **Old session → Load page → Migrates**
 *    - Should migrate plaintext to encrypted once
 *    - Migration tracker should prevent loops
 *
 * 4. **Concurrent saves**
 *    - Encryption should be atomic
 *    - Last write wins without corruption
 *
 * 5. **Signature timeout**
 *    - Nonce should expire after 5 minutes
 *    - Should generate new nonce on retry
 *
 * 6. **Session expires while away**
 *    - Visibility handler should detect expiry
 *    - Should clear session and show reconnect UI
 */
