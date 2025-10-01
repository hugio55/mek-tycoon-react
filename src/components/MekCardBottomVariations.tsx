'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface MekCardBottomProps {
  mekNumber: number;
  level: number;
  maxLevel?: number;
  baseGoldRate: number;
  bonusGoldRate?: number;
  upgradeCost?: number;
  canAfford?: boolean;
  onUpgrade?: () => void;
  currentGold?: number;
  nextLevelBoost?: number;
}

export default function MekCardBottomVariations({
  mekNumber = 1234,
  level = 5,
  maxLevel = 10,
  baseGoldRate = 45.2,
  bonusGoldRate = 8.4,
  upgradeCost = 2000,
  canAfford = true,
  onUpgrade,
  currentGold = 5000,
  nextLevelBoost = 10,
}: MekCardBottomProps) {
  const [selectedVariation, setSelectedVariation] = useState<1 | 2 | 3>(1);
  const isMaxLevel = level >= maxLevel;

  // Calculate display values
  const totalRate = baseGoldRate + (bonusGoldRate || 0);
  const levelProgress = (level / maxLevel) * 100;

  // VARIATION 1: TACTICAL GRID - Military HUD-inspired grid system
  const TacticalGrid = () => (
    <div className="w-full bg-black/90 border-2 border-yellow-500/30 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent animate-scan" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(250, 182, 23, 0.2) 19px, rgba(250, 182, 23, 0.2) 20px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(250, 182, 23, 0.2) 19px, rgba(250, 182, 23, 0.2) 20px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Content Grid */}
      <div className="relative p-3">
        {/* Top Row: Mek ID and Level */}
        <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-yellow-500/20">
          {/* Mek Number Cell */}
          <div className="bg-black/60 border border-yellow-500/30 p-2">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Unit ID</div>
            <div className="text-xl font-black text-yellow-400" style={{
              fontFamily: 'monospace',
              textShadow: '0 0 10px rgba(250, 182, 23, 0.5)'
            }}>
              #{mekNumber}
            </div>
          </div>

          {/* Level Cell */}
          <div className="bg-black/60 border border-yellow-500/30 p-2">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Rank</div>
            <div className="flex items-end gap-2">
              <span className={`text-xl font-black ${isMaxLevel ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                {level}
              </span>
              <span className="text-xs text-gray-500">/{maxLevel}</span>
            </div>
            {/* Mini progress bar */}
            <div className="mt-1 h-1 bg-black/80 relative overflow-hidden">
              <div
                className={`h-full ${isMaxLevel ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-yellow-500/60'}`}
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Middle Row: Gold Rate Display */}
        <div className="bg-black/60 border border-yellow-500/30 p-3 mb-3">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Production Rate</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-yellow-400">
              {baseGoldRate.toFixed(1)}
            </span>
            {bonusGoldRate && bonusGoldRate > 0 && (
              <>
                <span className="text-lg text-gray-500">+</span>
                <span className="text-2xl font-bold text-green-400" style={{
                  textShadow: '0 0 15px rgba(34, 197, 94, 0.6)'
                }}>
                  {bonusGoldRate.toFixed(1)}
                </span>
              </>
            )}
            <span className="text-sm text-gray-400 font-mono uppercase">gold/hr</span>
          </div>
          {/* Total if has bonus */}
          {bonusGoldRate && bonusGoldRate > 0 && (
            <div className="mt-1 pt-1 border-t border-yellow-500/10">
              <span className="text-[10px] text-gray-500 uppercase">Total: </span>
              <span className="text-sm font-bold text-white">{totalRate.toFixed(1)} gold/hr</span>
            </div>
          )}
        </div>

        {/* Bottom Row: Upgrade Section */}
        {!isMaxLevel ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/60 border border-yellow-500/30 p-2">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Upgrade Cost</div>
              <div className="text-lg font-bold text-yellow-400">{upgradeCost?.toLocaleString()}</div>
              <div className="text-[10px] text-green-400 mt-1">+{nextLevelBoost}% rate</div>
            </div>
            <button
              onClick={onUpgrade}
              disabled={!canAfford}
              className={`
                relative overflow-hidden transition-all duration-200
                ${canAfford
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30 hover:border-yellow-400'
                  : 'bg-gray-800/40 border border-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <div className="relative z-10 text-sm font-black uppercase tracking-wider">
                {canAfford ? 'UPGRADE' : 'INSUFFICIENT'}
              </div>
              {canAfford && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer" />
              )}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500 p-3 text-center">
            <div className="text-2xl font-black text-yellow-400 uppercase tracking-wider animate-pulse">
              MAX LEVEL
            </div>
            <div className="text-xs text-gray-400 mt-1">Peak efficiency achieved</div>
          </div>
        )}
      </div>
    </div>
  );

  // VARIATION 2: HOLOGRAPHIC STACK - Vertical layered approach with depth
  const HolographicStack = () => (
    <div className="w-full relative">
      {/* Holographic background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-purple-500/5 to-yellow-500/5 blur-xl" />

      <div className="relative space-y-2 p-3 bg-black/80 backdrop-blur-sm">
        {/* Layer 1: Mek Identity */}
        <div className="relative group">
          {/* Holographic shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer rounded-lg" />

          <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Mechanism Unit</div>
                <div className="text-2xl font-black text-white" style={{
                  textShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                  fontFamily: 'Orbitron, monospace'
                }}>
                  MEK #{mekNumber}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Level</div>
                <div className={`text-3xl font-black ${isMaxLevel ? 'text-yellow-400' : 'text-white'}`}>
                  {level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2: Gold Production */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer rounded-lg" />

          <div className="relative bg-gradient-to-r from-black/60 via-yellow-950/30 to-black/60 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3">
            <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-2">Gold Generation Rate</div>
            <div className="flex flex-col gap-1">
              {/* Base rate */}
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] text-gray-500">BASE:</span>
                  <span className="text-xl font-bold text-yellow-400">{baseGoldRate.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">gold/hr</span>
                </div>
              </div>

              {/* Bonus rate if exists */}
              {bonusGoldRate && bonusGoldRate > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] text-gray-500">BONUS:</span>
                      <span className="text-xl font-bold text-green-400 animate-pulse">+{bonusGoldRate.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">gold/hr</span>
                    </div>
                  </div>

                  {/* Separator with glow */}
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-1" />

                  {/* Total */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-gray-500">TOTAL:</span>
                    <span className="text-2xl font-black text-white" style={{
                      textShadow: '0 0 15px rgba(250, 182, 23, 0.8)'
                    }}>
                      {totalRate.toFixed(1)}
                    </span>
                    <span className="text-sm text-yellow-400 font-bold">gold/hr</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Layer 3: Level Progress */}
        <div className="relative">
          <div className="bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-lg p-2">
            <div className="h-8 relative overflow-hidden rounded bg-black/80">
              <div
                className={`h-full transition-all duration-500 ${
                  isMaxLevel
                    ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500/30 to-cyan-400/50'
                }`}
                style={{ width: `${levelProgress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {isMaxLevel ? 'MAX LEVEL ACHIEVED' : `Progress: ${level}/${maxLevel}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 4: Upgrade Interface */}
        {!isMaxLevel ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

            <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-green-400 uppercase tracking-wider">Upgrade Cost</div>
                  <div className="text-xl font-bold text-yellow-400">{upgradeCost?.toLocaleString()} gold</div>
                  <div className="text-xs text-green-400 mt-1">Next Level: +{nextLevelBoost}% production</div>
                </div>
                <button
                  onClick={onUpgrade}
                  disabled={!canAfford}
                  className={`
                    px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-all duration-200
                    ${canAfford
                      ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 border-2 border-green-400 text-green-400 hover:from-green-500/30 hover:to-green-400/30 hover:scale-105'
                      : 'bg-gray-800/40 border border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  {canAfford ? 'UPGRADE' : 'LOCKED'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10 backdrop-blur-md border-2 border-yellow-400 rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-yellow-400 uppercase tracking-wider">
                MAXIMUM
              </div>
              <div className="text-sm text-gray-300">Optimization Complete</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // VARIATION 3: COMMAND INTERFACE - Two-column efficient layout
  const CommandInterface = () => (
    <div className="w-full bg-gradient-to-b from-gray-900 to-black border-l-4 border-yellow-500 relative">
      {/* Terminal scanlines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.3) 2px, rgba(250, 182, 23, 0.3) 3px)',
          animation: 'scan 8s linear infinite'
        }} />
      </div>

      {/* Main Grid - 2 columns */}
      <div className="relative grid grid-cols-2 gap-px bg-gray-800">
        {/* Left Column - Critical Info */}
        <div className="bg-black p-3 space-y-3">
          {/* Unit ID */}
          <div>
            <div className="text-[9px] text-green-400 font-mono uppercase mb-1">
              &gt; UNIT_ID
            </div>
            <div className="text-2xl font-black text-white font-mono">
              #{mekNumber}
            </div>
          </div>

          {/* Level Status */}
          <div>
            <div className="text-[9px] text-green-400 font-mono uppercase mb-1">
              &gt; LEVEL_STATUS
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(maxLevel)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 mr-px ${
                      i < level
                        ? isMaxLevel && i === maxLevel - 1
                          ? 'bg-yellow-400 animate-pulse'
                          : 'bg-green-400'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-mono text-white">{level}/{maxLevel}</span>
            </div>
          </div>

          {/* Upgrade button for left column */}
          {!isMaxLevel && (
            <div>
              <div className="text-[9px] text-green-400 font-mono uppercase mb-1">
                &gt; ACTION
              </div>
              <button
                onClick={onUpgrade}
                disabled={!canAfford}
                className={`
                  w-full py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200
                  ${canAfford
                    ? 'bg-green-900/30 border border-green-400 text-green-400 hover:bg-green-900/50'
                    : 'bg-red-900/20 border border-red-800 text-red-600 cursor-not-allowed'
                  }
                `}
              >
                [{canAfford ? 'UPGRADE' : 'DENIED'}]
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Dynamic Content */}
        <div className="bg-black p-3 space-y-3 border-l border-gray-800">
          {/* Gold Rate Display */}
          <div>
            <div className="text-[9px] text-amber-400 font-mono uppercase mb-1">
              &gt; PRODUCTION_RATE
            </div>

            {/* Compact display for base + bonus */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-gray-500 font-mono">BASE:</span>
                <span className="text-lg font-bold text-yellow-400 font-mono">{baseGoldRate.toFixed(1)}</span>
              </div>

              {bonusGoldRate && bonusGoldRate > 0 && (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-gray-500 font-mono">BUFF:</span>
                    <span className="text-lg font-bold text-green-400 font-mono">+{bonusGoldRate.toFixed(1)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-gray-500 font-mono">NET:</span>
                      <span className="text-xl font-black text-white font-mono">{totalRate.toFixed(1)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="text-[10px] text-amber-400 font-mono uppercase">GOLD/HR</div>
            </div>
          </div>

          {/* Upgrade Cost Display */}
          {!isMaxLevel ? (
            <div>
              <div className="text-[9px] text-amber-400 font-mono uppercase mb-1">
                &gt; UPGRADE_COST
              </div>
              <div className="text-lg font-bold text-yellow-400 font-mono">
                {upgradeCost?.toLocaleString()}
              </div>
              <div className="text-[10px] text-green-400 font-mono">
                BOOST: +{nextLevelBoost}%
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="text-[9px] text-yellow-400 font-mono uppercase mb-1">
                &gt; STATUS
              </div>
              <div className="border border-yellow-400 bg-yellow-400/10 p-2">
                <div className="text-sm font-black text-yellow-400 font-mono animate-pulse">
                  [MAXIMUM]
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  NO FURTHER UPGRADES
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-3 py-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-500">
            SYS://MEK_CONTROL_v2.4.1
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-green-400">ONLINE</span>
            </div>
            <div className="text-[10px] font-mono text-gray-500">
              GOLD: {currentGold?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Layout selector dropdown
  const LayoutSelector = () => (
    <div className="mb-4 bg-black/80 border border-yellow-500/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Layout Style</span>
        <span className="text-[10px] text-yellow-400">Live Preview</span>
      </div>

      <select
        value={selectedVariation}
        onChange={(e) => setSelectedVariation(Number(e.target.value) as 1 | 2 | 3)}
        className="w-full bg-gray-900 border border-yellow-500/30 text-yellow-400 px-3 py-2 rounded focus:outline-none focus:border-yellow-400 transition-colors"
      >
        <option value={1}>Variation 1: Tactical Grid - Military HUD Layout</option>
        <option value={2}>Variation 2: Holographic Stack - Layered Depth Design</option>
        <option value={3}>Variation 3: Command Interface - Terminal Layout</option>
      </select>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[1, 2, 3].map((variant) => (
          <button
            key={variant}
            onClick={() => setSelectedVariation(variant as 1 | 2 | 3)}
            className={`
              p-2 rounded transition-all duration-200
              ${selectedVariation === variant
                ? 'bg-yellow-500/20 border-2 border-yellow-400 scale-105'
                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="text-[10px] text-gray-400 mb-1">Variation {variant}</div>
            <div className={`text-xs font-bold ${selectedVariation === variant ? 'text-yellow-400' : 'text-gray-500'}`}>
              {variant === 1 && 'GRID'}
              {variant === 2 && 'STACK'}
              {variant === 3 && 'COMMAND'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {/* Layout Selector */}
      <LayoutSelector />

      {/* Preview Card Container */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {/* Mock Mek Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-6xl text-gray-700">MEK</div>
          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded">
            <span className="text-xs text-yellow-400">Preview Mode</span>
          </div>
        </div>

        {/* Selected Bottom Layout */}
        <div className="border-t-2 border-yellow-500/30">
          {selectedVariation === 1 && <TacticalGrid />}
          {selectedVariation === 2 && <HolographicStack />}
          {selectedVariation === 3 && <CommandInterface />}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}