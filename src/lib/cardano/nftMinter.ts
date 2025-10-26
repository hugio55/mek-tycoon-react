/**
 * NFT Minting Core Functions
 *
 * Handles batch NFT minting to Cardano blockchain with full wallet compatibility
 * Strict CIP-25 compliance for maximum wallet support (Lace, Eternl, Typhon, Yoroi, etc.)
 *
 * Research-backed best practices:
 * - Use payment addresses only (addr_test1... or addr1...)
 * - IPFS URLs must use ipfs:// format (not https gateway URLs)
 * - Only use "721" metadata tag (no other tags to avoid display issues)
 * - Include mediaType field for proper image rendering
 */

import { Transaction, ForgeScript, BlockfrostProvider, BrowserWallet } from '@meshsdk/core';

// Types
export interface MintRecipient {
  address: string;
  displayName?: string;
}

export interface NFTDesign {
  tokenType: string;
  name: string;
  description: string;
  assetNamePrefix: string;
  imageIpfsHash: string;      // Just the hash, we'll format to ipfs://
  metadataIpfsHash?: string;  // Optional: full metadata on IPFS
  policyId: string;
  policyScript: any;
}

export interface MintingProgress {
  current: number;
  total: number;
  status: string;
  currentBatch?: number;
  totalBatches?: number;
}

export interface MintResult {
  success: boolean;
  txHash?: string;
  assetIds?: string[];
  error?: string;
  failedAddresses?: string[];
}

// Wallet state
let connectedWallet: BrowserWallet | null = null;
let walletAddress: string | null = null;

/**
 * Connect admin wallet for minting
 *
 * @param walletName - Wallet to connect ('lace', 'eternl', 'nami', etc.)
 * @returns Connected wallet address
 */
