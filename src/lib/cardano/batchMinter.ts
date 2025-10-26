/**
 * Batch NFT Minting Engine
 *
 * Handles splitting large minting jobs into optimal batches
 * Processes batches sequentially with progress tracking and error recovery
 *
 * Cardano constraints:
 * - Max transaction size: 16KB
 * - Practical limit: 20-25 NFTs per transaction (depends on metadata size)
 * - Conservative default: 10 NFTs per batch for safety
 */

import {
  mintBatch,
  validateRecipientAddresses,
  estimateMintingCost,
  hasSufficientFunds,
  type MintRecipient,
  type NFTDesign,
  type MintingProgress,
  type MintResult
} from './nftMinter';

export interface BatchMintConfig {
  design: NFTDesign;
  recipients: MintRecipient[];
  batchSize?: number;  // Default: 10
  network?: 'mainnet' | 'preprod';  // Default: preprod
  onProgress?: (progress: MintingProgress) => void;
  onBatchComplete?: (batchIndex: number, result: MintResult) => void;
  retryAttempts?: number;  // Default: 2
}

export interface BatchMintResult {
  success: boolean;
  totalMinted: number;
  totalFailed: number;
  transactionHashes: string[];
  failedAddresses: MintRecipient[];
  assetIds: string[];
  error?: string;
}

/**
 * Split recipients into optimal batches
 *
 * @param recipients - Full list of recipients
 * @param batchSize - Max recipients per batch (default: 10)
 * @returns Array of batches
 */
export function splitIntoBatches(
  recipients: MintRecipient[],
  batchSize: number = 10
): MintRecipient[][] {
  const batches: MintRecipient[][] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Process all batches sequentially
 *
 * @param config - Batch minting configuration
 * @returns Complete minting results
 */
export async function processBatchMinting(config: BatchMintConfig): Promise<BatchMintResult> {
  const {
    design,
    recipients,
    batchSize = 10,
    network = 'preprod',
    onProgress,
    onBatchComplete,
    retryAttempts = 2
  } = config;

  // Validate all recipient addresses first
  const { valid, invalid } = validateRecipientAddresses(recipients);

  if (invalid.length > 0) {
    console.warn(`[🔨MINT] ⚠️  Found ${invalid.length} invalid addresses (will be skipped):`, invalid);
  }

  if (valid.length === 0) {
    return {
      success: false,
      totalMinted: 0,
      totalFailed: recipients.length,
      transactionHashes: [],
      failedAddresses: invalid,
      assetIds: [],
      error: 'No valid recipient addresses found'
    };
  }

  // Check if wallet has sufficient funds
  const costEstimate = estimateMintingCost(valid.length, batchSize);
  const hasEnoughFunds = await hasSufficientFunds(costEstimate.totalAda);

  if (!hasEnoughFunds) {
    return {
      success: false,
      totalMinted: 0,
      totalFailed: recipients.length,
      transactionHashes: [],
      failedAddresses: recipients,
      assetIds: [],
      error: `Insufficient funds. Need ${costEstimate.totalAda} ADA (${costEstimate.transactionFees} ADA fees + ${costEstimate.minUtxoAda} ADA locked with NFTs)`
    };
  }

  // Split into batches
  const batches = splitIntoBatches(valid, batchSize);

  // Track results
  const transactionHashes: string[] = [];
  const failedAddresses: MintRecipient[] = [...invalid]; // Include pre-validation failures
  const assetIds: string[] = [];
  let totalMinted = 0;
  let mintNumber = 1;

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    // Update progress
    if (onProgress) {
      onProgress({
        current: totalMinted,
        total: valid.length,
        status: `Processing batch ${batchIndex + 1} of ${batches.length}...`,
        currentBatch: batchIndex + 1,
        totalBatches: batches.length
      });
    }

    // Mint this batch (with retry logic)
    let batchResult: MintResult | null = null;
    let attempt = 0;

    console.log(`\n[🔨MINT] 🔨 [Batch ${batchIndex + 1}/${batches.length}] Starting mint for ${batch.length} NFTs...`);

    while (attempt < retryAttempts && !batchResult?.success) {
      try {
        if (attempt > 0) {
          console.log(`[🔨MINT]    🔄 Retry attempt ${attempt + 1} for batch ${batchIndex + 1}...`);
          // Wait before retry (exponential backoff)
          await delay(1000 * Math.pow(2, attempt));
        }

        console.log(`[🔨MINT]    🏗️  Building transaction for batch ${batchIndex + 1}...`);
        batchResult = await mintBatch(design, batch, mintNumber, network);
      } catch (error: any) {
        console.error(`[🔨MINT]    ❌ Batch ${batchIndex + 1} attempt ${attempt + 1} failed:`, error.message);
      }

      attempt++;
    }

    // Handle batch result
    if (batchResult?.success && batchResult.txHash) {
      transactionHashes.push(batchResult.txHash);
      totalMinted += batch.length;

      if (batchResult.assetIds) {
        assetIds.push(...batchResult.assetIds);
      }

      mintNumber += batch.length;

      console.log(`[🔨MINT] ✅ Batch ${batchIndex + 1} complete: ${batchResult.txHash}`);
    } else {
      // Batch failed after all retries
      failedAddresses.push(...batch);
      console.error(`[🔨MINT] ❌ Batch ${batchIndex + 1} failed after ${retryAttempts} attempts:`, batchResult?.error);
    }

    // Notify batch completion
    if (onBatchComplete && batchResult) {
      onBatchComplete(batchIndex, batchResult);
    }

    // Small delay between batches to avoid overwhelming the network
    if (batchIndex < batches.length - 1) {
      await delay(2000); // 2 second delay between batches
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      current: totalMinted,
      total: valid.length,
      status: totalMinted === valid.length ? 'Complete!' : 'Completed with errors',
      currentBatch: batches.length,
      totalBatches: batches.length
    });
  }

  return {
    success: totalMinted > 0,
    totalMinted,
    totalFailed: failedAddresses.length,
    transactionHashes,
    failedAddresses,
    assetIds
  };
}

/**
 * Delay helper for retry logic
 *
 * @param ms - Milliseconds to wait
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Estimate batch processing time
 *
 * @param totalNfts - Total number of NFTs to mint
 * @param batchSize - NFTs per batch
 * @returns Estimated time in minutes
 */
export function estimateProcessingTime(totalNfts: number, batchSize: number = 10): number {
  const numBatches = Math.ceil(totalNfts / batchSize);
  const timePerBatch = 1.5; // ~1.5 minutes per batch (including confirmation time)
  const delayBetweenBatches = 0.033; // 2 seconds = 0.033 minutes

  const totalMinutes = (numBatches * timePerBatch) + ((numBatches - 1) * delayBetweenBatches);

  return Math.ceil(totalMinutes);
}

/**
 * Preview batch minting plan
 *
 * @param recipients - Full recipient list
 * @param batchSize - NFTs per batch
 * @returns Summary of minting plan
 */
export function previewMintingPlan(recipients: MintRecipient[], batchSize: number = 10): {
  validAddresses: number;
  invalidAddresses: number;
  totalBatches: number;
  estimatedCost: ReturnType<typeof estimateMintingCost>;
  estimatedTime: number;
} {
  const { valid, invalid } = validateRecipientAddresses(recipients);
  const totalBatches = Math.ceil(valid.length / batchSize);
  const estimatedCost = estimateMintingCost(valid.length, batchSize);
  const estimatedTime = estimateProcessingTime(valid.length, batchSize);

  return {
    validAddresses: valid.length,
    invalidAddresses: invalid.length,
    totalBatches,
    estimatedCost,
    estimatedTime
  };
}
