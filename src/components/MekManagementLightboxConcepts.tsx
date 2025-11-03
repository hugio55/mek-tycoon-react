"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Mock data for demonstration
const mockMekData = {
  assetId: "demo-mek-001",
  sourceKey: "bc2-dm1-ap1",
  customName: "Steel Thunder",
  assetName: "Bumblebee",
  slotNumber: 1
};

// CONCEPT 1: Maximum Transparency (Glass Effect)
// Heavy glass-morphism with minimal opacity - lets background show through
function MekManagementConcept1({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop - very transparent */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-lg" />

      {/* Lightbox Card - Maximum transparency */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/60 backdrop-blur-lg border border-yellow-500/20 rounded-xl shadow-2xl shadow-black/50">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-black/80 border border-yellow-500/40 rounded-full hover:border-yellow-400 transition-all z-20"
          >
            <span className="text-yellow-400 text-xl">×</span>
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <h2 className="text-center text-yellow-400 text-lg font-bold uppercase tracking-wider mb-4">
              MEK MANAGEMENT
            </h2>

            {/* Mek Image - even more transparent inner section */}
            <div className="bg-black/40 rounded-lg p-4 mb-4 border border-yellow-500/20">
              <img
                src={`/mek-images/500px/${mockMekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                alt={mockMekData.assetName}
                className="w-full h-auto max-w-[384px] mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Name Section */}
            <div className="bg-black/40 rounded-lg p-4 mb-4 border border-yellow-500/20">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Name</div>
              <div className="text-white text-xl font-bold">{mockMekData.customName || "UNNAMED"}</div>
              <button className="mt-2 text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                Edit Name
              </button>
            </div>

            {/* Slot Info */}
            <div className="text-center text-gray-400 text-sm mb-4">
              SLOT {mockMekData.slotNumber}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-yellow-500/30 transition-all">
                Swap
              </button>
              <button className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-red-500/30 transition-all">
                Terminate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// CONCEPT 2: Layered Panels (Depth Through Transparency)
// Multiple transparency layers creating visual depth
function MekManagementConcept2({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />

      {/* Lightbox Card - Progressive transparency layers */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/90 backdrop-blur-md border-2 border-yellow-500/40 rounded-xl shadow-2xl shadow-black/60">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center bg-black/95 border-2 border-yellow-500/50 rounded-full hover:border-yellow-400 transition-all z-20"
          >
            <span className="text-yellow-400 text-2xl font-bold">×</span>
          </button>

          {/* Content - layered with different opacity levels */}
          <div className="p-6 space-y-4">
            {/* Header - Layer 1 (darkest) */}
            <div className="bg-black/70 rounded-lg p-3 border-b-2 border-yellow-500/30">
              <h2 className="text-center text-yellow-400 text-xl font-bold uppercase tracking-wider">
                MEK MANAGEMENT
              </h2>
            </div>

            {/* Mek Image - Layer 2 (medium) */}
            <div className="bg-black/70 rounded-lg p-4 border border-yellow-500/30">
              <img
                src={`/mek-images/500px/${mockMekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                alt={mockMekData.assetName}
                className="w-full h-auto max-w-[384px] mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Name Section - Layer 3 (lighter) */}
            <div className="bg-black/50 rounded-lg p-4 border border-yellow-500/30">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Mek Name</div>
              <div className="text-white text-2xl font-bold mb-2">{mockMekData.customName || "UNNAMED"}</div>
              <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors border-b border-cyan-400/50 hover:border-cyan-300">
                ✏️ Edit Name
              </button>
            </div>

            {/* Slot Info - Layer 4 (lightest) */}
            <div className="bg-black/30 rounded-lg p-3 border border-yellow-500/20 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Assigned To</div>
              <div className="text-yellow-400 text-lg font-bold">SLOT {mockMekData.slotNumber}</div>
            </div>

            {/* Action Buttons - Layer 5 (on base) */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-yellow-500/30 hover:border-yellow-500/70 transition-all">
                Swap Mek
              </button>
              <button className="flex-1 px-4 py-3 bg-red-500/20 border-2 border-red-500/50 text-red-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-red-500/30 hover:border-red-500/70 transition-all">
                Terminate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// CONCEPT 3: Centered Minimalism (User's Current Favorite - IMPROVED)
// Clean, centered, balanced design with medium transparency
function MekManagementConcept3({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Lightbox Card - Clean centered design */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 rounded-xl shadow-2xl shadow-black/50">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform z-20"
          >
            <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
          </button>

          {/* Content - perfectly centered and balanced */}
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-yellow-400 text-2xl font-bold uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(250, 182, 23, 0.3)' }}>
                MEK MANAGEMENT
              </h2>
            </div>

            {/* Mek Image - centered with even padding */}
            <div className="bg-black/60 rounded-lg p-6 mb-6 border border-yellow-500/30">
              <img
                src={`/mek-images/500px/${mockMekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                alt={mockMekData.assetName}
                className="w-full h-auto max-w-[384px] mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Name Section - centered */}
            <div className="text-center mb-6">
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-2">Mek Name</div>
              <div className="text-white text-2xl font-bold mb-3">{mockMekData.customName || "UNNAMED"}</div>
              <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                ✏️ Edit Name
              </button>
            </div>

            {/* Slot Info - centered */}
            <div className="text-center mb-6">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Slot</div>
              <div className="text-yellow-400 text-lg font-bold">SLOT {mockMekData.slotNumber}</div>
            </div>

            {/* Action Buttons - centered, full width */}
            <div className="space-y-3">
              <button className="w-full px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-yellow-500/30 hover:border-yellow-500/70 transition-all">
                Swap Mek
              </button>
              <button className="w-full px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-red-500/30 hover:border-red-500/70 transition-all">
                Terminate Slot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// Main component with toggle controls
export default function MekManagementLightboxConcepts() {
  const [showConcepts, setShowConcepts] = useState(false);
  const [activeConcept, setActiveConcept] = useState<1 | 2 | 3>(3);

  return (
    <>
      {/* Toggle Controls - Fixed position top-right - Above lightbox backdrop */}
      <div className="fixed top-20 right-4 z-[10001] flex flex-col gap-2">
        {/* Master Toggle */}
        <button
          onClick={() => setShowConcepts(!showConcepts)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all ${
            showConcepts
              ? 'bg-yellow-500 text-black border-2 border-yellow-400'
              : 'bg-black/80 text-yellow-400 border-2 border-yellow-500/50 hover:bg-yellow-500/20'
          }`}
        >
          {showConcepts ? '✕ Close Concepts' : '👁️ Show Concepts'}
        </button>

        {/* Concept Selector - only show when concepts are visible */}
        {showConcepts && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveConcept(1)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 1
                  ? 'bg-cyan-500 text-black border-2 border-cyan-400'
                  : 'bg-black/80 text-cyan-400 border-2 border-cyan-500/50 hover:bg-cyan-500/20'
              }`}
            >
              Concept 1: Glass
            </button>
            <button
              onClick={() => setActiveConcept(2)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 2
                  ? 'bg-blue-500 text-black border-2 border-blue-400'
                  : 'bg-black/80 text-blue-400 border-2 border-blue-500/50 hover:bg-blue-500/20'
              }`}
            >
              Concept 2: Layers
            </button>
            <button
              onClick={() => setActiveConcept(3)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 3
                  ? 'bg-green-500 text-black border-2 border-green-400'
                  : 'bg-black/80 text-green-400 border-2 border-green-500/50 hover:bg-green-500/20'
              }`}
            >
              Concept 3: Clean ⭐
            </button>
          </div>
        )}
      </div>

      {/* Render Active Concept */}
      {showConcepts && (
        <>
          {activeConcept === 1 && <MekManagementConcept1 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 2 && <MekManagementConcept2 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 3 && <MekManagementConcept3 onClose={() => setShowConcepts(false)} />}
        </>
      )}
    </>
  );
}
