import { action } from "./_generated/server";
import { v } from "convex/values";
import { bech32 } from "bech32";
import {
  BLOCKFROST_CONFIG,
  MEK_POLICY_ID,
  getBlockfrostHeaders,
  rateLimiter,
  blockfrostCache,
  handleBlockfrostError,
  BlockfrostErrorType,
} from "./blockfrostConfig";

// Convert hex stake address to bech32 format using Cardano Serialization Library
function hexToBech32(hexAddress: string): string {
  try {
    // If already bech32, return as-is
    if (hexAddress.startsWith('stake1')) {
      console.log('[Blockfrost] Address already in bech32 format');
      return hexAddress;
    }

    // Log the input format for debugging
    console.log('[Blockfrost] Converting hex stake address:', {
      original: hexAddress.substring(0, 20) + '...',
      length: hexAddress.length,
      startsWithE1: hexAddress.startsWith('e1'),
      startsWithE0: hexAddress.startsWith('e0')
    });

    // Validate it's hex
    if (!/^[0-9a-fA-F]+$/.test(hexAddress)) {
      throw new Error(`Not a valid hex string. Contains invalid characters.`);
    }

    // Remove any '0x' prefix if present
    const cleanHex = hexAddress.replace(/^0x/, '');

    // Cardano stake address format: [network_byte][28_byte_credential]
    // 0xe0 = testnet (NetworkId = 0)
    // 0xe1 = mainnet (NetworkId = 1)
    // Total: 29 bytes (58 hex chars)

    if (cleanHex.length !== 58) {
      throw new Error(`Invalid stake address length: ${cleanHex.length} chars (expected 58)`);
    }

    // Extract network byte and credential
    const networkByte = parseInt(cleanHex.substring(0, 2), 16);
    const credentialHex = cleanHex.substring(2); // Remaining 56 chars (28 bytes)

    console.log('[Blockfrost] Parsed stake address:', {
      networkByte: '0x' + networkByte.toString(16),
      isMainnet: networkByte === 0xe1,
      isTestnet: networkByte === 0xe0,
      credentialLength: credentialHex.length
    });

    // Determine network ID
    let networkId: number;
    if (networkByte === 0xe1) {
      networkId = 1; // Mainnet
    } else if (networkByte === 0xe0) {
      networkId = 0; // Testnet
    } else {
      throw new Error(`Unknown network byte: 0x${networkByte.toString(16)}`);
    }

    // Convert entire hex string (including network byte) to bytes
    const fullBytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16))
    );

    // Convert bytes to 5-bit words for bech32 encoding
    const words = bech32.toWords(fullBytes);

    // Encode with 'stake' prefix (mainnet) or 'stake_test' (testnet)
    const prefix = networkId === 1 ? 'stake' : 'stake_test';
    const bech32Address = bech32.encode(prefix, words, 1000);

    console.log('[Blockfrost] Conversion successful:', {
      from: hexAddress.substring(0, 20) + '...',
      to: bech32Address.substring(0, 20) + '...',
      network: networkId === 1 ? 'mainnet' : 'testnet'
    });

    return bech32Address;
  } catch (error: any) {
    console.error('[Blockfrost] Error converting hex to bech32:', {
      error: error.message,
      errorStack: error.stack,
      input: hexAddress.substring(0, 30) + '...',
      inputLength: hexAddress.length
    });
    throw new Error(`Failed to convert stake address: ${error.message || error.toString()}`);
  }
}

// Interface for Blockfrost asset response
interface BlockfrostAsset {
  unit: string;
  quantity: string;
  asset?: string;
  asset_name?: string;
  policy_id?: string;
  fingerprint?: string;
  onchain_metadata?: any;
  metadata?: any;
}

// Interface for parsed Mek NFT
interface ParsedMek {
  assetId: string;
  policyId: string;
  assetName: string;
  mekNumber: number;
  quantity: number;
  fingerprint?: string;
  metadata?: any;
}

