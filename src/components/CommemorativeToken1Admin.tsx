'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { uploadFileToPinata } from '@/lib/cardano/pinata';
import { generateMintingPolicy, extractPaymentKeyHash } from '@/lib/cardano/policyGenerator';
import {
  connectAdminWallet,
  disconnectWallet,
  getWalletBalance,
  getInstalledWallets,
  type NFTDesign,
  type MintRecipient
} from '@/lib/cardano/nftMinter';
import {
  processBatchMinting,
  previewMintingPlan,
  type BatchMintConfig
} from '@/lib/cardano/batchMinter';

/**
 * Helper component to show if wallet's keyHash matches policy's keyHash
 */
function WalletMatchIndicator({ policyKeyHash, walletAddress }: { policyKeyHash: string; walletAddress: string }) {
  const [walletKeyHash, setWalletKeyHash] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkMatch = async () => {
      try {
        const currentKeyHash = await extractPaymentKeyHash(walletAddress);
        setWalletKeyHash(currentKeyHash);
      } catch (error) {
        console.error('Failed to extract wallet keyHash:', error);
        setWalletKeyHash(null);
      } finally {
        setIsChecking(false);
      }
    };
    checkMatch();
  }, [walletAddress]);

  if (isChecking) {
    return <div className="text-gray-500">Checking wallet compatibility...</div>;
  }

  if (!walletKeyHash) {
    return <div className="text-gray-500">Unable to verify wallet</div>;
  }

  const matches = walletKeyHash === policyKeyHash;

  if (matches) {
    return (
      <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/50 rounded px-2 py-1">
        <span className="text-green-400 text-sm font-bold">✓ MATCHES CURRENT WALLET</span>
        <span className="text-xs text-green-300">You can mint with this policy!</span>
      </div>
    );
  }

  return (
    <div className="bg-red-900/30 border border-red-500/50 rounded px-2 py-1">
      <div className="text-red-400 text-sm font-bold mb-1">✗ DOES NOT MATCH</div>
      <div className="text-xs text-red-300 mb-1">Current wallet keyHash:</div>
      <div className="font-mono text-xs text-red-400 break-all">{walletKeyHash}</div>
      <div className="text-xs text-red-300 mt-1">
        This policy was created with a different wallet. You cannot mint with it using your current wallet.
      </div>
    </div>
  );
}

const CAMPAIGN_NAME = "Commemorative Token 1";

