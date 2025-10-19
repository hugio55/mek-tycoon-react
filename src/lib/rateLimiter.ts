/**
 * Rate Limiter and DDoS Protection
 *
 * Client-side rate limiting with exponential backoff
 * and circuit breaker patterns for API calls
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

interface RequestRecord {
  count: number;
  windowStart: number;
  failures: number;
  lastFailure: number;
  backoffUntil: number;
  circuitOpen: boolean;
}

class RateLimiter {
  private limits: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests || 10,
      windowMs: config.windowMs || 60000, // 1 minute
      backoffMultiplier: config.backoffMultiplier || 2,
      maxBackoffMs: config.maxBackoffMs || 30000, // 30 seconds
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerResetMs: config.circuitBreakerResetMs || 60000, // 1 minute
    };
  }

  /**
   * Check if a request is allowed
   */
  async checkLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
    const now = Date.now();
    let record = this.limits.get(identifier);

    if (!record) {
      record = {
        count: 0,
        windowStart: now,
        failures: 0,
        lastFailure: 0,
        backoffUntil: 0,
        circuitOpen: false,
      };
      this.limits.set(identifier, record);
    }

    // Check circuit breaker
    if (record.circuitOpen) {
      if (now < record.lastFailure + this.config.circuitBreakerResetMs) {
        return {
          allowed: false,
          retryAfter: record.lastFailure + this.config.circuitBreakerResetMs - now,
          reason: 'Circuit breaker open - too many failures',
        };
      } else {
        // Reset circuit breaker
        record.circuitOpen = false;
        record.failures = 0;
      }
    }

    // Check backoff
    if (now < record.backoffUntil) {
      return {
        allowed: false,
        retryAfter: record.backoffUntil - now,
        reason: 'Exponential backoff in effect',
      };
    }

    // Reset window if expired
    if (now > record.windowStart + this.config.windowMs) {
      record.count = 0;
      record.windowStart = now;
    }

    // Check rate limit
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        retryAfter: record.windowStart + this.config.windowMs - now,
        reason: 'Rate limit exceeded',
      };
    }

    // Allow the request
    record.count++;
    return { allowed: true };
  }

  /**
   * Record a successful request
   */
  recordSuccess(identifier: string) {
    const record = this.limits.get(identifier);
    if (record) {
      // Reset failure count on success
      record.failures = 0;
      record.backoffUntil = 0;
    }
  }

  /**
   * Record a failed request and apply backoff
   */
  recordFailure(identifier: string) {
    const record = this.limits.get(identifier);
    if (!record) return;

    const now = Date.now();
    record.failures++;
    record.lastFailure = now;

    // Open circuit breaker if threshold reached
    if (record.failures >= this.config.circuitBreakerThreshold) {
      record.circuitOpen = true;
      console.warn(`Circuit breaker opened for ${identifier} after ${record.failures} failures`);
    } else {
      // Apply exponential backoff
      const backoffMs = Math.min(
        Math.pow(this.config.backoffMultiplier, record.failures - 1) * 1000,
        this.config.maxBackoffMs
      );
      record.backoffUntil = now + backoffMs;
    }
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): {
    requestsRemaining: number;
    resetTime: number;
    circuitOpen: boolean;
    backoffActive: boolean;
  } {
    const record = this.limits.get(identifier);
    const now = Date.now();

    if (!record) {
      return {
        requestsRemaining: this.config.maxRequests,
        resetTime: 0,
        circuitOpen: false,
        backoffActive: false,
      };
    }

    const windowExpired = now > record.windowStart + this.config.windowMs;
    const requestsRemaining = windowExpired
      ? this.config.maxRequests
      : Math.max(0, this.config.maxRequests - record.count);

    return {
      requestsRemaining,
      resetTime: record.windowStart + this.config.windowMs,
      circuitOpen: record.circuitOpen,
      backoffActive: now < record.backoffUntil,
    };
  }

  /**
   * Reset limits for an identifier
   */
  reset(identifier: string) {
    this.limits.delete(identifier);
  }

  /**
   * Clear all limits
   */
  clearAll() {
    this.limits.clear();
  }
}

// Create specialized rate limiters for different operations
export const walletRateLimiter = new RateLimiter({
  maxRequests: 15, // Increased from 5 - allow more connection attempts
  windowMs: 60000, // 1 minute window
  circuitBreakerThreshold: 8, // Increased from 3 - be more lenient with failures
  circuitBreakerResetMs: 30000, // Reduced from 60s - faster recovery
});

export const blockchainRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  backoffMultiplier: 3,
  circuitBreakerThreshold: 5,
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000,
  backoffMultiplier: 2,
  maxBackoffMs: 20000,
});

/**
 * Wrapper for making rate-limited API calls
 */
export async function rateLimitedCall<T>(
  identifier: string,
  rateLimiter: RateLimiter,
  apiCall: () => Promise<T>,
  onRateLimited?: (retryAfter: number, reason: string) => void
): Promise<T | null> {
  const limitCheck = await rateLimiter.checkLimit(identifier);

  if (!limitCheck.allowed) {
    if (onRateLimited) {
      onRateLimited(limitCheck.retryAfter || 0, limitCheck.reason || 'Rate limited');
    }
    return null;
  }

  try {
    const result = await apiCall();
    rateLimiter.recordSuccess(identifier);
    return result;
  } catch (error) {
    rateLimiter.recordFailure(identifier);
    throw error;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for limiting call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default RateLimiter;