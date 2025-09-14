"use client";

import { useState } from "react";

interface ViewActiveContractsButtonProps {
  activeContracts: number;
  maxContracts: number;
  onClick?: () => void;
  variant?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hoverVariant?: 1 | 2 | 3 | 4 | 5;
}

export default function ViewActiveContractsButton({ 
  activeContracts = 5, 
  maxContracts = 14, 
  onClick,
  variant = 1,
  hoverVariant = 1
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

  // Variant 1: Industrial Console Display - Compact control panel readout
  if (variant === 1) {
    const totalSlots = 50;
    
    // Determine hover effect based on hoverVariant
    const getHoverEffect = () => {
      switch(hoverVariant) {
        case 1: // Subtle border brightening + inner glow
          return isHovered ? 'border-yellow-400 shadow-[inset_0_0_8px_rgba(250,182,23,0.3)]' : '';
        case 2: // Scanline effect
          return '';
        case 3: // Pulse animation
          return '';
        case 4: // Sharp corners light-up
          return '';
        case 5: // Industrial warning stripes
          return '';
        default:
          return isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : '';
      }
    };

    const getHoverTransform = () => {
      if (hoverVariant === 3 && isHovered) {
        return 'scale(1.02)';
      }
      return '';
    };
    
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
        style={{ transform: getHoverTransform() }}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-900 to-black
            border-2 border-yellow-500/50
            ${getHoverEffect()}
            transition-all duration-200
            p-2
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23FCD34D' fill-opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />

            {/* Hover Variant 2: Scanline Effect */}
            {hoverVariant === 2 && isHovered && (
              <div 
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, 
                    transparent 0%, 
                    rgba(250,182,23,0.1) 50%, 
                    transparent 100%)`,
                  animation: 'scanline 2s linear infinite',
                  height: '20%',
                  top: '-20%'
                }}
              />
            )}

            {/* Hover Variant 3: Pulse Ring */}
            {hoverVariant === 3 && isHovered && (
              <div 
                className="absolute inset-0 pointer-events-none border-2 border-yellow-400"
                style={{
                  animation: 'pulse-ring 1s ease-out infinite',
                  opacity: 0
                }}
              />
            )}

            {/* Hover Variant 4: Corner Highlights */}
            {hoverVariant === 4 && isHovered && (
              <>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400" />
              </>
            )}

            {/* Hover Variant 5: Warning Stripes */}
            {hoverVariant === 5 && isHovered && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 5px,
                    rgba(250,182,23,0.5) 5px,
                    rgba(250,182,23,0.5) 10px
                  )`
                }}
              />
            )}
            
            <div className="relative flex items-center gap-3">
              {/* Left: 5x10 Grid (50 total slots) */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      const getSquareTransform = () => {
                        if (!isHovered || !isActive) return 'scale(1)';
                        switch(hoverVariant) {
                          case 1: return 'scale(1.1)';
                          case 2: return 'scale(1)';
                          case 3: return 'scale(1.05)';
                          case 4: return 'scale(1)';
                          case 5: return 'scale(1)';
                          default: return 'scale(1.15)';
                        }
                      };

                      const getSquareGlow = () => {
                        if (!isActive) return 'inset 0 -1px 0 rgba(0,0,0,0.5)';
                        if (!isHovered) return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 2px rgba(250, 182, 23, 0.5)';
                        switch(hoverVariant) {
                          case 1: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 4px rgba(250, 182, 23, 0.7)';
                          case 2: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 2px rgba(250, 182, 23, 0.5)';
                          case 3: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 3px rgba(250, 182, 23, 0.6)';
                          case 4: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 6px rgba(250, 182, 23, 0.8)';
                          case 5: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 2px rgba(250, 182, 23, 0.5)';
                          default: return 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 2px rgba(250, 182, 23, 0.5)';
                        }
                      };

                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-400 border-yellow-500'
                              : isLocked
                              ? 'bg-black/70 border-gray-950'
                              : 'bg-gray-800 border-gray-700'
                            }
                          `}
                          style={{
                            boxShadow: getSquareGlow(),
                            transform: getSquareTransform()
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Compact Industrial Display */}
              <div className="flex flex-col">
                <div className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-widest mb-0.5">
                  ACTIVE MISSIONS
                </div>
                <div className="bg-black/80 border border-yellow-500/30 px-2 py-0.5 rounded">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-yellow-400" style={{ 
                      fontFamily: 'Orbitron, monospace',
                      textShadow: '0 0 8px rgba(250, 182, 23, 0.5)',
                      letterSpacing: '0.05em'
                    }}>
                      {String(activeContracts).padStart(2, '0')}
                    </span>
                    <span className="text-yellow-600/60 text-xl mx-0.5 font-bold">/</span>
                    <span className="text-lg text-yellow-500/80 font-semibold" style={{ 
                      fontFamily: 'Orbitron, monospace' 
                    }}>
                      {String(maxContracts).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 2: Military Stencil - Heavy stamped text
  if (variant === 2) {
    const totalSlots = 50;
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Military Stencil */}
              <div className="flex flex-col justify-center">
                <div className="relative">
                  {/* Stamped/Embossed Effect Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 rounded opacity-50" 
                       style={{ transform: 'translate(1px, 1px)' }} />
                  
                  <div className="relative bg-gradient-to-b from-gray-700 to-gray-600 p-2 rounded">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-black text-gray-100" style={{ 
                        fontFamily: 'Impact, sans-serif',
                        letterSpacing: '0.15em',
                        textShadow: `
                          inset 0 -2px 0 rgba(0,0,0,0.5),
                          0 1px 0 rgba(255,255,255,0.1)
                        `,
                        WebkitTextStroke: '1px rgba(0,0,0,0.3)'
                      }}>
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-gray-400 text-3xl font-black mx-1">/</span>
                      <span className="text-2xl font-black text-gray-300" style={{ 
                        fontFamily: 'Impact, sans-serif',
                        letterSpacing: '0.15em'
                      }}>
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-[12px] font-black text-gray-200 uppercase text-center mt-1" 
                         style={{ 
                           fontFamily: 'Impact, sans-serif',
                           letterSpacing: '0.3em',
                           textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                         }}>
                      DEPLOYED
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase text-center mt-2" 
                     style={{ letterSpacing: '0.2em' }}>
                  MIL-SPEC
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 3: Gauge Meter - Analog gauge visual
  if (variant === 3) {
    const totalSlots = 50;
    const gaugeAngle = (activeContracts / maxContracts) * 180 - 90; // -90 to 90 degrees
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Analog Gauge */}
              <div className="flex flex-col justify-center">
                <div className="relative w-24 h-20">
                  {/* Gauge Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black border-2 border-gray-700 rounded-t-full">
                    {/* Gauge Markings */}
                    <div className="absolute inset-2 border-2 border-gray-800 rounded-t-full">
                      {/* Scale marks */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {Array.from({ length: 9 }, (_, i) => {
                          const angle = -90 + (i * 22.5);
                          return (
                            <div
                              key={i}
                              className="absolute w-0.5 h-8 bg-gray-600"
                              style={{
                                transform: `rotate(${angle}deg)`,
                                transformOrigin: 'center bottom'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Needle */}
                    <div 
                      className="absolute bottom-0 left-1/2 w-1 h-10 bg-gradient-to-t from-red-500 to-yellow-400 -translate-x-1/2 transition-transform duration-300"
                      style={{
                        transform: `translateX(-50%) rotate(${gaugeAngle}deg)`,
                        transformOrigin: 'center bottom',
                        boxShadow: '0 0 10px rgba(250, 182, 23, 0.8)'
                      }}
                    >
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full border border-gray-600" />
                    </div>
                    
                    {/* Center pivot */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full border border-gray-500" />
                  </div>
                  
                  {/* Digital Readout */}
                  <div className="absolute -bottom-2 left-0 right-0 text-center">
                    <div className="inline-flex items-baseline bg-black border border-gray-700 px-2 py-0.5 rounded">
                      <span className="text-lg font-bold text-yellow-400 font-mono">
                        {activeContracts}
                      </span>
                      <span className="text-gray-500 mx-0.5">/</span>
                      <span className="text-sm text-gray-400 font-mono">
                        {maxContracts}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase text-center mt-3" style={{ letterSpacing: '0.15em' }}>
                  {activeContracts} OF {maxContracts} UNITS
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 4: Terminal Style - Monospace terminal font
  if (variant === 4) {
    const totalSlots = 50;
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Terminal Display */}
              <div className="flex flex-col justify-center">
                <div className="bg-black border border-gray-700 p-2 rounded">
                  <div className="bg-gradient-to-b from-gray-950 to-black p-1.5 rounded font-mono">
                    <div className="text-[10px] text-green-500 opacity-70">
                      &gt; CONTRACT_STATUS
                    </div>
                    <div className="text-green-400 mt-1">
                      <span className="text-[10px]">[</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-gray-500 mx-0.5">/</span>
                      <span className="text-lg text-cyan-300">
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                      <span className="text-[10px]">]</span>
                      <span className="text-xs text-green-400 ml-1">CONTRACTS ACTIVE</span>
                    </div>
                    <div className="text-[10px] text-green-500 mt-1 flex items-center">
                      &gt; <span className="ml-1 animate-pulse">_</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-gray-500 uppercase text-center mt-2">
                  TERMINAL v2.0.1
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 5: Industrial Stamp - Stamped metal numbers
  if (variant === 5) {
    const totalSlots = 50;
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Stamped/Engraved Display */}
              <div className="flex flex-col justify-center">
                <div className="relative">
                  {/* Metal plate with engraved numbers */}
                  <div className="bg-gradient-to-b from-gray-600 to-gray-700 p-3 rounded border-2 border-gray-800"
                       style={{
                         boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)'
                       }}>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      CONTRACT STATUS
                    </div>
                    <div className="relative">
                      {/* Shadow/depth effect for stamped look */}
                      <div className="absolute inset-0 flex items-baseline"
                           style={{ transform: 'translate(1px, 1px)' }}>
                        <span className="text-4xl font-black text-gray-900">
                          {String(activeContracts).padStart(2, '0')}
                        </span>
                        <span className="text-gray-900 text-3xl font-black mx-1">-</span>
                        <span className="text-3xl font-black text-gray-900">
                          {String(maxContracts).padStart(2, '0')}
                        </span>
                      </div>
                      {/* Main engraved numbers */}
                      <div className="relative flex items-baseline">
                        <span className="text-4xl font-black text-gray-300"
                              style={{
                                textShadow: `
                                  inset 0 -2px 2px rgba(0,0,0,0.8),
                                  0 1px 0 rgba(255,255,255,0.2)
                                `,
                                WebkitTextStroke: '0.5px rgba(0,0,0,0.3)'
                              }}>
                          {String(activeContracts).padStart(2, '0')}
                        </span>
                        <span className="text-gray-500 text-3xl font-black mx-1">-</span>
                        <span className="text-3xl font-black text-gray-400"
                              style={{
                                textShadow: 'inset 0 -2px 2px rgba(0,0,0,0.8)'
                              }}>
                          {String(maxContracts).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase text-center mt-2"
                     style={{ letterSpacing: '0.15em' }}>
                  STEEL STAMP
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 6: Warning Label - Yellow/black hazard styling
  if (variant === 6) {
    const totalSlots = 50;
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Warning Label Display */}
              <div className="flex flex-col justify-center">
                <div className="relative">
                  {/* Warning label background with hazard stripes */}
                  <div className="bg-yellow-400 p-2 border-2 border-black"
                       style={{
                         background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)'
                       }}>
                    <div className="bg-yellow-400 border-2 border-black p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-black text-xl font-black">⚠</span>
                        <div className="text-[11px] font-black text-black uppercase tracking-wider">
                          WARNING
                        </div>
                      </div>
                      <div className="bg-black p-1">
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-black text-yellow-400"
                                style={{ fontFamily: 'Impact, sans-serif' }}>
                            {String(activeContracts).padStart(2, '0')}
                          </span>
                          <span className="text-yellow-600 text-2xl font-black mx-0.5">/</span>
                          <span className="text-2xl font-black text-yellow-500"
                                style={{ fontFamily: 'Impact, sans-serif' }}>
                            {String(maxContracts).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-black uppercase text-center mt-1"
                           style={{ letterSpacing: '0.1em' }}>
                        SLOTS OCCUPIED
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase text-center mt-2"
                     style={{ letterSpacing: '0.15em' }}>
                  CAUTION ZONE
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 7: Minimalist - Simple clean numbers
  if (variant === 7) {
    const totalSlots = 50;
    
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
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-800 via-gray-900 to-black
            border-2 border-gray-600
            ${isHovered ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' : ''}
            transition-all duration-200
            p-3
          `}>
            {/* Metal Texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23888' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '4px 4px'
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* Left: 5x10 Grid with bevel */}
              <div className="space-y-0.5">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, col) => {
                      const slotIndex = row * 10 + col;
                      const isActive = slotIndex < activeContracts;
                      const isLocked = slotIndex >= maxContracts;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`
                            w-3 h-3 border transition-all duration-200
                            ${isActive 
                              ? 'bg-yellow-500 border-yellow-600'
                              : isLocked
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-700 border-gray-500'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)' 
                              : 'inset 0 -1px 0 rgba(0,0,0,0.5)',
                            transform: isHovered && isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: Minimalist Display */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-thin text-gray-100"
                          style={{ 
                            fontFamily: 'Helvetica Neue, sans-serif',
                            letterSpacing: '-0.02em'
                          }}>
                      {activeContracts}
                    </span>
                    <span className="text-gray-500 text-3xl font-thin mx-1">/</span>
                    <span className="text-3xl font-thin text-gray-400"
                          style={{ 
                            fontFamily: 'Helvetica Neue, sans-serif'
                          }}>
                      {maxContracts}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return null;
}

// Add required CSS animations to your global styles:
/*
@keyframes geiger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.3; }
}
*/