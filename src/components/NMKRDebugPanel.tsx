'use client';

import { useState } from 'react';
import NMKRPayLightbox from './NMKRPayLightbox';

export default function NMKRDebugPanel() {
  const [showLightbox, setShowLightbox] = useState(false);
  const [testWalletAddress] = useState('test_wallet_address_for_nmkr_testing');

  return (
    <>
      {/* Fixed Debug Panel on Right Side */}
      <div className="fixed top-20 right-4 z-[9998] w-64">
        <div className="bg-purple-900/90 border-2 border-purple-500 rounded-lg p-4 backdrop-blur-sm">
          {/* Debug Label */}
          <div className="mb-3 text-center">
            <div className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded">
              DEBUG PANEL
            </div>
          </div>

          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide text-center">
            NMKR Lightbox States
          </h3>

          {/* Button to trigger lightbox */}
          <div className="space-y-2">
            <button
              onClick={() => setShowLightbox(true)}
              className="w-full px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors text-sm font-semibold"
            >
              Show NMKR Flow
            </button>

            <div className="text-xs text-purple-300 space-y-1 mt-3 p-2 bg-purple-950/50 rounded border border-purple-500/30">
              <p className="font-bold text-purple-200">Flow States:</p>
              <p>1. Payment window</p>
              <p>2. Processing/Loading</p>
              <p>3. Success/Error</p>
            </div>

            <div className="text-xs text-purple-400 mt-2 p-2 bg-purple-950/50 rounded border border-purple-500/30">
              <p className="font-bold text-purple-200 mb-1">Note:</p>
              <p>The lightbox will automatically transition through states when the NMKR payment window closes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* NMKR Payment Lightbox */}
      {showLightbox && (
        <NMKRPayLightbox
          walletAddress={testWalletAddress}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
}
