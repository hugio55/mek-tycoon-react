'use client';

import { useState } from 'react';
import MekProfileLightbox from '@/components/MekProfileLightbox';
import GoldGenerationDetailsLightbox from '@/components/GoldGenerationDetailsLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGoldDetailsOpen, setIsGoldDetailsOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [styleVariation, setStyleVariation] = useState<'default' | 'variation1' | 'variation2'>('default');

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

      {/* Debug Panel - Fixed Position with Style Variations */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 z-[10000] w-80 bg-black/95 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-cyan-400 text-lg font-bold uppercase tracking-wider mb-4 border-b border-cyan-500/30 pb-2">
            Profile Style Variations
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Click buttons to see different styling approaches for the Mek Profile lightbox
          </p>

          {/* Variation Buttons */}
          <div className="space-y-3">
            {/* Option 1: Current Industrial (Default) */}
            <button
              onClick={() => setStyleVariation('default')}
              className={`w-full text-left p-4 rounded border-2 transition-all ${
                styleVariation === 'default'
                  ? 'border-yellow-500 bg-yellow-500/20'
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-yellow-400 mb-1">OPTION 1: Industrial</div>
              <div className="text-xs text-gray-400">
                Current style: Yellow/gold accents, Orbitron font, sharp borders, grunge overlays
              </div>
            </button>

            {/* Option 2: Alternative Font/Layout */}
            <button
              onClick={() => setStyleVariation('variation1')}
              className={`w-full text-left p-4 rounded border-2 transition-all ${
                styleVariation === 'variation1'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-blue-400 mb-1">OPTION 2: Cyber Tech</div>
              <div className="text-xs text-gray-400">
                Blue/cyan accents, rounded corners, softer shadows, tech-focused
              </div>
            </button>

            {/* Option 3: Different Color Scheme */}
            <button
              onClick={() => setStyleVariation('variation2')}
              className={`w-full text-left p-4 rounded border-2 transition-all ${
                styleVariation === 'variation2'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-purple-400 mb-1">OPTION 3: Neon Fusion</div>
              <div className="text-xs text-gray-400">
                Purple/magenta gradient, glowing effects, modern minimalist
              </div>
            </button>
          </div>

          {/* Active Style Info */}
          <div className="mt-6 pt-4 border-t border-cyan-500/30">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Currently Active:</div>
            <div className="text-sm font-bold">
              {styleVariation === 'default' && <span className="text-yellow-400">Industrial Style</span>}
              {styleVariation === 'variation1' && <span className="text-blue-400">Cyber Tech Style</span>}
              {styleVariation === 'variation2' && <span className="text-purple-400">Neon Fusion Style</span>}
            </div>
          </div>

          {/* Implementation Note */}
          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
            <div className="text-xs text-cyan-400">
              <span className="font-bold">Note:</span> Style variations are for visual comparison only.
              Click options to see how different approaches would look.
            </div>
          </div>
        </div>
      )}

      {/* Mek Profile Lightbox Modal */}
      <MekProfileLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        styleVariation={styleVariation}
      />

      {/* Gold Generation Details Lightbox */}
      <GoldGenerationDetailsLightbox
        isOpen={isGoldDetailsOpen}
        onClose={() => setIsGoldDetailsOpen(false)}
      />
    </div>
  );
}
