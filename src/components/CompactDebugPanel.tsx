"use client";

import { useState } from "react";

type AnimationMode = "forward" | "asteroidBelt";

interface CompactDebugPanelProps {
  // Starfield controls
  starMode: AnimationMode;
  starSpeed: number;
  starScale: number;
  starDensity: number;
  onStarModeChange: (mode: AnimationMode) => void;
  onStarSpeedChange: (speed: number) => void;
  onStarScaleChange: (scale: number) => void;
  onStarDensityChange: (density: number) => void;

  // Logo controls
  logoScale: number;
  logoVerticalOffset: number;
  onLogoScaleChange: (scale: number) => void;
  onLogoVerticalOffsetChange: (offset: number) => void;

  // Font controls
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;

  // Background controls (optional - for when background image is active)
  backgroundVerticalPosition?: number;
  onBackgroundVerticalPositionChange?: (position: number) => void;
}

const FONT_OPTIONS = [
  { value: 'Orbitron', label: 'Orbitron' },
  { value: 'Rajdhani', label: 'Rajdhani' },
  { value: 'Titillium Web', label: 'Titillium' },
  { value: 'Share Tech Mono', label: 'Share Tech' },
  { value: 'Audiowide', label: 'Audiowide' },
  { value: 'Michroma', label: 'Michroma' },
];

