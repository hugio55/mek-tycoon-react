

import { action, internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// API Configuration
const BLOCKFROST_API_URL = "https://cardano-mainnet.blockfrost.io/api/v0";
const KOIOS_API_URL = "https://api.koios.rest/api/v1";

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const verificationCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Verification timeout for large collections
const VERIFICATION_TIMEOUT = 180000; // 3 minutes max - handles large collections and slow networks

// Timeout wrapper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
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

// Blockfrost request with error handling
async function blockfrostRequest(endpoint: string): Promise<any> {
  const apiKey = process.env.BLOCKFROST_API_KEY;

  if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
    throw new Error('Blockfrost API key not configured');
  }

  try {
    const response = await fetch(`${BLOCKFROST_API_URL}${endpoint}`, {
      headers: {
        'project_id': apiKey
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Blockfrost error: ${response.status} - ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('Blockfrost request failed:', error);
    throw error;
  }
}

// Koios fallback request
async function koiosRequest(endpoint: string, body?: any): Promise<any> {
  try {
    const response = await fetch(`${KOIOS_API_URL}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Koios error: ${response.status} - ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('Koios request failed:', error);
    throw error;
  }
}

// Verify NFT ownership using Blockfrost with Koios fallback
export const verifyNFTOwnership = action({
  args: {
    stakeAddress: v.string(),
    paymentAddress: v.optional(v.string()),
    walletReportedMeks: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      mekNumber: v.number()
    }))
  },
  handler: async (ctx, args) => {
    console.log('[Verification] Received request for stake address:', args.stakeAddress);
    if (args.paymentAddress) {
      console.log('[Verification] Payment address provided:', args.paymentAddress.substring(0, 20) + '...');
    }
    console.log('[Verification] Wallet reported MEKs:', args.walletReportedMeks.length);

    // Check rate limit
    if (!checkRateLimit(args.stakeAddress)) {
      console.error('[Verification] Rate limit exceeded');
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before retrying.',
        verified: false
      };
    }

    // Check cache first
    const cacheKey = `verify_${args.stakeAddress}`;
    const cached = verificationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Verification] Returning cached verification result');
      return cached.data;
    }

    try {
      // First try Blockfrost
      let blockchainMeks: any[] = [];
      let source = 'blockfrost';

      try {
        console.log('[Verification] Fetching assets from Blockfrost for:', args.stakeAddress);
        console.log('[Verification] Large collection detected, using extended timeout (3min)');

        // Wrap in timeout protection
        const result = await withTimeout(
          ctx.runAction(api.blockfrostService.getWalletAssets, {
            stakeAddress: args.stakeAddress,
            paymentAddress: args.paymentAddress
          }),
          VERIFICATION_TIMEOUT,
          `Verification timed out after ${VERIFICATION_TIMEOUT / 1000}s. This may happen with very large collections (200+ NFTs). Please try again.`
        );

        console.log('[Verification] Blockfrost result:', result);

        if (result.success && result.meks) {
          blockchainMeks = result.meks;
          console.log('[Verification] Found', blockchainMeks.length, 'MEKs on blockchain via Blockfrost');
        } else {
          console.error('[Verification] Blockfrost failed:', result.error);
          throw new Error('Blockfrost verification failed');
        }
      } catch (blockfrostError) {
        console.log('[Verification] Blockfrost failed, trying Koios fallback');

        // Fallback to Koios
        try {
          // Convert stake address format if needed
          let stakeAddr = args.stakeAddress;
          if (!stakeAddr.startsWith('stake')) {
            stakeAddr = `stake1${stakeAddr}`;
          }

          // Get account assets from Koios
          const koiosResult = await koiosRequest('/account_assets', {
            _stake_addresses: [stakeAddr]
          });

          if (koiosResult && koiosResult.length > 0) {
            const assets = koiosResult[0].asset_list || [];

            blockchainMeks = assets
              .filter((asset: any) => asset.policy_id === MEK_POLICY_ID)
              .map((asset: any) => {
                const assetName = Buffer.from(asset.asset_name || '', 'hex').toString('utf8');
                const mekNumber = parseInt(assetName.replace(/[^0-9]/g, ''));

                return {
                  assetId: asset.policy_id + asset.asset_name,
                  assetName,
                  mekNumber,
                  quantity: parseInt(asset.quantity)
                };
              })
              .filter((mek: any) => !isNaN(mek.mekNumber));

            source = 'koios';
          }
        } catch (koiosError) {
          console.error('Both Blockfrost and Koios failed:', koiosError);
          throw new Error('All verification services failed');
        }
      }

      // Compare wallet-reported with blockchain truth
      console.log('[Verification] Comparing wallet-reported vs blockchain MEKs');
      const walletMekIds = new Set(args.walletReportedMeks.map((m: any) => m.assetId));
      const blockchainMekIds = new Set(blockchainMeks.map((m: any) => m.assetId));

      console.log('[Verification] Wallet MEK IDs:', Array.from(walletMekIds));
      console.log('[Verification] Blockchain MEK IDs:', Array.from(blockchainMekIds));

      // Find discrepancies
      const falsePositives = args.walletReportedMeks.filter(
        m => !blockchainMekIds.has(m.assetId)
      );

      const missingMeks = blockchainMeks.filter(
        m => !walletMekIds.has(m.assetId)
      );

      console.log('[Verification] False positives (claimed but not on blockchain):', falsePositives.length);
      console.log('[Verification] Missing MEKs (on blockchain but not reported):', missingMeks.length);

      const verificationResult = {
        success: true,
        verified: falsePositives.length === 0 && missingMeks.length === 0,
        source,
        timestamp: Date.now(),
        walletReportedCount: args.walletReportedMeks.length,
        blockchainVerifiedCount: blockchainMeks.length,
        falsePositives,
        missingMeks,
        verifiedMeks: blockchainMeks
      };

      console.log('[Verification] ========== VERIFICATION RESULT ==========');
      console.log('[Verification] Verified:', verificationResult.verified);
      console.log('[Verification] Wallet reported:', verificationResult.walletReportedCount);
      console.log('[Verification] Blockchain found:', verificationResult.blockchainVerifiedCount);
      console.log('[Verification] ==========================================');

      // Cache the result
      verificationCache.set(cacheKey, {
        data: verificationResult,
        timestamp: Date.now()
      });

      // Store verification in database for audit
      await ctx.runMutation(api.auditLogs.logVerification, {
        stakeAddress: args.stakeAddress,
        verified: verificationResult.verified,
        source: verificationResult.source,
        walletCount: verificationResult.walletReportedCount,
        blockchainCount: verificationResult.blockchainVerifiedCount,
        timestamp: verificationResult.timestamp
      });

      // If verification succeeded, update the goldMining record
      if (verificationResult.verified) {
        console.log('[Verification] Marking wallet as verified...');
        try {
          await ctx.runMutation(api.blockchainVerification.markWalletAsVerified, {
            walletAddress: args.stakeAddress
          });
          console.log('[Verification] Successfully marked wallet as verified');
        } catch (mutationError: any) {
          console.error('[Verification] Failed to mark wallet as verified:', mutationError);
          console.error('[Verification] Error details:', {
            message: mutationError.message,
            stack: mutationError.stack,
            name: mutationError.name
          });
          // Return error to user instead of silently failing
          return {
            success: false,
            verified: false,
            error: `Verification succeeded but database update failed: ${mutationError.message}`,
            timestamp: Date.now()
          };
        }
      }

      return verificationResult;

    } catch (error: any) {
      console.error('[Verification] Top-level error:', error);
      console.error('[Verification] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        stakeAddress: args.stakeAddress.substring(0, 20) + '...'
      });

      const errorResult = {
        success: false,
        verified: false,
        error: error.message || 'Verification failed',
        timestamp: Date.now()
      };

      // Cache even failed results to prevent spam
      verificationCache.set(cacheKey, {
        data: errorResult,
        timestamp: Date.now()
      });

      return errorResult;
    }
  }
});

// Batch verify multiple wallets
export const batchVerifyWallets = action({
  args: {
    wallets: v.array(v.object({
      stakeAddress: v.string(),
      meks: v.array(v.object({
        assetId: v.string(),
        assetName: v.string(),
        mekNumber: v.number()
      }))
    }))
  },
  handler: async (ctx, args): Promise<{ success: boolean; verifications: any[]; totalWallets: number; verifiedCount: number }> => {
    const results: any[] = [];

    for (const wallet of args.wallets) {
      const result: any = await ctx.runAction(api.blockchainVerification.verifyNFTOwnership, {
        stakeAddress: wallet.stakeAddress,
        walletReportedMeks: wallet.meks
      });

      results.push({
        stakeAddress: wallet.stakeAddress,
        ...result
      });

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      verifications: results,
      totalWallets: args.wallets.length,
      verifiedCount: results.filter((r: any) => r.verified).length
    };
  }
});

// Mark wallet as verified in goldMining table
export const markWalletAsVerified = mutation({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    try {
      console.log('[markWalletAsVerified] Starting mutation for wallet:', args.walletAddress.substring(0, 20) + '...');

      if (!ctx || !ctx.db) {
        console.error('[markWalletAsVerified] CRITICAL: ctx or ctx.db is undefined!', {
          hasCtx: !!ctx,
          hasDb: ctx ? !!ctx.db : false
        });
        throw new Error('Database context is not available');
      }

      console.log('[markWalletAsVerified] Querying goldMining table...');
      const goldMiningRecord = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (goldMiningRecord) {
        console.log('[markWalletAsVerified] Found goldMining record:', {
          id: goldMiningRecord._id,
          wallet: args.walletAddress.substring(0, 20) + '...',
          currentVerificationStatus: goldMiningRecord.isBlockchainVerified,
          accumulatedGold: goldMiningRecord.accumulatedGold
        });

        const now = Date.now();
        console.log('[markWalletAsVerified] Patching record to mark as verified...');
        await ctx.db.patch(goldMiningRecord._id, {
          isBlockchainVerified: true,
          lastVerificationTime: now,
        });

        console.log(`[markWalletAsVerified] SUCCESS: Marked wallet ${args.walletAddress.substring(0, 20)}... as verified - gold will continue from ${(goldMiningRecord.accumulatedGold || 0).toFixed(2)}`);

        return {
          success: true,
          wasAlreadyVerified: goldMiningRecord.isBlockchainVerified === true
        };
      } else {
        console.warn(`[markWalletAsVerified] WARNING: No goldMining record found for wallet ${args.walletAddress.substring(0, 20)}...`);
        console.warn('[markWalletAsVerified] This means the wallet has not been initialized yet. This is expected for new wallets.');

        return {
          success: false,
          error: 'No goldMining record found - wallet needs initialization first'
        };
      }
    } catch (error: any) {
      console.error('[markWalletAsVerified] ERROR during mutation:', error);
      console.error('[markWalletAsVerified] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        wallet: args.walletAddress.substring(0, 20) + '...'
      });
      throw error; // Re-throw to let the action handler catch it
    }
  }
});

// Get verification status for a wallet
export const getVerificationStatus = action({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args): Promise<{ hasRecentVerification: boolean; lastVerified: number | null; verified: boolean; source: string | null }> => {
    // Check if we have a recent verification
    const cacheKey = `verify_${args.stakeAddress}`;
    const cached = verificationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        hasRecentVerification: true,
        lastVerified: cached.timestamp,
        verified: cached.data.verified,
        source: cached.data.source
      };
    }

    // Check database for last verification
    const lastVerification: any = await ctx.runQuery(api.auditLogs.getLastVerification, {
      stakeAddress: args.stakeAddress
    });

    if (lastVerification) {
      return {
        hasRecentVerification: Date.now() - lastVerification.timestamp < CACHE_TTL,
        lastVerified: lastVerification.timestamp,
        verified: lastVerification.verified,
        source: lastVerification.source
      };
    }

    return {
      hasRecentVerification: false,
      lastVerified: null,
      verified: false,
      source: null
    };
  }
});