// Fetch NFTs from Blockfrost for a given stake address
export const fetchNFTsByStakeAddress = action({
  args: {
    stakeAddress: v.string(),
    useCache: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    meks: ParsedMek[];
    totalAssets: number;
    error?: string;
    cached?: boolean;
  }> => {
    try {
      // Convert hex stake address to bech32 format if needed
      const stakeAddress = hexToBech32(args.stakeAddress);
      console.log(`[Blockfrost] Converted stake address: ${args.stakeAddress.substring(0, 20)}... -> ${stakeAddress.substring(0, 20)}...`);

      const cacheKey = `stake_assets_${stakeAddress}`;

      // Check cache first
      if (args.useCache !== false) {
        const cached = blockfrostCache.get(cacheKey);
        if (cached) {
          console.log(`[Blockfrost] Returning cached data for ${stakeAddress}`);
          return {
            success: true,
            meks: cached.meks,
            totalAssets: cached.totalAssets,
            cached: true
          };
        }
      }

      // OPTIMIZATION: Use /accounts/{stake}/addresses/assets endpoint
      // This returns ALL assets for the stake address in ONE call (paginated)
      // Much faster than: fetch addresses → for each address fetch UTXOs → parse UTXOs
      const allAssets: BlockfrostAsset[] = [];
      const meks: ParsedMek[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        await rateLimiter.waitForSlot();

        const assetsUrl = `${BLOCKFROST_CONFIG.baseUrl}/accounts/${stakeAddress}/addresses/assets?page=${page}&count=100`;
        console.log(`[Blockfrost] Fetching assets page ${page}...`);

        const assetsResponse = await fetch(assetsUrl, {
          headers: getBlockfrostHeaders(),
          signal: AbortSignal.timeout(BLOCKFROST_CONFIG.timeout),
        });

        if (!assetsResponse.ok) {
          if (assetsResponse.status === 404) {
            // Stake address not found or has no assets
            console.log(`[Blockfrost] Stake address not found or no assets: ${stakeAddress}`);
            break;
          }
          await handleBlockfrostError(assetsResponse);
        }

        const assetBatch = await assetsResponse.json();
        console.log(`[Blockfrost] Page ${page}: ${assetBatch.length} assets`);

        // Process assets in this batch
        for (const asset of assetBatch) {
          // Asset format: { unit: "policyId+assetNameHex", quantity: "1" }
          allAssets.push(asset);

          // Check if this is a Mek NFT
          if (asset.unit && asset.unit.startsWith(MEK_POLICY_ID)) {
            const parsed = parseMekAsset(asset);
            if (parsed) {
              const exists = meks.some((m: any) => m.assetId === parsed.assetId);
              if (!exists) {
                meks.push(parsed);
              }
            }
          }
        }

        // Check if there are more pages
        hasMore = assetBatch.length === 100;
        page++;
      }

      // Cache the results
      const result = { meks, totalAssets: allAssets.length };
      blockfrostCache.set(cacheKey, result);

      console.log(`[Blockfrost] Found ${meks.length} Meks out of ${allAssets.length} total assets for ${stakeAddress}`);

      return {
        success: true,
        meks,
        totalAssets: allAssets.length,
        cached: false,
      };

    } catch (error: any) {
      console.error("[Blockfrost] Error fetching NFTs:", error);

      // Return specific error types
      if (error.type === BlockfrostErrorType.RateLimited) {
        return {
          success: false,
          meks: [],
          totalAssets: 0,
          error: "Rate limited. Please try again later.",
        };
      }

      if (error.type === BlockfrostErrorType.Unauthorized) {
        return {
          success: false,
          meks: [],
          totalAssets: 0,
          error: "Blockfrost API key is invalid or expired.",
        };
      }

      return {
        success: false,
        meks: [],
        totalAssets: 0,
        error: error.message || "Failed to fetch NFTs from blockchain",
      };
    }
  },
});

