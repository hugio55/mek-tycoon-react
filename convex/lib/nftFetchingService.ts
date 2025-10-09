// NFT Fetching Service - Pure blockchain data retrieval
// Separated from verification and snapshot logic for single responsibility

import { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";

// Result types for structured error handling
export type NFTFetchResult =
  | { success: true; meks: ParsedMek[]; source: 'blockfrost' | 'koios' }
  | { success: false; error: NFTFetchError };

export interface ParsedMek {
  assetId: string;
  assetName: string;
  mekNumber: number;
  quantity?: number;
  metadata?: any;
}

// Structured error types for better error handling
export enum NFTFetchErrorType {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export interface NFTFetchError {
  type: NFTFetchErrorType;
  message: string;
  userMessage: string; // User-friendly message
  retryable: boolean;
  retryAfter?: number; // milliseconds
  details?: any;
}

// Timeout configuration
const FETCH_TIMEOUT = 45000; // 45 seconds for large collections

// Fetch NFTs with proper error handling and fallback
export async function fetchNFTsForWallet(
  ctx: ActionCtx,
  stakeAddress: string,
  paymentAddress?: string
): Promise<NFTFetchResult> {
  // Validate inputs
  if (!stakeAddress) {
    return {
      success: false,
      error: {
        type: NFTFetchErrorType.INVALID_ADDRESS,
        message: 'Stake address is required',
        userMessage: 'No wallet address provided. Please connect your wallet.',
        retryable: false,
      }
    };
  }

  try {
    // Try Blockfrost first (primary source)
    const blockfrostResult = await fetchFromBlockfrost(ctx, stakeAddress, paymentAddress);
    if (blockfrostResult.success) {
      return blockfrostResult;
    }

    // Log Blockfrost failure
    console.warn('[NFTFetchService] Blockfrost failed, trying Koios fallback:', blockfrostResult.error);

    // Fallback to Koios
    const koiosResult = await fetchFromKoios(ctx, stakeAddress);
    if (koiosResult.success) {
      return koiosResult;
    }

    // Both services failed - return most user-friendly error
    console.error('[NFTFetchService] All services failed:', {
      blockfrost: blockfrostResult.error,
      koios: koiosResult.error
    });

    return {
      success: false,
      error: chooseUserFriendlyError(blockfrostResult.error, koiosResult.error)
    };

  } catch (error: any) {
    console.error('[NFTFetchService] Unexpected error:', error);
    return {
      success: false,
      error: {
        type: NFTFetchErrorType.NETWORK_ERROR,
        message: error.message || 'Unknown error',
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        details: error
      }
    };
  }
}

// Fetch from Blockfrost with timeout protection
async function fetchFromBlockfrost(
  ctx: ActionCtx,
  stakeAddress: string,
  paymentAddress?: string
): Promise<NFTFetchResult> {
  try {
    // Use timeout wrapper
    const result = await withTimeout(
      ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress,
        useCache: false // Always fetch fresh during verification
      }),
      FETCH_TIMEOUT
    );

    if (!result.success) {
      return {
        success: false,
        error: mapBlockfrostError(result.error)
      };
    }

    return {
      success: true,
      meks: result.meks,
      source: 'blockfrost'
    };

  } catch (error: any) {
    // Handle timeout
    if (error.name === 'TimeoutError') {
      return {
        success: false,
        error: {
          type: NFTFetchErrorType.TIMEOUT,
          message: `Blockfrost request timed out after ${FETCH_TIMEOUT / 1000}s`,
          userMessage: 'The blockchain query is taking longer than expected. Large collections (200+ NFTs) may require multiple attempts. Please try again.',
          retryable: true,
          retryAfter: 5000 // Suggest retry after 5 seconds
        }
      };
    }

    return {
      success: false,
      error: {
        type: NFTFetchErrorType.API_ERROR,
        message: error.message || 'Blockfrost API failed',
        userMessage: 'Unable to connect to blockchain service. Please try again.',
        retryable: true,
        details: error
      }
    };
  }
}

// Fetch from Koios (fallback)
async function fetchFromKoios(
  ctx: ActionCtx,
  stakeAddress: string
): Promise<NFTFetchResult> {
  // TODO: Implement Koios fallback when needed
  // For now, return not implemented
  return {
    success: false,
    error: {
      type: NFTFetchErrorType.API_ERROR,
      message: 'Koios fallback not yet implemented',
      userMessage: 'Primary blockchain service unavailable. Please try again later.',
      retryable: true
    }
  };
}

// Timeout wrapper utility
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);
    })
  ]);
}

// Map Blockfrost error messages to structured errors
function mapBlockfrostError(errorMessage?: string): NFTFetchError {
  if (!errorMessage) {
    return {
      type: NFTFetchErrorType.API_ERROR,
      message: 'Unknown Blockfrost error',
      userMessage: 'Blockchain service error. Please try again.',
      retryable: true
    };
  }

  // Rate limited
  if (errorMessage.toLowerCase().includes('rate limit')) {
    return {
      type: NFTFetchErrorType.RATE_LIMITED,
      message: errorMessage,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
      retryAfter: 60000 // 1 minute
    };
  }

  // Not found
  if (errorMessage.toLowerCase().includes('not found') || errorMessage.includes('404')) {
    return {
      type: NFTFetchErrorType.NOT_FOUND,
      message: errorMessage,
      userMessage: 'Wallet address not found on blockchain. Please verify your wallet is connected correctly.',
      retryable: false
    };
  }

  // Generic API error
  return {
    type: NFTFetchErrorType.API_ERROR,
    message: errorMessage,
    userMessage: 'Blockchain service error. Please try again.',
    retryable: true
  };
}

// Choose the most user-friendly error message
function chooseUserFriendlyError(error1: NFTFetchError, error2: NFTFetchError): NFTFetchError {
  // Prefer more specific errors over generic ones
  if (error1.type === NFTFetchErrorType.NOT_FOUND) return error1;
  if (error2.type === NFTFetchErrorType.NOT_FOUND) return error2;

  if (error1.type === NFTFetchErrorType.RATE_LIMITED) return error1;
  if (error2.type === NFTFetchErrorType.RATE_LIMITED) return error2;

  if (error1.type === NFTFetchErrorType.TIMEOUT) return error1;
  if (error2.type === NFTFetchErrorType.TIMEOUT) return error2;

  // Default to first error
  return error1;
}
