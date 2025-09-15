"use client";

import React, { useState } from 'react';

interface PlasmaCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'energy' | 'dark';
  pulseEffect?: boolean;
  electricField?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function PlasmaCard({
  children,
  variant = 'default',
  pulseEffect = true,
  electricField = false,
  className = "",
  onClick
}: PlasmaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    default: {
      gradient: 'from-black via-gray-900 to-black',
      border: 'border-yellow-600/50',
      borderHover: 'border-yellow-400',
      shadow: 'shadow-[0_0_15px_rgba(250,182,23,0.3)]',
      shadowHover: 'shadow-[0_0_30px_rgba(250,182,23,0.6)]',
      glowColor: 'rgba(250,182,23,'
    },
    energy: {
      gradient: 'from-amber-950/20 via-black to-orange-950/20',
      border: 'border-orange-500/50',
      borderHover: 'border-orange-400',
      shadow: 'shadow-[0_0_15px_rgba(251,146,60,0.3)]',
      shadowHover: 'shadow-[0_0_30px_rgba(251,146,60,0.6)]',
      glowColor: 'rgba(251,146,60,'
    },
    dark: {
      gradient: 'from-gray-950 via-black to-gray-950',
      border: 'border-purple-600/50',
      borderHover: 'border-purple-400',
      shadow: 'shadow-[0_0_15px_rgba(147,51,234,0.3)]',
      shadowHover: 'shadow-[0_0_30px_rgba(147,51,234,0.6)]',
      glowColor: 'rgba(147,51,234,'
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
        backdrop-blur-sm
        border-2 transition-all duration-300
        ${isHovered ? `${style.borderHover} ${style.shadowHover}` : `${style.border} ${style.shadow}`}
        rounded-lg
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Electric field lines */}
      {electricField && (
        <div
          className="absolute inset-0 opacity-30 rounded-lg"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              ${style.glowColor}0.1) 10px,
              ${style.glowColor}0.1) 11px
            )`,
            animation: 'electric-flow 2s linear infinite'
          }}
        />
      )}

      {/* Plasma glow */}
      {pulseEffect && (
        <div
          className="absolute inset-0 rounded-lg transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center,
              ${style.glowColor}${isHovered ? '0.3' : '0.15'}) 0%,
              transparent 70%)`,
            animation: isHovered ? 'plasma-pulse 1s ease-in-out infinite' : 'plasma-pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Lightning bolts on hover */}
      {isHovered && electricField && (
        <>
          <div
            className="absolute top-0 left-1/4 w-px h-full opacity-50"
            style={{
              background: `linear-gradient(to bottom, transparent, ${style.glowColor}1), transparent)`,
              animation: 'lightning-strike 0.5s ease-out infinite'
            }}
          />
          <div
            className="absolute top-0 right-1/3 w-px h-full opacity-50"
            style={{
              background: `linear-gradient(to bottom, transparent, ${style.glowColor}1), transparent)`,
              animation: 'lightning-strike 0.5s ease-out infinite',
              animationDelay: '0.2s'
            }}
          />
        </>
      )}

      {/* Corner energy indicators */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: variant === 'default' ? '#fab617' : variant === 'energy' ? '#fb923c' : '#9333ea',
          boxShadow: `0 0 10px ${style.glowColor}0.8)`
        }}
      />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: variant === 'default' ? '#fab617' : variant === 'energy' ? '#fb923c' : '#9333ea',
          boxShadow: `0 0 10px ${style.glowColor}0.8)`,
          animationDelay: '0.5s'
        }}
      />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: variant === 'default' ? '#fab617' : variant === 'energy' ? '#fb923c' : '#9333ea',
          boxShadow: `0 0 10px ${style.glowColor}0.8)`,
          animationDelay: '1s'
        }}
      />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: variant === 'default' ? '#fab617' : variant === 'energy' ? '#fb923c' : '#9333ea',
          boxShadow: `0 0 10px ${style.glowColor}0.8)`,
          animationDelay: '1.5s'
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}