'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import NMKRPayLightbox from './NMKRPayLightbox';
import HolographicButton from './ui/IndustrialButtons/HolographicButton';

interface NMKRClaimButtonProps {
  walletAddress: string | null;
}

export default function NMKRClaimButton({ walletAddress }: NMKRClaimButtonProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  // For testing: use placeholder address if no wallet connected
  const effectiveWalletAddress = walletAddress || 'test_wallet_address_for_nmkr_testing';

  // Check if user has already claimed (skip if using test wallet)
  const claimStatus = useQuery(
    api.commemorativeNFTClaims.checkClaimed,
    walletAddress ? { walletAddress } : "skip"
  );

  // If already claimed, show claimed button (greyed out)
  if (walletAddress && claimStatus?.hasClaimed) {
    return (
      <div className="max-w-[600px] mx-auto mb-6 px-4 sm:px-0">
        <div className="bg-black/40 border-2 border-gray-600 rounded-lg p-6 text-center">
          <div className="mb-4">
            <div className="h-12 w-12 bg-green-500/20 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-1">NFT Claimed</h3>
            <p className="text-sm text-gray-500">
              You already own this commemorative NFT
            </p>
          </div>
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-700/50 border-2 border-gray-600 text-gray-500 rounded-lg cursor-not-allowed font-bold text-lg"
          >
            Claimed ✓
          </button>
        </div>
      </div>
    );
  }

  // Show claim button if eligible
  return (
    <>
      <div className="max-w-[600px] mx-auto mb-6 px-4 sm:px-0">
        <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/50 rounded-lg p-6 text-center relative overflow-hidden">
          {/* Holographic effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse" />

          <div className="relative z-10">
            <div className="mb-4">
              <div className="text-4xl mb-2">🏅</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-1">
                Limited Edition NFT
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                Celebrate your early participation in Mek Tycoon
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Price: </span>
                  <span className="text-cyan-400 font-bold">10 tADA</span>
                </div>
                <div className="h-4 w-px bg-gray-600"></div>
                <div>
                  <span className="text-gray-400">Limited Supply</span>
                </div>
              </div>
            </div>

            <HolographicButton
              onClick={() => setShowLightbox(true)}
              className="w-full text-lg py-4"
            >
              CLAIM YOUR NFT
            </HolographicButton>

            <p className="text-xs text-gray-500 mt-3">
              Powered by NMKR • One per wallet
            </p>
          </div>
        </div>
      </div>

      {/* NMKR Payment Lightbox */}
      {showLightbox && (
        <NMKRPayLightbox
          walletAddress={effectiveWalletAddress}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
}
