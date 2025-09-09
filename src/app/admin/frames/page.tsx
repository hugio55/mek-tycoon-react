'use client';

import { useState } from 'react';

interface Frame {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const frames: Frame[] = [
  {
    id: 'frame-gold-industrial',
    name: 'Gold Industrial',
    description: 'Classic gold gradient border with industrial styling',
    rarity: 'common'
  },
  {
    id: 'frame-hazard-stripes',
    name: 'Hazard Stripes',
    description: 'Black and yellow warning stripes for danger zones',
    rarity: 'uncommon'
  },
  {
    id: 'frame-hex-tech',
    name: 'Hex Tech',
    description: 'Futuristic hexagonal corners with tech aesthetic',
    rarity: 'uncommon'
  },
  {
    id: 'frame-circuit-board',
    name: 'Circuit Board',
    description: 'Green circuit patterns with electronic traces',
    rarity: 'rare'
  },
  {
    id: 'frame-riveted-steel',
    name: 'Riveted Steel',
    description: 'Industrial metal plating with rivet details',
    rarity: 'common'
  },
  {
    id: 'frame-energy-shield',
    name: 'Energy Shield',
    description: 'Cyan plasma energy field with animated glow',
    rarity: 'epic'
  },
  {
    id: 'frame-corrupted-data',
    name: 'Corrupted Data',
    description: 'Red glitch effect with data corruption theme',
    rarity: 'rare'
  },
  {
    id: 'frame-diamond-plate',
    name: 'Diamond Plate',
    description: 'Industrial diamond plate metal texture',
    rarity: 'common'
  },
  {
    id: 'frame-plasma-core',
    name: 'Plasma Core',
    description: 'Purple plasma energy with pulsing effects',
    rarity: 'epic'
  },
  {
    id: 'frame-legendary-prism',
    name: 'Legendary Prism',
    description: 'Rainbow prismatic effect with shimmer',
    rarity: 'legendary'
  }
];

const rarityColors = {
  common: 'border-gray-500 bg-gray-500/10',
  uncommon: 'border-green-500 bg-green-500/10',
  rare: 'border-blue-500 bg-blue-500/10',
  epic: 'border-purple-500 bg-purple-500/10',
  legendary: 'border-yellow-500 bg-yellow-500/10'
};

const rarityTextColors = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
};

export default function FramesPage() {
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [previewImage, setPreviewImage] = useState('/images/default-avatar.png');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-orbitron text-yellow-500 mb-2 uppercase tracking-wider">
          Profile Frames
        </h1>
        <p className="text-gray-400 mb-8">
          Collectible frames for your profile portrait. Earn these through achievements, events, and special rewards.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Frame Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  className={`
                    relative cursor-pointer transition-all duration-300
                    border-2 p-4 rounded-lg
                    ${selectedFrame?.id === frame.id 
                      ? rarityColors[frame.rarity] + ' scale-105' 
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="aspect-square relative mb-3">
                    <img
                      src={`/frame-images/${frame.id}.svg`}
                      alt={frame.name}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-[15%] bg-gray-800 rounded"></div>
                  </div>
                  <h3 className="text-sm font-bold text-white">{frame.name}</h3>
                  <p className={`text-xs mt-1 uppercase ${rarityTextColors[frame.rarity]}`}>
                    {frame.rarity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-500 mb-4 uppercase tracking-wider">
                  Preview
                </h2>
                
                {/* Frame Preview */}
                <div className="aspect-square relative mb-6 bg-gray-800 rounded-lg p-4">
                  {selectedFrame && (
                    <img
                      src={`/frame-images/${selectedFrame.id}.svg`}
                      alt={selectedFrame.name}
                      className="absolute inset-0 w-full h-full z-10"
                    />
                  )}
                  <div className="absolute inset-[10%] flex items-center justify-center">
                    <div className="text-gray-600 text-center">
                      <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-2"></div>
                      <p className="text-xs">Your Avatar Here</p>
                    </div>
                  </div>
                </div>

                {/* Frame Details */}
                {selectedFrame ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {selectedFrame.name}
                      </h3>
                      <p className={`text-sm uppercase mt-1 ${rarityTextColors[selectedFrame.rarity]}`}>
                        {selectedFrame.rarity} Frame
                      </p>
                    </div>
                    
                    <p className="text-gray-400 text-sm">
                      {selectedFrame.description}
                    </p>

                    <div className="pt-4 border-t border-gray-700">
                      <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider">
                        Equip Frame
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Select a frame to preview</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Collection Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Owned</span>
                    <span className="text-white">3 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Common</span>
                    <span className="text-gray-400">2 / 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uncommon</span>
                    <span className="text-green-400">1 / 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rare</span>
                    <span className="text-blue-400">0 / 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Epic</span>
                    <span className="text-purple-400">0 / 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Legendary</span>
                    <span className="text-yellow-400">0 / 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kodak Film Canisters Section */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-bold font-orbitron text-yellow-500 mb-4 uppercase tracking-wider">
            Kodak Film Canisters
          </h2>
          <p className="text-gray-400 mb-6">
            Collectible film canister variations with different artistic styles.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={`kodak-${num}`}
                className="bg-gray-900/50 border-2 border-gray-700 hover:border-yellow-500/50 rounded-lg p-4 transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-square relative mb-3 flex items-center justify-center bg-gray-800/30 rounded">
                  <img
                    src={`/frame-images/kodak-canister-${num}.png`}
                    alt={`Kodak Canister Variation ${num}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-sm font-bold text-white text-center">
                  Variation {num}
                </h3>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {num === 1 && 'Classic'}
                  {num === 2 && '3D View'}
                  {num === 3 && 'Vintage'}
                  {num === 4 && 'Minimal'}
                  {num === 5 && 'Open'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}