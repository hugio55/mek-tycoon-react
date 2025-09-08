'use client';
import React from 'react';

interface AnimatedSuccessBarProps {
  successRate: number;
  showLabel?: boolean;
  height?: 'small' | 'medium' | 'large';
  className?: string;
}

const AnimatedSuccessBar: React.FC<AnimatedSuccessBarProps> = ({ 
  successRate, 
  showLabel = true,
  height = 'medium',
  className = ''
}) => {
  const heightClasses = {
    small: 'h-6',
    medium: 'h-9',
    large: 'h-12'
  };
  
  // Always round to whole number
  const roundedRate = Math.round(successRate);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Success Chance</span>
          <span className="text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" style={{ fontFamily: "'Orbitron', monospace" }}>
            {roundedRate}%
          </span>
        </div>
      )}
      
      {/* Industrial progress bar container */}
      <div className={`${heightClasses[height]} bg-black/60 border border-yellow-500/30 relative overflow-hidden rounded-sm`}>
        {/* Tech grid background */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(250, 182, 23, 0.1) 10px,
              rgba(250, 182, 23, 0.1) 11px
            )`
          }}
        />
        
        {/* Main progress fill with gradient */}
        <div 
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{ 
            width: `${Math.min(100, roundedRate)}%`,
            background: `linear-gradient(90deg, 
              rgba(250, 182, 23, 0.8) 0%, 
              rgba(245, 158, 11, 0.9) 50%, 
              rgba(250, 182, 23, 0.8) 100%)`,
            boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.4), 0 0 30px rgba(250, 182, 23, 0.3)'
          }}
        >
          {/* Shine effect confined to filled portion only */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-shimmer" />
          </div>
          
          {/* Energy particles - Smaller with fade effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute w-1 h-1 bg-white/90 rounded-full blur-[0.5px]"
              style={{
                top: '20%',
                left: '0',
                animation: 'particleFlow 2s 0s infinite linear',
                boxShadow: '0 0 3px rgba(255,255,255,0.8)'
              }}
            />
            <div
              className="absolute w-0.5 h-0.5 bg-white/80 rounded-full"
              style={{
                top: '35%',
                left: '0',
                animation: 'particleFlow 2.5s 0.3s infinite linear',
                boxShadow: '0 0 2px rgba(255,255,255,0.6)'
              }}
            />
            <div
              className="absolute w-1 h-1 bg-white/85 rounded-full blur-[0.5px]"
              style={{
                top: '50%',
                left: '0',
                animation: 'particleFlow 3s 0.6s infinite linear',
                boxShadow: '0 0 3px rgba(255,255,255,0.7)'
              }}
            />
            <div
              className="absolute w-0.5 h-0.5 bg-white/75 rounded-full"
              style={{
                top: '65%',
                left: '0',
                animation: 'particleFlow 3.5s 0.9s infinite linear',
                boxShadow: '0 0 2px rgba(255,255,255,0.5)'
              }}
            />
            <div
              className="absolute w-1 h-1 bg-white/80 rounded-full blur-[0.5px]"
              style={{
                top: '80%',
                left: '0',
                animation: 'particleFlow 4s 1.2s infinite linear',
                boxShadow: '0 0 3px rgba(255,255,255,0.6)'
              }}
            />
            <div
              className="absolute w-0.5 h-0.5 bg-white/70 rounded-full"
              style={{
                top: '25%',
                left: '0',
                animation: 'particleFlow 2.8s 0.5s infinite linear',
                boxShadow: '0 0 2px rgba(255,255,255,0.4)'
              }}
            />
            <div
              className="absolute w-1 h-1 bg-white/75 rounded-full blur-[0.5px]"
              style={{
                top: '60%',
                left: '0',
                animation: 'particleFlow 3.2s 1s infinite linear',
                boxShadow: '0 0 3px rgba(255,255,255,0.5)'
              }}
            />
            <div
              className="absolute w-0.5 h-0.5 bg-white/65 rounded-full"
              style={{
                top: '45%',
                left: '0',
                animation: 'particleFlow 2.3s 0.8s infinite linear',
                boxShadow: '0 0 2px rgba(255,255,255,0.3)'
              }}
            />
          </div>
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 10px,
              rgba(250, 182, 23, 0.05) 10px,
              rgba(250, 182, 23, 0.05) 11px
            )`
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedSuccessBar;