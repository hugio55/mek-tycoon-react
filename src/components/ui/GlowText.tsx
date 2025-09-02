'use client';

import React from 'react';

interface GlowTextProps {
  children: React.ReactNode;
  color?: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'white';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

export const GlowText: React.FC<GlowTextProps> = ({
  children,
  color = 'yellow',
  size = 'md',
  intensity = 'medium',
  animate = false,
  className = '',
  as: Component = 'span'
}) => {
  const colorClasses = {
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    white: 'text-white'
  };

  const glowColors = {
    yellow: 'rgba(250, 182, 23',
    green: 'rgba(74, 222, 128',
    blue: 'rgba(96, 165, 250',
    red: 'rgba(248, 113, 113',
    purple: 'rgba(192, 132, 252',
    white: 'rgba(255, 255, 255'
  };

  const intensityValues = {
    low: '0.3)',
    medium: '0.5)',
    high: '0.8)'
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const glowStyle = {
    textShadow: `0 0 ${intensity === 'low' ? '10px' : intensity === 'medium' ? '20px' : '30px'} ${glowColors[color]}, ${intensityValues[intensity]}`,
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.1em'
  };

  return (
    <Component
      className={`
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${animate ? 'animate-pulse' : ''}
        uppercase
        ${className}
      `}
      style={glowStyle}
    >
      {children}
    </Component>
  );
};

interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: 'yellow' | 'green' | 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

export const GlowCounter: React.FC<CounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  color = 'yellow',
  size = 'md',
  animate = true,
  className = ''
}) => {
  const formatValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toFixed(decimals);
  };

  return (
    <GlowText
      color={color}
      size={size === 'sm' ? 'lg' : size === 'md' ? 'xl' : size === 'lg' ? '2xl' : '3xl'}
      intensity="high"
      animate={animate}
      className={className}
      style={{ fontFamily: "'Consolas', 'Monaco', monospace" }}
    >
      {prefix}{formatValue(value)}{suffix}
    </GlowText>
  );
};