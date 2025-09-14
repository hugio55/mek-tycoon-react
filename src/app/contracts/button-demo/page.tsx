"use client";

import { useState } from "react";
import ViewActiveContractsButton from "@/components/ViewActiveContractsButton";

export default function ButtonDemoPage() {
  const [activeContracts, setActiveContracts] = useState(13);
  const [maxContracts, setMaxContracts] = useState(22);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
          Active Contracts Button - 5 Hover Effect Variations
        </h1>
        <p className="text-gray-400 mb-8">
          Same layout and design, 5 different hover rollover effects
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
                max="50"
                value={activeContracts}
                onChange={(e) => setActiveContracts(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Contracts: {maxContracts}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={maxContracts}
                onChange={(e) => setMaxContracts(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-4 text-center text-yellow-400">
            Capacity: {Math.round((activeContracts / maxContracts) * 100)}% 
            {activeContracts >= maxContracts && <span className="text-red-400 ml-2">(FULL)</span>}
            {activeContracts / maxContracts >= 0.9 && activeContracts < maxContracts && <span className="text-orange-400 ml-2">(Nearly Full)</span>}
          </div>
        </div>

        {/* 5 Hover Effect Variations */}
        <div className="space-y-8">
          {/* Hover Variant 1: Subtle Inner Glow */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Hover Effect 1: Subtle Inner Glow</h3>
                <p className="text-gray-400 mb-4">
                  Border brightens to yellow-400 with a soft inner shadow glow. Active squares scale up slightly (1.1x).
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Border color transition to brighter yellow</li>
                  <li>• Inner shadow glow effect</li>
                  <li>• Active squares scale to 110%</li>
                  <li>• Smooth 200ms transition</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => console.log('View contracts clicked')}
                variant={1}
                hoverVariant={1}
              />
            </div>
          </div>

          {/* Hover Variant 2: Scanline Effect */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Hover Effect 2: Scanline</h3>
                <p className="text-gray-400 mb-4">
                  A yellow scanline continuously sweeps down across the button. No scaling on squares.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Animated scanline moving top to bottom</li>
                  <li>• Yellow gradient sweep effect</li>
                  <li>• No square scaling (stays crisp)</li>
                  <li>• 2-second animation loop</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => console.log('View contracts clicked')}
                variant={1}
                hoverVariant={2}
              />
            </div>
          </div>

          {/* Hover Variant 3: Pulse Ring */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Hover Effect 3: Pulse Ring</h3>
                <p className="text-gray-400 mb-4">
                  An expanding yellow ring pulses outward from the button. Entire button scales slightly (1.02x).
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Expanding ring animation</li>
                  <li>• Entire button scales to 102%</li>
                  <li>• Active squares scale to 105%</li>
                  <li>• 1-second pulse cycle</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => console.log('View contracts clicked')}
                variant={1}
                hoverVariant={3}
              />
            </div>
          </div>

          {/* Hover Variant 4: Corner Highlights */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Hover Effect 4: Corner Brackets</h3>
                <p className="text-gray-400 mb-4">
                  Yellow corner brackets appear at all four corners. Active squares get stronger glow.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Corner bracket highlights</li>
                  <li>• No button scaling</li>
                  <li>• Enhanced square glow (6px spread)</li>
                  <li>• Industrial targeting aesthetic</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => console.log('View contracts clicked')}
                variant={1}
                hoverVariant={4}
              />
            </div>
          </div>

          {/* Hover Variant 5: Warning Stripes */}
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Hover Effect 5: Hazard Stripes</h3>
                <p className="text-gray-400 mb-4">
                  Diagonal yellow warning stripes overlay appears. Industrial hazard zone aesthetic.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• 45-degree warning stripes</li>
                  <li>• Subtle overlay opacity</li>
                  <li>• No square scaling</li>
                  <li>• Industrial safety theme</li>
                </ul>
              </div>
              <ViewActiveContractsButton
                activeContracts={activeContracts}
                maxContracts={maxContracts}
                onClick={() => console.log('View contracts clicked')}
                variant={1}
                hoverVariant={5}
              />
            </div>
          </div>
        </div>

        {/* Design Notes */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>All hover effects use the same base layout: 5x10 grid (50 total slots)</p>
          <p className="mt-2">Three-state coloring: Yellow = Active | Gray = Available | Dark Gray = Locked</p>
          <p className="mt-2">Each hover effect provides different visual feedback without changing layout</p>
        </div>
      </div>
    </div>
  );
}