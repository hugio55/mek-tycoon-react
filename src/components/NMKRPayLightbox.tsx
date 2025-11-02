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

type LightboxState = 'preview' | 'payment' | 'processing' | 'success' | 'error';

export default function NMKRPayLightbox({ walletAddress = 'test_wallet', onClose, debugState }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LightboxState>(
    debugState === 'loading' ? 'processing' :
    debugState === 'success' ? 'success' :
    'preview' // Start with preview, not payment
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

  // Payment window closure tracking
  const [paymentWindowClosed, setPaymentWindowClosed] = useState(false);
  const [userChoice, setUserChoice] = useState<'completed' | 'cancelled' | null>(null);
  const [windowClosedAt, setWindowClosedAt] = useState<number>(0);

  // Checklist status tracking
  const [checklistStatus, setChecklistStatus] = useState({
    paymentReceived: false,
    minting: false,
    confirming: false
  });

  // Polling activity tracking
  const [pollingStartTime, setPollingStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Get NMKR configuration
  const NMKR_PROJECT_ID = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID;
  const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || 'mainnet';

  // Determine if we're in test mode (no real wallet connected)
  const isTestMode = walletAddress === 'test_wallet_address_for_nmkr_testing';

  // Check if in debug mode (debug panel triggering specific states)
  const isDebugMode = !!debugState;

  // Mutation for creating mock claim in test mode
  const recordClaim = useMutation(api.commemorativeNFTClaims.recordClaim);

  // Get next NFT number for preview
  const nftNumberData = useQuery(api.commemorativeNFTClaims.getNextNFTNumber);

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
        const closedAt = Date.now();
        console.log('[💰CLAIM] Payment window closed after', windowOpenDuration, 'ms');

        // Mark that window closed and show choice screen
        setPaymentWindowClosed(true);
        setWindowClosedAt(closedAt);
        setState('processing'); // Keep webhook polling active

        // Reset checklist to show waiting state
        setChecklistStatus({
          paymentReceived: false,
          minting: false,
          confirming: false
        });
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
    if (!paymentStatus) {
      console.log('[💰CLAIM] Webhook polling active, waiting for payment confirmation...');
      return;
    }

    console.log('[💰CLAIM] Webhook poll result:', paymentStatus);

    // Check if payment was received via webhook
    if (paymentStatus.hasClaimed && paymentStatus.claim) {
      // Payment completed! Mark all steps as done
      console.log('[💰CLAIM] ✅ Payment confirmed by webhook:', paymentStatus);
      setChecklistStatus({
        paymentReceived: true,
        minting: true,
        confirming: true
      });
    } else {
      console.log('[💰CLAIM] No payment detected yet, continuing to poll...');
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

  // Timeout after 3 minutes of processing (skip in debug mode)
  // If payment window closed, timeout faster (2 minutes) since most payments resolve quickly
  useEffect(() => {
    if (state !== 'processing' || isDebugMode) return;

    const timeoutDuration = checklistStatus.paymentReceived
      ? 3 * 60 * 1000  // 3 minutes if payment confirmed
      : 2 * 60 * 1000; // 2 minutes if waiting for payment after window close

    const timeout = setTimeout(() => {
      if (!checklistStatus.paymentReceived) {
        setErrorMessage('No payment detected. If you completed the payment, please check your wallet in a few minutes. Otherwise, try claiming again.');
      } else {
        setErrorMessage('Transaction is taking longer than expected. Please check your wallet for the NFT.');
      }
      setState('error');
    }, timeoutDuration);

    return () => clearTimeout(timeout);
  }, [state, isDebugMode, checklistStatus.paymentReceived]);

  // Auto-cancel timeout: After 30 seconds with no user choice, assume cancelled
  useEffect(() => {
    if (!paymentWindowClosed || userChoice !== null || isDebugMode) return;

    const autoCancelTimeout = setTimeout(() => {
      console.log('[💰CLAIM] 30 seconds passed with no user choice, auto-cancelling');
      setUserChoice('cancelled');
      setErrorMessage('Payment window was closed. No payment detected.');
      setState('error');
    }, 30 * 1000); // 30 seconds

    return () => clearTimeout(autoCancelTimeout);
  }, [paymentWindowClosed, userChoice, isDebugMode]);

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

  // Handle user choice when payment window closes
  const handleUserChoice = (choice: 'completed' | 'cancelled') => {
    setUserChoice(choice);

    if (choice === 'cancelled') {
      console.log('[💰CLAIM] User indicated they cancelled payment');
      setErrorMessage('Payment was cancelled. You can try claiming again.');
      setState('error');
    } else {
      console.log('[💰CLAIM] User indicated they completed payment, continuing to poll for webhook');
      // Start polling timer when user confirms payment
      setPollingStartTime(Date.now());
      // Keep processing state, webhook polling will continue
    }
  };

  // Update elapsed time every second while polling
  useEffect(() => {
    if (state !== 'processing' || pollingStartTime === 0) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pollingStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [state, pollingStartTime]);

  // Only render on client-side after mount
  if (!mounted) {
    return null;
  }

  const renderContent = () => {
    switch (state) {
      case 'preview':
        // PREVIEW STAGE: Show NFT image and details before payment
        const nftNumber = nftNumberData?.nextNumber || 1;
        const nftTitle = `Lab Rat #${nftNumber}`;

        return (
          <div className="text-center">
            {/* NFT Preview Section */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-yellow-400 mb-6 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Your NFT
              </h2>

              {/* Large NFT Image */}
              <div className="relative w-full max-w-[500px] mx-auto mb-6 border-4 border-yellow-500/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
                {/* Industrial corner accents on image */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-500/70 z-10"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-500/70 z-10"></div>

                <img
                  src="/lab-rat-nft.png"
                  alt={nftTitle}
                  className="w-full h-auto"
                  onError={(e) => {
                    // Fallback if image doesn't exist yet
                    e.currentTarget.src = '/logo-big.png';
                  }}
                />

                {/* Overlay with glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* NFT Title */}
              <div className="mb-6 p-4 bg-black/60 border-2 border-yellow-500/30 rounded backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {nftTitle}
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  Commemorative NFT Collection
                </p>
                {nftNumberData && (
                  <p className="text-gray-500 text-xs mt-1">
                    Total Minted: {nftNumberData.totalMinted}
                  </p>
                )}
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <button
              onClick={() => setState('payment')}
              className="w-full px-8 py-4 bg-yellow-500/20 border-3 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all font-bold uppercase tracking-wider text-lg shadow-lg hover:shadow-yellow-500/50"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              💰 Pay via NMKR
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Click to proceed to secure payment via NMKR
            </p>
          </div>
        );

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
        // Show choice screen if window closed but user hasn't decided yet
        if (paymentWindowClosed && userChoice === null) {
          const secondsElapsed = Math.floor((Date.now() - windowClosedAt) / 1000);
          const secondsRemaining = Math.max(0, 30 - secondsElapsed);

          return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Payment Window Closed
                </h2>
                <p className="text-gray-400 mb-6">
                  Did you complete the payment?
                </p>
              </div>

              {/* Choice Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleUserChoice('completed')}
                  className="w-full px-6 py-4 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 text-green-400 hover:text-green-300 rounded-lg transition-all font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  ✓ Yes, I Completed Payment
                </button>
                <button
                  onClick={() => handleUserChoice('cancelled')}
                  className="w-full px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-red-400 hover:text-red-300 rounded-lg transition-all font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  ✗ No, I Cancelled
                </button>
              </div>

              {/* Auto-cancel countdown */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                <p className="text-yellow-400">
                  Auto-cancelling in {secondsRemaining} seconds...
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Choose an option above to continue
                </p>
              </div>
            </div>
          );
        }

        // Normal processing UI with checklist
        return (
          <div className="text-center">
            {/* Header Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {checklistStatus.paymentReceived ? 'Processing Your NFT' : 'Waiting for Payment'}
              </h2>
              <p className="text-gray-400 mb-4">
                {checklistStatus.paymentReceived
                  ? 'Waiting for blockchain confirmation...'
                  : 'Checking for payment confirmation...'}
              </p>

              {/* Polling Activity Indicator - Only show when actively polling without payment */}
              {!checklistStatus.paymentReceived && pollingStartTime > 0 && (
                <div className="mb-4 flex items-center justify-center gap-2 text-sm">
                  {/* Pulsing indicator dot */}
                  <div className="relative">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>

                  {/* Status message */}
                  <span className="text-yellow-400/90 font-medium">
                    Actively polling for payment
                  </span>

                  {/* Elapsed time */}
                  <span className="text-gray-500 font-mono">
                    ({elapsedSeconds}s)
                  </span>
                </div>
              )}

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
                {checklistStatus.paymentReceived
                  ? '⚠ This may take 1-2 minutes. Please don\'t close this window.'
                  : pollingStartTime > 0
                    ? 'ℹ System is actively checking for payment'
                    : 'ℹ Payment window closed. Checking if payment was completed...'}
              </p>
            </div>

            {/* Payment timing info - Always show when polling */}
            {!checklistStatus.paymentReceived && pollingStartTime > 0 && (
              <div className="mt-3 text-center">
                <p className="text-gray-400 text-xs">
                  Payments typically appear within 30-60 seconds after completion.
                </p>
              </div>
            )}

            {/* Cancel Button - Allow manual cancellation */}
            {!checklistStatus.paymentReceived && pollingStartTime > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    console.log('[💰CLAIM] User manually cancelled payment polling');
                    setErrorMessage('Payment check cancelled. You can try claiming again.');
                    setState('error');
                  }}
                  className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 text-red-400 hover:text-red-300 rounded transition-all font-bold uppercase tracking-wider text-sm"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            )}

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

      {/* Modal container with industrial styling - larger for preview */}
      <div
        className={`relative w-full ${state === 'preview' ? 'max-w-2xl' : 'max-w-md'} bg-black/20 backdrop-blur-md border-2 ${isDebugMode ? 'border-purple-500/70' : isTestMode ? 'border-red-500/70' : 'border-yellow-500/50'} rounded-lg overflow-hidden shadow-2xl p-8 transition-all duration-300`}
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
