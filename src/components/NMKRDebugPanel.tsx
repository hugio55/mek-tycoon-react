'use client';

import { useState, useEffect } from 'react';
import NMKRPayLightbox from './NMKRPayLightbox';

type DebugState = 'loading' | 'success' | null;

export default function NMKRDebugPanel() {
  const [debugState, setDebugState] = useState<DebugState>(null);
  const [claimDebugState, setClaimDebugState] = useState<'claimed' | 'unclaimed'>('unclaimed');

  // Load claim debug state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('debug_claim_state');
    if (saved === 'claimed' || saved === 'unclaimed') {
      setClaimDebugState(saved);
    }
  }, []);

  // Toggle claim state
  const toggleClaimState = () => {
    const newState = claimDebugState === 'claimed' ? 'unclaimed' : 'claimed';
    setClaimDebugState(newState);
    localStorage.setItem('debug_claim_state', newState);
    // Trigger a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

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

          {/* Claim State Toggle */}
          <div className="mb-4 pb-4 border-b border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide text-center">
              Claim Status
            </h3>
            <button
              onClick={toggleClaimState}
              className={`w-full px-4 py-2 border rounded transition-colors text-sm font-semibold ${
                claimDebugState === 'claimed'
                  ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                  : 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
              }`}
            >
              {claimDebugState === 'claimed' ? '✓ Claimed' : '○ Not Claimed'}
            </button>
            <p className="text-xs text-purple-300 mt-1 text-center">
              {claimDebugState === 'claimed' ? 'Showing claimed state' : 'Showing unclaimed state'}
            </p>
          </div>

          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide text-center">
            NMKR Lightbox States
          </h3>

          {/* Simple debug buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setDebugState('loading')}
              className="w-full px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors text-sm font-semibold"
            >
              Show Loading State
            </button>

            <button
              onClick={() => setDebugState('success')}
              className="w-full px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm font-semibold"
            >
              Show Success State
            </button>

            <div className="text-xs text-purple-300 space-y-1 mt-3 p-2 bg-purple-950/50 rounded border border-purple-500/30">
              <p className="font-bold text-purple-200">States:</p>
              <p>Loading = Processing payment</p>
              <p>Success = NFT claimed</p>
            </div>
          </div>
        </div>
      </div>

      {/* NMKR Payment Lightbox - show specific debug state */}
      {debugState && (
        <NMKRPayLightbox
          debugState={debugState}
          onClose={() => setDebugState(null)}
        />
      )}
    </>
  );
}
