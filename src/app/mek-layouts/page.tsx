'use client';

import { useState } from 'react';
import MekProfileLightbox from '@/components/MekProfileLightbox';
import GoldGenerationDetailsLightbox from '@/components/GoldGenerationDetailsLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGoldDetailsOpen, setIsGoldDetailsOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Debug Panel</span>
      </button>

      {/* Debug Panel - Fixed Position */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 z-[10000] w-96 bg-black/95 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-cyan-400 text-lg font-bold uppercase tracking-wider mb-4 border-b border-cyan-500/30 pb-2">
            Button Design Variations
          </h3>

          {/* Variation 1: Compact Corner Position */}
          <div className="mb-6 border border-cyan-500/30 rounded-lg p-4 bg-black/50">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-bold">
              Variation 1: Compact Corner
            </div>
            <div className="w-full max-w-sm bg-black/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

              <div className="text-center mb-3">
                <h3 className="text-lg font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
                  Gold Generation
                </h3>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Base:</span>
                  <span className="text-base font-bold text-yellow-400">20.0 g/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Effective:</span>
                  <span className="text-lg font-bold text-green-400">24.0 g/hr</span>
                </div>
              </div>

              {/* Small button in corner */}
              <div className="flex justify-end">
                <button
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 transition-all rounded"
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Variation 2: Icon Button with Hover Info */}
          <div className="mb-6 border border-cyan-500/30 rounded-lg p-4 bg-black/50">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-bold">
              Variation 2: Icon + Hover Tooltip
            </div>
            <div className="w-full max-w-sm bg-black/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

              {/* Info icon in top-right */}
              <button className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 hover:bg-yellow-500/40 transition-all">
                <span className="text-sm font-bold">i</span>
              </button>

              {/* Tooltip on hover */}
              <div className="absolute top-10 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/95 border border-yellow-500/50 rounded px-2 py-1 text-xs text-yellow-400 whitespace-nowrap pointer-events-none">
                Click for buff breakdown
              </div>

              <div className="text-center mb-3">
                <h3 className="text-lg font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
                  Gold Generation
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Base:</span>
                  <span className="text-base font-bold text-yellow-400">20.0 g/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Effective:</span>
                  <span className="text-lg font-bold text-green-400">24.0 g/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variation 3: Large Prominent Button */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-black/50">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-bold">
              Variation 3: Large Prominent
            </div>
            <div className="w-full max-w-sm bg-black/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

              <div className="text-center mb-3">
                <h3 className="text-lg font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
                  Gold Generation
                </h3>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Base:</span>
                  <span className="text-base font-bold text-yellow-400">20.0 g/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Effective:</span>
                  <span className="text-lg font-bold text-green-400">24.0 g/hr</span>
                </div>
              </div>

              {/* Full width button */}
              <button
                className="w-full mek-button-secondary px-4 py-3 text-sm font-bold uppercase tracking-wider"
              >
                View Buff Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mek Profile Lightbox Modal */}
      <MekProfileLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

      {/* Gold Generation Details Lightbox */}
      <GoldGenerationDetailsLightbox
        isOpen={isGoldDetailsOpen}
        onClose={() => setIsGoldDetailsOpen(false)}
      />
    </div>
  );
}
