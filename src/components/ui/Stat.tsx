'use client';

import React from 'react';
import { GlowText } from './GlowText';

interface StatProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  icon?: React.ReactNode;
  color?: 'yellow' | 'green' | 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  trend,
  trendValue,
  icon,
  color = 'yellow',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`text-gray-400 uppercase tracking-wider ${sizeClasses[size]} mb-1`}>
        {label}
      </div>
      
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-yellow-400/70">
            {icon}
          </div>
        )}
        
        <div className={`font-bold ${valueSizeClasses[size]}`}>
          <GlowText color={color} intensity="medium">
            {value}
          </GlowText>
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 ${trendColors[trend]} ${sizeClasses[size]}`}>
            <span>{trendIcons[trend]}</span>
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps extends StatProps {
  description?: string;
  action?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  description,
  action,
  className = '',
  ...statProps
}) => {
  return (
    <div className={`
      bg-gray-900/30 backdrop-blur-md border border-gray-800/50 
      rounded-xl p-4 hover:border-yellow-400/30 transition-all
      ${className}
    `}>
      <Stat {...statProps} />
      
      {description && (
        <p className="text-sm text-gray-500 mt-2">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-3">
          {action}
        </div>
      )}
    </div>
  );
};

interface StatGroupProps {
  stats: StatProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const StatGroup: React.FC<StatGroupProps> = ({
  stats,
  columns = 3,
  className = ''
}) => {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};