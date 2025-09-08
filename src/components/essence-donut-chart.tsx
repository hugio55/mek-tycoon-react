"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import theme from "@/lib/design-system";

interface EssenceData {
  id: string;
  name: string;
  amount: number;
  currentValue: number;
  maxAmount?: number;
  maxAmountBuffed?: number; // If buffed above base maxAmount
  image?: string;
  icon?: string;
  color?: string;
  baseRate?: number; // Base generation rate per day
  bonusRate?: number; // Bonus generation rate per day
}

interface DonutChartProps {
  data: EssenceData[];
  size?: number;
  strokeWidth?: number;
  showCenterStats?: boolean;
  animationDuration?: number;
  className?: string;
}

// Industrial color palette for essence types
const ESSENCE_COLORS = [
  '#fab617', // Primary yellow
  '#ff8c00', // Orange
  '#22d3ee', // Cyan
  '#8b5cf6', // Purple
  '#10b981', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
];


export default function EssenceDonutChart({
  data,
  size = 400,
  strokeWidth = 3,
  showCenterStats = true,
  animationDuration = 1000,
  className = "",
}: DonutChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [centerDisplay, setCenterDisplay] = useState({ value: 0, label: "TOTAL ESSENCE" });
  const [showMarketTooltip, setShowMarketTooltip] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate chart dimensions with fixed thickness
  const innerRadiusRatio = 0.65; // Fixed at 35% thickness
  const viewBoxSize = size;
  const center = viewBoxSize / 2;
  const outerRadius = (viewBoxSize - strokeWidth * 2) / 2;
  const innerRadius = outerRadius * innerRadiusRatio;
  const middleRadius = (outerRadius + innerRadius) / 2;

  // Process data and calculate angles
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let currentAngle = -90; // Start from top

    return data.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const angleSpan = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const color = item.color || ESSENCE_COLORS[index % ESSENCE_COLORS.length];
      
      currentAngle = endAngle;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        angleSpan,
        color,
        total
      };
    });
  }, [data]);

  // Animation effect
  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [animationDuration, data]);

  // Update center display
  useEffect(() => {
    if (hoveredSlice) {
      const slice = processedData.find(d => d.id === hoveredSlice);
      if (slice) {
        setCenterDisplay({
          value: slice.amount,
          label: slice.name.toUpperCase()
        });
      }
    } else {
      const total = processedData.reduce((sum, item) => sum + item.amount, 0);
      setCenterDisplay({
        value: total,
        label: "TOTAL ESSENCE"
      });
    }
  }, [hoveredSlice, processedData]);

  // Create SVG path for donut slice
  const createSlicePath = (startAngle: number, endAngle: number, animProgress: number = 1) => {
    const actualEndAngle = startAngle + (endAngle - startAngle) * animProgress;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (actualEndAngle * Math.PI) / 180;
    
    const x1 = center + outerRadius * Math.cos(startAngleRad);
    const y1 = center + outerRadius * Math.sin(startAngleRad);
    const x2 = center + outerRadius * Math.cos(endAngleRad);
    const y2 = center + outerRadius * Math.sin(endAngleRad);
    
    const x3 = center + innerRadius * Math.cos(startAngleRad);
    const y3 = center + innerRadius * Math.sin(startAngleRad);
    const x4 = center + innerRadius * Math.cos(endAngleRad);
    const y4 = center + innerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = actualEndAngle - startAngle > 180 ? 1 : 0;
    
    return `
      M ${x3} ${y3}
      L ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x4} ${y4}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x3} ${y3}
      Z
    `;
  };


  return (
    <div className={`relative inline-block ${className}`}>
      {/* Industrial frame container */}
      <div className="mek-card-industrial mek-border-sharp-gold p-4 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10" />
        <div className="absolute inset-0 mek-overlay-metal-texture opacity-5" />

        {/* Chart container */}
        <div className="relative">
          {/* Glow effect behind chart */}
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle at center, ${theme.colors.primary.yellow}40 0%, transparent 70%)`,
              filter: 'blur(40px)',
              transform: 'scale(1.2)'
            }}
          />

          {/* SVG Donut Chart */}
          <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className="relative z-10"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.5))' }}
          >
            {/* Definitions for gradients and filters */}
            <defs>
              {/* Industrial scan line effect */}
              <filter id="industrial-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Create gradients for each slice */}
              {processedData.map((slice, index) => (
                <linearGradient
                  key={`gradient-${slice.id}`}
                  id={`slice-gradient-${slice.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={slice.color} stopOpacity="0.9" />
                  <stop offset="50%" stopColor={slice.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={slice.color} stopOpacity="0.7" />
                </linearGradient>
              ))}

              {/* Metal texture pattern */}
              <pattern id="metal-texture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="rgba(0,0,0,0.1)" />
                <rect width="1" height="4" fill="rgba(255,255,255,0.02)" />
                <rect width="4" height="1" fill="rgba(255,255,255,0.02)" />
              </pattern>
            </defs>

            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="none"
              stroke="rgba(250, 182, 23, 0.1)"
              strokeWidth={strokeWidth}
              strokeDasharray="5 5"
              className="animate-pulse"
            />

            {/* Inner ring */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke="rgba(250, 182, 23, 0.1)"
              strokeWidth={strokeWidth}
              strokeDasharray="3 3"
            />

            {/* Donut slices */}
            <g filter="url(#industrial-glow)">
              {processedData.map((slice, index) => {
                const isHovered = hoveredSlice === slice.id;
                const scale = isHovered ? 1.05 : 1;
                const opacity = hoveredSlice && !isHovered ? 0.5 : 1;
                
                return (
                  <g key={slice.id}>
                    {/* Main slice */}
                    <path
                      d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                      fill={`url(#slice-gradient-${slice.id})`}
                      stroke={isHovered ? theme.colors.primary.yellow : 'rgba(0, 0, 0, 0.5)'}
                      strokeWidth={isHovered ? 2 : 1}
                      opacity={opacity}
                      transform={`scale(${scale}) translate(${(1 - scale) * center}px, ${(1 - scale) * center}px)`}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        filter: isHovered ? `drop-shadow(0 0 20px ${slice.color}80)` : 'none'
                      }}
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />

                    {/* Texture overlay */}
                    <path
                      d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                      fill="url(#metal-texture)"
                      opacity={0.3}
                      pointerEvents="none"
                    />

                    {/* Percentage label (for larger slices) */}
                    {slice.percentage > 5 && animationProgress === 1 && (
                      <text
                        x={center + middleRadius * Math.cos((slice.startAngle + slice.angleSpan / 2) * Math.PI / 180)}
                        y={center + middleRadius * Math.sin((slice.startAngle + slice.angleSpan / 2) * Math.PI / 180)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-black font-bold text-xs pointer-events-none"
                        style={{ textShadow: '0 0 3px rgba(255, 255, 255, 0.8)' }}
                      >
                        {slice.percentage.toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Center display */}
            {showCenterStats && (
              <g>
                {/* Center background */}
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 10}
                  fill="rgba(0, 0, 0, 0.8)"
                  stroke="rgba(250, 182, 23, 0.3)"
                  strokeWidth="2"
                />
                
                {/* Center value */}
                <text
                  x={center}
                  y={center - 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="mek-value-primary"
                  style={{ fontSize: '2rem', fill: theme.colors.primary.yellow }}
                >
                  {centerDisplay.value.toLocaleString()}
                </text>
                
                {/* Center label */}
                <text
                  x={center}
                  y={center + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="mek-label-uppercase"
                  style={{ fill: 'rgba(156, 163, 175, 0.9)' }}
                >
                  {centerDisplay.label}
                </text>
              </g>
            )}

            {/* Scan line effect */}
            <rect
              x="0"
              y="0"
              width={viewBoxSize}
              height="2"
              fill={`url(#scan-gradient)`}
              opacity="0.6"
              className="mek-scan-effect"
            />
            
            <defs>
              <linearGradient id="scan-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor={theme.colors.primary.yellow} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>

        </div>

        {/* Details Panel - Dynamic Height */}
        <div className="mt-6 min-h-[240px] relative">
          {hoveredSlice ? (() => {
            const slice = processedData.find(d => d.id === hoveredSlice);
            if (!slice) return null;
            
            const effectiveMax = slice.maxAmountBuffed || slice.maxAmount || 10;
            const progress = (slice.amount / effectiveMax) * 100;
            const segmentCount = Math.min(Math.floor(effectiveMax), 10); // Limit subdivisions to 10
            const baseRate = slice.baseRate || 0.1;
            const bonusRate = slice.bonusRate || 0;
            const totalRate = baseRate + bonusRate;
            const totalValue = slice.amount * slice.currentValue;
            
            return (
              <div className="w-full bg-black/90 border-2 border-yellow-500/30 relative overflow-hidden"
                   style={{ boxShadow: '0 0 30px rgba(250, 182, 23, 0.15)' }}>
                {/* Background texture */}
                <div className="absolute inset-0 mek-overlay-metal-texture opacity-5" />
                
                {/* Main content area */}
                <div className="flex">
                  {/* Left: Essence Image and Name */}
                  <div className="w-40 flex flex-col items-center justify-center p-4 bg-black/40">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/60 border-2 border-yellow-500/20">
                      <Image
                        src={`/essence-images/bumblebee ${(processedData.indexOf(slice) % 3) + 1}.png`}
                        alt={slice.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <h3 className="text-base font-bold text-yellow-400 font-orbitron uppercase mt-3 tracking-wider text-center">
                      {slice.name}
                    </h3>
                    <span className="text-xs text-gray-400 mt-1 font-medium">{slice.percentage.toFixed(1)}% of total</span>
                  </div>
                  
                  {/* Right: Stats Grid */}
                  <div className="flex-1 p-5">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {/* Top Left: Base Rate */}
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">BASE RATE</div>
                        <div className="text-xl font-bold text-yellow-400 font-mono">{baseRate.toFixed(2)}/day</div>
                      </div>
                      
                      {/* Top Right: Market Price */}
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">MARKET PRICE</div>
                        <div className="text-xl font-bold text-white font-mono">{slice.currentValue}g/ea</div>
                      </div>
                      
                      {/* Bottom Left: Bonus Rate */}
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">BONUS RATE</div>
                        <div className="text-xl font-bold text-green-400 font-mono">
                          {bonusRate > 0 ? `+${bonusRate.toFixed(2)}/day` : '0.00/day'}
                        </div>
                      </div>
                      
                      {/* Bottom Right: Total Value */}
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">TOTAL VALUE</div>
                        <div className="text-xl font-bold text-yellow-400 font-mono">
                          {totalValue.toLocaleString()}g
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar Section - Integrated */}
                    <div className="mt-6 pt-4 border-t border-gray-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">ESSENCE PROGRESS</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-yellow-400">{slice.amount.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">/</span>
                            <span className="text-sm text-gray-400">{effectiveMax.toFixed(1)}</span>
                          </div>
                          {slice.maxAmountBuffed && slice.maxAmountBuffed > (slice.maxAmount || 10) && (
                            <span className="text-xs text-green-400 font-bold px-2 py-0.5 bg-green-400/10 rounded animate-pulse">
                              BUFFED
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Industrial Progress Bar */}
                      <div className="relative h-6 bg-gray-900/80 rounded overflow-hidden border border-gray-700/50">
                        {/* Divider lines */}
                        <div className="absolute inset-0 flex">
                          {Array.from({ length: segmentCount }, (_, i) => (
                            <div 
                              key={i} 
                              className="border-r border-gray-700/30" 
                              style={{ width: `${100 / segmentCount}%` }} 
                            />
                          ))}
                        </div>
                        
                        {/* Filled portion */}
                        <div 
                          className="absolute inset-y-0 left-0 transition-all duration-300"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: `linear-gradient(90deg, ${slice.color || '#fab617'}, ${slice.color || '#fab617'}dd)`,
                            boxShadow: `inset 0 0 10px ${slice.color || '#fab617'}40`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="w-full min-h-[240px] bg-black/80 border-2 border-gray-800/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-2 uppercase tracking-widest font-medium">↑ Hover slice for details ↑</div>
                <div className="text-gray-500 text-xs">Select any essence segment</div>
              </div>
            </div>
          )}
        </div>
        
        <style jsx>{`
          .glow-green {
            text-shadow: 0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6);
          }
        `}</style>

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500/50" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/50" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-500/50" />
      </div>
    </div>
  );
}