export async function connectAdminWallet(walletName: string = 'lace'): Promise<string> {
  try {
    // Connect to wallet
    const wallet = await BrowserWallet.enable(walletName);

    // Get wallet address
    const usedAddresses = await wallet.getUsedAddresses();
    const address = usedAddresses[0];

    if (!address) {
      throw new Error('No address found in wallet');
    }

    // Validate it's a payment address (not stake address)
    if (!isPaymentAddress(address)) {
      throw new Error('Wallet address is not a valid payment address. Please use a payment address (addr... or addr_test...)');
    }

    connectedWallet = wallet;
    walletAddress = address;

    return address;
  } catch (error: any) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

/**
 * Get connected wallet balance
 *
 * @returns Balance in lovelace (1 ADA = 1,000,000 lovelace)
 */
export async function getWalletBalance(): Promise<number> {
  if (!connectedWallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const balance = await connectedWallet.getBalance();

    // Balance is returned as array of assets, ADA is the first one
    const adaAsset = balance.find((asset: any) => asset.unit === 'lovelace');
    return adaAsset ? parseInt(adaAsset.quantity) : 0;
  } catch (error: any) {
    throw new Error(`Failed to get balance: ${error.message}`);
  }
}

/**
 * Disconnect admin wallet
 */
export function disconnectWallet() {
  connectedWallet = null;
  walletAddress = null;
}

/**
 * Validate address is a payment address (not stake address)
 *
 * Payment addresses: addr1... (mainnet) or addr_test1... (testnet)
 * Stake addresses: stake1... (CANNOT receive NFTs)
 *
 * @param address - Cardano address to validate
 * @returns True if valid payment address
 */
export function isPaymentAddress(address: string): boolean {
  return address.startsWith('addr1') || address.startsWith('addr_test1');
}

/**
 * Validate recipient addresses
 *
 * @param recipients - List of recipients to validate
 * @returns { valid: address[], invalid: address[] }
 */
export function validateRecipientAddresses(recipients: MintRecipient[]): {
  valid: MintRecipient[];
  invalid: MintRecipient[];
} {
  const valid: MintRecipient[] = [];
  const invalid: MintRecipient[] = [];

  for (const recipient of recipients) {
    if (isPaymentAddress(recipient.address)) {
      valid.push(recipient);
    } else {
      invalid.push(recipient);
    }
  }

  return { valid, invalid };
}

/**
 * Build CIP-25 compliant NFT metadata
 *
 * CRITICAL: Strict compliance for wallet compatibility
 * - Image MUST use ipfs:// format (not https gateway)
 * - Only use "721" metadata tag
 * - Include mediaType for proper rendering
 *
 * @param design - NFT design configuration
 * @param recipient - Recipient info
 * @param mintNumber - Sequential mint number (1, 2, 3, etc.)
 * @returns CIP-25 metadata object
 */
export function buildCIP25Metadata(
  design: NFTDesign,
  recipient: MintRecipient,
  mintNumber: number
): any {
  // Generate unique asset name (hex-encoded)
  const assetName = generateAssetName(design.assetNamePrefix, mintNumber);
  const assetNameHex = Buffer.from(assetName, 'utf-8').toString('hex');

  // Format IPFS URL correctly (MUST use ipfs:// format)
  const ipfsImageUrl = formatIpfsUrl(design.imageIpfsHash);

  // Build CIP-25 metadata structure
  // Reference: https://cips.cardano.org/cip/CIP-25
  const metadata = {
    "721": {  // CIP-25 metadata label
      [design.policyId]: {
        [assetNameHex]: {
          name: `${design.name} #${mintNumber.toString().padStart(3, '0')}`,
          image: ipfsImageUrl,
          mediaType: "image/png",  // Critical for wallet display
          description: design.description,
          // Optional custom attributes
          attributes: {
            "Mint Number": mintNumber.toString(),
            "Recipient": recipient.displayName || shortenAddress(recipient.address),
            "Collection": design.tokenType
          }
        }
      }
    }
  };

  return metadata;
}

/**
 * Format IPFS hash to proper ipfs:// URL
 *
 * Converts:
 * - "QmXxXx..." → "ipfs://QmXxXx..."
 * - "https://gateway.pinata.cloud/ipfs/QmXxXx..." → "ipfs://QmXxXx..."
 *
 * @param hashOrUrl - IPFS hash or gateway URL
 * @returns Properly formatted ipfs:// URL
 */
export function formatIpfsUrl(hashOrUrl: string): string {
  // Already in ipfs:// format
  if (hashOrUrl.startsWith('ipfs://')) {
    return hashOrUrl;
  }

  // Extract hash from gateway URL
  if (hashOrUrl.includes('/ipfs/')) {
    const hash = hashOrUrl.split('/ipfs/')[1];
    return `ipfs://${hash}`;
  }

  // Assume it's just a hash
  return `ipfs://${hashOrUrl}`;
}

/**
 * Generate unique asset name
 *
 * @param prefix - Asset name prefix (e.g., "CommemorativeToken1")
 * @param mintNumber - Sequential number
 * @returns Formatted asset name
 */
export function generateAssetName(prefix: string, mintNumber: number): string {
  const paddedNumber = mintNumber.toString().padStart(3, '0');
  return `${prefix}_${paddedNumber}`;
}

/**
 * Shorten Cardano address for display
 *
 * @param address - Full Cardano address
 * @returns Shortened version (addr1...xyz)
 */
export function shortenAddress(address: string): string {
  if (address.length < 20) return address;
  return `${address.substring(0, 12)}...${address.substring(address.length - 6)}`;
}

/**
 * Estimate minting cost
 *
 * @param nftCount - Number of NFTs to mint
 * @param batchSize - NFTs per transaction
 * @returns Estimated cost in ADA
 */
export function estimateMintingCost(nftCount: number, batchSize: number = 10): {
  totalAda: number;
  transactionFees: number;
  minUtxoAda: number;
  numTransactions: number;
} {
  const numTransactions = Math.ceil(nftCount / batchSize);
  const transactionFeePerBatch = 0.4; // ~0.4 ADA per transaction (conservative estimate)
  const minAdaPerNft = 1.5; // Minimum ADA locked with each NFT

  const transactionFees = numTransactions * transactionFeePerBatch;
  const minUtxoAda = nftCount * minAdaPerNft;
  const totalAda = transactionFees + minUtxoAda;

  return {
    totalAda: Math.ceil(totalAda * 10) / 10, // Round up to 1 decimal
    transactionFees,
    minUtxoAda,
    numTransactions
  };
}

/**
 * Build minting transaction for a batch of recipients
 *
 * @param design - NFT design configuration
 * @param recipients - List of recipients for this batch
 * @param startMintNumber - Starting mint number for this batch
 * @param network - Cardano network ('mainnet' | 'preprod')
 * @returns Built transaction (unsigned)
 */
export async function buildMintTransaction(
  design: NFTDesign,
  recipients: MintRecipient[],
  startMintNumber: number,
  network: 'mainnet' | 'preprod' = 'preprod'
): Promise<string> {
  if (!connectedWallet || !walletAddress) {
    throw new Error('Wallet not connected');
  }

  try {
    // Create Blockfrost provider for fee calculation
    const blockfrostApiKey = network === 'mainnet'
      ? process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!
      : process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_TESTNET!;

    const blockfrostProvider = new BlockfrostProvider(blockfrostApiKey);

    // Initialize transaction
    const tx = new Transaction({ initiator: connectedWallet });
    tx.setNetwork(network);

    // Parse policy script if it's a string
    let policyScript = design.policyScript;
    if (typeof policyScript === 'string') {
      try {
        policyScript = JSON.parse(policyScript);
      } catch (e) {
        console.error('Failed to parse policyScript:', e);
      }
    }

    console.log('[NFT Minter] Policy Script Type:', typeof policyScript);
    console.log('[NFT Minter] Policy Script:', JSON.stringify(policyScript, null, 2));
    console.log('[NFT Minter] Policy ID:', design.policyId);

    // Validate policy script structure
    if (!policyScript || typeof policyScript !== 'object') {
      throw new Error(`Invalid policy script: must be an object with native script structure. Got type: ${typeof policyScript}, value: ${JSON.stringify(policyScript)}`);
    }

    // Check if it has the required type property
    if (!policyScript.type) {
      throw new Error(`Policy script missing 'type' property. Got: ${JSON.stringify(Object.keys(policyScript))}`);
    }

    // Create forge script from policy
    const forgingScript = ForgeScript.fromNativeScript(policyScript);

    // Add each NFT to the transaction
    let mintNumber = startMintNumber;
    for (const recipient of recipients) {
      // Generate asset name
      const assetName = generateAssetName(design.assetNamePrefix, mintNumber);
      const assetNameHex = Buffer.from(assetName, 'utf-8').toString('hex');

      // Build metadata
      const metadata = buildCIP25Metadata(design, recipient, mintNumber);

      // Add minting operation with proper MeshSDK API
      tx.mintAsset(
        forgingScript,
        {
          unit: assetNameHex,
          quantity: '1'
        },
        metadata
      );

      // Send NFT to recipient
      tx.sendAssets(
        recipient.address,
        [
          {
            unit: design.policyId + assetNameHex,
            quantity: '1'
          }
        ]
      );

      mintNumber++;
    }

    // Build unsigned transaction
    const unsignedTx = await tx.build();

    return unsignedTx;
  } catch (error: any) {
    throw new Error(`Failed to build transaction: ${error.message}`);
  }
}

/**
 * Sign and submit minting transaction
 *
 * @param unsignedTx - Unsigned transaction from buildMintTransaction
 * @returns Transaction hash
 */
export async function signAndSubmitTransaction(unsignedTx: string): Promise<string> {
  if (!connectedWallet) {
    throw new Error('Wallet not connected');
  }

  try {
    // Sign transaction
    const signedTx = await connectedWallet.signTx(unsignedTx);

    // Submit to blockchain
    const txHash = await connectedWallet.submitTx(signedTx);

    return txHash;
  } catch (error: any) {
    throw new Error(`Failed to submit transaction: ${error.message}`);
  }
}

/**
 * Mint single batch of NFTs
 *
 * @param design - NFT design configuration
 * @param recipients - Recipients for this batch
 * @param startMintNumber - Starting mint number
 * @param network - Cardano network
 * @returns Mint result with transaction hash
 */
export async function mintBatch(
  design: NFTDesign,
  recipients: MintRecipient[],
  startMintNumber: number,
  network: 'mainnet' | 'preprod' = 'preprod'
): Promise<MintResult> {
  try {
    // Build transaction
    console.log(`      🔧 Building unsigned transaction...`);
    const unsignedTx = await buildMintTransaction(design, recipients, startMintNumber, network);
    console.log(`      ✅ Transaction built successfully`);

    // Sign and submit
    console.log(`      ✍️  Requesting wallet signature...`);
    const txHash = await signAndSubmitTransaction(unsignedTx);
    console.log(`      📤 Transaction submitted: ${txHash}`);

    // Generate asset IDs for tracking
    const assetIds: string[] = [];
    let mintNumber = startMintNumber;
    for (const recipient of recipients) {
      const assetName = generateAssetName(design.assetNamePrefix, mintNumber);
      const assetNameHex = Buffer.from(assetName, 'utf-8').toString('hex');
      assetIds.push(`${design.policyId}.${assetNameHex}`);
      mintNumber++;
    }

    return {
      success: true,
      txHash,
      assetIds
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if wallet has sufficient funds
 *
 * @param requiredAda - Required ADA (including fees and min UTXOs)
 * @returns True if wallet has enough
 */
export async function hasSufficientFunds(requiredAda: number): Promise<boolean> {
  const balanceLovelace = await getWalletBalance();
  const balanceAda = balanceLovelace / 1_000_000;

  return balanceAda >= requiredAda;
}
