'use client';

import React from 'react';

interface ProgressBarProps {
  percentage: number;
  showPercentage?: boolean;
}

export function ProgressBar({ percentage, showPercentage = true }: ProgressBarProps) {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      <div className="relative h-8 bg-black/50 border border-yellow-500/30 rounded overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(250,182,23,0.1) 24px, rgba(250,182,23,0.1) 25px)',
          }}
        />

        {/* Filled Bar with Smooth Transition */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400"
          style={{
            width: `${percentage}%`,
            transition: isInitialized ? 'width 0.8s ease-out' : 'none',
            boxShadow: '0 0 20px rgba(250, 182, 23, 0.5)',
          }}
        >
          {/* Shimmer Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Percentage Text Overlay */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white drop-shadow-lg">
              {percentage}%
            </span>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
