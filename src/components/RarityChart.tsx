"use client";

import { useMemo } from "react";

interface Rank {
  name: string;
  color: string;
  min: number;
  max: number;
}

type ChartSize = 'large' | 'medium' | 'small' | 'micro' | 'sub-micro' | 'sub-micro-lg' | 'sub-micro-sm' | 'ultra-micro' | 'ultra-micro-bar' | 'ultra-micro-dot' | 'creative-radial' | 'creative-wave' | 'creative-orbital' | 'wave-heartbeat' | 'wave-mirror' | 'wave-spectrum';

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
  'sub-micro-lg': {
    chartHeight: 38,
    maxBarHeight: 34,
    maxWidth: 'max-w-[170px]',
    padding: 'p-1.5',
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
    barMinWidth: '5px',
  },
  'sub-micro-sm': {
    chartHeight: 22,
    maxBarHeight: 18,
    maxWidth: 'max-w-[100px]',
    padding: 'p-0.5',
    biasNumberSize: '12px',
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
    bottomMargin: 'mb-2',
    topLabelOffset: '-top-2',
    bottomLabelOffset: '-bottom-2',
    barMinWidth: '2px',
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
  'ultra-micro-bar': {
    chartHeight: 16,
    maxBarHeight: 16,
    maxWidth: 'max-w-[100px]',
    padding: 'p-0',
    biasNumberSize: '10px',
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
    bottomMargin: 'mb-2',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'ultra-micro-dot': {
    chartHeight: 12,
    maxBarHeight: 12,
    maxWidth: 'max-w-[80px]',
    padding: 'p-0',
    biasNumberSize: '10px',
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
    barRadius: '6px',
    bottomMargin: 'mb-2',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'creative-radial': {
    chartHeight: 140,
    maxBarHeight: 140,
    maxWidth: 'max-w-[180px]',
    padding: 'p-2',
    biasNumberSize: '24px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'creative-wave': {
    chartHeight: 60,
    maxBarHeight: 60,
    maxWidth: 'max-w-[200px]',
    padding: 'p-2',
    biasNumberSize: '16px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'creative-orbital': {
    chartHeight: 120,
    maxBarHeight: 120,
    maxWidth: 'max-w-[140px]',
    padding: 'p-2',
    biasNumberSize: '20px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'wave-heartbeat': {
    chartHeight: 70,
    maxBarHeight: 70,
    maxWidth: 'max-w-[220px]',
    padding: 'p-2',
    biasNumberSize: '16px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'wave-mirror': {
    chartHeight: 80,
    maxBarHeight: 80,
    maxWidth: 'max-w-[200px]',
    padding: 'p-2',
    biasNumberSize: '16px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
    topLabelOffset: '',
    bottomLabelOffset: '',
  },
  'wave-spectrum': {
    chartHeight: 130,
    maxBarHeight: 130,
    maxWidth: 'max-w-[140px]',
    padding: 'p-2',
    biasNumberSize: '18px',
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
    barRadius: '',
    bottomMargin: 'mb-0',
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

  // Ultra-micro-bar: Single progress bar filled to peak position with peak color
  if (size === 'ultra-micro-bar') {
    const peakPos = calculatePeakPosition(probabilities);

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="rounded-full overflow-hidden relative"
          style={{
            height: `${chartHeight}px`,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Fill bar */}
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${peakPos}%`,
              background: `linear-gradient(to right, ${RANKS[0].color}, ${peakRank.color})`,
              boxShadow: `0 0 10px ${peakRank.color}88`,
              transition: 'width 150ms ease-out'
            }}
          />
          {/* End cap glow */}
          <div
            className="absolute top-0 h-full w-2 rounded-full"
            style={{
              left: `${peakPos}%`,
              transform: 'translateX(-50%)',
              background: peakRank.color,
              boxShadow: `0 0 6px ${peakRank.color}`,
              transition: 'left 150ms ease-out'
            }}
          />
        </div>
        {/* Peak label below */}
        {config.showPeakLabel && (
          <div className="text-center mt-1">
            <span className="text-[8px] font-semibold" style={{ color: peakRank.color }}>
              {peakRank.name}: {peakProb.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Ultra-micro-dot: Track with glowing dot indicator
  if (size === 'ultra-micro-dot') {
    const peakPos = calculatePeakPosition(probabilities);

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative"
          style={{ height: `${chartHeight}px` }}
        >
          {/* Track background with gradient */}
          <div
            className="absolute top-1/2 left-0 right-0 rounded-full"
            style={{
              height: '3px',
              transform: 'translateY(-50%)',
              background: `linear-gradient(to right, ${RANKS.map((r, i) => `${r.color} ${(i / (RANKS.length - 1)) * 100}%`).join(', ')})`,
              opacity: 0.4
            }}
          />
          {/* Glowing dot indicator */}
          <div
            className="absolute top-1/2"
            style={{
              left: `${peakPos}%`,
              transform: 'translate(-50%, -50%)',
              width: `${chartHeight}px`,
              height: `${chartHeight}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${peakRank.color} 0%, ${peakRank.color}88 40%, transparent 70%)`,
              boxShadow: `0 0 8px ${peakRank.color}, 0 0 12px ${peakRank.color}66`,
              transition: 'left 150ms ease-out'
            }}
          />
          {/* Center bright dot */}
          <div
            className="absolute top-1/2"
            style={{
              left: `${peakPos}%`,
              transform: 'translate(-50%, -50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: `0 0 4px white`,
              transition: 'left 150ms ease-out'
            }}
          />
        </div>
        {/* Peak label below */}
        {config.showPeakLabel && (
          <div className="text-center mt-0.5">
            <span className="text-[8px] font-semibold" style={{ color: peakRank.color }}>
              {peakRank.name}: {peakProb.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // CREATIVE VARIATIONS - Experimental designs!
  // ============================================

  // Creative Radial: Semi-circular gauge with needle indicator
  if (size === 'creative-radial') {
    const peakPos = calculatePeakPosition(probabilities);
    // Convert position (0-100) to angle (-90 to 90 degrees for semi-circle)
    const needleAngle = -90 + (peakPos / 100) * 180;

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative mx-auto"
          style={{ width: '140px', height: '80px', overflow: 'hidden' }}
        >
          {/* Outer arc segments */}
          <svg viewBox="0 0 140 80" className="w-full h-full">
            <defs>
              {RANKS.map((rank, i) => (
                <linearGradient key={`grad-${i}`} id={`arcGrad${i}`}>
                  <stop offset="0%" stopColor={rank.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={rank.color} stopOpacity="1" />
                </linearGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Arc segments for each rank */}
            {RANKS.map((rank, i) => {
              const startAngle = 180 + (i / RANKS.length) * 180;
              const endAngle = 180 + ((i + 1) / RANKS.length) * 180;
              const opacity = Math.max(0.3, probabilities[i] / Math.max(...probabilities));

              const innerRadius = 50;
              const outerRadius = 65;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 70 + outerRadius * Math.cos(startRad);
              const y1 = 75 + outerRadius * Math.sin(startRad);
              const x2 = 70 + outerRadius * Math.cos(endRad);
              const y2 = 75 + outerRadius * Math.sin(endRad);
              const x3 = 70 + innerRadius * Math.cos(endRad);
              const y3 = 75 + innerRadius * Math.sin(endRad);
              const x4 = 70 + innerRadius * Math.cos(startRad);
              const y4 = 75 + innerRadius * Math.sin(startRad);

              return (
                <path
                  key={rank.name}
                  d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`}
                  fill={rank.color}
                  opacity={opacity}
                  style={{ transition: 'opacity 150ms ease-out' }}
                />
              );
            })}

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 70, 75)`} style={{ transition: 'transform 150ms ease-out' }}>
              <line x1="70" y1="75" x2="70" y2="20" stroke={peakRank.color} strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
              <circle cx="70" cy="75" r="6" fill={peakRank.color} filter="url(#glow)" />
              <circle cx="70" cy="75" r="3" fill="white" />
            </g>
          </svg>
        </div>
        {/* Peak label below */}
        <div className="text-center mt-1">
          <span className="text-[11px] font-bold" style={{ color: peakRank.color }}>
            {peakRank.name}
          </span>
          <span className="text-[10px] text-gray-400 ml-1">
            {peakProb.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  // Creative Wave: Audio visualizer / heartbeat style
  if (size === 'creative-wave') {
    // Generate wave points based on probabilities
    const wavePoints: string[] = [];
    const width = 200;
    const height = 50;
    const padding = 10;

    // Create smooth wave using probabilities
    probabilities.forEach((prob, i) => {
      const x = padding + (i / (probabilities.length - 1)) * (width - padding * 2);
      const waveHeight = (prob / 40) * (height - 10);
      const y = height / 2 - waveHeight / 2;
      wavePoints.push(`${x},${y}`);
    });

    // Mirror for bottom of wave
    const bottomPoints = [...probabilities].reverse().map((prob, i) => {
      const x = padding + ((probabilities.length - 1 - i) / (probabilities.length - 1)) * (width - padding * 2);
      const waveHeight = (prob / 40) * (height - 10);
      const y = height / 2 + waveHeight / 2;
      return `${x},${y}`;
    });

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            height: `${chartHeight}px`,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)'
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {RANKS.map((rank, i) => (
                  <stop
                    key={rank.name}
                    offset={`${(i / (RANKS.length - 1)) * 100}%`}
                    stopColor={rank.color}
                    stopOpacity={Math.max(0.5, probabilities[i] / Math.max(...probabilities))}
                  />
                ))}
              </linearGradient>
              <filter id="waveGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={height * y}
                x2={width}
                y2={height * y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            ))}

            {/* Wave shape */}
            <polygon
              points={[...wavePoints, ...bottomPoints].join(' ')}
              fill="url(#waveGradient)"
              filter="url(#waveGlow)"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Peak indicator line */}
            <line
              x1={padding + (peakIndex / (probabilities.length - 1)) * (width - padding * 2)}
              y1="0"
              x2={padding + (peakIndex / (probabilities.length - 1)) * (width - padding * 2)}
              y2={height}
              stroke={peakRank.color}
              strokeWidth="2"
              strokeDasharray="3,2"
              opacity="0.8"
              style={{ transition: 'all 150ms ease-out' }}
            />
          </svg>
        </div>
        {/* Peak label */}
        <div className="text-center mt-1">
          <span className="text-[10px] font-semibold" style={{ color: peakRank.color }}>
            {peakRank.name}: {peakProb.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  // Creative Orbital: Concentric rings with orbiting particle
  if (size === 'creative-orbital') {
    const peakPos = calculatePeakPosition(probabilities);
    // Convert to angle (0-360)
    const orbitAngle = (peakPos / 100) * 360 - 90;

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative mx-auto"
          style={{ width: '120px', height: '120px' }}
        >
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <filter id="orbitalGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={peakRank.color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={peakRank.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background glow */}
            <circle cx="60" cy="60" r="50" fill="url(#centerGlow)" style={{ transition: 'all 150ms ease-out' }} />

            {/* Concentric rings - one for each rank tier (grouped) */}
            {[0, 1, 2, 3, 4].map((ring) => {
              const radius = 15 + ring * 9;
              const rankIndex = ring * 2;
              const color = RANKS[Math.min(rankIndex, RANKS.length - 1)].color;
              const opacity = Math.max(0.15, (probabilities[rankIndex] || 0) / Math.max(...probabilities) * 0.5);

              return (
                <circle
                  key={ring}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={opacity}
                  style={{ transition: 'opacity 150ms ease-out' }}
                />
              );
            })}

            {/* Orbit path for the particle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Orbiting particle */}
            <g style={{
              transform: `rotate(${orbitAngle}deg)`,
              transformOrigin: '60px 60px',
              transition: 'transform 150ms ease-out'
            }}>
              {/* Particle trail */}
              <ellipse
                cx="105"
                cy="60"
                rx="8"
                ry="4"
                fill={peakRank.color}
                opacity="0.3"
                filter="url(#orbitalGlow)"
              />
              {/* Main particle */}
              <circle
                cx="105"
                cy="60"
                r="6"
                fill={peakRank.color}
                filter="url(#orbitalGlow)"
              />
              <circle
                cx="105"
                cy="60"
                r="3"
                fill="white"
              />
            </g>

            {/* Center display */}
            <text
              x="60"
              y="58"
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={peakRank.color}
              style={{ transition: 'fill 150ms ease-out' }}
            >
              {peakRank.name}
            </text>
            <text
              x="60"
              y="72"
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.7)"
            >
              {peakProb.toFixed(0)}%
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // Wave Heartbeat: ECG/heart monitor style with scanning effect
  if (size === 'wave-heartbeat') {
    const width = 220;
    const height = 60;
    const padding = 15;
    const centerY = height / 2;

    // Generate ECG-style path with sharp peaks
    let pathD = `M ${padding} ${centerY}`;

    probabilities.forEach((prob, i) => {
      const segmentWidth = (width - padding * 2) / probabilities.length;
      const x = padding + i * segmentWidth;
      const nextX = x + segmentWidth;

      // Height of the peak (inverted so higher probability = higher peak)
      const peakHeight = (prob / 40) * (height * 0.8);

      if (i === peakIndex) {
        // Sharp ECG spike at peak probability
        pathD += ` L ${x + segmentWidth * 0.2} ${centerY}`;
        pathD += ` L ${x + segmentWidth * 0.3} ${centerY + peakHeight * 0.3}`;
        pathD += ` L ${x + segmentWidth * 0.4} ${centerY - peakHeight}`;
        pathD += ` L ${x + segmentWidth * 0.5} ${centerY + peakHeight * 0.5}`;
        pathD += ` L ${x + segmentWidth * 0.6} ${centerY - peakHeight * 0.2}`;
        pathD += ` L ${x + segmentWidth * 0.8} ${centerY}`;
        pathD += ` L ${nextX} ${centerY}`;
      } else {
        // Smaller bumps for other probabilities
        const bumpHeight = peakHeight * 0.4;
        pathD += ` L ${x + segmentWidth * 0.3} ${centerY}`;
        pathD += ` L ${x + segmentWidth * 0.5} ${centerY - bumpHeight}`;
        pathD += ` L ${x + segmentWidth * 0.7} ${centerY}`;
        pathD += ` L ${nextX} ${centerY}`;
      }
    });

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            height: `${chartHeight}px`,
            background: 'linear-gradient(180deg, rgba(0,20,0,0.8) 0%, rgba(0,10,0,0.95) 100%)',
            border: '1px solid rgba(0,255,0,0.2)'
          }}
        >
          {/* Scan lines effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)'
            }}
          />

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {RANKS.map((rank, i) => (
                  <stop
                    key={rank.name}
                    offset={`${(i / (RANKS.length - 1)) * 100}%`}
                    stopColor={rank.color}
                  />
                ))}
              </linearGradient>
              <filter id="heartbeatGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={height * y}
                x2={width}
                y2={height * y}
                stroke="rgba(0,255,0,0.1)"
                strokeWidth="0.5"
              />
            ))}
            {[...Array(10)].map((_, i) => (
              <line
                key={i}
                x1={padding + i * ((width - padding * 2) / 10)}
                y1="0"
                x2={padding + i * ((width - padding * 2) / 10)}
                y2={height}
                stroke="rgba(0,255,0,0.1)"
                strokeWidth="0.5"
              />
            ))}

            {/* ECG line */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#heartbeatGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#heartbeatGlow)"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Glow at peak */}
            <circle
              cx={padding + peakIndex * ((width - padding * 2) / probabilities.length) + ((width - padding * 2) / probabilities.length) * 0.4}
              cy={centerY - (peakProb / 40) * (height * 0.8)}
              r="4"
              fill={peakRank.color}
              filter="url(#heartbeatGlow)"
              style={{ transition: 'all 150ms ease-out' }}
            />
          </svg>

          {/* Monitor corner text */}
          <div className="absolute top-1 left-2 text-[8px] font-mono" style={{ color: 'rgba(0,255,0,0.6)' }}>
            BIAS MONITOR
          </div>
          <div className="absolute top-1 right-2 text-[10px] font-mono font-bold" style={{ color: peakRank.color }}>
            {peakRank.name}
          </div>
        </div>
        {/* Peak label */}
        <div className="text-center mt-1">
          <span className="text-[10px] font-semibold" style={{ color: peakRank.color }}>
            {peakRank.name}: {peakProb.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  // Wave Mirror: Symmetrical reflection wave
  if (size === 'wave-mirror') {
    const width = 200;
    const height = 70;
    const padding = 10;
    const centerY = height / 2;

    // Generate top wave points
    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    probabilities.forEach((prob, i) => {
      const x = padding + (i / (probabilities.length - 1)) * (width - padding * 2);
      const waveHeight = (prob / 40) * (height * 0.45);
      topPoints.push(`${x},${centerY - waveHeight}`);
      bottomPoints.push(`${x},${centerY + waveHeight}`);
    });

    // Create smooth curve path for top
    let topPath = `M ${topPoints[0]}`;
    for (let i = 1; i < topPoints.length; i++) {
      const [x, y] = topPoints[i].split(',').map(Number);
      const [prevX, prevY] = topPoints[i - 1].split(',').map(Number);
      const cpX = (prevX + x) / 2;
      topPath += ` Q ${cpX},${prevY} ${cpX},${(prevY + y) / 2} T ${x},${y}`;
    }

    // Create smooth curve path for bottom
    let bottomPath = `M ${bottomPoints[0]}`;
    for (let i = 1; i < bottomPoints.length; i++) {
      const [x, y] = bottomPoints[i].split(',').map(Number);
      const [prevX, prevY] = bottomPoints[i - 1].split(',').map(Number);
      const cpX = (prevX + x) / 2;
      bottomPath += ` Q ${cpX},${prevY} ${cpX},${(prevY + y) / 2} T ${x},${y}`;
    }

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            height: `${chartHeight}px`,
            background: 'linear-gradient(180deg, rgba(20,0,40,0.8) 0%, rgba(0,0,20,0.9) 50%, rgba(20,0,40,0.8) 100%)'
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mirrorGradientTop" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor={peakRank.color} stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="mirrorGradientBottom" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor={peakRank.color} stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="mirrorStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {RANKS.map((rank, i) => (
                  <stop
                    key={rank.name}
                    offset={`${(i / (RANKS.length - 1)) * 100}%`}
                    stopColor={rank.color}
                  />
                ))}
              </linearGradient>
              <filter id="mirrorGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Center reflection line */}
            <line
              x1="0"
              y1={centerY}
              x2={width}
              y2={centerY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Top wave fill */}
            <path
              d={`${topPath} L ${width - padding},${centerY} L ${padding},${centerY} Z`}
              fill="url(#mirrorGradientTop)"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Bottom wave fill (reflection) */}
            <path
              d={`${bottomPath} L ${width - padding},${centerY} L ${padding},${centerY} Z`}
              fill="url(#mirrorGradientBottom)"
              opacity="0.6"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Top wave stroke */}
            <path
              d={topPath}
              fill="none"
              stroke="url(#mirrorStrokeGradient)"
              strokeWidth="2"
              filter="url(#mirrorGlow)"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Bottom wave stroke (reflection) */}
            <path
              d={bottomPath}
              fill="none"
              stroke="url(#mirrorStrokeGradient)"
              strokeWidth="1.5"
              opacity="0.4"
              style={{ transition: 'all 150ms ease-out' }}
            />

            {/* Peak markers */}
            {probabilities.map((prob, i) => {
              if (prob < peakProb * 0.7) return null;
              const x = padding + (i / (probabilities.length - 1)) * (width - padding * 2);
              const waveHeight = (prob / 40) * (height * 0.45);
              return (
                <g key={i}>
                  <circle cx={x} cy={centerY - waveHeight} r="3" fill={RANKS[i].color} filter="url(#mirrorGlow)" />
                  <circle cx={x} cy={centerY + waveHeight} r="2" fill={RANKS[i].color} opacity="0.4" />
                </g>
              );
            })}
          </svg>
        </div>
        {/* Peak label */}
        <div className="text-center mt-1">
          <span className="text-[10px] font-semibold" style={{ color: peakRank.color }}>
            {peakRank.name}: {peakProb.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  // Wave Spectrum: Circular radial spectrum analyzer
  if (size === 'wave-spectrum') {
    const size_dim = 120;
    const centerX = size_dim / 2;
    const centerY = size_dim / 2;
    const innerRadius = 25;
    const maxBarLength = 30;

    return (
      <div className={`${config.maxWidth}`}>
        <div
          className="relative mx-auto"
          style={{ width: `${size_dim}px`, height: `${size_dim}px` }}
        >
          <svg viewBox={`0 0 ${size_dim} ${size_dim}`} className="w-full h-full">
            <defs>
              <filter id="spectrumGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="spectrumCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={peakRank.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={peakRank.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background glow */}
            <circle cx={centerX} cy={centerY} r={innerRadius + 10} fill="url(#spectrumCenter)" />

            {/* Inner circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill="rgba(0,0,0,0.6)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />

            {/* Spectrum bars radiating outward */}
            {probabilities.map((prob, i) => {
              // Distribute bars around the circle
              const angle = (i / probabilities.length) * 360 - 90;
              const angleRad = (angle * Math.PI) / 180;

              const barLength = (prob / 40) * maxBarLength;
              const startX = centerX + innerRadius * Math.cos(angleRad);
              const startY = centerY + innerRadius * Math.sin(angleRad);
              const endX = centerX + (innerRadius + barLength) * Math.cos(angleRad);
              const endY = centerY + (innerRadius + barLength) * Math.sin(angleRad);

              const rank = RANKS[i];
              const isPeak = i === peakIndex;

              return (
                <g key={i}>
                  {/* Bar shadow/glow */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={rank.color}
                    strokeWidth={isPeak ? 6 : 4}
                    strokeLinecap="round"
                    opacity="0.3"
                    filter="url(#spectrumGlow)"
                  />
                  {/* Main bar */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={rank.color}
                    strokeWidth={isPeak ? 4 : 3}
                    strokeLinecap="round"
                    style={{ transition: 'all 150ms ease-out' }}
                  />
                  {/* Tip glow for peak */}
                  {isPeak && (
                    <circle
                      cx={endX}
                      cy={endY}
                      r="4"
                      fill={rank.color}
                      filter="url(#spectrumGlow)"
                    />
                  )}
                </g>
              );
            })}

            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 3}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={peakRank.color}
              style={{ transition: 'fill 150ms ease-out' }}
            >
              {peakRank.name}
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,0.7)"
            >
              {peakProb.toFixed(0)}%
            </text>
          </svg>
        </div>
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
