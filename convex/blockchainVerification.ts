

import { action, internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { recalculateUserMekCount } from "./lib/userMekCountHelpers";

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

      // If verification succeeded, update the users table AND sync mek ownership
      if (verificationResult.verified) {
        console.log('[Verification] Marking wallet as verified...');
        try {
          // Mark user as verified
          await ctx.runMutation(api.blockchainVerification.markWalletAsVerified, {
            walletAddress: args.stakeAddress
          });
          console.log('[Verification] Successfully marked wallet as verified');

          // Phase II: Sync mek ownership to meks table
          console.log('[Verification] Syncing mek ownership to meks table...');
          const syncResult = await ctx.runMutation(api.blockchainVerification.syncMekOwnership, {
            stakeAddress: args.stakeAddress,
            verifiedMeks: blockchainMeks.map(m => ({
              assetId: m.assetId,
              assetName: m.assetName,
              mekNumber: m.mekNumber
            }))
          });
          console.log('[Verification] Mek ownership sync result:', syncResult);
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

// Phase II: Sync mek ownership to meks table
export const syncMekOwnership = mutation({
  args: {
    stakeAddress: v.string(),
    verifiedMeks: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      mekNumber: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    console.log('[🔄SYNC] Starting mek ownership sync for:', args.stakeAddress.substring(0, 20) + '...');
    console.log('[🔄SYNC] Verified meks count:', args.verifiedMeks.length);

    const now = Date.now();
    let updated = 0;
    let created = 0;
    let cleared = 0;

    // Track previous owners whose mekCount needs recalculation
    const affectedPreviousOwners = new Set<string>();

    // Get current meks owned by this stake address
    const currentlyOwnedMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    // Build set of verified mek numbers for comparison
    const verifiedMekNumbers = new Set(args.verifiedMeks.map(m => m.mekNumber));
    const currentMekNumbers = new Set(currentlyOwnedMeks.map(m => m.mekNumber).filter(n => n !== undefined));

    // 1. Update ownership for verified meks
    // Use the new by_mek_number index for reliable lookups
    for (const verifiedMek of args.verifiedMeks) {
      // Primary lookup: Use mekNumber index (the correct way)
      let existingMek = await ctx.db
        .query("meks")
        .withIndex("by_mek_number", (q: any) => q.eq("mekNumber", verifiedMek.mekNumber))
        .first();

      // Fallback: If mekNumber not populated yet, try legacy assetId lookup
      if (!existingMek) {
        const mekNumberStr = verifiedMek.mekNumber.toString();
        existingMek = await ctx.db
          .query("meks")
          .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekNumberStr))
          .first();
      }

      if (existingMek) {
        // Mek exists - update ownership if different
        if (existingMek.ownerStakeAddress !== args.stakeAddress) {
          // Track previous owner for mekCount update (if they had one)
          if (existingMek.ownerStakeAddress) {
            affectedPreviousOwners.add(existingMek.ownerStakeAddress);
          }

          // Ownership changed - reset accumulated gold for corp
          await ctx.db.patch(existingMek._id, {
            ownerStakeAddress: args.stakeAddress,
            owner: args.stakeAddress, // Keep legacy field in sync
            accumulatedGoldForCorp: 0, // Reset on ownership change
            lastUpdated: now,
          });
          updated++;
          console.log(`[🔄SYNC] Updated Mek #${verifiedMek.mekNumber} ownership`);
        }
      } else {
        // Mek doesn't exist in table - this shouldn't happen for the 4000 fixed NFTs
        console.warn(`[🔄SYNC] WARNING: Mek #${verifiedMek.mekNumber} not found in database`);
        created++;
      }
    }

    // 2. Clear ownership for meks no longer owned by this user
    for (const currentMek of currentlyOwnedMeks) {
      const currentMekNum = currentMek.mekNumber;
      if (currentMekNum !== undefined && !verifiedMekNumbers.has(currentMekNum)) {
        // User no longer owns this mek
        await ctx.db.patch(currentMek._id, {
          ownerStakeAddress: undefined,
          lastUpdated: now,
        });
        cleared++;
      }
    }

    // 3. Update mekCount for affected users
    // Always recalculate for the current user (their count may have changed)
    const newMekCount = await recalculateUserMekCount(ctx, args.stakeAddress);
    console.log(`[🔄SYNC] Updated mekCount for current user: ${newMekCount}`);

    // Recalculate for previous owners who lost meks to this user
    for (const previousOwner of affectedPreviousOwners) {
      const prevOwnerCount = await recalculateUserMekCount(ctx, previousOwner);
      console.log(`[🔄SYNC] Updated mekCount for previous owner ${previousOwner.substring(0, 15)}...: ${prevOwnerCount}`);
    }

    console.log('[🔄SYNC] Sync complete:', { updated, created, cleared, mekCount: newMekCount });

    return {
      success: true,
      updated,
      created,
      cleared,
      totalVerified: args.verifiedMeks.length,
      mekCount: newMekCount
    };
  }
});

// Phase II: Mark wallet as verified in users table (no goldMining fallback)
export const markWalletAsVerified = mutation({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    try {
      console.log('[markWalletAsVerified] Starting mutation for wallet:', args.walletAddress.substring(0, 20) + '...');

      if (!ctx || !ctx.db) {
        console.error('[markWalletAsVerified] CRITICAL: ctx or ctx.db is undefined!');
        throw new Error('Database context is not available');
      }

      const now = Date.now();

      // Phase II: Find user by stake address
      const user = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", args.walletAddress))
        .first();

      if (!user) {
        console.warn(`[markWalletAsVerified] WARNING: No user found for wallet ${args.walletAddress.substring(0, 20)}...`);
        return {
          success: false,
          error: 'No user record found - wallet needs registration first'
        };
      }

      // Phase II: Update user's walletVerified status
      const wasAlreadyVerified = user.walletVerified === true;
      await ctx.db.patch(user._id, {
        walletVerified: true,
        updatedAt: now,
      });

      console.log(`[markWalletAsVerified] SUCCESS: Marked wallet ${args.walletAddress.substring(0, 20)}... as verified`);

      return {
        success: true,
        wasAlreadyVerified,
        source: 'usersTable'
      };
    } catch (error: any) {
      console.error('[markWalletAsVerified] ERROR during mutation:', error);
      throw error;
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