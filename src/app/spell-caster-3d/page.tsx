'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const SpellCasterCanvas = dynamic(() => import('./SpellCasterCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-yellow-400 text-2xl font-orbitron">Loading Spell Caster...</div>
    </div>
  )
});

const ShapeKnockdown = dynamic(() => import('./ShapeKnockdown2D'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-yellow-400 text-2xl font-orbitron">Loading Shape Knockdown...</div>
    </div>
  )
});

export default function SpellCaster3DPage() {
  const [gameMode, setGameMode] = useState<'spellcaster' | 'knockdown'>('spellcaster');

  return (
    <div className="relative w-full h-screen">
      {/* Game Mode Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-black/80 backdrop-blur-md rounded-lg p-2 border border-yellow-500/30 flex gap-2">
          <button
            onClick={() => setGameMode('spellcaster')}
            className={`px-4 py-2 rounded transition-all ${
              gameMode === 'spellcaster'
                ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Spell Caster
          </button>
          <button
            onClick={() => setGameMode('knockdown')}
            className={`px-4 py-2 rounded transition-all ${
              gameMode === 'knockdown'
                ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Shape Knockdown
          </button>
        </div>
      </div>

      {/* Game Component */}
      {gameMode === 'spellcaster' ? <SpellCasterCanvas /> : <ShapeKnockdown />}
    </div>
  );
}