export default function CommemorativeToken1Admin() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [newTestWallet, setNewTestWallet] = useState('');

  // Policy creation state
  const [policyName, setPolicyName] = useState('Mek Tycoon Commemorative Collection');
  const [policyDescription, setPolicyDescription] = useState('');
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [payoutWalletAddress, setPayoutWalletAddress] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  // Royalty Configuration
  const [royaltiesEnabled, setRoyaltiesEnabled] = useState(false);
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(2.5);
  const [royaltyAddress, setRoyaltyAddress] = useState('');

  // Metadata Template
  const [customMetadataFields, setCustomMetadataFields] = useState<Array<{
    fieldName: string;
    fieldType: 'fixed' | 'placeholder';
    fixedValue?: string;
  }>>([]);

  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [createdPolicy, setCreatedPolicy] = useState<{
    policyId: string;
    policyScript: any;
    expirySlot?: number;
  } | null>(null);

  // Policy Browser State
  const [showPolicyBrowser, setShowPolicyBrowser] = useState(false);
  const [selectedPolicyForView, setSelectedPolicyForView] = useState<any | null>(null);
  const [showCreateNewPolicy, setShowCreateNewPolicy] = useState(false);
  const [activePolicy, setActivePolicy] = useState<any | null>(null);

  // Design creation state
  const [showCreateDesign, setShowCreateDesign] = useState(false);
  const [selectedDesignForView, setSelectedDesignForView] = useState<any | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [collapsedPolicies, setCollapsedPolicies] = useState<Set<string>>(new Set());
  const [selectedPolicyTab, setSelectedPolicyTab] = useState<string | null>(null);
  const [designTokenType, setDesignTokenType] = useState('phase_1_beta');
  const [designName, setDesignName] = useState('Commemorative Token #1 - Early Miner');
  const [designDescription, setDesignDescription] = useState('Early supporter reward for connecting and mining gold');
  const [designAssetName, setDesignAssetName] = useState('CommemorativeToken1');

  // Sale Mode Settings
  const [saleMode, setSaleMode] = useState<'whitelist' | 'public_sale' | 'free_claim'>('whitelist');
  const [designPrice, setDesignPrice] = useState<number>(10); // ADA price
  const [designMinimumGold, setDesignMinimumGold] = useState<number>(0);
  const [designMaxSupply, setDesignMaxSupply] = useState<number | undefined>(undefined);

  // Image upload for design
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
    mediaType?: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Metadata upload for design
  const [metadataName, setMetadataName] = useState('Commemorative Token #1 - Early Miner');
  const [metadataDescription, setMetadataDescription] = useState('Early supporter reward for connecting and mining gold');
  const [metadataImageUrl, setMetadataImageUrl] = useState('');
  // Metadata attributes - will be auto-populated from active policy's template
  const [metadataAttributes, setMetadataAttributes] = useState<Array<{trait_type: string, value: string}>>([]);
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [metadataUploadResult, setMetadataUploadResult] = useState<{
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
  } | null>(null);
  const [metadataUploadError, setMetadataUploadError] = useState<string | null>(null);

  const [isCreatingDesign, setIsCreatingDesign] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);

  // Step 3: Minting state
  const [activeTab, setActiveTab] = useState<'whitelist' | 'public_sale' | 'free_claim'>('whitelist');
  // CRITICAL FIX: Store ENTIRE design object, not just tokenType string
  // This prevents wrong design from being selected due to stale database queries
  const [selectedDesignForMinting, setSelectedDesignForMinting] = useState<any | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);


  // Whitelist Manager Integration
  const [selectedWhitelistId, setSelectedWhitelistId] = useState<string | null>(null);
  const [isImportingWhitelist, setIsImportingWhitelist] = useState(false);

  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0); // in lovelace
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<'lace' | 'eternl' | 'nami' | 'typhon'>('lace');
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);

  // UI state
  const [showPolicySection, setShowPolicySection] = useState(false); // Collapsed by default since it's rare

  // BANDWIDTH OPTIMIZATION: Master switch - entire tab is dormant until user activates it
  const [commemorativeDataLoaded, setCommemorativeDataLoaded] = useState(false);
  const [eligibleDataLoaded, setEligibleDataLoaded] = useState(false);

  // Queries - ALL wrapped in skip logic, only load when commemorativeDataLoaded is true
  const config = useQuery(
    api.airdrop.getConfigByCampaign,
    commemorativeDataLoaded ? { campaignName: CAMPAIGN_NAME } : "skip"
  );
  const stats = useQuery(
    api.airdrop.getSubmissionStats,
    commemorativeDataLoaded ? { campaignName: CAMPAIGN_NAME } : "skip"
  );
  const eligibleCount = useQuery(
    api.airdrop.getEligibleUsersCount,
    commemorativeDataLoaded && eligibleDataLoaded ? { minimumGold: 0 } : "skip"
  );
  const eligibleUsers = useQuery(
    api.airdrop.getEligibleUsersList,
    commemorativeDataLoaded && eligibleDataLoaded ? { minimumGold: 0 } : "skip"
  );
  const allSubmissions = useQuery(
    api.airdrop.getAllSubmissions,
    commemorativeDataLoaded ? { campaignName: CAMPAIGN_NAME } : "skip"
  );
  const companyNames = useQuery(
    api.airdrop.getWalletCompanyNames,
    commemorativeDataLoaded && config?.testWallets && config.testWallets.length > 0
      ? { walletAddresses: config.testWallets }
      : "skip"
  );
  const network = (process.env.NEXT_PUBLIC_CARDANO_NETWORK as 'mainnet' | 'preprod' | 'preview') || 'preprod';
  const existingPolicies = useQuery(
    api.minting.getMintingPolicies,
    commemorativeDataLoaded ? { network } : "skip"
  );
  const allDesigns = useQuery(
    api.commemorativeTokens.getAllDesigns,
    commemorativeDataLoaded ? {} : "skip"
  );
  const allMints = useQuery(
    api.commemorativeTokens.getAllCommemorativeTokens,
    commemorativeDataLoaded ? { limit: 100 } : "skip"
  );
  const allSnapshots = useQuery(
    api.whitelists.getAllSnapshots,
    commemorativeDataLoaded ? undefined : "skip"
  );

  // Query batch minted tokens for the selected design
  const batchMintLogs = useQuery(
    api.commemorativeTokens.getBatchMintedTokens,
    commemorativeDataLoaded && selectedDesignForMinting?.tokenType ? { tokenType: selectedDesignForMinting.tokenType } : "skip"
  );

  // Mutations
  const upsertConfig = useMutation(api.airdrop.upsertConfig);
  const toggleActive = useMutation(api.airdrop.toggleActive);
  const storeMintingPolicy = useMutation(api.minting.storeMintingPolicy);
  const deleteMintingPolicy = useMutation(api.minting.deleteMintingPolicy);
  const initializeTokenType = useMutation(api.commemorativeTokens.initializeTokenType);
  const updateTokenType = useMutation(api.commemorativeTokens.updateTokenType);
  const deleteTokenType = useMutation(api.commemorativeTokens.deleteTokenType);
  const takeEligibilitySnapshot = useMutation(api.commemorativeTokens.takeEligibilitySnapshot);
  const importSnapshotToNFT = useMutation(api.commemorativeTokens.importSnapshotToNFT);
  const recordBatchMintedToken = useMutation(api.commemorativeTokens.recordBatchMintedToken);

  // Initialize campaign if it doesn't exist - only when data is loaded
  useEffect(() => {
    if (!commemorativeDataLoaded) return; // Don't run until user activates tab

    const initializeCampaign = async () => {
      if (config === undefined) return; // Still loading
      if (config !== null) return; // Already exists

      setIsInitializing(true);
      try {
        await upsertConfig({
          campaignName: CAMPAIGN_NAME,
          isActive: false, // Start disabled
          nftName: "Early Miner Commemorative NFT",
          nftDescription: "Early supporter reward for connecting and mining gold",
          minimumGold: 0, // Any gold qualifies
          testMode: true, // Start in test mode for safe testing
          testWallets: [], // Empty whitelist to start
        });
      } catch (error) {
        console.error('Error initializing campaign:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCampaign();
  }, [config, upsertConfig, commemorativeDataLoaded]);

  // Auto-fill metadata image URL when image is uploaded
  useEffect(() => {
    if (uploadResult?.ipfsUrl) {
      setMetadataImageUrl(uploadResult.ipfsUrl);
    }
  }, [uploadResult]);

  // Load saved active policy from localStorage on mount
  useEffect(() => {
    const savedPolicyId = localStorage.getItem('lastActivePolicyId');
    if (savedPolicyId && existingPolicies && existingPolicies.length > 0) {
      const savedPolicy = existingPolicies.find(p => p.policyId === savedPolicyId);
      if (savedPolicy) {
        setActivePolicy(savedPolicy);
      }
    }
  }, [existingPolicies]); // Run when policies load

  // Save active policy to localStorage whenever it changes
  useEffect(() => {
    if (activePolicy?.policyId) {
      localStorage.setItem('lastActivePolicyId', activePolicy.policyId);
    }
  }, [activePolicy]);

  // Detect installed wallets on mount
  useEffect(() => {
    const checkWallets = async () => {
      const wallets = await getInstalledWallets();
      setInstalledWallets(wallets);

      // If the currently selected wallet isn't installed, select the first available one
      if (wallets.length > 0 && !wallets.includes(selectedWalletType)) {
        setSelectedWalletType(wallets[0] as 'lace' | 'eternl' | 'nami' | 'typhon');
      }
    };
    checkWallets();
  }, []);

  // ===== WALLET CONNECTION & MINTING HANDLERS =====

  // Handler: Connect Admin Wallet
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    setMintError(null);

    try {
      const address = await connectAdminWallet(selectedWalletType);
      setWalletAddress(address);
      setWalletConnected(true);

      // Get balance
      const balance = await getWalletBalance();
      setWalletBalance(balance);

      console.log(`✅ ${selectedWalletType.charAt(0).toUpperCase() + selectedWalletType.slice(1)} wallet connected: ${address.substring(0, 30)}...`);
      console.log(`💰 Balance: ${(balance / 1_000_000).toFixed(2)} ADA`);
    } catch (error: any) {
      setMintError(`Failed to connect ${selectedWalletType} wallet: ${error.message}`);
      console.error('❌ Wallet connection error:', error);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Handler: Start Batch Minting
  const handleBatchMint = async () => {
    // CRITICAL FIX: Use the stored design object directly (no database lookup needed)
    const design = selectedDesignForMinting;

    if (!design || !walletConnected) {
      setMintError('Please connect wallet and select an NFT first');
      return;
    }

    console.log('MINTFLOW_START Batch mint initiated');
    console.log('MINTFLOW_SELECTION User selected design:', design.tokenType);
    console.log('MINTFLOW_DESIGN_OBJECT Using stored design object (no re-query):', JSON.stringify({
      tokenType: design.tokenType,
      displayName: design.displayName,
      imageUrl: design.imageUrl,
      policyId: design.policyId
    }, null, 2));

    console.log('MINTFLOW_DESIGN_FOUND Successfully found design');
    console.log('MINTFLOW_DESIGN_DATA Full design object:', JSON.stringify({
      tokenType: design.tokenType,
      displayName: design.displayName,
      description: design.description,
      assetNamePrefix: design.assetNamePrefix,
      imageUrl: design.imageUrl,
      mediaType: design.mediaType,
      policyId: design.policyId,
      customAttributes: design.customAttributes,
      totalMinted: design.totalMinted
    }, null, 2));

    // Get recipients from snapshot
    const snapshot = allSnapshots?.find(s => s._id === selectedWhitelistId);
    if (!snapshot) {
      setMintError('Please import a snapshot first');
      return;
    }

    const recipients: MintRecipient[] = snapshot.eligibleUsers.map(user => ({
      address: user.walletAddress,
      displayName: user.displayName
    }));

    console.log(`[🔨MINT] 📸 Snapshot Mode: Minting to ${recipients.length} addresses from snapshot`);

    // Look up the policy script from the mintingPolicies table
    const policy = existingPolicies?.find(p => p.policyId === design.policyId);
    if (!policy || !policy.policyScript) {
      setMintError(`Policy script not found for policy ID: ${design.policyId}`);
      setIsMinting(false);
      return;
    }

    console.log(`[🔨MINT] 🔑 Found policy: ${policy.policyName}`);
    console.log(`[🔨MINT]    Policy ID: ${policy.policyId}`);
    console.log(`[🔨MINT]    Policy Script Type:`, typeof policy.policyScript);
    console.log('[ATTRIBUTES] Policy metadataTemplate:', policy.metadataTemplate);

    // Validate wallet matches policy
    // Extract keyHash from policy script
    let policyScript = policy.policyScript;
    console.log(`[🔨MINT] 🔍 Raw policy script:`, policy.policyScript);
    console.log(`[🔨MINT] 🔍 Policy script type:`, typeof policy.policyScript);

    if (typeof policyScript === 'string') {
      try {
        policyScript = JSON.parse(policyScript);
        console.log(`[🔨MINT] 🔍 Parsed policy script:`, policyScript);
      } catch (e) {
        console.error(`[🔨MINT] ❌ Failed to parse policy script:`, e);
        setMintError('Invalid policy script format');
        setIsMinting(false);
        return;
      }
    }

    // Extract keyHash from policy script (handles both simple and time-locked policies)
    let policyKeyHash: string | undefined;
    if (policyScript?.keyHash) {
      // Simple signature policy: { type: 'sig', keyHash: '...' }
      policyKeyHash = policyScript.keyHash;
    } else if (policyScript?.scripts && Array.isArray(policyScript.scripts)) {
      // Time-locked policy: { type: 'all', scripts: [{ type: 'sig', keyHash: '...' }, ...] }
      const sigScript = policyScript.scripts.find((s: any) => s.type === 'sig');
      policyKeyHash = sigScript?.keyHash;
    }

    console.log(`[🔨MINT] 🔑 Policy requires keyHash: ${policyKeyHash}`);
    console.log(`[🔨MINT] 🔑 Policy script structure:`, JSON.stringify(policyScript, null, 2));

    if (!policyKeyHash) {
      const errorMsg =
        `⚠️ INVALID POLICY SCRIPT!\n\n` +
        `Could not extract keyHash from policy script.\n\n` +
        `Policy script structure:\n${JSON.stringify(policyScript, null, 2)}\n\n` +
        `This policy was created incorrectly or corrupted. You may need to create a new policy.`;

      setMintError(errorMsg);
      setIsMinting(false);
      console.error(`[🔨MINT] ❌ BLOCKED: Cannot extract keyHash from policy script!`);
      return;
    }

    // Extract keyHash from connected wallet
    try {
      console.log(`[🔨MINT] 🔍 Extracting keyHash from wallet address: ${walletAddress}`);
      const currentWalletKeyHash = await extractPaymentKeyHash(walletAddress!);
      console.log(`[🔨MINT] 🔑 Connected wallet keyHash: ${currentWalletKeyHash}`);
      console.log(`[🔨MINT] 🔍 KeyHash comparison:`);
      console.log(`[🔨MINT]    Policy:  ${policyKeyHash}`);
      console.log(`[🔨MINT]    Wallet:  ${currentWalletKeyHash}`);
      console.log(`[🔨MINT]    Match:   ${currentWalletKeyHash === policyKeyHash}`);

      if (currentWalletKeyHash !== policyKeyHash) {
        const errorMsg =
          `⚠️ WALLET MISMATCH DETECTED!\n\n` +
          `Policy keyHash:  ${policyKeyHash}\n` +
          `Wallet keyHash:  ${currentWalletKeyHash}\n\n` +
          `The connected wallet cannot sign for this policy. ` +
          `This usually means:\n` +
          `1. The policy was created with a different wallet\n` +
          `2. Your wallet switched to a different account/address\n` +
          `3. The policy script was created incorrectly\n\n` +
          `Please verify you're using the exact same wallet that created this policy.`;

        setMintError(errorMsg);
        setIsMinting(false);
        console.error(`[🔨MINT] ❌ BLOCKED: KeyHash mismatch!`);
        return;
      }

      console.log(`[🔨MINT] ✅ Wallet keyHash matches policy - proceeding with mint`);
    } catch (error: any) {
      console.error(`[🔨MINT] ❌ KeyHash verification failed:`, error);
      console.error(`[🔨MINT] ❌ Error details:`, error.message);
      console.warn(`[🔨MINT] ⚠️ WARNING: Cannot verify wallet keyHash - proceeding anyway (blockchain will reject if mismatch)`);
      // Continue anyway - let the blockchain reject it if there's a mismatch
    }

    // Prepare NFT design configuration
    const nftDesign: NFTDesign = {
      tokenType: design.tokenType,
      name: design.displayName,
      description: design.description || '',
      assetNamePrefix: design.assetNamePrefix || 'CommToken1',
      imageIpfsHash: design.imageUrl,  // Will be formatted to ipfs://
      mediaType: design.mediaType,  // ← MIME type for proper display (GIF, PNG, JPEG, etc.)
      policyId: design.policyId,
      policyScript: policy.policyScript,  // ← Use the actual script from mintingPolicies table
      metadataTemplate: policy.metadataTemplate,  // ← Include custom metadata fields from policy
      customAttributes: design.customAttributes  // ← Include design-specific attribute values (like "Poop?: yes")
    };

    console.log('MINTFLOW_CONFIG_CREATED NFT design configuration object created');
    console.log('MINTFLOW_CONFIG_DATA Complete configuration being sent to minting:', JSON.stringify({
      tokenType: nftDesign.tokenType,
      name: nftDesign.name,
      assetNamePrefix: nftDesign.assetNamePrefix,
      imageIpfsHash: nftDesign.imageIpfsHash,
      mediaType: nftDesign.mediaType,
      policyId: nftDesign.policyId,
      description: nftDesign.description,
      customAttributes: nftDesign.customAttributes
    }, null, 2));

    setIsMinting(true);
    setMintError(null);
    setMintingProgress({ current: 0, total: recipients.length, status: 'Preparing batch minting...' });

    console.log(`[🔨MINT] 🚀 Starting batch mint: ${recipients.length} NFTs`);

    try {
      // Ensure wallet is connected at module level (not just React state)
      console.log('[🔨MINT] 🔌 Re-verifying wallet connection...');
      const address = await connectAdminWallet(selectedWalletType);
      console.log(`[🔨MINT] ✅ ${selectedWalletType.charAt(0).toUpperCase() + selectedWalletType.slice(1)} wallet connected: ${address}`);

      // Verify we have enough balance
      const balance = await getWalletBalance();
      console.log(`[🔨MINT] 💰 Wallet balance: ${(balance / 1_000_000).toFixed(2)} ADA`);

      // Process batch minting
      const startTime = Date.now();
      const startMintNumber = (design.totalMinted || 0) + 1;  // Continue from last minted (e.g., if 5 minted, start at 6)
      console.log(`[🔨MINT] 🔢 Starting mint number: ${startMintNumber} (${design.totalMinted || 0} already minted)`);

      const result = await processBatchMinting({
        design: nftDesign,
        recipients: recipients,
        startMintNumber: startMintNumber,  // CRITICAL: Start from current count to avoid duplicate asset names
        batchSize: 10,  // 10 NFTs per transaction
        network: network as 'preprod' | 'mainnet',
        onProgress: (progress) => {
          setMintingProgress(progress);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`[🔨MINT] 📊 [${elapsed}s] Progress: ${progress.current}/${progress.total} NFTs | Batch ${progress.currentBatch}/${progress.totalBatches}`);
          console.log(`[🔨MINT]    Status: ${progress.status}`);
        },
        onBatchComplete: async (batchIndex, batchResult) => {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          if (batchResult.success) {
            console.log(`[🔨MINT] ✅ [${elapsed}s] Batch ${batchIndex + 1} SUCCESS`);
            console.log(`[🔨MINT]    TX Hash: ${batchResult.txHash}`);
            console.log(`[🔨MINT]    Asset IDs:`, batchResult.assetIds);
          } else {
            console.error(`[🔨MINT] ❌ [${elapsed}s] Batch ${batchIndex + 1} FAILED`);
            console.error(`[🔨MINT]    Error: ${batchResult.error}`);
          }

          // Record each minted token in database
          if (batchResult.success && batchResult.assetIds && batchResult.txHash) {
            const batchStartIndex = batchIndex * 10;
            for (let i = 0; i < batchResult.assetIds.length; i++) {
              const assetId = batchResult.assetIds[i];
              const recipient = recipients[batchStartIndex + i];
              // CRITICAL: Use actual mint number from blockchain (accounts for previous mints)
              const mintNumber = startMintNumber + batchStartIndex + i;

              try {
                await recordBatchMintedToken({
                  tokenType: design.tokenType,
                  mintNumber: mintNumber,
                  policyId: nftDesign.policyId,
                  assetName: assetId.split('.')[1],
                  assetId: assetId,
                  recipientAddress: recipient.address,
                  recipientDisplayName: recipient.displayName,
                  snapshotId: snapshot._id,
                  batchNumber: batchIndex + 1,
                  batchId: `batch_${Date.now()}`,
                  txHash: batchResult.txHash,
                  network: network,
                  nftName: `${nftDesign.name} #${mintNumber}`,
                  imageIpfsUrl: `ipfs://${nftDesign.imageIpfsHash.replace('ipfs://', '')}`
                });
              } catch (dbError: any) {
                console.error(`[🔨MINT] Failed to record mint #${mintNumber}:`, dbError);
              }
            }
          }
        }
      });

      // Show results
      if (result.success) {
        setMintingProgress({
          current: result.totalMinted,
          total: recipients.length,
          status: `✅ Minting complete! ${result.totalMinted} NFTs minted successfully.`
        });

        console.log('[🔨MINT] 🎉 Batch minting complete!');
        console.log('[🔨MINT] 📦 Total minted:', result.totalMinted);
        console.log('[🔨MINT] ❌ Total failed:', result.totalFailed);
        console.log('[🔨MINT] 🔗 Transaction hashes:', result.transactionHashes);

        if (result.totalFailed > 0) {
          console.warn('[🔨MINT] ⚠️  Some mints failed:', result.failedAddresses);
        }
      } else {
        setMintError(result.error || 'Batch minting failed');
        console.error('[🔨MINT] ❌ Batch minting failed:', result.error);
      }
    } catch (error: any) {
      setMintError(`Minting error: ${error.message}`);
      console.error('[🔨MINT] ❌ Fatal minting error:', error);
    } finally {
      setIsMinting(false);
    }
  };

  // Auto-select first policy if none selected and no saved policy
  useEffect(() => {
    if (existingPolicies && existingPolicies.length > 0 && !activePolicy) {
      // Only auto-select if there's no saved policy in localStorage
      const savedPolicyId = localStorage.getItem('lastActivePolicyId');
      if (!savedPolicyId) {
        setActivePolicy(existingPolicies[0]);
      }
    }
  }, [existingPolicies, activePolicy]);

  // Auto-populate metadata attributes from active policy's template
  useEffect(() => {
    if (activePolicy?.metadataTemplate?.customFields && activePolicy.metadataTemplate.customFields.length > 0) {
      const policyFields = activePolicy.metadataTemplate.customFields.map((field: any) => ({
        trait_type: field.fieldName,
        value: field.fieldType === 'fixed' ? (field.fixedValue || '') : ''
      }));

      // Only update if different to avoid infinite loops
      const currentFieldNames = metadataAttributes.map(a => a.trait_type).join(',');
      const policyFieldNames = policyFields.map((f: any) => f.trait_type).join(',');

      if (currentFieldNames !== policyFieldNames) {
        setMetadataAttributes(policyFields);
      }
    } else if (activePolicy && metadataAttributes.length === 0) {
      // If policy has no template, provide a default field
      setMetadataAttributes([
        { trait_type: 'Collection', value: '' }
      ]);
    }
  }, [activePolicy]);

  const handleCreatePolicy = async () => {
    // Validation
    if (!adminWalletAddress.trim()) {
      setPolicyError('Please enter your admin wallet address');
      return;
    }

    if (!policyName.trim()) {
      setPolicyError('Please enter a policy name');
      return;
    }

    if (royaltiesEnabled && !royaltyAddress.trim()) {
      setPolicyError('Please enter a royalty receiving address');
      return;
    }

    if (royaltiesEnabled && (royaltyPercentage < 0 || royaltyPercentage > 100)) {
      setPolicyError('Royalty percentage must be between 0 and 100');
      return;
    }

    setIsCreatingPolicy(true);
    setPolicyError(null);

    try {
      // Extract payment key hash from wallet address
      const keyHash = extractPaymentKeyHash(adminWalletAddress);

      // Parse expiry date if provided, or auto-generate one for uniqueness
      let expiryDateObj: Date;
      if (hasExpiry && expiryDate) {
        expiryDateObj = new Date(expiryDate);
        if (isNaN(expiryDateObj.getTime())) {
          throw new Error('Invalid expiry date');
        }
      } else {
        // IMPORTANT: Auto-generate a far-future unique expiry to create a unique policy ID
        // Each policy needs a unique ID - without an expiry, they'd all be identical
        // This is similar to how NMKR works - each new policy gets unique parameters
        const now = Date.now();
        const farFuture = new Date(now + (100 * 365 * 24 * 60 * 60 * 1000)); // 100 years from now
        // Add current timestamp to ensure uniqueness (even if creating multiple in same second)
        farFuture.setMilliseconds(now % 1000);
        expiryDateObj = farFuture;
        console.log(`[Policy] Auto-generated unique expiry: ${expiryDateObj.toISOString()} (100 years from now)`);
      }

      // Generate policy script and ID
      const policy = await generateMintingPolicy(keyHash, expiryDateObj);

      // Store in Convex with all NMKR fields
      const policyDbId = await storeMintingPolicy({
        policyId: policy.policyId,
        policyName: policyName.trim(),
        policyScript: policy.policyScript,
        keyHash,
        expirySlot: policy.expirySlot,
        expiryDate: expiryDateObj.getTime(),  // Always have an expiry now (either user-specified or auto-generated)
        network,
        notes: policyDescription.trim() || `Master policy for all commemorative tokens (Phase 1, Phase 2, etc.). Created via ${CAMPAIGN_NAME} admin.`,

        // Wallet Configuration
        adminWallet: adminWalletAddress.trim(),
        payoutWallet: payoutWalletAddress.trim() || undefined,

        // Royalty Configuration
        royaltiesEnabled: royaltiesEnabled,
        royaltyPercentage: royaltiesEnabled ? royaltyPercentage : undefined,
        royaltyAddress: royaltiesEnabled ? royaltyAddress.trim() : undefined,

        // Metadata Template
        metadataTemplate: customMetadataFields.length > 0 ? {
          customFields: customMetadataFields
        } : undefined,
      });

      console.log(`[Policy] Successfully stored policy (DB ID: ${policyDbId})`);
      setCreatedPolicy(policy);
      setPolicyError(null);
    } catch (error) {
      console.error('Policy creation error:', error);
      setPolicyError(error instanceof Error ? error.message : 'Failed to create policy');
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm(
      '⚠️ Delete Policy from Database?\n\n' +
      'This will ONLY remove the policy from your admin interface.\n' +
      'The policy and any minted NFTs will remain on the Cardano blockchain forever.\n\n' +
      'You can re-add the policy later if needed.\n\n' +
      'Continue with deletion?'
    )) {
      return;
    }

    try {
      await deleteMintingPolicy({ policyId });
      if (createdPolicy?.policyId === policyId) {
        setCreatedPolicy(null);
      }
    } catch (error) {
      console.error('Policy deletion error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete policy');
    }
  };

  const handleCreateDesign = async () => {
    // Validation
    if (!designName.trim()) {
      setDesignError('Please enter an NFT name');
      return;
    }

    if (!designAssetName.trim()) {
      setDesignError('Please enter an asset name');
      return;
    }

    if (!uploadResult?.ipfsUrl) {
      setDesignError('Please upload an image first');
      return;
    }

    if (!metadataUploadResult?.ipfsUrl) {
      setDesignError('Please upload metadata first');
      return;
    }

    const policyId = createdPolicy?.policyId || activePolicy?.policyId;
    if (!policyId) {
      setDesignError('Please create or select a master policy first (Step 1)');
      return;
    }

    setIsCreatingDesign(true);
    setDesignError(null);

    try {
      // Convert asset name to hex
      const assetNameHex = Buffer.from(designAssetName, 'utf-8').toString('hex');

      await initializeTokenType({
        tokenType: designTokenType,
        displayName: designName.trim(),
        description: designDescription.trim() || undefined,
        imageUrl: uploadResult.ipfsUrl,
        mediaType: uploadResult.mediaType, // MIME type for proper NFT display (GIF, PNG, JPEG, etc.)
        metadataUrl: metadataUploadResult.ipfsUrl,
        policyId,
        assetNameHex,
        isActive: false, // Start inactive - will be configured in Step 3

        // Custom metadata attributes (e.g., "Poop?: yes")
        customAttributes: metadataAttributes.filter(attr => attr.trait_type.trim() && attr.value.trim()),

        // Distribution settings (sale mode, price, eligibility) will be configured in Step 3
      });

      // Reset form
      setShowCreateDesign(false);
      setDesignName('');
      setDesignDescription('');
      setDesignAssetName('');
      setUploadResult(null);
      setMetadataUploadResult(null);
      setUploadFile(null);
      setMetadataImageUrl('');

      alert('NFT created successfully! Configure distribution settings in Step 3.');
    } catch (error) {
      console.error('NFT creation error:', error);
      setDesignError(error instanceof Error ? error.message : 'Failed to create NFT');
    } finally {
      setIsCreatingDesign(false);
    }
  };

  const handleDeleteDesign = async (tokenType: string) => {
    if (!confirm('Are you sure you want to delete this NFT? This cannot be undone if copies have been minted.')) {
      return;
    }

    try {
      await deleteTokenType({ tokenType });
    } catch (error) {
      console.error('NFT deletion error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete NFT');
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;
    try {
      await toggleActive({
        campaignName: CAMPAIGN_NAME,
        isActive: !config.isActive,
      });
    } catch (error) {
      console.error('Error toggling airdrop:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle airdrop');
    }
  };

  const handleToggleTestMode = async () => {
    if (!config) return;
    try {
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: !config.testMode,
        testWallets: config.testWallets || [],
      });
    } catch (error) {
      console.error('Error toggling test mode:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle test mode');
    }
  };

  const handleAddTestWallet = async () => {
    if (!config || !newTestWallet.trim()) return;

    const trimmed = newTestWallet.trim();
    const currentWallets = config.testWallets || [];

    if (currentWallets.includes(trimmed)) {
      alert('This wallet is already in the test list');
      return;
    }

    try {
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: config.testMode,
        testWallets: [...currentWallets, trimmed],
      });
      setNewTestWallet('');
    } catch (error) {
      console.error('Error adding test wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to add test wallet');
    }
  };

  const handleRemoveTestWallet = async (walletToRemove: string) => {
    if (!config) return;

    try {
      const currentWallets = config.testWallets || [];
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: config.testMode,
        testWallets: currentWallets.filter((w: string) => w !== walletToRemove),
      });
    } catch (error) {
      console.error('Error removing test wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove test wallet');
    }
  };

  const handleUploadToPinata = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await uploadFileToPinata(uploadFile, {
        name: `commemorative-token-1-${Date.now()}`,
        keyvalues: {
          campaign: CAMPAIGN_NAME,
          uploadedAt: new Date().toISOString()
        }
      });

      // Store media type from the uploaded file
      setUploadResult({
        ...result,
        mediaType: uploadFile.type || 'image/png'
      });
      setUploadFile(null);
    } catch (error) {
      console.error('Pinata upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUploadMetadataJson = async () => {
    if (!metadataImageUrl.trim() || !metadataName.trim()) {
      setMetadataUploadError('Please provide at least a name and image URL');
      return;
    }

    setIsUploadingMetadata(true);
    setMetadataUploadError(null);
    setMetadataUploadResult(null);

    try {
      // Build CIP-25 compliant metadata JSON
      const detectedMediaType = uploadResult?.mediaType || 'image/png';
      const metadata = {
        name: metadataName,
        description: metadataDescription,
        image: metadataImageUrl,
        mediaType: detectedMediaType,
        files: [
          {
            name: metadataName,
            mediaType: detectedMediaType,
            src: metadataImageUrl
          }
        ],
        attributes: metadataAttributes
      };

      // Convert to Blob and create File object
      const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'metadata.json', { type: 'application/json' });

      // Upload to Pinata
      const result = await uploadFileToPinata(jsonFile, {
        name: `commemorative-token-1-metadata-${Date.now()}`,
        keyvalues: {
          campaign: CAMPAIGN_NAME,
          type: 'metadata',
          uploadedAt: new Date().toISOString()
        }
      });

      setMetadataUploadResult(result);
    } catch (error) {
      console.error('Metadata upload error:', error);
      setMetadataUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploadingMetadata(false);
    }
  };

  const handleAddAttribute = () => {
    setMetadataAttributes([...metadataAttributes, { trait_type: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setMetadataAttributes(metadataAttributes.filter((_, i) => i !== index));
  };

  const handleUpdateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updated = [...metadataAttributes];
    updated[index][field] = value;
    setMetadataAttributes(updated);
  };

  const handleCopyImageUrl = () => {
    if (uploadResult?.ipfsUrl) {
      setMetadataImageUrl(uploadResult.ipfsUrl);
    }
  };

  const handleExportCSV = () => {
    if (!allSubmissions || allSubmissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Create CSV content
    const headers = ['Wallet Address', 'Receive Address', 'Gold at Submission', 'Submitted At', 'Status', 'Transaction Hash'];
    const rows = allSubmissions.map((sub: any) => [
      sub.walletAddress,
      sub.receiveAddress,
      sub.goldAtSubmission.toString(),
      new Date(sub.submittedAt).toLocaleString(),
      sub.status,
      sub.transactionHash || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commemorative-token-1-submissions-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Only show loading spinner if data has been loaded but config is still loading
  if (commemorativeDataLoaded && (config === undefined || isInitializing)) {
    return (
      <div className="text-center py-8">
        <div className="text-yellow-400 mb-2">⏳ Loading campaign...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BANDWIDTH OPTIMIZATION: Master Load Button - Tab is dormant until activated */}
      {!commemorativeDataLoaded ? (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">Commemorative Token System</h3>
          <p className="text-gray-400 mb-6">
            This tab uses custom minting (not NMKR). Since you're using NMKR now, this entire system is dormant to save bandwidth.
            <br />
            Click below if you need to access legacy commemorative token data.
          </p>
          <button
            onClick={() => setCommemorativeDataLoaded(true)}
            className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 border-2 border-yellow-400 rounded-lg text-white text-xl font-bold transition-all transform hover:scale-105"
          >
            📥 Load Commemorative Data
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Tip: Use the Whitelist Manager tab instead for NMKR-based minting
          </p>
        </div>
      ) : (
        <>
          {/* Data loaded - show normal content */}
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-sm text-green-300 font-semibold">Commemorative data loaded</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
            >
              Unload (refresh page)
            </button>
          </div>

          {/* Compact Campaign & Test Mode Controls */}
          <div className="bg-gradient-to-r from-purple-900/20 to-orange-900/20 border border-purple-500/30 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Campaign Status */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-gray-400">Campaign:</div>
            <div className={`px-3 py-1 rounded text-xs font-bold ${config?.isActive ? 'bg-green-600/30 text-green-400' : 'bg-gray-700/30 text-gray-400'}`}>
              {config?.isActive ? '✓ LIVE' : 'DISABLED'}
            </div>
            <button
              onClick={handleToggleActive}
              className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                config?.isActive
                  ? 'bg-red-600/30 hover:bg-red-600/50 text-red-400'
                  : 'bg-green-600/30 hover:bg-green-600/50 text-green-400'
              }`}
            >
              {config?.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-700"></div>

          {/* Test Mode */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-gray-400">Test Mode:</div>
            <div className={`px-3 py-1 rounded text-xs font-bold ${config?.testMode ? 'bg-orange-600/30 text-orange-400' : 'bg-gray-700/30 text-gray-400'}`}>
              {config?.testMode ? '🧪 TEST' : 'OFF'}
            </div>
            <button
              onClick={handleToggleTestMode}
              className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                config?.testMode
                  ? 'bg-gray-600/30 hover:bg-gray-600/50 text-gray-400'
                  : 'bg-orange-600/30 hover:bg-orange-600/50 text-orange-400'
              }`}
            >
              {config?.testMode ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Test Wallets - Compact inline view */}
        {config?.testMode && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-orange-400 font-bold">Test Wallets ({config.testWallets?.length || 0}):</span>
            <input
              type="text"
              value={newTestWallet}
              onChange={(e) => setNewTestWallet(e.target.value)}
              placeholder="stake1... or addr1..."
              className="flex-1 bg-black/50 border border-orange-500/30 rounded px-2 py-1 text-xs font-mono text-white"
            />
            <button
              onClick={handleAddTestWallet}
              disabled={!newTestWallet.trim()}
              className="px-2 py-1 bg-orange-600/30 hover:bg-orange-600/50 disabled:bg-gray-700/30 disabled:text-gray-500 text-orange-400 font-bold rounded text-xs transition-all"
            >
              Add
            </button>
            {config.testWallets && config.testWallets.length > 0 && (
              <span className="text-gray-500 text-xs">
                ({config.testWallets.map((w: string) => {
                  const name = companyNames?.[w];
                  return name || w.slice(0, 8);
                }).join(', ')})
              </span>
            )}
          </div>
        )}
      </div>

      {/* STEP 1: Policy Creation */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-4 border-indigo-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPolicySection(!showPolicySection)}
                className="text-3xl font-bold text-indigo-400 hover:text-indigo-300 transition-all"
              >
                {showPolicySection ? '▼' : '▶'}
              </button>
              <div className="text-3xl font-bold text-indigo-400">STEP 1</div>
              <h3 className="text-2xl font-bold text-white">Create Master Policy</h3>
              {!showPolicySection && activePolicy && (
                <div className="text-sm text-green-400 font-mono">
                  ✓ {activePolicy.policyName}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPolicyBrowser(!showPolicyBrowser)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                📂 Policy Browser ({existingPolicies?.length || 0})
              </button>
            </div>
          </div>
          {!showPolicySection && (
            <p className="text-xs text-gray-500 italic ml-12">
              Click ▶ to expand (one-time setup, rarely needed)
            </p>
          )}
          {showPolicySection && (
            <>
              <p className="text-sm text-gray-400">Generate ONE policy that will govern ALL commemorative tokens (Phase 1, Phase 2, etc.)</p>
              <p className="text-xs text-yellow-400 mt-1">⚠️ This is a ONE-TIME setup - all future commemorative NFTs will use this same policy</p>
            </>
          )}
        </div>

        {/* Collapsible Content */}
        {showPolicySection && (
        <>
        {/* Active Policy Indicator */}
        {activePolicy && (
          <div className="mb-4 bg-green-900/20 border-2 border-green-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-bold text-green-400">✓ Active Policy:</div>
                  <div className="text-lg font-bold text-white">{activePolicy.policyName}</div>
                  {activePolicy.metadataTemplate?.customFields && activePolicy.metadataTemplate.customFields.length > 0 && (
                    <div className="px-2 py-1 bg-cyan-600/30 rounded text-xs text-cyan-400 font-bold">
                      {activePolicy.metadataTemplate.customFields.length} Custom Fields
                    </div>
                  )}
                </div>
                <div className="text-xs font-mono text-gray-400">
                  Policy ID: {activePolicy.policyId}
                </div>
                {activePolicy.metadataTemplate?.customFields && activePolicy.metadataTemplate.customFields.length > 0 && (
                  <div className="text-xs text-cyan-400 mt-1">
                    Fields: {activePolicy.metadataTemplate.customFields.map((f: any) => f.fieldName).join(', ')}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPolicyBrowser(true)}
                className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-sm font-bold rounded transition-all"
              >
                Change Policy
              </button>
            </div>
          </div>
        )}

        {/* Policy Browser Modal */}
        {showPolicyBrowser && existingPolicies && (
          <div className="mb-6 bg-black/40 border-2 border-cyan-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-cyan-400">📂 Policy Browser</h4>
              <button
                onClick={() => setShowPolicyBrowser(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold rounded transition-all"
              >
                ✕ Close
              </button>
            </div>

            {existingPolicies.length > 0 ? (
              <>
                {/* Collapse All Button */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => {
                      if (collapsedPolicies.size === existingPolicies.length) {
                        setCollapsedPolicies(new Set());
                      } else {
                        setCollapsedPolicies(new Set(existingPolicies.map((p: any) => p._id)));
                      }
                    }}
                    className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 text-xs font-bold rounded transition-all"
                  >
                    {collapsedPolicies.size === existingPolicies.length ? '⬇ Expand All' : '⬆ Collapse All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingPolicies.map((policy: any) => {
                    const isCollapsed = collapsedPolicies.has(policy._id);

                    return (
                      <div key={policy._id} className={`bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-2 rounded-lg hover:border-indigo-500/60 transition-all ${
                        activePolicy?.policyId === policy.policyId
                          ? 'border-green-500/60 ring-2 ring-green-500/30'
                          : 'border-indigo-500/30'
                      }`}>
                        {isCollapsed ? (
                          // COLLAPSED VIEW - Compact row
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-sm truncate">{policy.policyName}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(policy.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                policy.isActive
                                  ? 'bg-green-600/30 text-green-400'
                                  : 'bg-gray-600/30 text-gray-400'
                              }`}>
                                {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newSet = new Set(collapsedPolicies);
                                newSet.delete(policy._id);
                                setCollapsedPolicies(newSet);
                              }}
                              className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold rounded transition-all whitespace-nowrap"
                            >
                              ⬇ Expand
                            </button>
                          </div>
                        ) : (
                          // EXPANDED VIEW - Full details
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-bold text-white text-lg mb-1">{policy.policyName}</div>
                                <div className="text-xs text-gray-500">
                                  Created {new Date(policy.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded text-xs font-bold ${
                                  policy.isActive
                                    ? 'bg-green-600/30 text-green-400'
                                    : 'bg-gray-600/30 text-gray-400'
                                }`}>
                                  {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </div>
                                <button
                                  onClick={() => {
                                    const newSet = new Set(collapsedPolicies);
                                    newSet.add(policy._id);
                                    setCollapsedPolicies(newSet);
                                  }}
                                  className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold rounded transition-all"
                                >
                                  ⬆
                                </button>
                              </div>
                            </div>

                    {/* Description */}
                    {policy.notes && (
                      <div className="text-xs text-gray-400 mb-3 italic line-clamp-2">
                        {policy.notes}
                      </div>
                    )}

                    {/* Policy ID */}
                    <div className="bg-black/40 border border-indigo-500/30 rounded px-2 py-1 mb-3">
                      <div className="text-xs text-gray-500 mb-1">Policy ID:</div>
                      <div className="font-mono text-xs text-indigo-400 break-all">
                        {policy.policyId.substring(0, 40)}...
                      </div>
                    </div>

                    {/* Policy KeyHash - CRITICAL for wallet matching */}
                    {(() => {
                      let policyScript = policy.policyScript;
                      if (typeof policyScript === 'string') {
                        try {
                          policyScript = JSON.parse(policyScript);
                        } catch (e) {
                          return null;
                        }
                      }

                      // Extract keyHash from both simple and time-locked policies
                      let policyKeyHash: string | undefined;
                      if (policyScript?.keyHash) {
                        // Simple signature policy: { type: 'sig', keyHash: '...' }
                        policyKeyHash = policyScript.keyHash;
                      } else if (policyScript?.scripts && Array.isArray(policyScript.scripts)) {
                        // Time-locked policy: { type: 'all', scripts: [{ type: 'sig', keyHash: '...' }, ...] }
                        const sigScript = policyScript.scripts.find((s: any) => s.type === 'sig');
                        policyKeyHash = sigScript?.keyHash;
                      }

                      if (!policyKeyHash) return null;

                      // Check if current wallet matches this policy
                      const matchesCurrentWallet = walletAddress ? (async () => {
                        try {
                          const currentKeyHash = await extractPaymentKeyHash(walletAddress);
                          return currentKeyHash === policyKeyHash;
                        } catch {
                          return false;
                        }
                      })() : Promise.resolve(false);

                      return (
                        <div className={`bg-black/40 border-2 rounded px-2 py-2 mb-3 ${
                          walletConnected ? 'border-yellow-500/50' : 'border-gray-600'
                        }`}>
                          <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                            🔑 Policy KeyHash:
                            {walletConnected && (
                              <span className="text-xs text-yellow-400 font-bold">
                                ← Must match your wallet!
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-yellow-400 break-all">
                            {policyKeyHash}
                          </div>
                          {walletConnected && walletAddress && (
                            <div className="mt-2 text-xs">
                              <WalletMatchIndicator
                                policyKeyHash={policyKeyHash}
                                walletAddress={walletAddress}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Wallets */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                        <div className="text-xs text-gray-500">Admin Wallet</div>
                        <div className="text-xs font-mono text-blue-400 truncate">
                          {policy.adminWallet.substring(0, 15)}...
                        </div>
                      </div>
                      {policy.payoutWallet && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                          <div className="text-xs text-gray-500">Payout Wallet</div>
                          <div className="text-xs font-mono text-green-400 truncate">
                            {policy.payoutWallet.substring(0, 15)}...
                          </div>
                        </div>
                      )}

                      {/* Royalties */}
                      {policy.royaltiesEnabled && (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                          <div className="text-xs text-gray-500">Royalties</div>
                          <div className="text-lg font-bold text-purple-400">
                            {policy.royaltyPercentage}%
                          </div>
                        </div>
                      )}

                      {/* Expiry */}
                      {policy.expiryDate && (
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2">
                          <div className="text-xs text-gray-500">Expires</div>
                          <div className="text-xs text-orange-400">
                            {new Date(policy.expiryDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {/* Custom Metadata Fields */}
                      {policy.metadataTemplate?.customFields?.length > 0 && (
                        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2 col-span-2">
                          <div className="text-xs text-gray-500 mb-1">Custom Fields</div>
                          <div className="text-xs text-cyan-400">
                            {policy.metadataTemplate.customFields.length} field{policy.metadataTemplate.customFields.length !== 1 ? 's' : ''}: {' '}
                            {policy.metadataTemplate.customFields.map((f: any) => f.fieldName).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {activePolicy?.policyId === policy.policyId ? (
                        <div className="flex-1 px-3 py-2 bg-green-600/30 text-green-400 text-xs font-bold rounded text-center">
                          ✓ Active Policy
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePolicy(policy);
                            setShowPolicyBrowser(false);
                          }}
                          className="flex-1 px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold rounded transition-all"
                        >
                          ✓ Use This Policy
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPolicyForView(policy);
                        }}
                        className="px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold rounded transition-all"
                      >
                        📋 Details
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete policy "${policy.policyName}"? This cannot be undone.`)) {
                            handleDeletePolicy(policy.policyId);
                          }
                        }}
                        className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📂</div>
                <div className="text-lg mb-2">No policies yet</div>
                <div className="text-sm">Create your first policy below</div>
              </div>
            )}

            {/* Policy Details Modal */}
            {selectedPolicyForView && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPolicyForView(null)}>
                <div className="relative w-[800px] max-w-[95vw] max-h-[90vh] bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border-4 border-indigo-500/50 rounded-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">{selectedPolicyForView.policyName}</h3>
                    <button
                      onClick={() => setSelectedPolicyForView(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded transition-all"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {/* Policy ID */}
                    <div className="bg-black/40 border border-indigo-500/30 rounded p-4">
                      <div className="text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">Policy ID</div>
                      <div className="font-mono text-sm text-indigo-400 break-all flex items-center gap-2">
                        <span className="flex-1">{selectedPolicyForView.policyId}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedPolicyForView.policyId)}
                          className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold rounded"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>

                    {/* Policy KeyHash - CRITICAL */}
                    {(() => {
                      let policyScript = selectedPolicyForView.policyScript;
                      if (typeof policyScript === 'string') {
                        try {
                          policyScript = JSON.parse(policyScript);
                        } catch (e) {
                          return null;
                        }
                      }
                      const policyKeyHash = policyScript?.keyHash;
                      if (!policyKeyHash) return null;

                      return (
                        <div className="bg-black/40 border-2 border-yellow-500/50 rounded p-4">
                          <div className="text-xs uppercase tracking-wider text-yellow-300 mb-2 font-bold flex items-center gap-2">
                            🔑 Policy KeyHash
                            <span className="text-yellow-400 normal-case font-normal text-xs">
                              (Must match signing wallet)
                            </span>
                          </div>
                          <div className="font-mono text-sm text-yellow-400 break-all flex items-center gap-2 mb-3">
                            <span className="flex-1">{policyKeyHash}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(policyKeyHash)}
                              className="px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 text-xs font-bold rounded"
                            >
                              📋 Copy
                            </button>
                          </div>
                          {walletConnected && walletAddress && (
                            <WalletMatchIndicator
                              policyKeyHash={policyKeyHash}
                              walletAddress={walletAddress}
                            />
                          )}
                          {!walletConnected && (
                            <div className="text-xs text-gray-400 bg-gray-900/50 rounded px-3 py-2">
                              💡 Connect a wallet to check if it matches this policy
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Description */}
                    {selectedPolicyForView.notes && (
                      <div className="bg-black/40 border border-gray-600 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">Description</div>
                        <div className="text-sm text-gray-300">{selectedPolicyForView.notes}</div>
                      </div>
                    )}

                    {/* Wallets */}
                    <div className="bg-black/40 border border-blue-500/30 rounded p-4">
                      <div className="text-xs uppercase tracking-wider text-blue-300 mb-3 font-bold">Wallet Configuration</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500">Admin Wallet (Signing)</div>
                          <div className="font-mono text-sm text-blue-400">{selectedPolicyForView.adminWallet}</div>
                        </div>
                        {selectedPolicyForView.payoutWallet && (
                          <div>
                            <div className="text-xs text-gray-500">Payout Wallet (Revenue)</div>
                            <div className="font-mono text-sm text-green-400">{selectedPolicyForView.payoutWallet}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Royalties */}
                    {selectedPolicyForView.royaltiesEnabled && (
                      <div className="bg-black/40 border border-purple-500/30 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-purple-300 mb-3 font-bold">Royalty Configuration</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Percentage</div>
                            <div className="text-2xl font-bold text-purple-400">{selectedPolicyForView.royaltyPercentage}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Receiving Address</div>
                            <div className="font-mono text-xs text-purple-400 break-all">{selectedPolicyForView.royaltyAddress}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata Configuration - Always show all fields */}
                    <div className="bg-black/40 border border-cyan-500/30 rounded p-4">
                      <div className="text-xs uppercase tracking-wider text-cyan-300 mb-3 font-bold">NFT Metadata Configuration</div>
                      <div className="space-y-2">
                        {/* Default Base Attributes */}
                        <div className="mb-4">
                          <div className="text-xs text-cyan-400 mb-2 font-semibold">Default Attributes (Auto-Added):</div>
                          <div className="space-y-1">
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="font-mono text-sm text-purple-400">Mint Number</div>
                                <div className="text-xs text-gray-400">Auto-generated (#1, #2, #3...)</div>
                              </div>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="font-mono text-sm text-purple-400">Collection</div>
                                <div className="text-xs text-gray-400">Token type identifier</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Custom Metadata Fields */}
                        {selectedPolicyForView.metadataTemplate?.customFields?.length > 0 ? (
                          <div>
                            <div className="text-xs text-cyan-400 mb-2 font-semibold">Custom Attributes (From Policy Template):</div>
                            <div className="space-y-1">
                              {selectedPolicyForView.metadataTemplate.customFields.map((field: any, index: number) => (
                                <div key={index} className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2">
                                  <div className="flex items-center justify-between">
                                    <div className="font-mono text-sm text-cyan-400">{field.fieldName}</div>
                                    <div className="text-xs text-gray-400">
                                      {field.fieldType === 'fixed' ? `Fixed: "${field.fixedValue}"` : 'Placeholder (Token-Specific)'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">No custom attributes configured in policy template</div>
                        )}
                      </div>
                    </div>

                    {/* Expiry */}
                    {selectedPolicyForView.expiryDate && (
                      <div className="bg-black/40 border border-orange-500/30 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-orange-300 mb-2 font-bold">Policy Expiry</div>
                        <div className="text-sm text-orange-400">
                          Locks on: {new Date(selectedPolicyForView.expiryDate).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Slot: {selectedPolicyForView.expirySlot}
                        </div>
                      </div>
                    )}

                    {/* Network & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-gray-600 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">Network</div>
                        <div className="text-lg font-bold text-yellow-400">{selectedPolicyForView.network.toUpperCase()}</div>
                      </div>
                      <div className="bg-black/40 border border-gray-600 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">Created</div>
                        <div className="text-sm text-gray-300">{new Date(selectedPolicyForView.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-black/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-indigo-300 uppercase">1. Basic Information</h4>

            <div>
              <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                Policy Name
              </label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="Mek Tycoon Commemorative Collection"
                className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                Description (Optional)
              </label>
              <textarea
                value={policyDescription}
                onChange={(e) => setPolicyDescription(e.target.value)}
                placeholder="Collection description..."
                rows={2}
                className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {/* 2. Wallet Configuration */}
          <div className="bg-black/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-indigo-300 uppercase">2. Wallet Configuration</h4>

            <div>
              <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                Admin Wallet Address (Signs Minting Transactions) *
              </label>
              <input
                type="text"
                value={adminWalletAddress}
                onChange={(e) => setAdminWalletAddress(e.target.value)}
                placeholder="addr_test1... or addr1..."
                className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white font-mono"
              />
              <div className="mt-1 text-xs text-gray-400">
                This wallet will sign all minting transactions for this policy
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                Payout Wallet Address (Receives Sales Revenue)
              </label>
              <input
                type="text"
                value={payoutWalletAddress}
                onChange={(e) => setPayoutWalletAddress(e.target.value)}
                placeholder="addr_test1... or addr1... (optional)"
                className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white font-mono"
              />
              <div className="mt-1 text-xs text-gray-400">
                Where sales revenue will be sent (can be same as admin wallet)
              </div>
            </div>
          </div>

          {/* 3. Policy Locking */}
          <div className="bg-black/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-orange-300 uppercase">3. Policy Locking Settings</h4>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3 text-xs text-orange-300">
              <strong>⚠️ Cannot be changed after creation!</strong> Once locked, you cannot mint new NFTs, burn tokens, or modify metadata.
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasExpiry"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="hasExpiry" className="text-sm text-indigo-300 font-bold cursor-pointer">
                Lock Policy on Specific Date
              </label>
            </div>

            {hasExpiry && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                  Lock Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white"
                />
                <div className="mt-1 text-xs text-gray-400">
                  Choose a date that gives you time to make changes after project sells out
                </div>
              </div>
            )}

            {!hasExpiry && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 text-xs text-blue-300">
                <div className="font-bold mb-1">No expiry lock - mint NFTs indefinitely</div>
                <div className="text-blue-400/80">
                  A unique far-future expiry (100 years) will be auto-generated to create a unique Policy ID.
                  Each policy creation generates a different ID for different collections.
                </div>
              </div>
            )}
          </div>

          {/* 4. Royalty Configuration */}
          <div className="bg-black/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-purple-300 uppercase">4. Royalty Configuration (CIP-0027)</h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="royaltiesEnabled"
                checked={royaltiesEnabled}
                onChange={(e) => setRoyaltiesEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="royaltiesEnabled" className="text-sm text-purple-300 font-bold cursor-pointer">
                Enable Royalties on Secondary Market Sales
              </label>
            </div>

            {royaltiesEnabled && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">
                    Royalty Percentage (0-100%)
                  </label>
                  <input
                    type="number"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-white"
                  />
                  <div className="mt-1 text-xs text-gray-400">
                    Typical range: 2.5% - 10%
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">
                    Royalty Receiving Address
                  </label>
                  <input
                    type="text"
                    value={royaltyAddress}
                    onChange={(e) => setRoyaltyAddress(e.target.value)}
                    placeholder="addr_test1... or addr1..."
                    className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-white font-mono"
                  />
                  <div className="mt-1 text-xs text-gray-400">
                    Where royalty payments will be sent
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 text-xs text-purple-300">
                  ⚠️ Royalty settings cannot be changed after policy is locked
                </div>
              </>
            )}
          </div>

          {/* 5. Metadata Template */}
          <div className="bg-black/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-cyan-300 uppercase">5. Metadata Template (CIP-25)</h4>

            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3 text-xs text-cyan-300">
              <strong>Default Fields (Automatically Included):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>policy_id - Auto-populated with your policy ID</li>
                <li>asset_name - On-chain name (max 32 chars)</li>
                <li>display_name - User-facing name (max 63 chars)</li>
                <li>image - IPFS link to artwork</li>
                <li>description - Description text (max 63 chars)</li>
                <li>mime_type - File format (auto-detected)</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider text-cyan-300 font-bold">
                  Custom Metadata Fields
                </label>
                <button
                  onClick={() => setCustomMetadataFields([...customMetadataFields, { fieldName: '', fieldType: 'placeholder', fixedValue: '' }])}
                  className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold rounded transition-all"
                >
                  + Add Field
                </button>
              </div>

              {customMetadataFields.length > 0 ? (
                <div className="space-y-2">
                  {customMetadataFields.map((field, index) => (
                    <div key={index} className="bg-black/50 border border-cyan-500/30 rounded p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={field.fieldName}
                          onChange={(e) => {
                            const updated = [...customMetadataFields];
                            updated[index].fieldName = e.target.value;
                            setCustomMetadataFields(updated);
                          }}
                          placeholder="Field name (e.g., 'phase', 'rarity')"
                          className="bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white"
                        />
                        <select
                          value={field.fieldType}
                          onChange={(e) => {
                            const updated = [...customMetadataFields];
                            updated[index].fieldType = e.target.value as 'fixed' | 'placeholder';
                            setCustomMetadataFields(updated);
                          }}
                          className="bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="placeholder">Placeholder (Token-Specific)</option>
                          <option value="fixed">Fixed Value (Same for All)</option>
                        </select>
                      </div>
                      {field.fieldType === 'fixed' && (
                        <input
                          type="text"
                          value={field.fixedValue || ''}
                          onChange={(e) => {
                            const updated = [...customMetadataFields];
                            updated[index].fixedValue = e.target.value;
                            setCustomMetadataFields(updated);
                          }}
                          placeholder="Fixed value for this field"
                          className="w-full bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white"
                        />
                      )}
                      <button
                        onClick={() => setCustomMetadataFields(customMetadataFields.filter((_, i) => i !== index))}
                        className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs">
                  No custom fields added. Click "+ Add Field" to create custom metadata fields.
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreatePolicy}
              disabled={!adminWalletAddress.trim() || !policyName.trim() || isCreatingPolicy}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-lg"
            >
              {isCreatingPolicy ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating Policy...
                </>
              ) : (
                <>🔨 Generate Policy Script</>
              )}
            </button>
          </div>

          {/* Error */}
          {policyError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 font-bold mb-1">❌ Policy Creation Failed</div>
              <div className="text-sm text-red-300">{policyError}</div>
            </div>
          )}

          {/* Success */}
          {createdPolicy && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 space-y-3">
              <div className="text-green-400 font-bold mb-2 text-lg">✅ Policy Created Successfully!</div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-green-300 mb-1 font-bold">
                  Policy ID (Use this for all NFTs in this collection)
                </label>
                <div className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-sm font-mono text-green-400 flex items-center gap-2">
                  <span className="flex-1 break-all">{createdPolicy.policyId}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdPolicy.policyId)}
                    className="px-2 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 text-xs font-bold rounded transition-all"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {createdPolicy.expirySlot && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-green-300 mb-1 font-bold">
                    Expiry Slot
                  </label>
                  <div className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-sm font-mono text-green-400">
                    {createdPolicy.expirySlot}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                <strong>📝 Next Steps:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Master policy saved - ALL commemorative tokens will use this policy ID</li>
                  <li>Copy the Policy ID above - you'll need it for ALL token metadata</li>
                  <li>Proceed to Step 2 to upload your NFT image for Token #1</li>
                  <li>For future tokens (Phase 2, etc.), skip Step 1 and reuse this policy</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* STEP 2: NFT Configuration */}
      <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-4 border-pink-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-pink-400">STEP 2</div>
              <h3 className="text-2xl font-bold text-white">NFT Configuration</h3>
            </div>
            <button
              onClick={() => setShowCreateDesign(!showCreateDesign)}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all"
            >
              {showCreateDesign ? '✕ Cancel' : '+ Create New NFT'}
            </button>
          </div>
          <p className="text-sm text-gray-400">Create NFTs that can be minted multiple times (Phase 1, Phase 2, etc.)</p>
        </div>

        {/* Create NFT Form */}
        {showCreateDesign && (
          <div className="mb-6 bg-black/40 border-2 border-pink-500/30 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-bold text-pink-300 mb-4">Create New NFT</h4>

            {/* Token Type ID */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Token Type ID (unique identifier)
              </label>
              <input
                type="text"
                value={designTokenType}
                onChange={(e) => setDesignTokenType(e.target.value)}
                placeholder="phase_1_beta"
                className="w-full bg-black/50 border border-pink-500/30 rounded px-3 py-2 text-sm font-mono text-white"
              />
              <div className="mt-1 text-xs text-gray-400">
                Use snake_case (e.g., phase_1_beta, phase_2_launch, anniversary_2026)
              </div>
            </div>

            {/* NFT Name */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                NFT Name
              </label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Commemorative Token #1 - Early Miner"
                className="w-full bg-black/50 border border-pink-500/30 rounded px-3 py-2 text-sm text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Description
              </label>
              <textarea
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="Awarded to early supporters who connected their wallet and accumulated gold"
                rows={2}
                className="w-full bg-black/50 border border-pink-500/30 rounded px-3 py-2 text-sm text-white"
              />
            </div>

            {/* Asset Name (for sub-assets) */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Asset Name (for on-chain sub-asset)
              </label>
              <input
                type="text"
                value={designAssetName}
                onChange={(e) => setDesignAssetName(e.target.value)}
                placeholder="CommemorativeToken1"
                className="w-full bg-black/50 border border-pink-500/30 rounded px-3 py-2 text-sm font-mono text-white"
              />
              <div className="mt-1 text-xs text-gray-400">
                This will be converted to hex and used as the asset name on-chain
              </div>
            </div>

            {/* Note about distribution settings */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
              <div className="text-xs text-blue-300">
                💡 <strong>Distribution settings</strong> (sale mode, pricing, whitelist eligibility) will be configured in <strong>Step 3: Minting & Distribution</strong> after creating this NFT.
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-black/30 rounded-lg p-4">
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Upload Image to IPFS
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="flex-1 bg-black/50 border border-pink-500/30 rounded px-3 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700 disabled:opacity-50"
                />
                <button
                  onClick={handleUploadToPinata}
                  disabled={!uploadFile || isUploading}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded transition-all"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {uploadResult && (
                <div className="mt-2 text-xs text-green-400">
                  ✓ Uploaded: {uploadResult.ipfsUrl}
                </div>
              )}
            </div>

            {/* Metadata Builder */}
            <div className="bg-black/30 rounded-lg p-4">
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Build & Upload Metadata JSON
              </label>

              <div className="space-y-3">
                {/* Auto-fill image URL */}
                {uploadResult?.ipfsUrl && (
                  <button
                    onClick={() => setMetadataImageUrl(uploadResult.ipfsUrl)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    ↑ Use image URL from above
                  </button>
                )}

                {/* Attributes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">Attributes (edit values for this token)</div>
                      {activePolicy?.metadataTemplate?.customFields && activePolicy.metadataTemplate.customFields.length > 0 && (
                        <div className="text-xs text-cyan-400">
                          ✓ Auto-populated from policy template ({activePolicy.metadataTemplate.customFields.length} fields)
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddAttribute}
                      className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold rounded"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {metadataAttributes.map((attr, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={attr.trait_type}
                          onChange={(e) => handleUpdateAttribute(index, 'trait_type', e.target.value)}
                          placeholder="Trait Type"
                          className="flex-1 bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleRemoveAttribute(index)}
                          className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Metadata */}
                <button
                  onClick={handleUploadMetadataJson}
                  disabled={!metadataImageUrl.trim() || isUploadingMetadata}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded transition-all"
                >
                  {isUploadingMetadata ? 'Uploading Metadata...' : 'Upload Metadata to IPFS'}
                </button>
                {metadataUploadResult && (
                  <div className="mt-2 text-xs text-green-400">
                    ✓ Metadata uploaded: {metadataUploadResult.ipfsUrl}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {designError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                {designError}
              </div>
            )}

            {/* Save NFT Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateDesign(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDesign}
                disabled={isCreatingDesign}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all"
              >
                {isCreatingDesign ? 'Creating...' : '💾 Save NFT'}
              </button>
            </div>
          </div>
        )}

        {/* NFT List */}
        <div>
          {(() => {
            // Group designs by policy ID
            const designsByPolicy: Record<string, any[]> = {};
            allDesigns?.forEach((design: any) => {
              if (!designsByPolicy[design.policyId]) {
                designsByPolicy[design.policyId] = [];
              }
              designsByPolicy[design.policyId].push(design);
            });

            const policyIds = Object.keys(designsByPolicy);

            // Auto-select first policy if none selected
            if (!selectedPolicyTab && policyIds.length > 0) {
              setSelectedPolicyTab(policyIds[0]);
            }

            const currentPolicyDesigns = selectedPolicyTab ? designsByPolicy[selectedPolicyTab] || [] : [];

            return (
              <>
                {/* Header with tabs */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-pink-400">
                      Created NFTs ({allDesigns?.length || 0})
                    </h4>
                  </div>
                  {currentPolicyDesigns.length > 0 && (
                    <button
                      onClick={() => {
                        if (collapsedCards.size === currentPolicyDesigns.length) {
                          setCollapsedCards(new Set());
                        } else {
                          setCollapsedCards(new Set(currentPolicyDesigns.map((d: any) => d._id)));
                        }
                      }}
                      className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 text-xs font-bold rounded transition-all"
                    >
                      {collapsedCards.size === currentPolicyDesigns.length ? '⬇ Expand All' : '⬆ Collapse All'}
                    </button>
                  )}
                </div>

                {/* Policy Tabs */}
                {policyIds.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {policyIds.map(policyId => {
                      const policyInfo = existingPolicies?.find((p: any) => p.policyId === policyId);
                      const designCount = designsByPolicy[policyId].length;
                      return (
                        <button
                          key={policyId}
                          onClick={() => setSelectedPolicyTab(policyId)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                            selectedPolicyTab === policyId
                              ? 'bg-pink-600 text-white border-2 border-pink-400'
                              : 'bg-black/40 text-pink-300 border border-pink-500/30 hover:bg-pink-900/30'
                          }`}
                        >
                          {policyInfo?.policyName || `Policy ${policyId.substring(0, 8)}...`}
                          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {designCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentPolicyDesigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentPolicyDesigns.map((design: any) => {
                const isCollapsed = collapsedCards.has(design._id);

                return (
                  <div key={design._id} className={`bg-black/40 border border-pink-500/30 rounded-lg transition-all ${isCollapsed ? 'p-2' : 'p-4'}`}>
                    {isCollapsed ? (
                      // COLLAPSED VIEW - Compact thumbnail
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded transition-all"
                        onClick={() => {
                          const newCollapsed = new Set(collapsedCards);
                          newCollapsed.delete(design._id);
                          setCollapsedCards(newCollapsed);
                        }}
                      >
                        <img
                          src={design.imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                          alt={design.displayName}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-xs truncate">{design.displayName}</div>
                          <div className="flex gap-2 text-[10px] text-gray-400">
                            <span>Minted: {design.totalMinted || 0}</span>
                            <span className={design.isActive ? 'text-green-400' : 'text-gray-500'}>
                              {design.isActive ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newCollapsed = new Set(collapsedCards);
                            newCollapsed.delete(design._id);
                            setCollapsedCards(newCollapsed);
                          }}
                          className="text-gray-400 hover:text-white text-sm px-1"
                        >
                          ⬇
                        </button>
                      </div>
                    ) : (
                      // EXPANDED VIEW - Full card
                      <>
                        {/* Collapse Button */}
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => {
                              const newCollapsed = new Set(collapsedCards);
                              newCollapsed.add(design._id);
                              setCollapsedCards(newCollapsed);
                            }}
                            className="text-gray-400 hover:text-white text-xs px-2 py-1"
                          >
                            ⬆ Collapse
                          </button>
                        </div>

                        {/* Preview Image */}
                        <div className="w-full h-32 bg-gray-900 rounded mb-3 flex items-center justify-center overflow-hidden">
                          <img
                            src={design.imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                            alt={design.displayName}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="mb-3">
                          <div className="font-bold text-white text-sm mb-1">{design.displayName}</div>
                          <div className="text-xs text-gray-400 font-mono mb-2">ID: {design.tokenType}</div>
                          <div className="text-xs text-gray-500">
                            Asset: {Buffer.from(design.assetNameHex, 'hex').toString('utf-8')}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                            <div className="text-xs text-gray-400">Minted</div>
                            <div className="text-lg font-bold text-blue-400">{design.totalMinted || 0}</div>
                          </div>
                          <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                            <div className="text-xs text-gray-400">Next #</div>
                            <div className="text-lg font-bold text-purple-400">{(design.currentEdition || 0) + 1}</div>
                          </div>
                        </div>

                        {/* Status Toggle */}
                        <button
                          onClick={async () => {
                            try {
                              await updateTokenType({
                                tokenType: design.tokenType,
                                isActive: !design.isActive,
                              });
                            } catch (error: any) {
                              console.error('Failed to toggle design status:', error);
                            }
                          }}
                          className={`w-full px-2 py-1 rounded text-xs font-bold text-center mb-3 transition-all ${
                            design.isActive
                              ? 'bg-green-600/30 hover:bg-green-600/50 text-green-400'
                              : 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-400'
                          }`}
                        >
                          {design.isActive ? '✓ ACTIVE (click to deactivate)' : '✗ INACTIVE (click to activate)'}
                        </button>

                        {/* Sale Mode Selector */}
                        <div className="mb-3">
                          <label className="block text-xs text-gray-400 mb-1">Distribution Mode</label>
                          <select
                            value={design.saleMode || ''}
                            onChange={async (e) => {
                              const newMode = e.target.value as 'whitelist' | 'public_sale' | 'free_claim';
                              try {
                                await updateTokenType({
                                  tokenType: design.tokenType,
                                  saleMode: newMode || undefined,
                                });
                              } catch (error: any) {
                                alert(`Error updating sale mode: ${error.message}`);
                              }
                            }}
                            className="w-full bg-black/50 border border-pink-500/30 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="">Not Set</option>
                            <option value="whitelist">Whitelist</option>
                            <option value="public_sale">Public Sale</option>
                            <option value="free_claim">Free Claim</option>
                          </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteDesign(design.tokenType)}
                            className="flex-1 px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setSelectedDesignForView(design)}
                            className="flex-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs font-bold rounded transition-all"
                          >
                            View
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <div>No NFTs in this policy yet.</div>
                  </div>
                )}
              </>
            );
          })()}

          {(!allDesigns || allDesigns.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <div>No NFTs yet. Click "+ Create New NFT" to create one.</div>
            </div>
          )}
        </div>
      </div>

      {/* NFT Design Details Modal */}
      {selectedDesignForView && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDesignForView(null)}>
          <div className="relative w-[900px] max-w-[95vw] max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-4 border-purple-500/50 rounded-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{selectedDesignForView.displayName || selectedDesignForView.name}</h3>
              <button
                onClick={() => setSelectedDesignForView(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded transition-all"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Preview */}
              <div className="bg-black/40 border border-purple-500/30 rounded p-4">
                <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">NFT Image</div>
                {selectedDesignForView.imageUrl ? (
                  <img
                    src={selectedDesignForView.imageUrl.startsWith('ipfs://')
                      ? `https://ipfs.io/ipfs/${selectedDesignForView.imageUrl.replace('ipfs://', '')}`
                      : selectedDesignForView.imageUrl
                    }
                    alt={selectedDesignForView.displayName || selectedDesignForView.name}
                    className="w-full rounded border-2 border-purple-500/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23333"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>';
                    }}
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-800 rounded flex items-center justify-center text-gray-500">
                    No image uploaded
                  </div>
                )}
              </div>

              {/* Design Information */}
              <div className="space-y-4">
                {/* Token Type */}
                <div className="bg-black/40 border border-purple-500/30 rounded p-4">
                  <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">Token Type</div>
                  <div className="text-lg font-bold text-white">{selectedDesignForView.tokenType}</div>
                </div>

                {/* Mint Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-green-500/30 rounded p-4">
                    <div className="text-xs uppercase tracking-wider text-green-300 mb-1 font-bold">Total Minted</div>
                    <div className="text-2xl font-bold text-green-400">{selectedDesignForView.totalMinted || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-blue-500/30 rounded p-4">
                    <div className="text-xs uppercase tracking-wider text-blue-300 mb-1 font-bold">Current Edition</div>
                    <div className="text-2xl font-bold text-blue-400">{selectedDesignForView.totalMinted || 0}</div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-black/40 border border-gray-600 rounded p-4">
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">Status</div>
                  <div className={`text-lg font-bold ${selectedDesignForView.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedDesignForView.isActive ? '✓ Active' : '✗ Inactive'}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Details */}
            <div className="mt-4 space-y-4">
              {/* Description */}
              <div className="bg-black/40 border border-purple-500/30 rounded p-4">
                <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">Description</div>
                <div className="text-sm text-gray-300">{selectedDesignForView.description}</div>
              </div>

              {/* Policy & IPFS Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 border border-yellow-500/30 rounded p-4">
                  <div className="text-xs uppercase tracking-wider text-yellow-300 mb-2 font-bold">Policy ID</div>
                  <div className="font-mono text-xs text-yellow-400 break-all">{selectedDesignForView.policyId}</div>
                </div>
                <div className="bg-black/40 border border-cyan-500/30 rounded p-4">
                  <div className="text-xs uppercase tracking-wider text-cyan-300 mb-2 font-bold">Image IPFS URL</div>
                  <div className="font-mono text-xs text-cyan-400 break-all">{selectedDesignForView.imageUrl || 'Not uploaded'}</div>
                </div>
              </div>

              {/* Asset Name */}
              <div className="bg-black/40 border border-purple-500/30 rounded p-4">
                <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 font-bold">Asset Name (Hex)</div>
                <div className="font-mono text-sm text-purple-400">{selectedDesignForView.assetNameHex || 'Not set'}</div>
              </div>

              {/* Distribution Settings */}
              {selectedDesignForView.saleMode && (
                <div className="bg-black/40 border border-orange-500/30 rounded p-4">
                  <div className="text-xs uppercase tracking-wider text-orange-300 mb-2 font-bold">Distribution Mode</div>
                  <div className="text-sm text-orange-400 capitalize">{selectedDesignForView.saleMode.replace('_', ' ')}</div>
                </div>
              )}

              {/* Created Date */}
              <div className="bg-black/40 border border-gray-600 rounded p-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">Created</div>
                <div className="text-sm text-gray-300">{new Date(selectedDesignForView.createdAt).toLocaleString()}</div>
              </div>

              {/* Metadata Preview */}
              {(() => {
                // Find the policy for this design to get metadata template
                const policy = existingPolicies?.find((p: any) => p.policyId === selectedDesignForView.policyId);

                // Build sample metadata
                const sampleAttributes: Record<string, string> = {
                  "Mint Number": "1",
                  "Recipient": "example_user",
                  "Collection": selectedDesignForView.tokenType
                };

                // Use design-specific custom attributes if available
                if (selectedDesignForView.customAttributes && selectedDesignForView.customAttributes.length > 0) {
                  for (const attr of selectedDesignForView.customAttributes) {
                    if (attr.trait_type && attr.value) {
                      sampleAttributes[attr.trait_type] = attr.value;
                    }
                  }
                }
                // Otherwise fall back to policy template custom fields
                else if (policy?.metadataTemplate?.customFields) {
                  for (const field of policy.metadataTemplate.customFields) {
                    if (field.fieldType === 'fixed' && field.fixedValue) {
                      sampleAttributes[field.fieldName] = field.fixedValue;
                    } else if (field.fieldType === 'placeholder') {
                      sampleAttributes[field.fieldName] = '<token-specific>';
                    }
                  }
                }

                return (
                  <div className="bg-black/40 border-2 border-cyan-500/50 rounded p-4">
                    <div className="text-xs uppercase tracking-wider text-cyan-300 mb-3 font-bold flex items-center gap-2">
                      📋 NFT Metadata Preview
                      <span className="text-xs text-gray-400 normal-case font-normal">(CIP-25 Structure)</span>
                    </div>

                    <div className="space-y-3">
                      {/* Core Metadata */}
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3">
                        <div className="text-xs text-cyan-400 font-bold mb-2">Core Fields</div>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex">
                            <span className="text-gray-500 w-32">name:</span>
                            <span className="text-cyan-300">{selectedDesignForView.displayName} #001</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32">image:</span>
                            <span className="text-cyan-300 truncate">{selectedDesignForView.imageUrl || 'ipfs://...'}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32">mediaType:</span>
                            <span className="text-cyan-300">{selectedDesignForView.mediaType || 'image/png'}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32">description:</span>
                            <span className="text-cyan-300">{selectedDesignForView.description}</span>
                          </div>
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                        <div className="text-xs text-green-400 font-bold mb-2">Attributes</div>
                        <div className="space-y-1 text-xs font-mono">
                          {Object.entries(sampleAttributes).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="text-gray-500 w-32">{key}:</span>
                              <span className={`${value === '<token-specific>' ? 'text-yellow-400 italic' : 'text-green-300'}`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {policy?.metadataTemplate?.customFields && policy.metadataTemplate.customFields.length > 0 && (
                        <div className="text-xs text-gray-400 italic">
                          💡 Custom fields from "{policy.policyName}" policy template
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Minting & Distribution */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-4 border-cyan-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl font-bold text-cyan-400">STEP 3</div>
            <h3 className="text-2xl font-bold text-white">Minting & Distribution</h3>
          </div>
          <p className="text-sm text-gray-400">Manage sales and distribution by mode</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`px-4 py-2 rounded-t-lg font-bold transition-all ${
              activeTab === 'whitelist'
                ? 'bg-cyan-600 text-white'
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            Whitelist Mode
          </button>
          <button
            onClick={() => setActiveTab('public_sale')}
            className={`px-4 py-2 rounded-t-lg font-bold transition-all ${
              activeTab === 'public_sale'
                ? 'bg-cyan-600 text-white'
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            Public Sale
          </button>
          <button
            onClick={() => setActiveTab('free_claim')}
            className={`px-4 py-2 rounded-t-lg font-bold transition-all ${
              activeTab === 'free_claim'
                ? 'bg-cyan-600 text-white'
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            Free Claim
          </button>
        </div>

        {/* Whitelist Mode Tab */}
        {activeTab === 'whitelist' && (
          <>
            {/* NFT Selector - PROMINENT */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-4 border-cyan-500/50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🎯</div>
            <div>
              <label className="block text-lg uppercase tracking-wider text-cyan-300 font-bold">
                Step 3.1: Select NFT Design to Mint
              </label>
              <p className="text-xs text-gray-400 mt-1">Choose which NFT you want to batch mint</p>
            </div>
          </div>
          {allDesigns && allDesigns.filter((d: any) => d.saleMode === 'whitelist').length > 0 ? (
            <>
              <select
                value={selectedDesignForMinting?.tokenType || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('DROPDOWN_CHANGE User changed dropdown selection to:', newValue);
                  const selectedDesign = allDesigns?.find(d => d.tokenType === newValue);
                  if (selectedDesign) {
                    console.log('DROPDOWN_CHANGE_DETAILS Selected design:', JSON.stringify({
                      tokenType: selectedDesign.tokenType,
                      displayName: selectedDesign.displayName,
                      imageUrl: selectedDesign.imageUrl,
                      policyId: selectedDesign.policyId
                    }, null, 2));
                    // CRITICAL FIX: Store the entire design object, not just the tokenType string
                    setSelectedDesignForMinting(selectedDesign);
                  } else {
                    setSelectedDesignForMinting(null);
                  }
                }}
                className="w-full bg-black/70 border-2 border-cyan-500/50 rounded-lg px-4 py-3 text-base text-white font-semibold focus:border-cyan-400 focus:outline-none"
              >
                <option value="">-- ⚠️ SELECT AN NFT FIRST --</option>
                {allDesigns.filter((d: any) => d.saleMode === 'whitelist').map((design: any) => (
                  <option key={design._id} value={design.tokenType}>
                    {design.displayName} {design.isActive ? '✓' : '✗ (inactive)'} - {design.eligibilitySnapshot?.length || 0} eligible - {design.totalMinted || 0} minted
                  </option>
                ))}
              </select>

              {/* Help text about 0 eligible */}
              {selectedDesignForMinting && (() => {
                const design = selectedDesignForMinting;
                if (design && (!design.eligibilitySnapshot || design.eligibilitySnapshot.length === 0)) {
                  return (
                    <div className="mt-3 bg-yellow-900/30 border border-yellow-500/50 rounded p-3 text-sm text-yellow-300">
                      ℹ️ <strong>0 eligible users:</strong> This NFT doesn't have a whitelist snapshot assigned yet. Scroll down to "Import from Whitelist Manager" and click "📸 Take Snapshot" to assign eligible users.
                    </div>
                  );
                }
                return null;
              })()}

              {!selectedDesignForMinting && (
                <div className="mt-3 bg-red-900/30 border border-red-500/50 rounded p-3 text-sm text-red-300">
                  ⚠️ <strong>REQUIRED:</strong> You must select an NFT design before minting!
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 text-sm text-yellow-400">
              ⚠️ No whitelist NFTs available. Please create a whitelist NFT in Step 2 first.
            </div>
          )}
        </div>

        {/* Debug Info */}
        {selectedDesignForMinting && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-4 text-xs">
            <div className="text-blue-300 font-bold mb-1">Debug Info:</div>
            <div className="text-gray-400">Selected NFT: {selectedDesignForMinting.displayName} ({selectedDesignForMinting.tokenType})</div>
            <div className="text-gray-400">Snapshots Available: {allSnapshots?.length || 0}</div>
            {allSnapshots && allSnapshots.length > 0 && (
              <div className="text-gray-400">Snapshot Names: {allSnapshots.map(s => `${s.snapshotName} (${s.userCount})`).join(', ')}</div>
            )}
          </div>
        )}

        {/* Snapshot Import from Whitelist Manager */}
        {selectedDesignForMinting && allSnapshots && allSnapshots.length > 0 && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase">Import Snapshot</h4>
            <p className="text-xs text-gray-400 mb-3">
              Select a snapshot from the Whitelist Manager to import eligible users.
            </p>

            <div className="flex gap-3">
              <select
                value={selectedWhitelistId || ''}
                onChange={(e) => setSelectedWhitelistId(e.target.value || null)}
                className="flex-1 bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">-- Select a snapshot --</option>
                {allSnapshots.map((snapshot) => (
                  <option key={snapshot._id} value={snapshot._id}>
                    {snapshot.whitelistName} → {snapshot.snapshotName} ({snapshot.userCount} users) - {new Date(snapshot.takenAt).toLocaleDateString()}
                  </option>
                ))}
              </select>

              <button
                onClick={async () => {
                  if (!selectedWhitelistId) {
                    alert('Please select a snapshot first');
                    return;
                  }
                  if (!selectedDesignForMinting) return;

                  setIsImportingWhitelist(true);
                  try {
                    const result = await importSnapshotToNFT({
                      tokenType: selectedDesignForMinting.tokenType,
                      snapshotId: selectedWhitelistId as any,
                    });
                    alert(`Snapshot "${result.whitelistName} → ${result.snapshotName}" imported! ${result.eligibleCount} users are now eligible.`);
                    // Keep selectedWhitelistId so the eligible users table can display the snapshot data
                  } catch (error: any) {
                    alert(`Error importing snapshot: ${error.message}`);
                  } finally {
                    setIsImportingWhitelist(false);
                  }
                }}
                disabled={!selectedWhitelistId || isImportingWhitelist}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded transition-all"
              >
                {isImportingWhitelist ? 'Importing...' : '📥 Import'}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
              <span>💡</span>
              <span>Or manually take a snapshot based on gold balance below</span>
            </div>
          </div>
        )}

        {/* Link to Whitelist Manager */}
        {selectedDesignForMinting && (!allSnapshots || allSnapshots.length === 0) && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-300 mb-1">No Snapshots Found</h4>
                <p className="text-xs text-gray-400">
                  Create whitelists and take snapshots in the Whitelist Manager to easily import eligible users.
                </p>
              </div>
              <a
                href="/admin-whitelist-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-all"
              >
                Open Whitelist Manager
              </a>
            </div>
          </div>
        )}

        {/* Snapshot Management */}
        {selectedDesignForMinting && (
          (() => {
            const design = selectedDesignForMinting;
            if (!design || design.saleMode !== 'whitelist') return null;

            const hasSnapshot = design.eligibilitySnapshot && design.eligibilitySnapshot.length > 0;

            return (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-blue-300 mb-3 uppercase">Eligibility Snapshot</h4>

                {hasSnapshot ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Eligible Wallets</div>
                        <div className="text-2xl font-bold text-green-400">{design.eligibilitySnapshot.length}</div>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Min Gold Req.</div>
                        <div className="text-2xl font-bold text-blue-400">{design.minimumGold || 0}</div>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Snapshot Date</div>
                        <div className="text-sm font-bold text-purple-400">
                          {design.snapshotTakenAt ? new Date(design.snapshotTakenAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-500/30 rounded p-3 text-sm text-green-300">
                      ✓ Snapshot taken! These {design.eligibilitySnapshot.length} wallets can now claim this NFT.
                    </div>

                    <button
                      onClick={async () => {
                        if (!confirm('Re-take snapshot? This will replace the current whitelist.')) return;
                        try {
                          await takeEligibilitySnapshot({ tokenType: design.tokenType });
                          alert('Snapshot updated successfully!');
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Failed to take snapshot');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-sm font-bold rounded transition-all"
                    >
                      🔄 Re-take Snapshot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 text-sm text-yellow-300">
                      ⚠️ No snapshot taken yet. Take a snapshot to lock in the eligible wallet list based on current gold balances.
                    </div>

                    <div className="bg-blue-900/30 rounded p-3 text-xs text-blue-300">
                      <strong>Snapshot will capture:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>All wallets with &gt; {design.minimumGold || 0} gold</li>
                        <li>Blockchain verified users only</li>
                        <li>Current timestamp for record keeping</li>
                      </ul>
                    </div>

                    <button
                      onClick={async () => {
                        if (!confirm(`Take snapshot now? This will capture all eligible wallets with > ${design.minimumGold || 0} gold.`)) return;
                        try {
                          const result = await takeEligibilitySnapshot({ tokenType: design.tokenType });
                          alert(`Snapshot taken! ${result.eligibleCount} wallets are now eligible.`);
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Failed to take snapshot');
                        }
                      }}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
                    >
                      📸 Take Snapshot Now
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* Selected Design Info */}
        {selectedDesignForMinting && (
          (() => {
            const design = selectedDesignForMinting;
            if (!design) return null;

            return (
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 bg-gray-900 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={design.imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                      alt={design.displayName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1">{design.displayName}</div>
                    <div className="text-xs text-gray-400 font-mono mb-2">Token Type: {design.tokenType}</div>
                    <div className="text-xs text-gray-400 mb-2">Asset Name: {Buffer.from(design.assetNameHex, 'hex').toString('utf-8')}</div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Total Minted</div>
                        <div className="text-lg font-bold text-blue-400">{design.totalMinted || 0}</div>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Next Edition</div>
                        <div className="text-lg font-bold text-purple-400">#{(design.totalMinted || 0) + 1}</div>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                        <div className="text-xs text-gray-400">Policy ID</div>
                        <div className="text-xs font-mono text-green-400 truncate">{design.policyId.substring(0, 16)}...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Eligible Users Table */}
        {selectedDesignForMinting && (() => {
          // Use snapshot data if available, otherwise fall back to gold-based eligible users
          const currentSnapshot = selectedWhitelistId
            ? allSnapshots?.find(s => s._id === selectedWhitelistId)
            : null;

          const displayUsers = currentSnapshot?.eligibleUsers || [];
          const showSnapshotData = currentSnapshot !== null;

          return (
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">
                Eligible Users ({displayUsers.length})
                {showSnapshotData && (
                  <span className="ml-2 text-xs text-purple-400 font-normal">
                    (from snapshot: {currentSnapshot.snapshotName})
                  </span>
                )}
              </h4>

              {displayUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cyan-500/30">
                        <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">#</th>
                        <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Wallet Address</th>
                        <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Display Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {displayUsers.map((user, index) => (
                        <tr key={index} className="hover:bg-cyan-900/10">
                          <td className="py-2 px-3 text-gray-400">{index + 1}</td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-400">
                            {user.walletAddress}
                          </td>
                          <td className="py-2 px-3 text-white">{user.displayName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {showSnapshotData
                    ? 'This snapshot has no eligible users.'
                    : 'No snapshot imported. Import a snapshot from Whitelist Manager above.'
                  }
                </div>
              )}
            </div>
          );
        })()}

        {/* Minting Controls */}
        {selectedDesignForMinting && (() => {
          // Get current snapshot data
          const currentSnapshot = selectedWhitelistId
            ? allSnapshots?.find(s => s._id === selectedWhitelistId)
            : null;
          const snapshotUserCount = currentSnapshot?.eligibleUsers?.length || 0;

          // Show only if we have a snapshot with users
          if (!currentSnapshot || snapshotUserCount === 0) return null;

          return (
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">Batch Mint Controls</h4>

              <div className="space-y-4">
                {/* Warning */}
                <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3 text-sm text-orange-300">
                  <strong>⚠️ Warning:</strong> This will mint {snapshotUserCount} NFT{snapshotUserCount !== 1 ? 's' : ''} on the Cardano blockchain.
                Each mint will create a transaction that costs ADA for fees. Make sure you have sufficient funds in your admin wallet.
              </div>

              {/* Minting Progress */}
              {mintingProgress && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-400 font-bold">Minting Progress</span>
                    <span className="text-sm text-blue-300">{mintingProgress.current} / {mintingProgress.total} NFTs</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold"
                      style={{ width: `${Math.max(5, (mintingProgress.current / mintingProgress.total) * 100)}%` }}
                    >
                      {Math.round((mintingProgress.current / mintingProgress.total) * 100)}%
                    </div>
                  </div>

                  {/* Batch Info */}
                  {mintingProgress.currentBatch && mintingProgress.totalBatches && (
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-purple-400">
                        📦 Batch {mintingProgress.currentBatch} of {mintingProgress.totalBatches}
                      </span>
                      <span className="text-gray-400">
                        {Math.ceil((mintingProgress.totalBatches - mintingProgress.currentBatch) * 2)} min remaining
                      </span>
                    </div>
                  )}

                  {/* Current Status */}
                  <div className="bg-blue-900/30 rounded p-2 mb-2">
                    <div className="text-xs text-blue-300 font-bold mb-1">Current Status:</div>
                    <div className="text-xs text-gray-300">{mintingProgress.status}</div>
                  </div>

                  {/* Activity Indicator - only show while minting is in progress */}
                  {isMinting && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <div className="animate-spin">⏳</div>
                      <span>Processing... (check console for detailed logs)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {mintError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-sm text-red-400">
                  ❌ {mintError}
                </div>
              )}

              {/* Policy KeyHash Warning */}
              {activePolicy && (() => {
                let policyScript = activePolicy.policyScript;
                if (typeof policyScript === 'string') {
                  try {
                    policyScript = JSON.parse(policyScript);
                  } catch (e) {
                    return null;
                  }
                }
                const policyKeyHash = policyScript?.keyHash;
                if (!policyKeyHash) return null;

                return (
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-yellow-300 mb-2">IMPORTANT: Wallet Requirement</div>
                        <div className="text-xs text-yellow-200 mb-2">
                          This policy requires the wallet that created it. You MUST connect the wallet with keyHash:
                        </div>
                        <div className="font-mono text-xs bg-black/50 rounded px-2 py-1 text-cyan-400 break-all">
                          {policyKeyHash}
                        </div>
                        <div className="text-xs text-yellow-200 mt-2">
                          Using a different wallet will cause minting to fail with a signature error.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Wallet Connection & Minting Controls */}
              {!walletConnected ? (
                <div className="space-y-3">
                  {installedWallets.length === 0 ? (
                    /* No wallets installed warning */
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">⚠️</div>
                      <div className="text-red-300 font-bold mb-2">No Cardano Wallets Detected</div>
                      <div className="text-sm text-red-200 mb-3">
                        Please install a Cardano wallet browser extension to continue.
                      </div>
                      <div className="text-xs text-gray-400">
                        Recommended: Lace, Eternl, Nami, or Typhon
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wallet Type Selector */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Select Admin Wallet Type ({installedWallets.length} detected)
                        </label>
                        <select
                          value={selectedWalletType}
                          onChange={(e) => setSelectedWalletType(e.target.value as 'lace' | 'eternl' | 'nami' | 'typhon')}
                          className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                          disabled={isConnectingWallet}
                        >
                          {installedWallets.map(wallet => (
                            <option key={wallet} value={wallet}>
                              {wallet.charAt(0).toUpperCase() + wallet.slice(1)} Wallet
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Connect Button */}
                      <button
                        onClick={handleConnectWallet}
                        disabled={isConnectingWallet}
                        className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
                      >
                        {isConnectingWallet
                          ? '⏳ Connecting Wallet...'
                          : `🔗 Connect Admin Wallet (${selectedWalletType.charAt(0).toUpperCase() + selectedWalletType.slice(1)})`
                        }
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Connect your {selectedWalletType.charAt(0).toUpperCase() + selectedWalletType.slice(1)} wallet to mint NFTs. Make sure you have sufficient test ADA for transaction fees.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Wallet Info */}
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <div className="text-xs text-green-300 font-bold mb-1">✅ Wallet Connected</div>
                    <div className="text-xs text-gray-400 font-mono break-all">{walletAddress}</div>
                    <div className="text-xs text-green-400 mt-1 font-bold">Balance: {(walletBalance / 1_000_000).toFixed(2)} ADA</div>
                  </div>

                  {/* Cost Preview */}
                  {(() => {
                    // Get recipients from snapshot
                    if (!selectedWhitelistId) return null;
                    const snapshot = allSnapshots?.find(s => s._id === selectedWhitelistId);
                    if (!snapshot) return null;

                    const recipients = snapshot.eligibleUsers.map(u => ({ address: u.walletAddress }));
                    if (recipients.length === 0) return null;

                    const preview = previewMintingPlan(recipients, 10);

                    const hasEnoughFunds = walletBalance >= (preview.estimatedCost.totalAda * 1_000_000);

                    return (
                      <div className={`border rounded p-3 text-xs ${
                        hasEnoughFunds
                          ? 'bg-blue-900/20 border-blue-500/30'
                          : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <div className="font-bold text-white mb-2">💰 Cost Estimate</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-gray-400">Valid Addresses:</div>
                            <div className="text-white font-bold">{preview.validAddresses}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Total Batches:</div>
                            <div className="text-white font-bold">{preview.totalBatches}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Transaction Fees:</div>
                            <div className="text-yellow-400 font-bold">{preview.estimatedCost.transactionFees.toFixed(1)} ADA</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Min UTxO (locked):</div>
                            <div className="text-blue-400 font-bold">{preview.estimatedCost.minUtxoAda.toFixed(1)} ADA</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Total Cost:</div>
                            <div className="text-white font-bold text-base">{preview.estimatedCost.totalAda.toFixed(1)} ADA</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Est. Time:</div>
                            <div className="text-blue-400 font-bold">{preview.estimatedTime} min</div>
                          </div>
                        </div>
                        {!hasEnoughFunds && (
                          <div className="mt-2 text-red-400 font-bold">
                            ⚠️  Insufficient funds! Need {preview.estimatedCost.totalAda.toFixed(1)} ADA
                          </div>
                        )}
                        {preview.invalidAddresses > 0 && (
                          <div className="mt-2 text-orange-400">
                            ⚠️  {preview.invalidAddresses} invalid address(es) will be skipped
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mint Button */}
                  <button
                    onClick={handleBatchMint}
                    disabled={isMinting || !selectedWhitelistId}
                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-lg transition-all text-lg shadow-lg"
                  >
                    {isMinting ? (
                      <>⏳ Minting in Progress...</>
                    ) : (
                      <>🚀 Start Batch Mint ({allSnapshots?.find(s => s._id === selectedWhitelistId)?.userCount || 0} NFTs)</>
                    )}
                  </button>

                  {!selectedWhitelistId && (
                    <div className="text-xs text-orange-400 text-center">
                      ⚠️  Please import a snapshot first before minting
                    </div>
                  )}

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setWalletConnected(false);
                      setWalletAddress(null);
                      setWalletBalance(0);
                    }}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-all"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })()}
          </>
        )}

        {/* Public Sale Mode Tab */}
        {activeTab === 'public_sale' && (
          <div className="text-center py-20 bg-blue-900/10 border-2 border-dashed border-blue-500/30 rounded-lg">
            <div className="text-6xl mb-4">🚧</div>
            <div className="text-2xl font-bold text-blue-400 mb-2">Public Sale Mode</div>
            <div className="text-gray-400 mb-4">
              Coming Soon - Open sales with multiple purchases allowed
            </div>
            <div className="text-sm text-gray-500">
              This mode will allow anyone to buy NFTs, with configurable purchase limits per wallet.
              <br />
              Perfect for event NFTs and limited edition collectibles.
            </div>
          </div>
        )}

        {/* Free Claim Mode Tab */}
        {activeTab === 'free_claim' && (
          <div className="text-center py-20 bg-purple-900/10 border-2 border-dashed border-purple-500/30 rounded-lg">
            <div className="text-6xl mb-4">🎁</div>
            <div className="text-2xl font-bold text-purple-400 mb-2">Free Claim Mode</div>
            <div className="text-gray-400 mb-4">
              Coming Soon - Free airdrops to eligible users
            </div>
            <div className="text-sm text-gray-500">
              This mode will allow eligible users to claim NFTs for free.
              <br />
              Perfect for rewards, achievements, and community airdrops.
            </div>
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/50 border border-blue-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Eligible Users</div>
          {!eligibleDataLoaded ? (
            <button
              onClick={() => setEligibleDataLoaded(true)}
              className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors"
            >
              📊 Load Count
            </button>
          ) : eligibleCount === undefined ? (
            <div className="text-xl text-blue-400/50 mt-2">Loading...</div>
          ) : (
            <div className="text-3xl font-bold text-blue-400">{eligibleCount}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {!eligibleDataLoaded ? 'Click to calculate' : 'Connected + Gold > 0'}
          </div>
        </div>

        <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Submissions</div>
          <div className="text-3xl font-bold text-yellow-400">{stats?.total ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Addresses submitted</div>
        </div>

        <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pending</div>
          <div className="text-3xl font-bold text-purple-400">{stats?.pending ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting distribution</div>
        </div>

        <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Sent</div>
          <div className="text-3xl font-bold text-green-400">{stats?.sent ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">NFTs distributed</div>
        </div>
      </div>

      {/* Export & Actions */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-bold text-yellow-400 mb-3">Export & Distribution</h4>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!allSubmissions || allSubmissions.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all"
          >
            📥 Export All Addresses (CSV)
          </button>
          <div className="flex-1 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-sm text-gray-400">
            Export all submitted addresses to upload to NMKR for batch distribution
          </div>
        </div>
      </div>

      {/* STEP 4: Minting History */}
      <div className="bg-gradient-to-r from-green-900/20 to-teal-900/20 border-4 border-green-500/50 rounded-lg p-6 mt-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl font-bold text-green-400">STEP 4</div>
            <h3 className="text-2xl font-bold text-white">Minting History</h3>
          </div>
          <p className="text-sm text-gray-400">Complete log of all NFTs you've ever minted</p>
        </div>

        <MintingHistoryViewer isDataLoaded={commemorativeDataLoaded} />
      </div>
        </>
      )}
    </div>
  );
}

/**
 * Minting History Viewer Component
 * Shows complete history of all minted NFTs with filtering and export
 */
function MintingHistoryViewer({ isDataLoaded }: { isDataLoaded: boolean }) {
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch minting history - only when data is loaded
  const mintingHistory = useQuery(
    api.minting.getBatchMintingHistory,
    isDataLoaded ? {
      network: networkFilter === "all" ? undefined : networkFilter,
      tokenType: tokenTypeFilter === "all" ? undefined : tokenTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    } : "skip"
  );

  // Fetch statistics - only when data is loaded
  const mintingStats = useQuery(
    api.minting.getBatchMintingStats,
    isDataLoaded ? {
      network: networkFilter === "all" ? undefined : networkFilter,
    } : "skip"
  );

  // Get all designs for token type filter dropdown - only when data is loaded
  const allDesigns = useQuery(
    api.commemorativeTokenCounters.getAllDesigns,
    isDataLoaded ? undefined : "skip"
  );

  // Export to CSV
  const exportToCSV = () => {
    if (!mintingHistory || mintingHistory.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "NFT Name",
      "Mint Number",
      "Token Type",
      "Recipient Address",
      "Recipient Name",
      "Status",
      "TX Hash",
      "Network",
      "Batch Number",
      "Minted At",
      "Asset ID"
    ];

    const rows = mintingHistory.map((mint: any) => [
      mint.nftName,
      mint.mintNumber,
      mint.tokenType,
      mint.recipientAddress,
      mint.recipientDisplayName || "—",
      mint.status,
      mint.txHash || "—",
      mint.network,
      mint.batchNumber,
      new Date(mint._creationTime).toLocaleString(),
      mint.assetId
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `minting-history-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {mintingStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{mintingStats.totalMinted}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Total Minted</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{mintingStats.confirmedMints}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Confirmed</div>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{mintingStats.uniqueRecipients}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Recipients</div>
          </div>
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{mintingStats.uniqueTokenTypes}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">NFT Types</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-gray-400 uppercase">Filters:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Network Filter */}
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-2">Network</label>
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="w-full bg-black/70 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Networks</option>
              <option value="preprod">Preprod (Testnet)</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          {/* Token Type Filter */}
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-2">NFT Type</label>
            <select
              value={tokenTypeFilter}
              onChange={(e) => setTokenTypeFilter(e.target.value)}
              className="w-full bg-black/70 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Types</option>
              {allDesigns?.map((design: any) => (
                <option key={design._id} value={design.tokenType}>
                  {design.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/70 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={exportToCSV}
            disabled={!mintingHistory || mintingHistory.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold text-sm transition-colors"
          >
            📥 Export to CSV
          </button>
        </div>
      </div>

      {/* Minting History Table */}
      <div className="bg-black/30 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">NFT Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Mint #</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Network</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mintingHistory && mintingHistory.length > 0 ? (
                mintingHistory.map((mint: any) => (
                  <tr key={mint._id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <img
                        src={mint.imageIpfsUrl?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                        alt={mint.nftName}
                        className="w-12 h-12 rounded object-cover border border-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{mint.nftName}</div>
                      <div className="text-xs text-gray-500 font-mono">{mint.tokenType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-cyan-400">#{mint.mintNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-300">
                        {mint.recipientAddress.slice(0, 12)}...{mint.recipientAddress.slice(-8)}
                      </div>
                      {mint.recipientDisplayName && (
                        <div className="text-xs text-gray-500">{mint.recipientDisplayName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        mint.status === 'confirmed'
                          ? 'bg-green-600/30 text-green-400'
                          : mint.status === 'pending'
                          ? 'bg-yellow-600/30 text-yellow-400'
                          : mint.status === 'submitted'
                          ? 'bg-blue-600/30 text-blue-400'
                          : 'bg-red-600/30 text-red-400'
                      }`}>
                        {mint.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        mint.network === 'mainnet' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {mint.network.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">
                        {new Date(mint._creationTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(mint._creationTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {mint.txHash ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={`https://${mint.network === 'preprod' ? 'preprod.' : ''}cardanoscan.io/transaction/${mint.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-xs"
                          >
                            Cardanoscan ↗
                          </a>
                          <a
                            href={`https://${mint.network === 'preprod' ? 'preprod.' : ''}pool.pm/${mint.assetId.replace('.', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline text-xs"
                          >
                            pool.pm ↗
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No minting history found. Start minting NFTs in Step 3 to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Count */}
      {mintingHistory && mintingHistory.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          Showing {mintingHistory.length} {mintingHistory.length === 1 ? 'mint' : 'mints'}
        </div>
      )}
    </div>
  );
}
