"use client";

import { useState, useEffect } from "react";

export default function MekManagementLightboxConcepts() {
  const [mounted, setMounted] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Sample data
  const sampleMekImage = "/mek-images/500px/aa1-aa1-aa1.webp";
  const sampleName = "bong";
  const slotNumber = 1;
  const charCount = 4;

  if (!isDebugOpen) {
    return (
      <button
        onClick={() => setIsDebugOpen(true)}
        className="fixed left-4 top-20 z-[20000] px-4 py-2 bg-black/90 border-2 border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/20 transition-all"
      >
        Open Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[700px] bg-black/95 backdrop-blur-md z-[20000] overflow-y-auto border-r-2 border-cyan-500/30 shadow-2xl shadow-black">
      {/* Header with Close Button */}
      <div className="sticky top-0 z-10 bg-black/95 border-b-2 border-cyan-500/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl text-cyan-400 font-bold uppercase tracking-wider">
            Debug Panel
          </h1>
          <button
            onClick={() => setIsDebugOpen(false)}
            className="px-3 py-1 bg-red-900/20 border border-red-500/50 rounded text-red-400 hover:bg-red-900/40 transition-all text-sm"
          >
            ✕ Close
          </button>
        </div>
        <p className="text-gray-400 text-xs">
          Mek Management Lightbox - Three Design Concepts
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 space-y-8">
        {/* CONCEPT 1: Glass-Morphism Layers */}
        <div>
          <div className="mb-3 text-center border-b border-cyan-500/30 pb-2">
            <h3 className="text-cyan-400 font-bold text-sm tracking-wider">CONCEPT 1</h3>
            <p className="text-gray-500 text-xs">Glass-Morphism Layers</p>
          </div>

          <div className="w-[500px] mx-auto bg-black/80 backdrop-blur-md border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            {/* Header - Dark background with separator */}
            <div className="px-6 py-4 border-b border-yellow-500/30 bg-black/40">
              <h2 className="text-yellow-400 font-bold text-xl tracking-wider text-center uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Mek Management
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mek Image - Layered card */}
              <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={sampleMekImage}
                  alt="Mek"
                  className="w-full h-80 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/mek-images/150px/aa1-aa1-aa1.webp";
                  }}
                />
              </div>

              {/* Slot Badge - Transparent card */}
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded">
                  <div className="text-yellow-400 font-bold text-sm tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Slot {slotNumber}
                  </div>
                </div>
              </div>

              {/* Name Section - Nested transparent card */}
              <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
                  Employee Name
                </label>
                <div className="bg-black/60 border border-yellow-500/30 rounded px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-yellow-100 font-semibold text-lg flex-1">
                    {sampleName}
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-black/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex justify-between items-center text-[10px]">
                  <span className="text-green-400">✓ Available</span>
                  <span className="text-gray-500">{charCount}/20 chars</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-3 bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50 rounded text-yellow-400 font-bold text-sm uppercase tracking-wider hover:bg-yellow-500/10 hover:border-yellow-400 transition-all">
                  🔄 Swap
                </button>
                <button className="flex-1 px-4 py-3 bg-red-900/20 backdrop-blur-sm border-2 border-red-500/50 rounded text-red-400 font-bold text-sm uppercase tracking-wider hover:bg-red-900/40 hover:border-red-400 transition-all">
                  ⚠️ Terminate
                </button>
              </div>

              {/* Close */}
              <div className="text-center border-t border-yellow-500/10 pt-3">
                <button className="text-xs text-gray-500 hover:text-yellow-400 transition-colors uppercase tracking-wider">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONCEPT 2: Industrial Panel System */}
        <div>
          <div className="mb-3 text-center border-b border-cyan-500/30 pb-2">
            <h3 className="text-cyan-400 font-bold text-sm tracking-wider">CONCEPT 2</h3>
            <p className="text-gray-500 text-xs">Industrial Panel System</p>
          </div>

          <div className="w-[500px] mx-auto mek-card-industrial mek-border-sharp-gold overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-yellow-500/30 bg-black/40">
              <h2 className="mek-text-industrial text-xl text-yellow-400 text-center">
                MEK MANAGEMENT
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mek Preview Image */}
              <div className="flex justify-center">
                <img
                  src={sampleMekImage}
                  alt="Mek"
                  className="w-80 h-80 object-contain border-2 border-yellow-500/30 rounded-lg bg-black/40"
                  onError={(e) => {
                    e.currentTarget.src = "/mek-images/150px/aa1-aa1-aa1.webp";
                  }}
                />
              </div>

              {/* Slot Section */}
              <div className="bg-black/40 border-b border-yellow-500/30 py-2">
                <div className="text-yellow-400 font-bold text-sm tracking-widest text-center uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Slot {slotNumber}
                </div>
              </div>

              {/* Name Section */}
              <div>
                <label className="mek-label-uppercase mb-2 text-gray-400">
                  Employee Name
                </label>
                <div className="bg-black/60 border-2 border-yellow-500/30 rounded px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-yellow-100 font-semibold text-lg flex-1">
                    {sampleName}
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-black/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span className="text-green-400">✓ Available</span>
                  <span>{charCount}/20 characters</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button className="flex-1 mek-button-primary">
                  🔄 Swap Mek
                </button>
                <button className="flex-1 px-4 py-3 bg-red-900/20 border-2 border-red-500/50 rounded text-red-400 font-bold text-sm uppercase tracking-wider hover:bg-red-900/40 hover:border-red-400 transition-all">
                  ⚠️ Terminate
                </button>
              </div>

              {/* Close Button */}
              <div className="text-center border-t border-yellow-500/30 pt-3">
                <button className="mek-button-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONCEPT 3: Centered Symmetry */}
        <div>
          <div className="mb-3 text-center border-b border-cyan-500/30 pb-2">
            <h3 className="text-cyan-400 font-bold text-sm tracking-wider">CONCEPT 3</h3>
            <p className="text-gray-500 text-xs">Centered Symmetry (User Approved)</p>
          </div>

          <div className="w-[400px] mx-auto bg-gradient-to-b from-black via-black to-gray-900/50 border border-yellow-500/40 rounded shadow-2xl shadow-black">
            {/* Minimalist Header */}
            <div className="px-6 py-5 text-center border-b border-yellow-500/20">
              <h2 className="text-yellow-400 font-bold text-base tracking-[0.3em] mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                MEK MANAGEMENT
              </h2>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent mx-auto"></div>
            </div>

            {/* Perfectly Centered Content */}
            <div className="p-6 space-y-5">
              {/* Image with subtle frame */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-2 border border-yellow-500/20 rounded"></div>
                  <div className="w-96 h-96 bg-black rounded flex items-center justify-center">
                    <img
                      src={sampleMekImage}
                      alt="Mek"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/mek-images/150px/aa1-aa1-aa1.webp";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Slot Badge - centered */}
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-yellow-500/10 border-l-2 border-r-2 border-yellow-500/60 rounded-sm">
                  <div className="text-yellow-400 font-bold text-sm tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    SLOT {slotNumber}
                  </div>
                </div>
              </div>

              {/* Name Display - centered */}
              <div className="text-center space-y-2">
                <label className="text-[9px] text-gray-600 uppercase tracking-widest block">
                  Employee Name
                </label>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-yellow-100 font-semibold text-2xl tracking-wide">
                    {sampleName}
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center rounded-full border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all">
                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-center gap-4 text-[10px]">
                  <span className="text-green-400">✓ Available</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{charCount}/20</span>
                </div>
              </div>

              {/* Symmetric Button Layout */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-3 py-2.5 bg-black/60 border border-yellow-500/40 rounded text-yellow-400 font-semibold text-xs uppercase tracking-wider hover:bg-yellow-500/10 hover:border-yellow-400 transition-all">
                  <div className="flex items-center justify-center gap-2">
                    <span>🔄</span>
                    <span>SWAP</span>
                  </div>
                </button>
                <button className="flex-1 px-3 py-2.5 bg-black/60 border border-red-500/40 rounded text-red-400 font-semibold text-xs uppercase tracking-wider hover:bg-red-900/30 hover:border-red-400 transition-all">
                  <div className="flex items-center justify-center gap-2">
                    <span>⚠️</span>
                    <span>TERMINATE</span>
                  </div>
                </button>
              </div>

              {/* Centered Close */}
              <div className="text-center pt-3 border-t border-yellow-500/10">
                <button className="text-[11px] text-gray-600 hover:text-yellow-400 transition-colors uppercase tracking-widest">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Design Summary */}
      <div className="mt-8 border-t border-cyan-500/30 pt-6 px-6">
        <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-4">Design Summary</h3>
        <div className="space-y-3 text-xs text-gray-400">
          <div className="bg-black/60 border border-yellow-500/20 rounded p-3">
            <p className="text-yellow-400 font-semibold mb-1">Concept 1 - Glass-Morphism Layers:</p>
            <p>Heavy glass effects with layered transparency, backdrop blur, and nested cards. Matches Essence Distribution aesthetic.</p>
          </div>
          <div className="bg-black/60 border border-yellow-500/20 rounded p-3">
            <p className="text-yellow-400 font-semibold mb-1">Concept 2 - Industrial Panel System:</p>
            <p>Uses mek-card-industrial classes with sharp borders, clean separators, and design system buttons. Professional organization.</p>
          </div>
          <div className="bg-black/60 border border-green-500/20 rounded p-3">
            <p className="text-green-400 font-semibold mb-1">✓ Concept 3 - Centered Symmetry (User Approved):</p>
            <p>Minimalist, perfectly centered elements with balanced proportions and subtle decorative touches.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
