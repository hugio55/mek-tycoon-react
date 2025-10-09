'use client'

import { useState, useEffect } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { walletRateLimiter, blockchainRateLimiter, rateLimitedCall } from '@/lib/rateLimiter';

interface VerificationStatus {
  verified: boolean;
  source: 'blockfrost' | 'koios' | 'wallet' | null;
  lastVerified: number | null;
  walletCount: number;
  blockchainCount: number;
  discrepancies: number;
}

interface BlockchainVerificationPanelProps {
  walletAddress: string | null;
  paymentAddress?: string | null;
  meks: any[];
  onVerificationComplete?: (status: VerificationStatus) => void;
  onVerificationStart?: () => void;
  onVerificationEnd?: () => void;
  isProcessingSignature?: boolean;
}

export default function BlockchainVerificationPanel({
  walletAddress,
  paymentAddress,
  meks,
  onVerificationComplete,
  onVerificationStart,
  onVerificationEnd,
  isProcessingSignature = false
}: BlockchainVerificationPanelProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  // Multi-wallet linking removed - one wallet per account
  const [lastCheckpoint, setLastCheckpoint] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [contractState, setContractState] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(null);
  const [verificationProgress, setVerificationProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  // Convex hooks
  const verifyNFTOwnership = useAction(api.blockchainVerification.verifyNFTOwnership);
  const generateNonce = useMutation(api.walletAuthentication.generateNonce);
  const checkAuthentication = useQuery(api.walletAuthentication.checkAuthentication,
    walletAddress ? { stakeAddress: walletAddress } : 'skip'
  );
  // Multi-wallet linking removed - one wallet per account
  const getWalletCheckpoints = useQuery(api.goldCheckpointing.getCheckpoints,
    walletAddress ? { walletAddress, limit: 1 } : 'skip'
  );
  const getRecentLogs = useQuery(api.auditLogs.getWalletLogs,
    walletAddress ? { stakeAddress: walletAddress, limit: 5 } : 'skip'
  );
  const getContractState = useQuery(api.smartContractArchitecture.getContractState);
  const walletVerificationStatus = useQuery(api.goldMining.isWalletVerified,
    walletAddress ? { walletAddress } : 'skip'
  );

  // Multi-wallet linking removed - one wallet per account

  // Update checkpoint
  useEffect(() => {
    if (getWalletCheckpoints && getWalletCheckpoints.length > 0) {
      setLastCheckpoint(getWalletCheckpoints[0]);
    }
  }, [getWalletCheckpoints]);

  // Update audit logs
  useEffect(() => {
    if (getRecentLogs) {
      setAuditLogs(getRecentLogs);
    }
  }, [getRecentLogs]);

  // Update contract state
  useEffect(() => {
    if (getContractState) {
      setContractState(getContractState);
    }
  }, [getContractState]);

  // Update signature status
  useEffect(() => {
    if (checkAuthentication) {
      setSignatureStatus(checkAuthentication.authenticated ? 'verified' : 'pending');
    }
  }, [checkAuthentication]);

  // Load existing verification status from database
  useEffect(() => {
    if (walletVerificationStatus && walletVerificationStatus.exists) {
      if (walletVerificationStatus.isVerified) {
        setVerificationStatus({
          verified: true,
          source: 'blockfrost',
          lastVerified: walletVerificationStatus.lastVerificationTime,
          walletCount: meks.length,
          blockchainCount: meks.length,
          discrepancies: 0
        });
        console.log('[Verification] Loaded existing verification from database - wallet is VERIFIED');
      }
    }
  }, [walletVerificationStatus, meks.length]);

  // Verify NFT ownership
  const handleVerifyOwnership = async () => {
    console.log('[Verification] Starting ownership verification');
    console.log('[Verification] Wallet address:', walletAddress);
    console.log('[Verification] MEKs count:', meks.length);
    console.log('[Verification] MEKs data:', meks);

    // DEMO MODE: Auto-complete verification instantly
    const isDemoMode = walletAddress?.includes('demo');
    if (isDemoMode) {
      console.log('[DEMO MODE] Auto-completing blockchain verification...');
      setIsVerifying(true);
      onVerificationStart?.();
      setProgressPercent(100);
      setVerificationProgress('✓ Verified (Demo Mode)');

      // Simulate brief verification animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const demoStatus: VerificationStatus = {
        verified: true,
        source: 'wallet',
        lastVerified: Date.now(),
        walletCount: meks.length,
        blockchainCount: meks.length,
        discrepancies: 0
      };

      setVerificationStatus(demoStatus);
      setSignatureStatus('verified');
      onVerificationComplete?.(demoStatus);
      setIsVerifying(false);
      onVerificationEnd?.();
      return;
    }

    if (!walletAddress) {
      setVerificationError('No wallet address available');
      console.error('[Verification] No wallet address');
      return;
    }

    if (meks.length === 0) {
      setVerificationError('No MEKs detected in wallet. Please ensure your wallet contains MEK NFTs.');
      console.error('[Verification] No MEKs found in array');
      return;
    }

    setIsVerifying(true);
    onVerificationStart?.();
    setVerificationError(null);
    setProgressPercent(0);
    setVerificationProgress('Initializing verification...');

    try {
      console.log('[Verification] Preparing to verify', meks.length, 'MEKs');

      setProgressPercent(10);
      setVerificationProgress('Connecting to Cardano blockchain...');

      // Simulate brief delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgressPercent(25);
      const progressMsg = meks.length > 200
        ? `Querying ${meks.length} NFTs on-chain... (Large collection - may take up to 45s)`
        : `Querying ${meks.length} NFTs on-chain...`;
      setVerificationProgress(progressMsg);

      // Use rate limiter
      const result = await rateLimitedCall(
        walletAddress,
        blockchainRateLimiter,
        async () => {
          console.log('[Verification] Sending verification request with:', {
            stakeAddress: walletAddress?.substring(0, 20) + '...',
            paymentAddress: paymentAddress?.substring(0, 20) + '...' || 'none',
            mekCount: meks.length
          });

          setProgressPercent(50);
          setVerificationProgress('Verifying NFT ownership via Blockfrost...');

          return await verifyNFTOwnership({
            stakeAddress: walletAddress,
            paymentAddress: paymentAddress || undefined,
            walletReportedMeks: meks.map(m => {
              // Extract mekNumber from assetName if not present (e.g., "Mek #2268" -> 2268)
              const mekNumber = m.mekNumber || parseInt(m.assetName.replace(/\D/g, ''), 10) || 0;
              return {
                assetId: m.assetId,
                assetName: m.assetName,
                mekNumber
              };
            })
          });
        },
        (retryAfter, reason) => {
          setRateLimitStatus({ retryAfter, reason });
          setVerificationError(`Rate limited: ${reason}. Retry in ${Math.ceil(retryAfter / 1000)}s`);
        }
      );

      // Check if rate limited (result is null)
      if (!result) {
        console.warn('[Verification] Request was rate limited or blocked');
        // Error already set by onRateLimited callback above
        // Exit early - the finally block will clean up isVerifying state
        return;
      }

      console.log('[Verification] Verification completed:', result);

      // CRITICAL FIX: Check if backend returned an error before processing
      if (result.error || result.success === false) {
        console.error('[Verification] Backend returned error:', {
          error: result.error,
          success: result.success,
          fullResult: result
        });
        setVerificationError(result.error || 'Verification failed - please try again');
        return; // Exit early - finally block will reset isVerifying
      }

      setProgressPercent(75);
      setVerificationProgress('Processing verification results...');
      await new Promise(resolve => setTimeout(resolve, 300));

      const status: VerificationStatus = {
        verified: result.verified,
        source: result.source,
        lastVerified: result.timestamp,
        walletCount: result.walletReportedCount,
        blockchainCount: result.blockchainVerifiedCount,
        discrepancies: result.falsePositives?.length || 0
      };

      setVerificationStatus(status);

      setProgressPercent(90);
      setVerificationProgress('Initializing Mek Employment Operation...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Show detailed feedback
      if (result.verified) {
        console.log('[Verification] ✓ Ownership verified successfully!');
        setProgressPercent(100);
        setVerificationProgress('✓ Verification complete!');

        // Show success toast
        setShowSuccessToast(true);
        setJustVerified(true);
        setTimeout(() => setShowSuccessToast(false), 6000);
        setTimeout(() => setJustVerified(false), 3000);
      } else {
        console.warn('[Verification] ✗ Ownership verification failed');
        if (result.falsePositives && result.falsePositives.length > 0) {
          setVerificationError(`Verification failed: ${result.falsePositives.length} MEK(s) not found on blockchain`);
        } else if (result.missingMeks && result.missingMeks.length > 0) {
          setVerificationError(`Verification incomplete: ${result.missingMeks.length} MEK(s) on blockchain not reported by wallet`);
        } else {
          setVerificationError('Verification failed: MEK counts do not match');
        }
      }

      if (onVerificationComplete) {
        onVerificationComplete(status);
      }
    } catch (error: any) {
      console.error('[Verification] Error during verification:', error);
      console.error('[Verification] Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      });

      // Special handling for specific error types
      if (error.message?.includes('timed out')) {
        setVerificationError(
          `Verification timed out after 45 seconds. Large collections (200+ NFTs) may require multiple attempts. ` +
          `Please wait 30 seconds and try again. If this persists after 3 attempts, contact support.`
        );
      } else if (error.message?.includes('query') || error.message?.includes('mutation') || error.message?.includes('ctx')) {
        // Database/context errors (this is the error we're fixing)
        setVerificationError(
          `Database error during verification. This is a temporary issue. Please wait 10 seconds and try again.`
        );
      } else if (error.message?.includes('Rate limit')) {
        setVerificationError(
          `Rate limit exceeded. Please wait 60 seconds before trying again.`
        );
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setVerificationError(
          `Network error. Please check your internet connection and try again.`
        );
      } else {
        setVerificationError(error.message || 'Verification failed. Please try again in a moment.');
      }
    } finally {
      setIsVerifying(false);
      onVerificationEnd?.();
    }
  };

  // Get rate limit status
  const getRateLimitInfo = () => {
    if (!walletAddress) return null;
    return blockchainRateLimiter.getStatus(walletAddress);
  };

  return (
    <div className="mek-card-industrial mek-border-sharp-gold p-4 sm:p-6 space-y-3 sm:space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-yellow-500/30 pb-3 sm:pb-4">
        <h3 className="mek-text-industrial text-yellow-500 text-sm sm:text-base">BLOCKCHAIN VERIFICATION</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-yellow-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
          aria-label={showDetails ? 'Hide details' : 'Show details'}
        >
          <span className="text-2xl sm:text-xl">{showDetails ? '−' : '+'}</span>
        </button>
      </div>

      {/* Main Status */}
      <div className="space-y-2 sm:space-y-3">
        {/* Verification Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="mek-label-uppercase text-xs sm:text-sm">Ownership Status</span>
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            {verificationStatus ? (
              <>
                <div className={`w-4 h-4 sm:w-3 sm:h-3 rounded-full ${
                  verificationStatus.verified ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className={`text-sm sm:text-sm font-bold ${
                  verificationStatus.verified ? 'text-green-500' : 'text-red-500'
                }`}>
                  {verificationStatus.verified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-sm font-medium">Not verified</span>
            )}
          </div>
        </div>

        {/* Signature Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="mek-label-uppercase text-xs sm:text-sm">Wallet Signature</span>
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            {isProcessingSignature ? (
              <>
                <div className="relative w-4 h-4 sm:w-3 sm:h-3">
                  <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                </div>
                <span className="text-sm text-yellow-400 uppercase font-medium">Processing...</span>
              </>
            ) : (
              <>
                <div className={`w-4 h-4 sm:w-3 sm:h-3 rounded-full ${
                  signatureStatus === 'verified' ? 'bg-green-500' :
                  signatureStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                } ${signatureStatus === 'pending' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-400 uppercase font-medium">{signatureStatus}</span>
              </>
            )}
          </div>
        </div>

        {/* Multi-wallet linking removed - one wallet per account */}

        {/* Last Checkpoint */}
        <div className="flex items-center justify-between gap-3">
          <span className="mek-label-uppercase text-xs sm:text-sm">Last Checkpoint</span>
          <span className="text-sm text-gray-400 font-medium">
            {lastCheckpoint
              ? new Date(lastCheckpoint.timestamp).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>

        {/* Smart Contract Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="mek-label-uppercase text-xs sm:text-sm">Smart Contract</span>
          <span className="text-sm text-green-500 font-bold">
            {contractState ? 'ACTIVE' : 'SIMULATED'}
          </span>
        </div>
      </div>

      {/* Verify Button with States - Mobile Optimized */}
      <button
        onClick={handleVerifyOwnership}
        disabled={isVerifying || !walletAddress || meks.length === 0}
        className={`relative w-full min-h-[56px] px-4 sm:px-6 py-3 sm:py-3 font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-200 overflow-hidden touch-manipulation
          ${verificationError
            ? 'bg-red-900/30 border-2 border-red-500/50 text-red-400 cursor-not-allowed active:scale-95'
            : verificationStatus?.verified
            ? 'bg-green-900/30 border-2 border-green-500/50 text-green-400 active:scale-95'
            : 'mek-button-primary active:scale-95'
          }
          ${(isVerifying || !walletAddress || meks.length === 0) && !verificationError ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={verificationError ? { clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)' } : {}}
        data-verify-blockchain
        aria-busy={isVerifying}
        aria-live="polite"
      >
        {/* Button Background Effects */}
        {verificationError && (
          <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-20 pointer-events-none" />
        )}
        {verificationStatus?.verified && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-green-400/20 to-green-500/10 pointer-events-none" />
        )}

        {/* Button Content - Mobile Optimized */}
        <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
          {isVerifying ? (
            <>
              <div className="relative">
                <div className="w-5 h-5 sm:w-5 sm:h-5 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-5 h-5 sm:w-5 sm:h-5 border-3 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
              </div>
              <span className="animate-pulse leading-tight">
                <span className="hidden sm:inline">VERIFYING ON BLOCKCHAIN...</span>
                <span className="sm:hidden">VERIFYING...</span>
              </span>
            </>
          ) : verificationError ? (
            <>
              <span className="text-2xl leading-none">⚠</span>
              <span className="leading-tight">
                <span className="hidden sm:inline">VERIFICATION FAILED</span>
                <span className="sm:hidden">FAILED</span>
              </span>
            </>
          ) : verificationStatus?.verified ? (
            <>
              <span className="text-xl leading-none">✓</span>
              <span className="leading-tight">
                <span className="hidden sm:inline">VERIFIED ON BLOCKCHAIN</span>
                <span className="sm:hidden">VERIFIED</span>
              </span>
            </>
          ) : (
            <span className="leading-tight">
              <span className="hidden sm:inline">VERIFY ON BLOCKCHAIN</span>
              <span className="sm:hidden">VERIFY BLOCKCHAIN</span>
            </span>
          )}
        </span>
      </button>

      {/* Success Toast Notification - Industrial Design */}
      {showSuccessToast && (
        <div className="relative overflow-hidden rounded-lg border-2 border-green-500/50 bg-black/70 backdrop-blur-sm animate-in">
          {/* Success header with scan effect */}
          <div className="relative h-12 sm:h-9 flex items-center px-3 sm:px-4 border-b border-green-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-green-700/20" />
            <div className="absolute inset-0 mek-scan-effect" />
            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
              <div className="relative">
                <div className="w-8 h-8 sm:w-6 sm:h-6 bg-green-500/30 rounded-full flex items-center justify-center border-2 border-green-500">
                  <span className="text-green-400 text-xl sm:text-lg font-bold leading-none">✓</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-50" />
              </div>
              <span className="text-green-400 font-bold text-xs uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                VERIFICATION SUCCESSFUL
              </span>
            </div>
          </div>

          {/* Success message content */}
          <div className="p-4 sm:p-4 space-y-3">
            <p className="text-green-300 text-sm leading-relaxed font-medium">
              {meks.length} MEK{meks.length !== 1 ? 's' : ''} successfully verified on the Cardano blockchain
            </p>

            {/* Stats display - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
              <div className="bg-green-950/30 border border-green-500/20 rounded p-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Wallet MEKs</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{verificationStatus?.walletCount || meks.length}</div>
              </div>
              <div className="bg-green-950/30 border border-green-500/20 rounded p-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Blockchain MEKs</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{verificationStatus?.blockchainCount || meks.length}</div>
              </div>
            </div>

            {/* Dismiss button - Mobile Optimized */}
            <button
              onClick={() => setShowSuccessToast(false)}
              className="w-full mt-2 min-h-[48px] sm:min-h-0 px-4 py-3 sm:py-2 bg-green-500/20 border border-green-500/50 text-green-400
                active:bg-green-500/40 sm:hover:bg-green-500/30 active:border-green-500 sm:hover:border-green-500 transition-all duration-200
                text-xs font-bold uppercase tracking-wider rounded touch-manipulation"
            >
              Continue
            </button>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-500" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-500" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-500" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-500" />
        </div>
      )}

      {/* Industrial Error Message Panel - Mobile Optimized */}
      {verificationError && (
        <div className="relative overflow-hidden rounded-lg border-2 border-red-500/50 bg-black/60 backdrop-blur-sm">
          {/* Hazard stripe header */}
          <div className="mek-overlay-hazard-stripes h-12 sm:h-8 flex items-center px-3 sm:px-4 border-b border-red-500/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-6 sm:h-6 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500">
                  <span className="text-red-400 text-xl sm:text-lg font-bold leading-none">!</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-50" />
              </div>
              <span className="text-red-400 font-bold text-xs sm:text-xs uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                VERIFICATION ERROR
              </span>
            </div>
          </div>

          {/* Error message content */}
          <div className="p-4 sm:p-4 space-y-3">
            <p className="text-red-300 text-sm leading-relaxed max-h-32 overflow-y-auto">
              {verificationError}
            </p>

            {/* Action buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  setVerificationError(null);
                  handleVerifyOwnership();
                }}
                className="min-h-[48px] sm:min-h-0 sm:flex-1 px-4 py-3 sm:py-2 bg-red-500/20 border border-red-500/50 text-red-400
                  active:bg-red-500/40 sm:hover:bg-red-500/30 active:border-red-500 sm:hover:border-red-500 transition-all duration-200
                  text-xs sm:text-xs font-bold uppercase tracking-wider rounded touch-manipulation"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-lg sm:text-base leading-none">↻</span>
                  <span className="leading-tight">Retry Verification</span>
                </span>
              </button>
              <button
                onClick={() => setVerificationError(null)}
                className="min-h-[48px] sm:min-h-0 px-4 py-3 sm:py-2 bg-gray-800/50 border border-gray-600/50 text-gray-400
                  active:bg-gray-700/50 sm:hover:bg-gray-700/50 active:border-gray-500 sm:hover:border-gray-500 transition-all duration-200
                  text-xs sm:text-xs font-bold uppercase tracking-wider rounded touch-manipulation"
              >
                Dismiss
              </button>
            </div>

            {/* Technical info hint */}
            {verificationError.includes('timed out') && (
              <div className="pt-2 border-t border-red-500/20">
                <p className="text-xs text-gray-500 italic">
                  Large collections may require additional time. If the issue persists, contact technical support.
                </p>
              </div>
            )}
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500" />
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-yellow-500/30">
          {/* Verification Details */}
          {verificationStatus && (
            <div className="space-y-2">
              <h4 className="text-yellow-500 text-sm font-bold uppercase">Verification Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Source:</span>
                <span className="text-gray-300">{verificationStatus.source?.toUpperCase()}</span>
                <span className="text-gray-500">Wallet MEKs:</span>
                <span className="text-gray-300">{verificationStatus.walletCount}</span>
                <span className="text-gray-500">Blockchain MEKs:</span>
                <span className="text-gray-300">{verificationStatus.blockchainCount}</span>
                <span className="text-gray-500">Discrepancies:</span>
                <span className={verificationStatus.discrepancies > 0 ? 'text-red-400' : 'text-green-400'}>
                  {verificationStatus.discrepancies}
                </span>
              </div>
            </div>
          )}

          {/* Rate Limit Status */}
          {walletAddress && (
            <div className="space-y-2">
              <h4 className="text-yellow-500 text-sm font-bold uppercase">Rate Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Requests Remaining:</span>
                <span className="text-gray-300">{getRateLimitInfo()?.requestsRemaining || 0}</span>
                <span className="text-gray-500">Circuit Status:</span>
                <span className={getRateLimitInfo()?.circuitOpen ? 'text-red-400' : 'text-green-400'}>
                  {getRateLimitInfo()?.circuitOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          )}

          {/* Recent Audit Logs */}
          {auditLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-yellow-500 text-sm font-bold uppercase">Recent Activity</h4>
              <div className="space-y-1">
                {auditLogs.slice(0, 3).map((log, i) => (
                  <div key={i} className="text-xs text-gray-400">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' - '}
                    <span className="text-gray-300">{log.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract State */}
          {contractState && (
            <div className="space-y-2">
              <h4 className="text-yellow-500 text-sm font-bold uppercase">Contract State</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Total Staked:</span>
                <span className="text-gray-300">{contractState.totalStaked}</span>
                <span className="text-gray-500">Active Validators:</span>
                <span className="text-gray-300">{contractState.activeValidators}</span>
                <span className="text-gray-500">Pending Proposals:</span>
                <span className="text-gray-300">{contractState.pendingProposals}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay when verifying - Full screen overlay */}
      {isVerifying && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8 max-w-md mx-4">
            <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
              <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-b-yellow-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              {/* Progress circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="44"
                  fill="none"
                  stroke="rgba(250, 182, 23, 0.2)"
                  strokeWidth="3"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="44"
                  fill="none"
                  stroke="#fab617"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercent * 2.76} 276`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-yellow-500 font-bold text-base sm:text-lg">
                {progressPercent}%
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-yellow-500 font-bold text-lg sm:text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                VERIFYING OWNERSHIP
              </p>
              <div className="min-h-[48px] sm:h-12 flex items-center justify-center px-2">
                <p className="text-gray-300 text-sm sm:text-base font-medium animate-pulse">
                  {verificationProgress ||'Initializing...'}
                </p>
              </div>
              {progressPercent < 100 && (
                <p className="text-gray-500 text-xs sm:text-sm">
                  {meks.length > 200
                    ? 'Large collection detected. This may take up to 45 seconds.'
                    : 'Please wait, this process may take up to 30 seconds'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}