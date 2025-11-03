"use client";

import { useState, useEffect } from "react";

export default function MekManagementLightboxConcepts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Sample data
  const sampleMekImage = "/mek-images/500px/aa1-aa1-aa1.webp";
  const sampleName = "bong";
  const slotNumber = 1;
  const charCount = 4;

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[1400px] bg-black/95 backdrop-blur-md z-[20000] overflow-y-auto p-8 border-r-2 border-yellow-500/30">
      <div className="mb-6">
        <h1 className="mek-text-industrial text-2xl text-yellow-400 mb-2">
          MEK MANAGEMENT LIGHTBOX CONCEPTS
        </h1>
        <p className="text-gray-400 text-sm">
          Compare three visual design approaches - all narrower and more cohesive
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* CONCEPT 1: Compact Vertical Stack */}
        <div>
          <div className="mb-3 text-center">
            <h3 className="text-yellow-400 font-bold text-sm tracking-wider">CONCEPT 1</h3>
            <p className="text-gray-500 text-xs">Compact Vertical Stack</p>
          </div>

          <div className="w-[384px] mx-auto bg-black/80 border-2 border-yellow-500/50 rounded">
            {/* Header */}
            <div className="px-4 py-3 border-b-2 border-yellow-500/30 bg-black/60">
              <h2 className="text-yellow-400 font-bold text-base tracking-widest text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                MEK MANAGEMENT
              </h2>
            </div>

            {/* Content - very tight spacing */}
            <div className="p-4 space-y-3">
              {/* Mek Image */}
              <div className="w-full h-96 bg-black/40 border border-yellow-500/20 rounded flex items-center justify-center">
                <img
                  src={sampleMekImage}
                  alt="Mek"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/mek-images/150px/aa1-aa1-aa1.webp";
                  }}
                />
              </div>

              {/* Slot - prominent, minimal space */}
              <div className="text-center py-1 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <div className="text-yellow-400 font-bold text-sm tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  SLOT {slotNumber}
                </div>
              </div>

              {/* Name Section - full width */}
              <div className="border-2 border-yellow-500/20 rounded bg-black/40 p-3">
                <div className="mb-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block text-center">
                    Employee Name
                  </label>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-black/60 border border-yellow-500/30 rounded">
                  <div className="text-yellow-100 font-semibold text-lg flex-1 text-center">
                    {sampleName}
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center rounded bg-black/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all flex-shrink-0">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px]">
                  <span className="text-green-400">✓ '{sampleName}' is available</span>
                  <span className="text-gray-500">{charCount}/20 characters</span>
                </div>
              </div>

              {/* Action Buttons - stacked for compactness */}
              <div className="space-y-2 pt-1">
                <button className="w-full px-4 py-2.5 bg-black/60 border-2 border-yellow-500/50 rounded text-yellow-400 font-bold text-sm uppercase tracking-wider hover:bg-yellow-500/10 hover:border-yellow-400 transition-all">
                  🔄 SWAP MEK
                </button>
                <button className="w-full px-4 py-2.5 bg-red-900/20 border-2 border-red-500/50 rounded text-red-400 font-bold text-sm uppercase tracking-wider hover:bg-red-900/40 hover:border-red-400 transition-all">
                  ⚠️ TERMINATE
                </button>
              </div>

              {/* Close */}
              <div className="text-center pt-1">
                <button className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONCEPT 2: Card-Based Hierarchy */}
        <div>
          <div className="mb-3 text-center">
            <h3 className="text-yellow-400 font-bold text-sm tracking-wider">CONCEPT 2</h3>
            <p className="text-gray-500 text-xs">Card-Based Hierarchy</p>
          </div>

          <div className="w-[400px] mx-auto bg-black/90 border-2 border-yellow-500/60 rounded-lg overflow-hidden shadow-2xl shadow-yellow-500/20">
            {/* Header with pattern */}
            <div className="relative px-5 py-4 border-b-2 border-yellow-500/40 bg-gradient-to-b from-yellow-900/20 to-black/40">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fab617 10px, #000 11px)' }}></div>
              <h2 className="relative text-yellow-400 font-bold text-lg tracking-widest text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                MEK MANAGEMENT
              </h2>
            </div>

            {/* Content with more breathing room */}
            <div className="p-5 space-y-4">
              {/* Hero Image Card */}
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-yellow-500"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-yellow-500"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-yellow-500"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-yellow-500"></div>

                <div className="w-full h-96 bg-gradient-to-b from-black/60 to-black/80 flex items-center justify-center">
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

              {/* Info Panel */}
              <div className="bg-black/60 border-l-4 border-yellow-500/60 p-4 rounded-r">
                <div className="mb-3">
                  <div className="text-yellow-400 font-bold text-base tracking-widest mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    SLOT {slotNumber}
                  </div>
                  <div className="h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                </div>

                {/* Name Card */}
                <div className="bg-black/40 border border-yellow-500/30 rounded p-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">
                    Employee Name
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-yellow-100 font-semibold text-xl">
                      {sampleName}
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px]">
                    <span className="text-green-400">✓ Available</span>
                    <span className="text-gray-500">{charCount}/20</span>
                  </div>
                </div>
              </div>

              {/* Action Panel */}
              <div className="bg-black/40 border border-yellow-500/20 rounded p-3 space-y-2">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-500/50 rounded text-yellow-400 font-bold text-sm uppercase tracking-wider hover:from-yellow-900/50 hover:border-yellow-400 transition-all">
                  🔄 SWAP MEK
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500/50 rounded text-red-400 font-bold text-sm uppercase tracking-wider hover:from-red-900/50 hover:border-red-400 transition-all">
                  ⚠️ TERMINATE
                </button>
              </div>

              {/* Close */}
              <div className="text-center">
                <button className="text-xs text-gray-500 hover:text-yellow-400 transition-colors uppercase tracking-wider">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONCEPT 3: Centered Symmetry */}
        <div>
          <div className="mb-3 text-center">
            <h3 className="text-yellow-400 font-bold text-sm tracking-wider">CONCEPT 3</h3>
            <p className="text-gray-500 text-xs">Centered Symmetry</p>
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

      {/* Design Notes */}
      <div className="mt-8 grid grid-cols-3 gap-6 border-t border-yellow-500/20 pt-6">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="text-yellow-400 font-semibold mb-2">Concept 1 Features:</p>
          <p>• Narrowest width (384px - matches image)</p>
          <p>• Maximum density, minimal padding</p>
          <p>• Stacked buttons for space efficiency</p>
          <p>• Clear section separations</p>
          <p>• Best for quick info access</p>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p className="text-yellow-400 font-semibold mb-2">Concept 2 Features:</p>
          <p>• Card-based visual hierarchy</p>
          <p>• Nested panels for organization</p>
          <p>• Corner brackets on image</p>
          <p>• Gradient accents for depth</p>
          <p>• Best for complex information</p>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p className="text-yellow-400 font-semibold mb-2">Concept 3 Features:</p>
          <p>• Perfect center alignment</p>
          <p>• Minimalist, elegant approach</p>
          <p>• Balanced proportions</p>
          <p>• Subtle decorative elements</p>
          <p>• Best for clean, modern feel</p>
        </div>
      </div>
    </div>
  );
}
