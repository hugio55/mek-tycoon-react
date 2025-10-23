"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';

interface MintNFTLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  eventName?: string;
  nftPrice?: number;
  nftTitle?: string;
  remainingSupply?: number;
  totalSupply?: number;
  chapterNumber?: number;
  eventNumber?: number;
  variation?: 'standard' | 'holographic' | 'tactical';
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
  eventNumber = 1,
  variation = 'standard'
}: MintNFTLightboxProps) {
  const [showWarning, setShowWarning] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const difficultyInfo = {
    easy: { color: 'green', label: 'EASY', suffix: 'E', bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
    medium: { color: 'yellow', label: 'MEDIUM', suffix: 'M', bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
    hard: { color: 'red', label: 'HARD', suffix: 'H', bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' }
  }[difficulty];

  const imageFilename = `E${eventId}-${difficultyInfo.suffix}.png`;

  // ============================================================================
  // VARIATION 1: INDUSTRIAL - Holographic layout with yellow palette
  // ============================================================================
  if (variation === 'standard') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <div
          className="relative max-w-4xl w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Holographic container */}
          <div className="relative">
            {/* Scan line animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-1 bg-yellow-400/50 animate-pulse" style={{
                animation: 'scan 3s linear infinite',
                boxShadow: '0 0 20px rgba(250, 182, 23, 0.8)'
              }} />
            </div>

            {/* Main panel with glow */}
            <div className="bg-black/85 border border-yellow-500 rounded-lg p-6 relative"
                 style={{ boxShadow: '0 0 40px rgba(250, 182, 23, 0.3), inset 0 0 40px rgba(250, 182, 23, 0.05)' }}>

              {/* Floating header */}
              <div className="text-center mb-4 relative">
                <div className="inline-block relative">
                  <h2 className="text-3xl font-bold text-yellow-400 uppercase tracking-wider"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        textShadow: '0 0 20px rgba(250, 182, 23, 0.8)'
                      }}>
                    MISSION COMPLETE
                  </h2>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                </div>
                <p className="text-yellow-300/70 text-sm mt-2 uppercase tracking-widest">NFT Mint Available</p>
              </div>

              {/* Side-by-side layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Image */}
                <div className="relative">
                  <div className="relative aspect-square border border-yellow-500/50 rounded overflow-hidden bg-black/50"
                       style={{ boxShadow: '0 0 20px rgba(250, 182, 23, 0.2)' }}>
                    <Image
                      src={`/event-nfts/${imageFilename}`}
                      alt={nftTitle}
                      fill
                      className="object-contain"
                    />
                    {/* Holographic overlay corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-yellow-400" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-yellow-400" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-yellow-400" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-yellow-400" />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-yellow-400 font-semibold text-sm">{nftTitle}</p>
                  </div>
                </div>

                {/* Right: Floating data panels */}
                <div className="space-y-3">
                  {/* Compact data grid - Event and Difficulty side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 border border-yellow-500/30 rounded p-3 backdrop-blur-sm">
                      <div className="text-xs text-yellow-400/70 uppercase tracking-wider mb-1">Event</div>
                      <div className="text-yellow-300 text-base font-semibold">{nftTitle}</div>
                    </div>
                    <div className="bg-black/30 border border-yellow-500/30 rounded p-3 backdrop-blur-sm">
                      <div className="text-xs text-yellow-400/70 uppercase tracking-wider mb-1">Difficulty</div>
                      <div className={`text-base font-semibold uppercase ${difficultyInfo.text}`}>{difficultyInfo.label}</div>
                    </div>
                  </div>

                  {/* Price - prominent */}
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded p-4 text-center backdrop-blur-sm"
                       style={{ boxShadow: '0 0 15px rgba(250, 182, 23, 0.2)' }}>
                    <div className="text-sm text-yellow-400/70 uppercase tracking-wider mb-2">Mint Price</div>
                    <div className="text-4xl font-black text-yellow-400"
                         style={{
                           fontFamily: 'Orbitron, sans-serif',
                           textShadow: '0 0 15px rgba(250, 182, 23, 0.6)'
                         }}>
                      {nftPrice} <span className="text-2xl">ADA</span>
                    </div>
                  </div>

                  {/* Supply bar */}
                  <div className="bg-black/30 border border-yellow-500/30 rounded p-3 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-yellow-400/70 uppercase tracking-wider">Remaining Supply</span>
                      <span className="text-yellow-300 text-base font-bold">{remainingSupply}/{totalSupply}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                        style={{
                          width: `${(remainingSupply / totalSupply) * 100}%`,
                          boxShadow: '0 0 10px rgba(250, 182, 23, 0.8)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="bg-black/30 border border-gray-500/30 rounded p-3 backdrop-blur-sm">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      • One mint per difficulty level<br/>
                      • Requires Cardano wallet<br/>
                      • Supply limited - mint now or return later
                    </p>
                  </div>

                  {/* Holographic buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={onConfirm}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500 text-yellow-400 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        boxShadow: '0 0 15px rgba(250, 182, 23, 0.3)'
                      }}
                    >
                      MINT
                    </button>
                    <button
                      onClick={() => setShowWarning(true)}
                      className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 text-gray-400 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      LATER
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Lightbox */}
        {showWarning && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-black/90 border-2 border-yellow-500 rounded-lg p-6 relative"
                   style={{ boxShadow: '0 0 30px rgba(250, 182, 23, 0.4)' }}>

                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-yellow-400 text-center mb-4 uppercase tracking-wider"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Reminder
                </h3>

                {/* Warning Message */}
                <div className="bg-black/40 border border-yellow-500/30 rounded p-4 mb-6">
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    You can access this minting window at any time by clicking the <span className="text-yellow-400 font-semibold">Mint button</span> on the right side of the page.
                  </p>
                  <div className="border-t border-yellow-500/20 pt-3 mt-3">
                    <p className="text-yellow-200 text-sm leading-relaxed">
                      <span className="text-yellow-500 font-bold">⚠ Important:</span> If this NFT runs out of supply before you mint, you will no longer be able to mint it. This is not a guarantee.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="bg-gray-800/50 hover:bg-gray-700/50 border-2 border-gray-600 text-gray-300 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setShowWarning(false);
                      onClose();
                    }}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500 text-yellow-400 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      boxShadow: '0 0 15px rgba(250, 182, 23, 0.3)'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VARIATION 2: HOLOGRAPHIC - Floating panels, glowing effects, sci-fi HUD
  // ============================================================================
  if (variation === 'holographic') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

        <div
          className="relative max-w-4xl w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Holographic container */}
          <div className="relative">
            {/* Scan line animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-1 bg-cyan-400/50 animate-pulse" style={{
                animation: 'scan 3s linear infinite',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
              }} />
            </div>

            {/* Main panel with glow */}
            <div className="bg-gray-900/80 border border-cyan-500 rounded-lg p-6 relative"
                 style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), inset 0 0 40px rgba(34, 211, 238, 0.05)' }}>

              {/* Floating header */}
              <div className="text-center mb-4 relative">
                <div className="inline-block relative">
                  <h2 className="text-3xl font-bold text-cyan-400 uppercase tracking-wider"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        textShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                      }}>
                    MISSION COMPLETE
                  </h2>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                </div>
                <p className="text-cyan-300/70 text-sm mt-2 uppercase tracking-widest">NFT Mint Available</p>
              </div>

              {/* Side-by-side layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Image */}
                <div className="relative">
                  <div className="relative aspect-square border border-cyan-500/50 rounded overflow-hidden bg-black/50"
                       style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' }}>
                    <Image
                      src={`/event-nfts/${imageFilename}`}
                      alt={nftTitle}
                      fill
                      className="object-contain"
                    />
                    {/* Holographic overlay corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-cyan-400 font-semibold text-sm">{nftTitle}</p>
                  </div>
                </div>

                {/* Right: Floating data panels */}
                <div className="space-y-3">
                  {/* Compact data grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2 backdrop-blur-sm">
                      <div className="text-[9px] text-cyan-400/70 uppercase tracking-wider mb-0.5">Event</div>
                      <div className="text-cyan-300 text-sm font-semibold">CH{chapterNumber}-E{eventNumber}</div>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2 backdrop-blur-sm">
                      <div className="text-[9px] text-cyan-400/70 uppercase tracking-wider mb-0.5">Difficulty</div>
                      <div className={`text-sm font-semibold uppercase ${difficultyInfo.text}`}>{difficultyInfo.label}</div>
                    </div>
                  </div>

                  {/* Price - prominent */}
                  <div className="bg-cyan-500/10 border-2 border-cyan-500/50 rounded p-3 text-center backdrop-blur-sm"
                       style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)' }}>
                    <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider mb-1">Mint Price</div>
                    <div className="text-3xl font-black text-cyan-400"
                         style={{
                           fontFamily: 'Orbitron, sans-serif',
                           textShadow: '0 0 15px rgba(34, 211, 238, 0.6)'
                         }}>
                      {nftPrice} <span className="text-xl">ADA</span>
                    </div>
                  </div>

                  {/* Supply bar */}
                  <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-cyan-400/70 uppercase tracking-wider">Remaining Supply</span>
                      <span className="text-cyan-300 text-sm font-bold">{remainingSupply}/{totalSupply}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                        style={{
                          width: `${(remainingSupply / totalSupply) * 100}%`,
                          boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 backdrop-blur-sm">
                    <p className="text-blue-300 text-[10px] leading-relaxed">
                      • One mint per difficulty level<br/>
                      • Requires Cardano wallet<br/>
                      • Supply limited - mint now or return later
                    </p>
                  </div>

                  {/* Holographic buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={onConfirm}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-500 text-cyan-400 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)'
                      }}
                    >
                      MINT
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 text-gray-400 font-bold py-2.5 px-4 rounded uppercase tracking-wider text-sm transition-all"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      LATER
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VARIATION 3: TACTICAL TERMINAL - Ultra compact, table layout, command-line style
  // ============================================================================
  if (variation === 'tactical') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/80" />

        <div
          className="relative max-w-2xl w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Terminal-style box */}
          <div className="bg-black border border-gray-500 font-mono">
            {/* Terminal header */}
            <div className="bg-gray-800 border-b border-gray-600 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400 text-xs uppercase tracking-wider">MISSION_COMPLETE.sys</span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>

            {/* Terminal content */}
            <div className="p-4 text-sm">
              {/* Status line */}
              <div className="text-green-400 mb-3">
                <span className="text-gray-600">&gt;</span> STATUS: MISSION COMPLETED [✓]
              </div>

              {/* Compact data table */}
              <div className="border border-gray-700 mb-3">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-gray-500 uppercase w-24">EVENT</td>
                      <td className="px-2 py-1.5 text-white">Chapter {chapterNumber}, Event {eventNumber} - "{eventName}"</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-gray-500 uppercase">DIFFICULTY</td>
                      <td className={`px-2 py-1.5 font-semibold uppercase ${difficultyInfo.text}`}>{difficultyInfo.label}</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-gray-500 uppercase">MINT_PRICE</td>
                      <td className="px-2 py-1.5 text-white font-bold">{nftPrice} ADA</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-gray-500 uppercase">SUPPLY</td>
                      <td className="px-2 py-1.5 text-white">{remainingSupply} / {totalSupply} available</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 text-gray-500 uppercase">NFT_ID</td>
                      <td className="px-2 py-1.5 text-white">{nftTitle}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Image preview */}
              <div className="mb-3 border border-gray-700 bg-gray-900 p-2">
                <div className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider">NFT_PREVIEW.img</div>
                <div className="relative aspect-video bg-black border border-gray-800">
                  <Image
                    src={`/event-nfts/${imageFilename}`}
                    alt={nftTitle}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* System messages */}
              <div className="bg-gray-900 border border-gray-800 p-2 mb-3 text-[10px] text-gray-400 space-y-0.5">
                <div><span className="text-gray-600">[i]</span> One mint permitted per difficulty level</div>
                <div><span className="text-gray-600">[i]</span> Cardano wallet connection required</div>
                <div><span className="text-yellow-500">[!]</span> Limited supply - availability not guaranteed</div>
              </div>

              {/* Command buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onConfirm}
                  className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-2.5 px-4 uppercase tracking-wider text-xs border-2 border-white"
                >
                  &gt; EXECUTE_MINT
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 uppercase tracking-wider text-xs border border-gray-600"
                >
                  &gt; EXIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
