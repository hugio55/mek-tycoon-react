'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';

interface AirdropClaimBannerProps {
  userId: Id<"users"> | null;
  walletAddress: string | null;
}

export default function AirdropClaimBanner({ userId, walletAddress }: AirdropClaimBannerProps) {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Mutation
  const submitAddress = useMutation(api.airdrop.submitAddress);

  // Get active airdrop config
  const activeConfig = useQuery(api.airdrop.getActiveConfig, {});

  // Check if user has already submitted
  const userSubmission = useQuery(
    api.airdrop.getUserSubmission,
    userId && activeConfig ? { userId, campaignName: activeConfig.campaignName } : "skip"
  );

  // Check if user is eligible (wallet connected + verified + gold > 0)
  const verificationStatus = useQuery(
    api.goldMining.isWalletVerified,
    walletAddress && walletAddress !== "demo_wallet_123" ? { walletAddress } : "skip"
  );

  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Don't show banner if:
  // - No active campaign
  // - User already submitted
  // - User not eligible
  // - Loading states
  if (!activeConfig || activeConfig === null) return null;
  if (!activeConfig.isActive) return null;

  // TEST MODE: If enabled, only show to whitelisted wallets
  if (activeConfig.testMode && walletAddress) {
    const testWallets = activeConfig.testWallets || [];
    if (!testWallets.includes(walletAddress)) {
      return null; // Not in whitelist, hide banner
    }
  }

  if (userSubmission && userSubmission !== null) return null;
  if (!verificationStatus || !verificationStatus.isVerified) return null;
  if (!goldMiningData) return null;

  // Calculate cumulative gold (total earned over all time)
  const now = Date.now();
  let cumulativeGold = goldMiningData.totalCumulativeGold || 0;
  if (goldMiningData.isBlockchainVerified) {
    const lastUpdateTime = goldMiningData.lastSnapshotTime || goldMiningData.updatedAt || goldMiningData.createdAt;
    const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
    const goldSinceLastUpdate = goldMiningData.totalGoldPerHour * hoursSinceLastUpdate;
    cumulativeGold = (goldMiningData.totalCumulativeGold || 0) + goldSinceLastUpdate;
  }

  // Check if user has enough gold
  if (cumulativeGold <= (activeConfig.minimumGold || 0)) return null;

  // Validate Cardano address
  const validateAddress = (addr: string): { valid: boolean; message?: string } => {
    if (!addr) return { valid: false, message: 'Address is required' };

    const trimmed = addr.trim();

    if (!trimmed.startsWith('addr1') && !trimmed.startsWith('addr_test1')) {
      return { valid: false, message: 'Must start with addr1 or addr_test1' };
    }

    if (trimmed.length < 58 || trimmed.length > 108) {
      return { valid: false, message: 'Invalid address length (58-108 characters)' };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    if (!userId || !activeConfig) return;

    const validation = validateAddress(receiveAddress);
    if (!validation.valid) {
      setSubmitError(validation.message || 'Invalid address');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitAddress({
        userId,
        receiveAddress: receiveAddress.trim(),
        campaignName: activeConfig.campaignName,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowAddressModal(false);
        setSubmitSuccess(false);
        setReceiveAddress('');
      }, 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddressModal(false);
    setReceiveAddress('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const addressValidation = receiveAddress ? validateAddress(receiveAddress) : { valid: false };

  return (
    <>
      {/* Airdrop Claim Banner */}
      <div
        className="mb-6 p-6 rounded-xl border-4"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.4) 100%)',
          borderColor: '#06b6d4',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="text-center">
          <h3
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#e0f2fe',
              textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
              letterSpacing: '0.05em'
            }}
          >
            Phase 1: Commemorative NFT
          </h3>
          <p
            className="text-sm mb-2"
            style={{
              color: '#bae6fd',
              lineHeight: '1.5',
              fontSize: '0.875rem'
            }}
          >
            {activeConfig.nftDescription || 'Claim your commemorative NFT as an early supporter!'}
          </p>
          <p
            className="text-sm mb-4"
            style={{
              color: '#7dd3fc',
              lineHeight: '1.6'
            }}
          >
            You have accumulated a total of {Math.floor(cumulativeGold).toLocaleString()}g and are eligible to claim.
          </p>
          <div className="w-full max-w-xs mx-auto">
            <HolographicButton
              text="Claim Your NFT"
              onClick={() => setShowAddressModal(true)}
              isActive={true}
              variant="yellow"
              alwaysOn={true}
              hideIcon={true}
              className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
            />
          </div>
        </div>
      </div>

      {/* Address Submission Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-black/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl max-w-lg w-full mx-4 relative overflow-hidden"
            style={{
              boxShadow: '0 0 60px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/70" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/70" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/70" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/70" />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 19px, #06b6d4 19px, #06b6d4 20px),
                  repeating-linear-gradient(90deg, transparent, transparent 19px, #06b6d4 19px, #06b6d4 20px)
                `
              }}
            />

            <div className="p-6 sm:p-8 relative z-10">
              {/* Header */}
              <div className="mb-6">
                <h3
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#e0f2fe',
                    textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
                    letterSpacing: '0.05em'
                  }}
                >
                  Submit Receive Address
                </h3>
                <p className="text-sm text-cyan-300/80">
                  Enter your Cardano wallet address to receive your NFT
                </p>
              </div>

              {/* Success State */}
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✓</div>
                  <h4 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    Submission Successful!
                  </h4>
                  <p className="text-gray-400">
                    Your address has been registered. We'll send your NFT soon.
                  </p>
                </div>
              ) : (
                <>
                  {/* Address Input */}
                  <div className="mb-6">
                    <label className="block text-xs uppercase tracking-wider text-cyan-300 mb-2 font-bold">
                      Cardano Receive Address
                    </label>
                    <input
                      type="text"
                      value={receiveAddress}
                      onChange={(e) => {
                        setReceiveAddress(e.target.value);
                        setSubmitError(null);
                      }}
                      placeholder="addr1..."
                      disabled={isSubmitting}
                      className="w-full bg-black/50 border-2 rounded-lg px-4 py-3 font-mono text-sm transition-all focus:outline-none"
                      style={{
                        borderColor: receiveAddress
                          ? addressValidation.valid
                            ? '#22c55e'
                            : '#ef4444'
                          : '#6b7280',
                        boxShadow: receiveAddress
                          ? addressValidation.valid
                            ? '0 0 10px rgba(34, 197, 94, 0.3)'
                            : '0 0 10px rgba(239, 68, 68, 0.3)'
                          : 'none'
                      }}
                    />

                    {/* Validation Feedback */}
                    {receiveAddress && !addressValidation.valid && addressValidation.message && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <span>⚠</span>
                        <span>{addressValidation.message}</span>
                      </p>
                    )}

                    {receiveAddress && addressValidation.valid && (
                      <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                        <span>✓</span>
                        <span>Valid Cardano address</span>
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {submitError && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                      <p className="text-sm text-red-400">
                        <strong>Error:</strong> {submitError}
                      </p>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="mb-6 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <p className="text-xs text-cyan-200">
                      <strong>Important:</strong> Make sure this is a Cardano mainnet address you control. NFTs will be sent to this address after processing.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg font-bold transition-all uppercase text-sm"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !addressValidation.valid}
                      className="flex-1 px-6 py-3 rounded-lg font-bold transition-all uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: addressValidation.valid && !isSubmitting
                          ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                          : '#374151',
                        color: addressValidation.valid && !isSubmitting ? '#ffffff' : '#6b7280',
                        fontFamily: "'Orbitron', sans-serif",
                        boxShadow: addressValidation.valid && !isSubmitting
                          ? '0 4px 12px rgba(6, 182, 212, 0.5)'
                          : 'none'
                      }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-cyan-200 border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        'Submit Address'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
