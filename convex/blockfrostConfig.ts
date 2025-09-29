import { v } from "convex/values";

// Blockfrost API Configuration
export const BLOCKFROST_CONFIG = {
  // API Key for Cardano Mainnet
  apiKey: "mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW",

  // Base URL for Blockfrost API
  baseUrl: "https://cardano-mainnet.blockfrost.io/api/v0",

  // Rate limiting configuration
  rateLimit: {
    maxRequestsPerSecond: 10, // Blockfrost free tier limit
    maxRequestsPerDay: 50000, // Daily limit
    retryDelay: 1000, // Milliseconds to wait before retry
    maxRetries: 3,
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes TTL for NFT data
    maxSize: 1000, // Maximum number of cached entries
  },

  // Request timeout
  timeout: 30000, // 30 seconds
};

// Mek NFT Policy ID
export const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Error types for better error handling
export enum BlockfrostErrorType {
  RateLimited = "RATE_LIMITED",
  NetworkError = "NETWORK_ERROR",
  InvalidAddress = "INVALID_ADDRESS",
  NotFound = "NOT_FOUND",
  ServerError = "SERVER_ERROR",
  Unauthorized = "UNAUTHORIZED",
}

// Helper to create Blockfrost headers
export function getBlockfrostHeaders(): HeadersInit {
  return {
    "project_id": BLOCKFROST_CONFIG.apiKey,
    "Content-Type": "application/json",
  };
}

// Rate limiter state
class RateLimiter {
  private requestQueue: number[] = [];
  private dailyRequests = 0;
  private dailyResetTime: number;

  constructor() {
    const now = Date.now();
    this.dailyResetTime = now + (24 * 60 * 60 * 1000);
  }

  canMakeRequest(): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();

    // Reset daily counter if needed
    if (now > this.dailyResetTime) {
      this.dailyRequests = 0;
      this.dailyResetTime = now + (24 * 60 * 60 * 1000);
    }

    // Check daily limit
    if (this.dailyRequests >= BLOCKFROST_CONFIG.rateLimit.maxRequestsPerDay) {
      return {
        allowed: false,
        retryAfter: this.dailyResetTime - now,
      };
    }

    // Clean up old requests from queue (older than 1 second)
    this.requestQueue = this.requestQueue.filter(time => now - time < 1000);

    // Check per-second limit
    if (this.requestQueue.length >= BLOCKFROST_CONFIG.rateLimit.maxRequestsPerSecond) {
      const oldestRequest = this.requestQueue[0];
      return {
        allowed: false,
        retryAfter: 1000 - (now - oldestRequest),
      };
    }

    // Request allowed
    this.requestQueue.push(now);
    this.dailyRequests++;
    return { allowed: true };
  }

  async waitForSlot(): Promise<void> {
    const check = this.canMakeRequest();
    if (!check.allowed && check.retryAfter) {
      await new Promise(resolve => setTimeout(resolve, check.retryAfter));
      return this.waitForSlot();
    }
  }
}

// Export singleton rate limiter
export const rateLimiter = new RateLimiter();

// Simple in-memory cache
class Cache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any): void {
    if (!BLOCKFROST_CONFIG.cache.enabled) return;

    // Enforce max cache size
    if (this.cache.size >= BLOCKFROST_CONFIG.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + BLOCKFROST_CONFIG.cache.ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    if (!BLOCKFROST_CONFIG.cache.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton cache
export const blockfrostCache = new Cache();

// Error handler for Blockfrost responses
export async function handleBlockfrostError(response: Response): Promise<never> {
  const errorBody = await response.text();
  let errorMessage = `Blockfrost API error: ${response.status}`;
  let errorType = BlockfrostErrorType.ServerError;

  try {
    const errorJson = JSON.parse(errorBody);
    errorMessage = errorJson.message || errorMessage;

    // Map status codes to error types
    switch (response.status) {
      case 400:
        errorType = BlockfrostErrorType.InvalidAddress;
        break;
      case 402:
      case 403:
        errorType = BlockfrostErrorType.Unauthorized;
        break;
      case 404:
        errorType = BlockfrostErrorType.NotFound;
        break;
      case 418:
      case 425:
      case 429:
        errorType = BlockfrostErrorType.RateLimited;
        break;
      case 500:
      case 502:
      case 503:
        errorType = BlockfrostErrorType.ServerError;
        break;
    }
  } catch {
    // Could not parse error body
  }

  const error = new Error(errorMessage) as any;
  error.type = errorType;
  error.status = response.status;
  throw error;
}