'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import NFTClaimSuccess from './NFTClaimSuccess';

interface NMKRPayLightboxProps {
  walletAddress?: string;
  onClose: () => void;
  debugState?: 'loading' | 'success'; // Direct state override for debug panel
}

type LightboxState = 'payment' | 'processing' | 'success' | 'error' | 'cancelled';

export default function NMKRPayLightbox({ walletAddress = 'test_wallet', onClose, debugState }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LightboxState>(
    debugState === 'loading' ? 'processing' :
    debugState === 'success' ? 'success' :
    'payment'
  );
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [paymentWindowOpenedAt, setPaymentWindowOpenedAt] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [claimedNFT, setClaimedNFT] = useState<any>(
    debugState === 'success' ? {
      _id: 'debug_mock_claim',
      _creationTime: Date.now(),
      walletAddress: walletAddress,
      transactionHash: 'debug_mock_tx_123',
      nftName: 'Commemorative NFT (Debug)',
      nftAssetId: 'debug_asset_123',
      claimedAt: Date.now(),
      metadata: {
        imageUrl: '/commemorative-nft.png',
        collection: 'Mek Tycoon Commemorative',
        artist: 'Mek Tycoon Team',
        website: 'https://mektycoon.com',
      },
    } : null
  );
  const [mockPaymentProcessing, setMockPaymentProcessing] = useState(false);

  // Checklist status tracking
  const [checklistStatus, setChecklistStatus] = useState({
    paymentReceived: false,
    minting: false,
    confirming: false
  });

  // Get NMKR configuration
  const NMKR_PROJECT_ID = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID;
  const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || 'mainnet';

  // Determine if we're in test mode (no real wallet connected)
  const isTestMode = walletAddress === 'test_wallet_address_for_nmkr_testing';

  // Check if in debug mode (debug panel triggering specific states)
  const isDebugMode = !!debugState;

  // Mutation for creating mock claim in test mode
  const recordClaim = useMutation(api.commemorativeNFTClaims.recordClaim);

  // Poll for payment status (webhook-based, accurate!)
  // This replaces the old fake setTimeout logic with real webhook tracking
  const paymentStatus = useQuery(
    api.commemorativeNFTClaims.checkClaimed,
    state === 'processing' ? { walletAddress } : "skip"
  );

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Open NMKR payment window on mount (ONLY if NOT in test mode or debug mode)
  useEffect(() => {
    if (!mounted || state !== 'payment' || isTestMode || isDebugMode) {
      return;
    }

    // Use preprod URL for testnet, mainnet URL for production
    const baseUrl = NMKR_NETWORK === 'mainnet'
      ? 'https://pay.nmkr.io'
      : 'https://pay.preprod.nmkr.io';
    const nmkrUrl = `${baseUrl}/?p=${NMKR_PROJECT_ID}&c=1`;

    console.log('[💰CLAIM] Opening NMKR payment window:', nmkrUrl);
    // Open payment popup
    const popup = window.open(
      nmkrUrl,
      'NMKR Payment',
      'width=500,height=800,left=100,top=100'
    );

    if (!popup) {
      setErrorMessage('Failed to open payment window. Please allow popups for this site.');
      setState('error');
      return;
    }
    setPaymentWindow(popup);
    const openedAt = Date.now();
    setPaymentWindowOpenedAt(openedAt);

    // Monitor popup closure
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);

        const windowOpenDuration = Date.now() - openedAt;
        console.log('[💰CLAIM] Payment window closed after', windowOpenDuration, 'ms');

        // IMPORTANT: Don't assume payment based on window open time
        // Window could be open long due to timeout, user distraction, etc.
        // Always show cancelled state and let webhook polling handle success detection
        console.log('[💰CLAIM] Window closed - entering cancelled state, webhook will detect actual payment if completed');
        setState('cancelled');
        setErrorMessage('Payment window was closed. If you completed the payment, your NFT will arrive in your wallet within 1-2 minutes.');
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
  }, [mounted, state, NMKR_PROJECT_ID, isTestMode]);

  // Update checklist based on actual webhook events (NO MORE FAKE TIMEOUTS!)
  useEffect(() => {
    if (state !== 'processing') return;
    if (!paymentStatus) return;

    // Check if payment was received via webhook
    if (paymentStatus.hasClaimed && paymentStatus.claim) {
      // Payment completed! Mark all steps as done
      console.log('[💰CLAIM] Payment status received from webhook:', paymentStatus);
      setChecklistStatus({
        paymentReceived: true,
        minting: true,
        confirming: true
      });
    }
  }, [state, paymentStatus]);

  // Check for claim completion (webhook tells us when NFT is delivered!)
  useEffect(() => {
    if (isDebugMode) return; // Don't auto-transition in debug mode
    if (state === 'processing' && paymentStatus?.hasClaimed) {
      console.log('[💰CLAIM] NFT claimed successfully via webhook!');
      // Mark all steps complete before transitioning to success
      setChecklistStatus({
        paymentReceived: true,
        minting: true,
        confirming: true
      });
      setClaimedNFT(paymentStatus.claim);
      setState('success');
    }
  }, [state, paymentStatus, isDebugMode]);

  // Timeout after 5 minutes of processing (skip in debug mode)
  useEffect(() => {
    if (state !== 'processing' || isDebugMode) return;

    const timeout = setTimeout(() => {
      setErrorMessage('Transaction is taking longer than expected. Please check your wallet for the NFT.');
      setState('error');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timeout);
  }, [state, isDebugMode]);

  // Close payment window if user closes lightbox
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  // Handle mock payment completion (test mode only)
  const handleMockPayment = async () => {
    if (!isTestMode) return;

    setMockPaymentProcessing(true);

    try {
      // Create a mock claim record
      await recordClaim({
        walletAddress: walletAddress,
        transactionHash: `mock_tx_${Date.now()}`,
        nftName: "Commemorative NFT (Test)",
        nftAssetId: `mock_asset_${Date.now()}`,
        metadata: {
          imageUrl: "/commemorative-nft.png",
          collection: "Mek Tycoon Commemorative",
          artist: "Mek Tycoon Team",
          website: "https://mektycoon.com",
        },
      });

      // Transition to processing state and mark payment received
      setState('processing');
      setChecklistStatus({
        paymentReceived: true,
        minting: false,
        confirming: false
      });
    } catch (error) {
      console.error('Mock payment error:', error);
      setErrorMessage('Failed to create mock claim');
      setState('error');
    } finally {
      setMockPaymentProcessing(false);
    }
  };

  // Only render on client-side after mount
  if (!mounted) {
    return null;
  }

  const renderContent = () => {
    switch (state) {
      case 'payment':
        // TEST MODE: Show mock payment UI
        if (isTestMode) {
          return (
            <div className="text-center">
              {/* TEST MODE Banner */}
              <div className="mb-6 p-3 bg-red-500/20 border-2 border-red-500 rounded animate-pulse">
                <div className="text-red-400 font-bold text-lg uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  ⚠️ TEST MODE ⚠️
                </div>
                <p className="text-red-300 text-xs mt-1">Mock Payment - No Real Money Required</p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Mock NFT Purchase
                </h2>
                <p className="text-gray-400 mb-4">
                  This is a simulated payment window for testing purposes
                </p>
              </div>

              {/* Mock Payment Details */}
              <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Item:</span>
                    <span className="text-yellow-400">Commemorative NFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-yellow-400">0 ₳ (Test)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-yellow-400">{NMKR_NETWORK}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-yellow-400 text-xs truncate max-w-[200px]">{walletAddress}</span>
                  </div>
                </div>
              </div>

              {/* Mock Payment Button */}
              <button
                onClick={handleMockPayment}
                disabled={mockPaymentProcessing}
                className="w-full px-6 py-4 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {mockPaymentProcessing ? 'Processing...' : '✓ Complete Mock Payment'}
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Click the button above to simulate a successful payment
              </p>
            </div>
          );
        }

        // PRODUCTION MODE: Show normal payment UI
        return (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Complete Your Purchase</h2>
              <p className="text-gray-400">
                Complete the payment in the NMKR window
              </p>
            </div>
            <div className="text-sm text-gray-500 space-y-2">
              <p className="uppercase tracking-wide">Network: <span className="text-yellow-500">{NMKR_NETWORK}</span></p>
              <p className="mt-2 animate-pulse text-yellow-500/70">Waiting for payment...</p>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            {/* Header Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Processing Your NFT
              </h2>
              <p className="text-gray-400 mb-6">
                Waiting for blockchain confirmation...
              </p>

              {/* Checklist with Industrial Styling */}
              <div className="bg-black/60 border-2 border-yellow-500/30 rounded p-4 space-y-3 text-left max-w-md mx-auto backdrop-blur-sm">
                {/* Step 1: Payment Received */}
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full ${
                    checklistStatus.paymentReceived
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-gray-700/20 border-2 border-gray-600'
                  } flex items-center justify-center transition-all duration-300`}>
                    {checklistStatus.paymentReceived ? (
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    ) : (
                      <span className="text-gray-600 text-sm inline-block animate-spin" style={{ animationDuration: '2s' }}>⏳</span>
                    )}
                  </div>
                  <span className={`font-medium uppercase tracking-wide text-sm transition-colors duration-300 ${
                    checklistStatus.paymentReceived ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    Payment received
                  </span>
                </div>

                {/* Step 2: Minting NFT */}
                <div className={`flex items-center gap-3 ${checklistStatus.minting && !checklistStatus.confirming ? 'animate-pulse' : ''}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full ${
                    checklistStatus.confirming
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : checklistStatus.minting
                        ? 'bg-yellow-500/20 border-2 border-yellow-500'
                        : 'bg-gray-700/20 border-2 border-gray-600'
                  } flex items-center justify-center transition-all duration-300`}>
                    {checklistStatus.confirming ? (
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    ) : checklistStatus.minting ? (
                      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
                    ) : (
                      <span className="text-gray-600 text-sm inline-block animate-spin" style={{ animationDuration: '2s' }}>⏳</span>
                    )}
                  </div>
                  <span className={`font-medium uppercase tracking-wide text-sm transition-colors duration-300 ${
                    checklistStatus.confirming
                      ? 'text-green-400'
                      : checklistStatus.minting
                        ? 'text-yellow-400'
                        : 'text-gray-500'
                  }`}>
                    Minting NFT on blockchain...
                  </span>
                </div>

                {/* Step 3: Confirming Transaction */}
                <div className={`flex items-center gap-3 ${checklistStatus.confirming && state === 'processing' ? 'animate-pulse' : ''}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full ${
                    checklistStatus.confirming
                      ? 'bg-yellow-500/20 border-2 border-yellow-500'
                      : 'bg-gray-700/20 border-2 border-gray-600'
                  } flex items-center justify-center transition-all duration-300`}>
                    {checklistStatus.confirming ? (
                      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
                    ) : (
                      <span className="text-gray-600 text-sm inline-block animate-spin" style={{ animationDuration: '2s' }}>⏳</span>
                    )}
                  </div>
                  <span className={`font-medium uppercase tracking-wide text-sm transition-colors duration-300 ${
                    checklistStatus.confirming ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    Confirming transaction
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="mt-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded backdrop-blur-sm">
              <p className="text-yellow-400 text-xs uppercase tracking-wider font-bold">
                ⚠ This may take 1-2 minutes. Please don't close this window.
              </p>
            </div>

            {/* Debug Controls - Only visible in debug mode or test mode */}
            {(isDebugMode || isTestMode) && (
              <div className="mt-6 p-4 bg-purple-500/10 border-2 border-purple-500/50 rounded backdrop-blur-sm">
                <div className="text-purple-400 text-xs uppercase tracking-wider font-bold mb-3 text-center">
                  🐛 Debug Controls
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setChecklistStatus({
                        paymentReceived: true,
                        minting: false,
                        confirming: false
                      });
                    }}
                    disabled={checklistStatus.paymentReceived}
                    className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded hover:bg-purple-500/30 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Complete Payment
                  </button>
                  <button
                    onClick={() => {
                      setChecklistStatus({
                        paymentReceived: true,
                        minting: true,
                        confirming: false
                      });
                    }}
                    disabled={!checklistStatus.paymentReceived || checklistStatus.confirming}
                    className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded hover:bg-purple-500/30 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Complete Minting
                  </button>
                  <button
                    onClick={() => {
                      setChecklistStatus({
                        paymentReceived: true,
                        minting: true,
                        confirming: true
                      });
                      // Simulate success after a short delay
                      setTimeout(() => {
                        setClaimedNFT({
                          _id: 'debug_claim_' + Date.now(),
                          _creationTime: Date.now(),
                          walletAddress: walletAddress,
                          transactionHash: 'debug_tx_' + Date.now(),
                          nftName: 'Commemorative NFT (Debug)',
                          nftAssetId: 'debug_asset_' + Date.now(),
                          claimedAt: Date.now(),
                          metadata: {
                            imageUrl: '/commemorative-nft.png',
                            collection: 'Mek Tycoon Commemorative',
                            artist: 'Mek Tycoon Team',
                            website: 'https://mektycoon.com',
                          },
                        });
                        setState('success');
                      }, 1000);
                    }}
                    disabled={!checklistStatus.minting}
                    className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded hover:bg-purple-500/30 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Complete Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'success':
        return claimedNFT ? (
          <NFTClaimSuccess claim={claimedNFT} onClose={onClose} />
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">NFT Claimed!</h2>
              <p className="text-gray-400">Your NFT has been successfully minted</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-bold"
            >
              Close
            </button>
          </div>
        );

      case 'cancelled':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">⚠</span>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Payment Incomplete
              </h2>
              <p className="text-gray-400 mb-4">
                The payment window was closed before payment could be completed.
              </p>
              <p className="text-gray-500 text-sm mb-4">
                If you completed the payment, please wait a moment and check your wallet. Otherwise, you can try claiming again.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">✗</span>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
              <p className="text-gray-400 mb-4">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold"
            >
              Close
            </button>
          </div>
        );
    }
  };

  // Handle close - also closes payment window if open
  const handleClose = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal container with industrial styling - matching EssenceDistributionLightbox */}
      <div
        className={`relative w-full max-w-md bg-black/20 backdrop-blur-md border-2 ${isDebugMode ? 'border-purple-500/70' : isTestMode ? 'border-red-500/70' : 'border-yellow-500/50'} rounded-lg overflow-hidden shadow-2xl p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Industrial corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/70"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/70"></div>


        {renderContent()}

        {/* Close button - positioned to avoid overlap with title */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-yellow-400 transition-colors z-[10000] w-8 h-8 flex items-center justify-center border border-gray-600 hover:border-yellow-500/50 bg-black/80 backdrop-blur-sm rounded"
          title="Cancel and close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
