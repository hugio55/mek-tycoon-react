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

  // Load lightbox variation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lightbox_variation');
    if (saved === 'industrial' || saved === 'elegant' || saved === 'modern') {
      setLightboxVariation(saved);
    }
  }, []);

  // Save lightbox variation to localStorage when changed
  const handleVariationChange = (variation: LightboxVariation) => {
    setLightboxVariation(variation);
    localStorage.setItem('lightbox_variation', variation);
  };

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

  // Render variation selector (debug dropdown on right side)
  const renderVariationSelector = () => (
    <div className="fixed top-32 right-4 z-[99999]">
      <button
        onClick={() => setShowVariationPicker(!showVariationPicker)}
        className="bg-black/80 border border-gray-600 text-gray-300 px-3 py-2 rounded text-xs hover:bg-black/90 transition-colors"
      >
        Lightbox Style ▼
      </button>
      {showVariationPicker && (
        <div className="absolute top-full right-0 mt-1 bg-black/95 border border-gray-600 rounded shadow-xl min-w-[180px]">
          <button
            onClick={() => handleVariationChange("industrial")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-yellow-500/20 transition-colors ${
              lightboxVariation === "industrial" ? "bg-yellow-500/30 text-yellow-300" : "text-gray-300"
            }`}
          >
            Industrial (Orbitron)
          </button>
          <button
            onClick={() => handleVariationChange("elegant")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-amber-500/20 transition-colors ${
              lightboxVariation === "elegant" ? "bg-amber-500/30 text-amber-300" : "text-gray-300"
            }`}
          >
            Elegant (Serif)
          </button>
          <button
            onClick={() => handleVariationChange("modern")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-blue-500/20 transition-colors ${
              lightboxVariation === "modern" ? "bg-blue-500/30 text-blue-300" : "text-gray-300"
            }`}
          >
            Modern (Sans)
          </button>
        </div>
      )}
    </div>
  );

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

        // VARIATION 1: Industrial (Current)
        if (lightboxVariation === "industrial") {
          return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Your NFT Reserved
                </h2>

                <div className="relative w-full max-w-[400px] mx-auto mb-6 border-2 border-yellow-500/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
                  <img
                    src={activeReservation.nft?.imageUrl || "/random-images/Lab%20Rat.jpg"}
                    alt={activeReservation.nft?.name || "NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = '/logo-big.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                </div>

                <div className="mb-6 p-4 bg-black/60 border-2 border-yellow-500/30 rounded backdrop-blur-sm">
                  <h3 className="text-4xl font-bold text-yellow-400 uppercase tracking-wider mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {activeReservation.nft?.name || "NFT"}
                  </h3>
                  <p className="text-green-400 text-base mb-4 font-medium">
                    You are currently reserving edition number {activeReservation.nftNumber}. This will last for 10 minutes, and then that edition will be released.
                  </p>

                  <div className={`mt-4 p-3 rounded backdrop-blur-sm ${
                    isInGracePeriod ? 'bg-red-500/20 border-2 border-red-500' :
                    activeReservation.isPaymentWindowOpen ? 'bg-blue-500/20 border-2 border-blue-500/50' :
                    'bg-gray-500/20 border-2 border-gray-500/50'
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
                      <div className="text-xs text-blue-400 mt-2 uppercase tracking-wide">Payment window open - timer continues</div>
                    )}
                    {isInGracePeriod && (
                      <div className="text-xs text-red-400 mt-2 uppercase tracking-wide">⚠️ Final chance to complete payment</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenPayment}
                className="w-full px-8 py-4 bg-yellow-500/20 border-3 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all font-bold uppercase tracking-wider text-lg shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Open Payment Window
              </button>
            </div>
          );
        }

        // VARIATION 2: Elegant (Serif)
        if (lightboxVariation === "elegant") {
          return (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-3xl mb-6" style={{ fontFamily: 'Cinzel, serif', color: '#fef3c7', letterSpacing: '0.1em', fontWeight: 700 }}>
                  Your NFT Reserved
                </h2>

                <div className="relative w-full max-w-[400px] mx-auto mb-6 border-2 border-amber-500/60 rounded-md overflow-hidden bg-gradient-to-b from-amber-900/20 to-black/50 backdrop-blur-sm shadow-xl shadow-amber-500/30">
                  <img
                    src={activeReservation.nft?.imageUrl || "/random-images/Lab%20Rat.jpg"}
                    alt={activeReservation.nft?.name || "NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = '/logo-big.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-transparent pointer-events-none"></div>
                </div>

                <div className="mb-6 p-5 bg-gradient-to-br from-amber-900/20 to-black/40 border border-amber-500/40 rounded-md backdrop-blur-sm">
                  <h3 className="text-4xl mb-4" style={{ fontFamily: 'Cinzel, serif', color: '#fde68a', letterSpacing: '0.05em', fontWeight: 700 }}>
                    {activeReservation.nft?.name || "NFT"}
                  </h3>
                  <p style={{ fontFamily: 'Lora, serif', color: '#d4af37', fontSize: '1rem', lineHeight: '1.7', fontStyle: 'italic' }}>
                    You are currently reserving edition number {activeReservation.nftNumber}. This will last for 10 minutes, and then that edition will be released.
                  </p>

                  <div className={`mt-5 p-4 rounded-md ${
                    isInGracePeriod ? 'bg-red-900/30 border-2 border-red-500' :
                    activeReservation.isPaymentWindowOpen ? 'bg-blue-900/30 border-2 border-blue-500/60' :
                    'bg-amber-900/20 border-2 border-amber-500/50'
                  }`}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: '0.75rem', color: '#d4d4d4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {isInGracePeriod ? 'Grace Period' : 'Time Remaining'}
                    </div>
                    <div className={`font-mono text-4xl font-bold ${
                      isInGracePeriod ? 'text-red-400 animate-pulse' : activeReservation.isPaymentWindowOpen ? 'text-blue-300' : 'text-amber-300'
                    }`}>
                      {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
                    </div>
                    {activeReservation.isPaymentWindowOpen && !isInGracePeriod && (
                      <div style={{ fontFamily: 'Lora, serif', fontSize: '0.75rem', color: '#93c5fd', marginTop: '0.75rem' }}>Payment window open - timer continues</div>
                    )}
                    {isInGracePeriod && (
                      <div style={{ fontFamily: 'Lora, serif', fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.75rem' }}>⚠️ Final chance to complete payment</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenPayment}
                className="w-full py-4 px-8 rounded-md font-semibold text-lg transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#1a1a1a',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
                  border: '2px solid #fbbf24',
                  letterSpacing: '0.12em'
                }}
              >
                OPEN PAYMENT WINDOW
              </button>
            </div>
          );
        }

        // VARIATION 3: Modern (Sans)
        if (lightboxVariation === "modern") {
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
        }

        return null;

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
              onClick={handleCancel}
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
      {renderVariationSelector()}

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
        onClick={handleCancel}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal container */}
        <div
          className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} bg-black/20 backdrop-blur-md border-2 rounded-lg overflow-hidden shadow-2xl p-8 transition-all duration-300`}
          style={{
            borderColor: lightboxVariation === "modern" ? 'rgba(34, 211, 238, 0.5)' :
                         lightboxVariation === "elegant" ? 'rgba(245, 158, 11, 0.5)' :
                         'rgba(234, 179, 8, 0.5)',
            boxShadow: lightboxVariation === "modern" ? '0 0 30px rgba(6, 182, 212, 0.3)' :
                       lightboxVariation === "elegant" ? '0 0 30px rgba(251, 191, 36, 0.3)' :
                       '0 0 30px rgba(234, 179, 8, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Industrial corner accents */}
          <div
            className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2"
            style={{
              borderColor: lightboxVariation === "modern" ? 'rgba(34, 211, 238, 0.7)' :
                           lightboxVariation === "elegant" ? 'rgba(245, 158, 11, 0.7)' :
                           'rgba(234, 179, 8, 0.7)'
            }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2"
            style={{
              borderColor: lightboxVariation === "modern" ? 'rgba(34, 211, 238, 0.7)' :
                           lightboxVariation === "elegant" ? 'rgba(245, 158, 11, 0.7)' :
                           'rgba(234, 179, 8, 0.7)'
            }}
          ></div>

          {renderContent()}

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-2 right-2 text-gray-500 transition-colors z-[10000] w-8 h-8 flex items-center justify-center border border-gray-600 bg-black/80 backdrop-blur-sm rounded"
            style={{
              color: '#9ca3af',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = lightboxVariation === "modern" ? '#22d3ee' :
                                             lightboxVariation === "elegant" ? '#f59e0b' :
                                             '#eab308';
              e.currentTarget.style.borderColor = lightboxVariation === "modern" ? 'rgba(34, 211, 238, 0.5)' :
                                                   lightboxVariation === "elegant" ? 'rgba(245, 158, 11, 0.5)' :
                                                   'rgba(234, 179, 8, 0.5)';
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
    </>
  );

  return createPortal(modalContent, document.body);
}
