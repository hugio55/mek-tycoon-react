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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Lightbox */}
      <div
        className="relative rounded-lg overflow-hidden p-8 max-w-2xl mx-4 shadow-2xl border border-yellow-500/50"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.001)',
          backdropFilter: 'blur(0.1px)',
          boxShadow: '0 0 45px rgba(0, 0, 0, 0.35) inset, 0 0 50px rgba(250, 182, 23, 0.3)',
        }}
      >
        {/* Heat-strengthened glass - branching pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-55" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          {/* Main trunk cracks */}
          <path d="M10,50 L30,45 L50,48 L70,44 L90,46" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none"/>
          <path d="M40,10 L42,30 L38,50 L41,70 L39,90" stroke="rgba(255,255,255,0.23)" strokeWidth="0.6" fill="none"/>
          <path d="M60,5 L62,25 L58,45 L61,65 L59,85 L60,100" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none"/>

          {/* Branching cracks */}
          <path d="M30,45 L25,30" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
          <path d="M30,45 L35,60" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
          <path d="M50,48 L45,35" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
          <path d="M50,48 L55,65" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
          <path d="M70,44 L65,25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
          <path d="M70,44 L75,60" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>

          {/* Secondary branches */}
          <path d="M25,30 L20,20" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
          <path d="M25,30 L15,35" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
          <path d="M35,60 L30,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
          <path d="M35,60 L45,65" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
          <path d="M45,35 L40,25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
          <path d="M55,65 L50,75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
          <path d="M55,65 L65,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
          <path d="M65,25 L60,15" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
          <path d="M75,60 L80,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
          <path d="M75,60 L85,55" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>

          {/* Multiple edge fractures */}
          <path d="M0,25 L-2,27 L0,29" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" fill="none"/>
          <path d="M100,40 L102,42 L100,44" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
          <path d="M70,0 L68,-2 L72,0" stroke="rgba(255,255,255,0.19)" strokeWidth="0.4" fill="none"/>
          <path d="M20,100 L18,102 L22,100" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
          <path d="M100,75 L102,77 L100,79" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" fill="none"/>
        </svg>
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
