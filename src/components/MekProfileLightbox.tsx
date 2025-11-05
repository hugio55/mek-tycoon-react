"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "@/styles/global-design-system.css";

interface MekProfileLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MekProfileLightbox({ isOpen, onClose }: MekProfileLightboxProps) {
  const [mounted, setMounted] = useState(false);

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

      {/* Lightbox Container - Matching EssenceDistributionLightbox styling */}
      <div
        className="relative w-[960px] max-w-[95vw] max-h-[90vh] bg-black/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
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
                  <h1 className="text-5xl font-bold font-orbitron tracking-wider text-center mb-1">
                    <span className="text-yellow-400">MEK</span>{" "}
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
                <div className="lg:hidden border-4 border-blue-500 bg-gray-900/50 p-4">
                  <div className="text-xs text-blue-500 font-bold mb-3 text-center">MEK IMAGE</div>
                  <div className="w-full aspect-square max-w-xs mx-auto border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-center">Large Mek Image<br/>400x400</span>
                  </div>
                </div>

                {/* MOBILE: Primary Info Panel (Designation + Rank + Operator grouped) */}
                <div className="lg:hidden border-2 border-yellow-500 bg-gray-900/50 p-4">
                  <div className="text-xs text-yellow-500 font-bold mb-3">MEK INFORMATION</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Designation */}
                    <div className="col-span-2 border border-yellow-500/30 bg-gray-800/50 p-3">
                      <div className="text-xs text-yellow-500 font-bold mb-1">DESIGNATION</div>
                      <div className="text-white font-bold">Mekanism #1234</div>
                    </div>

                    {/* Rank */}
                    <div className="border border-yellow-500/30 bg-gray-800/50 p-3">
                      <div className="text-xs text-yellow-500 font-bold mb-1">RANK</div>
                      <div className="text-white text-xl font-bold">2985</div>
                    </div>

                    {/* Active Status */}
                    <div className="border border-cyan-500/30 bg-gray-800/50 p-3">
                      <div className="text-xs text-cyan-500 font-bold mb-1">STATUS</div>
                      <div className="text-white">IDLE</div>
                    </div>

                    {/* Operator */}
                    <div className="col-span-2 border border-yellow-500/30 bg-gray-800/50 p-3">
                      <div className="text-xs text-yellow-500 font-bold mb-1">OPERATOR</div>
                      <div className="text-white text-sm break-all">staked9...egjf8r</div>
                    </div>
                  </div>
                </div>

                {/* MOBILE: Level & Gold Panel (grouped together) */}
                <div className="lg:hidden space-y-3">
                  {/* Level Progress */}
                  <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
                    <div className="text-xs text-purple-500 font-bold mb-2">LEVEL PROGRESS</div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>LEVEL 1</span>
                      <span>LEVEL 2</span>
                    </div>
                    <div className="w-full h-4 border border-gray-600 bg-gray-800 mb-2">
                      <div className="h-full w-3/4 bg-yellow-500"></div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                  </div>

                  {/* Gold Stats Combined */}
                  <div className="border-2 border-green-500 bg-gray-900/50 p-4">
                    <div className="text-xs text-green-500 font-bold mb-3">GOLD STATS</div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Gold Generation */}
                      <div>
                        <div className="text-xs text-gray-400 mb-2">GENERATION</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base:</span>
                            <span className="text-white">20.0/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-400 font-bold">Effective:</span>
                            <span className="text-green-400 font-bold">24.0/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Gold Produced */}
                      <div>
                        <div className="text-xs text-gray-400 mb-2">PRODUCED</div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <div className="text-xs text-gray-400">Current:</div>
                            <div className="text-white">12,869</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">All Time:</div>
                            <div className="text-white">458,414</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Modifiers */}
                  <div className="border-2 border-green-500 bg-gray-900/50 p-4">
                    <div className="text-xs text-green-500 font-bold mb-2">ACTIVE MODIFIERS</div>
                    <div className="text-sm space-y-1">
                      <div className="text-green-400">+2.5 gold/hr</div>
                      <div className="text-green-400">+5% gold rate</div>
                      <div className="text-green-400">+1% bank interest</div>
                    </div>
                  </div>
                </div>

                {/* DESKTOP & TABLET: Three Columns */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4">

                  {/* LEFT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Designation */}
                    <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-yellow-500 font-bold mb-2">DESIGNATION</div>
                      <div className="text-white font-bold">Mekanism #1234</div>
                    </div>

                    {/* Rank */}
                    <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-yellow-500 font-bold mb-2">RANK</div>
                      <div className="text-white text-2xl font-bold">2985</div>
                    </div>

                    {/* Operator/Corporation */}
                    <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-yellow-500 font-bold mb-2">OPERATOR</div>
                      <div className="text-white text-sm break-all">staked9...egjf8r</div>
                    </div>

                    {/* Active Status */}
                    <div className="border-2 border-cyan-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-cyan-500 font-bold mb-2">IDLE</div>
                      <div className="text-white">Toggle Switch</div>
                    </div>

                    {/* Active Modifiers */}
                    <div className="border-2 border-green-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-green-500 font-bold mb-2">ACTIVE MODIFIERS</div>
                      <div className="text-sm space-y-1">
                        <div className="text-green-400">+2.5 gold/hr</div>
                        <div className="text-green-400">+5% gold rate</div>
                        <div className="text-green-400">+1% bank interest</div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER - MEK IMAGE */}
                  <div className="lg:col-span-6 flex items-start justify-center">
                    <div className="border-4 border-blue-500 bg-gray-900/50 p-8 w-full">
                      <div className="text-xs text-blue-500 font-bold mb-4 text-center">MEK IMAGE AREA</div>
                      <div className="w-full aspect-square max-w-md mx-auto border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-500 text-center">Large Mek Image<br/>400x400</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Level Progress */}
                    <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-purple-500 font-bold mb-2">LEVEL PROGRESS</div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>LEVEL 1</span>
                        <span>LEVEL 2</span>
                      </div>
                      <div className="w-full h-4 border border-gray-600 bg-gray-800 mb-2">
                        <div className="h-full w-3/4 bg-yellow-500"></div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                    </div>

                    {/* Gold Generation */}
                    <div className="border-2 border-green-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-green-500 font-bold mb-2">GOLD GENERATION</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-400">BASE</div>
                          <div className="text-white">20.0/hr</div>
                        </div>
                        <div>
                          <div className="text-xs text-green-400 font-bold">EFFECTIVE</div>
                          <div className="text-green-400 font-bold">24.0/hr</div>
                        </div>
                      </div>
                    </div>

                    {/* Gold Produced */}
                    <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
                      <div className="text-xs text-yellow-500 font-bold mb-2">GOLD PRODUCED</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-400">CURRENT OWNER</div>
                          <div className="text-white">12,869.015</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">ALL TIME</div>
                          <div className="text-white">458,414.324</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variation Cards - Responsive Grid */}
                <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
                  <div className="text-xs text-purple-500 font-bold mb-3">VARIATION CARDS</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <VariationCard title="HEAD VARIATION" imagePath="/variation-images-art-400px/ae1-gn3-ev1.png" />
                    <VariationCard title="BODY VARIATION" imagePath="/variation-images-art-400px/ak3-aa5-mo1.png" />
                    <VariationCard title="TRAIT VARIATION" imagePath="/variation-images-art-400px/ar1-at1-nm1.png" />
                  </div>
                </div>

                {/* Abilities Tree */}
                <div className="border-2 border-red-500 bg-gray-900/50 p-4">
                  <div className="text-xs text-red-500 font-bold mb-3">ABILITIES TREE</div>
                  <div className="w-full h-64 md:h-80 lg:h-96 border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">Node Tree / Talent Tree Area</span>
                  </div>
                </div>
              </div>
            </div>
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
    <div className="border-2 border-gray-600 bg-gray-800 p-4">
      <div className="text-sm text-yellow-500 mb-3 font-bold">{title}</div>

      <div className="w-full h-32 border border-gray-600 bg-gray-700 flex items-center justify-center mb-3 overflow-hidden">
        {imagePath ? (
          <img
            src={imagePath}
            alt={title}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-gray-500 text-xs">Image</span>
        )}
      </div>

      <div className="text-white mb-2">Variation Name</div>
      <div className="text-gray-400 text-sm mb-3">3 of 4000</div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Base Essence:</span>
          <span className="text-white">100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Bonus Essence:</span>
          <span className="text-green-400">+25</span>
        </div>
        <div className="flex justify-between border-t border-gray-600 pt-1">
          <span className="text-gray-400">Total Essence:</span>
          <span className="text-yellow-500 font-bold">125</span>
        </div>
      </div>
    </div>
  );
}
