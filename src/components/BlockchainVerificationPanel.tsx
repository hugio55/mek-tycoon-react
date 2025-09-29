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
  isProcessingSignature?: boolean;
}

export default function BlockchainVerificationPanel({
  walletAddress,
  paymentAddress,
  meks,
  onVerificationComplete,
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
      setVerificationProgress(`Querying ${meks.length} NFTs on-chain...`);

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

      if (result) {
        console.log('[Verification] Verification completed:', result);

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
      }
    } catch (error: any) {
      console.error('[Verification] Error during verification:', error);
      setVerificationError(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Get rate limit status
  const getRateLimitInfo = () => {
    if (!walletAddress) return null;
    return blockchainRateLimiter.getStatus(walletAddress);
  };

  return (
    <div className="mek-card-industrial mek-border-sharp-gold p-6 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-yellow-500/30 pb-4">
        <h3 className="mek-text-industrial text-yellow-500">BLOCKCHAIN VERIFICATION</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-yellow-500 transition-colors"
        >
          {showDetails ? '−' : '+'}
        </button>
      </div>

      {/* Main Status */}
      <div className="space-y-3">
        {/* Verification Status */}
        <div className="flex items-center justify-between">
          <span className="mek-label-uppercase">Ownership Status</span>
          <div className="flex items-center gap-2">
            {verificationStatus ? (
              <>
                <div className={`w-3 h-3 rounded-full ${
                  verificationStatus.verified ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className={`text-sm ${
                  verificationStatus.verified ? 'text-green-500' : 'text-red-500'
                }`}>
                  {verificationStatus.verified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">Not verified</span>
            )}
          </div>
        </div>

        {/* Signature Status */}
        <div className="flex items-center justify-between">
          <span className="mek-label-uppercase">Wallet Signature</span>
          <div className="flex items-center gap-2">
            {isProcessingSignature ? (
              <>
                <div className="relative w-3 h-3">
                  <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                </div>
                <span className="text-sm text-yellow-400 uppercase">Processing...</span>
              </>
            ) : (
              <>
                <div className={`w-3 h-3 rounded-full ${
                  signatureStatus === 'verified' ? 'bg-green-500' :
                  signatureStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                } ${signatureStatus === 'pending' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-400 uppercase">{signatureStatus}</span>
              </>
            )}
          </div>
        </div>

        {/* Multi-wallet linking removed - one wallet per account */}

        {/* Last Checkpoint */}
        <div className="flex items-center justify-between">
          <span className="mek-label-uppercase">Last Checkpoint</span>
          <span className="text-sm text-gray-400">
            {lastCheckpoint
              ? new Date(lastCheckpoint.timestamp).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>

        {/* Smart Contract Status */}
        <div className="flex items-center justify-between">
          <span className="mek-label-uppercase">Smart Contract</span>
          <span className="text-sm text-green-500">
            {contractState ? 'ACTIVE' : 'SIMULATED'}
          </span>
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerifyOwnership}
        disabled={isVerifying || !walletAddress || meks.length === 0}
        className="mek-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        data-verify-blockchain
      >
        {isVerifying ? (
          <span className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-5 h-5 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-5 h-5 border-3 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
            </div>
            <span className="animate-pulse">VERIFYING ON BLOCKCHAIN...</span>
          </span>
        ) : (
          'VERIFY ON BLOCKCHAIN'
        )}
      </button>

      {/* Error Message */}
      {verificationError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
          <p className="text-red-400 text-sm">{verificationError}</p>
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
          <div className="text-center space-y-6 p-8 max-w-md">
            <div className="relative mx-auto w-24 h-24">
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
              <div className="absolute inset-0 flex items-center justify-center text-yellow-500 font-bold text-lg">
                {progressPercent}%
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-yellow-500 font-bold text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                VERIFYING OWNERSHIP
              </p>
              <div className="h-12 flex items-center justify-center">
                <p className="text-gray-300 text-base font-medium animate-pulse">
                  {verificationProgress ||'Initializing...'}
                </p>
              </div>
              {progressPercent < 100 && (
                <p className="text-gray-500 text-xs">Please wait, this process may take up to 30 seconds</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}