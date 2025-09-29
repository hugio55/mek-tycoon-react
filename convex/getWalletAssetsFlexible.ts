

import { action } from "./_generated/server";
import { v } from "convex/values";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Make a request to Blockfrost API
async function blockfrostRequest(endpoint: string): Promise<any> {
  const apiKey = process.env.BLOCKFROST_API_KEY;

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

// Get wallet assets - works with both registered and unregistered stake addresses
export const getWalletAssetsFlexible = action({
  args: {
    walletIdentifier: v.string(), // Can be stake address, payment address, or hex
    paymentAddresses: v.optional(v.array(v.string())), // Optional payment addresses
  },
  handler: async (ctx, args) => {
    try {
      const allMeks: any[] = [];
      const seenAssetIds = new Set<string>();
      let addressesToCheck: string[] = [];

      // First, try to use the wallet identifier as a stake address
      // ONLY if it's in bech32 format (starts with 'stake1')
      // Hex addresses (56-60 hex chars) cannot be used with /accounts/ endpoint
      if (args.walletIdentifier.startsWith('stake')) {
        try {
          console.log('Trying as bech32 stake address:', args.walletIdentifier);

          // Try to get addresses from stake account
          const addresses = await blockfrostRequest(`/accounts/${args.walletIdentifier}/addresses`);
          console.log(`Found ${addresses.length} addresses for stake account`);

          addressesToCheck = addresses.map((a: any) => a.address);
        } catch (stakeError) {
          console.log('Stake address lookup failed (probably unregistered), will use payment addresses');
        }
      } else if (/^[0-9a-fA-F]{56,60}$/.test(args.walletIdentifier)) {
        console.log('Hex address detected - cannot query Blockfrost without bech32 conversion');
        // For hex addresses, we need payment addresses or bech32 conversion
      }

      // If stake address didn't work or no addresses found, use payment addresses
      if (addressesToCheck.length === 0 && args.paymentAddresses) {
        console.log('Using provided payment addresses:', args.paymentAddresses.length);
        addressesToCheck = args.paymentAddresses;
      }

      // If still no addresses, try the identifier as a payment address
      if (addressesToCheck.length === 0 && args.walletIdentifier.startsWith('addr')) {
        console.log('Using wallet identifier as payment address');
        addressesToCheck = [args.walletIdentifier];
      }

      if (addressesToCheck.length === 0) {
        return {
          success: false,
          error: 'No valid addresses found to check',
          meks: [],
          totalMeks: 0
        };
      }

      // Check each address for MEK NFTs
      for (const address of addressesToCheck) {
        try {
          console.log(`Checking address: ${address.substring(0, 20)}...`);

          // Get all UTXOs at this address
          const utxos = await blockfrostRequest(`/addresses/${address}/utxos`);

          // Check each UTXO for MEK NFTs
          for (const utxo of utxos) {
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