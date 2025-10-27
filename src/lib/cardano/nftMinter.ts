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
  mediaType?: string;         // MIME type: "image/png", "image/gif", etc.
  metadataIpfsHash?: string;  // Optional: full metadata on IPFS
  policyId: string;
  policyScript: any;
  metadataTemplate?: {
    customFields?: Array<{
      fieldName: string;
      fieldType: 'fixed' | 'placeholder';
      fixedValue?: string;
    }>;
  };
  customAttributes?: Array<{
    trait_type: string;
    value: string;
  }>;
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
 * Check which Cardano wallets are installed in the browser
 *
 * @returns List of installed wallet names
 */
export async function getInstalledWallets(): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  const cardano = (window as any).cardano;
  if (!cardano) return [];

  const installedWallets: string[] = [];
  const knownWallets = ['lace', 'eternl', 'nami', 'typhon', 'flint', 'yoroi', 'gero'];

  for (const walletName of knownWallets) {
    if (cardano[walletName]) {
      installedWallets.push(walletName);
    }
  }

  return installedWallets;
}

/**
 * Connect admin wallet for minting
 *
 * @param walletName - Wallet to connect ('lace', 'eternl', 'nami', etc.)
 * @returns Connected wallet address
 */
export async function connectAdminWallet(walletName: string = 'lace'): Promise<string> {
  try {
    // Check if wallet is installed
    const installedWallets = await getInstalledWallets();
    if (!installedWallets.includes(walletName)) {
      throw new Error(`${walletName.charAt(0).toUpperCase() + walletName.slice(1)} wallet is not installed. Please install it first or choose a different wallet. Installed wallets: ${installedWallets.join(', ') || 'none'}`);
    }

    // Connect to wallet
    const wallet = await BrowserWallet.enable(walletName);

    // Get wallet address
    const usedAddresses = await wallet.getUsedAddresses();
    const address = usedAddresses[0];

    if (!address) {
      throw new Error('No address found in wallet. Please make sure your wallet is set up with at least one address.');
    }

    // Validate it's a payment address (not stake address)
    if (!isPaymentAddress(address)) {
      throw new Error('Wallet address is not a valid payment address. Please use a payment address (addr... or addr_test...)');
    }

    connectedWallet = wallet;
    walletAddress = address;

    return address;
  } catch (error: any) {
    // Don't wrap the error message again if it's already our custom message
    if (error.message.includes('wallet is not installed') || error.message.includes('No address found')) {
      throw error;
    }
    throw new Error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
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

  // Build base attributes in array format (OpenSea/industry standard)
  // Wallets like Lace display this format much better than object format
  const attributes: Array<{ trait_type: string; value: string }> = [
    { trait_type: "Mint Number", value: mintNumber.toString() },
    { trait_type: "Recipient", value: recipient.displayName || shortenAddress(recipient.address) },
    { trait_type: "Collection", value: design.tokenType }
  ];

  // Add custom metadata attributes from the design (these override policy template defaults)
  if (design.customAttributes && design.customAttributes.length > 0) {
    console.log('[ATTRIBUTES] Using design-specific customAttributes:', design.customAttributes);
    for (const attr of design.customAttributes) {
      if (attr.trait_type && attr.value) {
        console.log(`[ATTRIBUTES]   Adding: ${attr.trait_type} = ${attr.value}`);
        attributes.push({ trait_type: attr.trait_type, value: attr.value });
      }
    }
  }
  // Otherwise, fall back to policy template fixed fields
  else if (design.metadataTemplate?.customFields) {
    console.log('[ATTRIBUTES] WARNING - No customAttributes on design, falling back to policy template');
    console.log('[ATTRIBUTES] Policy template fields:', design.metadataTemplate.customFields);
    for (const field of design.metadataTemplate.customFields) {
      if (field.fieldType === 'fixed' && field.fixedValue) {
        console.log(`[ATTRIBUTES]   Adding from policy: ${field.fieldName} = ${field.fixedValue}`);
        attributes.push({ trait_type: field.fieldName, value: field.fixedValue });
      }
    }
  } else {
    console.log('[ATTRIBUTES] ERROR - No customAttributes AND no policy template, using base attributes only');
  }

  // Build CIP-25 metadata structure
  // Reference: https://cips.cardano.org/cip/CIP-25
  const metadata = {
    "721": {  // CIP-25 metadata label
      [design.policyId]: {
        [assetNameHex]: {
          name: `${design.name} #${mintNumber}`,
          image: ipfsImageUrl,
          mediaType: design.mediaType || "image/png",  // Use stored media type (GIF, PNG, JPEG, etc.)
          description: design.description,
          // Attributes in array format for better wallet display
          attributes
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
    // Log all design parameters to identify what's undefined
    console.log('[🔨MINT] Design parameters:');
    console.log('[🔨MINT]   - tokenType:', design.tokenType);
    console.log('[🔨MINT]   - name:', design.name);
    console.log('[🔨MINT]   - description:', design.description);
    console.log('[🔨MINT]   - assetNamePrefix:', design.assetNamePrefix);
    console.log('[🔨MINT]   - imageIpfsHash:', design.imageIpfsHash);
    console.log('[🔨MINT]   - policyId:', design.policyId);
    console.log('[🔨MINT]   - policyScript type:', typeof design.policyScript);
    console.log('[🔨MINT] Recipients count:', recipients.length);
    console.log('[🔨MINT] Network:', network);
    console.log('[🔨MINT] Connected wallet:', connectedWallet ? 'YES' : 'NO');

    // Create Blockfrost provider for fee calculation
    const blockfrostApiKey = network === 'mainnet'
      ? process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!
      : process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_TESTNET!;

    console.log('[🔨MINT] Blockfrost API key:', blockfrostApiKey ? 'PRESENT' : 'UNDEFINED');

    const blockfrostProvider = new BlockfrostProvider(blockfrostApiKey);

    // Initialize transaction
    console.log('[🔨MINT] Initializing transaction with wallet...');
    const tx = new Transaction({ initiator: connectedWallet });
    tx.setNetwork(network);
    console.log('[🔨MINT] Transaction initialized successfully');

    // Parse policy script if it's a string
    let policyScript = design.policyScript;
    if (typeof policyScript === 'string') {
      try {
        policyScript = JSON.parse(policyScript);
      } catch (e) {
        console.error('[🔨MINT] Failed to parse policyScript:', e);
      }
    }

    console.log('[🔨MINT] Policy Script Type:', typeof policyScript);
    console.log('[🔨MINT] Policy Script:', JSON.stringify(policyScript, null, 2));
    console.log('[🔨MINT] Policy ID:', design.policyId);

    // Validate policy script structure
    if (!policyScript || typeof policyScript !== 'object') {
      throw new Error(`Invalid policy script: must be an object with native script structure. Got type: ${typeof policyScript}, value: ${JSON.stringify(policyScript)}`);
    }

    // Check if it has the required type property
    if (!policyScript.type) {
      throw new Error(`Policy script missing 'type' property. Got: ${JSON.stringify(Object.keys(policyScript))}`);
    }

    // Create forge script from policy
    console.log('[🔨MINT] Creating forge script from policy...');
    console.log('[🔨MINT] Policy script:', JSON.stringify(policyScript));
    console.log('[🔨MINT] Policy ID from design:', design.policyId);

    // Create ForgeScript from the native policy script
    // This is the correct approach for MeshSDK - use fromNativeScript()
    // Reference: Working code in mintingTx.ts line 82
    console.log('[🔨MINT] Creating forge script from native policy script...');
    const forgingScript = ForgeScript.fromNativeScript(policyScript);
    console.log('[🔨MINT] Forge script created successfully');

    // Set transaction validity interval if policy has time-lock
    // CRITICAL: Time-locked policies (with "before" slot) require validity interval
    if (policyScript.type === 'all' && policyScript.scripts) {
      const beforeScript = policyScript.scripts.find((s: any) => s.type === 'before');
      if (beforeScript && beforeScript.slot) {
        console.log(`[🔨MINT] ⏰ Policy has expiry slot: ${beforeScript.slot}`);
        console.log(`[🔨MINT] ⏰ Setting transaction validity to expire before slot ${beforeScript.slot}`);
        // Set transaction to be valid until the policy expiry slot
        tx.setTimeToExpire(beforeScript.slot.toString());
      }
    }

    // Log warning: The connected wallet MUST have the keyHash that matches the policy
    console.warn('[🔨MINT] ⚠️ IMPORTANT: Connected wallet must control the policy!');
    console.warn('[🔨MINT]    Policy requires keyHash:', policyScript.keyHash || policyScript.scripts?.find((s: any) => s.type === 'sig')?.keyHash);
    console.warn('[🔨MINT]    If keyHash mismatch, transaction signing will fail (expected behavior)');

    // Add each NFT to the transaction
    let mintNumber = startMintNumber;
    for (const recipient of recipients) {
      console.log(`[🔨MINT] Processing NFT #${mintNumber}...`);

      // Generate asset name
      const assetName = generateAssetName(design.assetNamePrefix, mintNumber);
      const assetNameHex = Buffer.from(assetName, 'utf-8').toString('hex');
      console.log(`[🔨MINT]   - Asset name: ${assetName}`);
      console.log(`[🔨MINT]   - Asset name hex: ${assetNameHex}`);
      console.log(`[🔨MINT]   - Recipient address: ${recipient.address}`);

      // Build metadata
      const metadata = buildCIP25Metadata(design, recipient, mintNumber);
      console.log(`[🔨MINT]   - Metadata built:`, Object.keys(metadata));

      // Extract NFT-specific metadata from CIP-25 structure
      // MeshSDK's mintAsset expects just the NFT metadata, not the full {721: {...}} wrapper
      const nftMetadata = metadata["721"][design.policyId][assetNameHex];
      console.log(`[🔨MINT]   - NFT metadata extracted:`, Object.keys(nftMetadata));

      // Add minting operation with correct MeshSDK API
      // Reference: https://meshjs.dev/apis/transaction/minting
      console.log(`[🔨MINT]   - Adding mint asset to transaction...`);
      tx.mintAsset(
        forgingScript,
        {
          assetName: assetNameHex,
          assetQuantity: '1',
          metadata: nftMetadata,
          label: '721',  // CIP-25 metadata label
          recipient: recipient.address
        }
      );

      console.log(`[🔨MINT]   - NFT #${mintNumber} added to transaction successfully`);
      mintNumber++;
    }

    // Build unsigned transaction
    console.log('[🔨MINT] Building unsigned transaction...');
    const unsignedTx = await tx.build();
    console.log('[🔨MINT] Unsigned transaction built successfully');

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
    console.log(`[🔨MINT]       🔧 Building unsigned transaction...`);
    const unsignedTx = await buildMintTransaction(design, recipients, startMintNumber, network);
    console.log(`[🔨MINT]       ✅ Transaction built successfully`);

    // Sign and submit
    console.log(`[🔨MINT]       ✍️  Requesting wallet signature...`);
    const txHash = await signAndSubmitTransaction(unsignedTx);
    console.log(`[🔨MINT]       📤 Transaction submitted: ${txHash}`);

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
