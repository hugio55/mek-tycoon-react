"use client";

import { useState } from "react";

type AnimationMode = "forward" | "asteroidBelt";

interface StarfieldControlsProps {
  mode: AnimationMode;
  speed: number;
  scale: number;
  density: number;
  onModeChange: (mode: AnimationMode) => void;
  onSpeedChange: (speed: number) => void;
  onScaleChange: (scale: number) => void;
  onDensityChange: (density: number) => void;
}

export default function StarfieldControls({
  mode,
  speed,
  scale,
  density,
  onModeChange,
  onSpeedChange,
  onScaleChange,
  onDensityChange,
}: StarfieldControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed state - just toggle button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-black/60 border-2 border-yellow-500/40 text-yellow-400 px-4 py-2
                     hover:bg-black/80 hover:border-yellow-500/60 transition-all
                     backdrop-blur-sm shadow-[0_0_20px_rgba(250,182,23,0.3)]
                     uppercase tracking-wider text-xs font-bold font-['Orbitron']"
        >
          ⚙️ Star Controls
        </button>
      )}

      {/* Expanded state - full control panel */}
      {isExpanded && (
        <div className="bg-black/80 border-2 border-yellow-500/40 p-4 backdrop-blur-md
                        shadow-[0_0_30px_rgba(250,182,23,0.4)] min-w-[300px]">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm font-['Orbitron']">
              Starfield Controls
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Animation Mode Toggle */}
          <div className="mb-4">
            <label className="block text-yellow-400/70 text-xs uppercase tracking-wider mb-2">
              Animation Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onModeChange("forward")}
                className={`px-3 py-2 text-xs uppercase tracking-wider font-bold transition-all
                  ${mode === "forward"
                    ? "bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.3)]"
                    : "bg-black/40 border border-yellow-500/30 text-yellow-400/50 hover:text-yellow-400/80"
                  }`}
              >
                Forward
              </button>
              <button
                onClick={() => onModeChange("asteroidBelt")}
                className={`px-3 py-2 text-xs uppercase tracking-wider font-bold transition-all
                  ${mode === "asteroidBelt"
                    ? "bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.3)]"
                    : "bg-black/40 border border-yellow-500/30 text-yellow-400/50 hover:text-yellow-400/80"
                  }`}
              >
                Belt Glide
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-yellow-400/70 text-xs uppercase tracking-wider">
                Speed
              </label>
              <span className="text-yellow-400 text-xs font-mono">
                {speed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-yellow-400
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-yellow-500
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(250,182,23,0.6)]
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Scale Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-yellow-400/70 text-xs uppercase tracking-wider">
                Scale
              </label>
              <span className="text-yellow-400 text-xs font-mono">
                {scale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-yellow-400
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-yellow-500
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(250,182,23,0.6)]
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Density Slider */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-yellow-400/70 text-xs uppercase tracking-wider">
                Density
              </label>
              <span className="text-yellow-400 text-xs font-mono">
                {(density * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={density}
              onChange={(e) => onDensityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-yellow-400
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-yellow-500
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(250,182,23,0.6)]
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              onSpeedChange(1.0);
              onScaleChange(1.0);
              onDensityChange(1.0);
            }}
            className="w-full mt-4 bg-black/40 border border-yellow-500/30 text-yellow-400/70
                       px-3 py-2 text-xs uppercase tracking-wider hover:bg-black/60
                       hover:text-yellow-400 hover:border-yellow-500/50 transition-all"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
