"use client";

import { useMemo } from "react";

interface Rank {
  name: string;
  color: string;
  min: number;
  max: number;
}

type ChartSize = 'large' | 'medium' | 'small' | 'micro' | 'sub-micro' | 'ultra-micro';

interface SizeConfig {
  chartHeight: number;
  maxBarHeight: number;
  maxWidth: string;
  padding: string;
  biasNumberSize: string;
  showHeader: boolean;
  showFocusText: boolean;
  showPercentLabels: boolean;
  showRankLabels: boolean;
  showDescription: boolean;
  showSliderLabels: boolean;
  showPeakLabel: boolean; // Shows percentage below peak bar for compact sizes
  percentLabelClass: string;
  rankLabelClass: string;
  barMargin: string;
  barRadius: string;
  bottomMargin: string;
  topLabelOffset: string;
  bottomLabelOffset: string;
  barMinWidth?: string; // For skinny bars
}

const SIZE_CONFIGS: Record<ChartSize, SizeConfig> = {
  large: {
    chartHeight: 300,
    maxBarHeight: 290,
    maxWidth: 'max-w-full',
    padding: 'p-6',
    biasNumberSize: '72px',
    showHeader: true,
    showFocusText: true,
    showPercentLabels: true,
    showRankLabels: true,
    showDescription: true,
    showSliderLabels: true,
    showPeakLabel: false,
    percentLabelClass: 'text-xs',
    rankLabelClass: 'text-sm font-semibold',
    barMargin: 'mx-1',
    barRadius: '4px 4px 0 0',
    bottomMargin: 'mb-8',
    topLabelOffset: '-top-5',
    bottomLabelOffset: '-bottom-6',
  },
  medium: {
    chartHeight: 150,
    maxBarHeight: 140,
    maxWidth: 'max-w-md',
    padding: 'p-3',
    biasNumberSize: '36px',
    showHeader: true,
    showFocusText: false,
    showPercentLabels: true,
    showRankLabels: true,
    showDescription: false,
    showSliderLabels: false,
    showPeakLabel: false,
    percentLabelClass: 'text-[9px]',
    rankLabelClass: 'text-[10px] font-semibold',
    barMargin: 'mx-0.5',
    barRadius: '3px 3px 0 0',
    bottomMargin: 'mb-5',
    topLabelOffset: '-top-4',
    bottomLabelOffset: '-bottom-4',
  },
  small: {
    chartHeight: 80,
    maxBarHeight: 70,
    maxWidth: 'max-w-xs',
    padding: 'p-2',
    biasNumberSize: '24px',
    showHeader: true,
    showFocusText: false,
    showPercentLabels: false,
    showRankLabels: true,
    showDescription: false,
    showSliderLabels: false,
    showPeakLabel: false,
    percentLabelClass: 'text-[7px]',
    rankLabelClass: 'text-[8px] font-semibold',
    barMargin: 'mx-px',
    barRadius: '2px 2px 0 0',
    bottomMargin: 'mb-3',
    topLabelOffset: '-top-3',
    bottomLabelOffset: '-bottom-3',
  },
  micro: {
    chartHeight: 40,
    maxBarHeight: 36,
    maxWidth: 'max-w-[180px]',
    padding: 'p-1.5',
    biasNumberSize: '16px',
    showHeader: false,
    showFocusText: false,
    showPercentLabels: false,
    showRankLabels: false,
    showDescription: false,
    showSliderLabels: false,
    showPeakLabel: true,
    percentLabelClass: 'text-[6px]',
    rankLabelClass: 'text-[6px]',
    barMargin: 'mx-px',
    barRadius: '1px 1px 0 0',
    bottomMargin: 'mb-4',
    topLabelOffset: '-top-2',
    bottomLabelOffset: '-bottom-2',
  },
  'sub-micro': {
    chartHeight: 30,
    maxBarHeight: 26,
    maxWidth: 'max-w-[140px]',
    padding: 'p-1',
    biasNumberSize: '14px',
    showHeader: false,
    showFocusText: false,
    showPercentLabels: false,
    showRankLabels: false,
    showDescription: false,
    showSliderLabels: false,
    showPeakLabel: true,
    percentLabelClass: 'text-[5px]',
    rankLabelClass: 'text-[5px]',
    barMargin: '',
    barRadius: '1px 1px 0 0',
    bottomMargin: 'mb-3',
    topLabelOffset: '-top-2',
    bottomLabelOffset: '-bottom-2',
    barMinWidth: '3px',
  },
  'ultra-micro': {
    chartHeight: 20,
    maxBarHeight: 20,
    maxWidth: 'max-w-[120px]',
    padding: 'p-0',
    biasNumberSize: '12px',
    showHeader: false,
    showFocusText: false,
    showPercentLabels: false,
    showRankLabels: false,
    showDescription: false,
    showSliderLabels: false,
    showPeakLabel: true,
    percentLabelClass: '',
    rankLabelClass: '',
    barMargin: '',
    barRadius: '2px',
    bottomMargin: 'mb-3',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
};

interface RarityChartProps {
  rarityBias: number;
  displayBias?: number;
  onSliderChange?: (value: number) => void;
  showSlider?: boolean;
  size?: ChartSize;
  // Legacy props (override size config if provided)
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

// Generate smooth gradient for ultra-micro based on probabilities
function generateSmoothGradient(probabilities: number[]): string {
  // Create color stops based on probability-weighted colors
  const stops: string[] = [];
  const maxProb = Math.max(...probabilities);

  probabilities.forEach((prob, i) => {
    const rank = RANKS[i];
    const position = (i / (RANKS.length - 1)) * 100;
    // Opacity based on probability (higher prob = more visible)
    const opacity = Math.max(0.2, prob / maxProb);
    stops.push(`${rank.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} ${position}%`);
  });

  return `linear-gradient(to right, ${stops.join(', ')})`;
}

// Calculate the "peak" position for the gradient glow effect
function calculatePeakPosition(probabilities: number[]): number {
  let maxProb = 0;
  let peakIndex = 0;
  probabilities.forEach((prob, i) => {
    if (prob > maxProb) {
      maxProb = prob;
      peakIndex = i;
    }
  });
  return (peakIndex / (RANKS.length - 1)) * 100;
}

export default function RarityChart({
  rarityBias,
  displayBias,
  onSliderChange,
  showSlider = true,
  size = 'large',
  chartHeight: chartHeightOverride,
  maxBarHeight: maxBarHeightOverride,
  hideCenterDisplay
}: RarityChartProps) {
  const config = SIZE_CONFIGS[size];
  const actualDisplayBias = displayBias ?? rarityBias;
  const probabilities = useMemo(() => calculateProbabilities(rarityBias), [rarityBias]);

  // Allow legacy prop overrides
  const chartHeight = chartHeightOverride ?? config.chartHeight;
  const maxBarHeight = maxBarHeightOverride ?? config.maxBarHeight;
  const showHeader = hideCenterDisplay !== undefined ? !hideCenterDisplay : config.showHeader;

  // Find peak probability info for compact sizes
  const peakIndex = probabilities.indexOf(Math.max(...probabilities));
  const peakProb = probabilities[peakIndex];
  const peakRank = RANKS[peakIndex];

  // Ultra-micro renders a smooth gradient instead of bars
  if (size === 'ultra-micro') {
    const gradient = generateSmoothGradient(probabilities);
    const peakPos = calculatePeakPosition(probabilities);

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="rounded-sm overflow-hidden"
          style={{ height: `${chartHeight}px` }}
        >
          <div
            className="w-full h-full relative"
            style={{
              background: gradient,
              boxShadow: `0 0 8px ${peakRank.color}66, inset 0 0 4px rgba(0,0,0,0.5)`
            }}
          >
            {/* Highlight indicator showing peak position */}
            <div
              className="absolute top-0 h-full w-1 bg-white/60 blur-[2px]"
              style={{
                left: `${peakPos}%`,
                transform: 'translateX(-50%)',
                transition: 'left 150ms ease-out'
              }}
            />
          </div>
        </div>
        {/* Peak label below */}
        {config.showPeakLabel && (
          <div className="text-center mt-1">
            <span className="text-[9px] font-semibold" style={{ color: peakRank.color }}>
              {peakRank.name}: {peakProb.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${config.maxWidth} bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm rounded-lg ${config.padding} border border-yellow-500/10`}>
      {showHeader && (
        <div className="text-center mb-2">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Bias</div>
          <div
            className="text-yellow-400"
            style={{
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: config.biasNumberSize,
              fontWeight: 200,
              letterSpacing: '1px',
              lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {actualDisplayBias}
          </div>
          {config.showFocusText && (
            <div className="text-gray-300 text-sm font-inter mt-1">
              Focus: <span className="text-yellow-400 font-semibold">{getCurrentFocus(rarityBias)}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex items-end ${config.barMinWidth ? 'justify-center gap-0.5' : 'justify-center'} ${config.bottomMargin}`}
        style={{ height: `${chartHeight}px`, overflow: 'visible' }}
      >
        {probabilities.map((prob, i) => {
          // Use absolute scaling with amplification for better visual height
          // Scale so ~40% probability = maxBarHeight (since max probs are typically 30-35%)
          // This makes bars taller while still being dynamic and proportional
          const scaledHeight = (prob / 40) * maxBarHeight;
          const height = Math.max(2, scaledHeight); // Minimum 2px for visibility
          const rank = RANKS[i];
          const isPeak = i === peakIndex;

          return (
            <div
              key={rank.name}
              className={`${config.barMinWidth ? '' : 'flex-1'} ${config.barMargin} relative group hover:brightness-125`}
              style={{
                height: `${height}px`,
                width: config.barMinWidth || undefined,
                minWidth: config.barMinWidth || undefined,
                background: `linear-gradient(to top, ${rank.color}88, ${rank.color})`,
                borderRadius: config.barRadius,
                boxShadow: `0 0 ${size === 'micro' || size === 'sub-micro' ? '2px' : '6px'} ${rank.color}44`,
                transition: 'height 75ms ease-out, filter 200ms ease'
              }}
            >
              {config.showPercentLabels && (
                <div
                  className={`absolute ${config.topLabelOffset} left-1/2 transform -translate-x-1/2 ${config.percentLabelClass} whitespace-nowrap opacity-80`}
                  style={{ color: rank.color }}
                >
                  {prob.toFixed(1)}%
                </div>
              )}
              {config.showRankLabels && (
                <div
                  className={`absolute ${config.bottomLabelOffset} left-1/2 transform -translate-x-1/2 ${config.rankLabelClass}`}
                  style={{ color: rank.color }}
                >
                  {rank.name}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Peak label for compact sizes */}
      {config.showPeakLabel && (
        <div className="text-center">
          <span className="text-[9px] font-semibold" style={{ color: peakRank.color }}>
            {peakRank.name}: {peakProb.toFixed(0)}%
          </span>
        </div>
      )}

      {config.showDescription && (
        <div className="text-center text-gray-400 text-sm mt-6">
          This shows the probability of crafting at each rarity level
        </div>
      )}

      {/* Slider Control */}
      {showSlider && onSliderChange && (
        <div className="mt-6 px-2">
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
          {config.showSliderLabels && (
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
          )}
        </div>
      )}
    </div>
  );
}
