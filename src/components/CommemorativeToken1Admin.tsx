'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { uploadFileToPinata } from '@/lib/cardano/pinata';
import { generateMintingPolicy, extractPaymentKeyHash } from '@/lib/cardano/policyGenerator';

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
  const [designTokenType, setDesignTokenType] = useState('phase_1_beta');
  const [designName, setDesignName] = useState('Commemorative Token #1 - Early Miner');
  const [designDescription, setDesignDescription] = useState('Awarded to early supporters who connected their wallet and accumulated gold');
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
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Metadata upload for design
  const [metadataName, setMetadataName] = useState('Commemorative Token #1 - Early Miner');
  const [metadataDescription, setMetadataDescription] = useState('Awarded to early supporters who connected their wallet and accumulated gold');
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
  const [selectedDesignForMinting, setSelectedDesignForMinting] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  // Queries
  const config = useQuery(api.airdrop.getConfigByCampaign, { campaignName: CAMPAIGN_NAME });
  const stats = useQuery(api.airdrop.getSubmissionStats, { campaignName: CAMPAIGN_NAME });
  const eligibleCount = useQuery(api.airdrop.getEligibleUsersCount, { minimumGold: 0 });
  const eligibleUsers = useQuery(api.airdrop.getEligibleUsersList, { minimumGold: 0 });
  const allSubmissions = useQuery(api.airdrop.getAllSubmissions, { campaignName: CAMPAIGN_NAME });
  const companyNames = useQuery(
    api.airdrop.getWalletCompanyNames,
    config?.testWallets && config.testWallets.length > 0
      ? { walletAddresses: config.testWallets }
      : "skip"
  );
  const network = (process.env.NEXT_PUBLIC_CARDANO_NETWORK as 'mainnet' | 'preprod' | 'preview') || 'preprod';
  const existingPolicies = useQuery(api.minting.getMintingPolicies, { network });
  const allDesigns = useQuery(api.commemorativeTokens.getAllDesigns, {});
  const allMints = useQuery(api.commemorativeTokens.getAllCommemorativeTokens, { limit: 100 });

  // Mutations
  const upsertConfig = useMutation(api.airdrop.upsertConfig);
  const toggleActive = useMutation(api.airdrop.toggleActive);
  const storeMintingPolicy = useMutation(api.minting.storeMintingPolicy);
  const deleteMintingPolicy = useMutation(api.minting.deleteMintingPolicy);
  const initializeTokenType = useMutation(api.commemorativeTokens.initializeTokenType);
  const deleteTokenType = useMutation(api.commemorativeTokens.deleteTokenType);
  const takeEligibilitySnapshot = useMutation(api.commemorativeTokens.takeEligibilitySnapshot);

  // Initialize campaign if it doesn't exist
  useEffect(() => {
    const initializeCampaign = async () => {
      if (config === undefined) return; // Still loading
      if (config !== null) return; // Already exists

      setIsInitializing(true);
      try {
        await upsertConfig({
          campaignName: CAMPAIGN_NAME,
          isActive: false, // Start disabled
          nftName: "Early Miner Commemorative NFT",
          nftDescription: "Awarded to early supporters who connected their wallet and accumulated gold",
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
  }, [config, upsertConfig]);

  // Auto-fill metadata image URL when image is uploaded
  useEffect(() => {
    if (uploadResult?.ipfsUrl) {
      setMetadataImageUrl(uploadResult.ipfsUrl);
    }
  }, [uploadResult]);

  // Auto-select first policy if none selected
  useEffect(() => {
    if (existingPolicies && existingPolicies.length > 0 && !activePolicy) {
      setActivePolicy(existingPolicies[0]);
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

      // Parse expiry date if provided
      let expiryDateObj: Date | undefined;
      if (hasExpiry && expiryDate) {
        expiryDateObj = new Date(expiryDate);
        if (isNaN(expiryDateObj.getTime())) {
          throw new Error('Invalid expiry date');
        }
      }

      // Generate policy script and ID
      const policy = await generateMintingPolicy(keyHash, expiryDateObj);

      // Store in Convex with all NMKR fields
      await storeMintingPolicy({
        policyId: policy.policyId,
        policyName: policyName.trim(),
        policyScript: policy.policyScript,
        keyHash,
        expirySlot: policy.expirySlot,
        expiryDate: expiryDateObj ? expiryDateObj.getTime() : undefined,
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
    if (!confirm('Are you sure you want to delete this policy? This cannot be undone.')) {
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
      setDesignError('Please enter a design name');
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
        metadataUrl: metadataUploadResult.ipfsUrl,
        policyId,
        assetNameHex,
        isActive: false, // Start inactive - will be configured in Step 3

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

      alert('NFT Design created successfully! Configure distribution settings in Step 3.');
    } catch (error) {
      console.error('Design creation error:', error);
      setDesignError(error instanceof Error ? error.message : 'Failed to create design');
    } finally {
      setIsCreatingDesign(false);
    }
  };

  const handleDeleteDesign = async (tokenType: string) => {
    if (!confirm('Are you sure you want to delete this design? This cannot be undone if NFTs have been minted.')) {
      return;
    }

    try {
      await deleteTokenType({ tokenType });
    } catch (error) {
      console.error('Design deletion error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete design');
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

      setUploadResult(result);
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
      const metadata = {
        name: metadataName,
        description: metadataDescription,
        image: metadataImageUrl,
        mediaType: 'image/png',
        files: [
          {
            name: metadataName,
            mediaType: 'image/png',
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

  if (config === undefined || isInitializing) {
    return (
      <div className="text-center py-8">
        <div className="text-yellow-400 mb-2">⏳ Loading campaign...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <div className="text-3xl font-bold text-indigo-400">STEP 1</div>
              <h3 className="text-2xl font-bold text-white">Create Master Policy</h3>
            </div>
            <button
              onClick={() => setShowPolicyBrowser(!showPolicyBrowser)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
            >
              📂 Policy Browser ({existingPolicies?.length || 0})
            </button>
          </div>
          <p className="text-sm text-gray-400">Generate ONE policy that will govern ALL commemorative tokens (Phase 1, Phase 2, etc.)</p>
          <p className="text-xs text-yellow-400 mt-1">⚠️ This is a ONE-TIME setup - all future commemorative NFTs will use this same policy</p>
        </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingPolicies.map((policy: any) => (
                  <div key={policy._id} className={`bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-2 rounded-lg p-4 hover:border-indigo-500/60 transition-all ${
                    activePolicy?.policyId === policy.policyId
                      ? 'border-green-500/60 ring-2 ring-green-500/30'
                      : 'border-indigo-500/30'
                  }`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-white text-lg mb-1">{policy.policyName}</div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(policy.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-bold ${
                        policy.isActive
                          ? 'bg-green-600/30 text-green-400'
                          : 'bg-gray-600/30 text-gray-400'
                      }`}>
                        {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                ))}
              </div>
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

                    {/* Metadata Template */}
                    {selectedPolicyForView.metadataTemplate?.customFields?.length > 0 && (
                      <div className="bg-black/40 border border-cyan-500/30 rounded p-4">
                        <div className="text-xs uppercase tracking-wider text-cyan-300 mb-3 font-bold">Custom Metadata Fields</div>
                        <div className="space-y-2">
                          {selectedPolicyForView.metadataTemplate.customFields.map((field: any, index: number) => (
                            <div key={index} className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="font-mono text-sm text-cyan-400">{field.fieldName}</div>
                                <div className="text-xs text-gray-500">
                                  {field.fieldType === 'fixed' ? `Fixed: "${field.fixedValue}"` : 'Placeholder (Token-Specific)'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                Policy will not lock automatically. You can mint NFTs indefinitely.
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
      </div>

      {/* STEP 2: NFT Designs */}
      <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-4 border-pink-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-pink-400">STEP 2</div>
              <h3 className="text-2xl font-bold text-white">NFT Designs</h3>
            </div>
            <button
              onClick={() => setShowCreateDesign(!showCreateDesign)}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all"
            >
              {showCreateDesign ? '✕ Cancel' : '+ Add New Design'}
            </button>
          </div>
          <p className="text-sm text-gray-400">Create NFT designs that can be minted multiple times (Phase 1, Phase 2, etc.)</p>
        </div>

        {/* Create Design Form */}
        {showCreateDesign && (
          <div className="mb-6 bg-black/40 border-2 border-pink-500/30 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-bold text-pink-300 mb-4">Create New Design</h4>

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

            {/* Design Name */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-pink-300 mb-2 font-bold">
                Design Name
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
                💡 <strong>Distribution settings</strong> (sale mode, pricing, whitelist eligibility) will be configured in <strong>Step 3: Minting & Distribution</strong> after creating this design.
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

            {/* Save Design Button */}
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
                {isCreatingDesign ? 'Creating...' : '💾 Save Design'}
              </button>
            </div>
          </div>
        )}

        {/* Designs List */}
        <div>
          <h4 className="text-sm font-bold text-pink-400 mb-3">
            NFT Designs ({allDesigns?.length || 0})
          </h4>

          {allDesigns && allDesigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDesigns.map((design: any) => (
                <div key={design._id} className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
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

                  {/* Status */}
                  <div className={`px-2 py-1 rounded text-xs font-bold text-center mb-3 ${
                    design.isActive
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-gray-700/30 text-gray-400'
                  }`}>
                    {design.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                      className="flex-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs font-bold rounded transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <div>No designs yet. Click "+ Add New Design" to create one.</div>
            </div>
          )}
        </div>
      </div>

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
            {/* Design Selector */}
        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <label className="block text-xs uppercase tracking-wider text-cyan-300 mb-2 font-bold">
            Select Whitelist Design
          </label>
          {allDesigns && allDesigns.filter((d: any) => d.saleMode === 'whitelist').length > 0 ? (
            <select
              value={selectedDesignForMinting || ''}
              onChange={(e) => setSelectedDesignForMinting(e.target.value)}
              className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white"
            >
              <option value="">-- Select a design --</option>
              {allDesigns.filter((d: any) => d.saleMode === 'whitelist').map((design: any) => (
                <option key={design._id} value={design.tokenType}>
                  {design.displayName} - {design.eligibilitySnapshot?.length || 0} eligible - {design.totalMinted || 0} minted
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 text-sm text-yellow-400">
              ⚠️ No whitelist designs available. Please create a whitelist design in Step 2 first.
            </div>
          )}
        </div>

        {/* Snapshot Management */}
        {selectedDesignForMinting && allDesigns && (
          (() => {
            const design = allDesigns.find(d => d.tokenType === selectedDesignForMinting);
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
        {selectedDesignForMinting && allDesigns && (
          (() => {
            const design = allDesigns.find(d => d.tokenType === selectedDesignForMinting);
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
                        <div className="text-lg font-bold text-purple-400">#{(design.currentEdition || 0) + 1}</div>
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
        {selectedDesignForMinting && (
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-cyan-400 mb-3">
              Eligible Users ({eligibleUsers?.length || 0})
            </h4>

            {eligibleUsers && eligibleUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyan-500/30">
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">#</th>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Company Name</th>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Wallet Address</th>
                      <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Gold</th>
                      <th className="text-right py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Gold/Hr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {eligibleUsers.slice(0, 10).map((user, index) => (
                      <tr key={user._id} className="hover:bg-cyan-900/10">
                        <td className="py-2 px-3 text-gray-400">{index + 1}</td>
                        <td className="py-2 px-3 text-white">{user.companyName || 'Unknown'}</td>
                        <td className="py-2 px-3 font-mono text-xs text-gray-400">
                          {user.walletAddress.substring(0, 20)}...{user.walletAddress.substring(user.walletAddress.length - 10)}
                        </td>
                        <td className="py-2 px-3 text-right text-yellow-400 font-bold">{user.currentGold.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-blue-400">{user.totalGoldPerHour.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {eligibleUsers.length > 10 && (
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Showing 10 of {eligibleUsers.length} eligible users
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No eligible users found. Users must have wallet connected, blockchain verified, and gold &gt; 0.
              </div>
            )}
          </div>
        )}

        {/* Minting Controls */}
        {selectedDesignForMinting && eligibleUsers && eligibleUsers.length > 0 && (
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-cyan-400 mb-3">Batch Mint Controls</h4>

            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3 text-sm text-orange-300">
                <strong>⚠️ Warning:</strong> This will mint {eligibleUsers.length} NFT{eligibleUsers.length !== 1 ? 's' : ''} on the Cardano blockchain.
                Each mint will create a transaction that costs ADA for fees. Make sure you have sufficient funds in your admin wallet.
              </div>

              {/* Minting Progress */}
              {mintingProgress && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-400 font-bold">Minting Progress</span>
                    <span className="text-sm text-blue-300">{mintingProgress.current} / {mintingProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(mintingProgress.current / mintingProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{mintingProgress.status}</div>
                </div>
              )}

              {/* Error Display */}
              {mintError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-sm text-red-400">
                  ❌ {mintError}
                </div>
              )}

              {/* Mint Button */}
              <button
                onClick={() => {
                  setMintError('Minting functionality coming soon. This will integrate with Cardano blockchain via MeshSDK to create and submit minting transactions.');
                }}
                disabled={isMinting}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-lg transition-all text-lg"
              >
                {isMinting ? (
                  <>⏳ Minting in Progress...</>
                ) : (
                  <>🚀 Start Batch Mint ({eligibleUsers.length} NFTs)</>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center">
                This feature requires MeshSDK integration and wallet connection to submit transactions to Cardano blockchain.
              </div>
            </div>
          </div>
        )}

        {/* Minting Logs - Whitelist Mode Only */}
        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-cyan-400 mb-3">
            Minting Logs ({allMints?.filter(m => {
              const design = allDesigns?.find(d => d.tokenType === m.tokenType);
              return design?.saleMode === 'whitelist';
            }).length || 0})
          </h4>

          {allMints && allMints.filter(m => {
            const design = allDesigns?.find(d => d.tokenType === m.tokenType);
            return design?.saleMode === 'whitelist';
          }).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Date</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Token Type</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Edition #</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Recipient</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-cyan-300 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allMints.filter(m => {
                    const design = allDesigns?.find(d => d.tokenType === m.tokenType);
                    return design?.saleMode === 'whitelist';
                  }).slice(0, 20).map((mint) => (
                    <tr key={mint._id} className="hover:bg-cyan-900/10">
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {new Date(mint.mintedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-white font-mono text-xs">{mint.tokenType}</td>
                      <td className="py-2 px-3 text-purple-400 font-bold">#{mint.editionNumber}</td>
                      <td className="py-2 px-3 font-mono text-xs text-gray-400">
                        {mint.walletAddress.substring(0, 15)}...
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          mint.status === 'confirmed'
                            ? 'bg-green-600/30 text-green-400'
                            : mint.status === 'pending'
                            ? 'bg-yellow-600/30 text-yellow-400'
                            : 'bg-red-600/30 text-red-400'
                        }`}>
                          {mint.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">📋</div>
              <div>No whitelist minting logs yet. Mints will appear here after users claim.</div>
            </div>
          )}
        </div>
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
          <div className="text-3xl font-bold text-blue-400">{eligibleCount ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Connected + Gold &gt; 0</div>
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

      {/* Recent Submissions */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-yellow-400">Recent Submissions</h4>
          <div className="text-sm text-gray-400">
            {allSubmissions?.length ?? 0} total
          </div>
        </div>

        {allSubmissions && allSubmissions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allSubmissions.slice(0, 10).map((submission: any) => (
              <div
                key={submission._id}
                className="bg-gray-900/50 border border-gray-700/50 rounded p-3 text-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-xs text-gray-400 mb-1">
                      {submission.walletAddress.slice(0, 20)}...{submission.walletAddress.slice(-10)}
                    </div>
                    <div className="font-mono text-xs text-yellow-400">
                      → {submission.receiveAddress.slice(0, 25)}...
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    submission.status === 'sent'
                      ? 'bg-green-600/30 text-green-400'
                      : submission.status === 'pending'
                      ? 'bg-yellow-600/30 text-yellow-400'
                      : submission.status === 'processing'
                      ? 'bg-blue-600/30 text-blue-400'
                      : 'bg-red-600/30 text-red-400'
                  }`}>
                    {submission.status.toUpperCase()}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Gold: {submission.goldAtSubmission.toLocaleString()}g</span>
                  <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                  {submission.transactionHash && (
                    <a
                      href={`https://cardanoscan.io/transaction/${submission.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View TX ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No submissions yet. Enable the airdrop to allow users to claim.
          </div>
        )}
      </div>
    </div>
  );
}
