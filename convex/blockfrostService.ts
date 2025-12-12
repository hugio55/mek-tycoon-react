
import { action } from "./_generated/server";
import { v } from "convex/values";
import { bech32 } from "bech32";
import { BLOCKFROST_CONFIG, MEK_POLICY_ID, rateLimiter } from "./blockfrostConfig";

// Blockfrost API configuration from shared config
const BLOCKFROST_API_URL = BLOCKFROST_CONFIG.baseUrl;

// Convert hex stake address to bech32 format using Cardano Serialization Library
function hexToBech32(hexAddress: string): string {
  try {
    // If already bech32, return as-is
    if (hexAddress.startsWith('stake1')) {
      return hexAddress;
    }

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

    console.log('Converted hex to bech32:', {
      from: hexAddress.substring(0, 20) + '...',
      to: bech32Address.substring(0, 20) + '...',
      network: networkId === 1 ? 'mainnet' : 'testnet'
    });

    return bech32Address;
  } catch (error: any) {
    console.error('Error converting hex to bech32:', {
      error: error.message,
      input: hexAddress.substring(0, 30) + '...'
    });
    throw new Error(`Failed to convert stake address: ${error.message || error.toString()}`);
  }
}

// Make a request to Blockfrost API
async function blockfrostRequest(endpoint: string): Promise<any> {
  const apiKey = BLOCKFROST_CONFIG.apiKey;

  if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
    throw new Error('Blockfrost API key not configured');
  }

  const response = await fetch(`${BLOCKFROST_API_URL}${endpoint}`, {
    headers: {
      'project_id': apiKey
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Blockfrost API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get all assets (including NFTs) from a wallet address
export const getWalletAssets = action({
  args: {
    stakeAddress: v.string(),
    paymentAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Convert hex to bech32 if needed
      let stakeAddress = args.stakeAddress;
      if (!stakeAddress.startsWith('stake')) {
        console.log('Converting hex address to bech32:', stakeAddress);
        stakeAddress = hexToBech32(stakeAddress);
        console.log('Converted to:', stakeAddress);
      }

      console.log('Fetching assets for stake address:', stakeAddress);
      if (args.paymentAddress) {
        console.log('Also have payment address:', args.paymentAddress.substring(0, 20) + '...');
      }

      // Try to get addresses associated with stake address first (WITH PAGINATION!)
      let addresses = [];
      try {
        let addressPage = 1;
        let hasMoreAddresses = true;

        while (hasMoreAddresses) {
          await rateLimiter.waitForSlot();
          const addressBatch = await blockfrostRequest(`/accounts/${stakeAddress}/addresses?page=${addressPage}&count=100`);

          addresses.push(...addressBatch);

          // Check if there are more pages
          hasMoreAddresses = addressBatch.length === 100;
          addressPage++;

          if (hasMoreAddresses) {
            console.log(`Fetched ${addresses.length} addresses so far, fetching more...`);
          }
        }
      } catch (addressError) {
        console.error('Error fetching addresses:', addressError);
        addresses = [];
      }
      console.log(`Found ${addresses.length} addresses for stake account`);

      // If no addresses found via stake address, try the payment address directly
      if (addresses.length === 0 && args.paymentAddress) {
        console.log('No addresses from stake account, trying payment address directly');
        addresses = [{ address: args.paymentAddress }];
      }

      const allMeks: any[] = [];
      const seenAssetIds = new Set<string>();

      // For each address, get the assets with pagination support
      for (const addressInfo of addresses) {
        const address = addressInfo.address;

        try {
          let page = 1;
          let hasMorePages = true;
          const maxPages = 50; // Safety limit: 50 pages * 100 items = 5000 UTXOs max

          // Fetch all pages of UTXOs
          while (hasMorePages && page <= maxPages) {
            console.log(`Fetching UTXOs for ${address.substring(0, 20)}... (page ${page})`);

            // Wait for rate limit slot before making request
            await rateLimiter.waitForSlot();

            // Get assets with pagination
            const assets = await blockfrostRequest(`/addresses/${address}/utxos?page=${page}&count=100`);

            // If we got less than 100 items, this is the last page
            if (!assets || assets.length === 0) {
              hasMorePages = false;
              break;
            }

            if (assets.length < 100) {
              hasMorePages = false;
            }

            // Check each UTXO for MEK NFTs
            for (const utxo of assets) {
              if (utxo.amount) {
                for (const amount of utxo.amount) {
                  const unit = amount.unit;

                  // Check if this is a MEK NFT
                  if (unit && unit.startsWith(MEK_POLICY_ID)) {
                    // ⚠️ NOTE: assetId here is FULL Blockfrost unit (policyId + hex)
                    // This is NOT the same format as database meks.assetId (which is just mekNumber)
                    // For DB queries, use: mekNumber.toString() NOT this assetId
                    const assetId = unit;

                    // Skip if we've already seen this asset
                    if (seenAssetIds.has(assetId)) continue;
                    seenAssetIds.add(assetId);

                    // Extract asset name from hex
                    const assetNameHex = assetId.substring(MEK_POLICY_ID.length);
                    let assetName = '';

                    // Convert hex to string
                    for (let i = 0; i < assetNameHex.length; i += 2) {
                      const byte = parseInt(assetNameHex.substr(i, 2), 16);
                      if (byte >= 32 && byte <= 126) {
                        assetName += String.fromCharCode(byte);
                      }
                    }

                    // Extract Mek number from name (e.g., "Mekanism1234" -> 1234)
                    const mekNumber = parseInt(assetName.replace(/[^0-9]/g, ''));

                    if (mekNumber && !isNaN(mekNumber)) {
                      allMeks.push({
                        assetId,
                        assetName,
                        mekNumber,
                        quantity: parseInt(amount.quantity)
                      });

                      console.log(`Found MEK #${mekNumber}: ${assetName} (total so far: ${allMeks.length})`);
                    }
                  }
                }
              }
            }

            page++;
          }

          if (page > maxPages) {
            console.warn(`Reached max page limit (${maxPages}) for address ${address.substring(0, 20)}...`);
          }
        } catch (utxoError) {
          console.error(`Error fetching assets for address ${address}:`, utxoError);
        }
      }

      console.log(`Total MEKs found: ${allMeks.length}`);

      return {
        success: true,
        meks: allMeks,
        totalMeks: allMeks.length,
        stakeAddress: args.stakeAddress,
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Blockfrost API error:', error);

      // Handle specific errors
      if (error.message?.includes('404')) {
        return {
          success: false,
          error: 'Stake address not found',
          meks: [],
          stakeAddress: args.stakeAddress
        };
      } else if (error.message?.includes('402')) {
        return {
          success: false,
          error: 'Blockfrost API limit exceeded',
          meks: [],
          stakeAddress: args.stakeAddress
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch wallet assets',
        meks: [],
        stakeAddress: args.stakeAddress
      };
    }
  }
});

// Test Blockfrost connection
export const testBlockfrostConnection = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.BLOCKFROST_API_KEY;

    if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
      return {
        success: false,
        message: 'Blockfrost API key not configured. Please add BLOCKFROST_API_KEY to your .env.local file'
      };
    }

    try {
      // Test the API by fetching network info
      await rateLimiter.waitForSlot();
      const network = await blockfrostRequest('/network');

      return {
        success: true,
        message: 'Blockfrost connection successful',
        network: {
          supply: network.supply,
          stake: network.stake
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Blockfrost connection failed',
        error: error.message || 'Unknown error'
      };
    }
  }
});