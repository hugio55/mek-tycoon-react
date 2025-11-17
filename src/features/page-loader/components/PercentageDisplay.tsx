'use client';

import React from 'react';

interface PercentageDisplayProps {
  percentage: number;
  fontSize?: number;
  fontFamily?: string;
  spacing?: number;
  horizontalOffset?: number;
}

export function PercentageDisplay({
  percentage,
  fontSize = 15,
  fontFamily = 'Saira',
  spacing = 13,
  horizontalOffset = 0
}: PercentageDisplayProps) {
  const isComplete = percentage >= 100;
  const roundedPercentage = Math.round(percentage);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        marginTop: `${spacing}px`,
        marginLeft: `${horizontalOffset}px`
      }}
    >
      <span
        className={`font-bold transition-all duration-500 ${
          isComplete ? 'percentage-complete' : 'text-white'
        }`}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          textShadow: isComplete
            ? '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)'
            : '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {roundedPercentage}%
      </span>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bluePulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
          }

          .percentage-complete {
            color: rgb(59, 130, 246);
            animation: bluePulse 1.5s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
}
