'use client';

import { useState } from 'react';
import BackgroundEffects from '@/components/BackgroundEffects';

export default function AdminSpherePage() {
  const [showSphere, setShowSphere] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpin = () => {
    setShowSphere(true);
    setSpinCount(prev => prev + 1);
  };

  const handleCloseSphere = () => {
    setShowSphere(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Mock Game UI Content */}
      <div className={`relative z-10 p-8 transition-all duration-500 ${showSphere ? 'filter blur-sm' : ''}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            MEK CASINO
          </h1>
          <p className="text-gray-400">Test Your Luck - Win Big Rewards</p>
        </div>

        {/* Mock Game Cards Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Slots Card */}
          <div className="bg-gradient-to-br from-purple-900/20 to-black/40 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="h-32 bg-black/50 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-6xl">🎰</div>
            </div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Mek Slots</h3>
            <p className="text-gray-400 text-sm mb-4">Match 3 Meks to win the jackpot!</p>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">💰 5,000 Gold</span>
              <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                PLAY
              </button>
            </div>
          </div>

          {/* Sphere Selector Card */}
          <div className="bg-gradient-to-br from-yellow-900/20 to-black/40 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
            <div className="h-32 bg-black/50 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-6xl">🌍</div>
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Sphere Selector</h3>
            <p className="text-gray-400 text-sm mb-4">Spin the sphere and land on rewards!</p>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">💰 1,000 Gold</span>
              <button 
                onClick={handleSpin}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
              >
                SPIN
              </button>
            </div>
          </div>

          {/* Dice Game Card */}
          <div className="bg-gradient-to-br from-blue-900/20 to-black/40 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <div className="h-32 bg-black/50 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-6xl">🎲</div>
            </div>
            <h3 className="text-xl font-bold text-blue-400 mb-2">Cosmic Dice</h3>
            <p className="text-gray-400 text-sm mb-4">Roll the dice and beat the house!</p>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">💰 2,500 Gold</span>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                ROLL
              </button>
            </div>
          </div>
        </div>

        {/* Mock Stats Bar */}
        <div className="max-w-7xl mx-auto bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">125,000</div>
              <div className="text-sm text-gray-400">Total Gold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">42</div>
              <div className="text-sm text-gray-400">Wins Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">Level 15</div>
              <div className="text-sm text-gray-400">Casino Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{spinCount}</div>
              <div className="text-sm text-gray-400">Spins Today</div>
            </div>
          </div>
        </div>

        {/* Mock Leaderboard */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Top Winners</h3>
            <div className="space-y-3">
              {['MekMaster99', 'LuckySpinner', 'GoldRush42', 'SpinToWin'].map((name, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800/30">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-bold">#{idx + 1}</span>
                    <span className="text-gray-300">{name}</span>
                  </div>
                  <span className="text-green-400">+{(50000 - idx * 10000).toLocaleString()} 💰</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="text-green-400">🎰 You won 5,000 Gold on Mek Slots!</div>
              <div className="text-gray-400">🌍 Sphere spin: Landed on Common Zone</div>
              <div className="text-green-400">🎲 Dice roll: Natural 20! +10,000 Gold</div>
              <div className="text-red-400">🎰 Slots: Better luck next time...</div>
              <div className="text-yellow-400">⭐ Achievement Unlocked: First Spin!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sphere Lightbox Overlay */}
      {showSphere && (
        <>
          {/* Dark backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity duration-500"
            onClick={handleCloseSphere}
          />
          
          {/* Floating Sphere Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden relative pointer-events-auto"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(250, 182, 23, 0.3)',
                boxShadow: `
                  0 0 100px rgba(250, 182, 23, 0.2),
                  0 0 50px rgba(250, 182, 23, 0.1) inset,
                  0 20px 40px rgba(0, 0, 0, 0.5)
                `,
              }}
            >
              {/* Close button */}
              <button
                onClick={handleCloseSphere}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border-b border-yellow-500/20 px-6 py-3 z-10">
                <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  SPHERE SELECTOR
                </h2>
                <p className="text-sm text-gray-400">Spin to win! Land on the best zone for maximum rewards.</p>
              </div>

              {/* Sphere iframe with padding for title */}
              <iframe
                src="/games/sphere-selector/index-multi.html"
                className="w-full h-full border-0 pt-16"
                title="Sphere Selector Game - Multi Layout"
              />

              {/* Glow effects around edges */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 50% 0%, rgba(250, 182, 23, 0.1) 0%, transparent 30%),
                    radial-gradient(circle at 0% 50%, rgba(147, 51, 234, 0.05) 0%, transparent 20%),
                    radial-gradient(circle at 100% 50%, rgba(34, 211, 238, 0.05) 0%, transparent 20%),
                    radial-gradient(circle at 50% 100%, rgba(250, 182, 23, 0.1) 0%, transparent 30%)
                  `,
                }}
              />
            </div>
          </div>
        </>
      )}

    </div>
  );
}