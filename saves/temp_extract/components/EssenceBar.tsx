"use client";

import { useEffect } from "react";

interface EssenceBarProps {
  essenceType: string;
  currentAmount: number;
  maxAmount?: number;
  sellingAmount?: number;
  onAmountChange?: (amount: number) => void;
  showControls?: boolean;
  static?: boolean;
  customColor?: string;
  speedBuff?: number; // Multiplier for essence generation speed (e.g., 1.5 = 50% faster)
}

export default function EssenceBar({
  essenceType,
  currentAmount,
  maxAmount = 10,
  sellingAmount = 0,
  onAmountChange,
  showControls = false,
  static: isStatic = false,
  customColor,
  speedBuff = 1,
}: EssenceBarProps) {
  const getEssenceColor = (type: string) => {
    const colors: Record<string, string> = {
      stone: "#8B8B8B",
      disco: "#B452CD",
      paul: "#4169E1",
      cartoon: "#FF69B4",
      candy: "#FF6B6B",
      tiles: "#CD853F",
      moss: "#90EE90",
      bullish: "#FFB347",
      journalist: "#D3D3D3",
      laser: "#00CED1",
      flashbulb: "#F0E68C",
      accordion: "#DDA0DD",
      turret: "#2F4F4F",
      drill: "#CD853F",
      security: "#000080",
      bumblebee: "#FFD700",
    };
    return colors[type.toLowerCase()] || "#666666";
  };

  const isLow = currentAmount < 2;
  const baseColor = customColor || getEssenceColor(essenceType);
  const color = isLow ? '#ef4444' : baseColor;
  
  // Calculate percentages based on actual max (10 is typical)
  const percentage = (currentAmount / maxAmount) * 100;
  const sellingPercentage = (sellingAmount / maxAmount) * 100;
  const remainingPercentage = ((currentAmount - sellingAmount) / maxAmount) * 100;
  
  // Determine animation speed based on buff (slower animation for higher buffs for subtlety)
  const hasBuff = speedBuff > 1;
  const animationDuration = hasBuff ? (10 / speedBuff) : 0; // Inverse relationship for subtlety
  const glowIntensity = hasBuff ? Math.min(speedBuff * 0.3, 0.8) : 0; // Subtle glow based on buff strength

  // Add CSS for smooth animations
  useEffect(() => {
    if (typeof window !== 'undefined' && hasBuff) {
      const styleId = 'essence-bar-animations';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes subtleGlow {
            0%, 100% {
              transform: translateX(-100%);
              opacity: 0;
            }
            20% {
              opacity: 0.3;
            }
            50% {
              transform: translateX(0%);
              opacity: 0.5;
            }
            80% {
              opacity: 0.3;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [hasBuff]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Enhanced thumbnail with glow */}
          <div 
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: color,
              background: isStatic ? `${color}20` : `radial-gradient(circle, ${color}20, transparent)`,
              boxShadow: isStatic ? 'none' : `0 0 15px ${color}40`,
            }}
          >
            <span 
              className="text-sm font-bold"
              style={{ 
                color: color,
                textShadow: isStatic ? 'none' : `0 0 10px ${color}80`
              }}
            >
              {essenceType.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold capitalize ${isLow ? 'text-red-400' : 'text-white'}`}>
                {essenceType}
              </span>
              {hasBuff && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    border: `1px solid ${color}`,
                    animationDuration: `${animationDuration}s`
                  }}
                >
                  {speedBuff > 2 ? '⚡⚡' : '⚡'} x{speedBuff.toFixed(1)}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {currentAmount.toFixed(1)} / {maxAmount}
              {hasBuff && (
                <span style={{ color: color }} className="ml-2">
                  +{((speedBuff - 1) * 100).toFixed(0)}% speed
                </span>
              )}
            </div>
          </div>
        </div>
        {sellingAmount > 0 && (
          <div className="text-sm text-yellow-400">
            Selling: {sellingAmount.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* LED-style Progress Bar matching essence page */}
      <div className="relative h-4 bg-black/50 rounded-lg overflow-hidden border border-gray-600">
        {/* LED segments background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, ${color}40 8px, ${color}40 10px)`,
          }}
        />
        
        {/* Current amount bar */}
        <div 
          className="absolute inset-y-0 left-0 transition-all duration-700 rounded-r-lg"
          style={{ 
            width: `${percentage}%`,
            background: isStatic ? color : `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: hasBuff ? `inset 0 0 ${10 * glowIntensity}px ${color}60, 0 0 ${20 * glowIntensity}px ${color}40` : 
                        (isStatic ? 'none' : `inset 0 0 5px ${color}30`),
          }}
        >
          {/* Subtle pulsing glow effect only when buffed */}
          {hasBuff && !isStatic && (
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${color}40 50%, transparent 100%)`,
                animation: `subtleGlow ${animationDuration}s ease-in-out infinite`,
                opacity: glowIntensity,
              }}
            />
          )}
        </div>
        
        {/* Selling amount overlay (red tint over the portion being sold) */}
        {sellingAmount > 0 && (
          <div 
            className="absolute inset-y-0 transition-all duration-300"
            style={{ 
              left: `${remainingPercentage}%`,
              width: `${sellingPercentage}%`,
              background: 'rgba(255, 0, 0, 0.4)',
              borderLeft: '2px solid #ff0000',
            }}
          />
        )}
        
        {/* Value display */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{
            color: percentage > 50 ? '#000' : color,
            textShadow: isStatic ? 'none' : (percentage > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : `0 0 5px ${color}60`),
          }}
        >
          {currentAmount.toFixed(1)}
        </div>
      </div>
      
      {/* Controls */}
      {showControls && onAmountChange && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={currentAmount}
              step="0.1"
              value={sellingAmount}
              onChange={(e) => onAmountChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${(sellingAmount / currentAmount) * 100}%, #374151 ${(sellingAmount / currentAmount) * 100}%, #374151 100%)`
              }}
            />
            <input
              type="number"
              min="0"
              max={currentAmount}
              step="0.1"
              value={sellingAmount}
              onChange={(e) => onAmountChange(Math.min(parseFloat(e.target.value) || 0, currentAmount))}
              className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Remaining: {(currentAmount - sellingAmount).toFixed(1)}</span>
            <span className="text-yellow-400">Selling: {sellingAmount.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}