'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'yellow' | 'green' | 'blue' | 'red' | 'purple';
  showValue?: boolean;
  label?: string;
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'yellow',
  showValue = false,
  label,
  height = 'md',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    yellow: 'from-yellow-400 to-yellow-500 shadow-[0_0_10px_rgba(250,182,23,0.5)]',
    green: 'from-green-400 to-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]',
    blue: 'from-blue-400 to-blue-500 shadow-[0_0_10px_rgba(96,165,250,0.5)]',
    red: 'from-red-400 to-red-500 shadow-[0_0_10px_rgba(248,113,113,0.5)]',
    purple: 'from-purple-400 to-purple-500 shadow-[0_0_10px_rgba(192,132,252,0.5)]'
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-sm text-yellow-400 font-mono">
              {value.toFixed(1)}/{max}
            </span>
          )}
        </div>
      )}
      
      <div className={`
        ${heightClasses[height]}
        bg-gray-800/50 rounded-full overflow-hidden 
        border border-gray-700/50
      `}>
        <div 
          className={`
            h-full bg-gradient-to-r ${colorClasses[color]}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface LEDIndicatorProps {
  value: number;
  max?: number;
  ledCount?: number;
  color?: 'yellow' | 'green' | 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LEDIndicator: React.FC<LEDIndicatorProps> = ({
  value,
  max = 100,
  ledCount = 10,
  color = 'yellow',
  size = 'md',
  className = ''
}) => {
  const activeLeds = Math.ceil((value / max) * ledCount);
  
  const colorClasses = {
    yellow: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,182,23,0.8)]',
    green: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]',
    blue: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]',
    red: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: ledCount }, (_, i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]}
            rounded-full transition-all duration-300
            ${i < activeLeds 
              ? colorClasses[color]
              : 'bg-gray-700/50 border border-gray-600/50'
            }
          `}
        />
      ))}
    </div>
  );
};