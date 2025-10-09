// Refactored Blockchain Verification - Modular architecture with clear separation of concerns
// Uses service layer pattern for better testability and maintainability

import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { fetchNFTsForWallet, NFTFetchErrorType } from "./lib/nftFetchingService";
import { verifyNFTOwnership, calculateVerificationConfidence } from "./lib/verificationService";

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const verificationCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting configuration
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Verification result interface
interface VerificationActionResult {
  success: boolean;
  verified: boolean;
  source?: 'blockfrost' | 'koios';
  timestamp: number;
  walletReportedCount: number;
  blockchainVerifiedCount: number;
  falsePositives?: any[];
  missingMeks?: any[];
  verifiedMeks?: any[];
  error?: string;
  userMessage?: string;
  retryable?: boolean;
  retryAfter?: number;
  confidence?: number;
}

// Check rate limit
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(identifier);

  if (!limit || now > limit.resetTime) {
    rateLimiter.set(identifier, {
      count: 1,
      resetTime: now + RATE_WINDOW
    });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

// Main verification action - orchestrates fetching and verification
export const verifyNFTOwnershipV2 = action({
  args: {
    stakeAddress: v.string(),
    paymentAddress: v.optional(v.string()),
    walletReportedMeks: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      mekNumber: v.number()
    }))
  },
  handler: async (ctx, args): Promise<VerificationActionResult> => {
    console.log('[VerificationV2] Starting verification for wallet:', args.stakeAddress.substring(0, 20) + '...');
    console.log('[VerificationV2] Wallet reported MEKs:', args.walletReportedMeks.length);

    // 1. Rate limit check
    if (!checkRateLimit(args.stakeAddress)) {
      console.error('[VerificationV2] Rate limit exceeded');
      return {
        success: false,
        verified: false,
        timestamp: Date.now(),
        walletReportedCount: args.walletReportedMeks.length,
        blockchainVerifiedCount: 0,
        error: 'Rate limit exceeded',
        userMessage: 'Too many verification requests. Please wait 1 minute before trying again.',
        retryable: true,
        retryAfter: 60000
      };
    }

    // 2. Check cache
    const cacheKey = `verify_${args.stakeAddress}`;
    const cached = verificationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[VerificationV2] Returning cached verification result');
      return cached.data;
    }

    try {
      // 3. Fetch NFTs from blockchain (service layer handles errors and fallbacks)
      console.log('[VerificationV2] Fetching NFTs from blockchain...');
      const fetchResult = await fetchNFTsForWallet(ctx, args.stakeAddress, args.paymentAddress);

      if (!fetchResult.success) {
        // Return structured error from fetching service
        const errorResult: VerificationActionResult = {
          success: false,
          verified: false,
          timestamp: Date.now(),
          walletReportedCount: args.walletReportedMeks.length,
          blockchainVerifiedCount: 0,
          error: fetchResult.error.message,
          userMessage: fetchResult.error.userMessage,
          retryable: fetchResult.error.retryable,
          retryAfter: fetchResult.error.retryAfter
        };

        // Cache failed results to prevent spam (but shorter TTL)
        verificationCache.set(cacheKey, {
          data: errorResult,
          timestamp: Date.now()
        });

        return errorResult;
      }

      console.log('[VerificationV2] Blockchain returned', fetchResult.meks.length, 'MEKs');

      // 4. Verify ownership (compare wallet-reported vs blockchain-verified)
      console.log('[VerificationV2] Verifying ownership...');
      const verificationResult = verifyNFTOwnership(args.walletReportedMeks, fetchResult.meks);

      // 5. Calculate confidence score
      const confidence = calculateVerificationConfidence(verificationResult);

      // 6. Build result
      const actionResult: VerificationActionResult = {
        success: true,
        verified: verificationResult.verified,
        source: fetchResult.source,
        timestamp: Date.now(),
        walletReportedCount: verificationResult.walletReportedCount,
        blockchainVerifiedCount: verificationResult.blockchainVerifiedCount,
        falsePositives: verificationResult.falsePositives,
        missingMeks: verificationResult.missingMeks,
        verifiedMeks: verificationResult.verifiedMeks,
        confidence
      };

      // Add user-friendly message if verification failed
      if (!verificationResult.verified) {
        actionResult.userMessage = verificationResult.discrepancyDetails?.summary ||
          'Verification failed: NFT counts do not match blockchain';
      }

      console.log('[VerificationV2] ========== VERIFICATION RESULT ==========');
      console.log('[VerificationV2] Verified:', actionResult.verified);
      console.log('[VerificationV2] Confidence:', confidence + '%');
      console.log('[VerificationV2] Wallet reported:', actionResult.walletReportedCount);
      console.log('[VerificationV2] Blockchain found:', actionResult.blockchainVerifiedCount);
      console.log('[VerificationV2] ==========================================');

      // 7. Cache the result
      verificationCache.set(cacheKey, {
        data: actionResult,
        timestamp: Date.now()
      });

      // 8. Store verification in audit log
      try {
        await ctx.runMutation(api.auditLogs.logVerification, {
          stakeAddress: args.stakeAddress,
          verified: actionResult.verified,
          source: actionResult.source || 'unknown',
          walletCount: actionResult.walletReportedCount,
          blockchainCount: actionResult.blockchainVerifiedCount,
          timestamp: actionResult.timestamp
        });
      } catch (auditError) {
        console.error('[VerificationV2] Failed to log audit (non-fatal):', auditError);
        // Don't fail verification just because audit logging failed
      }

      // 9. If verification succeeded, mark wallet as verified (SEPARATED from snapshot)
      if (actionResult.verified) {
        try {
          // Actions CAN call mutations directly via ctx.runMutation (this is correct!)
          await ctx.runMutation(api.blockchainVerificationRefactored.markWalletAsVerified, {
            walletAddress: args.stakeAddress
          });
          console.log('[VerificationV2] Marked wallet as verified');
        } catch (updateError) {
          console.error('[VerificationV2] Failed to mark wallet as verified (non-fatal):', updateError);
          // Don't fail the entire verification if just the update fails
        }
      }

      return actionResult;

    } catch (error: any) {
      console.error('[VerificationV2] Unexpected error during verification:', error);

      const errorResult: VerificationActionResult = {
        success: false,
        verified: false,
        timestamp: Date.now(),
        walletReportedCount: args.walletReportedMeks.length,
        blockchainVerifiedCount: 0,
        error: error.message || 'Unexpected verification error',
        userMessage: 'An unexpected error occurred during verification. Please try again.',
        retryable: true
      };

      // Cache failed results
      verificationCache.set(cacheKey, {
        data: errorResult,
        timestamp: Date.now()
      });

      return errorResult;
    }
  }
});

