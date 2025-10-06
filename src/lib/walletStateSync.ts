/**
 * Wallet State Synchronization Utilities
 *
 * Handles state sync issues for wallet connections, particularly:
 * - WebView auto-connect race conditions
 * - Visibility change events during wallet switching
 * - Session restoration on page return
 * - React state updates timing
 */

export interface WalletStateSyncLogger {
  step: number;
  message: string;
  data?: any;
  timestamp: number;
}

/**
 * State sync logger with detailed timestamps and step tracking
 */
export class WalletStateLogger {
  private logs: WalletStateSyncLogger[] = [];
  private currentStep: number = 0;
  private operationId: string;
  private startTime: number;

  constructor(operationName: string) {
    this.operationId = `[${operationName}]`;
    this.startTime = Date.now();
    console.log(`${this.operationId} ===== STARTED =====`);
    console.log(`${this.operationId} Timestamp:`, new Date().toISOString());
  }

  log(message: string, data?: any) {
    this.currentStep++;
    const elapsed = Date.now() - this.startTime;

    const logEntry: WalletStateSyncLogger = {
      step: this.currentStep,
      message,
      data,
      timestamp: Date.now()
    };

    this.logs.push(logEntry);

    const prefix = `${this.operationId} Step ${this.currentStep} (+${elapsed}ms):`;
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  complete(finalData?: any) {
    const totalElapsed = Date.now() - this.startTime;
    console.log(`${this.operationId} ===== COMPLETE (${totalElapsed}ms) =====`);
    if (finalData) {
      console.log(`${this.operationId} Final State:`, finalData);
    }
  }

  error(error: any) {
    const totalElapsed = Date.now() - this.startTime;
    console.error(`${this.operationId} ===== FAILED (${totalElapsed}ms) =====`);
    console.error(`${this.operationId} Error:`, error);
    if (error instanceof Error) {
      console.error(`${this.operationId} Stack:`, error.stack);
    }
  }

  getLogs() {
    return this.logs;
  }
}

/**
 * Visibility change handler for wallet session restoration
 * Listens for when user returns from wallet app to dApp
 */
export class VisibilityChangeHandler {
  private handlers: Array<(isVisible: boolean) => void> = [];
  private isListening: boolean = false;
  private lastVisibilityState: boolean = true;

  constructor() {
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

    console.log('[Visibility Handler] Starting visibility change listener');
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

    console.log('[Visibility Handler] Stopping visibility change listener');
    this.isListening = false;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle visibility change event
   */
  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;

    const isVisible = !document.hidden;
    const stateChanged = isVisible !== this.lastVisibilityState;

    if (stateChanged) {
      console.log('[Visibility Handler] Page visibility changed:', {
        from: this.lastVisibilityState ? 'visible' : 'hidden',
        to: isVisible ? 'visible' : 'hidden',
        timestamp: new Date().toISOString()
      });

      this.lastVisibilityState = isVisible;

      // Notify all registered handlers
      this.handlers.forEach(handler => {
        try {
          handler(isVisible);
        } catch (error) {
          console.error('[Visibility Handler] Handler error:', error);
        }
      });
    }
  };

  /**
   * Register a handler to be called on visibility changes
   */
  onVisibilityChange(handler: (isVisible: boolean) => void) {
    this.handlers.push(handler);

    // Return cleanup function
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }
}

/**
 * Wallet connection state tracker
 * Ensures state changes are properly sequenced and logged
 */
export class WalletConnectionStateTracker {
  private state: {
    isConnecting: boolean;
    isConnected: boolean;
    walletAddress: string | null;
    walletType: string | null;
    isSignatureVerified: boolean;
    meksLoaded: boolean;
    meksCount: number;
  } = {
    isConnecting: false,
    isConnected: false,
    walletAddress: null,
    walletType: null,
    isSignatureVerified: false,
    meksLoaded: false,
    meksCount: 0
  };

  private logger: WalletStateLogger;

  constructor(operationName: string) {
    this.logger = new WalletStateLogger(operationName);
  }

  updateState(updates: Partial<typeof this.state>, message: string) {
    const before = { ...this.state };
    this.state = { ...this.state, ...updates };

    this.logger.log(message, {
      before,
      after: this.state,
      changes: updates
    });
  }

  getState() {
    return { ...this.state };
  }

  complete() {
    this.logger.complete(this.state);
  }

  error(error: any) {
    this.logger.error(error);
  }
}

/**
 * Check if wallet connection state is fully synchronized
 */
export function isWalletStateSynced(state: {
  walletConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  ownedMeks: any[];
  isSignatureVerified: boolean;
}): { synced: boolean; issues: string[] } {
  const issues: string[] = [];

  if (state.walletConnected) {
    if (!state.walletAddress) {
      issues.push('walletConnected is true but walletAddress is null');
    }
    if (!state.walletType) {
      issues.push('walletConnected is true but walletType is null');
    }
    if (!state.isSignatureVerified) {
      issues.push('walletConnected is true but isSignatureVerified is false');
    }
  } else {
    if (state.walletAddress !== null) {
      issues.push('walletConnected is false but walletAddress is not null');
    }
    if (state.walletType !== null) {
      issues.push('walletConnected is false but walletType is not null');
    }
  }

  const synced = issues.length === 0;

  if (!synced) {
    console.warn('[State Sync Check] State inconsistencies detected:', issues);
  }

  return { synced, issues };
}

/**
 * Wait for state to sync with timeout
 */
export async function waitForStateSync(
  checkFn: () => boolean,
  timeoutMs: number = 5000,
  checkIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (checkFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  return false;
}
