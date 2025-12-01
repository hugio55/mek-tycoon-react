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
  hoverEffect?: 1 | 2 | 3 | 4;
  liveAccumulation?: boolean;
  essenceConfig?: any;
}

// Industrial color palette for essence types - Expanded to 30 unique colors
const ESSENCE_COLORS = [
  '#fab617', // 1. Primary yellow
  '#ff8c00', // 2. Orange
  '#22d3ee', // 3. Cyan
  '#8b5cf6', // 4. Purple
  '#10b981', // 5. Green
  '#ef4444', // 6. Red
  '#3b82f6', // 7. Blue
  '#f59e0b', // 8. Amber
  '#ec4899', // 9. Pink
  '#14b8a6', // 10. Teal
  '#fbbf24', // 11. Gold
  '#fb923c', // 12. Bright Orange
  '#38bdf8', // 13. Sky Blue
  '#a78bfa', // 14. Light Purple
  '#4ade80', // 15. Lime Green
  '#f87171', // 16. Coral Red
  '#60a5fa', // 17. Light Blue
  '#fcd34d', // 18. Sunny Yellow
  '#f472b6', // 19. Hot Pink
  '#2dd4bf', // 20. Turquoise
  '#fdba74', // 21. Peach
  '#06b6d4', // 22. Cyan Blue
  '#c084fc', // 23. Lavender
  '#34d399', // 24. Mint Green
  '#fb7185', // 25. Rose
  '#818cf8', // 26. Indigo
  '#fde047', // 27. Lemon Yellow
  '#f9a8d4', // 28. Light Pink
  '#5eead4', // 29. Aqua
  '#f97316', // 30. Deep Orange
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
  hoverEffect = 1,
  liveAccumulation = false,
  essenceConfig,
}: DonutChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [centerDisplay, setCenterDisplay] = useState({ value: 0, label: "TOTAL ESSENCE" });
  const [liveDisplayValue, setLiveDisplayValue] = useState(0);
  const [showMarketTooltip, setShowMarketTooltip] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Refs for live accumulation
  const mountTimeRef = useRef(Date.now());
  const baseValueRef = useRef(0);
  
  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate chart dimensions with fixed thickness
  const innerRadiusRatio = 0.65; // Fixed at 35% thickness
  const viewBoxSize = size;
  const center = viewBoxSize / 2;
  const outerRadius = (viewBoxSize - strokeWidth * 2) / 2;
  const innerRadius = outerRadius * innerRadiusRatio;
  const middleRadius = (outerRadius + innerRadius) / 2;

  // Process data and calculate angles with minimum slice width
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    const MIN_SLICE_ANGLE = 1.6; // Minimum 1.6 degrees for hoverable slices (1/5 of original 8°)

    // Calculate natural angles first
    const naturalSlices = data.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const naturalAngle = (percentage / 100) * 360;
      return {
        ...item,
        percentage,
        naturalAngle,
        color: item.color || ESSENCE_COLORS[index % ESSENCE_COLORS.length],
        total
      };
    });

    // Identify tiny slices that need minimum angle
    const tinySlices = naturalSlices.filter(s => s.naturalAngle < MIN_SLICE_ANGLE);
    const normalSlices = naturalSlices.filter(s => s.naturalAngle >= MIN_SLICE_ANGLE);

    // Reserve space for tiny slices
    const reservedAngle = tinySlices.length * MIN_SLICE_ANGLE;
    const availableAngle = 360 - reservedAngle;

    // Calculate adjustment factor for normal slices
    const normalTotalAngle = normalSlices.reduce((sum, s) => sum + s.naturalAngle, 0);
    const scaleFactor = normalTotalAngle > 0 ? availableAngle / normalTotalAngle : 1;

    // Assign final angles
    let currentAngle = -90; // Start from top
    return naturalSlices.map(slice => {
      const angleSpan = slice.naturalAngle < MIN_SLICE_ANGLE
        ? MIN_SLICE_ANGLE
        : slice.naturalAngle * scaleFactor;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        ...slice,
        startAngle,
        endAngle,
        angleSpan
      };
    });
  }, [data]);

  // Animation effect - Run only once on mount
  useEffect(() => {
    if (!isClient) return; // Don't animate on server
    
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
  }, [isClient, animationDuration]); // Remove data dependency to prevent re-animation

  // Update center display
  useEffect(() => {
    if (hoveredSlice) {
      const slice = processedData.find(d => d.id === hoveredSlice);
      if (slice) {
        setCenterDisplay({
          value: slice.amount,
          label: slice.name.toUpperCase()
        });
        baseValueRef.current = slice.amount;
        mountTimeRef.current = Date.now();
      }
    } else {
      const total = processedData.reduce((sum, item) => sum + item.amount, 0);
      setCenterDisplay({
        value: total,
        label: "TOTAL ESSENCE"
      });
      baseValueRef.current = total;
      mountTimeRef.current = Date.now();
    }
  }, [hoveredSlice, processedData]);

  // Live accumulation animation
  useEffect(() => {
    if (!liveAccumulation || !isClient) {
      setLiveDisplayValue(centerDisplay.value);
      return;
    }

    // Calculate total rate per day
    const totalRate = hoveredSlice
      ? (processedData.find(d => d.id === hoveredSlice)?.baseRate || 0.1)
      : processedData.reduce((sum, item) => sum + (item.baseRate || 0.1), 0);

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - mountTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = baseValueRef.current + (totalRate * elapsedDays);
      setLiveDisplayValue(accumulated);
    }, 50);

    return () => clearInterval(interval);
  }, [liveAccumulation, centerDisplay.value, hoveredSlice, processedData, isClient]);

  // Create SVG path for donut slice with fixed precision
  const createSlicePath = (startAngle: number, endAngle: number, animProgress: number = 1) => {
    const actualEndAngle = startAngle + (endAngle - startAngle) * animProgress;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (actualEndAngle * Math.PI) / 180;
    
    // Round to 2 decimal places to avoid floating point differences
    const x1 = parseFloat((center + outerRadius * Math.cos(startAngleRad)).toFixed(2));
    const y1 = parseFloat((center + outerRadius * Math.sin(startAngleRad)).toFixed(2));
    const x2 = parseFloat((center + outerRadius * Math.cos(endAngleRad)).toFixed(2));
    const y2 = parseFloat((center + outerRadius * Math.sin(endAngleRad)).toFixed(2));
    
    const x3 = parseFloat((center + innerRadius * Math.cos(startAngleRad)).toFixed(2));
    const y3 = parseFloat((center + innerRadius * Math.sin(startAngleRad)).toFixed(2));
    const x4 = parseFloat((center + innerRadius * Math.cos(endAngleRad)).toFixed(2));
    const y4 = parseFloat((center + innerRadius * Math.sin(endAngleRad)).toFixed(2));
    
    const largeArcFlag = actualEndAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x3} ${y3} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x3} ${y3} Z`;
  };


  // Don't render on server to avoid hydration mismatches
  if (!isClient) {
    return (
      <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-yellow-400 animate-pulse">Loading chart...</div>
        </div>
      </div>
    );
  }

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
              {/* CSS animations for energy streaks - converted from SVG animate for better performance */}
              <style>{`
                @keyframes energy-streak-1 {
                  from { transform: translateX(-7px); }
                  to { transform: translateX(27px); }
                }
                @keyframes energy-streak-2 {
                  from { transform: translateX(-7px); }
                  to { transform: translateX(27px); }
                }
                .energy-streak-1 {
                  animation: energy-streak-1 0.5s linear infinite;
                }
                .energy-streak-2 {
                  animation: energy-streak-2 0.5s linear infinite;
                  animation-delay: 0.25s;
                }
              `}</style>
              {/* Industrial scan line effect */}
              <filter id="industrial-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Hover Effect 1: Inner Glow */}
              <filter id="inner-glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feFlood floodColor="#fab617" floodOpacity="0.5"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Hover Effect 2: Brightness Boost */}
              <filter id="brightness-boost">
                <feComponentTransfer>
                  <feFuncR type="linear" slope="1.4"/>
                  <feFuncG type="linear" slope="1.4"/>
                  <feFuncB type="linear" slope="1.4"/>
                </feComponentTransfer>
              </filter>
              
              {/* Hover Effect 3: Radial Gradient Overlay */}
              {processedData.map((slice, index) => (
                <radialGradient key={`radial-${index}`} id={`radial-gradient-${slice.id}`}>
                  <stop offset="0%" stopColor={slice.color} stopOpacity="1"/>
                  <stop offset="50%" stopColor={slice.color} stopOpacity="0.9"/>
                  <stop offset="100%" stopColor={slice.color} stopOpacity="0.6"/>
                </radialGradient>
              ))}

              {/* Create gradients for each slice */}
              {processedData.map((slice, index) => (
                <linearGradient
                  key={`gradient-${index}`}
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

              {/* Darken Texture: Hexagon Pattern */}
              <pattern id="darken-hex" x="0" y="0" width="12" height="10.39" patternUnits="userSpaceOnUse">
                <polygon points="6,0 12,5.2 6,10.4 0,5.2" fill="transparent" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="1" />
              </pattern>

              {/* GENERATING ESSENCE ANIMATIONS - SEAMLESS WAVE SYSTEM */}

              {/* Glow filter for soft energy */}
              <filter id="energy-glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Energy gradient - soft glowing streak */}
              <linearGradient id="energy-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="30%" stopColor="rgba(255, 255, 255, 0.6)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
                <stop offset="70%" stopColor="rgba(255, 255, 255, 0.6)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>

              {/* GENERATION ANIMATION PATTERN - Top-left diagonal streaks */}
              <pattern id="gen-anim-top-left-high" x="0" y="0" width="20" height="800" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect width="20" height="800" fill="transparent" />
                <rect width="7" height="800" fill="url(#energy-gradient)" filter="url(#energy-glow)" className="energy-streak-1" />
                <rect width="7" height="800" fill="url(#energy-gradient)" filter="url(#energy-glow)" className="energy-streak-2" />
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
                const hasSelection = selectedSlice !== null;
                const shouldDarken = hasSelection && !isSelected;
                const opacity = (hoveredSlice || selectedSlice) && !isHovered && !isSelected ? 0.6 : 1;

                // Determine hover effect based on selection
                let hoverFilter = 'none';
                let fillUrl = `url(#slice-gradient-${slice.id})`;
                let additionalStyle = {};

                if (isHovered || isSelected) {
                  switch(hoverEffect) {
                    case 1: // Inner Glow
                      hoverFilter = 'url(#inner-glow)';
                      break;
                    case 2: // Brightness Boost
                      hoverFilter = 'url(#brightness-boost)';
                      break;
                    case 3: // Radial Gradient
                      fillUrl = `url(#radial-gradient-${slice.id})`;
                      break;
                    case 4: // Pulse Effect
                      additionalStyle = {
                        animation: 'pulse-slice 1s ease-in-out infinite',
                        transformOrigin: `${center}px ${center}px`
                      };
                      break;
                  }
                }

                return (
                  <g key={index}>
                    {/* Hover highlight layer (for effect 1 & 2) */}
                    {(isHovered || isSelected) && (hoverEffect === 1 || hoverEffect === 2) && !shouldDarken && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill={slice.color}
                        opacity={0.3}
                        filter={hoverFilter}
                        pointerEvents="none"
                        style={{ transition: 'opacity 0.3s ease, filter 0.2s ease' }}
                      />
                    )}
                    
                    {/* Main slice */}
                    <path
                      d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                      fill={shouldDarken ? '#1a1a1a' : fillUrl}
                      stroke={
                        isHovered || isSelected
                          ? theme.colors.primary.yellow
                          : shouldDarken
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(0, 0, 0, 0.5)'
                      }
                      strokeWidth={isHovered || isSelected ? 2 : shouldDarken ? 1.5 : 1}
                      opacity={opacity}
                      style={{
                        transition: 'opacity 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease, fill 0.2s ease',
                        cursor: 'pointer',
                        ...additionalStyle
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

                    {/* Texture overlay - only show when not darkened */}
                    {!shouldDarken && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill="url(#metal-texture)"
                        opacity={0.3}
                        pointerEvents="none"
                        style={{ transition: 'opacity 0.2s ease' }}
                      />
                    )}

                    {/* Striped overlay for full essences - only show when not darkened */}
                    {slice.isFull && !shouldDarken && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill="url(#full-stripes)"
                        opacity={1}
                        pointerEvents="none"
                        className="animate-pulse"
                        style={{ transition: 'opacity 0.2s ease' }}
                      />
                    )}

                    {/* GENERATING ESSENCE ANIMATION OVERLAY - diagonal energy streaks */}
                    {slice.baseRate && slice.baseRate > 0 && !shouldDarken && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill="url(#gen-anim-top-left-high)"
                        opacity={0.19}
                        pointerEvents="none"
                        style={{
                          mixBlendMode: 'overlay',
                          transition: 'opacity 0.2s ease'
                        }}
                      />
                    )}

                    {/* Darken texture overlay - hexagon pattern */}
                    {shouldDarken && (
                      <path
                        d={createSlicePath(slice.startAngle, slice.endAngle, animationProgress)}
                        fill="url(#darken-hex)"
                        opacity={0.8}
                        pointerEvents="none"
                        style={{ transition: 'opacity 0.2s ease' }}
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
                {/* Center background - now transparent */}
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 10}
                  fill="transparent"
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
                  style={{
                    fontSize: liveAccumulation ? '1.5rem' : '2rem',
                    fill: liveAccumulation ? theme.colors.accent.cyan : theme.colors.primary.yellow,
                    textShadow: liveAccumulation ? '0 0 10px rgba(34, 211, 238, 0.5)' : undefined
                  }}
                >
                  {liveAccumulation
                    ? liveDisplayValue.toFixed(5)
                    : centerDisplay.value.toLocaleString()}
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
      
      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse-slice {
          0%, 100% {
            filter: brightness(1) drop-shadow(0 0 5px currentColor);
          }
          50% {
            filter: brightness(1.3) drop-shadow(0 0 15px currentColor);
          }
        }
      `}</style>
    </div>
  );
}