// Mark wallet as verified - SEPARATED from snapshot logic
// This ONLY updates verification status, does NOT trigger snapshot
export const markWalletAsVerified = mutation({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    console.log('[VerificationV2] Marking wallet as verified:', args.walletAddress.substring(0, 20) + '...');

    try {
      // Defensive check for ctx
      if (!ctx || !ctx.db) {
        throw new Error('Database context is not available');
      }

      const goldMiningRecord = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (!goldMiningRecord) {
        console.warn('[VerificationV2] No goldMining record found - wallet needs initialization first');
        return {
          success: false,
          error: 'Wallet not initialized in goldMining table'
        };
      }

      const now = Date.now();

      // Update ONLY verification fields - do NOT touch snapshot fields
      await ctx.db.patch(goldMiningRecord._id, {
        isBlockchainVerified: true,
        lastVerificationTime: now,
        // NOTE: We do NOT update lastSnapshotTime here
        // Snapshots are handled separately by the snapshot scheduler
      });

      console.log('[VerificationV2] Successfully marked wallet as verified');
      console.log('[VerificationV2] Gold will accumulate from current balance:', (goldMiningRecord.accumulatedGold || 0).toFixed(2));

      return {
        success: true,
        wasAlreadyVerified: goldMiningRecord.isBlockchainVerified === true
      };

    } catch (error: any) {
      console.error('[VerificationV2] Error marking wallet as verified:', error);
      throw error; // Re-throw to let caller handle
    }
  }
});

// Get verification status for a wallet (cached)
export const getVerificationStatusV2 = action({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    // Check cache
    const cacheKey = `verify_${args.stakeAddress}`;
    const cached = verificationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        hasRecentVerification: true,
        lastVerified: cached.timestamp,
        verified: cached.data.verified,
        source: cached.data.source,
        cached: true
      };
    }

    // Check database for last verification
    try {
      const lastVerification = await ctx.runQuery(api.auditLogs.getLastVerification, {
        stakeAddress: args.stakeAddress
      });

      if (lastVerification) {
        return {
          hasRecentVerification: Date.now() - lastVerification.timestamp < CACHE_TTL,
          lastVerified: lastVerification.timestamp,
          verified: lastVerification.verified,
          source: lastVerification.source,
          cached: false
        };
      }
    } catch (error) {
      console.error('[VerificationV2] Error checking audit logs:', error);
    }

    return {
      hasRecentVerification: false,
      lastVerified: null,
      verified: false,
      source: null,
      cached: false
    };
  }
});

// Clear verification cache (admin function)
export const clearVerificationCache = action({
  args: {},
  handler: async (ctx) => {
    const size = verificationCache.size;
    verificationCache.clear();
    console.log('[VerificationV2] Cleared verification cache:', size, 'entries');
    return {
      success: true,
      clearedEntries: size
    };
  }
});
