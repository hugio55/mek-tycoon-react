"use client";

import dynamic from "next/dynamic";
import BackgroundEffects from "@/components/BackgroundEffects";

// Dynamically import to avoid SSR issues with Three.js
const EnhancedTowerGame = dynamic(() => import("./EnhancedTowerGame"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">Loading Enhanced Tower Game...</div>
    </div>
  )
});

export default function BlockTowerBPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundEffects />
      
      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 font-['Orbitron']">
            ENHANCED TOWER BUILDER
          </h1>
          <p className="text-gray-400 text-lg">
            Multiple game modes with unique physics and mechanics
          </p>
        </div>

        {/* Game Frame Container */}
        <div className="max-w-6xl mx-auto">
          {/* Game Frame Border */}
          <div className="relative bg-gradient-to-r from-purple-600/20 via-yellow-500/30 to-purple-600/20 p-1 rounded-lg">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {/* Game Header Bar */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-yellow-500/30 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-yellow-400">
                      Tower Stacking Challenge
                    </h2>
                    <div className="text-sm text-gray-400">
                      4 Unique Game Modes
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded border border-purple-600/30 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Container */}
              <div className="relative" style={{ height: '700px' }}>
                <EnhancedTowerGame />
              </div>

              {/* Game Footer */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-yellow-500/30 p-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-400">
                    <span className="text-purple-400">ENHANCED:</span> Fixed camera, proper physics, multiple modes!
                  </div>
                  <div className="flex gap-4">
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

          {/* Game Modes Info Panel */}
          <div className="mt-8 bg-gray-900/50 backdrop-blur border border-purple-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-purple-400 mb-4">Available Game Modes</h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h4 className="text-yellow-400 mb-3">Classic Modes:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-lg">⬜</span>
                    <div>
                      <span className="text-white font-semibold">Classic Stack:</span> Traditional block stacking with left-right and forward-back movement
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lg">⟳</span>
                    <div>
                      <span className="text-white font-semibold">Physics C-Rings:</span> C-shaped rings with realistic physics, pieces fall and collide
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-yellow-400 mb-3">New Creative Modes:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-lg">🌙</span>
                    <div>
                      <span className="text-white font-semibold">Swing Arc:</span> Semi-circular pieces swing like pendulums, time the perfect drop
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lg">🌀</span>
                    <div>
                      <span className="text-white font-semibold">Spiral Drop:</span> Blocks spiral down from above, lock them at the right moment for a twisted tower
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-yellow-400 text-sm">
                <strong>Key Features:</strong> Static camera (no rotation), full physics simulation with self-collisions, progressive difficulty, unique mechanics per mode
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}