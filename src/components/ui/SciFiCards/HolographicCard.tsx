"use client";

import React, { useState } from 'react';

interface HolographicCardProps {
  children: React.ReactNode;
  variant?: 'blue' | 'yellow' | 'purple';
  animated?: boolean;
  scanlines?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function HolographicCard({
  children,
  variant = 'blue',
  animated = true,
  scanlines = false,
  className = "",
  onClick
}: HolographicCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    blue: {
      border: 'border-cyan-500/30',
      borderHover: 'border-cyan-400',
      shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      shadowHover: 'shadow-[0_0_50px_rgba(6,182,212,0.5)]',
      gradient: 'from-gray-900/80 via-cyan-950/20 to-black/80',
      gridColor: 'rgba(6,182,212,0.05)',
      scanColor: 'rgba(6,182,212,0.1)'
    },
    yellow: {
      border: 'border-yellow-500/30',
      borderHover: 'border-yellow-400',
      shadow: 'shadow-[0_0_30px_rgba(250,182,23,0.3)]',
      shadowHover: 'shadow-[0_0_50px_rgba(250,182,23,0.5)]',
      gradient: 'from-gray-900/80 via-amber-950/20 to-black/80',
      gridColor: 'rgba(250,182,23,0.05)',
      scanColor: 'rgba(250,182,23,0.1)'
    },
    purple: {
      border: 'border-purple-500/30',
      borderHover: 'border-purple-400',
      shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
      shadowHover: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]',
      gradient: 'from-gray-900/80 via-purple-950/20 to-black/80',
      gridColor: 'rgba(168,85,247,0.05)',
      scanColor: 'rgba(168,85,247,0.1)'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative
        bg-gradient-to-br ${style.gradient}
        backdrop-blur-lg
        border-2 transition-all duration-300
        ${isHovered ? `${style.borderHover} ${style.shadowHover}` : `${style.border} ${style.shadow}`}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Holographic grid background */}
      {animated && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, ${style.gridColor} 25%, ${style.gridColor} 26%, transparent 27%, transparent 74%, ${style.gridColor} 75%, ${style.gridColor} 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, ${style.gridColor} 25%, ${style.gridColor} 26%, transparent 27%, transparent 74%, ${style.gridColor} 75%, ${style.gridColor} 76%, transparent 77%, transparent)`,
            backgroundSize: '20px 20px',
            animation: animated ? 'holo-grid 10s linear infinite' : 'none'
          }}
        />
      )}

      {/* Scan line effect */}
      {scanlines && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(transparent 0%, ${style.scanColor} 50%, transparent 100%)`,
            height: '20%',
            animation: 'scan-line 3s linear infinite'
          }}
        />
      )}

      {/* Holographic shimmer */}
      {animated && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 0.3 : 0.1,
            background: `linear-gradient(105deg,
              transparent 30%,
              ${style.gridColor} 40%,
              ${style.gridColor} 50%,
              ${style.gridColor} 60%,
              transparent 70%)`,
            animation: 'holo-shimmer 3s ease-in-out infinite'
          }}
        />
      )}

      {/* Data stream effect */}
      {animated && isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 w-px h-full opacity-30"
              style={{
                left: `${33 * (i + 1)}%`,
                background: `linear-gradient(to bottom, transparent, ${style.gridColor}, transparent)`,
                animation: `data-stream ${2 + i * 0.5}s linear infinite ${i * 0.3}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}