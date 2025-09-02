'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  gradient = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const baseClasses = `
    bg-gray-900/30 backdrop-blur-md border border-gray-800/50 rounded-xl
    ${paddingClasses[padding]}
    ${hover ? 'transition-all hover:bg-gray-900/40 hover:border-yellow-400/30' : ''}
    ${glow ? 'shadow-[0_0_20px_rgba(250,182,23,0.1)]' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${gradient ? 'bg-gradient-to-br from-gray-900/40 to-black/40' : ''}
  `;

  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface GlassCardProps extends CardProps {
  borderGlow?: 'yellow' | 'green' | 'blue' | 'red';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  borderGlow,
  children,
  ...props
}) => {
  const glowColors = {
    yellow: 'border-yellow-400/50 shadow-[0_0_15px_rgba(250,182,23,0.2)]',
    green: 'border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]',
    blue: 'border-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.2)]',
    red: 'border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]'
  };

  const glowClass = borderGlow ? glowColors[borderGlow] : '';

  return (
    <Card {...props} className={`${props.className} ${glowClass}`}>
      {children}
    </Card>
  );
};