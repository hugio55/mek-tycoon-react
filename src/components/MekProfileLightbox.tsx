"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "@/styles/global-design-system.css";
import MechanicalToggle from "@/components/controls/MechanicalToggle";

interface MekProfileLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  styleVariation?: 'default' | 'variation1' | 'variation2';
}

export default function MekProfileLightbox({ isOpen, onClose, styleVariation = 'default' }: MekProfileLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [isEmployed, setIsEmployed] = useState(false);

  // Define style classes based on variation
  const getContainerClasses = () => {
    switch (styleVariation) {
      case 'variation1': // Cyber Tech
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] bg-black/30 backdrop-blur-md border-2 border-blue-500/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col';
      case 'variation2': // Neon Fusion
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-lg border-2 border-purple-500/50 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20 flex flex-col';
      default: // Industrial
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] bg-black/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl flex flex-col';
    }
  };

  const getHeaderTitleClasses = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'text-5xl font-bold tracking-wider text-center mb-1';
      case 'variation2':
        return 'text-5xl font-bold tracking-wider text-center mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent';
      default:
        return 'text-5xl font-bold font-orbitron tracking-wider text-center mb-1';
    }
  };

  const getPrimaryColor = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'text-blue-400';
      case 'variation2':
        return 'text-purple-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getCardClasses = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'bg-black/40 backdrop-blur-sm border-2 border-blue-500/40 rounded-xl p-4';
      case 'variation2':
        return 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 shadow-lg shadow-purple-500/10';
      default:
        return 'mek-card-industrial mek-border-sharp-gold p-4';
    }
  };

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop - Matching EssenceDistributionLightbox */}
      <div
        className="fixed inset-0 bg-black/40"
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Lightbox Container - Dynamic styling based on variation */}
      <div
        className={getContainerClasses()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className={`${getPrimaryColor()} text-3xl font-bold`} style={{ textShadow: `0 0 10px ${styleVariation === 'variation1' ? 'rgba(59, 130, 246, 0.5)' : styleVariation === 'variation2' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(250, 182, 23, 0.5)'}` }}>×</span>
        </button>

        {/* Scrollable Content */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="relative text-white">
            {/* Industrial Header */}
            <div className="w-full bg-gradient-to-b from-black via-gray-900/50 to-transparent">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
                  }} />
                </div>

                <div className="max-w-7xl mx-auto px-4 py-[15px]">
                  <h1 className={getHeaderTitleClasses()}>
                    <span className={getPrimaryColor()}>MEK</span>{" "}
                    <span className="text-gray-400">PROFILE</span>
                  </h1>
                  <p className="text-center text-gray-400 text-xs max-w-2xl mx-auto" style={{
                    lineHeight: '1.6'
                  }}>
                    Detailed information about your Mekanism unit including stats, variations, and abilities.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content - Layout 1 (Three-Column) */}
            <div className="max-w-7xl mx-auto px-4 py-8 pb-6">
              <div className="space-y-4 md:space-y-6 lg:space-y-8">
                {/* MOBILE: Mek Image Hero (only visible on mobile) */}
                <div className="lg:hidden mek-card-industrial mek-border-sharp-gold overflow-hidden">
                  <img
                    src="/mek-images/1000px/aa2-bl2-hn1.webp"
                    alt="Mek Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* MOBILE: Primary Info Panel (Designation with 4 fields) */}
                <div className="lg:hidden mek-card-industrial mek-border-sharp-gold p-4">
                  <div className="mek-label-uppercase mb-3">MEK INFORMATION</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mekanism Number */}
                    <div className="col-span-2 bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <div className="mek-label-uppercase mb-1">MEKANISM</div>
                      <div className="text-white font-bold relative z-10">#1234</div>
                    </div>

                    {/* Rank */}
                    <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <div className="mek-label-uppercase mb-1">RANK</div>
                      <div className="mek-value-primary text-xl relative z-10">2985</div>
                    </div>

                    {/* Corporation */}
                    <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <div className="mek-label-uppercase mb-1">CORP</div>
                      <div className="text-white text-sm relative z-10">Apex Ind.</div>
                    </div>

                    {/* Employee ID / Custom Name */}
                    <div className="col-span-2 bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <div className="mek-label-uppercase mb-1">EMPLOYEE ID</div>
                      <div className="text-white text-sm break-all relative z-10">Golden Striker</div>
                    </div>
                  </div>
                </div>

                {/* MOBILE: Level & Gold Panel (grouped together) */}
                <div className="lg:hidden space-y-3">
                  {/* Level Progress */}
                  <div className="mek-card-industrial mek-border-sharp-gold p-4">
                    <div className="mek-label-uppercase mb-2">LEVEL PROGRESS</div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">LEVEL 1</span>
                      <span className="text-gray-400">LEVEL 2</span>
                    </div>
                    <div className="relative w-full h-4 bg-black/60 border border-yellow-500/30 mb-2 overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-600" style={{
                        boxShadow: '0 0 10px rgba(250, 182, 23, 0.6)'
                      }}></div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                  </div>

                  {/* Gold Stats Combined */}
                  <div className="mek-card-industrial mek-border-sharp-gold p-4">
                    <div className="mek-label-uppercase mb-3">GOLD STATS</div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Gold Generation */}
                      <div>
                        <div className="mek-label-uppercase mb-2">GENERATION</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base:</span>
                            <span className="text-white">20.0/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="mek-label-uppercase">Effective:</span>
                            <span className="text-green-400 font-bold">24.0/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Gold Produced */}
                      <div>
                        <div className="mek-label-uppercase mb-2">PRODUCED</div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <div className="mek-label-uppercase">Current:</div>
                            <div className="mek-value-primary">12,869</div>
                          </div>
                          <div>
                            <div className="mek-label-uppercase">All Time:</div>
                            <div className="text-white">458,414</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DESKTOP & TABLET: Three Columns */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4">

                  {/* LEFT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Designation Section - All 4 fields grouped */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-3">DESIGNATION</div>
                      <div className="space-y-3">
                        {/* Mekanism Number */}
                        <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                          <div className="mek-label-uppercase mb-1">MEKANISM</div>
                          <div className="text-white font-bold relative z-10">#1234</div>
                        </div>

                        {/* Rank */}
                        <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                          <div className="mek-label-uppercase mb-1">RANK</div>
                          <div className="mek-value-primary text-2xl relative z-10">2985</div>
                        </div>

                        {/* Corporation */}
                        <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                          <div className="mek-label-uppercase mb-1">CORPORATION</div>
                          <div className="text-white text-sm relative z-10">Apex Industries</div>
                        </div>

                        {/* Employee ID / Custom Name */}
                        <div className="bg-black/40 border border-yellow-500/20 p-3 relative overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                          <div className="mek-label-uppercase mb-1">EMPLOYEE ID</div>
                          <div className="text-white text-sm relative z-10">Golden Striker</div>
                        </div>
                      </div>
                    </div>

                    {/* Employment Status Toggle */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-3">STATUS</div>
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-white font-bold uppercase tracking-wider">
                          {isEmployed ? 'EMPLOYED' : 'IDLE'}
                        </div>
                        <div className="scale-75">
                          <MechanicalToggle
                            checked={isEmployed}
                            onChange={setIsEmployed}
                          />
                        </div>
                        <div className="text-xs text-gray-400 uppercase">Mechanical Toggle</div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER - MEK IMAGE */}
                  <div className="lg:col-span-6 flex items-start justify-center">
                    <div className={`${getCardClasses()} overflow-hidden w-full`}>
                      <img
                        src="/mek-images/1000px/aa2-bl2-hn1.webp"
                        alt="Mek Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Level Progress */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-2">LEVEL PROGRESS</div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">LEVEL 1</span>
                        <span className="text-gray-400">LEVEL 2</span>
                      </div>
                      <div className="relative w-full h-4 bg-black/60 border border-yellow-500/30 mb-2 overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-600" style={{
                          boxShadow: '0 0 10px rgba(250, 182, 23, 0.6)'
                        }}></div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                    </div>

                    {/* Gold Generation */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-2">GOLD GENERATION</div>
                      <div className="space-y-2">
                        <div>
                          <div className="mek-label-uppercase">BASE</div>
                          <div className="text-white">20.0/hr</div>
                        </div>
                        <div>
                          <div className="mek-label-uppercase">EFFECTIVE</div>
                          <div className="text-green-400 font-bold">24.0/hr</div>
                        </div>
                      </div>
                    </div>

                    {/* Gold Produced */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-2">GOLD PRODUCED</div>
                      <div className="space-y-2">
                        <div>
                          <div className="mek-label-uppercase">CURRENT OWNER</div>
                          <div className="mek-value-primary">12,869.015</div>
                        </div>
                        <div>
                          <div className="mek-label-uppercase">ALL TIME</div>
                          <div className="text-white">458,414.324</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variation Cards - Responsive Grid */}
                <div className="mek-card-industrial mek-border-sharp-gold p-4">
                  <div className="mek-label-uppercase mb-3">VARIATION CARDS</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <VariationCard title="HEAD VARIATION" imagePath="/variation-images-art-400px/ae1-gn3-ev1.png" />
                    <VariationCard title="BODY VARIATION" imagePath="/variation-images-art-400px/ak3-aa5-mo1.png" />
                    <VariationCard title="TRAIT VARIATION" imagePath="/variation-images-art-400px/ar1-at1-nm1.png" />
                  </div>
                </div>

                {/* Abilities Tree */}
                <div className="mek-card-industrial mek-border-sharp-gold p-4">
                  <div className="mek-label-uppercase mb-3">ABILITIES TREE</div>
                  <div className="w-full h-64 md:h-80 lg:h-96 bg-black/40 border border-yellow-500/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                    <span className="text-gray-500 relative z-10">Node Tree / Talent Tree Area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel - Fixed to right side, high z-index */}
      <div className="fixed top-4 right-4 z-[10000] w-80 bg-black/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-cyan-500/30 pb-2">
            Style Variations
          </h3>

          {/* Variation Selector Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStyleVariation('default');
              }}
              className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded transition-all ${
                styleVariation === 'default'
                  ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300'
                  : 'bg-black/50 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'
              }`}
            >
              Default
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStyleVariation('variation1');
              }}
              className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded transition-all ${
                styleVariation === 'variation1'
                  ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300'
                  : 'bg-black/50 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'
              }`}
            >
              Var 1
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStyleVariation('variation2');
              }}
              className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded transition-all ${
                styleVariation === 'variation2'
                  ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300'
                  : 'bg-black/50 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'
              }`}
            >
              Var 2
            </button>
          </div>

          {/* Default Style Preview */}
          <div className="mb-4 border border-cyan-500/30 rounded p-3 bg-black/50">
            <div className="text-xs text-cyan-400 uppercase font-bold mb-2">Default: Industrial Yellow</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Font: Orbitron</div>
              <div>• Accent: Yellow/Gold (#fab617)</div>
              <div>• Style: Sharp edges, glass-morphism</div>
              <div>• Layout: Three-column desktop</div>
            </div>
          </div>

          {/* Variation 1 Preview */}
          <div className="mb-4 border border-cyan-500/30 rounded p-3 bg-black/50">
            <div className="text-xs text-cyan-400 uppercase font-bold mb-2">Variation 1: Cyberpunk Cyan</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Font: Rajdhani (condensed)</div>
              <div>• Accent: Cyan/Blue (#00d9ff)</div>
              <div>• Style: Neon glow, rounded corners</div>
              <div>• Layout: Centered single column</div>
            </div>
          </div>

          {/* Variation 2 Preview */}
          <div className="mb-4 border border-cyan-500/30 rounded p-3 bg-black/50">
            <div className="text-xs text-cyan-400 uppercase font-bold mb-2">Variation 2: Military Green</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Font: Share Tech Mono</div>
              <div>• Accent: Olive/Green (#9acd32)</div>
              <div>• Style: Tactical camo, hexagons</div>
              <div>• Layout: Asymmetric grid</div>
            </div>
          </div>

          <div className="text-xs text-cyan-500/70 italic text-center pt-2 border-t border-cyan-500/20">
            Click variation buttons to preview styles
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}

// Reusable Variation Card Component
function VariationCard({ title, imagePath }: { title: string; imagePath?: string }) {
  return (
    <div className="bg-black/30 border border-yellow-500/30 p-4 relative overflow-hidden">
      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
      <div className="mek-label-uppercase mb-3 relative z-10">{title}</div>

      <div className="w-full h-32 bg-black/40 border border-yellow-500/20 flex items-center justify-center mb-3 overflow-hidden relative">
        <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
        {imagePath ? (
          <img
            src={imagePath}
            alt={title}
            className="w-full h-full object-contain relative z-10"
          />
        ) : (
          <span className="text-gray-500 text-xs relative z-10">Image</span>
        )}
      </div>

      <div className="text-white mb-2 relative z-10">Variation Name</div>
      <div className="text-gray-400 text-sm mb-3 relative z-10">3 of 4000</div>

      <div className="space-y-1 text-sm relative z-10">
        <div className="flex justify-between">
          <span className="text-gray-400">Base Essence:</span>
          <span className="text-white">100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Bonus Essence:</span>
          <span className="text-green-400">+25</span>
        </div>
        <div className="flex justify-between border-t border-yellow-500/20 pt-1 mt-1">
          <span className="text-gray-400">Total Essence:</span>
          <span className="mek-value-primary font-bold">125</span>
        </div>
      </div>
    </div>
  );
}
