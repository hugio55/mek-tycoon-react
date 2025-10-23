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
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [createdPolicy, setCreatedPolicy] = useState<{
    policyId: string;
    policyScript: any;
    expirySlot?: number;
  } | null>(null);

  // Design creation state
  const [showCreateDesign, setShowCreateDesign] = useState(false);
  const [designTokenType, setDesignTokenType] = useState('phase_1_beta');
  const [designName, setDesignName] = useState('Commemorative Token #1 - Early Miner');
  const [designDescription, setDesignDescription] = useState('Awarded to early supporters who connected their wallet and accumulated gold');
  const [designAssetName, setDesignAssetName] = useState('CommemorativeToken1');

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
  const [metadataAttributes, setMetadataAttributes] = useState<Array<{trait_type: string, value: string}>>([
    { trait_type: 'Collection', value: 'Commemorative Tokens' },
    { trait_type: 'Phase', value: 'Phase 1 Beta' },
    { trait_type: 'Campaign', value: 'Early Miner' },
    { trait_type: 'Token Number', value: '1' },
    { trait_type: 'Type', value: 'Achievement' }
  ]);
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [metadataUploadResult, setMetadataUploadResult] = useState<{
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
  } | null>(null);
  const [metadataUploadError, setMetadataUploadError] = useState<string | null>(null);

  const [isCreatingDesign, setIsCreatingDesign] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);

  // Queries
  const config = useQuery(api.airdrop.getConfigByCampaign, { campaignName: CAMPAIGN_NAME });
  const stats = useQuery(api.airdrop.getSubmissionStats, { campaignName: CAMPAIGN_NAME });
  const eligibleCount = useQuery(api.airdrop.getEligibleUsersCount, { minimumGold: 0 });
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

  const handleCreatePolicy = async () => {
    if (!adminWalletAddress.trim()) {
      setPolicyError('Please enter your admin wallet address');
      return;
    }

    if (!policyName.trim()) {
      setPolicyError('Please enter a policy name');
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

      // Store in Convex
      await storeMintingPolicy({
        policyId: policy.policyId,
        policyName: policyName.trim(),
        policyScript: policy.policyScript,
        keyHash,
        expirySlot: policy.expirySlot,
        expiryDate: expiryDateObj ? expiryDateObj.getTime() : undefined,
        network,
        notes: `Master policy for all commemorative tokens (Phase 1, Phase 2, etc.). Created via ${CAMPAIGN_NAME} admin.`,
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

    const policyId = createdPolicy?.policyId || existingPolicies?.[0]?.policyId;
    if (!policyId) {
      setDesignError('Please create a master policy first (Step 1)');
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
        price: undefined, // Free for airdrop
        maxEditions: undefined, // Unlimited
        isActive: false, // Start inactive
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

      alert('Design created successfully!');
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
      {/* Quick Access Tabs - Campaign & Test Mode */}
      <div className="grid grid-cols-2 gap-3">
        {/* Campaign Status Tab */}
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-purple-400">Campaign Status</h4>
            <div className={`px-2 py-1 rounded text-xs font-bold ${config?.isActive ? 'bg-green-600/30 text-green-400' : 'bg-gray-700/30 text-gray-400'}`}>
              {config?.isActive ? '✓ LIVE' : '○ DISABLED'}
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            className={`w-full px-4 py-2 rounded font-bold text-sm transition-all ${
              config?.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {config?.isActive ? 'Disable Airdrop' : 'Enable Airdrop'}
          </button>
        </div>

        {/* Test Mode Tab */}
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-orange-400">Test Mode</h4>
            <div className={`px-2 py-1 rounded text-xs font-bold ${config?.testMode ? 'bg-orange-600/30 text-orange-400' : 'bg-gray-700/30 text-gray-400'}`}>
              {config?.testMode ? '🧪 TEST' : '○ OFF'}
            </div>
          </div>
          <button
            onClick={handleToggleTestMode}
            className={`w-full px-4 py-2 rounded font-bold text-sm transition-all ${
              config?.testMode
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {config?.testMode ? 'Disable Test Mode' : 'Enable Test Mode'}
          </button>
        </div>
      </div>

      {/* Test Mode Details - Only show when active */}
      {config?.testMode && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-sm text-orange-400 mb-3">
            <strong>⚠️ Test Mode Active:</strong> Only wallets listed below can see the airdrop banner.
          </div>

          {/* Add Wallet Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTestWallet}
              onChange={(e) => setNewTestWallet(e.target.value)}
              placeholder="stake1... or addr1..."
              className="flex-1 bg-black/50 border border-orange-500/30 rounded px-3 py-2 text-sm font-mono text-white"
            />
            <button
              onClick={handleAddTestWallet}
              disabled={!newTestWallet.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded transition-all"
            >
              Add
            </button>
          </div>

          {/* Test Wallets List */}
          <div className="text-xs font-bold text-orange-400 mb-2">
            Test Wallets ({config.testWallets?.length || 0})
          </div>
          {config.testWallets && config.testWallets.length > 0 ? (
            <div className="space-y-2">
              {config.testWallets.map((wallet: string, index: number) => {
                const companyName = companyNames?.[wallet];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-900/50 border border-gray-700/50 rounded p-2"
                  >
                    <div className="flex flex-col gap-1">
                      {companyName && (
                        <span className="text-xs font-bold text-yellow-400">
                          {companyName}
                        </span>
                      )}
                      <span className="font-mono text-xs text-gray-300">
                        {wallet.slice(0, 30)}...{wallet.slice(-10)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveTestWallet(wallet)}
                      className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold rounded transition-all"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-xs">
              No test wallets added yet.
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Policy Creation */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-4 border-indigo-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl font-bold text-indigo-400">STEP 1</div>
            <h3 className="text-2xl font-bold text-white">Create Master Policy</h3>
          </div>
          <p className="text-sm text-gray-400">Generate ONE policy that will govern ALL commemorative tokens (Phase 1, Phase 2, etc.)</p>
          <p className="text-xs text-yellow-400 mt-1">⚠️ This is a ONE-TIME setup - all future commemorative NFTs will use this same policy</p>
        </div>

        {/* Show existing policies */}
        {existingPolicies && existingPolicies.length > 0 && (
          <div className="mb-4 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-400 mb-2">✅ Existing Policies ({existingPolicies.length})</h4>
            <div className="space-y-2">
              {existingPolicies.map((policy: any) => (
                <div key={policy._id} className="bg-black/30 border border-green-500/30 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-green-300">{policy.policyName}</div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        policy.isActive
                          ? 'bg-green-600/30 text-green-400'
                          : 'bg-gray-600/30 text-gray-400'
                      }`}>
                        {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                      <button
                        onClick={() => handleDeletePolicy(policy.policyId)}
                        className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-gray-400 break-all mb-1">
                    Policy ID: {policy.policyId}
                  </div>
                  {policy.expiryDate && (
                    <div className="text-xs text-orange-400">
                      Expires: {new Date(policy.expiryDate).toLocaleString()}
                    </div>
                  )}
                  {policy.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      {policy.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Policy Name */}
          <div className="bg-black/30 rounded-lg p-4">
            <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
              Master Policy Name
            </label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Mek Tycoon Commemorative Collection"
              className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white"
            />
            <div className="mt-2 text-xs text-gray-400">
              This policy will be used for ALL commemorative tokens across all phases
            </div>
          </div>

          {/* Admin Wallet Address */}
          <div className="bg-black/30 rounded-lg p-4">
            <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
              Admin Wallet Address (for signing minting transactions)
            </label>
            <input
              type="text"
              value={adminWalletAddress}
              onChange={(e) => setAdminWalletAddress(e.target.value)}
              placeholder="addr_test1... or addr1..."
              className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white font-mono"
            />
            <div className="mt-2 text-xs text-gray-400">
              This wallet will be used to sign all minting transactions for this policy
            </div>
          </div>

          {/* Expiry Option */}
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="hasExpiry"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="hasExpiry" className="text-sm text-indigo-300 font-bold cursor-pointer">
                Add Expiry Date (time-limited policy)
              </label>
            </div>
            {hasExpiry && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-indigo-300 mb-2 font-bold">
                  Expiry Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded px-3 py-2 text-sm text-white"
                />
                <div className="mt-2 text-xs text-gray-400">
                  After this date, no new NFTs can be minted with this policy
                </div>
              </div>
            )}
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
                    <span className="text-xs text-gray-400">Attributes (edit values for this token)</span>
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
              {allDesigns.map((design) => (
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

      {/* STEP 3: Minting & Distribution - Coming Soon */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-4 border-cyan-500/50 rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl font-bold text-cyan-400">STEP 3</div>
            <h3 className="text-2xl font-bold text-white">Minting & Distribution</h3>
          </div>
          <p className="text-sm text-gray-400">Batch mint NFTs to eligible users</p>
        </div>

        <div className="text-center py-12 bg-blue-900/10 border-2 border-dashed border-blue-500/30 rounded-lg">
          <div className="text-6xl mb-4">🚧</div>
          <div className="text-xl font-bold text-blue-400 mb-2">Coming Next</div>
          <div className="text-gray-400">
            Minting interface will allow you to select a design and batch mint to all eligible users
          </div>
        </div>
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
