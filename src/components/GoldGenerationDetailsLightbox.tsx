"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "@/styles/global-design-system.css";

interface GoldGenerationDetailsLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  layout?: 'classic' | 'compact-grid' | 'detailed-cards' | 'minimal';
}

// Mock buff data
const mockBuffs = [
  { source: "Mek #1432", amount: 0.3, unit: "g/h" },
  { source: "Slot 4", amount: 1.2, unit: "G/H", details: "Slot 4 provides bonus gold generation based on equipped item" },
  { source: "Mek #2187", amount: 0.5, unit: "g/h" },
  { source: "Slot 7", amount: 0.8, unit: "G/H", details: "Slot 7 grants additional gold from trait synergies" },
  { source: "Mek #3901", amount: 0.4, unit: "g/h" },
  { source: "Talent: Gold Rush", amount: 0.6, unit: "g/h", details: "Talent: Gold Rush increases gold generation by 15%" },
  { source: "Mek #892", amount: 0.2, unit: "g/h" }
];

export default function GoldGenerationDetailsLightbox({ isOpen, onClose, layout = 'classic' }: GoldGenerationDetailsLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredBuff, setHoveredBuff] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Render Classic Stack Layout (Original)
  const renderClassicLayout = () => (
    <div className="divide-y divide-yellow-500/20">
      {mockBuffs.map((buff, index) => {
        const isMek = buff.source.startsWith("Mek #");
        const hasTooltip = !isMek && buff.details;

        return (
          <div
            key={index}
            className={`px-3 py-2 flex items-center justify-between transition-all ${
              isMek
                ? 'hover:bg-yellow-500/15 cursor-pointer hover:scale-[1.02] hover:border-l-4 hover:border-yellow-400/60'
                : hasTooltip
                ? 'hover:bg-blue-500/10 cursor-help'
                : 'hover:bg-yellow-500/5'
            }`}
            onMouseEnter={() => hasTooltip && setHoveredBuff(buff.source)}
            onMouseLeave={() => hasTooltip && setHoveredBuff(null)}
            onMouseMove={hasTooltip ? handleMouseMove : undefined}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isMek
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : buff.source.includes("Slot")
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-green-500/20 border border-green-500/50'
              }`}>
                <span className={`text-[10px] font-bold ${
                  isMek ? 'text-yellow-400' : buff.source.includes("Slot") ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {buff.source.includes("Mek") ? "M" : buff.source.includes("Slot") ? "S" : "T"}
                </span>
              </div>
              <div>
                <div className={`text-sm font-medium ${isMek ? 'text-yellow-300' : 'text-white'}`}>
                  {buff.source}
                </div>
                <div className="text-[10px] text-gray-400">Buff Source</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-green-400">
                +{buff.amount} {buff.unit}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Compact Grid Layout (2 columns)
  const renderCompactGridLayout = () => (
    <div className="grid grid-cols-2 gap-2 p-2">
      {mockBuffs.map((buff, index) => {
        const isMek = buff.source.startsWith("Mek #");
        const hasTooltip = !isMek && buff.details;

        return (
          <div
            key={index}
            className={`bg-black/40 border border-yellow-500/30 rounded p-2 transition-all ${
              isMek
                ? 'hover:border-yellow-400/60 hover:bg-yellow-500/10 cursor-pointer'
                : hasTooltip
                ? 'hover:bg-blue-500/10 cursor-help'
                : 'hover:bg-yellow-500/5'
            }`}
            onMouseEnter={() => hasTooltip && setHoveredBuff(buff.source)}
            onMouseLeave={() => hasTooltip && setHoveredBuff(null)}
            onMouseMove={hasTooltip ? handleMouseMove : undefined}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isMek
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : buff.source.includes("Slot")
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-green-500/20 border border-green-500/50'
              }`}>
                <span className={`text-[8px] font-bold ${
                  isMek ? 'text-yellow-400' : buff.source.includes("Slot") ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {buff.source.includes("Mek") ? "M" : buff.source.includes("Slot") ? "S" : "T"}
                </span>
              </div>
              <div className={`text-xs font-medium truncate ${isMek ? 'text-yellow-300' : 'text-white'}`}>
                {buff.source}
              </div>
            </div>
            <div className="text-sm font-bold text-green-400 text-center">
              +{buff.amount} {buff.unit}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Detailed Cards Layout (Large cards with more spacing)
  const renderDetailedCardsLayout = () => (
    <div className="grid gap-3 p-3">
      {mockBuffs.map((buff, index) => {
        const isMek = buff.source.startsWith("Mek #");
        const hasTooltip = !isMek && buff.details;

        return (
          <div
            key={index}
            className={`bg-black/60 backdrop-blur-sm border-2 rounded-lg p-4 relative overflow-hidden transition-all ${
              isMek
                ? 'border-yellow-500/50 hover:border-yellow-400 hover:bg-yellow-500/5 cursor-pointer'
                : buff.source.includes("Slot")
                ? 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/5'
                : 'border-green-500/50 hover:border-green-400 hover:bg-green-500/5'
            } ${hasTooltip ? 'cursor-help' : ''}`}
            onMouseEnter={() => hasTooltip && setHoveredBuff(buff.source)}
            onMouseLeave={() => hasTooltip && setHoveredBuff(null)}
            onMouseMove={hasTooltip ? handleMouseMove : undefined}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-400/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-400/40" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isMek
                    ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                    : buff.source.includes("Slot")
                    ? 'bg-blue-500/20 border-2 border-blue-500/50'
                    : 'bg-green-500/20 border-2 border-green-500/50'
                }`}>
                  <span className={`text-sm font-bold ${
                    isMek ? 'text-yellow-400' : buff.source.includes("Slot") ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {buff.source.includes("Mek") ? "M" : buff.source.includes("Slot") ? "S" : "T"}
                  </span>
                </div>
                <div>
                  <div className={`text-base font-medium ${isMek ? 'text-yellow-300' : 'text-white'}`}>
                    {buff.source}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Buff Source</div>
                </div>
              </div>
              <div className="text-xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}>
                +{buff.amount} {buff.unit}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Minimal List Layout (Compact, no icons)
  const renderMinimalLayout = () => (
    <div className="divide-y divide-yellow-500/10">
      {mockBuffs.map((buff, index) => {
        const isMek = buff.source.startsWith("Mek #");
        const hasTooltip = !isMek && buff.details;

        return (
          <div
            key={index}
            className={`px-4 py-1.5 flex items-center justify-between transition-all ${
              isMek
                ? 'hover:bg-yellow-500/10 cursor-pointer'
                : hasTooltip
                ? 'hover:bg-blue-500/5 cursor-help'
                : 'hover:bg-yellow-500/5'
            }`}
            onMouseEnter={() => hasTooltip && setHoveredBuff(buff.source)}
            onMouseLeave={() => hasTooltip && setHoveredBuff(null)}
            onMouseMove={hasTooltip ? handleMouseMove : undefined}
          >
            <span className={`text-xs font-medium ${isMek ? 'text-yellow-300' : 'text-gray-300'}`}>
              {buff.source}
            </span>
            <span className="text-sm font-bold text-green-400">
              +{buff.amount} {buff.unit}
            </span>
          </div>
        );
      })}
    </div>
  );

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
          className="absolute top-3 right-3 z-50 flex items-center justify-center hover:scale-110 transition-transform"
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

                <div className="max-w-7xl mx-auto px-4 py-2">
                  <h1 className="text-3xl font-bold font-orbitron tracking-wider text-center mb-0.5">
                    <span className="text-yellow-400">GOLD GENERATION</span>{" "}
                    <span className="text-gray-400">BUFFS</span>
                  </h1>
                  <p className="text-center text-gray-400 text-[10px] max-w-2xl mx-auto" style={{
                    lineHeight: '1.4'
                  }}>
                    Detailed breakdown of all buffs contributing to your gold generation rate.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-3 pb-3">
              {/* Summary Section */}
              <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-3 mb-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Base Rate</div>
                    <div className="text-xl font-bold text-yellow-400">20.0 g/hr</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Total Buffs</div>
                    <div className="text-xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>
                      +4.0 g/hr
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-yellow-500/30">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Effective Rate:</div>
                    <div className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 15px rgba(34, 197, 94, 0.6)' }}>
                      24.0 g/hr
                    </div>
                  </div>
                </div>
              </div>

              {/* Buff List - Layout-Specific Wrapper */}
              {(layout === 'classic' || layout === 'compact-grid' || layout === 'minimal') && (
                <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg overflow-hidden">
                  <div className="bg-black/60 border-b border-yellow-500/30 px-3 py-2">
                    <h2 className="text-base font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
                      Active Buffs
                    </h2>
                  </div>

                  {/* Dynamic Layout Rendering */}
                  {layout === 'classic' && renderClassicLayout()}
                  {layout === 'compact-grid' && renderCompactGridLayout()}
                  {layout === 'minimal' && renderMinimalLayout()}

                  {/* Footer Summary */}
                  <div className="bg-black/80 border-t-2 border-yellow-500/40 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">
                        {layout === 'compact-grid' || layout === 'minimal' ? 'Total:' : `Total from ${mockBuffs.length} sources:`}
                      </span>
                      <span className="text-lg font-bold text-green-400">+4.0 g/hr</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Cards Layout - Different Structure */}
              {layout === 'detailed-cards' && (
                <div>
                  <h2 className="text-base font-bold font-orbitron text-yellow-400 uppercase tracking-wider px-1 mb-3">
                    Active Buffs
                  </h2>
                  {renderDetailedCardsLayout()}
                  <div className="bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 uppercase tracking-wider">Total from {mockBuffs.length} sources:</span>
                      <span className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 15px rgba(34, 197, 94, 0.6)' }}>
                        +4.0 g/hr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tooltip - Follows mouse cursor */}
        {hoveredBuff && mockBuffs.find(b => b.source === hoveredBuff)?.details && (
          <div
            className="fixed z-[10000] pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 15}px`,
              top: `${tooltipPosition.y + 15}px`,
            }}
          >
            <div className="bg-black/95 backdrop-blur-sm border-2 border-blue-500/50 rounded px-3 py-2 shadow-2xl max-w-xs">
              <div className="text-blue-400 text-xs font-bold mb-1 uppercase tracking-wider">
                {hoveredBuff}
              </div>
              <div className="text-white text-xs leading-snug">
                {mockBuffs.find(b => b.source === hoveredBuff)?.details}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
