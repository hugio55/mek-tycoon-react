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
  nftTitle?: string; // e.g., "Rust Protocol: Goose Neck"
  remainingSupply?: number;
  totalSupply?: number;
  chapterNumber?: number;
  eventNumber?: number;
}

export default function MintNFTLightbox({
  isOpen,
  onClose,
  onConfirm,
  eventId,
  difficulty,
  eventName = "Story Event",
  nftPrice = 50,
  nftTitle = "Event NFT",
  remainingSupply = 100,
  totalSupply = 100,
  chapterNumber = 1,
  eventNumber = 1
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
      {/* Backdrop - minimal blur */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Lightbox - Style J from UI Showcase */}
      <div
        className="relative rounded-lg overflow-hidden p-8 max-w-2xl mx-4 shadow-2xl border border-yellow-500/50"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255, 255, 255, 0.02) 0%,
              rgba(255, 255, 255, 0.05) 50%,
              rgba(255, 255, 255, 0.02) 100%)`,
          backdropFilter: 'blur(6px)',
          boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03), 0 0 50px rgba(250, 182, 23, 0.3)',
        }}
      >
        {/* Smudge effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
              radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* Dirty texture pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
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
            <div className="relative w-full aspect-square max-w-[300px] border-2 border-yellow-500/30 rounded-lg overflow-hidden bg-black/50">
              <Image
                src={`/event-nfts/${imageFilename}`}
                alt={`Event ${eventId} NFT - ${difficultyInfo.label}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">NFT Preview</p>
              <p className="text-base text-yellow-400 font-bold">{nftTitle}</p>
            </div>
          </div>

          {/* Right: Information */}
          <div className="flex flex-col justify-center space-y-3">
            <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Event</p>
              <p className="text-white font-semibold">Chapter {chapterNumber} Event {eventNumber}</p>
              <p className="text-white font-semibold text-sm mt-1">"{eventName}"</p>
            </div>

            <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Difficulty</p>
              <p className="text-white font-semibold uppercase">{difficultyInfo.label}</p>
            </div>

            <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Mint Price</p>
              <p className="text-2xl text-yellow-400 font-bold">{nftPrice} ADA</p>
            </div>

            <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Remaining</p>
              <p className="text-white font-semibold">
                <span className="text-2xl text-white font-black">{remainingSupply}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-lg text-gray-400">{totalSupply}</span>
              </p>
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
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded p-4 mb-6">
          <p className="text-blue-400 text-xs font-semibold mb-2 uppercase tracking-wider">
            Important Information
          </p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Each NFT can be minted once per player, per difficulty. You can mint one Easy, one Medium, and one Hard NFT for this event.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>You can mint this NFT now or return later, as long as the remaining supply lasts. If the supply runs out before you mint, you will not be able to mint this NFT.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Minting requires a connected Cardano wallet</span>
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
