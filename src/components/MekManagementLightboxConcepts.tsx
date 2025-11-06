"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MekProfileLightbox, { DesignationCardStyle } from "@/components/MekProfileLightbox";

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
// Now uses MekProfileLightbox with designation card style selection
function MekManagementConcept3({ onClose, designationCardStyle }: { onClose: () => void; designationCardStyle?: DesignationCardStyle }) {
  return (
    <MekProfileLightbox
      isOpen={true}
      onClose={onClose}
      designationCardStyle={designationCardStyle || 'corner-brackets'}
    />
  );
}

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

// CONCEPT 4: Ultra Bright Glass (Essence Market Style)
// Inspired by essence-market listing lightbox - very light, ultra translucent
function MekManagementConcept4({ onClose }: { onClose: () => void }) {
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
      {/* Backdrop - very light with minimal blur */}
      <div className="fixed inset-0 bg-black/40" style={{ backdropFilter: 'blur(2px)' }} />

      {/* Lightbox Card - Ultra translucent glass effect */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-lg overflow-hidden shadow-2xl border-2 border-yellow-500/50"
          style={{
            background: 'linear-gradient(105deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 40%, rgba(255, 255, 255, 0.01) 100%)',
            backdropFilter: 'blur(20px) brightness(1.05)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
          </button>

          {/* Industrial Header with hazard stripes */}
          <div className="relative overflow-hidden bg-gradient-to-b from-black via-black to-transparent">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
              }} />
            </div>
            <div className="px-6 py-4">
              <h2 className="text-3xl font-bold font-orbitron tracking-wider text-center">
                <span className="text-yellow-400">MEK</span>{" "}
                <span className="text-gray-400">MANAGEMENT</span>
              </h2>
            </div>
          </div>

          {/* Content with crosshatch pattern overlay */}
          <div className="relative p-6">
            {/* Crosshatch pattern background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px),
                                  repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px)`
              }}
            />

            {/* Mek Image */}
            <div className="relative mb-4 p-4 rounded-lg" style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
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
            <div className="text-center mb-4">
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1">Mek Name</div>
              <div className="text-white text-2xl font-bold mb-2">{mockMekData.customName || "UNNAMED"}</div>
              <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                ✏️ Edit Name
              </button>
            </div>

            {/* Slot Info */}
            <div className="text-center mb-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Deployed To</div>
              <div className="text-yellow-400 text-lg font-bold">SLOT {mockMekData.slotNumber}</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button className="w-full px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all">
                Swap Mek
              </button>
              <button className="w-full px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-red-500/20 hover:border-red-500/50 transition-all">
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

// CONCEPT 5: Gradient Border Frame (Blue/Purple Theme)
// Completely different aesthetic - gradient borders, purple/blue colors, side-by-side layout
function MekManagementConcept5({ onClose }: { onClose: () => void }) {
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
      {/* Backdrop - medium darkness with blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />

      {/* Lightbox Card - Gradient border frame */}
      <div
        className="relative z-10 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border wrapper */}
        <div className="p-[2px] rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
          <div className="bg-black/70 backdrop-blur-xl rounded-xl">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-full hover:scale-110 transition-transform z-20 shadow-lg"
            >
              <span className="text-white text-2xl font-bold">×</span>
            </button>

            {/* Content - Split layout */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Image Section */}
                <div>
                  <h3 className="text-blue-400 text-xs uppercase tracking-wider mb-3 font-bold">Mek Visual</h3>
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
                    <img
                      src={`/mek-images/500px/${mockMekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                      alt={mockMekData.assetName}
                      className="w-full h-auto rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Right: Info & Actions */}
                <div className="flex flex-col">
                  <h3 className="text-purple-400 text-xs uppercase tracking-wider mb-3 font-bold">Mek Details</h3>

                  {/* Name */}
                  <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Name</div>
                    <div className="text-white text-xl font-bold mb-2">{mockMekData.customName || "UNNAMED"}</div>
                    <button className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1">
                      <span>✏️</span> Edit Name
                    </button>
                  </div>

                  {/* Slot */}
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-pink-500/20">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Slot Assignment</div>
                    <div className="text-purple-400 text-lg font-bold">SLOT {mockMekData.slotNumber}</div>
                  </div>

                  {/* Actions - stacked vertically */}
                  <div className="mt-auto space-y-3">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-blue-300 text-sm font-bold uppercase tracking-wider rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all">
                      Swap Mek
                    </button>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/40 text-red-300 text-sm font-bold uppercase tracking-wider rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all">
                      Terminate Slot
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// CONCEPT 7: Compact Designation Cards
// Multiple creative single-card layouts combining all 4 fields
function MekManagementConcept7({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [cardVariant, setCardVariant] = useState<1 | 2 | 3 | 4>(1);

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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 rounded-xl shadow-2xl p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform z-20"
          >
            <span className="text-yellow-400 text-3xl font-bold">×</span>
          </button>

          {/* Header */}
          <h2 className="text-center text-yellow-400 text-2xl font-bold uppercase tracking-wider mb-6">
            DESIGNATION CARD CONCEPTS
          </h2>

          {/* Variant Selector */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => setCardVariant(v as 1 | 2 | 3 | 4)}
                className={`px-4 py-2 text-sm font-bold uppercase rounded transition-all ${
                  cardVariant === v
                    ? 'bg-yellow-500 text-black'
                    : 'bg-black/60 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                }`}
              >
                Layout {v}
              </button>
            ))}
          </div>

          {/* Card Variants Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LAYOUT 1: Split Hero - Rank dominant on left */}
            {cardVariant === 1 && (
              <div className="bg-black/60 border-2 border-yellow-500/40 rounded-lg p-6">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-4 text-center">Layout 1: Split Hero</div>
                <div className="grid grid-cols-[auto_1fr] gap-4">
                  {/* Left: Giant Rank */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-l-4 border-yellow-500 rounded-lg px-6 py-4">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Rank</div>
                    <div className="text-yellow-400 text-5xl font-bold leading-none">2985</div>
                  </div>
                  {/* Right: Other 3 fields stacked */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider">Mekanism</div>
                      <div className="text-white text-lg font-bold">#1234</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider">Corporation</div>
                      <div className="text-cyan-400 text-sm">Apex Industries</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider">Employee ID</div>
                      <div className="text-yellow-400 text-sm">Golden Striker</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 2: Badge Cluster - Small compact badges */}
            {cardVariant === 2 && (
              <div className="bg-black/60 border-2 border-yellow-500/40 rounded-lg p-6">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-4 text-center">Layout 2: Badge Cluster</div>
                <div className="space-y-2">
                  {/* Rank - Full width highlight */}
                  <div className="bg-gradient-to-r from-yellow-500/30 via-yellow-500/20 to-transparent border-l-4 border-yellow-500 px-4 py-3 rounded">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider mr-3">Rank</span>
                    <span className="text-yellow-400 text-2xl font-bold">2985</span>
                  </div>
                  {/* Other fields as inline badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-black/60 border border-gray-600/50 rounded px-3 py-2">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider mr-2">Mek</span>
                      <span className="text-white font-bold">#1234</span>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded px-3 py-2">
                      <span className="text-[9px] text-cyan-400 uppercase tracking-wider mr-2">Corp</span>
                      <span className="text-cyan-400 font-bold">Apex Industries</span>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                      <span className="text-[9px] text-yellow-400 uppercase tracking-wider mr-2">ID</span>
                      <span className="text-yellow-400 font-bold">Golden Striker</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 3: 2x2 Grid - Rank takes upper-left, others fill remaining */}
            {cardVariant === 3 && (
              <div className="bg-black/60 border-2 border-yellow-500/40 rounded-lg p-6">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-4 text-center">Layout 3: 2×2 Grid</div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Top-left: Rank (larger) */}
                  <div className="row-span-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-lg flex flex-col items-center justify-center p-4">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Rank</div>
                    <div className="text-yellow-400 text-6xl font-bold leading-none">2985</div>
                  </div>
                  {/* Top-right: Mek # */}
                  <div className="bg-black/60 border border-gray-600/50 rounded-lg p-3">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">Mekanism</div>
                    <div className="text-white text-xl font-bold">#1234</div>
                  </div>
                  {/* Bottom-right: Corp + ID stacked */}
                  <div className="bg-black/60 border border-gray-600/50 rounded-lg p-3 space-y-2">
                    <div>
                      <div className="text-[8px] text-gray-400 uppercase tracking-wider">Corp</div>
                      <div className="text-cyan-400 text-xs font-bold">Apex Ind.</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-gray-400 uppercase tracking-wider">ID</div>
                      <div className="text-yellow-400 text-xs font-bold">G. Striker</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 4: Horizontal Strip - Yellow label strip with data below */}
            {cardVariant === 4 && (
              <div className="bg-black/60 border-2 border-yellow-500/40 rounded-lg overflow-hidden">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-0 text-center p-2 bg-black/40">Layout 4: Label Strip</div>
                {/* Yellow label strip */}
                <div className="bg-gradient-to-r from-yellow-500/30 via-yellow-500/20 to-yellow-500/30 border-y-2 border-yellow-500/40 py-2 px-4 flex items-center justify-between">
                  <span className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold">RANK</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">MEKANISM</span>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">CORPORATION</span>
                  <span className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold">EMPLOYEE</span>
                </div>
                {/* Data row */}
                <div className="py-4 px-4 flex items-center justify-between">
                  <div className="text-yellow-400 text-3xl font-bold">2985</div>
                  <div className="text-white text-xl font-bold">#1234</div>
                  <div className="text-cyan-400 text-sm font-bold">Apex Ind.</div>
                  <div className="text-yellow-400 text-sm font-bold">G. Striker</div>
                </div>
              </div>
            )}

            {/* Right side: Implementation example */}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-4">Tailwind Classes Used</div>
              <div className="text-[11px] font-mono text-gray-300 space-y-3">
                {cardVariant === 1 && (
                  <>
                    <div><span className="text-yellow-400">Container:</span> grid grid-cols-[auto_1fr] gap-4</div>
                    <div><span className="text-yellow-400">Rank Box:</span> bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-l-4 border-yellow-500</div>
                    <div><span className="text-yellow-400">Right Column:</span> space-y-3</div>
                  </>
                )}
                {cardVariant === 2 && (
                  <>
                    <div><span className="text-yellow-400">Rank Bar:</span> bg-gradient-to-r from-yellow-500/30 via-yellow-500/20 to-transparent border-l-4 border-yellow-500</div>
                    <div><span className="text-yellow-400">Badge Row:</span> flex flex-wrap gap-2</div>
                    <div><span className="text-yellow-400">Badge:</span> bg-black/60 border border-gray-600/50 rounded px-3 py-2</div>
                  </>
                )}
                {cardVariant === 3 && (
                  <>
                    <div><span className="text-yellow-400">Container:</span> grid grid-cols-2 gap-3</div>
                    <div><span className="text-yellow-400">Rank Cell:</span> row-span-2 (spans 2 rows)</div>
                    <div><span className="text-yellow-400">Other Cells:</span> Single row spans</div>
                  </>
                )}
                {cardVariant === 4 && (
                  <>
                    <div><span className="text-yellow-400">Label Strip:</span> bg-gradient-to-r from-yellow-500/30 via-yellow-500/20 to-yellow-500/30 border-y-2</div>
                    <div><span className="text-yellow-400">Data Row:</span> flex items-center justify-between</div>
                    <div><span className="text-yellow-400">Typography:</span> Different sizes for visual hierarchy</div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Design Notes</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  {cardVariant === 1 && "Split layout emphasizes Rank with a dominant left panel. Creates strong visual hierarchy with the most important data (Rank) taking center stage."}
                  {cardVariant === 2 && "Badge cluster uses small, compact components. Rank gets highlight bar treatment while other fields become inline badges. Very space-efficient."}
                  {cardVariant === 3 && "2×2 grid gives Rank prominent position (upper-left, double height). Other fields fill remaining cells. Balanced and symmetrical."}
                  {cardVariant === 4 && "Horizontal strip uses label row above data row. All fields get equal visual weight. Clean and organized like a data table."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// CONCEPT 6: Neon Holographic (Cyan/Magenta Theme)
// Futuristic holographic aesthetic with neon glows, scan lines, and animated effects
function MekManagementConcept6({ onClose }: { onClose: () => void }) {
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
      {/* Backdrop - medium with blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />

      {/* Lightbox Card - Holographic neon */}
      <div
        className="relative z-10 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl overflow-hidden border-2 shadow-2xl relative"
          style={{
            borderColor: 'rgba(0, 255, 255, 0.5)',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 40, 0.8) 50%, rgba(0, 0, 0, 0.8) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 0, 255, 0.2)',
          }}
        >
          {/* Animated scan line effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
              animation: 'scan 4s linear infinite',
            }}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full z-20 hover:scale-110 transition-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))',
              border: '2px solid rgba(0, 255, 255, 0.5)',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            }}
          >
            <span className="text-cyan-300 text-2xl font-bold">×</span>
          </button>

          {/* Header with neon glow */}
          <div className="relative p-6 pb-4">
            <h2
              className="text-3xl font-bold text-center tracking-wider uppercase"
              style={{
                background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
              }}
            >
              MEK CONTROL
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Mek Image with holographic border */}
            <div
              className="mb-4 p-4 rounded-xl relative"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(0, 255, 255, 0.3)',
                boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.1), 0 0 30px rgba(255, 0, 255, 0.2)',
              }}
            >
              <img
                src={`/mek-images/500px/${mockMekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                alt={mockMekData.assetName}
                className="w-full h-auto max-w-[384px] mx-auto"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-magenta-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-magenta-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Name */}
              <div
                className="col-span-2 p-3 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(255, 0, 255, 0.05))',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                }}
              >
                <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Designation</div>
                <div className="text-white text-lg font-bold" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  {mockMekData.customName || "UNNAMED"}
                </div>
              </div>

              {/* Slot */}
              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(0, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                }}
              >
                <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Slot</div>
                <div className="text-cyan-300 text-lg font-bold">{mockMekData.slotNumber}</div>
              </div>

              {/* Edit Name */}
              <div
                className="p-3 rounded-lg flex items-center justify-center cursor-pointer hover:bg-magenta-500/10 transition-colors"
                style={{
                  background: 'rgba(255, 0, 255, 0.05)',
                  border: '1px solid rgba(255, 0, 255, 0.2)',
                }}
              >
                <button className="text-magenta-400 text-xs hover:text-magenta-300 transition-colors flex items-center gap-1">
                  <span>✏️</span> Edit
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                className="w-full px-6 py-3 text-cyan-300 text-sm font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 200, 200, 0.1))',
                  border: '2px solid rgba(0, 255, 255, 0.3)',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
                }}
              >
                Swap Mek
              </button>
              <button
                className="w-full px-6 py-3 text-red-300 text-sm font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 0, 100, 0.1), rgba(200, 0, 100, 0.1))',
                  border: '2px solid rgba(255, 0, 100, 0.3)',
                  boxShadow: '0 0 15px rgba(255, 0, 100, 0.2)',
                }}
              >
                Terminate Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add keyframe animation for scan effect */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// Main component with toggle controls
export default function MekManagementLightboxConcepts() {
  const [showConcepts, setShowConcepts] = useState(false);
  const [activeConcept, setActiveConcept] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(3);
  const [designationCardStyle, setDesignationCardStyle] = useState<'corner-brackets' | 'split-hud' | 'data-terminal'>('corner-brackets');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleControls = (
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
            <button
              onClick={() => setActiveConcept(4)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 4
                  ? 'bg-yellow-500 text-black border-2 border-yellow-400'
                  : 'bg-black/80 text-yellow-400 border-2 border-yellow-500/50 hover:bg-yellow-500/20'
              }`}
            >
              Concept 4: Market
            </button>
            <button
              onClick={() => setActiveConcept(5)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 5
                  ? 'bg-purple-500 text-black border-2 border-purple-400'
                  : 'bg-black/80 text-purple-400 border-2 border-purple-500/50 hover:bg-purple-500/20'
              }`}
            >
              Concept 5: Gradient
            </button>
            <button
              onClick={() => setActiveConcept(6)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 6
                  ? 'bg-cyan-500 text-black border-2 border-cyan-400'
                  : 'bg-black/80 text-cyan-400 border-2 border-cyan-500/50 hover:bg-cyan-500/20'
              }`}
            >
              Concept 6: Neon
            </button>
            <button
              onClick={() => setActiveConcept(7)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                activeConcept === 7
                  ? 'bg-orange-500 text-black border-2 border-orange-400'
                  : 'bg-black/80 text-orange-400 border-2 border-orange-500/50 hover:bg-orange-500/20'
              }`}
            >
              Concept 7: Cards
            </button>

            {/* Designation Card Style Selector */}
            <div className="mt-4 pt-4 border-t border-gray-600/50">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2 px-2">
                Designation Card Style
              </div>
              <select
                value={designationCardStyle}
                onChange={(e) => setDesignationCardStyle(e.target.value as 'corner-brackets' | 'split-hud' | 'data-terminal')}
                className="w-full px-3 py-2 text-xs font-bold uppercase bg-black/80 text-cyan-400 border-2 border-cyan-500/50 rounded hover:border-cyan-400 transition-all cursor-pointer"
              >
                <option value="corner-brackets">Corner Brackets</option>
                <option value="split-hud">Split HUD</option>
                <option value="data-terminal">Data Terminal</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!mounted) return null;

  return (
    <>
      {/* Render Toggle Controls via Portal (above all lightbox backdrops) */}
      {createPortal(toggleControls, document.body)}

      {/* Render Active Concept */}
      {showConcepts && (
        <>
          {activeConcept === 1 && <MekManagementConcept1 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 2 && <MekManagementConcept2 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 3 && <MekManagementConcept3 onClose={() => setShowConcepts(false)} designationCardStyle={designationCardStyle} />}
          {activeConcept === 4 && <MekManagementConcept4 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 5 && <MekManagementConcept5 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 6 && <MekManagementConcept6 onClose={() => setShowConcepts(false)} />}
          {activeConcept === 7 && <MekManagementConcept7 onClose={() => setShowConcepts(false)} />}
        </>
      )}
    </>
  );
}
