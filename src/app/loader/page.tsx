'use client';

import React, { useState, useEffect } from 'react';
import { TriangleKaleidoscope } from '@/features/page-loader/components/TriangleKaleidoscope';
import { PercentageDisplay } from '@/features/page-loader/components/PercentageDisplay';

export default function LoaderDebugPage() {
  const [percentage, setPercentage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Load saved settings from localStorage on mount
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).fontSize : 48;
    }
    return 48;
  });
  const [spacing, setSpacing] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).spacing : 16;
    }
    return 16;
  });
  const [horizontalOffset, setHorizontalOffset] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).horizontalOffset : 0;
    }
    return 0;
  });
  const [fontFamily, setFontFamily] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).fontFamily : 'Orbitron';
    }
    return 'Orbitron';
  });
  const [chromaticOffset, setChromaticOffset] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).chromaticOffset : 0;
    }
    return 0;
  });
  const [triangleSize, setTriangleSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loaderSettings');
      return saved ? JSON.parse(saved).triangleSize : 1;
    }
    return 1;
  });

  const [saveMessage, setSaveMessage] = useState('');

  // Auto-loop animation (0-100% infinitely)
  useEffect(() => {
    if (!isAnimating) return;

    let currentPercentage = 0;

    const interval = setInterval(() => {
      currentPercentage += 1;
      setPercentage(currentPercentage);

      if (currentPercentage >= 100) {
        currentPercentage = 0;
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const saveSettings = () => {
    const settings = {
      fontSize,
      spacing,
      horizontalOffset,
      fontFamily,
      chromaticOffset,
      triangleSize
    };
    localStorage.setItem('loaderSettings', JSON.stringify(settings));
    setSaveMessage('Settings saved! ✓');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const resetSettings = () => {
    setFontSize(48);
    setSpacing(16);
    setHorizontalOffset(0);
    setFontFamily('Orbitron');
    setChromaticOffset(0);
    setTriangleSize(1);
    localStorage.removeItem('loaderSettings');
    setSaveMessage('Settings reset to defaults');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
            LOADER DEBUG STATION
          </h1>
          <p className="text-gray-400">
            Preview and test different loading animations
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 items-center flex-wrap">
          <button
            onClick={toggleAnimation}
            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-all"
          >
            {isAnimating ? 'Pause Animation' : 'Resume Animation'}
          </button>
        </div>

        {/* Percentage Display Controls */}
        <div className="mb-8 border-2 border-yellow-500/30 rounded-lg p-6 bg-gray-900/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-yellow-500 font-bold text-lg">Percentage Display Controls</h2>
            <div className="flex gap-3 items-center">
              {saveMessage && (
                <span className="text-green-400 text-sm font-semibold">{saveMessage}</span>
              )}
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all text-sm font-semibold"
              >
                Reset
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded transition-all text-sm font-bold"
              >
                Save Settings
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Font Size Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="96"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10px</span>
                <span>96px</span>
              </div>
            </div>

            {/* Spacing Control (Vertical) */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Vertical Spacing: {spacing}px
              </label>
              <input
                type="range"
                min="-150"
                max="64"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-150px</span>
                <span>64px</span>
              </div>
            </div>

            {/* Horizontal Offset Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Horizontal Offset: {horizontalOffset}px
              </label>
              <input
                type="range"
                min="-200"
                max="200"
                value={horizontalOffset}
                onChange={(e) => setHorizontalOffset(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-200px</span>
                <span>200px</span>
              </div>
            </div>

            {/* Font Family Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="Orbitron">Orbitron (Default)</option>
                <option value="Rajdhani">Rajdhani</option>
                <option value="'Exo 2'">Exo 2</option>
                <option value="Electrolize">Electrolize</option>
                <option value="Audiowide">Audiowide</option>
                <option value="Michroma">Michroma</option>
                <option value="Saira">Saira</option>
                <option value="Play">Play</option>
                <option value="Quantico">Quantico</option>
              </select>
            </div>

            {/* Chromatic Aberration Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Chromatic Aberration: {chromaticOffset}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={chromaticOffset}
                onChange={(e) => setChromaticOffset(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0px</span>
                <span>10px</span>
              </div>
            </div>

            {/* Triangle Size Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Triangle Size: {triangleSize.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={triangleSize}
                onChange={(e) => setTriangleSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="grid grid-cols-1 gap-8">
          {/* Full Preview */}
          <div className="border-2 border-yellow-500/30 rounded-lg overflow-hidden">
            <div className="bg-gray-800/50 px-4 py-2 border-b border-yellow-500/30">
              <h2 className="text-yellow-500 font-semibold">Full Screen Preview</h2>
            </div>
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center gap-8 w-full max-w-xl px-4">
                {/* Loader Component */}
                <div className="w-48 h-48 md:w-64 md:h-64">
                  <TriangleKaleidoscope
                    size={triangleSize}
                    chromaticOffset={chromaticOffset}
                  />
                </div>

                {/* Percentage Display */}
                <PercentageDisplay
                  percentage={percentage}
                  fontSize={fontSize}
                  spacing={spacing}
                  horizontalOffset={horizontalOffset}
                  fontFamily={fontFamily}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Implementation Instructions */}
        <div className="mt-8 border border-yellow-500/30 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-yellow-500 font-bold mb-3">Triangle Kaleidoscope Loader</h3>
          <p className="text-gray-300 mb-2">
            Adjust controls above to customize the appearance.
          </p>
          <p className="text-gray-400 text-sm">
            Settings can be applied in{' '}
            <code className="text-yellow-400 bg-black px-2 py-1 rounded">
              src/features/page-loader/components/LoadingOverlay.tsx
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
