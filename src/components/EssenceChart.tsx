"use client";

import { useState } from "react";

export interface EssenceData {
  name: string;
  quantity: number;
  rate: number;
  individualBuff: number;
  icon: string;
}

interface EssenceChartProps {
  essenceData: EssenceData[];
  viewCount?: 5 | 30 | 60 | 100;
  onEssenceClick?: (essence: EssenceData) => void;
  clickable?: boolean;
}

const getEssenceColor = (index: number) => {
  const colors = [
    "#8B8B8B", "#B452CD", "#4169E1", "#FF69B4", "#FF6B6B", 
    "#CD853F", "#90EE90", "#FFB347", "#D3D3D3", "#00CED1",
    "#F0E68C", "#DDA0DD", "#2F4F4F", "#CD853F", "#000080",
    "#FFD700", "#C0C0C0", "#CD7F32", "#E5E4E2", "#B9F2FF"
  ];
  return colors[index % colors.length];
};

export default function EssenceChart({ 
  essenceData, 
  viewCount = 30,
  onEssenceClick,
  clickable = false
}: EssenceChartProps) {
  const [hoveredEssence, setHoveredEssence] = useState<string | null>(null);
  
  // Sort and slice essence data
  const sortedEssences = [...essenceData].sort((a, b) => b.quantity - a.quantity);
  const displayedEssences = sortedEssences.slice(0, viewCount);
  
  // Calculate sizes based on quantity with more dramatic variation
  const maxQuantity = Math.max(...displayedEssences.map(e => e.quantity));
  const minQuantity = Math.min(...displayedEssences.map(e => e.quantity));
  const minSize = viewCount === 5 ? 30 : viewCount === 30 ? 15 : viewCount === 60 ? 12 : 10;
  const maxSize = viewCount === 5 ? 180 : viewCount === 30 ? 90 : viewCount === 60 ? 60 : 45;
  
  const getSquareSize = (quantity: number) => {
    // Use logarithmic scale for more dramatic differences
    const normalizedValue = (Math.log(quantity + 1) - Math.log(minQuantity + 1)) / 
                           (Math.log(maxQuantity + 1) - Math.log(minQuantity + 1));
    // Apply power curve for even more dramatic scaling
    const curvedValue = Math.pow(normalizedValue, 1.5);
    return minSize + (maxSize - minSize) * curvedValue;
  };

  return (
    <div className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 p-6">
      {/* Industrial frame corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/30"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/30"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/30"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/30"></div>
      
      <h2 className="text-sm font-bold text-gray-500 mb-1 tracking-[0.3em] uppercase">
        System Analysis
      </h2>
      <h3 className="text-2xl font-bold text-yellow-400 mb-4 font-orbitron">
        ESSENCE INVENTORY
      </h3>
      
      {/* Industrial Grid Container */}
      <div className="relative bg-black/20 border border-gray-800/30 p-4 mb-4">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
        <div className="flex flex-wrap justify-center items-center gap-2">
        {displayedEssences.map((essence, index) => {
          const size = getSquareSize(essence.quantity);
          const color = getEssenceColor(index);
          const isHovered = hoveredEssence === essence.name;
          
          return (
            <div
              key={essence.name}
              className={`relative group transition-all hover:z-10 ${clickable ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => setHoveredEssence(essence.name)}
              onMouseLeave={() => setHoveredEssence(null)}
              onClick={() => clickable && onEssenceClick?.(essence)}
              style={{
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 whitespace-nowrap">
                    <div className="font-bold text-sm" style={{ color }}>
                      {essence.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Quantity: {essence.quantity}
                    </div>
                    <div className="text-xs text-gray-400">
                      Rate: {essence.rate.toFixed(3)}/day
                    </div>
                    {essence.individualBuff > 0 && (
                      <div className="text-xs text-green-400 mt-1">
                        +{essence.individualBuff.toFixed(3)}/day buff
                      </div>
                    )}
                    {clickable && (
                      <div className="text-xs text-yellow-400 mt-2">
                        Click to make offer
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Industrial Essence Cell */}
              <div
                className="w-full h-full flex flex-col items-center justify-center transition-all hover:scale-110 relative"
                style={{
                  background: `linear-gradient(135deg, ${color}10 0%, ${color}30 50%, ${color}10 100%)`,
                  border: `1px solid ${color}60`,
                  boxShadow: isHovered 
                    ? `0 0 15px ${color}80, inset 0 0 8px ${color}40`
                    : `inset 0 0 5px ${color}20`,
                  clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                {size > 40 && (
                  <div className="text-white text-lg mb-1">{essence.icon}</div>
                )}
                <div className="text-white font-bold" style={{
                  fontSize: size > 50 ? '14px' : '10px'
                }}>
                  {essence.quantity}
                </div>
                {size > 60 && (
                  <div className="text-xs text-gray-300 mt-1">
                    {essence.name.substring(0, 8)}
                  </div>
                )}
                
                {/* Buff indicator */}
                {essence.individualBuff > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      
      {/* Industrial Stats Panel */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/30 border border-gray-800/50 p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Units</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">
            {displayedEssences.reduce((sum, e) => sum + e.quantity, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-black/30 border border-gray-800/50 p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Production</div>
          <div className="text-2xl font-bold text-green-400 font-mono">
            {displayedEssences.reduce((sum, e) => sum + e.rate, 0).toFixed(3)}
          </div>
          <div className="text-xs text-gray-600">per cycle</div>
        </div>
        <div className="bg-black/30 border border-gray-800/50 p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Enhancement</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            +{displayedEssences.reduce((sum, e) => sum + e.individualBuff, 0).toFixed(3)}
          </div>
          <div className="text-xs text-gray-600">modifier</div>
        </div>
      </div>
    </div>
  );
}