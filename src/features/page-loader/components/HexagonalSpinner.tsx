'use client';

import React from 'react';

export function HexagonalSpinner() {
  return (
    <div className="relative w-32 h-32">
      {/* Outer rotating hexagon */}
      <div
        className="absolute inset-0"
        style={{
          animation: 'spinHex 3s linear infinite',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
            fill="none"
            stroke="rgba(250, 182, 23, 0.6)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Inner rotating hexagon (opposite direction) */}
      <div
        className="absolute inset-4"
        style={{
          animation: 'spinHexReverse 2s linear infinite',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,10 88,30 88,70 50,90 12,70 12,30"
            fill="none"
            stroke="rgba(250, 182, 23, 0.8)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Center glow */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          className="w-8 h-8 rounded-full bg-yellow-500"
          style={{
            boxShadow: '0 0 30px rgba(250, 182, 23, 0.8), 0 0 60px rgba(250, 182, 23, 0.4)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Corner accents */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${angle}deg) translateY(-64px)`,
            boxShadow: '0 0 4px rgba(250, 182, 23, 0.8)',
            animation: `cornerPulse 1.5s ease-in-out infinite ${i * 0.25}s`,
          }}
        />
      ))}

      <style jsx global>{`
        @keyframes spinHex {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinHexReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }

        @keyframes cornerPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