// Parse a Blockfrost asset into a Mek structure
function parseMekAsset(asset: BlockfrostAsset): ParsedMek | null {
  try {
    const unit = asset.unit;

    // Extract asset name hex from unit (policy ID + asset name)
    const assetNameHex = unit.replace(MEK_POLICY_ID, "");

    // Decode hex to string
    let assetName = "";
    for (let i = 0; i < assetNameHex.length; i += 2) {
      const hexByte = assetNameHex.substr(i, 2);
      const charCode = parseInt(hexByte, 16);

      // Only include printable ASCII characters
      if (charCode >= 32 && charCode <= 126) {
        assetName += String.fromCharCode(charCode);
      }
    }

    // Parse Mek number from name (e.g., "Mekanism0001" -> 1)
    const mekMatch = assetName.match(/Mekanism(\d+)/i);
    if (!mekMatch) {
      console.log(`[Blockfrost] Could not parse Mek number from: ${assetName}`);
      return null;
    }

    const mekNumber = parseInt(mekMatch[1], 10);
    if (isNaN(mekNumber) || mekNumber < 1 || mekNumber > 4000) {
      console.log(`[Blockfrost] Invalid Mek number: ${mekNumber}`);
      return null;
    }

    return {
      assetId: unit,
      policyId: MEK_POLICY_ID,
      assetName: `Mek #${mekNumber}`,
      mekNumber,
      quantity: parseInt(asset.quantity || "1", 10),
      fingerprint: asset.fingerprint,
      metadata: asset.onchain_metadata || asset.metadata,
    };
  } catch (error) {
    console.error("[Blockfrost] Error parsing Mek asset:", error);
    return null;
  }
}

// Fetch NFTs by payment address (alternative method)
export const fetchNFTsByAddress = action({
  args: {
    address: v.string(),
    useCache: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    meks: ParsedMek[];
    totalAssets: number;
    error?: string;
    cached?: boolean;
  }> => {
    try {
      const cacheKey = `addr_assets_${args.address}`;

      // Check cache first
      if (args.useCache !== false) {
        const cached = blockfrostCache.get(cacheKey);
        if (cached) {
          console.log(`[Blockfrost] Returning cached data for address ${args.address}`);
          return {
            success: true,
            meks: cached.meks,
            totalAssets: cached.totalAssets,
            cached: true
          };
        }
      }

      const allAssets: BlockfrostAsset[] = [];
      const meks: ParsedMek[] = [];

      // Pagination support
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        await rateLimiter.waitForSlot();

        const utxosUrl = `${BLOCKFROST_CONFIG.baseUrl}/addresses/${args.address}/utxos?page=${page}&count=100`;
        const utxosResponse = await fetch(utxosUrl, {
          headers: getBlockfrostHeaders(),
          signal: AbortSignal.timeout(BLOCKFROST_CONFIG.timeout),
        });

        if (!utxosResponse.ok) {
          if (utxosResponse.status === 404) {
            // Address has no UTXOs
            break;
          }
          await handleBlockfrostError(utxosResponse);
        }

        const utxos = await utxosResponse.json();

        // Extract assets from UTXOs
        for (const utxo of utxos) {
          if (utxo.amount && Array.isArray(utxo.amount)) {
            for (const asset of utxo.amount) {
              // Skip ADA
              if (asset.unit === "lovelace") continue;

              allAssets.push(asset);

              // Check if this is a Mek NFT
              if (asset.unit && asset.unit.startsWith(MEK_POLICY_ID)) {
                const parsed = parseMekAsset(asset);
                if (parsed) {
                  // Check if we already have this Mek
                  const exists = meks.some((m: any) => m.assetId === parsed.assetId);
                  if (!exists) {
                    meks.push(parsed);
                  }
                }
              }
            }
          }
        }

        // Check if there are more pages
        hasMore = utxos.length === 100;
        page++;
      }

      // Cache the results
      const result = { meks, totalAssets: allAssets.length };
      blockfrostCache.set(cacheKey, result);

      console.log(`[Blockfrost] Found ${meks.length} Meks out of ${allAssets.length} total assets for address`);

      return {
        success: true,
        meks,
        totalAssets: allAssets.length,
        cached: false,
      };

    } catch (error: any) {
      console.error("[Blockfrost] Error fetching NFTs by address:", error);
      return {
        success: false,
        meks: [],
        totalAssets: 0,
        error: error.message || "Failed to fetch NFTs from blockchain",
      };
    }
  },
});

