'use client';

import React from 'react';

interface SpaceColonyCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Style R - Colony Viewport Glass
 * Features animated colony lights on all edges (like tiny windows)
 * with pulsing effects and subtle glass cracks
 */
export function SpaceColonyCard({ children, className = '', onClick }: SpaceColonyCardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 25px rgba(0, 0, 0, 0.3) inset',
      }}
    >
      {/* Colony lights on edges - like tiny windows */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge colony lights */}
        <div className="absolute top-0 left-0 w-full h-2 flex items-center justify-between px-2">
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0s'}}></div>
          <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40"></div>
          <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
          <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="w-1 h-1 bg-orange-400 rounded-full opacity-50"></div>
          <div className="w-0.5 h-0.5 bg-blue-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-40"></div>
          <div className="w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Bottom edge colony lights */}
        <div className="absolute bottom-0 left-0 w-full h-2 flex items-center justify-between px-3">
          <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1.2s'}}></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-40"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="w-1 h-1 bg-orange-300 rounded-full opacity-60"></div>
          <div className="w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2.1s'}}></div>
          <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-30"></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        </div>

        {/* Left edge colony lights */}
        <div className="absolute left-0 top-0 w-2 h-full flex flex-col items-center justify-between py-3">
          <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.4s'}}></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
          <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.8s'}}></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="w-0.5 h-0.5 bg-orange-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '0.9s'}}></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
        </div>

        {/* Right edge colony lights */}
        <div className="absolute right-0 top-0 w-2 h-full flex flex-col items-center justify-between py-3">
          <div className="w-0.5 h-0.5 bg-blue-300 rounded-full opacity-40"></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1.3s'}}></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '2.2s'}}></div>
          <div className="w-0.5 h-0.5 bg-orange-300 rounded-full opacity-40"></div>
          <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.6s'}}></div>
          <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-30"></div>
          <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.7s'}}></div>
        </div>
      </div>

      {/* Glass cracks */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,20 L15,18 L18,22 L23,19" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
        <path d="M85,90 L88,87 L91,91 L94,88" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" fill="none"/>
      </svg>

      {/* Subtle glow from colony */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `
            radial-gradient(circle at 5% 5%, rgba(250, 182, 23, 0.03) 0%, transparent 15%),
            radial-gradient(circle at 95% 5%, rgba(250, 182, 23, 0.025) 0%, transparent 15%),
            radial-gradient(circle at 5% 95%, rgba(250, 182, 23, 0.02) 0%, transparent 15%),
            radial-gradient(circle at 95% 95%, rgba(250, 182, 23, 0.025) 0%, transparent 15%)`,
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default SpaceColonyCard;
