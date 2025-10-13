"use client";

import { useState, useEffect } from 'react';

interface MintNFTLightboxVariationSelectorProps {
  currentVariation: 'standard' | 'holographic' | 'tactical';
  onChange: (variation: 'standard' | 'holographic' | 'tactical') => void;
}

export default function MintNFTLightboxVariationSelector({
  currentVariation,
  onChange
}: MintNFTLightboxVariationSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variations = [
    { id: 'standard' as const, label: 'Standard', description: 'Industrial yellow/gold design' },
    { id: 'holographic' as const, label: 'Holographic', description: 'Cyan holographic HUD' },
    { id: 'tactical' as const, label: 'Tactical', description: 'Minimal tactical display' },
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed left-4 top-20 z-[10000] bg-purple-500/90 hover:bg-purple-400 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 border-purple-300 shadow-lg"
        style={{ fontFamily: 'Orbitron, sans-serif' }}
      >
        Lightbox Styles
      </button>
    );
  }

  return (
    <div className="fixed left-4 top-20 z-[10000] w-64 bg-black/95 border-2 border-purple-500/50 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-transparent border-b-2 border-purple-500/30 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 animate-pulse" />
          <span className="text-purple-400 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Mint Lightbox
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-purple-400 hover:text-purple-300 text-sm font-bold"
        >
          ×
        </button>
      </div>

      {/* Current Variation */}
      <div className="px-3 py-2 border-b border-purple-500/20">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Style:</div>
        <div className="text-purple-400 font-bold text-sm uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {variations.find(v => v.id === currentVariation)?.label}
        </div>
      </div>

      {/* Variation Buttons */}
      <div className="p-3 space-y-2">
        {variations.map((variant) => {
          const isActive = variant.id === currentVariation;
          return (
            <button
              key={variant.id}
              onClick={() => onChange(variant.id)}
              className={`w-full text-left px-3 py-2 border-2 transition-all ${
                isActive
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 cursor-default'
                  : 'bg-black/50 border-purple-500/20 text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer'
              }`}
            >
              <div className="font-bold text-xs uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {variant.label}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {variant.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-purple-500/20">
        <p className="text-[10px] text-gray-500">
          Complete an event mission to see the lightbox
        </p>
      </div>
    </div>
  );
}
