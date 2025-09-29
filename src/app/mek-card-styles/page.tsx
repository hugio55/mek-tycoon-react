'use client';

import React, { useState } from 'react';

// Background style options for the MEK info plate
const PLATE_BACKGROUNDS = {
  'grid-dark': {
    name: 'Dark Grid (Current)',
    style: {
      background: '#0a0a0a',
      backgroundImage: `
        linear-gradient(to right, #1a1a1a 1px, transparent 1px),
        linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }
  },
  'transparent-light': {
    name: 'Transparent Light',
    style: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }
  },
  'transparent-dark': {
    name: 'Transparent Dark',
    style: {
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(250, 182, 23, 0.2)',
    }
  },
  'hazard-stripes': {
    name: 'Hazard Stripes',
    style: {
      background: `
        repeating-linear-gradient(
          45deg,
          #000000,
          #000000 10px,
          #1a1a00 10px,
          #1a1a00 20px
        )
      `,
    }
  },
  'metal-texture': {
    name: 'Metal Texture',
    style: {
      background: '#1a1a1a',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%),
        linear-gradient(to right, #0a0a0a 1px, transparent 1px),
        linear-gradient(to bottom, #0a0a0a 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 15px 15px, 15px 15px',
    }
  },
};

export default function MekCardStyles() {
  const [selectedBackground, setSelectedBackground] = useState<keyof typeof PLATE_BACKGROUNDS>('grid-dark');

  // Sample MEK data
  const sampleMeks = [
    { id: 1, number: 2922, rank: 554, goldPerHour: 21.8, image: 'aa1-aa1-cd1' },
    { id: 2, number: 1456, rank: 1203, goldPerHour: 15.3, image: 'bc2-dm1-ap1' },
    { id: 3, number: 3812, rank: 234, goldPerHour: 42.7, image: 'dp2-bf4-il2' },
    { id: 4, number: 95, rank: 12, goldPerHour: 98.5, image: 'hb1-gn1-hn1' },
  ];

  const currentBgStyle = PLATE_BACKGROUNDS[selectedBackground].style;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Dropdown in upper left */}
      <div className="fixed top-4 left-4 z-50">
        <label className="block text-yellow-400 text-xs uppercase tracking-wider mb-2">
          Plate Background
        </label>
        <select
          value={selectedBackground}
          onChange={(e) => setSelectedBackground(e.target.value as keyof typeof PLATE_BACKGROUNDS)}
          className="bg-gray-900 border border-yellow-500/50 text-white px-4 py-2 rounded focus:outline-none focus:border-yellow-500"
        >
          {Object.entries(PLATE_BACKGROUNDS).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          MEK CARD BACKGROUNDS
        </h1>
        <p className="text-gray-400">Select a background style from the dropdown</p>
      </div>

      {/* Grid of MEK cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {sampleMeks.map((mek) => (
          <div key={mek.id} className="flex flex-col">
            {/* MEK Image */}
            <div className="relative bg-gray-900 border border-gray-700 overflow-hidden">
              <img
                src={`/mek-images/150px/${mek.image}.webp`}
                alt={`Mek ${mek.number}`}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/mek-images/150px/000-000-000.webp';
                }}
              />
            </div>

            {/* Info Plate - This is what changes */}
            <div
              className="p-3 relative"
              style={currentBgStyle}
            >
              {/* MEK Number */}
              <div className="text-center mb-2">
                <span className="text-yellow-400 font-bold text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  MEK #{mek.number}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-left">
                  <div className="text-gray-500 uppercase">Rank</div>
                  <div className="text-white font-bold">{mek.rank}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 uppercase">Gold/HR</div>
                  <div className="text-yellow-400 font-bold">{mek.goldPerHour}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Background Info */}
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-gray-900/50 border border-gray-700 rounded">
        <h3 className="text-yellow-400 font-bold mb-3">Current Selection:</h3>
        <p className="text-white mb-2">{PLATE_BACKGROUNDS[selectedBackground].name}</p>
        <pre className="text-xs text-gray-400 bg-black/50 p-3 rounded overflow-auto">
          {JSON.stringify(currentBgStyle, null, 2)}
        </pre>
      </div>
    </div>
  );
}