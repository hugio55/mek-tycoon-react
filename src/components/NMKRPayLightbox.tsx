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
          setErrorMessage(result.error || 'Failed to reserve NFT');
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
      const paymentUrl = activeReservation.nft.paymentUrl;
      console.log('[💰PAY] Payment URL:', paymentUrl);

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

  // Check if reservation expired (including grace period)
  useEffect(() => {
    if (!activeReservation || state === 'success') return;

    const now = Date.now();
    const GRACE_PERIOD = 30 * 1000; // 30 seconds

    // If expired beyond grace period, auto-release
    if (activeReservation.isExpired && now > activeReservation.expiresAt + GRACE_PERIOD) {
      console.log('[🎟️RESERVE] Reservation expired beyond grace period, releasing...');
      if (reservationId) {
        releaseReservation({ reservationId, reason: 'expired' });
      }
      setErrorMessage('Reservation expired. Please try again.');
      setState('error');
    }
  }, [activeReservation, state, reservationId, releaseReservation]);

  // Close payment window if user closes lightbox
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  // Handle manual cancellation
  const handleCancel = async () => {
    if (reservationId) {
      console.log('[🎟️RESERVE] User cancelled reservation');
      await releaseReservation({ reservationId, reason: 'cancelled' });
    }
    onClose();
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

        const remainingMs = activeReservation.remainingMs || 0;
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
        const isInGracePeriod = activeReservation.isExpired && remainingMs > 0;

        return (
          <div className="text-center">
            {/* NFT Preview */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Your NFT Reserved
              </h2>

              {/* NFT Image */}
              <div className="relative w-full max-w-[400px] mx-auto mb-6 border-2 border-yellow-500/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
                <img
                  src="/random-images/Lab%20Rat.jpg"
                  alt={activeReservation.nft.name}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = '/logo-big.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* NFT Details with Timer */}
              <div className="mb-6 p-4 bg-black/60 border-2 border-yellow-500/30 rounded backdrop-blur-sm">
                <h3 className="text-4xl font-bold text-yellow-400 uppercase tracking-wider mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {activeReservation.nft.name}
                </h3>
                <p className="text-gray-400 text-base mb-4">
                  You are currently reserving edition number {activeReservation.nftNumber}. This will last for 10 minutes, and then that edition will be released.
                </p>

                {/* Countdown Timer */}
                <div className={`mt-4 p-3 rounded backdrop-blur-sm ${
                  isInGracePeriod
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : activeReservation.isPaymentWindowOpen
                      ? 'bg-blue-500/20 border-2 border-blue-500/50'
                      : 'bg-gray-500/20 border-2 border-gray-500/50'
                }`}>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    {isInGracePeriod ? 'Grace Period' : 'Time Remaining'}
                  </div>
                  <div className={`text-3xl font-bold font-mono ${
                    isInGracePeriod ? 'text-red-400 animate-pulse' : activeReservation.isPaymentWindowOpen ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
                  </div>
                  {activeReservation.isPaymentWindowOpen && !isInGracePeriod && (
                    <div className="text-xs text-blue-400 mt-2 uppercase tracking-wide">
                      Payment window open - timer continues
                    </div>
                  )}
                  {isInGracePeriod && (
                    <div className="text-xs text-red-400 mt-2 uppercase tracking-wide">
                      ⚠️ Final chance to complete payment
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Open Payment Button */}
            <button
              onClick={handleOpenPayment}
              className="w-full px-8 py-4 bg-yellow-500/20 border-3 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all font-bold uppercase tracking-wider text-lg shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Open Payment Window
            </button>
          </div>
        );

      case 'payment':
        if (!activeReservation) return null;

        const paymentRemainingMs = activeReservation.remainingMs || 0;
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
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
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

              <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded backdrop-blur-sm mb-6">
                <p className="text-yellow-400 text-xs uppercase tracking-wider font-bold">
                  ⚠ This may take 1-2 minutes. Please don't close this window.
                </p>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-500/20 border-2 border-gray-500 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors font-bold uppercase tracking-wider"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Cancel Transaction
              </button>
            </div>
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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
      onClick={handleCancel}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} bg-black/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl p-8 transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Industrial corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/70"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/70"></div>

        {renderContent()}

        {/* Close button */}
        <button
          onClick={handleCancel}
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
