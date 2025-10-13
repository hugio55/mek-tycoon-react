"use client";

import { useEffect } from 'react';
import Image from 'next/image';

interface MintNFTLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  eventName?: string;
  nftPrice?: number;
}

export default function MintNFTLightbox({
  isOpen,
  onClose,
  onConfirm,
  eventId,
  difficulty,
  eventName = "Story Event",
  nftPrice = 50
}: MintNFTLightboxProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get difficulty display info
  const difficultyInfo = {
    easy: { color: 'green', label: 'EASY', suffix: 'E' },
    medium: { color: 'yellow', label: 'MEDIUM', suffix: 'M' },
    hard: { color: 'red', label: 'HARD', suffix: 'H' }
  }[difficulty];

  // Format the image filename (e.g., "E1-E.png")
  const imageFilename = `E${eventId}-${difficultyInfo.suffix}.png`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Lightbox */}
      <div
        className="relative bg-black/95 border-2 border-yellow-500/50 rounded-lg p-8 max-w-2xl mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 50px rgba(250, 182, 23, 0.3)',
        }}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-yellow-400 text-center mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
          Mission Complete!
        </h2>

        <p className="text-gray-400 text-center mb-6 text-sm uppercase tracking-wider">
          Commemorative NFT Available
        </p>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: NFT Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[250px] border-2 border-yellow-500/30 rounded-lg overflow-hidden bg-black/50">
              <Image
                src={`/event-nfts/${imageFilename}`}
                alt={`Event ${eventId} NFT - ${difficultyInfo.label}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">NFT Preview</p>
              <p className="text-sm text-yellow-400 font-semibold">{imageFilename.replace('.png', '')}</p>
            </div>
          </div>

          {/* Right: Information */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Event</p>
              <p className="text-white font-semibold">{eventName}</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Difficulty</p>
              <p className="text-white font-semibold uppercase">{difficultyInfo.label}</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Mint Price</p>
              <p className="text-2xl text-yellow-400 font-bold">{nftPrice} ADA</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-900/50 border border-gray-700 rounded p-4 mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            Congratulations on completing this mission! You've unlocked the ability to mint a commemorative NFT
            that proves your achievement. This NFT will be permanently recorded on the Cardano blockchain
            and will be yours forever.
          </p>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-6">
          <p className="text-blue-400 text-xs font-semibold mb-2 uppercase tracking-wider">
            ℹ️ Important Information
          </p>
          <ul className="text-gray-300 text-sm space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>This NFT is optional - you can mint it now or come back later</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Minting requires a connected Cardano wallet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>One-time purchase - each NFT can only be minted once per player</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold py-3 px-6 rounded hover:bg-yellow-500/30 transition-all uppercase tracking-wider relative overflow-hidden group"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <span className="relative z-10">Proceed to Mint</span>
            <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800/50 border-2 border-gray-600 text-gray-300 font-bold py-3 px-6 rounded hover:bg-gray-700/50 transition-colors uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
