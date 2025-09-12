"use client";

import { useState } from "react";
import ViewActiveContractsButton from "@/components/ViewActiveContractsButton";

export default function ButtonDemoPage() {
  const [activeContracts, setActiveContracts] = useState(5);
  const [maxContracts, setMaxContracts] = useState(14);

  const handleButtonClick = (variant: number) => {
    alert(`Button variant ${variant} clicked! Would navigate to active contracts view.`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
          View Active Contracts Button Designs
        </h1>
        <p className="text-gray-400 mb-8">
          Three distinct sci-fi UI approaches for the contracts button with slot counter
        </p>

        {/* Controls */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Interactive Controls</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Active Contracts: {activeContracts}</label>
              <input
                type="range"
                min="0"
                max={maxContracts}
                value={activeContracts}
                onChange={(e) => setActiveContracts(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Contracts: {maxContracts}</label>
              <input
                type="range"
                min="1"
                max="20"
                value={maxContracts}
                onChange={(e) => setMaxContracts(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Capacity: {Math.round((activeContracts / maxContracts) * 100)}% 
            {activeContracts >= maxContracts && <span className="text-red-400 ml-2">(FULL)</span>}
            {activeContracts / maxContracts >= 0.9 && activeContracts < maxContracts && <span className="text-orange-400 ml-2">(Nearly Full)</span>}
          </div>
        </div>

        {/* Button Variants */}
        <div className="space-y-12">
          {/* Variant 1: Military HUD */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Option 1: Military HUD Style</h3>
                <p className="text-gray-400 max-w-2xl">
                  Tactical display inspired by military interfaces and aviation HUDs. Features angled corners, 
                  scan line effects on hover, and a multi-segment capacity indicator. The color dynamically 
                  changes based on capacity (yellow → orange → red).
                </p>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• Polygon clip-path for angled corners</li>
                  <li>• Scan line animation on hover</li>
                  <li>• 5-segment capacity indicator</li>
                  <li>• Dynamic color based on usage</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => handleButtonClick(1)}
                variant={1}
              />
            </div>
          </div>

          {/* Variant 2: Holographic Data Card */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Option 2: Holographic Data Card</h3>
                <p className="text-gray-400 max-w-2xl">
                  Sci-fi terminal interface with animated grid background and holographic shimmer effect. 
                  Includes a live status indicator and progress bar visualization. Inspired by cyberpunk 
                  UI and futuristic data terminals.
                </p>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• Animated grid background on hover</li>
                  <li>• Holographic shimmer effect</li>
                  <li>• Live/standby status indicator</li>
                  <li>• Gradient progress bar with glow</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => handleButtonClick(2)}
                variant={2}
              />
            </div>
          </div>

          {/* Variant 3: Brutalist Industrial */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Option 3: Brutalist Industrial</h3>
                <p className="text-gray-400 max-w-2xl">
                  Heavy machinery interface with hazard stripes and industrial gauge visualization. 
                  Features rivet details, metal texture overlay, and a segmented capacity meter. 
                  Inspired by construction equipment and industrial control panels.
                </p>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• Hazard stripe header</li>
                  <li>• Digital counter with zero-padding</li>
                  <li>• Individual slot indicators</li>
                  <li>• Rivet corner details</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => handleButtonClick(3)}
                variant={3}
              />
            </div>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mt-12 bg-gray-900/50 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Integration Example</h3>
          <p className="text-gray-400 mb-4">
            To integrate into the single-missions page header, replace the current element with:
          </p>
          <pre className="bg-black/80 border border-gray-700 rounded p-4 overflow-x-auto">
            <code className="text-green-400 text-sm">{`import ViewActiveContractsButton from '@/components/ViewActiveContractsButton';

// In the header section, replace:
<div className="bg-black/60 mek-border-sharp-gold px-4 py-2">
  <div className="mek-label-uppercase">Active Contracts</div>
  <div className="text-xl font-bold text-yellow-400">6</div>
</div>

// With:
<ViewActiveContractsButton
  activeContracts={6}
  maxContracts={14}
  onClick={() => router.push('/contracts/active')}
  variant={1} // or 2 or 3
/>`}</code>
          </pre>
        </div>

        {/* Design Notes */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>All designs feature hover states, press animations, and dynamic color coding based on capacity.</p>
          <p className="mt-2">Choose the variant that best matches your desired aesthetic and user experience.</p>
        </div>
      </div>
    </div>
  );
}