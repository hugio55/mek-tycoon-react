'use client';

import { useState } from 'react';
import './IndustrialFlipCard.css';

interface IndustrialFlipCardProps {
  title?: string;
  badge?: string;
  footer?: string;
  icon?: string;
  backText?: string;
}

export default function IndustrialFlipCard({
  title = 'INDUSTRIAL',
  badge = 'PREMIUM',
  footer = 'SYSTEM ACTIVE',
  icon = '⚡',
  backText = 'HOVER ME'
}: IndustrialFlipCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="industrial-flip-card-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`industrial-flip-card-inner ${isHovered ? 'flipped' : ''}`}>
        {/* Front Side */}
        <div className="industrial-flip-card-front">
          {/* Background blur circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-400/15 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-400/10 rounded-full blur-xl" />
          </div>

          {/* Glass card content */}
          <div className="relative h-full flex flex-col justify-between p-4 backdrop-blur-md bg-black/40 border-2 border-yellow-500/50 rounded-lg overflow-hidden">
            {/* Top badge */}
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-black bg-yellow-400 px-2 py-1 rounded uppercase tracking-wider">
                {badge}
              </span>
            </div>

            {/* Center title */}
            <div className="flex-1 flex items-center justify-center">
              <h3 className="font-orbitron text-2xl font-bold text-yellow-400 uppercase tracking-widest text-center">
                {title}
              </h3>
            </div>

            {/* Bottom footer */}
            <div className="text-center">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                {footer}
              </p>
            </div>

            {/* Hazard stripes overlay - subtle */}
            <div className="absolute inset-0 opacity-5 pointer-events-none hazard-stripes-overlay" />
          </div>
        </div>

        {/* Back Side */}
        <div className="industrial-flip-card-back">
          <div className="relative h-full backdrop-blur-md bg-black/60 rounded-lg overflow-hidden flex flex-col items-center justify-center">
            {/* Rotating border glow */}
            <div className="rotating-border-glow" />

            {/* Icon */}
            <div className="relative z-10 text-6xl mb-4 animate-pulse">
              {icon}
            </div>

            {/* Back text */}
            <div className="relative z-10">
              <p className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-widest">
                {backText}
              </p>
            </div>

            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
