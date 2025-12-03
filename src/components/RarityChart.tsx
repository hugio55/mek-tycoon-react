"use client";

import { useMemo } from "react";

interface Rank {
  name: string;
  color: string;
  min: number;
  max: number;
}

interface RarityChartProps {
  rarityBias: number;
  displayBias?: number;
  onSliderChange?: (value: number) => void;
  showSlider?: boolean;
  chartHeight?: number;
  maxBarHeight?: number;
  hideCenterDisplay?: boolean;
}

const RANKS: Rank[] = [
  { name: 'D', color: '#999999', min: 0, max: 100 },
  { name: 'C', color: '#90EE90', min: 100, max: 200 },
  { name: 'B', color: '#87CEEB', min: 200, max: 300 },
  { name: 'A', color: '#FFF700', min: 300, max: 400 },
  { name: 'S', color: '#FFB6C1', min: 400, max: 500 },
  { name: 'SS', color: '#DA70D6', min: 500, max: 600 },
  { name: 'SSS', color: '#9370DB', min: 600, max: 700 },
  { name: 'X', color: '#FF8C00', min: 700, max: 800 },
  { name: 'XX', color: '#DC143C', min: 800, max: 900 },
  { name: 'XXX', color: '#8B0000', min: 900, max: 1000 }
];

function calculateBellCurvePosition(rarity: number): number {
  if (rarity <= 0) return 50;
  
  const maxPosition = 650;
  const minPosition = 50;
  const maxRarity = 1000;
  
  const sqrtProgress = Math.sqrt(rarity / maxRarity);
  const bellPosition = minPosition + (maxPosition - minPosition) * sqrtProgress;
  
  return bellPosition;
}

function calculateProbabilities(rarity: number): number[] {
  const sigma = 120;
  const bellCenter = calculateBellCurvePosition(rarity);
  const probs: number[] = new Array(RANKS.length);
  
  // Calculate all probabilities in one pass
  let total = 0;
  for (let i = 0; i < RANKS.length; i++) {
    const rankCenter = (RANKS[i].min + RANKS[i].max) / 2;
    const distance = rankCenter - bellCenter;
    const prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
    probs[i] = prob;
    total += prob;
  }
  
  // Normalize to percentages
  const invTotal = 100 / total;
  for (let i = 0; i < probs.length; i++) {
    probs[i] = probs[i] * invTotal;
  }
  
  return probs;
}

function getCurrentFocus(rarityBias: number): string {
  const bellPosition = calculateBellCurvePosition(rarityBias);
  
  for (let rank of RANKS) {
    const center = (rank.min + rank.max) / 2;
    if (Math.abs(bellPosition - center) < 60) {
      return rank.name + ' Rank';
    }
  }
  return 'Between ranks';
}

export default function RarityChart({
  rarityBias,
  displayBias,
  onSliderChange,
  showSlider = true,
  chartHeight = 300,
  maxBarHeight = 290,
  hideCenterDisplay = false
}: RarityChartProps) {
  const actualDisplayBias = displayBias ?? rarityBias;
  const probabilities = useMemo(() => calculateProbabilities(rarityBias), [rarityBias]);
  
  return (
    <div className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/10">
      {!hideCenterDisplay && (
        <div className="text-center mb-6">
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Current Bias</div>
          <div 
            className="text-yellow-400 mb-3"
            style={{ 
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: '72px',
              fontWeight: 200,
              letterSpacing: '1px',
              lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {actualDisplayBias}
          </div>
          <div className="text-gray-300 text-lg font-inter">
            Your Current Focus: <span className="text-yellow-400 font-semibold">{getCurrentFocus(rarityBias)}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-end justify-center mb-8 px-4" style={{ height: `${chartHeight}px`, overflow: 'visible' }}>
        {probabilities.map((prob, i) => {
          // Use absolute scaling: bar height directly represents probability
          // Scale so 100% probability = maxBarHeight (bars grow proportionally to actual %)
          // This ensures bars are always dynamic and never hit a ceiling
          const scaledHeight = (prob / 100) * maxBarHeight;
          const height = Math.max(2, scaledHeight); // Minimum 2px for visibility
          const rank = RANKS[i];
          
          return (
            <div
              key={rank.name}
              className="flex-1 mx-1 relative group hover:brightness-125"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${rank.color}88, ${rank.color})`,
                borderRadius: '4px 4px 0 0',
                boxShadow: `0 0 8px ${rank.color}55`,
                transition: 'height 75ms ease-out, filter 200ms ease'
              }}
            >
              <div 
                className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap opacity-80"
                style={{ color: rank.color }}
              >
                {prob.toFixed(1)}%
              </div>
              <div 
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 font-semibold text-sm"
                style={{ color: rank.color }}
              >
                {rank.name}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center text-gray-400 mt-10">
        This shows the probability of crafting at each rarity level
      </div>
      
      {/* Slider Control */}
      {showSlider && onSliderChange && (
        <div className="mt-8 px-4">
          <label className="block text-yellow-400 text-sm font-bold mb-2">
            Adjust Rarity Bias: {actualDisplayBias}
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            value={actualDisplayBias}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #999999 0%, #87CEEB 10%, #90EE90 20%, #FFF700 30%, #FFB6C1 40%, #DA70D6 50%, #9370DB 60%, #FF8C00 70%, #DC143C 80%, #8B0000 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>100</span>
            <span>200</span>
            <span>300</span>
            <span>400</span>
            <span>500</span>
            <span>600</span>
            <span>700</span>
            <span>800</span>
            <span>900</span>
            <span>1000</span>
          </div>
        </div>
      )}
    </div>
  );
}