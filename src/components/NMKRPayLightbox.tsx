'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface NMKRPayLightboxProps {
  walletAddress: string | null;
  onClose: () => void;
}

type LightboxState = 'address_entry' | 'checking_eligibility' | 'ineligible' | 'already_claimed' | 'creating' | 'reserved' | 'payment' | 'processing' | 'success' | 'error' | 'timeout';

export default function NMKRPayLightbox({ walletAddress, onClose }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LightboxState>(walletAddress ? 'creating' : 'address_entry');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [reservationId, setReservationId] = useState<Id<"commemorativeNFTReservations"> | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');

  // Track if we've already initiated a timeout release to prevent multiple attempts
  const hasInitiatedTimeoutRelease = useRef(false);

  // Get effective wallet address (either from prop or manual entry)
  // MUST be defined BEFORE useQuery calls
  const effectiveWalletAddress = walletAddress || manualAddress;

  // Mutations
  const createReservation = useMutation(api.commemorativeNFTReservations.createReservation);
  const releaseReservation = useMutation(api.commemorativeNFTReservations.releaseReservation);
  const markPaymentWindowOpened = useMutation(api.commemorativeNFTReservations.markPaymentWindowOpened);
  const markPaymentWindowClosed = useMutation(api.commemorativeNFTReservations.markPaymentWindowClosed);
  const completeReservation = useMutation(api.commemorativeNFTReservations.completeReservation);

  // Query active reservation
  const activeReservation = useQuery(
    api.commemorativeNFTReservations.getActiveReservation,
    reservationId && effectiveWalletAddress ? { walletAddress: effectiveWalletAddress } : "skip"
  );

  // Query for payment completion (polls when in processing state)
  const claimStatus = useQuery(
    api.commemorativeNFTClaims.checkClaimed,
    state === 'processing' && effectiveWalletAddress ? { walletAddress: effectiveWalletAddress } : "skip"
  );

  // Query for eligibility checking
  const eligibility = useQuery(
    api.nftEligibility.checkClaimEligibility,
    state === 'checking_eligibility' && effectiveWalletAddress ? { walletAddress: effectiveWalletAddress } : "skip"
  );

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Validate Cardano address format
  const validateCardanoAddress = (address: string): boolean => {
    // Basic validation: Cardano addresses start with 'addr1' (mainnet) or 'addr_test1' (testnet)
    // and are typically 103-108 characters long
    if (!address) return false;

    const isMainnet = address.startsWith('addr1');
    const isTestnet = address.startsWith('addr_test1');
    const isStakeAddress = address.startsWith('stake1') || address.startsWith('stake_test1');

    const validLength = address.length >= 50 && address.length <= 150;

    return (isMainnet || isTestnet || isStakeAddress) && validLength;
  };

  // Handle manual address submission
  const handleAddressSubmit = () => {
    const trimmedAddress = manualAddress.trim();

    if (!validateCardanoAddress(trimmedAddress)) {
      setAddressError('Please enter a valid Cardano stake address (starts with stake1 or stake_test1)');
      return;
    }

    console.log('[🎟️ELIGIBILITY] Checking eligibility for:', trimmedAddress);
    setAddressError('');
    setState('checking_eligibility');
  };

  // Handle eligibility check result
  useEffect(() => {
    if (state !== 'checking_eligibility' || !eligibility) return;

    console.log('[🎟️ELIGIBILITY] Result:', eligibility);

    // Check if already claimed
    if (eligibility.alreadyClaimed) {
      console.log('[🎟️ELIGIBILITY] User already claimed');
      setState('already_claimed');
      return;
    }

    // Check if eligible
    if (eligibility.eligible) {
      console.log('[🎟️ELIGIBILITY] User is eligible, proceeding to reservation');
      setState('creating');
    } else {
      console.log('[🎟️ELIGIBILITY] User is not eligible:', eligibility.reason);
      setState('ineligible');
    }
  }, [state, eligibility]);

  // Create reservation on mount or after address entry
  useEffect(() => {
    if (!mounted || state !== 'creating' || !effectiveWalletAddress) return;

    const createNewReservation = async () => {
      console.log('[🎟️RESERVE] Creating reservation for:', effectiveWalletAddress);

      try {
        const result = await createReservation({ walletAddress: effectiveWalletAddress });

        if (!result.success) {
          console.error('[🎟️RESERVE] Failed to create reservation:', result.error);
          // Use the detailed message if available, otherwise use the error
          setErrorMessage(result.message || result.error || 'Failed to reserve NFT');
          setState('error');
          return;
        }

        console.log('[🎟️RESERVE] Reservation created:', result.reservation);
        setReservationId(result.reservation._id);
        setState('reserved');
      } catch (error) {
        console.error('[🎟️RESERVE] Error creating reservation:', error);
        setErrorMessage('Failed to create reservation');
        setState('error');
      }
    };

    createNewReservation();
  }, [mounted, state, effectiveWalletAddress, createReservation]);

  // Handle payment window opening
  const handleOpenPayment = async () => {
    if (!activeReservation || !reservationId) return;

    console.log('[💰PAY] Opening payment window...');

    try {
      // Mark payment window as opened (pauses timer)
      await markPaymentWindowOpened({ reservationId });

      // Open NMKR payment URL from reservation
      const paymentUrl = activeReservation.nft?.paymentUrl;
      console.log('[💰PAY] Payment URL:', paymentUrl);

      if (!paymentUrl) {
        setErrorMessage('Payment URL not found. Please contact support.');
        setState('error');
        return;
      }

      const popup = window.open(
        paymentUrl,
        'NMKR Payment',
        'width=500,height=800,left=100,top=100'
      );

      if (!popup) {
        // Popup was blocked - stay in reserved state and show helpful message
        // Don't auto-error - user might allow it and try again
        console.log('[💰PAY] Popup blocked - waiting for user to allow and retry');
        setErrorMessage('Popup blocked. Please allow popups for this site, then click "Open Payment Window" again.');
        // DON'T change state - stay in 'reserved' so user can try again
        return;
      }

      // Popup opened successfully
      setPaymentWindow(popup);
      setState('payment');
      setErrorMessage(''); // Clear any previous error messages
    } catch (error) {
      console.error('[💰PAY] Error opening payment:', error);
      setErrorMessage('Failed to open payment window');
      setState('error');
    }
  };

  // Monitor payment window closure
  useEffect(() => {
    if (!paymentWindow || state !== 'payment') return;

    const checkInterval = setInterval(async () => {
      if (paymentWindow.closed && reservationId) {
        clearInterval(checkInterval);
        console.log('[💰PAY] Payment window closed');

        // Mark payment window as closed (resumes timer)
        await markPaymentWindowClosed({ reservationId });

        // Automatically start processing (no "Did you complete payment?" screen)
        setState('processing');
        console.log('[💰PAY] Auto-starting payment verification...');
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [paymentWindow, state, reservationId, markPaymentWindowClosed]);

  // Force re-render every second to update countdown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(tick => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for payment completion
  useEffect(() => {
    if (state !== 'processing' || !claimStatus) return;

    if (claimStatus.hasClaimed && claimStatus.claim) {
      console.log('[✅VERIFY] Payment detected! Claim:', claimStatus.claim);
      setState('success');
    }
  }, [state, claimStatus]);

  // Auto-release when timer expires (instant client-side release)
  useEffect(() => {
    if (!activeReservation || state === 'success' || state === 'error' || state === 'timeout') {
      return;
    }

    // If we've already initiated timeout, don't check again
    if (hasInitiatedTimeoutRelease.current) {
      return;
    }

    // Check every 100ms for more precise timing (instead of every second)
    const intervalId = setInterval(() => {
      const now = Date.now();
      const isExpired = now >= activeReservation.expiresAt;

      console.log('[⏰TIMER] Check', {
        isExpired,
        remainingMs: Math.max(0, activeReservation.expiresAt - now),
        state,
        hasInitiated: hasInitiatedTimeoutRelease.current,
      });

      // INSTANT RELEASE when timer expires
      if (isExpired && !hasInitiatedTimeoutRelease.current) {
        // Only auto-release if in 'reserved' or 'payment' state
        // Don't release if already processing a payment verification
        const shouldAutoRelease = (state === 'reserved' || state === 'payment');

        console.log('[⏰TIMER] Timer expired!', {
          shouldAutoRelease,
          state,
          isPaymentWindowOpen: activeReservation.isPaymentWindowOpen,
        });

        if (shouldAutoRelease && reservationId) {
          console.log('[⏰TIMER] Initiating instant timeout release');

          // Set flag immediately to prevent duplicate attempts
          hasInitiatedTimeoutRelease.current = true;

          // Clear interval immediately
          clearInterval(intervalId);

          // CRITICAL SECURITY FIX: Force close payment window if it's open
          if (paymentWindow && !paymentWindow.closed) {
            console.log('[⏰AUTO-RELEASE] Closing payment window due to timeout');
            paymentWindow.close();
          }

          // Transition to timeout state immediately (optimistic UI)
          setState('timeout');

          // Release reservation in background
          releaseReservation({ reservationId, reason: 'expired' })
            .then(() => {
              console.log('[⏰TIMER] Release successful');
            })
            .catch((err) => {
              console.error('[⏰TIMER] Release failed:', err);
              // Timeout state already shown, backup cron will handle cleanup
            });
        }
      }
    }, 100); // Check every 100ms for precise timing

    return () => {
      clearInterval(intervalId);
    };
  }, [activeReservation, state, reservationId, releaseReservation]);

  // Close payment window if user closes lightbox
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  // Attempt to cancel - show confirmation first
  const attemptCancel = () => {
    // Don't show confirmation if already in success, error, or timeout state
    if (state === 'success' || state === 'error' || state === 'timeout') {
      onClose();
      return;
    }

    // For reserved, payment, or processing states, show confirmation
    if (state === 'reserved' || state === 'payment' || state === 'processing') {
      setShowCancelConfirmation(true);
      return;
    }

    // For creating state, just close
    onClose();
  };

  // Handle confirmed cancellation
  const handleConfirmCancel = async () => {
    setShowCancelConfirmation(false);

    // Close payment window if open
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }

    if (reservationId) {
      console.log('[🎟️RESERVE] User cancelled reservation');
      await releaseReservation({ reservationId, reason: 'cancelled' });
    }
    onClose();
  };

  // Handle cancel of cancellation (go back)
  const handleCancelCancel = () => {
    setShowCancelConfirmation(false);
  };

  // Only render on client-side after mount
  if (!mounted) {
    return null;
  }

  const renderContent = () => {
    switch (state) {
      case 'address_entry':
        return (
          <div className="text-center">
            {/* Header - Match Join Beta */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3">
                Phase 1: Commemorative NFT
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                Please enter the stake address of the wallet you used to create your Phase I corporation.
              </p>
              <p className="text-xs sm:text-sm text-white/40 font-light tracking-wide leading-relaxed italic mt-2">
                Formation must have taken place on or before 11/18/2025.
              </p>
            </div>

            {/* Form - Match Join Beta */}
            <form onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }} className="space-y-4 sm:space-y-6">
              {/* Stake Address Input */}
              <div>
                <label htmlFor="stake-address" className="sr-only">
                  Stake Address
                </label>
                <input
                  id="stake-address"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    setAddressError('');
                  }}
                  placeholder="stake1..."
                  className={`w-full px-4 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all touch-manipulation ${
                    addressError
                      ? 'border-red-500/50 focus:border-red-500/70'
                      : 'border-white/10 focus:border-yellow-500/50'
                  }`}
                  style={{
                    minHeight: '48px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  autoComplete="off"
                  autoFocus
                />
                {addressError && (
                  <p className="mt-3 text-sm sm:text-base text-red-400 font-semibold tracking-wide leading-relaxed">
                    {addressError}
                  </p>
                )}
              </div>

              {/* Submit Button - Match Join Beta */}
              <button
                type="submit"
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                style={{
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent',
                  fontFamily: "'Inter', 'Arial', sans-serif",
                }}
              >
                Continue
              </button>
            </form>
          </div>
        );

      case 'checking_eligibility':
        return (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4 sm:mb-6">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              Checking Eligibility...
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light">
              Verifying your Phase I participation
            </p>
          </div>
        );

      case 'ineligible':
        // Check if they have an active reservation (special case)
        if ((eligibility as any)?.hasActiveReservation) {
          return (
            <div className="text-center py-6 sm:py-8">
              <div className="mb-4 sm:mb-6">
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
                Reservation In Progress
              </h3>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-4">
                You already have an NFT reservation in progress.
              </p>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
                Please complete your payment in the NMKR window. If you cannot find it, please wait 20 minutes and try again.
              </p>
              <button
                onClick={onClose}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          );
        }

        // Regular ineligible case (not in whitelist)
        return (
          <div className="text-center py-6 sm:py-8">
            <div className="mb-4 sm:mb-6">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              Not Eligible
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
              We are sorry, you do not meet the prerequisites. Only Phase 1 beta testers prior to 11/20/2025 are eligible.
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
              No worries - there will be another commemorative NFT at the end of Phase 2!
            </p>
            <button
              onClick={() => {
                // Close this lightbox so user can click Join Beta button on page
                onClose();
              }}
              className="text-yellow-400 hover:text-yellow-300 transition-colors underline font-medium text-sm sm:text-base"
            >
              Join Phase II Beta
            </button>
          </div>
        );

      case 'already_claimed':
        return (
          <div className="text-center py-6 sm:py-8">
            <div className="mb-4 sm:mb-6">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              Already Claimed
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-4">
              Thank you for being part of Phase 1 beta! This corporation has already minted their commemorative token.
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
              Stick around - there will be another at the end of Phase 2. We encourage you to hold onto this P1 token.
            </p>
          </div>
        );

      case 'creating':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Reserving NFT...
              </h2>
              <p className="text-gray-400 mt-2">Finding next available NFT</p>
            </div>
          </div>
        );

      case 'reserved':
        if (!activeReservation) {
          return (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading reservation...</p>
              </div>
            </div>
          );
        }

        // Modern (Sans) variation - NO COUNTDOWN (user will see timer in NMKR window)
        return (
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-4" style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#e0f2fe',
                  letterSpacing: '-0.01em'
                }}>
                  Your NFT Reserved
                </h2>

                <div className="relative w-full max-w-[300px] mx-auto mb-4 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
                  <img
                    src={activeReservation.nft?.imageUrl || "/random-images/Lab%20Rat.jpg"}
                    alt={activeReservation.nft?.name || "NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = '/logo-big.png'; }}
                  />
                </div>

                <div className="mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl backdrop-blur-md">
                  <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.02em' }}>
                    {activeReservation.nft?.name || "NFT"}
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400 }}>
                    You have reserved <span style={{
                      color: '#22d3ee',
                      fontWeight: 600,
                      textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4)'
                    }}>edition number {activeReservation.nftNumber}</span>. Click below to open the payment window and complete your purchase.
                  </p>

                  <div className="mt-3 p-3 rounded-xl backdrop-blur-sm bg-cyan-500/20 border border-cyan-400/50">
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#bae6fd', lineHeight: '1.5' }}>
                      Payment window will remain open. Complete payment when ready.
                      {activeReservation.isPaymentWindowOpen && (
                        <span className="block mt-2 text-blue-300">✓ Payment window is open</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenPayment}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:brightness-110"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)',
                  border: 'none',
                  letterSpacing: '0.02em'
                }}
              >
                Open Payment Window
              </button>

              {errorMessage && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                  <p className="text-sm text-yellow-300">{errorMessage}</p>
                </div>
              )}
            </div>
          );

      case 'payment':
        if (!activeReservation) return null;

        // Calculate remaining time client-side for real-time updates
        const paymentNow = Date.now();
        const paymentRemainingMs = Math.max(0, activeReservation.expiresAt - paymentNow);
        const paymentMinutes = Math.floor(paymentRemainingMs / 60000);
        const paymentSeconds = Math.floor((paymentRemainingMs % 60000) / 1000);

        return (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Complete Your Purchase
              </h2>
              <p className="text-gray-400 mb-6">
                Complete the payment in the NMKR window
              </p>

              {/* Timer Display */}
              <div className="p-4 bg-blue-500/20 border-2 border-blue-500/50 rounded backdrop-blur-sm mb-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Time Remaining
                </div>
                <div className="text-3xl font-bold font-mono text-blue-400">
                  {paymentMinutes}:{paymentSeconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-blue-400 mt-2 uppercase tracking-wide">
                  Timer continues while window is open
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={attemptCancel}
              className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border border-gray-600 hover:border-red-500/50 hover:bg-red-500/10"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#d1d5db',
              }}
            >
              Cancel Transaction
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Checking Payment...
            </h2>
            <p className="text-gray-400 mb-6">
              Waiting for blockchain confirmation
            </p>

            {/* Processing indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="relative">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-yellow-400/90 font-medium">
                Actively checking for payment
              </span>
            </div>

            <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded backdrop-blur-sm mb-8">
              <p className="text-yellow-400 text-xs uppercase tracking-wider font-bold">
                ⚠ This may take 1-2 minutes. Please don't close this window.
              </p>
            </div>

            {/* Cancel Button - Made more prominent */}
            <button
              onClick={attemptCancel}
              className="w-full px-8 py-4 bg-yellow-500/20 border-3 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all font-bold uppercase tracking-wider text-lg shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Cancel Transaction
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                NFT Claimed!
              </h2>
              <p className="text-gray-400">Your NFT has been successfully minted</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Reservation Timed Out
              </h2>
              <p className="text-gray-300 mb-4 max-w-md mx-auto">
                We are sorry, the reservation has timed out. Please try again when you are ready.
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
              <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Error
              </h2>
              <p className="text-gray-400 mb-4">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );
    }
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
        onClick={() => {
          // Disable backdrop close during payment state to prevent accidental cancellation
          if (state === 'payment') {
            return;
          }
          attemptCancel();
        }}
      >
        {/* Backdrop - Match Join Beta */}
        <div
          className="fixed inset-0 bg-black/60"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />

        {/* Modal container - Match Join Beta */}
        <div
          className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} overflow-hidden rounded-2xl border border-white/10 transition-all duration-300`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right - Match Join Beta */}
          <button
            onClick={attemptCancel}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10 touch-manipulation"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8 md:p-10">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showCancelConfirmation && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelCancel();
          }}
        >
          {/* Darker backdrop */}
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" />

          {/* Confirmation modal */}
          <div
            className="relative w-full max-w-md bg-black/40 backdrop-blur-lg border-2 border-red-500/50 rounded-xl overflow-hidden shadow-2xl p-6"
            style={{
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-3" style={{
              fontFamily: 'Inter, sans-serif',
              color: '#fca5a5'
            }}>
              Cancel Transaction?
            </h3>

            <p className="text-center mb-6" style={{
              fontFamily: 'Inter, sans-serif',
              color: '#d1d5db',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              Are you sure you want to cancel this transaction? Doing so will not guarantee the same edition number.
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                  border: 'none'
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border-2 border-red-500/50 hover:bg-red-500/20"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5'
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
