

import { action } from "./_generated/server";
import { v } from "convex/values";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Get all Mek holders from the blockchain
export const getAllMekHolders = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.BLOCKFROST_API_KEY;

    if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
      throw new Error('Blockfrost API key not configured');
    }

    try {
      // Option 1: Use Blockfrost to get all addresses with this policy
      // Unfortunately, Blockfrost doesn't have a direct endpoint for this
      // We would need to use /assets/policy/{policy_id} and then get addresses for each asset

      const response = await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0/assets/policy/${MEK_POLICY_ID}`,
        {
          headers: { 'project_id': apiKey }
        }
      );

      if (!response.ok) {
        throw new Error(`Blockfrost error: ${response.status}`);
      }

      const assets = await response.json();

      // This returns all assets under the policy, but not the holders
      // We would need to query each asset individually to get holders

      console.log(`Found ${assets.length} Mek NFTs in the policy`);

      // To get holders, we'd need to:
      // 1. Loop through each asset
      // 2. Call /assets/{asset}/addresses for each one
      // 3. Aggregate by stake address
      // This would require thousands of API calls!

      // Option 2: Use a different service like Koios or Pool.pm
      // These have better NFT holder aggregation endpoints

      // Option 3: Use a pre-indexed service or maintain our own indexer

      return {
        success: false,
        message: "Full blockchain scanning not yet implemented - would require thousands of API calls or a different indexing service",
        totalAssets: assets.length
      };

    } catch (error: any) {
      console.error('Error fetching Mek holders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch Mek holders'
      };
    }
  },
});

// Alternative: Use Koios API (free, community-run)
export const getAllMekHoldersViaKoios = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Koios has better endpoints for getting all holders of a policy
      const response = await fetch(
        'https://api.koios.rest/api/v0/policy_asset_addresses',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _policy_id: MEK_POLICY_ID
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Koios error: ${response.status}`);
      }

      const data = await response.json();

      // Aggregate by stake address
      const holderMap = new Map<string, number>();

      for (const item of data) {
        const stakeAddress = item.stake_address;
        if (stakeAddress) {
          holderMap.set(
            stakeAddress,
            (holderMap.get(stakeAddress) || 0) + 1
          );
        }
      }

      // Convert to array and sort by count
      const holders = Array.from(holderMap.entries())
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50); // Top 50

      return {
        success: true,
        holders,
        totalHolders: holderMap.size
      };

    } catch (error: any) {
      console.error('Error fetching from Koios:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch from Koios'
      };
    }
  },
});