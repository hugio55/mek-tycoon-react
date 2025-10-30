'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import NFTClaimSuccess from './NFTClaimSuccess';

interface NMKRPayLightboxProps {
  walletAddress: string;
  onClose: () => void;
}

type LightboxState = 'payment' | 'processing' | 'success' | 'error';

export default function NMKRPayLightbox({ walletAddress, onClose }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LightboxState>('payment');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [claimedNFT, setClaimedNFT] = useState<any>(null);

  // Get NMKR configuration
  const NMKR_PROJECT_ID = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID;
  const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || 'mainnet';

  // Determine if we're in test mode (no real wallet connected)
  const isTestMode = walletAddress === 'test_wallet_address_for_nmkr_testing';

  // Poll for recent purchases
  // In test mode: check for ANY recent claim (within last 5 minutes)
  // In production: check for specific wallet address
  const recentClaim = useQuery(
    isTestMode
      ? api.commemorativeNFTClaims.checkRecentClaim
      : api.commemorativeNFTClaims.checkClaimed,
    state === 'processing'
      ? (isTestMode ? { minutesAgo: 5 } : { walletAddress })
      : "skip"
  );

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Open NMKR payment window on mount
  useEffect(() => {
    if (!mounted || state !== 'payment') return;

    // Use preprod URL for testnet, mainnet URL for production
    const baseUrl = NMKR_NETWORK === 'mainnet'
      ? 'https://pay.nmkr.io'
      : 'https://pay.preprod.nmkr.io';
    const nmkrUrl = `${baseUrl}/?p=${NMKR_PROJECT_ID}&c=1`;

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

    // Monitor popup closure
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);
        // Payment window closed - switch to processing state
        setState('processing');
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
  }, [mounted, state, NMKR_PROJECT_ID]);

  // Check for claim completion
  useEffect(() => {
    if (state === 'processing' && recentClaim?.hasClaimed) {
      setClaimedNFT(recentClaim.claim);
      setState('success');
    }
  }, [state, recentClaim]);

  // Timeout after 5 minutes of processing
  useEffect(() => {
    if (state !== 'processing') return;

    const timeout = setTimeout(() => {
      setErrorMessage('Transaction is taking longer than expected. Please check your wallet for the NFT.');
      setState('error');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timeout);
  }, [state]);

  // Close payment window if user closes lightbox
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  // Only render on client-side after mount
  if (!mounted) return null;

  const renderContent = () => {
    switch (state) {
      case 'payment':
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
            <div className="mb-6">
              {/* Loading Bar Video with Fallback */}
              <div className="mb-4 flex justify-center">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full max-w-md h-auto"
                  onError={(e) => {
                    // Hide video and show spinner fallback if video fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'block';
                  }}
                >
                  <source src="/random-images/Loading Bar Full 10.120.webm" type="video/webm" />
                  <source src="/random-images/Loading Bar h264.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Fallback spinner - hidden by default, shows if video fails */}
                <div className="animate-spin h-16 w-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" style={{ display: 'none' }}></div>
              </div>

              <h2 className="text-2xl font-bold text-cyan-400 mb-2">Processing Your NFT</h2>
              <p className="text-gray-400 mb-4">
                Waiting for blockchain confirmation...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Payment received</p>
                <p className="animate-pulse">⏳ Minting NFT on blockchain...</p>
                <p className="text-gray-600">⏳ Confirming transaction</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-yellow-400 text-xs">
                This may take 1-2 minutes. Please don't close this window.
              </p>
            </div>
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

      {/* Modal container with industrial styling */}
      <div
        className="relative w-full max-w-md bg-black/95 border-4 border-yellow-500/50 overflow-hidden shadow-2xl p-8"
        style={{ clipPath: 'polygon(0% 0%, 98% 0%, 100% 2%, 100% 100%, 2% 100%, 0% 98%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Industrial corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/70"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/70"></div>

        {renderContent()}

        {/* Close button - always visible */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-yellow-400 transition-colors z-10 w-8 h-8 flex items-center justify-center border border-gray-600 hover:border-yellow-500/50 bg-black/50"
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
