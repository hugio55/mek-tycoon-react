'use client';

import { useState } from 'react';
import MekProfileLightbox from '@/components/MekProfileLightbox';
import GoldGenerationDetailsLightbox from '@/components/GoldGenerationDetailsLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGoldDetailsOpen, setIsGoldDetailsOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [styleVariation, setStyleVariation] = useState<'default' | 'variation1' | 'variation2'>('default');
  const [cardInteriorStyle, setCardInteriorStyle] = useState<'compact' | 'spacious' | 'modern'>('compact');

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-4">
      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-6 text-yellow-400 uppercase tracking-wider font-orbitron mt-8">
        Mek Profile
      </h1>

      {/* Open Lightbox Button */}
      <button
        onClick={() => setIsLightboxOpen(true)}
        className="mek-button-primary px-8 py-4 text-lg font-bold uppercase tracking-wider mb-8"
      >
        View Mek Details
      </button>

      {/* Gold Generation Card */}
      <div className="w-full max-w-md bg-black/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-6 relative overflow-hidden">
        {/* Industrial decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

        {/* Card Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
            Gold Generation
          </h2>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Base Rate:</span>
            <span className="text-xl font-bold text-yellow-400">20.0 g/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Effective Rate:</span>
            <span className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>
              24.0 g/hr
            </span>
          </div>
        </div>

        {/* Details Button */}
        <button
          onClick={() => setIsGoldDetailsOpen(true)}
          className="w-full mek-button-secondary px-4 py-3 text-sm font-bold uppercase tracking-wider"
        >
          View Details
        </button>
      </div>

      {/* Debug Toggle Button - Fixed Position */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 z-[10000] px-4 py-2 bg-black/80 border-2 border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all"
      >
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Style Variations</span>
      </button>

      {/* Debug Panel - Fixed Position with Style Dropdowns */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 z-[10000] w-72 bg-black/95 border-2 border-cyan-500/50 rounded-lg p-5 shadow-2xl">
          <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-cyan-500/30 pb-2">
            Style Controls
          </h3>

          {/* Dropdown 1: Page Styling */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Overall Theme
            </label>
            <select
              value={styleVariation}
              onChange={(e) => setStyleVariation(e.target.value as 'default' | 'variation1' | 'variation2')}
              className="w-full bg-black/60 border-2 border-cyan-500/50 rounded px-3 py-2 text-cyan-300 text-sm font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
            >
              <option value="default">Industrial Yellow</option>
              <option value="variation1">Cyberpunk Cyan</option>
              <option value="variation2">Military Green</option>
            </select>
          </div>

          {/* Dropdown 2: Card Interior Styling */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Card Layout
            </label>
            <select
              value={cardInteriorStyle}
              onChange={(e) => setCardInteriorStyle(e.target.value as 'compact' | 'spacious' | 'modern')}
              className="w-full bg-black/60 border-2 border-cyan-500/50 rounded px-3 py-2 text-cyan-300 text-sm font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
            >
              <option value="compact">Classic Stack</option>
              <option value="spacious">Side-by-Side</option>
              <option value="modern">Minimal Centered</option>
            </select>
          </div>

          {/* Current Selection Display */}
          <div className="pt-3 border-t border-cyan-500/30">
            <div className="text-xs text-gray-400 mb-1">Active Styles:</div>
            <div className="text-xs text-cyan-300 space-y-1">
              <div>Theme: <span className="font-bold">
                {styleVariation === 'default' && 'Industrial Yellow'}
                {styleVariation === 'variation1' && 'Cyberpunk Cyan'}
                {styleVariation === 'variation2' && 'Military Green'}
              </span></div>
              <div>Layout: <span className="font-bold">
                {cardInteriorStyle === 'compact' && 'Classic Stack'}
                {cardInteriorStyle === 'spacious' && 'Side-by-Side'}
                {cardInteriorStyle === 'modern' && 'Minimal Centered'}
              </span></div>
            </div>
          </div>
        </div>
      )}

      {/* Mek Profile Lightbox Modal */}
      <MekProfileLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        styleVariation={styleVariation}
        onStyleVariationChange={setStyleVariation}
        cardInteriorStyle={cardInteriorStyle}
      />

      {/* Gold Generation Details Lightbox */}
      <GoldGenerationDetailsLightbox
        isOpen={isGoldDetailsOpen}
        onClose={() => setIsGoldDetailsOpen(false)}
      />
    </div>
  );
}
