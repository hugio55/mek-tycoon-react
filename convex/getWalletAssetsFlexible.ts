

import { action } from "./_generated/server";
import { v } from "convex/values";
import { rateLimiter } from "./blockfrostConfig";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Make a request to Blockfrost API
async function blockfrostRequest(apiKey: string, endpoint: string): Promise<any> {
  if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
    throw new Error('Blockfrost API key not configured');
  }

  const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0${endpoint}`, {
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

// Get wallet assets - STAKE ADDRESS ONLY (simplified)
export const getWalletAssetsFlexible = action({
  args: {
    walletIdentifier: v.string(), // Must be bech32 stake address (stake1...)
  },
  handler: async (ctx, args) => {
    try {
      // Get API key from Convex environment variables
      const apiKey = process.env.BLOCKFROST_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'Blockfrost API key not configured in Convex environment',
          meks: [],
          totalMeks: 0
        };
      }

      const allMeks: any[] = [];
      const seenAssetIds = new Set<string>();
      let addressesToCheck: string[] = [];

      // Only accept bech32 stake addresses
      if (!args.walletIdentifier.startsWith('stake1')) {
        return {
          success: false,
          error: 'Only bech32 stake addresses (stake1...) are supported',
          meks: [],
          totalMeks: 0
        };
      }

      console.log('Querying stake address:', args.walletIdentifier);

      // Try to get addresses from stake account (WITH PAGINATION!)
      try {
        const addresses = [];
        let addressPage = 1;
        let hasMoreAddresses = true;

        while (hasMoreAddresses) {
          await rateLimiter.waitForSlot();
          const addressBatch = await blockfrostRequest(apiKey, `/accounts/${args.walletIdentifier}/addresses?page=${addressPage}&count=100`);
          addresses.push(...addressBatch);

          // Check if there are more pages
          hasMoreAddresses = addressBatch.length === 100;
          addressPage++;

          if (hasMoreAddresses) {
            console.log(`Fetched ${addresses.length} addresses so far, fetching more...`);
          }
        }

        console.log(`Found ${addresses.length} addresses for stake account`);
        addressesToCheck = addresses.map((a: any) => a.address);
      } catch (stakeError: any) {
        return {
          success: false,
          error: `Stake address lookup failed: ${stakeError.message}`,
          meks: [],
          totalMeks: 0
        };
      }

      if (addressesToCheck.length === 0) {
        return {
          success: false,
          error: 'No payment addresses found for this stake address',
          meks: [],
          totalMeks: 0
        };
      }

      // Check each address for MEK NFTs
      for (const address of addressesToCheck) {
        try {
          console.log(`Checking address: ${address.substring(0, 20)}...`);

          // Get all UTXOs at this address (WITH PAGINATION!)
          let page = 1;
          let hasMore = true;
          const allUtxos = [];

          while (hasMore) {
            await rateLimiter.waitForSlot();
            const utxos = await blockfrostRequest(apiKey, `/addresses/${address}/utxos?page=${page}&count=100`);
            allUtxos.push(...utxos);

            // Check if there are more pages
            hasMore = utxos.length === 100;
            page++;
          }

          // Check each UTXO for MEK NFTs
          for (const utxo of allUtxos) {
            if (utxo.amount) {
              for (const amount of utxo.amount) {
                const unit = amount.unit;

                // Check if this is a MEK NFT
                if (unit && unit.startsWith(MEK_POLICY_ID)) {
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

                  // Extract Mek number from name
                  const mekNumber = parseInt(assetName.replace(/[^0-9]/g, ''));

                  if (mekNumber && !isNaN(mekNumber)) {
                    allMeks.push({
                      assetId,
                      assetName,
                      mekNumber,
                      quantity: parseInt(amount.quantity)
                    });

                    console.log(`Found MEK #${mekNumber}: ${assetName}`);
                  }
                }
              }
            }
          }
        } catch (addressError) {
          console.error(`Error checking address ${address}:`, addressError);
        }
      }

      console.log(`Total MEKs found: ${allMeks.length}`);

      return {
        success: true,
        meks: allMeks,
        totalMeks: allMeks.length,
        addressesChecked: addressesToCheck.length,
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Error in getWalletAssetsFlexible:', error);

      return {
        success: false,
        error: error.message || 'Failed to fetch wallet assets',
        meks: [],
        totalMeks: 0
      };
    }
  },
});