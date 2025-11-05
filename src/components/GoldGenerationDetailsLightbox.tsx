"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "@/styles/global-design-system.css";

interface GoldGenerationDetailsLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock buff data
const mockBuffs = [
  { source: "Mek 1432", amount: 0.3, unit: "g/h" },
  { source: "Slot 4", amount: 1.2, unit: "G/H" },
  { source: "Mek 2187", amount: 0.5, unit: "g/h" },
  { source: "Slot 7", amount: 0.8, unit: "G/H" },
  { source: "Mek 3901", amount: 0.4, unit: "g/h" },
  { source: "Talent: Gold Rush", amount: 0.6, unit: "g/h" },
  { source: "Mek 892", amount: 0.2, unit: "g/h" }
];

export default function GoldGenerationDetailsLightbox({ isOpen, onClose }: GoldGenerationDetailsLightboxProps) {
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div
        className="relative w-[600px] max-w-[95vw] max-h-[90vh] bg-black/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl flex flex-col"
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
                  <h1 className="text-4xl font-bold font-orbitron tracking-wider text-center mb-1">
                    <span className="text-yellow-400">GOLD GENERATION</span>{" "}
                    <span className="text-gray-400">BUFFS</span>
                  </h1>
                  <p className="text-center text-gray-400 text-xs max-w-2xl mx-auto" style={{
                    lineHeight: '1.6'
                  }}>
                    Detailed breakdown of all buffs contributing to your gold generation rate.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6 pb-6">
              {/* Summary Section */}
              <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-4 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Base Rate</div>
                    <div className="text-2xl font-bold text-yellow-400">20.0 g/hr</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Buffs</div>
                    <div className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>
                      +4.0 g/hr
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-yellow-500/30">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm text-gray-400 uppercase tracking-wider">Effective Rate:</div>
                    <div className="text-3xl font-bold text-green-400" style={{ textShadow: '0 0 15px rgba(34, 197, 94, 0.6)' }}>
                      24.0 g/hr
                    </div>
                  </div>
                </div>
              </div>

              {/* Buff List */}
              <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg overflow-hidden">
                <div className="bg-black/60 border-b border-yellow-500/30 px-4 py-3">
                  <h2 className="text-lg font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
                    Active Buffs
                  </h2>
                </div>

                <div className="divide-y divide-yellow-500/20">
                  {mockBuffs.map((buff, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-yellow-500/10 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon/Indicator */}
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                          <span className="text-yellow-400 text-xs font-bold">
                            {buff.source.includes("Mek") ? "M" : buff.source.includes("Slot") ? "S" : "T"}
                          </span>
                        </div>

                        {/* Source Name */}
                        <div>
                          <div className="text-white font-medium">{buff.source}</div>
                          <div className="text-xs text-gray-400">Buff Source</div>
                        </div>
                      </div>

                      {/* Buff Amount */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          +{buff.amount} {buff.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Summary */}
                <div className="bg-black/80 border-t-2 border-yellow-500/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 uppercase tracking-wider">Total from {mockBuffs.length} sources:</span>
                    <span className="text-xl font-bold text-green-400">+4.0 g/hr</span>
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
