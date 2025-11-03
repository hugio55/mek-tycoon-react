'use client';

import React, { useState, useEffect } from 'react';
import TenureProgressBar from '@/components/ui/TenureProgressBar';

export default function TenureProgressDemo() {
  const [currentTenure, setCurrentTenure] = useState(750);
  const [maxTenure] = useState(1000);
  const [autoIncrement, setAutoIncrement] = useState(true);

  // Auto-increment tenure for demo
  useEffect(() => {
    if (!autoIncrement) return;

    const interval = setInterval(() => {
      setCurrentTenure(prev => {
        if (prev >= maxTenure) return maxTenure;
        return prev + 2; // Increment by 2 every 100ms for smooth animation
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoIncrement, maxTenure]);

  const handleLevelUp = () => {
    console.log('Level up triggered!');
    setCurrentTenure(0); // Reset progress
    alert('Mek leveled up! Tenure reset to 0.');
  };

  const handleReset = () => {
    setCurrentTenure(0);
  };

  const handleSet75 = () => {
    setCurrentTenure(maxTenure * 0.75);
  };

  const handleSetComplete = () => {
    setCurrentTenure(maxTenure);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-8">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mek-text-industrial mb-2">
              Tenure Progress Bar - Industrial Design
            </h1>
            <p className="text-gray-400 text-sm">
              Three industrial-styled tenure progress bars for the Mek Tycoon game
            </p>
          </div>
          <a
            href="/demo/tenure-progress/specifications"
            className="mek-button-secondary whitespace-nowrap"
          >
            View Specifications →
          </a>
        </div>
      </div>

      {/* Control Panel */}
      <div className="max-w-6xl mx-auto mb-8 mek-card-industrial mek-border-sharp-gold p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setAutoIncrement(!autoIncrement)}
            className={`
              px-4 py-2 text-sm font-bold uppercase tracking-wider
              transition-all duration-200
              ${autoIncrement
                ? 'bg-green-500 text-black hover:bg-green-400'
                : 'bg-gray-600 text-white hover:bg-gray-500'
              }
            `}
          >
            {autoIncrement ? 'Auto-Increment ON' : 'Auto-Increment OFF'}
          </button>

          <button onClick={handleReset} className="mek-button-secondary">
            Reset to 0
          </button>

          <button onClick={handleSet75} className="mek-button-secondary">
            Set 75%
          </button>

          <button onClick={handleSetComplete} className="mek-button-secondary">
            Set 100%
          </button>

          <div className="ml-auto flex items-center gap-3">
            <label className="text-gray-400 text-sm">Manual Control:</label>
            <input
              type="range"
              min="0"
              max={maxTenure}
              value={currentTenure}
              onChange={(e) => {
                setAutoIncrement(false);
                setCurrentTenure(Number(e.target.value));
              }}
              className="w-64"
            />
            <span className="text-yellow-400 font-mono text-sm min-w-[80px]">
              {currentTenure.toFixed(0)} / {maxTenure}
            </span>
          </div>
        </div>
      </div>

      {/* Style Variations */}
      <div className="max-w-6xl mx-auto space-y-12">

        {/* DEFAULT STYLE */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-2">
              Default Style
            </h2>
            <p className="text-gray-400 text-sm">
              Full-featured progress bar with percentage display, numeric values, and angled Level Up button
            </p>
          </div>

          <div className="space-y-6">
            {/* Large Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Large</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="lg"
                style="default"
              />
            </div>

            {/* Medium Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Medium (Default)</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="md"
                style="default"
              />
            </div>

            {/* Small Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Small</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="default"
              />
            </div>
          </div>
        </div>

        {/* COMPACT STYLE */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-2">
              Compact Style
            </h2>
            <p className="text-gray-400 text-sm">
              Minimal single-line design with inline button, perfect for slot displays
            </p>
          </div>

          <div className="space-y-6">
            {/* Large Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Large</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="lg"
                style="compact"
              />
            </div>

            {/* Medium Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Medium</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="md"
                style="compact"
              />
            </div>

            {/* Small Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Small</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="compact"
              />
            </div>
          </div>
        </div>

        {/* DETAILED STYLE */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-2">
              Detailed Style
            </h2>
            <p className="text-gray-400 text-sm">
              Premium industrial design with hazard stripes, metal scratches, scan lines, and particle effects
            </p>
          </div>

          <div className="space-y-6">
            {/* Large Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Large</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="lg"
                style="detailed"
              />
            </div>

            {/* Medium Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Medium</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="md"
                style="detailed"
              />
            </div>

            {/* Small Size */}
            <div>
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Size: Small</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="detailed"
              />
            </div>
          </div>
        </div>

        {/* USAGE EXAMPLES */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-2">
              Slot Integration Examples
            </h2>
            <p className="text-gray-400 text-sm">
              How the tenure bars look when embedded in display slots
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot Example 1 */}
            <div className="border-2 border-dashed border-yellow-500/30 p-4 rounded bg-black/20">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Slot Display Zone</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="compact"
              />
            </div>

            {/* Slot Example 2 */}
            <div className="border-2 border-dashed border-yellow-500/30 p-4 rounded bg-black/20">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Detailed Slot Display</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="detailed"
              />
            </div>

            {/* Slot Example 3 */}
            <div className="border-2 border-dashed border-yellow-500/30 p-4 rounded bg-black/20">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Standard Slot Display</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                onLevelUp={handleLevelUp}
                size="sm"
                style="default"
              />
            </div>

            {/* Slot Example 4 - No button variant */}
            <div className="border-2 border-dashed border-yellow-500/30 p-4 rounded bg-black/20">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">No Button Variant</div>
              <TenureProgressBar
                currentTenure={currentTenure}
                maxTenure={maxTenure}
                showLevelUpButton={false}
                size="sm"
                style="compact"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="max-w-6xl mx-auto mt-12 mek-card-industrial mek-border-sharp-gold p-8">
        <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
          Industrial Design Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h3 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider text-sm">Visual Effects</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Yellow/gold gradient fills matching #fab617 theme</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Sharp-edged industrial borders with metal textures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Glass morphism with backdrop blur effects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Hazard stripe backgrounds (detailed style)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Metal scratch overlays for grunge aesthetic</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider text-sm">Animations</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Smooth 700ms fill transitions as tenure accumulates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Shimmer effects across the fill bar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Particle sweep animations when 100% complete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Scan line effects (detailed style)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Pulsing glow on Level Up button</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider text-sm">Typography</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Orbitron font for industrial headers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Uppercase tracking-wider labels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Monospace fonts for numeric values</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Text shadows for readability over busy backgrounds</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider text-sm">Functionality</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Three size options (sm, md, lg)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Three style variants (default, compact, detailed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Optional Level Up button with click handler</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Configurable current/max tenure values</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">▸</span>
                <span>Percentage and numeric display modes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
