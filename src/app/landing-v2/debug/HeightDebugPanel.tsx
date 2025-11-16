'use client';

import { useState } from 'react';

interface HeightDebugPanelProps {
  onLogoTopChange: (value: number) => void;
  onContentDelayChange: (value: number) => void;
  defaultLogoTop?: number;
  defaultContentDelay?: number;
}

export default function HeightDebugPanel({
  onLogoTopChange,
  onContentDelayChange,
  defaultLogoTop = 8,
  defaultContentDelay = 1600,
}: HeightDebugPanelProps) {
  const [logoTop, setLogoTop] = useState(defaultLogoTop);
  const [contentDelay, setContentDelay] = useState(defaultContentDelay);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogoTopChange = (value: number) => {
    setLogoTop(value);
    onLogoTopChange(value);
  };

  const handleContentDelayChange = (value: number) => {
    setContentDelay(value);
    onContentDelayChange(value);
  };

  const handleReset = () => {
    handleLogoTopChange(defaultLogoTop);
    handleContentDelayChange(defaultContentDelay);
  };

  if (isCollapsed) {
    return (
      <div
        className="fixed right-4 top-4 z-[10000] bg-black/90 border-2 border-yellow-500/50 rounded p-2 cursor-pointer hover:border-yellow-500"
        onClick={() => setIsCollapsed(false)}
      >
        <div className="text-yellow-500 text-sm font-mono">
          ⚙️ Debug
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-4 z-[10000] bg-black/90 border-2 border-yellow-500/50 rounded-lg p-4 min-w-[280px] backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wider">
          Height Debug Panel
        </h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-yellow-500/70 hover:text-yellow-500 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Logo Padding Top */}
        <div>
          <label className="block text-yellow-500/80 text-xs uppercase tracking-wide mb-1">
            Logo paddingTop
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={logoTop}
              onChange={(e) => handleLogoTopChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500"
            />
            <input
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={logoTop}
              onChange={(e) => handleLogoTopChange(Number(e.target.value))}
              className="w-16 bg-gray-800 text-yellow-500 border border-yellow-500/30 rounded px-2 py-1 text-xs text-center"
            />
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Current: {logoTop}vh
          </div>
        </div>

        {/* Content Delay */}
        <div>
          <label className="block text-yellow-500/80 text-xs uppercase tracking-wide mb-1">
            Content Delay
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={contentDelay}
              onChange={(e) => handleContentDelayChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500"
            />
            <input
              type="number"
              min="0"
              max="5000"
              step="100"
              value={contentDelay}
              onChange={(e) => handleContentDelayChange(Number(e.target.value))}
              className="w-20 bg-gray-800 text-yellow-500 border border-yellow-500/30 rounded px-2 py-1 text-xs text-center"
            />
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Current: {contentDelay}ms
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 rounded py-2 text-xs uppercase tracking-wider font-bold transition-colors"
        >
          Reset to Defaults
        </button>

        {/* Current Values Display */}
        <div className="border-t border-yellow-500/20 pt-3 space-y-1">
          <div className="text-gray-400 text-xs">
            <span className="text-yellow-500/70">Default Logo Top:</span> {defaultLogoTop}vh
          </div>
          <div className="text-gray-400 text-xs">
            <span className="text-yellow-500/70">Default Content Delay:</span> {defaultContentDelay}ms
          </div>
        </div>
      </div>
    </div>
  );
}
