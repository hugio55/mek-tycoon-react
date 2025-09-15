"use client";

import React from 'react';

interface IndustrialCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'danger' | 'success';
  glowEffect?: boolean;
  hazardStripes?: boolean;
  scratches?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function IndustrialCard({
  children,
  variant = 'default',
  glowEffect = false,
  hazardStripes = false,
  scratches = false,
  className = "",
  onClick
}: IndustrialCardProps) {
  const variantStyles = {
    default: {
      border: 'border-yellow-500/50',
      shadow: 'shadow-[0_0_20px_rgba(250,182,23,0.2)]',
      glow: 'shadow-[0_0_40px_rgba(250,182,23,0.4)]'
    },
    gold: {
      border: 'border-yellow-400',
      shadow: 'shadow-[0_0_30px_rgba(250,182,23,0.3)]',
      glow: 'shadow-[0_0_50px_rgba(250,182,23,0.5)]'
    },
    danger: {
      border: 'border-red-500/50',
      shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.4)]'
    },
    success: {
      border: 'border-green-500/50',
      shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
      glow: 'shadow-[0_0_40px_rgba(34,197,94,0.4)]'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`
        mek-card-industrial
        relative
        bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-black/95
        backdrop-blur-md
        border-2 ${style.border}
        ${glowEffect ? style.glow : style.shadow}
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${className}
      `}
    >
      {/* Hazard stripes overlay */}
      {hazardStripes && (
        <div className="mek-overlay-hazard-stripes absolute inset-0 pointer-events-none opacity-10" />
      )}

      {/* Scratches overlay */}
      {scratches && (
        <div className="mek-overlay-scratches absolute inset-0 pointer-events-none opacity-20" />
      )}

      {/* Sharp corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/70" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/70" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/70" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/70" />

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}