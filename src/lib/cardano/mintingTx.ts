/**
 * Minting Transaction Builder
 *
 * Build NFT minting transactions using MeshSDK
 *
 * References:
 * - MeshSDK Transactions: https://meshjs.dev/apis/transaction
 * - MeshSDK Minting: https://meshjs.dev/apis/transaction/minting
 * - UTXO Model: https://docs.cardano.org/learn/cardano-architecture/#unspent-transaction-output-utxo
 */

import { Transaction, ForgeScript, AssetMetadata } from '@meshsdk/core';
import { BrowserWallet } from '@meshsdk/core';

/**
 * Estimate transaction costs
 *
 * Cardano transaction costs consist of:
 * 1. Transaction fee (~0.17 ADA) - paid to network
 * 2. Min ADA (~1.5-2 ADA) - locked in NFT UTXO (recoverable on sale)
 *
 * References:
 * - Fee calculation: https://docs.cardano.org/explore-cardano/protocol-parameters/
 * - Min UTXO: https://docs.cardano.org/native-tokens/minimum-ada-value-requirement/
 */
export function estimateM

intCosts(metadataSizeBytes: number = 1000): {
  txFee: number; // lovelace
  minAda: number; // lovelace
  totalCost: number; // lovelace
  totalAda: number; // ADA
} {
  // Estimated transaction fee (will be calculated precisely by wallet)
  const minFeeA = 155381; // 0.155381 ADA base fee
  const minFeeB = 43.946; // per byte
  const estimatedTxSize = 500 + metadataSizeBytes; // Rough estimate
  const txFee = Math.ceil(minFeeA + (minFeeB * estimatedTxSize));

  // Min ADA for NFT UTXO
  const baseMinUtxo = 1000000; // 1 ADA
  const sizeMultiplier = 4310;
  const minAda = baseMinUtxo + (metadataSizeBytes * sizeMultiplier);

  const totalCost = txFee + minAda;

  return {
    txFee,
    minAda,
    totalCost,
    totalAda: totalCost / 1000000
  };
}

/**
 * Build a basic minting transaction (Phase 1 - Simplified)
 *
 * This creates a transaction that:
 * 1. Mints 1 NFT
 * 2. Attaches metadata
 * 3. Sends NFT to recipient
 *
 * @param wallet - Connected MeshSDK wallet
 * @param policyScript - Native script for minting
 * @param assetName - Hex-encoded asset name
 * @param metadata - CIP-25 compliant metadata
 * @param recipientAddress - Where to send the NFT
 * @returns Unsigned transaction ready for signing
 */
export async function buildMintTransaction(params: {
  wallet: BrowserWallet;
  policyId: string;
  policyScript: any;
  assetName: string;
  metadata: any;
  recipientAddress: string;
}): Promise<Transaction> {
  const { wallet, policyId, policyScript, assetName, metadata, recipientAddress } = params;

  // Initialize transaction
  const tx = new Transaction({ initiator: wallet });

  // Create ForgeScript from native script
  const forgeScript = ForgeScript.fromNativeScript(policyScript);

  // Mint the NFT
  tx.mintAsset(
    forgeScript,
    {
      assetName: assetName,
      assetQuantity: '1', // NFTs are always quantity 1
      metadata: metadata,
      label: '721', // CIP-25 metadata label
      recipient: recipientAddress
    }
  );

  return tx;
}

/**
 * Sign and submit transaction
 *
 * @param tx - Unsigned transaction
 * @param wallet - Connected wallet
 * @returns Transaction hash
 */
export async function signAndSubmitTransaction(
  tx: Transaction,
  wallet: BrowserWallet
): Promise<string> {
  // Build and sign the transaction
  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);

  // Submit to blockchain
  const txHash = await wallet.submitTx(signedTx);

  return txHash;
}

/**
 * Monitor transaction confirmation
 *
 * Polls blockchain until transaction is confirmed
 *
 * @param txHash - Transaction hash to monitor
 * @param maxAttempts - Max polling attempts (default: 60 = ~2 min)
 * @param intervalMs - Polling interval (default: 2000 = 2 sec)
 */
export async function waitForConfirmation(
  txHash: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<boolean> {
  const config = {
    network: process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod',
    projectId: process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet'
      ? process.env.BLOCKFROST_PROJECT_ID
      : process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_TESTNET,
    url: process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet'
      ? process.env.BLOCKFROST_API_URL
      : process.env.NEXT_PUBLIC_BLOCKFROST_URL_TESTNET
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${config.url}/txs/${txHash}`, {
        headers: { 'project_id': config.projectId || '' }
      });

      if (response.ok) {
        return true; // Transaction confirmed!
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      // Continue polling on errors
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return false; // Timed out
}

/**
 * Get transaction details after confirmation
 */
export async function getTransactionDetails(txHash: string) {
  const config = {
    projectId: process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet'
      ? process.env.BLOCKFROST_PROJECT_ID
      : process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_TESTNET,
    url: process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet'
      ? process.env.BLOCKFROST_API_URL
      : process.env.NEXT_PUBLIC_BLOCKFROST_URL_TESTNET
  };

  const response = await fetch(`${config.url}/txs/${txHash}`, {
    headers: { 'project_id': config.projectId || '' }
  });

  if (!response.ok) {
    throw new Error(`Failed to get transaction details: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(txHash: string): string {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';

  if (network === 'mainnet') {
    return `https://cardanoscan.io/transaction/${txHash}`;
  } else {
    return `https://${network}.cardanoscan.io/transaction/${txHash}`;
  }
}

/**
 * Complete minting flow (all-in-one helper)
 *
 * This handles the entire minting process:
 * 1. Build transaction
 * 2. Sign with wallet
 * 3. Submit to blockchain
 * 4. Wait for confirmation
 * 5. Return transaction hash
 */
export async function mintNFT(params: {
  wallet: BrowserWallet;
  policyId: string;
  policyScript: any;
  assetName: string;
  metadata: any;
  recipientAddress: string;
  onProgress?: (step: string) => void;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const { wallet, policyId, policyScript, assetName, metadata, recipientAddress, onProgress } = params;

  try {
    // Step 1: Build transaction
    onProgress?.('Building transaction...');
    const tx = await buildMintTransaction({
      wallet,
      policyId,
      policyScript,
      assetName,
      metadata,
      recipientAddress
    });

    // Step 2: Sign and submit
    onProgress?.('Waiting for signature...');
    const txHash = await signAndSubmitTransaction(tx, wallet);

    onProgress?.('Transaction submitted, waiting for confirmation...');

    // Step 3: Wait for confirmation
    const confirmed = await waitForConfirmation(txHash);

    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }

    onProgress?.('Confirmed!');

    return {
      txHash,
      explorerUrl: getExplorerUrl(txHash)
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Minting failed: ${error.message}`);
    }
    throw error;
  }
}
