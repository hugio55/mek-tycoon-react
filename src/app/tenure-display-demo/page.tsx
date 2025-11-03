'use client';

import React, { useState } from 'react';
import TenureDisplayZone from '@/components/ui/TenureDisplayZone';
import '@/styles/global-design-system.css';

/**
 * TENURE DISPLAY ZONE - Visual Demo Page
 *
 * Demonstrates all variants, sizes, and states of the TenureDisplayZone component
 * for use in admin overlay editor display zones.
 */

export default function TenureDisplayDemoPage() {
  // Interactive demo state
  const [demoTenure, setDemoTenure] = useState(67);
  const [demoMax, setDemoMax] = useState(100);
  const [demoBuffed, setDemoBuffed] = useState(false);
  const [demoSlotted, setDemoSlotted] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mek-text-industrial mb-2">
          TENURE DISPLAY ZONE
        </h1>
        <p className="text-gray-400 text-sm uppercase tracking-wider">
          Industrial Progress Bar Component - Overlay Editor Display Zones
        </p>
      </div>

      {/* Interactive Demo Controls */}
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="mek-card-industrial mek-border-sharp-gold p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 mek-text-industrial">
            INTERACTIVE DEMO
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tenure slider */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Current Tenure: {demoTenure}
              </label>
              <input
                type="range"
                min="0"
                max={demoMax}
                value={demoTenure}
                onChange={(e) => setDemoTenure(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-yellow-500
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(250,182,23,0.6)]"
              />
            </div>

            {/* Max tenure slider */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Max Tenure: {demoMax}
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={demoMax}
                onChange={(e) => setDemoMax(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={demoBuffed}
                onChange={(e) => setDemoBuffed(e.target.checked)}
                className="w-5 h-5 accent-green-400"
              />
              <span className="text-sm text-gray-300">Tenure Buffed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={demoSlotted}
                onChange={(e) => setDemoSlotted(e.target.checked)}
                className="w-5 h-5 accent-yellow-400"
              />
              <span className="text-sm text-gray-300">Mek Slotted</span>
            </label>
          </div>

          {/* Live demo display */}
          <div className="mt-6 p-6 bg-black/40 border border-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Live Demo (Standard Variant)</p>
            <div className="flex justify-center">
              <TenureDisplayZone
                currentTenure={demoTenure}
                maxTenure={demoMax}
                size="medium"
                variant="standard"
                isSlotted={demoSlotted}
                isTenureBuffed={demoBuffed}
                buffMultiplier={demoBuffed ? 1.5 : 1.0}
                tenureRatePerDay={1.2}
                onLevelUp={() => alert('Level Up clicked!')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SIZE VARIANTS */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 mek-text-industrial">
          SIZE VARIANTS
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Small */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Small (160px)</h3>
            <TenureDisplayZone
              currentTenure={45}
              maxTenure={100}
              size="small"
              variant="standard"
              onLevelUp={() => alert('Small - Level up!')}
            />
          </div>

          {/* Medium */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Medium (224px)</h3>
            <TenureDisplayZone
              currentTenure={70}
              maxTenure={100}
              size="medium"
              variant="standard"
              isTenureBuffed={true}
              buffMultiplier={1.5}
              onLevelUp={() => alert('Medium - Level up!')}
            />
          </div>

          {/* Large */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Large (288px)</h3>
            <TenureDisplayZone
              currentTenure={95}
              maxTenure={100}
              size="large"
              variant="standard"
              onLevelUp={() => alert('Large - Level up!')}
            />
          </div>
        </div>
      </div>

      {/* STYLE VARIANTS */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 mek-text-industrial">
          STYLE VARIANTS
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Minimal */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Minimal (Compact)</h3>
            <TenureDisplayZone
              currentTenure={55}
              maxTenure={100}
              size="medium"
              variant="minimal"
              onLevelUp={() => alert('Minimal - Level up!')}
            />
          </div>

          {/* Standard */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Standard (Balanced)</h3>
            <TenureDisplayZone
              currentTenure={75}
              maxTenure={100}
              size="medium"
              variant="standard"
              isTenureBuffed={true}
              buffMultiplier={1.8}
              onLevelUp={() => alert('Standard - Level up!')}
            />
          </div>

          {/* Detailed */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Detailed (Full Industrial)</h3>
            <TenureDisplayZone
              currentTenure={90}
              maxTenure={100}
              size="medium"
              variant="detailed"
              tenureRatePerDay={1.5}
              isTenureBuffed={true}
              buffMultiplier={2.0}
              onLevelUp={() => alert('Detailed - Level up!')}
            />
          </div>
        </div>
      </div>

      {/* FUNCTIONAL STATES */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 mek-text-industrial">
          FUNCTIONAL STATES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accumulating */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Accumulating (67%)</h3>
            <p className="text-xs text-gray-500 mb-4">Progress bar filling, no button yet</p>
            <TenureDisplayZone
              currentTenure={67}
              maxTenure={100}
              size="medium"
              variant="standard"
              tenureRatePerDay={1.2}
            />
          </div>

          {/* Ready */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Ready (100%)</h3>
            <p className="text-xs text-gray-500 mb-4">Level Up button active with glow + particles</p>
            <TenureDisplayZone
              currentTenure={100}
              maxTenure={100}
              size="medium"
              variant="standard"
              onLevelUp={() => alert('Ready - Leveling up!')}
            />
          </div>

          {/* Not Slotted */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Not Slotted</h3>
            <p className="text-xs text-gray-500 mb-4">Greyed out, no interactions</p>
            <TenureDisplayZone
              currentTenure={50}
              maxTenure={100}
              size="medium"
              variant="standard"
              isSlotted={false}
            />
          </div>

          {/* Buffed */}
          <div className="mek-card-industrial border border-gray-700/50 p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Buffed (1.5x Rate)</h3>
            <p className="text-xs text-gray-500 mb-4">Green lightning indicator, faster accumulation</p>
            <TenureDisplayZone
              currentTenure={80}
              maxTenure={100}
              size="medium"
              variant="standard"
              isTenureBuffed={true}
              buffMultiplier={1.5}
              tenureRatePerDay={1.8}
            />
          </div>
        </div>
      </div>

      {/* OVERLAY POSITIONING SIMULATION */}
      <div className="mb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 mek-text-industrial">
          OVERLAY POSITIONING SIMULATION
        </h2>
        <div className="mek-card-industrial border border-gray-700/50 p-6">
          <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">
            Simulated Slot Artwork with Display Zones
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            Shows how TenureDisplayZone appears when overlaid on slot artwork via admin editor
          </p>

          {/* Simulated slot container */}
          <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gradient-to-br from-gray-800 to-black border-2 border-yellow-500/40 rounded-lg overflow-hidden">
            {/* Mock slot artwork */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-6xl font-bold">
              SLOT ARTWORK
            </div>

            {/* Overlaid tenure displays at different positions */}

            {/* Top-left: Small minimal */}
            <div className="absolute" style={{ top: '10px', left: '10px' }}>
              <TenureDisplayZone
                currentTenure={45}
                maxTenure={100}
                size="small"
                variant="minimal"
              />
            </div>

            {/* Top-right: Medium standard with buff */}
            <div className="absolute" style={{ top: '10px', right: '10px' }}>
              <TenureDisplayZone
                currentTenure={78}
                maxTenure={100}
                size="medium"
                variant="standard"
                isTenureBuffed={true}
                buffMultiplier={1.5}
              />
            </div>

            {/* Bottom-center: Ready to level up */}
            <div className="absolute" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
              <TenureDisplayZone
                currentTenure={100}
                maxTenure={100}
                size="medium"
                variant="detailed"
                tenureRatePerDay={1.5}
                onLevelUp={() => alert('Centered - Level up!')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TECHNICAL SPECS */}
      <div className="max-w-6xl mx-auto">
        <div className="mek-card-industrial border border-gray-700/50 p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 mek-text-industrial">
            TECHNICAL SPECIFICATIONS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Size Dimensions</h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Small: 160px wide (w-40)</li>
                <li>• Medium: 224px wide (w-56)</li>
                <li>• Large: 288px wide (w-72)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Style Variants</h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Minimal: Compact, bar + numbers only</li>
                <li>• Standard: Balanced detail level</li>
                <li>• Detailed: Full industrial treatment</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Visual Effects</h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Shimmer animation on fill</li>
                <li>• Particle sweep at 100%</li>
                <li>• Scan line when ready</li>
                <li>• Pulsing glow on button</li>
                <li>• Metal scratches overlay</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Integration</h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Position via absolute CSS</li>
                <li>• Scale via transform</li>
                <li>• Works with overlay editor</li>
                <li>• Fully self-contained</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-xs">
        <p>MEK TYCOON - Industrial Design System</p>
        <p>TenureDisplayZone Component v1.0</p>
      </div>
    </div>
  );
}
