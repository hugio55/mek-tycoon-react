import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Blockfrost API Integration for Cardano Blockchain Verification
 *
 * Used to verify NFTs on-chain, check ownership, and validate transactions.
 */

const BLOCKFROST_API_URL = process.env.BLOCKFROST_API_URL || "https://cardano-mainnet.blockfrost.io/api/v0";
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY;

// ==========================================
// ASSET VERIFICATION
// ==========================================

/**
 * Get asset information from blockchain
 * Returns current state of an NFT including current owner
 */
export const getAssetInfo = action({
  args: {
    assetId: v.string(), // Full asset ID: policyId + assetName (hex)
  },
  handler: async (ctx, args) => {
    if (!BLOCKFROST_API_KEY) {
      throw new Error("BLOCKFROST_API_KEY not configured");
    }

    console.log("[Blockfrost] Fetching asset info:", args.assetId);

    try {
      const response = await fetch(`${BLOCKFROST_API_URL}/assets/${args.assetId}`, {
        headers: {
          "project_id": BLOCKFROST_API_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            error: "Asset not found on blockchain",
          };
        }
        const errorText = await response.text();
        throw new Error(`Blockfrost API error: ${response.status} - ${errorText}`);
      }

      const asset = await response.json();
      console.log("[Blockfrost] Asset found:", asset.asset);

      return {
        found: true,
        asset: asset.asset,
        policyId: asset.policy_id,
        assetName: asset.asset_name,
        fingerprint: asset.fingerprint,
        quantity: asset.quantity,
        initialMintTx: asset.initial_mint_tx_hash,
        mintOrBurnCount: asset.mint_or_burn_count,
        onchainMetadata: asset.onchain_metadata,
      };
    } catch (error) {
      console.error("[Blockfrost] Failed to fetch asset:", error);
      return {
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get current addresses holding an asset
 * Used to verify if NFT has been delivered (not in NMKR wallet)
 */
export const getAssetAddresses = action({
  args: {
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!BLOCKFROST_API_KEY) {
      throw new Error("BLOCKFROST_API_KEY not configured");
    }

    console.log("[Blockfrost] Fetching asset addresses:", args.assetId);

    try {
      const response = await fetch(`${BLOCKFROST_API_URL}/assets/${args.assetId}/addresses`, {
        headers: {
          "project_id": BLOCKFROST_API_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            addresses: [],
          };
        }
        const errorText = await response.text();
        throw new Error(`Blockfrost API error: ${response.status} - ${errorText}`);
      }

      const addresses = await response.json();
      console.log("[Blockfrost] Found addresses:", addresses.length);

      return {
        found: true,
        addresses: addresses.map((addr: any) => ({
          address: addr.address,
          quantity: addr.quantity,
        })),
      };
    } catch (error) {
      console.error("[Blockfrost] Failed to fetch addresses:", error);
      return {
        found: false,
        addresses: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Verify a transaction exists on-chain
 */
export const verifyTransaction = action({
  args: {
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    if (!BLOCKFROST_API_KEY) {
      throw new Error("BLOCKFROST_API_KEY not configured");
    }

    console.log("[Blockfrost] Verifying transaction:", args.txHash);

    try {
      const response = await fetch(`${BLOCKFROST_API_URL}/txs/${args.txHash}`, {
        headers: {
          "project_id": BLOCKFROST_API_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            error: "Transaction not found",
          };
        }
        const errorText = await response.text();
        throw new Error(`Blockfrost API error: ${response.status} - ${errorText}`);
      }

      const tx = await response.json();
      console.log("[Blockfrost] Transaction verified:", tx.hash);

      return {
        found: true,
        hash: tx.hash,
        block: tx.block,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
        slot: tx.slot,
        index: tx.index,
        fees: tx.fees,
        size: tx.size,
      };
    } catch (error) {
      console.error("[Blockfrost] Failed to verify transaction:", error);
      return {
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Build full asset ID from policy ID and asset name (tokenname)
 * Asset ID = policyId + hex(assetName)
 */
export const buildAssetId = action({
  args: {
    policyId: v.string(),
    assetName: v.string(), // Human-readable name
  },
  handler: async (ctx, args) => {
    // Convert asset name to hex
    const hexAssetName = Buffer.from(args.assetName, "utf8").toString("hex");
    const assetId = args.policyId + hexAssetName;

    console.log("[Blockfrost] Built asset ID:", {
      policyId: args.policyId,
      assetName: args.assetName,
      hexAssetName,
      assetId,
    });

    return {
      assetId,
      policyId: args.policyId,
      assetName: args.assetName,
      hexAssetName,
    };
  },
});

/**
 * Verify if an NFT was delivered to a buyer
 * Checks if the NFT is NOT in the NMKR project wallet anymore
 */
export const verifyNFTDelivery = action({
  args: {
    assetId: v.string(),
    nmkrWalletAddress: v.optional(v.string()), // Optional: NMKR project wallet to check against
  },
  handler: async (ctx, args) => {
    console.log("[Blockfrost] Verifying NFT delivery for:", args.assetId);

    // Get current asset addresses
    const addressResult = await ctx.runAction(getAssetAddresses, {
      assetId: args.assetId,
    });

    if (!addressResult.found) {
      return {
        delivered: false,
        verified: false,
        error: addressResult.error || "Asset not found on blockchain",
      };
    }

    // If no NMKR wallet provided, just check if asset exists and has owner
    if (!args.nmkrWalletAddress) {
      const hasOwner = addressResult.addresses.length > 0;
      return {
        delivered: hasOwner,
        verified: true,
        currentAddresses: addressResult.addresses,
        message: hasOwner ? "NFT has been minted and delivered" : "NFT minted but no owner found",
      };
    }

    // Check if NFT is in NMKR wallet
    const inNmkrWallet = addressResult.addresses.some(
      (addr) => addr.address === args.nmkrWalletAddress
    );

    // Check if NFT is in another wallet (delivered to buyer)
    const inOtherWallet = addressResult.addresses.some(
      (addr) => addr.address !== args.nmkrWalletAddress
    );

    return {
      delivered: inOtherWallet && !inNmkrWallet,
      verified: true,
      inNmkrWallet,
      inOtherWallet,
      currentAddresses: addressResult.addresses,
      message: inOtherWallet
        ? "NFT delivered to buyer"
        : inNmkrWallet
        ? "NFT still in NMKR wallet (pending delivery)"
        : "NFT minted but location unclear",
    };
  },
});

// ==========================================
// BATCH VERIFICATION
// ==========================================

/**
 * Verify multiple NFTs in batch with rate limiting
 * Processes NFTs with automatic rate limiting to stay within
 * Blockfrost's 10 requests/second limit.
 */
export const verifyNFTBatch = action({
  args: {
    nfts: v.array(v.object({
      nftUid: v.string(),
      assetId: v.string(),
      name: v.optional(v.string()),
      transactionHash: v.optional(v.string()),
    })),
    nmkrWalletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`[🛡️BLOCKFROST] Starting batch verification of ${args.nfts.length} NFTs`);
    console.log(`[🛡️BLOCKFROST] Rate limiting: 100ms delay between requests`);

    const results: Array<{
      nftUid: string;
      name?: string;
      verified: boolean;
      delivered: boolean;
      currentOwner?: string;
      inNmkrWallet?: boolean;
      transactionValid?: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;
    let deliveredCount = 0;
    let inEscrowCount = 0;

    for (let i = 0; i < args.nfts.length; i++) {
      const nft = args.nfts[i];

      console.log(`[🛡️BLOCKFROST] Verifying ${i + 1}/${args.nfts.length}: ${nft.nftUid}`);

      try {
        // Verify delivery
        const deliveryResult = await ctx.runAction(verifyNFTDelivery, {
          assetId: nft.assetId,
          nmkrWalletAddress: args.nmkrWalletAddress,
        });

        // Verify transaction if provided
        let transactionValid = undefined;
        if (nft.transactionHash) {
          const txResult = await ctx.runAction(verifyTransaction, {
            txHash: nft.transactionHash,
          });
          transactionValid = txResult.found;
        }

        const result = {
          nftUid: nft.nftUid,
          name: nft.name,
          verified: deliveryResult.verified,
          delivered: deliveryResult.delivered || false,
          currentOwner: deliveryResult.currentAddresses?.[0]?.address,
          inNmkrWallet: deliveryResult.inNmkrWallet,
          transactionValid,
          error: deliveryResult.error,
        };

        results.push(result);

        if (result.verified) {
          successCount++;
          if (result.delivered) {
            deliveredCount++;
          } else if (result.inNmkrWallet) {
            inEscrowCount++;
          }
        } else {
          failureCount++;
        }

      } catch (error) {
        console.error(`[🛡️BLOCKFROST] Error verifying ${nft.nftUid}:`, error);
        results.push({
          nftUid: nft.nftUid,
          name: nft.name,
          verified: false,
          delivered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failureCount++;
      }

      // Rate limiting: 100ms delay between requests (10 req/sec max)
      if (i < args.nfts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[🛡️BLOCKFROST] Batch verification complete:`);
    console.log(`[🛡️BLOCKFROST]   ✅ Verified: ${successCount}`);
    console.log(`[🛡️BLOCKFROST]   📦 Delivered: ${deliveredCount}`);
    console.log(`[🛡️BLOCKFROST]   🏦 In Escrow: ${inEscrowCount}`);
    console.log(`[🛡️BLOCKFROST]   ❌ Failed: ${failureCount}`);

    return {
      results,
      summary: {
        total: args.nfts.length,
        verified: successCount,
        delivered: deliveredCount,
        inEscrow: inEscrowCount,
        failed: failureCount,
        verificationRate: args.nfts.length > 0 ? (successCount / args.nfts.length * 100).toFixed(1) + "%" : "0%",
      },
    };
  },
});

/**
 * Helper to check if asset name is already hex-encoded
 */
function isHexString(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Construct Cardano asset ID from policy ID and asset name
 * Handles both plain text and hex-encoded asset names
 */
export const constructAssetId = action({
  args: {
    policyId: v.string(),
    assetName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[🛡️BLOCKFROST] Constructing asset ID:`);
    console.log(`[🛡️BLOCKFROST]   Policy ID: ${args.policyId}`);
    console.log(`[🛡️BLOCKFROST]   Asset Name: ${args.assetName}`);

    // Check if asset name is already hex-encoded
    const isHex = isHexString(args.assetName);
    const hexAssetName = isHex
      ? args.assetName
      : Buffer.from(args.assetName, "utf8").toString("hex");

    const assetId = args.policyId + hexAssetName;

    console.log(`[🛡️BLOCKFROST]   Hex Asset Name: ${hexAssetName}`);
    console.log(`[🛡️BLOCKFROST]   Asset ID: ${assetId}`);

    return {
      assetId,
      policyId: args.policyId,
      assetName: args.assetName,
      hexAssetName,
      wasHexEncoded: isHex,
    };
  },
});