// Clear the cache (admin function)
export const clearBlockfrostCache = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string }> => {
    blockfrostCache.clear();
    return {
      success: true,
      message: "Blockfrost cache cleared successfully",
    };
  },
});

// Get cache statistics
export const getBlockfrostCacheStats = action({
  args: {},
  handler: async (ctx): Promise<{ size: number; maxSize: number; ttl: number }> => {
    return {
      size: blockfrostCache.size(),
      maxSize: BLOCKFROST_CONFIG.cache.maxSize,
      ttl: BLOCKFROST_CONFIG.cache.ttl,
    };
  },
});

// Quick Mek count - ULTRA-FAST lookup using /accounts/{stake}/addresses/assets endpoint
// This is dramatically faster than scanning UTXOs - single API call per 100 assets!
// Used for immediate UI feedback before full data load
export const quickMekCount = action({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> => {
    try {
      console.log(`[Blockfrost-QuickCount] Starting FAST Mek count for ${args.stakeAddress.substring(0, 20)}...`);
      const startTime = Date.now();

      // Convert hex stake address to bech32 format if needed
      const stakeAddress = hexToBech32(args.stakeAddress);

      // Check cache first - if we have cached data, return count immediately
      const cacheKey = `stake_assets_${stakeAddress}`;
      const cached = blockfrostCache.get(cacheKey);
      if (cached) {
        console.log(`[Blockfrost-QuickCount] Cache hit! Returning ${cached.meks.length} Meks in ${Date.now() - startTime}ms`);
        return {
          success: true,
          count: cached.meks.length,
        };
      }

      // OPTIMIZATION: Use /accounts/{stake}/addresses/assets endpoint
      // This returns ALL assets for the stake address in ONE call (paginated)
      // Much faster than: fetch addresses → for each address fetch UTXOs → parse UTXOs
      const allAssets: any[] = [];
      const meks: ParsedMek[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        await rateLimiter.waitForSlot();

        const assetsUrl = `${BLOCKFROST_CONFIG.baseUrl}/accounts/${stakeAddress}/addresses/assets?page=${page}&count=100`;
        console.log(`[Blockfrost-QuickCount] Fetching assets page ${page}...`);

        const assetsResponse = await fetch(assetsUrl, {
          headers: getBlockfrostHeaders(),
          signal: AbortSignal.timeout(BLOCKFROST_CONFIG.timeout),
        });

        if (!assetsResponse.ok) {
          if (assetsResponse.status === 404) {
            // Stake address not found or has no assets
            console.log(`[Blockfrost-QuickCount] No assets found (404)`);
            break;
          }
          await handleBlockfrostError(assetsResponse);
        }

        const assetBatch = await assetsResponse.json();
        console.log(`[Blockfrost-QuickCount] Page ${page}: ${assetBatch.length} assets`);

        // Process assets in this batch
        for (const asset of assetBatch) {
          // Asset format: { unit: "policyId+assetNameHex", quantity: "1" }
          allAssets.push(asset);

          // Check if this is a Mek NFT
          if (asset.unit && asset.unit.startsWith(MEK_POLICY_ID)) {
            const parsed = parseMekAsset(asset);
            if (parsed) {
              const exists = meks.some((m: any) => m.assetId === parsed.assetId);
              if (!exists) {
                meks.push(parsed);
              }
            }
          }
        }

        // Check if there are more pages
        hasMore = assetBatch.length === 100;
        page++;
      }

      // CRITICAL: Cache the results so fetchNFTsByStakeAddress gets a cache hit!
      const result = { meks, totalAssets: allAssets.length };
      blockfrostCache.set(cacheKey, result);

      const elapsed = Date.now() - startTime;
      console.log(`[Blockfrost-QuickCount] Found ${meks.length} Meks in ${elapsed}ms using FAST endpoint (cached for Phase 2)`);

      return {
        success: true,
        count: meks.length,
      };

    } catch (error: any) {
      console.error("[Blockfrost-QuickCount] Error:", error);
      return {
        success: false,
        count: 0,
        error: error.message || "Failed to count Meks",
      };
    }
  },
});