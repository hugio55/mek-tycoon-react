"use client";

import { useState } from "react";

interface ViewActiveContractsButtonProps {
  activeContracts: number;
  maxContracts: number;
  onClick?: () => void;
  variant?: 1 | 2 | 3;
}

export default function ViewActiveContractsButton({ 
  activeContracts = 5, 
  maxContracts = 14, 
  onClick,
  variant = 1 
}: ViewActiveContractsButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Calculate fill percentage for progress bars
  const fillPercentage = (activeContracts / maxContracts) * 100;
  
  // Determine color based on capacity
  const getCapacityColor = () => {
    if (fillPercentage >= 90) return "text-red-400 border-red-500/50";
    if (fillPercentage >= 70) return "text-orange-400 border-orange-500/50";
    return "text-yellow-400 border-yellow-500/50";
  };

  // Option 1: Military HUD Style - Tactical Display
  if (variant === 1) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group
          ${isPressed ? 'scale-95' : isHovered ? 'scale-105' : 'scale-100'}
          transition-all duration-200
        `}
      >
        {/* Main Container */}
        <div className={`
          relative bg-black/80 backdrop-blur-sm
          border-2 ${getCapacityColor()}
          ${isHovered ? 'shadow-lg shadow-yellow-500/30' : ''}
          transition-all duration-300
        `}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
          }}
        >
          {/* Scan Line Effect on Hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(0deg, transparent 50%, rgba(250, 182, 23, 0.1) 50%)',
                backgroundSize: '100% 4px',
                animation: 'scanline 8s linear infinite'
              }}
            />
          )}

          {/* Top Section - Label */}
          <div className="px-4 pt-2 pb-1 border-b border-yellow-500/20">
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
              View Active Contracts
            </div>
          </div>

          {/* Bottom Section - Counter */}
          <div className="px-4 py-2 flex items-center justify-between gap-3">
            {/* Fraction Display */}
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${fillPercentage >= 90 ? 'text-red-400' : fillPercentage >= 70 ? 'text-orange-400' : 'text-yellow-400'} font-mono`}>
                {activeContracts}
              </span>
              <span className="text-gray-500 text-lg mx-1">/</span>
              <span className="text-lg text-gray-400 font-mono">{maxContracts}</span>
            </div>

            {/* Status Indicator */}
            <div className="flex flex-col items-end">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Slots</div>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1 h-3 ${i < Math.ceil((activeContracts / maxContracts) * 5) ? 'bg-yellow-400' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50" />

          {/* Hover Arrow Indicator */}
          {isHovered && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-yellow-400 animate-pulse">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </div>
          )}
        </div>
      </button>
    );
  }

  // Option 2: Holographic Data Card - Sci-Fi Terminal
  if (variant === 2) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-150
        `}
      >
        {/* Holographic Container */}
        <div className={`
          relative bg-gradient-to-br from-black/90 via-gray-900/80 to-black/90
          border border-yellow-400/40 rounded-lg overflow-hidden
          ${isHovered ? 'border-yellow-400/80 shadow-xl shadow-yellow-500/20' : ''}
          transition-all duration-300
        `}>
          {/* Animated Grid Background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 10px, #fab617 11px, #fab617 11px),
                repeating-linear-gradient(90deg, transparent, transparent 10px, #fab617 11px, #fab617 11px)
              `,
              backgroundSize: '20px 20px',
              animation: isHovered ? 'grid-move 20s linear infinite' : 'none'
            }}
          />

          {/* Content */}
          <div className="relative px-5 py-3">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                View Active
              </div>
              {/* Live Indicator */}
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-[9px] text-gray-500 uppercase">
                  {isHovered ? 'Ready' : 'Standby'}
                </span>
              </div>
            </div>

            {/* Main Display */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-lg font-bold text-yellow-400 uppercase tracking-wide">
                  Contracts
                </div>
                {/* Progress Bar */}
                <div className="w-24 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      fillPercentage >= 90 ? 'bg-red-400' : 
                      fillPercentage >= 70 ? 'bg-orange-400' : 
                      'bg-yellow-400'
                    }`}
                    style={{ 
                      width: `${fillPercentage}%`,
                      boxShadow: isHovered ? '0 0 10px currentColor' : 'none'
                    }}
                  />
                </div>
              </div>

              {/* Slot Counter */}
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold font-mono ${
                    fillPercentage >= 90 ? 'text-red-400' : 
                    fillPercentage >= 70 ? 'text-orange-400' : 
                    'text-yellow-400'
                  }`}>
                    {activeContracts}
                  </span>
                  <span className="text-gray-500 text-xl">/</span>
                  <span className="text-xl text-gray-400 font-mono">{maxContracts}</span>
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider text-right">
                  Mission Slots
                </div>
              </div>
            </div>
          </div>

          {/* Holographic Shimmer Effect */}
          {isHovered && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.1) 50%, transparent 60%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
        </div>
      </button>
    );
  }

  // Option 3: Brutalist Industrial - Heavy Machinery Interface
  if (variant === 3) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group
          ${isPressed ? 'translate-y-0.5' : ''}
          transition-transform duration-100
        `}
      >
        {/* Industrial Frame */}
        <div className="relative">
          {/* Metal Plate Background */}
          <div className={`
            relative bg-gradient-to-b from-gray-900 to-black
            border-2 border-yellow-500/50
            ${isHovered ? 'border-yellow-400' : ''}
            transition-colors duration-200
          `}>
            {/* Hazard Stripe Top */}
            <div 
              className="absolute inset-x-0 top-0 h-2"
              style={{
                background: 'repeating-linear-gradient(45deg, #fab617, #fab617 4px, #000 4px, #000 8px)',
                opacity: isHovered ? 0.8 : 0.5
              }}
            />

            {/* Main Content Area */}
            <div className="px-4 py-3 mt-1">
              {/* Label with Industrial Font */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-400 rotate-45" />
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  View Active Contracts
                </div>
              </div>

              {/* Counter Display */}
              <div className="flex items-center justify-between gap-4">
                {/* Digital Counter */}
                <div className="flex items-center">
                  <div className="bg-black/80 border border-yellow-500/30 px-3 py-1">
                    <div className="flex items-baseline font-mono">
                      <span className={`text-3xl font-bold ${
                        fillPercentage >= 90 ? 'text-red-400 animate-pulse' : 
                        fillPercentage >= 70 ? 'text-orange-400' : 
                        'text-yellow-400'
                      }`}>
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-yellow-600 text-2xl mx-1">/</span>
                      <span className="text-2xl text-yellow-600">
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Industrial Gauge */}
                <div className="flex flex-col items-center">
                  <div className="text-[9px] text-gray-500 uppercase mb-1">Capacity</div>
                  <div className="flex gap-1">
                    {Array.from({ length: maxContracts }).map((_, i) => (
                      <div 
                        key={i}
                        className={`
                          w-1.5 h-4 
                          ${i < activeContracts 
                            ? fillPercentage >= 90 ? 'bg-red-400' : 
                              fillPercentage >= 70 ? 'bg-orange-400' : 
                              'bg-yellow-400'
                            : 'bg-gray-800'
                          }
                          ${i === activeContracts && isHovered ? 'animate-pulse' : ''}
                        `}
                        style={{
                          boxShadow: i < activeContracts && isHovered ? '0 0 4px currentColor' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Text */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-500/20">
                <div className="text-[10px] text-gray-500 uppercase">
                  Slots {fillPercentage >= 90 ? 'Nearly Full' : fillPercentage >= 70 ? 'High Usage' : 'Available'}
                </div>
                {isHovered && (
                  <div className="text-[10px] text-yellow-400 uppercase animate-pulse">
                    ▶ Access
                  </div>
                )}
              </div>
            </div>

            {/* Metal Texture Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23fab617' fill-opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />

            {/* Rivet Corners */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-gray-600 rounded-full border border-gray-700" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-gray-600 rounded-full border border-gray-700" />
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-600 rounded-full border border-gray-700" />
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-600 rounded-full border border-gray-700" />
          </div>
        </div>
      </button>
    );
  }

  return null;
}

// Add required animations to your global CSS:
/*
@keyframes scanline {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

@keyframes grid-move {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, 20px); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
*/