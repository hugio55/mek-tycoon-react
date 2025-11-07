'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface NMKRPayLightboxProps {
  walletAddress: string;
  onClose: () => void;
}

type LightboxState = 'creating' | 'reserved' | 'payment' | 'processing' | 'success' | 'error';

export default function NMKRPayLightbox({ walletAddress, onClose }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LightboxState>('creating');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [reservationId, setReservationId] = useState<Id<"commemorativeNFTReservations"> | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // Mutations
  const createReservation = useMutation(api.commemorativeNFTReservations.createReservation);
  const releaseReservation = useMutation(api.commemorativeNFTReservations.releaseReservation);
  const markPaymentWindowOpened = useMutation(api.commemorativeNFTReservations.markPaymentWindowOpened);
  const markPaymentWindowClosed = useMutation(api.commemorativeNFTReservations.markPaymentWindowClosed);
  const completeReservation = useMutation(api.commemorativeNFTReservations.completeReservation);

  // Query active reservation
  const activeReservation = useQuery(
    api.commemorativeNFTReservations.getActiveReservation,
    reservationId ? { walletAddress } : "skip"
  );

  // Query for payment completion (polls when in processing state)
  const claimStatus = useQuery(
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

  // Create reservation on mount
  useEffect(() => {
    if (!mounted || state !== 'creating') return;

    const createNewReservation = async () => {
      console.log('[🎟️RESERVE] Creating reservation for:', walletAddress);

      try {
        const result = await createReservation({ walletAddress });

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
  }, [mounted, state, walletAddress, createReservation]);

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
        return;
      }

      const popup = window.open(
        paymentUrl,
        'NMKR Payment',
        'width=500,height=800,left=100,top=100'
      );

      if (!popup) {
        setErrorMessage('Failed to open payment window. Please allow popups for this site.');
        setState('error');
        return;
      }

      setPaymentWindow(popup);
      setState('payment');
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

  // Auto-release when timer hits exactly 0:00 (instant client-side release)
  useEffect(() => {
    if (!activeReservation || state === 'success' || state === 'error') return;

    const now = Date.now();
    const remainingMs = Math.max(0, activeReservation.expiresAt - now);

    // INSTANT RELEASE when timer hits 0:00
    if (remainingMs === 0 && !activeReservation.isExpired) {
      // Only auto-release if:
      // 1. NOT in payment window (user hasn't opened payment yet)
      // 2. NOT processing payment (user closed window and we're checking)
      // 3. Payment window is NOT currently open
      const shouldAutoRelease =
        state === 'reserved' &&
        !activeReservation.isPaymentWindowOpen &&
        (!paymentWindow || paymentWindow.closed);

      if (shouldAutoRelease && reservationId) {
        console.log('[⏰TIMER] Timer reached 0:00 - instant client-side release');
        releaseReservation({ reservationId, reason: 'expired' })
          .then(() => {
            setErrorMessage('Reservation timer expired. Please try again.');
            setState('error');
          })
          .catch((err) => {
            console.error('[⏰TIMER] Failed to release reservation:', err);
            // Still show error state even if mutation fails (backup cron will handle it)
            setErrorMessage('Reservation timer expired. Please try again.');
            setState('error');
          });
      }
    }

    // BACKUP: Cleanup expired reservations beyond grace period (if client-side release failed)
    const GRACE_PERIOD = 30 * 1000; // 30 seconds
    if (activeReservation.isExpired && now > activeReservation.expiresAt + GRACE_PERIOD) {
      // Only trigger if we somehow missed the instant release above
      if (state === 'reserved' && reservationId) {
        console.log('[🎟️RESERVE] Backup cleanup: Reservation expired beyond grace period');
        releaseReservation({ reservationId, reason: 'expired' });
        setErrorMessage('Reservation expired. Please try again.');
        setState('error');
      }
    }
  }, [activeReservation, state, reservationId, releaseReservation, paymentWindow]);

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
    // Don't show confirmation if already in success or error state
    if (state === 'success' || state === 'error') {
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

        // Calculate remaining time client-side for real-time updates
        const now = Date.now();
        const remainingMs = Math.max(0, activeReservation.expiresAt - now);
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
        const GRACE_PERIOD = 30 * 1000;
        const isInGracePeriod = remainingMs === 0 && (now - activeReservation.expiresAt) < GRACE_PERIOD;

        // Modern (Sans) variation
        return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-6" style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#e0f2fe',
                  letterSpacing: '-0.01em'
                }}>
                  Your NFT Reserved
                </h2>

                <div className="relative w-full max-w-[400px] mx-auto mb-6 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
                  <img
                    src={activeReservation.nft?.imageUrl || "/random-images/Lab%20Rat.jpg"}
                    alt={activeReservation.nft?.name || "NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = '/logo-big.png'; }}
                  />
                </div>

                <div className="mb-6 p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl backdrop-blur-md">
                  <h3 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.02em' }}>
                    {activeReservation.nft?.name || "NFT"}
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: 400 }}>
                    You are currently reserving edition number {activeReservation.nftNumber}. This will last for 10 minutes, and then that edition will be released.
                  </p>

                  <div className={`mt-5 p-4 rounded-xl backdrop-blur-sm ${
                    isInGracePeriod ? 'bg-red-500/20 border border-red-400/50' :
                    activeReservation.isPaymentWindowOpen ? 'bg-blue-500/20 border border-blue-400/50' :
                    'bg-cyan-500/20 border border-cyan-400/50'
                  }`}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#d4d4d8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {isInGracePeriod ? 'Grace Period' : 'Time Remaining'}
                    </div>
                    <div className={`font-mono text-4xl font-bold ${
                      isInGracePeriod ? 'text-red-400 animate-pulse' : activeReservation.isPaymentWindowOpen ? 'text-blue-300' : 'text-cyan-300'
                    }`}>
                      {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
                    </div>
                    {activeReservation.isPaymentWindowOpen && !isInGracePeriod && (
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#93c5fd', marginTop: '0.75rem' }}>Payment window open - timer continues</div>
                    )}
                    {isInGracePeriod && (
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.75rem' }}>⚠️ Final chance to complete payment</div>
                    )}
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
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal container */}
        <div
          className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} bg-black/20 backdrop-blur-md border-2 rounded-lg overflow-hidden shadow-2xl p-8 transition-all duration-300`}
          style={{
            borderColor: 'rgba(34, 211, 238, 0.5)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner accents */}
          <div
            className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2"
            style={{ borderColor: 'rgba(34, 211, 238, 0.7)' }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2"
            style={{ borderColor: 'rgba(34, 211, 238, 0.7)' }}
          ></div>

          {renderContent()}

          {/* Close button */}
          <button
            onClick={attemptCancel}
            className="absolute top-2 right-2 text-gray-500 transition-colors z-[10000] w-8 h-8 flex items-center justify-center border border-gray-600 bg-black/80 backdrop-blur-sm rounded"
            style={{
              color: '#9ca3af',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#22d3ee';
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
            }}
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
