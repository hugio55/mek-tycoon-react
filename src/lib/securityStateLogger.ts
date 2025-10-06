/**
 * Security State Logger
 * Tracks encryption, nonce generation/consumption, and session operations
 * for debugging state synchronization issues in wallet authentication
 */

export type SecurityEvent =
  | 'session_encrypt_start'
  | 'session_encrypt_complete'
  | 'session_encrypt_error'
  | 'session_decrypt_start'
  | 'session_decrypt_complete'
  | 'session_decrypt_error'
  | 'session_migrate_start'
  | 'session_migrate_complete'
  | 'session_migrate_error'
  | 'nonce_generate'
  | 'nonce_consume'
  | 'nonce_expire'
  | 'nonce_retry'
  | 'signature_request'
  | 'signature_success'
  | 'signature_failure'
  | 'signature_retry';

export interface SecurityLogEntry {
  event: SecurityEvent;
  timestamp: number;
  data?: any;
  error?: any;
}

export class SecurityStateLogger {
  private logs: SecurityLogEntry[] = [];
  private operationId: string;
  private startTime: number;

  constructor(operationName: string = 'Security') {
    this.operationId = `[Security:${operationName}]`;
    this.startTime = Date.now();
  }

  /**
   * Log a security event with timestamp and data
   */
  log(event: SecurityEvent, data?: any) {
    const entry: SecurityLogEntry = {
      event,
      timestamp: Date.now(),
      data,
    };

    this.logs.push(entry);

    const elapsed = Date.now() - this.startTime;
    const prefix = `${this.operationId} [+${elapsed}ms]`;

    // Color-coded console output
    switch (event) {
      case 'session_encrypt_start':
      case 'session_decrypt_start':
      case 'session_migrate_start':
        console.log(`${prefix} 🔄 ${event}`, data);
        break;
      case 'session_encrypt_complete':
      case 'session_decrypt_complete':
      case 'session_migrate_complete':
      case 'signature_success':
        console.log(`${prefix} ✅ ${event}`, data);
        break;
      case 'session_encrypt_error':
      case 'session_decrypt_error':
      case 'session_migrate_error':
      case 'signature_failure':
        console.error(`${prefix} ❌ ${event}`, data);
        break;
      case 'nonce_generate':
        console.log(`${prefix} 🔑 ${event}`, data);
        break;
      case 'nonce_consume':
        console.log(`${prefix} 🔓 ${event}`, data);
        break;
      case 'nonce_expire':
      case 'nonce_retry':
      case 'signature_retry':
        console.warn(`${prefix} ⚠️ ${event}`, data);
        break;
      default:
        console.log(`${prefix} ${event}`, data);
    }
  }

  /**
   * Log an error with full context
   */
  error(event: SecurityEvent, error: any, context?: any) {
    const entry: SecurityLogEntry = {
      event,
      timestamp: Date.now(),
      error,
      data: context,
    };

    this.logs.push(entry);

    const elapsed = Date.now() - this.startTime;
    console.error(`${this.operationId} [+${elapsed}ms] ❌ ${event}`, {
      error: error instanceof Error ? error.message : error,
      context,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * Get all logs for this operation
   */
  getLogs(): SecurityLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs as formatted string for debugging
   */
  getFormattedLogs(): string {
    return this.logs.map((log, i) => {
      const elapsed = log.timestamp - this.startTime;
      const dataStr = log.data ? JSON.stringify(log.data, null, 2) : '';
      const errorStr = log.error ? `\n  Error: ${log.error}` : '';
      return `${i + 1}. [+${elapsed}ms] ${log.event}${dataStr ? '\n  ' + dataStr : ''}${errorStr}`;
    }).join('\n');
  }

  /**
   * Complete operation with summary
   */
  complete(summary?: any) {
    const totalElapsed = Date.now() - this.startTime;
    console.log(`${this.operationId} ===== COMPLETE (${totalElapsed}ms) =====`);
    if (summary) {
      console.log(`${this.operationId} Summary:`, summary);
    }
  }
}

/**
 * Migration state tracker to prevent repeated migrations
 */
export interface MigrationStatus {
  attempted: boolean;
  success: boolean;
  timestamp: number;
  error?: string;
}

const MIGRATION_STATUS_KEY = 'mek_migration_status';

export class SessionMigrationTracker {
  /**
   * Check if migration has been attempted
   */
  hasAttempted(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const status = localStorage.getItem(MIGRATION_STATUS_KEY);
      if (!status) return false;

      const parsed: MigrationStatus = JSON.parse(status);
      return parsed.attempted;
    } catch {
      return false;
    }
  }

  /**
   * Check if migration was successful
   */
  wasSuccessful(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const status = localStorage.getItem(MIGRATION_STATUS_KEY);
      if (!status) return false;

      const parsed: MigrationStatus = JSON.parse(status);
      return parsed.success && parsed.attempted;
    } catch {
      return false;
    }
  }

  /**
   * Mark migration as attempted
   */
  markAttempted(success: boolean, error?: string) {
    if (typeof window === 'undefined') return;

    const status: MigrationStatus = {
      attempted: true,
      success,
      timestamp: Date.now(),
      error,
    };

    try {
      localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
      console.log('[Migration Tracker] Marked migration:', { success, error });
    } catch (e) {
      console.error('[Migration Tracker] Failed to save status:', e);
    }
  }

  /**
   * Reset migration status (for testing or forced re-migration)
   */
  reset() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(MIGRATION_STATUS_KEY);
      console.log('[Migration Tracker] Reset migration status');
    } catch (e) {
      console.error('[Migration Tracker] Failed to reset:', e);
    }
  }

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus | null {
    if (typeof window === 'undefined') return null;

    try {
      const status = localStorage.getItem(MIGRATION_STATUS_KEY);
      if (!status) return null;

      return JSON.parse(status);
    } catch {
      return null;
    }
  }
}

/**
 * Nonce retry manager for handling signature failures
 */
export class NonceRetryManager {
  private maxRetries: number;
  private retryCount: number = 0;
  private currentNonce: string | null = null;
  private logger: SecurityStateLogger;

  constructor(maxRetries: number = 3, logger?: SecurityStateLogger) {
    this.maxRetries = maxRetries;
    this.logger = logger || new SecurityStateLogger('NonceRetry');
  }

  /**
   * Set current nonce being used
   */
  setNonce(nonce: string) {
    this.currentNonce = nonce;
    this.logger.log('nonce_generate', { nonce, attempt: this.retryCount + 1 });
  }

  /**
   * Mark nonce as consumed (signature succeeded)
   */
  consume() {
    if (this.currentNonce) {
      this.logger.log('nonce_consume', { nonce: this.currentNonce, totalAttempts: this.retryCount + 1 });
      this.reset();
    }
  }

  /**
   * Check if can retry after failure
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  /**
   * Increment retry count and check if should retry
   */
  shouldRetry(): boolean {
    this.retryCount++;

    if (this.retryCount >= this.maxRetries) {
      this.logger.error('nonce_retry', new Error('Max retries exceeded'), {
        nonce: this.currentNonce,
        attempts: this.retryCount,
        maxRetries: this.maxRetries,
      });
      return false;
    }

    this.logger.log('nonce_retry', {
      nonce: this.currentNonce,
      attempt: this.retryCount,
      maxRetries: this.maxRetries,
    });

    return true;
  }

  /**
   * Reset retry state
   */
  reset() {
    this.retryCount = 0;
    this.currentNonce = null;
  }

  /**
   * Get current retry status
   */
  getStatus() {
    return {
      currentNonce: this.currentNonce,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      canRetry: this.canRetry(),
    };
  }
}
