"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BackgroundEffects from "@/components/BackgroundEffects";

// Dynamically import to avoid SSR issues with Three.js
const BlockGame = dynamic(() => import("./BlockGame"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">Loading Block Tower...</div>
    </div>
  )
});

export default function BlockGamePage() {
  const [showGame, setShowGame] = useState(true);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundEffects />
      
      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 font-['Orbitron']">
            SCRAP YARD
          </h1>
          <p className="text-gray-400 text-lg">
            Stack blocks as high as you can in this precision tower building game
          </p>
        </div>

        {/* Game Frame Container */}
        <div className="max-w-5xl mx-auto">
          {/* Game Frame Border */}
          <div className="relative bg-gradient-to-r from-yellow-600/20 via-yellow-500/30 to-yellow-600/20 p-1 rounded-lg">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {/* Game Header Bar */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-yellow-500/30 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-yellow-400">Block Tower Challenge</h2>
                    <div className="text-sm text-gray-400">
                      Click or Space to place blocks
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowGame(false)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30 transition-colors"
                    >
                      Exit Game
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Container */}
              <div className="relative" style={{ height: '600px' }}>
                {showGame ? (
                  <BlockGame />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-950">
                    <div className="text-center">
                      <h3 className="text-3xl text-yellow-400 mb-4">Game Paused</h3>
                      <button
                        onClick={() => setShowGame(true)}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
                      >
                        Resume Game
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Footer */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-yellow-500/30 p-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-400">
                    <span className="text-yellow-400">TIP:</span> Perfect alignment gives bonus points!
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => window.location.href = "/scrap-yard"}
                      className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                    >
                      Back to Scrap Yard
                    </button>
                    <button
                      onClick={() => window.location.href = "/hub"}
                      className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded border border-yellow-500/30 transition-colors"
                    >
                      Return to Hub
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="mt-8 bg-gray-900/50 backdrop-blur border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">How to Play</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h4 className="text-yellow-400 mb-2">Controls:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Click or press <span className="text-yellow-400">SPACE</span> to place blocks</li>
                  <li>• Blocks move automatically side to side</li>
                  <li>• Time your placement for perfect alignment</li>
                </ul>
              </div>
              <div>
                <h4 className="text-yellow-400 mb-2">Scoring:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Each successful placement = 1 point</li>
                  <li>• Perfect alignment = Bonus points</li>
                  <li>• Game ends when you miss completely</li>
                </ul>
              </div>
            </div>
          </div>

          {/* High Scores Panel (placeholder) */}
          <div className="mt-6 bg-gray-900/50 backdrop-blur border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">High Scores</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>1. Player One</span>
                <span className="text-yellow-400">42 blocks</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>2. Player Two</span>
                <span className="text-yellow-400">38 blocks</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>3. Player Three</span>
                <span className="text-yellow-400">35 blocks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}