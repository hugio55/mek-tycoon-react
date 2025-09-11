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
  isFull?: boolean; // If essence is at max capacity
}

interface DonutChartProps {
  data: EssenceData[];
  size?: number;
  strokeWidth?: number;
  showCenterStats?: boolean;
  animationDuration?: number;
  className?: string;
  onSliceHover?: (sliceId: string | null) => void;
  onSliceClick?: (sliceId: string) => void;
  selectedSlice?: string | null;
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
  animationDuration = 800,
  className = "",
  onSliceHover,
  onSliceClick,
  selectedSlice,
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

  // Animation effect - Start immediately
  useEffect(() => {
    // Start with a small initial value to show something immediately
    setAnimationProgress(0.01);
    
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
    
    // Start animation on next frame
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
      {/* Chart container without frame */}
      <div className="relative">

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
              
              {/* Striped pattern for full essences */}
              <pattern id="full-stripes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="10" height="10" fill="transparent" />
                <rect width="3" height="10" fill="rgba(59, 130, 246, 0.3)" />
                <rect x="5" width="3" height="10" fill="rgba(96, 165, 250, 0.3)" />
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
                const isSelected = selectedSlice === slice.id;
                const scale = isHovered || isSelected ? 1.05 : 1;
                const opacity = (hoveredSlice || selectedSlice) && !isHovered && !isSelected ? 0.5 : 1;
                
                return (
                  <g key={slice.id}>
                    {/* Main slice */}
                    <path
                      d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                      fill={`url(#slice-gradient-${slice.id})`}
                      stroke={isHovered || isSelected ? theme.colors.primary.yellow : 'rgba(0, 0, 0, 0.5)'}
                      strokeWidth={isHovered || isSelected ? 3 : 1}
                      opacity={opacity}
                      transform={`scale(${scale}) translate(${(1 - scale) * center}px, ${(1 - scale) * center}px)`}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        filter: isHovered || isSelected ? `drop-shadow(0 0 20px ${slice.color}80)` : 'none'
                      }}
                      onMouseEnter={() => {
                        setHoveredSlice(slice.id);
                        onSliceHover?.(slice.id);
                      }}
                      onMouseLeave={() => {
                        setHoveredSlice(null);
                        onSliceHover?.(null);
                      }}
                      onClick={() => {
                        onSliceClick?.(slice.id);
                      }}
                    />

                    {/* Texture overlay */}
                    <path
                      d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                      fill="url(#metal-texture)"
                      opacity={0.3}
                      pointerEvents="none"
                    />
                    
                    {/* Striped overlay for full essences */}
                    {slice.isFull && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill="url(#full-stripes)"
                        opacity={1}
                        pointerEvents="none"
                        className="animate-pulse"
                      />
                    )}

                    {/* Removed percentage labels from slices */}
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

          </svg>
      </div>
    </div>
  );
}