export default function CompactDebugPanel({
  starMode,
  starSpeed,
  starScale,
  starDensity,
  onStarModeChange,
  onStarSpeedChange,
  onStarScaleChange,
  onStarDensityChange,
  logoScale,
  logoVerticalOffset,
  onLogoScaleChange,
  onLogoVerticalOffsetChange,
  fontFamily,
  onFontFamilyChange,
  backgroundVerticalPosition,
  onBackgroundVerticalPositionChange,
}: CompactDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      {/* Collapsed state - minimal toggle button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-black/70 border border-yellow-500/40 text-yellow-400 px-2 py-1
                     hover:bg-black/90 hover:border-yellow-500/70 transition-all
                     backdrop-blur-sm shadow-[0_0_15px_rgba(250,182,23,0.3)]
                     uppercase tracking-wider text-[9px] font-bold font-['Orbitron']"
          title="Debug Controls"
        >
          ⚙️
        </button>
      )}

      {/* Expanded state - ultra-compact panel */}
      {isExpanded && (
        <div className="bg-black/85 border border-yellow-500/40 p-2 backdrop-blur-md
                        shadow-[0_0_25px_rgba(250,182,23,0.4)] w-[160px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-yellow-500/20">
            <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-[9px] font-['Orbitron']">
              DEBUG
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors text-xs leading-none"
            >
              ✕
            </button>
          </div>

          {/* STARS Section */}
          <div className="mb-2 pb-2 border-b border-yellow-500/10">
            <div className="text-yellow-400/60 text-[8px] uppercase tracking-wider mb-1 font-semibold">
              Stars
            </div>

            {/* Star Mode Toggle - Mini buttons */}
            <div className="grid grid-cols-2 gap-1 mb-1.5">
              <button
                onClick={() => onStarModeChange("forward")}
                className={`px-1 py-0.5 text-[7px] uppercase tracking-wider font-bold transition-all
                  ${starMode === "forward"
                    ? "bg-yellow-500/20 border border-yellow-400 text-yellow-400"
                    : "bg-black/40 border border-yellow-500/20 text-yellow-400/40 hover:text-yellow-400/70"
                  }`}
              >
                FWD
              </button>
              <button
                onClick={() => onStarModeChange("asteroidBelt")}
                className={`px-1 py-0.5 text-[7px] uppercase tracking-wider font-bold transition-all
                  ${starMode === "asteroidBelt"
                    ? "bg-yellow-500/20 border border-yellow-400 text-yellow-400"
                    : "bg-black/40 border border-yellow-500/20 text-yellow-400/40 hover:text-yellow-400/70"
                  }`}
              >
                BELT
              </button>
            </div>

            {/* Compact sliders */}
            <SliderControl
              label="Spd"
              value={starSpeed}
              min={0.1}
              max={3.0}
              step={0.1}
              onChange={onStarSpeedChange}
              displayValue={`${starSpeed.toFixed(1)}x`}
            />
            <SliderControl
              label="Scl"
              value={starScale}
              min={0.5}
              max={2.5}
              step={0.1}
              onChange={onStarScaleChange}
              displayValue={`${starScale.toFixed(1)}x`}
            />
            <SliderControl
              label="Dns"
              value={starDensity}
              min={0.2}
              max={2.0}
              step={0.1}
              onChange={onStarDensityChange}
              displayValue={`${(starDensity * 100).toFixed(0)}%`}
            />
          </div>

          {/* LOGO Section */}
          <div className="mb-2 pb-2 border-b border-yellow-500/10">
            <div className="text-yellow-400/60 text-[8px] uppercase tracking-wider mb-1 font-semibold">
              Logo
            </div>

            <SliderControl
              label="Sze"
              value={logoScale}
              min={0.5}
              max={2.0}
              step={0.1}
              onChange={onLogoScaleChange}
              displayValue={`${(logoScale * 100).toFixed(0)}%`}
            />
            <SliderControl
              label="Pos"
              value={logoVerticalOffset}
              min={-100}
              max={100}
              step={5}
              onChange={onLogoVerticalOffsetChange}
              displayValue={`${logoVerticalOffset > 0 ? '+' : ''}${logoVerticalOffset}`}
            />
          </div>

          {/* FONT Section */}
          <div className="mb-1">
            <div className="text-yellow-400/60 text-[8px] uppercase tracking-wider mb-1 font-semibold">
              Font
            </div>

            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="w-full px-1 py-0.5 text-[9px] bg-black/50 border border-yellow-500/30
                         text-yellow-400 focus:border-yellow-500/60 focus:outline-none
                         hover:bg-black/70 transition-colors"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* BACKGROUND Section (when background image is active) */}
          {backgroundVerticalPosition !== undefined && onBackgroundVerticalPositionChange && (
            <div className="mb-1 pb-2 border-b border-yellow-500/10">
              <div className="text-yellow-400/60 text-[8px] uppercase tracking-wider mb-1 font-semibold">
                Background
              </div>

              <SliderControl
                label="Ver"
                value={backgroundVerticalPosition}
                min={0}
                max={100}
                step={5}
                onChange={onBackgroundVerticalPositionChange}
                displayValue={`${backgroundVerticalPosition}%`}
              />
            </div>
          )}

          {/* Reset button - ultra compact */}
          <button
            onClick={() => {
              onStarSpeedChange(1.0);
              onStarScaleChange(1.0);
              onStarDensityChange(1.0);
              onLogoScaleChange(1.0);
              onLogoVerticalOffsetChange(0);
              onFontFamilyChange('Orbitron');
            }}
            className="w-full mt-2 bg-black/40 border border-yellow-500/20 text-yellow-400/60
                       px-1 py-0.5 text-[8px] uppercase tracking-wider hover:bg-black/60
                       hover:text-yellow-400 hover:border-yellow-500/40 transition-all"
          >
            RST
          </button>
        </div>
      )}
    </div>
  );
}

// Compact slider component with tiny labels
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue: string;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-0.5">
        <label className="text-yellow-400/50 text-[7px] uppercase tracking-wider">
          {label}
        </label>
        <span className="text-yellow-400 text-[7px] font-mono">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-black/50 rounded appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-2
                   [&::-webkit-slider-thumb]:h-2
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-yellow-400
                   [&::-webkit-slider-thumb]:border
                   [&::-webkit-slider-thumb]:border-yellow-500
                   [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(250,182,23,0.6)]
                   [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
